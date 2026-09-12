import { declineLabel } from "@/core/declines";
import { dayPart, describeGap, gapBucket } from "@/core/time";
import type { ActivityItem } from "@/core/domain/activity";
import type { CapacityReport } from "@/core/domain/capacity";
import { isStale } from "@/core/domain/intentions";
import { isReentry, type Sitting } from "@/core/domain/users";
import type { DayPlanJson, Intention, Lead, MemoryNote } from "@/db/schema";

export type ContextInput = {
  displayName: string;
  timezone: string;
  /** Previous request; undefined on the first ever turn. */
  lastSeenAt?: Date;
  /** The visit this turn belongs to, and the gap it began after. */
  sitting?: Pick<Sitting, "gapSeconds">;
  now?: Date;
  lists?: readonly string[];
  openIntentions?: Intention[];
  recentlyDone?: Intention[];
  /** What changed lately, wherever it happened (ticks on Today/Lists, tool calls) — newest first. */
  recentActivity?: ActivityItem[];
  beliefs?: MemoryNote[];
  capacity?: CapacityReport;
  plan?: DayPlanJson;
  /** This very message was a "Not this" from Today. */
  declinedNow?: { title: string; reason?: string | null };
  /** Everything declined today, so nothing gets re-proposed. */
  declinedToday?: { intentionId: string; reason: string | null }[];
  /** When the mail was last looked through; null = never (chat passes one or the other; pages omit). */
  mailScan?: { at: Date } | null;
  /** What Lumi noticed in the mail that might need doing — unconfirmed. */
  leads?: Lead[];
};

const MAX_INTENTIONS = 25;
const MAX_ACTIVITY = 12;
const MAX_LEADS = 8;

/**
 * The volatile context block: everything about *this* user and *this* moment.
 * Regenerated every turn and placed after the cached persona. Keep it short;
 * grow it by adding lines, never by pasting prose.
 */
export function buildContextBlock(input: ContextInput): string {
  const now = input.now ?? new Date();
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: input.timezone,
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const open = input.openIntentions ?? [];

  const lines = [
    "## Right now",
    `- Talking with: ${input.displayName}. Use the name sparingly.`,
    `- Their local time: ${local} (${dayPart(now, input.timezone)}), timezone ${input.timezone}. Mention it only if it changes the advice.`,
  ];

  if (!input.lastSeenAt) {
    lines.push("- First time here. No history yet.");
  } else {
    const bucket = gapBucket(input.lastSeenAt, now);
    if (bucket === "just_now" || bucket === "minutes") {
      lines.push("- Same sitting as their last message.");
    } else {
      lines.push(`- Last here: ${describeGap(input.lastSeenAt, now)}.`);
      if (bucket === "week_plus" || bucket === "long") {
        lines.push("- That's a long gap. If it comes up, treat coming back as easy; don't mention the length unless they do.");
      }
    }
  }

  if (isReentry(input.sitting ? { openedAt: now, gapSeconds: input.sitting.gapSeconds } : undefined)) {
    lines.push(
      "- This sitting began after a week or more away. The page greeted them with an offer to work out what's still relevant; if they take it up, or ask, run the coming-back pass (persona → Coming back). Don't mention how long it's been unless they do.",
    );
    if (open.some((i) => isStale(i, now))) lines.push("- Some open intentions are stale (flagged below) — those are the ones to ask about.");
  }

  if (input.capacity) {
    const flags = input.capacity.flags?.length ? ` (${input.capacity.flags.join(", ")})` : "";
    lines.push(`- Capacity today: ${input.capacity.level}${flags}${input.capacity.note ? ` — "${input.capacity.note}"` : ""}.`);
  }

  if (input.lists?.length) lines.push(`- Their lists: ${input.lists.join(" · ")}.`);

  if (input.plan) {
    const rn = input.plan.rightNow ? open.find((i) => i.id === input.plan!.rightNow!.intentionId) : undefined;
    lines.push(`- Today's path: ${rn ? `right now → "${rn.title}"` : "nothing queued"}; ${input.plan.afterThat.length} after that. Day line: "${input.plan.dayLine}"`);
  }

  if (input.declinedNow) {
    const why = declineLabel(input.declinedNow.reason) ?? input.declinedNow.reason;
    lines.push(
      "",
      "## Just now",
      why
        ? `- They tapped Not this on "${input.declinedNow.title}" from today's path and said: ${why.toLowerCase()}. Answer the reason, not the refusal (persona → Not this). Today is re-cutting its path around it — don't propose the same thing again now, and don't narrate the re-cut.`
        : `- They tapped Not this on "${input.declinedNow.title}" from today's path and gave no reason. One line: ask what's getting in the way, or just offer a different thing. Today is re-cutting its path around it — don't propose the same thing again now.`,
    );
  }

  const declined = new Map((input.declinedToday ?? []).map((d) => [d.intentionId, declineLabel(d.reason) ?? d.reason] as const));
  if (open.length) {
    lines.push("", "## Open intentions (id · title · list · ~min · due · flags)");
    for (const i of open.slice(0, MAX_INTENTIONS)) {
      const bits = [i.id, `"${i.title}"`, i.list ?? "—", i.estimateMinutes ? `~${i.estimateMinutes}m` : "—", i.dueAt ? `due ${fmtDue(i.dueAt, input.timezone)}` : "—"];
      const flags: string[] = [];
      if (isStale(i, now)) flags.push("stale");
      if (declined.has(i.id)) {
        const why = declined.get(i.id);
        flags.push(`declined today${why ? ` (${why.toLowerCase()})` : ""}`);
      }
      if (i.nextAction) flags.push(`next: ${i.nextAction}`);
      lines.push(`- ${bits.join(" · ")}${flags.length ? ` · ${flags.join("; ")}` : ""}`);
    }
    if (open.length > MAX_INTENTIONS) lines.push(`- (…and more; ask if you need the rest)`);
  } else {
    lines.push("", "## Open intentions", "- None saved yet.");
  }

  if (input.recentActivity?.length) {
    lines.push(
      "",
      "## Recent changes (newest first — when · what · id · where it stands now)",
      "What changed lately, wherever it happened. Ticks and unticks on Today and Lists are theirs and never appear in the transcript; \"the one I just checked off\" or \"what I just deleted\" is here — act on it, don't ask what it was. A tick that was a mistake: reopen_intention.",
    );
    for (const a of input.recentActivity.slice(0, MAX_ACTIVITY)) {
      lines.push(`- ${describeGap(a.at, now)} · ${describeActivity(a)} · ${a.intentionId} · now ${a.status}`);
    }
  }

  if (input.recentlyDone?.length) {
    lines.push(
      "",
      "## Recently done (id · title · when) — reopen_intention puts one back",
      ...input.recentlyDone.slice(0, 5).map((i) => `- ${i.id} · "${i.title}"${i.completedAt ? ` · ${describeGap(i.completedAt, now)}` : ""}`),
    );
  }

  if (input.mailScan !== undefined) {
    lines.push("", "## Their mail");
    if (!input.mailScan) {
      lines.push("- Never looked yet — they may not have connected Google (the Insights page has the chip). look_at_email will say so if it can't read.");
    } else {
      lines.push(`- Last looked ${describeGap(input.mailScan.at, now)}. look_at_email reads it fresh when they ask about their mail or something that would be in it.`);
    }
    if (input.leads?.length) {
      lines.push("Things you noticed there that might need doing — unconfirmed; Insights asks them which still do (id · what · why · from · when):");
      for (const l of input.leads.slice(0, MAX_LEADS)) {
        lines.push(`- ${l.id} · "${l.title}" · ${l.why ?? "—"} · ${l.fromName ?? "—"} · ${l.receivedAt ? describeGap(l.receivedAt, now) : "—"}`);
      }
      lines.push("If they ask whether anything in their mail needs handling, go from these. keep_lead when it still does; dismiss_lead when it doesn't. Never count them back.");
    }
  }

  const beliefs = input.beliefs ?? [];
  if (beliefs.length) {
    lines.push("", "## What you know about them (id · kind · belief · confidence)");
    for (const b of beliefs) {
      const tentative = b.confidence < 0.5 ? " · tentative — test gently, don't assert" : "";
      const evidence = b.kind === "strategy" || b.kind === "anti_pattern" ? ` · helped ${b.evidenceFor}/${b.evidenceFor + b.evidenceAgainst}` : "";
      lines.push(`- ${b.id} · ${b.kind} · ${b.content} · ${b.confidence.toFixed(2)}${evidence}${tentative}`);
    }
  }

  return lines.join("\n");
}

/** One change in Lumi's terms: "they" did it on a page, "you" did it through a tool. */
export function describeActivity(a: ActivityItem): string {
  const t = `"${a.title}"`;
  const onPage = a.via === "app";
  switch (a.type) {
    case "intention.completed":
      return onPage ? `they ticked ${t} done on Today or Lists` : `you marked ${t} done`;
    case "intention.reopened":
      return onPage ? `they unticked ${t} on Today or Lists — open again` : `you put ${t} back`;
    case "intention.dropped":
      return `you let ${t} go`;
    case "intention.created":
      return `you saved ${t}`;
    case "intention.updated":
      return `you changed ${t}${a.fields?.length ? ` (${a.fields.join(", ")})` : ""}`;
  }
}

function fmtDue(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

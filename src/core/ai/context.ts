import { dayPart, describeGap, gapBucket } from "@/core/time";
import type { CapacityReport } from "@/core/domain/capacity";
import { isStale } from "@/core/domain/intentions";
import type { DayPlanJson, Intention, MemoryNote } from "@/db/schema";

export type ContextInput = {
  displayName: string;
  timezone: string;
  /** Previous visit; undefined on the first ever turn. */
  lastSeenAt?: Date;
  now?: Date;
  lists?: readonly string[];
  openIntentions?: Intention[];
  recentlyDone?: Intention[];
  beliefs?: MemoryNote[];
  capacity?: CapacityReport;
  plan?: DayPlanJson;
};

const MAX_INTENTIONS = 25;

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

  if (input.capacity) {
    const flags = input.capacity.flags?.length ? ` (${input.capacity.flags.join(", ")})` : "";
    lines.push(`- Capacity today: ${input.capacity.level}${flags}${input.capacity.note ? ` — "${input.capacity.note}"` : ""}.`);
  }

  if (input.lists?.length) lines.push(`- Their lists: ${input.lists.join(" · ")}.`);

  if (input.plan) {
    const rn = input.plan.rightNow ? input.openIntentions?.find((i) => i.id === input.plan!.rightNow!.intentionId) : undefined;
    lines.push(`- Today's path: ${rn ? `right now → "${rn.title}"` : "nothing queued"}; ${input.plan.afterThat.length} after that. Day line: "${input.plan.dayLine}"`);
  }

  const open = input.openIntentions ?? [];
  if (open.length) {
    lines.push("", "## Open intentions (id · title · list · ~min · due · flags)");
    for (const i of open.slice(0, MAX_INTENTIONS)) {
      const bits = [i.id, `"${i.title}"`, i.list ?? "—", i.estimateMinutes ? `~${i.estimateMinutes}m` : "—", i.dueAt ? `due ${fmtDue(i.dueAt, input.timezone)}` : "—"];
      const flags: string[] = [];
      if (isStale(i, now)) flags.push("stale");
      if (i.nextAction) flags.push(`next: ${i.nextAction}`);
      lines.push(`- ${bits.join(" · ")}${flags.length ? ` · ${flags.join("; ")}` : ""}`);
    }
    if (open.length > MAX_INTENTIONS) lines.push(`- (…and more; ask if you need the rest)`);
  } else {
    lines.push("", "## Open intentions", "- None saved yet.");
  }

  if (input.recentlyDone?.length) {
    lines.push("", "## Recently done", ...input.recentlyDone.slice(0, 5).map((i) => `- "${i.title}"`));
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

function fmtDue(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

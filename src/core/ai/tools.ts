/**
 * The only write path from the model into application state. Each tool
 * executes server-side, writes through a domain function (which appends an
 * event), and returns compact JSON — Lumi narrates in her own words.
 * Tools never throw to the model; failures return { error } so the turn
 * survives. Descriptions are part of the cached prefix: keep them stable.
 */
import { tool } from "ai";
import { z } from "zod";
import { type Db } from "@/db/client";
import { reportCapacity } from "@/core/domain/capacity";
import { completeIntention, createIntention, dropIntention, reopenIntention, updateIntention } from "@/core/domain/intentions";
import { dismissLead, keepLead } from "@/core/domain/leads";
import { applyBeliefOps } from "@/core/domain/memory";
import { reflectClosedInPlan } from "@/core/domain/plan-sync";
import type { EmailReader } from "@/core/email/types";
import type { Recut } from "./today-plan";

export type ToolContext = {
  db: Db;
  userId: string;
  timezone: string;
  /** This sitting began after a week or more away: letting things go re-cuts the path. */
  reentry?: boolean;
  /** Called when a write (or an ask) means today's path should be re-cut; the route does it once in `after()`. */
  onPlanChange?: (recut: Recut) => void;
  /** Their mail, resolved only if Lumi actually looks (undefined = not connected). */
  mail?: () => Promise<EmailReader | undefined>;
};

const KINDS = ["fact", "project", "preference", "strategy", "pattern", "anti_pattern"] as const;
const EFFORT = ["tiny", "small", "medium", "large"] as const;

function safe<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  return fn().catch((e: unknown) => ({ error: e instanceof Error ? e.message : "failed" }));
}

const MAIL_LOOK_MAX = 15;
const MAIL_GIST_CHARS = 280;

export function buildTools({ db, userId, timezone, reentry = false, onPlanChange, mail }: ToolContext) {
  const me = { id: userId, timezone };
  return {
    create_intention: tool({
      description:
        "Save something the user intends to do. Use for each item in a brain dump, silently — don't ask permission per item. Infer list and a rough estimate when obvious; leave next_action empty unless a concrete first physical step is clear.",
      inputSchema: z.object({
        title: z.string().min(1).max(120).describe("In the user's own words, short"),
        next_action: z.string().max(200).optional().describe("Smallest concrete physical step, if clear"),
        note: z.string().max(400).optional().describe("Why it matters / what's blocking, if said"),
        list: z.string().max(40).optional().describe("One of the user's lists (see context). Infer; the user can correct"),
        estimate_minutes: z.number().int().min(1).max(600).optional(),
        effort_hint: z.enum(EFFORT).optional(),
        due_at: z.string().datetime({ offset: true }).optional().describe("Only if the user named a real deadline or time, ISO 8601 with offset"),
      }),
      execute: (input) =>
        safe(async () => {
          const row = await createIntention(db, userId, {
            title: input.title,
            nextAction: input.next_action,
            note: input.note,
            list: input.list,
            estimateMinutes: input.estimate_minutes,
            effortHint: input.effort_hint,
            dueAt: input.due_at ? new Date(input.due_at) : undefined,
          });
          return { id: row.id, title: row.title, list: row.list, estimate_minutes: row.estimateMinutes };
        }),
    }),

    update_intention: tool({
      description: "Change an existing intention (title, next_action, note, list, estimate, due_at). Use the id from context.",
      inputSchema: z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(120).optional(),
        next_action: z.string().max(200).nullable().optional(),
        note: z.string().max(400).nullable().optional(),
        list: z.string().max(40).nullable().optional(),
        estimate_minutes: z.number().int().min(1).max(600).nullable().optional(),
        due_at: z.string().datetime({ offset: true }).nullable().optional(),
      }),
      execute: (input) =>
        safe(async () => {
          const row = await updateIntention(db, userId, input.id, {
            title: input.title,
            nextAction: input.next_action,
            note: input.note,
            list: input.list,
            estimateMinutes: input.estimate_minutes,
            dueAt: input.due_at === undefined ? undefined : input.due_at ? new Date(input.due_at) : null,
          });
          return row ? { id: row.id, title: row.title, list: row.list } : { error: "not found" };
        }),
    }),

    complete_intention: tool({
      description: "Mark an intention done when the user says they did it. No fanfare.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: (input) =>
        safe(async () => {
          const row = await completeIntention(db, userId, input.id);
          if (row) await reflectClosedInPlan(db, me, row.id);
          return row ? { id: row.id, title: row.title, status: "done" } : { error: "not found" };
        }),
    }),

    reopen_intention: tool({
      description:
        "Put a done or dropped intention back on the list — they ticked it by mistake, or changed their mind about letting it go. Use the id from Recent changes or Recently done in the context; never create a duplicate instead.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: (input) =>
        safe(async () => {
          const row = await reopenIntention(db, userId, input.id);
          return row ? { id: row.id, title: row.title, status: "open" } : { error: "not found" };
        }),
    }),

    drop_intention: tool({
      description: "Let an intention go when the user decides it's no longer relevant. Dropping is a normal outcome, not a failure.",
      inputSchema: z.object({ id: z.string().uuid(), reason: z.string().max(200).optional() }),
      execute: (input) =>
        safe(async () => {
          const row = await dropIntention(db, userId, input.id, input.reason);
          if (row) await reflectClosedInPlan(db, me, row.id);
          // Letting things go during the coming-back pass reshapes the day; re-cut once the turn ends.
          if (row && reentry) onPlanChange?.({ reason: "reentry" });
          return row ? { id: row.id, title: row.title, status: "dropped" } : { error: "not found" };
        }),
    }),

    report_capacity: tool({
      description: "Record how much the user has today when they tell you (e.g. '20% day', 'wiped', 'actually sharp today'). Once per day is plenty.",
      inputSchema: z.object({
        level: z.enum(["low", "normal", "high"]),
        flags: z.array(z.enum(["overwhelmed", "scattered", "tired", "focused"])).optional(),
        note: z.string().max(200).optional(),
      }),
      execute: (input) =>
        safe(async () => {
          await reportCapacity(db, userId, input);
          onPlanChange?.({ reason: "capacity" });
          return { level: input.level };
        }),
    }),

    reshape_today: tool({
      description:
        "Re-cut the path on the Today page around what the user just asked for — something easy, something quick, a fresh plan, \"what should I do now\". Pass their ask in a few words. If your reply names the thing to do now, pass its id (and the first step you gave) so Today shows the same thing. Today re-cuts after your reply; don't narrate it.",
      inputSchema: z.object({
        ask: z.string().min(2).max(120).describe("What they asked for, in their words: 'something easy', 'quick wins', 'a fresh plan'"),
        right_now: z.string().uuid().optional().describe("The open intention you're proposing for right now, if your reply names one (id from context)"),
        first_step: z.string().max(140).optional().describe("The first physical step you gave for it, if any"),
      }),
      execute: async (input) => {
        onPlanChange?.({ reason: "asked", ask: { text: input.ask, rightNowId: input.right_now, firstStep: input.first_step } });
        return { ok: true, ask: input.ask };
      },
    }),

    remember: tool({
      description:
        "Hold onto something durable about the user: a fact, a project, a preference about how you should be, a strategy that helps them start, a pattern you've noticed, or an anti-pattern. source=user_said when they told you; lumi_inferred when you noticed it (keep confidence ≤ 0.6 for inferences).",
      inputSchema: z.object({
        kind: z.enum(KINDS),
        content: z.string().min(3).max(240).describe("One sentence, present tense"),
        source: z.enum(["user_said", "lumi_inferred"]),
        confidence: z.number().min(0.05).max(0.98).optional(),
      }),
      execute: (input) =>
        safe(async () => {
          const r = await applyBeliefOps(db, userId, [{ op: "create", ...input }], "lumi");
          const b = r.created[0];
          return b ? { id: b.id, kind: b.kind, content: b.content } : { error: r.skipped[0]?.why ?? "skipped" };
        }),
    }),

    confirm_belief: tool({
      description: "Evidence for an existing belief (id from context) — e.g. the strategy worked again.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: (input) => safe(async () => summarize(await applyBeliefOps(db, userId, [{ op: "confirm", id: input.id }], "lumi"))),
    }),

    contradict_belief: tool({
      description: "Evidence against an existing belief (id from context).",
      inputSchema: z.object({ id: z.string().uuid(), note: z.string().max(200).optional() }),
      execute: (input) => safe(async () => summarize(await applyBeliefOps(db, userId, [{ op: "contradict", id: input.id, note: input.note }], "lumi"))),
    }),

    revise_belief: tool({
      description: "Replace a belief's wording with a better one (history is kept). Cannot revise what the user stated themselves — ask them.",
      inputSchema: z.object({ id: z.string().uuid(), content: z.string().min(3).max(240) }),
      execute: (input) => safe(async () => summarize(await applyBeliefOps(db, userId, [{ op: "revise", id: input.id, content: input.content }], "lumi"))),
    }),

    forget_belief: tool({
      description: "Retire a belief because the user asked you to forget it.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: (input) => safe(async () => summarize(await applyBeliefOps(db, userId, [{ op: "retire", id: input.id, reason: "user" }], "user"))),
    }),

    look_at_email: tool({
      description:
        "Read the user's recent mail (Gmail, read-only) when they ask about it or about something that would be in it — 'did the landlord reply?', 'anything in my inbox I need to deal with?'. Optional search in Gmail syntax (from:priya, invoice) and days back (default 7). Returns sender, subject, when and the gist of each. Say what you found in a few lines — never read the inbox back. If it returns not_connected, say the Insights page has a Connect Google chip.",
      inputSchema: z.object({
        search: z.string().max(120).optional(),
        days: z.number().int().min(1).max(30).optional(),
      }),
      execute: (input) =>
        safe(async () => {
          const reader = await mail?.();
          if (!reader) return { error: "not_connected" };
          const since = new Date(Date.now() - (input.days ?? 7) * 86_400_000);
          const msgs = await reader.recent({ since, max: MAIL_LOOK_MAX, search: input.search });
          return { messages: msgs.map((m) => ({ from: m.fromName, subject: m.subject, when: m.receivedAt.toISOString(), gist: m.text.slice(0, MAIL_GIST_CHARS) })) };
        }),
    }),

    keep_lead: tool({
      description: "Something you noticed in their mail (Their mail in the context) still needs doing: it becomes an intention. Use the lead id — not create_intention, which would make a copy.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: (input) =>
        safe(async () => {
          const r = await keepLead(db, userId, input.id, "chat");
          return r ? { id: r.lead.id, title: r.lead.title, intention_id: r.intention.id } : { error: "not found" };
        }),
    }),

    dismiss_lead: tool({
      description: "Something you noticed in their mail is handled, or isn't a thing: let it go. Use the lead id.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: (input) =>
        safe(async () => {
          const row = await dismissLead(db, userId, input.id, "chat");
          return row ? { id: row.id, title: row.title } : { error: "not found" };
        }),
    }),
  };
}

function summarize(r: Awaited<ReturnType<typeof applyBeliefOps>>) {
  return r.applied.length ? { ok: true } : { error: r.skipped[0]?.why ?? "skipped" };
}

export type LumenTools = ReturnType<typeof buildTools>;

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
import type { UserPreferences } from "@/db/schema";
import { reportCapacity } from "@/core/domain/capacity";
import { completeIntention, createIntention, dropIntention, reopenIntention, updateIntention } from "@/core/domain/intentions";
import { applyBeliefOps } from "@/core/domain/memory";
import { reflectClosedInPlan } from "@/core/domain/plan-sync";
import { endFocusSession, startFocusSession, toSessionView } from "@/core/domain/sessions";

/** A write that means today's path should be re-cut once the turn has streamed. */
export type PlanInvalidation = "capacity" | "reentry";

export type ToolContext = {
  db: Db;
  userId: string;
  timezone: string;
  /** Session defaults (length, check-in interval). */
  preferences?: Pick<UserPreferences, "session_minutes" | "check_in_minutes">;
  /** This sitting began after a week or more away: letting things go re-cuts the path. */
  reentry?: boolean;
  /** Called (at most once per reason) when a write invalidates today's path; the route re-cuts in `after()`. */
  onPlanChange?: (reason: PlanInvalidation) => void;
  /** Called when a session closes during the turn (ended, or replaced by a new one); the route reflects on it in `after()`. */
  onSessionEnd?: (sessionId: string) => void;
};

const KINDS = ["fact", "project", "preference", "strategy", "pattern", "anti_pattern"] as const;
const EFFORT = ["tiny", "small", "medium", "large"] as const;

function safe<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  return fn().catch((e: unknown) => ({ error: e instanceof Error ? e.message : "failed" }));
}

export function buildTools({ db, userId, timezone, preferences, reentry = false, onPlanChange, onSessionEnd }: ToolContext) {
  const me = { id: userId, timezone };
  const sessionMinutes = preferences?.session_minutes ?? 45;
  const checkInMinutes = preferences?.check_in_minutes ?? 15;
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
          if (row && reentry) onPlanChange?.("reentry");
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
          onPlanChange?.("capacity");
          return { level: input.level };
        }),
    }),

    start_focus_session: tool({
      description:
        "Begin a stretch of company once three things are settled — what we're doing, the first physical step, how long. Take them from the context when already known (the intention's next step, its estimate) instead of re-asking; minutes defaults to their usual. approach = the way in being tried, if there is one (e.g. 'read the last paragraph first'), worded like an existing strategy belief when one fits — outcomes are linked back to it. The interface shows the session and runs the check-ins; you go quiet.",
      inputSchema: z.object({
        goal: z.string().min(1).max(120).describe("What we're doing, in their words"),
        first_step: z.string().min(1).max(200).describe("The smallest physical action to begin with"),
        approach: z.string().max(160).optional().describe("The strategy being tried, if any"),
        minutes: z.number().int().min(5).max(180).optional().describe("Planned length; omit for their usual"),
        intention_id: z.string().uuid().optional().describe("The intention this is for, if it's one from the context"),
      }),
      execute: (input) =>
        safe(async () => {
          const { session, replaced } = await startFocusSession(db, userId, {
            goal: input.goal,
            firstStep: input.first_step,
            approach: input.approach,
            plannedMinutes: input.minutes ?? sessionMinutes,
            checkInMinutes,
            intentionId: input.intention_id,
          });
          if (replaced) onSessionEnd?.(replaced.id);
          return toSessionView(session);
        }),
    }),

    end_focus_session: tool({
      description:
        "Close the running session (id from the context) when they say in their own words that they're done or want to stop — the interface's Done and End taps close it on their own. completed if they got somewhere with it; stopped_early if they stopped before that. Neither is a judgement.",
      inputSchema: z.object({ id: z.string().uuid(), outcome: z.enum(["completed", "stopped_early"]) }),
      execute: (input) =>
        safe(async () => {
          const row = await endFocusSession(db, userId, input.id, input.outcome);
          if (!row) return { error: "no session running" };
          onSessionEnd?.(row.id);
          return { id: row.id, goal: row.goal, outcome: input.outcome };
        }),
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
  };
}

function summarize(r: Awaited<ReturnType<typeof applyBeliefOps>>) {
  return r.applied.length ? { ok: true } : { error: r.skipped[0]?.why ?? "skipped" };
}

export type LumenTools = ReturnType<typeof buildTools>;

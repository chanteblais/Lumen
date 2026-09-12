/**
 * The day plan: Lumi proposes a path through today; code guards it.
 * See docs/today.md → How the plan is built.
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import type { CapacityReport } from "@/core/domain/capacity";
import { dueOn, isStale } from "@/core/domain/intentions";
import { dayPart, describeGap } from "@/core/time";
import type { DayPlanJson, Intention, MemoryNote } from "@/db/schema";
import { cachedPrefixOptions, chatModel } from "./model";
import { PERSONA } from "./persona";

export type PlanInputs = {
  displayName: string;
  timezone: string;
  localDate: string;
  now: Date;
  capacity?: CapacityReport;
  openIntentions: Intention[];
  beliefs: MemoryNote[];
  declined?: { intentionId: string; reason?: string }[];
  lastSeenAt?: Date;
};

const PlanSchema = z.object({
  dayLine: z.string().max(200).describe("One or two short sentences in Lumi's voice about the shape of today. Name what's time-sensitive; say what can wait. No counts."),
  rightNow: z
    .object({ intentionId: z.string(), firstStep: z.string().max(140).describe("The smallest concrete physical action to begin this — a step, not a plan") })
    .nullable(),
  afterThat: z.array(z.object({ intentionId: z.string() })).max(3),
  closingLine: z.string().max(140).optional().describe("Optional. E.g. 'These three are enough for today.' Only if there is more than the path holds."),
});

const PLANNER_RULES = `## Planning today
You are choosing a path through the day for the person, from their open intentions. Curated, not accumulated.
- Pick ONE thing for right now. Prefer: something time-sensitive today; then something they've been avoiding that is small enough to start; then the thing with the clearest first step. Don't pick something that needs a closed office or a person who's asleep at this hour.
- After that: at most three, in a sensible order. On a low-capacity day: at most one, an easy win.
- Fixed-time things today are handled separately — do not put them in rightNow or afterThat.
- The dayLine names what is time-sensitive and says what can wait. Never a count ("you have eight things"). Never guilt. Never inspirational.
- firstStep is a physical action ("Open the doc and read the last paragraph"), never "work on X".
- If they declined something just now, respect the reason: too big → a smaller thing or the same thing with a tinier first step; too tired → the easiest win; don't know how → something clearer, and note the unclear one can wait; something else is more important → ask nothing, pick the likely candidate; just nope → a different thing, no comment.
- If nothing is open, rightNow is null and the dayLine says the day is clear.`;

export async function buildDayPlan(inputs: PlanInputs): Promise<DayPlanJson> {
  const fixed = dueOn(inputs.openIntentions, inputs.localDate, inputs.timezone);
  const fixedIds = new Set(fixed.map((f) => f.id));
  const candidates = inputs.openIntentions.filter((i) => !fixedIds.has(i.id));

  if (candidates.length === 0) {
    return {
      dayLine: fixed.length ? `Nothing open apart from what's already on the clock today.` : `Nothing on the list. The day's yours.`,
      rightNow: null,
      afterThat: [],
      later: fixed.map((f) => ({ intentionId: f.id })),
      restCanWait: false,
    };
  }

  const r = await generateText({
    model: chatModel(),
    instructions: [
      { role: "system", content: PERSONA, providerOptions: cachedPrefixOptions },
      { role: "system", content: PLANNER_RULES },
      { role: "system", content: describeInputs(inputs, candidates, fixed) },
    ],
    prompt: "Choose today's path. Return only the structured plan.",
    output: Output.object({ schema: PlanSchema, name: "day_plan" }),
    providerOptions: { anthropic: { effort: "medium" } },
  });

  return clampPlan(r.output ?? { dayLine: "", rightNow: null, afterThat: [] }, candidates, fixed, inputs.capacity?.level);
}

/** Pure guardrails over whatever the model returned. Tested. */
export function clampPlan(
  raw: { dayLine: string; rightNow: { intentionId: string; firstStep: string } | null; afterThat: { intentionId: string }[]; closingLine?: string },
  candidates: Pick<Intention, "id" | "nextAction">[],
  fixed: Pick<Intention, "id">[],
  capacity?: "low" | "normal" | "high",
): DayPlanJson {
  const ids = new Set(candidates.map((c) => c.id));
  const used = new Set<string>();
  let rightNow = raw.rightNow && ids.has(raw.rightNow.intentionId) ? raw.rightNow : null;
  if (!rightNow && candidates.length) {
    const c = candidates[0];
    rightNow = { intentionId: c.id, firstStep: c.nextAction ?? "Open it up and look at where you left off." };
  }
  if (rightNow) {
    used.add(rightNow.intentionId);
    rightNow = { intentionId: rightNow.intentionId, firstStep: rightNow.firstStep.trim().slice(0, 140) || "Open it up and look at where you left off." };
  }
  const maxAfter = capacity === "low" ? 1 : 3;
  const afterThat = raw.afterThat
    .filter((a) => ids.has(a.intentionId) && !used.has(a.intentionId) && used.add(a.intentionId))
    .slice(0, maxAfter)
    .map((a) => ({ intentionId: a.intentionId }));
  const restCanWait = candidates.length > used.size;
  const dayLine = stripCounts(raw.dayLine.trim()) || "Here's a way through today.";
  const closingLine = raw.closingLine ? stripCounts(raw.closingLine.trim()) : undefined;
  return { dayLine, rightNow, afterThat, later: fixed.map((f) => ({ intentionId: f.id })), restCanWait, closingLine: restCanWait ? closingLine : undefined };
}

/** Numbers of things are a bill. Strip "N things/items/tasks" phrasings defensively. */
export function stripCounts(s: string): string {
  return s.replace(/\b(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(more\s+)?(things|items|tasks|to-?dos)\b/gi, "a few things");
}

function describeInputs(inputs: PlanInputs, candidates: Intention[], fixed: Intention[]): string {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: inputs.timezone, weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(inputs.now);
  const lines = [
    "## Inputs",
    `- Person: ${inputs.displayName}. Local time ${local} (${dayPart(inputs.now, inputs.timezone)}).`,
    inputs.capacity ? `- Capacity today: ${inputs.capacity.level}${inputs.capacity.flags?.length ? ` (${inputs.capacity.flags.join(", ")})` : ""}.` : "- Capacity today: not stated; assume normal.",
    inputs.lastSeenAt ? `- Last here: ${describeGap(inputs.lastSeenAt, inputs.now)}.` : "",
  ].filter(Boolean);
  if (fixed.length) {
    lines.push("", "## Fixed today (already handled — do not include)");
    for (const f of fixed) lines.push(`- "${f.title}" at ${new Intl.DateTimeFormat("en-CA", { timeZone: inputs.timezone, hour: "numeric", minute: "2-digit", hour12: true }).format(f.dueAt!)}`);
  }
  lines.push("", "## Candidates (id · title · list · ~min · flags)");
  for (const c of candidates.slice(0, 40)) {
    const flags: string[] = [];
    if (isStale(c, inputs.now)) flags.push("untouched for two weeks+");
    if (c.nextAction) flags.push(`next: ${c.nextAction}`);
    if (c.dueAt) flags.push(`due ${new Intl.DateTimeFormat("en-CA", { timeZone: inputs.timezone, month: "short", day: "numeric" }).format(c.dueAt)}`);
    if (c.note) flags.push(`note: ${c.note.slice(0, 80)}`);
    lines.push(`- ${c.id} · "${c.title}" · ${c.list ?? "—"} · ${c.estimateMinutes ? `~${c.estimateMinutes}m` : "—"}${flags.length ? ` · ${flags.join("; ")}` : ""}`);
  }
  if (inputs.declined?.length) {
    lines.push("", "## Just declined");
    for (const d of inputs.declined) lines.push(`- ${d.intentionId}${d.reason ? ` — "${d.reason}"` : ""}`);
  }
  const strategies = inputs.beliefs.filter((b) => b.kind === "strategy" || b.kind === "pattern" || b.kind === "anti_pattern" || b.kind === "preference");
  if (strategies.length) {
    lines.push("", "## What you know about how they work");
    for (const b of strategies.slice(0, 12)) lines.push(`- ${b.kind}: ${b.content}`);
  }
  return lines.join("\n");
}

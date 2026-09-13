/**
 * Break it down, on Today's card: Lumi proposes a few small physical steps for
 * one intention; the user taps the one they'll start with. The model proposes,
 * code guards the list (`clampSteps`). Nothing is written here — the chosen step
 * is saved by `PATCH /api/intentions/[id]` → `first_step`.
 * See docs/today.md → Anatomy.
 */
import { z } from "zod";
import type { Intention, MemoryNote } from "@/db/schema";
import { proposeStructured } from "./structured";

type BreakdownInputs = Pick<Intention, "title" | "note" | "nextAction" | "estimateMinutes"> & {
  /** The steps they found still too big: go smaller than these. */
  smallerThan?: string[];
  beliefs: MemoryNote[];
};

export const MAX_STEPS = 5;
const MAX_STEP_CHARS = 100;

const StepsSchema = z.object({
  steps: z.array(z.string().max(160)).min(1).max(8).describe("Three to five small physical steps, in the order they'd happen"),
});

const BREAKDOWN_RULES = `## Breaking it down
You're turning one thing on today's path into a few small physical steps the person could start with. They'll tap the one they'll begin with.
- Three to five steps, in the order they'd happen. Each is one physical action someone could do in a few minutes ("Open the doc and read the last paragraph"), never "work on", "plan", "think about" or "get started on".
- Plain words, under 80 characters each. No numbering, no bullets.
- If they found the last steps still too big, go smaller: break the first of those into pieces a minute or two long.
- Use what you know helps them start, when it fits.`;

export async function breakDown(inputs: BreakdownInputs): Promise<string[]> {
  const raw = await proposeStructured({
    name: "steps",
    kind: "breakdown",
    persona: true,
    rules: BREAKDOWN_RULES,
    inputs: describeBreakdown(inputs),
    prompt: "Break it down. Return only the structured steps.",
    schema: StepsSchema,
    effort: "low",
  });
  return clampSteps(raw?.steps ?? []);
}

/** Pure guardrails over the model's steps: tidy, unnumbered, short, no repeats, at most five. Tested. */
export function clampSteps(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const step = s
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_STEP_CHARS)
      .trim();
    const key = step.toLowerCase();
    if (!step || seen.has(key)) continue;
    seen.add(key);
    out.push(step);
    if (out.length === MAX_STEPS) break;
  }
  return out;
}

function describeBreakdown(i: BreakdownInputs): string {
  const lines = ["## The thing", `- "${i.title}"${i.estimateMinutes ? ` · ~${i.estimateMinutes} min` : ""}`];
  if (i.note) lines.push(`- Note: ${i.note.slice(0, 200)}`);
  if (i.nextAction) lines.push(`- The step it has now: ${i.nextAction}`);
  if (i.smallerThan?.length) {
    lines.push("", "## They found these still too big — go smaller", ...i.smallerThan.map((s) => `- ${s}`));
  }
  const helps = i.beliefs.filter((b) => b.kind === "strategy" || b.kind === "anti_pattern").slice(0, 6);
  if (helps.length) lines.push("", "## What you know about how they start", ...helps.map((b) => `- ${b.kind}: ${b.content}`));
  return lines.join("\n");
}

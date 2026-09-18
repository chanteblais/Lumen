/**
 * The one structured model call behind every background step — the day plan,
 * mail leads, consolidation and reflection. Instructions are the persona (when
 * the step speaks in Lumi's voice, as the cached prefix), the step's rules, then
 * its inputs block; the prompt asks for the structured result. Returns the
 * object, or null when the model gave nothing usable — each caller decides what
 * null means (a fallback plan, no leads, a failed consolidation). Throws what
 * the provider throws.
 */
import { generateText, Output } from "ai";
import type { z } from "zod";
import { cachedPrefixOptions, chatModel, effortOptions, type CallKind, type Effort } from "./model";
import { PERSONA } from "./persona";

type StructuredCall<T> = {
  /** The output's name, as the provider sees it ("day_plan"). */
  name: string;
  /** Which call this is: picks its own prompt cache key. */
  kind: Exclude<CallKind, "chat">;
  rules: string;
  inputs: string;
  /** The one-line ask after the instructions ("Choose today's path. Return only the structured plan."). */
  prompt: string;
  schema: z.ZodType<T>;
  effort: Effort;
  /** Lead with the persona, marked as the cached prefix. */
  persona?: boolean;
};

export async function proposeStructured<T>({ name, kind, rules, inputs, prompt, schema, effort, persona = false }: StructuredCall<T>): Promise<T | null> {
  const r = await generateText({
    model: chatModel(),
    instructions: [
      ...(persona ? [{ role: "system" as const, content: PERSONA, providerOptions: cachedPrefixOptions }] : []),
      { role: "system" as const, content: rules },
      { role: "system" as const, content: inputs },
    ],
    prompt,
    output: Output.object({ schema, name }),
    providerOptions: effortOptions(effort, kind),
  });
  return (r.output as T | undefined) ?? null;
}

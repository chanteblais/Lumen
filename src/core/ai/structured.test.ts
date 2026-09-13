/**
 * The structured call's request shape, per step: instructions in order (the
 * persona first and marked as the cached prefix only where the step speaks as
 * Lumi), the step's prompt, its output name, effort, and its own cache key.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateText = vi.fn();
vi.mock("ai", async (importOriginal) => ({ ...(await importOriginal<typeof import("ai")>()), generateText: (...args: unknown[]) => generateText(...args) }));

const { proposeStructured } = await import("./structured");
const { PERSONA } = await import("./persona");
const { promptCacheKey } = await import("./model");

beforeEach(() => generateText.mockReset());

describe("proposeStructured", () => {
  const schema = z.object({ ok: z.boolean() });

  it("leads with the cached persona when asked, then rules and inputs, with the step's own cache key and effort", async () => {
    generateText.mockResolvedValue({ output: { ok: true } });
    const out = await proposeStructured({ name: "day_plan", kind: "plan", persona: true, rules: "RULES", inputs: "INPUTS", prompt: "Choose.", schema, effort: "medium" });
    expect(out).toEqual({ ok: true });
    const call = generateText.mock.calls[0]![0];
    expect(call.instructions).toEqual([
      { role: "system", content: PERSONA, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } }, openai: { promptCacheBreakpoint: { mode: "explicit" } } } },
      { role: "system", content: "RULES" },
      { role: "system", content: "INPUTS" },
    ]);
    expect(call.prompt).toBe("Choose.");
    expect(call.providerOptions.openai).toMatchObject({ promptCacheKey: "lumi-plan", reasoningEffort: "medium", store: false, strictJsonSchema: false });
    expect(call.providerOptions.anthropic).toEqual({ effort: "medium" });
  });

  it("sends no persona for the memory steps, and null when the model gave nothing", async () => {
    generateText.mockResolvedValue({ output: undefined });
    expect(await proposeStructured({ name: "consolidation", kind: "consolidate", rules: "R", inputs: "I", prompt: "P", schema, effort: "low" })).toBeNull();
    const call = generateText.mock.calls[0]![0];
    expect(call.instructions.map((m: { content: string }) => m.content)).toEqual(["R", "I"]);
    expect(call.providerOptions.openai.promptCacheKey).toBe("lumi-consolidate");
  });

  it("gives every kind of call its own key", () => {
    const keys = (["chat", "plan", "breakdown", "leads", "consolidate", "reflect"] as const).map(promptCacheKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

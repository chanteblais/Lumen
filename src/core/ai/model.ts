/**
 * The one place the model is chosen and provider options set. Swap here, not
 * in routes. Cache control is applied to the persona in the route (it's a
 * per-message option), effort/fallbacks are request-level and live here.
 *
 * Lumi runs on OpenAI. The Anthropic implementation stays alongside for
 * comparison (docs/product/lumi-model-strategy.md): `LUMI_MODEL=anthropic:claude-opus-5`
 * switches every call — chat, plan, leads, reflection — without a code change.
 * Options for both providers are always sent; each provider reads only its own key.
 */
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

const DEFAULT_MODEL = "openai:gpt-6-astra";

const [PROVIDER, MODEL_ID] = parseModel(process.env.LUMI_MODEL || DEFAULT_MODEL);

export const CHAT_MODEL_ID = MODEL_ID;

export function chatModel() {
  return PROVIDER === "anthropic" ? anthropic(MODEL_ID) : openai(MODEL_ID);
}

export type Effort = "low" | "medium";

/**
 * OpenAI request options every call shares. `store: false` keeps conversations
 * and mail out of OpenAI's stored responses; the encrypted reasoning comes back
 * instead so a multi-step tool loop can carry it between steps. Schemas are not
 * strict: tool and output schemas have optional fields, which strict mode refuses
 * — code guards the output anyway. The cache key groups requests that share the persona prefix.
 */
const OPENAI_BASE = {
  store: false,
  include: ["reasoning.encrypted_content"] as string[],
  strictJsonSchema: false,
  promptCacheKey: "lumi-persona",
};

/** Request-level options for a structured background call (plan, leads, reflection). */
export function effortOptions(effort: Effort) {
  return {
    anthropic: { effort },
    openai: { ...OPENAI_BASE, reasoningEffort: effort },
  } as const;
}

/** Request-level options for a chat turn. */
export const chatProviderOptions = {
  anthropic: {
    // Chat turns are short and latency-sensitive; raise if the voice eval says so.
    effort: "low",
    // Server-side refusal fallbacks: route by category, no model list to maintain.
    fallbacks: "default",
  },
  openai: { ...OPENAI_BASE, reasoningEffort: "low" },
} as const;

/**
 * Marks a system message as the cached prefix. OpenAI (GPT-6) keeps a cache entry only at a
 * breakpoint, and its implicit one is the end of the prompt — the per-turn context block — so
 * without this every turn wrote the whole prompt to cache and read none of it back. With it, the
 * tools and the persona are read from cache across turns (measured 2026-09-13: 8,281 of ~8,400 tokens).
 */
export const cachedPrefixOptions = {
  anthropic: { cacheControl: { type: "ephemeral" } },
  openai: { promptCacheBreakpoint: { mode: "explicit" } },
} as const;

function parseModel(spec: string): ["openai" | "anthropic", string] {
  const [provider, id] = spec.split(":", 2);
  if ((provider === "openai" || provider === "anthropic") && id) return [provider, id];
  throw new Error(`LUMI_MODEL must be "openai:<model>" or "anthropic:<model>", got "${spec}"`);
}

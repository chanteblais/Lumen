/**
 * The one place the model is chosen and provider options set. Swap here, not
 * in routes. Cache control is applied to the persona in the route (it's a
 * per-message option), effort/fallbacks are request-level and live here.
 */
import { anthropic } from "@ai-sdk/anthropic";

export const CHAT_MODEL_ID = "claude-opus-5";

export function chatModel() {
  return anthropic(CHAT_MODEL_ID);
}

/** Request-level Anthropic options for a chat turn. */
export const chatProviderOptions = {
  anthropic: {
    // Chat turns are short and latency-sensitive; raise if the voice eval says so.
    effort: "low",
    // Server-side refusal fallbacks: route by category, no model list to maintain.
    fallbacks: "default",
  },
} as const;

/** Marks a system message as the cached prefix. */
export const cachedPrefixOptions = {
  anthropic: { cacheControl: { type: "ephemeral" } },
} as const;

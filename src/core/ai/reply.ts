import type { UIMessage } from "ai";

/**
 * Whether an assistant message holds anything: words, or something she did (a tool part).
 * Lumi may say nothing at all — a "yep" during a focus session needs no answer — and the
 * stream still leaves a message behind: a `step-start` part, sometimes an empty text part.
 * That is silence, not a reply: the chat route doesn't save it and no client shows it.
 */
export function hasReply(message: Pick<UIMessage, "parts">): boolean {
  return message.parts.some((p) => (p.type === "text" ? p.text.trim() !== "" : p.type.startsWith("tool-") || p.type === "dynamic-tool"));
}

/**
 * Her answer to the last thing said: the newest message, when it is hers. Never an
 * earlier reply — while she thinks, or when a silent turn added no message to the
 * chat, an older line would read as her answer to what you just said.
 */
export function latestReply<M extends Pick<UIMessage, "role">>(messages: M[]): M | undefined {
  const last = messages[messages.length - 1];
  return last?.role === "assistant" ? last : undefined;
}

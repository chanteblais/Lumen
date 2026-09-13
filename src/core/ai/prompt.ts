/**
 * How a chat turn is laid out for the prompt cache (code review B9). Providers
 * cache a request's longest unchanged prefix. The persona and the tools come
 * first, then the conversation; the volatile context block, which changes
 * every turn, comes last — on the newest user message, as a marked text part
 * built for this request and never stored — so the history before it can be
 * read from the cache. Both providers take a user message's text parts as they
 * are, so the order is the same on each; a mid-conversation system message
 * would need a beta on Anthropic, and isn't used.
 *
 * The window's start moves in steps: a window that always ends at the newest
 * message and holds exactly 30 drops its oldest two every turn, which changes
 * the prefix right after the persona and caches nothing past it.
 */
import type { ModelMessage } from "ai";
import { MESSAGE_WINDOW } from "@/core/domain/conversations";
import { cachedPrefixOptions } from "./model";

/** The window's start moves this many messages at a time: 30 to 39 messages ride along, and the history prefix holds for about five turns. */
export const WINDOW_STEP = 10;
/** Enough to fill the largest window. */
export const WINDOW_LOAD = MESSAGE_WINDOW + WINDOW_STEP - 1;

/**
 * The window over the newest `recent` messages (oldest first) of a conversation
 * holding `total` of them: at least `min`, starting at a multiple of `step`
 * counted from the conversation's first message, so the first message in view
 * stays the same until the window has grown by a step. Pure.
 */
export function stableWindow<T>(recent: T[], total: number, min = MESSAGE_WINDOW, step = WINDOW_STEP): T[] {
  const start = Math.max(0, Math.floor((total - min) / step) * step);
  return recent.slice(-Math.max(min, total - start));
}

const OPEN = "<context>";
const CLOSE = "</context>";
/** The marker as anyone might type it, so what they write can't open or close the app's context. */
const MARKER = /<\s*(\/?)\s*context\s*>/gi;

/** The line that heads the context part. Fixed wording: Lumi reads it every turn. */
export const CONTEXT_LEAD = "Written by the app for this turn, not typed by them: the context your instructions refer to, as things stand right now.";

export function contextPart(context: string) {
  return { type: "text" as const, text: `${OPEN}\n${CONTEXT_LEAD}\n\n${context}\n${CLOSE}` };
}

/**
 * The conversation as the model reads it this turn: the context block appended
 * to the newest user message (after their words), and a cache breakpoint for
 * Anthropic on their last words before it (OpenAI caches the prefix on its own).
 * A marker typed in their messages is defanged. The stored messages are untouched.
 */
export function withContext(messages: ModelMessage[], context: string): ModelMessage[] {
  const out = messages.map(defang);
  const last = out[out.length - 1];
  if (last?.role !== "user") return [...out, { role: "user", content: [contextPart(context)] }];
  const content = typeof last.content === "string" ? [{ type: "text" as const, text: last.content }] : last.content;
  const marked = content.map((p, i) => (i === content.length - 1 ? { ...p, providerOptions: { ...p.providerOptions, ...cachedPrefixOptions } } : p));
  out[out.length - 1] = { ...last, content: [...marked, contextPart(context)] };
  return out;
}

function defang(m: ModelMessage): ModelMessage {
  if (m.role !== "user") return m;
  const clean = (text: string) => text.replace(MARKER, (_s, slash: string) => `‹${slash}context›`);
  if (typeof m.content === "string") return { ...m, content: clean(m.content) };
  return { ...m, content: m.content.map((p) => (p.type === "text" ? { ...p, text: clean(p.text) } : p)) };
}

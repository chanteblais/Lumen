"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { CoherenceUIMessage } from "@/core/domain/conversations";

/**
 * The pieces every chat client shares — Home's conversation, the companion's
 * speech bubble and the Lists add-line all talk to `/api/chat` the same way.
 */

/** What Lumi says when a turn fails, wherever it failed. */
export const LUMI_LOST_THREAD = "I lost the thread for a second. Say that again?";

/** The tallest a message box grows before it scrolls, in px (the Home composer's; the bubble's was 168). */
export const MESSAGE_BOX_MAX_PX = 160;

/** Send only the new message; the server holds the transcript. */
export function chatTransport() {
  return new DefaultChatTransport<CoherenceUIMessage>({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages, id }) => ({ body: { id, message: messages[messages.length - 1] } }),
  });
}

/** Message ids are UUIDs on both sides: `messages.id` is a uuid column. */
export const newMessageId = () => crypto.randomUUID();

export const isBusy = (status: string) => status === "submitted" || status === "streaming";

/**
 * A message's words. One text part per block of speech — Lumi often says a
 * line, acts (a tool part), then says another — so each block is trimmed and
 * the blocks are separated as paragraphs rather than run together.
 */
export function textOf(message: CoherenceUIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Whether an assistant message has anything to show yet: words, or something she did. */
export const hasReply = (message: CoherenceUIMessage) => textOf(message) !== "" || message.parts.some((p) => p.type.startsWith("tool-"));

/** Lumi's three slow brass dots while she thinks (`.thinking-dots`). Pass `label={null}` when a parent already says so. */
export function ThinkingDots({ label = "Lumi is thinking" }: { label?: string | null }) {
  return (
    <p className="thinking-dots" aria-label={label ?? undefined}>
      <span>·</span>
      <span>·</span>
      <span>·</span>
    </p>
  );
}

/** A textarea that grows with what's typed, up to `max` px, then scrolls. Call `resize` after changing its value. */
export function useAutoResize(max = MESSAGE_BOX_MAX_PX) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [max]);
  return { ref, resize };
}

/**
 * Chats that outlive the component showing them. The speech bubble closes on
 * Escape, a click elsewhere or a page change, and the Lists sheet closes with
 * Back; a `useChat` that owned its `Chat` would stop it on unmount, and the
 * route aborts the turn with the request — Lumi would stop mid-tool. Held here,
 * the turn finishes wherever you've gone. `@ai-sdk/react` leaves a chat passed
 * in as `useChat({ chat })` running when the component unmounts.
 */
export type HeldChatSlot = "bubble" | "lists-add";
const held = new Map<HeldChatSlot, Chat<CoherenceUIMessage>>();

/** A beat after a turn lands before the page refreshes: the route's `after()` may still be re-cutting today's path. */
const LANDED_REFRESH_MS = 700;

/**
 * The slot's chat for a newly opened bubble or add-line: the one still talking
 * if a turn is in flight (reopened mid-turn, you see it finish), else a fresh
 * one — once a turn has landed, the next opening starts clean, as it always has.
 * An unused chat counts as fresh, so calling this twice (React's dev double
 * render) hands back the same one.
 */
function holdChat(slot: HeldChatSlot, onLanded: () => void): Chat<CoherenceUIMessage> {
  const current = held.get(slot);
  if (current && (isBusy(current.status) || current.messages.length === 0)) return current;
  const chat = new Chat<CoherenceUIMessage>({
    transport: chatTransport(),
    generateId: newMessageId,
    // Called when the turn ends however it ends (landed, stopped, failed), even
    // with the bubble or the sheet long closed: the page showing then reflects what she did.
    onFinish: () => void setTimeout(onLanded, LANDED_REFRESH_MS),
  });
  held.set(slot, chat);
  return chat;
}

/** `useChat` on the slot's held chat; refreshes the page underneath once each turn has landed. */
export function useHeldChat(slot: HeldChatSlot) {
  const router = useRouter();
  // The app router instance is the same object for the life of the app, so refreshing through it after this component is gone is fine.
  const [chat] = useState(() => holdChat(slot, () => router.refresh()));
  const result = useChat<CoherenceUIMessage>({ chat });
  return { ...result, busy: isBusy(result.status) };
}

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

/**
 * Send only the new message; the server holds the transcript. With it, where
 * you are as you send it — the page and which way in (`core/places.ts`) — so
 * Lumi knows "this one" on Today is the card in front of you.
 */
export function chatTransport(via?: HeldChatSlot) {
  return new DefaultChatTransport<CoherenceUIMessage>({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages, id }) => ({
      body: {
        id,
        message: messages[messages.length - 1],
        ...(via && typeof window !== "undefined" ? { where: { path: window.location.pathname, via } } : {}),
      },
    }),
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

/** Whether an assistant message has anything to show (words, or something she did; silence shows nothing), and her answer to the last thing said. */
export { hasReply, latestReply } from "@/core/ai/reply";

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
 * Chats that outlive the component showing them. Home unmounts when you go to
 * another page, the speech bubble closes on Escape, a click elsewhere or a page
 * change, and the Lists sheet closes with Back; a `useChat` that owned its
 * `Chat` would stop it on unmount, and the route aborts the turn with the
 * request — Lumi would stop mid-tool. Held here, the turn finishes wherever
 * you've gone. `@ai-sdk/react` leaves a chat passed in as `useChat({ chat })`
 * running when the component unmounts.
 */
export type HeldChatSlot = "home" | "bubble" | "lists-add";
type Held = { chat: Chat<CoherenceUIMessage>; seed: CoherenceUIMessage[] | undefined };
const held = new Map<HeldChatSlot, Held>();

type HoldOptions = {
  /** The conversation and the transcript the server rendered, for a chat that opens on its history (Home). */
  seed?: { id: string; messages: CoherenceUIMessage[] };
  /** Skip the refresh when the turn lands on this path: Home shows its own turn, and a refresh there would redo its page work for nothing. */
  refreshUnlessOn?: string;
};

/** A beat after a turn lands before the page refreshes: the route's `after()` may still be re-cutting today's path. */
const LANDED_REFRESH_MS = 700;

/**
 * Drops every held chat, stopping a turn still in flight. The chats live in the
 * tab's memory, not with the account, and signing out doesn't reload the page;
 * every change of account in one tab passes through sign-in or sign-up, which
 * call this on mount (`ReleaseHeldChats`), so one person's turn never shows to the next.
 */
export function releaseHeldChats() {
  for (const { chat } of held.values()) if (isBusy(chat.status)) void chat.stop();
  held.clear();
}

/**
 * The slot's chat for a component that has just mounted.
 * - A turn still in flight: that chat, `resumed` — you left mid-turn and are
 *   back, so you see it finish (and nothing from the server doubles it: the
 *   server's copy is ignored until the next mount with no turn in flight).
 * - Otherwise a fresh one, seeded with what the server just rendered (Home) or
 *   empty (the bubble, the add-line), so it never drifts from the transcript.
 * A chat still exactly as seeded (same seed, nothing added) counts as fresh, so
 * calling this twice for one mount (React's dev double render) hands back the same one.
 */
function holdChat(slot: HeldChatSlot, options: HoldOptions, refresh: () => void): { chat: Chat<CoherenceUIMessage>; resumed: boolean } {
  const current = held.get(slot);
  if (current && isBusy(current.chat.status)) {
    // Home names its conversation: a turn in flight for another one (another account in this tab) is stopped, never shown.
    if (!options.seed || current.chat.id === options.seed.id) return { chat: current.chat, resumed: true };
    void current.chat.stop();
  }
  const seed = options.seed?.messages;
  if (current && current.seed === seed && current.chat.messages.length === (seed?.length ?? 0)) return { chat: current.chat, resumed: false };
  const chat = new Chat<CoherenceUIMessage>({
    ...(options.seed ? { id: options.seed.id, messages: options.seed.messages } : {}),
    transport: chatTransport(slot),
    generateId: newMessageId,
    // Called when the turn ends however it ends (landed, stopped, failed), even
    // with the component long gone: the page showing then reflects what she did.
    onFinish: () =>
      void setTimeout(() => {
        if (options.refreshUnlessOn !== undefined && window.location.pathname === options.refreshUnlessOn) return;
        refresh();
      }, LANDED_REFRESH_MS),
  });
  held.set(slot, { chat, seed });
  return { chat, resumed: false };
}

/**
 * `useChat` on the slot's held chat; refreshes the page underneath once each
 * turn has landed. `resumed` says this mount picked up a turn already in flight.
 */
export function useHeldChat(slot: HeldChatSlot, options: HoldOptions = {}) {
  const router = useRouter();
  // The app router instance is the same object for the life of the app, so refreshing through it after this component is gone is fine.
  const [{ chat, resumed }] = useState(() => holdChat(slot, options, () => router.refresh()));
  const result = useChat<CoherenceUIMessage>({ chat });
  return { ...result, busy: isBusy(result.status), resumed };
}

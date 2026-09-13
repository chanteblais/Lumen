"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import { Composer } from "./Composer";
import { Greeting } from "./Greeting";
import { MessageList } from "./MessageList";

type Props = {
  conversationId: string;
  initialMessages: CoherenceUIMessage[];
  greetingLines: string[];
  /** Kicker labels rendered above the greeting, inside the scroll area. */
  kicker?: React.ReactNode;
  /** Whether the last message is from this sitting (computed on the server). */
  initialInSitting: boolean;
};

/**
 * Home's conversation. Nothing on Today sends you here any more: Not this and
 * Break it down happen on Today's card (2026-09-13). A link can still carry
 * words to start from (`?prefill=…`), which land in the composer unsent.
 */
export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting }: Props) {
  const params = useSearchParams();
  const handled = useRef(false);
  // Every page open is a fresh start: the greeting card sits after everything
  // that was there when the page opened, and what you say next goes below it.
  const [cardAt] = useState(initialMessages.length);
  // Quick starts are for the moment of starting: shown until you've said
  // something this sitting, and again next time you come back.
  const [inSitting, setInSitting] = useState(initialInSitting);
  const transport = useMemo(
    () =>
      new DefaultChatTransport<CoherenceUIMessage>({
        api: "/api/chat",
        // Send only the new message; the server holds the transcript.
        prepareSendMessagesRequest: ({ messages, id }) => ({ body: { id, message: messages[messages.length - 1] } }),
      }),
    [],
  );

  const { messages, sendMessage, stop, status, error } = useChat<CoherenceUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    generateId: () => crypto.randomUUID(),
  });

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInSitting(true);
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString() } });
  };

  // Take the prefill into the composer, then clean the URL without a navigation
  // (a router navigation would re-render the page and remount the chat).
  const prefill = params.get("prefill") ?? "";
  useEffect(() => {
    if (handled.current || !prefill) return;
    handled.current = true;
    window.history.replaceState(null, "", "/");
  }, [prefill]);

  return (
    <div className="chat-page">
      <div className="chat-scroll">
        {kicker}
        {/* The greeting marks this page open, like a chapter head: the earlier conversation above it (scroll up), this visit below. */}
        <MessageList
          messages={messages}
          cardAt={cardAt}
          card={<Greeting lines={greetingLines} onQuickStart={send} compact={inSitting} />}
          thinking={status === "submitted"}
          error={error ? "I lost the thread for a second. Say that again?" : undefined}
        />
      </div>
      <Composer onSend={send} onStop={stop} busy={busy} initialValue={prefill} />
    </div>
  );
}

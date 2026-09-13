"use client";

import type { FileUIPart } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import { LUMI_LOST_THREAD, useHeldChat } from "./chat-client";
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

/** Where the turn in flight began: its user message (the last one). */
function lastUserIndex(messages: CoherenceUIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i]?.role === "user") return i;
  return messages.length;
}

/**
 * Home's conversation. Nothing on Today sends you here any more: Not this and
 * Break it down happen on Today's card (2026-09-13). A link can still carry
 * words to start from (`?prefill=…`), which land in the composer unsent.
 */
export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting }: Props) {
  const params = useSearchParams();
  const handled = useRef(false);

  // Held above the page (`chat-client.tsx`), so leaving Home mid-turn doesn't stop
  // Lumi. With no turn in flight it is seeded fresh from what the server just
  // rendered; back mid-turn, it is the chat still talking (`resumed`), and the
  // server's copy — which has your message but not yet her reply — is set aside.
  // Landing refreshes the page you went to, never Home itself.
  const { messages, sendMessage, stop, status, error, busy, resumed } = useHeldChat("home", {
    seed: { id: conversationId, messages: initialMessages },
    refreshUnlessOn: "/",
  });

  // Every page open is a fresh start: the greeting card sits after everything
  // that was there when the page opened, and what you say next goes below it.
  // Back mid-turn, the card goes before the turn still arriving, so it reads as this visit.
  const [cardAt] = useState(() => (resumed ? lastUserIndex(messages) : initialMessages.length));
  // Quick starts are for the moment of starting: shown until you've said
  // something this sitting, and again next time you come back.
  const [inSitting, setInSitting] = useState(initialInSitting || resumed);

  const send = (text: string, files?: FileUIPart[]) => {
    const trimmed = text.trim();
    if ((!trimmed && !files?.length) || busy) return;
    setInSitting(true);
    const metadata = { createdAt: new Date().toISOString() };
    // A photo with nothing said is a whole message too.
    void (trimmed ? sendMessage({ text: trimmed, files, metadata }) : sendMessage({ files: files ?? [], metadata }));
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
          error={error ? LUMI_LOST_THREAD : undefined}
        />
      </div>
      <Composer onSend={send} onStop={stop} busy={busy} initialValue={prefill} />
    </div>
  );
}

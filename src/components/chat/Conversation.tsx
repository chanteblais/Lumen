"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LumenUIMessage } from "@/core/domain/conversations";
import { Composer } from "./Composer";
import { GreetingCard } from "./GreetingCard";
import { MessageList } from "./MessageList";

type Props = {
  conversationId: string;
  initialMessages: LumenUIMessage[];
  greetingLines: string[];
  /** Kicker labels rendered above the greeting, inside the scroll area. */
  kicker?: React.ReactNode;
  /** Whether the last message is from this sitting (computed on the server). */
  initialInSitting: boolean;
  /** Titles for handoff messages (id → title), from the server. */
  intentionTitles?: Record<string, string>;
};

/** What a link from Today/Lists turns into: a visible message plus metadata. */
export function handoffMessage(params: URLSearchParams, titles: Record<string, string>): { text: string; kind: string; intentionId: string } | null {
  for (const kind of ["start", "decline", "breakdown"] as const) {
    const id = params.get(kind);
    if (!id) continue;
    const title = titles[id] ?? "that";
    const text = kind === "start" ? `Let's start: ${title}` : kind === "decline" ? `Not this one: ${title}` : `Help me break this down: ${title}`;
    return { text, kind, intentionId: id };
  }
  return null;
}

export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting, intentionTitles = {} }: Props) {
  const params = useSearchParams();
  const handled = useRef(false);
  // A link from Today/Lists (?start=<id> …) becomes the first message of this sitting.
  const initialHandoff = useMemo(() => handoffMessage(params, intentionTitles), [params, intentionTitles]);
  // Quick starts are for the moment of starting: shown until you've said
  // something this sitting, and again next time you come back.
  const [inSitting, setInSitting] = useState(initialInSitting || Boolean(initialHandoff));
  const transport = useMemo(
    () =>
      new DefaultChatTransport<LumenUIMessage>({
        api: "/api/chat",
        // Send only the new message; the server holds the transcript.
        prepareSendMessagesRequest: ({ messages, id }) => ({ body: { id, message: messages[messages.length - 1] } }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat<LumenUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    generateId: () => crypto.randomUUID(),
  });

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string, extra?: Record<string, unknown>) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInSitting(true);
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString(), ...(extra ?? {}) } });
  };

  // Send the handoff once, then clean the URL without a navigation (a router
  // navigation would re-render the page and remount the chat mid-request).
  const prefill = params.get("prefill") ?? "";
  useEffect(() => {
    if (handled.current || (!initialHandoff && !prefill)) return;
    // Deferred so React's dev double-mount (which aborts in-flight chat requests) settles first.
    const t = setTimeout(() => {
      handled.current = true;
      if (initialHandoff) {
        void sendMessage({ text: initialHandoff.text, metadata: { createdAt: new Date().toISOString(), kind: initialHandoff.kind, intentionId: initialHandoff.intentionId } });
      }
      window.history.replaceState(null, "", "/");
    }, 50);
    return () => clearTimeout(t);
  }, [initialHandoff, prefill, sendMessage]);

  return (
    <div className="chat-page">
      <div className="chat-scroll">
        {kicker}
        <GreetingCard lines={greetingLines} onQuickStart={send} compact={inSitting} />
        <MessageList messages={messages} thinking={status === "submitted"} error={error ? "I lost the thread for a second. Say that again?" : undefined} />
      </div>
      <Composer onSend={send} busy={busy} initialValue={prefill} />
    </div>
  );
}

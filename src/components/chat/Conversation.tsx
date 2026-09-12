"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { declineMessageText, isDeclineReason, type DeclineReason } from "@/core/declines";
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
  /** Index in initialMessages where this sitting begins; the greeting card sits there. */
  sittingStart: number;
  /** Titles for handoff messages (id → title), from the server. */
  intentionTitles?: Record<string, string>;
};

export type Handoff = { text: string; kind: "start_intention" | "declined" | "break_down"; intentionId: string; reason?: DeclineReason };

/**
 * What a link from Today/Lists turns into: a visible message plus metadata.
 * `?decline=<id>&reason=<key>` carries one of the six quick answers; the
 * server records the decline and re-cuts the path. docs/today.md → Handoffs.
 */
export function handoffMessage(params: URLSearchParams, titles: Record<string, string>): Handoff | null {
  for (const key of ["start", "decline", "breakdown"] as const) {
    const id = params.get(key);
    if (!id) continue;
    const title = titles[id] ?? "that";
    if (key === "decline") {
      const r = params.get("reason");
      const reason = isDeclineReason(r) ? r : undefined;
      return { text: declineMessageText(title, reason), kind: "declined", intentionId: id, reason };
    }
    if (key === "start") return { text: `Let's start: ${title}`, kind: "start_intention", intentionId: id };
    return { text: `Help me break this down: ${title}`, kind: "break_down", intentionId: id };
  }
  return null;
}

export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting, sittingStart, intentionTitles = {} }: Props) {
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
        void sendMessage({
          text: initialHandoff.text,
          metadata: { createdAt: new Date().toISOString(), kind: initialHandoff.kind, intentionId: initialHandoff.intentionId, ...(initialHandoff.reason ? { reason: initialHandoff.reason } : {}) },
        });
      }
      window.history.replaceState(null, "", "/");
    }, 50);
    return () => clearTimeout(t);
  }, [initialHandoff, prefill, sendMessage]);

  return (
    <div className="chat-page">
      <div className="chat-scroll">
        {kicker}
        {/* The greeting card marks where this sitting begins: earlier messages above it (scroll up), this visit below. */}
        <MessageList
          messages={messages}
          sittingStart={sittingStart}
          card={<GreetingCard lines={greetingLines} onQuickStart={send} compact={inSitting} />}
          thinking={status === "submitted"}
          error={error ? "I lost the thread for a second. Say that again?" : undefined}
        />
      </div>
      <Composer onSend={send} busy={busy} initialValue={prefill} />
    </div>
  );
}

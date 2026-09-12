"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionBar } from "@/components/focus/SessionBar";
import { declineMessageText, isDeclineReason, type DeclineReason } from "@/core/declines";
import type { LumenUIMessage } from "@/core/domain/conversations";
import type { SessionView } from "@/core/domain/sessions";
import { sessionEventText, sessionFromMessages, type SessionEventResponse } from "@/core/focus";
import { Composer } from "./Composer";
import { Greeting } from "./Greeting";
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
  /** The focus session running when the page opened, if any. */
  initialSession?: SessionView | null;
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

export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting, intentionTitles = {}, initialSession = null }: Props) {
  const params = useSearchParams();
  const handled = useRef(false);
  // Every page open is a fresh start: the greeting card sits after everything
  // that was there when the page opened, and what you say next goes below it.
  const [cardAt] = useState(initialMessages.length);
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

  // Focus Together: what the server said was running when the page opened,
  // then Lumi's start/end tool calls and the user's own Done / End taps as
  // they happen. `gone` covers the one case the transcript can't see — the
  // server closing it while this page sat idle.
  const [gone, setGone] = useState<string | null>(null);
  const liveSession = useMemo(() => sessionFromMessages(initialSession, messages.slice(cardAt)), [initialSession, messages, cardAt]);
  const session = liveSession && liveSession.id !== gone ? liveSession : null;
  const sessionEvent = (response: Exclude<SessionEventResponse, "ok">, minute: number) => {
    if (!session) return;
    send(sessionEventText(response), { kind: "session_event", sessionId: session.id, response, minute });
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
        {/* The greeting marks this page open, like a chapter head: the earlier conversation above it (scroll up), this visit below. */}
        <MessageList
          messages={messages}
          cardAt={cardAt}
          card={<Greeting lines={greetingLines} onQuickStart={send} compact={inSitting} />}
          thinking={status === "submitted"}
          error={error ? "I lost the thread for a second. Say that again?" : undefined}
        />
      </div>
      {session && <SessionBar session={session} busy={busy} quietKey={messages.length} onEvent={sessionEvent} onGone={setGone} />}
      <Composer onSend={send} busy={busy} initialValue={prefill} />
    </div>
  );
}

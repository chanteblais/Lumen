"use client";

import type { FileUIPart } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionBar } from "@/components/focus/SessionBar";
import { declineMessageText, isDeclineReason, type DeclineReason } from "@/core/declines";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import type { SessionView } from "@/core/domain/sessions";
import { sessionEventText, sessionFromMessages, type SessionEventResponse } from "@/core/focus";
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
  /** Titles for handoff messages (id → title), from the server. */
  intentionTitles?: Record<string, string>;
  /** The focus session running when the page opened, if any. */
  initialSession?: SessionView | null;
};

export type Handoff = { text: string; kind: "start_intention" | "declined" | "break_down"; intentionId: string; reason?: DeclineReason };

/**
 * What a link from Today/Library turns into: a visible message plus metadata.
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

/** Where the turn in flight began: its user message (the last one). */
function lastUserIndex(messages: CoherenceUIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "user") return i;
  return messages.length;
}

export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting, intentionTitles = {}, initialSession = null }: Props) {
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
  // A link from Today/Library (?start=<id> …) becomes the first message of this sitting.
  const initialHandoff = useMemo(() => handoffMessage(params, intentionTitles), [params, intentionTitles]);
  // Quick starts are for the moment of starting: shown until you've said
  // something this sitting, and again next time you come back.
  const [inSitting, setInSitting] = useState(initialInSitting || resumed || Boolean(initialHandoff));

  const send = (text: string, extra?: Record<string, unknown>, files?: FileUIPart[]) => {
    const trimmed = text.trim();
    if ((!trimmed && !files?.length) || busy) return;
    setInSitting(true);
    const metadata = { createdAt: new Date().toISOString(), ...(extra ?? {}) };
    // A photo with nothing said is a whole message too.
    void (trimmed ? sendMessage({ text: trimmed, files, metadata }) : sendMessage({ files: files ?? [], metadata }));
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
  // Arriving by a link while a turn you left is still arriving, it waits for that turn to land.
  const prefill = params.get("prefill") ?? "";
  useEffect(() => {
    if (handled.current || (!initialHandoff && !prefill) || busy) return;
    // Deferred so React's dev double-mount settles first.
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
  }, [initialHandoff, prefill, sendMessage, busy]);

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
      {session && <SessionBar session={session} busy={busy} quietKey={messages.length} onEvent={sessionEvent} onGone={setGone} />}
      <Composer onSend={(text, files) => send(text, undefined, files)} onStop={stop} busy={busy} initialValue={prefill} />
    </div>
  );
}

"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
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
};

export function Conversation({ conversationId, initialMessages, greetingLines, kicker, initialInSitting }: Props) {
  // Quick starts are for the moment of starting: shown until you've said
  // something this sitting, and again next time you come back.
  const [inSitting, setInSitting] = useState(initialInSitting);
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
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInSitting(true);
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString() } });
  };

  return (
    <div className="chat-page">
      <div className="chat-scroll">
        {kicker}
        <GreetingCard lines={greetingLines} onQuickStart={send} compact={inSitting} />
        <MessageList messages={messages} thinking={status === "submitted"} error={error ? "I lost the thread for a second. Say that again?" : undefined} />
      </div>
      <Composer onSend={send} busy={busy} />
    </div>
  );
}

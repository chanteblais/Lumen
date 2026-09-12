"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";
import type { RaliUIMessage } from "@/core/domain/conversations";
import { Composer } from "./Composer";
import { GreetingCard } from "./GreetingCard";
import { MessageList } from "./MessageList";

type Props = {
  conversationId: string;
  initialMessages: RaliUIMessage[];
  greetingLines: string[];
};

export function Conversation({ conversationId, initialMessages, greetingLines }: Props) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport<RaliUIMessage>({
        api: "/api/chat",
        // Send only the new message; the server holds the transcript.
        prepareSendMessagesRequest: ({ messages, id }) => ({ body: { id, message: messages[messages.length - 1] } }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat<RaliUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    generateId: () => crypto.randomUUID(),
  });

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString() } });
  };

  return (
    <>
      <GreetingCard lines={greetingLines} onQuickStart={send} compact={messages.length > 0} />
      <MessageList messages={messages} thinking={status === "submitted"} error={error ? "I lost the thread for a second. Say that again?" : undefined} />
      <Composer onSend={send} busy={busy} />
    </>
  );
}

"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Ledger } from "@/components/chat/Ledger";
import type { LumenUIMessage } from "@/core/domain/conversations";

type Props = { onClose: () => void; onSend?: () => void };

const LUMI_ERROR = "I lost the thread for a second. Say that again?";

/**
 * A speech bubble above the corner companion: say one thing to Lumi from any
 * page without leaving it. The message goes through the same `/api/chat`
 * route as the chat page (the server owns the transcript, so it lands in the
 * main conversation and is there when you next open Chat). Lumi's reply
 * shows here, with the ledger of what she did; once the turn has landed the
 * page refreshes so Today / Lists reflect any writes. Nothing to maintain:
 * Escape, a click outside or a click on Lumi closes it.
 *
 * Sending has to feel like it landed: what you said appears as a bubble that
 * slides in, the box says she's on it, and `onSend` lets Lumi blink.
 */
export function CompanionBubble({ onClose, onSend }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [said, setSaid] = useState<{ text: string; n: number } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const bubble = useRef<HTMLDivElement>(null);

  const [transport] = useState(
    () =>
      new DefaultChatTransport<LumenUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id }) => ({ body: { id, message: messages[messages.length - 1] } }),
      }),
  );
  const { messages, sendMessage, status, error } = useChat<LumenUIMessage>({ transport, generateId: () => crypto.randomUUID() });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => input.current?.focus(), []);

  const resize = () => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // Escape or a click anywhere else closes; the companion button toggles itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (bubble.current?.contains(t) || (t instanceof Element && t.closest(".companion-btn"))) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  // When a turn lands, refresh the page underneath so it reflects what Lumi did.
  const landed = useRef(false);
  useEffect(() => {
    if (busy) landed.current = true;
    else if (landed.current) {
      landed.current = false;
      // The route's after() may still be re-cutting today's path; give it a beat.
      const t = setTimeout(() => router.refresh(), 700);
      return () => clearTimeout(t);
    }
  }, [busy, router]);

  const send = () => {
    const text = value.trim();
    if (!text || busy) return;
    setSaid((s) => ({ text, n: (s?.n ?? 0) + 1 }));
    setValue("");
    requestAnimationFrame(resize);
    void sendMessage({ text, metadata: { createdAt: new Date().toISOString() } });
    onSend?.();
    input.current?.focus();
  };

  const reply = [...messages].reverse().find((m) => m.role === "assistant");
  const replyText = reply?.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div ref={bubble} className="companion-bubble" role="dialog" aria-label="Say something to Lumi">
      {said && (
        <div className="companion-exchange" aria-live="polite">
          <p key={said.n} className="companion-said">{said.text}</p>
          {status === "submitted" && (
            <p className="thinking-dots" aria-label="Lumi is thinking"><span>·</span><span>·</span><span>·</span></p>
          )}
          {error && <p className="text-ink-soft">{LUMI_ERROR}</p>}
          {reply && (replyText || reply.parts.some((p) => p.type.startsWith("tool-"))) && (
            <div className="companion-reply">
              {replyText?.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              <Ledger message={reply} />
            </div>
          )}
        </div>
      )}
      <form
        className="companion-form"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={input}
          rows={1}
          value={value}
          placeholder={busy ? "Lumi's on it…" : said ? "Anything else?" : "Tell Lumi…"}
          aria-label="Message Lumi"
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" className="send companion-send" aria-label="Send" disabled={value.trim().length === 0 || busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LUMI_LOST_THREAD, ThinkingDots, hasReply, latestReply, textOf, useAutoResize, useHeldChat } from "@/components/chat/chat-client";
import { Ledger } from "@/components/chat/Ledger";
import type { CoherenceUIMessage } from "@/core/domain/conversations";

type Props = { onClose: () => void; onSend?: () => void };

// Placement, in px (the CSS matches: .companion gap 14, bubble 330 wide).
const BUBBLE_W = 330;
const BUBBLE_GAP = 14;
const BUBBLE_MAX = 560;
const WINDOW_MARGIN = 24;
/** Less room than this above her and the bubble opens beside her instead. */
const ROOM_ABOVE = 300;

/** What you last said in this chat, if anything — shown again when the bubble reopens mid-turn. */
const lastSaid = (messages: CoherenceUIMessage[]) => {
  const said = [...messages].reverse().find((m) => m.role === "user");
  return said ? { text: textOf(said), n: 0 } : null;
};

/**
 * A speech bubble above the corner companion: say one thing to Lumi from any
 * page without leaving it. The message goes through the same `/api/chat`
 * route as Home (the server owns the transcript, so it lands in the
 * main conversation and is there when you next open Home). Lumi's reply
 * shows here, with the ledger of what she did; once the turn has landed the
 * page refreshes so Today / Library reflect any writes. Nothing to maintain:
 * Escape, a click outside or a click on Lumi closes it — and closing doesn't
 * stop her: the chat is held outside the bubble (`useHeldChat`), so a turn in
 * flight finishes, and reopening while she's still going shows it.
 *
 * Sending has to feel like it landed: what you said appears as a bubble that
 * slides in, the box says she's on it, and `onSend` lets Lumi blink.
 */
export function CompanionBubble({ onClose, onSend }: Props) {
  const [value, setValue] = useState("");
  const { messages, sendMessage, stop, status, error, busy } = useHeldChat("bubble");
  const [said, setSaid] = useState(() => lastSaid(messages));
  const { ref: input, resize } = useAutoResize();
  const bubble = useRef<HTMLDivElement>(null);

  // The bubble never runs off the window. Above her when there's room; where she
  // stands high in a painting (Today), beside her, growing down. Either way it is
  // capped (`--bubble-max`) and a long reply scrolls inside it, following her words
  // unless you've scrolled up to reread. Written to the DOM, not state: no re-render.
  useLayoutEffect(() => {
    const measure = () => {
      const el = bubble.current;
      const her = el?.parentElement?.querySelector(".companion-btn")?.getBoundingClientRect();
      if (!el || !her) return;
      const above = her.top - BUBBLE_GAP - WINDOW_MARGIN;
      const beside = window.innerWidth - her.right - BUBBLE_GAP - BUBBLE_W >= WINDOW_MARGIN ? "right" : "left";
      const side = above >= ROOM_ABOVE ? "above" : beside;
      const room = side === "above" ? above : window.innerHeight - her.top - WINDOW_MARGIN;
      el.dataset.side = side;
      el.style.setProperty("--bubble-max", `${Math.min(BUBBLE_MAX, room)}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const exchange = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => input.current?.focus(), [input]);

  // Escape or a click anywhere else closes; the companion button toggles itself.
  // Escape hands focus back to her button, where the bubble was opened from; a
  // click elsewhere leaves focus where you clicked.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const her = bubble.current?.parentElement?.querySelector<HTMLElement>(".companion-btn");
      onClose();
      her?.focus();
    };
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

  const send = () => {
    const text = value.trim();
    if (!text || busy) return;
    setSaid((s) => ({ text, n: (s?.n ?? 0) + 1 }));
    pinned.current = true;
    setValue("");
    requestAnimationFrame(resize);
    void sendMessage({ text, metadata: { createdAt: new Date().toISOString() } });
    onSend?.();
    input.current?.focus();
  };

  const reply = latestReply(messages);
  const replyText = reply ? textOf(reply) : undefined;

  useEffect(() => {
    const el = exchange.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [said, status, replyText, reply?.parts.length]);

  return (
    <div ref={bubble} className="companion-bubble" role="dialog" aria-label="Say something to Lumi">
      {said && (
        <div
          ref={exchange}
          className="companion-exchange"
          aria-live="polite"
          onScroll={(e) => {
            const el = e.currentTarget;
            pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
        >
          <p key={said.n} className="companion-said">{said.text}</p>
          {status === "submitted" && <ThinkingDots />}
          {error && <p className="text-ink-soft">{LUMI_LOST_THREAD}</p>}
          {reply && hasReply(reply) && (
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
        {/* While she talks, the send is a stop: it interrupts her and keeps what she'd said. */}
        {busy ? (
          <button type="button" className="companion-send" aria-label="Stop Lumi" onClick={() => void stop()}>
            <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
              <rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button type="submit" className="companion-send" aria-label="Send" disabled={value.trim().length === 0}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}

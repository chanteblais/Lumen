"use client";

import { useEffect, useRef } from "react";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import { describeGap, gapBucket } from "@/core/time";
import { Diamond } from "@/components/ui/Ornament";
import { LumiAvatar } from "./LumiAvatar";
import { Ledger } from "./Ledger";

type Props = {
  messages: CoherenceUIMessage[];
  /** How many messages were there when the page opened; the greeting card sits after them. */
  cardAt: number;
  /** The greeting card — rendered at `cardAt`, between the earlier conversation and this visit. */
  card: React.ReactNode;
  thinking?: boolean;
  error?: string;
};

const SIX_HOURS = 6 * 3_600_000;

/**
 * The transcript in two parts: everything from before this page open, then
 * the greeting card, then what is said now. The page opens on the card — the
 * chat feels fresh every time you come to it — and the earlier conversation
 * is one scroll up, untouched. From the first message onward it follows the
 * newest line, as any chat does.
 *
 * Below it, `.chat-scroll::after` leaves one view's height of nothing: it is
 * what lets the card sit at the top of the view when little follows it (and
 * stay put while Home's scroll rolls up), and it lets the whole conversation
 * be scrolled just out of sight.
 */
export function MessageList({ messages, cardAt, card, thinking, error }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  const fresh = messages.length <= cardAt && !thinking && !error;
  useEffect(() => {
    if (fresh) cardRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    else endRef.current?.scrollIntoView({ block: "end", behavior: firstScroll.current ? "auto" : "smooth" });
    firstScroll.current = false;
  }, [messages, fresh]);

  const earlier = render(messages.slice(0, cardAt));
  const current = render(messages.slice(cardAt));

  return (
    <section aria-label="Conversation">
      {earlier.length > 0 && (
        <div className="mb-10 flex flex-col gap-7" aria-label="Earlier">
          {earlier}
        </div>
      )}
      <div ref={cardRef}>{card}</div>
      <div className="chat-now mt-10 flex flex-col gap-7" aria-live="polite">
        {current}
        {thinking && (
          <div className="msg msg-lumi" aria-label="Lumi is thinking">
            <LumiAvatar size={36} className="msg-avatar" />
            <div className="msg-body"><p className="thinking-dots"><span>·</span><span>·</span><span>·</span></p></div>
          </div>
        )}
        {error && (
          <div className="msg msg-lumi">
            <LumiAvatar size={36} className="msg-avatar" />
            <div className="msg-body"><p className="text-ink-soft">{error}</p></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}

function render(messages: CoherenceUIMessage[]): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  let prevAt: Date | undefined;
  for (const m of messages) {
    const at = m.metadata?.createdAt ? new Date(m.metadata.createdAt) : undefined;
    if (at && prevAt && at.getTime() - prevAt.getTime() > SIX_HOURS) {
      items.push(<VisitRule key={`rule-${m.id}`} at={at} />);
    }
    if (at) prevAt = at;
    // One text part per block of speech: Lumi often says a line, acts (a tool
    // part), then says another. Each block is its own paragraph.
    const text = m.parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text.trim())
      .filter(Boolean)
      .join("\n\n");
    const hasTools = m.role === "assistant" && m.parts.some((p) => p.type.startsWith("tool-"));
    if (!text && !hasTools) continue;
    items.push(
      m.role === "user" ? (
        <div key={m.id} className="msg msg-user">
          <p>{text}</p>
        </div>
      ) : (
        <div key={m.id} className="msg msg-lumi">
          <LumiAvatar size={36} className="msg-avatar" />
          <div className="msg-body">
            {text.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <Ledger message={m} />
          </div>
        </div>
      ),
    );
  }
  return items;
}

function VisitRule({ at }: { at: Date }) {
  const now = new Date();
  const b = gapBucket(at, now);
  const label =
    b === "hours" || b === "just_now" || b === "minutes"
      ? "Earlier today"
      : b === "yesterday"
        ? "Yesterday"
        : describeGap(at, now).replace(/^about /, "").replace(/^\w/, (c) => c.toUpperCase());
  return (
    <div className="flex items-center gap-4 py-2" role="separator">
      <div className="rule flex-1" />
      <Diamond size={8} />
      <span className="label label-mute">{label}</span>
      <Diamond size={8} />
      <div className="rule flex-1" />
    </div>
  );
}

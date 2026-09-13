"use client";

import { useEffect, useRef } from "react";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import { describeGap, gapBucket } from "@/core/time";
import { Diamond } from "@/components/ui/Ornament";
import { ThinkingDots, hasReply, textOf } from "./chat-client";
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
 * is one scroll up, untouched. From the first message onward the new lines
 * start under the card where you're looking, and the view only moves once the
 * newest line would fall out of it — then it follows, as any chat does. (It
 * used to pin the newest line to the bottom straight away, which pulled the
 * card and the earlier conversation down the view on the first message.)
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
    const behavior = firstScroll.current ? "auto" : "smooth";
    firstScroll.current = false;
    if (fresh) {
      cardRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      return;
    }
    const end = endRef.current;
    const view = end?.closest(".chat-scroll");
    if (!end || !view) {
      end?.scrollIntoView({ block: "end", behavior });
      return;
    }
    // Follow only when the newest line is out of view: below the fold, or
    // above it after the conversation was scrolled out of sight.
    const at = end.getBoundingClientRect().bottom;
    const { top, bottom } = view.getBoundingClientRect();
    if (at > bottom || at < top) end.scrollIntoView({ block: "end", behavior });
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
      {/* data-opens-here: OPEN_ON_CARD_SCRIPT scrolls here before the first paint, ahead of the effect above. */}
      <div ref={cardRef} data-opens-here="">{card}</div>
      <div className="chat-now mt-10 flex flex-col gap-7" aria-live="polite">
        {current}
        {thinking && (
          <div className="msg msg-lumi" aria-label="Lumi is thinking">
            <LumiAvatar size={36} className="msg-avatar" />
            <div className="msg-body"><ThinkingDots label={null} /></div>
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
    // One paragraph per block of speech (`textOf`): Lumi often says a line, acts, then says another.
    const text = textOf(m);
    // A turn she stayed silent on (no words, no tools) shows nothing — no empty bubble.
    if (m.role === "assistant" ? !hasReply(m) : !text) continue;
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

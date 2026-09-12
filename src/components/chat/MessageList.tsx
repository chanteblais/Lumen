"use client";

import { useEffect, useRef } from "react";
import type { LumenUIMessage } from "@/core/domain/conversations";
import { describeGap, gapBucket } from "@/core/time";
import { Diamond } from "@/components/ui/Ornament";
import { LumiAvatar } from "./LumiAvatar";
import { Ledger } from "./Ledger";

type Props = {
  messages: LumenUIMessage[];
  /** Index where this sitting's messages begin (`sittingStartIndex`). */
  sittingStart: number;
  /** The greeting card — rendered at `sittingStart`, between earlier visits and this one. */
  card: React.ReactNode;
  thinking?: boolean;
  error?: string;
};

const SIX_HOURS = 6 * 3_600_000;

/**
 * The transcript in chapters: everything from earlier visits, then the
 * greeting card, then this sitting. A fresh visit opens on the card — the
 * chat feels new, and the old conversation is one scroll up. Once there is
 * something from this sitting, the page opens at the end as any chat does.
 */
export function MessageList({ messages, sittingStart, card, thinking, error }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  useEffect(() => {
    const fresh = firstScroll.current && messages.length <= sittingStart && !thinking;
    if (fresh) cardRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    else endRef.current?.scrollIntoView({ block: "end", behavior: firstScroll.current ? "auto" : "smooth" });
    firstScroll.current = false;
  }, [messages, sittingStart, thinking]);

  const earlier = render(messages.slice(0, sittingStart));
  const current = render(messages.slice(sittingStart));

  return (
    <section aria-label="Conversation">
      {earlier.length > 0 && (
        <div className="mb-10 flex flex-col gap-7" aria-label="Earlier">
          {earlier}
        </div>
      )}
      <div ref={cardRef}>{card}</div>
      <div className="mt-10 flex flex-col gap-7" aria-live="polite">
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

function render(messages: LumenUIMessage[]): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  let prevAt: Date | undefined;
  for (const m of messages) {
    const at = m.metadata?.createdAt ? new Date(m.metadata.createdAt) : undefined;
    if (at && prevAt && at.getTime() - prevAt.getTime() > SIX_HOURS) {
      items.push(<VisitRule key={`rule-${m.id}`} at={at} />);
    }
    if (at) prevAt = at;
    const text = m.parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("");
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

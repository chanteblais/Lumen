"use client";

import { useEffect, useRef } from "react";
import type { RaliUIMessage } from "@/core/domain/conversations";
import { describeGap, gapBucket } from "@/core/time";
import { RaliAvatar } from "./RaliAvatar";

type Props = { messages: RaliUIMessage[]; thinking?: boolean; error?: string };

const SIX_HOURS = 6 * 3_600_000;

export function MessageList({ messages, thinking, error }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: firstScroll.current ? "auto" : "smooth" });
    firstScroll.current = false;
  }, [messages, thinking]);

  if (messages.length === 0 && !thinking && !error) return null;

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
    if (!text) continue;
    items.push(
      m.role === "user" ? (
        <div key={m.id} className="msg msg-user">
          <p>{text}</p>
        </div>
      ) : (
        <div key={m.id} className="msg msg-rali">
          <RaliAvatar size={36} className="msg-avatar" />
          <div className="msg-body">
            {text.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      ),
    );
  }

  return (
    <section className="mt-10 flex flex-col gap-7" aria-live="polite" aria-label="Conversation">
      {items}
      {thinking && (
        <div className="msg msg-rali" aria-label="Rali is thinking">
          <RaliAvatar size={36} className="msg-avatar" />
          <div className="msg-body"><p className="thinking-dots"><span>·</span><span>·</span><span>·</span></p></div>
        </div>
      )}
      {error && (
        <div className="msg msg-rali">
          <RaliAvatar size={36} className="msg-avatar" />
          <div className="msg-body"><p className="text-ink-soft">{error}</p></div>
        </div>
      )}
      <div ref={endRef} />
    </section>
  );
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
      <span className="label label-mute">{label}</span>
      <div className="rule flex-1" />
    </div>
  );
}

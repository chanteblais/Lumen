"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { DECLINE_PROMPT, DECLINE_REASONS, type DeclineReason } from "@/core/declines";

type Props = {
  id: string;
  title: string;
  list: string | null;
  /** The list's tint on the Lists sheet (0–3). */
  tint: number | null;
  estimateMinutes: number | null;
  /** The path's first thing: marked Start here. */
  startHere?: boolean;
  /** Ten minutes or less — a quiet mark, worth knowing on a low day. */
  quick?: boolean;
  /** After a Not this: Lumi's one line on why this fits instead. */
  note?: string;
};

const DIDNT_TAKE = "That didn’t take. Once more?";

type View = "row" | "decline" | "reshaping";

/**
 * One row on Today's spine. The circle ticks it off; *Not this* is a quiet
 * word at the end of the row that opens the six quick answers in place. The
 * one tapped is recorded and the thing leaves today's path; if it was the
 * first, the next one moves up with Lumi's line on why it fits. Resistance
 * adapts the plan; it is never a failure. Nothing sends you to Home.
 * (Break it down and the *First* step line left Today on 2026-09-18, at
 * Chanté's call: a small thing isn't made easier by being cut smaller.)
 * docs/today.md → Anatomy.
 */
export function TodayRow({ id, title, list, tint, estimateMinutes, startHere = false, quick = false, note }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("row");
  const [trouble, setTrouble] = useState<string | null>(null);

  const decline = async (reason: DeclineReason) => {
    setView("reshaping");
    setTrouble(null);
    try {
      const r = await fetch(`/api/intentions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "decline", reason }) });
      if (!r.ok) throw new Error(String(r.status));
      // The row leaves the path; the list comes back without it.
      router.refresh();
    } catch {
      setView("decline");
      setTrouble(DIDNT_TAKE);
    }
  };

  return (
    <li className="today-row" data-start={startHere || undefined}>
      <div className="today-row-head">
        <CompleteCircle id={id} label={title} size={20} />
        <div className="today-row-main">
          {startHere && <p className="label today-start">Start here</p>}
          <p className="today-row-title">
            {title}
            {quick && <span className="today-quick">quick</span>}
          </p>
          {note && <p className="today-row-why font-display italic">{note}</p>}
        </div>
        {list ? (
          <span className="lists-tag today-row-tag" data-tint={tint ?? undefined}>
            {list}
          </span>
        ) : (
          <span className="today-row-tag" />
        )}
        <span className="today-row-est">{estimateMinutes ? `~${estimateMinutes} min` : ""}</span>
        <button type="button" className="tool-link today-row-not" onClick={() => setView(view === "decline" ? "row" : "decline")} aria-expanded={view === "decline"} aria-label={`Not this: ${title}`}>
          Not this
        </button>
      </div>

      {view === "reshaping" && (
        <p className="today-row-body today-now-working font-display italic" role="status">
          Taking it off today…
        </p>
      )}

      {view === "decline" && (
        <div className="today-row-body" role="group" aria-label={`Not this: ${title}`}>
          <p className="font-display text-[18px] leading-[1.3] text-ink">{DECLINE_PROMPT}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(Object.entries(DECLINE_REASONS) as [DeclineReason, string][]).map(([key, label]) => (
              <button key={key} type="button" className="chip" onClick={() => void decline(key)}>
                {label}
              </button>
            ))}
            <button type="button" className="tool-link ml-1" onClick={() => setView("row")}>
              Keep it
            </button>
          </div>
          {trouble && <p className="today-trouble" role="status">{trouble}</p>}
        </div>
      )}
    </li>
  );
}

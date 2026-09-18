"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  name: string;
  /** Their words: "go to the gym more". */
  content: string;
  /** How often, in their words, if they said. */
  cadence: string | null;
  /** The seven local dates of this week, Monday first. */
  week: string[];
  /** Local dates it happened on (this week and last). */
  practicedOn: string[];
  today: string;
  /** Where it would fit today, in words — "before practicum", "this afternoon" — or null when the day has no room or it already happened. */
  room: string | null;
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * One rhythm on Today (2026-09-18): the same circle every row on the page has,
 * for today — tick it and today's mark fills; tick again and it clears — then
 * the name, the week as seven small marks (filled on the days it happened,
 * today outlined, nothing for the days it didn't) and their words under it.
 * State and shape, never a count: no target, no streak, no misses.
 * docs/today.md → Anatomy → Rhythms.
 */
export function RhythmRow({ id, name, content, cadence, week, practicedOn, today, room }: Props) {
  const router = useRouter();
  const given = practicedOn.includes(today);
  const [doneToday, setDoneToday] = useState(given);
  const [seen, setSeen] = useState(given);
  // A fresh answer from the server replaces the local one (adjusted during render, no effect).
  if (seen !== given) {
    setSeen(given);
    setDoneToday(given);
  }
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !doneToday;
    setDoneToday(next);
    try {
      const r = await fetch(`/api/rhythms/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: next ? "practiced" : "unpracticed" }) });
      if (!r.ok) throw new Error(String(r.status));
      router.refresh();
    } catch {
      setDoneToday(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="today-rhythm">
      <div className="today-rhythm-head">
        <button
          type="button"
          onClick={() => void toggle()}
          className={`circle ${doneToday ? "is-done" : ""}`}
          style={{ width: 20, height: 20 }}
          aria-pressed={doneToday}
          aria-label={doneToday ? `Not today after all: ${name}` : `${name} today`}
          disabled={busy}
        >
          {doneToday && (
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
            </svg>
          )}
        </button>
        <div className="today-rhythm-main">
          <p className="today-rhythm-name">{name}</p>
          <p className="today-rhythm-words font-display italic">
            {content}
            {cadence ? ` · ${cadence}` : ""}
            {room && !doneToday ? <span className="today-rhythm-room"> · room {room}</span> : null}
          </p>
        </div>
        <ol className="today-week" aria-label={`${name} this week`}>
          {week.map((d, n) => {
            const happened = d === today ? doneToday : practicedOn.includes(d);
            const state = happened ? "happened" : d === today ? "today" : d > today ? "ahead" : "quiet";
            return (
              <li key={d} className="today-week-day" data-state={state} aria-label={`${DAY_NAMES[n]}${happened ? ", happened" : ""}`}>
                <span aria-hidden>{DAY_LETTERS[n]}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </li>
  );
}

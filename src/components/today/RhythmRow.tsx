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

/**
 * One rhythm on Today (2026-09-18): its name, the week as seven small marks
 * — filled on the days it happened, today outlined, nothing for the days it
 * didn't — their words under it, and one quiet word, *Did it*, for today.
 * A tap records today (`PATCH /api/rhythms/[id]`); tapping again takes it
 * back. State and shape, never a count: no target, no streak, no misses.
 * docs/today.md → Anatomy → Rhythms.
 */
export function RhythmRow({ id, name, content, cadence, week, practicedOn, today, room }: Props) {
  const router = useRouter();
  const [doneToday, setDoneToday] = useState(practicedOn.includes(today));
  const [given, setGiven] = useState(practicedOn.includes(today));
  if (given !== practicedOn.includes(today)) {
    setGiven(practicedOn.includes(today));
    setDoneToday(practicedOn.includes(today));
  }
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setTrouble(false);
    const next = !doneToday;
    setDoneToday(next);
    try {
      const r = await fetch(`/api/rhythms/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: next ? "practiced" : "unpracticed" }) });
      if (!r.ok) throw new Error(String(r.status));
      router.refresh();
    } catch {
      setDoneToday(!next);
      setTrouble(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="today-rhythm">
      <div className="today-rhythm-head">
        <p className="today-rhythm-name">{name}</p>
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
        <button type="button" className="tool-link today-rhythm-did" disabled={busy} onClick={() => void toggle()} aria-pressed={doneToday}>
          {doneToday ? "Did it" : trouble ? "Did it? Once more" : "Did it"}
        </button>
      </div>
      <p className="today-rhythm-words font-display italic">
        {content}
        {cadence ? ` · ${cadence}` : ""}
        {room && !doneToday ? <span className="today-rhythm-room"> · room {room}</span> : null}
      </p>
    </li>
  );
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

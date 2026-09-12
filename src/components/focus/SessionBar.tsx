"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionView } from "@/core/domain/sessions";
import { CHECK_IN_ANSWERS, checkInQuestion, elapsedLabel, nextCheckIn, type SessionEventResponse } from "@/core/focus";

type Props = {
  session: SessionView;
  /** A turn is streaming: taps that would send a message wait. */
  busy?: boolean;
  /** Something else happened in the conversation (a message went by): an open check-in steps aside. */
  quietKey?: number;
  /** A tap that reaches Lumi (stuck · distracted · done · end), with the session minute it happened at. */
  onEvent: (response: Exclude<SessionEventResponse, "ok">, minute: number) => void;
  /** The server says this session is no longer running. */
  onGone: (id: string) => void;
};

/**
 * Focus Together, on screen: what we're doing, the first step, elapsed over
 * planned, and End — pinned above the composer while a session runs. The
 * client timer asks *Still with it?* every check-in interval; Yep is an
 * event and nothing more (no model call), the other answers go to Lumi as a
 * message. Nothing here counts down, scores, or nags: one question, four
 * taps, then quiet again. docs/architecture.md → What is deterministic.
 */
export function SessionBar({ session, busy = false, quietKey = 0, onEvent, onGone }: Props) {
  // The clock the bar reads: moved along every half minute, so render stays pure.
  const [now, setNow] = useState(() => Date.now());
  // A check-in that fired, stamped with the conversation as it was then: once
  // something else is said (quietKey moves), the question steps aside on its own.
  const [fired, setFired] = useState<{ minute: number; quiet: number } | null>(null);
  const [sending, setSending] = useState(false);
  const quietRef = useRef(quietKey);
  useEffect(() => {
    quietRef.current = quietKey;
  }, [quietKey]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  // Check-ins at every interval from the start, strictly in the future — a
  // page opened mid-session waits for the next boundary rather than showing a stale one.
  const { id, startedAt, checkInMinutes } = session;
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const { at, minute } = nextCheckIn({ startedAt, checkInMinutes });
      t = setTimeout(() => {
        setFired({ minute, quiet: quietRef.current });
        setNow(Date.now());
        schedule();
      }, Math.max(0, at.getTime() - Date.now()));
    };
    schedule();
    return () => clearTimeout(t);
  }, [id, startedAt, checkInMinutes]);

  const due = fired && fired.quiet === quietKey ? fired : null;

  const answer = async (response: (typeof CHECK_IN_ANSWERS)[number]["response"]) => {
    if (!due || sending) return;
    const minute = due.minute;
    setFired(null);
    if (response !== "ok") return onEvent(response, minute);
    setSending(true);
    try {
      const r = (await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: session.id, response: "ok" }),
      }).then((x) => x.json())) as { ended?: boolean };
      if (r?.ended) onGone(session.id);
    } catch {
      // A missed tick is nothing to report; the next check-in comes on schedule.
    } finally {
      setSending(false);
    }
  };

  const end = () => onEvent("end", Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60_000)));

  return (
    <>
      {due && (
        <div className="session-checkin" role="group" aria-label="Check-in">
          <p className="session-question">{checkInQuestion(session, due.minute)}</p>
          <div className="flex flex-wrap items-center gap-2">
            {CHECK_IN_ANSWERS.map((a) => (
              <button key={a.response} type="button" className="chip" disabled={busy && a.response !== "ok"} onClick={() => void answer(a.response)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="session-bar" role="status" aria-label="Focus session">
        <div className="min-w-0">
          <p className="label">Together</p>
          <p className="session-goal">{session.goal}</p>
          <p className="session-step">First: {session.firstStep}</p>
        </div>
        <div className="session-side">
          <span className="label label-mute">{elapsedLabel(session, new Date(now))}</span>
          <button type="button" className="tool-link" disabled={busy} onClick={end}>
            End
          </button>
        </div>
      </div>
    </>
  );
}

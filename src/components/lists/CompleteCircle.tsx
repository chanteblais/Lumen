"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; done?: boolean; label: string; size?: number };

/**
 * The one control on a row: done / not done. Optimistic, then refresh; a tick
 * that doesn't land springs back. When a refresh brings a different answer for
 * the same row (ticked in the other view, or by Lumi), the circle follows it.
 */
export function CompleteCircle({ id, done = false, label, size = 26 }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [isDone, setIsDone] = useState(done);
  // What the page last said; a new answer from the server replaces the local one (adjusted during render, no effect).
  const [given, setGiven] = useState(done);
  if (given !== done) {
    setGiven(done);
    setIsDone(done);
  }

  const toggle = async () => {
    if (state === "busy") return;
    setState("busy");
    const next = !isDone;
    setIsDone(next);
    try {
      const r = await fetch(`/api/intentions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: next ? "complete" : "reopen" }) });
      if (!r.ok) setIsDone(!next);
      else router.refresh();
    } catch {
      setIsDone(!next);
    } finally {
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`circle ${isDone ? "is-done" : ""}`}
      style={{ width: size, height: size }}
      aria-pressed={isDone}
      aria-label={isDone ? `Reopen: ${label}` : `Done: ${label}`}
      disabled={state === "busy"}
    >
      {isDone && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
        </svg>
      )}
    </button>
  );
}

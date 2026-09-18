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
  /** The first step, when there is one: the path's for its first thing, otherwise the thing's own next action. */
  firstStep: string | null;
  /** The path's first thing: marked Start here, its first step already open. */
  startHere?: boolean;
  /** Ten minutes or less — a quiet mark, worth knowing on a low day. */
  quick?: boolean;
  /** After a Not this: Lumi's one line on why this fits instead. */
  note?: string;
};

/** Lumi's line over the pieces of a broken-down thing. Fixed copy; only the steps come from the model. */
const STEPS_PROMPT = "Smaller pieces. Tap the one you’ll start with.";
const DIDNT_TAKE = "That didn’t take. Once more?";

type View = "closed" | "open" | "decline" | "reshaping" | "steps";

/**
 * One row of Suggested for today (2026-09-18: Today at a glance; there is no
 * Right now card). The circle ticks it off. The chevron opens the row in place:
 * its first step, then
 * - Not this: the six quick answers. The one tapped is recorded and the thing
 *   leaves today's path; if it was the first, the next one moves up with Lumi's
 *   line on why it fits. Resistance adapts the plan; it is never a failure.
 * - Break it down: Lumi's few small steps; the one tapped becomes its first step.
 *   Smaller still breaks them down again.
 * Nothing sends you to Home. docs/today.md → Anatomy.
 */
export function TodayRow({ id, title, list, tint, estimateMinutes, firstStep, startHere = false, quick = false, note }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("closed");
  const [steps, setSteps] = useState<string[] | null>(null);
  const [asked, setAsked] = useState<string[] | undefined>(undefined);
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = async (body: object) => {
    const r = await fetch(`/api/intentions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(String(r.status));
  };

  const back = () => {
    setView("open");
    setSteps(null);
    setTrouble(null);
  };

  const decline = async (reason: DeclineReason) => {
    setView("reshaping");
    setTrouble(null);
    try {
      await patch({ action: "decline", reason });
      // The row leaves the path; the list comes back without it.
      router.refresh();
    } catch {
      setView("decline");
      setTrouble(DIDNT_TAKE);
    }
  };

  const breakDown = async (smallerThan?: string[]) => {
    setView("steps");
    setSteps(null);
    setAsked(smallerThan);
    setTrouble(null);
    try {
      const r = await fetch(`/api/intentions/${id}/steps`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(smallerThan ? { smallerThan } : {}) });
      if (!r.ok) throw new Error(String(r.status));
      const data = (await r.json()) as { steps?: string[] };
      if (!data.steps?.length) throw new Error("no steps");
      setSteps(data.steps);
    } catch {
      setSteps(smallerThan ?? []);
      setTrouble("I lost the thread for a second.");
    }
  };

  const choose = async (step: string) => {
    setBusy(true);
    setTrouble(null);
    try {
      await patch({ action: "first_step", text: step });
      back();
      router.refresh();
    } catch {
      setTrouble(DIDNT_TAKE);
    } finally {
      setBusy(false);
    }
  };

  const isOpen = view !== "closed";

  return (
    <li className="today-row" data-open={isOpen || undefined} data-start={startHere || undefined}>
      <div className="today-row-head">
        <CompleteCircle id={id} label={title} size={20} />
        <div className="today-row-main">
          {startHere && <p className="label today-start">Start here</p>}
          <p className="today-row-title">
            {title}
            {quick && <span className="today-quick">quick</span>}
          </p>
          {note && <p className="today-row-why font-display italic">{note}</p>}
          {/* The first thing's step is open before any tap: the threshold, already in view. */}
          {startHere && !isOpen && firstStep && (
            <p className="today-first">
              <span className="label label-mute mr-2">First</span>
              {firstStep}
            </p>
          )}
        </div>
        {list ? (
          <span className="lists-tag today-row-tag" data-tint={tint ?? undefined}>
            {list}
          </span>
        ) : (
          <span className="today-row-tag" />
        )}
        <span className="today-row-est">{estimateMinutes ? `~${estimateMinutes} min` : ""}</span>
        <button
          type="button"
          className="today-row-toggle"
          aria-expanded={isOpen}
          aria-label={isOpen ? `Close: ${title}` : `Open: ${title}`}
          onClick={() => (isOpen ? setView("closed") : back())}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
            <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {isOpen && <div className="today-row-body">{body()}</div>}
    </li>
  );

  function body() {
    if (view === "reshaping") {
      return (
        <p className="today-now-working font-display italic" role="status">
          Taking it off today…
        </p>
      );
    }

    if (view === "decline") {
      return (
        <div role="group" aria-label={`Not this: ${title}`}>
          <p className="font-display text-[18px] leading-[1.3] text-ink">{DECLINE_PROMPT}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(Object.entries(DECLINE_REASONS) as [DeclineReason, string][]).map(([key, label]) => (
              <button key={key} type="button" className="chip" onClick={() => void decline(key)}>
                {label}
              </button>
            ))}
            <button type="button" className="tool-link ml-1" onClick={back}>
              Keep it
            </button>
          </div>
          {trouble && <p className="today-trouble" role="status">{trouble}</p>}
        </div>
      );
    }

    if (view === "steps") {
      if (steps === null) {
        return (
          <p className="thinking-dots" aria-label="Lumi is breaking it down" aria-busy>
            <span>·</span>
            <span>·</span>
            <span>·</span>
          </p>
        );
      }
      return (
        <div role="group" aria-label={`Break it down: ${title}`}>
          {steps.length > 0 && (
            <>
              <p className="font-display text-[17px] leading-[1.3] text-ink">{STEPS_PROMPT}</p>
              <ul className="today-steps">
                {steps.map((s) => (
                  <li key={s}>
                    <button type="button" className="today-step" disabled={busy} onClick={() => void choose(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {trouble && <p className="today-trouble" role="status">{trouble}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {steps.length === 0 ? (
              <button type="button" className="tool-link" onClick={() => void breakDown(asked)}>
                Try again
              </button>
            ) : (
              <button type="button" className="tool-link" disabled={busy} onClick={() => void breakDown(steps)}>
                Smaller still
              </button>
            )}
            <button type="button" className="tool-link" disabled={busy} onClick={back}>
              Keep it as it is
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {firstStep && (
          <p className="today-first">
            <span className="label label-mute mr-2">First</span>
            {firstStep}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button type="button" className="tool-link" onClick={() => setView("decline")}>
            Not this
          </button>
          <button type="button" className="tool-link" onClick={() => void breakDown()}>
            Break it down
          </button>
        </div>
      </>
    );
  }
}

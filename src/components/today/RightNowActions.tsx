"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DECLINE_PROMPT, DECLINE_REASONS, type DeclineReason } from "@/core/declines";

type Props = { id: string; title: string };

/** Lumi's line over the pieces of a broken-down thing. Fixed copy; only the steps come from the model. */
const STEPS_PROMPT = "Smaller pieces. Tap the one you’ll start with.";
const DIDNT_TAKE = "That didn’t take. Once more?";

type View = "actions" | "decline" | "reshaping" | "steps";

/**
 * Right now's controls — all of it happens on the day sheet; nothing sends you
 * to Home (2026-09-13). Small words under the first row, not the page's centre
 * (2026-09-18: Today is the day at a glance).
 * - Done: ticks it off, and the path moves on.
 * - Not this: the six quick answers in place. The one tapped is recorded, the
 *   path is re-cut around it, and Right now comes back with what fits instead,
 *   with Lumi's line on why. Resistance adapts the plan; it is never a failure.
 * - Break it down: only when asked, Lumi's few small steps in place; the one
 *   tapped becomes the first step. Smaller still breaks them down again.
 * docs/today.md → Anatomy.
 */
export function RightNowActions({ id, title }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("actions");
  const [steps, setSteps] = useState<string[] | null>(null);
  const [asked, setAsked] = useState<string[] | undefined>(undefined);
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"idle" | "busy" | "failed">("idle");

  const patch = async (body: object) => {
    const r = await fetch(`/api/intentions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(String(r.status));
  };

  const back = () => {
    setView("actions");
    setSteps(null);
    setTrouble(null);
  };

  const decline = async (reason: DeclineReason) => {
    setView("reshaping");
    setTrouble(null);
    try {
      await patch({ action: "decline", reason });
      // The card remounts on the new Right now (it is keyed by the intention).
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

  // Done is a quiet word beside the others, not a circle in front of the title.
  const complete = async () => {
    setDone("busy");
    try {
      await patch({ action: "complete" });
      router.refresh();
    } catch {
      setDone("failed");
    }
  };

  if (view === "reshaping") {
    return (
      <p className="today-now-working mt-4 font-display italic" role="status">
        Finding something that fits…
      </p>
    );
  }

  if (view === "decline") {
    return (
      <div className="mt-4" role="group" aria-label={`Not this: ${title}`}>
        <p className="font-display text-[19px] leading-[1.3] text-ink">{DECLINE_PROMPT}</p>
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
        <div className="mt-4" aria-busy>
          <p className="thinking-dots" aria-label="Lumi is breaking it down">
            <span>·</span>
            <span>·</span>
            <span>·</span>
          </p>
        </div>
      );
    }
    return (
      <div className="mt-4" role="group" aria-label={`Break it down: ${title}`}>
        {steps.length > 0 && (
          <>
            <p className="font-display text-[18px] leading-[1.3] text-ink">{STEPS_PROMPT}</p>
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
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
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
    <div className="today-actions mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <button type="button" className="tool-link" disabled={done === "busy"} onClick={() => void complete()} aria-label={`Done: ${title}`}>
        {done === "failed" ? "Done? Once more" : "Done"}
      </button>
      <button type="button" className="tool-link" onClick={() => setView("decline")}>
        Not this
      </button>
      <button type="button" className="tool-link today-quiet" onClick={() => void breakDown()}>
        Break it down
      </button>
    </div>
  );
}

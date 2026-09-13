"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = { id: string; content: string; provenance: string };

const FAILED = "That didn't save. Try again?";

/** Where keyboard focus goes after the next render, when the control that had it has just been replaced. */
type Refocus = "correct" | "forget" | "keep" | "forgotten";

/**
 * One thing Lumi holds: read it, correct it in place, or forget it — asked
 * once, because forgetting can't be undone.
 *
 * Focus never drops to the page: opening the question moves it to Keep (the
 * safe answer), Keep and Cancel (or Escape while correcting) hand it back to
 * the link you came from, and Forget moves it to "Forgotten." — announced by a
 * status line that was there from the start — then, once the refresh takes
 * the row away, on to the neighbouring belief.
 */
export function MemoryItem({ id, content, provenance }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState<string | null>(null);

  const item = useRef<HTMLLIElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const correctButton = useRef<HTMLButtonElement>(null);
  const forgetButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const refocus = useRef<Refocus | null>(null);
  // After Forget: whether "Forgotten." still holds focus, and the neighbour's first control to pass it to when the row goes.
  const handoff = useRef<{ holding: boolean; next: HTMLElement | null }>({ holding: false, next: null });

  useEffect(() => {
    const which = refocus.current;
    if (!which) return;
    refocus.current = null;
    ({ correct: correctButton, forget: forgetButton, keep: keepButton, forgotten: status })[which].current?.focus();
  });

  useEffect(() => {
    const plan = handoff.current;
    return () => {
      const now = document.activeElement;
      if (plan.holding && (!now || now === document.body) && plan.next?.isConnected) plan.next.focus();
    };
  }, []);

  const send = async (method: "PATCH" | "DELETE") => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/beliefs/${id}`, {
        method,
        ...(method === "PATCH" ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ content: draft.trim() }) } : {}),
      });
      const out = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(out.error ?? FAILED);
        return;
      }
      if (method === "DELETE") {
        const li = item.current;
        const neighbour = li?.nextElementSibling ?? li?.previousElementSibling;
        handoff.current.next = neighbour?.querySelector<HTMLElement>("button") ?? null;
        refocus.current = "forgotten";
        setGone(true);
      } else {
        refocus.current = "correct";
        setEditing(false);
      }
      // A correction comes back as a new row (new id): the page re-renders with it.
      router.refresh();
    } catch {
      setError(FAILED);
    } finally {
      setBusy(false);
    }
  };

  const cancelEditing = () => {
    setDraft(content);
    setEditing(false);
    setError(null);
    refocus.current = "correct";
  };

  return (
    <li ref={item} className="row">
      {/* Mounted from the start (empty, visually hidden) so "Forgotten." is announced when it arrives. */}
      <p
        ref={status}
        role="status"
        tabIndex={-1}
        className={gone ? "text-[14px] tracking-[0.02em] text-ink-mute" : "sr-only"}
        onFocus={() => (handoff.current.holding = true)}
        onBlur={() => (handoff.current.holding = false)}
      >
        {gone && (
          <>
            <span className="ledger-mark">✦</span>
            Forgotten.
          </>
        )}
      </p>
      {!gone && (
        <>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim() && draft.trim() !== content) void send("PATCH");
                else cancelEditing();
              }}
            >
              <label className="sr-only" htmlFor={`belief-${id}`}>
                Correct what Lumi holds
              </label>
              <textarea
                id={`belief-${id}`}
                rows={2}
                maxLength={240}
                value={draft}
                disabled={busy}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") return;
                  e.preventDefault();
                  cancelEditing();
                }}
                className="w-full resize-none rounded-[6px] border border-ink-mute/40 bg-card px-3 py-2 font-display text-[21px] leading-[1.35] text-ink focus:border-brass focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="submit" className="chip" disabled={busy}>
                  Save
                </button>
                <button type="button" className="tool-link ml-1" disabled={busy} onClick={cancelEditing}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="font-display text-[22px] leading-[1.3] text-ink">{content}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="label label-mute">{provenance}</p>
            {!editing && !confirming && (
              <>
                <button ref={correctButton} type="button" className="tool-link" onClick={() => setEditing(true)}>
                  Correct
                </button>
                <button
                  ref={forgetButton}
                  type="button"
                  className="tool-link"
                  onClick={() => {
                    refocus.current = "keep";
                    setConfirming(true);
                  }}
                >
                  Forget
                </button>
              </>
            )}
            {confirming && (
              <span role="group" aria-label="Forget this for good?" className="flex flex-wrap items-center gap-3">
                <span className="text-[15px] text-ink-soft">Forget this for good?</span>
                <button type="button" className="chip" disabled={busy} onClick={() => send("DELETE")}>
                  Forget
                </button>
                <button
                  ref={keepButton}
                  type="button"
                  className="tool-link"
                  disabled={busy}
                  onClick={() => {
                    refocus.current = "forget";
                    setConfirming(false);
                  }}
                >
                  Keep
                </button>
              </span>
            )}
          </div>
          {error && (
            <p className="mt-2 text-[15px] text-ink-soft" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </li>
  );
}

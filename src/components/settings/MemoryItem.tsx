"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; content: string; provenance: string };

const FAILED = "That didn't save. Try again?";

/** One thing Lumi holds: read it, correct it in place, or forget it — asked once, because forgetting can't be undone. */
export function MemoryItem({ id, content, provenance }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState<string | null>(null);

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
      if (method === "DELETE") setGone(true);
      else setEditing(false);
      // A correction comes back as a new row (new id): the page re-renders with it.
      router.refresh();
    } catch {
      setError(FAILED);
    } finally {
      setBusy(false);
    }
  };

  if (gone) {
    return (
      <li className="row">
        <p className="text-[14px] tracking-[0.02em] text-ink-mute" aria-live="polite">
          <span className="ledger-mark">✦</span>
          Forgotten.
        </p>
      </li>
    );
  }

  return (
    <li className="row">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim() && draft.trim() !== content) void send("PATCH");
            else setEditing(false);
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
            className="w-full resize-none rounded-[6px] border border-ink-mute/40 bg-card px-3 py-2 font-display text-[21px] leading-[1.35] text-ink focus:border-brass focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="chip" disabled={busy}>
              Save
            </button>
            <button
              type="button"
              className="tool-link ml-1"
              disabled={busy}
              onClick={() => {
                setDraft(content);
                setEditing(false);
                setError(null);
              }}
            >
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
            <button type="button" className="tool-link" onClick={() => setEditing(true)}>
              Correct
            </button>
            <button type="button" className="tool-link" onClick={() => setConfirming(true)}>
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
            <button type="button" className="tool-link" disabled={busy} onClick={() => setConfirming(false)}>
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
    </li>
  );
}

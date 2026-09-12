"use client";

import { QUICK_STARTS } from "@/core/ai/persona";

type Props = { onPick?: (text: string) => void };

export function QuickStarts({ onPick }: Props) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      {QUICK_STARTS.map((s) => (
        <button key={s} type="button" className="chip" onClick={() => onPick?.(s)}>
          {s}
        </button>
      ))}
      <button type="button" className="icon-btn" aria-label="Another way in" title="Another way in" onClick={() => onPick?.("I don't know where to start.")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v5h-5" />
        </svg>
      </button>
    </div>
  );
}

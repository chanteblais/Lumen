"use client";

const STARTS = ["Help me choose", "Break it down", "Body double", "Just talk"] as const;

export function QuickStarts() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      {STARTS.map((s) => (
        <button key={s} type="button" className="chip">
          {s}
        </button>
      ))}
      <button type="button" className="icon-btn" aria-label="Another way in" title="Another way in">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v5h-5" />
        </svg>
      </button>
    </div>
  );
}

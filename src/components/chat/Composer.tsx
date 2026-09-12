"use client";

import { useRef, useState } from "react";

export function Composer() {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="mt-auto pt-10">
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault(); // M2 wires this to /api/chat
        }}
      >
        <button type="button" className="icon-btn h-[60px] w-[60px] shrink-0" aria-label="Add">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder="Message Rali…"
          aria-label="Message Rali"
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
        />
        <button type="submit" className="send shrink-0" aria-label="Send" disabled={value.trim().length === 0}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-9">
          <button type="button" className="tool-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L16 6.5" />
            </svg>
            Add file
          </button>
          <button type="button" className="tool-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
            Voice
          </button>
          <button type="button" className="tool-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
              <circle cx="9" cy="7" r="1.6" fill="var(--card)" />
              <circle cx="15" cy="12" r="1.6" fill="var(--card)" />
              <circle cx="8" cy="17" r="1.6" fill="var(--card)" />
            </svg>
            Tools
          </button>
        </div>
        <span className="label label-mute">You don&rsquo;t have to do it alone.</span>
      </div>
    </div>
  );
}

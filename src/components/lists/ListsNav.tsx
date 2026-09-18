"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Sparkle, Tailpiece } from "@/components/ui/Ornament";
import type { ListsShown } from "@/core/domain/lists-view";
import { AllGlyph, DoneGlyph, ListNameGlyph, SoonGlyph, TodayGlyph } from "./ListGlyphs";

type View = { key: ListsShown; label: string; icon: ReactNode };
type Props = { lists: string[]; shown: ListsShown; onShow: (shown: ListsShown) => void };

/** The views the sheet offers: All, each of the user's lists, Completed; and the two quick views. */
function views(lists: string[]): { tabs: View[]; quick: View[] } {
  return {
    tabs: [
      { key: "all", label: "All", icon: <AllGlyph /> },
      ...lists.map((name) => ({ key: `list:${name}` as ListsShown, label: name, icon: <ListNameGlyph name={name} className={`lists-g-${name.toLowerCase()}`} /> })),
      { key: "done", label: "Completed", icon: <DoneGlyph className="lists-g-done" /> },
    ],
    quick: [
      { key: "today", label: "Today", icon: <TodayGlyph /> },
      { key: "soon", label: "Due soon", icon: <SoonGlyph /> },
    ],
  };
}

/**
 * Across the top: the views, then the quick views (which show here only on a phone, where the side column goes).
 * While tabs run past the right edge the strip carries `data-more`, and fades out there (globals.css).
 */
export function ListsTabs({ lists, shown, onShow }: Props) {
  const { tabs, quick } = views(lists);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const mark = () => el.toggleAttribute("data-more", el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    mark();
    el.addEventListener("scroll", mark, { passive: true });
    const resized = new ResizeObserver(mark);
    resized.observe(el);
    return () => {
      el.removeEventListener("scroll", mark);
      resized.disconnect();
    };
  }, [lists]);
  return (
    <div ref={strip} className="lists-tabs" role="group" aria-label="Show">
      <Sparkle size={10} className="lists-tabs-mark" />
      {[...tabs, ...quick].map((t) => (
        <button
          key={t.key}
          type="button"
          className={t.key === "today" || t.key === "soon" ? "lists-tab lists-tab-quick" : "lists-tab"}
          aria-pressed={shown === t.key}
          onClick={() => onShow(t.key)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Beside the rows: the same views as the tabs, always in agreement with them, and the quick views under their own head. */
export function ListsSide({ lists, shown, onShow }: Props) {
  const { tabs, quick } = views(lists);
  return (
    <aside className="lists-side" aria-label="Views">
      <ul>
        {tabs.map((t) => (
          <li key={t.key}>
            <button type="button" className="lists-side-item" aria-pressed={shown === t.key} onClick={() => onShow(t.key)}>
              {t.icon}
              {t.key === "all" ? "All tasks" : t.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="font-display lists-side-head">Quick views</p>
      <ul>
        {quick.map((t) => (
          <li key={t.key}>
            <button type="button" className="lists-side-item" aria-pressed={shown === t.key} onClick={() => onShow(t.key)}>
              {t.icon}
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      <Tailpiece className="lists-side-tail" />
    </aside>
  );
}

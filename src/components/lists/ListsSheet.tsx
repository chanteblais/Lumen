"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SprigIcon } from "@/components/shell/NavIcons";
import { Sparkle } from "@/components/ui/Ornament";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
import { emptyLine, listTint, shownHeading, shownList, shownRows, type ListsShown, type ListsView } from "@/core/domain/lists-view";
import { AddLine } from "./AddLine";
import { CloseGlyph, PlusGlyph, SearchGlyph } from "./ListGlyphs";
import { ListsSide, ListsTabs } from "./ListsNav";
import { ListRow } from "./ListsRow";

/**
 * Lists: a sheet of parchment with everything on the user's lists, after
 * `art/mockups/lists-mockup.png`. From the nav it opens over the page you were
 * on and × (or Escape, or a click beside it) goes back there; opened directly
 * at /lists it sits over the Library's room and × goes to the Library.
 *
 * What it asks of you is only what you choose to do: tick something off, move
 * it to another list, let it go, or tell Lumi something to add — she files it.
 * No counts, no overdue, no sort or filter to set (docs/ef-burden-log.md).
 *
 * This file is the dialog: what it shows (`core/domain/lists-view.ts` picks the
 * rows, heading and empty line), its keyboard focus, and closing. The views are
 * `ListsNav`, a row and its ⋯ `ListsRow`, the date `DateCell`, Add task `AddLine`.
 */
export function ListsSheet({ view, over }: { view: ListsView; over: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shown, setShown] = useState<ListsShown>("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  // What's been let go while the sheet is open. Held here, not in the row, so a
  // view change or a search doesn't bring the row back (or offer to let it go twice).
  const [letGo, setLetGo] = useState<ReadonlySet<string>>(() => new Set());
  const sheet = useRef<HTMLElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  // From the nav the sheet is a parallel slot, which keeps its last state as you move on; it only shows at /lists.
  const active = !over || pathname === "/lists";

  const close = useCallback(() => (over ? router.back() : router.push("/library")), [over, router]);

  // Focus moves into the sheet, Tab stays inside it, and closing hands focus back (the nav's list icon).
  useDialogFocus(sheet, active);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, close]);

  if (!active) return null;

  const inList = shownList(shown);
  const rows = shownRows(view, shown, query);
  const foldAdd = () => {
    setAdding(false);
    addButton.current?.focus();
  };

  return (
    <div className="lists-veil" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section ref={sheet} className="lists-sheet" role="dialog" aria-modal="true" aria-labelledby="lists-title" tabIndex={-1}>
        <button type="button" className="lists-close" onClick={close} aria-label="Close Lists">
          <CloseGlyph />
        </button>
        <Sparkle size={10} className="lists-corner lists-corner-bl" />
        <Sparkle size={10} className="lists-corner lists-corner-br" />

        <header className="lists-head">
          <SprigIcon className="lists-mark" />
          <div>
            <h1 id="lists-title" className="font-display lists-title">Lists</h1>
            <p className="font-display lists-tagline">All the moving pieces, in one place.</p>
          </div>
          <div className="lists-tools">
            <label className="lists-search">
              <SearchGlyph />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" aria-label="Search your lists" />
            </label>
            <button ref={addButton} type="button" className="lists-add" onClick={() => setAdding(true)} aria-expanded={adding}>
              <PlusGlyph /> Add task
            </button>
          </div>
        </header>

        {adding && <AddLine onClose={foldAdd} />}

        <ListsTabs lists={view.lists} shown={shown} onShow={setShown} />

        <div className="lists-body">
          <Sparkle size={9} className="lists-body-mark" />
          <ListsSide lists={view.lists} shown={shown} onShow={setShown} />

          <div className="lists-main">
            <h2 className="font-display lists-heading">{shownHeading(shown)}</h2>
            {rows.length === 0 ? (
              <p className="lists-empty">{emptyLine(shown, query)}</p>
            ) : (
              <ul>
                {rows.map((r) => (
                  <ListRow
                    key={r.id}
                    row={r}
                    lists={view.lists}
                    showList={inList === null}
                    tint={listTint(view, r.list)}
                    gone={letGo.has(r.id)}
                    onLetGo={(id) => setLetGo((s) => new Set(s).add(id))}
                    onUndo={(id) =>
                      setLetGo((s) => {
                        const next = new Set(s);
                        next.delete(id);
                        return next;
                      })
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

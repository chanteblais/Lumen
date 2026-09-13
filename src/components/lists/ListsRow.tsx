"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UNSORTED, type ListsRow } from "@/core/domain/lists-view";
import { CompleteCircle } from "./CompleteCircle";
import { DateCell } from "./DateCell";
import { MoreGlyph } from "./ListGlyphs";

/** One PATCH to an intention from the sheet; true when it landed. */
async function patchIntention(id: string, body: object): Promise<boolean> {
  try {
    const r = await fetch(`/api/intentions/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return r.ok;
  } catch {
    return false;
  }
}

type Props = {
  row: ListsRow;
  lists: string[];
  /** Whether the row shows its list's tag (not inside a single list). */
  showList: boolean;
  tint?: string;
  /** Let go while the sheet is open: the row reads "Let go: title." with Undo. Held by the sheet, so a view change doesn't bring it back. */
  gone: boolean;
  onLetGo: (id: string) => void;
  onUndo: (id: string) => void;
};

/**
 * A row: tick it off, the title and next step, its list, its date, and the ⋯.
 * A move, a let-go or an undo that doesn't land says so in one quiet line under
 * the title (as the date does), rather than silently doing nothing.
 */
export function ListRow({ row, lists, showList, tint, gone, onLetGo, onUndo }: Props) {
  const router = useRouter();
  const [failed, setFailed] = useState<string | null>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  // Focus follows a let-go to its Undo — but only then, not when a view change remounts a row already let go.
  const focusUndo = useRef(false);
  const className = `lists-row${showList ? "" : " is-single"}${row.done ? " is-done" : ""}`;

  useEffect(() => {
    if (!gone || !focusUndo.current) return;
    focusUndo.current = false;
    undoButton.current?.focus();
  }, [gone]);

  if (gone) {
    const undo = async () => {
      setFailed(null);
      if (!(await patchIntention(row.id, { action: "reopen" }))) return setFailed("Didn’t undo. Once more?");
      onUndo(row.id);
      router.refresh();
    };
    return (
      <li className={className}>
        <span />
        <p className="lists-gone">
          Let go: {row.title}.
          <button ref={undoButton} type="button" onClick={() => void undo()}>
            Undo
          </button>
          <span className="lists-row-hint" role="status">
            {failed}
          </span>
        </p>
      </li>
    );
  }

  return (
    <li className={className}>
      <CompleteCircle id={row.id} done={row.done} label={row.title} size={24} />
      <div className="min-w-0">
        <p className="lists-row-title">{row.title}</p>
        {row.nextAction && <p className="lists-row-next">{row.nextAction}</p>}
        <p className="lists-row-hint" role="status">
          {failed}
        </p>
      </div>
      {showList && (
        <span className="lists-tag" data-tint={tint}>
          {row.list}
        </span>
      )}
      <DateCell row={row} />
      {row.done ? (
        <span />
      ) : (
        <RowMenu
          row={row}
          lists={lists}
          onFailed={setFailed}
          onMoved={() => router.refresh()}
          onLetGo={() => {
            focusUndo.current = true;
            onLetGo(row.id);
          }}
        />
      )}
    </li>
  );
}

/**
 * The ⋯ on a row: corrections only — another list, or let it go. Each teaches
 * Lumi what the move was (events carry `via: "app"`). A plain disclosure of
 * buttons, not an ARIA menu: Tab reaches them in order, Escape folds it back to the ⋯.
 */
function RowMenu({ row, lists, onFailed, onMoved, onLetGo }: { row: ListsRow; lists: string[]; onFailed: (line: string | null) => void; onMoved: () => void; onLetGo: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Captured first, so Escape folds the menu without also closing the sheet.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      more.current?.focus();
    };
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const act = async (body: object, failedLine: string, landed: () => void) => {
    setBusy(true);
    onFailed(null);
    const ok = await patchIntention(row.id, body);
    setBusy(false);
    setOpen(false);
    if (ok) return landed();
    onFailed(failedLine);
    more.current?.focus();
  };

  const others = lists.filter((l) => l !== row.list && l !== UNSORTED);
  return (
    <div className="lists-menu" ref={box}>
      <button ref={more} type="button" className="lists-more" aria-label={`More for ${row.title}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MoreGlyph />
      </button>
      {open && (
        <div className="lists-menu-pop">
          {others.length > 0 && <p className="lists-menu-label">Move to</p>}
          {others.map((l) => (
            <button key={l} type="button" disabled={busy} onClick={() => void act({ action: "move", list: l }, "Didn’t move. Once more?", onMoved)}>
              {l}
            </button>
          ))}
          {others.length > 0 && <div className="lists-menu-rule" />}
          <button type="button" disabled={busy} onClick={() => void act({ action: "drop" }, "Didn’t let it go. Once more?", onLetGo)}>
            Let it go
          </button>
        </div>
      )}
    </div>
  );
}

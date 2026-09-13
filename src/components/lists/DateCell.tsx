"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sparkle } from "@/components/ui/Ornament";
import type { ListsRow } from "@/core/domain/lists-view";

/**
 * A row's date is also where one is given: tap it, or the empty place where it
 * would be, and type the day the way you'd say it — "fri", "sep 30", "in two
 * weeks". Enter (or clicking away) saves, and the row shows it as Today,
 * Tomorrow or Sep 30. Enter on an empty field takes a date off. Read in code
 * (`core/due-date.ts`), so it lands at once; no calendar to operate.
 */
export function DateCell({ row }: { row: ListsRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "unreadable" | "failed">("idle");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  const shown = (
    <>
      {row.due}
      {row.dueToday && <Sparkle size={9} className="lists-due-mark" />}
    </>
  );
  if (row.done) return <span className="lists-due">{shown}</span>;

  const close = () => {
    setEditing(false);
    setValue("");
    setState("idle");
  };
  const save = async (text: string) => {
    setState("saving");
    try {
      const r = await fetch(`/api/intentions/${row.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "date", text }) });
      if (r.status === 422) return setState("unreadable");
      if (!r.ok) return setState("failed");
      close();
      router.refresh();
    } catch {
      setState("failed");
    }
  };

  if (editing) {
    return (
      <span className="lists-due lists-due-edit">
        <input
          ref={input}
          className="lists-due-input"
          value={value}
          // Read-only, not disabled, while saving: a disabled field drops focus, and a date that can't be read should leave you still typing.
          readOnly={state === "saving"}
          aria-invalid={state === "unreadable"}
          aria-label={`Date for ${row.title}`}
          placeholder={row.due ?? "fri, sep 30…"}
          onChange={(e) => {
            setValue(e.target.value);
            if (state !== "saving") setState("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (value.trim() || row.due) void save(value);
              else close();
            } else if (e.key === "Escape") {
              e.preventDefault(); // folds the field, not the sheet
              close();
            }
          }}
          onBlur={() => {
            if (state === "saving") return;
            if (state === "unreadable" || !value.trim()) close();
            else void save(value);
          }}
        />
        {(state === "unreadable" || state === "failed") && (
          <span className="lists-due-hint" role="status">
            {state === "unreadable" ? "Try “fri” or “sep 30”" : "Didn’t save. Once more?"}
          </span>
        )}
      </span>
    );
  }

  return (
    <button type="button" className="lists-due lists-due-btn" aria-label={row.due ? `Date for ${row.title}: ${row.due}. Change it` : `Add a date to ${row.title}`} onClick={() => setEditing(true)}>
      {row.due ? shown : <span className="lists-due-add">Add date</span>}
    </button>
  );
}

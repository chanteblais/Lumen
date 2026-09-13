"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ledger } from "@/components/chat/Ledger";
import { SprigIcon } from "@/components/shell/NavIcons";
import { Sparkle, Tailpiece } from "@/components/ui/Ornament";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import { UNSORTED, type ListsRow, type ListsView } from "@/core/domain/lists-view";
import { CompleteCircle } from "./CompleteCircle";
import { AllGlyph, CloseGlyph, DoneGlyph, ListNameGlyph, MoreGlyph, PlusGlyph, SearchGlyph, SoonGlyph, TodayGlyph } from "./ListGlyphs";

type Shown = "all" | "done" | "today" | "soon" | `list:${string}`;

const LUMI_ERROR = "I lost the thread for a second. Say that again?";

/**
 * Lists: a sheet of parchment with everything on the user's lists, after
 * `art/mockups/lists-mockup.png`. From the nav it opens over the page you were
 * on and × (or Escape, or a click beside it) goes back there; opened directly
 * at /lists it sits over the Library's room and × goes to the Library.
 *
 * What it asks of you is only what you choose to do: tick something off, move
 * it to another list, let it go, or tell Lumi something to add — she files it.
 * No counts, no overdue, no sort or filter to set (docs/ef-burden-log.md).
 */
export function ListsSheet({ view, over }: { view: ListsView; over: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shown, setShown] = useState<Shown>("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const sheet = useRef<HTMLElement>(null);
  // From the nav the sheet is a parallel slot, which keeps its last state as you move on; it only shows at /lists.
  const active = !over || pathname === "/lists";

  const close = useCallback(() => (over ? router.back() : router.push("/library")), [over, router]);

  useEffect(() => {
    if (!active) return;
    sheet.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, close]);

  if (!active) return null;

  const tabs: { key: Shown; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <AllGlyph /> },
    ...view.lists.map((name) => ({ key: `list:${name}` as Shown, label: name, icon: <ListNameGlyph name={name} className={`lists-g-${name.toLowerCase()}`} /> })),
    { key: "done", label: "Completed", icon: <DoneGlyph className="lists-g-done" /> },
  ];
  const quick: typeof tabs = [
    { key: "today", label: "Today", icon: <TodayGlyph /> },
    { key: "soon", label: "Due soon", icon: <SoonGlyph /> },
  ];

  const inList = shown.startsWith("list:") ? shown.slice(5) : null;
  const base =
    shown === "done" ? view.done
    : shown === "today" ? view.open.filter((r) => r.dueToday)
    : shown === "soon" ? view.open.filter((r) => r.dueSoon)
    : inList !== null ? view.open.filter((r) => r.list === inList)
    : view.open;
  const q = query.trim().toLowerCase();
  const rows = q ? base.filter((r) => r.title.toLowerCase().includes(q) || r.nextAction?.toLowerCase().includes(q)) : base;
  const heading = shown === "all" ? "All tasks" : shown === "done" ? "Completed" : shown === "today" ? "Today" : shown === "soon" ? "Due soon" : inList;

  const empty =
    q ? "Nothing matches that."
    : shown === "all" ? "Nothing on your lists. Tell Lumi what’s on your mind and she’ll file it here."
    : shown === "done" ? "Nothing ticked off lately."
    : shown === "today" ? "Nothing has today’s date."
    : shown === "soon" ? "Nothing dated in the next week."
    : "Nothing filed here.";

  const tint = (list: string) => (list === UNSORTED ? undefined : String(view.lists.indexOf(list) % 4));

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
            <button type="button" className="lists-add" onClick={() => setAdding(true)} aria-expanded={adding}>
              <PlusGlyph /> Add task
            </button>
          </div>
        </header>

        {adding && <AddLine onClose={() => setAdding(false)} />}

        <div className="lists-tabs" role="group" aria-label="Show">
          <Sparkle size={10} className="lists-tabs-mark" />
          {[...tabs, ...quick].map((t) => (
            <button
              key={t.key}
              type="button"
              className={t.key === "today" || t.key === "soon" ? "lists-tab lists-tab-quick" : "lists-tab"}
              aria-pressed={shown === t.key}
              onClick={() => setShown(t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="lists-body">
          <Sparkle size={9} className="lists-body-mark" />
          <aside className="lists-side" aria-label="Views">
            <ul>
              {tabs.map((t) => (
                <li key={t.key}>
                  <button type="button" className="lists-side-item" aria-pressed={shown === t.key} onClick={() => setShown(t.key)}>
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
                  <button type="button" className="lists-side-item" aria-pressed={shown === t.key} onClick={() => setShown(t.key)}>
                    {t.icon}
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
            <Tailpiece className="lists-side-tail" />
          </aside>

          <div className="lists-main">
            <h2 className="font-display lists-heading">{heading}</h2>
            {rows.length === 0 ? (
              <p className="lists-empty">{empty}</p>
            ) : (
              <ul>
                {rows.map((r) => (
                  <Row key={r.id} row={r} lists={view.lists} showList={inList === null} tint={tint(r.list)} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ row, lists, showList, tint }: { row: ListsRow; lists: string[]; showList: boolean; tint?: string }) {
  const router = useRouter();
  const [gone, setGone] = useState(false);
  const className = `lists-row${showList ? "" : " is-single"}${row.done ? " is-done" : ""}`;

  if (gone) {
    const undo = async () => {
      const r = await fetch(`/api/intentions/${row.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reopen" }) }).catch(() => null);
      if (r?.ok) {
        setGone(false);
        router.refresh();
      }
    };
    return (
      <li className={className}>
        <span />
        <p className="lists-gone">
          Let go: {row.title}.
          <button type="button" onClick={() => void undo()}>
            Undo
          </button>
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
      </div>
      {showList && (
        <span className="lists-tag" data-tint={tint}>
          {row.list}
        </span>
      )}
      <DateCell row={row} />
      {row.done ? <span /> : <RowMenu row={row} lists={lists} onLetGo={() => setGone(true)} />}
    </li>
  );
}

/**
 * A row's date is also where one is given: tap it, or the empty place where it
 * would be, and type the day the way you'd say it — "fri", "sep 30", "in two
 * weeks". Enter (or clicking away) saves, and the row shows it as Today,
 * Tomorrow or Sep 30. Enter on an empty field takes a date off. Read in code
 * (`core/due-date.ts`), so it lands at once; no calendar to operate.
 */
function DateCell({ row }: { row: ListsRow }) {
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

/** The ⋯ on a row: corrections only — another list, or let it go. Each teaches Lumi what the move was (events carry `via: "app"`). */
function RowMenu({ row, lists, onLetGo }: { row: ListsRow; lists: string[]; onLetGo: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Captured first, so Escape folds the menu without also closing the sheet.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
    };
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const patch = async (body: object) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/intentions/${row.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return r.ok;
    } catch {
      return false;
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const others = lists.filter((l) => l !== row.list && l !== UNSORTED);
  return (
    <div className="lists-menu" ref={box}>
      <button type="button" className="lists-more" aria-label={`More for ${row.title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MoreGlyph />
      </button>
      {open && (
        <div className="lists-menu-pop" role="menu">
          {others.length > 0 && <p className="lists-menu-label">Move to</p>}
          {others.map((l) => (
            <button key={l} type="button" role="menuitem" disabled={busy} onClick={async () => (await patch({ action: "move", list: l })) && router.refresh()}>
              {l}
            </button>
          ))}
          {others.length > 0 && <div className="lists-menu-rule" />}
          <button type="button" role="menuitem" disabled={busy} onClick={async () => (await patch({ action: "drop" })) && onLetGo()}>
            Let it go
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Add task: one line to Lumi, not a form. What you type goes through /api/chat
 * like anything said to her (so it's in the conversation on Home too), and she
 * files it — the list, a date if you gave one. Her reply and the ledger of what
 * she did show under the line; the sheet refreshes once her turn has landed.
 */
function AddLine({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [transport] = useState(
    () =>
      new DefaultChatTransport<CoherenceUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id }) => ({ body: { id, message: messages[messages.length - 1] } }),
      }),
  );
  const { messages, sendMessage, status, error } = useChat<CoherenceUIMessage>({ transport, generateId: () => crypto.randomUUID() });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => input.current?.focus(), []);

  // When her turn lands, refresh so what she filed shows; the route's after() may still be re-cutting today's path.
  const landed = useRef(false);
  useEffect(() => {
    if (busy) landed.current = true;
    else if (landed.current) {
      landed.current = false;
      const t = setTimeout(() => router.refresh(), 700);
      return () => clearTimeout(t);
    }
  }, [busy, router]);

  const send = () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    void sendMessage({ text: `Add to my list: ${text}`, metadata: { createdAt: new Date().toISOString() } });
  };

  const reply = [...messages].reverse().find((m) => m.role === "assistant");
  const replyText = reply?.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className="lists-add-line">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault(); // folds the line, not the sheet
            onClose();
          }}
          placeholder={busy ? "Lumi’s on it…" : "What should Lumi add? She’ll file it."}
          aria-label="Something for Lumi to add"
        />
        <button type="submit" className="chip" disabled={busy || value.trim().length === 0}>
          Add
        </button>
        <button type="button" className="chip" onClick={onClose}>
          Done
        </button>
      </form>
      <div aria-live="polite">
        {status === "submitted" && (
          <p className="thinking-dots" aria-label="Lumi is thinking">
            <span>·</span>
            <span>·</span>
            <span>·</span>
          </p>
        )}
        {error && <p className="lists-add-reply">{LUMI_ERROR}</p>}
        {reply && (replyText || reply.parts.some((p) => p.type.startsWith("tool-"))) && (
          <div className="lists-add-reply">
            {replyText && <p>{replyText}</p>}
            <Ledger message={reply} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The Lists sheet, shaped: every open intention with the list it's filed in,
 * what was ticked off lately, and the two quick views (Today, Due soon). Pure —
 * the page loads the rows, this orders and labels them. Deliberately no counts
 * and no overdue: a date that has gone by is only its date, and it doesn't
 * jump the queue (docs/features.md → Lists; docs/ef-burden-log.md).
 */
import type { Intention } from "@/db/schema";
import { localDayDiff } from "@/core/time";

/** A date within this many local days, today included, is "Due soon". */
const SOON_DAYS = 7;
/** Where something with no list is shown. */
export const UNSORTED = "Unsorted";

export type ListsSource = Pick<Intention, "id" | "title" | "nextAction" | "list" | "dueAt" | "lastTouchedAt">;

export type ListsRow = {
  id: string;
  title: string;
  nextAction: string | null;
  list: string;
  done: boolean;
  /** "Today", "Tomorrow", "Sep 16" — or null when no date was set. Never "overdue". */
  due: string | null;
  dueToday: boolean;
  /** Dated from today to SOON_DAYS out. A date already gone by is not "soon". */
  dueSoon: boolean;
};

export type ListsView = {
  /** The user's lists in their order, then any other list something is filed in, then Unsorted if used. */
  lists: string[];
  open: ListsRow[];
  done: ListsRow[];
};

export function buildListsView(open: ListsSource[], done: ListsSource[], lists: string[], timeZone: string, now: Date = new Date()): ListsView {
  const toRow = (i: ListsSource, isDone: boolean): ListsRow => {
    const days = i.dueAt ? localDayDiff(now, i.dueAt, timeZone) : null;
    return {
      id: i.id,
      title: i.title,
      nextAction: i.nextAction,
      list: i.list?.trim() || UNSORTED,
      done: isDone,
      due: i.dueAt && days !== null ? dueLabel(i.dueAt, days, timeZone) : null,
      dueToday: days === 0,
      dueSoon: days !== null && days >= 0 && days < SOON_DAYS,
    };
  };

  // Soonest date first, from today on; then everything else (no date, or a date gone by), most recently touched first.
  const upcoming = (i: ListsSource) => i.dueAt !== null && localDayDiff(now, i.dueAt, timeZone) >= 0;
  const ordered = [...open].sort((a, b) => {
    const ua = upcoming(a);
    const ub = upcoming(b);
    if (ua && ub) return a.dueAt!.getTime() - b.dueAt!.getTime();
    if (ua !== ub) return ua ? -1 : 1;
    return b.lastTouchedAt.getTime() - a.lastTouchedAt.getTime();
  });
  const openRows = ordered.map((i) => toRow(i, false));

  const names = [...lists];
  for (const r of openRows) if (r.list !== UNSORTED && !names.includes(r.list)) names.push(r.list);
  if (openRows.some((r) => r.list === UNSORTED)) names.push(UNSORTED);

  return { lists: names, open: openRows, done: done.map((i) => toRow(i, true)) };
}

/** What the sheet is showing: everything open, one list, Completed, or a quick view. It opens on "all" each time; nothing is remembered. */
export type ListsShown = "all" | "done" | "today" | "soon" | `list:${string}`;

/** The list a view is inside, or null when it shows more than one (its rows then carry their list's tag). */
export function shownList(shown: ListsShown): string | null {
  return shown.startsWith("list:") ? shown.slice("list:".length) : null;
}

/** The rows a view shows, narrowed by search: what's typed, in the title or the next step, any case. */
export function shownRows(view: ListsView, shown: ListsShown, query: string): ListsRow[] {
  const inList = shownList(shown);
  const base =
    shown === "done" ? view.done
    : shown === "today" ? view.open.filter((r) => r.dueToday)
    : shown === "soon" ? view.open.filter((r) => r.dueSoon)
    : inList !== null ? view.open.filter((r) => r.list === inList)
    : view.open;
  const q = query.trim().toLowerCase();
  return q ? base.filter((r) => r.title.toLowerCase().includes(q) || Boolean(r.nextAction?.toLowerCase().includes(q))) : base;
}

/** The heading over a view's rows. */
export function shownHeading(shown: ListsShown): string {
  if (shown === "all") return "All tasks";
  if (shown === "done") return "Completed";
  if (shown === "today") return "Today";
  if (shown === "soon") return "Due soon";
  return shownList(shown) ?? "";
}

/** The one plain line when a view has nothing to show. Never a count, never a nudge. */
export function emptyLine(shown: ListsShown, query: string): string {
  if (query.trim()) return "Nothing matches that.";
  if (shown === "all") return "Nothing on your lists. Tell Lumi what’s on your mind and she’ll file it here.";
  if (shown === "done") return "Nothing ticked off lately.";
  if (shown === "today") return "Nothing has today’s date.";
  if (shown === "soon") return "Nothing dated in the next week.";
  return "Nothing filed here.";
}

/** A list tag's tint: the list's place among the user's lists, in four quiet tints (`data-tint` 0–3); none for Unsorted. */
export function listTint(view: ListsView, list: string): string | undefined {
  return list === UNSORTED ? undefined : String(view.lists.indexOf(list) % 4);
}

function dueLabel(at: Date, days: number, timeZone: string): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).format(at);
}

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
export const SOON_DAYS = 7;
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

function dueLabel(at: Date, days: number, timeZone: string): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).format(at);
}

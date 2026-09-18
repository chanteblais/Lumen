/**
 * The shape of the rest of today: the suggested path laid along the day, in
 * the windows between now and each fixed time. Orientation for someone who
 * can't feel how much day is left — coarse on purpose (§17: time guides
 * without dominating): spans are words, never clock arithmetic on the page,
 * and nothing is scheduled to a minute. Pure; derived at read time; tested.
 * docs/today.md → Anatomy → The rest of today.
 */
import { dayPart } from "@/core/time";

export type ShapeItem = { id: string; estimateMinutes: number | null };
export type Landmark = { id: string; title: string; at: Date; estimateMinutes: number | null };

export type DaySegment<T extends ShapeItem> =
  | { kind: "window"; label: string; span: string | null; items: T[] }
  | { kind: "landmark"; id: string; title: string; at: Date };

export type DayShape<T extends ShapeItem> = {
  /** "morning" | "afternoon" | "evening" | "night" — the word beside Now. */
  nowPart: ReturnType<typeof dayPart>;
  segments: DaySegment<T>[];
  /** Suggested things that don't fit anywhere before the day ends. Shown, quietly; never a count. */
  spill: T[];
};

/** When there's no estimate: half an hour, the size most things turn out to be. */
const ASSUMED_MINUTES = 30;
/** A fixed thing with no estimate takes about an hour. */
const LANDMARK_MINUTES = 60;
/** The day's usable end, local. After this the rest is "tonight". */
const DAY_END_HOUR = 22;
/** Getting to a fixed thing takes a little; the window before it is that much shorter. */
const TRANSITION_MINUTES = 10;

/** Minutes as words: never precise, always true. */
export function spanWords(minutes: number): string | null {
  if (minutes < 15) return null;
  if (minutes < 40) return "about half an hour";
  if (minutes < 80) return "about an hour";
  if (minutes < 150) return "a couple of hours";
  if (minutes < 270) return "a few hours";
  return "most of it";
}

/** Today's DAY_END_HOUR, local: from now's local clock, so a coarse end that ignores a DST edge in between. */
function endOfDay(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const minutesLeft = (DAY_END_HOUR - (get("hour") % 24)) * 60 - get("minute");
  return new Date(now.getTime() + minutesLeft * 60_000);
}

/**
 * Lay `path` (Lumi's order) into the windows between `now`, each landmark
 * still ahead, and the end of the day. First fit, order kept where it can be:
 * a thing too big for this window waits for the next; a smaller one behind it
 * may go first. Landmarks already past fall away.
 */
export function shapeDay<T extends ShapeItem>(path: T[], landmarks: Landmark[], now: Date, timeZone: string): DayShape<T> {
  const nowPart = dayPart(now, timeZone);
  const ahead = landmarks.filter((l) => l.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime());
  const end = endOfDay(now, timeZone);

  // The windows, with a label each: before the first fixed thing, between, after the last.
  type Window = { label: string; minutes: number; items: T[] };
  const windows: Window[] = [];
  let cursor = now.getTime();
  let previous: Landmark | undefined;
  for (const l of ahead) {
    const minutes = Math.max(0, (l.at.getTime() - cursor) / 60_000 - TRANSITION_MINUTES);
    windows.push({ label: previous ? `Between ${previous.title} and ${l.title}` : `Before ${l.title}`, minutes, items: [] });
    cursor = Math.max(cursor, l.at.getTime() + (l.estimateMinutes ?? LANDMARK_MINUTES) * 60_000);
    previous = l;
  }
  const lastMinutes = Math.max(0, (end.getTime() - cursor) / 60_000);
  const tonight = now.getTime() >= end.getTime();
  windows.push({
    label: tonight ? "Tonight" : previous ? `After ${previous.title}` : nowPart === "night" ? "Tonight" : `The rest of the ${nowPart}`,
    minutes: tonight ? Number.POSITIVE_INFINITY : lastMinutes,
    items: [],
  });

  // First fit, in Lumi's order.
  const spill: T[] = [];
  const remaining = windows.map((w) => w.minutes);
  for (const item of path) {
    const size = item.estimateMinutes ?? ASSUMED_MINUTES;
    const n = remaining.findIndex((m) => m >= size);
    if (n === -1) {
      spill.push(item);
      continue;
    }
    windows[n]!.items.push(item);
    remaining[n]! -= size;
  }

  // Weave windows and landmarks; a window with nothing in it and nothing to say is left out.
  const segments: DaySegment<T>[] = [];
  windows.forEach((w, n) => {
    if (w.items.length || n === windows.length - 1 || ahead[n]) {
      // The span is said only before a fixed time — "the rest of the afternoon" already says how long it is.
      if (w.items.length) segments.push({ kind: "window", label: w.label, span: ahead[n] ? spanWords(w.minutes) : null, items: w.items });
    }
    const l = ahead[n];
    if (l) segments.push({ kind: "landmark", id: l.id, title: l.title, at: l.at });
  });

  return { nowPart, segments, spill };
}

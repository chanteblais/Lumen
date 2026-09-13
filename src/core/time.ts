/**
 * Time helpers. Everything user-facing is computed in the user's IANA timezone.
 * Framework-free: no Next, no React.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type GapBucket =
  | "just_now"
  | "minutes"
  | "hours"
  | "yesterday"
  | "days"
  | "week_plus"
  | "long";

/** Bucket the gap between two instants. Used for greetings and the context block. */
export function gapBucket(since: Date, now: Date = new Date()): GapBucket {
  const ms = now.getTime() - since.getTime();
  if (ms < 5 * MINUTE) return "just_now";
  if (ms < HOUR) return "minutes";
  if (ms < 20 * HOUR) return "hours";
  if (ms < 2 * DAY) return "yesterday";
  if (ms < 7 * DAY) return "days";
  if (ms < 30 * DAY) return "week_plus";
  return "long";
}

/** Prose for a gap, as Lumi would say it. Never a precise count of anything the user could feel judged by. */
export function describeGap(since: Date, now: Date = new Date()): string {
  const ms = now.getTime() - since.getTime();
  switch (gapBucket(since, now)) {
    case "just_now":
      return "just now";
    case "minutes":
      return `${Math.max(1, Math.round(ms / MINUTE))} minutes ago`;
    case "hours":
      return `${Math.max(1, Math.round(ms / HOUR))} hours ago`;
    case "yesterday":
      return "yesterday";
    case "days":
      return `${Math.round(ms / DAY)} days ago`;
    case "week_plus":
      return `about ${Math.max(1, Math.round(ms / (7 * DAY)))} week${ms >= 11 * DAY ? "s" : ""} ago`;
    case "long":
      return "a while ago";
  }
}

/** Local calendar date (YYYY-MM-DD) for an instant in a timezone. */
export function localDate(at: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole local days from `a` to `b` in a timezone (0 = same day, 1 = `a` was yesterday). Calendar days, so DST can't shift it. */
export function localDayDiff(a: Date, b: Date, timeZone: string): number {
  const utcDay = (d: Date) => {
    const [y = NaN, m = NaN, day = NaN] = localDate(d, timeZone).split("-").map(Number);
    return Date.UTC(y, m - 1, day) / DAY;
  };
  return Math.round(utcDay(b) - utcDay(a));
}

/** Local hour (0–23) for an instant in a timezone. */
export function localHour(at: Date, timeZone: string): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(at);
  return Number(h) % 24;
}

/** "morning" | "afternoon" | "evening" | "night" — for the greeting and the context block. */
export function dayPart(at: Date, timeZone: string): "morning" | "afternoon" | "evening" | "night" {
  const h = localHour(at, timeZone);
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}

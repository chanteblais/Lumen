/**
 * Dates on intentions, typed the way people say them — "fri", "sep 30",
 * "the 24th", "in two weeks" — read in code, not by the model, so a date lands
 * at once and a typo can't become a surprise. A date with no time is stored as
 * the start of that local day (00:00 in the user's timezone); anything else is
 * a fixed time. Today reads a midnight `due_at` as a day to get it done, not an
 * appointment (`core/domain/intentions.ts → dueOn`).
 * See docs/domain.md → intentions; docs/features.md → Lists.
 */

const DAY = 86_400_000;

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

/** A day already gone by within this many days keeps its year; further back, the same day next year is meant. */
const RECENT_PAST_DAYS = 30;

type Ymd = { y: number; m: number; d: number };

function toYmd(s: string): Ymd {
  const [y = NaN, m = NaN, d = NaN] = s.split("-").map(Number);
  return { y, m, d };
}

/** A word's value in one of the tables above; undefined for any other word, Object.prototype's ("constructor") included. */
function lookup(table: Record<string, number>, word: string | undefined): number | undefined {
  return word !== undefined && Object.hasOwn(table, word) ? table[word] : undefined;
}

function fmt({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** A real calendar date (no Feb 30), as YYYY-MM-DD; null otherwise. */
function valid(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? fmt({ y, m, d }) : null;
}

function addDays(date: string, days: number): string {
  const { y, m, d } = toYmd(date);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY).toISOString().slice(0, 10);
}

function addMonths(date: string, months: number): string {
  const { y, m, d } = toYmd(date);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return fmt({ y: ny, m: nm, d: Math.min(d, last) });
}

function weekday(date: string): number {
  const { y, m, d } = toYmd(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function daysBetween(a: string, b: string): number {
  const ua = toYmd(a);
  const ub = toYmd(b);
  return Math.round((Date.UTC(ub.y, ub.m - 1, ub.d) - Date.UTC(ua.y, ua.m - 1, ua.d)) / DAY);
}

/** A month and day with no year: this year's, unless that is well gone by — then next year's. */
function nearestYear(m: number, d: number, today: string): string | null {
  const { y } = toYmd(today);
  const thisYear = valid(y, m, d);
  if (thisYear && daysBetween(thisYear, today) <= RECENT_PAST_DAYS) return thisYear;
  return valid(y + 1, m, d) ?? thisYear;
}

function yearOf(s: string | undefined, today: string): number | undefined {
  if (!s) return undefined;
  const n = Number(s);
  return s.length <= 2 ? Math.floor(toYmd(today).y / 100) * 100 + n : n;
}

/**
 * Pure: what someone typed for a date, as YYYY-MM-DD, relative to their local
 * `today` (YYYY-MM-DD). Null when it isn't a day we can read — the caller asks
 * again rather than guessing. Vague spans ("next week", "the weekend") aren't
 * read: they aren't a day, and a day shouldn't be invented for them. Tested.
 */
export function parseDueDate(input: string, today: string): string | null {
  const s = input
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(due|by|on)\s+/, "")
    .replace(/^the\s+/, "");
  if (!s) return null;

  if (s === "today" || s === "tod") return today;
  if (s === "tomorrow" || s === "tmrw" || s === "tmr" || s === "tom") return addDays(today, 1);

  // fri · this fri · next fri
  const wd = s.match(/^(?:(this|next)\s+)?([a-z]+)$/);
  const named = lookup(WEEKDAYS, wd?.[2]);
  if (wd && named !== undefined) {
    const ahead = (named - weekday(today) + 7) % 7; // 0 = today
    if (wd[1] !== "next") return addDays(today, ahead);
    // "next fri": the one in the coming week — past the Friday still ahead this week.
    const untilSunday = (7 - weekday(today)) % 7;
    const upcoming = ahead === 0 ? 7 : ahead;
    return addDays(today, upcoming <= untilSunday ? upcoming + 7 : upcoming);
  }

  // in 3 days · in two weeks · in a month
  const rel = s.match(/^in\s+(\d+|[a-z]+)\s+(day|days|week|weeks|month|months)$/);
  if (rel) {
    const [, count = "", unit = ""] = rel;
    const n = /^\d+$/.test(count) ? Number(count) : lookup(NUMBER_WORDS, count);
    if (!n || n > 366) return null;
    if (unit.startsWith("day")) return addDays(today, n);
    if (unit.startsWith("week")) return addDays(today, n * 7);
    return addMonths(today, n);
  }

  // 2026-09-30
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return valid(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  // sep 30 · september 30th · sep 30 2027
  const md = s.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{2}|\d{4}))?$/);
  const mdMonth = lookup(MONTHS, md?.[1]);
  if (md && mdMonth !== undefined) {
    const y = yearOf(md[3], today);
    return y ? valid(y, mdMonth, Number(md[2])) : nearestYear(mdMonth, Number(md[2]), today);
  }
  // 30 sep · 30th of september
  const dm = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)(?:\s+(\d{2}|\d{4}))?$/);
  const dmMonth = lookup(MONTHS, dm?.[2]);
  if (dm && dmMonth !== undefined) {
    const y = yearOf(dm[3], today);
    return y ? valid(y, dmMonth, Number(dm[1])) : nearestYear(dmMonth, Number(dm[1]), today);
  }

  // 9/30 · 30/9 · 9/30/27 — a part over 12 is the day; otherwise month first.
  const num = s.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?$/);
  if (num) {
    const a = Number(num[1]);
    const b = Number(num[2]);
    const [m, d] = a > 12 && b <= 12 ? [b, a] : [a, b];
    const y = yearOf(num[3], today);
    return y ? valid(y, m, d) : nearestYear(m, d, today);
  }

  // 24th · the 24th — this month's, or next month's once it's gone by
  const nth = s.match(/^(\d{1,2})(st|nd|rd|th)$/);
  if (nth) {
    const d = Number(nth[1]);
    const { y, m } = toYmd(today);
    const here = valid(y, m, d);
    if (here && here >= today) return here;
    for (let k = 1; k <= 2; k++) {
      const next = toYmd(addMonths(fmt({ y, m, d: 1 }), k));
      const date = valid(next.y, next.m, d);
      if (date) return date;
    }
    return null;
  }

  return null;
}

/** The instant a local date begins in a timezone (00:00 there). DST-safe. Tested. */
export function startOfLocalDay(date: string, timeZone: string): Date {
  const { y, m, d } = toYmd(date);
  const target = Date.UTC(y, m - 1, d);
  let t = target;
  // Two passes settle the offset, including a day that begins in a different offset than the UTC guess.
  for (let i = 0; i < 2; i++) {
    const p = localParts(new Date(t), timeZone);
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
    t = target - (asUtc - t);
  }
  return new Date(t);
}

/**
 * A due date a model wrote (a tool's `due_at`, a mail lead's): a bare day
 * (`2026-09-20`) is 00:00 that day in the user's timezone — `new Date` would read
 * it as UTC midnight, the day before west of UTC — and anything with a time is
 * that instant. Null when it doesn't parse. Tested.
 */
export function dueAtFromModel(text: string, timeZone: string): Date | null {
  const s = text.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const { y, m, d } = toYmd(s);
    return valid(y, m, d) ? startOfLocalDay(s, timeZone) : null;
  }
  const at = new Date(s);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** A due_at that is only a day — 00:00 local — rather than a fixed time. Tested. */
export function isDayOnly(at: Date, timeZone: string): boolean {
  const p = localParts(at, timeZone);
  return p.h === 0 && p.min === 0 && p.s === 0;
}

function localParts(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour") % 24, min: get("minute"), s: get("second") };
}

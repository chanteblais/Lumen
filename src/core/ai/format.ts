/**
 * How the AI layer writes times and capacity into what a model reads: one set
 * of local-time formats, built once per timezone and reused (an
 * `Intl.DateTimeFormat` is costly to construct, and the inputs blocks format
 * inside loops), and one wording of a capacity report. Pure.
 */
import type { CapacityReport } from "@/core/domain/capacity";

const STYLES = {
  /** "Friday, 3:05 p.m." — the local time in a context or inputs block. */
  weekdayTime: { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true },
  /** "3:05 p.m." — a fixed time today. */
  time: { hour: "numeric", minute: "2-digit", hour12: true },
  /** "Sep 18" — a day. */
  day: { month: "short", day: "numeric" },
  /** "Sep 18, 3:05 p.m." — a day with its time. */
  dayTime: { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true },
  /** "Fri, Sep 18, 3:05 p.m." — when a message came in. */
  stamp: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type LocalStyle = keyof typeof STYLES;

const made = new Map<string, Intl.DateTimeFormat>();

/** The formatter for this timezone and style, made once (en-CA, as everywhere a model reads a time). */
export function localFormat(timeZone: string, style: LocalStyle): Intl.DateTimeFormat {
  const key = `${timeZone}|${style}`;
  let f = made.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone, ...STYLES[style] });
    made.set(key, f);
  }
  return f;
}

/** "low (tired, scattered)": a capacity level with its flags, as the context block and the planner both say it. */
export function capacityPhrase(c: Pick<CapacityReport, "level" | "flags">): string {
  return `${c.level}${c.flags?.length ? ` (${c.flags.join(", ")})` : ""}`;
}

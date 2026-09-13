/**
 * Capacity: how much the user has today. Stored as events; "today's capacity"
 * is the latest report within the user's local day. Never a metric to track.
 * Today asks once a day (skippable); the chat tool reports it when the user
 * says so. Either way the path is re-cut around the answer.
 */
import { type Db } from "@/db/client";
import type { Event } from "@/db/schema";
import { localDate } from "@/core/time";
import { appendEvent } from "./events";

export type CapacityLevel = "low" | "normal" | "high";
type CapacityFlag = "overwhelmed" | "scattered" | "tired" | "focused";
export type CapacityReport = { level: CapacityLevel; flags?: CapacityFlag[]; note?: string; at: Date };

const CAPACITY_LEVELS: readonly CapacityLevel[] = ["low", "normal", "high"];
export function isCapacityLevel(s: unknown): s is CapacityLevel {
  return typeof s === "string" && (CAPACITY_LEVELS as readonly string[]).includes(s);
}

/** The event types that decide whether Today asks. */
export const CAPACITY_EVENT_TYPES = ["capacity.reported", "capacity.asked"];

type CapacityState = {
  /** Today's latest report, if any. */
  report?: CapacityReport;
  /** The user skipped the prompt today — don't ask again. */
  skipped: boolean;
};

export async function reportCapacity(db: Db, userId: string, r: Omit<CapacityReport, "at">): Promise<void> {
  await appendEvent(db, { userId, type: "capacity.reported", subjectType: "user", subjectId: userId, payload: { level: r.level, flags: r.flags ?? [], note: r.note ?? null } });
}

/** The user tapped Skip on Today's capacity prompt. Recorded so it is asked at most once a day. */
export async function skipCapacity(db: Db, userId: string): Promise<void> {
  await appendEvent(db, { userId, type: "capacity.asked", subjectType: "user", subjectId: userId, payload: { skipped: true } });
}

/** Pure: today's capacity state from recent capacity events (newest first). Tested. */
export function capacityStateFromEvents(rows: Pick<Event, "type" | "payload" | "occurredAt">[], timeZone: string, now: Date = new Date()): CapacityState {
  const today = localDate(now, timeZone);
  let report: CapacityReport | undefined;
  let skipped = false;
  for (const e of rows) {
    if (localDate(e.occurredAt, timeZone) !== today) continue;
    if (e.type === "capacity.reported" && !report) {
      const p = e.payload as { level: CapacityLevel; flags?: CapacityFlag[]; note?: string | null };
      report = { level: p.level, flags: p.flags ?? [], note: p.note ?? undefined, at: e.occurredAt };
    } else if (e.type === "capacity.asked" && (e.payload as { skipped?: boolean }).skipped) {
      skipped = true;
    }
  }
  return { report, skipped };
}

/**
 * Pure: does a report change what the plan was cut for? A plan cut with no
 * report assumed normal, so answering "normal-ish" and re-cutting would only
 * shuffle the one thing for no reason. Tested.
 */
export function capacityChangesPlan(level: CapacityLevel, planCapacity: string | null | undefined): boolean {
  return (planCapacity ?? "normal") !== level;
}

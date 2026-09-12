/**
 * Capacity: how much the user has today. Stored as events; "today's capacity"
 * is the latest report within the user's local day. Never a metric to track.
 */
import { and, desc, eq, gte } from "drizzle-orm";
import { type Db } from "@/db/client";
import { events } from "@/db/schema";
import { localDate } from "@/core/time";
import { appendEvent } from "./events";

export type CapacityLevel = "low" | "normal" | "high";
export type CapacityFlag = "overwhelmed" | "scattered" | "tired" | "focused";
export type CapacityReport = { level: CapacityLevel; flags?: CapacityFlag[]; note?: string; at: Date };

export async function reportCapacity(db: Db, userId: string, r: Omit<CapacityReport, "at">): Promise<void> {
  await appendEvent(db, { userId, type: "capacity.reported", subjectType: "user", subjectId: userId, payload: { level: r.level, flags: r.flags ?? [], note: r.note ?? null } });
}

export async function todayCapacity(db: Db, userId: string, timeZone: string, now: Date = new Date()): Promise<CapacityReport | undefined> {
  // Cheap bound: nothing older than 36h can be "today" in any timezone.
  const since = new Date(now.getTime() - 36 * 3_600_000);
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.type, "capacity.reported"), gte(events.occurredAt, since)))
    .orderBy(desc(events.occurredAt))
    .limit(5);
  const today = localDate(now, timeZone);
  const hit = rows.find((e) => localDate(e.occurredAt, timeZone) === today);
  if (!hit) return undefined;
  const p = hit.payload as { level: CapacityLevel; flags?: CapacityFlag[]; note?: string | null };
  return { level: p.level, flags: p.flags ?? [], note: p.note ?? undefined, at: hit.occurredAt };
}

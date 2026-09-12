/**
 * Recent changes to the user's things, wherever they happened — a tick on
 * Today or Lists, a tool call in chat — so Lumi knows what "the one I just
 * checked off" means without asking. Derived from events at read time; the
 * intention's current status rides along because it may have moved again.
 */
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { type Db } from "@/db/client";
import { events, intentions, type IntentionStatus } from "@/db/schema";
import type { ActionSource } from "./events";

export const ACTIVITY_EVENT_TYPES = ["intention.created", "intention.updated", "intention.completed", "intention.reopened", "intention.dropped"] as const;
export type ActivityType = (typeof ACTIVITY_EVENT_TYPES)[number];

export type ActivityItem = {
  type: ActivityType;
  at: Date;
  /** Who did it: the user on a page, or Lumi through a tool. */
  via: ActionSource;
  intentionId: string;
  title: string;
  /** Where the intention stands now. */
  status: IntentionStatus;
  /** For `intention.updated`: which fields changed. */
  fields?: string[];
};

/** Intention changes since `since`, newest first, joined to the intention for its title and current status. */
export async function listRecentActivity(db: Db, userId: string, since: Date, limit = 15): Promise<ActivityItem[]> {
  const rows = await db
    .select({ type: events.type, at: events.occurredAt, payload: events.payload, intentionId: intentions.id, title: intentions.title, status: intentions.status })
    .from(events)
    .innerJoin(intentions, eq(intentions.id, events.subjectId))
    .where(and(eq(events.userId, userId), inArray(events.type, [...ACTIVITY_EVENT_TYPES]), gte(events.occurredAt, since)))
    .orderBy(desc(events.occurredAt))
    .limit(limit);
  return rows.map((r) => {
    const p = r.payload as { via?: ActionSource; fields?: string[] };
    return {
      type: r.type as ActivityType,
      at: r.at,
      via: p.via === "app" ? "app" : "chat",
      intentionId: r.intentionId,
      title: r.title,
      status: r.status,
      fields: Array.isArray(p.fields) ? p.fields : undefined,
    };
  });
}

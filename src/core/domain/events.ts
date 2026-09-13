/**
 * Append-only events. Every state change writes one — this is the raw
 * material for the understanding layer. Never update or delete rows.
 */
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { type Db } from "@/db/client";
import { events, type Event } from "@/db/schema";

/** Who made a change: the user on a page (Today, Lists), or Lumi through a chat tool. */
export type ActionSource = "app" | "chat";

export type EventInput = {
  userId: string;
  type: string;
  subjectType?: "intention" | "session" | "note" | "user" | "lead" | "thread" | "episode";
  subjectId?: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
};

export async function appendEvent(db: Db, input: EventInput) {
  const [row] = await db
    .insert(events)
    .values({
      userId: input.userId,
      type: input.type,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      payload: input.payload ?? {},
      occurredAt: input.occurredAt ?? new Date(),
    })
    .returning({ id: events.id });
  return row;
}

/** Recent events of the given types, newest first. Bounded by `since` (and `until`, when given) so the (user, occurred_at) index does the work. */
export async function listEventsSince(db: Db, userId: string, types: string[], since: Date, limit = 50, until?: Date): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), inArray(events.type, types), gte(events.occurredAt, since), until ? lte(events.occurredAt, until) : undefined))
    .orderBy(desc(events.occurredAt))
    .limit(limit);
}

/** The newest event of one type, if any. */
export async function latestEvent(db: Db, userId: string, type: string): Promise<Event | undefined> {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.type, type)))
    .orderBy(desc(events.occurredAt))
    .limit(1);
  return row;
}

export const REFLECTION_CLAIMED = "reflection.claimed";

/**
 * Has reflection claimed or run over this subject (a session)? Keeps the
 * abandoned-session sweep from reflecting twice. `reflection.ran` alone marks
 * sessions reflected on before claims existed.
 */
export async function reflectedOn(db: Db, userId: string, subjectId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.userId, userId), inArray(events.type, ["reflection.ran", REFLECTION_CLAIMED]), eq(events.subjectId, subjectId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Claim a session for reflection before any work: `reflection.claimed`,
 * inserted on conflict do nothing against the unique partial index
 * `events_reflection_claim_idx`. True for exactly one caller, however many race.
 */
export async function claimReflection(db: Db, userId: string, sessionId: string, now: Date = new Date()): Promise<boolean> {
  const rows = await db
    .insert(events)
    .values({ userId, type: REFLECTION_CLAIMED, subjectType: "session", subjectId: sessionId, payload: {}, occurredAt: now })
    .onConflictDoNothing()
    .returning({ id: events.id });
  return rows.length > 0;
}

/** Nothing older than 36 hours can be "today" in any timezone — the cheap bound for today-derived views. */
export const TODAY_BOUND_MS = 36 * 3_600_000;

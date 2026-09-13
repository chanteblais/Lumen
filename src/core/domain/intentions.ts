/**
 * Intentions: things the user meant to do. Status is only open/done/dropped;
 * "stale" is derived. Every write appends an event.
 */
import { and, desc, eq } from "drizzle-orm";
import { type Db } from "@/db/client";
import { intentions, type EffortHint, type Event, type Intention } from "@/db/schema";
import { localDate } from "@/core/time";
import { appendEvent, type ActionSource } from "./events";

export const STALE_AFTER_MS = 14 * 86_400_000;

export type CreateIntentionInput = {
  title: string;
  nextAction?: string | null;
  note?: string | null;
  list?: string | null;
  estimateMinutes?: number | null;
  effortHint?: EffortHint | null;
  dueAt?: Date | null;
  sourceMessageId?: string | null;
};

export type IntentionPatch = Partial<Omit<CreateIntentionInput, "sourceMessageId">>;

export async function createIntention(db: Db, userId: string, input: CreateIntentionInput): Promise<Intention> {
  const [row] = await db
    .insert(intentions)
    .values({
      userId,
      title: input.title.trim(),
      nextAction: input.nextAction?.trim() || null,
      note: input.note?.trim() || null,
      list: input.list?.trim() || null,
      estimateMinutes: input.estimateMinutes ?? null,
      effortHint: input.effortHint ?? null,
      dueAt: input.dueAt ?? null,
      sourceMessageId: input.sourceMessageId ?? null,
    })
    .returning();
  await appendEvent(db, { userId, type: "intention.created", subjectType: "intention", subjectId: row.id, payload: { list: row.list, estimate: row.estimateMinutes } });
  return row;
}

export async function getIntention(db: Db, userId: string, id: string): Promise<Intention | undefined> {
  const [row] = await db.select().from(intentions).where(and(eq(intentions.id, id), eq(intentions.userId, userId))).limit(1);
  return row;
}

/**
 * The columns a patch would actually change on this row, with the values it
 * would set — the same trimming and empty-to-null as the write. Empty means
 * the patch is a no-op: Lumi re-sending what a thing already says (she has
 * been seen "finishing" a note she just made with the same fields) must not
 * write, bump `last_touched_at`, or leave an `intention.updated` event that
 * the ledger and the context block would then report as a change.
 */
export function intentionChanges(current: Intention, patch: IntentionPatch): Partial<typeof intentions.$inferInsert> {
  const set: Partial<typeof intentions.$inferInsert> = {};
  if (patch.title !== undefined && patch.title.trim() !== current.title) set.title = patch.title.trim();
  if (patch.nextAction !== undefined && (patch.nextAction?.trim() || null) !== current.nextAction) set.nextAction = patch.nextAction?.trim() || null;
  if (patch.note !== undefined && (patch.note?.trim() || null) !== current.note) set.note = patch.note?.trim() || null;
  if (patch.list !== undefined && (patch.list?.trim() || null) !== current.list) set.list = patch.list?.trim() || null;
  if (patch.estimateMinutes !== undefined && (patch.estimateMinutes ?? null) !== current.estimateMinutes) set.estimateMinutes = patch.estimateMinutes ?? null;
  if (patch.effortHint !== undefined && (patch.effortHint ?? null) !== current.effortHint) set.effortHint = patch.effortHint ?? null;
  if (patch.dueAt !== undefined && (patch.dueAt?.getTime() ?? null) !== (current.dueAt?.getTime() ?? null)) set.dueAt = patch.dueAt ?? null;
  return set;
}

/** `changed` names the columns that moved; empty when the patch said nothing new (no write, no event). */
export async function updateIntention(db: Db, userId: string, id: string, patch: IntentionPatch): Promise<{ row: Intention; changed: string[] } | undefined> {
  const current = await getIntention(db, userId, id);
  if (!current) return undefined;
  const set = intentionChanges(current, patch);
  const changed = Object.keys(set);
  if (changed.length === 0) return { row: current, changed };
  const [row] = await db
    .update(intentions)
    .set({ ...set, lastTouchedAt: new Date() })
    .where(and(eq(intentions.id, id), eq(intentions.userId, userId)))
    .returning();
  if (!row) return undefined;
  await appendEvent(db, { userId, type: "intention.updated", subjectType: "intention", subjectId: id, payload: { fields: changed } });
  return { row, changed };
}

/** `via` records whether the user ticked it on a page or Lumi did it in chat — the context block tells them apart. */
export async function completeIntention(db: Db, userId: string, id: string, via: ActionSource = "chat"): Promise<Intention | undefined> {
  const now = new Date();
  const [row] = await db
    .update(intentions)
    .set({ status: "done", completedAt: now, lastTouchedAt: now })
    .where(and(eq(intentions.id, id), eq(intentions.userId, userId)))
    .returning();
  if (row) await appendEvent(db, { userId, type: "intention.completed", subjectType: "intention", subjectId: id, payload: { via } });
  return row;
}

/** Back to open from done or dropped — a mistaken tick, or a change of mind. */
export async function reopenIntention(db: Db, userId: string, id: string, via: ActionSource = "chat"): Promise<Intention | undefined> {
  const [row] = await db
    .update(intentions)
    .set({ status: "open", completedAt: null, droppedAt: null, lastTouchedAt: new Date() })
    .where(and(eq(intentions.id, id), eq(intentions.userId, userId)))
    .returning();
  if (row) await appendEvent(db, { userId, type: "intention.reopened", subjectType: "intention", subjectId: id, payload: { via } });
  return row;
}

export async function dropIntention(db: Db, userId: string, id: string, reason?: string): Promise<Intention | undefined> {
  const now = new Date();
  const [row] = await db
    .update(intentions)
    .set({ status: "dropped", droppedAt: now, lastTouchedAt: now })
    .where(and(eq(intentions.id, id), eq(intentions.userId, userId)))
    .returning();
  if (row) await appendEvent(db, { userId, type: "intention.dropped", subjectType: "intention", subjectId: id, payload: { reason: reason ?? null } });
  return row;
}

/**
 * Recorded when the user says "not this" to the plan's current task. Never a
 * failure — the reason (a key from core/declines.ts, or free text) is the
 * signal. Returns the row, or undefined when it isn't theirs.
 */
export async function declineIntention(db: Db, userId: string, id: string, reason?: string): Promise<Intention | undefined> {
  const [row] = await db.update(intentions).set({ lastTouchedAt: new Date() }).where(and(eq(intentions.id, id), eq(intentions.userId, userId))).returning();
  if (row) await appendEvent(db, { userId, type: "intention.declined", subjectType: "intention", subjectId: id, payload: { reason: reason ?? null } });
  return row;
}

export type Decline = { intentionId: string; reason: string | null; at: Date };
export const DECLINE_EVENT_TYPE = "intention.declined";

/** Pure: today's declines from recent events (newest first). Feeds the plan (never Right now again today) and the context block. */
export function declinesFromEvents(rows: Pick<Event, "type" | "subjectId" | "payload" | "occurredAt">[], timeZone: string, now: Date = new Date()): Decline[] {
  const today = localDate(now, timeZone);
  const out: Decline[] = [];
  for (const e of rows) {
    if (e.type !== DECLINE_EVENT_TYPE || !e.subjectId || localDate(e.occurredAt, timeZone) !== today) continue;
    out.push({ intentionId: e.subjectId, reason: ((e.payload as { reason?: string | null }).reason ?? null) || null, at: e.occurredAt });
  }
  return out;
}

export async function listOpenIntentions(db: Db, userId: string): Promise<Intention[]> {
  return db
    .select()
    .from(intentions)
    .where(and(eq(intentions.userId, userId), eq(intentions.status, "open")))
    .orderBy(desc(intentions.lastTouchedAt));
}

export async function listRecentlyDone(db: Db, userId: string, limit = 10): Promise<Intention[]> {
  return db
    .select()
    .from(intentions)
    .where(and(eq(intentions.userId, userId), eq(intentions.status, "done")))
    .orderBy(desc(intentions.completedAt))
    .limit(limit);
}

export function isStale(i: Pick<Intention, "status" | "lastTouchedAt">, now: Date = new Date()): boolean {
  return i.status === "open" && now.getTime() - i.lastTouchedAt.getTime() > STALE_AFTER_MS;
}

/** Fixed-time intentions for a local date (things with a due_at that day). */
export function dueOn(list: Intention[], localDate: string, timeZone: string): Intention[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return list
    .filter((i) => i.dueAt && fmt.format(i.dueAt) === localDate)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
}

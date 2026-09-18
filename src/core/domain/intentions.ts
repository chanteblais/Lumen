/**
 * Intentions: things the user meant to do. Status is only open/done/dropped;
 * "stale" is derived. Every write appends an event.
 */
import { and, desc, eq, ne } from "drizzle-orm";
import { type Db } from "@/db/client";
import { intentions, type EffortHint, type Event, type Intention, type IntentionStatus } from "@/db/schema";
import { isDayOnly } from "@/core/due-date";
import { localDate } from "@/core/time";
import { appendEvent, type ActionSource } from "./events";
import { returnedRow } from "./rows";
import { atomic } from "./tx";

const STALE_AFTER_MS = 14 * 86_400_000;

type CreateIntentionInput = {
  title: string;
  nextAction?: string | null;
  note?: string | null;
  list?: string | null;
  estimateMinutes?: number | null;
  effortHint?: EffortHint | null;
  dueAt?: Date | null;
  sourceMessageId?: string | null;
};

type IntentionPatch = Partial<Omit<CreateIntentionInput, "sourceMessageId">>;

export async function createIntention(db: Db, userId: string, input: CreateIntentionInput): Promise<Intention> {
  return atomic(db, async (tx) => {
    const inserted = await tx
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
    const row = returnedRow(inserted, "createIntention");
    await appendEvent(tx, { userId, type: "intention.created", subjectType: "intention", subjectId: row.id, payload: { list: row.list, estimate: row.estimateMinutes } });
    return row;
  });
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

/** `changed` names the columns that moved; empty when the patch said nothing new (no write, no event). `via`: a page's move (`"app"`) or Lumi's tool. */
export async function updateIntention(db: Db, userId: string, id: string, patch: IntentionPatch, via: ActionSource = "chat"): Promise<{ row: Intention; changed: string[] } | undefined> {
  return atomic(db, async (tx) => {
    // Locked, so two patches at once each see the other's result when they decide what changed.
    const [current] = await tx.select().from(intentions).where(and(eq(intentions.id, id), eq(intentions.userId, userId))).limit(1).for("update");
    if (!current) return undefined;
    const set = intentionChanges(current, patch);
    const changed = Object.keys(set);
    if (changed.length === 0) return { row: current, changed };
    const row = returnedRow(
      await tx
        .update(intentions)
        .set({ ...set, lastTouchedAt: new Date() })
        .where(and(eq(intentions.id, id), eq(intentions.userId, userId)))
        .returning(),
      "updateIntention",
    );
    await appendEvent(tx, { userId, type: "intention.updated", subjectType: "intention", subjectId: id, payload: { fields: changed, via } });
    return { row, changed };
  });
}

/**
 * Move an intention to `status` — only from another one. Already there, it
 * comes back as it is with no write and no event: a second tick (a double tap,
 * Lumi and a page at once) never records a second outcome or moves
 * `completed_at`, and the caller answers as for the first, never "not found".
 * Undefined only when it isn't theirs.
 */
async function moveTo(
  db: Db,
  userId: string,
  id: string,
  status: IntentionStatus,
  set: Partial<Pick<Intention, "completedAt" | "droppedAt" | "lastTouchedAt">>,
  event: { type: string; payload: Record<string, unknown> },
): Promise<Intention | undefined> {
  return atomic(db, async (tx) => {
    const [row] = await tx
      .update(intentions)
      .set({ status, ...set })
      .where(and(eq(intentions.id, id), eq(intentions.userId, userId), ne(intentions.status, status)))
      .returning();
    if (!row) return getIntention(tx, userId, id);
    await appendEvent(tx, { userId, type: event.type, subjectType: "intention", subjectId: id, payload: event.payload });
    return row;
  });
}

/** `via` records whether the user ticked it on a page or Lumi did it in chat — the context block tells them apart. */
export async function completeIntention(db: Db, userId: string, id: string, via: ActionSource = "chat"): Promise<Intention | undefined> {
  const now = new Date();
  return moveTo(db, userId, id, "done", { completedAt: now, droppedAt: null, lastTouchedAt: now }, { type: "intention.completed", payload: { via } });
}

/** Back to open from done or dropped — a mistaken tick, or a change of mind. */
export async function reopenIntention(db: Db, userId: string, id: string, via: ActionSource = "chat"): Promise<Intention | undefined> {
  return moveTo(db, userId, id, "open", { completedAt: null, droppedAt: null, lastTouchedAt: new Date() }, { type: "intention.reopened", payload: { via } });
}

/** Let it go. A done thing let go is no longer done: `completed_at` is cleared. */
export async function dropIntention(db: Db, userId: string, id: string, reason?: string, via: ActionSource = "chat"): Promise<Intention | undefined> {
  const now = new Date();
  return moveTo(db, userId, id, "dropped", { droppedAt: now, completedAt: null, lastTouchedAt: now }, { type: "intention.dropped", payload: { reason: reason ?? null, via } });
}

/**
 * Recorded when the user says "not this" to the plan's current task. Never a
 * failure — the reason (a key from core/declines.ts, or free text) is the
 * signal. Returns the row, or undefined when it isn't theirs.
 */
export async function declineIntention(db: Db, userId: string, id: string, reason?: string): Promise<Intention | undefined> {
  return atomic(db, async (tx) => {
    const [row] = await tx.update(intentions).set({ lastTouchedAt: new Date() }).where(and(eq(intentions.id, id), eq(intentions.userId, userId))).returning();
    if (row) await appendEvent(tx, { userId, type: "intention.declined", subjectType: "intention", subjectId: id, payload: { reason: reason ?? null } });
    return row;
  });
}

type Decline = { intentionId: string; reason: string | null; at: Date };
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

/**
 * What was finished on a local date, oldest first — the day's history, read off
 * completion times (Today → Done today). Titles only on the page; never a count.
 */
export function doneOn<T extends Pick<Intention, "completedAt">>(done: T[], date: string, timeZone: string): T[] {
  return done
    .filter((i) => i.completedAt && localDate(i.completedAt, timeZone) === date)
    .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());
}

export function isStale(i: Pick<Intention, "status" | "lastTouchedAt">, now: Date = new Date()): boolean {
  return i.status === "open" && now.getTime() - i.lastTouchedAt.getTime() > STALE_AFTER_MS;
}

/**
 * Fixed-time intentions for a local date: a due_at at a time that day. A date
 * alone (00:00 local, `core/due-date.ts`) is a day to get it done by, not an
 * appointment, so it stays a candidate for the path.
 */
export function dueOn(list: Intention[], day: string, timeZone: string): Intention[] {
  return list
    .filter((i) => i.dueAt && localDate(i.dueAt, timeZone) === day && !isDayOnly(i.dueAt, timeZone))
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
}

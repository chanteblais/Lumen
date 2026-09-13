/**
 * Focus sessions: a stretch of company. What we're doing, the first physical
 * step, how long — settled in conversation, then Lumi is quiet. The row is
 * the fact; everything judged about it (running, abandoned, elapsed) is
 * derived at read time. Every write appends an event.
 */
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { type Db } from "@/db/client";
import { focusSessions, intentions, type FocusSession, type SessionOutcome } from "@/db/schema";
import { appendEvent, TODAY_BOUND_MS } from "./events";
import { atomic } from "./tx";

export type StartSessionInput = {
  goal: string;
  firstStep: string;
  approach?: string | null;
  plannedMinutes: number;
  checkInMinutes: number;
  intentionId?: string | null;
};

/** What the client needs to show the bar and run the check-ins. Serialisable (dates as ISO). */
export type SessionView = {
  id: string;
  goal: string;
  firstStep: string;
  approach: string | null;
  plannedMinutes: number;
  checkInMinutes: number;
  startedAt: string;
  intentionId: string | null;
};

export function toSessionView(s: FocusSession): SessionView {
  return {
    id: s.id,
    goal: s.goal,
    firstStep: s.firstStep,
    approach: s.approach,
    plannedMinutes: s.plannedMinutes,
    checkInMinutes: s.checkInMinutes,
    startedAt: s.startedAt.toISOString(),
    intentionId: s.intentionId,
  };
}

/** A session that reaches this responds to no one: closed as abandoned on the next visit. Pure. */
export function isAbandoned(s: Pick<FocusSession, "endedAt" | "startedAt" | "plannedMinutes">, now: Date = new Date()): boolean {
  return !s.endedAt && now.getTime() - s.startedAt.getTime() > s.plannedMinutes * 2 * 60_000;
}

/** Whole minutes since the session began. Pure. */
export function elapsedMinutes(s: Pick<FocusSession, "startedAt">, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - s.startedAt.getTime()) / 60_000));
}

/**
 * Begin a session. One at a time, held by the unique index
 * `focus_sessions_user_open_idx`: a session still running is closed as stopped
 * early first (they moved on to something else — no judgement) and returned
 * as `replaced`, so the caller can reflect on it too; one left open past its
 * threshold and not yet swept closes as abandoned, which is what it was. When
 * another start lands at the same moment, its session is the one returned —
 * two starts never leave two running.
 */
export async function startFocusSession(db: Db, userId: string, input: StartSessionInput, now: Date = new Date()): Promise<{ session: FocusSession; replaced?: FocusSession }> {
  return atomic(db, async (tx) => {
    const open = await tx.select().from(focusSessions).where(and(eq(focusSessions.userId, userId), isNull(focusSessions.endedAt)));
    let replaced: FocusSession | undefined;
    for (const s of open) {
      const closed = await endFocusSession(tx, userId, s.id, isAbandoned(s, now) ? "abandoned" : "stopped_early", now);
      if (closed?.outcome === "stopped_early") replaced = closed;
    }
    const [row] = await tx
      .insert(focusSessions)
      .values({
        userId,
        intentionId: input.intentionId ?? null,
        goal: input.goal.trim(),
        firstStep: input.firstStep.trim(),
        approach: input.approach?.trim() || null,
        plannedMinutes: input.plannedMinutes,
        checkInMinutes: input.checkInMinutes,
        startedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      // Another start committed between the close and this insert: its session is the one running.
      const [winner] = await tx.select().from(focusSessions).where(and(eq(focusSessions.userId, userId), isNull(focusSessions.endedAt))).limit(1);
      if (!winner) throw new Error("startFocusSession: the insert conflicted, but no session is open");
      return { session: winner, replaced };
    }
    if (row.intentionId) {
      await tx.update(intentions).set({ lastTouchedAt: now }).where(and(eq(intentions.id, row.intentionId), eq(intentions.userId, userId)));
    }
    await appendEvent(tx, {
      userId,
      type: "session.started",
      subjectType: "session",
      subjectId: row.id,
      payload: { goal: row.goal, first_step: row.firstStep, planned_minutes: row.plannedMinutes, approach: row.approach, intention_id: row.intentionId },
      occurredAt: now,
    });
    return { session: row, replaced };
  });
}

/** Close a running session. Returns undefined when it isn't theirs or is already closed. */
export async function endFocusSession(db: Db, userId: string, id: string, outcome: SessionOutcome, now: Date = new Date()): Promise<FocusSession | undefined> {
  return atomic(db, async (tx) => {
    const [row] = await tx
      .update(focusSessions)
      .set({ endedAt: now, outcome })
      .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId), isNull(focusSessions.endedAt)))
      .returning();
    if (!row) return undefined;
    await appendEvent(tx, {
      userId,
      type: "session.ended",
      subjectType: "session",
      subjectId: row.id,
      payload: { outcome, actual_minutes: outcome === "abandoned" ? null : elapsedMinutes(row, now), approach: row.approach, intention_id: row.intentionId },
      occurredAt: now,
    });
    return row;
  });
}

export type CheckInResponse = "ok" | "stuck" | "distracted" | "done";

/** A check-in answer. Event only; "ok" is the whole of what Yep does. */
export async function recordCheckIn(db: Db, userId: string, sessionId: string, response: CheckInResponse, now: Date = new Date()): Promise<FocusSession | undefined> {
  const s = await getSession(db, userId, sessionId);
  if (!s || s.endedAt) return undefined;
  await appendEvent(db, { userId, type: "session.check_in", subjectType: "session", subjectId: s.id, payload: { response, minute: elapsedMinutes(s, now) }, occurredAt: now });
  return s;
}

export async function getSession(db: Db, userId: string, id: string): Promise<FocusSession | undefined> {
  const [row] = await db.select().from(focusSessions).where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId))).limit(1);
  return row;
}

/** The running session, if any — one that hasn't reached the abandonment threshold. */
export async function activeSession(db: Db, userId: string, now: Date = new Date()): Promise<FocusSession | undefined> {
  const [row] = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.userId, userId), isNull(focusSessions.endedAt)))
    .orderBy(desc(focusSessions.startedAt))
    .limit(1);
  return row && !isAbandoned(row, now) ? row : undefined;
}

/**
 * Close every open session that has gone quiet past its threshold (twice the
 * planned length with no end signal) as `abandoned`. Not a failure state: the
 * greeting offers to pick it back up or let it go. Returns what it closed.
 */
export async function sweepAbandoned(db: Db, userId: string, now: Date = new Date()): Promise<FocusSession[]> {
  const open = await db.select().from(focusSessions).where(and(eq(focusSessions.userId, userId), isNull(focusSessions.endedAt)));
  const closed: FocusSession[] = [];
  for (const s of open) {
    if (!isAbandoned(s, now)) continue;
    const row = await endFocusSession(db, userId, s.id, "abandoned", now);
    if (row) closed.push(row);
  }
  return closed;
}

export type SessionState = {
  /** Running now. */
  active?: FocusSession;
  /** The most recently ended session, if it ended in the last day and a half. */
  last?: FocusSession;
};

/**
 * Sweep, then read: the one call a page or a turn makes. Sweeping here is
 * what "closed on the next visit" means — any visit, any page.
 */
export async function resolveSession(db: Db, userId: string, now: Date = new Date()): Promise<SessionState> {
  await sweepAbandoned(db, userId, now);
  const [active, last] = await Promise.all([activeSession(db, userId, now), lastEndedSession(db, userId, new Date(now.getTime() - TODAY_BOUND_MS))]);
  return { active, last };
}

/** The session that ended most recently, at or after `since`. Open sessions (no `ended_at`) never match, so they can't crowd it out of the sort. */
async function lastEndedSession(db: Db, userId: string, since: Date): Promise<FocusSession | undefined> {
  const [row] = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.userId, userId), gte(focusSessions.endedAt, since)))
    .orderBy(desc(focusSessions.endedAt))
    .limit(1);
  return row;
}

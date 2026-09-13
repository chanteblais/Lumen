/**
 * Users: lazy creation keyed by the auth provider id, visit tracking, timezone.
 * The auth layer (src/lib/auth.ts) calls ensureUser() / visit() and hands the
 * internal row to everything else — nothing outside lib/auth sees a Clerk id.
 */
import { and, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { type Db } from "@/db/client";
import { DEFAULT_PREFERENCES, users, type User } from "@/db/schema";
import { appendEvent, latestEvent } from "./events";

/**
 * A sitting: one visit, opened by an `app.opened` event (written whenever the
 * gap since the last request was ≥ 30 min) and carrying the gap it began
 * after. Derived, never stored: the newest app.opened is always the start of
 * the current sitting, so "came back after two weeks" survives every request
 * of the visit — the greeting, the first turn, and the fifth.
 */
export type Sitting = { openedAt: Date; gapSeconds: number };

const REENTRY_GAP_SECONDS = 7 * 86_400;

export async function currentSitting(db: Db, userId: string): Promise<Sitting | undefined> {
  const e = await latestEvent(db, userId, "app.opened");
  if (!e) return undefined;
  const gap = Number((e.payload as { gap_seconds?: number }).gap_seconds ?? 0);
  return { openedAt: e.occurredAt, gapSeconds: Number.isFinite(gap) ? gap : 0 };
}

/** Pure: this sitting began after a week or more away — re-entry mode. */
export function isReentry(s: Sitting | undefined): boolean {
  return Boolean(s && s.gapSeconds >= REENTRY_GAP_SECONDS);
}

/** Pure: the last time they were here before this sitting began. */
export function visitBeforeSitting(s: Sitting): Date {
  return new Date(s.openedAt.getTime() - s.gapSeconds * 1000);
}

type EnsureUserInput = {
  clerkUserId: string;
  /**
   * What Lumi calls them. Only needed when creating the row, so a caller that
   * has to fetch it (the auth provider's profile — a network call) passes a
   * function and pays for it once, not on every request.
   */
  displayName: string | (() => Promise<string>);
  /** IANA timezone from the browser; only used when creating the row. */
  timezone?: string;
};

/** Find-or-create the user row. Idempotent; safe to call on every request. */
export async function ensureUser(db: Db, input: EnsureUserInput): Promise<User> {
  const existing = await db.query.users.findFirst({ where: eq(users.clerkUserId, input.clerkUserId) });
  if (existing) return existing;

  const displayName = typeof input.displayName === "function" ? await input.displayName() : input.displayName;
  const [created] = await db
    .insert(users)
    .values({
      clerkUserId: input.clerkUserId,
      displayName,
      timezone: isValidTimezone(input.timezone) ? input.timezone : "UTC",
      preferences: DEFAULT_PREFERENCES,
    })
    .onConflictDoNothing({ target: users.clerkUserId })
    .returning();

  // Lost a race with a concurrent first request — read the winner.
  if (!created) {
    const winner = await db.query.users.findFirst({ where: eq(users.clerkUserId, input.clerkUserId) });
    if (!winner) throw new Error("ensureUser: insert and lookup both failed");
    return winner;
  }

  await appendEvent(db, { userId: created.id, type: "user.created", subjectType: "user", subjectId: created.id });
  return created;
}

/**
 * Record a visit. Returns the previous last_seen_at so the caller can compute
 * the gap for the greeting / context block. Writes app.opened only when the
 * gap is meaningful (≥ 30 min) so the events table isn't spammed by turns.
 */
export async function touchLastSeen(db: Db, user: User, now: Date = new Date()): Promise<Date> {
  const previous = user.lastSeenAt;
  await db.update(users).set({ lastSeenAt: now }).where(eq(users.id, user.id));
  await openSitting(db, user.id, previous, now);
  return previous;
}

/**
 * Find the user and record the visit in one round trip: `ensureUser` +
 * `touchLastSeen` for a row that already exists, which is every request but the
 * first. The row comes back as it was before this visit — `lastSeenAt` is the
 * previous visit, as `ensureUser` would have returned it — with the browser's
 * timezone applied when it's valid. Undefined when there is no row yet.
 */
export async function visit(db: Db, clerkUserId: string, timezone: string | undefined, now: Date = new Date()): Promise<{ user: User; previous: Date } | undefined> {
  // The joined copy of the row is read before the update applies, so it carries the previous visit.
  const before = alias(users, "before");
  const [row] = await db
    .update(users)
    .set({ lastSeenAt: now, ...(isValidTimezone(timezone) ? { timezone } : {}) })
    .from(before)
    .where(and(eq(users.clerkUserId, clerkUserId), eq(before.id, users.id)))
    .returning({ ...getTableColumns(users), previous: before.lastSeenAt });
  if (!row) return undefined;
  const { previous, ...updated } = row;
  await openSitting(db, updated.id, previous, now);
  return { user: { ...updated, lastSeenAt: previous }, previous };
}

/** A gap of 30 min or more since the last request opens a sitting: `app.opened`, carrying the gap. */
async function openSitting(db: Db, userId: string, previous: Date, now: Date): Promise<void> {
  const gapSeconds = Math.round((now.getTime() - previous.getTime()) / 1000);
  if (gapSeconds >= 30 * 60) {
    await appendEvent(db, { userId, type: "app.opened", subjectType: "user", subjectId: userId, payload: { gap_seconds: gapSeconds } });
  }
}

/** Set the timezone if the browser reports a valid one that differs. */
export async function updateTimezone(db: Db, user: User, timezone: string): Promise<void> {
  if (!isValidTimezone(timezone) || timezone === user.timezone) return;
  await db.update(users).set({ timezone }).where(eq(users.id, user.id));
}

export function isValidTimezone(tz: string | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

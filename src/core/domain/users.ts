/**
 * Users: lazy creation keyed by the auth provider id, visit tracking, timezone.
 * The auth layer (src/lib/auth.ts) calls ensureUser() and hands the internal
 * row to everything else — nothing outside lib/auth sees a Clerk id.
 */
import { eq } from "drizzle-orm";
import { type Db } from "@/db/client";
import { DEFAULT_PREFERENCES, users, type User } from "@/db/schema";
import { appendEvent } from "./events";

export type EnsureUserInput = {
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
  const gapSeconds = Math.round((now.getTime() - previous.getTime()) / 1000);
  if (gapSeconds >= 30 * 60) {
    await appendEvent(db, { userId: user.id, type: "app.opened", subjectType: "user", subjectId: user.id, payload: { gap_seconds: gapSeconds } });
  }
  return previous;
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

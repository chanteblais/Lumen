// The server-side auth boundary. This file and src/lib/auth-ui.tsx are the
// only places outside the sign-in/sign-up pages that import Clerk.
// Everything else works with the internal `User` row from src/db/schema.
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import type { User } from "@/db/schema";
import { ensureUser, touchLastSeen, updateTimezone } from "@/core/domain/users";

/** Cookie set by <TimezoneCapture /> with the browser's IANA timezone. */
export const TIMEZONE_COOKIE = "lumen_tz";

/**
 * The signed-in user's internal row, or a redirect to sign-in.
 * Creates the row on first visit (name from Clerk, timezone from the cookie)
 * and keeps the timezone current afterwards. Server components and route
 * handlers only.
 *
 * `auth()` verifies the session cookie locally; the Clerk profile (a network
 * call) is fetched only when the row has to be created.
 */
export async function requireUser(): Promise<User> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const tz = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const existing = await ensureUser(db(), {
    clerkUserId,
    displayName: displayNameFromClerk,
    timezone: tz,
  });
  if (tz && tz !== existing.timezone) {
    await updateTimezone(db(), existing, tz);
    return { ...existing, timezone: tz };
  }
  return existing;
}

/**
 * Record a visit and return the previous last_seen_at (for the greeting and
 * the context block). Call once per page open / chat turn, after requireUser.
 */
export async function recordVisit(user: User): Promise<Date> {
  return touchLastSeen(db(), user);
}

async function displayNameFromClerk(): Promise<string> {
  const u = await currentUser();
  return u?.firstName ?? u?.username ?? "there";
}

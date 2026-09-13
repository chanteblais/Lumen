// The server-side auth boundary. This file, src/lib/auth-ui.tsx,
// src/lib/auth-mail.tsx and src/proxy.ts (the middleware, clerkMiddleware) are
// the only places outside the sign-in/sign-up pages that import Clerk.
// Everything else works with the internal `User` row from src/db/schema.
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import type { User } from "@/db/schema";
import { ensureUser, touchLastSeen, updateTimezone, visit } from "@/core/domain/users";

/** Cookie set by <TimezoneCapture /> with the browser's IANA timezone. */
export const TIMEZONE_COOKIE = "coherence_tz";

/**
 * The signed-in user's internal row, or a redirect to sign-in.
 * Creates the row on first visit (name from Clerk, timezone from the cookie)
 * and keeps the timezone current afterwards. Server components and route
 * handlers only. For a page open or a chat turn, use `requireVisit()`.
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
 * A page open or a chat turn: the signed-in user's row (as `requireUser` returns
 * it) and the previous last_seen_at (for the greeting and the context block),
 * or a redirect to sign-in. The lookup and the visit write are one query
 * (`visit`), so a page waits on one round trip before its own queries, not two;
 * only the very first request creates the row first.
 */
export async function requireVisit(): Promise<{ user: User; previous: Date }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const tz = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const visited = await visit(db(), clerkUserId, tz);
  if (visited) return visited;
  const user = await requireUser();
  return { user, previous: await touchLastSeen(db(), user) };
}

/**
 * The user's Google OAuth access token, minted and refreshed by Clerk from
 * the Google account connected to their Clerk user. Undefined when no Google
 * account is connected (or Clerk can't say). Scopes are what Google granted;
 * src/lib/email.ts checks for the mail one.
 */
export async function googleAccessToken(user: User): Promise<{ token: string; scopes: string[] } | undefined> {
  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserOauthAccessToken(user.clerkUserId, "google");
    const t = data[0];
    return t ? { token: t.token, scopes: t.scopes ?? [] } : undefined;
  } catch {
    return undefined;
  }
}

async function displayNameFromClerk(): Promise<string> {
  const u = await currentUser();
  return u?.firstName ?? u?.username ?? "there";
}

// Mail access for the signed-in user: a Gmail reader over the Google token
// Clerk holds, or the reason there isn't one. Server only.
import { gmailReader } from "@/core/email/gmail";
import { GMAIL_READONLY_SCOPE, type EmailReader } from "@/core/email/types";
import type { User } from "@/db/schema";
import { googleAccessToken } from "./auth";

export type MailAccess =
  | { status: "ready"; reader: EmailReader }
  /** No Google account on their Clerk user. */
  | { status: "not_connected" }
  /** Google is connected, but without the read-only mail scope. */
  | { status: "needs_scope" };

export async function mailAccessFor(user: User): Promise<MailAccess> {
  const t = await googleAccessToken(user);
  if (!t) return { status: "not_connected" };
  // Older tokens may carry no scope list; then the first read decides (GmailAuthError → disconnected).
  if (t.scopes.length && !t.scopes.includes(GMAIL_READONLY_SCOPE)) return { status: "needs_scope" };
  return { status: "ready", reader: gmailReader(t.token) };
}

/** For chat tools: the Clerk call happens only if Lumi actually looks, and once per turn. */
export function lazyMailReader(user: User): () => Promise<EmailReader | undefined> {
  let pending: Promise<EmailReader | undefined> | undefined;
  return () => (pending ??= mailAccessFor(user).then((a) => (a.status === "ready" ? a.reader : undefined)));
}

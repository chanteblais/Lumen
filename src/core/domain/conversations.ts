/**
 * The one continuous conversation per user, and its messages stored as
 * AI SDK UIMessage parts. Load a window; the rest is summarised later (M6).
 */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { UIMessage } from "ai";
import { type Db } from "@/db/client";
import { conversations, messages, type MessageRole } from "@/db/schema";

/**
 * `kind`/`intentionId`/`reason` mark structured handoffs from Today (start · declined · break_down);
 * `kind: "session_event"` with `sessionId`/`response` is a tap on the session bar or a check-in.
 */
export type CoherenceMessageMetadata = { createdAt?: string; kind?: string; intentionId?: string; reason?: string; sessionId?: string; response?: string; minute?: number };
export type CoherenceUIMessage = UIMessage<CoherenceMessageMetadata>;

export const MESSAGE_WINDOW = 30;

/** The user's main conversation: the oldest, should a race on a first visit ever have made two (nothing in the schema prevents it). */
const mainConversationOf = (userId: string) => and(eq(conversations.userId, userId), eq(conversations.kind, "main"));

export async function ensureMainConversation(db: Db, userId: string) {
  const existing = await db.query.conversations.findFirst({
    where: mainConversationOf(userId),
    orderBy: asc(conversations.createdAt),
  });
  if (existing) return existing;
  const [created] = await db.insert(conversations).values({ userId, kind: "main" }).returning();
  return created;
}

/** Most recent `limit` messages, oldest first, as UIMessages with createdAt metadata. */
export async function loadRecentMessages(db: Db, conversationId: string, limit = MESSAGE_WINDOW): Promise<CoherenceUIMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return toUIMessages(rows);
}

/**
 * The same window of the main conversation, found by user rather than by id, so
 * a page can load it alongside `ensureMainConversation` instead of after it.
 * Empty on a first visit, before the conversation exists.
 */
export async function loadRecentMainMessages(db: Db, userId: string, limit = MESSAGE_WINDOW): Promise<CoherenceUIMessage[]> {
  const main = db.select({ id: conversations.id }).from(conversations).where(mainConversationOf(userId)).orderBy(asc(conversations.createdAt)).limit(1);
  const rows = await db
    .select()
    .from(messages)
    .where(inArray(messages.conversationId, main))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return toUIMessages(rows);
}

/** Rows newest first → UIMessages oldest first. */
function toUIMessages(rows: (typeof messages.$inferSelect)[]): CoherenceUIMessage[] {
  return rows.reverse().map((r) => ({
    id: r.id,
    role: r.role,
    parts: r.parts as CoherenceUIMessage["parts"],
    metadata: { createdAt: r.createdAt.toISOString() },
  }));
}

/** Insert-or-replace by id (the same message can be finalised after streaming). */
export async function saveMessage(db: Db, conversationId: string, m: CoherenceUIMessage): Promise<void> {
  await db
    .insert(messages)
    .values({ id: m.id, conversationId, role: m.role as MessageRole, parts: m.parts })
    .onConflictDoUpdate({ target: messages.id, set: { parts: m.parts } });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

export async function messageCount(db: Db, conversationId: string): Promise<number> {
  const rows = await db.select({ id: messages.id }).from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  return rows.length;
}

/**
 * A "sitting": messages within this window of each other belong to one visit.
 * Thirty minutes — the same gap that writes `app.opened` (`touchLastSeen`),
 * so "a new visit" means one thing everywhere. The date rules between
 * messages keep their own, wider window (they are about days, not pauses).
 */
export const SITTING_GAP_MS = 30 * 60_000;

/** True when the newest message is from this sitting — quick starts hide, the greeting compacts. */
export function isInSitting(messages: CoherenceUIMessage[], now = Date.now()): boolean {
  const last = messages[messages.length - 1];
  const at = last?.metadata?.createdAt ? new Date(last.metadata.createdAt).getTime() : undefined;
  return at !== undefined && now - at < SITTING_GAP_MS;
}

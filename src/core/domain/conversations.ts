/**
 * The one continuous conversation per user, and its messages stored as
 * AI SDK UIMessage parts. Load a window; the rest is summarised later (M6).
 */
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { UIMessage } from "ai";
import { type Db } from "@/db/client";
import { conversations, messages, type MessageRole } from "@/db/schema";
import type { SharedFileNote } from "@/core/shared-files";

/**
 * `kind`/`intentionId`/`reason` mark structured handoffs from Today (start · declined · break_down);
 * `kind: "session_event"` with `sessionId`/`response` is a tap on the session bar or a check-in.
 */
export type CoherenceMessageMetadata = { createdAt?: string; kind?: string; intentionId?: string; reason?: string; sessionId?: string; response?: string; minute?: number };
/** `data-shared-file`: the note kept in place of a file shared with a message (`core/shared-files.ts`). */
export type CoherenceDataParts = { "shared-file": SharedFileNote };
export type CoherenceUIMessage = UIMessage<CoherenceMessageMetadata, CoherenceDataParts>;

export const MESSAGE_WINDOW = 30;

/** The user's main conversation. One per user, held by the unique index `conversations_user_main_idx`. */
const mainConversationOf = (userId: string) => and(eq(conversations.userId, userId), eq(conversations.kind, "main"));

const findMain = (db: Db, userId: string) => db.query.conversations.findFirst({ where: mainConversationOf(userId), orderBy: asc(conversations.createdAt) });

/** Find or create it. Two first visits racing: the second insert does nothing and reads the first's. */
export async function ensureMainConversation(db: Db, userId: string) {
  const existing = await findMain(db, userId);
  if (existing) return existing;
  const [created] = await db.insert(conversations).values({ userId, kind: "main" }).onConflictDoNothing().returning();
  if (created) return created;
  const winner = await findMain(db, userId);
  if (!winner) throw new Error("ensureMainConversation: the insert conflicted, but no main conversation was found");
  return winner;
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

/** How many messages the conversation holds: the chat route's window starts at a step counted from its first (`core/ai/prompt.ts → stableWindow`). */
export async function countMessages(db: Db, conversationId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(messages).where(eq(messages.conversationId, conversationId));
  return Number(row?.n ?? 0);
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

/**
 * Insert-or-replace by id (the same message can be finalised after streaming)
 * — only within this conversation. An id already used in another one (a resent
 * or forged id) is left alone and logged; it never overwrites that row.
 */
export async function saveMessage(db: Db, conversationId: string, m: CoherenceUIMessage): Promise<void> {
  const saved = await db
    .insert(messages)
    .values({ id: m.id, conversationId, role: m.role as MessageRole, parts: m.parts })
    .onConflictDoUpdate({ target: messages.id, set: { parts: m.parts }, setWhere: eq(messages.conversationId, conversationId) })
    .returning({ id: messages.id });
  if (!saved.length) {
    console.warn(`[conversations] message ${m.id} belongs to another conversation; not saved`);
    return;
  }
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
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

/** The words of a message — its text parts joined — without tool calls or metadata. */
export function messageText(m: Pick<CoherenceUIMessage, "parts">): string {
  return m.parts
    .filter((p): p is Extract<CoherenceUIMessage["parts"][number], { type: "text" }> => p.type === "text")
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join(" ");
}

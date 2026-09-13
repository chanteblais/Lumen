/**
 * The Library as data: threads (persistent subjects of the user's life), the
 * notes Lumi files under them, and episodes (recent memory of conversation).
 * Written by consolidation (`core/ai/consolidate.ts`) and by Lumi's library
 * tools. Every write checks ownership, runs the same screens as beliefs
 * (`memory-rules.ts`) and appends an event with no words in it. See
 * docs/architecture.md → The Library.
 */
import { and, asc, desc, eq, gt, gte, inArray, isNull, isNotNull, or, sql } from "drizzle-orm";
import { type Db } from "@/db/client";
import { conversations, episodes, events, messages, threadNotes, threads, type Episode, type NoteSource, type Thread, type ThreadNote, type ThreadNoteKind } from "@/db/schema";
import { normalizeText } from "@/core/words";
import { appendEvent } from "./events";
import { cleanContent, contentKey, isNearDuplicate, screenMemory } from "./memory-rules";

export const NOTE_MIN = 3;
export const NOTE_MAX = 280;
export const SUMMARY_MAX = 900;
export const TITLE_MAX = 80;
export const ALIAS_MAX = 40;
export const MAX_ALIASES = 8;
export const THREAD_LIMIT = 100;
export const NOTE_LIMIT = 600;
/** Episodes older than this don't ride along; they stay in the table. */
export const EPISODE_RECENT_DAYS = 14;

export type LibraryActor = "user" | "lumi" | "consolidation";

export const NOTE_KINDS = ["idea", "decision", "question", "progress", "detail"] as const satisfies readonly ThreadNoteKind[];

/* -------------------------------------------------------------- pure */

/** A title or alias as it's compared: "The Book!" ≈ "the book". */
export function nameKey(s: string): string {
  return normalizeText(s);
}

/** Cleaned aliases with no repeats of the title or each other, capped. */
export function mergeAliases(title: string, existing: string[], add: string[]): string[] {
  const seen = new Set([nameKey(title)]);
  const out: string[] = [];
  for (const a of [...existing, ...add]) {
    const clean = cleanContent(a).slice(0, ALIAS_MAX);
    const k = nameKey(clean);
    if (k.length < 3 || seen.has(k)) continue;
    seen.add(k);
    out.push(clean);
    if (out.length >= MAX_ALIASES) break;
  }
  return out;
}

/** The held thread this name (a title or an alias) already belongs to. */
export function findThreadByName<T extends Pick<Thread, "title" | "aliases">>(held: T[], name: string): T | undefined {
  const k = nameKey(name);
  if (!k) return undefined;
  return held.find((t) => nameKey(t.title) === k || t.aliases.some((a) => nameKey(a) === k));
}

/* ------------------------------------------------------------ shelves */

/**
 * A section, then a shelf in it, then a book: a thread sits at most this many
 * levels deep. Deeper nesting would ask the user to navigate a filing tree.
 */
export const MAX_SHELF_DEPTH = 3;

type Shelvable = { id: string; parentId?: string | null };

/** Its ancestors, nearest last: [section, shelf] for a book on a shelf. Stops at a cycle. */
export function shelfPath<T extends Shelvable>(held: T[], id: string): T[] {
  const byId = new Map(held.map((t) => [t.id, t] as const));
  const path: T[] = [];
  const seen = new Set([id]);
  let parent = byId.get(id)?.parentId;
  while (parent && byId.has(parent) && !seen.has(parent)) {
    seen.add(parent);
    path.unshift(byId.get(parent)!);
    parent = byId.get(parent)!.parentId;
  }
  return path;
}

/** How many levels a thread and everything under it take: 1 for a thread with nothing under it. */
function subtreeHeight(held: Shelvable[], id: string, seen = new Set<string>()): number {
  if (seen.has(id)) return 0;
  seen.add(id);
  const children = held.filter((t) => t.parentId === id);
  return 1 + Math.max(0, ...children.map((c) => subtreeHeight(held, c.id, seen)));
}

/** Why this thread can't go under that one, or null when it can. Null parent (taking it off its shelf) always can. Pure. */
export function whyNotShelve(held: Shelvable[], threadId: string, parentId: string | null): string | null {
  if (!held.some((t) => t.id === threadId)) return "not found";
  if (parentId === null) return null;
  if (parentId === threadId) return "a thread can't go under itself";
  if (!held.some((t) => t.id === parentId)) return "not found";
  if (shelfPath(held, parentId).some((t) => t.id === threadId)) return "that thread is already under this one";
  const depth = shelfPath(held, parentId).length + 1 + subtreeHeight(held, threadId);
  return depth > MAX_SHELF_DEPTH ? "too deep — the Library goes section, shelf, book" : null;
}

export type ShelfBooks<T> = { shelf: T | null; books: T[] };
export type LibrarySection<T> = { thread: T; shelves: ShelfBooks<T>[] };
export type LibraryShelves<T> = { sections: LibrarySection<T>[]; loose: T[] };

const byAge = <T extends Pick<Thread, "createdAt">>(a: T, b: T) => a.createdAt.getTime() - b.createdAt.getTime();

/**
 * The Library as the room shows it. A section is a thread with threads under
 * it; inside a section, a thread with threads under it is a shelf, and the
 * rest are books on the section's own shelf (listed first, with no plaque).
 * A thread under nothing and holding nothing is loose — it hasn't found a
 * section yet. Everything is in the order it arrived, so a section keeps its
 * bookcase and a book its place as more is added. Pure.
 */
export function buildShelves<T extends Pick<Thread, "id" | "parentId" | "createdAt">>(held: T[]): LibraryShelves<T> {
  const ids = new Set(held.map((t) => t.id));
  // A parent that isn't among these threads (it's past the read limit) leaves its children at the top.
  const parentOf = (t: T) => (t.parentId && ids.has(t.parentId) ? t.parentId : null);
  const childrenOf = (id: string) => held.filter((t) => parentOf(t) === id).sort(byAge);
  const top = held.filter((t) => parentOf(t) === null).sort(byAge);
  const sections: LibrarySection<T>[] = [];
  const loose: T[] = [];
  for (const t of top) {
    const children = childrenOf(t.id);
    if (!children.length) {
      loose.push(t);
      continue;
    }
    const own = children.filter((c) => !childrenOf(c.id).length);
    const shelves = children.filter((c) => childrenOf(c.id).length).map((c) => ({ shelf: c, books: childrenOf(c.id) }));
    sections.push({ thread: t, shelves: [...(own.length ? [{ shelf: null, books: own }] : []), ...shelves] });
  }
  return { sections, loose };
}

/* ------------------------------------------------------------- reads */

export async function listThreads(db: Db, userId: string, limit = THREAD_LIMIT): Promise<Thread[]> {
  return db.select().from(threads).where(eq(threads.userId, userId)).orderBy(desc(threads.lastDiscussedAt)).limit(limit);
}

export async function getOwnedThread(db: Db, userId: string, id: string): Promise<Thread | undefined> {
  const [row] = await db.select().from(threads).where(and(eq(threads.id, id), eq(threads.userId, userId))).limit(1);
  return row;
}

/** Current notes (not superseded), newest first — for these threads, or all of the user's. */
export async function listCurrentNotes(db: Db, userId: string, threadIds?: string[], limit = NOTE_LIMIT): Promise<ThreadNote[]> {
  if (threadIds && threadIds.length === 0) return [];
  return db
    .select()
    .from(threadNotes)
    .where(and(eq(threadNotes.userId, userId), isNull(threadNotes.supersededById), threadIds ? inArray(threadNotes.threadId, threadIds) : undefined))
    .orderBy(desc(threadNotes.createdAt))
    .limit(limit);
}

/** Notes a later note replaced: how the thinking changed. */
export async function listNoteHistory(db: Db, userId: string, threadId: string, limit = 10): Promise<ThreadNote[]> {
  return db
    .select()
    .from(threadNotes)
    .where(and(eq(threadNotes.userId, userId), eq(threadNotes.threadId, threadId), isNotNull(threadNotes.supersededById)))
    .orderBy(desc(threadNotes.createdAt))
    .limit(limit);
}

export async function listRecentEpisodes(db: Db, userId: string, now: Date, limit = 10): Promise<Episode[]> {
  const since = new Date(now.getTime() - EPISODE_RECENT_DAYS * 86_400_000);
  return db
    .select()
    .from(episodes)
    .where(and(eq(episodes.userId, userId), gte(episodes.endedAt, since)))
    .orderBy(desc(episodes.endedAt))
    .limit(limit);
}

export type LibraryState = { threads: Thread[]; notes: ThreadNote[]; episodes: Episode[]; unavailable: boolean };

/** Everything a turn chooses from — or nothing, and say so: the Library failing never takes the conversation down. */
export async function loadLibraryOrNothing(db: Db, userId: string, now: Date = new Date()): Promise<LibraryState> {
  try {
    const [t, n, e] = await Promise.all([listThreads(db, userId), listCurrentNotes(db, userId), listRecentEpisodes(db, userId, now)]);
    return { threads: t, notes: n, episodes: e, unavailable: false };
  } catch (err) {
    console.error("[library] couldn't read the Library; carrying on without it", err);
    return { threads: [], notes: [], episodes: [], unavailable: true };
  }
}

/* ------------------------------------------------------------ writes */

export type Skip = { skipped: string };

export async function createThread(
  db: Db,
  userId: string,
  input: { title: string; aliases?: string[]; summary?: string | null },
  actor: LibraryActor,
  now: Date = new Date(),
): Promise<{ thread: Thread; existed: boolean } | Skip> {
  const title = cleanContent(input.title).slice(0, TITLE_MAX);
  if (nameKey(title).length < 2) return { skipped: "title" };
  if (screenMemory(title)) return { skipped: screenMemory(title)! };
  const held = await listThreads(db, userId);
  const same = findThreadByName(held, title) ?? (input.aliases ?? []).map((a) => findThreadByName(held, a)).find(Boolean);
  if (same) return { thread: same, existed: true };
  if (actor !== "user" && (await isForgotten(db, userId, title))) return { skipped: "forgotten" };
  const summary = input.summary ? cleanSummary(input.summary) : null;
  const [row] = await db
    .insert(threads)
    .values({ userId, title, aliases: mergeAliases(title, [], input.aliases ?? []), summary, summaryRevisedAt: summary ? now : null, lastDiscussedAt: now })
    .returning();
  await appendEvent(db, { userId, type: "library.thread_created", subjectType: "thread", subjectId: row.id, payload: { by: actor }, occurredAt: now });
  return { thread: row, existed: false };
}

export async function fileNote(
  db: Db,
  userId: string,
  input: { threadId: string; kind: ThreadNoteKind; content: string; source: NoteSource; sourceMessageId?: string; supersedes?: string; episodeId?: string },
  actor: LibraryActor,
  now: Date = new Date(),
): Promise<{ note: ThreadNote; replaced?: ThreadNote } | (Skip & { existing?: ThreadNote })> {
  const thread = await getOwnedThread(db, userId, input.threadId);
  if (!thread) return { skipped: "not found" };
  const content = cleanContent(input.content);
  if (content.length < NOTE_MIN || content.length > NOTE_MAX) return { skipped: "content length" };
  const screened = screenMemory(content);
  if (screened) return { skipped: screened };
  const current = await listCurrentNotes(db, userId, [thread.id]);
  const same = current.find((n) => isNearDuplicate(n.content, content));
  if (same) return { skipped: "already_held", existing: same };
  if (actor !== "user" && (await isForgotten(db, userId, content))) return { skipped: "forgotten" };
  const replaced = input.supersedes ? current.find((n) => n.id === input.supersedes) : undefined;
  if (input.supersedes && !replaced) return { skipped: "supersedes a note that isn't current on this thread" };
  const [note] = await db
    .insert(threadNotes)
    .values({ userId, threadId: thread.id, kind: input.kind, content, source: input.source, sourceMessageId: input.sourceMessageId ?? null, episodeId: input.episodeId ?? null, createdAt: now })
    .returning();
  if (replaced) await db.update(threadNotes).set({ supersededById: note.id }).where(eq(threadNotes.id, replaced.id));
  await db.update(threads).set({ lastDiscussedAt: now }).where(eq(threads.id, thread.id));
  await appendEvent(db, {
    userId,
    type: "library.noted",
    subjectType: "thread",
    subjectId: thread.id,
    payload: { note: note.id, kind: input.kind, source: input.source, supersedes: replaced?.id ?? null, by: actor },
    occurredAt: now,
  });
  return { note, replaced };
}

function cleanSummary(s: string): string | null {
  const summary = cleanContent(s).slice(0, SUMMARY_MAX);
  return summary.length >= 20 && !screenMemory(summary) ? summary : null;
}

/** Rewrite a thread's quick summary. Null when it was refused. */
export async function reviseSummary(db: Db, userId: string, threadId: string, text: string, actor: LibraryActor, now: Date = new Date()): Promise<string | null> {
  const thread = await getOwnedThread(db, userId, threadId);
  const summary = cleanSummary(text);
  if (!thread || !summary) return null;
  await db.update(threads).set({ summary, summaryRevisedAt: now, lastDiscussedAt: now }).where(eq(threads.id, thread.id));
  await appendEvent(db, { userId, type: "library.summary_revised", subjectType: "thread", subjectId: thread.id, payload: { by: actor }, occurredAt: now });
  return summary;
}

export async function addAliases(db: Db, userId: string, threadId: string, add: string[]): Promise<string[] | null> {
  const thread = await getOwnedThread(db, userId, threadId);
  if (!thread) return null;
  const merged = mergeAliases(thread.title, thread.aliases, add);
  if (merged.length !== thread.aliases.length) await db.update(threads).set({ aliases: merged }).where(eq(threads.id, thread.id));
  return merged;
}

export async function insertEpisode(
  db: Db,
  input: { userId: string; conversationId: string; summary: string; leftOff: string | null; startedAt: Date; endedAt: Date; throughMessageId: string; threadIds?: string[] },
): Promise<Episode> {
  const [row] = await db
    .insert(episodes)
    .values({ ...input, threadIds: input.threadIds ?? [] })
    .returning();
  return row;
}

/**
 * Put a thread under another (or take it off its shelf, `parentId` null).
 * Checks ownership and depth; Lumi and consolidation never move a thread the
 * user placed. Appends `library.shelved` with where it was and who moved it.
 */
export async function shelveThread(
  db: Db,
  userId: string,
  threadId: string,
  parentId: string | null,
  actor: LibraryActor,
): Promise<{ thread: Thread } | Skip> {
  const held = await db.select().from(threads).where(eq(threads.userId, userId));
  const thread = held.find((t) => t.id === threadId);
  const why = whyNotShelve(held, threadId, parentId);
  if (!thread || why) return { skipped: why ?? "not found" };
  if (thread.parentId === parentId) return { thread };
  if (actor !== "user" && thread.shelvedBy === "user") return { skipped: "placed by them" };
  const [row] = await db
    .update(threads)
    .set({ parentId, shelvedBy: parentId ? (actor === "user" ? "user" : "lumi") : actor === "user" ? "user" : null })
    .where(and(eq(threads.id, thread.id), eq(threads.userId, userId)))
    .returning();
  await appendEvent(db, { userId, type: "library.shelved", subjectType: "thread", subjectId: thread.id, payload: { under: parentId, from: thread.parentId, by: actor } });
  return { thread: row };
}

/** Visits that touched this thread, newest first. */
export async function listThreadEpisodes(db: Db, userId: string, threadId: string, limit = 12): Promise<Episode[]> {
  return db
    .select()
    .from(episodes)
    .where(and(eq(episodes.userId, userId), sql`${episodes.threadIds} @> ${JSON.stringify([threadId])}::jsonb`))
    .orderBy(desc(episodes.endedAt))
    .limit(limit);
}

export async function setEpisodeThreads(db: Db, episodeId: string, threadIds: string[]): Promise<void> {
  await db.update(episodes).set({ threadIds }).where(eq(episodes.id, episodeId));
}

/* --------------------------------------------------------- forgetting */

/** The user's forgetting of one note: it and every note it replaced or was replaced by, deleted. Ids removed. */
export async function forgetNote(db: Db, userId: string, noteId: string): Promise<string[]> {
  const [start] = await db.select().from(threadNotes).where(and(eq(threadNotes.id, noteId), eq(threadNotes.userId, userId))).limit(1);
  if (!start) return [];
  const found = new Map<string, ThreadNote>([[start.id, start]]);
  let frontier = [start];
  while (frontier.length) {
    const ids = frontier.map((n) => n.id);
    const forward = frontier.map((n) => n.supersededById).filter((id): id is string => Boolean(id) && !found.has(id!));
    const rows = await db
      .select()
      .from(threadNotes)
      .where(and(eq(threadNotes.userId, userId), forward.length ? or(inArray(threadNotes.supersededById, ids), inArray(threadNotes.id, forward)) : inArray(threadNotes.supersededById, ids)));
    frontier = rows.filter((r) => !found.has(r.id));
    for (const r of frontier) found.set(r.id, r);
  }
  const versions = [...found.values()];
  await db.delete(threadNotes).where(and(eq(threadNotes.userId, userId), inArray(threadNotes.id, versions.map((v) => v.id))));
  await appendEvent(db, {
    userId,
    type: "library.forgotten",
    subjectType: "thread",
    subjectId: start.threadId,
    payload: { what: "note", versions: versions.length, keys: [...new Set(versions.map((v) => contentKey(v.content)))], by: "user" },
  });
  return versions.map((v) => v.id);
}

/** The user's forgetting of a whole thread: it, every note, and its id in episodes. The conversation is not touched. */
export async function forgetThread(db: Db, userId: string, threadId: string): Promise<boolean> {
  const thread = await getOwnedThread(db, userId, threadId);
  if (!thread) return false;
  const notes = await db.select({ content: threadNotes.content }).from(threadNotes).where(and(eq(threadNotes.userId, userId), eq(threadNotes.threadId, thread.id)));
  await db.delete(threads).where(and(eq(threads.id, thread.id), eq(threads.userId, userId)));
  await db
    .update(episodes)
    .set({ threadIds: sql`${episodes.threadIds} - ${thread.id}::text` })
    .where(and(eq(episodes.userId, userId), sql`${episodes.threadIds} @> ${JSON.stringify([thread.id])}::jsonb`));
  await appendEvent(db, {
    userId,
    type: "library.forgotten",
    subjectType: "thread",
    subjectId: thread.id,
    payload: { what: "thread", notes: notes.length, keys: [...new Set([thread.title, ...notes.map((n) => n.content)].map(contentKey))], by: "user" },
  });
  return true;
}

/** Did the user make Lumi forget this — a Library note or thread, or a belief — before? */
export async function isForgotten(db: Db, userId: string, content: string): Promise<boolean> {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        inArray(events.type, ["library.forgotten", "memory.deleted"]),
        sql`${events.payload} @> ${JSON.stringify({ keys: [contentKey(content)] })}::jsonb`,
      ),
    )
    .limit(1);
  return Boolean(row);
}

/* --------------------------------------------- consolidation watermark */

/**
 * Messages after the watermark, oldest first. The watermark has no FK (a
 * pointer into history): when its message is gone, the latest episode's end
 * stands in for it, so a missing message never re-reads the whole conversation.
 */
export async function unconsolidatedMessages(db: Db, conversationId: string, watermarkId: string | null, limit = 200) {
  let after: Date | undefined;
  if (watermarkId) {
    const [w] = await db.select({ createdAt: messages.createdAt }).from(messages).where(eq(messages.id, watermarkId)).limit(1);
    after = w?.createdAt;
    if (!after) {
      const [e] = await db
        .select({ endedAt: episodes.endedAt })
        .from(episodes)
        .where(eq(episodes.conversationId, conversationId))
        .orderBy(desc(episodes.endedAt))
        .limit(1);
      after = e?.endedAt;
      console.warn(`[consolidate] watermark message ${watermarkId} is gone; reading from ${after ? `the latest episode's end (${after.toISOString()})` : "the start (no episode either)"}`);
    }
  }
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), after ? gt(messages.createdAt, after) : undefined))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

/**
 * Move the watermark from where this run found it to the last message it
 * consolidated — only if nobody moved it first. False: another run got there.
 */
export async function claimWatermark(db: Db, conversationId: string, from: string | null, to: string): Promise<boolean> {
  const rows = await db
    .update(conversations)
    .set({ summaryThroughMessageId: to })
    .where(and(eq(conversations.id, conversationId), from ? eq(conversations.summaryThroughMessageId, from) : isNull(conversations.summaryThroughMessageId)))
    .returning({ id: conversations.id });
  return rows.length > 0;
}

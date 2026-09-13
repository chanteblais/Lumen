/**
 * The Library as data: threads (persistent subjects of the user's life), the
 * notes Lumi files under them, and episodes (recent memory of conversation).
 * Written by consolidation (`core/ai/consolidate.ts`) and by Lumi's library
 * tools. Every write checks ownership, runs the same screens as beliefs
 * (`memory-rules.ts`) and appends an event with no words in it. See
 * docs/architecture.md → The Library.
 */
import { and, asc, desc, eq, gte, inArray, isNull, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { type Db } from "@/db/client";
import { conversations, episodes, events, messages, threadNotes, threads, type Episode, type NoteSource, type Thread, type ThreadNote, type ThreadNoteKind } from "@/db/schema";
import { normalizeText } from "@/core/words";
import { chainIds } from "./chains";
import { appendEvent } from "./events";
import { cleanContent, contentKey, isNearDuplicate, screenMemory } from "./memory-rules";
import { returnedRow } from "./rows";
import { atomic } from "./tx";

export const NOTE_MIN = 3;
export const NOTE_MAX = 280;
export const SUMMARY_MAX = 900;
export const TITLE_MAX = 80;
const ALIAS_MAX = 40;
const MAX_ALIASES = 8;
const THREAD_LIMIT = 100;
const NOTE_LIMIT = 600;
/** Episodes older than this don't ride along; they stay in the table. */
const EPISODE_RECENT_DAYS = 14;

type LibraryActor = "user" | "lumi" | "consolidation";

export const NOTE_KINDS = ["idea", "decision", "question", "progress", "detail"] as const satisfies readonly ThreadNoteKind[];

/* -------------------------------------------------------------- pure */

/** A title or alias as it's compared: "The Book!" ≈ "the book". */
function nameKey(s: string): string {
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
const MAX_SHELF_DEPTH = 3;

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
type LibrarySection<T> = { thread: T; shelves: ShelfBooks<T>[] };
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

/** Most recently discussed first; consolidation stamps one time on every thread it touches, so ties go by id and the order never varies between turns. */
export async function listThreads(db: Db, userId: string, limit = THREAD_LIMIT): Promise<Thread[]> {
  return db.select().from(threads).where(eq(threads.userId, userId)).orderBy(desc(threads.lastDiscussedAt), desc(threads.id)).limit(limit);
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

async function listRecentEpisodes(db: Db, userId: string, now: Date, limit = 10): Promise<Episode[]> {
  const since = new Date(now.getTime() - EPISODE_RECENT_DAYS * 86_400_000);
  return db
    .select()
    .from(episodes)
    .where(and(eq(episodes.userId, userId), gte(episodes.endedAt, since)))
    .orderBy(desc(episodes.endedAt))
    .limit(limit);
}

type LibraryState = { threads: Thread[]; notes: ThreadNote[]; episodes: Episode[]; unavailable: boolean };

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

type Skip = { skipped: string };

export async function createThread(
  db: Db,
  userId: string,
  /** `theirWord`: Lumi makes it because they asked, in words the code found in their messages — their ask brings back even what they once had her forget. */
  input: { title: string; aliases?: string[]; summary?: string | null; theirWord?: boolean },
  actor: LibraryActor,
  now: Date = new Date(),
): Promise<{ thread: Thread; existed: boolean } | Skip> {
  const title = cleanContent(input.title).slice(0, TITLE_MAX);
  if (nameKey(title).length < 2) return { skipped: "title" };
  if (screenMemory(title)) return { skipped: screenMemory(title)! };
  return atomic(db, (tx) => insertThread(tx, userId, title, input, actor, now));
}

async function insertThread(db: Db, userId: string, title: string, input: { aliases?: string[]; summary?: string | null; theirWord?: boolean }, actor: LibraryActor, now: Date): Promise<{ thread: Thread; existed: boolean } | Skip> {
  const held = await listThreads(db, userId);
  const same = findThreadByName(held, title) ?? (input.aliases ?? []).map((a) => findThreadByName(held, a)).find(Boolean);
  if (same) return { thread: same, existed: true };
  // Only their own (checked) word brings back a forgotten thread; an inference or a consolidation run never does.
  if (actor !== "user" && !input.theirWord && (await isForgotten(db, userId, title))) return { skipped: "forgotten" };
  const summary = input.summary ? cleanSummary(input.summary) : null;
  const row = returnedRow(
    await db
      .insert(threads)
      .values({ userId, title, aliases: mergeAliases(title, [], input.aliases ?? []), summary, summaryRevisedAt: summary ? now : null, lastDiscussedAt: now })
      .returning(),
    "createThread",
  );
  await appendEvent(db, { userId, type: "library.thread_created", subjectType: "thread", subjectId: row.id, payload: { by: actor, ...(input.theirWord ? { their_word: true } : {}) }, occurredAt: now });
  return { thread: row, existed: false };
}

export async function fileNote(
  db: Db,
  userId: string,
  /** `theirWord`: filed because they asked, in words the code found in their messages — lifts the forgotten check, as for a thread. */
  input: { threadId: string; kind: ThreadNoteKind; content: string; source: NoteSource; sourceMessageId?: string; supersedes?: string; episodeId?: string; theirWord?: boolean },
  actor: LibraryActor,
  now: Date = new Date(),
): Promise<{ note: ThreadNote; replaced?: ThreadNote } | (Skip & { existing?: ThreadNote })> {
  const content = cleanContent(input.content);
  if (content.length < NOTE_MIN || content.length > NOTE_MAX) return { skipped: "content length" };
  const screened = screenMemory(content);
  if (screened) return { skipped: screened };
  return atomic(db, (tx) => insertNote(tx, userId, content, input, actor, now));
}

/** The note, the note it replaces, the thread's recency and the event — together or not at all. */
async function insertNote(
  db: Db,
  userId: string,
  content: string,
  input: { threadId: string; kind: ThreadNoteKind; source: NoteSource; sourceMessageId?: string; supersedes?: string; episodeId?: string; theirWord?: boolean },
  actor: LibraryActor,
  now: Date,
): Promise<{ note: ThreadNote; replaced?: ThreadNote } | (Skip & { existing?: ThreadNote })> {
  const thread = await getOwnedThread(db, userId, input.threadId);
  if (!thread) return { skipped: "not found" };
  const current = await listCurrentNotes(db, userId, [thread.id]);
  const same = current.find((n) => isNearDuplicate(n.content, content));
  if (same) return { skipped: "already_held", existing: same };
  if (actor !== "user" && !input.theirWord && (await isForgotten(db, userId, content))) return { skipped: "forgotten" };
  const replaced = input.supersedes ? current.find((n) => n.id === input.supersedes) : undefined;
  if (input.supersedes && !replaced) return { skipped: "supersedes a note that isn't current on this thread" };
  const note = returnedRow(
    await db
      .insert(threadNotes)
      .values({ userId, threadId: thread.id, kind: input.kind, content, source: input.source, sourceMessageId: input.sourceMessageId ?? null, episodeId: input.episodeId ?? null, createdAt: now })
      .returning(),
    "fileNote",
  );
  if (replaced) await db.update(threadNotes).set({ supersededById: note.id }).where(eq(threadNotes.id, replaced.id));
  await db.update(threads).set({ lastDiscussedAt: now }).where(eq(threads.id, thread.id));
  await appendEvent(db, {
    userId,
    type: "library.noted",
    subjectType: "thread",
    subjectId: thread.id,
    payload: { note: note.id, kind: input.kind, source: input.source, supersedes: replaced?.id ?? null, by: actor, ...(input.theirWord ? { their_word: true } : {}) },
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
  const summary = cleanSummary(text);
  if (!summary) return null;
  return atomic(db, async (tx) => {
    const [row] = await tx
      .update(threads)
      .set({ summary, summaryRevisedAt: now, lastDiscussedAt: now })
      .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
      .returning({ id: threads.id });
    if (!row) return null;
    await appendEvent(tx, { userId, type: "library.summary_revised", subjectType: "thread", subjectId: row.id, payload: { by: actor }, occurredAt: now });
    return summary;
  });
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
  return returnedRow(
    await db
      .insert(episodes)
      .values({ ...input, threadIds: input.threadIds ?? [] })
      .returning(),
    "insertEpisode",
  );
}

/**
 * Put a thread under another (or take it off its shelf, `parentId` null).
 * Checks ownership and depth; Lumi and consolidation never move a thread the
 * user placed. Appends `library.shelved` with where it was and who moved it.
 * `theirWord`: Lumi moves it because they said where it goes, in words the code
 * found in their messages — their placement, which she won't later undo.
 */
export async function shelveThread(
  db: Db,
  userId: string,
  threadId: string,
  parentId: string | null,
  actor: LibraryActor,
  opts: { theirWord?: boolean } = {},
): Promise<{ thread: Thread } | Skip> {
  const theirs = actor === "user" || opts.theirWord === true;
  return atomic(db, async (tx) => {
    const held = await tx.select().from(threads).where(eq(threads.userId, userId));
    const thread = held.find((t) => t.id === threadId);
    const why = whyNotShelve(held, threadId, parentId);
    if (!thread || why) return { skipped: why ?? "not found" };
    if (thread.parentId === parentId) return { thread };
    if (!theirs && thread.shelvedBy === "user") return { skipped: "placed by them" };
    const [row] = await tx
      .update(threads)
      .set({ parentId, shelvedBy: parentId ? (theirs ? "user" : "lumi") : theirs ? "user" : null })
      .where(and(eq(threads.id, thread.id), eq(threads.userId, userId)))
      .returning();
    // Read without a lock, so it can be forgotten in between: then it's gone, not shelved.
    if (!row) return { skipped: "not found" };
    await appendEvent(tx, { userId, type: "library.shelved", subjectType: "thread", subjectId: thread.id, payload: { under: parentId, from: thread.parentId, by: actor, ...(opts.theirWord ? { their_word: true } : {}) } });
    return { thread: row };
  });
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
  return atomic(db, async (tx) => {
    const versions = await tx
      .select()
      .from(threadNotes)
      .where(and(eq(threadNotes.userId, userId), sql`${threadNotes.id} in ${chainIds(threadNotes, threadNotes.supersededById, userId, noteId)}`));
    const start = versions.find((v) => v.id === noteId);
    if (!start) return [];
    await tx.delete(threadNotes).where(and(eq(threadNotes.userId, userId), inArray(threadNotes.id, versions.map((v) => v.id))));
    await appendEvent(tx, {
      userId,
      type: "library.forgotten",
      subjectType: "thread",
      subjectId: start.threadId,
      payload: { what: "note", versions: versions.length, keys: [...new Set(versions.map((v) => contentKey(v.content)))], by: "user" },
    });
    return versions.map((v) => v.id);
  });
}

/** The user's forgetting of a whole thread: it, every note, and its id in episodes. The conversation is not touched. */
export async function forgetThread(db: Db, userId: string, threadId: string): Promise<boolean> {
  return atomic(db, async (tx) => {
    const thread = await getOwnedThread(tx, userId, threadId);
    if (!thread) return false;
    const notes = await tx.select({ content: threadNotes.content }).from(threadNotes).where(and(eq(threadNotes.userId, userId), eq(threadNotes.threadId, thread.id)));
    await tx.delete(threads).where(and(eq(threads.id, thread.id), eq(threads.userId, userId)));
    await tx
      .update(episodes)
      .set({ threadIds: sql`${episodes.threadIds} - ${thread.id}::text` })
      .where(and(eq(episodes.userId, userId), sql`${episodes.threadIds} @> ${JSON.stringify([thread.id])}::jsonb`));
    await appendEvent(tx, {
      userId,
      type: "library.forgotten",
      subjectType: "thread",
      subjectId: thread.id,
      payload: { what: "thread", notes: notes.length, keys: [...new Set([thread.title, ...notes.map((n) => n.content)].map(contentKey))], by: "user" },
    });
    return true;
  });
}

/** Did the user make Lumi forget this — a Library note or thread, or a belief — before? The one check, for beliefs and the Library alike. */
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
  const inConversation = eq(messages.conversationId, conversationId);
  const read = (after: SQL | undefined) => db.select().from(messages).where(and(inConversation, after)).orderBy(asc(messages.createdAt), asc(messages.id)).limit(limit);
  if (!watermarkId) return read(undefined);
  const [w] = await db.select({ id: messages.id }).from(messages).where(eq(messages.id, watermarkId)).limit(1);
  if (w) {
    // Compared inside Postgres, at its precision: `created_at` keeps microseconds and a Date read back keeps
    // milliseconds, so `> watermark.createdAt` from JS would read the watermark message itself again — and when it
    // ends its sitting, that one message is the whole stretch, claimed onto itself forever (live, 2026-09-13).
    // The id breaks a tie between messages stored in the same microsecond.
    return read(sql`(${messages.createdAt}, ${messages.id}) > (select w.created_at, w.id from ${messages} as w where w.id = ${watermarkId})`);
  }
  const [e] = await db
    .select({ endedAt: episodes.endedAt })
    .from(episodes)
    .where(eq(episodes.conversationId, conversationId))
    .orderBy(desc(episodes.endedAt))
    .limit(1);
  console.warn(`[consolidate] watermark message ${watermarkId} is gone; reading from ${e ? `the latest episode's end (${e.endedAt.toISOString()})` : "the start (no episode either)"}`);
  // An episode's end was a message's time read into a Date (milliseconds): compare at that precision.
  return read(e ? sql`date_trunc('milliseconds', ${messages.createdAt}) > ${e.endedAt}` : undefined);
}

/** The conversation, with its watermark still where a run found it. */
const atWatermark = (conversationId: string, from: string | null) =>
  and(eq(conversations.id, conversationId), from ? eq(conversations.summaryThroughMessageId, from) : isNull(conversations.summaryThroughMessageId));

/**
 * Move the watermark from where this run found it to the last message it
 * consolidated — only if nobody moved it first. False: another run got there.
 * In a transaction, make it the last statement: the UPDATE row-locks the
 * conversation, and `saveMessage` touches that row on every chat turn.
 */
export async function claimWatermark(db: Db, conversationId: string, from: string | null, to: string): Promise<boolean> {
  const rows = await db.update(conversations).set({ summaryThroughMessageId: to }).where(atWatermark(conversationId, from)).returning({ id: conversations.id });
  return rows.length > 0;
}

/** How long a run holds a stretch: longer than a slow model call, short enough that a run that died frees it soon. */
export const CONSOLIDATION_LEASE_MS = 3 * 60_000;

/**
 * Take the stretch for one run before paying for its model call: set the lease
 * when none is held (or it has run out) and the watermark is still where this
 * run found it. One conditional UPDATE, committed on its own — safe through the
 * transaction pooler, where a session advisory lock is not. False: another
 * instance holds it, or already moved past it.
 */
export async function takeConsolidationLease(db: Db, conversationId: string, from: string | null, now: Date, until: Date): Promise<boolean> {
  const rows = await db
    .update(conversations)
    .set({ consolidatingUntil: until })
    .where(and(atWatermark(conversationId, from), or(isNull(conversations.consolidatingUntil), lte(conversations.consolidatingUntil, now))))
    .returning({ id: conversations.id });
  return rows.length > 0;
}

/** Let the stretch go — only this run's lease, never one another run took after it ran out. */
export async function releaseConsolidationLease(db: Db, conversationId: string, until: Date): Promise<void> {
  await db
    .update(conversations)
    .set({ consolidatingUntil: null })
    .where(and(eq(conversations.id, conversationId), eq(conversations.consolidatingUntil, until)));
}

const CONSOLIDATION_FAILED = "memory.consolidation_failed";
/** After one failure of a stretch wait 10 minutes, after two an hour, after three or more six hours. */
const CONSOLIDATION_BACKOFF_MS = [10 * 60_000, 60 * 60_000, 6 * 3_600_000] as const;
const FAILURE_WINDOW_MS = 7 * 86_400_000;

/** Pure: when a stretch that failed at these times (newest first) may be tried again, or null when it never failed. */
export function retryAfterFailures(failedAt: Date[]): Date | null {
  const [first] = failedAt;
  if (!first) return null;
  // In range: failedAt has at least one entry, so the index is 0 up to the last step.
  const wait = CONSOLIDATION_BACKOFF_MS[Math.min(failedAt.length, CONSOLIDATION_BACKOFF_MS.length) - 1]!;
  return new Date(first.getTime() + wait);
}

/** A run over the stretch starting after `from` failed: a fact, so the next runs back off (`consolidationRetryAt`). */
export async function recordConsolidationFailure(db: Db, userId: string, stretch: { from: string | null; through: string }, now: Date): Promise<void> {
  await appendEvent(db, { userId, type: CONSOLIDATION_FAILED, subjectType: "user", subjectId: userId, payload: { from: stretch.from, through: stretch.through }, occurredAt: now });
}

/** When the stretch after this watermark may be tried again, from its recent failures; null when it hasn't failed. */
export async function consolidationRetryAt(db: Db, userId: string, from: string | null, now: Date): Promise<Date | null> {
  const rows = await db
    .select({ at: events.occurredAt })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        eq(events.type, CONSOLIDATION_FAILED),
        gte(events.occurredAt, new Date(now.getTime() - FAILURE_WINDOW_MS)),
        sql`${events.payload} @> ${JSON.stringify({ from })}::jsonb`,
      ),
    )
    .orderBy(desc(events.occurredAt))
    .limit(CONSOLIDATION_BACKOFF_MS.length);
  return retryAfterFailures(rows.map((r) => r.at));
}

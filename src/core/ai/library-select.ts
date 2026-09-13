/**
 * What of the Library a turn carries. A thread *opens* when the turn touches
 * it — its title or a word they use for it said in the message (more weakly: a
 * running session, the last few turns), or enough of its words — and brings its
 * summary and the notes that bear on the message. Every other thread is one
 * line in an index Lumi can open. Episodes that ended before the oldest message
 * in the transcript window ride along as recent memory. Lexical on purpose,
 * like belief selection; meaning-based retrieval (embeddings) is the next
 * layer. Pure. See docs/architecture.md → The Library.
 */
import type { Episode, Thread, ThreadNote } from "@/db/schema";
import { shelfPath } from "@/core/domain/library";
import { normalizeText } from "@/core/words";
import { overlapScore, termWeights, type TurnSignals } from "./memory-select";

export const OPEN_THRESHOLD = 5;
export const MAX_OPEN = 2;
export const NOTES_PER_THREAD = 6;
export const INDEX_SIZE = 12;
export const EPISODES_SHOWN = 3;
export const EPISODE_DAYS = 14;
export const RESTING_AFTER_DAYS = 30;

const PHRASE = { message: 10, focus: 6, recent: 3 } as const;
const BODY_WEIGHT = 0.5;
const BODY_CAP = 4;

export type SelectableThread = Pick<Thread, "id" | "title" | "aliases" | "summary" | "lastDiscussedAt"> & { parentId?: string | null };
export type SelectableNote = Pick<ThreadNote, "id" | "threadId" | "content" | "createdAt" | "supersededById">;
export type SelectableEpisode = Pick<Episode, "endedAt">;

/** A name said as whole words: "the book" in "I rewrote the book's opening". */
export function namedIn(name: string, text: string | null | undefined): boolean {
  const n = normalizeText(name);
  if (!text || n.length < 3) return false;
  return ` ${normalizeText(text)} `.includes(` ${n} `);
}

/** `weights`: the turn's term weights, when the caller already has them (they're the same for every thread of a turn). */
export function threadScore(t: SelectableThread, notes: SelectableNote[], signals: TurnSignals, weights: ReadonlyMap<string, number> = termWeights(signals)): number {
  const names = [t.title, ...t.aliases];
  const said = (text: string | null | undefined) => names.some((n) => namedIn(n, text));
  const phrase = said(signals.message) ? PHRASE.message : (signals.focus ?? []).some(said) ? PHRASE.focus : (signals.recent ?? []).some(said) ? PHRASE.recent : 0;
  const body = overlapScore([t.summary ?? "", ...notes.map((n) => n.content)].join(" "), weights) * BODY_WEIGHT;
  return phrase + overlapScore(names.join(" "), weights) + Math.min(body, BODY_CAP);
}

/** A thread's current notes, the ones sharing the most with what's being said first, then the newest. */
export function rankNotes<N extends SelectableNote>(notes: N[], signals: TurnSignals, weights: ReadonlyMap<string, number> = termWeights(signals)): N[] {
  return notes
    .filter((n) => !n.supersededById)
    .map((n) => ({ n, s: overlapScore(n.content, weights) }))
    .sort((a, b) => b.s - a.s || b.n.createdAt.getTime() - a.n.createdAt.getTime())
    .map((x) => x.n);
}

export type LibraryView<T, N, E> = {
  /** `shelf`: the titles of the threads it sits under, section first — where it is in their Library. */
  open: { thread: T; notes: N[]; shelf: string[] }[];
  index: { thread: T; resting: boolean; shelf: string[] }[];
  /** More threads are held than the index shows. */
  moreThreads: boolean;
  episodes: E[];
};

/** Most recently discussed first, then by id — consolidation stamps one time on every thread it touches, and the order mustn't vary between turns. */
const byRecency = (a: SelectableThread, b: SelectableThread) => b.lastDiscussedAt.getTime() - a.lastDiscussedAt.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

export function selectLibrary<T extends SelectableThread, N extends SelectableNote, E extends SelectableEpisode>(
  threads: T[],
  notes: N[],
  episodes: E[],
  signals: TurnSignals,
  opts: { now: Date; windowStartsAt?: Date },
): LibraryView<T, N, E> {
  const byThread = notesByThread(notes.filter((n) => !n.supersededById));
  const weights = termWeights(signals);

  const opened = threads
    .map((t) => ({ t, s: threadScore(t, byThread.get(t.id) ?? [], signals, weights) }))
    .filter((x) => x.s >= OPEN_THRESHOLD)
    .sort((a, b) => b.s - a.s || byRecency(a.t, b.t))
    .slice(0, MAX_OPEN);
  const openIds = new Set(opened.map((x) => x.t.id));
  const rest = threads.filter((t) => !openIds.has(t.id)).sort(byRecency);

  const since = opts.now.getTime() - EPISODE_DAYS * 86_400_000;
  const window = opts.windowStartsAt?.getTime();
  const shelf = (t: T) => shelfPath(threads, t.id).map((p) => p.title);
  return {
    open: opened.map((x) => ({ thread: x.t, notes: rankNotes(byThread.get(x.t.id) ?? [], signals, weights).slice(0, NOTES_PER_THREAD), shelf: shelf(x.t) })),
    index: rest.slice(0, INDEX_SIZE).map((t) => ({ thread: t, resting: opts.now.getTime() - t.lastDiscussedAt.getTime() > RESTING_AFTER_DAYS * 86_400_000, shelf: shelf(t) })),
    moreThreads: rest.length > INDEX_SIZE,
    episodes:
      window === undefined
        ? []
        : episodes
            .filter((e) => e.endedAt.getTime() < window && e.endedAt.getTime() >= since)
            .sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime())
            .slice(0, EPISODES_SHOWN),
  };
}

/** Threads a stretch of text touches, strongest first — for consolidation's prompt and `search_library`. */
export function rankThreads<T extends SelectableThread>(threads: T[], text: string, notes: SelectableNote[] = []): T[] {
  const signals = { message: text };
  const weights = termWeights(signals);
  const byThread = notesByThread(notes);
  return threads
    .map((t) => ({ t, s: threadScore(t, byThread.get(t.id) ?? [], signals, weights) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || byRecency(a.t, b.t))
    .map((x) => x.t);
}

/** Current notes that share words with a query, strongest first — `search_library`. */
export function matchNotes<N extends SelectableNote>(notes: N[], query: string, limit = 8): N[] {
  const weights = termWeights({ message: query });
  return notes
    .filter((n) => !n.supersededById)
    .map((n) => ({ n, s: overlapScore(n.content, weights) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.n.createdAt.getTime() - a.n.createdAt.getTime())
    .slice(0, limit)
    .map((x) => x.n);
}

/** Notes grouped by their thread, in the order given — one pass, so ranking threads doesn't filter every note per thread. */
function notesByThread<N extends Pick<SelectableNote, "threadId">>(notes: N[]): Map<string, N[]> {
  const out = new Map<string, N[]>();
  for (const n of notes) {
    const list = out.get(n.threadId);
    if (list) list.push(n);
    else out.set(n.threadId, [n]);
  }
  return out;
}

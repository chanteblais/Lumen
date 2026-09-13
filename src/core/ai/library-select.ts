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
import { contentWords, normalizeText } from "@/core/words";
import { termWeights, type TurnSignals } from "./memory-select";

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

export type SelectableThread = Pick<Thread, "id" | "title" | "aliases" | "summary" | "lastDiscussedAt">;
export type SelectableNote = Pick<ThreadNote, "id" | "threadId" | "content" | "createdAt" | "supersededById">;
export type SelectableEpisode = Pick<Episode, "endedAt">;

/** A name said as whole words: "the book" in "I rewrote the book's opening". */
export function namedIn(name: string, text: string | null | undefined): boolean {
  const n = normalizeText(name);
  if (!text || n.length < 3) return false;
  return ` ${normalizeText(text)} `.includes(` ${n} `);
}

export function threadScore(t: SelectableThread, notes: SelectableNote[], signals: TurnSignals): number {
  const names = [t.title, ...t.aliases];
  const said = (text: string | null | undefined) => names.some((n) => namedIn(n, text));
  let score = said(signals.message) ? PHRASE.message : (signals.focus ?? []).some(said) ? PHRASE.focus : (signals.recent ?? []).some(said) ? PHRASE.recent : 0;
  const weights = termWeights(signals);
  for (const w of contentWords(names.join(" "))) score += weights.get(w) ?? 0;
  let body = 0;
  for (const w of contentWords([t.summary ?? "", ...notes.map((n) => n.content)].join(" "))) body += (weights.get(w) ?? 0) * BODY_WEIGHT;
  return score + Math.min(body, BODY_CAP);
}

/** A thread's current notes, the ones sharing the most with what's being said first, then the newest. */
export function rankNotes<N extends SelectableNote>(notes: N[], signals: TurnSignals): N[] {
  const weights = termWeights(signals);
  const overlap = (n: N) => [...contentWords(n.content)].reduce((s, w) => s + (weights.get(w) ?? 0), 0);
  return notes
    .filter((n) => !n.supersededById)
    .map((n) => ({ n, s: overlap(n) }))
    .sort((a, b) => b.s - a.s || b.n.createdAt.getTime() - a.n.createdAt.getTime())
    .map((x) => x.n);
}

export type LibraryView<T, N, E> = {
  open: { thread: T; notes: N[] }[];
  index: { thread: T; resting: boolean }[];
  /** More threads are held than the index shows. */
  moreThreads: boolean;
  episodes: E[];
};

export function selectLibrary<T extends SelectableThread, N extends SelectableNote, E extends SelectableEpisode>(
  threads: T[],
  notes: N[],
  episodes: E[],
  signals: TurnSignals,
  opts: { now: Date; windowStartsAt?: Date },
): LibraryView<T, N, E> {
  const byThread = new Map<string, N[]>();
  for (const n of notes) if (!n.supersededById) byThread.set(n.threadId, [...(byThread.get(n.threadId) ?? []), n]);

  const opened = threads
    .map((t) => ({ t, s: threadScore(t, byThread.get(t.id) ?? [], signals) }))
    .filter((x) => x.s >= OPEN_THRESHOLD)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX_OPEN);
  const openIds = new Set(opened.map((x) => x.t.id));
  const rest = threads.filter((t) => !openIds.has(t.id)).sort((a, b) => b.lastDiscussedAt.getTime() - a.lastDiscussedAt.getTime());

  const since = opts.now.getTime() - EPISODE_DAYS * 86_400_000;
  const window = opts.windowStartsAt?.getTime();
  return {
    open: opened.map((x) => ({ thread: x.t, notes: rankNotes(byThread.get(x.t.id) ?? [], signals).slice(0, NOTES_PER_THREAD) })),
    index: rest.slice(0, INDEX_SIZE).map((t) => ({ thread: t, resting: opts.now.getTime() - t.lastDiscussedAt.getTime() > RESTING_AFTER_DAYS * 86_400_000 })),
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
  return threads
    .map((t) => ({ t, s: threadScore(t, notes.filter((n) => n.threadId === t.id), signals) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}

/** Current notes that share words with a query, strongest first — `search_library`. */
export function matchNotes<N extends SelectableNote>(notes: N[], query: string, limit = 8): N[] {
  const weights = termWeights({ message: query });
  return notes
    .filter((n) => !n.supersededById)
    .map((n) => ({ n, s: [...contentWords(n.content)].reduce((s, w) => s + (weights.get(w) ?? 0), 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.n.createdAt.getTime() - a.n.createdAt.getTime())
    .slice(0, limit)
    .map((x) => x.n);
}

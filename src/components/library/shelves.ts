import { shelfPath, type ShelfBooks } from "@/core/domain/library";
import type { Thread } from "@/db/schema";

export type Crumb = { href: string; label: string };

const byAge = (a: Thread, b: Thread) => a.createdAt.getTime() - b.createdAt.getTime();

/** The threads directly under this one, in the order they arrived (so a book keeps its place). */
export function childrenOf(held: Thread[], id: string): Thread[] {
  return held.filter((t) => t.parentId === id && t.id !== id).sort(byAge);
}

/**
 * What an opened section or shelf shows, the way `buildShelves` lays out a
 * section: the books directly under it first (no plaque), then each thread
 * that holds threads as a shelf with its books.
 */
export function shelvesUnder(held: Thread[], id: string): ShelfBooks<Thread>[] {
  const children = childrenOf(held, id);
  const own = children.filter((c) => childrenOf(held, c.id).length === 0);
  const shelves = children.filter((c) => childrenOf(held, c.id).length > 0).map((c) => ({ shelf: c, books: childrenOf(held, c.id) }));
  return [...(own.length ? [{ shelf: null, books: own }] : []), ...shelves];
}

/** Library › Section › Shelf: the way back from a thread, each a link. */
export function crumbsFor(held: Thread[], id: string): Crumb[] {
  return [{ href: "/library", label: "Library" }, ...shelfPath(held, id).map((t) => ({ href: `/library/${t.id}`, label: t.title }))];
}

/** One of four leather tones for a spine, from its id: decoration only, the same every visit. */
export function toneOf(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 4;
}

/** "Sep 12", in the user's timezone. */
export function shortDate(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).format(d);
}

/** At most `max` characters, cut at a word and ending in an ellipsis when it was longer. */
export function clip(text: string, max: number): string {
  const s = text.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.5 ? cut.slice(0, at) : cut).replace(/[\s,;:–—-]+$/, "")}…`;
}

/** A summary's first sentence, for the one line under a heading. */
export function firstLine(text: string, max = 160): string {
  const sentence = text.trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  return clip(sentence, max);
}

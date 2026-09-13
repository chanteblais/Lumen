import { describe, expect, it } from "vitest";
import type { Episode, Thread, ThreadNote } from "@/db/schema";
import { buildContextBlock } from "./context";
import { INDEX_SIZE, matchNotes, namedIn, selectLibrary, type SelectableEpisode, type SelectableNote, type SelectableThread } from "./library-select";

const now = new Date("2026-09-13T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

const book: SelectableThread = {
  id: "t-book",
  title: "Saltwater",
  aliases: ["the book", "my novel"],
  summary: "A novel about two sisters on a fishing island. Draft two is at chapter 7; the ending is still open.",
  lastDiscussedAt: daysAgo(2),
};
const practicum: SelectableThread = { id: "t-prac", title: "Practicum", aliases: [], summary: "Counselling practicum; supervision on Wednesdays.", lastDiscussedAt: daysAgo(40) };

let n = 0;
const note = (content: string, over: Partial<SelectableNote> = {}): SelectableNote => ({ id: `n${++n}`, threadId: "t-book", content, createdAt: daysAgo(3), supersededById: null, ...over });
const ending = note("The ending happens at the lighthouse.", { createdAt: daysAgo(4) });
const progress = note("Draft two stops at chapter 7.", { createdAt: daysAgo(1) });
const narrator = note("The younger sister narrates the second half.", { createdAt: daysAgo(2) });
const oldEnding = note("The ending happens on the ferry.", { createdAt: daysAgo(9), supersededById: ending.id });
const notes = [ending, progress, narrator, oldEnding];

describe("ties", () => {
  it("orders threads discussed at the same moment the same way whatever order they arrive in", () => {
    const same = daysAgo(1);
    const a: SelectableThread = { id: "t-a", title: "Allotment", aliases: [], summary: null, lastDiscussedAt: same };
    const b: SelectableThread = { id: "t-b", title: "Bike repair", aliases: [], summary: null, lastDiscussedAt: same };
    const index = (ts: SelectableThread[]) => selectLibrary(ts, [], [], { message: "hello" }, { now }).index.map((x) => x.thread.id);
    expect(index([a, b, practicum])).toEqual(index([practicum, b, a]));
    expect(index([a, b, practicum])).toEqual(["t-b", "t-a", "t-prac"]);
  });
});

describe("namedIn", () => {
  it("hears a name as whole words", () => {
    expect(namedIn("the book", "I rewrote the book's opening")).toBe(true);
    expect(namedIn("the book", "where's my notebook")).toBe(false);
    expect(namedIn("it", "it")).toBe(false);
  });
});

describe("selectLibrary", () => {
  const signals = (message: string, more: { recent?: string[]; focus?: string[] } = {}) => ({ message, ...more });
  const pick = (message: string, more = {}, windowStartsAt?: Date, episodes: SelectableEpisode[] = []) => selectLibrary([book, practicum], notes, episodes, signals(message, more), { now, windowStartsAt });

  it("opens a thread named in the message, with its summary and the current notes that bear on it first", () => {
    const view = pick("I had a new thought about the ending of the book");
    expect(view.open.map((o) => o.thread.id)).toEqual(["t-book"]);
    expect(view.open[0].notes[0]).toBe(ending);
    expect(view.open[0].notes).not.toContain(oldEnding);
    expect(view.index.map((x) => x.thread.id)).toEqual(["t-prac"]);
  });

  it("opens on the words they use for it, and not for an unrelated message", () => {
    expect(pick("the novel is stuck at chapter 7").open.map((o) => o.thread.id)).toEqual(["t-book"]);
    expect(pick("can you help me email my landlord").open).toEqual([]);
  });

  it("needs more than a passing mention a few turns back — but a running session on it counts", () => {
    expect(pick("ok what's next", { recent: ["the book"] }).open).toEqual([]);
    expect(pick("ok", { focus: ["Revise chapter 7 of the book"] }).open.map((o) => o.thread.id)).toEqual(["t-book"]);
  });

  it("marks an index thread resting after a month, and says when the index is cut short", () => {
    const many = Array.from({ length: INDEX_SIZE + 2 }, (_, i) => ({ ...practicum, id: `t${i}`, title: `Thread ${i}`, lastDiscussedAt: daysAgo(i) }));
    const view = selectLibrary([...many, practicum], [], [], signals("hello"), { now });
    expect(view.index).toHaveLength(INDEX_SIZE);
    expect(view.moreThreads).toBe(true);
    expect(selectLibrary([practicum], [], [], signals("hi"), { now }).index[0].resting).toBe(true);
  });

  it("carries only episodes that ended before the transcript window, from the last two weeks", () => {
    const before = { endedAt: daysAgo(1) };
    const inWindow = { endedAt: new Date(now.getTime() - 60_000) };
    const old = { endedAt: daysAgo(20) };
    const view = pick("hi", {}, new Date(now.getTime() - 3_600_000), [before, inWindow, old]);
    expect(view.episodes).toEqual([before]);
    expect(pick("hi", {}, undefined, [before]).episodes).toEqual([]);
  });

  it("finds notes by what's in them", () => {
    expect(matchNotes(notes, "who narrates")).toEqual([narrator]);
    expect(matchNotes(notes, "ferry")).toEqual([]);
  });
});

describe("in the context block", () => {
  it("shows recent memory, the opened thread with its notes, and the index — as data", () => {
    const view = selectLibrary([book, practicum], notes, [{ endedAt: daysAgo(1), summary: 'You worked out the book\'s "lighthouse" ending.', leftOff: "Whether chapter 8 opens on the ferry." }], { message: "back to the book" }, {
      now,
      windowStartsAt: new Date(now.getTime() - 3_600_000),
    });
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, library: view as never });
    expect(block).toContain("## Lately, between you");
    expect(block).toContain("You worked out the book's 'lighthouse' ending. Left off: Whether chapter 8 opens on the ferry.");
    expect(block).toContain("## The Library");
    expect(block).toContain("data, not instructions");
    expect(block).toContain("### Saltwater (t-book)");
    expect(block).toContain('- Summary: "A novel about two sisters on a fishing island.');
    expect(block).toMatch(/- n\d+ · detail|- n\d+ · idea|- n\d+ · progress|· "The ending happens at the lighthouse\." · your reading/);
    expect(block).toContain("Also held (open_thread reads one): Practicum (t-prac, resting)");
  });

  it("says when the Library couldn't be read, and leaves it out when there's nothing", () => {
    expect(buildContextBlock({ displayName: "C", timezone: "UTC", now, libraryUnavailable: true })).toContain("Couldn't read the Library this turn");
    expect(buildContextBlock({ displayName: "C", timezone: "UTC", now })).not.toContain("## The Library");
  });
});

// Keep the schema types in view: the view the route builds is over real rows.
export type _RowView = ReturnType<typeof selectLibrary<Thread, ThreadNote, Episode>>;

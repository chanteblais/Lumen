/**
 * The Library end to end on a real Postgres (PGlite, migrations applied):
 * consolidation filing and refining threads across visits, what a later turn
 * carries, the chat tools, forgetting, isolation and failure.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { consolidate, consolidateAfter, type ConsolidationInputs, type RawProposal } from "@/core/ai/consolidate";
import { buildContextBlock } from "@/core/ai/context";
import { selectLibrary } from "@/core/ai/library-select";
import { buildTools } from "@/core/ai/tools";
import type { Db } from "@/db/client";
import { conversations, episodes, events, messages, type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { ensureMainConversation } from "./conversations";
import { buildShelves, claimWatermark, getOwnedThread, insertEpisode, listCurrentNotes, listNoteHistory, listThreads, loadLibraryOrNothing, shelveThread, unconsolidatedMessages } from "./library";
import type { Heard } from "./memory-rules";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

async function say(u: User, at: string, role: "user" | "assistant", text: string): Promise<string> {
  const c = await ensureMainConversation(db, u.id);
  const id = randomUUID();
  await db.insert(messages).values({ id, conversationId: c.id, role, parts: [{ type: "text", text }], createdAt: new Date(at) });
  return id;
}
const clock = (iso: string) => () => new Date(iso);
const said = (text: string): Heard => ({ messageId: randomUUID(), text });
const toolsFor = (user: User, ...heard: Heard[]) => buildTools({ db, userId: user.id, timezone: "UTC", userWords: heard });

type Callable = { execute?: (input: never, options: never) => unknown };
async function call(t: Callable, input: object): Promise<Record<string, unknown>> {
  return (await t.execute!(input as never, { toolCallId: "test", messages: [] } as never)) as Record<string, unknown>;
}

describe("consolidation", () => {
  it("files a subject they keep coming back to, refines it, and brings it back when it comes up", async () => {
    const u = await createTestUser(db, "Rae");
    await say(u, "2026-09-10T19:00:00Z", "user", "I've been working on my book again, the one about the two sisters.");
    await say(u, "2026-09-10T19:01:00Z", "assistant", "The sisters book. Where are you in it?");
    const ferryMsg = await say(u, "2026-09-10T19:04:00Z", "user", "For my book I think the ending should happen on the ferry.");
    const lastOfFirst = await say(u, "2026-09-10T19:05:00Z", "assistant", "The ferry ending. That fits.");

    const first = await consolidate(db, u, {
      now: clock("2026-09-12T09:00:00Z"),
      propose: async () => ({
        episode: { summary: "You worked on your book about two sisters and settled on a ferry ending.", left_off: "Whether the ferry scene opens or closes the last chapter." },
        threads: [{ ref: "new:book", title: "The book", aliases: ["my book"], summary: "A novel about two sisters. The ending is set on the ferry." }],
        notes: [
          { thread: "new:book", kind: "idea", content: "The ending happens on the ferry.", source: "user_said", their_words: "the ending should happen on the ferry" },
          { thread: "new:book", kind: "detail", content: "The book is about two sisters.", source: "lumi_inferred" },
        ],
      }),
    });
    expect(first).toMatchObject({ status: "done", threadsCreated: 1, notesFiled: 2 });

    const [book] = await listThreads(db, u.id);
    expect(book).toMatchObject({ title: "The book", aliases: ["my book"], summary: "A novel about two sisters. The ending is set on the ferry." });
    expect((await listCurrentNotes(db, u.id, [book.id])).find((x) => x.content === "The ending happens on the ferry.")).toMatchObject({ source: "user_said", sourceMessageId: ferryMsg });
    const [conversation] = await db.select().from(conversations).where(eq(conversations.userId, u.id));
    expect(conversation.summaryThroughMessageId).toBe(lastOfFirst);
    const [episode] = await db.select().from(episodes).where(eq(episodes.userId, u.id));
    expect(episode).toMatchObject({ threadIds: [book.id], leftOff: "Whether the ferry scene opens or closes the last chapter." });

    // Two days later they come back to it, and the ending changes.
    await say(u, "2026-09-12T10:00:00Z", "user", "Back on the book. Actually the ending moves to the lighthouse, not the ferry.");
    await say(u, "2026-09-12T10:01:00Z", "assistant", "Lighthouse it is. The ferry can still carry them there.");
    let seen: ConsolidationInputs | undefined;
    const second = await consolidate(db, u, {
      now: clock("2026-09-12T11:00:00Z"),
      propose: async (inputs) => {
        seen = inputs;
        const ferry = inputs.notes.find((x) => x.content.includes("ferry"))!;
        return {
          episode: { summary: "You moved the book's ending from the ferry to the lighthouse." },
          threads: [{ ref: book.id, aliases: ["the novel"], summary: "A novel about two sisters. The ending is set at the lighthouse now; the ferry carries them there." }],
          notes: [{ thread: book.id, kind: "decision", content: "The ending happens at the lighthouse.", source: "user_said", their_words: "the ending moves to the lighthouse", supersedes: ferry.id }],
        };
      },
    });
    expect(seen?.threads.map((t) => t.id)).toEqual([book.id]);
    expect(second).toMatchObject({ status: "done", threadsCreated: 0, notesFiled: 1, summaries: 1 });
    expect((await listCurrentNotes(db, u.id, [book.id])).map((x) => x.content).sort()).toEqual(["The book is about two sisters.", "The ending happens at the lighthouse."]);
    expect((await listNoteHistory(db, u.id, book.id)).map((x) => x.content)).toEqual(["The ending happens on the ferry."]);

    // That evening it comes up again: the turn carries the refined summary, the notes that bear on it, and both visits.
    const evening = new Date("2026-09-12T20:00:00Z");
    const state = await loadLibraryOrNothing(db, u.id, evening);
    const view = selectLibrary(state.threads, state.notes, state.episodes, { message: "I want to write the lighthouse scene for the novel tonight" }, { now: evening, windowStartsAt: new Date("2026-09-12T19:59:00Z") });
    expect(view.open.map((o) => o.thread.id)).toEqual([book.id]);
    expect(view.open[0].notes[0].content).toBe("The ending happens at the lighthouse.");
    expect(view.episodes).toHaveLength(2);
    const block = buildContextBlock({ displayName: "Rae", timezone: "UTC", now: evening, library: view });
    expect(block).toContain("You moved the book's ending from the ferry to the lighthouse.");
    expect(block).toContain("The ending is set at the lighthouse now");
    expect(block).toContain('"The ending happens at the lighthouse." · their word');
    expect(block).not.toContain("The ending happens on the ferry.");
  });

  it("doesn't start a thread for a passing mention, but remembers the visit", async () => {
    const u = await createTestUser(db, "Sam");
    await say(u, "2026-09-11T09:00:00Z", "user", "My cousin mentioned a pottery class, anyway can we sort out the tax forms today?");
    await say(u, "2026-09-11T09:01:00Z", "assistant", "Tax forms. Which one is first?");
    const r = await consolidate(db, u, {
      now: clock("2026-09-11T12:00:00Z"),
      propose: async () => ({
        episode: { summary: "You started on the tax forms." },
        threads: [{ ref: "new:pottery", title: "Pottery class" }],
        notes: [{ thread: "new:pottery", kind: "detail", content: "Their cousin mentioned a pottery class.", source: "lumi_inferred" }],
      }),
    });
    expect(r).toMatchObject({ status: "done", threadsCreated: 0, notesFiled: 0 });
    expect(await listThreads(db, u.id)).toEqual([]);
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toHaveLength(1);
  });

  it("keeps a stretch for the next run when the model call fails", async () => {
    const u = await createTestUser(db, "Ted");
    await say(u, "2026-09-11T09:00:00Z", "user", "Let's plan the week — the grant report, the dentist and my mum's birthday.");
    await say(u, "2026-09-11T09:01:00Z", "assistant", "Grant report first. The rest are quick.");
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = await consolidate(db, u, { now: clock("2026-09-11T12:00:00Z"), propose: async () => Promise.reject(new Error("provider down")) });
    quiet.mockRestore();
    expect(failed).toEqual({ status: "failed" });
    const [c] = await db.select().from(conversations).where(eq(conversations.userId, u.id));
    expect(c.summaryThroughMessageId).toBeNull();
    const retried = await consolidate(db, u, { now: clock("2026-09-11T13:00:00Z"), propose: async () => ({ episode: { summary: "You planned the week around the grant report." }, threads: [], notes: [] }) });
    expect(retried).toMatchObject({ status: "done" });
  });

  it("consolidates a stretch once when two runs race, and only one pays for the model call", async () => {
    const u = await createTestUser(db, "Uma");
    await say(u, "2026-09-11T09:00:00Z", "user", "Can you help me plan groceries for the week, something cheap and easy?");
    await say(u, "2026-09-11T09:01:00Z", "assistant", "Lentils, eggs, rice. Two big cooks.");
    const propose = vi.fn(async (): Promise<RawProposal> => ({ episode: { summary: "You planned the week's groceries together." }, threads: [], notes: [] }));
    const results = await Promise.all([consolidate(db, u, { now: clock("2026-09-11T12:00:00Z"), propose }), consolidate(db, u, { now: clock("2026-09-11T12:00:00Z"), propose })]);
    expect(results.map((r) => r.status).sort()).toEqual(["busy", "done"]);
    expect(propose).toHaveBeenCalledOnce();
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toHaveLength(1);
    const [c] = await db.select().from(conversations).where(eq(conversations.userId, u.id));
    expect(c.consolidatingUntil).toBeNull();
  });

  it("rolls back everything a run wrote when another claimed the stretch during its model call", async () => {
    const u = await createTestUser(db, "Ula");
    await say(u, "2026-09-11T09:00:00Z", "user", "For my book the ending should happen on the ferry, I keep coming back to my book.");
    const last = await say(u, "2026-09-11T09:01:00Z", "assistant", "The ferry ending. That fits.");
    const c = await ensureMainConversation(db, u.id);
    const r = await consolidate(db, u, {
      now: clock("2026-09-11T12:00:00Z"),
      propose: async () => {
        // A run whose lease had run out got there first.
        await claimWatermark(db, c.id, null, last);
        return {
          episode: { summary: "You worked on the book's ending." },
          threads: [{ ref: "new:book", title: "The book", summary: "A novel; the ending is on the ferry." }],
          notes: [{ thread: "new:book", kind: "idea", content: "The ending happens on the ferry.", source: "lumi_inferred" }],
        };
      },
    });
    expect(r).toEqual({ status: "lost" });
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toEqual([]);
    expect(await listThreads(db, u.id)).toEqual([]);
    const trail = await db.select().from(events).where(eq(events.userId, u.id));
    expect(trail.map((e) => e.type)).not.toEqual(expect.arrayContaining(["memory.consolidated"]));
    expect(trail.filter((e) => e.type.startsWith("library.") || e.type === "memory.consolidation_failed")).toEqual([]);
  });

  it("claims the watermark last, so the conversation row is locked only for the commit", async () => {
    const log: string[] = [];
    const logged = await openTestDb({ logger: { logQuery: (q) => log.push(q) } });
    try {
      const u = await createTestUser(logged.db, "Log");
      const c = await ensureMainConversation(logged.db, u.id);
      for (const [at, role, text] of [
        ["2026-09-11T09:00:00Z", "user", "I finally booked the movers for the Halifax move, it's on the 30th."],
        ["2026-09-11T09:01:00Z", "assistant", "Movers booked. That was the big one."],
      ] as const)
        await logged.db.insert(messages).values({ conversationId: c.id, role, parts: [{ type: "text", text }], createdAt: new Date(at) });
      log.length = 0;
      const r = await consolidate(logged.db, u, { now: clock("2026-09-11T12:00:00Z"), propose: async () => ({ episode: { summary: "You booked the movers for Halifax." }, threads: [], notes: [] }) });
      expect(r).toMatchObject({ status: "done" });
      const claimAt = log.map((q) => /^update "conversations" set "summary_through_message_id"/.test(q)).lastIndexOf(true);
      expect(claimAt).toBeGreaterThan(log.findIndex((q) => q.startsWith('insert into "episodes"')));
      expect(claimAt).toBeGreaterThan(log.map((q) => q.startsWith('insert into "events"')).lastIndexOf(true));
      // After the claim only the lease is let go.
      expect(log.slice(claimAt + 1).every((q) => q.includes('"consolidating_until"'))).toBe(true);
    } finally {
      await logged.close();
    }
    // It opens its own database with every migration applied, like a beforeAll: under a full parallel run that alone can pass 5 s.
  }, 60_000);

  it("backs off a stretch that keeps failing, and a null proposal is a failure, not an empty stretch", async () => {
    const u = await createTestUser(db, "Fen");
    await say(u, "2026-09-11T09:00:00Z", "user", "Let's sort out the grant report, the dentist booking and my mum's birthday present.");
    const last = await say(u, "2026-09-11T09:01:00Z", "assistant", "Grant report first. The rest are quick.");
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(async (): Promise<RawProposal> => Promise.reject(new Error("output didn't match the schema")));
    expect(await consolidate(db, u, { now: clock("2026-09-11T12:00:00Z"), propose: failing })).toEqual({ status: "failed" });
    expect(await consolidate(db, u, { now: clock("2026-09-11T12:05:00Z"), propose: failing })).toEqual({ status: "waiting", until: new Date("2026-09-11T12:10:00Z") });
    expect(failing).toHaveBeenCalledOnce();

    const nothing = vi.fn(async () => null);
    expect(await consolidate(db, u, { now: clock("2026-09-11T12:11:00Z"), propose: nothing })).toEqual({ status: "failed" });
    expect(await consolidate(db, u, { now: clock("2026-09-11T12:50:00Z"), propose: nothing })).toEqual({ status: "waiting", until: new Date("2026-09-11T13:11:00Z") });
    quiet.mockRestore();

    const [c] = await db.select().from(conversations).where(eq(conversations.userId, u.id));
    expect(c.summaryThroughMessageId).toBeNull();
    const failures = await db.select().from(events).where(and(eq(events.userId, u.id), eq(events.type, "memory.consolidation_failed")));
    expect(failures.map((e) => e.payload)).toEqual([{ from: null, through: last }, { from: null, through: last }]);

    expect(await consolidate(db, u, { now: clock("2026-09-11T13:12:00Z"), propose: async () => ({ episode: { summary: "You planned the grant report first." }, threads: [], notes: [] }) })).toMatchObject({ status: "done" });
  });

  it("leaves a stretch another run holds, and takes it once that lease has run out", async () => {
    const u = await createTestUser(db, "Lia");
    await say(u, "2026-09-11T09:00:00Z", "user", "Can we plan the garden this weekend, raised beds and a plum tree?");
    await say(u, "2026-09-11T09:01:00Z", "assistant", "Raised beds first, the tree in autumn.");
    const c = await ensureMainConversation(db, u.id);
    await db.update(conversations).set({ consolidatingUntil: new Date("2026-09-11T12:02:00Z") }).where(eq(conversations.id, c.id));
    const propose = vi.fn(async (): Promise<RawProposal> => ({ episode: { summary: "You planned the garden together." }, threads: [], notes: [] }));
    expect(await consolidate(db, u, { now: clock("2026-09-11T12:00:00Z"), propose })).toEqual({ status: "busy" });
    expect(propose).not.toHaveBeenCalled();
    expect(await consolidate(db, u, { now: clock("2026-09-11T12:03:00Z"), propose })).toMatchObject({ status: "done" });
    const [after] = await db.select().from(conversations).where(eq(conversations.id, c.id));
    expect(after.consolidatingUntil).toBeNull();
  });

  it("runs as many passes as it's given — one for a chat turn", async () => {
    const u = await createTestUser(db, "Pax");
    await say(u, "2026-09-11T09:00:00Z", "user", "Morning: I want to get the tax forms done before lunch today.");
    await say(u, "2026-09-11T09:01:00Z", "assistant", "Tax forms before lunch. Which one first?");
    await say(u, "2026-09-11T11:00:00Z", "user", "Afternoon: the tax forms are done, now the grocery plan for the week.");
    await say(u, "2026-09-11T11:01:00Z", "assistant", "Nice. Groceries, then.");
    const deps = { now: clock("2026-09-11T14:00:00Z"), propose: async (): Promise<RawProposal> => ({ episode: { summary: "You worked through part of the day's list." }, threads: [], notes: [] }) };
    const quiet = vi.spyOn(console, "log").mockImplementation(() => {});
    await consolidateAfter(db, u, { passes: 1, deps });
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toHaveLength(1);
    await consolidateAfter(db, u, { deps });
    quiet.mockRestore();
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toHaveLength(2);
  });

  it("moves past stretches with nothing to keep and makes one model call a run by default (B18)", async () => {
    const u = await createTestUser(db, "Oda");
    await say(u, "2026-09-11T08:00:00Z", "assistant", "Still with it?");
    await say(u, "2026-09-11T09:00:00Z", "user", "ok");
    await say(u, "2026-09-11T10:00:00Z", "user", "Planning the garden: raised beds first, then a plum tree in the autumn.");
    await say(u, "2026-09-11T10:01:00Z", "assistant", "Raised beds first.");
    await say(u, "2026-09-11T12:00:00Z", "user", "Back again: the tax forms need doing before Friday, all three of them.");
    await say(u, "2026-09-11T12:01:00Z", "assistant", "Before Friday, then.");
    const propose = vi.fn(async (): Promise<RawProposal> => ({ episode: { summary: "You planned part of the day together." }, threads: [], notes: [] }));
    const logged = vi.spyOn(console, "log").mockImplementation(() => {});
    await consolidateAfter(db, u, { deps: { now: clock("2026-09-11T15:00:00Z"), propose } });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toHaveLength(1);
    const lines = logged.mock.calls.map((c) => String(c[0]));
    expect(lines.filter((l) => l.startsWith('[consolidate] {"status":"done"'))).toHaveLength(1);
    expect(lines).toContain("[consolidate] moved past 2 messages with nothing to keep");
    // The next trigger takes the next visit.
    await consolidateAfter(db, u, { deps: { now: clock("2026-09-11T15:00:00Z"), propose } });
    logged.mockRestore();
    expect(propose).toHaveBeenCalledTimes(2);
    expect(await db.select().from(episodes).where(eq(episodes.userId, u.id))).toHaveLength(2);
  });

  it("waits while the visit is still going, and moves past a stretch with nothing in it", async () => {
    const u = await createTestUser(db, "Val");
    await say(u, "2026-09-12T10:00:00Z", "user", "hi");
    const propose = vi.fn(async (): Promise<RawProposal> => ({ threads: [], notes: [] }));
    expect(await consolidate(db, u, { now: clock("2026-09-12T10:05:00Z"), propose })).toEqual({ status: "nothing" });
    expect(await consolidate(db, u, { now: clock("2026-09-12T11:00:00Z"), propose })).toMatchObject({ status: "done", episodeId: null });
    expect(propose).not.toHaveBeenCalled();
  });
});

describe("the Library in conversation", () => {
  it("starts a thread only on their word, files to it, opens it and finds it", async () => {
    const u = await createTestUser(db, "Wes");
    const words = "start a thread for my garden plan, I want raised beds";
    const refused = await call(toolsFor(u, said("hmm")).add_to_library, { new_thread: "Garden plan", kind: "decision", content: "The garden gets raised beds." });
    expect(String(refused.error)).toMatch(/their word/);

    const tools = toolsFor(u, said(words));
    const added = await call(tools.add_to_library, { new_thread: "Garden plan", kind: "decision", content: "The garden gets raised beds.", their_words: "I want raised beds" });
    expect(added).toMatchObject({ thread: "Garden plan", held_as: "their word" });
    expect(await call(tools.open_thread, { id: added.thread_id })).toMatchObject({ title: "Garden plan", notes: [{ content: "The garden gets raised beds.", held_as: "their word" }] });
    expect((await call(tools.search_library, { query: "raised beds" })).notes).toMatchObject([{ content: "The garden gets raised beds.", thread: "Garden plan" }]);
    expect(await call(tools.add_to_library, { thread_id: added.thread_id, kind: "decision", content: "the garden gets raised beds" })).toMatchObject({ already_held: true });
  });

  it("forgets a note for good: the conversation stays, and it isn't filed again from it", async () => {
    const u = await createTestUser(db, "Xan");
    const text = "for the garden plan I want raised beds and a plum tree by the fence";
    const m1 = await say(u, "2026-09-11T09:00:00Z", "user", text);
    await say(u, "2026-09-11T09:01:00Z", "assistant", "Raised beds and a plum tree. Good bones for a garden.");
    const added = await call(toolsFor(u, { messageId: m1, text }).add_to_library, { new_thread: "Garden plan", kind: "idea", content: "A plum tree goes by the fence.", their_words: "a plum tree by the fence" });
    const threadId = String(added.thread_id);

    const words = "forget the plum tree idea";
    expect(await call(toolsFor(u, said(words)).forget_from_library, { note_id: added.id, their_words: words })).toEqual({ ok: true, forgot: "note" });
    expect(await listCurrentNotes(db, u.id, [threadId])).toEqual([]);
    const conversation = await ensureMainConversation(db, u.id);
    expect(await db.select().from(messages).where(eq(messages.conversationId, conversation.id))).toHaveLength(2);

    const refiled = await consolidate(db, u, {
      now: clock("2026-09-11T12:00:00Z"),
      propose: async () => ({
        episode: { summary: "You sketched the garden plan." },
        threads: [],
        notes: [{ thread: threadId, kind: "idea", content: "A plum tree goes by the fence.", source: "user_said", their_words: "a plum tree by the fence" }],
      }),
    });
    expect(refiled).toMatchObject({ status: "done", notesFiled: 0 });
    expect(await listCurrentNotes(db, u.id, [threadId])).toEqual([]);
  });

  it("forgets a whole thread on their word", async () => {
    const u = await createTestUser(db, "Yas");
    const added = await call(toolsFor(u, said("start a thread for the Lisbon trip, we're going in April")).add_to_library, { new_thread: "Lisbon trip", kind: "detail", content: "The Lisbon trip is in April.", their_words: "we're going in April" });
    expect(String((await call(toolsFor(u, said("never mind")).forget_from_library, { thread_id: added.thread_id, their_words: "forget the trip" })).error)).toMatch(/their word/);
    const words = "forget the Lisbon trip entirely";
    expect(await call(toolsFor(u, said(words)).forget_from_library, { thread_id: added.thread_id, their_words: words })).toEqual({ ok: true, forgot: "thread" });
    expect(await listThreads(db, u.id)).toEqual([]);
    expect(await call(toolsFor(u).open_thread, { id: added.thread_id })).toHaveProperty("error");
  });
});

describe("sections of the Library", () => {
  it("consolidation gathers loose threads into a section, Lumi sees where they sit, and doesn't undo what they placed", async () => {
    const u = await createTestUser(db, "Ivo");
    const heard = said("the memory design and the onboarding are both part of coherence");
    const tools = toolsFor(u, heard);
    const memory = (await call(tools.add_to_library, { new_thread: "Memory design", kind: "idea", content: "Beliefs carry evidence.", their_words: heard.text })) as { thread_id: string };
    const onboarding = (await call(tools.add_to_library, { new_thread: "Onboarding", kind: "idea", content: "No setup ritual on the first visit.", their_words: heard.text })) as { thread_id: string };

    await say(u, "2026-09-12T19:00:00Z", "user", "The memory design and the onboarding are both part of Coherence, the app I'm building.");
    await say(u, "2026-09-12T19:01:00Z", "assistant", "Both parts of Coherence, then.");
    const r = await consolidate(db, u, {
      now: clock("2026-09-12T21:00:00Z"),
      propose: async () => ({
        threads: [{ ref: "new:app", title: "Coherence", summary: "The companion app they're building; memory design and onboarding are parts of it." }],
        notes: [],
        shelve: [
          { thread: memory.thread_id, under: "new:app" },
          { thread: onboarding.thread_id, under: "new:app" },
        ],
      }),
    });
    expect(r).toMatchObject({ status: "done", threadsCreated: 1, shelved: 2 });

    const held = await listThreads(db, u.id);
    const app = held.find((t) => t.title === "Coherence")!;
    const { sections, loose } = buildShelves(held);
    expect(sections.map((s) => s.thread.title)).toEqual(["Coherence"]);
    expect(sections[0].shelves[0].books.map((b) => b.title).sort()).toEqual(["Memory design", "Onboarding"]);
    expect(loose).toEqual([]);
    expect(held.find((t) => t.id === memory.thread_id)).toMatchObject({ parentId: app.id, shelvedBy: "lumi" });

    // Lumi knows where a thread sits.
    const view = selectLibrary(held, [], [], { message: "about the memory design" }, { now: new Date("2026-09-13T09:00:00Z") });
    expect(view.open[0]).toMatchObject({ shelf: ["Coherence"] });
    expect(await call(tools.open_thread, { id: app.id })).toMatchObject({ in: [], holds: expect.arrayContaining([{ id: memory.thread_id, title: "Memory design" }]) });

    // They take onboarding off the shelf; consolidation can't put it back.
    const off = said("onboarding is its own thing");
    expect(await call(toolsFor(u, off).shelve_thread, { thread_id: onboarding.thread_id, their_words: off.text })).toMatchObject({ in: [] });
    expect(await shelveThread(db, u.id, onboarding.thread_id, app.id, "consolidation")).toEqual({ skipped: "placed by them" });

    // Without their words, nothing moves; a fourth level is refused.
    expect(await call(tools.shelve_thread, { thread_id: onboarding.thread_id, under_id: app.id, their_words: "put it back" })).toHaveProperty("error");
    const deeper = said("put coherence under a new section called work");
    const nested = await call(toolsFor(u, deeper).shelve_thread, { thread_id: app.id, new_section: "Work", their_words: deeper.text });
    expect(nested).toMatchObject({ in: ["Work"] });
    expect(await shelveThread(db, u.id, onboarding.thread_id, memory.thread_id, "user")).toMatchObject({ skipped: expect.stringMatching(/too deep/) });

    // Forgetting a section leaves what was in it loose, never deleted.
    const forget = said("forget the work section");
    const work = (await listThreads(db, u.id)).find((t) => t.title === "Work")!;
    expect(await call(toolsFor(u, forget).forget_from_library, { thread_id: work.id, their_words: forget.text })).toMatchObject({ ok: true });
    expect((await getOwnedThread(db, u.id, app.id))?.parentId).toBeNull();
  });
});

describe("each user's Library is their own", () => {
  it("another user can't open, add to, find or forget a thread, and consolidation never shows them another's", async () => {
    const a = await createTestUser(db, "Ava");
    const b = await createTestUser(db, "Bo");
    const held = await call(toolsFor(a, said("start a thread for my garden plan, raised beds")).add_to_library, { new_thread: "Garden plan", kind: "decision", content: "The garden gets raised beds.", their_words: "a thread for my garden plan, raised beds" });
    const id = held.thread_id;

    const other = toolsFor(b, said("add to the garden plan and forget the garden plan"));
    expect(await call(other.open_thread, { id })).toHaveProperty("error");
    expect(await call(other.add_to_library, { thread_id: id, kind: "idea", content: "Tomatoes along the wall.", their_words: "add to the garden plan" })).toHaveProperty("error");
    expect(await call(other.search_library, { query: "garden raised beds" })).toEqual({ threads: [], notes: [] });
    expect(await call(other.forget_from_library, { thread_id: id, their_words: "forget the garden plan" })).toHaveProperty("error");
    expect(await call(other.forget_from_library, { note_id: held.id, their_words: "forget the garden plan" })).toHaveProperty("error");

    await say(b, "2026-09-11T09:00:00Z", "user", "I'm thinking about my own garden plan, maybe raised beds too.");
    await say(b, "2026-09-11T09:01:00Z", "assistant", "Raised beds are forgiving.");
    let seen: ConsolidationInputs | undefined;
    await consolidate(db, b, {
      now: clock("2026-09-11T12:00:00Z"),
      propose: async (inputs) => {
        seen = inputs;
        return { threads: [], notes: [{ thread: String(id), kind: "idea", content: "Tomatoes along the wall.", source: "lumi_inferred" }] };
      },
    });
    expect(seen?.threads).toEqual([]);
    expect(seen?.notes).toEqual([]);
    expect((await listCurrentNotes(db, a.id, [String(id)])).map((x) => x.content)).toEqual(["The garden gets raised beds."]);
    expect((await loadLibraryOrNothing(db, b.id)).threads).toEqual([]);
  });
});

describe("the watermark", () => {
  it("reads from the latest episode's end when the watermark message is gone, not from the start", async () => {
    const u = await createTestUser(db, "Wim");
    const c = await ensureMainConversation(db, u.id);
    const first = await say(u, "2026-09-10T09:00:00Z", "user", "an old stretch, already folded in");
    const endOfOld = await say(u, "2026-09-10T09:05:00Z", "assistant", "the end of it");
    const fresh = await say(u, "2026-09-11T09:00:00Z", "user", "something new since");
    await insertEpisode(db, { userId: u.id, conversationId: c.id, summary: "The old stretch.", leftOff: null, startedAt: new Date("2026-09-10T09:00:00Z"), endedAt: new Date("2026-09-10T09:05:00Z"), throughMessageId: endOfOld });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rows = await unconsolidatedMessages(db, c.id, randomUUID());
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
    expect(rows.map((r) => r.id)).toEqual([fresh]);
    expect(rows.map((r) => r.id)).not.toContain(first);
  });
});

describe("when the Library can't be reached", () => {
  it("a turn carries on without it", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = {
      select: () => {
        throw new Error('relation "threads" does not exist');
      },
    } as unknown as Db;
    const state = await loadLibraryOrNothing(broken, randomUUID());
    quiet.mockRestore();
    expect(state).toMatchObject({ threads: [], notes: [], episodes: [], unavailable: true });
    expect(buildContextBlock({ displayName: "C", timezone: "UTC", libraryUnavailable: true })).toContain("Couldn't read the Library this turn");
  });
});

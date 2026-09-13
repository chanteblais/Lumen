import { describe, expect, it } from "vitest";
import { clampConsolidation, KEEP_TAIL, LONG_SITTING, MAX_BATCH, pickBatch, type BatchMessage, type RawProposal } from "./consolidate";

const t0 = new Date("2026-09-12T19:00:00Z").getTime();
const msg = (min: number, role = "user", text = "something worth saying"): BatchMessage => ({ id: `m${min}`, role, text, createdAt: new Date(t0 + min * 60_000) });
const at = (min: number) => new Date(t0 + min * 60_000);

describe("pickBatch", () => {
  it("takes a sitting once a later one has begun", () => {
    const msgs = [msg(0), msg(2, "assistant"), msg(5), msg(60), msg(61, "assistant")];
    expect(pickBatch(msgs, at(62)).map((m) => m.id)).toEqual(["m0", "m2", "m5"]);
  });

  it("waits while the sitting is still going, and takes it half an hour after its last message", () => {
    const msgs = [msg(0), msg(3, "assistant")];
    expect(pickBatch(msgs, at(10))).toEqual([]);
    expect(pickBatch(msgs, at(33))).toHaveLength(2);
  });

  it("takes the start of a long sitting still going, keeping its last few messages", () => {
    const msgs = Array.from({ length: LONG_SITTING }, (_, i) => msg(i));
    expect(pickBatch(msgs, at(LONG_SITTING))).toHaveLength(LONG_SITTING - KEEP_TAIL);
  });

  it("caps one run", () => {
    const msgs = Array.from({ length: MAX_BATCH + 10 }, (_, i) => msg(i / 10));
    expect(pickBatch(msgs, at(1000))).toHaveLength(MAX_BATCH);
  });
});

describe("clampConsolidation", () => {
  const held = [{ id: "t1", title: "Saltwater", aliases: ["the book"] }];
  const notes = [{ id: "n1", threadId: "t1", content: "The ending happens on the ferry." }];
  const heard = [
    { messageId: "u1", text: "back on the book, the ending moves to the lighthouse" },
    { messageId: "u2", text: "and my pottery class starts Tuesday" },
  ];
  const proposal = (over: Partial<RawProposal>): RawProposal => ({ episode: { summary: "Talked about the book's ending and a pottery class." }, threads: [], notes: [], ...over });

  it("files under a held thread — on their word when their words are there — and replaces the note it changes", () => {
    const plan = clampConsolidation(
      proposal({
        threads: [{ ref: "t1", summary: "A novel about two sisters; the ending is at the lighthouse now." }],
        notes: [{ thread: "t1", kind: "decision", content: "The ending happens at the lighthouse.", source: "user_said", their_words: "the ending moves to the lighthouse", supersedes: "n1" }],
      }),
      { threads: held, notes, heard },
    );
    expect(plan.notes).toEqual([{ thread: "t1", kind: "decision", content: "The ending happens at the lighthouse.", source: "user_said", sourceMessageId: "u1", supersedes: "n1" }]);
    expect(plan.summaries).toEqual([{ threadId: "t1", summary: "A novel about two sisters; the ending is at the lighthouse now." }]);
    expect(plan.episode?.summary).toContain("pottery");
  });

  it("drops invented ids, repeats and secrets, a supersedes that isn't current, and holds unmatched words as a reading", () => {
    const plan = clampConsolidation(
      proposal({
        notes: [
          { thread: "t-invented", kind: "idea", content: "Something about the sea.", source: "lumi_inferred" },
          { thread: "t1", kind: "detail", content: "the ending happens on the ferry", source: "lumi_inferred" },
          { thread: "t1", kind: "detail", content: "Her login password is gull1234.", source: "lumi_inferred" },
          { thread: "t1", kind: "idea", content: "The sisters stop speaking in chapter 4.", source: "user_said", their_words: "they stop speaking in chapter four", supersedes: "n-old" },
        ],
      }),
      { threads: held, notes, heard },
    );
    expect(plan.notes).toEqual([{ thread: "t1", kind: "idea", content: "The sisters stop speaking in chapter 4.", source: "lumi_inferred" }]);
  });

  it("turns a new thread whose name is already held into that thread, adding the new words", () => {
    const plan = clampConsolidation(
      proposal({
        threads: [{ ref: "new:novel", title: "The book", aliases: ["the novel"] }],
        notes: [{ thread: "new:novel", kind: "idea", content: "A storm cuts the island off in act two.", source: "lumi_inferred" }],
      }),
      { threads: held, notes, heard },
    );
    expect(plan.newThreads).toEqual([]);
    expect(plan.notes[0].thread).toBe("t1");
    expect(plan.aliases).toEqual([{ threadId: "t1", aliases: ["the novel"] }]);
  });

  it("doesn't start a thread for a passing mention", () => {
    const plan = clampConsolidation(
      proposal({
        threads: [{ ref: "new:pottery", title: "Pottery class" }],
        notes: [{ thread: "new:pottery", kind: "detail", content: "The pottery class starts on Tuesday.", source: "lumi_inferred" }],
      }),
      { threads: held, notes, heard },
    );
    expect(plan.newThreads).toEqual([]);
    expect(plan.notes).toEqual([]);
  });

  it("starts a thread they came back to within the stretch", () => {
    const talk = [
      { messageId: "a", text: "the garden plan is taking shape" },
      { messageId: "b", text: "for the garden plan I want raised beds" },
    ];
    const plan = clampConsolidation(
      proposal({
        threads: [{ ref: "new:garden", title: "The garden plan", summary: "Planning a vegetable garden with raised beds." }],
        notes: [{ thread: "new:garden", kind: "decision", content: "The garden gets raised beds.", source: "user_said", their_words: "I want raised beds" }],
      }),
      { threads: [], notes: [], heard: talk },
    );
    expect(plan.newThreads).toEqual([{ key: "new:garden", title: "The garden plan", aliases: [], summary: "Planning a vegetable garden with raised beds." }]);
    expect(plan.notes).toEqual([{ thread: "new:garden", kind: "decision", content: "The garden gets raised beds.", source: "user_said", sourceMessageId: "b" }]);
  });

  it("starts one they spent real time on, and no more than two a run", () => {
    const three = (key: string, contents: string[]) => contents.map((content) => ({ thread: key, kind: "idea" as const, content, source: "lumi_inferred" as const }));
    const plan = clampConsolidation(
      proposal({
        threads: [
          { ref: "new:theory", title: "Attention theory" },
          { ref: "new:move", title: "Moving house" },
          { ref: "new:trip", title: "The Lisbon trip" },
        ],
        notes: [
          ...three("new:theory", ["Attention follows meaning, not effort.", "Salience is relational.", "Rest is part of attention."]),
          ...three("new:move", ["Boxes go in the spare room.", "The lease ends in March.", "The new place is near the river."]),
          ...three("new:trip", ["Lisbon in the spring.", "Trams instead of taxis.", "A day in Sintra."]),
        ],
      }),
      { threads: [], notes: [], heard },
    );
    expect(plan.newThreads).toHaveLength(2);
    expect(new Set(plan.notes.map((n) => n.thread)).size).toBe(2);
  });

  it("rewrites a summary only for a thread this stretch touched, and keeps no episode it can't use", () => {
    const plan = clampConsolidation(proposal({ episode: { summary: "ok" }, threads: [{ ref: "t2", summary: "Practicum is going well, supervision on Wednesdays." }] }), {
      threads: [...held, { id: "t2", title: "Practicum", aliases: [] }],
      notes,
      heard,
    });
    expect(plan.summaries).toEqual([]);
    expect(plan.episode).toBeNull();
  });
});

describe("clampConsolidation — shelves", () => {
  const held = [
    { id: "app", title: "Coherence", aliases: [], parentId: null },
    { id: "memory", title: "Memory design", aliases: [], parentId: null },
    { id: "onboarding", title: "Onboarding", aliases: [], parentId: "app" },
    { id: "pottery", title: "Pottery", aliases: [], parentId: null },
    { id: "glaze", title: "Glazes", aliases: [], parentId: null },
  ];
  const heard = [{ messageId: "u1", text: "memory design for coherence, and my pottery glazes" }];
  const proposal = (over: Partial<RawProposal>): RawProposal => ({ threads: [], notes: [], ...over });

  it("shelves a loose thread under a held one, and never moves one already shelved", () => {
    const plan = clampConsolidation(
      proposal({ shelve: [{ thread: "memory", under: "app" }, { thread: "onboarding", under: "pottery" }, { thread: "invented", under: "app" }] }),
      { threads: held, notes: [], heard },
    );
    expect(plan.shelves).toEqual([{ thread: "memory", under: "app" }]);
    expect(plan.newThreads).toEqual([]);
  });

  it("starts a section only when it gathers two loose threads, and keeps three levels", () => {
    const gathering = clampConsolidation(
      proposal({
        threads: [{ ref: "new:craft", title: "Making things", summary: "The things they make by hand: pottery and its glazes." }],
        shelve: [{ thread: "pottery", under: "new:craft" }, { thread: "glaze", under: "new:craft" }],
      }),
      { threads: held, notes: [], heard },
    );
    expect(gathering.newThreads.map((t) => t.title)).toEqual(["Making things"]);
    expect(gathering.shelves).toHaveLength(2);

    const alone = clampConsolidation(
      proposal({ threads: [{ ref: "new:craft", title: "Making things" }], shelve: [{ thread: "pottery", under: "new:craft" }] }),
      { threads: held, notes: [], heard },
    );
    expect(alone.newThreads).toEqual([]);
    expect(alone.shelves).toEqual([]);

    const deep = clampConsolidation(
      proposal({ shelve: [{ thread: "glaze", under: "pottery" }, { thread: "pottery", under: "memory" }, { thread: "memory", under: "app" }] }),
      { threads: held, notes: [], heard },
    );
    // glaze under pottery, then pottery (now holding glaze) under memory, then memory under app would be four levels.
    expect(deep.shelves).toEqual([{ thread: "glaze", under: "pottery" }, { thread: "pottery", under: "memory" }]);
  });
});

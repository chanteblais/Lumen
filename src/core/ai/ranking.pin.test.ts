/**
 * Pins what lexical selection chooses, and in what order, on one fixed fixture —
 * beliefs, threads and notes — so a refactor of the scoring (code review B15)
 * can't change a ranking without failing here. Snapshots were written by the
 * scoring as it stood before that refactor.
 */
import { describe, expect, it } from "vitest";
import { matchNotes, rankNotes, rankThreads, selectLibrary, threadScore, type SelectableNote, type SelectableThread } from "./library-select";
import { rankForRecall, selectBeliefs, type SelectableBelief } from "./memory-select";

const now = new Date("2026-09-13T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

const threads: SelectableThread[] = [
  { id: "t-book", title: "Saltwater", aliases: ["the book", "my novel"], summary: "A novel about two sisters on a fishing island; the ending is still open.", lastDiscussedAt: daysAgo(2) },
  { id: "t-prac", title: "Practicum", aliases: ["placement"], summary: "Counselling practicum; supervision on Wednesdays, case notes due Fridays.", lastDiscussedAt: daysAgo(5) },
  { id: "t-garden", title: "Garden", aliases: ["the allotment"], summary: "Raised beds, a plum tree in autumn, and the island of herbs by the fence.", lastDiscussedAt: daysAgo(1) },
  { id: "t-move", title: "Moving house", aliases: ["the move"], summary: null, lastDiscussedAt: daysAgo(9) },
  { id: "t-yoga", title: "Yoga", aliases: [], summary: "Morning sequence; working on the island of calm before supervision.", lastDiscussedAt: daysAgo(2), parentId: null },
];

let n = 0;
const note = (threadId: string, content: string, d: number, over: Partial<SelectableNote> = {}): SelectableNote => ({ id: `n${++n}`, threadId, content, createdAt: daysAgo(d), supersededById: null, ...over });
const notes: SelectableNote[] = [
  note("t-book", "The ending happens at the lighthouse on the island.", 4),
  note("t-book", "Draft two stops at chapter 7.", 1),
  note("t-book", "The younger sister narrates the second half of the novel.", 2),
  note("t-book", "The ending happens on the ferry.", 9, { supersededById: "n1" }),
  note("t-prac", "Supervision moved to Thursday mornings.", 3),
  note("t-prac", "Case notes are due every Friday before supervision.", 6),
  note("t-garden", "The plum tree goes in after the first frost.", 2),
  note("t-garden", "Herbs on the island bed by the fence.", 8),
  note("t-move", "Boxes from the grocery store on Tuesday.", 1),
  note("t-yoga", "Twenty minutes before supervision helps.", 2),
];

let b = 0;
const belief = (kind: SelectableBelief["kind"], content: string, over: Partial<SelectableBelief> = {}): SelectableBelief => ({
  id: `b${++b}`,
  kind,
  content,
  source: "user_said",
  confidence: 0.8,
  evidenceFor: 0,
  evidenceAgainst: 0,
  createdAt: daysAgo(3),
  lastConfirmedAt: null,
  retiredAt: null,
  ...over,
});
const beliefs: SelectableBelief[] = [
  belief("preference", "Likes short replies."),
  belief("preference", "No pep talks.", { confidence: 0.95 }),
  belief("strategy", "Reading the last paragraph first gets them started.", { evidenceFor: 3 }),
  belief("strategy", "A two-minute timer helps with case notes.", { evidenceFor: 1, evidenceAgainst: 1 }),
  belief("project", "Writing a novel called Saltwater about two sisters.", { createdAt: daysAgo(1) }),
  belief("project", "Counselling practicum until December.", { createdAt: daysAgo(20) }),
  belief("fact", "Supervision is on Thursday mornings now.", { createdAt: daysAgo(2) }),
  belief("fact", "Lives near the ferry terminal.", { createdAt: daysAgo(40) }),
  belief("pattern", "Mornings go better than evenings for writing.", { source: "lumi_inferred", confidence: 0.45 }),
  belief("anti_pattern", "Opening email first derails the writing morning.", { source: "lumi_inferred", confidence: 0.55 }),
  belief("fact", "Has a plum tree on order for the allotment.", { createdAt: daysAgo(70), source: "lumi_inferred", confidence: 0.3 }),
];

const signals = [
  { message: "I want to fix the ending of the book, maybe the island chapter" },
  { message: "case notes before supervision on thursday", recent: ["how's the novel going", "the plum tree came"] },
  { message: "ok", focus: ["Write chapter 8 of Saltwater", "Read the last paragraph"] },
  { message: "what should I plant on the island bed" },
];

describe("lexical selection, pinned", () => {
  it("scores and ranks threads the same way", () => {
    expect(signals.map((s) => threads.map((t) => [t.id, threadScore(t, notes.filter((x) => x.threadId === t.id), s)]))).toMatchInlineSnapshot(`
      [
        [
          [
            "t-book",
            17,
          ],
          [
            "t-prac",
            0,
          ],
          [
            "t-garden",
            1.5,
          ],
          [
            "t-move",
            0,
          ],
          [
            "t-yoga",
            1.5,
          ],
        ],
        [
          [
            "t-book",
            1.5,
          ],
          [
            "t-prac",
            4,
          ],
          [
            "t-garden",
            1,
          ],
          [
            "t-move",
            0,
          ],
          [
            "t-yoga",
            3,
          ],
        ],
        [
          [
            "t-book",
            9,
          ],
          [
            "t-prac",
            0,
          ],
          [
            "t-garden",
            0,
          ],
          [
            "t-move",
            0,
          ],
          [
            "t-yoga",
            0,
          ],
        ],
        [
          [
            "t-book",
            1.5,
          ],
          [
            "t-prac",
            0,
          ],
          [
            "t-garden",
            3,
          ],
          [
            "t-move",
            0,
          ],
          [
            "t-yoga",
            1.5,
          ],
        ],
      ]
    `);
    expect(signals.map((s) => rankThreads(threads, s.message, notes).map((t) => t.id))).toMatchInlineSnapshot(`
      [
        [
          "t-book",
          "t-garden",
          "t-yoga",
        ],
        [
          "t-prac",
          "t-yoga",
        ],
        [],
        [
          "t-garden",
          "t-yoga",
          "t-book",
        ],
      ]
    `);
    expect(rankThreads(threads, "island supervision")).toMatchInlineSnapshot(`
      [
        {
          "aliases": [],
          "id": "t-yoga",
          "lastDiscussedAt": 2026-09-11T12:00:00.000Z,
          "parentId": null,
          "summary": "Morning sequence; working on the island of calm before supervision.",
          "title": "Yoga",
        },
        {
          "aliases": [
            "the allotment",
          ],
          "id": "t-garden",
          "lastDiscussedAt": 2026-09-12T12:00:00.000Z,
          "summary": "Raised beds, a plum tree in autumn, and the island of herbs by the fence.",
          "title": "Garden",
        },
        {
          "aliases": [
            "the book",
            "my novel",
          ],
          "id": "t-book",
          "lastDiscussedAt": 2026-09-11T12:00:00.000Z,
          "summary": "A novel about two sisters on a fishing island; the ending is still open.",
          "title": "Saltwater",
        },
        {
          "aliases": [
            "placement",
          ],
          "id": "t-prac",
          "lastDiscussedAt": 2026-09-08T12:00:00.000Z,
          "summary": "Counselling practicum; supervision on Wednesdays, case notes due Fridays.",
          "title": "Practicum",
        },
      ]
    `);
  });

  it("opens, indexes and orders notes the same way", () => {
    expect(
      signals.map((s) => {
        const v = selectLibrary(threads, notes, [], s, { now });
        return { open: v.open.map((o) => [o.thread.id, o.notes.map((x) => x.id)]), index: v.index.map((x) => x.thread.id) };
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "index": [
            "t-garden",
            "t-yoga",
            "t-prac",
            "t-move",
          ],
          "open": [
            [
              "t-book",
              [
                "n1",
                "n2",
                "n3",
              ],
            ],
          ],
        },
        {
          "index": [
            "t-garden",
            "t-yoga",
            "t-book",
            "t-prac",
            "t-move",
          ],
          "open": [],
        },
        {
          "index": [
            "t-garden",
            "t-yoga",
            "t-prac",
            "t-move",
          ],
          "open": [
            [
              "t-book",
              [
                "n2",
                "n3",
                "n1",
              ],
            ],
          ],
        },
        {
          "index": [
            "t-garden",
            "t-yoga",
            "t-book",
            "t-prac",
            "t-move",
          ],
          "open": [],
        },
      ]
    `);
    expect(signals.map((s) => rankNotes(notes, s).map((x) => x.id))).toMatchInlineSnapshot(`
      [
        [
          "n1",
          "n2",
          "n8",
          "n9",
          "n3",
          "n7",
          "n10",
          "n5",
          "n6",
        ],
        [
          "n6",
          "n10",
          "n5",
          "n7",
          "n3",
          "n2",
          "n9",
          "n1",
          "n8",
        ],
        [
          "n2",
          "n9",
          "n3",
          "n7",
          "n10",
          "n5",
          "n1",
          "n6",
          "n8",
        ],
        [
          "n8",
          "n1",
          "n2",
          "n9",
          "n3",
          "n7",
          "n10",
          "n5",
          "n6",
        ],
      ]
    `);
    expect(["island", "supervision thursday", "ending lighthouse", "nothing here"].map((q) => matchNotes(notes, q).map((x) => x.id))).toMatchInlineSnapshot(`
      [
        [
          "n1",
          "n8",
        ],
        [
          "n5",
          "n10",
          "n6",
        ],
        [
          "n1",
        ],
        [],
      ]
    `);
  });

  it("chooses and recalls beliefs the same way", () => {
    expect(signals.map((s) => selectBeliefs(beliefs, s, now, 7).chosen.map((x) => x.id))).toMatchInlineSnapshot(`
      [
        [
          "b2",
          "b1",
          "b3",
          "b4",
          "b5",
          "b7",
          "b6",
        ],
        [
          "b2",
          "b1",
          "b3",
          "b4",
          "b7",
          "b5",
          "b6",
        ],
        [
          "b2",
          "b1",
          "b3",
          "b4",
          "b5",
          "b10",
          "b9",
        ],
        [
          "b2",
          "b1",
          "b3",
          "b4",
          "b5",
          "b7",
          "b6",
        ],
      ]
    `);
    expect(["supervision", "writing novel", "plum tree allotment", "preferences"].map((q) => rankForRecall(beliefs, q).map((x) => x.id))).toMatchInlineSnapshot(`
      [
        [
          "b7",
        ],
        [
          "b5",
          "b10",
          "b9",
        ],
        [
          "b11",
        ],
        [
          "b2",
          "b1",
        ],
      ]
    `);
  });
});

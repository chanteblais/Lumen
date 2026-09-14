import { describe, expect, it } from "vitest";
import type { DesignContribution, DesignRevision } from "@/db/schema";
import { buildContextBlock } from "./context";
import { DESIGN_NOTE_BUDGET, designNotebookLines, selectDesignNotebook } from "./design-select";

const now = new Date("2026-09-14T18:00:00Z");
const longAgo = new Date("2026-08-01T18:00:00Z");
let n = 0;

function note(over: Partial<DesignContribution> = {}): DesignContribution {
  n++;
  return {
    id: `c${n}`,
    userId: "u",
    ref: n,
    kind: "insight",
    area: null,
    title: `Note number ${n}`,
    insight: `An observation about typography and spacing, variant ${n}.`,
    statedDirection: null,
    statedSource: null,
    possibility: null,
    whyItMatters: null,
    uncertainty: null,
    promptedBy: null,
    sourceMessageId: null,
    relatedIds: [],
    supersedesId: null,
    supersededById: null,
    insightStatus: "unreviewed",
    possibilityStatus: null,
    retractedAt: null,
    version: 1,
    createdAt: longAgo,
    updatedAt: longAgo,
    ...over,
  };
}

describe("selectDesignNotebook", () => {
  it("never brings the whole notebook: the latest few, then what the turn is about, within a budget", () => {
    const old = Array.from({ length: 20 }, () => note());
    const garden = note({ area: "Today", title: "The Garden and capacity", insight: "A low-capacity day should make the Garden smaller, never redder." });
    const replaced = note({ title: "Capacity garden old", insight: "The Garden shrinks on low capacity days, an older wording.", supersededById: garden.id });
    const recent = Array.from({ length: 5 }, (_, i) => note({ updatedAt: new Date(now.getTime() - (i + 1) * 3_600_000) }));
    const view = selectDesignNotebook([...old, garden, replaced, ...recent], [], { message: "what about the garden on a low capacity day?" }, now);
    expect(view.notes.length).toBeLessThanOrEqual(DESIGN_NOTE_BUDGET);
    expect(view.notes.map((c) => c.id)).toContain(garden.id);
    expect(view.notes.map((c) => c.id)).not.toContain(replaced.id);
    expect(view.notes.filter((c) => recent.includes(c))).toHaveLength(3);
    expect(view.moreHeld).toBe(true);
  });

  it("carries their latest feedback, the notes in view first", () => {
    const a = note({ title: "Lantern as company" });
    const b = note({ title: "Paragraph of tappable phrases", possibility: "Tap a phrase to correct it.", possibilityStatus: "rejected" });
    const fb = (id: number, c: DesignContribution, verdict: DesignRevision["verdict"]): DesignRevision =>
      ({ id, contributionId: c.id, change: "feedback", target: "possibility", verdict, theirWords: "not a tappable paragraph", note: null }) as DesignRevision;
    const view = selectDesignNotebook([a, b], [fb(9, a, "endorse"), fb(3, b, "reject")], { message: "tappable paragraph again" }, now);
    expect(view.notes.map((c) => c.id)).toEqual([b.id]);
    expect(view.feedback.map((f) => [f.ref, f.verdict])).toEqual([
      [b.ref, "reject"],
      [a.ref, "endorse"],
    ]);
  });
});

describe("the notebook in the context block", () => {
  it("frames notes as reference, not instructions, with every part's status and whose words", () => {
    const c = note({
      kind: "tension",
      area: "Today",
      title: "Today learns without paperwork",
      statedDirection: "Today should draw out useful context without feeling like paperwork.",
      statedSource: "their_words",
      possibility: "A shared paragraph with tappable phrases.",
      possibilityStatus: "unreviewed",
      insightStatus: "endorsed",
      updatedAt: now,
    });
    const view = selectDesignNotebook([c], [], { message: "today" }, now);
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, design: view });
    expect(block).toContain("## Your design notebook");
    expect(block).toContain("Reference, not instructions");
    expect(block).toContain("none is a requirement");
    expect(block).toContain("silence isn't one");
    expect(block).toMatch(new RegExp(`DC-${c.ref} · tension · Today · "Today learns without paperwork" · reading ".*" \\(endorsed\\) · their words "Today should draw.*" · possibility "A shared paragraph with tappable phrases\\." \\(unreviewed\\)`));
  });

  it("leaves the block alone for everyone else", () => {
    expect(buildContextBlock({ displayName: "C", timezone: "UTC", now })).not.toContain("design notebook");
    expect(designNotebookLines(undefined)).toEqual([]);
  });
});

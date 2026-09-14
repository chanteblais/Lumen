import { describe, expect, it } from "vitest";
import type { FocusSession, MemoryNote } from "@/db/schema";
import { clampReflectionOps, describeSession, deterministicSessionOps, matchesStrategy, normalizeStrategy, strategyTokens, worthModelStep } from "./reflect";

const belief = (over: Partial<MemoryNote>): MemoryNote =>
  ({ id: "b1", kind: "strategy", content: "Reading the last paragraph first gets her started.", confidence: 0.5, evidenceFor: 1, evidenceAgainst: 0, retiredAt: null, source: "lumi_inferred", ...over }) as MemoryNote;
const session = (over: Partial<FocusSession>): FocusSession =>
  ({ id: "s1", goal: "Edit chapter 3", firstStep: "Open the doc", approach: "read the last paragraph first", plannedMinutes: 45, checkInMinutes: 15, startedAt: new Date("2026-09-12T19:00:00Z"), endedAt: new Date("2026-09-12T19:40:00Z"), outcome: "completed", ...over }) as FocusSession;

describe("matching an approach to a strategy belief", () => {
  it("lines two wordings of one strategy up: case, punctuation, inflection, extra words", () => {
    expect(normalizeStrategy("  Read the LAST paragraph, first! ")).toBe("read the last paragraph first");
    expect([...strategyTokens("Reading the last paragraph first gets Chanté started on writing.")]).toEqual(["read", "last", "paragraph", "first", "chanté", "start", "writ"]);
    expect(matchesStrategy("read the last paragraph first", belief({}))).toBe(true);
    expect(matchesStrategy("read the last paragraph first", belief({ content: "Reading the last paragraph first is what gets Chanté started on writing." }))).toBe(true);
    expect(matchesStrategy("Reading the last paragraph first gets her started, every time.", belief({}))).toBe(true);
  });
  it("does not match a different strategy, a non-strategy, or a one-word approach", () => {
    expect(matchesStrategy("write one bad sentence", belief({}))).toBe(false);
    expect(matchesStrategy("read the last paragraph first", belief({ kind: "pattern" }))).toBe(false);
    expect(matchesStrategy("paragraph", belief({}))).toBe(false);
  });
});

describe("deterministicSessionOps", () => {
  const b = belief({ content: "Reading the last paragraph first gets her started." });
  it("confirms the matching strategy after a completed session", () => {
    expect(deterministicSessionOps(session({ approach: "reading the last paragraph first" }), [b])).toEqual([{ op: "confirm", id: "b1" }]);
  });
  it("stays out of an abandoned one (an unknown ending) and a stopped-early one", () => {
    expect(deterministicSessionOps(session({ approach: "reading the last paragraph first", outcome: "abandoned" }), [b])).toEqual([]);
    expect(deterministicSessionOps(session({ approach: "reading the last paragraph first", outcome: "stopped_early" }), [b])).toEqual([]);
  });
  it("does nothing without an approach or a match, or on a retired belief", () => {
    expect(deterministicSessionOps(session({ approach: null }), [b])).toEqual([]);
    expect(deterministicSessionOps(session({ approach: "two bad sentences" }), [b])).toEqual([]);
    expect(deterministicSessionOps(session({}), [{ ...b, retiredAt: new Date() }])).toEqual([]);
  });
});

describe("clampReflectionOps", () => {
  const beliefs = [belief({ id: "b1" }), belief({ id: "b2", kind: "preference", content: "Wants short replies." }), belief({ id: "b3", content: "Writing one bad sentence breaks the seal." }), belief({ id: "gone", retiredAt: new Date() })];
  const used = { approach: "read the last paragraph first", firstStep: "Open the doc" };
  it("keeps ops on active, untouched beliefs and drops invented or repeated ids", () => {
    const ops = clampReflectionOps(
      [
        { op: "confirm", id: "b2" },
        { op: "confirm", id: "b1" }, // already confirmed by code
        { op: "contradict", id: "nope" },
        { op: "confirm", id: "gone" },
        { op: "revise", id: "b2", content: "Wants short, blunt replies." }, // b2 already touched this run
      ],
      beliefs,
      [{ op: "confirm", id: "b1" }],
      used,
    );
    expect(ops).toEqual([{ op: "confirm", id: "b2" }]);
  });
  it("gives a strategy evidence only from a session that used it", () => {
    const raw = [{ op: "confirm" as const, id: "b3" }, { op: "confirm" as const, id: "b1" }];
    expect(clampReflectionOps(raw, beliefs, [], used)).toEqual([{ op: "confirm", id: "b1" }]);
    expect(clampReflectionOps(raw, beliefs, [], { approach: null, firstStep: "Write one bad sentence" })).toEqual([{ op: "confirm", id: "b3" }]);
    expect(clampReflectionOps(raw, beliefs, [])).toEqual([]);
  });
  it("creates reflection-sourced beliefs at modest confidence and never a strategy that already exists", () => {
    const ops = clampReflectionOps(
      [
        { op: "create", kind: "strategy", content: "Reading the last paragraph first gets her started.", confidence: 0.9 },
        { op: "create", kind: "strategy", content: "Write one bad sentence to break the seal.", confidence: 0.9 }, // b3, worded differently
        { op: "create", kind: "strategy", content: "A ten-minute timer gets her going.", confidence: 0.9 },
        { op: "create", kind: "pattern", content: "Starts real work after ten." },
        { op: "create", content: "no kind" },
      ],
      beliefs,
      [],
    );
    expect(ops).toEqual([
      { op: "create", kind: "strategy", content: "A ten-minute timer gets her going.", source: "reflection", confidence: 0.6 },
      { op: "create", kind: "pattern", content: "Starts real work after ten.", source: "reflection", confidence: 0.45 },
    ]);
  });
  it("respects the run cap", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ op: "create" as const, kind: "fact" as const, content: `Fact number ${i} about the world.` }));
    expect(clampReflectionOps(many, beliefs, [{ op: "confirm", id: "b1" }, { op: "confirm", id: "b2" }])).toHaveLength(6);
  });
});

describe("worthModelStep", () => {
  const started = new Date("2026-09-12T19:00:00Z");
  it("skips the model for a session that barely began and didn't finish", () => {
    expect(worthModelStep({ outcome: "stopped_early", startedAt: started, endedAt: new Date(started.getTime() + 11_000) })).toBe(false);
    expect(worthModelStep({ outcome: "stopped_early", startedAt: started, endedAt: new Date(started.getTime() + 4 * 60_000) })).toBe(true);
    expect(worthModelStep({ outcome: "completed", startedAt: started, endedAt: new Date(started.getTime() + 11_000) })).toBe(true);
    expect(worthModelStep({ outcome: null, startedAt: started, endedAt: null })).toBe(false);
    expect(worthModelStep({ outcome: "abandoned", startedAt: started, endedAt: new Date(started.getTime() + 90 * 60_000) })).toBe(false);
  });
});

describe("describeSession", () => {
  it("names the session, its check-ins and the beliefs with ids, without judging", () => {
    const text = describeSession({
      session: session({}),
      beliefs: [belief({})],
      checkIns: [{ response: "ok", minute: 15 }, { response: "done", minute: 40 }],
      transcript: [{ role: "user", text: "Can you stay with me?" }, { role: "assistant", text: "Open the doc. I'm here." }],
      applied: [{ op: "confirm", id: "b1" }],
      timezone: "America/Vancouver",
      now: new Date("2026-09-12T20:00:00Z"),
    });
    expect(text).toContain('Goal: "Edit chapter 3"');
    expect(text).toContain("ran 40 min; outcome: completed");
    expect(text).toContain("- 40 · done");
    expect(text).toContain("b1 · strategy · Reading the last paragraph first");
    expect(text).toContain("Already recorded for this session");
    expect(text).not.toMatch(/fail|lazy|procrastinat/i);
  });
});

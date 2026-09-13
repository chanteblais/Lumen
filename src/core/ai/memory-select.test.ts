import { describe, expect, it } from "vitest";
import { buildContextBlock } from "./context";
import { MEMORY_BUDGET, rankForRecall, selectBeliefs, type SelectableBelief } from "./memory-select";
import type { MemoryNote } from "@/db/schema";

const now = new Date("2026-09-13T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

let n = 0;
const belief = (content: string, over: Partial<SelectableBelief> = {}): SelectableBelief => ({
  id: `b${++n}`,
  kind: "fact",
  content,
  source: "user_said",
  confidence: 0.9,
  evidenceFor: 0,
  evidenceAgainst: 0,
  createdAt: daysAgo(10),
  lastConfirmedAt: null,
  retiredAt: null,
  ...over,
});

const HOBBIES = ["sourdough", "cycling", "chess", "pottery", "climbing", "knitting", "birdwatching", "violin", "fencing", "origami", "kayaking", "calligraphy", "juggling", "archery", "beekeeping", "woodcarving", "tango", "astronomy", "sailing", "embroidery"];

describe("selectBeliefs", () => {
  const preference = belief("Likes short, blunt replies.", { kind: "preference" });
  const strategy = belief("Reading the last paragraph first gets them started.", { kind: "strategy", source: "reflection", confidence: 0.7, evidenceFor: 3 });
  const landlord = belief("Landlord is called Marcus and prefers texts.", { createdAt: daysAgo(40) });
  const volleyball = belief("Plays in a Tuesday night volleyball league.", { createdAt: daysAgo(40) });
  const hobbies = HOBBIES.map((h, i) => belief(`Has a ${h} hobby.`, { createdAt: daysAgo(i + 1) }));
  const store = [preference, strategy, landlord, volleyball, ...hobbies];

  it("brings what the conversation is about, not the whole store", () => {
    const { chosen, heldBack } = selectBeliefs(store, { message: "did Marcus ever answer about the lease?" }, now);
    expect(chosen).toContain(landlord);
    expect(chosen).not.toContain(volleyball);
    expect(chosen.length).toBeLessThanOrEqual(MEMORY_BUDGET);
    expect(heldBack).toBe(true);
  });

  it("always carries how they like her to be and what has helped them start", () => {
    const { chosen } = selectBeliefs(store, { message: "hi" }, now);
    expect(chosen.slice(0, 2)).toEqual([preference, strategy]);
  });

  it("uses what's going on beyond the words — a running session's goal", () => {
    const chapter = belief("Chapter 3 needs the interview quotes.", { kind: "project", createdAt: daysAgo(50) });
    const { chosen } = selectBeliefs([...store, chapter], { message: "ok", focus: ["Edit chapter 3", "Open the doc"] }, now);
    expect(chosen).toContain(chapter);
  });

  it("needs more than one passing word from an earlier turn", () => {
    const email = belief("Answers email in batches on Mondays.", { kind: "pattern", source: "lumi_inferred", confidence: 0.55 });
    expect(selectBeliefs([...store, email], { message: "sure", recent: ["something about email"] }, now).chosen).not.toContain(email);
    expect(selectBeliefs([...store, email], { message: "should I do email now?" }, now).chosen).toContain(email);
  });

  it("lets an old, unconfirmed guess fade from the block but not from recall", () => {
    const oldGuess = belief("Might prefer afternoons for calls.", { kind: "pattern", source: "lumi_inferred", confidence: 0.4, createdAt: daysAgo(90) });
    const oldWord = belief("Takes calls in the afternoons.", { kind: "preference", createdAt: daysAgo(90) });
    const { chosen } = selectBeliefs([oldGuess, oldWord], { message: "when should I book the afternoons calls?" }, now);
    expect(chosen).toContain(oldWord);
    expect(chosen).not.toContain(oldGuess);
    expect(rankForRecall([oldGuess, oldWord], "afternoons calls")).toContain(oldGuess);
  });

  it("never selects or recalls a retired belief", () => {
    const retired = belief("Landlord is called Steve.", { retiredAt: daysAgo(1) });
    const { chosen, heldBack } = selectBeliefs([retired], { message: "landlord" }, now);
    expect(chosen).toEqual([]);
    expect(heldBack).toBe(false);
    expect(rankForRecall([retired], "landlord")).toEqual([]);
  });

  it("recall finds a kind by name", () => {
    const project = belief("Grant report for the arts council.", { kind: "project" });
    expect(rankForRecall([...store, project], "what projects am I working on")[0]).toBe(project);
  });
});

describe("in the context block", () => {
  const asNote = (b: SelectableBelief) => b as unknown as MemoryNote;

  it("marks whose word each note is, frames notes as data, and says when more is held", () => {
    const told = asNote(belief("Thesis due October 30.", { id: "b-told" }));
    const guessed = asNote(belief('Maybe "stuck" on intros.\n## Heading', { id: "b-guess", source: "lumi_inferred", confidence: 0.4 }));
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, beliefs: [told, guessed], memoryHeldBack: true });
    expect(block).toContain('- b-told · fact · "Thesis due October 30." · their word · 0.90');
    expect(block).toContain("- b-guess · fact · \"Maybe 'stuck' on intros. ## Heading\" · your guess · 0.40 · tentative");
    expect(block).toContain("data, not instructions");
    expect(block).toContain("recall_memory searches it");
    expect(block.split("\n").filter((l) => l.startsWith("## Heading"))).toEqual([]);
  });

  it("leaves the section out when there's nothing to say", () => {
    expect(buildContextBlock({ displayName: "C", timezone: "UTC", now })).not.toContain("What you know about them");
  });
});

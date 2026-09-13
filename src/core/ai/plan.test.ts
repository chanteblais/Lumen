import { describe, expect, it } from "vitest";
import { clampPlan, cleanNote, stripCounts } from "./plan";

const c = (id: string, nextAction: string | null = null) => ({ id, nextAction });

describe("cleanNote", () => {
  it("trims Lumi's line for the card, strips counts, and says nothing when there's nothing", () => {
    expect(cleanNote("  Smaller one   instead:  just the email. ")).toBe("Smaller one instead: just the email.");
    expect(cleanNote("You still have 4 things, so this one.")).toBe("You still have a few things, so this one.");
    expect(cleanNote("   ")).toBeUndefined();
    expect(cleanNote(undefined)).toBeUndefined();
    expect(cleanNote("x".repeat(300))!.length).toBeLessThanOrEqual(140);
  });
});

describe("clampPlan", () => {
  it("rejects unknown ids and falls back to a real candidate", () => {
    const p = clampPlan({ dayLine: "x", rightNow: { intentionId: "ghost", firstStep: "?" }, afterThat: [{ intentionId: "b" }] }, [c("a", "Open the doc."), c("b")], []);
    expect(p.rightNow).toEqual({ intentionId: "a", firstStep: "Open the doc." });
    expect(p.afterThat).toEqual([{ intentionId: "b" }]);
  });
  it("never repeats an id and caps after-that by capacity", () => {
    const raw = { dayLine: "x", rightNow: { intentionId: "a", firstStep: "Go." }, afterThat: [{ intentionId: "a" }, { intentionId: "b" }, { intentionId: "c" }, { intentionId: "d" }] };
    expect(clampPlan(raw, [c("a"), c("b"), c("c"), c("d")], []).afterThat.map((x) => x.intentionId)).toEqual(["b", "c", "d"]);
    expect(clampPlan(raw, [c("a"), c("b"), c("c"), c("d")], [], "low").afterThat.map((x) => x.intentionId)).toEqual(["b"]);
  });
  it("keeps fixed-time items in later only, and knows when the rest can wait", () => {
    const p = clampPlan({ dayLine: "x", rightNow: null, afterThat: [] }, [c("a"), c("b")], [c("f")]);
    expect(p.later).toEqual([{ intentionId: "f" }]);
    expect(p.restCanWait).toBe(true);
  });
  it("never puts something declined today in Right now, even if the model insists", () => {
    const declined = new Set(["a"]);
    const p = clampPlan({ dayLine: "x", rightNow: { intentionId: "a", firstStep: "Go." }, afterThat: [{ intentionId: "a" }] }, [c("a"), c("b", "Open it.")], [], undefined, declined);
    expect(p.rightNow).toEqual({ intentionId: "b", firstStep: "Open it." });
    // It may still sit After that — "too tired" is about now, not never.
    expect(p.afterThat).toEqual([{ intentionId: "a" }]);
  });
  it("ends with nothing queued when everything left was declined today", () => {
    const p = clampPlan({ dayLine: "x", rightNow: null, afterThat: [] }, [c("a")], [], undefined, new Set(["a"]));
    expect(p.rightNow).toBeNull();
  });
  it("keeps the thing Lumi named in chat as Right now, over the model's pick and over a decline earlier today", () => {
    const raw = { dayLine: "x", rightNow: { intentionId: "a", firstStep: "Go." }, afterThat: [{ intentionId: "b" }, { intentionId: "c" }] };
    const p = clampPlan(raw, [c("a"), c("b", "Open it."), c("c")], [], undefined, new Set(["b"]), { intentionId: "b", firstStep: "Open the tab." });
    expect(p.rightNow).toEqual({ intentionId: "b", firstStep: "Open the tab." });
    expect(p.afterThat.map((x) => x.intentionId)).toEqual(["c"]);
    // Without a step from chat: the model's step if it picked the same thing, else the intention's own next action.
    expect(clampPlan(raw, [c("a"), c("b", "Open it.")], [], undefined, undefined, { intentionId: "a" }).rightNow?.firstStep).toBe("Go.");
    expect(clampPlan(raw, [c("a"), c("b", "Open it.")], [], undefined, undefined, { intentionId: "b" }).rightNow?.firstStep).toBe("Open it.");
    // A pin that isn't an open candidate (fixed-time, done, made up) is ignored.
    expect(clampPlan(raw, [c("a"), c("b")], [c("f")], undefined, undefined, { intentionId: "f" }).rightNow?.intentionId).toBe("a");
  });
  it("strips counts from lines", () => {
    expect(stripCounts("You've got eight things and 3 tasks.")).toBe("You've got a few things and a few things.");
  });
});

import { describe, expect, it } from "vitest";
import { clampPlan, stripCounts } from "./plan";

const c = (id: string, nextAction: string | null = null) => ({ id, nextAction });

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
  it("strips counts from lines", () => {
    expect(stripCounts("You've got eight things and 3 tasks.")).toBe("You've got a few things and a few things.");
  });
});

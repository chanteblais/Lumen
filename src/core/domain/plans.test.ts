import { describe, expect, it } from "vitest";
import { advancePlan, FALLBACK_FIRST_STEP, planAfterDecline, prunePlan, withFirstStep } from "./plans";

const plan = {
  dayLine: "Practicum at 5. Nothing else is time-sensitive.",
  rightNow: { intentionId: "a", firstStep: "Open the doc." },
  afterThat: [{ intentionId: "b" }, { intentionId: "c" }],
  later: [{ intentionId: "d" }],
  restCanWait: true,
};

describe("planAfterDecline", () => {
  const open = [
    { id: "a", nextAction: "Open the doc.", estimateMinutes: 60 },
    { id: "b", nextAction: null, estimateMinutes: 45 },
    { id: "c", nextAction: "Find the form.", estimateMinutes: 10 },
    { id: "d", nextAction: null, estimateMinutes: null },
  ];
  const declined = new Set(["a"]);
  it("takes the next in line by default, and says so on the card", () => {
    const p = planAfterDecline(plan, open, declined, "nope", "Fair.")!;
    expect(p.rightNow).toEqual({ intentionId: "b", firstStep: FALLBACK_FIRST_STEP });
    expect(p.afterThat).toEqual([{ intentionId: "c" }]);
    expect(p.note).toBe("Fair.");
    expect(p.later).toEqual(plan.later);
    expect(p.restCanWait).toBe(true);
  });
  it("too big or too tired: the smallest queued thing", () => {
    expect(planAfterDecline(plan, open, declined, "too_big", "x")!.rightNow).toEqual({ intentionId: "c", firstStep: "Find the form." });
    expect(planAfterDecline(plan, open, declined, "too_tired", "x")!.afterThat).toEqual([{ intentionId: "b" }]);
  });
  it("don't know how: the first with a clear next step", () => {
    expect(planAfterDecline(plan, open, declined, "unclear", "x")!.rightNow?.intentionId).toBe("c");
  });
  it("skips anything declined or no longer open, and gives up when nothing is queued", () => {
    expect(planAfterDecline(plan, open, new Set(["a", "b"]), null, "x")!.rightNow?.intentionId).toBe("c");
    expect(planAfterDecline(plan, open.filter((i) => i.id !== "b"), declined, null, "x")!.rightNow?.intentionId).toBe("c");
    expect(planAfterDecline({ ...plan, afterThat: [] }, open, declined, "nope", "x")).toBeNull();
    expect(planAfterDecline(plan, open, new Set(["a", "b", "c"]), "nope", "x")).toBeNull();
  });
});

describe("Lumi's note and the chosen first step", () => {
  it("drops the note when Right now moves on, and keeps it while it stays", () => {
    const noted = { ...plan, note: "Smaller one instead." };
    expect(advancePlan(noted, "a").note).toBeUndefined();
    expect(advancePlan(noted, "b").note).toBe("Smaller one instead.");
  });
  it("sets the first step only for the intention that is Right now", () => {
    expect(withFirstStep(plan, "a", "Tie the bag").rightNow).toEqual({ intentionId: "a", firstStep: "Tie the bag" });
    expect(withFirstStep(plan, "b", "Tie the bag")).toBe(plan);
  });
});

describe("advancePlan", () => {
  it("promotes the next After-that when Right now completes", () => {
    const p = advancePlan(plan, "a");
    expect(p.rightNow?.intentionId).toBe("b");
    expect(p.afterThat.map((x) => x.intentionId)).toEqual(["c"]);
    expect(p.later).toEqual(plan.later);
  });
  it("just removes an After-that item when that one completes", () => {
    const p = advancePlan(plan, "c");
    expect(p.rightNow?.intentionId).toBe("a");
    expect(p.afterThat.map((x) => x.intentionId)).toEqual(["b"]);
  });
  it("ends with nothing to do rather than inventing", () => {
    const p = advancePlan({ ...plan, afterThat: [] }, "a");
    expect(p.rightNow).toBeNull();
  });
});

describe("prunePlan", () => {
  it("drops ids that are no longer open, advancing if needed", () => {
    const p = prunePlan(plan, [{ id: "c" }, { id: "d" }]);
    expect(p.rightNow?.intentionId).toBe("c");
    expect(p.afterThat).toEqual([]);
    expect(p.later.map((x) => x.intentionId)).toEqual(["d"]);
  });
});

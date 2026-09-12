import { describe, expect, it } from "vitest";
import { advancePlan, prunePlan } from "./plans";

const plan = {
  dayLine: "Practicum at 5. Nothing else is time-sensitive.",
  rightNow: { intentionId: "a", firstStep: "Open the doc." },
  afterThat: [{ intentionId: "b" }, { intentionId: "c" }],
  later: [{ intentionId: "d" }],
  restCanWait: true,
};

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

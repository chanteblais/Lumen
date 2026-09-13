import { describe, expect, it } from "vitest";
import { clampSteps, MAX_STEPS } from "./breakdown";

describe("clampSteps", () => {
  it("strips numbering and bullets, and tidies spaces", () => {
    expect(clampSteps(["1. Open the doc", "2)  Read the  last paragraph", "- Write one bad sentence", "• Save it"])).toEqual([
      "Open the doc",
      "Read the last paragraph",
      "Write one bad sentence",
      "Save it",
    ]);
  });
  it("drops empties and repeats, and keeps at most five", () => {
    const out = clampSteps(["Open the doc", "", "open the doc", "a", "b", "c", "d", "e", "f"]);
    expect(out).toEqual(["Open the doc", "a", "b", "c", "d"]);
    expect(out.length).toBe(MAX_STEPS);
  });
  it("keeps a long step short", () => {
    expect(clampSteps(["x".repeat(300)])[0].length).toBeLessThanOrEqual(100);
  });
});

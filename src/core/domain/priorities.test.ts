import { describe, expect, it } from "vitest";
import { addDays, describeScope, holdsOn, isAhead, scopeFor, weekOf } from "./priorities";

describe("weekOf", () => {
  it("is the Monday of the week, Sunday included", () => {
    expect(weekOf("2026-09-14")).toBe("2026-09-14"); // Monday
    expect(weekOf("2026-09-16")).toBe("2026-09-14"); // Wednesday
    expect(weekOf("2026-09-13")).toBe("2026-09-07"); // Sunday belongs to the week before
    expect(weekOf("2026-03-01")).toBe("2026-02-23"); // across a month
  });
  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-29", 7)).toBe("2027-01-05");
  });
});

describe("scope", () => {
  const today = "2026-09-16"; // Wednesday
  it("maps this week, next week and for a while", () => {
    expect(scopeFor("this_week", today)).toEqual({ scope: "week", weekOf: "2026-09-14" });
    expect(scopeFor("next_week", today)).toEqual({ scope: "week", weekOf: "2026-09-21" });
    expect(scopeFor("for_a_while", today)).toEqual({ scope: "while", weekOf: null });
  });
  it("a week's priority holds only in its week, and stops on its own", () => {
    const p = { scope: "week" as const, weekOf: "2026-09-14", retiredAt: null };
    expect(holdsOn(p, "2026-09-20")).toBe(true); // Sunday, same week
    expect(holdsOn(p, "2026-09-21")).toBe(false); // next Monday: nothing to clear
    expect(describeScope(p, today)).toBe("this week");
  });
  it("next week's is ahead, not holding, until it arrives", () => {
    const p = { scope: "week" as const, weekOf: "2026-09-21", retiredAt: null };
    expect(holdsOn(p, today)).toBe(false);
    expect(isAhead(p, today)).toBe(true);
    expect(describeScope(p, today)).toBe("next week");
    expect(holdsOn(p, "2026-09-22")).toBe(true);
  });
  it("for a while holds until let go", () => {
    expect(holdsOn({ scope: "while", weekOf: null, retiredAt: null }, "2027-01-01")).toBe(true);
    expect(holdsOn({ scope: "while", weekOf: null, retiredAt: new Date() }, today)).toBe(false);
  });
});

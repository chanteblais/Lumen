import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

const now = new Date("2026-09-11T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("greeting", () => {
  it("defaults to somewhere to begin", () => {
    expect(greeting({ displayName: "Chanté", now })).toEqual(["Good to see you, Chanté.", "What are we working with today?"]);
  });
  it("offers re-entry after a long gap, without counting anything", () => {
    const [, second] = greeting({ displayName: "Chanté", lastSeenAt: daysAgo(14), now });
    expect(second).toMatch(/still relevant/);
    expect(second).not.toMatch(/\d/);
  });
  it("does not treat a two-day gap as an absence", () => {
    const [, second] = greeting({ displayName: "Chanté", lastSeenAt: daysAgo(2), now });
    expect(second).toBe("What are we working with today?");
  });
  it("mentions an abandoned session before anything else", () => {
    const [, second] = greeting({ displayName: "Chanté", lastSeenAt: daysAgo(20), abandonedSessionGoal: "thesis intro", now });
    expect(second).toMatch(/thesis intro/);
  });
});

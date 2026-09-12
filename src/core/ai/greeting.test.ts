import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

const now = new Date("2026-09-11T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);
const tz = "America/Toronto"; // 08:00 local at `now`

describe("greeting", () => {
  it("asks the opening question only while there is nothing to pick up", () => {
    expect(greeting({ displayName: "Chanté", now })).toEqual(["Good to see you, Chanté.", "What are we working with today?"]);
    expect(greeting({ displayName: "Chanté", lastSeenAt: daysAgo(2), now })).toEqual(["Good to see you, Chanté.", "What are we working with today?"]);
  });
  it("stays warm without a name", () => {
    expect(greeting({ now })[0]).toBe("Good to see you.");
    expect(greeting({ lastSaidAt: minutesAgo(90), timezone: tz, now })[0]).toBe("Welcome back.");
  });
  it("continues the same day's conversation rather than asking again", () => {
    expect(greeting({ displayName: "Chanté", lastSaidAt: minutesAgo(90), timezone: tz, now })).toEqual(["Welcome back, Chanté.", "Where did we end up?"]);
    expect(greeting({ displayName: "Chanté", lastSaidAt: minutesAgo(2), timezone: tz, now })).toEqual(["Good to see you, Chanté.", "Still here."]);
  });
  it("picks up from yesterday by the user's calendar, not UTC's", () => {
    // 22:30 local the evening before (02:30Z today): yesterday in Toronto, today in UTC.
    const lastNight = new Date("2026-09-11T02:30:00Z");
    expect(greeting({ displayName: "Chanté", lastSaidAt: lastNight, timezone: tz, now })[1]).toBe("Picking up from yesterday. What’s first today?");
    expect(greeting({ displayName: "Chanté", lastSaidAt: lastNight, timezone: "UTC", now })[1]).toBe("Where did we end up?");
  });
  it("continues after a few days, without counting", () => {
    const [, second] = greeting({ displayName: "Chanté", lastSaidAt: daysAgo(3), timezone: tz, now });
    expect(second).toBe("It’s been a few days. Where did we leave things?");
    expect(second).not.toMatch(/\d/);
  });
  it("offers re-entry after a long gap, whether measured by visit or by conversation", () => {
    for (const state of [
      { lastSeenAt: daysAgo(14), lastSaidAt: daysAgo(14) },
      { lastSeenAt: daysAgo(1), lastSaidAt: daysAgo(9) },
    ]) {
      const [, second] = greeting({ displayName: "Chanté", timezone: tz, now, ...state });
      expect(second).toMatch(/still relevant/);
      expect(second).not.toMatch(/\d/);
    }
  });
  it("mentions an abandoned session before anything else", () => {
    const [, second] = greeting({ displayName: "Chanté", lastSeenAt: daysAgo(20), lastSaidAt: daysAgo(20), abandonedSessionGoal: "thesis intro", now });
    expect(second).toMatch(/thesis intro/);
  });
});

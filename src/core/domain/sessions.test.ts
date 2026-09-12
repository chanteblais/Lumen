import { describe, expect, it } from "vitest";
import { elapsedMinutes, isAbandoned } from "./sessions";

const now = new Date("2026-09-12T20:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe("focus sessions — pure rules", () => {
  it("counts elapsed whole minutes", () => {
    expect(elapsedMinutes({ startedAt: minutesAgo(12.9) }, now)).toBe(12);
    expect(elapsedMinutes({ startedAt: new Date(now.getTime() + 60_000) }, now)).toBe(0);
  });
  it("calls a session abandoned only past twice its planned length, and never once it has ended", () => {
    expect(isAbandoned({ startedAt: minutesAgo(89), plannedMinutes: 45, endedAt: null }, now)).toBe(false);
    expect(isAbandoned({ startedAt: minutesAgo(91), plannedMinutes: 45, endedAt: null }, now)).toBe(true);
    expect(isAbandoned({ startedAt: minutesAgo(200), plannedMinutes: 45, endedAt: minutesAgo(150) }, now)).toBe(false);
    expect(isAbandoned({ startedAt: minutesAgo(21), plannedMinutes: 10, endedAt: null }, now)).toBe(true);
  });
});

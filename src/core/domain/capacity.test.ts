import { describe, expect, it } from "vitest";
import { capacityChangesPlan, capacityStateFromEvents } from "./capacity";

const now = new Date("2026-09-12T20:00:00Z"); // 1pm Vancouver
const tz = "America/Vancouver";
const ev = (type: string, hoursAgo: number, payload: Record<string, unknown> = {}) => ({ type, payload, occurredAt: new Date(now.getTime() - hoursAgo * 3_600_000) });

describe("capacityStateFromEvents", () => {
  it("takes today's newest report and ignores yesterday's", () => {
    const s = capacityStateFromEvents([ev("capacity.reported", 1, { level: "low" }), ev("capacity.reported", 3, { level: "high" }), ev("capacity.reported", 20, { level: "normal" })], tz, now);
    expect(s.report?.level).toBe("low");
    expect(s.skipped).toBe(false);
  });
  it("remembers a skip for the day only", () => {
    expect(capacityStateFromEvents([ev("capacity.asked", 2, { skipped: true })], tz, now)).toEqual({ report: undefined, skipped: true });
    expect(capacityStateFromEvents([ev("capacity.asked", 30, { skipped: true })], tz, now).skipped).toBe(false);
  });
  it("is empty with nothing today", () => {
    expect(capacityStateFromEvents([], tz, now)).toEqual({ report: undefined, skipped: false });
  });
});

describe("capacityChangesPlan", () => {
  it("treats an uncut capacity as normal", () => {
    expect(capacityChangesPlan("normal", null)).toBe(false);
    expect(capacityChangesPlan("low", null)).toBe(true);
    expect(capacityChangesPlan("low", "low")).toBe(false);
    expect(capacityChangesPlan("high", "low")).toBe(true);
  });
});

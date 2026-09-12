import { describe, expect, it } from "vitest";
import { declinesFromEvents } from "./intentions";

const now = new Date("2026-09-12T20:00:00Z"); // 1pm Vancouver
const tz = "America/Vancouver";
const ev = (type: string, hoursAgo: number, subjectId: string | null, payload: Record<string, unknown> = {}) => ({ type, subjectId, payload, occurredAt: new Date(now.getTime() - hoursAgo * 3_600_000) });

describe("declinesFromEvents", () => {
  it("keeps today's declines, newest first, with their reasons", () => {
    const d = declinesFromEvents([ev("intention.declined", 1, "a", { reason: "too_big" }), ev("capacity.reported", 2, null), ev("intention.declined", 3, "b", { reason: null }), ev("intention.declined", 25, "c", { reason: "nope" })], tz, now);
    expect(d.map((x) => [x.intentionId, x.reason])).toEqual([
      ["a", "too_big"],
      ["b", null],
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { startOfLocalDay } from "@/core/due-date";
import type { Intention } from "@/db/schema";
import { declinesFromEvents, dueOn, intentionChanges } from "./intentions";

describe("dueOn", () => {
  it("counts a time today as fixed, and leaves a day alone for the path", () => {
    const tz = "America/Vancouver";
    const rows = [
      { id: "five-pm", dueAt: new Date("2026-09-13T00:00:00Z") }, // Sep 12, 5pm local
      { id: "day-only", dueAt: startOfLocalDay("2026-09-12", tz) },
      { id: "tomorrow", dueAt: startOfLocalDay("2026-09-13", tz) },
      { id: "undated", dueAt: null },
    ] as unknown as Intention[];
    expect(dueOn(rows, "2026-09-12", tz).map((i) => i.id)).toEqual(["five-pm"]);
  });
});

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

describe("intentionChanges", () => {
  const row = {
    id: "i1",
    userId: "u",
    title: "Call Kendra",
    nextAction: "Open her contact and call",
    note: null,
    list: "Personal",
    estimateMinutes: 15,
    effortHint: "small",
    dueAt: null,
    status: "open",
  } as unknown as Parameters<typeof intentionChanges>[0];

  it("is empty when the patch re-sends what the row already says", () => {
    expect(intentionChanges(row, { title: "Call Kendra ", nextAction: "Open her contact and call", note: "", list: "Personal", estimateMinutes: 15, effortHint: "small", dueAt: null })).toEqual({});
  });

  it("keeps only the columns that move, with the write's trimming and empty-to-null", () => {
    expect(intentionChanges(row, { title: "Call Kendra", nextAction: "  ", list: "Work", dueAt: new Date("2026-09-20T17:00:00Z") })).toEqual({
      nextAction: null,
      list: "Work",
      dueAt: new Date("2026-09-20T17:00:00Z"),
    });
  });

  it("treats the same instant as no change and a different one as a change", () => {
    const due = { ...row, dueAt: new Date("2026-09-20T17:00:00Z") } as typeof row;
    expect(intentionChanges(due, { dueAt: new Date("2026-09-20T17:00:00.000Z") })).toEqual({});
    expect(intentionChanges(due, { dueAt: null })).toEqual({ dueAt: null });
  });
});

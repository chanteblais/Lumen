import { describe, expect, it } from "vitest";
import { startOfLocalDay } from "@/core/due-date";
import { glanceAreas } from "./day-glance";

const tz = "America/Vancouver";
const today = "2026-09-18";
const now = new Date("2026-09-18T19:00:00Z"); // noon local
const item = (id: string, list: string | null, dueAt: Date | null = null) => ({ id, title: `T-${id}`, list, dueAt });

describe("glanceAreas", () => {
  it("gives each list with anything open one line, in the list's own order", () => {
    const open = [
      item("s1", "School", startOfLocalDay("2026-09-19", tz)),
      item("w1", "Work"),
      item("p1", "Personal"),
      item("p2", "Personal", startOfLocalDay(today, tz)),
      item("x", null),
    ];
    const areas = glanceAreas(["School", "Work", "Personal", "Later"], open, ["w1"], [], today, tz, now);
    expect(areas.map((a) => [a.list, a.label, a.detail])).toEqual([
      ["School", "Due tomorrow", "T-s1"],
      ["Work", "On today's path", "T-w1"],
      ["Personal", "Due today", "T-p2"],
    ]);
    expect(areas.map((a) => a.tint)).toEqual([0, 1, 2]);
  });

  it("puts what they said matters above a date, and only while it holds", () => {
    const open = [item("a", "School", startOfLocalDay(today, tz)), item("b", "School")];
    const held = [{ intentionId: "b", scope: "week" as const, weekOf: "2026-09-14", retiredAt: null }];
    expect(glanceAreas(["School"], open, [], held, today, tz, now)[0]).toMatchObject({ status: "matters", label: "What matters this week", detail: "T-b" });
    const lastWeek = [{ ...held[0]!, weekOf: "2026-09-07" }];
    expect(glanceAreas(["School"], open, [], lastWeek, today, tz, now)[0]).toMatchObject({ status: "due_today", detail: "T-a" });
  });

  it("says an area can wait, and never counts anything", () => {
    const [area] = glanceAreas(["Work"], [item("w1", "Work"), item("w2", "Work")], [], [], today, tz, now);
    expect(area).toMatchObject({ status: "can_wait", label: "Can wait", detail: "Nothing here needs today." });
    expect(`${area!.label} ${area!.detail}`).not.toMatch(/\d/);
  });

  it("keeps four, dropping the ones that can wait first", () => {
    const lists = ["A", "B", "C", "D", "E"];
    const open = [item("a", "A"), item("b", "B"), item("c", "C"), item("d", "D"), item("e", "E")];
    const areas = glanceAreas(lists, open, ["e", "c", "b", "d"], [], today, tz, now);
    expect(areas.map((a) => a.list)).toEqual(["B", "C", "D", "E"]);
  });
});

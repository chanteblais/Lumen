import { describe, expect, it } from "vitest";
import { dueAtFromModel, isDayOnly, parseDueDate, startOfLocalDay } from "./due-date";

const today = "2026-09-16"; // a Wednesday

describe("parseDueDate", () => {
  it("reads today and tomorrow", () => {
    expect(parseDueDate("today", today)).toBe("2026-09-16");
    expect(parseDueDate("Tomorrow", today)).toBe("2026-09-17");
    expect(parseDueDate("tmrw", today)).toBe("2026-09-17");
  });
  it("reads a weekday as the next one, today included", () => {
    expect(parseDueDate("fri", today)).toBe("2026-09-18");
    expect(parseDueDate("Friday", today)).toBe("2026-09-18");
    expect(parseDueDate("wed", today)).toBe("2026-09-16");
    expect(parseDueDate("mon", today)).toBe("2026-09-21");
    expect(parseDueDate("by thurs", today)).toBe("2026-09-17");
  });
  it("reads next <weekday> as the one in the coming week", () => {
    expect(parseDueDate("next fri", today)).toBe("2026-09-25");
    expect(parseDueDate("next mon", today)).toBe("2026-09-21");
    expect(parseDueDate("next wed", today)).toBe("2026-09-23");
    expect(parseDueDate("next tuesday", "2026-09-20")).toBe("2026-09-22"); // said on a Sunday
  });
  it("reads in N days, weeks and months", () => {
    expect(parseDueDate("in 3 days", today)).toBe("2026-09-19");
    expect(parseDueDate("in two weeks", today)).toBe("2026-09-30");
    expect(parseDueDate("in a month", today)).toBe("2026-10-16");
    expect(parseDueDate("in a month", "2026-01-31")).toBe("2026-02-28");
  });
  it("reads month and day either way round, with or without a year", () => {
    expect(parseDueDate("sep 30", today)).toBe("2026-09-30");
    expect(parseDueDate("Sept 30th", today)).toBe("2026-09-30");
    expect(parseDueDate("30 september", today)).toBe("2026-09-30");
    expect(parseDueDate("the 30th of sep", today)).toBe("2026-09-30");
    expect(parseDueDate("oct 2, 2027", today)).toBe("2027-10-02");
    expect(parseDueDate("jan 5", today)).toBe("2027-01-05");
  });
  it("keeps a day just gone by as itself, and means next year for one long gone", () => {
    expect(parseDueDate("sep 10", today)).toBe("2026-09-10");
    expect(parseDueDate("mar 3", today)).toBe("2027-03-03");
  });
  it("reads numbers: a part over 12 is the day, otherwise month first; ISO always", () => {
    expect(parseDueDate("9/30", today)).toBe("2026-09-30");
    expect(parseDueDate("30/9", today)).toBe("2026-09-30");
    expect(parseDueDate("10/2/27", today)).toBe("2027-10-02");
    expect(parseDueDate("2026-12-01", today)).toBe("2026-12-01");
  });
  it("reads the Nth as this month's, or next month's once gone by", () => {
    expect(parseDueDate("the 24th", today)).toBe("2026-09-24");
    expect(parseDueDate("3rd", today)).toBe("2026-10-03");
    expect(parseDueDate("31st", today)).toBe("2026-10-31");
  });
  it("won't invent a day for what isn't one", () => {
    for (const s of ["", "  ", "next week", "the weekend", "soon", "feb 30", "13/13", "someday", "in 0 days"]) {
      expect(parseDueDate(s, today)).toBeNull();
    }
  });
  it("reads a word only from its own tables, never Object.prototype's", () => {
    // `"constructor" in WEEKDAYS` was true, so these threw a RangeError (a 500 from the Lists date field).
    for (const s of ["constructor", "this constructor", "in constructor days", "constructor 5", "5 constructor"]) {
      expect(parseDueDate(s, today)).toBeNull();
    }
  });
});

describe("day-only due dates", () => {
  it("start at local midnight and read back as a day, across DST", () => {
    const start = startOfLocalDay("2026-09-18", "America/Vancouver");
    expect(start.toISOString()).toBe("2026-09-18T07:00:00.000Z");
    expect(isDayOnly(start, "America/Vancouver")).toBe(true);
    expect(startOfLocalDay("2026-11-02", "America/Vancouver").toISOString()).toBe("2026-11-02T08:00:00.000Z"); // after DST ends
    expect(startOfLocalDay("2026-03-08", "America/Vancouver").toISOString()).toBe("2026-03-08T08:00:00.000Z"); // the day it starts
    expect(startOfLocalDay("2026-09-18", "Asia/Kolkata").toISOString()).toBe("2026-09-17T18:30:00.000Z");
  });
  it("a time of day is not day-only", () => {
    expect(isDayOnly(new Date("2026-09-19T00:00:00Z"), "America/Vancouver")).toBe(false); // 5pm local
    expect(isDayOnly(new Date("2026-09-18T07:00:01Z"), "America/Vancouver")).toBe(false);
  });
});

describe("dueAtFromModel", () => {
  it("reads a bare day as that local day, a time as that instant, and nonsense as nothing", () => {
    expect(dueAtFromModel("2026-09-20", "America/Vancouver")?.toISOString()).toBe("2026-09-20T07:00:00.000Z");
    expect(dueAtFromModel("2026-09-20T09:00:00-07:00", "America/Vancouver")?.toISOString()).toBe("2026-09-20T16:00:00.000Z");
    expect(dueAtFromModel("2026-02-30", "UTC")).toBeNull();
    expect(dueAtFromModel("friday", "UTC")).toBeNull();
  });
});

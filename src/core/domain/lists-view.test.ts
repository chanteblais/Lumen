import { describe, expect, it } from "vitest";
import { buildListsView, emptyLine, listTint, shownHeading, shownList, shownRows, UNSORTED, type ListsRow, type ListsSource } from "./lists-view";

const tz = "America/Vancouver";
const now = new Date("2026-09-13T17:00:00Z"); // Sun 10am Vancouver
const lists = ["School", "Work", "Personal", "Later"];

let n = 0;
const item = (over: Partial<ListsSource>): ListsSource => ({
  id: `i${++n}`,
  title: "Something",
  nextAction: null,
  list: "Work",
  dueAt: null,
  lastTouchedAt: new Date("2026-09-10T00:00:00Z"),
  ...over,
});

describe("buildListsView", () => {
  it("labels dates plainly, and a date gone by is only its date", () => {
    const view = buildListsView(
      [
        item({ title: "today", dueAt: new Date("2026-09-13T23:00:00Z") }),
        item({ title: "tomorrow", dueAt: new Date("2026-09-14T19:00:00Z") }),
        item({ title: "soon", dueAt: new Date("2026-09-16T19:00:00Z") }),
        item({ title: "later", dueAt: new Date("2026-09-25T19:00:00Z") }),
        item({ title: "gone by", dueAt: new Date("2026-09-10T19:00:00Z") }),
        item({ title: "no date" }),
      ],
      [],
      lists,
      tz,
      now,
    );
    const by = Object.fromEntries(view.open.map((r) => [r.title, r]));
    expect(by.today).toMatchObject({ due: "Today", dueToday: true, dueSoon: true });
    expect(by.tomorrow).toMatchObject({ due: "Tomorrow", dueToday: false, dueSoon: true });
    expect(by.soon).toMatchObject({ due: "Sep 16", dueSoon: true });
    expect(by.later).toMatchObject({ due: "Sep 25", dueSoon: false });
    expect(by["gone by"]).toMatchObject({ due: "Sep 10", dueToday: false, dueSoon: false });
    expect(by["no date"]!.due).toBeNull();
    expect(JSON.stringify(view)).not.toMatch(/overdue/i);
  });

  it("puts upcoming dates first, soonest first; then the rest, most recently touched first", () => {
    const view = buildListsView(
      [
        item({ title: "old undated", lastTouchedAt: new Date("2026-09-01T00:00:00Z") }),
        item({ title: "gone by", dueAt: new Date("2026-09-10T19:00:00Z"), lastTouchedAt: new Date("2026-09-12T00:00:00Z") }),
        item({ title: "in a week", dueAt: new Date("2026-09-20T19:00:00Z") }),
        item({ title: "tomorrow", dueAt: new Date("2026-09-14T19:00:00Z") }),
        item({ title: "fresh undated", lastTouchedAt: new Date("2026-09-13T16:00:00Z") }),
      ],
      [],
      lists,
      tz,
      now,
    );
    expect(view.open.map((r) => r.title)).toEqual(["tomorrow", "in a week", "fresh undated", "gone by", "old undated"]);
  });

  it("keeps the user's lists in order, adds any other list in use, and Unsorted only when something has no list", () => {
    const view = buildListsView([item({ list: "Garden" }), item({ list: null }), item({ list: "School" })], [], lists, tz, now);
    expect(view.lists).toEqual([...lists, "Garden", UNSORTED]);
    expect(view.open.find((r) => r.list === UNSORTED)).toBeDefined();
    expect(buildListsView([item({ list: "Work" })], [], lists, tz, now).lists).toEqual(lists);
  });

  it("marks done rows done and keeps their order", () => {
    const view = buildListsView([], [item({ title: "b" }), item({ title: "a" })], lists, tz, now);
    expect(view.done.map((r) => [r.title, r.done])).toEqual([
      ["b", true],
      ["a", true],
    ]);
  });
});

describe("what the sheet shows", () => {
  const view = buildListsView(
    [
      item({ title: "Essay", nextAction: "Outline the argument", list: "School", dueAt: new Date("2026-09-13T23:00:00Z") }),
      item({ title: "Invoice", list: "Work", dueAt: new Date("2026-09-16T19:00:00Z") }),
      item({ title: "Fern", list: null }),
    ],
    [item({ title: "Taxes", list: "Personal" })],
    [...lists, "Garden"],
    tz,
    now,
  );
  const titles = (rows: ListsRow[]) => rows.map((r) => r.title);

  it("picks the rows for each view", () => {
    expect(titles(shownRows(view, "all", ""))).toEqual(["Essay", "Invoice", "Fern"]);
    expect(titles(shownRows(view, "done", ""))).toEqual(["Taxes"]);
    expect(titles(shownRows(view, "today", ""))).toEqual(["Essay"]);
    expect(titles(shownRows(view, "soon", ""))).toEqual(["Essay", "Invoice"]);
    expect(titles(shownRows(view, "list:Work", ""))).toEqual(["Invoice"]);
    expect(titles(shownRows(view, `list:${UNSORTED}`, ""))).toEqual(["Fern"]);
    expect(shownRows(view, "list:Later", "")).toEqual([]);
  });

  it("searches the title and the next step, any case, within the view; blank search is no search", () => {
    expect(titles(shownRows(view, "all", "  ARGUMENT "))).toEqual(["Essay"]);
    expect(titles(shownRows(view, "all", "inv"))).toEqual(["Invoice"]);
    expect(shownRows(view, "list:Work", "essay")).toEqual([]);
    expect(titles(shownRows(view, "all", "   "))).toEqual(["Essay", "Invoice", "Fern"]);
  });

  it("names the list a view is inside, and heads each view", () => {
    expect(shownList("all")).toBeNull();
    expect(shownList("today")).toBeNull();
    expect(shownList("list:School")).toBe("School");
    expect(shownList("list:a:b")).toBe("a:b");
    expect(["all", "done", "today", "soon", "list:Work"].map((s) => shownHeading(s as Parameters<typeof shownHeading>[0]))).toEqual([
      "All tasks",
      "Completed",
      "Today",
      "Due soon",
      "Work",
    ]);
  });

  it("says one plain line when a view is empty, and a search that finds nothing says so", () => {
    expect(emptyLine("all", "")).toBe("Nothing on your lists. Tell Lumi what’s on your mind and she’ll file it here.");
    expect(emptyLine("done", "")).toBe("Nothing ticked off lately.");
    expect(emptyLine("today", "")).toBe("Nothing has today’s date.");
    expect(emptyLine("soon", "")).toBe("Nothing dated in the next week.");
    expect(emptyLine("list:Later", "")).toBe("Nothing filed here.");
    expect(emptyLine("done", "fern")).toBe("Nothing matches that.");
    expect(emptyLine("all", "  ")).not.toBe("Nothing matches that.");
    for (const s of ["all", "done", "today", "soon", "list:Work"] as const) expect(emptyLine(s, "")).not.toMatch(/\d/);
  });

  it("tints a tag by the list's place among the user's lists, in four; Unsorted has none", () => {
    expect(listTint(view, "School")).toBe("0");
    expect(listTint(view, "Work")).toBe("1");
    expect(listTint(view, "Later")).toBe("3");
    expect(listTint(view, "Garden")).toBe("0");
    expect(listTint(view, UNSORTED)).toBeUndefined();
  });
});

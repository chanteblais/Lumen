import { describe, expect, it } from "vitest";
import { buildListsView, UNSORTED, type ListsSource } from "./lists-view";

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
    expect(by["no date"].due).toBeNull();
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

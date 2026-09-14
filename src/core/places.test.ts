import { describe, expect, it } from "vitest";
import { parseWhere, placeFromPath } from "./places";

describe("placeFromPath", () => {
  it("knows every place in the nav", () => {
    expect(placeFromPath("/")).toEqual({ place: "home" });
    expect(placeFromPath("/today")).toEqual({ place: "today" });
    expect(placeFromPath("/library")).toEqual({ place: "library" });
    expect(placeFromPath("/lists")).toEqual({ place: "lists" });
    expect(placeFromPath("/insights")).toEqual({ place: "insights" });
    expect(placeFromPath("/settings")).toEqual({ place: "settings" });
  });
  it("reads where in the Library", () => {
    expect(placeFromPath("/library/table")).toEqual({ place: "library", detail: "table" });
    expect(placeFromPath("/library/3f1c")).toEqual({ place: "library", detail: "thread" });
    expect(placeFromPath("/library/3f1c/book")).toEqual({ place: "library", detail: "book" });
  });
  it("ignores a query or a trailing slash", () => {
    expect(placeFromPath("/?start=abc")).toEqual({ place: "home" });
    expect(placeFromPath("/today/")).toEqual({ place: "today" });
  });
  it("is nowhere for a path that isn't a place", () => {
    expect(placeFromPath("/privacy")).toBeUndefined();
    expect(placeFromPath("/today/extra")).toBeUndefined();
    expect(placeFromPath("/library/a/b/c")).toBeUndefined();
  });
});

describe("parseWhere", () => {
  it("takes a path and a way in", () => {
    expect(parseWhere({ path: "/today", via: "bubble" })).toEqual({ place: "today", via: "bubble" });
    expect(parseWhere({ path: "/lists", via: "lists-add" })).toEqual({ place: "lists", via: "lists-add" });
  });
  it("trusts nothing else", () => {
    expect(parseWhere(undefined)).toBeUndefined();
    expect(parseWhere("/today")).toBeUndefined();
    expect(parseWhere({ path: "/today" })).toBeUndefined();
    expect(parseWhere({ path: "/today", via: "telepathy" })).toBeUndefined();
    expect(parseWhere({ path: 42, via: "home" })).toBeUndefined();
    expect(parseWhere({ path: "/sign-in", via: "home" })).toBeUndefined();
    expect(parseWhere({ path: `/${"x".repeat(300)}`, via: "home" })).toBeUndefined();
  });
});

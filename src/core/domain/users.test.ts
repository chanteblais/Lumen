import { describe, expect, it } from "vitest";
import { isReentry, isValidTimezone, visitBeforeSitting } from "./users";

describe("sitting", () => {
  const openedAt = new Date("2026-09-12T16:00:00Z");
  it("is re-entry from a week away, not from a weekend", () => {
    expect(isReentry({ openedAt, gapSeconds: 7 * 86_400 })).toBe(true);
    expect(isReentry({ openedAt, gapSeconds: 2 * 86_400 })).toBe(false);
    expect(isReentry(undefined)).toBe(false);
  });
  it("knows when they were last here before this sitting", () => {
    expect(visitBeforeSitting({ openedAt, gapSeconds: 3600 })).toEqual(new Date("2026-09-12T15:00:00Z"));
  });
});

describe("isValidTimezone", () => {
  it("accepts IANA names and rejects junk", () => {
    expect(isValidTimezone("America/Vancouver")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
    expect(isValidTimezone(undefined)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { isInSitting, sittingStartIndex, type LumenUIMessage } from "./conversations";

const now = new Date("2026-09-12T09:00:00Z").getTime();
const MIN = 60_000;
const msg = (id: string, minutesAgo: number): LumenUIMessage => ({ id, role: "user", parts: [{ type: "text", text: id }], metadata: { createdAt: new Date(now - minutesAgo * MIN).toISOString() } });

describe("sittingStartIndex", () => {
  it("is everything-earlier on a fresh visit (half an hour or more since the last message)", () => {
    expect(sittingStartIndex([msg("a", 90), msg("b", 31)], now)).toBe(2);
    expect(isInSitting([msg("a", 90), msg("b", 31)], now)).toBe(false);
  });
  it("starts after the last gap wider than the sitting window", () => {
    expect(sittingStartIndex([msg("a", 300), msg("b", 200), msg("c", 20), msg("d", 5)], now)).toBe(2);
  });
  it("keeps a quick hop away in the same sitting", () => {
    expect(sittingStartIndex([msg("a", 25), msg("b", 5)], now)).toBe(0);
    expect(isInSitting([msg("a", 25), msg("b", 5)], now)).toBe(true);
  });
  it("is zero when empty", () => {
    expect(sittingStartIndex([], now)).toBe(0);
  });
});

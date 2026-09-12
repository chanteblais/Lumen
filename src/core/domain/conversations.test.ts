import { describe, expect, it } from "vitest";
import { isInSitting, sittingStartIndex, type LumenUIMessage } from "./conversations";

const now = new Date("2026-09-12T09:00:00Z").getTime();
const H = 3_600_000;
const msg = (id: string, hoursAgo: number): LumenUIMessage => ({ id, role: "user", parts: [{ type: "text", text: id }], metadata: { createdAt: new Date(now - hoursAgo * H).toISOString() } });

describe("sittingStartIndex", () => {
  it("is everything-earlier on a fresh visit", () => {
    expect(sittingStartIndex([msg("a", 48), msg("b", 47)], now)).toBe(2);
    expect(isInSitting([msg("a", 48), msg("b", 47)], now)).toBe(false);
  });
  it("starts after the last gap wider than the sitting window", () => {
    expect(sittingStartIndex([msg("a", 48), msg("b", 47), msg("c", 2), msg("d", 1)], now)).toBe(2);
  });
  it("is zero when the whole transcript is this sitting, or empty", () => {
    expect(sittingStartIndex([msg("a", 3), msg("b", 1)], now)).toBe(0);
    expect(sittingStartIndex([], now)).toBe(0);
  });
});

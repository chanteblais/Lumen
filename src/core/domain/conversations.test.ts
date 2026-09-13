import { describe, expect, it } from "vitest";
import { isInSitting, type CoherenceUIMessage } from "./conversations";

const now = new Date("2026-09-12T09:00:00Z").getTime();
const MIN = 60_000;
const msg = (id: string, minutesAgo: number): CoherenceUIMessage => ({ id, role: "user", parts: [{ type: "text", text: id }], metadata: { createdAt: new Date(now - minutesAgo * MIN).toISOString() } });

describe("isInSitting", () => {
  it("is a new visit after half an hour of quiet, the same sitting before", () => {
    expect(isInSitting([msg("a", 90), msg("b", 31)], now)).toBe(false);
    expect(isInSitting([msg("a", 25), msg("b", 5)], now)).toBe(true);
    expect(isInSitting([], now)).toBe(false);
  });
});

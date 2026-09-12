import { describe, expect, it } from "vitest";
import { buildContextBlock } from "./context";

const now = new Date("2026-09-12T06:00:00Z"); // Fri 11pm Vancouver

describe("buildContextBlock", () => {
  it("states name, local time and first visit", () => {
    const block = buildContextBlock({ displayName: "Chanté", timezone: "America/Vancouver", now });
    expect(block).toContain("Chanté");
    expect(block).toMatch(/Friday/);
    expect(block).toMatch(/11:00 p\.?m\.?/i);
    expect(block).toContain("First time here");
  });
  it("describes the gap without precise counts on long absences", () => {
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, lastSeenAt: new Date(now.getTime() - 16 * 86_400_000) });
    expect(block).toContain("about 2 weeks ago");
    expect(block).toContain("long gap");
  });
  it("treats minutes as the same sitting", () => {
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, lastSeenAt: new Date(now.getTime() - 3 * 60_000) });
    expect(block).toContain("Same sitting");
  });
});

import { describe, expect, it } from "vitest";
import type { Intention } from "@/db/schema";
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
  it("keeps re-entry alive for the whole sitting, without a number in sight", () => {
    const stale = { id: "i1", title: "Thesis intro", status: "open", lastTouchedAt: new Date(now.getTime() - 20 * 86_400_000), list: null, estimateMinutes: null, dueAt: null, nextAction: null } as unknown as Intention;
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, lastSeenAt: new Date(now.getTime() - 2 * 60_000), sitting: { gapSeconds: 14 * 86_400 }, openIntentions: [stale] });
    expect(block).toContain("Same sitting");
    const reentry = block.split("\n").find((l) => l.includes("coming-back pass"))!;
    expect(reentry).toBeDefined();
    expect(reentry).not.toMatch(/\d/);
    expect(block).toContain("stale (flagged below)");
    expect(block).toMatch(/Thesis intro.*stale/);
  });
  it("says why they declined, and marks it on the intention", () => {
    const i = { id: "i1", title: "Grant report", status: "open", lastTouchedAt: now, list: null, estimateMinutes: null, dueAt: null, nextAction: null } as unknown as Intention;
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, openIntentions: [i], declinedNow: { title: "Grant report", reason: "too_big" }, declinedToday: [{ intentionId: "i1", reason: "too_big" }] });
    expect(block).toContain("## Just now");
    expect(block).toContain("said: too big");
    expect(block).toMatch(/Grant report.*declined today \(too big\)/);
  });
});

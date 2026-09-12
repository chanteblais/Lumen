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
  it("lists recent changes with who did them, and gives done things their ids", () => {
    const block = buildContextBlock({
      displayName: "C",
      timezone: "UTC",
      now,
      recentActivity: [
        { type: "intention.completed", at: new Date(now.getTime() - 2 * 60_000), via: "app", intentionId: "i9", title: "Take out compost", status: "done" },
        { type: "intention.reopened", at: new Date(now.getTime() - 40 * 60_000), via: "app", intentionId: "i8", title: "Email Priya", status: "open" },
        { type: "intention.updated", at: new Date(now.getTime() - 3 * 3_600_000), via: "chat", intentionId: "i7", title: "Grant report", status: "open", fields: ["list"] },
        { type: "intention.created", at: new Date(now.getTime() - 4 * 3_600_000), via: "chat", intentionId: "i6", title: "Buy stamps", status: "dropped" },
      ],
      recentlyDone: [{ id: "i9", title: "Take out compost", completedAt: new Date(now.getTime() - 2 * 60_000) } as unknown as Intention],
    });
    expect(block).toContain("## Recent changes");
    expect(block).toMatch(/just now · they ticked "Take out compost" done on Today or Lists · i9 · now done/);
    expect(block).toMatch(/40 minutes ago · they unticked "Email Priya" on Today or Lists — open again · i8 · now open/);
    expect(block).toMatch(/3 hours ago · you changed "Grant report" \(list\) · i7 · now open/);
    expect(block).toMatch(/4 hours ago · you saved "Buy stamps" · i6 · now dropped/);
    expect(block).toMatch(/## Recently done.*\n- i9 · "Take out compost" · just now/);
    expect(block).toContain("reopen_intention");
  });
  it("leaves the recent-changes section out when nothing changed", () => {
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, recentActivity: [] });
    expect(block).not.toContain("Recent changes");
  });
  it("says why they declined, and marks it on the intention", () => {
    const i = { id: "i1", title: "Grant report", status: "open", lastTouchedAt: now, list: null, estimateMinutes: null, dueAt: null, nextAction: null } as unknown as Intention;
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, openIntentions: [i], declinedNow: { title: "Grant report", reason: "too_big" }, declinedToday: [{ intentionId: "i1", reason: "too_big" }] });
    expect(block).toContain("## Just now");
    expect(block).toContain("said: too big");
    expect(block).toMatch(/Grant report.*declined today \(too big\)/);
  });
});

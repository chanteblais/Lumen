import { describe, expect, it } from "vitest";
import type { FocusSession, Intention } from "@/db/schema";
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
        { type: "intention.updated", at: new Date(now.getTime() - 5 * 3_600_000), via: "app", intentionId: "i5", title: "Order rug", status: "open", fields: ["list"] },
        { type: "intention.dropped", at: new Date(now.getTime() - 6 * 3_600_000), via: "app", intentionId: "i4", title: "Old errand", status: "dropped" },
      ],
      recentlyDone: [{ id: "i9", title: "Take out compost", completedAt: new Date(now.getTime() - 2 * 60_000) } as unknown as Intention],
    });
    expect(block).toContain("## Recent changes");
    expect(block).toMatch(/just now · they ticked "Take out compost" done on Today or in Lists · i9 · now done/);
    expect(block).toMatch(/40 minutes ago · they unticked "Email Priya" on Today or in Lists — open again · i8 · now open/);
    expect(block).toMatch(/5 hours ago · they moved "Order rug" in Lists \(list\) · i5 · now open/);
    expect(block).toMatch(/6 hours ago · they let "Old errand" go in Lists · i4 · now dropped/);
    expect(block).toMatch(/3 hours ago · you changed "Grant report" \(list\) · i7 · now open/);
    expect(block).toMatch(/4 hours ago · you saved "Buy stamps" · i6 · now dropped/);
    expect(block).toMatch(/## Recently done.*\n- i9 · "Take out compost" · just now/);
    expect(block).toContain("reopen_intention");
  });
  it("leaves the recent-changes section out when nothing changed", () => {
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, recentActivity: [] });
    expect(block).not.toContain("Recent changes");
  });
  it("describes the running session as company, and the last one as a fact", () => {
    const s = { id: "s1", goal: "Edit chapter 3", firstStep: "Open the doc", approach: "read the last paragraph first", plannedMinutes: 45, startedAt: new Date(now.getTime() - 12 * 60_000), endedAt: null, outcome: null } as unknown as FocusSession;
    const running = buildContextBlock({ displayName: "C", timezone: "UTC", now, session: s });
    expect(running).toMatch(/Focus session running: s1 · "Edit chapter 3" · first step: Open the doc · 12 of 45 min · approach: read the last paragraph first/);
    expect(running).toContain("keeping them company");
    const ended = { ...s, endedAt: new Date(now.getTime() - 30 * 60_000), outcome: "abandoned" } as unknown as FocusSession;
    const after = buildContextBlock({ displayName: "C", timezone: "UTC", now, lastSession: ended });
    expect(after).toMatch(/No focus session is running now.*"Edit chapter 3".*left open with no end signal, so the app closed it · ended 30 minutes ago\./);
    expect(after).toContain("start_focus_session again with the same goal");
  });
  it("treats Start with Lumi as the start itself, with Today's first step", () => {
    const base = { displayName: "C", timezone: "UTC", now };
    const start = { intentionId: "i1", title: "Take out compost", firstStep: "Tie the compost bag", estimateMinutes: 5 };
    const fresh = buildContextBlock({ ...base, startNow: start });
    expect(fresh).toMatch(/## Just now\n- They tapped Start with Lumi on "Take out compost" \(i1\)/);
    expect(fresh).toContain('first step Today gave them is "Tie the compost bag"');
    expect(fresh).toContain("call start_focus_session now");
    expect(fresh).toContain("5 min from the estimate");
    const running = { id: "s1", goal: "Take out compost", firstStep: "Tie the compost bag", approach: null, plannedMinutes: 5, startedAt: new Date(now.getTime() - 60_000), endedAt: null, outcome: null, intentionId: "i1" } as unknown as FocusSession;
    expect(buildContextBlock({ ...base, startNow: start, session: running })).toContain("again while its session is already running");
    expect(buildContextBlock({ ...base, startNow: { ...start, intentionId: "i2", title: "Email Priya" }, session: running })).toContain('Switching is fine: start_focus_session for "Email Priya"');
  });
  it("tells Lumi what a check-in tap was, and that the closing already happened", () => {
    const base = { displayName: "C", timezone: "UTC", now };
    expect(buildContextBlock({ ...base, sessionEventNow: { response: "stuck", goal: "Edit chapter 3", minute: 15 } })).toMatch(/## Just now\n- They tapped Stuck.*smallest next physical action/);
    expect(buildContextBlock({ ...base, sessionEventNow: { response: "distracted", goal: "Edit chapter 3", minute: 30 } })).toMatch(/Welcome back\. Where did we end up\?/);
    const done = buildContextBlock({ ...base, sessionEventNow: { response: "done", goal: "Edit chapter 3", minute: 40, intentionId: "i1" } });
    expect(done).toContain("already closed as completed");
    expect(done).toContain("complete_intention (i1)");
    expect(buildContextBlock({ ...base, sessionEventNow: { response: "end", goal: "Edit chapter 3", minute: 20 } })).toContain("closed as stopped early");
  });
  it("says why they declined, and marks it on the intention", () => {
    const i = { id: "i1", title: "Grant report", status: "open", lastTouchedAt: now, list: null, estimateMinutes: null, dueAt: null, nextAction: null } as unknown as Intention;
    const block = buildContextBlock({ displayName: "C", timezone: "UTC", now, openIntentions: [i], declinedNow: { title: "Grant report", reason: "too_big" }, declinedToday: [{ intentionId: "i1", reason: "too_big" }] });
    expect(block).toContain("## Just now");
    expect(block).toContain("said: too big");
    expect(block).toMatch(/Grant report.*declined today \(too big\)/);
  });
});

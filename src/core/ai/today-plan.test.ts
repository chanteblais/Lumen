import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";
import type { Snapshot } from "@/core/domain/snapshot";
import { ensureTodaysPlan, needsFirstItems } from "./today-plan";

const db = {} as Db;
const user = { id: "u1", displayName: "Chanté", timezone: "America/Vancouver", lastSeenAt: new Date("2026-09-12T07:00:00Z") } as User;
const intention = (id: string, dueAt: Date | null = null) => ({ id, title: id, dueAt }) as Intention;
const emptyPlan: DayPlanJson = { dayLine: "Nothing on the list.", rightNow: null, afterThat: [], later: [], restCanWait: false };
const fullPlan: DayPlanJson = { dayLine: "One thing.", rightNow: { intentionId: "a", firstStep: "Open it." }, afterThat: [], later: [], restCanWait: false };

function snapshot(overrides: Partial<Snapshot>): Snapshot {
  return { today: "2026-09-12", lists: [], openIntentions: [], recentlyDone: [], beliefs: [], capacity: undefined, planRow: undefined, plan: undefined, ...overrides } as Snapshot;
}

describe("needsFirstItems", () => {
  it("is false without a plan, or when the plan already has a Right now", () => {
    expect(needsFirstItems(snapshot({ openIntentions: [intention("a")] }), "UTC")).toBe(false);
    expect(needsFirstItems(snapshot({ plan: fullPlan, openIntentions: [intention("a"), intention("b")] }), "UTC")).toBe(false);
  });
  it("is true when an empty plan now has something to choose from", () => {
    expect(needsFirstItems(snapshot({ plan: emptyPlan, openIntentions: [intention("a")] }), "UTC")).toBe(true);
  });
  it("ignores fixed-time items, which never go in Right now", () => {
    const fixed = intention("f", new Date("2026-09-12T17:00:00Z"));
    expect(needsFirstItems(snapshot({ plan: emptyPlan, openIntentions: [fixed] }), "UTC")).toBe(false);
  });
});

describe("ensureTodaysPlan", () => {
  it("returns the persisted plan without building", async () => {
    const build = vi.fn();
    const r = await ensureTodaysPlan(db, user, { load: async () => snapshot({ plan: fullPlan }), build, save: vi.fn() });
    expect(r.plan).toBe(fullPlan);
    expect(build).not.toHaveBeenCalled();
  });
  it("builds and saves once when two callers race for the same day", async () => {
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const build = vi.fn(async () => {
      await gate;
      return fullPlan;
    });
    const save = vi.fn(async () => ({}) as never);
    const load = async () => snapshot({ openIntentions: [intention("a")] });
    const u2 = { ...user, id: "u-race" };
    const p1 = ensureTodaysPlan(db, u2, { load, build, save });
    const p2 = ensureTodaysPlan(db, u2, { load, build, save });
    release();
    const [a, b] = await Promise.all([p1, p2]);
    expect(a.plan).toBe(fullPlan);
    expect(b.plan).toBe(fullPlan);
    expect(build).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]).toEqual([db, "u-race", "2026-09-12", fullPlan, "new_day", undefined]);
  });
  it("re-cuts an empty plan once there are items, recorded as first_items", async () => {
    const save = vi.fn(async () => ({}) as never);
    const r = await ensureTodaysPlan(db, { ...user, id: "u-first" }, { load: async () => snapshot({ plan: emptyPlan, openIntentions: [intention("a")] }), build: async () => fullPlan, save });
    expect(r.plan).toBe(fullPlan);
    expect(save).toHaveBeenCalledWith(db, "u-first", "2026-09-12", fullPlan, "first_items", undefined);
  });
});

import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import type { DayPlanJson, DayPlanRow, Intention, User } from "@/db/schema";
import type { Snapshot } from "@/core/domain/snapshot";
import type { PlanInputs } from "./plan";
import { ensureTodaysPlan, needsFirstItems, planInputs, recutTodaysPlan } from "./today-plan";

const db = {} as Db;
const user = { id: "u1", displayName: "Chanté", timezone: "America/Vancouver", lastSeenAt: new Date("2026-09-12T07:00:00Z") } as User;
const intention = (id: string, dueAt: Date | null = null) => ({ id, title: id, dueAt }) as Intention;
const emptyPlan: DayPlanJson = { dayLine: "Nothing on the list.", rightNow: null, afterThat: [], later: [], restCanWait: false };
const fullPlan: DayPlanJson = { dayLine: "One thing.", rightNow: { intentionId: "a", firstStep: "Open it." }, afterThat: [], later: [], restCanWait: false };
const lowPlan: DayPlanJson = { ...fullPlan, dayLine: "One small thing." };

function snapshot(overrides: Partial<Snapshot>): Snapshot {
  return {
    today: "2026-09-12",
    lists: [],
    openIntentions: [],
    recentlyDone: [],
    beliefs: [],
    capacity: undefined,
    capacitySkipped: false,
    declinedToday: [],
    sitting: undefined,
    planRow: undefined,
    plan: undefined,
    ...overrides,
  } as Snapshot;
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

describe("recutTodaysPlan", () => {
  const planRow = { capacity: null } as DayPlanRow;
  it("re-cuts for a low day and records the capacity", async () => {
    const save = vi.fn(async () => ({}) as never);
    const build = vi.fn(async () => lowPlan);
    const r = await recutTodaysPlan(db, user, "capacity", { load: async () => snapshot({ plan: fullPlan, planRow, capacity: { level: "low", at: new Date() } }), build, save });
    expect(r.plan).toBe(lowPlan);
    expect(save).toHaveBeenCalledWith(db, "u1", "2026-09-12", lowPlan, "capacity", "low", undefined);
  });
  it("leaves the one thing alone when normal-ish matches what the plan assumed", async () => {
    const build = vi.fn();
    const save = vi.fn();
    const r = await recutTodaysPlan(db, user, "capacity", { load: async () => snapshot({ plan: fullPlan, planRow, capacity: { level: "normal", at: new Date() } }), build, save });
    expect(r.plan).toBe(fullPlan);
    expect(build).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
  it("always re-cuts on a decline, passing today's declines to the planner", async () => {
    const build = vi.fn<(inputs: PlanInputs) => Promise<DayPlanJson>>(async () => lowPlan);
    const save = vi.fn(async () => ({}) as never);
    const declinedToday = [{ intentionId: "a", reason: "too_big", at: new Date() }];
    await recutTodaysPlan(db, user, "declined", { load: async () => snapshot({ plan: fullPlan, planRow, openIntentions: [intention("a"), intention("b")], declinedToday }), build, save });
    expect(build.mock.calls[0]?.[0].declined).toBe(declinedToday);
    expect(save).toHaveBeenCalledWith(db, "u1", "2026-09-12", lowPlan, "declined", undefined, undefined);
  });
  it("re-cuts around an ask from chat, handing the planner the ask and Lumi's pick, and keeps the ask on the row's event", async () => {
    const build = vi.fn<(inputs: PlanInputs) => Promise<DayPlanJson>>(async () => lowPlan);
    const save = vi.fn(async () => ({}) as never);
    const ask = { text: "something easy", rightNowId: "b", firstStep: "Open the tab." };
    await recutTodaysPlan(db, user, { reason: "asked", ask }, { load: async () => snapshot({ plan: fullPlan, planRow, openIntentions: [intention("a"), intention("b")] }), build, save });
    expect(build.mock.calls[0]?.[0].ask).toBe(ask);
    expect(save).toHaveBeenCalledWith(db, "u1", "2026-09-12", lowPlan, "asked", undefined, "something easy");
  });
});

describe("planInputs", () => {
  it("tells the planner about the gap this sitting began after, not the last request", () => {
    const openedAt = new Date("2026-09-12T16:00:00Z");
    const inputs = planInputs(user, snapshot({ sitting: { openedAt, gapSeconds: 14 * 86_400 } }), openedAt);
    expect(inputs.lastSeenAt).toEqual(new Date("2026-08-29T16:00:00Z"));
    expect(planInputs(user, snapshot({}), openedAt).lastSeenAt).toBe(user.lastSeenAt);
  });
});

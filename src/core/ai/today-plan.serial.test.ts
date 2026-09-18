/**
 * Re-cuts of one user's path don't race (code review B8): a capacity answer on
 * Today and a reshape_today in chat, or two quick reshapes, run one after the
 * other, each on the snapshot the one before saved — so the path that stands is
 * the one for the last request.
 */
import { describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import type { DayPlanJson, User } from "@/db/schema";
import { serially } from "./serial";
import { ensureTodaysPlan, recutTodaysPlan } from "./today-plan";

const db = {} as Db;
const user = { id: "u-serial", timezone: "UTC", displayName: "S", lastSeenAt: new Date() } as User;
// A path with a Right now: a first generation never replaces one (`needsFirstItems`).
const planFor = (label: string): DayPlanJson => ({ dayLine: label, rightNow: { intentionId: "i1", firstStep: "Start" }, afterThat: [], later: [], restCanWait: false });
const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fakeStore() {
  let saved: DayPlanJson | undefined;
  const log: string[] = [];
  return {
    log,
    saved: () => saved,
    deps: {
      now: () => new Date("2026-09-13T12:00:00Z"),
      load: (async () => {
        log.push(`load saw ${saved?.dayLine ?? "nothing"}`);
        return { plan: saved, planRow: undefined, capacity: undefined, today: "2026-09-13", openIntentions: [{ id: "i1" }], beliefs: [], declinedToday: [], sitting: undefined };
      }) as never,
      save: (async (_db: Db, _u: string, _day: string, plan: DayPlanJson) => {
        saved = plan;
        log.push(`saved ${plan.dayLine}`);
      }) as never,
    },
  };
}

describe("re-cutting today's path", () => {
  it("runs one re-cut at a time, in order, each reading what the last one saved", async () => {
    const store = fakeStore();
    // The first model call is slow, the second quick: without serialising, the first would save last.
    const slow = recutTodaysPlan(db, user, { reason: "asked", ask: { text: "something easy" } }, { ...store.deps, build: (async () => (await tick(30), planFor("easy"))) as never });
    const quick = recutTodaysPlan(db, user, { reason: "asked", ask: { text: "a fresh plan" } }, { ...store.deps, build: (async () => planFor("fresh")) as never });
    await Promise.all([slow, quick]);
    expect(store.log).toEqual(["load saw nothing", "saved easy", "load saw easy", "saved fresh"]);
    expect(store.saved()?.dayLine).toBe("fresh");
  });

  it("keeps a re-cut's path when a first generation was waiting behind it", async () => {
    const store = fakeStore();
    let builds = 0;
    const build = (async () => (builds++, await tick(10), planFor("asked"))) as never;
    const recut = recutTodaysPlan(db, { ...user, id: "u-gen" } as User, { reason: "asked", ask: { text: "quick wins" } }, { ...store.deps, build });
    const generated = ensureTodaysPlan(db, { ...user, id: "u-gen" } as User, { ...store.deps, build: (async () => (builds++, planFor("generated"))) as never });
    await Promise.all([recut, generated]);
    expect(store.saved()?.dayLine).toBe("asked");
    expect(builds).toBe(1);
  });

  it("lets the next one run after a failure", async () => {
    const order: string[] = [];
    const failed = serially("k", async () => {
      order.push("first");
      throw new Error("model down");
    });
    const next = serially("k", async () => (order.push("second"), "ok"));
    await expect(failed).rejects.toThrow("model down");
    expect(await next).toBe("ok");
    expect(order).toEqual(["first", "second"]);
  });
});

/**
 * Today's path: read it, generate it once per local day, or re-cut it when
 * something that shapes it changes (capacity, a "not this", the coming-back
 * pass). Shared by the Today page, the capacity route and the background
 * priming after every page open and chat turn, so the model call (several
 * seconds) usually happens before anyone is waiting on it.
 * See docs/today.md → How the plan is built.
 */
import type { Db } from "@/db/client";
import type { DayPlanJson, User } from "@/db/schema";
import { capacityChangesPlan } from "@/core/domain/capacity";
import { dueOn } from "@/core/domain/intentions";
import { savePlan } from "@/core/domain/plans";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { visitBeforeSitting } from "@/core/domain/users";
import { buildDayPlan, type PlanInputs } from "./plan";

export type TodaysPlan = { snap: Snapshot; plan: DayPlanJson };

/** Why an existing plan is cut again. The rest of `PlanReason` is code-derived (new_day, first_items, advanced). */
export type RecutReason = "capacity" | "declined" | "reentry" | "asked";

type Deps = {
  load: typeof loadSnapshot;
  build: typeof buildDayPlan;
  save: typeof savePlan;
  now: () => Date;
};
const live: Deps = { load: loadSnapshot, build: buildDayPlan, save: savePlan, now: () => new Date() };

/** One generation per user per day per process: a page and a prime racing each other share the promise. */
const inFlight = new Map<string, Promise<DayPlanJson>>();

export async function ensureTodaysPlan(db: Db, user: User, deps: Partial<Deps> = {}): Promise<TodaysPlan> {
  const d = { ...live, ...deps };
  const now = d.now();
  const snap = await d.load(db, user, now);
  if (snap.plan && !needsFirstItems(snap, user.timezone)) return { snap, plan: snap.plan };

  const key = `${user.id}:${snap.today}`;
  let pending = inFlight.get(key);
  if (!pending) {
    pending = (async () => {
      const plan = await d.build(planInputs(user, snap, now));
      await d.save(db, user.id, snap.today, plan, snap.plan ? "first_items" : "new_day", snap.capacity?.level);
      return plan;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return { snap, plan: await pending };
}

/**
 * Cut today's path again because something that shapes it changed. The one
 * thing may move — that is the point of these triggers, and the only times
 * it does. A capacity answer that matches what the plan already assumed
 * (normal-ish on a plan cut without a report) changes nothing.
 */
export async function recutTodaysPlan(db: Db, user: User, reason: RecutReason, deps: Partial<Deps> = {}): Promise<TodaysPlan> {
  const d = { ...live, ...deps };
  const now = d.now();
  const snap = await d.load(db, user, now);
  if (reason === "capacity" && snap.plan && !capacityChangesPlan(snap.capacity?.level ?? "normal", snap.planRow?.capacity)) {
    return { snap, plan: snap.plan };
  }
  const plan = await d.build(planInputs(user, snap, now));
  await d.save(db, user.id, snap.today, plan, reason, snap.capacity?.level);
  return { snap, plan };
}

/**
 * Fire-and-forget version for `after()`: by the time Today is opened the
 * path is already there. With a reason, the path is re-cut instead. Never
 * throws — a failed prime just means Today generates on demand, as before.
 */
export async function primeTodaysPlan(db: Db, user: User, recut?: RecutReason): Promise<void> {
  try {
    if (recut) await recutTodaysPlan(db, user, recut);
    else await ensureTodaysPlan(db, user);
  } catch (e) {
    console.error("[plan] background generation failed", e);
  }
}

/** Everything the planner sees, from one snapshot. */
export function planInputs(user: User, snap: Snapshot, now: Date): PlanInputs {
  return {
    displayName: user.displayName,
    timezone: user.timezone,
    localDate: snap.today,
    now,
    capacity: snap.capacity,
    openIntentions: snap.openIntentions,
    beliefs: snap.beliefs,
    declined: snap.declinedToday,
    // The gap this sitting began after, not the seconds since the last request.
    lastSeenAt: snap.sitting ? visitBeforeSitting(snap.sitting) : user.lastSeenAt,
  };
}

/**
 * The day's plan was cut when there was nothing to choose from (or everything
 * on it has since been ticked off) and there are now things to choose from.
 * Priming on app open makes this common: open the app, brain-dump in chat,
 * then Today. A plan that still has a Right now is never regenerated here —
 * the one thing must not change every time the page opens.
 */
export function needsFirstItems(snap: Pick<Snapshot, "plan" | "openIntentions" | "today">, timezone: string): boolean {
  const p = snap.plan;
  if (!p || p.rightNow || p.afterThat.length) return false;
  const fixed = new Set(dueOn(snap.openIntentions, snap.today, timezone).map((f) => f.id));
  return snap.openIntentions.some((i) => !fixed.has(i.id));
}

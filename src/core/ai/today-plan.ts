/**
 * Today's path: read it, or generate it once per local day. Shared by the
 * Today page and the background priming on app open, so the model call
 * (several seconds) usually happens before anyone is waiting on it.
 * See docs/today.md → How the plan is built.
 */
import type { Db } from "@/db/client";
import type { DayPlanJson, User } from "@/db/schema";
import { dueOn } from "@/core/domain/intentions";
import { savePlan } from "@/core/domain/plans";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { buildDayPlan } from "./plan";

export type TodaysPlan = { snap: Snapshot; plan: DayPlanJson };

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
      const plan = await d.build({
        displayName: user.displayName,
        timezone: user.timezone,
        localDate: snap.today,
        now,
        capacity: snap.capacity,
        openIntentions: snap.openIntentions,
        beliefs: snap.beliefs,
        lastSeenAt: user.lastSeenAt,
      });
      await d.save(db, user.id, snap.today, plan, snap.plan ? "first_items" : "new_day", snap.capacity?.level);
      return plan;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return { snap, plan: await pending };
}

/**
 * Fire-and-forget version for `after()` on app open: by the time Today is
 * opened the path is already there. Never throws — a failed prime just means
 * Today generates on demand, as before.
 */
export async function primeTodaysPlan(db: Db, user: User): Promise<void> {
  try {
    await ensureTodaysPlan(db, user);
  } catch (e) {
    console.error("[plan] background generation failed", e);
  }
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

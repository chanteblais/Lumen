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
import { declineNote } from "@/core/declines";
import { advancePlan, getPlanForDate, planAfterDecline, savePlan } from "@/core/domain/plans";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { visitBeforeSitting } from "@/core/domain/users";
import { buildDayPlan, type PlanAsk, type PlanInputs } from "./plan";
import { serially } from "./serial";

type TodaysPlan = { snap: Snapshot; plan: DayPlanJson };

/** Why an existing plan is cut again. The rest of `PlanReason` is code-derived (new_day, first_items, advanced). */
type RecutReason = "capacity" | "declined" | "reentry" | "asked" | "priority";

/** A re-cut with what shaped it: `asked` carries the ask from chat (and Lumi's pick, so Today matches her reply). */
export type Recut = { reason: RecutReason; ask?: PlanAsk };

type Deps = {
  load: typeof loadSnapshot;
  build: typeof buildDayPlan;
  save: typeof savePlan;
  latest: typeof getPlanForDate;
  now: () => Date;
};
const live: Deps = { load: loadSnapshot, build: buildDayPlan, save: savePlan, latest: getPlanForDate, now: () => new Date() };

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
    // In line with re-cuts (B8): if one saved a path while this waited, that path stands.
    pending = serially(planKey(user), async () => {
      const fresh = await d.load(db, user, now);
      if (fresh.plan && !needsFirstItems(fresh, user.timezone)) return fresh.plan;
      const plan = await d.build(planInputs(user, fresh, now));
      await d.save(db, user.id, fresh.today, plan, fresh.plan ? "first_items" : "new_day", fresh.capacity?.level);
      return plan;
    }).finally(() => inFlight.delete(key));
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
export async function recutTodaysPlan(db: Db, user: User, recut: RecutReason | Recut, deps: Partial<Deps> = {}): Promise<TodaysPlan> {
  const d = { ...live, ...deps };
  const { reason, ask } = typeof recut === "string" ? { reason: recut, ask: undefined } : recut;
  // One at a time per user, in order (code review B8): each reads the snapshot after the one before saved, so the path matches the last request.
  return serially(planKey(user), async () => {
    const now = d.now();
    const snap = await d.load(db, user, now);
    if (reason === "capacity" && snap.plan && !capacityChangesPlan(snap.capacity?.level ?? "normal", snap.planRow?.capacity)) {
      return { snap, plan: snap.plan };
    }
    const plan = await d.build(planInputs(user, snap, now, ask, reason === "declined" ? lastDecline(snap) : undefined));
    await d.save(db, user.id, snap.today, plan, reason, snap.capacity?.level, ask?.text);
    return { snap, plan };
  });
}

const planKey = (user: Pick<User, "id">) => `plan:${user.id}`;

/**
 * Fire-and-forget version for `after()`: by the time Today is opened the
 * path is already there. With a reason, the path is re-cut instead. Never
 * throws — a failed prime just means Today generates on demand, as before.
 */
export async function primeTodaysPlan(db: Db, user: User, recut?: RecutReason | Recut): Promise<void> {
  try {
    if (recut) await recutTodaysPlan(db, user, recut);
    else await ensureTodaysPlan(db, user);
  } catch (e) {
    console.error("[plan] background generation failed", e);
  }
}

/**
 * Not this, on Today's card. The card changes at once: the next thing comes
 * from what's already queued (`planAfterDecline`, no model call), saved with
 * Lumi's fixed line for the reason. `refine` then re-cuts the rest of the day
 * with the model, keeping that Right now, and saves only if nothing moved the
 * path meanwhile (a Done, another Not this, a step chosen) — the caller runs it
 * off the response. With nothing queued, the model has to choose now (seconds).
 * 2026-09-13: waiting on the full re-cut took 13s on the card.
 * 2026-09-18: Not this works on any row of Today's list. A thing further down
 * than the first just leaves today's path — nothing else moves, no model call,
 * no line from Lumi (the declined one is the newest in `declinedToday`).
 */
export async function recutAfterDecline(db: Db, user: User, reason: string | null | undefined, deps: Partial<Deps> = {}): Promise<{ plan: DayPlanJson; refine?: () => Promise<void> }> {
  const d = { ...live, ...deps };
  // In line with the other re-cuts (B8); `refine` runs later and checks nothing moved the path before it saves.
  return serially(planKey(user), async () => {
  const now = d.now();
  const snap = await d.load(db, user, now);
  const declined = snap.declinedToday[0]?.intentionId;
  if (snap.plan && declined && snap.plan.rightNow?.intentionId !== declined) {
    // The one they turned down is still open, just not today's.
    const plan = { ...advancePlan(snap.plan, declined), restCanWait: true };
    await d.save(db, user.id, snap.today, plan, "declined", snap.capacity?.level);
    return { plan };
  }
  const note = declineNote(reason);
  const declinedIds = new Set(snap.declinedToday.map((x) => x.intentionId));
  const quick = snap.plan ? planAfterDecline(snap.plan, snap.openIntentions, declinedIds, reason, note) : null;

  if (!quick?.rightNow) {
    const built = await d.build(planInputs(user, snap, now, undefined, lastDecline(snap)));
    const plan = built.rightNow ? { ...built, note } : built;
    await d.save(db, user.id, snap.today, plan, "declined", snap.capacity?.level);
    return { plan };
  }

  const saved = await d.save(db, user.id, snap.today, quick, "declined", snap.capacity?.level);
  const keep = quick.rightNow;
  const refine = async () => {
    try {
      const later = d.now();
      const fresh = await d.load(db, user, later);
      if (fresh.planRow?.id !== saved.id) return;
      const built = await d.build({ ...planInputs(user, fresh, later, undefined, lastDecline(fresh)), keep });
      // Never overwrite what they did while the model was thinking.
      const latest = await d.latest(db, user.id, fresh.today);
      if (latest?.id !== saved.id) return;
      const plan = built.rightNow?.intentionId === keep.intentionId ? { ...built, note } : built;
      await d.save(db, user.id, fresh.today, plan, "declined", fresh.capacity?.level);
    } catch (e) {
      console.error("[plan] re-cut after a decline failed", e);
    }
  };
  return { plan: quick, refine };
  });
}

/** The newest Not this today, with its title — what a `declined` re-cut answers on the card. */
function lastDecline(snap: Pick<Snapshot, "declinedToday" | "openIntentions">): PlanInputs["justDeclined"] {
  const d = snap.declinedToday[0];
  const i = d ? snap.openIntentions.find((x) => x.id === d.intentionId) : undefined;
  return d && i ? { title: i.title, reason: d.reason } : undefined;
}

/** Everything the planner sees, from one snapshot. */
export function planInputs(user: User, snap: Snapshot, now: Date, ask?: PlanAsk, justDeclined?: PlanInputs["justDeclined"]): PlanInputs {
  return {
    ask,
    justDeclined,
    displayName: user.displayName,
    timezone: user.timezone,
    localDate: snap.today,
    now,
    capacity: snap.capacity,
    openIntentions: snap.openIntentions,
    beliefs: snap.beliefs,
    priorities: snap.priorities,
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

/**
 * Everything a turn or a page needs about the user, loaded once.
 */
import { type Db } from "@/db/client";
import { DEFAULT_LISTS, type User } from "@/db/schema";
import { localDate } from "@/core/time";
import { CAPACITY_EVENT_TYPES, capacityStateFromEvents } from "./capacity";
import { listEventsSince, TODAY_BOUND_MS } from "./events";
import { DECLINE_EVENT_TYPE, declinesFromEvents, listOpenIntentions, listRecentlyDone } from "./intentions";
import { listActiveBeliefs } from "./memory";
import { getPlanForDate, prunePlan } from "./plans";
import { currentSitting } from "./users";

export async function loadSnapshot(db: Db, user: User, now: Date = new Date()) {
  const today = localDate(now, user.timezone);
  const [openIntentions, recentlyDone, beliefs, todayEvents, planRow, sitting] = await Promise.all([
    listOpenIntentions(db, user.id),
    listRecentlyDone(db, user.id, 5),
    listActiveBeliefs(db, user.id),
    // One query for everything "today" is derived from: capacity + declines.
    listEventsSince(db, user.id, [...CAPACITY_EVENT_TYPES, DECLINE_EVENT_TYPE], new Date(now.getTime() - TODAY_BOUND_MS), 40),
    getPlanForDate(db, user.id, today),
    currentSitting(db, user.id),
  ]);
  const lists = user.preferences.lists?.length ? user.preferences.lists : [...DEFAULT_LISTS];
  const capacityState = capacityStateFromEvents(todayEvents, user.timezone, now);
  return {
    today,
    lists,
    openIntentions,
    recentlyDone,
    beliefs,
    capacity: capacityState.report,
    /** The capacity prompt was skipped today — Today doesn't ask again. */
    capacitySkipped: capacityState.skipped,
    /** "Not this" today, newest first. Never Right now again today. */
    declinedToday: declinesFromEvents(todayEvents, user.timezone, now),
    /** The visit this request belongs to, and the gap it began after. */
    sitting,
    planRow,
    plan: planRow ? prunePlan(planRow.plan, openIntentions) : undefined,
  };
}
export type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>;

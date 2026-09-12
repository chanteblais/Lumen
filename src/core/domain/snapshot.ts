/**
 * Everything a turn or a page needs about the user, loaded once.
 */
import { type Db } from "@/db/client";
import { DEFAULT_LISTS, type User } from "@/db/schema";
import { localDate } from "@/core/time";
import { todayCapacity } from "./capacity";
import { listOpenIntentions, listRecentlyDone } from "./intentions";
import { listActiveBeliefs } from "./memory";
import { getPlanForDate, prunePlan } from "./plans";

export async function loadSnapshot(db: Db, user: User, now: Date = new Date()) {
  const today = localDate(now, user.timezone);
  const [openIntentions, recentlyDone, beliefs, capacity, planRow] = await Promise.all([
    listOpenIntentions(db, user.id),
    listRecentlyDone(db, user.id, 5),
    listActiveBeliefs(db, user.id),
    todayCapacity(db, user.id, user.timezone, now),
    getPlanForDate(db, user.id, today),
  ]);
  const lists = user.preferences.lists?.length ? user.preferences.lists : [...DEFAULT_LISTS];
  return {
    today,
    lists,
    openIntentions,
    recentlyDone,
    beliefs,
    capacity,
    planRow,
    plan: planRow ? prunePlan(planRow.plan, openIntentions) : undefined,
  };
}
export type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>;

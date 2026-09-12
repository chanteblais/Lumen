/**
 * Keep today's persisted path honest when an intention leaves it, wherever
 * that happened (chat tool, Today, Lists). Code, not the model.
 */
import { type Db } from "@/db/client";
import type { User } from "@/db/schema";
import { localDate } from "@/core/time";
import { advancePlan, getPlanForDate, savePlan } from "./plans";

export async function reflectClosedInPlan(db: Db, user: Pick<User, "id" | "timezone">, intentionId: string, now: Date = new Date()): Promise<void> {
  const today = localDate(now, user.timezone);
  const row = await getPlanForDate(db, user.id, today);
  if (!row) return;
  const p = row.plan;
  const inPath = p.rightNow?.intentionId === intentionId || p.afterThat.some((a) => a.intentionId === intentionId) || p.later.some((l) => l.intentionId === intentionId);
  if (!inPath) return;
  await savePlan(db, user.id, today, advancePlan(p, intentionId), "advanced", row.capacity ?? undefined);
}

/**
 * Keep today's persisted path honest when an intention leaves it, wherever
 * that happened (chat tool, Today, Lists) — or when its first step is chosen
 * on Today's card. Code, not the model.
 */
import { and, asc, eq } from "drizzle-orm";
import { type Db } from "@/db/client";
import { dayPlans, type User } from "@/db/schema";
import { localDate } from "@/core/time";
import { advancePlan, getPlanForDate, savePlan, withFirstStep } from "./plans";
import { atomic } from "./tx";

/** Lock the day's first plan row: plan rows are only ever added, so every writer that day queues on the same row. */
async function lockDay(tx: Db, userId: string, today: string): Promise<boolean> {
  const [first] = await tx
    .select({ id: dayPlans.id })
    .from(dayPlans)
    .where(and(eq(dayPlans.userId, userId), eq(dayPlans.localDate, today)))
    .orderBy(asc(dayPlans.generatedAt), asc(dayPlans.id))
    .limit(1)
    .for("update");
  return Boolean(first);
}

/**
 * Take the intention out of today's path. Read, advance and save run in one
 * transaction holding a lock on the day's first plan row: plan rows are only
 * ever added, so that row is the same for every writer that day, and two closes
 * at once (parallel tool calls) queue there — the second reads, in a fresh
 * statement, the plan the first saved, instead of both saving from the same one.
 */
export async function reflectClosedInPlan(db: Db, user: Pick<User, "id" | "timezone">, intentionId: string, now: Date = new Date()): Promise<void> {
  const today = localDate(now, user.timezone);
  await atomic(db, async (tx) => {
    if (!(await lockDay(tx, user.id, today))) return;
    const row = await getPlanForDate(tx, user.id, today);
    if (!row) return;
    const p = row.plan;
    const inPath = p.rightNow?.intentionId === intentionId || p.afterThat.some((a) => a.intentionId === intentionId) || p.later.some((l) => l.intentionId === intentionId);
    if (!inPath) return;
    await savePlan(tx, user.id, today, advancePlan(p, intentionId), "advanced", row.capacity ?? undefined);
  });
}

/**
 * A step picked from Break it down: if the intention is Right now, the card
 * shows it as the first step at once — no re-cut. Under the same lock as a
 * close, so a Done landing at the same moment can't be overwritten by it.
 */
export async function setFirstStepInPlan(db: Db, user: Pick<User, "id" | "timezone">, intentionId: string, firstStep: string, now: Date = new Date()): Promise<void> {
  const today = localDate(now, user.timezone);
  await atomic(db, async (tx) => {
    if (!(await lockDay(tx, user.id, today))) return;
    const row = await getPlanForDate(tx, user.id, today);
    if (!row || row.plan.rightNow?.intentionId !== intentionId) return;
    await savePlan(tx, user.id, today, withFirstStep(row.plan, intentionId, firstStep), "first_step", row.capacity ?? undefined);
  });
}

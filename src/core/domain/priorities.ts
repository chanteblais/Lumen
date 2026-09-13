/**
 * Stated priorities: what the user said matters, over the scope they gave —
 * this week, next week, or for a while. Kept apart from Lumi's recommendation
 * (the day plan) and from beliefs (what she's learned): their word, scoped, and
 * never inferred. Whether one still holds is derived from the date, so a week's
 * priorities stop holding on their own; nothing asks the user to clear them.
 * See docs/domain.md → priorities; shared-model.md → Priority and temporal scope.
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { type Db } from "@/db/client";
import { intentions, priorities, type Priority, type PriorityScope } from "@/db/schema";
import { appendEvent } from "./events";
import { returnedRow } from "./rows";

/** The scopes a stated priority can be held over, as Lumi passes them. */
export const PRIORITY_WHEN = ["this_week", "next_week", "for_a_while"] as const;
type PriorityWhen = (typeof PRIORITY_WHEN)[number];

const DAY = 86_400_000;

/** A local date (YYYY-MM-DD) moved by whole days. Pure. */
export function addDays(localDate: string, days: number): string {
  const [y = NaN, m = NaN, d = NaN] = localDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY).toISOString().slice(0, 10);
}

/** The Monday (YYYY-MM-DD) of the week a local date falls in. Pure. */
export function weekOf(localDate: string): string {
  const [y = NaN, m = NaN, d = NaN] = localDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(localDate, -((weekday + 6) % 7));
}

/** What `when` means as stored scope, said on local date `today`. Pure. */
export function scopeFor(when: PriorityWhen, today: string): { scope: PriorityScope; weekOf: string | null } {
  if (when === "for_a_while") return { scope: "while", weekOf: null };
  const monday = weekOf(today);
  return { scope: "week", weekOf: when === "next_week" ? addDays(monday, 7) : monday };
}

/** Does it hold today? A week's priority holds only in its week; a while's until let go. Pure. */
export function holdsOn(p: Pick<Priority, "scope" | "weekOf" | "retiredAt">, today: string): boolean {
  if (p.retiredAt) return false;
  return p.scope === "while" || p.weekOf === weekOf(today);
}

/** Said for a week that hasn't started yet. Pure. */
export function isAhead(p: Pick<Priority, "scope" | "weekOf" | "retiredAt">, today: string): boolean {
  return !p.retiredAt && p.scope === "week" && Boolean(p.weekOf) && p.weekOf! > weekOf(today);
}

/** "this week" · "next week" · "for a while" — relative to today, for Lumi's context. Pure. */
export function describeScope(p: Pick<Priority, "scope" | "weekOf" | "retiredAt">, today: string): string {
  if (p.scope === "while") return "for a while";
  return isAhead(p, today) ? "next week" : "this week";
}

type HoldPriorityInput = { content: string; when: PriorityWhen; intentionId?: string; replacesId?: string };

/**
 * Hold what they said matters. A named intention must be theirs (otherwise the
 * link is dropped, the words kept). `replacesId` retires the one it supersedes —
 * "actually, the practicum matters more" — keeping it as history.
 */
export async function holdPriority(db: Db, userId: string, input: HoldPriorityInput, today: string): Promise<Priority | { error: string }> {
  const content = input.content.trim();
  if (content.length < 3 || content.length > 200) return { error: "content length" };
  let intentionId: string | null = null;
  if (input.intentionId) {
    const [row] = await db.select({ id: intentions.id }).from(intentions).where(and(eq(intentions.id, input.intentionId), eq(intentions.userId, userId))).limit(1);
    intentionId = row?.id ?? null;
  }
  const now = new Date();
  let supersedesId: string | null = null;
  if (input.replacesId) {
    const [old] = await db.select().from(priorities).where(and(eq(priorities.id, input.replacesId), eq(priorities.userId, userId))).limit(1);
    if (old && !old.retiredAt) {
      await db.update(priorities).set({ retiredAt: now, retiredReason: "superseded" }).where(eq(priorities.id, old.id));
      supersedesId = old.id;
    }
  }
  const { scope, weekOf: week } = scopeFor(input.when, today);
  const row = returnedRow(await db.insert(priorities).values({ userId, content, intentionId, scope, weekOf: week, supersedesId }).returning(), "holdPriority");
  await appendEvent(db, {
    userId,
    type: "priority.held",
    subjectType: "priority",
    subjectId: row.id,
    payload: { scope, week_of: week, intention_id: intentionId, supersedes: supersedesId },
  });
  return row;
}

/** They said it doesn't matter like that any more. Kept as history, gone from attention. */
export async function letGoPriority(db: Db, userId: string, id: string): Promise<Priority | undefined> {
  const [row] = await db
    .update(priorities)
    .set({ retiredAt: new Date(), retiredReason: "let_go" })
    .where(and(eq(priorities.id, id), eq(priorities.userId, userId), isNull(priorities.retiredAt)))
    .returning();
  if (row) await appendEvent(db, { userId, type: "priority.let_go", subjectType: "priority", subjectId: row.id, payload: { scope: row.scope, week_of: row.weekOf } });
  return row;
}

/** What holds today, plus anything said for a week still ahead — newest first. Past weeks fall away here. */
export async function listCurrentPriorities(db: Db, userId: string, today: string, limit = 12): Promise<Priority[]> {
  const rows = await db
    .select()
    .from(priorities)
    .where(and(eq(priorities.userId, userId), isNull(priorities.retiredAt)))
    .orderBy(desc(priorities.createdAt))
    .limit(60);
  return rows.filter((p) => holdsOn(p, today) || isAhead(p, today)).slice(0, limit);
}

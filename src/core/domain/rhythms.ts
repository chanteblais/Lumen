/**
 * Rhythms: routines the user is building — "go to the gym more", "meditate
 * daily" — held in their words, and the days each was practiced. Kept apart
 * from intentions (a rhythm recurs and is never ticked off and lost), from
 * beliefs (their word, never inferred) and from priorities (not a ranking).
 * Nothing here is a target: how often is their words, a practice is a fact,
 * and what shows is when it happened — never how many, never what was missed.
 * See docs/domain.md → rhythms; product decision 2026-09-18.
 */
import { and, desc, eq, gte, inArray, isNull } from "drizzle-orm";
import { type Db } from "@/db/client";
import { rhythmPractices, rhythms, type Rhythm } from "@/db/schema";
import { addDays, weekOf } from "./priorities";
import { appendEvent, type ActionSource } from "./events";
import { returnedRow } from "./rows";

/** A rhythm with the local dates it was practiced on, this week and the week before, newest first. */
export type RhythmView = Rhythm & { practicedOn: string[] };

const NAME_MAX = 40;
const CONTENT_MAX = 200;

type HoldRhythmInput = { name: string; content: string; cadence?: string; typicalMinutes?: number; replacesId?: string };

/** Hold a rhythm they said they're building. `replacesId` retires the one it changes ("actually, hot yoga, not the gym"). */
export async function holdRhythm(db: Db, userId: string, input: HoldRhythmInput): Promise<Rhythm | { error: string }> {
  const name = input.name.trim().slice(0, NAME_MAX);
  const content = input.content.trim();
  if (name.length < 2) return { error: "name length" };
  if (content.length < 3 || content.length > CONTENT_MAX) return { error: "content length" };
  const now = new Date();
  let supersedesId: string | null = null;
  if (input.replacesId) {
    const [old] = await db.select().from(rhythms).where(and(eq(rhythms.id, input.replacesId), eq(rhythms.userId, userId))).limit(1);
    if (old && !old.retiredAt) {
      await db.update(rhythms).set({ retiredAt: now, retiredReason: "superseded" }).where(eq(rhythms.id, old.id));
      supersedesId = old.id;
    }
  }
  const row = returnedRow(
    await db
      .insert(rhythms)
      .values({ userId, name, content, cadence: input.cadence?.trim().slice(0, 80) || null, typicalMinutes: input.typicalMinutes ?? null, supersedesId })
      .returning(),
    "holdRhythm",
  );
  await appendEvent(db, { userId, type: "rhythm.held", subjectType: "rhythm", subjectId: row.id, payload: { supersedes: supersedesId, typical_minutes: row.typicalMinutes } });
  return row;
}

/** They said they're not building it any more. Kept as history, gone from Today. */
export async function letGoRhythm(db: Db, userId: string, id: string): Promise<Rhythm | undefined> {
  const [row] = await db
    .update(rhythms)
    .set({ retiredAt: new Date(), retiredReason: "let_go" })
    .where(and(eq(rhythms.id, id), eq(rhythms.userId, userId), isNull(rhythms.retiredAt)))
    .returning();
  if (row) await appendEvent(db, { userId, type: "rhythm.let_go", subjectType: "rhythm", subjectId: row.id });
  return row;
}

/**
 * It happened on `practicedOn` (a local date). Once per day: saying it twice,
 * or tapping after telling Lumi, changes nothing and returns `already: true`.
 */
export async function practiceRhythm(db: Db, userId: string, id: string, practicedOn: string, via: ActionSource): Promise<{ rhythm: Rhythm; already: boolean } | undefined> {
  const [rhythm] = await db.select().from(rhythms).where(and(eq(rhythms.id, id), eq(rhythms.userId, userId), isNull(rhythms.retiredAt))).limit(1);
  if (!rhythm) return undefined;
  const inserted = await db.insert(rhythmPractices).values({ rhythmId: id, userId, practicedOn, via }).onConflictDoNothing().returning({ id: rhythmPractices.id });
  if (inserted.length === 0) return { rhythm, already: true };
  await appendEvent(db, { userId, type: "rhythm.practiced", subjectType: "rhythm", subjectId: id, payload: { practiced_on: practicedOn, via } });
  return { rhythm, already: false };
}

/** A tap that was a mistake: the day's practice is taken back. Only from the app; Lumi never unsays what they told her. */
export async function unpracticeRhythm(db: Db, userId: string, id: string, practicedOn: string): Promise<boolean> {
  const gone = await db
    .delete(rhythmPractices)
    .where(and(eq(rhythmPractices.rhythmId, id), eq(rhythmPractices.userId, userId), eq(rhythmPractices.practicedOn, practicedOn)))
    .returning({ id: rhythmPractices.id });
  if (gone.length === 0) return false;
  await appendEvent(db, { userId, type: "rhythm.unpracticed", subjectType: "rhythm", subjectId: id, payload: { practiced_on: practicedOn } });
  return true;
}

/** The rhythms they're building, oldest first, each with its practice days from last week's Monday on. */
export async function listRhythms(db: Db, userId: string, today: string): Promise<RhythmView[]> {
  const rows = await db.select().from(rhythms).where(and(eq(rhythms.userId, userId), isNull(rhythms.retiredAt))).orderBy(rhythms.createdAt).limit(12);
  if (rows.length === 0) return [];
  const since = addDays(weekOf(today), -7);
  const practices = await db
    .select({ rhythmId: rhythmPractices.rhythmId, practicedOn: rhythmPractices.practicedOn })
    .from(rhythmPractices)
    .where(and(eq(rhythmPractices.userId, userId), inArray(rhythmPractices.rhythmId, rows.map((r) => r.id)), gte(rhythmPractices.practicedOn, since)))
    .orderBy(desc(rhythmPractices.practicedOn));
  return rows.map((r) => ({ ...r, practicedOn: practices.filter((p) => p.rhythmId === r.id).map((p) => p.practicedOn) }));
}

/** The seven local dates of the week `today` falls in, Monday first. Pure. */
export function weekDays(today: string): string[] {
  const monday = weekOf(today);
  return Array.from({ length: 7 }, (_, n) => addDays(monday, n));
}

/** "practiced this week: Mon, Wed" · "last: Tue last week" · "not yet" — for Lumi's context and the planner. Pure. */
export function describePractice(r: Pick<RhythmView, "practicedOn">, today: string): string {
  const week = weekDays(today);
  const thisWeek = week.filter((d) => r.practicedOn.includes(d)).map(dayName);
  if (thisWeek.length) return `this week: ${thisWeek.join(", ")}`;
  const last = r.practicedOn[0];
  return last ? `last: ${dayName(last)} last week` : "not yet";
}

function dayName(localDate: string): string {
  const [y = NaN, m = NaN, d = NaN] = localDate.split("-").map(Number);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
}

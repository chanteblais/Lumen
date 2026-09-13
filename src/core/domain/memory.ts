/**
 * Beliefs: what Lumi holds about the user, with confidence, evidence and
 * provenance. The model (or reflection) PROPOSES operations; this module
 * APPLIES them under guardrails — the screens, provenance and duplicate rules
 * in `memory-rules.ts`. See docs/architecture.md → The understanding layer.
 */
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { type Db } from "@/db/client";
import { events, memoryNotes, type BeliefKind, type BeliefSource, type MemoryNote, type RetiredReason } from "@/db/schema";
import { appendEvent } from "./events";
import { boundConfidence, CONTENT_MAX, CONTENT_MIN, cleanContent, contentKey, isNearDuplicate, isSimilar, screenMemory } from "./memory-rules";

export type BeliefOp =
  | {
      op: "create";
      kind: BeliefKind;
      content: string;
      source: BeliefSource;
      confidence?: number;
      /** The user message it came from (where they said it, or the turn it was noticed). */
      sourceMessageId?: string;
    }
  | { op: "confirm"; id: string }
  | { op: "contradict"; id: string; note?: string }
  | { op: "revise"; id: string; content: string; sourceMessageId?: string }
  | { op: "retire"; id: string; reason: RetiredReason }
  /** The user's forgetting: the belief and every earlier wording of it, gone. Only the user. */
  | { op: "delete"; id: string };

export type Actor = "user" | "lumi" | "reflection";

export const MAX_OPS_PER_RUN = 8;
export const RETIRE_BELOW = 0.2;
/** What a turn or a page loads; which of it Lumi sees is `core/ai/memory-select.ts`'s call. */
export const ACTIVE_LIMIT = 200;

/** Pure: confidence after an op. Tested. */
export function nextConfidence(current: number, op: "confirm" | "contradict"): number {
  const v = op === "confirm" ? current + 0.1 : current - 0.15;
  return Math.max(0, Math.min(0.98, Math.round(v * 100) / 100));
}

export function defaultConfidence(source: BeliefSource, actor: Actor): number {
  if (source === "user_said") return actor === "user" ? 0.95 : 0.9;
  if (source === "reflection") return 0.5;
  return 0.5;
}

export type ApplyResult = {
  applied: BeliefOp[];
  skipped: { op: BeliefOp; why: string }[];
  /** New rows: creates, and the new wording a revise or a their-word upgrade wrote. */
  created: MemoryNote[];
  /** A create that was already held: the existing belief took it as evidence instead. */
  matched: MemoryNote[];
  /** Active beliefs close to a new one — it may update or contradict them. */
  similar: MemoryNote[];
  /** Row ids removed by a delete, every version included. */
  deleted: string[];
};

export async function applyBeliefOps(db: Db, userId: string, ops: BeliefOp[], actor: Actor): Promise<ApplyResult> {
  const result: ApplyResult = { applied: [], skipped: [], created: [], matched: [], similar: [], deleted: [] };
  for (const op of ops.slice(0, MAX_OPS_PER_RUN)) {
    const why = await applyOne(db, userId, op, actor, result);
    if (why) result.skipped.push({ op, why });
    else result.applied.push(op);
  }
  for (const op of ops.slice(MAX_OPS_PER_RUN)) result.skipped.push({ op, why: "cap" });
  return result;
}

async function loadOwned(db: Db, userId: string, id: string): Promise<MemoryNote | undefined> {
  const [row] = await db.select().from(memoryNotes).where(and(eq(memoryNotes.id, id), eq(memoryNotes.userId, userId))).limit(1);
  return row;
}

async function applyOne(db: Db, userId: string, op: BeliefOp, actor: Actor, result: ApplyResult): Promise<string | null> {
  const now = new Date();
  switch (op.op) {
    case "create": {
      const content = cleanContent(op.content);
      if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) return "content length";
      const screened = screenMemory(content);
      if (screened) return screened;
      const active = await listActiveBeliefs(db, userId);
      const same = active.find((b) => isNearDuplicate(b.content, content));
      if (same) {
        if (op.source === "user_said" && same.source !== "user_said") {
          // They said what Lumi had only guessed: their word replaces the guess.
          const confidence = boundConfidence("user_said", op.confidence ?? defaultConfidence("user_said", actor));
          result.created.push(await supersede(db, userId, same, { content, source: "user_said", confidence, sourceMessageId: op.sourceMessageId }, actor, now));
          return null;
        }
        await confirmRow(db, userId, same, actor, now);
        result.matched.push(same);
        return null;
      }
      if (op.source !== "user_said" && (await wasForgotten(db, userId, content))) return "forgotten";
      const confidence = boundConfidence(op.source, op.confidence ?? defaultConfidence(op.source, actor));
      const [row] = await db
        .insert(memoryNotes)
        .values({ userId, kind: op.kind, content, source: op.source, confidence, sourceMessageId: op.sourceMessageId ?? null })
        .returning();
      result.created.push(row);
      result.similar.push(...active.filter((b) => isSimilar(b.content, content)));
      await appendEvent(db, { userId, type: "memory.noted", subjectType: "note", subjectId: row.id, payload: { kind: op.kind, source: op.source, confidence, by: actor } });
      return null;
    }
    case "confirm": {
      const b = await loadOwned(db, userId, op.id);
      if (!b || b.retiredAt) return "not active";
      await confirmRow(db, userId, b, actor, now);
      return null;
    }
    case "contradict": {
      const b = await loadOwned(db, userId, op.id);
      if (!b || b.retiredAt) return "not active";
      const confidence = nextConfidence(b.confidence, "contradict");
      const retire = confidence < RETIRE_BELOW && b.source !== "user_said";
      await db
        .update(memoryNotes)
        .set({ confidence, evidenceAgainst: b.evidenceAgainst + 1, lastContradictedAt: now, ...(retire ? { retiredAt: now, retiredReason: "contradicted" as const } : {}) })
        .where(eq(memoryNotes.id, b.id));
      await appendEvent(db, { userId, type: retire ? "memory.retired" : "memory.contradicted", subjectType: "note", subjectId: b.id, payload: { kind: b.kind, confidence, by: actor, note: op.note ?? null } });
      return null;
    }
    case "revise": {
      const b = await loadOwned(db, userId, op.id);
      if (!b || b.retiredAt) return "not active";
      if (b.source === "user_said" && actor !== "user") return "user_said beliefs are revised only by the user";
      const content = cleanContent(op.content);
      if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) return "content length";
      const source: BeliefSource = actor === "user" ? "user_said" : b.source;
      const screened = screenMemory(content);
      if (screened) return screened;
      const confidence = actor === "user" ? 0.95 : b.confidence;
      const sourceMessageId = actor === "user" ? op.sourceMessageId : (op.sourceMessageId ?? b.sourceMessageId ?? undefined);
      result.created.push(await supersede(db, userId, b, { content, source, confidence, sourceMessageId }, actor, now));
      return null;
    }
    case "retire": {
      const b = await loadOwned(db, userId, op.id);
      if (!b || b.retiredAt) return "not active";
      if (b.source === "user_said" && actor !== "user") return "user_said beliefs are retired only by the user";
      await db.update(memoryNotes).set({ retiredAt: now, retiredReason: op.reason }).where(eq(memoryNotes.id, b.id));
      await appendEvent(db, { userId, type: "memory.retired", subjectType: "note", subjectId: b.id, payload: { kind: b.kind, reason: op.reason, by: actor } });
      return null;
    }
    case "delete": {
      if (actor !== "user") return "only the user deletes";
      const b = await loadOwned(db, userId, op.id);
      if (!b) return "not found";
      const versions = await versionsOf(db, userId, b);
      const ids = versions.map((v) => v.id);
      await db.delete(memoryNotes).where(and(eq(memoryNotes.userId, userId), inArray(memoryNotes.id, ids)));
      // Events are append-only, but nothing a deleted belief said may outlive it:
      // the one free-text field its events can carry (a contradiction's note) goes too.
      await db
        .update(events)
        .set({ payload: sql`${events.payload} - 'note'` })
        .where(and(eq(events.userId, userId), inArray(events.subjectId, ids), sql`${events.type} like 'memory.%'`));
      // A tombstone with no words in it: the kind, how many versions, and one-way keys
      // so an inference can't quietly bring it back (`wasForgotten`).
      await appendEvent(db, {
        userId,
        type: "memory.deleted",
        subjectType: "note",
        subjectId: b.id,
        payload: { kind: b.kind, versions: ids.length, keys: [...new Set(versions.map((v) => contentKey(v.content)))], by: actor },
        occurredAt: now,
      });
      result.deleted.push(...ids);
      return null;
    }
  }
}

async function confirmRow(db: Db, userId: string, b: MemoryNote, actor: Actor, now: Date): Promise<void> {
  const confidence = nextConfidence(b.confidence, "confirm");
  await db.update(memoryNotes).set({ confidence, evidenceFor: b.evidenceFor + 1, lastConfirmedAt: now }).where(eq(memoryNotes.id, b.id));
  await appendEvent(db, { userId, type: "memory.confirmed", subjectType: "note", subjectId: b.id, payload: { kind: b.kind, confidence, by: actor } });
}

/** A new wording replaces an old one: history kept through `supersedes_id`, evidence carried over, the old one retired. */
async function supersede(
  db: Db,
  userId: string,
  old: MemoryNote,
  next: { content: string; source: BeliefSource; confidence: number; sourceMessageId?: string },
  actor: Actor,
  now: Date,
): Promise<MemoryNote> {
  const [nu] = await db
    .insert(memoryNotes)
    .values({
      userId,
      kind: old.kind,
      content: next.content,
      source: next.source,
      confidence: next.confidence,
      evidenceFor: old.evidenceFor,
      evidenceAgainst: old.evidenceAgainst,
      supersedesId: old.id,
      sourceMessageId: next.sourceMessageId ?? null,
    })
    .returning();
  await db.update(memoryNotes).set({ retiredAt: now, retiredReason: "superseded" }).where(eq(memoryNotes.id, old.id));
  await appendEvent(db, { userId, type: "memory.revised", subjectType: "note", subjectId: nu.id, payload: { kind: old.kind, supersedes: old.id, source: next.source, by: actor } });
  return nu;
}

/** Every version of a belief: the wordings it superseded, and any that superseded it. */
async function versionsOf(db: Db, userId: string, start: MemoryNote): Promise<MemoryNote[]> {
  const found = new Map<string, MemoryNote>([[start.id, start]]);
  let frontier = [start];
  while (frontier.length) {
    const back = frontier.map((v) => v.supersedesId).filter((id): id is string => Boolean(id) && !found.has(id!));
    const forward = frontier.map((v) => v.id);
    const rows = await db
      .select()
      .from(memoryNotes)
      .where(and(eq(memoryNotes.userId, userId), back.length ? or(inArray(memoryNotes.id, back), inArray(memoryNotes.supersedesId, forward)) : inArray(memoryNotes.supersedesId, forward)));
    frontier = rows.filter((r) => !found.has(r.id));
    for (const r of frontier) found.set(r.id, r);
  }
  return [...found.values()];
}

/** Did the user make Lumi forget this (same content words) before? */
async function wasForgotten(db: Db, userId: string, content: string): Promise<boolean> {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.type, "memory.deleted"), sql`${events.payload} @> ${JSON.stringify({ keys: [contentKey(content)] })}::jsonb`))
    .limit(1);
  return Boolean(row);
}

export async function listActiveBeliefs(db: Db, userId: string, limit = ACTIVE_LIMIT): Promise<MemoryNote[]> {
  return db
    .select()
    .from(memoryNotes)
    .where(and(eq(memoryNotes.userId, userId), isNull(memoryNotes.retiredAt)))
    .orderBy(desc(memoryNotes.confidence), desc(memoryNotes.createdAt))
    .limit(limit);
}

/**
 * Active beliefs for a turn or a page — or none, and say so. Memory failing
 * (the database, a migration not yet applied) never takes the conversation
 * down with it.
 */
export async function loadBeliefsOrNothing(db: Db, userId: string): Promise<{ beliefs: MemoryNote[]; unavailable: boolean }> {
  try {
    return { beliefs: await listActiveBeliefs(db, userId), unavailable: false };
  } catch (e) {
    console.error("[memory] couldn't read beliefs; carrying on without them", e);
    return { beliefs: [], unavailable: true };
  }
}

/** Words, not numbers, for the user-facing view. */
export function confidenceWord(c: number): "sure" | "fairly sure" | "guessing" {
  if (c >= 0.8) return "sure";
  if (c >= 0.5) return "fairly sure";
  return "guessing";
}

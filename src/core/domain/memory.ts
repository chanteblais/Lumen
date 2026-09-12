/**
 * Beliefs: what Lumi holds about the user, with confidence and evidence.
 * The model (or reflection) PROPOSES operations; this module APPLIES them
 * under guardrails. See docs/architecture.md → The understanding layer.
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { type Db } from "@/db/client";
import { memoryNotes, type BeliefKind, type BeliefSource, type MemoryNote, type RetiredReason } from "@/db/schema";
import { appendEvent } from "./events";

export type BeliefOp =
  | { op: "create"; kind: BeliefKind; content: string; source: BeliefSource; confidence?: number }
  | { op: "confirm"; id: string }
  | { op: "contradict"; id: string; note?: string }
  | { op: "revise"; id: string; content: string }
  | { op: "retire"; id: string; reason: RetiredReason };

export type Actor = "user" | "lumi" | "reflection";

export const MAX_OPS_PER_RUN = 8;
export const RETIRE_BELOW = 0.2;

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

export type ApplyResult = { applied: BeliefOp[]; skipped: { op: BeliefOp; why: string }[]; created: MemoryNote[] };

export async function applyBeliefOps(db: Db, userId: string, ops: BeliefOp[], actor: Actor): Promise<ApplyResult> {
  const result: ApplyResult = { applied: [], skipped: [], created: [] };
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
      const content = op.content.trim();
      if (content.length < 3 || content.length > 240) return "content length";
      const confidence = clamp(op.confidence ?? defaultConfidence(op.source, actor));
      const [row] = await db.insert(memoryNotes).values({ userId, kind: op.kind, content, source: op.source, confidence }).returning();
      result.created.push(row);
      await appendEvent(db, { userId, type: "memory.noted", subjectType: "note", subjectId: row.id, payload: { kind: op.kind, confidence, by: actor } });
      return null;
    }
    case "confirm": {
      const b = await loadOwned(db, userId, op.id);
      if (!b || b.retiredAt) return "not active";
      const confidence = nextConfidence(b.confidence, "confirm");
      await db.update(memoryNotes).set({ confidence, evidenceFor: b.evidenceFor + 1, lastConfirmedAt: now }).where(eq(memoryNotes.id, b.id));
      await appendEvent(db, { userId, type: "memory.confirmed", subjectType: "note", subjectId: b.id, payload: { kind: b.kind, confidence, by: actor } });
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
      const content = op.content.trim();
      if (content.length < 3 || content.length > 240) return "content length";
      const [nu] = await db
        .insert(memoryNotes)
        .values({ userId, kind: b.kind, content, source: actor === "user" ? "user_said" : b.source, confidence: actor === "user" ? 0.95 : b.confidence, evidenceFor: b.evidenceFor, evidenceAgainst: b.evidenceAgainst, supersedesId: b.id })
        .returning();
      await db.update(memoryNotes).set({ retiredAt: now, retiredReason: "superseded" }).where(eq(memoryNotes.id, b.id));
      result.created.push(nu);
      await appendEvent(db, { userId, type: "memory.revised", subjectType: "note", subjectId: nu.id, payload: { kind: b.kind, supersedes: b.id, by: actor } });
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
  }
}

function clamp(n: number) {
  return Math.max(0.05, Math.min(0.98, n));
}

export async function listActiveBeliefs(db: Db, userId: string, limit = 40): Promise<MemoryNote[]> {
  return db
    .select()
    .from(memoryNotes)
    .where(and(eq(memoryNotes.userId, userId), isNull(memoryNotes.retiredAt)))
    .orderBy(desc(memoryNotes.confidence), desc(memoryNotes.createdAt))
    .limit(limit);
}

/** Words, not numbers, for the user-facing view. */
export function confidenceWord(c: number): "sure" | "fairly sure" | "guessing" {
  if (c >= 0.8) return "sure";
  if (c >= 0.5) return "fairly sure";
  return "guessing";
}

/**
 * Lumi's design notebook: what she noticed in conversations about designing
 * Coherence itself — insights, tensions, assumptions worth questioning,
 * possibilities, and shifts in thinking — kept only for the people designing it
 * (`COHERENCE_DESIGN_PARTNERS`). She adds and revises notes on her own, without
 * asking; their feedback is explicit and only ever theirs, so silence moves
 * nothing. Every change appends a revision holding the whole note after it.
 *
 * Reference material, never canon. Nothing here writes to a canonical doc, and
 * nothing turns a note into a requirement: the strongest status a note can have
 * is `endorsed`, which says they agreed with that one part in conversation.
 * See docs/architecture.md → Lumi's design notebook; docs/domain.md → design_contributions.
 */
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { type Db } from "@/db/client";
import {
  designContributionRevisions,
  designContributions,
  users,
  type DesignChange,
  type DesignContribution,
  type DesignKind,
  type DesignRevision,
  type DesignSnapshot,
  type DesignStatus,
  type DesignTarget,
  type DesignVerdict,
  type StatedSource,
  type User,
} from "@/db/schema";
import { isUuid } from "@/core/ids";
import { appendEvent } from "./events";
import { cleanContent, isNearDuplicate, screenMemory } from "./memory-rules";
import { returnedRow } from "./rows";
import { atomic } from "./tx";

/** In the order the tool schema lists them (part of the cached prefix for design partners). */
export const DESIGN_KINDS = ["insight", "tension", "assumption", "possibility", "shift"] as const satisfies readonly DesignKind[];
export const DESIGN_VERDICTS = ["endorse", "reject", "qualify", "correct"] as const satisfies readonly DesignVerdict[];
export const DESIGN_TARGETS = ["insight", "possibility"] as const satisfies readonly DesignTarget[];

const STATUS_FOR: Record<DesignVerdict, DesignStatus> = { endorse: "endorsed", reject: "rejected", qualify: "qualified", correct: "corrected" };

export const DESIGN_LIMITS = { title: 120, insight: 600, stated: 400, possibility: 500, whyItMatters: 400, uncertainty: 300, promptedBy: 200, area: 40, note: 300 } as const;
const TITLE_MIN = 3;
const INSIGHT_MIN = 12;
const MAX_RELATED = 6;

/* ------------------------------------------------------------ who it's for */

export const DESIGN_PARTNERS_KEY = "COHERENCE_DESIGN_PARTNERS";

/** The design partners named in the environment: internal user ids or Clerk user ids, comma-separated. */
export function designPartnerList(env: Record<string, string | undefined> = process.env): string[] {
  return (env[DESIGN_PARTNERS_KEY] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Is this someone designing Coherence? Only their conversations get the notebook. Everyone else's are untouched. */
export function isDesignPartner(user: Pick<User, "id" | "clerkUserId">, partners: readonly string[] = designPartnerList()): boolean {
  return partners.includes(user.id) || partners.includes(user.clerkUserId);
}

/** The design partners' rows, for the digest script. */
export async function designPartnerUsers(db: Db, partners: readonly string[] = designPartnerList()): Promise<User[]> {
  if (!partners.length) return [];
  const ids = partners.filter((p) => isUuid(p));
  return db
    .select()
    .from(users)
    .where(ids.length ? or(inArray(users.id, ids), inArray(users.clerkUserId, [...partners])) : inArray(users.clerkUserId, [...partners]));
}

/* ------------------------------------------------------------------ refs */

/** DC-12. */
export const refLabel = (ref: number) => `DC-${ref}`;

/** "DC-12", "dc12" or "12" → 12; anything else undefined. Pure. */
export function parseRef(s: string | number | null | undefined): number | undefined {
  if (typeof s === "number") return Number.isInteger(s) && s > 0 ? s : undefined;
  const m = /^\s*(?:dc[- ]?)?(\d{1,6})\s*$/i.exec(s ?? "");
  return m ? Number(m[1]) : undefined;
}

/* -------------------------------------------------------------- content */

/** One line, cut to its limit; empty is null. Pure. */
function field(s: string | null | undefined, max: number): string | null {
  if (s === null || s === undefined) return null;
  const c = cleanContent(s).slice(0, max).trim();
  return c || null;
}

/**
 * Why a note may not be kept, or null. The memory screens: no secrets (they'd
 * ride into the digest and the context), nothing that reads like an order to
 * Lumi (a stored note must never talk to her as if it were her rules). Pure.
 */
export function screenDesignText(texts: (string | null | undefined)[]): "secret" | "instruction" | null {
  for (const t of texts) {
    if (!t) continue;
    const why = screenMemory(t);
    if (why) return why;
  }
  return null;
}

/** A note's content and statuses, as a revision keeps them. Pure. */
export function snapshotOf(c: DesignContribution): DesignSnapshot {
  return {
    kind: c.kind,
    area: c.area,
    title: c.title,
    insight: c.insight,
    statedDirection: c.statedDirection,
    statedSource: c.statedSource,
    possibility: c.possibility,
    whyItMatters: c.whyItMatters,
    uncertainty: c.uncertainty,
    promptedBy: c.promptedBy,
    relatedIds: c.relatedIds,
    supersedesId: c.supersedesId,
    supersededById: c.supersededById,
    insightStatus: c.insightStatus,
    possibilityStatus: c.possibilityStatus,
    retracted: Boolean(c.retractedAt),
  };
}

/** Still the current thinking: neither replaced by a later note nor withdrawn. Pure. */
export function isCurrent(c: Pick<DesignContribution, "supersededById" | "retractedAt">): boolean {
  return !c.supersededById && !c.retractedAt;
}

/* -------------------------------------------------------------- reading */

export async function listDesignContributions(db: Db, userId: string): Promise<DesignContribution[]> {
  return db.select().from(designContributions).where(eq(designContributions.userId, userId)).orderBy(asc(designContributions.ref));
}

async function byRef(db: Db, userId: string, ref: number): Promise<DesignContribution | undefined> {
  const [row] = await db
    .select()
    .from(designContributions)
    .where(and(eq(designContributions.userId, userId), eq(designContributions.ref, ref)))
    .limit(1);
  return row;
}

/** A note's history, oldest first. */
export async function listDesignHistory(db: Db, userId: string, contributionIds?: string[]): Promise<DesignRevision[]> {
  if (contributionIds && !contributionIds.length) return [];
  return db
    .select()
    .from(designContributionRevisions)
    .where(and(eq(designContributionRevisions.userId, userId), contributionIds ? inArray(designContributionRevisions.contributionId, contributionIds) : undefined))
    .orderBy(asc(designContributionRevisions.id));
}

/** Their most recent explicit feedback, newest first — what Lumi learns from. */
export async function listRecentDesignFeedback(db: Db, userId: string, limit = 12): Promise<DesignRevision[]> {
  return db
    .select()
    .from(designContributionRevisions)
    .where(and(eq(designContributionRevisions.userId, userId), eq(designContributionRevisions.change, "feedback")))
    .orderBy(desc(designContributionRevisions.id))
    .limit(limit);
}

/** The notebook for a chat turn, or nothing: a turn never fails because the notebook couldn't be read. */
export async function loadDesignNotebookOrNothing(db: Db, userId: string): Promise<{ contributions: DesignContribution[]; feedback: DesignRevision[] }> {
  try {
    const [contributions, feedback] = await Promise.all([listDesignContributions(db, userId), listRecentDesignFeedback(db, userId)]);
    return { contributions, feedback };
  } catch (e) {
    console.error("[design] couldn't read the notebook; the turn goes on without it", e instanceof Error ? e.message : e);
    return { contributions: [], feedback: [] };
  }
}

/* -------------------------------------------------------------- writing */

type Skip = "too_short" | "secret" | "instruction" | "already_held" | "not_found" | "superseded" | "withdrawn" | "unchanged" | "no_possibility" | "changed_meanwhile";
export type DesignWrite = { contribution: DesignContribution; revision: DesignRevision; replaced?: DesignContribution } | { skipped: Skip; existing?: DesignContribution };

async function appendRevision(
  db: Db,
  row: DesignContribution,
  change: DesignChange,
  actor: "lumi" | "user",
  at: Date,
  extra: { target?: DesignTarget; verdict?: DesignVerdict; theirWords?: string | null; note?: string | null } = {},
): Promise<DesignRevision> {
  return returnedRow(
    await db
      .insert(designContributionRevisions)
      .values({
        userId: row.userId,
        contributionId: row.id,
        version: row.version,
        change,
        actor,
        target: extra.target,
        verdict: extra.verdict,
        theirWords: extra.theirWords ?? null,
        note: extra.note ?? null,
        snapshot: snapshotOf(row),
        createdAt: at,
      })
      .returning(),
    `design revision (${change})`,
  );
}

export type NewDesignNote = {
  kind: DesignKind;
  title: string;
  insight: string;
  area?: string | null;
  statedDirection?: string | null;
  /** How the stated direction was checked (the tool checks their words). Paraphrase unless said otherwise. */
  statedSource?: StatedSource | null;
  possibility?: string | null;
  whyItMatters?: string | null;
  uncertainty?: string | null;
  promptedBy?: string | null;
  sourceMessageId?: string | null;
  relatedRefs?: number[];
  /** An earlier note this one replaces: it stays, marked superseded by this one. */
  supersedesRef?: number;
};

/**
 * Lumi adds a note — no approval step: it is kept at once, `unreviewed` in every
 * part. Not kept when it's too thin, trips a screen, or says what a note already
 * says (any note, withdrawn or rejected ones included: an idea they turned down
 * isn't slipped back in under a new number).
 */
export async function contributeDesign(db: Db, userId: string, input: NewDesignNote, now: Date = new Date()): Promise<DesignWrite> {
  const title = field(input.title, DESIGN_LIMITS.title);
  const insight = field(input.insight, DESIGN_LIMITS.insight);
  if (!title || title.length < TITLE_MIN || !insight || insight.length < INSIGHT_MIN) return { skipped: "too_short" };
  const fields = {
    area: field(input.area, DESIGN_LIMITS.area),
    statedDirection: field(input.statedDirection, DESIGN_LIMITS.stated),
    possibility: field(input.possibility, DESIGN_LIMITS.possibility),
    whyItMatters: field(input.whyItMatters, DESIGN_LIMITS.whyItMatters),
    uncertainty: field(input.uncertainty, DESIGN_LIMITS.uncertainty),
    promptedBy: field(input.promptedBy, DESIGN_LIMITS.promptedBy),
  };
  const screened = screenDesignText([title, insight, ...Object.values(fields)]);
  if (screened) return { skipped: screened };

  const held = await listDesignContributions(db, userId);
  const same = held.find((c) => isNearDuplicate(c.title, title) || isNearDuplicate(c.insight, insight));
  if (same) return { skipped: "already_held", existing: same };
  const refs = new Map(held.map((c) => [c.ref, c] as const));
  const old = input.supersedesRef === undefined ? undefined : refs.get(input.supersedesRef);
  if (input.supersedesRef !== undefined && !old) return { skipped: "not_found" };
  if (old?.supersededById) return { skipped: "superseded", existing: old };
  const relatedIds = [...new Set((input.relatedRefs ?? []).map((r) => refs.get(r)?.id).filter((id): id is string => Boolean(id)))].slice(0, MAX_RELATED);

  return atomic(db, async (tx) => {
    // The next number, taken inside the insert; two notes racing for it: the loser takes the one after.
    let row: DesignContribution | undefined;
    for (let attempt = 0; attempt < 4 && !row; attempt++) {
      [row] = await tx
        .insert(designContributions)
        .values({
          userId,
          ref: sql`(select coalesce(max(${designContributions.ref}), 0) + 1 from ${designContributions} where ${designContributions.userId} = ${userId})`,
          kind: input.kind,
          title,
          insight,
          ...fields,
          statedSource: fields.statedDirection ? (input.statedSource ?? "lumi_paraphrase") : null,
          possibilityStatus: fields.possibility ? "unreviewed" : null,
          sourceMessageId: input.sourceMessageId && isUuid(input.sourceMessageId) ? input.sourceMessageId : null,
          relatedIds,
          supersedesId: old?.id ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning();
    }
    if (!row) throw new Error("contributeDesign: couldn't take a note number");
    const revision = await appendRevision(tx, row, "created", "lumi", now);

    let replaced: DesignContribution | undefined;
    if (old) {
      replaced = returnedRow(
        await tx
          .update(designContributions)
          .set({ supersededById: row.id, version: sql`${designContributions.version} + 1`, updatedAt: now })
          .where(eq(designContributions.id, old.id))
          .returning(),
        "contributeDesign (supersede)",
      );
      await appendRevision(tx, replaced, "superseded", "lumi", now, { note: `superseded by ${refLabel(row.ref)}` });
    }
    await appendEvent(tx, {
      userId,
      type: "design.contributed",
      subjectId: row.id,
      payload: { ref: row.ref, kind: row.kind, stated: row.statedSource, possibility: Boolean(row.possibility), supersedes: old?.ref ?? null },
      occurredAt: now,
    });
    return { contribution: row, revision, replaced };
  });
}

export type DesignRevisionInput = {
  title?: string | null;
  insight?: string | null;
  area?: string | null;
  statedDirection?: string | null;
  statedSource?: StatedSource | null;
  possibility?: string | null;
  whyItMatters?: string | null;
  uncertainty?: string | null;
  /** Added to the note's related notes. */
  relatedRefs?: number[];
  /** Withdraw the note: Lumi no longer thinks it. Kept, marked. */
  retract?: boolean;
  /** Why her thinking moved. */
  note?: string | null;
};

/**
 * Lumi revises her own note when her thinking moved, or withdraws it. A part
 * whose wording changes goes back to `unreviewed`: what they endorsed was the
 * old wording, and an endorsement doesn't carry over to words they haven't seen.
 * Superseded notes are history and aren't revised; supersede them again instead.
 */
export async function reviseDesign(db: Db, userId: string, ref: number, input: DesignRevisionInput, now: Date = new Date()): Promise<DesignWrite> {
  const row = await byRef(db, userId, ref);
  if (!row) return { skipped: "not_found" };
  if (row.supersededById) return { skipped: "superseded", existing: row };
  if (row.retractedAt) return { skipped: "withdrawn", existing: row };

  const set: Partial<DesignContribution> = {};
  const text = (key: "title" | "insight" | "area" | "statedDirection" | "possibility" | "whyItMatters" | "uncertainty", max: number, min = 0) => {
    const v = input[key];
    if (v === undefined) return;
    const c = field(v, max);
    if ((key === "title" || key === "insight") && (!c || c.length < min)) return; // never blanked
    if (c !== row[key]) set[key] = c as never;
  };
  text("title", DESIGN_LIMITS.title, TITLE_MIN);
  text("insight", DESIGN_LIMITS.insight, INSIGHT_MIN);
  text("area", DESIGN_LIMITS.area);
  text("statedDirection", DESIGN_LIMITS.stated);
  text("possibility", DESIGN_LIMITS.possibility);
  text("whyItMatters", DESIGN_LIMITS.whyItMatters);
  text("uncertainty", DESIGN_LIMITS.uncertainty);
  const screened = screenDesignText([set.title, set.insight, set.area, set.statedDirection, set.possibility, set.whyItMatters, set.uncertainty, input.note]);
  if (screened) return { skipped: screened };

  if ("insight" in set) set.insightStatus = "unreviewed";
  if ("possibility" in set) set.possibilityStatus = set.possibility ? "unreviewed" : null;
  if ("statedDirection" in set) set.statedSource = set.statedDirection ? (input.statedSource ?? "lumi_paraphrase") : null;
  else if (input.statedSource === "their_words" && row.statedDirection && row.statedSource !== "their_words") set.statedSource = "their_words";

  if (input.relatedRefs?.length) {
    const held = await listDesignContributions(db, userId);
    const refs = new Map(held.map((c) => [c.ref, c.id] as const));
    const added = input.relatedRefs.map((r) => refs.get(r)).filter((id): id is string => Boolean(id) && id !== row.id && !row.relatedIds.includes(id!));
    if (added.length) set.relatedIds = [...row.relatedIds, ...new Set(added)].slice(0, MAX_RELATED);
  }
  if (input.retract) set.retractedAt = now;
  if (!Object.keys(set).length) return { skipped: "unchanged", existing: row };

  return atomic(db, async (tx) => {
    const [updated] = await tx
      .update(designContributions)
      .set({ ...set, version: row.version + 1, updatedAt: now })
      .where(and(eq(designContributions.id, row.id), eq(designContributions.version, row.version)))
      .returning();
    if (!updated) return { skipped: "changed_meanwhile" as const, existing: row };
    const change: DesignChange = input.retract ? "retracted" : "revised";
    const revision = await appendRevision(tx, updated, change, "lumi", now, { note: field(input.note, DESIGN_LIMITS.note) });
    await appendEvent(tx, { userId, type: `design.${change}`, subjectId: row.id, payload: { ref: row.ref, fields: Object.keys(set) }, occurredAt: now });
    return { contribution: updated, revision };
  });
}

export type DesignFeedbackInput = {
  target: DesignTarget;
  verdict: DesignVerdict;
  /** What they said, already checked against their messages by the caller. Feedback goes on their word. */
  theirWords: string;
  note?: string | null;
  /** For qualify or correct: the part they meant (and the title), as it stands now. */
  revisedTitle?: string | null;
  revisedText?: string | null;
};

/**
 * Their explicit feedback on one part of one note. Only that part's status
 * moves: endorsing the insight (the problem) leaves the possibility (the
 * solution) as it was, and nothing touches related notes. A qualify or
 * correct can carry the part's new wording; the old stays in the history.
 */
export async function recordDesignFeedback(db: Db, userId: string, ref: number, input: DesignFeedbackInput, now: Date = new Date()): Promise<DesignWrite> {
  const theirWords = field(input.theirWords, DESIGN_LIMITS.stated);
  if (!theirWords) return { skipped: "too_short" };
  const row = await byRef(db, userId, ref);
  if (!row) return { skipped: "not_found" };

  const set: Partial<DesignContribution> = {};
  const rewording = input.verdict === "qualify" || input.verdict === "correct";
  const revisedText = rewording ? field(input.revisedText, input.target === "insight" ? DESIGN_LIMITS.insight : DESIGN_LIMITS.possibility) : null;
  const revisedTitle = rewording ? field(input.revisedTitle, DESIGN_LIMITS.title) : null;
  if (input.target === "possibility" && !row.possibility && !revisedText) return { skipped: "no_possibility", existing: row };
  const note = field(input.note, DESIGN_LIMITS.note);
  const screened = screenDesignText([theirWords, note, revisedText, revisedTitle]);
  if (screened) return { skipped: screened };

  if (revisedText && revisedText.length >= INSIGHT_MIN) set[input.target] = revisedText;
  if (revisedTitle && revisedTitle.length >= TITLE_MIN && revisedTitle !== row.title) set.title = revisedTitle;
  set[input.target === "insight" ? "insightStatus" : "possibilityStatus"] = STATUS_FOR[input.verdict];

  return atomic(db, async (tx) => {
    const [updated] = await tx
      .update(designContributions)
      .set({ ...set, version: row.version + 1, updatedAt: now })
      .where(and(eq(designContributions.id, row.id), eq(designContributions.version, row.version)))
      .returning();
    if (!updated) return { skipped: "changed_meanwhile" as const, existing: row };
    const revision = await appendRevision(tx, updated, "feedback", "user", now, { target: input.target, verdict: input.verdict, theirWords, note });
    await appendEvent(tx, { userId, type: "design.feedback", subjectId: row.id, payload: { ref: row.ref, target: input.target, verdict: input.verdict, reworded: Boolean(revisedText) }, occurredAt: now });
    return { contribution: updated, revision };
  });
}

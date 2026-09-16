/**
 * The design digest: what in Lumi's design notebook is new or changed since the
 * last digest, as a short markdown document for design and implementation work.
 * No model call — the notebook already holds Lumi's thinking; the digest only
 * arranges it: changes, corrections and withdrawals first (so a retraction of
 * something shown before is seen), then their stated direction, what they
 * endorsed, Lumi's unreviewed hypotheses, and the open questions. Nothing
 * unchanged is repeated, and a day with nothing to show makes no digest.
 *
 * A digest covers the revisions after the previous digest's `through`, up to the
 * end of the user's previous local day (today's notes wait for tomorrow). The
 * window's start is unique per user, so a retry or a second instance running the
 * same window finds the digest already made instead of making another, and the
 * next digest starts exactly where this one ends. Runs off the response on a
 * design partner's chat turn once a day (`designDigestAfter`), and from
 * `npm run design:digest -- --generate`. See docs/architecture.md → Lumi's design notebook.
 */
import { and, asc, desc, eq, gt, inArray, isNotNull, lte } from "drizzle-orm";
import { type Db } from "@/db/client";
import { designContributionRevisions, designDigests, type DesignContribution, type DesignDigest, type DesignRevision, type DesignStatus, type User } from "@/db/schema";
import { localDate } from "@/core/time";
import { isCurrent, listDesignContributions, refLabel } from "./design-contributions";
import { appendEvent } from "./events";
import { atomic } from "./tx";

/** A revision younger than this may have a neighbour still committing below its id; it waits for the next run. */
export const DIGEST_SETTLE_MS = 2 * 60_000;
const WINDOW_MAX = 500;

/* ---------------------------------------------------------------- words */

const READING: Record<DesignStatus, string> = {
  unreviewed: "unreviewed",
  endorsed: "endorsed by you",
  qualified: "qualified by you",
  corrected: "corrected by you",
  rejected: "rejected by you",
};
const POSSIBILITY: Record<DesignStatus, string> = { ...READING, unreviewed: "not endorsed" };
const VERDICT_PAST = { endorse: "endorsed", reject: "rejected", qualify: "qualified", correct: "corrected" } as const;

const line = (s: string) => s.replace(/\s+/g, " ").trim();
const day = (d: Date, timezone: string) => localDate(d, timezone);

/* -------------------------------------------------------------- the build */

export type DigestItem = {
  /** The note as it stood at the digest's last revision of it. */
  contribution: DesignContribution;
  /** Its revisions in this digest's window, oldest first. */
  changes: DesignRevision[];
  /** An earlier digest already covered a revision of it. */
  surfacedBefore: boolean;
};

type Section = "changed" | "endorsed" | "new";

/** Where a note belongs in the digest, or null when there's nothing to tell (made and withdrawn or replaced before any digest showed it). Pure. */
export function digestSection(item: DigestItem): Section | null {
  const { contribution: c, changes, surfacedBefore } = item;
  const feedback = changes.filter((r) => r.change === "feedback");
  if (!surfacedBefore && !isCurrent(c) && !feedback.length) return null;
  const turned = changes.some(
    (r) => r.change === "retracted" || r.change === "superseded" || (r.change === "feedback" && (r.verdict === "reject" || r.verdict === "correct")) || (surfacedBefore && r.change === "revised"),
  );
  if (turned) return "changed";
  if (feedback.length) return "endorsed";
  return "new";
}

function describeChange(r: DesignRevision): string {
  const note = r.note ? ` — ${line(r.note)}` : "";
  switch (r.change) {
    case "created":
      return "noted by Lumi";
    case "revised":
      return `revised by Lumi${note}`;
    case "retracted":
      return `withdrawn by Lumi${note}`;
    case "superseded":
      return r.note ? line(r.note) : "superseded";
    case "feedback": {
      const part = r.target === "possibility" ? "possibility" : "reading";
      return `you ${r.verdict ? VERDICT_PAST[r.verdict] : "commented on"} the ${part}${r.theirWords ? `: “${line(r.theirWords)}”` : ""}${r.note ? ` (${line(r.note)})` : ""}`;
    }
  }
}

type RefOf = (id: string | null | undefined) => string | undefined;

/** One note, with its layers kept apart and labelled by whose they are. Pure. */
export function noteBlock(c: DesignContribution, refOf: RefOf, timezone: string, trailer?: string): string[] {
  const flags = [c.kind, c.retractedAt ? "withdrawn by Lumi" : "", c.supersededById ? `superseded by ${refOf(c.supersededById) ?? "a later note"}` : ""].filter(Boolean);
  const out = [`- **${refLabel(c.ref)} · ${line(c.title)}** · ${flags.join(" · ")}`];
  if (c.statedDirection) out.push(c.statedSource === "their_words" ? `  - You said: “${line(c.statedDirection)}”` : `  - Your direction, as Lumi paraphrased it: ${line(c.statedDirection)}`);
  out.push(`  - Lumi's reading (${READING[c.insightStatus]}): ${line(c.insight)}`);
  if (c.whyItMatters) out.push(`  - Why it might matter (Lumi): ${line(c.whyItMatters)}`);
  if (c.possibility) out.push(`  - Possibility — Lumi's proposal, ${POSSIBILITY[c.possibilityStatus ?? "unreviewed"]}: ${line(c.possibility)}`);
  if (c.uncertainty) out.push(`  - Unresolved: ${line(c.uncertainty)}`);
  const source = [c.promptedBy ? line(c.promptedBy) : "a design conversation", c.sourceMessageId ? `message ${c.sourceMessageId}` : "", day(c.createdAt, timezone)].filter(Boolean);
  out.push(`  - Prompted by: ${source.join(" · ")}`);
  const links = [
    ...(c.relatedIds.map(refOf).filter(Boolean).length ? [`related ${c.relatedIds.map(refOf).filter(Boolean).join(", ")}`] : []),
    ...(c.supersedesId && refOf(c.supersedesId) ? [`supersedes ${refOf(c.supersedesId)}`] : []),
  ];
  if (links.length) out.push(`  - Links: ${links.join(" · ")}`);
  if (trailer) out.push(`  - ${trailer}`);
  return out;
}

/** Items grouped by area (as first written, "Across Coherence" when none), related notes next to each other. Pure. */
function byArea(items: DigestItem[]): [string, DigestItem[]][] {
  // Related notes (links or supersession) share a cluster, ordered by its lowest number.
  const parent = new Map(items.map((i) => [i.contribution.id, i.contribution.id] as const));
  const find = (id: string): string => (parent.get(id) === id ? id : find(parent.get(id)!));
  for (const { contribution: c } of items) {
    for (const other of [...c.relatedIds, c.supersedesId, c.supersededById]) if (other && parent.has(other)) parent.set(find(other), find(c.id));
  }
  const minRef = new Map<string, number>();
  for (const { contribution: c } of items) minRef.set(find(c.id), Math.min(minRef.get(find(c.id)) ?? Infinity, c.ref));
  const sorted = [...items].sort((a, b) => minRef.get(find(a.contribution.id))! - minRef.get(find(b.contribution.id))! || a.contribution.ref - b.contribution.ref);
  const groups = new Map<string, { label: string; items: DigestItem[] }>();
  for (const i of sorted) {
    const label = i.contribution.area ? i.contribution.area.charAt(0).toUpperCase() + i.contribution.area.slice(1) : "Across Coherence";
    const g = groups.get(label.toLowerCase()) ?? { label, items: [] };
    g.items.push(i);
    groups.set(label.toLowerCase(), g);
  }
  return [...groups.values()].map((g) => [g.label, g.items]);
}

/**
 * The digest's markdown, or null when nothing in the window is worth showing —
 * never a filler digest. Pure: the same window always builds the same document.
 */
export function buildDesignDigest(input: { localDate: string; from: number; through: number; items: DigestItem[]; refOf: RefOf; timezone: string }): { markdown: string | null; contributionIds: string[] } {
  const placed = input.items.map((item) => ({ item, section: digestSection(item) })).filter((x): x is { item: DigestItem; section: Section } => x.section !== null);
  if (!placed.length) return { markdown: null, contributionIds: [] };

  const out = [
    `# Coherence design digest · ${input.localDate}`,
    "",
    `Lumi's design notes that are new or changed since the last digest (revisions ${input.from + 1}–${input.through}). Reference for design and implementation work, not requirements: nothing here is canon until you put it in the canon, and nothing here was acted on. Being in a digest is not endorsement, and neither is silence. What you said, Lumi's reading and any possibility are kept apart in each note.`,
  ];
  const section = (s: Section, heading: string, intro: string, trailer: (i: DigestItem) => string) => {
    const items = placed.filter((x) => x.section === s).map((x) => x.item);
    if (!items.length) return;
    out.push("", `## ${heading}`, "", intro);
    for (const [area, group] of byArea(items)) {
      out.push("", `### ${area}`, "");
      for (const i of group) out.push(...noteBlock(i.contribution, input.refOf, input.timezone, trailer(i)));
    }
  };
  const since = (i: DigestItem) => `Since the last digest: ${i.changes.map(describeChange).join("; ")}${i.surfacedBefore ? " (an earlier digest showed this note)" : ""}`;

  section("changed", "Changed, corrected or withdrawn", "Notes whose thinking moved: your rejections and corrections, and Lumi's revisions, withdrawals and replacements — including notes an earlier digest showed.", since);

  const stated = placed.map((x) => x.item.contribution).filter((c) => c.statedDirection);
  if (stated.length) {
    out.push("", "## Your stated direction", "", "What you said that these notes rest on — yours, not Lumi's reading of it.", "");
    for (const c of stated) out.push(c.statedSource === "their_words" ? `- “${line(c.statedDirection!)}” — ${refLabel(c.ref)}` : `- ${line(c.statedDirection!)} (Lumi's paraphrase) — ${refLabel(c.ref)}`);
  }

  section(
    "endorsed",
    "Endorsed by you",
    "Parts you agreed with in conversation. Endorsed is not a requirement until it's in the canon, and it covers only the part you endorsed: not the rest of the note, and not related notes.",
    since,
  );
  section("new", "Unreviewed — Lumi's hypotheses and possibilities", "New from Lumi. Nobody has agreed with these yet.", since);

  const open = placed.map((x) => x.item.contribution).filter((c) => c.uncertainty && isCurrent(c));
  if (open.length) {
    out.push("", "## Open questions", "");
    for (const c of open) out.push(`- ${refLabel(c.ref)} · ${line(c.title)}: ${line(c.uncertainty!)}`);
  }

  return { markdown: out.join("\n") + "\n", contributionIds: placed.map((x) => x.item.contribution.id) };
}

/** A note as it stood at one of its revisions: the snapshot over the row's stable fields. Pure. */
export function asOfRevision(c: DesignContribution, r: DesignRevision): DesignContribution {
  const { retracted, ...snap } = r.snapshot;
  return { ...c, ...snap, version: r.version, retractedAt: retracted ? (c.retractedAt ?? r.createdAt) : null, updatedAt: r.createdAt };
}

/* --------------------------------------------------------------- the run */

export async function latestDesignDigest(db: Db, userId: string): Promise<DesignDigest | undefined> {
  const [row] = await db.select().from(designDigests).where(eq(designDigests.userId, userId)).orderBy(desc(designDigests.throughRevisionId)).limit(1);
  return row;
}

export type DigestResult =
  /** Nothing new has settled since the last digest. */
  | { status: "nothing" }
  | { status: "made"; digest: DesignDigest }
  /** A retry, or another run over the same window, got there first: that digest, not a second. */
  | { status: "already_made"; digest: DesignDigest }
  /** The window moved, but held nothing worth showing: no document. */
  | { status: "quiet"; digest: DesignDigest };

/** Make the next digest for this user, if there's anything to put in it. Safe to repeat and to race. */
export async function generateDesignDigest(db: Db, user: Pick<User, "id" | "timezone">, now: Date = new Date()): Promise<DigestResult> {
  const prev = await latestDesignDigest(db, user.id);
  const from = prev?.throughRevisionId ?? 0;
  const today = localDate(now, user.timezone);
  const window = await db
    .select()
    .from(designContributionRevisions)
    .where(and(eq(designContributionRevisions.userId, user.id), gt(designContributionRevisions.id, from)))
    .orderBy(asc(designContributionRevisions.id))
    .limit(WINDOW_MAX);
  // Contiguous from the watermark: stop at the first revision from today, or too young to trust the order.
  const settled: DesignRevision[] = [];
  for (const r of window) {
    if (localDate(r.createdAt, user.timezone) >= today || now.getTime() - r.createdAt.getTime() < DIGEST_SETTLE_MS) break;
    settled.push(r);
  }
  const through = settled.at(-1)?.id;
  if (through === undefined) return { status: "nothing" };

  const all = await listDesignContributions(db, user.id);
  const byId = new Map(all.map((c) => [c.id, c] as const));
  const touched = [...new Set(settled.map((r) => r.contributionId))];
  const shownBefore = new Set(
    from > 0
      ? (
          await db
            .selectDistinct({ id: designContributionRevisions.contributionId })
            .from(designContributionRevisions)
            .where(and(eq(designContributionRevisions.userId, user.id), inArray(designContributionRevisions.contributionId, touched), lte(designContributionRevisions.id, from)))
        ).map((r) => r.id)
      : [],
  );
  const items: DigestItem[] = [];
  for (const id of touched) {
    const c = byId.get(id);
    const changes = settled.filter((r) => r.contributionId === id);
    const last = changes.at(-1);
    if (c && last) items.push({ contribution: asOfRevision(c, last), changes, surfacedBefore: shownBefore.has(id) });
  }
  const refOf: RefOf = (id) => {
    const c = id ? byId.get(id) : undefined;
    return c ? refLabel(c.ref) : undefined;
  };
  const built = buildDesignDigest({ localDate: today, from, through, items, refOf, timezone: user.timezone });

  return atomic(db, async (tx) => {
    const [made] = await tx
      .insert(designDigests)
      .values({ userId: user.id, fromRevisionId: from, throughRevisionId: through, localDate: today, markdown: built.markdown, contributionIds: built.contributionIds, createdAt: now })
      .onConflictDoNothing()
      .returning();
    if (!made) {
      const [existing] = await tx
        .select()
        .from(designDigests)
        .where(and(eq(designDigests.userId, user.id), eq(designDigests.fromRevisionId, from)))
        .limit(1);
      if (!existing) return { status: "nothing" as const };
      return existing.markdown ? { status: "already_made" as const, digest: existing } : { status: "quiet" as const, digest: existing };
    }
    await appendEvent(tx, { userId: user.id, type: "design.digested", subjectId: made.id, payload: { from, through, notes: built.contributionIds.length, quiet: !built.markdown }, occurredAt: now });
    return made.markdown ? { status: "made" as const, digest: made } : { status: "quiet" as const, digest: made };
  });
}

const inflight = new Set<string>();

/**
 * Fire-and-forget for `after()` on a design partner's chat turn: once their day
 * has turned since the last digest, make the next one. Never throws; a failure
 * leaves the watermark where it was, and the next turn tries again.
 */
export async function designDigestAfter(db: Db, user: Pick<User, "id" | "timezone">, now: Date = new Date()): Promise<void> {
  if (inflight.has(user.id)) return;
  inflight.add(user.id);
  try {
    const prev = await latestDesignDigest(db, user.id);
    if (prev?.localDate === localDate(now, user.timezone)) return;
    const r = await generateDesignDigest(db, user, now);
    if (process.env.NODE_ENV !== "production" && r.status !== "nothing") console.log(`[design] digest ${r.status} through=${r.digest.throughRevisionId}`);
  } catch (e) {
    console.error("[design] digest failed; the next turn tries again", e instanceof Error ? e.message : e);
  } finally {
    inflight.delete(user.id);
  }
}

/* --------------------------------------------------------------- reading */

/** The newest digests with something in them, newest first. */
export async function listDesignDigests(db: Db, userId: string, limit = 7): Promise<DesignDigest[]> {
  return db
    .select()
    .from(designDigests)
    .where(and(eq(designDigests.userId, userId), isNotNull(designDigests.markdown)))
    .orderBy(desc(designDigests.throughRevisionId))
    .limit(limit);
}

/** Digests as one document. Pure. */
export function renderDesignDigests(digests: Pick<DesignDigest, "markdown">[]): string {
  const docs = digests.map((d) => d.markdown).filter(Boolean);
  return docs.length ? docs.join("\n---\n\n") : "No design digest yet. One is made the day after Lumi first adds a design note.\n";
}

/**
 * The whole notebook as a readable document: every note as it stands, current
 * first, then superseded and withdrawn ones, each with its history. Pure.
 */
export function renderDesignNotebook(contributions: DesignContribution[], history: DesignRevision[], timezone: string): string {
  const byId = new Map(contributions.map((c) => [c.id, c] as const));
  const refOf: RefOf = (id) => {
    const c = id ? byId.get(id) : undefined;
    return c ? refLabel(c.ref) : undefined;
  };
  const trail = (c: DesignContribution) =>
    `History: ${history
      .filter((r) => r.contributionId === c.id)
      .map((r) => `v${r.version} ${day(r.createdAt, timezone)} ${describeChange(r)}`)
      .join(" · ")}`;
  const newestFirst = [...contributions].sort((a, b) => b.ref - a.ref);
  const out = [
    "# Lumi's design notebook",
    "",
    "Every note Lumi has contributed on Coherence's design, as it stands, with its history. Reference, not canon: nothing here is a requirement. What you said, Lumi's reading and any possibility are kept apart, and a status changes only when you say something about that part.",
  ];
  const current = newestFirst.filter(isCurrent);
  const past = newestFirst.filter((c) => !isCurrent(c));
  if (!contributions.length) out.push("", "No notes yet.");
  if (current.length) {
    out.push("", "## Current", "");
    for (const c of current) out.push(...noteBlock(c, refOf, timezone, trail(c)));
  }
  if (past.length) {
    out.push("", "## Superseded and withdrawn", "");
    for (const c of past) out.push(...noteBlock(c, refOf, timezone, trail(c)));
  }
  return out.join("\n") + "\n";
}

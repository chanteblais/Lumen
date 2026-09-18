/**
 * Coherence schema — the domain model as code. See docs/domain.md for the prose.
 * Nine tables. Everything is keyed by users.id (internal UUID), never by the
 * auth provider's id. Derived judgements (stale, avoided, gap, today's
 * capacity) are computed at read time and never stored.
 *
 * Every table ends in `.enableRLS()`, with no policies: the app connects as the
 * owner, which RLS doesn't apply to, and Supabase's Data API reads nothing.
 * `rls.db.test.ts` fails on a table without it. See docs/architecture.md → Database.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/* ---------------------------------------------------------------- users */

type UserPreferences = {
  v: 1;
  session_minutes: number;
  check_in_minutes: number;
  /** Ordered list names for Lists. Absent → DEFAULT_LISTS. */
  lists?: string[];
};

export const DEFAULT_PREFERENCES: UserPreferences = { v: 1, session_minutes: 45, check_in_minutes: 15 };
export const DEFAULT_LISTS = ["School", "Work", "Personal", "Later"] as const;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  preferences: jsonb("preferences").$type<UserPreferences>().notNull().default(DEFAULT_PREFERENCES),
  createdAt: ts("created_at").notNull().defaultNow(),
  lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
  lastReflectedAt: ts("last_reflected_at"),
}).enableRLS();

/* -------------------------------------------------------- conversations */

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("main"),
    summary: text("summary"),
    /** Consolidation's watermark: messages up to it are folded into memory. No FK — a pointer into history (see domain.md). */
    summaryThroughMessageId: uuid("summary_through_message_id"),
    /** A consolidation run's lease: set before its model call, cleared when it finishes; an expired one is free to take. */
    consolidatingUntil: ts("consolidating_until"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("conversations_user_idx").on(t.userId),
    // One main conversation per user: two first visits racing can't make a second.
    uniqueIndex("conversations_user_main_idx").on(t.userId).where(sql`${t.kind} = 'main'`),
  ],
).enableRLS();

/* ------------------------------------------------------------- messages */

export type MessageRole = "user" | "assistant" | "system";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").$type<MessageRole>().notNull(),
    /** AI SDK UIMessage.parts — text, tool-*, and metadata parts. */
    parts: jsonb("parts").$type<unknown[]>().notNull(),
    formatVersion: integer("format_version").notNull().default(1),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_created_idx").on(t.conversationId, t.createdAt)],
).enableRLS();

/* ----------------------------------------------------------- intentions */

export type IntentionStatus = "open" | "done" | "dropped";
export type EffortHint = "tiny" | "small" | "medium" | "large";

export const intentions = pgTable(
  "intentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** The smallest concrete physical step. The product's centre of gravity. */
    nextAction: text("next_action"),
    note: text("note"),
    status: text("status").$type<IntentionStatus>().notNull().default("open"),
    /** Lists membership — a free label from the user's lists. Lumi infers; the user corrects. */
    list: text("list"),
    /** "~40 min". Lumi's guess unless the user said. */
    estimateMinutes: integer("estimate_minutes"),
    effortHint: text("effort_hint").$type<EffortHint>(),
    dueAt: ts("due_at"),
    sourceMessageId: uuid("source_message_id"),
    lastTouchedAt: ts("last_touched_at").notNull().defaultNow(),
    createdAt: ts("created_at").notNull().defaultNow(),
    completedAt: ts("completed_at"),
    droppedAt: ts("dropped_at"),
  },
  (t) => [
    index("intentions_user_status_idx").on(t.userId, t.status),
    index("intentions_user_touched_idx").on(t.userId, t.lastTouchedAt),
  ],
).enableRLS();

/* ------------------------------------------------------- focus_sessions */

export type SessionOutcome = "completed" | "stopped_early" | "abandoned";

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    intentionId: uuid("intention_id").references(() => intentions.id, { onDelete: "set null" }),
    goal: text("goal").notNull(),
    firstStep: text("first_step").notNull(),
    /** The strategy being tried — reflection links it to the outcome. */
    approach: text("approach"),
    plannedMinutes: integer("planned_minutes").notNull(),
    checkInMinutes: integer("check_in_minutes").notNull(),
    startedAt: ts("started_at").notNull().defaultNow(),
    endedAt: ts("ended_at"),
    outcome: text("outcome").$type<SessionOutcome>(),
  },
  (t) => [
    index("focus_sessions_user_started_idx").on(t.userId, t.startedAt),
    // One open session per user: two starts racing can't leave two running.
    uniqueIndex("focus_sessions_user_open_idx").on(t.userId).where(sql`${t.endedAt} is null`),
  ],
).enableRLS();

/* --------------------------------------------- memory_notes (beliefs) */

export type BeliefKind = "fact" | "project" | "preference" | "strategy" | "pattern" | "anti_pattern";
export type BeliefSource = "user_said" | "lumi_inferred" | "reflection";
export type RetiredReason = "user" | "contradicted" | "superseded";

export const memoryNotes = pgTable(
  "memory_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<BeliefKind>().notNull(),
    content: text("content").notNull(),
    source: text("source").$type<BeliefSource>().notNull(),
    confidence: real("confidence").notNull(),
    evidenceFor: integer("evidence_for").notNull().default(0),
    evidenceAgainst: integer("evidence_against").notNull().default(0),
    lastConfirmedAt: ts("last_confirmed_at"),
    lastContradictedAt: ts("last_contradicted_at"),
    supersedesId: uuid("supersedes_id"),
    /** The user message it came from: where they said it, or the turn Lumi noticed it. Null from Settings and reflection. */
    sourceMessageId: uuid("source_message_id"),
    retiredAt: ts("retired_at"),
    retiredReason: text("retired_reason").$type<RetiredReason>(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("memory_notes_user_active_idx").on(t.userId, t.retiredAt)],
).enableRLS();

/* ------------------------------------ the Library: episodes, threads, notes */

/**
 * Recent memory: one per stretch of conversation (a sitting, or the start of a
 * long one), written by consolidation (`core/ai/consolidate.ts`) once it's
 * over — what they talked about, and where it was left. Recent ones ride along
 * after their messages have left the transcript window. The conversation's
 * `summary_through_message_id` is the watermark: messages up to it are folded in.
 */
export const episodes = pgTable(
  "episodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    /** A few sentences, in Lumi's words. */
    summary: text("summary").notNull(),
    /** Where it was left, when something was left open. */
    leftOff: text("left_off"),
    startedAt: ts("started_at").notNull(),
    endedAt: ts("ended_at").notNull(),
    /** The last message it covers. */
    throughMessageId: uuid("through_message_id").notNull(),
    /** Threads it touched. */
    threadIds: jsonb("thread_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("episodes_user_ended_idx").on(t.userId, t.endedAt),
    // `thread_ids @> '["…"]'`: a thread's visits, and scrubbing a forgotten thread.
    index("episodes_thread_ids_idx").using("gin", t.threadIds),
  ],
).enableRLS();

/**
 * A persistent subject of the user's life that Lumi keeps an archive for — a
 * book they're writing, practicum, a theory. Not a project table and not a
 * list: intentions stay flat. A thread can sit under a broader one
 * (`parent_id`); a thread with threads under it is a section of the Library,
 * and one of those inside a section is a shelf — derived at read time
 * (`buildShelves`), never stored. Resting and archival are derived from
 * `last_discussed_at`, never stored.
 */
type ShelvedBy = "user" | "lumi";
export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** The words they use for it ("the book", "my novel"): how a mention is recognised. */
    aliases: jsonb("aliases").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    /** Lumi's quick orientation — what it is, where it stands, what's open — rewritten as notes arrive. */
    summary: text("summary"),
    summaryRevisedAt: ts("summary_revised_at"),
    /** The broader thread it belongs under ("the ferry chapter" under "the book"). Null: not shelved. Forgetting the parent leaves it loose. */
    parentId: uuid("parent_id").references((): AnyPgColumn => threads.id, { onDelete: "set null" }),
    /** Who put it there. Lumi never moves a thread they placed. */
    shelvedBy: text("shelved_by").$type<ShelvedBy>(),
    /** The last time it came up: a note filed, a summary rewritten. */
    lastDiscussedAt: ts("last_discussed_at").notNull().defaultNow(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("threads_user_discussed_idx").on(t.userId, t.lastDiscussedAt), index("threads_parent_idx").on(t.parentId)],
).enableRLS();

export type ThreadNoteKind = "idea" | "decision" | "question" | "progress" | "detail";
export type NoteSource = "user_said" | "lumi_inferred";

/** One thing worth keeping about a thread. Current unless a later note superseded it (history, not deleted). */
export const threadNotes = pgTable(
  "thread_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ThreadNoteKind>().notNull(),
    content: text("content").notNull(),
    source: text("source").$type<NoteSource>().notNull(),
    /** The user message it came from, when their words matched one. */
    sourceMessageId: uuid("source_message_id"),
    /** The episode it was filed in, when consolidation filed it. */
    episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
    /** The note that replaced this one. */
    supersededById: uuid("superseded_by_id"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("thread_notes_thread_idx").on(t.threadId, t.createdAt), index("thread_notes_user_idx").on(t.userId)],
).enableRLS();

export type Episode = typeof episodes.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type ThreadNote = typeof threadNotes.$inferSelect;

/* ------------------------------------------------------------ day_plans */

/** One persisted path per local day. See docs/today.md → How the plan is built. */
export type DayPlanJson = {
  dayLine: string;
  rightNow: { intentionId: string; firstStep: string } | null;
  afterThat: { intentionId: string }[];
  later: { intentionId: string }[];
  restCanWait: boolean;
  closingLine?: string;
  /** Lumi's one line on the card after a Not this: why what's there now fits instead. Only on a `declined` re-cut; dropped when the path advances. */
  note?: string;
};
/** Why a plan row exists. `reentry`: re-cut after the coming-back pass let things go. */
export type PlanReason = "new_day" | "first_items" | "capacity" | "declined" | "reentry" | "asked" | "priority" | "advanced" | "first_step";

export const dayPlans = pgTable(
  "day_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    localDate: text("local_date").notNull(),
    capacity: text("capacity"),
    plan: jsonb("plan").$type<DayPlanJson>().notNull(),
    reason: text("reason").$type<PlanReason>().notNull(),
    generatedAt: ts("generated_at").notNull().defaultNow(),
  },
  (t) => [index("day_plans_user_date_idx").on(t.userId, t.localDate, t.generatedAt)],
).enableRLS();

/* ----------------------------------------------------------- priorities */

/**
 * What the user said matters, in words close to theirs, over the scope they gave:
 * a week (`week_of` = that week's Monday, local) or for a while (no end). Only ever
 * their word — Lumi's own ordering is the day plan and is never stored here.
 * Whether one still holds is derived at read time (`core/domain/priorities.ts`):
 * a week's priorities simply stop holding when the week ends, with nothing to clear.
 * See docs/domain.md → priorities.
 */
export type PriorityScope = "week" | "while";
type PriorityRetiredReason = "let_go" | "superseded";

export const priorities = pgTable(
  "priorities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** "The paper matters most this week." One sentence. */
    content: text("content").notNull(),
    /** The open intention it names, if it names one. */
    intentionId: uuid("intention_id").references(() => intentions.id, { onDelete: "set null" }),
    scope: text("scope").$type<PriorityScope>().notNull(),
    /** For scope `week`: the local Monday (YYYY-MM-DD) of the week they meant. */
    weekOf: text("week_of"),
    supersedesId: uuid("supersedes_id"),
    retiredAt: ts("retired_at"),
    retiredReason: text("retired_reason").$type<PriorityRetiredReason>(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("priorities_user_active_idx").on(t.userId, t.retiredAt)],
).enableRLS();

/* ---------------------------------------------------------------- leads */

/**
 * Something Lumi noticed that might need doing — for now, in the user's recent
 * mail — that they haven't confirmed. `suggested` until they keep it (it becomes
 * an intention) or let it go. Never a count anywhere; never an inbox to clear.
 * See docs/domain.md → leads.
 */
type LeadStatus = "suggested" | "kept" | "dismissed";
export type LeadSource = "email";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    source: text("source").$type<LeadSource>().notNull().default("email"),
    /** The provider's id for the message this came from (Gmail message id). */
    sourceRef: text("source_ref").notNull(),
    /** What might need doing, in plain words. */
    title: text("title").notNull(),
    /** Lumi's one line on where it came from: "Priya asked for the draft by Friday." */
    why: text("why"),
    /** The one list it would land in if kept — Lumi's guess. */
    list: text("list"),
    dueAt: ts("due_at"),
    /** The email's identifying line — sender and subject only; the body is never stored. */
    fromName: text("from_name"),
    subject: text("subject"),
    receivedAt: ts("received_at"),
    status: text("status").$type<LeadStatus>().notNull().default("suggested"),
    /** Set when kept. */
    intentionId: uuid("intention_id").references(() => intentions.id, { onDelete: "set null" }),
    suggestedAt: ts("suggested_at").notNull().defaultNow(),
    resolvedAt: ts("resolved_at"),
  },
  (t) => [
    index("leads_user_status_idx").on(t.userId, t.status, t.suggestedAt),
    index("leads_user_ref_idx").on(t.userId, t.sourceRef),
    // A message can yield several leads, but never the same one twice (two looks racing). Titles are whitespace-normalised in code.
    uniqueIndex("leads_user_ref_title_idx").on(t.userId, t.sourceRef, sql`lower(${t.title})`),
  ],
).enableRLS();

/* ------------------------------------------------- design contributions */

/**
 * Lumi's design notebook: what she noticed in conversations about designing
 * Coherence itself — kept only for the people designing it
 * (`COHERENCE_DESIGN_PARTNERS`). Reference material, never canon: nothing here
 * is a requirement, and no code path turns a note into one. The row is the note
 * as it stands now; every change appends a revision holding the whole note after
 * it, so nothing is overwritten silently. See docs/domain.md → design_contributions.
 */
export type DesignKind = "insight" | "tension" | "assumption" | "possibility" | "shift";
/** Whose word the stated direction rests on: their words, found in their messages, or Lumi's paraphrase of them. */
export type StatedSource = "their_words" | "lumi_paraphrase";
/** Explicit feedback only. `unreviewed` until they say something about that part; silence never moves it. */
export type DesignStatus = "unreviewed" | "endorsed" | "qualified" | "corrected" | "rejected";

export const designContributions = pgTable(
  "design_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** The stable number the note is known by, per user: DC-12. */
    ref: integer("ref").notNull(),
    kind: text("kind").$type<DesignKind>().notNull(),
    /** Where in Coherence it bears, in a word or two (Today, Lumi, the Library). Free text; groups the digest. */
    area: text("area"),
    title: text("title").notNull(),
    /** Lumi's observation and what follows from it — always her reading. */
    insight: text("insight").notNull(),
    /** What they said that it rests on, when they said something. */
    statedDirection: text("stated_direction"),
    statedSource: text("stated_source").$type<StatedSource>(),
    /** A design possibility, kept apart from the insight: endorsing one never endorses the other. */
    possibility: text("possibility"),
    whyItMatters: text("why_it_matters"),
    /** What's uncertain or unresolved about it. */
    uncertainty: text("uncertainty"),
    /** What in the conversation prompted it, in a few words. */
    promptedBy: text("prompted_by"),
    /** The user message it came from. No FK — a pointer into history, like the Library's. */
    sourceMessageId: uuid("source_message_id"),
    relatedIds: jsonb("related_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    supersedesId: uuid("supersedes_id").references((): AnyPgColumn => designContributions.id, { onDelete: "set null" }),
    supersededById: uuid("superseded_by_id").references((): AnyPgColumn => designContributions.id, { onDelete: "set null" }),
    insightStatus: text("insight_status").$type<DesignStatus>().notNull().default("unreviewed"),
    /** Null when there is no possibility. */
    possibilityStatus: text("possibility_status").$type<DesignStatus>(),
    /** Lumi withdrew it herself. Kept, marked. */
    retractedAt: ts("retracted_at"),
    version: integer("version").notNull().default(1),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("design_contributions_user_ref_idx").on(t.userId, t.ref), index("design_contributions_user_updated_idx").on(t.userId, t.updatedAt)],
).enableRLS();

export type DesignChange = "created" | "revised" | "feedback" | "superseded" | "retracted";
export type DesignVerdict = "endorse" | "reject" | "qualify" | "correct";
export type DesignTarget = "insight" | "possibility";
/** A note's content and statuses after one change. */
export type DesignSnapshot = Pick<
  typeof designContributions.$inferSelect,
  "kind" | "area" | "title" | "insight" | "statedDirection" | "statedSource" | "possibility" | "whyItMatters" | "uncertainty" | "promptedBy" | "relatedIds" | "supersedesId" | "supersededById" | "insightStatus" | "possibilityStatus"
> & { retracted: boolean };

/**
 * Append-only: one row per change to a note, with the whole note after it. The
 * history of a note, and — by its monotonic id — the design digest's watermark.
 */
export const designContributionRevisions = pgTable(
  "design_contribution_revisions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    contributionId: uuid("contribution_id").notNull().references(() => designContributions.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    change: text("change").$type<DesignChange>().notNull(),
    /** `user`: their feedback. `lumi`: her own note, revision, supersession or withdrawal. */
    actor: text("actor").$type<"lumi" | "user">().notNull(),
    /** Feedback: which part they meant, and what they said of it. */
    target: text("target").$type<DesignTarget>(),
    verdict: text("verdict").$type<DesignVerdict>(),
    /** Feedback: their words, checked against their messages. */
    theirWords: text("their_words"),
    /** Why it changed: their point, or why Lumi's thinking moved. */
    note: text("note"),
    snapshot: jsonb("snapshot").$type<DesignSnapshot>().notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("design_revisions_user_idx").on(t.userId, t.id),
    // Two writers can't both make version n of one note.
    uniqueIndex("design_revisions_version_idx").on(t.contributionId, t.version),
  ],
).enableRLS();

/**
 * One design digest: what was new or changed in the notebook between two
 * revision ids. `from_revision_id` is unique per user, so a retry or a second
 * run over the same window finds the digest already made instead of making
 * another; the next digest starts where this one's `through` ends, so nothing
 * falls between them.
 */
export const designDigests = pgTable(
  "design_digests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fromRevisionId: bigint("from_revision_id", { mode: "number" }).notNull(),
    throughRevisionId: bigint("through_revision_id", { mode: "number" }).notNull(),
    /** Their local day it was made. */
    localDate: text("local_date").notNull(),
    /** Null: the window held nothing worth surfacing (a note made and withdrawn before any digest saw it). Nothing is shown. */
    markdown: text("markdown"),
    contributionIds: jsonb("contribution_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("design_digests_user_from_idx").on(t.userId, t.fromRevisionId), index("design_digests_user_through_idx").on(t.userId, t.throughRevisionId)],
).enableRLS();

export type DesignContribution = typeof designContributions.$inferSelect;
export type DesignRevision = typeof designContributionRevisions.$inferSelect;
export type DesignDigest = typeof designDigests.$inferSelect;

/* --------------------------------------------------------------- events */

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    subjectType: text("subject_type"),
    subjectId: uuid("subject_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    occurredAt: ts("occurred_at").notNull().defaultNow(),
  },
  (t) => [
    index("events_user_occurred_idx").on(t.userId, t.occurredAt),
    index("events_user_type_occurred_idx").on(t.userId, t.type, t.occurredAt),
    // Reflection claims a session once (`reflection.claimed`, inserted on conflict do nothing).
    uniqueIndex("events_reflection_claim_idx").on(t.userId, t.subjectId).where(sql`${t.type} = 'reflection.claimed'`),
  ],
).enableRLS();

export type User = typeof users.$inferSelect;
export type Intention = typeof intentions.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type MemoryNote = typeof memoryNotes.$inferSelect;
export type Event = typeof events.$inferSelect;
export type DayPlanRow = typeof dayPlans.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Priority = typeof priorities.$inferSelect;

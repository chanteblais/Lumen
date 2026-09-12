/**
 * Rali schema — the domain model as code. See docs/domain.md for the prose.
 * Seven tables. Everything is keyed by users.id (internal UUID), never by the
 * auth provider's id. Derived judgements (stale, avoided, gap, today's
 * capacity) are computed at read time and never stored.
 */
import { sql } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/* ---------------------------------------------------------------- users */

export type UserPreferences = {
  v: 1;
  session_minutes: number;
  check_in_minutes: number;
};

export const DEFAULT_PREFERENCES: UserPreferences = { v: 1, session_minutes: 45, check_in_minutes: 15 };

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  preferences: jsonb("preferences").$type<UserPreferences>().notNull().default(DEFAULT_PREFERENCES),
  createdAt: ts("created_at").notNull().defaultNow(),
  lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
  lastReflectedAt: ts("last_reflected_at"),
});

/* -------------------------------------------------------- conversations */

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("main"),
    summary: text("summary"),
    summaryThroughMessageId: uuid("summary_through_message_id"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("conversations_user_idx").on(t.userId)],
);

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
);

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
);

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
  (t) => [index("focus_sessions_user_started_idx").on(t.userId, t.startedAt)],
);

/* --------------------------------------------- memory_notes (beliefs) */

export type BeliefKind = "fact" | "project" | "preference" | "strategy" | "pattern" | "anti_pattern";
export type BeliefSource = "user_said" | "rali_inferred" | "reflection";
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
    retiredAt: ts("retired_at"),
    retiredReason: text("retired_reason").$type<RetiredReason>(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("memory_notes_user_active_idx").on(t.userId, t.retiredAt)],
);

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
  ],
);

export type User = typeof users.$inferSelect;
export type Intention = typeof intentions.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type MemoryNote = typeof memoryNotes.$inferSelect;
export type Event = typeof events.$inferSelect;

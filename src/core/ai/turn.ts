/**
 * One chat turn's logic, out of the route (code review B11) so it can be tested:
 * what a client may send (B6), the structured client events a message may carry
 * — a "Not this" from Today, a tap on the session bar or a check-in — what the
 * context block is built from, and whether the turn changed anything today's
 * path is cut from (B10). The route keeps auth, loading, streaming and saving.
 * See docs/architecture.md → API routes → `/api/chat`.
 */
import { z } from "zod";
import type { Db } from "@/db/client";
import type { Lead, MemoryNote, User } from "@/db/schema";
import { isDeclineReason } from "@/core/declines";
import type { ActivityItem } from "@/core/domain/activity";
import { messageText, type CoherenceMessageMetadata, type CoherenceUIMessage } from "@/core/domain/conversations";
import { declineIntention } from "@/core/domain/intentions";
import type { loadLibraryOrNothing } from "@/core/domain/library";
import type { Heard } from "@/core/domain/memory-rules";
import { elapsedMinutes, endFocusSession, getSession, recordCheckIn } from "@/core/domain/sessions";
import type { Snapshot } from "@/core/domain/snapshot";
import { isSessionEventResponse } from "@/core/focus";
import { isUuid } from "@/core/ids";
import type { ContextInput, SessionEventNow, StartNow } from "./context";
import type { LibraryView } from "./library-select";
import type { TurnSignals } from "./memory-select";
import type { Recut } from "./today-plan";

/* ------------------------------------------------------------ the body */

/** A brain dump or a long voice transcript fits; a runaway paste doesn't. */
export const MAX_MESSAGE_CHARS = 20_000;
export const MAX_PARTS = 8;

const Metadata = z.object({
  kind: z.string().max(40).optional(),
  intentionId: z.string().max(64).optional(),
  reason: z.string().max(200).optional(),
  sessionId: z.string().max(64).optional(),
  response: z.string().max(40).optional(),
  minute: z.number().int().min(0).max(24 * 60).optional(),
  // createdAt is not read: the server's clock stamps the message.
});

const IncomingMessage = z
  .object({
    id: z.string().max(100).optional(),
    role: z.literal("user"),
    // Text only: the clients send nothing else, and nothing else is stored or shown to the model.
    parts: z.array(z.object({ type: z.literal("text"), text: z.string().max(MAX_MESSAGE_CHARS) })).min(1).max(MAX_PARTS),
    metadata: Metadata.nullish(),
  })
  .refine((m) => {
    const chars = m.parts.reduce((n, p) => n + p.text.length, 0);
    return chars > 0 && chars <= MAX_MESSAGE_CHARS;
  });

const ChatBody = z.object({ message: IncomingMessage });

export type IncomingMessage = z.infer<typeof IncomingMessage>;

/** The new user message from a request body, or undefined when the body isn't one (the route answers 400). */
export function parseChatBody(raw: unknown): IncomingMessage | undefined {
  const r = ChatBody.safeParse(raw);
  return r.success ? r.data.message : undefined;
}

/** The message as stored: its id if it's a uuid, text parts only, and the server's time — client metadata can't move it. */
export function userMessageFrom(incoming: IncomingMessage, now: Date, newId: () => string): CoherenceUIMessage {
  return {
    id: isUuid(incoming.id) ? incoming.id : newId(),
    role: "user",
    parts: incoming.parts.map((p) => ({ type: "text" as const, text: p.text })),
    metadata: { ...(incoming.metadata ?? {}), createdAt: now.toISOString() },
  };
}

/* ---------------------------------------------------- client events */

export type ClientEvent = {
  /** This very message was a "Not this" from Today. */
  declinedNow?: { title: string; reason?: string };
  /** This very message was a tap on the session bar or a check-in (not Yep). */
  sessionEventNow?: SessionEventNow;
  /** Today's path is re-cut once the reply has streamed. */
  recut?: Recut;
  /** A session this event closed: reflected on after the reply. */
  endedSessionId?: string;
};

type EventDeps = {
  declineIntention: typeof declineIntention;
  getSession: typeof getSession;
  recordCheckIn: typeof recordCheckIn;
  endFocusSession: typeof endFocusSession;
  now: () => Date;
};
const liveEvents: EventDeps = { declineIntention, getSession, recordCheckIn, endFocusSession, now: () => new Date() };

/**
 * Record what a structured client message says before the context is built, so
 * Lumi's reply is about a fact, not a request. "Not this" records the decline
 * (and asks for a re-cut); a check-in answer is recorded, and Done / End close
 * the session in code. Anything else, or ids that don't resolve, does nothing.
 */
export async function applyClientEvent(db: Db, userId: string, meta: CoherenceMessageMetadata | undefined, deps: Partial<EventDeps> = {}): Promise<ClientEvent> {
  const d = { ...liveEvents, ...deps };
  if (meta?.kind === "declined" && isUuid(meta.intentionId)) {
    const reason = isDeclineReason(meta.reason) ? meta.reason : undefined;
    const row = await d.declineIntention(db, userId, meta.intentionId, reason);
    return row ? { declinedNow: { title: row.title, reason }, recut: { reason: "declined" } } : {};
  }
  const response = meta?.response;
  if (meta?.kind === "session_event" && isUuid(meta.sessionId) && isSessionEventResponse(response) && response !== "ok") {
    const s = await d.getSession(db, userId, meta.sessionId);
    if (!s || s.endedAt) return {};
    const minute = elapsedMinutes(s, d.now());
    if (response !== "end") await d.recordCheckIn(db, userId, s.id, response);
    const ends = response === "done" || response === "end";
    if (ends) await d.endFocusSession(db, userId, s.id, response === "done" ? "completed" : "stopped_early");
    return { sessionEventNow: { response, goal: s.goal, minute, intentionId: s.intentionId }, ...(ends ? { endedSessionId: s.id } : {}) };
  }
  return {};
}

/** "Start with Lumi" from Today is a button, not a question: the intention and the first step Today's path already chose. */
export function startNowFor(meta: CoherenceMessageMetadata | undefined, snap: Pick<Snapshot, "openIntentions" | "plan">): StartNow | undefined {
  if (meta?.kind !== "start_intention" || !isUuid(meta.intentionId)) return undefined;
  const i = snap.openIntentions.find((x) => x.id === meta.intentionId);
  if (!i) return undefined;
  const fromPlan = snap.plan?.rightNow?.intentionId === i.id ? snap.plan.rightNow.firstStep : undefined;
  return { intentionId: i.id, title: i.title, firstStep: fromPlan ?? i.nextAction, estimateMinutes: i.estimateMinutes };
}

/* --------------------------------------------------- what Lumi reads */

/** What they've actually said lately, newest last: a belief rests on their word only when its their_words is in here. */
export function userWordsFrom(all: CoherenceUIMessage[], last = 8): Heard[] {
  return all
    .filter((m) => m.role === "user")
    .slice(-last)
    .map((m) => ({ messageId: m.id, text: messageText(m) }))
    .filter((w) => w.text);
}

/** What this turn is about — for choosing beliefs and for opening Library threads. */
export function turnSignalsFor(message: CoherenceUIMessage, all: CoherenceUIMessage[], snap: Pick<Snapshot, "session">, startNow?: StartNow): TurnSignals {
  return {
    message: messageText(message),
    recent: all.slice(-7, -1).map(messageText),
    focus: [snap.session.active?.goal, snap.session.active?.firstStep, startNow?.title],
  };
}

type Library = Awaited<ReturnType<typeof loadLibraryOrNothing>>;

/** Everything the context block is built from, for one turn. `mail` undefined: mail is off, and the block has no Their mail. */
export function contextInputFor(t: {
  user: Pick<User, "displayName" | "timezone" | "createdAt">;
  /** The previous request (`requireVisit`); equal to `createdAt` on the first ever turn. */
  previous: Date;
  snap: Snapshot;
  recentActivity: ActivityItem[];
  memory: { chosen: MemoryNote[]; heldBack: boolean };
  library: { view: LibraryView<Library["threads"][number], Library["notes"][number], Library["episodes"][number]>; unavailable: boolean };
  event: ClientEvent;
  startNow?: StartNow;
  mail?: { scan?: { at: Date } | null; leads?: Lead[] };
}): ContextInput {
  const { user, snap } = t;
  return {
    displayName: user.displayName,
    timezone: user.timezone,
    // The row is created with last_seen_at = created_at, so equality means the first ever turn.
    lastSeenAt: t.previous.getTime() === user.createdAt.getTime() ? undefined : t.previous,
    sitting: snap.sitting,
    lists: snap.lists,
    openIntentions: snap.openIntentions,
    recentlyDone: snap.recentlyDone,
    recentActivity: t.recentActivity,
    beliefs: t.memory.chosen,
    memoryHeldBack: t.memory.heldBack,
    memoryUnavailable: snap.memoryUnavailable,
    library: t.library.view,
    libraryUnavailable: t.library.unavailable,
    capacity: snap.capacity,
    plan: snap.plan,
    declinedNow: t.event.declinedNow,
    declinedToday: snap.declinedToday,
    session: snap.session.active,
    lastSession: snap.session.last,
    sessionEventNow: t.event.sessionEventNow,
    startNow: t.startNow,
    mailScan: t.mail ? (t.mail.scan ? { at: t.mail.scan.at } : null) : undefined,
    leads: t.mail?.leads,
  };
}

/* ------------------------------------------------ after the reply */

/** What a turn changed, filled in as it runs; the route's `after()` hooks read it once the reply has streamed. */
export type TurnOutcome = {
  /** Tools Lumi called this turn, by name. */
  called: Set<string>;
  recut?: Recut;
  /** Today already had a path when the turn began (undefined: the turn never got that far). */
  hadPlan?: boolean;
  /** That path was cut with nothing to choose from, and there is something now (`needsFirstItems`). */
  firstItemsDue?: boolean;
  endedSessionId?: string;
  abandonedSessionId?: string;
};

/** Tool writes that can change which intentions today's path chooses from. */
export const PLAN_SHAPING_TOOLS: ReadonlySet<string> = new Set(["create_intention", "update_intention", "complete_intention", "reopen_intention", "drop_intention", "keep_lead"]);

/**
 * Whether to prime today's path after the turn: always when there is none yet
 * (or the turn failed before we knew), when it's due its first items, when
 * something asked for a re-cut, or when Lumi created, changed, closed or
 * reopened an intention. A turn of plain talk over an existing path skips the
 * snapshot reload the prime would cost.
 */
export function needsPrime(t: TurnOutcome): boolean {
  if (t.hadPlan !== true || t.firstItemsDue || t.recut) return true;
  for (const name of t.called) if (PLAN_SHAPING_TOOLS.has(name)) return true;
  return false;
}

/** The same tools, each noting its name when Lumi calls it. Descriptions and schemas are untouched (the cached prefix). */
export function watchToolCalls<T extends Record<string, object>>(tools: T, onCall: (name: string) => void): T {
  const out: Record<string, object> = {};
  for (const [name, t] of Object.entries(tools)) {
    const execute = (t as { execute?: (...args: unknown[]) => unknown }).execute;
    out[name] = execute
      ? {
          ...t,
          execute: (...args: unknown[]) => {
            onCall(name);
            return execute(...args);
          },
        }
      : t;
  }
  return out as T;
}

/** An error for the server log: its name, a short message and a status — never the request it carried (a provider error holds the prompt). */
export function describeError(e: unknown): string {
  if (!(e instanceof Error)) return `non-error thrown (${typeof e})`;
  const status = (e as { statusCode?: unknown }).statusCode;
  return `${e.name}: ${e.message.slice(0, 300)}${typeof status === "number" ? ` (status ${status})` : ""}`;
}

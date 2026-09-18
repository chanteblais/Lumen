/**
 * One chat turn's logic, out of the route (code review B11) so it can be tested:
 * what a client may send (B6), what the context block is built from, and whether
 * the turn changed anything today's path is cut from (B10). The route keeps auth,
 * loading, streaming and saving. See docs/architecture.md → API routes → `/api/chat`.
 */
import { z } from "zod";
import type { Lead, MemoryNote, User } from "@/db/schema";
import type { ActivityItem } from "@/core/domain/activity";
import { messageText, type CoherenceUIMessage } from "@/core/domain/conversations";
import type { loadLibraryOrNothing } from "@/core/domain/library";
import type { Heard } from "@/core/domain/memory-rules";
import type { Snapshot } from "@/core/domain/snapshot";
import { isUuid } from "@/core/ids";
import { parseWhere, type Where } from "@/core/places";
import type { ContextInput } from "./context";
import type { DesignNotebookView } from "./design-select";
import type { LibraryView } from "./library-select";
import type { TurnSignals } from "./memory-select";
import type { Recut } from "./today-plan";

/* ------------------------------------------------------------ the body */

/** A brain dump or a long voice transcript fits; a runaway paste doesn't. */
const MAX_MESSAGE_CHARS = 20_000;
const MAX_PARTS = 8;

// Structured handoffs (declined, session_event, start_intention) are no longer sent or read (2026-09-13,
// today-in-place); a message that still carries those fields is plain talk. createdAt is not read: the server stamps it.
const Metadata = z.object({
  kind: z.string().max(40).optional(),
  intentionId: z.string().max(64).optional(),
  reason: z.string().max(200).optional(),
});

const TextPart = z.object({ type: z.literal("text"), text: z.string().max(MAX_MESSAGE_CHARS) });
/**
 * A file shared from Home's composer (`core/shared-files.ts`): here only its shape, with a ceiling a
 * little above the largest body a function takes; its kind, that it's inline and its size are
 * `sharedFilesProblem`'s, which the route runs before anything else happens.
 */
const FilePart = z.object({ type: z.literal("file"), mediaType: z.string().max(100), url: z.string().max(6_000_000), filename: z.string().max(300).optional() });

const IncomingMessage = z
  .object({
    id: z.string().max(100).optional(),
    role: z.literal("user"),
    // Text and shared files only: the clients send nothing else, and nothing else is stored or shown to the model.
    parts: z.array(z.discriminatedUnion("type", [TextPart, FilePart])).min(1).max(MAX_PARTS),
    metadata: Metadata.nullish(),
  })
  .refine((m) => {
    const chars = m.parts.reduce((n, p) => n + (p.type === "text" ? p.text.length : 0), 0);
    return chars <= MAX_MESSAGE_CHARS && (chars > 0 || m.parts.some((p) => p.type === "file"));
  });

/**
 * Where they are as they send (`core/places.ts`, from the shared chat client): the page's path and which
 * way in. Shape-checked here; `parseWhere` then keeps only a place in the nav, and the context block says
 * it in fixed words, so nothing the client writes reaches Lumi as text.
 */
const WhereBody = z.object({ path: z.string().max(200), via: z.enum(["home", "bubble", "lists-add"]) });

const ChatBody = z.object({ message: IncomingMessage, where: WhereBody.nullish() });

type IncomingMessage = z.infer<typeof IncomingMessage>;

/** The new user message, and where they are (undefined: not said, or not a place in the nav), from a request body; undefined when the body isn't one (the route answers 400). */
export function parseChatBody(raw: unknown): { message: IncomingMessage; where?: Where } | undefined {
  const r = ChatBody.safeParse(raw);
  return r.success ? { message: r.data.message, where: parseWhere(r.data.where) } : undefined;
}

/** The message as received: its id if it's a uuid, its text and file parts with nothing extra, and the server's time — client metadata can't move it. */
export function userMessageFrom(incoming: IncomingMessage, now: Date, newId: () => string): CoherenceUIMessage {
  return {
    id: isUuid(incoming.id) ? incoming.id : newId(),
    role: "user",
    parts: incoming.parts.map((p) =>
      p.type === "text" ? { type: "text" as const, text: p.text } : { type: "file" as const, mediaType: p.mediaType, url: p.url, ...(p.filename !== undefined ? { filename: p.filename } : {}) },
    ),
    metadata: { ...(incoming.metadata ?? {}), createdAt: now.toISOString() },
  };
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

/** What this turn is about — for choosing beliefs and for opening Library threads: the message, the last few turns, and today's one thing. */
export function turnSignalsFor(message: CoherenceUIMessage, all: CoherenceUIMessage[], snap: Pick<Snapshot, "plan" | "openIntentions">): TurnSignals {
  const rightNow = snap.plan?.rightNow ? snap.openIntentions.find((i) => i.id === snap.plan!.rightNow!.intentionId) : undefined;
  return {
    message: messageText(message),
    recent: all.slice(-7, -1).map(messageText),
    focus: [rightNow?.title],
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
  mail?: { scan?: { at: Date } | null; leads?: Lead[] };
  /** The page they spoke from and which way in: a line in the context block, never in the cached prefix. */
  where?: Where;
  /** Design partners only: the design notes chosen for this turn. */
  design?: DesignNotebookView;
}): ContextInput {
  const { user, snap } = t;
  return {
    displayName: user.displayName,
    timezone: user.timezone,
    where: t.where,
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
    declinedToday: snap.declinedToday,
    // What they said matters: their word, in the trailing context block like everything else here.
    priorities: snap.priorities,
    rhythms: snap.rhythms,
    mailScan: t.mail ? (t.mail.scan ? { at: t.mail.scan.at } : null) : undefined,
    leads: t.mail?.leads,
    design: t.design,
  };
}

/* ------------------------------------------------ after the reply */

/** What a turn changed, filled in as it runs; the route's `after()` hook reads it once the reply has streamed. */
export type TurnOutcome = {
  /** Tools Lumi called this turn, by name. */
  called: Set<string>;
  recut?: Recut;
  /** Today already had a path when the turn began (undefined: the turn never got that far). */
  hadPlan?: boolean;
  /** That path was cut with nothing to choose from, and there is something now (`needsFirstItems`). */
  firstItemsDue?: boolean;
};

/** Tool writes that can change which intentions today's path chooses from. */
const PLAN_SHAPING_TOOLS: ReadonlySet<string> = new Set(["create_intention", "update_intention", "complete_intention", "reopen_intention", "drop_intention", "keep_lead"]);

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

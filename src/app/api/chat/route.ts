import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { buildContextBlock } from "@/core/ai/context";
import { consolidateAfter } from "@/core/ai/consolidate";
import { selectLibrary } from "@/core/ai/library-select";
import { selectBeliefs } from "@/core/ai/memory-select";
import { loadLibraryOrNothing } from "@/core/domain/library";
import { cachedPrefixOptions, chatModel, chatProviderOptions } from "@/core/ai/model";
import { PERSONA } from "@/core/ai/persona";
import { primeTodaysPlan, type Recut } from "@/core/ai/today-plan";
import { buildTools } from "@/core/ai/tools";
import { listRecentActivity } from "@/core/domain/activity";
import {
  ensureMainConversation,
  loadRecentMessages,
  messageText,
  saveMessage,
  type CoherenceUIMessage,
} from "@/core/domain/conversations";
import { TODAY_BOUND_MS } from "@/core/domain/events";
import { latestMailScan, listSuggestedLeads } from "@/core/domain/leads";
import { loadSnapshot } from "@/core/domain/snapshot";
import { isReentry } from "@/core/domain/users";
import { MAIL_ON } from "@/core/email/types";
import { db } from "@/db/client";
import { requireVisit } from "@/lib/auth";
import { lazyMailReader } from "@/lib/email";

export const maxDuration = 60;

const LUMI_ERROR = "I lost the thread for a second. Say that again?";

/**
 * One streamed turn. The client sends only the new user message; history
 * comes from the database so the transcript can't drift between tabs.
 * Tools execute server-side and loop up to five steps so Lumi can act, then speak.
 */
export async function POST(req: Request) {
  const { user, previous } = await requireVisit();
  // Once the turn has streamed (and any tool writes have landed), make sure
  // today's path exists — or re-cut it if this turn changed what shapes it
  // (a capacity report, letting things go on the way back, an ask for a
  // different shape of day). An ask carries Lumi's pick and wins over the plain
  // reasons; capacity reaches the planner from the snapshot regardless.
  let recut: Recut | undefined;
  after(() => primeTodaysPlan(db(), user, recut));
  // Fold finished stretches of conversation into memory — an episode per visit, notes filed
  // under Library threads, their summaries rewritten — off the response (core/ai/consolidate.ts).
  after(() => consolidateAfter(db(), user, { passes: 1 }));

  const body = (await req.json()) as { message?: CoherenceUIMessage };
  const incoming = body.message;
  if (!incoming || incoming.role !== "user" || !Array.isArray(incoming.parts)) {
    return Response.json({ error: "message required" }, { status: 400 });
  }
  const userMessage: CoherenceUIMessage = {
    id: isUuid(incoming.id) ? incoming.id : randomUUID(),
    role: "user",
    parts: incoming.parts,
    metadata: { createdAt: new Date().toISOString(), ...(incoming.metadata ?? {}) },
  };

  const conversation = await ensureMainConversation(db(), user.id);

  // Recent changes ride alongside the snapshot (chat-only: pages don't need them), so
  // a tick in the Library a minute ago is in Lumi's context before she reads the message.
  const [history, snap, recentActivity, leads, mailScan, library] = await Promise.all([
    loadRecentMessages(db(), conversation.id),
    loadSnapshot(db(), user),
    listRecentActivity(db(), user.id, new Date(Date.now() - TODAY_BOUND_MS)),
    MAIL_ON ? listSuggestedLeads(db(), user.id, 8) : undefined,
    MAIL_ON ? latestMailScan(db(), user.id) : undefined,
    // Never throws: the turn carries on without the Library if it can't be read.
    loadLibraryOrNothing(db(), user.id),
  ]);
  await saveMessage(db(), conversation.id, userMessage);
  const all = [...history.filter((m) => m.id !== userMessage.id), userMessage];

  const tools = buildTools({
    db: db(),
    userId: user.id,
    timezone: user.timezone,
    reentry: isReentry(snap.sitting),
    onPlanChange: (change) => {
      if (!recut || change.reason === "asked") recut = change;
    },
    mail: MAIL_ON ? lazyMailReader(user) : undefined,
    // What they've actually said lately: a belief rests on their word only when its their_words is in here.
    userWords: all
      .filter((m) => m.role === "user")
      .slice(-8)
      .map((m) => ({ messageId: m.id, text: messageText(m) }))
      .filter((w) => w.text),
  });

  // What this turn is about — for choosing beliefs and for opening Library threads.
  const rightNow = snap.plan?.rightNow ? snap.openIntentions.find((i) => i.id === snap.plan!.rightNow!.intentionId) : undefined;
  const turn = {
    message: messageText(userMessage),
    recent: all.slice(-7, -1).map(messageText),
    focus: [rightNow?.title],
  };
  // Not every belief rides along: what she always honours, what this turn is about, the freshest projects.
  const memory = selectBeliefs(snap.beliefs, turn);
  // The Library: threads this turn touches, opened; an index of the rest; visits that ended before the oldest message in view.
  const oldestInView = all[0]?.metadata?.createdAt;
  const libraryView = selectLibrary(library.threads, library.notes, library.episodes, turn, { now: new Date(), windowStartsAt: oldestInView ? new Date(oldestInView) : new Date() });

  const result = streamText({
    model: chatModel(),
    tools,
    stopWhen: stepCountIs(5),
    // Stop (the send button while she talks) aborts the request: she stops writing and
    // calls no further tools; onEnd keeps what she had said.
    abortSignal: req.signal,
    instructions: [
      { role: "system", content: PERSONA, providerOptions: cachedPrefixOptions },
      {
        role: "system",
        content: buildContextBlock({
          displayName: user.displayName,
          timezone: user.timezone,
          // The row is created with last_seen_at = created_at, so equality means the first ever turn.
          lastSeenAt: previous.getTime() === user.createdAt.getTime() ? undefined : previous,
          sitting: snap.sitting,
          lists: snap.lists,
          openIntentions: snap.openIntentions,
          recentlyDone: snap.recentlyDone,
          recentActivity,
          beliefs: memory.chosen,
          memoryHeldBack: memory.heldBack,
          memoryUnavailable: snap.memoryUnavailable,
          library: libraryView,
          libraryUnavailable: library.unavailable,
          capacity: snap.capacity,
          plan: snap.plan,
          declinedToday: snap.declinedToday,
          // Mail off: undefined leaves Their mail out of the context altogether.
          mailScan: MAIL_ON ? (mailScan ? { at: mailScan.at } : null) : undefined,
          leads,
        }),
      },
    ],
    messages: await convertToModelMessages(all, { tools, ignoreIncompleteToolCalls: true }),
    providerOptions: chatProviderOptions,
    onEnd: ({ totalUsage, steps }) => {
      if (process.env.NODE_ENV !== "production") {
        const d = totalUsage.inputTokenDetails;
        const calls = steps.flatMap((s) => s.toolCalls.map((t) => t.toolName));
        console.log(`[chat] tokens in=${totalUsage.inputTokens} out=${totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} cacheWrite=${d?.cacheWriteTokens ?? 0} steps=${steps.length} tools=${calls.join(",") || "-"}${recut ? ` recut=${recut.reason}` : ""}`);
      }
    },
  });

  return result.toUIMessageStreamResponse<CoherenceUIMessage>({
    originalMessages: all,
    generateMessageId: () => randomUUID(),
    sendReasoning: false,
    messageMetadata: ({ part }) => (part.type === "start" ? { createdAt: new Date().toISOString() } : undefined),
    onError: () => LUMI_ERROR,
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted && responseMessage.parts.length === 0) return;
      await saveMessage(db(), conversation.id, responseMessage);
    },
  });
}

function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { buildContextBlock } from "@/core/ai/context";
import { consolidateAfter } from "@/core/ai/consolidate";
import { selectLibrary } from "@/core/ai/library-select";
import { selectBeliefs } from "@/core/ai/memory-select";
import { cachedPrefixOptions, chatModel, chatProviderOptions } from "@/core/ai/model";
import { PERSONA } from "@/core/ai/persona";
import { stableWindow, WINDOW_LOAD, withContext } from "@/core/ai/prompt";
import { reflectAfterSession } from "@/core/ai/reflect";
import { needsFirstItems, primeTodaysPlan } from "@/core/ai/today-plan";
import { buildTools } from "@/core/ai/tools";
import {
  applyClientEvent,
  contextInputFor,
  describeError,
  needsPrime,
  parseChatBody,
  startNowFor,
  turnSignalsFor,
  userMessageFrom,
  userWordsFrom,
  watchToolCalls,
  type TurnOutcome,
} from "@/core/ai/turn";
import { listRecentActivity } from "@/core/domain/activity";
import { countMessages, ensureMainConversation, loadRecentMessages, saveMessage, type CoherenceUIMessage } from "@/core/domain/conversations";
import { TODAY_BOUND_MS } from "@/core/domain/events";
import { loadLibraryOrNothing } from "@/core/domain/library";
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
 * The turn's logic lives in `core/ai/turn.ts`; this is auth, loading, streaming and saving.
 */
export async function POST(req: Request) {
  const { user, previous } = await requireVisit();
  const incoming = parseChatBody(await req.json().catch(() => undefined));
  if (!incoming) return Response.json({ error: "message required" }, { status: 400 });

  // Off the response, once the reply has streamed, reading what the turn changed:
  // today's path primed or re-cut (a "not this", a capacity report, letting things go
  // on the way back, an ask for a different shape of day — an ask carries Lumi's pick
  // and wins over the plain reasons), skipped when the turn changed nothing it's cut from;
  // a session that closed (or that the snapshot's sweep closed as abandoned) reflected on,
  // once; finished stretches of conversation folded into memory (core/ai/consolidate.ts).
  const turn: TurnOutcome = { called: new Set() };
  after(() => (needsPrime(turn) ? primeTodaysPlan(db(), user, turn.recut) : undefined));
  after(async () => {
    const id = turn.endedSessionId ?? turn.abandonedSessionId;
    if (id) await reflectAfterSession(db(), user, id);
  });
  after(() => consolidateAfter(db(), user, { passes: 1 }));

  const userMessage = userMessageFrom(incoming, new Date(), randomUUID);
  const conversation = await ensureMainConversation(db(), user.id);

  // "Not this" from Today, or a tap on the session bar or a check-in, arrives as a real user
  // message. Code records it (and closes the session on Done / End) before the context is built.
  const event = await applyClientEvent(db(), user.id, userMessage.metadata);
  turn.recut = event.recut;
  turn.endedSessionId = event.endedSessionId;

  // Recent changes ride alongside the snapshot (chat-only: pages don't need them), so
  // a tick in the Library a minute ago is in Lumi's context before she reads the message.
  const [history, total, snap, recentActivity, leads, mailScan, library] = await Promise.all([
    loadRecentMessages(db(), conversation.id, WINDOW_LOAD),
    countMessages(db(), conversation.id),
    loadSnapshot(db(), user),
    listRecentActivity(db(), user.id, new Date(Date.now() - TODAY_BOUND_MS)),
    MAIL_ON ? listSuggestedLeads(db(), user.id, 8) : undefined,
    MAIL_ON ? latestMailScan(db(), user.id) : undefined,
    // Never throws: the turn carries on without the Library if it can't be read.
    loadLibraryOrNothing(db(), user.id),
  ]);
  await saveMessage(db(), conversation.id, userMessage);
  // A window whose start moves in steps, so the history's prefix stays cached for several turns (core/ai/prompt.ts).
  const resent = history.some((m) => m.id === userMessage.id);
  const all = stableWindow([...history.filter((m) => m.id !== userMessage.id), userMessage], total + (resent ? 0 : 1));
  turn.hadPlan = Boolean(snap.plan);
  turn.firstItemsDue = needsFirstItems(snap, user.timezone);
  if (snap.session.last?.outcome === "abandoned") turn.abandonedSessionId = snap.session.last.id;
  const startNow = startNowFor(userMessage.metadata, snap);

  const tools = watchToolCalls(
    buildTools({
      db: db(),
      userId: user.id,
      timezone: user.timezone,
      preferences: user.preferences,
      reentry: isReentry(snap.sitting),
      onPlanChange: (change) => {
        if (!turn.recut || change.reason === "asked") turn.recut = change;
      },
      onSessionEnd: (id) => {
        turn.endedSessionId ??= id;
      },
      mail: MAIL_ON ? lazyMailReader(user) : undefined,
      userWords: userWordsFrom(all),
    }),
    (name) => turn.called.add(name),
  );

  // Not every belief rides along: what she always honours, what this turn is about, the freshest projects.
  // The Library: threads this turn touches, opened; an index of the rest; visits that ended before the oldest message in view.
  const signals = turnSignalsFor(userMessage, all, snap, startNow);
  const memory = selectBeliefs(snap.beliefs, signals);
  const oldestInView = all[0]?.metadata?.createdAt;
  const libraryView = selectLibrary(library.threads, library.notes, library.episodes, signals, { now: new Date(), windowStartsAt: oldestInView ? new Date(oldestInView) : new Date() });
  const context = buildContextBlock(
    contextInputFor({
      user,
      previous,
      snap,
      recentActivity,
      memory,
      library: { view: libraryView, unavailable: library.unavailable },
      event,
      startNow,
      // Mail off: undefined leaves Their mail out of the context altogether.
      mail: MAIL_ON ? { scan: mailScan ?? null, leads } : undefined,
    }),
  );

  const result = streamText({
    model: chatModel(),
    tools,
    stopWhen: stepCountIs(5),
    // Stop (the send button while she talks) aborts the request: she stops writing and
    // calls no further tools; onEnd keeps what she had said.
    abortSignal: req.signal,
    // The persona (and the tools) are the cached prefix; the conversation follows, and the context block,
    // which changes every turn, rides last on the newest user message so the history before it caches too.
    instructions: [{ role: "system", content: PERSONA, providerOptions: cachedPrefixOptions }],
    messages: withContext(await convertToModelMessages(all, { tools, ignoreIncompleteToolCalls: true }), context),
    providerOptions: chatProviderOptions,
    onEnd: ({ totalUsage, steps }) => {
      if (process.env.NODE_ENV !== "production") {
        const d = totalUsage.inputTokenDetails;
        const calls = steps.flatMap((s) => s.toolCalls.map((t) => t.toolName));
        console.log(`[chat] tokens in=${totalUsage.inputTokens} out=${totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} cacheWrite=${d?.cacheWriteTokens ?? 0} steps=${steps.length} tools=${calls.join(",") || "-"}${turn.recut ? ` recut=${turn.recut.reason}` : ""}${event.sessionEventNow ? ` session_event=${event.sessionEventNow.response}` : ""}${startNow ? " start_intention" : ""}${turn.endedSessionId ? " reflect=pending" : ""}`);
      }
    },
  });

  return result.toUIMessageStreamResponse<CoherenceUIMessage>({
    originalMessages: all,
    generateMessageId: () => randomUUID(),
    sendReasoning: false,
    messageMetadata: ({ part }) => (part.type === "start" ? { createdAt: new Date().toISOString() } : undefined),
    onError: (error) => {
      // Ids only: a provider error carries the prompt, which is their conversation.
      console.error(`[chat] turn failed user=${user.id} conversation=${conversation.id} message=${userMessage.id}: ${describeError(error)}`);
      return LUMI_ERROR;
    },
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted && responseMessage.parts.length === 0) return;
      try {
        await saveMessage(db(), conversation.id, responseMessage);
      } catch (e) {
        console.error(`[chat] couldn't save Lumi's reply user=${user.id} conversation=${conversation.id} message=${responseMessage.id}: ${describeError(e)}`);
      }
    },
  });
}

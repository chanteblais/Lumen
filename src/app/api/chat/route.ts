import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { buildContextBlock, type SessionEventNow, type StartNow } from "@/core/ai/context";
import { cachedPrefixOptions, chatModel, chatProviderOptions } from "@/core/ai/model";
import { PERSONA } from "@/core/ai/persona";
import { reflectAfterSession } from "@/core/ai/reflect";
import { primeTodaysPlan, type Recut } from "@/core/ai/today-plan";
import { buildTools } from "@/core/ai/tools";
import { isDeclineReason } from "@/core/declines";
import { listRecentActivity } from "@/core/domain/activity";
import {
  ensureMainConversation,
  loadRecentMessages,
  saveMessage,
  type CoherenceUIMessage,
} from "@/core/domain/conversations";
import { TODAY_BOUND_MS } from "@/core/domain/events";
import { declineIntention } from "@/core/domain/intentions";
import { latestMailScan, listSuggestedLeads } from "@/core/domain/leads";
import { elapsedMinutes, endFocusSession, getSession, recordCheckIn } from "@/core/domain/sessions";
import { loadSnapshot } from "@/core/domain/snapshot";
import { isReentry } from "@/core/domain/users";
import { isSessionEventResponse } from "@/core/focus";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";
import { lazyMailReader } from "@/lib/email";

export const maxDuration = 60;

const LUMI_ERROR = "I lost the thread for a second. Say that again?";

/**
 * One streamed turn. The client sends only the new user message; history
 * comes from the database so the transcript can't drift between tabs.
 * Tools execute server-side and loop up to five steps so Lumi can act, then speak.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const previous = await recordVisit(user);
  // Once the turn has streamed (and any tool writes have landed), make sure
  // today's path exists — or re-cut it if this turn changed what shapes it
  // (a "not this", a capacity report, letting things go on the way back, an ask
  // for a different shape of day). An ask carries Lumi's pick and wins over
  // the plain reasons; declines and capacity reach the planner from the
  // snapshot regardless of which reason is recorded.
  let recut: Recut | undefined;
  after(() => primeTodaysPlan(db(), user, recut));
  // A session that closed during this turn (Done / End tap, end_focus_session, or
  // replaced by a new one) is reflected on once the reply has streamed — as is
  // one the snapshot's sweep just closed as abandoned (reflection runs once per session).
  let endedSessionId: string | undefined;
  let abandonedSessionId: string | undefined;
  after(async () => {
    const id = endedSessionId ?? abandonedSessionId;
    if (id) await reflectAfterSession(db(), user, id);
  });

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

  // "Not this" from Today arrives as a real user message with the reason in
  // metadata. Record it before the context is built, so Lumi answers the reason.
  let declinedNow: { title: string; reason?: string } | undefined;
  const meta = userMessage.metadata;
  if (meta?.kind === "declined" && isUuid(meta.intentionId)) {
    const reason = isDeclineReason(meta.reason) ? meta.reason : undefined;
    const row = await declineIntention(db(), user.id, meta.intentionId, reason);
    if (row) {
      declinedNow = { title: row.title, reason };
      recut = { reason: "declined" };
    }
  }

  // A tap on the session's check-in or End arrives the same way. Code records
  // it — and closes the session on Done / End — before Lumi sees the message,
  // so her one line is about a fact, not a request. (Yep never gets here.)
  let sessionEventNow: SessionEventNow | undefined;
  if (meta?.kind === "session_event" && isUuid(meta.sessionId) && isSessionEventResponse(meta.response) && meta.response !== "ok") {
    const s = await getSession(db(), user.id, meta.sessionId);
    if (s && !s.endedAt) {
      const minute = elapsedMinutes(s);
      if (meta.response !== "end") await recordCheckIn(db(), user.id, s.id, meta.response);
      if (meta.response === "done" || meta.response === "end") {
        await endFocusSession(db(), user.id, s.id, meta.response === "done" ? "completed" : "stopped_early");
        endedSessionId = s.id;
      }
      sessionEventNow = { response: meta.response, goal: s.goal, minute, intentionId: s.intentionId };
    }
  }

  // Recent changes ride alongside the snapshot (chat-only: pages don't need them), so
  // a tick in the Library a minute ago is in Lumi's context before she reads the message.
  const [history, snap, recentActivity, leads, mailScan] = await Promise.all([
    loadRecentMessages(db(), conversation.id),
    loadSnapshot(db(), user),
    listRecentActivity(db(), user.id, new Date(Date.now() - TODAY_BOUND_MS)),
    listSuggestedLeads(db(), user.id, 8),
    latestMailScan(db(), user.id),
  ]);
  await saveMessage(db(), conversation.id, userMessage);
  const all = [...history.filter((m) => m.id !== userMessage.id), userMessage];
  if (snap.session.last?.outcome === "abandoned") abandonedSessionId = snap.session.last.id;

  // "Start with Lumi" from Today is a button, not a question: tell Lumi so, with
  // the first step Today's path already chose, so she opens the session instead of asking.
  let startNow: StartNow | undefined;
  if (meta?.kind === "start_intention" && isUuid(meta.intentionId)) {
    const i = snap.openIntentions.find((x) => x.id === meta.intentionId);
    if (i) {
      const fromPlan = snap.plan?.rightNow?.intentionId === i.id ? snap.plan.rightNow.firstStep : undefined;
      startNow = { intentionId: i.id, title: i.title, firstStep: fromPlan ?? i.nextAction, estimateMinutes: i.estimateMinutes };
    }
  }

  const tools = buildTools({
    db: db(),
    userId: user.id,
    timezone: user.timezone,
    preferences: user.preferences,
    reentry: isReentry(snap.sitting),
    onPlanChange: (change) => {
      if (!recut || change.reason === "asked") recut = change;
    },
    onSessionEnd: (id) => {
      endedSessionId ??= id;
    },
    mail: lazyMailReader(user),
  });

  const result = streamText({
    model: chatModel(),
    tools,
    stopWhen: stepCountIs(5),
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
          beliefs: snap.beliefs,
          capacity: snap.capacity,
          plan: snap.plan,
          declinedNow,
          declinedToday: snap.declinedToday,
          session: snap.session.active,
          lastSession: snap.session.last,
          sessionEventNow,
          startNow,
          mailScan: mailScan ? { at: mailScan.at } : null,
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
        console.log(`[chat] tokens in=${totalUsage.inputTokens} out=${totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} cacheWrite=${d?.cacheWriteTokens ?? 0} steps=${steps.length} tools=${calls.join(",") || "-"}${recut ? ` recut=${recut.reason}` : ""}${sessionEventNow ? ` session_event=${sessionEventNow.response}` : ""}${startNow ? " start_intention" : ""}${endedSessionId ? " reflect=pending" : ""}`);
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

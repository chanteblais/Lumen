import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { buildContextBlock } from "@/core/ai/context";
import { cachedPrefixOptions, chatModel, chatProviderOptions } from "@/core/ai/model";
import { PERSONA } from "@/core/ai/persona";
import { primeTodaysPlan, type RecutReason } from "@/core/ai/today-plan";
import { buildTools } from "@/core/ai/tools";
import { isDeclineReason } from "@/core/declines";
import {
  ensureMainConversation,
  loadRecentMessages,
  saveMessage,
  type LumenUIMessage,
} from "@/core/domain/conversations";
import { declineIntention } from "@/core/domain/intentions";
import { loadSnapshot } from "@/core/domain/snapshot";
import { isReentry } from "@/core/domain/users";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";

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
  // (a "not this", a capacity report, letting things go on the way back).
  let recut: RecutReason | undefined;
  after(() => primeTodaysPlan(db(), user, recut));

  const body = (await req.json()) as { message?: LumenUIMessage };
  const incoming = body.message;
  if (!incoming || incoming.role !== "user" || !Array.isArray(incoming.parts)) {
    return Response.json({ error: "message required" }, { status: 400 });
  }
  const userMessage: LumenUIMessage = {
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
      recut = "declined";
    }
  }

  const [history, snap] = await Promise.all([loadRecentMessages(db(), conversation.id), loadSnapshot(db(), user)]);
  await saveMessage(db(), conversation.id, userMessage);
  const all = [...history.filter((m) => m.id !== userMessage.id), userMessage];

  const tools = buildTools({
    db: db(),
    userId: user.id,
    timezone: user.timezone,
    reentry: isReentry(snap.sitting),
    onPlanChange: (reason) => {
      recut ??= reason;
    },
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
          beliefs: snap.beliefs,
          capacity: snap.capacity,
          plan: snap.plan,
          declinedNow,
          declinedToday: snap.declinedToday,
        }),
      },
    ],
    messages: await convertToModelMessages(all, { tools, ignoreIncompleteToolCalls: true }),
    providerOptions: chatProviderOptions,
    onEnd: ({ totalUsage, steps }) => {
      if (process.env.NODE_ENV !== "production") {
        const d = totalUsage.inputTokenDetails;
        const calls = steps.flatMap((s) => s.toolCalls.map((t) => t.toolName));
        console.log(`[chat] tokens in=${totalUsage.inputTokens} out=${totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} cacheWrite=${d?.cacheWriteTokens ?? 0} steps=${steps.length} tools=${calls.join(",") || "-"}${recut ? ` recut=${recut}` : ""}`);
      }
    },
  });

  return result.toUIMessageStreamResponse<LumenUIMessage>({
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

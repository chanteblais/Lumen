import { randomUUID } from "node:crypto";
import { convertToModelMessages, streamText } from "ai";
import { buildContextBlock } from "@/core/ai/context";
import { cachedPrefixOptions, chatModel, chatProviderOptions } from "@/core/ai/model";
import { PERSONA } from "@/core/ai/persona";
import {
  ensureMainConversation,
  loadRecentMessages,
  saveMessage,
  type LumenUIMessage,
} from "@/core/domain/conversations";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";

export const maxDuration = 60;

const RALI_ERROR = "I lost the thread for a second. Say that again?";

/**
 * One streamed turn. The client sends only the new user message; history
 * comes from the database so the transcript can't drift between tabs.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const lastSeenAt = await recordVisit(user);

  const body = (await req.json()) as { message?: LumenUIMessage };
  const incoming = body.message;
  if (!incoming || incoming.role !== "user" || !Array.isArray(incoming.parts)) {
    return Response.json({ error: "message required" }, { status: 400 });
  }
  const userMessage: LumenUIMessage = {
    id: isUuid(incoming.id) ? incoming.id : randomUUID(),
    role: "user",
    parts: incoming.parts,
    metadata: { createdAt: new Date().toISOString() },
  };

  const conversation = await ensureMainConversation(db(), user.id);
  const history = await loadRecentMessages(db(), conversation.id);
  await saveMessage(db(), conversation.id, userMessage);
  const all = [...history.filter((m) => m.id !== userMessage.id), userMessage];

  const result = streamText({
    model: chatModel(),
    instructions: [
      { role: "system", content: PERSONA, providerOptions: cachedPrefixOptions },
      {
        role: "system",
        content: buildContextBlock({
          displayName: user.displayName,
          timezone: user.timezone,
          lastSeenAt: lastSeenAt.getTime() === user.lastSeenAt.getTime() ? undefined : lastSeenAt,
        }),
      },
    ],
    messages: await convertToModelMessages(all),
    providerOptions: chatProviderOptions,
    onEnd: ({ totalUsage }) => {
      if (process.env.NODE_ENV !== "production") {
        const d = totalUsage.inputTokenDetails;
        console.log(`[chat] tokens in=${totalUsage.inputTokens} out=${totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} cacheWrite=${d?.cacheWriteTokens ?? 0}`);
      }
    },
  });

  return result.toUIMessageStreamResponse<LumenUIMessage>({
    originalMessages: all,
    generateMessageId: () => randomUUID(),
    sendReasoning: false,
    messageMetadata: ({ part }) => (part.type === "start" ? { createdAt: new Date().toISOString() } : undefined),
    onError: () => RALI_ERROR,
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted && responseMessage.parts.length === 0) return;
      await saveMessage(db(), conversation.id, responseMessage);
    },
  });
}

function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

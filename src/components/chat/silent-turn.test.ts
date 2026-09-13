import { describe, expect, it } from "vitest";
import { Chat } from "@ai-sdk/react";
import { streamText, type UIMessage } from "ai";
import { MockLanguageModelV4, convertArrayToReadableStream } from "ai/test";
import { hasReply, latestReply } from "@/core/ai/reply";

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 0, text: 0, reasoning: 0 } };
const EARLIER: UIMessage[] = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "Let's start: the chapter" }] },
  { id: "a1", role: "assistant", parts: [{ type: "step-start" }, { type: "text", text: "Started. I'm here." }] },
];

/** A held chat (as `useHeldChat` makes) whose next turn is a mock model streaming `chunks`; `withMessageId` as the chat route streams it. */
function chatWhoseNextTurn(chunks: unknown[], withMessageId: boolean) {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: convertArrayToReadableStream([{ type: "stream-start", warnings: [] }, ...chunks, { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage }]) }) as never,
  });
  const stream = () => streamText({ model, prompt: "yep" }).toUIMessageStream(withMessageId ? { generateMessageId: () => "a2" } : {});
  return new Chat<UIMessage>({ messages: EARLIER, transport: { sendMessages: async () => stream(), reconnectToStream: async () => null } });
}

// What Home, the speech bubble and the add-line see when Lumi says nothing.
describe("a silent turn in a held chat", () => {
  const silences = [
    ["no parts at all", []],
    ["an empty text block", [{ type: "text-start", id: "t" }, { type: "text-end", id: "t" }]],
  ] as const;

  it.each(silences)("with %s, streamed as the route does: lands ready, and her reply shows nothing", async (_, chunks) => {
    const chat = chatWhoseNextTurn([...chunks], true);
    await chat.sendMessage({ text: "yep" });
    expect(chat.status).toBe("ready"); // the pending state closes: dots gone, "Lumi's on it…" back to "Anything else?"
    const reply = latestReply(chat.messages);
    expect(reply?.id).toBe("a2");
    expect(reply && hasReply(reply)).toBe(false);
  });

  it("with no message id and no parts, the chat adds no message — and her earlier line isn't taken for the answer", async () => {
    const chat = chatWhoseNextTurn([], false);
    await chat.sendMessage({ text: "yep" });
    expect(chat.status).toBe("ready");
    expect(chat.messages.at(-1)?.role).toBe("user");
    expect(latestReply(chat.messages)).toBeUndefined();
  });
});

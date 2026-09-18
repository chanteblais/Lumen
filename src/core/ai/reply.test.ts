import { describe, expect, it } from "vitest";
import { readUIMessageStream, streamText, type UIMessage } from "ai";
import { MockLanguageModelV4, convertArrayToReadableStream } from "ai/test";
import { hasReply, latestReply } from "./reply";

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 0, text: 0, reasoning: 0 } };

/** One turn of a mock model that streams `chunks`, as the chat route hands it on: what `onEnd` saves, and what a client reads. */
async function turn(chunks: unknown[]) {
  const model = new MockLanguageModelV4({
    doStream: async () => ({ stream: convertArrayToReadableStream([{ type: "stream-start", warnings: [] }, ...chunks, { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage }]) }) as never,
  });
  let ended: { responseMessage: UIMessage; isAborted: boolean } | undefined;
  const stream = streamText({ model, prompt: "yep" }).toUIMessageStream({ onEnd: (e) => void (ended = e) });
  let read: UIMessage | undefined;
  for await (const m of readUIMessageStream({ stream })) read = m;
  if (!ended) throw new Error("the stream never ended");
  return { saved: ended.responseMessage, isAborted: ended.isAborted, read };
}

const text = (t: string) => [{ type: "text-start", id: "t" }, { type: "text-delta", id: "t", delta: t }, { type: "text-end", id: "t" }];

describe("hasReply", () => {
  it("is false for what a silent turn leaves behind", () => {
    expect(hasReply({ parts: [] })).toBe(false);
    expect(hasReply({ parts: [{ type: "step-start" }] })).toBe(false);
    expect(hasReply({ parts: [{ type: "step-start" }, { type: "text", text: "" }] })).toBe(false);
    expect(hasReply({ parts: [{ type: "step-start" }, { type: "text", text: " \n " }] })).toBe(false);
  });
  it("is true for words, or for something she did without a word", () => {
    expect(hasReply({ parts: [{ type: "step-start" }, { type: "text", text: "Here." }] })).toBe(true);
    expect(hasReply({ parts: [{ type: "step-start" }, { type: "tool-add_intention", toolCallId: "c1", state: "output-available", input: {}, output: {} }] })).toBe(true);
    expect(hasReply({ parts: [{ type: "dynamic-tool", toolName: "x", toolCallId: "c1", state: "input-available", input: {} }] })).toBe(true);
  });
});

describe("latestReply", () => {
  const u = { role: "user" as const };
  const a = { role: "assistant" as const };
  it("is the newest message when it is hers", () => {
    expect(latestReply([u, a, u, a])).toBe(a);
  });
  it("is nothing while your message is the newest — never her earlier line", () => {
    expect(latestReply([u, a, u])).toBeUndefined();
    expect(latestReply([])).toBeUndefined();
  });
});

// The shapes the AI SDK actually streams: a silent turn is not aborted and still has a part,
// which is why the route's old `isAborted && parts.length === 0` saved it.
describe("a silent turn through the AI SDK", () => {
  it("leaves a step-start only — not a reply", async () => {
    const { saved, isAborted } = await turn([]);
    expect(isAborted).toBe(false);
    expect(saved.parts).toEqual([{ type: "step-start" }]);
    expect(hasReply(saved)).toBe(false);
  });
  it("or an empty text block — not a reply, on the server or the client", async () => {
    const { saved, read } = await turn([{ type: "text-start", id: "t" }, { type: "text-end", id: "t" }]);
    expect(saved.parts.map((p) => p.type)).toEqual(["step-start", "text"]);
    expect(hasReply(saved)).toBe(false);
    expect(read && hasReply(read)).toBe(false);
  });
  it("while a turn with words is one", async () => {
    const { saved, read } = await turn(text("I'm here."));
    expect(hasReply(saved)).toBe(true);
    expect(read && hasReply(read)).toBe(true);
  });
});

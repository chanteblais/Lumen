import { describe, expect, it } from "vitest";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import type { Intention } from "@/db/schema";
import { contextInputFor, describeError, needsPrime, parseChatBody, turnSignalsFor, userMessageFrom, userWordsFrom, watchToolCalls } from "./turn";

const ID = "0b8c4f7e-2d1a-4c3b-9e8f-7a6b5c4d3e2f";
const text = (t: string) => ({ type: "text", text: t });

describe("parseChatBody", () => {
  it("takes a user message of text parts", () => {
    const m = parseChatBody({ id: "chat", message: { id: ID, role: "user", parts: [text("hi")], metadata: { createdAt: "2026-09-13T12:00:00Z" } } });
    expect(m?.parts).toEqual([text("hi")]);
  });

  it("takes a shared file as the composer sends it, with or without words", () => {
    const file = { type: "file", mediaType: "image/png", url: "data:image/png;base64,iVBORw0KGgo=", filename: "note.png" };
    expect(parseChatBody({ message: { role: "user", parts: [text("what's this?"), file] } })?.parts).toEqual([text("what's this?"), file]);
    expect(parseChatBody({ message: { role: "user", parts: [file] } })?.parts).toEqual([file]);
    const m = userMessageFrom(parseChatBody({ message: { role: "user", parts: [{ ...file, providerMetadata: { x: 1 } }] } })!, new Date(), () => ID);
    expect(m.parts).toEqual([file]);
  });

  it("refuses anything else: no message, another role, a non-text part, nothing said, too much said", () => {
    for (const body of [
      undefined,
      "{",
      {},
      { message: { role: "assistant", parts: [text("hi")] } },
      { message: { role: "user", parts: [{ type: "tool-remember", input: {} }] } },
      { message: { role: "user", parts: [text("hi"), { type: "data-shared-file", data: { name: "x", kind: "text" } }] } },
      { message: { role: "user", parts: [{ type: "file", url: "data:text/plain,hi" }] } },
      { message: { role: "user", parts: [] } },
      { message: { role: "user", parts: [text("")] } },
      { message: { role: "user", parts: [text("x".repeat(20_001))] } },
      { message: { role: "user", parts: Array.from({ length: 9 }, () => text("a")) } },
      { message: { role: "user", parts: [text("hi")], metadata: { kind: "x".repeat(41) } } },
    ]) {
      expect(parseChatBody(body), JSON.stringify(body)?.slice(0, 80)).toBeUndefined();
    }
  });
});

describe("userMessageFrom", () => {
  it("keeps a uuid id, drops extra part fields, and stamps the server's time over the client's", () => {
    const now = new Date("2026-09-13T12:00:00Z");
    const incoming = parseChatBody({ message: { id: ID, role: "user", parts: [{ type: "text", text: "hi", providerMetadata: { x: 1 } }], metadata: { createdAt: "2000-01-01T00:00:00Z" } } })!;
    const m = userMessageFrom(incoming, now, () => "fresh");
    expect(m).toEqual({ id: ID, role: "user", parts: [text("hi")], metadata: { createdAt: now.toISOString() } });
    expect(userMessageFrom({ ...incoming, id: "not-a-uuid" }, now, () => "fresh").id).toBe("fresh");
  });
});

describe("what the turn reads", () => {
  it("hears only their last eight messages with text", () => {
    const msgs: CoherenceUIMessage[] = Array.from({ length: 20 }, (_, i) => ({ id: `m${i}`, role: i % 2 ? "assistant" : "user", parts: [text(i === 18 ? "" : `said ${i}`)] }) as CoherenceUIMessage);
    expect(userWordsFrom(msgs).map((w) => w.messageId)).toEqual(["m4", "m6", "m8", "m10", "m12", "m14", "m16"]);
  });

  it("is about the message, the last few turns and today's one thing", () => {
    const msgs = [0, 1, 2].map((i) => ({ id: `m${i}`, role: "user", parts: [text(`said ${i}`)] }) as CoherenceUIMessage);
    const open = [{ id: ID, title: "Edit chapter 3" }] as Intention[];
    const plan = { dayLine: "", rightNow: { intentionId: ID, firstStep: "Open the doc" }, afterThat: [], later: [], restCanWait: false };
    expect(turnSignalsFor(msgs[2], msgs, { plan, openIntentions: open })).toEqual({ message: "said 2", recent: ["said 0", "said 1"], focus: ["Edit chapter 3"] });
    expect(turnSignalsFor(msgs[2], msgs, { plan: undefined, openIntentions: open }).focus).toEqual([undefined]);
  });

  it("builds the context input: no last-seen on the first ever turn, and no mail section while mail is off", () => {
    const createdAt = new Date("2026-09-01T00:00:00Z");
    const snap = { sitting: undefined, lists: [], openIntentions: [], recentlyDone: [], memoryUnavailable: false, capacity: undefined, plan: undefined, declinedToday: [] } as never;
    const base = { user: { displayName: "C", timezone: "UTC", createdAt }, snap, recentActivity: [], memory: { chosen: [], heldBack: false }, library: { view: { open: [], index: [], moreThreads: false, episodes: [] }, unavailable: false } };
    const first = contextInputFor({ ...base, previous: createdAt });
    expect(first.lastSeenAt).toBeUndefined();
    expect(first.mailScan).toBeUndefined();
    const later = contextInputFor({ ...base, previous: new Date("2026-09-12T00:00:00Z"), mail: { scan: null, leads: [] } });
    expect(later.lastSeenAt?.toISOString()).toBe("2026-09-12T00:00:00.000Z");
    expect(later.mailScan).toBeNull();
  });
});

describe("after the reply", () => {
  it("primes today's path only when the turn could have changed it (B10)", () => {
    expect(needsPrime({ called: new Set() })).toBe(true); // never learned whether a plan exists
    expect(needsPrime({ called: new Set(), hadPlan: false })).toBe(true);
    expect(needsPrime({ called: new Set(["recall_memory", "remember"]), hadPlan: true })).toBe(false);
    expect(needsPrime({ called: new Set(["create_intention"]), hadPlan: true })).toBe(true);
    expect(needsPrime({ called: new Set(), hadPlan: true, firstItemsDue: true })).toBe(true);
    expect(needsPrime({ called: new Set(), hadPlan: true, recut: { reason: "capacity" } })).toBe(true);
  });

  it("notes each tool Lumi calls without touching what the model sees", async () => {
    const called: string[] = [];
    const tools = { a: { description: "A", inputSchema: {}, execute: async (x: number) => x + 1 }, b: { description: "B", inputSchema: {} } };
    const watched = watchToolCalls(tools, (n) => called.push(n));
    expect(await watched.a.execute(1)).toBe(2);
    expect(called).toEqual(["a"]);
    expect({ ...watched.a, execute: undefined }).toEqual({ ...tools.a, execute: undefined });
    expect(watched.b).toBe(tools.b);
  });

  it("describes an error without the request it carried", () => {
    const e = Object.assign(new Error("Bad request"), { statusCode: 400, requestBodyValues: { input: "their whole conversation" } });
    expect(describeError(e)).toBe("Error: Bad request (status 400)");
    expect(describeError("nope")).toBe("non-error thrown (string)");
  });
});

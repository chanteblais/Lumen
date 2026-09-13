import { describe, expect, it, vi } from "vitest";
import { DECLINE_REASON_KEYS } from "@/core/declines";
import type { CoherenceUIMessage } from "@/core/domain/conversations";
import type { Db } from "@/db/client";
import type { FocusSession, Intention } from "@/db/schema";
import { applyClientEvent, contextInputFor, describeError, needsPrime, parseChatBody, startNowFor, userMessageFrom, userWordsFrom, watchToolCalls } from "./turn";

const ID = "0b8c4f7e-2d1a-4c3b-9e8f-7a6b5c4d3e2f";
const SESSION = "1c9d5a8f-3e2b-4d4c-8f9a-8b7c6d5e4f3a";
const db = {} as Db;
const text = (t: string) => ({ type: "text", text: t });

describe("parseChatBody", () => {
  it("takes a user message of text parts", () => {
    const m = parseChatBody({ id: "chat", message: { id: ID, role: "user", parts: [text("hi")], metadata: { kind: "declined", intentionId: ID } } });
    expect(m?.parts).toEqual([text("hi")]);
    expect(m?.metadata?.kind).toBe("declined");
  });

  it("refuses anything else: no message, another role, a non-text part, nothing said, too much said", () => {
    for (const body of [
      undefined,
      "{",
      {},
      { message: { role: "assistant", parts: [text("hi")] } },
      { message: { role: "user", parts: [{ type: "tool-remember", input: {} }] } },
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
    const incoming = parseChatBody({ message: { id: ID, role: "user", parts: [{ type: "text", text: "hi", providerMetadata: { x: 1 } }], metadata: { createdAt: "2000-01-01T00:00:00Z", kind: "declined" } } })!;
    const m = userMessageFrom(incoming, now, () => "fresh");
    expect(m).toEqual({ id: ID, role: "user", parts: [text("hi")], metadata: { kind: "declined", createdAt: now.toISOString() } });
    expect(userMessageFrom({ ...incoming, id: "not-a-uuid" }, now, () => "fresh").id).toBe("fresh");
  });
});

describe("applyClientEvent", () => {
  const session = (over: Partial<FocusSession> = {}) => ({ id: SESSION, goal: "Edit chapter 3", intentionId: ID, startedAt: new Date("2026-09-13T11:40:00Z"), endedAt: null, ...over }) as FocusSession;
  const deps = () => ({
    declineIntention: vi.fn(async () => ({ title: "Call the bank" }) as Intention),
    getSession: vi.fn(async () => session()),
    recordCheckIn: vi.fn(async () => session()),
    endFocusSession: vi.fn(async () => session()),
    now: () => new Date("2026-09-13T12:00:00Z"),
  });

  it("records a Not this with a known reason, and asks for a re-cut", async () => {
    const d = deps();
    const reason = DECLINE_REASON_KEYS[0];
    expect(await applyClientEvent(db, "u", { kind: "declined", intentionId: ID, reason }, d)).toEqual({ declinedNow: { title: "Call the bank", reason }, recut: { reason: "declined" } });
    expect(d.declineIntention).toHaveBeenCalledWith(db, "u", ID, reason);
    // An unknown reason is recorded as none; an id that isn't one does nothing.
    await applyClientEvent(db, "u", { kind: "declined", intentionId: ID, reason: "because" }, d);
    expect(d.declineIntention).toHaveBeenLastCalledWith(db, "u", ID, undefined);
    expect(await applyClientEvent(db, "u", { kind: "declined", intentionId: "nope" }, d)).toEqual({});
  });

  it("records a check-in answer; Done and End close the session in code", async () => {
    const stuck = deps();
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "stuck" }, stuck)).toEqual({ sessionEventNow: { response: "stuck", goal: "Edit chapter 3", minute: 20, intentionId: ID } });
    expect(stuck.recordCheckIn).toHaveBeenCalledWith(db, "u", SESSION, "stuck");
    expect(stuck.endFocusSession).not.toHaveBeenCalled();

    const done = deps();
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "done" }, done)).toMatchObject({ endedSessionId: SESSION, sessionEventNow: { response: "done" } });
    expect(done.endFocusSession).toHaveBeenCalledWith(db, "u", SESSION, "completed");

    const end = deps();
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "end" }, end)).toMatchObject({ endedSessionId: SESSION });
    expect(end.recordCheckIn).not.toHaveBeenCalled();
    expect(end.endFocusSession).toHaveBeenCalledWith(db, "u", SESSION, "stopped_early");
  });

  it("ignores Yep, an unknown answer, and a session already over or not theirs", async () => {
    const d = deps();
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "ok" }, d)).toEqual({});
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "bored" }, d)).toEqual({});
    d.getSession.mockResolvedValueOnce(session({ endedAt: new Date() }));
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "done" }, d)).toEqual({});
    d.getSession.mockResolvedValueOnce(undefined as unknown as FocusSession);
    expect(await applyClientEvent(db, "u", { kind: "session_event", sessionId: SESSION, response: "done" }, d)).toEqual({});
    expect(d.endFocusSession).not.toHaveBeenCalled();
    expect(await applyClientEvent(db, "u", undefined, d)).toEqual({});
  });
});

describe("startNowFor", () => {
  const open = [{ id: ID, title: "Edit chapter 3", nextAction: "Open the doc", estimateMinutes: 25 }] as Intention[];
  it("takes the first step from today's path when it's the one on it, else the intention's next action", () => {
    const plan = { dayLine: "", rightNow: { intentionId: ID, firstStep: "Read the last paragraph" }, afterThat: [], later: [], restCanWait: false };
    expect(startNowFor({ kind: "start_intention", intentionId: ID }, { openIntentions: open, plan })).toEqual({ intentionId: ID, title: "Edit chapter 3", firstStep: "Read the last paragraph", estimateMinutes: 25 });
    expect(startNowFor({ kind: "start_intention", intentionId: ID }, { openIntentions: open, plan: undefined })?.firstStep).toBe("Open the doc");
    expect(startNowFor({ kind: "start_intention", intentionId: SESSION }, { openIntentions: open, plan: undefined })).toBeUndefined();
    expect(startNowFor({ kind: "declined", intentionId: ID }, { openIntentions: open, plan: undefined })).toBeUndefined();
  });
});

describe("what the turn reads", () => {
  it("hears only their last eight messages with text", () => {
    const msgs: CoherenceUIMessage[] = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, role: i % 2 ? "assistant" : "user", parts: [text(i === 8 ? "" : `said ${i}`)] }) as CoherenceUIMessage);
    expect(userWordsFrom(msgs).map((w) => w.messageId)).toEqual(["m0", "m2", "m4", "m6"]);
  });

  it("builds the context input: no last-seen on the first ever turn, and no mail section while mail is off", () => {
    const createdAt = new Date("2026-09-01T00:00:00Z");
    const snap = { sitting: undefined, lists: [], openIntentions: [], recentlyDone: [], memoryUnavailable: false, capacity: undefined, plan: undefined, declinedToday: [], session: { active: undefined, last: undefined } } as never;
    const base = { user: { displayName: "C", timezone: "UTC", createdAt }, snap, recentActivity: [], memory: { chosen: [], heldBack: false }, library: { view: { open: [], index: [], moreThreads: false, episodes: [] }, unavailable: false }, event: {} };
    const first = contextInputFor({ ...base, previous: createdAt });
    expect(first.lastSeenAt).toBeUndefined();
    expect(first.mailScan).toBeUndefined();
    const later = contextInputFor({ ...base, previous: new Date("2026-09-12T00:00:00Z"), mail: { scan: null, leads: [] }, event: { declinedNow: { title: "X" } } });
    expect(later.lastSeenAt?.toISOString()).toBe("2026-09-12T00:00:00.000Z");
    expect(later.mailScan).toBeNull();
    expect(later.declinedNow).toEqual({ title: "X" });
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

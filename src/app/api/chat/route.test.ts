/**
 * The chat route on a real Postgres (PGlite), with the model, the auth gate and
 * Next's `after()` stood in: a bad body is a 400 with nothing scheduled; a "Not
 * this" and a session tap are recorded before Lumi reads the turn; the path is
 * primed only when the turn could have changed it; the server stamps the time.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DECLINE_REASON_KEYS } from "@/core/declines";
import { createIntention } from "@/core/domain/intentions";
import { savePlan } from "@/core/domain/plans";
import { getSession, startFocusSession } from "@/core/domain/sessions";
import { localDate } from "@/core/time";
import type { Db } from "@/db/client";
import { events, type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";

let testDb: Db;
let close: () => Promise<void>;
let user: User;
const afters: (() => unknown)[] = [];
const streamCalls: Record<string, unknown>[] = [];
let responseOptions: Record<string, (...args: never[]) => unknown> & { originalMessages?: { metadata?: { createdAt?: string } }[] };
const prime = vi.fn();
const reflect = vi.fn();
const consolidate = vi.fn();

vi.mock("next/server", () => ({ after: (fn: () => unknown) => void afters.push(fn) }));
vi.mock("@/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/auth", () => ({ requireVisit: async () => ({ user, previous: new Date(Date.now() - 3_600_000) }) }));
vi.mock("@/lib/email", () => ({ lazyMailReader: () => async () => undefined }));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  streamText: (args: Record<string, unknown>) => {
    streamCalls.push(args);
    return {
      toUIMessageStreamResponse: (opts: typeof responseOptions) => {
        responseOptions = opts;
        return new Response("streamed");
      },
    };
  },
}));
vi.mock("@/core/ai/today-plan", async (importOriginal) => ({ ...(await importOriginal<object>()), primeTodaysPlan: (...a: unknown[]) => prime(...a) }));
vi.mock("@/core/ai/reflect", async (importOriginal) => ({ ...(await importOriginal<object>()), reflectAfterSession: (...a: unknown[]) => reflect(...a) }));
vi.mock("@/core/ai/consolidate", async (importOriginal) => ({ ...(await importOriginal<object>()), consolidateAfter: (...a: unknown[]) => consolidate(...a) }));

const { POST } = await import("./route");

beforeAll(async () => {
  ({ db: testDb, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});
beforeEach(async () => {
  user = await createTestUser(testDb, "Chat");
  afters.length = 0;
  streamCalls.length = 0;
  prime.mockReset();
  reflect.mockReset();
  consolidate.mockReset();
});

const post = (body: unknown) => POST(new Request("http://test/api/chat", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
const say = (text: string, metadata?: Record<string, unknown>) => post({ id: "chat", message: { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text }], metadata } });
const runAfters = async () => {
  for (const fn of afters) await fn();
};
/** Everything the model was handed this turn, as text — wherever the context block sits. */
const sentToModel = () => JSON.stringify(streamCalls.at(-1));

describe("POST /api/chat", () => {
  it("answers a bad body with a 400 and schedules nothing", async () => {
    for (const body of ["{not json", {}, { message: { role: "assistant", parts: [{ type: "text", text: "hi" }] } }, { message: { role: "user", parts: [{ type: "tool-remember" }] } }]) {
      const res = await post(body);
      expect(res.status).toBe(400);
    }
    expect(afters).toHaveLength(0);
    expect(streamCalls).toHaveLength(0);
  });

  it("records a Not this before Lumi reads the turn, and re-cuts the path after it", async () => {
    const i = await createIntention(testDb, user.id, { title: "Call the bank" });
    const reason = DECLINE_REASON_KEYS[0];
    expect((await say("Not this", { kind: "declined", intentionId: i.id, reason })).status).toBe(200);
    const declined = await testDb.select().from(events).where(and(eq(events.userId, user.id), eq(events.type, "intention.declined")));
    expect(declined).toHaveLength(1);
    expect(sentToModel()).toContain('They tapped Not this on \\"Call the bank\\"');
    await runAfters();
    expect(prime).toHaveBeenCalledWith(testDb, user, { reason: "declined" });
    expect(consolidate).toHaveBeenCalledWith(testDb, user, { passes: 1 });
  });

  it("closes a session on Done before Lumi answers, and reflects on it after", async () => {
    const { session } = await startFocusSession(testDb, user.id, { goal: "Edit chapter 3", firstStep: "Open the doc", plannedMinutes: 45, checkInMinutes: 15 });
    await say("Done", { kind: "session_event", sessionId: session.id, response: "done" });
    const closed = await getSession(testDb, user.id, session.id);
    expect(closed?.outcome).toBe("completed");
    expect(sentToModel()).toContain("They tapped Done on the check-in");
    await runAfters();
    expect(reflect).toHaveBeenCalledWith(testDb, user, session.id);
  });

  it("skips priming after plain talk over a path that exists, and primes once Lumi saves something", async () => {
    const i = await createIntention(testDb, user.id, { title: "Water the fern" });
    await savePlan(testDb, user.id, localDate(new Date(), user.timezone), { dayLine: "One thing.", rightNow: { intentionId: i.id, firstStep: "Fill the can" }, afterThat: [], later: [], restCanWait: false }, "new_day");
    await say("how's it going");
    await runAfters();
    expect(prime).not.toHaveBeenCalled();

    afters.length = 0;
    await say("I need to oil the gate");
    const tools = streamCalls.at(-1)!.tools as Record<string, { execute: (input: unknown, opts: unknown) => Promise<unknown> }>;
    await tools.create_intention.execute({ title: "Oil the gate" }, { toolCallId: "t1", messages: [] });
    await runAfters();
    expect(prime).toHaveBeenCalledTimes(1);
  });

  it("stamps the server's time on the message, whatever the client says", async () => {
    await say("hello", { createdAt: "2000-01-01T00:00:00.000Z" });
    const stamped = responseOptions.originalMessages?.at(-1)?.metadata?.createdAt;
    expect(stamped).not.toBe("2000-01-01T00:00:00.000Z");
    expect(Math.abs(new Date(stamped!).getTime() - Date.now())).toBeLessThan(60_000);
  });

  it("logs a failed turn by ids only, and a reply it couldn't save without throwing", async () => {
    await say("my secret plan is to sleep");
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const reply = (responseOptions.onError as (e: unknown) => string)(Object.assign(new Error("upstream"), { requestBodyValues: { input: "my secret plan is to sleep" } }));
    expect(reply).toBe("I lost the thread for a second. Say that again?");
    expect(String(logged.mock.calls[0][0])).toContain(`user=${user.id}`);
    expect(String(logged.mock.calls[0][0])).not.toContain("secret plan");
    // A reply whose conversation row is gone can't be saved: logged, not thrown.
    await expect((responseOptions.onEnd as (e: unknown) => Promise<void>)({ responseMessage: { id: "not-a-uuid", role: "assistant", parts: [{ type: "text", text: "ok" }] }, isAborted: false })).resolves.toBeUndefined();
    logged.mockRestore();
  });
});

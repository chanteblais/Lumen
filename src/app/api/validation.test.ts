/**
 * Bad input to the small routes is answered before any query: a malformed id or
 * body is a 400 (the beliefs page keeps its "not found" 404 for an id), never a
 * 500 from the database. The domain is never reached, so it is stood in.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const reached = vi.fn();
vi.mock("@/db/client", () => ({ db: () => ({}) }));
vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ id: "u1", timezone: "UTC", preferences: {} }) }));
vi.mock("@/core/domain/leads", () => ({ keepLead: (...a: unknown[]) => reached("keep", ...a), dismissLead: (...a: unknown[]) => reached("dismiss", ...a) }));
vi.mock("@/core/domain/memory", () => ({ applyBeliefOps: (...a: unknown[]) => reached("beliefs", ...a), loadBeliefsOrNothing: (...a: unknown[]) => reached("load beliefs", ...a) }));
vi.mock("@/core/domain/intentions", () => ({ getIntention: async (...a: unknown[]) => reached("intention", ...a) }));
vi.mock("@/core/ai/breakdown", () => ({ breakDown: async (...a: unknown[]) => reached("break down", ...a) }));

const leads = await import("./leads/[id]/route");
const beliefs = await import("./beliefs/[id]/route");
const steps = await import("./intentions/[id]/steps/route");

const ID = "0b8c4f7e-2d1a-4c3b-9e8f-7a6b5c4d3e2f";
const req = (body: unknown) => new Request("http://test", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => reached.mockReset());

describe("bad input never reaches the domain", () => {
  it("leads: a malformed id, a non-JSON body or an unknown action is a 400", async () => {
    expect((await leads.PATCH(req({ action: "keep" }), params("nope"))).status).toBe(400);
    expect((await leads.PATCH(req("{"), params(ID))).status).toBe(400);
    expect((await leads.PATCH(req({ action: "archive" }), params(ID))).status).toBe(400);
    expect(reached).not.toHaveBeenCalled();
  });

  it("beliefs: a malformed id is not found; a correction needs its content", async () => {
    expect((await beliefs.PATCH(req({ content: "x" }), params("nope"))).status).toBe(404);
    expect((await beliefs.DELETE(req({}), params("nope"))).status).toBe(404);
    expect((await beliefs.PATCH(req({ content: 42 }), params(ID))).status).toBe(400);
    expect((await beliefs.PATCH(req("{"), params(ID))).status).toBe(400);
    expect(reached).not.toHaveBeenCalled();
  });

  it("steps: a malformed id or a bad body is a 400, before any query or model call", async () => {
    expect((await steps.POST(req({}), params("not-a-uuid"))).status).toBe(400);
    expect((await steps.POST(req("{"), params(ID))).status).toBe(400);
    expect((await steps.POST(req({ smallerThan: "not-an-array" }), params(ID))).status).toBe(400);
    expect((await steps.POST(req({ smallerThan: [1, 2] }), params(ID))).status).toBe(400);
    expect(reached).not.toHaveBeenCalled();
  });

  it("steps: a good body goes on to look the intention up (not found here), and no model call", async () => {
    expect((await steps.POST(req({}), params(ID))).status).toBe(404);
    expect((await steps.POST(req({ smallerThan: ["Find the login"] }), params(ID))).status).toBe(404);
    expect(reached.mock.calls.map((c) => c[0])).toEqual(["intention", "intention"]);
  });
});

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
vi.mock("@/core/domain/memory", () => ({ applyBeliefOps: (...a: unknown[]) => reached("beliefs", ...a) }));

const leads = await import("./leads/[id]/route");
const beliefs = await import("./beliefs/[id]/route");

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
});

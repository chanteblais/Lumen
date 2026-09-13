/**
 * The page corrections route on a real Postgres (PGlite): every action, what a
 * bad id or body gets (400, never a 500), and the date typed as it's said.
 * Only the auth gate and the database handle are stood in.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createIntention, getIntention } from "@/core/domain/intentions";
import { startOfLocalDay } from "@/core/due-date";
import { localDate } from "@/core/time";
import type { Db } from "@/db/client";
import type { User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";

let testDb: Db;
let close: () => Promise<void>;
let user: User;
vi.mock("@/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/auth", () => ({ requireUser: async () => user }));

const { PATCH } = await import("./route");

beforeAll(async () => {
  ({ db: testDb, close } = await openTestDb());
  user = { ...(await createTestUser(testDb, "Iris")), timezone: "America/Vancouver" };
}, 60_000);
afterAll(async () => {
  await close();
});

const patch = (id: string, body: unknown) =>
  PATCH(new Request(`http://test/api/intentions/${id}`, { method: "PATCH", body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ id }) });

describe("PATCH /api/intentions/[id]", () => {
  it("refuses a malformed id, a body that isn't JSON, and an unknown action with a 400", async () => {
    const i = await createIntention(testDb, user.id, { title: "Water the fern" });
    expect((await patch("not-an-id", { action: "complete" })).status).toBe(400);
    expect((await patch(i.id, "{not json")).status).toBe(400);
    const unknown = await patch(i.id, { action: "explode" });
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toEqual({ error: "action must be complete, reopen, move, date, decline, first_step or drop" });
    expect((await patch(i.id, { action: "move", list: 7 })).status).toBe(400);
    expect((await patch(i.id, { action: "first_step", text: "   " })).status).toBe(400);
    expect((await patch(i.id, { action: "decline", reason: 42 })).status).toBe(400);
  });

  it("sets a first step from Break it down, and declines only their own", async () => {
    const i = await createIntention(testDb, user.id, { title: "Tax forms" });
    expect(await (await patch(i.id, { action: "first_step", text: "Find the login" })).json()).toEqual({ id: i.id, next_action: "Find the login" });
    const other = await createTestUser(testDb, "Else");
    const theirs = await createIntention(testDb, other.id, { title: "Not yours" });
    expect((await patch(theirs.id, { action: "decline", reason: "too_big" })).status).toBe(404);
  });

  it("completes, reopens, moves and lets go — and says not found for someone else's", async () => {
    const i = await createIntention(testDb, user.id, { title: "Oil the gate" });
    expect(await (await patch(i.id, { action: "complete" })).json()).toEqual({ id: i.id, status: "done" });
    expect(await (await patch(i.id, { action: "reopen" })).json()).toEqual({ id: i.id, status: "open" });
    const lists = user.preferences.lists?.length ? user.preferences.lists : undefined;
    const moved = await patch(i.id, { action: "move", list: lists?.[0] ?? "Personal" });
    expect(moved.status).toBe(200);
    expect((await patch(i.id, { action: "move", list: "Not a list of theirs" })).status).toBe(400);
    expect(await (await patch(i.id, { action: "drop" })).json()).toEqual({ id: i.id, status: "dropped" });

    const other = await createTestUser(testDb, "Other");
    const theirs = await createIntention(testDb, other.id, { title: "Not yours" });
    expect((await patch(theirs.id, { action: "complete" })).status).toBe(404);
  });

  it("reads a date typed as it's said as 00:00 that day where they are, takes it off when empty, and says unreadable otherwise", async () => {
    const i = await createIntention(testDb, user.id, { title: "Send the draft" });
    const res = await patch(i.id, { action: "date", text: "tomorrow" });
    expect(res.status).toBe(200);
    const today = localDate(new Date(), user.timezone);
    const [y, m, d] = today.split("-").map(Number);
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
    expect((await getIntention(testDb, user.id, i.id))?.dueAt?.toISOString()).toBe(startOfLocalDay(tomorrow, user.timezone).toISOString());

    expect((await patch(i.id, { action: "date", text: "someday maybe" })).status).toBe(422);
    expect(await (await patch(i.id, { action: "date", text: "" })).json()).toEqual({ id: i.id, due_at: null });
    expect((await getIntention(testDb, user.id, i.id))?.dueAt).toBeNull();
  });
});

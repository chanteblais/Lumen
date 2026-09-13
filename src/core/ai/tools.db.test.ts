/**
 * The intention, capacity and reshape tools on a real Postgres (PGlite):
 * what each writes, what it tells the route (a re-cut), and the
 * shape of a refusal — `{ error }`, never a throw, so the turn survives.
 * Belief and Library tools are covered in memory.db.test.ts and library.db.test.ts.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getIntention } from "@/core/domain/intentions";
import type { Db } from "@/db/client";
import { events, memoryNotes, type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { buildTools, type ToolContext } from "./tools";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const toolsFor = (user: User, over: Partial<ToolContext> = {}) => buildTools({ db, userId: user.id, timezone: "America/Vancouver", ...over });

type Callable = { execute?: (input: never, options: never) => unknown };
async function call(t: Callable, input: object): Promise<Record<string, unknown>> {
  return (await t.execute!(input as never, { toolCallId: "test", messages: [] } as never)) as Record<string, unknown>;
}

describe("intention tools", () => {
  it("create_intention saves a date only when one is named; update_intention leaves it, sets it or takes it off", async () => {
    const u = await createTestUser(db, "Due");
    const tools = toolsFor(u);
    const undated = await call(tools.create_intention, { title: "Water the fern", due_at: null });
    expect((await getIntention(db, u.id, String(undated.id)))?.dueAt).toBeNull();

    const dated = await call(tools.create_intention, { title: "Send the draft", due_at: "2026-09-18T00:00:00-07:00" });
    const id = String(dated.id);
    expect((await getIntention(db, u.id, id))?.dueAt?.toISOString()).toBe("2026-09-18T07:00:00.000Z");

    // Absent: untouched. A value: moved. null: taken off.
    expect(await call(tools.update_intention, { id, title: "Send Priya the draft" })).toMatchObject({ changed: ["title"] });
    expect((await getIntention(db, u.id, id))?.dueAt?.toISOString()).toBe("2026-09-18T07:00:00.000Z");
    await call(tools.update_intention, { id, due_at: "2026-09-20T15:30:00-07:00" });
    expect((await getIntention(db, u.id, id))?.dueAt?.toISOString()).toBe("2026-09-20T22:30:00.000Z");
    await call(tools.update_intention, { id, due_at: null });
    expect((await getIntention(db, u.id, id))?.dueAt).toBeNull();
  });

  it("refuses an id that isn't theirs with { error }, for every intention tool", async () => {
    const u = await createTestUser(db, "Nope");
    const other = await createTestUser(db, "Owner");
    const theirs = await call(toolsFor(other).create_intention, { title: "Not yours" });
    const tools = toolsFor(u);
    for (const [name, input] of [
      ["update_intention", { id: theirs.id, title: "Mine now" }],
      ["complete_intention", { id: theirs.id }],
      ["reopen_intention", { id: theirs.id }],
      ["drop_intention", { id: theirs.id }],
    ] as const) {
      expect(await call(tools[name], input), name).toEqual({ error: "not found" });
    }
  });

  it("drop_intention re-cuts the path only during the coming-back pass", async () => {
    const u = await createTestUser(db, "Back");
    const everyday = vi.fn();
    const a = await call(toolsFor(u, { onPlanChange: everyday }).create_intention, { title: "Old thing" });
    await call(toolsFor(u, { onPlanChange: everyday }).drop_intention, { id: a.id });
    expect(everyday).not.toHaveBeenCalled();

    const comingBack = vi.fn();
    const b = await call(toolsFor(u).create_intention, { title: "Stale thing" });
    expect(await call(toolsFor(u, { reentry: true, onPlanChange: comingBack }).drop_intention, { id: b.id, reason: "not relevant" })).toMatchObject({ status: "dropped" });
    expect(comingBack).toHaveBeenCalledWith({ reason: "reentry" });
  });
});

describe("capacity and reshape", () => {
  it("report_capacity records the report and asks for a re-cut", async () => {
    const u = await createTestUser(db, "Cap");
    const onPlanChange = vi.fn();
    expect(await call(toolsFor(u, { onPlanChange }).report_capacity, { level: "low", flags: ["tired"] })).toEqual({ level: "low" });
    expect(onPlanChange).toHaveBeenCalledWith({ reason: "capacity" });
    const rows = await db.select().from(events).where(and(eq(events.userId, u.id), eq(events.type, "capacity.reported")));
    expect(rows).toHaveLength(1);
  });

  it("reshape_today writes nothing and hands the ask, with Lumi's pick, to the route", async () => {
    const u = await createTestUser(db, "Shape");
    const onPlanChange = vi.fn();
    const pick = "0b8c4f7e-2d1a-4c3b-9e8f-7a6b5c4d3e2f";
    expect(await call(toolsFor(u, { onPlanChange }).reshape_today, { ask: "something easy", right_now: pick, first_step: "Open the doc" })).toEqual({ ok: true, ask: "something easy" });
    expect(onPlanChange).toHaveBeenCalledWith({ reason: "asked", ask: { text: "something easy", rightNowId: pick, firstStep: "Open the doc" } });
    expect(await db.select().from(events).where(eq(events.userId, u.id))).toHaveLength(0);
  });
});

describe("refusals", () => {
  it("a belief op on an id it can't use comes back as words Lumi can act on", async () => {
    const u = await createTestUser(db, "Err");
    const missing = "0b8c4f7e-2d1a-4c3b-9e8f-7a6b5c4d3e2f";
    expect(await call(toolsFor(u).confirm_belief, { id: missing })).toEqual({ error: "not found — use an id from the context or recall_memory" });
  });

  it("a write that throws is an { error } with its message, not a failed turn", async () => {
    const u = await createTestUser(db, "Boom");
    const broken = { ...db, transaction: () => Promise.reject(new Error("connection reset")) } as unknown as Db;
    const r = await call(buildTools({ db: broken, userId: u.id, timezone: "UTC" }).create_intention, { title: "Anything" });
    expect(r).toEqual({ error: expect.any(String) });
  });

  it("remember never starts a guess above 0.6, whatever confidence the model asks for (B3)", async () => {
    const u = await createTestUser(db, "Guess");
    const r = await call(toolsFor(u).remember, { kind: "pattern", content: "Writes best before noon.", source: "lumi_inferred", confidence: 0.95 });
    expect(r).toMatchObject({ held_as: "your guess" });
    const [row] = await db.select().from(memoryNotes).where(eq(memoryNotes.id, String(r.id)));
    expect(row!.confidence).toBeLessThanOrEqual(0.6);
  });
});

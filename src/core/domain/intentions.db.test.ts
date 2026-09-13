/**
 * Intention writes on a real Postgres (PGlite, migrations applied): each move
 * happens once, a repeated one changes nothing, and the timestamps follow the status.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { events } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { completeIntention, createIntention, dropIntention, getIntention, reopenIntention, updateIntention } from "./intentions";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const eventsOf = async (userId: string, type: string) => db.select().from(events).where(and(eq(events.userId, userId), eq(events.type, type)));
const tick = () => new Promise((r) => setTimeout(r, 5));

describe("intention transitions", () => {
  it("completes once: a second tick keeps the first time and records nothing", async () => {
    const u = await createTestUser(db, "Ida");
    const i = await createIntention(db, u.id, { title: "Call Kendra" });
    expect(await eventsOf(u.id, "intention.created")).toHaveLength(1);
    const first = await completeIntention(db, u.id, i.id, "app");
    expect(first).toMatchObject({ status: "done" });
    await tick();
    const again = await completeIntention(db, u.id, i.id, "chat");
    expect(again).toMatchObject({ id: i.id, status: "done", completedAt: first!.completedAt });
    expect(await eventsOf(u.id, "intention.completed")).toHaveLength(1);
  });

  it("a done thing let go is no longer done, and reopening clears both", async () => {
    const u = await createTestUser(db, "Jai");
    const i = await createIntention(db, u.id, { title: "Return the library books" });
    await completeIntention(db, u.id, i.id);
    const dropped = await dropIntention(db, u.id, i.id, "not needed");
    expect(dropped).toMatchObject({ status: "dropped", completedAt: null });
    expect(dropped!.droppedAt).toBeInstanceOf(Date);
    expect(await dropIntention(db, u.id, i.id)).toMatchObject({ status: "dropped" });
    expect(await eventsOf(u.id, "intention.dropped")).toHaveLength(1);

    expect(await reopenIntention(db, u.id, i.id)).toMatchObject({ status: "open", completedAt: null, droppedAt: null });
    expect(await reopenIntention(db, u.id, i.id)).toMatchObject({ status: "open" });
    expect(await eventsOf(u.id, "intention.reopened")).toHaveLength(1);

    const done = await completeIntention(db, u.id, i.id);
    expect(done).toMatchObject({ status: "done", droppedAt: null });
  });

  it("two completes at once record one outcome", async () => {
    const u = await createTestUser(db, "Kai");
    const i = await createIntention(db, u.id, { title: "Send the draft" });
    const both = await Promise.all([completeIntention(db, u.id, i.id, "app"), completeIntention(db, u.id, i.id, "chat")]);
    expect(both.map((r) => r?.status)).toEqual(["done", "done"]);
    expect(await eventsOf(u.id, "intention.completed")).toHaveLength(1);
  });

  it("isn't found for someone else, and a patch that changes nothing writes nothing", async () => {
    const a = await createTestUser(db, "Lou");
    const b = await createTestUser(db, "Mo");
    const i = await createIntention(db, a.id, { title: "Book the dentist", list: "Personal" });
    expect(await completeIntention(db, b.id, i.id)).toBeUndefined();
    expect(await dropIntention(db, b.id, i.id)).toBeUndefined();
    expect(await reopenIntention(db, b.id, i.id)).toBeUndefined();
    expect((await getIntention(db, a.id, i.id))?.status).toBe("open");

    expect(await updateIntention(db, a.id, i.id, { list: "Personal" })).toMatchObject({ changed: [] });
    expect(await updateIntention(db, a.id, i.id, { list: "Work" }, "app")).toMatchObject({ changed: ["list"], row: { list: "Work" } });
    expect(await eventsOf(a.id, "intention.updated")).toHaveLength(1);
  });
});

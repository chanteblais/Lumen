/**
 * Leads on a real Postgres (PGlite, migrations applied): a lead is suggested
 * once per message and title, kept once, let go once.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { events, intentions, leads } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { createLeads, dismissLead, keepLead } from "./leads";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const eventsOf = async (userId: string, type: string) => db.select().from(events).where(and(eq(events.userId, userId), eq(events.type, type)));

describe("createLeads", () => {
  it("keeps several leads from one message, never the same one twice", async () => {
    const u = await createTestUser(db, "Nell");
    const first = await createLeads(db, u.id, [
      { sourceRef: "m1", title: "Reply to Priya about the draft", subject: "Draft" },
      { sourceRef: "m1", title: "Book the room for Friday" },
    ]);
    expect(first).toHaveLength(2);
    const second = await createLeads(db, u.id, [
      { sourceRef: "m1", title: "  reply to   Priya about the draft " },
      { sourceRef: "m2", title: "Pay the  water bill" },
    ]);
    expect(second.map((l) => l.title)).toEqual(["Pay the water bill"]);
    expect(await db.select().from(leads).where(eq(leads.userId, u.id))).toHaveLength(3);
    expect(await eventsOf(u.id, "lead.suggested")).toHaveLength(3);
  });
});

describe("keeping and letting go", () => {
  it("keeps a lead once, however many times it's kept — the same intention comes back", async () => {
    const u = await createTestUser(db, "Oli");
    const [lead] = await createLeads(db, u.id, [{ sourceRef: "m1", title: "Send the signed lease", why: "The agent asked for it by Friday.", list: "Personal" }]);
    const [a, b] = await Promise.all([keepLead(db, u.id, lead.id, "app"), keepLead(db, u.id, lead.id, "chat")]);
    expect(a?.intention.id).toBeDefined();
    expect(b?.intention.id).toBe(a?.intention.id);
    expect((await keepLead(db, u.id, lead.id))?.intention.id).toBe(a?.intention.id);
    expect(await db.select().from(intentions).where(eq(intentions.userId, u.id))).toHaveLength(1);
    expect(await eventsOf(u.id, "lead.kept")).toHaveLength(1);
    expect(a?.lead).toMatchObject({ status: "kept", intentionId: a?.intention.id });
    expect(a?.intention).toMatchObject({ title: "Send the signed lease", list: "Personal" });
    expect(await dismissLead(db, u.id, lead.id)).toBeUndefined();
  });

  it("lets a lead go once, and a lead let go isn't kept after", async () => {
    const u = await createTestUser(db, "Pia");
    const [lead] = await createLeads(db, u.id, [{ sourceRef: "m9", title: "RSVP to the conference dinner" }]);
    expect(await dismissLead(db, u.id, lead.id)).toMatchObject({ status: "dismissed" });
    expect(await dismissLead(db, u.id, lead.id, "chat")).toMatchObject({ status: "dismissed" });
    expect(await eventsOf(u.id, "lead.dismissed")).toHaveLength(1);
    expect(await keepLead(db, u.id, lead.id)).toBeUndefined();
    expect(await db.select().from(intentions).where(eq(intentions.userId, u.id))).toEqual([]);
  });

  it("isn't someone else's to keep or let go", async () => {
    const a = await createTestUser(db, "Quy");
    const b = await createTestUser(db, "Ros");
    const [lead] = await createLeads(db, a.id, [{ sourceRef: "m1", title: "Renew the passport" }]);
    expect(await keepLead(db, b.id, lead.id)).toBeUndefined();
    expect(await dismissLead(db, b.id, lead.id)).toBeUndefined();
  });
});

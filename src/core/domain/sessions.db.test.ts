/**
 * Focus sessions on a real Postgres (PGlite, migrations applied): one runs at a
 * time, the sweep closes what went quiet, and the last one ended is found.
 */
import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { events, focusSessions } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { endFocusSession, resolveSession, startFocusSession, sweepAbandoned } from "./sessions";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const at = (iso: string) => new Date(`2025-02-01T${iso}:00Z`);
const input = (goal: string, plannedMinutes = 30) => ({ goal, firstStep: "Open the doc", plannedMinutes, checkInMinutes: 10 });
const openFor = (userId: string) => db.select().from(focusSessions).where(and(eq(focusSessions.userId, userId), isNull(focusSessions.endedAt)));

describe("startFocusSession", () => {
  it("leaves one session running when two starts arrive at once", async () => {
    const u = await createTestUser(db, "Uri");
    const [a, b] = await Promise.all([startFocusSession(db, u.id, input("Edit chapter 3"), at("10:00")), startFocusSession(db, u.id, input("Answer the email"), at("10:00"))]);
    const open = await openFor(u.id);
    expect(open).toHaveLength(1);
    expect([a.session.id, b.session.id]).toContain(open[0].id);
  });

  it("closes the running one as stopped early and hands it back; one left open too long closes as abandoned", async () => {
    const u = await createTestUser(db, "Vic");
    const first = await startFocusSession(db, u.id, input("Edit chapter 3"), at("10:00"));
    const second = await startFocusSession(db, u.id, input("Answer the email"), at("10:10"));
    expect(second.replaced).toMatchObject({ id: first.session.id, outcome: "stopped_early" });

    // Two hours later, never ended and never swept: past twice its planned length.
    const third = await startFocusSession(db, u.id, input("Tidy the desk"), at("12:30"));
    expect(third.replaced).toBeUndefined();
    const [closed] = await db.select().from(focusSessions).where(eq(focusSessions.id, second.session.id));
    expect(closed.outcome).toBe("abandoned");
    expect((await openFor(u.id)).map((s) => s.id)).toEqual([third.session.id]);
  });
});

describe("ending, sweeping and the last session", () => {
  it("ends a session once", async () => {
    const u = await createTestUser(db, "Wen");
    const { session } = await startFocusSession(db, u.id, input("Read the paper"), at("09:00"));
    expect(await endFocusSession(db, u.id, session.id, "completed", at("09:25"))).toMatchObject({ outcome: "completed" });
    expect(await endFocusSession(db, u.id, session.id, "stopped_early", at("09:26"))).toBeUndefined();
    const ended = await db.select().from(events).where(and(eq(events.subjectId, session.id), eq(events.type, "session.ended")));
    expect(ended).toHaveLength(1);
  });

  it("sweeps only what went quiet, and finds the last one ended past an open one", async () => {
    const u = await createTestUser(db, "Xia");
    const done = await startFocusSession(db, u.id, input("Write the intro"), at("07:00"));
    await endFocusSession(db, u.id, done.session.id, "completed", at("07:30"));
    const running = await startFocusSession(db, u.id, input("Write the method"), at("09:00"));

    expect(await sweepAbandoned(db, u.id, at("09:30"))).toEqual([]);
    const now = await resolveSession(db, u.id, at("09:30"));
    expect(now.active?.id).toBe(running.session.id);
    expect(now.last?.id).toBe(done.session.id);

    const later = await resolveSession(db, u.id, at("11:00"));
    expect(later.active).toBeUndefined();
    expect(later.last).toMatchObject({ id: running.session.id, outcome: "abandoned" });

    const days = await resolveSession(db, u.id, new Date("2025-02-04T12:00:00Z"));
    expect(days.last).toBeUndefined();
  });
});

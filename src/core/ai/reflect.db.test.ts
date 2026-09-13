/**
 * Session reflection on a real Postgres (PGlite, migrations applied): it runs
 * once however many callers race, and it reads only what belongs to the session.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ensureMainConversation } from "@/core/domain/conversations";
import { appendEvent } from "@/core/domain/events";
import { applyBeliefOps } from "@/core/domain/memory";
import { endFocusSession, startFocusSession } from "@/core/domain/sessions";
import type { Db } from "@/db/client";
import { events, memoryNotes, messages, type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { reflectOnSession, type SessionReflectionInputs } from "./reflect";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

// Far from the real clock, so the events belief writes stamp with `new Date()` fall outside the session.
const at = (hhmm: string) => new Date(`2025-01-10T${hhmm}:00Z`);

async function sessionWithStrategy(u: User) {
  const made = await applyBeliefOps(db, u.id, [{ op: "create", kind: "strategy", content: "Reading the last paragraph first gets me started.", source: "user_said" }], "user");
  const strategy = made.created[0];
  const { session } = await startFocusSession(db, u.id, { goal: "Edit chapter 3", firstStep: "Open the doc", approach: "read the last paragraph first", plannedMinutes: 45, checkInMinutes: 15 }, at("10:00"));
  await endFocusSession(db, u.id, session.id, "completed", at("10:30"));
  return { strategy, session };
}

describe("reflectOnSession", () => {
  it("runs once when two callers race — the evidence isn't doubled", async () => {
    const u = await createTestUser(db, "Rho");
    const { strategy, session } = await sessionWithStrategy(u);
    const propose = async () => {
      await new Promise((r) => setTimeout(r, 5));
      return [];
    };
    const results = await Promise.all([reflectOnSession(db, u, session.id, { now: () => at("11:00"), propose }), reflectOnSession(db, u, session.id, { now: () => at("11:00"), propose })]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const [row] = await db.select().from(memoryNotes).where(eq(memoryNotes.id, strategy.id));
    expect(row.evidenceFor).toBe(1);
    const ran = await db.select().from(events).where(and(eq(events.userId, u.id), eq(events.subjectId, session.id)));
    expect(ran.filter((e) => e.type === "reflection.ran")).toHaveLength(1);
    expect(ran.filter((e) => e.type === "reflection.claimed")).toHaveLength(1);
    expect(await reflectOnSession(db, u, session.id, { now: () => at("12:00"), propose })).toBeUndefined();
  });

  it("reads only the session and a few minutes after it, and names each recorded op for what it was", async () => {
    const u = await createTestUser(db, "Sol");
    const { strategy, session } = await sessionWithStrategy(u);
    const extra = await applyBeliefOps(
      db,
      u.id,
      [
        { op: "create", kind: "preference", content: "Likes short replies while working.", source: "user_said" },
        { op: "create", kind: "project", content: "The thesis is due on October 30.", source: "user_said" },
      ],
      "user",
    );
    const [preference, thesis] = extra.created;
    // Lumi contradicted the preference during the session; the thesis was confirmed hours later, in another conversation.
    await appendEvent(db, { userId: u.id, type: "memory.contradicted", subjectType: "note", subjectId: preference.id, occurredAt: at("10:20") });
    await appendEvent(db, { userId: u.id, type: "memory.confirmed", subjectType: "note", subjectId: thesis.id, occurredAt: at("13:00") });
    await appendEvent(db, { userId: u.id, type: "session.check_in", subjectType: "session", subjectId: session.id, payload: { response: "ok", minute: 15 }, occurredAt: at("10:15") });
    const c = await ensureMainConversation(db, u.id);
    for (const [when, role, text] of [
      ["09:55", "user", "can you stay with me while I edit chapter three"],
      ["10:31", "user", "done, that went well"],
      ["13:00", "user", "unrelated: what should I cook for dinner tonight"],
    ] as const)
      await db.insert(messages).values({ conversationId: c.id, role, parts: [{ type: "text", text }], createdAt: at(when) });

    let seen: SessionReflectionInputs | undefined;
    await reflectOnSession(db, u, session.id, {
      now: () => at("14:00"),
      propose: async (inputs) => {
        seen = inputs;
        return [];
      },
    });
    expect(seen?.applied).toEqual([
      { op: "contradict", id: preference.id },
      { op: "confirm", id: strategy.id },
    ]);
    expect(seen?.checkIns).toEqual([{ response: "ok", minute: 15 }]);
    expect(seen?.transcript.map((t) => t.text)).toEqual(["can you stay with me while I edit chapter three", "done, that went well"]);
  });
});

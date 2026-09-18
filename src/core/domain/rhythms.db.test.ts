/**
 * Rhythms on a real Postgres (PGlite): held in their words, practiced once
 * per day, described without a count, let go as history.
 */
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { events, type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { describePractice, holdRhythm, letGoRhythm, listRhythms, practiceRhythm, unpracticeRhythm, weekDays } from "./rhythms";

let db: Db;
let close: () => Promise<void>;
let user: User;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
  user = await createTestUser(db, "Rhythms");
}, 60_000);
afterAll(async () => {
  await close();
});

const today = "2026-09-18"; // a Friday

describe("rhythms", () => {
  it("holds one in their words, records a day once, and describes it without a number", async () => {
    const gym = await holdRhythm(db, user.id, { name: "Gym", content: "I want to go to the gym more", cadence: "a few times a week", typicalMinutes: 60 });
    if ("error" in gym) throw new Error(gym.error);
    expect(gym.cadence).toBe("a few times a week");

    const first = await practiceRhythm(db, user.id, gym.id, "2026-09-16", "chat");
    const again = await practiceRhythm(db, user.id, gym.id, "2026-09-16", "app");
    expect(first).toMatchObject({ already: false });
    expect(again).toMatchObject({ already: true });
    await practiceRhythm(db, user.id, gym.id, today, "app");

    const [view] = await listRhythms(db, user.id, today);
    expect(view!.practicedOn).toEqual([today, "2026-09-16"]);
    expect(describePractice(view!, today)).toBe("this week: Wed, Fri");
    expect(describePractice(view!, today)).not.toMatch(/\d/);

    const written = await db.select({ type: events.type }).from(events).where(eq(events.userId, user.id));
    expect(written.filter((e) => e.type === "rhythm.practiced")).toHaveLength(2);
  });

  it("takes back today's tap, says 'last: … last week' after a quiet week, and lets go as history", async () => {
    const med = await holdRhythm(db, user.id, { name: "Meditation", content: "meditate every morning" });
    if ("error" in med) throw new Error(med.error);
    await practiceRhythm(db, user.id, med.id, "2026-09-11", "chat"); // last Friday
    await practiceRhythm(db, user.id, med.id, today, "app");
    expect(await unpracticeRhythm(db, user.id, med.id, today)).toBe(true);
    expect(await unpracticeRhythm(db, user.id, med.id, today)).toBe(false);

    const view = (await listRhythms(db, user.id, today)).find((r) => r.id === med.id)!;
    expect(view.practicedOn).toEqual(["2026-09-11"]);
    expect(describePractice(view, today)).toBe("last: Fri last week");
    expect(describePractice({ practicedOn: [] }, today)).toBe("not yet");

    await letGoRhythm(db, user.id, med.id);
    expect((await listRhythms(db, user.id, today)).map((r) => r.name)).not.toContain("Meditation");
    // Practicing a let-go rhythm is refused.
    expect(await practiceRhythm(db, user.id, med.id, today, "chat")).toBeUndefined();
  });

  it("replacing one retires it as superseded, and refuses empty words", async () => {
    const yoga = await holdRhythm(db, user.id, { name: "Hot yoga", content: "hot yoga instead of the gym", replacesId: (await listRhythms(db, user.id, today))[0]!.id });
    if ("error" in yoga) throw new Error(yoga.error);
    expect(yoga.supersedesId).toBeTruthy();
    expect((await listRhythms(db, user.id, today)).map((r) => r.name)).toEqual(["Hot yoga"]);
    expect(await holdRhythm(db, user.id, { name: "X", content: "hm" })).toMatchObject({ error: expect.any(String) });
  });

  it("weekDays runs Monday to Sunday around today", () => {
    expect(weekDays(today)).toEqual(["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"]);
  });
});

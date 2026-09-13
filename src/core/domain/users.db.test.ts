/**
 * The visit write on a real Postgres (PGlite, migrations applied): one round
 * trip that stamps the visit and hands back the row as it was.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { events, users } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { visit } from "./users";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const opened = (userId: string) => db.select().from(events).where(and(eq(events.userId, userId), eq(events.type, "app.opened")));

describe("visit", () => {
  it("stamps the visit and returns the row as it was before, with the browser's timezone", async () => {
    const u = await createTestUser(db, "Bea");
    const soon = new Date(u.lastSeenAt.getTime() + 10 * 60_000);
    const r = await visit(db, u.clerkUserId, "America/Vancouver", soon);
    expect(r?.previous).toEqual(u.lastSeenAt);
    expect(r?.user).toMatchObject({ id: u.id, timezone: "America/Vancouver", lastSeenAt: u.lastSeenAt });
    const [row] = await db.select().from(users).where(eq(users.id, u.id));
    expect(row.lastSeenAt).toEqual(soon);
    expect(await opened(u.id)).toEqual([]);
  });

  it("opens a sitting after half an hour away, carrying the gap, and ignores a timezone that isn't one", async () => {
    const u = await createTestUser(db, "Cy");
    const later = new Date(u.lastSeenAt.getTime() + 2 * 3_600_000);
    const r = await visit(db, u.clerkUserId, "Mars/Olympus", later);
    expect(r?.user.timezone).toBe("UTC");
    const [e] = await opened(u.id);
    expect(e.payload).toEqual({ gap_seconds: 7200 });
  });

  it("finds nobody for an id with no row yet", async () => {
    expect(await visit(db, "user_nobody", "UTC")).toBeUndefined();
  });
});

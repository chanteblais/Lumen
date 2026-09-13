/**
 * The app's pool (`connect`, production's options) over a real Postgres wire:
 * PGlite behind pglite-socket, migrations applied. `openTestDb` hands tests
 * PGlite's own driver, which never meets postgres-js's transaction rules; these
 * tests do.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { consolidate } from "@/core/ai/consolidate";
import { ensureMainConversation } from "@/core/domain/conversations";
import { connect, type Db } from "./client";
import { conversations, episodes, messages, users, type User } from "./schema";
import { createTestUser, openTestServer } from "./test-db";

describe("the driver's own begin under the pool's options", () => {
  it("is refused with UNSAFE_TRANSACTION — why connect() replaces it", async () => {
    const server = await openTestServer({ migrations: false });
    const options = { prepare: false, max: 10, max_pipeline: 0 };
    const raw = postgres(server.url, options);
    try {
      await expect(raw.begin((tx) => tx`select 1`)).rejects.toMatchObject({ code: "UNSAFE_TRANSACTION" });
    } finally {
      await raw.end({ timeout: 1 });
      await server.close();
    }
  }, 30_000);
});

describe("transactions on the app's pool", () => {
  let db: Db;
  let close: () => Promise<void>;
  beforeAll(async () => {
    const server = await openTestServer();
    db = connect(server.url, { warmUp: false });
    close = server.close;
  }, 60_000);
  afterAll(async () => {
    await db.$client.end({ timeout: 1 });
    await close();
  });

  const nameOf = async (u: User) => (await db.select().from(users).where(eq(users.id, u.id)))[0]!.displayName;

  it("commits", async () => {
    const u = await createTestUser(db, "Commit");
    await db.transaction(async (tx) => {
      await tx.update(users).set({ displayName: "Committed" }).where(eq(users.id, u.id));
    });
    expect(await nameOf(u)).toBe("Committed");
  });

  it("rolls back when the work throws, and the connection serves the next transaction", async () => {
    const u = await createTestUser(db, "Rollback");
    await expect(
      db.transaction(async (tx) => {
        await tx.update(users).set({ displayName: "Lost" }).where(eq(users.id, u.id));
        throw new Error("stop");
      }),
    ).rejects.toThrow("stop");
    expect(await nameOf(u)).toBe("Rollback");

    await db.transaction(async (tx) => {
      await tx.update(users).set({ displayName: "Kept" }).where(eq(users.id, u.id));
    });
    expect(await nameOf(u)).toBe("Kept");
  });

  it("rolls back a nested transaction on its own", async () => {
    const u = await createTestUser(db, "Nested");
    await db.transaction(async (tx) => {
      await tx.update(users).set({ displayName: "Outer" }).where(eq(users.id, u.id));
      await expect(
        tx.transaction(async (inner) => {
          await inner.update(users).set({ displayName: "Inner" }).where(eq(users.id, u.id));
          throw new Error("inner");
        }),
      ).rejects.toThrow("inner");
    });
    expect(await nameOf(u)).toBe("Outer");
  });

  it("consolidates a finished stretch", async () => {
    const u = await createTestUser(db, "Wire");
    const c = await ensureMainConversation(db, u.id);
    const say = async (at: string, role: "user" | "assistant", text: string) => {
      const id = randomUUID();
      await db.insert(messages).values({ id, conversationId: c.id, role, parts: [{ type: "text", text }], createdAt: new Date(at) });
      return id;
    };
    await say("2026-09-10T19:00:00Z", "user", "I spent the afternoon planning the move to Halifax and finally booked the movers.");
    const last = await say("2026-09-10T19:01:00Z", "assistant", "Movers booked. That was the big one.");

    const result = await consolidate(db, u, {
      now: () => new Date("2026-09-12T09:00:00Z"),
      propose: async () => ({ episode: { summary: "You planned the move to Halifax and booked the movers." }, threads: [], notes: [] }),
    });

    expect(result).toMatchObject({ status: "done", messages: 2 });
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, c.id));
    expect(conversation!.summaryThroughMessageId).toBe(last);
    const [episode] = await db.select().from(episodes).where(eq(episodes.userId, u.id));
    expect(episode!.summary).toBe("You planned the move to Halifax and booked the movers.");
  });
});

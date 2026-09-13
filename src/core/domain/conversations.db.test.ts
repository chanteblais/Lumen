/**
 * The one conversation and its messages on a real Postgres (PGlite, migrations applied).
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { ensureMainConversation, saveMessage, type CoherenceUIMessage } from "./conversations";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const text = (id: string, words: string): CoherenceUIMessage => ({ id, role: "user", parts: [{ type: "text", text: words }] });

describe("ensureMainConversation", () => {
  it("makes one main conversation when two first visits race", async () => {
    const u = await createTestUser(db, "Yara");
    const [a, b] = await Promise.all([ensureMainConversation(db, u.id), ensureMainConversation(db, u.id)]);
    expect(b.id).toBe(a.id);
    expect(await db.select().from(conversations).where(and(eq(conversations.userId, u.id), eq(conversations.kind, "main")))).toHaveLength(1);
  });
});

describe("saveMessage", () => {
  it("replaces a message within its conversation, and never one in another", async () => {
    const a = await createTestUser(db, "Zed");
    const b = await createTestUser(db, "Abe");
    const [ca, cb] = [await ensureMainConversation(db, a.id), await ensureMainConversation(db, b.id)];
    const id = randomUUID();
    await saveMessage(db, ca.id, text(id, "hello"));
    await saveMessage(db, ca.id, text(id, "hello, finished streaming"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await saveMessage(db, cb.id, text(id, "someone else's words"));
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
    const [row] = await db.select().from(messages).where(eq(messages.id, id));
    expect(row).toMatchObject({ conversationId: ca.id, parts: [{ type: "text", text: "hello, finished streaming" }] });
  });
});

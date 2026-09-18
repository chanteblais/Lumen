/**
 * One look through the mail on a real Postgres (PGlite, migrations applied),
 * with a fake mailbox behind the EmailReader and a fake model: every message
 * since the last look is read — across looks when there are many — and none twice.
 */
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { LeadDraft, LeadInputs } from "@/core/ai/leads";
import { latestMailScan, recordMailScan } from "@/core/domain/leads";
import type { Db } from "@/db/client";
import { events, leads } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { GmailAuthError } from "./gmail";
import { ensureFreshMailScan, MAIL_PAGE, MAIL_PAGES } from "./scan";
import type { EmailMessage, EmailReader } from "./types";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const base = Math.floor(Date.now() / 60_000) * 60_000;
const minutes = (m: number) => new Date(base + m * 60_000);
const mail = (i: number, at: Date): EmailMessage => ({ id: `msg-${i}`, threadId: `t-${i}`, fromName: "Priya", fromAddress: "priya@example.com", subject: `Thing ${i}`, receivedAt: at, text: `Could you look at thing ${i}?` });

/** Newest first, `since` exclusive, `before` exclusive, capped at `max` — the way Gmail answers. */
function mailbox(msgs: EmailMessage[]): EmailReader & { calls: number } {
  const box = {
    calls: 0,
    async recent(q: { since: Date; before?: Date; max?: number }) {
      box.calls++;
      return msgs
        .filter((m) => m.receivedAt > q.since && (!q.before || m.receivedAt < q.before))
        .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
        .slice(0, q.max ?? MAIL_PAGE);
    },
  };
  return box;
}

/** A model that notices the first message it's shown, and remembers every id it was sent. */
function model() {
  const sent: string[] = [];
  const infer = vi.fn(async (inputs: LeadInputs): Promise<LeadDraft[]> => {
    sent.push(...inputs.messages.map((m) => m.id));
    const [m] = inputs.messages;
    return m ? [{ messageId: m.id, title: `Reply about ${m.subject}`, why: "Priya asked.", list: null, dueAt: null }] : [];
  });
  return { infer, sent };
}

describe("ensureFreshMailScan", () => {
  it("pages back to the last look, reading everything since it", async () => {
    const u = await createTestUser(db, "Dia");
    await recordMailScan(db, u.id, { through: minutes(-120), read: 0, suggested: 0 });
    const count = MAIL_PAGE + 20;
    const box = mailbox([...Array.from({ length: count }, (_, i) => mail(i, minutes(-i - 1))), mail(999, minutes(-121))]);
    const { infer, sent } = model();
    const r = await ensureFreshMailScan(db, u, box, { infer, now: () => minutes(32) });
    expect(r).toMatchObject({ status: "looked", suggested: [{ sourceRef: "msg-0" }] });
    expect(new Set(sent).size).toBe(count);
    expect(sent).not.toContain("msg-999");
    const scan = await latestMailScan(db, u.id);
    expect(scan?.through).toEqual(new Date(minutes(-1).getTime() + 1000));
    expect(scan?.backlog).toBeUndefined();
  });

  it("carries what one look couldn't reach to the next, and reads no message twice", async () => {
    const u = await createTestUser(db, "Eun");
    const count = MAIL_PAGE * MAIL_PAGES + 15;
    const box = mailbox(Array.from({ length: count }, (_, i) => mail(i, minutes(-i - 1))));
    const { infer, sent } = model();

    const first = await ensureFreshMailScan(db, u, box, { infer, now: () => minutes(0) });
    expect(first).toMatchObject({ status: "looked" });
    expect(sent).toHaveLength(MAIL_PAGE * MAIL_PAGES);
    expect((await latestMailScan(db, u.id))?.backlog).toBeDefined();

    const second = await ensureFreshMailScan(db, u, box, { infer, now: () => minutes(32) });
    expect(second).toMatchObject({ status: "looked" });
    expect(sent).toHaveLength(count);
    expect(new Set(sent).size).toBe(count);
    expect((await latestMailScan(db, u.id))?.backlog).toBeUndefined();
    expect(await db.select().from(leads).where(eq(leads.userId, u.id))).toHaveLength(2);
  });

  it("looks once for two opens at the same moment, and not again while the look is fresh", async () => {
    const u = await createTestUser(db, "Fox");
    const box = mailbox([mail(1, minutes(-5))]);
    const { infer } = model();
    const [a, b] = await Promise.all([ensureFreshMailScan(db, u, box, { infer, now: () => minutes(0) }), ensureFreshMailScan(db, u, box, { infer, now: () => minutes(0) })]);
    expect(a).toEqual(b);
    expect(infer).toHaveBeenCalledOnce();
    expect(await ensureFreshMailScan(db, u, box, { infer, now: () => new Date() })).toMatchObject({ status: "fresh" });
    expect(await db.select().from(events).where(and(eq(events.userId, u.id), eq(events.type, "email.scanned")))).toHaveLength(1);
  });

  it("says disconnected when the mail provider refuses, and records no look", async () => {
    const u = await createTestUser(db, "Gil");
    const refusing: EmailReader = { recent: async () => Promise.reject(new GmailAuthError()) };
    expect(await ensureFreshMailScan(db, u, refusing, { infer: model().infer, now: () => minutes(0) })).toEqual({ status: "disconnected" });
    expect(await latestMailScan(db, u.id)).toBeUndefined();
  });
});

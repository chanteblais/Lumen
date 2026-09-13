/**
 * Keeping today's path honest on a real Postgres (PGlite, migrations applied):
 * two intentions leaving the path at once both leave it.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { localDate } from "@/core/time";
import type { Db } from "@/db/client";
import { createTestUser, openTestDb } from "@/db/test-db";
import { reflectClosedInPlan } from "./plan-sync";
import { getPlanForDate, savePlan } from "./plans";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

describe("reflectClosedInPlan", () => {
  it("loses neither of two closes that arrive at once (parallel tool calls)", async () => {
    const u = await createTestUser(db, "Sia");
    const now = new Date();
    const today = localDate(now, u.timezone);
    const [a, b, c] = [randomUUID(), randomUUID(), randomUUID()];
    await savePlan(db, u.id, today, { dayLine: "A steady day.", rightNow: { intentionId: a, firstStep: "Open it." }, afterThat: [{ intentionId: b }, { intentionId: c }], later: [], restCanWait: true }, "new_day");

    await Promise.all([reflectClosedInPlan(db, u, a, now), reflectClosedInPlan(db, u, b, now)]);

    const plan = (await getPlanForDate(db, u.id, today))!.plan;
    expect(plan.rightNow?.intentionId).toBe(c);
    expect(plan.afterThat).toEqual([]);
  });

  it("writes nothing when the intention isn't in the path or there's no plan", async () => {
    const u = await createTestUser(db, "Tam");
    const now = new Date();
    await reflectClosedInPlan(db, u, randomUUID(), now);
    expect(await getPlanForDate(db, u.id, localDate(now, u.timezone))).toBeUndefined();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import type { DayPlanJson, DayPlanRow, User } from "@/db/schema";
import type { Snapshot } from "@/core/domain/snapshot";
import { recutAfterDecline } from "./today-plan";

const user = { id: "u1", timezone: "UTC", displayName: "C", lastSeenAt: new Date(), preferences: {} } as unknown as User;
const db = {} as Db;
const now = () => new Date("2026-09-13T16:00:00Z");

const plan: DayPlanJson = {
  dayLine: "x",
  rightNow: { intentionId: "a", firstStep: "Open the doc." },
  afterThat: [{ intentionId: "b" }, { intentionId: "c" }],
  later: [],
  restCanWait: false,
};
const open = [
  { id: "a", title: "Paper", nextAction: "Open the doc.", estimateMinutes: 60 },
  { id: "b", title: "Invoice", nextAction: null, estimateMinutes: 30 },
  { id: "c", title: "Email", nextAction: "Open the thread.", estimateMinutes: 5 },
];
const snap = (planRowId: string, p: DayPlanJson | undefined = plan) =>
  ({ today: "2026-09-13", plan: p, planRow: p ? { id: planRowId } : undefined, openIntentions: open, declinedToday: [{ intentionId: "a", reason: "too_big" }], beliefs: [], capacity: undefined, sitting: undefined }) as unknown as Snapshot;

describe("recutAfterDecline", () => {
  it("changes the card at once, without the model, then refines the rest keeping it", async () => {
    let row = "r1";
    const saved: DayPlanJson[] = [];
    const save = vi.fn(async (_db: Db, _u: string, _d: string, p: DayPlanJson) => {
      saved.push(p);
      row = `r${saved.length + 1}`;
      return { id: `r${saved.length + 1}` } as DayPlanRow;
    });
    const build = vi.fn(async () => ({ dayLine: "y", rightNow: { intentionId: "c", firstStep: "Open the thread." }, afterThat: [{ intentionId: "b" }], later: [], restCanWait: true }) as DayPlanJson);
    const deps = { load: vi.fn(async () => snap(row)), build, save, latest: vi.fn(async () => ({ id: row }) as DayPlanRow), now };

    const { plan: quick, refine } = await recutAfterDecline(db, user, "too_big", deps);
    expect(build).not.toHaveBeenCalled();
    expect(quick.rightNow).toEqual({ intentionId: "c", firstStep: "Open the thread." });
    expect(quick.note).toBe("Something smaller, then.");

    await refine!();
    expect(build).toHaveBeenCalledTimes(1);
    expect(build.mock.calls[0]).toEqual([expect.objectContaining({ keep: { intentionId: "c", firstStep: "Open the thread." } })]);
    expect(saved).toHaveLength(2);
    expect(saved[1]!.note).toBe("Something smaller, then.");
  });

  it("doesn't overwrite a path that moved while the model was thinking", async () => {
    const save = vi.fn(async () => ({ id: "r2" }) as DayPlanRow);
    const build = vi.fn(async () => plan);
    const deps = { load: vi.fn(async () => snap("r2")), build, save, latest: vi.fn(async () => ({ id: "r3" }) as DayPlanRow), now };
    const { refine } = await recutAfterDecline(db, user, "nope", deps);
    await refine!();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("asks the planner straight away when nothing is queued", async () => {
    const save = vi.fn(async () => ({ id: "r2" }) as DayPlanRow);
    const build = vi.fn(async () => ({ ...plan, rightNow: { intentionId: "c", firstStep: "Go." }, afterThat: [] }) as DayPlanJson);
    const deps = { load: vi.fn(async () => snap("r1", { ...plan, afterThat: [] })), build, save, latest: vi.fn(), now };
    const { plan: p, refine } = await recutAfterDecline(db, user, "nope", deps);
    expect(build).toHaveBeenCalledTimes(1);
    expect(p.note).toBe("Fair.");
    expect(refine).toBeUndefined();
  });
});

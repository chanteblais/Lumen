/**
 * `reflectAfterSession` is handed the same abandoned session on every page open
 * and turn for a day and a half (code review B10, B19): it checks it once per
 * process, and logs only a reflection that actually ran.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";
import { reflectAfterSession } from "./reflect";

const db = {} as Db;
const user = { id: "u", timezone: "UTC" };

afterEach(() => vi.restoreAllMocks());

describe("reflectAfterSession", () => {
  it("looks at a session once, and says nothing when there was nothing to run", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const reflect = vi.fn(async () => undefined);
    await reflectAfterSession(db, user, "long-ago", { reflect });
    await reflectAfterSession(db, user, "long-ago", { reflect });
    await reflectAfterSession(db, user, "long-ago", { reflect });
    expect(reflect).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  });

  it("logs a run that happened, then leaves the session be", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const reflect = vi.fn(async () => ({ applied: [{ op: "confirm" as const, id: "b1" }] }));
    await reflectAfterSession(db, user, "just-ended", { reflect });
    await reflectAfterSession(db, user, "just-ended", { reflect });
    expect(reflect).toHaveBeenCalledTimes(1);
    expect(log.mock.calls.map((c) => c[0])).toEqual(["[reflect] session=just-ended ops=1"]);
  });

  it("tries again after a failure — the claim, not this memory, keeps it to once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reflect = vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(undefined);
    await reflectAfterSession(db, user, "flaky", { reflect });
    await reflectAfterSession(db, user, "flaky", { reflect });
    await reflectAfterSession(db, user, "flaky", { reflect });
    expect(reflect).toHaveBeenCalledTimes(2);
  });
});

import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { CHECK_IN_ANSWERS, CHECK_IN_QUESTION, CHECK_IN_TIME_UP, checkInQuestion, elapsedLabel, nextCheckIn, sessionEventText, sessionFromMessages } from "./focus";
import type { SessionView } from "./domain/sessions";

const now = new Date("2026-09-12T20:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
const view = (over: Partial<SessionView> = {}): SessionView => ({
  id: "s1",
  goal: "Edit chapter 3",
  firstStep: "Open the doc and read the last paragraph",
  approach: null,
  plannedMinutes: 45,
  checkInMinutes: 15,
  startedAt: minutesAgo(0),
  intentionId: null,
  ...over,
});

describe("check-ins", () => {
  it("fires every interval from the start, strictly after now", () => {
    expect(nextCheckIn(view({ startedAt: minutesAgo(0) }), now)).toEqual({ at: new Date(now.getTime() + 15 * 60_000), minute: 15 });
    expect(nextCheckIn(view({ startedAt: minutesAgo(15) }), now)).toEqual({ at: new Date(now.getTime() + 15 * 60_000), minute: 30 });
    expect(nextCheckIn(view({ startedAt: minutesAgo(16) }), now)).toEqual({ at: new Date(now.getTime() + 14 * 60_000), minute: 30 });
  });
  it("asks the same question until the time we set, then asks whether to keep going", () => {
    expect(checkInQuestion(view(), 15)).toBe(CHECK_IN_QUESTION);
    expect(checkInQuestion(view(), 45)).toBe(CHECK_IN_TIME_UP);
    expect(checkInQuestion(view(), 60)).toBe(CHECK_IN_TIME_UP);
  });
  it("offers four answers, one tap each, and words each tap that reaches Lumi", () => {
    expect(CHECK_IN_ANSWERS.map((a) => a.label)).toEqual(["Yep", "Stuck", "Got distracted", "Done"]);
    expect(sessionEventText("stuck")).toBe("Stuck.");
    expect(sessionEventText("end")).toBe("Let’s stop here.");
  });
  it("shows elapsed over planned, never a countdown", () => {
    expect(elapsedLabel(view({ startedAt: minutesAgo(12) }), now)).toBe("12 of 45 min");
    expect(elapsedLabel(view({ startedAt: minutesAgo(50) }), now)).toBe("50 of 45 min");
  });
});

type M = UIMessage<{ kind?: string; sessionId?: string; response?: string }>;
const tool = (type: string, output: unknown): M => ({ id: crypto.randomUUID(), role: "assistant", parts: [{ type, state: "output-available", input: {}, output } as never] });

describe("sessionFromMessages", () => {
  it("starts with what the server said and follows Lumi's tool calls", () => {
    const started = view({ id: "s2", startedAt: minutesAgo(1) });
    expect(sessionFromMessages(null, [tool("tool-start_focus_session", started)])).toEqual(started);
    expect(sessionFromMessages(started, [tool("tool-end_focus_session", { id: "s2", goal: "x", outcome: "completed" })])).toBeNull();
    // An end for some other session changes nothing.
    expect(sessionFromMessages(started, [tool("tool-end_focus_session", { id: "old" })])).toEqual(started);
  });
  it("closes the session on the user's own Done or End tap", () => {
    const s = view();
    const tap = (response: string, sessionId = "s1"): M => ({ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: "Done." }], metadata: { kind: "session_event", sessionId, response } });
    expect(sessionFromMessages(s, [tap("done")])).toBeNull();
    expect(sessionFromMessages(s, [tap("end")])).toBeNull();
    expect(sessionFromMessages(s, [tap("stuck")])).toEqual(s);
    expect(sessionFromMessages(s, [tap("done", "other")])).toEqual(s);
  });
  it("ignores failed tool calls and older starts", () => {
    const s = view({ startedAt: minutesAgo(5) });
    expect(sessionFromMessages(s, [tool("tool-start_focus_session", { error: "failed" })])).toEqual(s);
    expect(sessionFromMessages(s, [tool("tool-start_focus_session", view({ id: "older", startedAt: minutesAgo(50) }))])).toEqual(s);
  });
});

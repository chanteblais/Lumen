/**
 * Focus Together, the client-facing half: the copy the interface says on its
 * own (no model call), when a check-in is due, and how a running session is
 * read out of the live transcript. Framework-free; tested.
 */
import type { UIMessage } from "ai";
import type { SessionView } from "./domain/sessions";

/** The check-in question. Always the same words; the answer is one tap. */
export const CHECK_IN_QUESTION = "Still with it?";
/** At or past the length we set, the same check-in with a different first line. */
export const CHECK_IN_TIME_UP = "That’s the time we set. Keep going?";

/** What a tap on the check-in becomes. `ok` is an event only; the rest go to Lumi as a message. */
export type SessionEventResponse = "ok" | "stuck" | "distracted" | "done" | "end";

export const CHECK_IN_ANSWERS: readonly { response: Exclude<SessionEventResponse, "end">; label: string }[] = [
  { response: "ok", label: "Yep" },
  { response: "stuck", label: "Stuck" },
  { response: "distracted", label: "Got distracted" },
  { response: "done", label: "Done" },
];

/** The visible user message for a tap that reaches Lumi — the tap, in words. */
export function sessionEventText(response: Exclude<SessionEventResponse, "ok">): string {
  switch (response) {
    case "stuck":
      return "Stuck.";
    case "distracted":
      return "Got distracted.";
    case "done":
      return "Done.";
    case "end":
      return "Let’s stop here.";
  }
}

export function isSessionEventResponse(s: unknown): s is SessionEventResponse {
  return s === "ok" || s === "stuck" || s === "distracted" || s === "done" || s === "end";
}

/**
 * The next check-in boundary strictly after `now`: every `checkInMinutes`
 * from the start. Returns the instant and which minute of the session it is.
 */
export function nextCheckIn(session: Pick<SessionView, "startedAt" | "checkInMinutes">, now: Date = new Date()): { at: Date; minute: number } {
  const start = new Date(session.startedAt).getTime();
  const step = Math.max(1, session.checkInMinutes) * 60_000;
  const n = Math.floor((now.getTime() - start) / step) + 1;
  return { at: new Date(start + n * step), minute: n * Math.max(1, session.checkInMinutes) };
}

/** The question for a check-in at `minute`: the plain one, or the time's-up one at or past the planned length. */
export function checkInQuestion(session: Pick<SessionView, "plannedMinutes">, minute: number): string {
  return minute >= session.plannedMinutes ? CHECK_IN_TIME_UP : CHECK_IN_QUESTION;
}

/** "12 of 45 min" — elapsed over planned, never a countdown. */
export function elapsedLabel(session: Pick<SessionView, "startedAt" | "plannedMinutes">, now: Date = new Date()): string {
  const m = Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 60_000));
  return `${m} of ${session.plannedMinutes} min`;
}

type SessionMeta = { kind?: string; sessionId?: string; response?: string };
type Part = { type: string; state?: string; input?: unknown; output?: unknown };

/**
 * The running session as the live transcript knows it: whatever the server
 * said was running when the page opened, then every start / end since —
 * Lumi's tool calls as they stream in, and the user's own Done / End taps
 * (those close the session on the server without a tool part). Only the
 * messages from this page open are read; earlier ones are the server's job.
 */
export function sessionFromMessages(initial: SessionView | null | undefined, messages: UIMessage<SessionMeta>[]): SessionView | null {
  let current: SessionView | null = initial ?? null;
  for (const m of messages) {
    if (m.role === "user") {
      const meta = m.metadata;
      if (meta?.kind === "session_event" && (meta.response === "done" || meta.response === "end") && current && meta.sessionId === current.id) current = null;
      continue;
    }
    for (const p of m.parts as Part[]) {
      if (p.state !== "output-available") continue;
      const out = (p.output ?? {}) as Partial<SessionView> & { error?: string; id?: string };
      if (out.error) continue;
      if (p.type === "tool-start_focus_session" && typeof out.id === "string" && typeof out.startedAt === "string") {
        if (!current || new Date(out.startedAt) >= new Date(current.startedAt)) current = out as SessionView;
      } else if (p.type === "tool-end_focus_session" && current && out.id === current.id) {
        current = null;
      }
    }
  }
  return current;
}

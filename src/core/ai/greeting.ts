import { gapBucket } from "@/core/time";

export type GreetingState = {
  /** First name if known; the greeting stays warm without it. */
  displayName?: string | null;
  /** Last time the user was here; undefined on first visit. */
  lastSeenAt?: Date;
  /** A focus session left open without an end signal. */
  abandonedSessionGoal?: string;
  now?: Date;
};

/**
 * The opening lines Lumi says on page open. Deterministic: no model call.
 * First line = recognition. Second line = somewhere to begin.
 */
export function greeting(state: GreetingState): string[] {
  const now = state.now ?? new Date();
  const first = state.displayName ? `Good to see you, ${state.displayName}.` : "Good to see you.";

  if (state.abandonedSessionGoal) {
    return [first, `Looks like we left a session open on “${state.abandonedSessionGoal}.” Pick it back up, or let it go?`];
  }
  if (state.lastSeenAt && ["week_plus", "long"].includes(gapBucket(state.lastSeenAt, now))) {
    return [first, "It’s been a minute. Want me to help figure out what’s still relevant?"];
  }
  return [first, "What are we working with today?"];
}

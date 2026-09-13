import { gapBucket, localDayDiff } from "@/core/time";

type GreetingState = {
  /** First name if known; the greeting stays warm without it. */
  displayName?: string | null;
  /** Last time the user was here; undefined on first visit. */
  lastSeenAt?: Date;
  /** When the conversation last happened (newest message); undefined before the first word. */
  lastSaidAt?: Date;
  /** IANA timezone — "yesterday" and "today" are the user's days, not UTC's. */
  timezone?: string;
  now?: Date;
};

const OPENING_QUESTION = "What are we working with today?";
const REENTRY = "It’s been a minute. Want me to help figure out what’s still relevant?";

/**
 * The opening lines Lumi says on page open. Deterministic: no model call.
 * First line = recognition. Second line = somewhere to begin.
 *
 * The blank question is asked once — while there is no conversation to pick
 * up. From then on the second line continues from wherever we were, by how
 * long ago that was (same day · yesterday · a few days · a week or more),
 * never by what is undone.
 */
export function greeting(state: GreetingState): string[] {
  const now = state.now ?? new Date();
  const name = state.displayName ? `, ${state.displayName}.` : ".";
  const hello = `Good to see you${name}`;

  if (state.lastSeenAt && ["week_plus", "long"].includes(gapBucket(state.lastSeenAt, now))) {
    return [hello, REENTRY];
  }
  if (!state.lastSaidAt) return [hello, OPENING_QUESTION];

  const days = localDayDiff(state.lastSaidAt, now, state.timezone ?? "UTC");
  if (days <= 0) {
    if (gapBucket(state.lastSaidAt, now) === "just_now") return [hello, "Still here."];
    return [`Welcome back${name}`, "Where did we end up?"];
  }
  if (days === 1) return [hello, "Picking up from yesterday. What’s first today?"];
  if (days < 7) return [hello, "It’s been a few days. Where did we leave things?"];
  return [hello, REENTRY];
}

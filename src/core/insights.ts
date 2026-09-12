/**
 * Insights copy — deterministic, in Lumi's voice, no model call. Lives in
 * core so the words are reviewable in one place (docs/features.md → Insights).
 */
import { describeGap } from "./time";

export const INSIGHTS_LINES = {
  notConnected: "I can look through your recent mail for things that might need doing.",
  notConnectedAside: "Read-only. I keep a line per thing I notice — never the mail itself.",
  needsScope: "Google's connected, but not the mail part yet.",
  reading: "Having a look through your recent mail…",
  question: "Do any of these still need doing?",
  nothing: "Nothing in your recent mail that needs you.",
  disconnected: "Google's let go of the connection — connect it again and I'll have a look.",
} as const;

export function lookedLine(at: Date, now: Date = new Date()): string {
  const gap = describeGap(at, now);
  return gap === "just now" ? "Just looked." : `Last looked ${gap}.`;
}

/** "From Priya · Draft by Friday? · 2 days ago" — the one line that says where a lead came from. */
export function leadMetaLine(l: { fromName: string | null; subject: string | null; receivedAt: Date | null }, now: Date = new Date()): string {
  return [l.fromName ? `From ${l.fromName}` : null, l.subject, l.receivedAt ? describeGap(l.receivedAt, now) : null].filter(Boolean).join(" · ");
}

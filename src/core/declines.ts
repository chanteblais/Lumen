/**
 * "Not this": the six quick answers when the user turns down the plan's
 * current task. Framework-free and database-free so the Today card (client)
 * and the chat route (server) share one vocabulary. A decline is never a
 * failure — it is the best learning signal the product has.
 * See docs/today.md → Principles (5).
 */
export const DECLINE_REASONS = {
  too_big: "Too big",
  too_tired: "Too tired",
  unclear: "Don't know how",
  not_feeling_it: "Don't feel like it",
  something_else: "Something else is more important",
  nope: "Just nope",
} as const;

export type DeclineReason = keyof typeof DECLINE_REASONS;
export const DECLINE_REASON_KEYS = Object.keys(DECLINE_REASONS) as DeclineReason[];

export function isDeclineReason(s: unknown): s is DeclineReason {
  return typeof s === "string" && Object.hasOwn(DECLINE_REASONS, s);
}

/** The human label for a stored reason key; undefined for free text or none. */
export function declineLabel(reason: string | null | undefined): string | undefined {
  return isDeclineReason(reason) ? DECLINE_REASONS[reason] : undefined;
}

/** Lumi's line on the Today card once "Not this" is tapped. Deterministic — no model call. */
export const DECLINE_PROMPT = "Fair. What's getting in the way?";

/** The visible user message a quick answer sends into the conversation — exactly what they tapped. */
export function declineMessageText(title: string, reason?: DeclineReason): string {
  const label = reason ? DECLINE_REASONS[reason] : undefined;
  return label ? `Not this one: ${title} — ${label.toLowerCase()}.` : `Not this one: ${title}`;
}

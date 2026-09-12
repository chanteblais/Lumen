import { dayPart, describeGap, gapBucket } from "@/core/time";

export type ContextInput = {
  displayName: string;
  timezone: string;
  /** Previous visit; undefined on the first ever turn. */
  lastSeenAt?: Date;
  now?: Date;
};

/**
 * The volatile context block: everything about *this* user and *this* moment.
 * Regenerated every turn and placed after the cached persona. Keep it short;
 * grow it by adding lines, never by pasting prose.
 */
export function buildContextBlock(input: ContextInput): string {
  const now = input.now ?? new Date();
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: input.timezone,
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  const lines = [
    "## Right now",
    `- Talking with: ${input.displayName}. Use the name sparingly.`,
    `- Their local time: ${local} (${dayPart(now, input.timezone)}), timezone ${input.timezone}.`,
  ];

  if (!input.lastSeenAt) {
    lines.push("- First time here. No history yet.");
  } else {
    const bucket = gapBucket(input.lastSeenAt, now);
    if (bucket === "just_now" || bucket === "minutes") {
      lines.push("- Same sitting as their last message.");
    } else {
      lines.push(`- Last here: ${describeGap(input.lastSeenAt, now)}.`);
      if (bucket === "week_plus" || bucket === "long") {
        lines.push("- That's a long gap. If it comes up, treat coming back as easy; don't mention the length unless they do.");
      }
    }
  }
  return lines.join("\n");
}

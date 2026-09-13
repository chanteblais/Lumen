/**
 * "What Lumi knows" in Settings: the copy, the grouping and whose word each
 * belief rests on. Optional to visit and never asked for; no counts. Pure.
 * docs/features.md → Settings.
 */
import type { BeliefKind, MemoryNote } from "@/db/schema";
import { confidenceWord } from "@/core/domain/memory";

export const KNOWS_LINES = {
  title: "What Lumi knows",
  intro: "What she keeps between visits, so you don't have to say it twice. Correct anything that's off; forget anything you'd rather she didn't hold.",
  empty: "Nothing yet. She keeps what you tell her is worth keeping, and what turns out to help you start.",
  unavailable: "Couldn't reach what Lumi knows just now. Nothing's lost; try again in a bit.",
  later: "Your name and timezone, soon.",
} as const;

export const KIND_ORDER: readonly BeliefKind[] = ["project", "fact", "preference", "strategy", "pattern", "anti_pattern"];

export const KIND_HEADINGS: Record<BeliefKind, string> = {
  project: "What you're working on",
  fact: "About you",
  preference: "How you like her to be",
  strategy: "What helps you start",
  pattern: "What she's noticed",
  anti_pattern: "What tends not to help",
};

/** In kind order, newest first within each; kinds with nothing are left out. */
export function groupBeliefs<B extends Pick<MemoryNote, "kind" | "createdAt">>(beliefs: B[]): { kind: BeliefKind; heading: string; beliefs: B[] }[] {
  return KIND_ORDER.map((kind) => ({
    kind,
    heading: KIND_HEADINGS[kind],
    beliefs: beliefs.filter((b) => b.kind === kind).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  })).filter((g) => g.beliefs.length > 0);
}

/** "You told her · Sep 12" · "Her guess · fairly sure · Sep 10" · "From a session · guessing · Sep 10". */
export function provenanceLine(b: Pick<MemoryNote, "source" | "confidence" | "createdAt">, timeZone: string): string {
  const when = new Intl.DateTimeFormat("en-CA", { timeZone, month: "short", day: "numeric" }).format(b.createdAt);
  if (b.source === "user_said") return `You told her · ${when}`;
  return `${b.source === "reflection" ? "From a session" : "Her guess"} · ${confidenceWord(b.confidence)} · ${when}`;
}

/** Why a correction or a forgetting didn't go through, for the person making it. */
export function correctionError(why: string | undefined): string {
  switch (why) {
    case "secret":
      return "That looks like a password, code or ID number. She doesn't keep those.";
    case "instruction":
      return "She keeps notes about you, not instructions for herself.";
    case "content length":
      return "Keep it to a sentence.";
    case "not active":
    case "not found":
      return "That one has already changed. Refresh to see what she holds now.";
    default:
      return "That didn't save. Try again?";
  }
}

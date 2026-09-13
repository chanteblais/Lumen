/**
 * Which beliefs ride along on this turn — not all of them. First what she is
 * always meant to honour (how they like her to be, what helps them start),
 * then what the conversation is actually about, then the freshest projects and
 * facts, up to a budget. An old guess nothing ever confirmed fades out of the
 * block, but stays findable (`recall_memory`) and visible in Settings: fading
 * is not forgetting. Lexical on purpose — no embeddings until words stop being
 * enough. Pure. See docs/architecture.md → The understanding layer → Retrieval.
 */
import type { MemoryNote } from "@/db/schema";
import { contentWords } from "@/core/words";

export const MEMORY_BUDGET = 12;
export const STANDING_PREFERENCES = 5;
export const STANDING_STRATEGIES = 3;
export const RECENT_FILL = 3;
export const FADE_AFTER_DAYS = 60;
/** One word from the message clears it; words from earlier turns need company. */
export const MIN_RELEVANCE = 2;

const WEIGHT = { message: 3, focus: 2, recent: 1 } as const;

export type TurnSignals = {
  /** What they just said. */
  message: string;
  /** The last few messages before it, either side. */
  recent?: string[];
  /** What the turn is about beyond words: the running session's goal and first step, a Start with Lumi title. */
  focus?: (string | null | undefined)[];
};

export type SelectableBelief = Pick<MemoryNote, "id" | "kind" | "content" | "source" | "confidence" | "evidenceFor" | "evidenceAgainst" | "createdAt" | "lastConfirmedAt" | "retiredAt">;

/** Words that say nothing about which memory matters (stemmed the same way as the beliefs). */
const CHATTER = contentWords(
  "want wants need needs today tonight tomorrow just really like know think thinking going make time thing things something anything nothing okay ok yes yeah no not please thank thanks lumi can could would should will do did does done doing about some any now still again one also maybe sure good right day week back where when how why who which there here was were are am have has had been but so if as from up out into over than too very much more most all feel feeling bit lot let lets start started work working hey hi hello morning evening",
);

function termWeights(signals: TurnSignals): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (text: string | null | undefined, w: number) => {
    if (!text) return;
    for (const t of contentWords(text)) {
      if (t.length < 2 || CHATTER.has(t)) continue;
      weights.set(t, Math.max(weights.get(t) ?? 0, w));
    }
  };
  for (const r of signals.recent ?? []) add(r, WEIGHT.recent);
  for (const f of signals.focus ?? []) add(f, WEIGHT.focus);
  add(signals.message, WEIGHT.message);
  return weights;
}

function relevance(b: Pick<MemoryNote, "content" | "kind">, weights: Map<string, number>): number {
  let score = 0;
  for (const w of contentWords(b.content)) score += weights.get(w) ?? 0;
  // "what do you know about my projects / preferences" names the kind, not the content.
  for (const w of contentWords(b.kind.replace("_", " "))) score += weights.has(w) ? 1 : 0;
  return score;
}

const freshness = (b: SelectableBelief) => Math.max(b.createdAt.getTime(), b.lastConfirmedAt?.getTime() ?? 0);

/** A guess (not their word) below "fairly sure" that nothing has confirmed for 60 days. Derived at read time, never stored. */
export function isFaded(b: SelectableBelief, now: Date): boolean {
  if (b.source === "user_said" || b.confidence >= 0.5) return false;
  return now.getTime() - freshness(b) > FADE_AFTER_DAYS * 86_400_000;
}

export function selectBeliefs<B extends SelectableBelief>(beliefs: B[], signals: TurnSignals, now: Date = new Date(), budget = MEMORY_BUDGET): { chosen: B[]; heldBack: boolean } {
  const live = beliefs.filter((b) => !b.retiredAt && !isFaded(b, now));
  const chosen: B[] = [];
  const taken = new Set<string>();
  const take = (b: B) => {
    if (chosen.length >= budget || taken.has(b.id)) return;
    chosen.push(b);
    taken.add(b.id);
  };
  const byConfidence = (a: B, b: B) => b.confidence - a.confidence || freshness(b) - freshness(a);

  // Standing: how she should be, and what has helped them start.
  live.filter((b) => b.kind === "preference").sort(byConfidence).slice(0, STANDING_PREFERENCES).forEach(take);
  live
    .filter((b) => b.kind === "strategy")
    .sort((a, b) => b.evidenceFor - b.evidenceAgainst - (a.evidenceFor - a.evidenceAgainst) || byConfidence(a, b))
    .slice(0, STANDING_STRATEGIES)
    .forEach(take);

  // What this turn is about.
  const weights = termWeights(signals);
  live
    .filter((b) => !taken.has(b.id))
    .map((b) => ({ b, score: relevance(b, weights) }))
    .filter((x) => x.score >= MIN_RELEVANCE)
    .sort((x, y) => y.score - x.score || byConfidence(x.b, y.b))
    .forEach((x) => take(x.b));

  // Continuity: the freshest projects and facts.
  live
    .filter((b) => (b.kind === "project" || b.kind === "fact") && !taken.has(b.id))
    .sort((a, b) => freshness(b) - freshness(a))
    .slice(0, RECENT_FILL)
    .forEach(take);

  return { chosen, heldBack: beliefs.some((b) => !b.retiredAt && !taken.has(b.id)) };
}

/** A belief as a quoted value on one context line: it can't break the line or pose as a heading. */
export function asQuoted(content: string): string {
  return content.replace(/\s+/g, " ").replace(/"/g, "'").trim();
}

/** Whose word a belief rests on, as Lumi reads it in the context and in tool results. */
export function heldAs(source: MemoryNote["source"]): "their word" | "your guess" | "from a session" {
  return source === "user_said" ? "their word" : source === "reflection" ? "from a session" : "your guess";
}

/** `recall_memory`: every active belief, faded ones included, ranked against what she's looking for. */
export function rankForRecall<B extends SelectableBelief>(beliefs: B[], query: string, limit = 8): B[] {
  const weights = termWeights({ message: query });
  return beliefs
    .filter((b) => !b.retiredAt)
    .map((b) => ({ b, score: relevance(b, weights) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.b.confidence - x.b.confidence)
    .slice(0, limit)
    .map((x) => x.b);
}

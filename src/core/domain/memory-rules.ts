/**
 * What may be kept, and on whose word: the pure rules `memory.ts` enforces
 * before anything reaches `memory_notes`. Screens (secrets, instructions),
 * provenance (their words or a guess), duplicates, and the key a forgotten
 * belief leaves behind. No database. See docs/architecture.md → The
 * understanding layer.
 */
import { createHash } from "node:crypto";
import type { BeliefKind, BeliefSource } from "@/db/schema";
import { contentWords, normalizeText } from "@/core/words";

/** Every kind of belief, in the order the tools' and reflection's schemas list them (that order is part of the cached prefix). */
export const BELIEF_KINDS = ["fact", "project", "preference", "strategy", "pattern", "anti_pattern"] as const satisfies readonly BeliefKind[];

export const CONTENT_MIN = 3;
export const CONTENT_MAX = 240;
/** A guess never starts out sure. Evidence (confirm) can raise it later; creation can't. */
export const MAX_INFERRED_CONFIDENCE = 0.6;

/** One line, no markdown that could pose as a section of the context block. */
export function cleanContent(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/`/g, "'")
    .replace(/^[\s#>*-]+/, "")
    .trim();
}

/** Confidence at creation: their word up to 0.98, anything inferred up to 0.6. */
export function boundConfidence(source: BeliefSource, c: number): number {
  const cap = source === "user_said" ? 0.98 : MAX_INFERRED_CONFIDENCE;
  return Math.max(0.05, Math.min(cap, Math.round(c * 100) / 100));
}

/* ------------------------------------------------------------ screens */

export type ScreenReason = "secret" | "instruction";

const SECRET_PATTERNS: RegExp[] = [
  // "my password is …", "PIN: 4821", "the door code is 1234"
  /\b(?:password|passcode|passphrase|pin|pin code|pin number|door code|alarm code|lock code|security code|cvv|cvc|one[- ]time code|verification code|2fa code|backup code|recovery code|seed phrase|private key|api key|secret key|access token|auth token)\s*(?:is|was|=|:)\s*\S+/i,
  /\b(?:sk|pk|rk)[-_](?:live[-_]|test[-_]|proj[-_])?[A-Za-z0-9]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  // A long random-looking token: letters and digits mixed, 32+ characters.
  /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/, // US SSN
  /\b\d{3}[ -]\d{3}[ -]\d{3}\b/, // Canadian SIN
  /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}\b/, // IBAN
  /\b(?:account|routing|transit|passport|licen[cs]e|health card|social insurance|social security|sin|ssn|tax id|credit card|debit card|card)\s*(?:number|no\.?|#)\s*(?:is|was|=|:)?\s*[A-Z0-9 -]*\d{4,}/i,
];

const INSTRUCTION_PATTERNS: RegExp[] = [
  /\b(?:ignore|disregard|override|bypass|forget)\s+(?:all\s+|any\s+)?(?:of\s+)?(?:your|previous|prior|above|earlier|lumi'?s|system|all)\s+(?:\w+\s+)?(?:instructions?|rules|guidelines|guardrails|prompts?|persona)\b/i,
  /\b(?:system prompt|developer message|jailbreak|prompt injection)\b/i,
  /\byou are (?:now|no longer)\b/i,
  /\b(?:reveal|print|repeat|show)\b[^.]{0,30}\b(?:your prompt|system prompt|instructions|context block)\b/i,
  /<\/?\s*(?:system|assistant|developer|instructions?)\s*>/i,
  /^\s*(?:system|assistant|developer)\s*:/i,
  // Naming a tool: "call forget_belief", "use create_intention"
  /\b(?:call|use|run|invoke)\s+(?:the\s+)?[a-z]+_[a-z_]+\b/i,
];

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function hasCardNumber(s: string): boolean {
  for (const m of s.matchAll(/\b\d(?:[ -]?\d){12,18}\b/g)) {
    const d = m[0].replace(/\D/g, "");
    if (d.length >= 13 && d.length <= 19 && luhn(d)) return true;
  }
  return false;
}

export function looksSecret(s: string): boolean {
  return hasCardNumber(s) || SECRET_PATTERNS.some((re) => re.test(s));
}

export function looksLikeInstruction(s: string): boolean {
  return INSTRUCTION_PATTERNS.some((re) => re.test(s));
}

/**
 * Why this may not be kept, or null when it may. Not a privacy screen (that
 * waits, Chanté 2026-09-13): secrets would ride along to the model on every
 * turn, and an instruction stored as a note would talk to Lumi as if it were
 * her rules. Neither is kept, whoever asks.
 */
export function screenMemory(content: string): ScreenReason | null {
  if (looksSecret(content)) return "secret";
  if (looksLikeInstruction(content)) return "instruction";
  return null;
}

/* --------------------------------------------------------- provenance */

/** Something the user actually typed (or said by voice) this turn or lately. */
export type Heard = { messageId: string; text: string };

/** At least two words and eight characters: enough that a match means they said it. */
export const QUOTE_MIN_CHARS = 8;

/**
 * The message of theirs that contains these words — whole words, in order,
 * case and punctuation aside — newest first. Undefined when the quote is too
 * short to mean anything or isn't theirs. This is what makes `user_said` a
 * fact the code checked, not a label the model chose.
 */
export function findTheirWords(quote: string | undefined, heard: Heard[]): Heard | undefined {
  if (!quote) return undefined;
  const q = normalizeText(quote);
  if (q.length < QUOTE_MIN_CHARS || !q.includes(" ")) return undefined;
  for (let i = heard.length - 1; i >= 0; i--) {
    if (` ${normalizeText(heard[i].text)} `.includes(` ${q} `)) return heard[i];
  }
  return undefined;
}

/* --------------------------------------------------------- duplicates */

/** Share of content words in common (Jaccard). */
export function wordOverlap(a: string, b: string): { shared: number; ratio: number } {
  const x = contentWords(a);
  const y = contentWords(b);
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  const union = x.size + y.size - shared;
  return { shared, ratio: union ? shared / union : 0 };
}

export const DUPLICATE_OVERLAP = 0.75;

/** The same thing said again: "Thesis due October 30." ≈ "My thesis is due October 30". */
export function isNearDuplicate(a: string, b: string): boolean {
  if (normalizeText(a) === normalizeText(b)) return true;
  return wordOverlap(a, b).ratio >= DUPLICATE_OVERLAP;
}

/** Close enough that one may update or contradict the other ("due Oct 30" / "due Nov 14"). */
export function isSimilar(a: string, b: string): boolean {
  const o = wordOverlap(a, b);
  return o.shared >= 2 && o.ratio >= 0.3;
}

/**
 * A one-way key for a belief's content words. A forgotten belief leaves only
 * this behind (in its `memory.deleted` event), so an inference can't quietly
 * bring it back — and nothing readable is kept.
 */
export function contentKey(content: string): string {
  const words = [...contentWords(content)].sort().join(" ") || normalizeText(content);
  return createHash("sha256").update(words).digest("hex").slice(0, 32);
}

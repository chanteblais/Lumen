/**
 * Words as the understanding layer compares them: lower-case, unpunctuated,
 * content words lightly stemmed, so two wordings of one thing line up —
 * a strategy and a session's approach (reflection), a new belief and one
 * already held (duplicates), a belief and what the conversation is about
 * (relevance). Pure.
 */

/** Lower-case, unpunctuated, single-spaced. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(["the", "a", "an", "to", "of", "and", "or", "in", "on", "at", "for", "with", "by", "it", "its", "is", "be", "her", "him", "them", "their", "she", "he", "they", "i", "me", "my", "you", "your", "that", "this", "what", "gets", "get", "got", "helps", "help", "then"]);

/** Content words, lightly stemmed ("reading" ≈ "read", "sentences" ≈ "sentence"). */
export function contentWords(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of normalizeText(s).split(" ")) {
    if (!w || STOPWORDS.has(w)) continue;
    let t = w;
    if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
    else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
    if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
    if (t.length > 4 && t.endsWith("e")) t = t.slice(0, -1); // write ≈ writing, sentence ≈ sentences
    out.add(t);
  }
  return out;
}

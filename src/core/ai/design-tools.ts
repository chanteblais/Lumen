/**
 * Lumi's two design-notebook tools, built only for design partners
 * (`ToolContext.designPartner`): `contribute_design` adds, revises, supersedes
 * or withdraws a note of her own, without asking; `design_feedback` records
 * their explicit reaction to one part of one note, on their checked words.
 * Neither writes anywhere but the notebook — no canonical doc, no repository,
 * no requirement. Descriptions are part of the cached prefix for design
 * partners: keep them stable (prefix.test.ts).
 */
import { tool } from "ai";
import { z } from "zod";
import type { Db } from "@/db/client";
import {
  contributeDesign,
  DESIGN_KINDS,
  DESIGN_TARGETS,
  DESIGN_VERDICTS,
  parseRef,
  recordDesignFeedback,
  refLabel,
  reviseDesign,
  type DesignWrite,
} from "@/core/domain/design-contributions";
import { findTheirWords, type Heard } from "@/core/domain/memory-rules";

function safe<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  return fn().catch((e: unknown) => ({ error: e instanceof Error ? e.message : "failed" }));
}

const WHY_NOT: Record<string, string> = {
  too_short: "not kept: a note needs a title and an insight of its own",
  secret: "not kept: it looks like a password, code, key or ID number",
  instruction: "not kept: it reads like an instruction to you, not a design note",
  not_found: "no such note — use an id from Your design notebook",
  superseded: "that note was superseded; revise the note that replaced it",
  withdrawn: "that note was withdrawn; add a new one if the thinking came back",
  unchanged: "nothing changed",
  no_possibility: "that note has no possibility",
  changed_meanwhile: "the note changed meanwhile — try again",
};

/** Optional text the model may fill with null for "none". Generous caps: the domain trims to its own. */
const text = (max: number, describe: string) => z.string().max(max).nullable().optional().describe(describe);
const REF = z.string().max(12);

const refs = (xs: (string | null | undefined)[] | null | undefined) => (xs ?? []).map((x) => parseRef(x)).filter((r): r is number => r !== undefined);
/** In a revision, null means "leave it". */
const keep = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

function result(w: DesignWrite, extra: Record<string, unknown> = {}) {
  if ("skipped" in w) {
    if (w.skipped === "already_held" && w.existing)
      return { already_held: refLabel(w.existing.ref), title: w.existing.title, insight_status: w.existing.insightStatus, note: "a note already says this — revise it instead of adding another" };
    return { error: WHY_NOT[w.skipped] ?? w.skipped };
  }
  const c = w.contribution;
  return {
    id: refLabel(c.ref),
    title: c.title,
    insight_status: c.insightStatus,
    possibility_status: c.possibilityStatus,
    stated: c.statedSource,
    ...(c.retractedAt ? { withdrawn: true } : {}),
    ...(w.replaced ? { supersedes: refLabel(w.replaced.ref) } : {}),
    ...extra,
  };
}

export function designTools(db: Db, userId: string, userWords: Heard[]) {
  return {
    contribute_design: tool({
      description:
        "Your design notebook on Coherence — only in conversations about designing Coherence itself. Add a note quietly, without asking, when the conversation surfaces something worth their attention: an insight and what follows from it, a tension between what they want and an interaction on the table, an assumption worth questioning, a possibility, or a shift in thinking. Keep the layers apart: their_words is the direction they stated, copied exactly from their message (checked; otherwise held as your paraphrase); insight is your reading; possibility is a design idea, which stays unendorsed until they endorse that part. revises: a note of yours whose thinking moved — send only what changes, with change_note; retract: true withdraws it. supersedes: an older note this new one replaces. related: notes that bear on it. Returns already_held when a note says this already. Never their own tasks or personal life, never secrets.",
      inputSchema: z.object({
        revises: REF.nullable().optional().describe("DC-n of a note to revise or withdraw; null for a new note"),
        kind: z.enum(DESIGN_KINDS).nullable().optional().describe("For a new note"),
        title: text(160, "A few words; for a new note"),
        insight: text(900, "Your observation and what follows from it — yours, not theirs; for a new note"),
        area: text(60, "Where in Coherence it bears: Today, Home, Library, Lists, Lumi, Focus; null if across Coherence"),
        their_words: text(500, "The direction they stated that it rests on, copied exactly from their message; null if none"),
        possibility: text(700, "A design possibility that follows, kept apart from the insight; null if none"),
        why_it_matters: text(600, "Why it might matter for the product"),
        uncertainty: text(450, "What's unresolved or uncertain about it"),
        prompted_by: text(300, "What in the conversation prompted it, in a few words — no personal details"),
        related: z.array(REF).max(6).nullable().optional().describe("DC-n of notes that bear on it"),
        supersedes: REF.nullable().optional().describe("DC-n of an older note this new one replaces"),
        retract: z.boolean().nullable().optional().describe("With revises: withdraw the note"),
        change_note: text(450, "With revises: why your thinking moved"),
      }),
      execute: (input) =>
        safe(async () => {
          const heard = findTheirWords(input.their_words ?? undefined, userWords);
          const statedSource = heard ? ("their_words" as const) : ("lumi_paraphrase" as const);
          const unmatched = input.their_words && !heard ? { note: "their_words didn't match anything they said, so the direction is held as your paraphrase" } : {};

          if (input.revises) {
            const ref = parseRef(input.revises);
            if (!ref) return { error: WHY_NOT.not_found };
            const w = await reviseDesign(db, userId, ref, {
              title: keep(input.title),
              insight: keep(input.insight),
              area: keep(input.area),
              statedDirection: keep(input.their_words),
              statedSource,
              possibility: keep(input.possibility),
              whyItMatters: keep(input.why_it_matters),
              uncertainty: keep(input.uncertainty),
              relatedRefs: refs(input.related),
              retract: input.retract === true,
              note: input.change_note,
            });
            return result(w, { change: input.retract ? "withdrawn" : "revised", ...unmatched });
          }

          if (!input.kind || !input.title || !input.insight) return { error: "a new note needs kind, title and insight" };
          const supersedes = input.supersedes ? parseRef(input.supersedes) : undefined;
          if (input.supersedes && !supersedes) return { error: WHY_NOT.not_found };
          const w = await contributeDesign(db, userId, {
            kind: input.kind,
            title: input.title,
            insight: input.insight,
            area: input.area,
            statedDirection: input.their_words,
            statedSource,
            possibility: input.possibility,
            whyItMatters: input.why_it_matters,
            uncertainty: input.uncertainty,
            promptedBy: input.prompted_by,
            sourceMessageId: (heard ?? userWords.at(-1))?.messageId,
            relatedRefs: refs(input.related),
            supersedesRef: supersedes,
          });
          return result(w, { change: "noted", ...unmatched });
        }),
    }),

    design_feedback: tool({
      description:
        "They reacted to a note in Your design notebook — agreed, disagreed, \"yes, but…\", \"not quite, it's…\". on: the part they meant — insight (your reading, the problem) or possibility (the design idea); agreeing with one is not agreeing with the other. verdict: endorse, reject, qualify (agree with a condition) or correct (right area, wrong reading). their_words: what they said, copied exactly (checked). note: their point in a sentence. For qualify or correct, revised_insight or revised_possibility — the part they meant — holds the note as it stands now; the old wording stays in its history. Only on their explicit reaction: silence, thanks or moving on is not feedback.",
      inputSchema: z.object({
        id: REF.describe("DC-n from Your design notebook"),
        on: z.enum(DESIGN_TARGETS),
        verdict: z.enum(DESIGN_VERDICTS),
        their_words: z.string().min(1).max(500),
        note: text(450, "Their point in a sentence; null if the verdict says it all"),
        revised_title: text(160, "For qualify or correct, if the title should change"),
        revised_insight: text(900, "For qualify or correct on the insight: the reading as it stands now"),
        revised_possibility: text(700, "For qualify or correct on the possibility: the idea as it stands now"),
      }),
      execute: (input) =>
        safe(async () => {
          const ref = parseRef(input.id);
          if (!ref) return { error: WHY_NOT.not_found };
          if (!findTheirWords(input.their_words, userWords)) return { error: "their_words must be copied from what they said — feedback goes on their word" };
          const w = await recordDesignFeedback(db, userId, ref, {
            target: input.on,
            verdict: input.verdict,
            theirWords: input.their_words,
            note: input.note,
            revisedTitle: input.revised_title,
            revisedText: input.on === "insight" ? input.revised_insight : input.revised_possibility,
          });
          return result(w, { on: input.on, verdict: input.verdict });
        }),
    }),
  };
}

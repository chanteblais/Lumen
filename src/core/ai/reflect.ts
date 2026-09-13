/**
 * Reflection v1: what one finished focus session says about what helps this
 * person start. Code decides the part that needs no judgement — a completed
 * session whose approach matches a strategy belief confirms it, an abandoned
 * one contradicts it — then one model call with structured output may
 * propose a few more operations, which `core/domain/memory.ts` applies under
 * its guardrails. Runs in the chat route's `after()` when a session ends; the
 * user never sees it and never rates anything. See docs/architecture.md → The
 * understanding layer.
 */
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { users, type BeliefKind, type FocusSession, type MemoryNote, type User } from "@/db/schema";
import { ensureMainConversation, loadRecentMessages } from "@/core/domain/conversations";
import { appendEvent, listEventsSince, reflectedOn } from "@/core/domain/events";
import { applyBeliefOps, listActiveBeliefs, MAX_OPS_PER_RUN, type BeliefOp } from "@/core/domain/memory";
import { getSession } from "@/core/domain/sessions";
import { describeGap, dayPart } from "@/core/time";
import { chatModel, effortOptions } from "./model";

const KINDS = ["fact", "project", "preference", "strategy", "pattern", "anti_pattern"] as const;
const MAX_MODEL_CONFIDENCE = 0.6;

/** One proposed operation, flat so structured output stays simple. */
const RawOpSchema = z.object({
  op: z.enum(["create", "confirm", "contradict", "revise"]),
  id: z.string().optional().describe("For confirm / contradict / revise: the belief id from the list"),
  kind: z.enum(KINDS).optional().describe("For create"),
  content: z.string().max(240).optional().describe("For create / revise: one sentence, present tense, about what works — never about who they are"),
  confidence: z.number().min(0.05).max(MAX_MODEL_CONFIDENCE).optional().describe("For create. Modest: one session is thin evidence"),
  note: z.string().max(200).optional().describe("For contradict: what went against it"),
});
export type RawOp = z.infer<typeof RawOpSchema>;

const ReflectionSchema = z.object({
  ops: z.array(RawOpSchema).max(MAX_OPS_PER_RUN),
});

const REFLECTION_RULES = `You are the reflection step behind Lumi, a companion for getting started. One focus session has just ended. From the session, its check-ins, the conversation around it and what is already believed, propose belief operations — or none.

Rules:
- Only what this session is real evidence for. An empty list is a good answer.
- Prefer confirm / contradict / revise of an existing belief over creating one. Use ids from the list; never invent one. A strategy gets evidence only from a session that actually used it (its approach or first step names it) — the code drops anything else.
- Create a strategy only when the session was completed and the way in was specific ("reads the last paragraph first"), and no existing strategy already says it. Create an anti_pattern only when the session was abandoned or stopped early and the transcript shows a clear cause. A pattern (time of day, capacity) almost never comes from one session; only if the transcript states it.
- Beliefs describe what works for this person, never who they are. No judgements, no diagnoses, no productivity language. One sentence, present tense, plain.
- Confidence stays modest; the code caps it.
- Operations already applied by code (listed) are done — don't repeat them.`;

/** Lower-case, unpunctuated, single-spaced: the same strategy said two ways still matches. */
export function normalizeStrategy(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(["the", "a", "an", "to", "of", "and", "or", "in", "on", "at", "for", "with", "by", "it", "its", "is", "be", "her", "him", "them", "their", "she", "he", "they", "i", "me", "my", "you", "your", "that", "this", "what", "gets", "get", "got", "helps", "help", "then"]);

/** Content words, lightly stemmed ("reading" ≈ "read", "sentences" ≈ "sentence"), so two wordings of one strategy line up. */
export function strategyTokens(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of normalizeStrategy(s).split(" ")) {
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

/**
 * Does a session's approach name this strategy belief? The approach's content
 * words (at least two of them) all appear in the belief, or the other way
 * round — "read the last paragraph first" matches "Reading the last paragraph
 * first gets her started." Never across kinds; never on a one-word approach.
 */
export function matchesStrategy(approach: string, belief: Pick<MemoryNote, "kind" | "content">): boolean {
  if (belief.kind !== "strategy") return false;
  const a = strategyTokens(approach);
  const b = strategyTokens(belief.content);
  if (a.size < 2 || b.size < 2) return false;
  const subset = (x: Set<string>, y: Set<string>) => [...x].every((t) => y.has(t));
  return subset(a, b) || subset(b, a);
}

/**
 * The part that needs no judgement. Completed + a matching strategy →
 * confirm; abandoned + a matching strategy → contradict. Stopped early is
 * neutral: stopping is allowed, and says little about the way in. Pure.
 */
export function deterministicSessionOps(session: Pick<FocusSession, "approach" | "outcome" | "goal">, beliefs: Pick<MemoryNote, "id" | "kind" | "content" | "retiredAt">[]): BeliefOp[] {
  if (!session.approach) return [];
  const matching = beliefs.filter((b) => !b.retiredAt && matchesStrategy(session.approach!, b));
  if (session.outcome === "completed") return matching.map((b) => ({ op: "confirm", id: b.id }));
  if (session.outcome === "abandoned") return matching.map((b) => ({ op: "contradict", id: b.id, note: `a session on "${session.goal}" that began this way was left open` }));
  return [];
}

/** A session that barely began says nothing a model call could learn from; only the code step runs. */
export const MIN_MINUTES_FOR_MODEL_STEP = 3;
export function worthModelStep(s: Pick<FocusSession, "outcome" | "startedAt" | "endedAt">): boolean {
  if (s.outcome === "completed") return true;
  if (!s.endedAt) return false;
  return (s.endedAt.getTime() - s.startedAt.getTime()) / 60_000 >= MIN_MINUTES_FOR_MODEL_STEP;
}

/** Did this session use this strategy — as its named approach, or as its first step? */
export function sessionUsedStrategy(session: Pick<FocusSession, "approach" | "firstStep">, belief: Pick<MemoryNote, "kind" | "content">): boolean {
  return (session.approach ? matchesStrategy(session.approach, belief) : false) || matchesStrategy(session.firstStep, belief);
}

/**
 * Guardrails over what the model proposed: ids must be active beliefs not
 * already touched this run; a strategy gets evidence only from a session that
 * actually used it; creates are `reflection`-sourced at modest confidence; a
 * strategy that already exists is not created twice; the run's total stays
 * under the cap. Pure.
 */
export function clampReflectionOps(
  raw: RawOp[],
  beliefs: Pick<MemoryNote, "id" | "kind" | "content" | "retiredAt">[],
  already: BeliefOp[],
  session?: Pick<FocusSession, "approach" | "firstStep">,
): BeliefOp[] {
  const active = new Map(beliefs.filter((b) => !b.retiredAt).map((b) => [b.id, b] as const));
  const touched = new Set(already.map((o) => ("id" in o ? o.id : "")));
  const out: BeliefOp[] = [];
  const room = Math.max(0, MAX_OPS_PER_RUN - already.length);
  for (const r of raw) {
    if (out.length >= room) break;
    if (r.op === "create") {
      const content = r.content?.trim() ?? "";
      if (!r.kind || content.length < 3) continue;
      if (r.kind === "strategy" && [...active.values()].some((b) => matchesStrategy(content, b))) continue;
      out.push({ op: "create", kind: r.kind as BeliefKind, content, source: "reflection", confidence: Math.min(MAX_MODEL_CONFIDENCE, r.confidence ?? 0.45) });
      continue;
    }
    if (!r.id || !active.has(r.id) || touched.has(r.id)) continue;
    const b = active.get(r.id)!;
    if (b.kind === "strategy" && r.op !== "revise" && !(session && sessionUsedStrategy(session, b))) continue;
    touched.add(r.id);
    if (r.op === "confirm") out.push({ op: "confirm", id: r.id });
    else if (r.op === "contradict") out.push({ op: "contradict", id: r.id, note: r.note });
    else if (r.op === "revise" && r.content && r.content.trim().length >= 3) out.push({ op: "revise", id: r.id, content: r.content.trim() });
  }
  return out;
}

export type SessionReflectionInputs = {
  session: FocusSession;
  beliefs: MemoryNote[];
  checkIns: { response: string; minute: number }[];
  transcript: { role: "user" | "assistant"; text: string }[];
  applied: BeliefOp[];
  timezone: string;
  now: Date;
};

/** The inputs block the model sees. Compact; ids only where an op could use them. */
export function describeSession(i: SessionReflectionInputs): string {
  const s = i.session;
  const outcome = s.outcome === "completed" ? "completed" : s.outcome === "stopped_early" ? "stopped early" : s.outcome === "abandoned" ? "abandoned (left open, closed on a later visit)" : "unknown";
  const lines = [
    "## The session",
    `- Goal: "${s.goal}"`,
    `- First step: ${s.firstStep}`,
    s.approach ? `- Approach tried: ${s.approach}` : "- Approach: none named",
    `- Planned ${s.plannedMinutes} min; ${s.endedAt ? `ran ${Math.max(0, Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60_000))} min` : "still open"}; outcome: ${outcome}`,
    `- Began ${describeGap(s.startedAt, i.now)}, in the ${dayPart(s.startedAt, i.timezone)} (their time).`,
  ];
  if (i.checkIns.length) {
    lines.push("", "## Check-ins (minute · answer)", ...i.checkIns.map((c) => `- ${c.minute} · ${c.response}`));
  }
  if (i.transcript.length) {
    lines.push("", "## Conversation around it (most recent last)", ...i.transcript.map((t) => `- ${t.role === "user" ? "them" : "Lumi"}: ${t.text}`));
  }
  lines.push("", "## What is already believed (id · kind · belief · confidence · helped for/against)");
  if (i.beliefs.length) for (const b of i.beliefs) lines.push(`- ${b.id} · ${b.kind} · ${b.content} · ${b.confidence.toFixed(2)} · ${b.evidenceFor}/${b.evidenceAgainst}`);
  else lines.push("- nothing yet");
  if (i.applied.length) {
    lines.push("", "## Already recorded for this session (by Lumi during it, or by code just now) — leave these beliefs alone", ...i.applied.map((o) => `- ${o.op}${"id" in o ? ` ${o.id}` : ""}`));
  }
  return lines.join("\n");
}

type Deps = {
  propose: (inputs: SessionReflectionInputs) => Promise<RawOp[]>;
  now: () => Date;
};

async function proposeWithModel(inputs: SessionReflectionInputs): Promise<RawOp[]> {
  const r = await generateText({
    model: chatModel(),
    instructions: [
      { role: "system", content: REFLECTION_RULES },
      { role: "system", content: describeSession(inputs) },
    ],
    prompt: "Propose the belief operations this session justifies. Return only the structured list.",
    output: Output.object({ schema: ReflectionSchema, name: "reflection" }),
    providerOptions: effortOptions("low"),
  });
  return r.output?.ops ?? [];
}

const live: Deps = { propose: proposeWithModel, now: () => new Date() };

/**
 * Reflect on one ended session — once: a session already reflected on is
 * left alone, so the abandoned-session sweep can hand the same id over from
 * every page open without doubling evidence. The deterministic operations are
 * applied even if the model call fails; the event and the watermark are
 * written either way.
 */
export async function reflectOnSession(db: Db, user: Pick<User, "id" | "timezone">, sessionId: string, deps: Partial<Deps> = {}): Promise<{ applied: BeliefOp[] } | undefined> {
  const d = { ...live, ...deps };
  const now = d.now();
  const session = await getSession(db, user.id, sessionId);
  if (!session?.endedAt) return undefined;
  if (await reflectedOn(db, user.id, session.id)) return undefined;

  const beliefs = await listActiveBeliefs(db, user.id);
  // Evidence Lumi already recorded during the session (confirm_belief in the
  // reply to "Done", say) is not recorded twice: those beliefs are off limits here.
  const touchedDuring = await listEventsSince(db, user.id, ["memory.confirmed", "memory.contradicted", "memory.revised", "memory.noted"], session.startedAt, 30);
  const already: BeliefOp[] = touchedDuring.filter((e) => e.subjectId).map((e) => ({ op: "confirm", id: e.subjectId! }));
  const touchedIds = new Set(already.map((o) => ("id" in o ? o.id : "")));
  const code = deterministicSessionOps(session, beliefs).filter((o) => !("id" in o) || !touchedIds.has(o.id));
  const first = await applyBeliefOps(db, user.id, code, "reflection");
  const applied = [...already, ...first.applied];

  let proposed: RawOp[] = [];
  if (!worthModelStep(session)) {
    // Ended within a couple of minutes without finishing: nothing to learn from yet.
  } else try {
    const [checkInEvents, conversation] = await Promise.all([
      listEventsSince(db, user.id, ["session.check_in"], session.startedAt, 30),
      ensureMainConversation(db, user.id),
    ]);
    const recent = await loadRecentMessages(db, conversation.id, 30);
    const since = session.startedAt.getTime() - 10 * 60_000; // the setup conversation just before the start counts
    const transcript = recent
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.metadata?.createdAt && new Date(m.metadata.createdAt).getTime() >= since)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        text: m.parts
          .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
          .map((p) => p.text.trim())
          .join(" ")
          .slice(0, 300),
      }))
      .filter((t) => t.text)
      .slice(-16);
    const checkIns = checkInEvents
      .filter((e) => e.subjectId === session.id)
      .reverse()
      .map((e) => {
        const p = e.payload as { response?: string; minute?: number };
        return { response: String(p.response ?? "?"), minute: Number(p.minute ?? 0) };
      });
    proposed = await d.propose({ session, beliefs, checkIns, transcript, applied, timezone: user.timezone, now });
  } catch (e) {
    console.error("[reflect] model step failed; code-applied ops stand", e);
  }

  const second = await applyBeliefOps(db, user.id, clampReflectionOps(proposed, beliefs, applied, session), "reflection");
  const ops = [...first.applied, ...second.applied];
  const done = d.now();
  await appendEvent(db, { userId: user.id, type: "reflection.ran", subjectType: "session", subjectId: session.id, payload: { trigger: "session_end", ops: ops.length }, occurredAt: done });
  await db.update(users).set({ lastReflectedAt: done }).where(eq(users.id, user.id));
  return { applied: ops };
}

/** Fire-and-forget for `after()`: never throws. */
export async function reflectAfterSession(db: Db, user: Pick<User, "id" | "timezone">, sessionId: string): Promise<void> {
  try {
    const r = await reflectOnSession(db, user, sessionId);
    if (process.env.NODE_ENV !== "production") console.log(`[reflect] session=${sessionId} ops=${r?.applied.length ?? 0}`);
  } catch (e) {
    console.error("[reflect] failed", e);
  }
}

#!/usr/bin/env node
// Conversation eval (docs/voice-eval-log.md → Conversations). Short scripted
// conversations with Lumi's real tools, against a throwaway database (PGlite,
// every migration applied), so what she does over several turns can be checked:
// whether she uses what Coherence holds, takes a correction, leaves reflection
// alone, and acts — not only how one reply sounds (voice-eval.mjs does that).
//
//   node --env-file=.env.local --import tsx scripts/conversation-eval.mjs [id…] [flags]
//
//   id…          only these scenarios (default: all; --list names them)
//   --both       each scenario twice at the same clock, with and without Lumi's
//                brief, and a blind packet: the two shuffled as A and B, the key apart
//   --no-brief   the persona without the brief (a single condition)
//   --at=ISO     the clock every turn sees (default: now), e.g. --at=2026-09-15T10:30:00-07:00
//   --out=DIR    where transcripts go (default: a fresh folder in the OS temp dir)
//   --dry        seed each scenario and print its first context block; no model calls
//   --list       print the scenarios and exit
//
// Nothing here touches the real database or any user. Model calls use LUMI_MODEL
// like the app (src/core/ai/model.ts). Checks come in two kinds: `must` is an
// action the right conversation needs (a tool call, a state change); `flag` is a
// sign for the grader, never a verdict on its own (voice-eval-log.md → Grading).

import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateText, stepCountIs } from "ai";
import { and, eq } from "drizzle-orm";
import { LUMI_BRIEF } from "../src/core/ai/brief.ts";
import { buildContextBlock } from "../src/core/ai/context.ts";
import { selectLibrary } from "../src/core/ai/library-select.ts";
import { selectBeliefs } from "../src/core/ai/memory-select.ts";
import { CHAT_MODEL_ID, cachedPrefixOptions, chatModel, chatProviderOptions } from "../src/core/ai/model.ts";
import { PERSONA } from "../src/core/ai/persona.ts";
import { buildTools } from "../src/core/ai/tools.ts";
import { listRecentActivity } from "../src/core/domain/activity.ts";
import { appendEvent, TODAY_BOUND_MS } from "../src/core/domain/events.ts";
import { completeIntention, createIntention, listOpenIntentions } from "../src/core/domain/intentions.ts";
import { loadLibraryOrNothing } from "../src/core/domain/library.ts";
import { applyBeliefOps, listActiveBeliefs } from "../src/core/domain/memory.ts";
import { loadSnapshot } from "../src/core/domain/snapshot.ts";
import { isReentry } from "../src/core/domain/users.ts";
import { events, intentions } from "../src/db/schema.ts";
import { createTestUser, openTestDb } from "../src/db/test-db.ts";

const DAY = 86_400_000;
const TIMEZONE = "America/Vancouver";

/** The clock every turn sees (--at); seeds are dated against it so staleness holds at any clock. Set in main. */
let clockMs = Date.now();
const daysAgo = (days) => new Date(clockMs - days * DAY);

/* ------------------------------------------------------------ scenarios */

/** Backdate an intention so it reads as stale, or as made long ago. */
async function age(db, id, days) {
  const at = daysAgo(days);
  await db.update(intentions).set({ lastTouchedAt: at, createdAt: at }).where(eq(intentions.id, id));
}

const byTitle = (rows, fragment) => rows.find((r) => r.title.toLowerCase().includes(fragment));
const replied = (calls, re, turn) => calls.some((c) => c.name === "_reply" && (turn === undefined || c.turn === turn) && re.test(c.text));

const SCENARIOS = [
  {
    id: "brain-dump",
    title: "A brain dump, then what's first",
    tests: "Capture without asking; the pile held without a count; one thing chosen.",
    lookFor: "Files every item silently, reflects the shape in a few lines, then picks one with a reason (or asks what's first). No numbered list back.",
    turns: [
      "ok brain dump: rewrite the thesis intro, email priya about the extension, book the dentist, fix the lamp wire, plan the washington trip, reply to sam",
      "ok. what's first?",
    ],
    checks: async ({ db, user, calls }) => [
      { kind: "must", label: "filed at least five of the six", ok: calls.filter((c) => c.name === "create_intention").length >= 5 },
      { kind: "must", label: "they're open intentions now", ok: (await listOpenIntentions(db, user.id)).length >= 5 },
      { kind: "flag", label: "counted the pile back (a number next to things/items)", ok: !replied(calls, /\b(\d+|five|six|seven)\s+(things|items|tasks)\b/i) },
    ],
  },
  {
    id: "coming-back",
    title: "Two weeks away, stale things, a relevance pass",
    tests: "Re-entry: time away named only to orient; the pass over stale items; letting go on their word; one small step after.",
    lookFor: "Doesn't reconstruct the gap or tally what piled up. If she names the time away, it helps them get their bearings rather than sounding owed. Names the stale things by shape in one pass, drops exactly what they release, keeps the rest without ceremony, ends with one small step.",
    gapDays: 16,
    setup: async ({ db, user }) => {
      const stale = [
        await createIntention(db, user.id, { title: "RSVP to Maya's wedding", dueAt: daysAgo(20), list: "Personal" }),
        await createIntention(db, user.id, { title: "Research a bike rack", list: "Home" }),
        await createIntention(db, user.id, { title: "Send the tax form to the accountant", list: "Admin" }),
      ];
      for (const [i, row] of stale.entries()) await age(db, row.id, 20 + i * 4);
      await createIntention(db, user.id, { title: "Draft the grant budget", list: "Work" });
      await createIntention(db, user.id, { title: "Book a haircut", list: "Personal" });
    },
    turns: [
      "hey. it's been a while",
      "yeah, help me figure out what still matters",
      "the wedding thing is long gone and I don't care about the bike rack anymore. the tax form still matters though",
    ],
    checks: async ({ db, user, calls }) => {
      const open = await listOpenIntentions(db, user.id);
      return [
        { kind: "must", label: "let the wedding RSVP go", ok: !byTitle(open, "wedding") },
        { kind: "must", label: "let the bike rack go", ok: !byTitle(open, "bike rack") },
        { kind: "must", label: "kept the tax form", ok: Boolean(byTitle(open, "tax form")) },
        { kind: "must", label: "kept the fresh ones (grant budget, haircut)", ok: Boolean(byTitle(open, "grant budget") && byTitle(open, "haircut")) },
        { kind: "flag", label: "tallied what piled up (a number next to things/items/tasks)", ok: !replied(calls, /\b(\d+|three|four|five)\s+(things|items|tasks)\b/i) },
      ];
    },
  },
  {
    id: "undo-a-tick",
    title: "Ticked by mistake on a page",
    tests: "Uses what Coherence already holds (Recent changes) instead of asking.",
    lookFor: "Puts it back without asking which one, in a line.",
    setup: async ({ db, user }) => {
      const row = await createIntention(db, user.id, { title: "Email Priya about the extension", list: "Work" });
      return { priya: row.id };
    },
    // After the seed events are pushed back: the tick itself is what just happened.
    justNow: async ({ db, user, ids }) => {
      await completeIntention(db, user.id, ids.priya, "app");
    },
    turns: ["oops, I didn't mean to tick that one off just now, can you put it back"],
    checks: async ({ db, user, calls, ids }) => [
      { kind: "must", label: "reopened the one they ticked", ok: calls.some((c) => c.name === "reopen_intention" && JSON.stringify(c.input).includes(ids.priya)) },
      { kind: "must", label: "it's open again", ok: (await listOpenIntentions(db, user.id)).some((i) => i.id === ids.priya) },
      { kind: "must", label: "made no duplicate", ok: !calls.some((c) => c.name === "create_intention") },
      { kind: "flag", label: "asked which one", ok: !replied(calls, /which (one|task|thing)\??/i) },
    ],
  },
  {
    id: "correction",
    title: "A fact they told her changes",
    tests: "Takes a correction to something they said, keeps it as theirs, doesn't apologise at length.",
    lookFor: "A \"got it\"-sized acknowledgement, the belief corrected with their words, then back to what they were worried about, using the new date.",
    setup: async ({ db, user }) => {
      await applyBeliefOps(db, user.id, [{ op: "create", kind: "fact", content: "Their thesis is due October 30.", source: "user_said" }], "user");
    },
    turns: ["I'm stressing about the thesis deadline", "actually it got moved, it's due November 14 now"],
    checks: async ({ db, user }) => {
      const active = (await listActiveBeliefs(db, user.id)).map((b) => b.content).join(" | ");
      return [
        { kind: "must", label: "holds November 14", ok: /november 14|nov(ember)? 14|14 november/i.test(active) },
        { kind: "must", label: "no longer holds October 30", ok: !/october 30|oct(ober)? 30/i.test(active) },
      ];
    },
  },
  {
    id: "stays-reflective",
    title: "A real question that isn't a task",
    tests: "Reflection left alone: no taskifying, no therapy-speak, moves toward a choice without forcing one.",
    lookFor: "Stays with the question and helps it get clearer; one question at a time; doesn't file anything or start a session; doesn't narrate feelings back.",
    turns: [
      "I've been wondering whether I even want to keep doing the PhD",
      "it's not a to-do, I just keep circling it",
      "I think what I miss is making things with my hands",
    ],
    checks: async ({ calls }) => [
      { kind: "must", label: "filed no task", ok: !calls.some((c) => c.name === "create_intention") },
      { kind: "must", label: "started no session", ok: !calls.some((c) => c.name === "start_focus_session") },
      { kind: "flag", label: "narrated feelings back (\"it sounds like you're feeling\")", ok: !replied(calls, /sounds like you('re| are) feeling/i) },
    ],
  },
  {
    id: "not-the-call",
    title: "What now, not that, and the obstacle",
    tests: "Picks one and reshapes Today; takes a refusal without persuasion; names the obstacle lightly, once.",
    lookFor: "Turn 1: picks one thing and says why. Turn 2: goes with the refusal, no persuasion. Turn 3: meets the obstacle (phone calls) with the smallest threshold, or leaves it, without guilt or a pep talk.",
    setup: async ({ db, user }) => {
      const call = await createIntention(db, user.id, { title: "Call the insurance company", list: "Admin", estimateMinutes: 20 });
      await age(db, call.id, 9);
      await createIntention(db, user.id, { title: "Reply to Sam", list: "Personal", estimateMinutes: 5, effortHint: "tiny" });
      await createIntention(db, user.id, { title: "Outline the methods section", list: "Thesis", estimateMinutes: 60 });
      await applyBeliefOps(db, user.id, [{ op: "create", kind: "pattern", content: "Keeps putting off the insurance call without saying why.", source: "lumi_inferred", confidence: 0.4 }], "lumi");
      return { call: call.id };
    },
    turns: ["what should I do now?", "not the insurance call", "I don't know, I just hate phone calls"],
    checks: async ({ calls }) => [
      { kind: "must", label: "reshaped Today when asked what now", ok: calls.some((c) => c.name === "reshape_today" && c.turn === 1) },
      { kind: "must", label: "didn't drop the call on its own", ok: !calls.some((c) => c.name === "drop_intention") },
    ],
  },
  {
    id: "body-double",
    title: "Company while working, with what she already knows",
    tests: "Settles what / first step / how long, taking what's known; starts the session; then one line.",
    lookFor: "Doesn't ask for what the intention already carries (the first step, the 45 minutes). Starts the session, one short line, then quiet.",
    setup: async ({ db, user }) => {
      const row = await createIntention(db, user.id, { title: "Edit chapter 3", nextAction: "Read the last paragraph you edited", estimateMinutes: 45, list: "Thesis" });
      return { chapter: row.id };
    },
    turns: ["Body double", "chapter 3", "yep"],
    checks: async ({ calls }) => [
      { kind: "must", label: "started a focus session", ok: calls.some((c) => c.name === "start_focus_session") },
      { kind: "flag", label: "asked how long, though the estimate is 45 min", ok: !replied(calls, /how long/i) },
    ],
  },
  {
    id: "low-day",
    title: "A 20% day",
    tests: "Capacity reported and used; the day made smaller, not apologetic.",
    lookFor: "Reports capacity without fuss, picks something small (Reply to Sam, not the rewrite), says once that it counts, no consolation.",
    setup: async ({ db, user }) => {
      await createIntention(db, user.id, { title: "Rewrite the thesis intro", list: "Thesis", estimateMinutes: 180, effortHint: "large" });
      await createIntention(db, user.id, { title: "Reply to Sam", list: "Personal", estimateMinutes: 5, effortHint: "tiny" });
      await createIntention(db, user.id, { title: "Clean the desk", list: "Home", estimateMinutes: 15, effortHint: "small" });
    },
    turns: ["I've got maybe 20% today", "so what's the one thing"],
    checks: async ({ calls }) => [
      { kind: "must", label: "reported capacity", ok: calls.some((c) => c.name === "report_capacity") },
      { kind: "flag", label: "picked the three-hour rewrite", ok: !calls.some((c) => c.name === "_reply" && c.turn === 2 && /rewrite/i.test(c.text) && !/not the rewrite|rewrite can wait/i.test(c.text)) },
    ],
  },
];

/* ---------------------------------------------------------------- run one */

function personaFor(brief) {
  if (brief) return PERSONA;
  const without = PERSONA.replace(`${LUMI_BRIEF}\n\n`, "");
  if (without === PERSONA) throw new Error("couldn't take the brief out of the persona: persona.ts no longer places it as expected");
  return without;
}

const short = (v) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 110 ? `${s.slice(0, 107)}…` : s;
};

async function runScenario(scenario, { brief, now, dry }) {
  const { db, close } = await openTestDb();
  try {
    const user = await createTestUser(db, "Chanté");
    const gapSeconds = Math.round((scenario.gapDays ?? 3 / 24) * 86_400);
    const ids = (await scenario.setup?.({ db, user, now })) ?? {};
    // Seeds are history, not this sitting: push their events out of Recent changes
    // (older than its 36h window), so Lumi doesn't read them as things she just did.
    await db.update(events).set({ occurredAt: daysAgo(2) }).where(and(eq(events.userId, user.id)));
    // What happened just before the first message (a tick on a page), then the visit itself.
    await scenario.justNow?.({ db, user, now, ids });
    await appendEvent(db, { userId: user.id, type: "app.opened", subjectType: "user", subjectId: user.id, payload: { gap_seconds: gapSeconds }, occurredAt: now });
    const lastSeenBefore = new Date(now.getTime() - gapSeconds * 1000);

    const messages = [];
    const heard = [];
    const calls = [];
    const turns = [];
    const system = personaFor(brief);

    for (const [index, text] of scenario.turns.entries()) {
      const turn = index + 1;
      heard.push({ messageId: randomUUID(), text });
      messages.push({ role: "user", content: text });

      const [snap, recentActivity, library] = await Promise.all([
        loadSnapshot(db, user, now),
        listRecentActivity(db, user.id, new Date(now.getTime() - TODAY_BOUND_MS)),
        loadLibraryOrNothing(db, user.id),
      ]);
      const signals = { message: text, recent: scenario.turns.slice(Math.max(0, index - 6), index), focus: [snap.session.active?.goal, snap.session.active?.firstStep] };
      const memory = selectBeliefs(snap.beliefs, signals, now);
      const context = buildContextBlock({
        displayName: user.displayName,
        timezone: TIMEZONE,
        now,
        // The first message comes after the gap; later ones are the same sitting.
        lastSeenAt: turn === 1 ? lastSeenBefore : new Date(now.getTime() - 60_000),
        sitting: snap.sitting,
        lists: snap.lists,
        openIntentions: snap.openIntentions,
        recentlyDone: snap.recentlyDone,
        recentActivity,
        beliefs: memory.chosen,
        memoryHeldBack: memory.heldBack,
        memoryUnavailable: snap.memoryUnavailable,
        library: selectLibrary(library.threads, library.notes, library.episodes, signals, { now, windowStartsAt: now }),
        libraryUnavailable: library.unavailable,
        capacity: snap.capacity,
        plan: snap.plan,
        declinedToday: snap.declinedToday,
        session: snap.session.active,
        lastSession: snap.session.last,
      });

      if (dry) {
        turns.push({ turn, you: text, context });
        break;
      }

      const recuts = [];
      const tools = buildTools({
        db,
        userId: user.id,
        timezone: TIMEZONE,
        preferences: user.preferences,
        reentry: isReentry(snap.sitting),
        onPlanChange: (r) => recuts.push(r.reason),
        userWords: heard.slice(-8),
      });
      const r = await generateText({
        model: chatModel(),
        tools,
        stopWhen: stepCountIs(5),
        instructions: [
          { role: "system", content: system, providerOptions: cachedPrefixOptions },
          { role: "system", content: context },
        ],
        messages,
        providerOptions: chatProviderOptions,
      });
      messages.push(...r.response.messages);

      const toolCalls = r.steps.flatMap((s) =>
        s.toolCalls.map((tc) => ({ turn, name: tc.toolName, input: tc.input, output: s.toolResults.find((tr) => tr.toolCallId === tc.toolCallId)?.output })),
      );
      const reply = r.steps.map((s) => s.text).filter(Boolean).join("\n").trim();
      calls.push(...toolCalls, { turn, name: "_reply", text: reply });
      const d = r.totalUsage.inputTokenDetails;
      turns.push({
        turn,
        you: text,
        lumi: reply,
        tools: toolCalls.map((c) => `${c.name}(${short(c.input)})`),
        recuts,
        usage: `in=${r.totalUsage.inputTokens} out=${r.totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} steps=${r.steps.length}`,
      });
    }

    const checks = dry ? [] : await scenario.checks({ db, user, calls, ids });
    return { id: scenario.id, brief, turns, checks };
  } catch (e) {
    return { id: scenario.id, brief, turns: [], checks: [], error: e instanceof Error ? e.stack ?? e.message : String(e) };
  } finally {
    await close();
  }
}

/* ------------------------------------------------------------- reporting */

const mark = (c) => (c.ok ? "✓" : c.kind === "must" ? "✗" : "⚑");

function transcript(result, { blindLabel } = {}) {
  const s = SCENARIOS.find((x) => x.id === result.id);
  const lines = [`### ${s.id} — ${s.title}${blindLabel ? ` · Conversation ${blindLabel}` : ` · brief ${result.brief ? "on" : "off"}`}`, "", `*Tests:* ${s.tests}`, `*Look for:* ${s.lookFor}`, ""];
  if (result.error) lines.push("**Error:**", "```", result.error, "```");
  for (const t of result.turns) {
    lines.push(`**You:** ${t.you}`, "");
    if (t.context) lines.push("```", t.context, "```", "");
    if (t.lumi !== undefined) lines.push(`**Lumi:** ${t.lumi.replace(/\n+/g, " / ") || "*(no text)*"}`, "");
    if (t.tools?.length) lines.push(`  ↳ ${t.tools.join(" · ")}`, "");
    if (!blindLabel && t.usage) lines.push(`  \`${t.usage}\``, "");
  }
  if (result.checks.length) lines.push("**Checks** (✓ held · ✗ a must missed · ⚑ a sign for the grader):", ...result.checks.map((c) => `- ${mark(c)} ${c.kind}: ${c.label}`), "");
  if (blindLabel) lines.push("**Grade:** Voice ☐ · Use ☐ · Notes:", "");
  return lines.join("\n");
}

function summaryLine(result) {
  if (result.error) return `  ${result.id.padEnd(18)} brief ${result.brief ? "on " : "off"}  ERROR ${result.error.split("\n")[0]}`;
  const musts = result.checks.filter((c) => c.kind === "must");
  const flags = result.checks.filter((c) => c.kind === "flag" && !c.ok);
  return `  ${result.id.padEnd(18)} brief ${result.brief ? "on " : "off"}  must ${musts.filter((c) => c.ok).length}/${musts.length}${flags.length ? `  ⚑ ${flags.map((f) => f.label).join("; ")}` : ""}`;
}

/* ------------------------------------------------------------------ main */

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

if (flag("list")) {
  for (const s of SCENARIOS) console.log(`${s.id.padEnd(18)} ${s.title}`);
  process.exit(0);
}

const wanted = args.filter((a) => !a.startsWith("--"));
const unknown = wanted.filter((id) => !SCENARIOS.some((s) => s.id === id));
if (unknown.length) {
  console.error(`Unknown scenario: ${unknown.join(", ")}. --list names them.`);
  process.exit(1);
}
const chosen = wanted.length ? SCENARIOS.filter((s) => wanted.includes(s.id)) : SCENARIOS;
const now = value("at") ? new Date(value("at")) : new Date();
if (Number.isNaN(now.getTime())) {
  console.error(`--at isn't a date: ${value("at")}`);
  process.exit(1);
}
clockMs = now.getTime();
const dry = flag("dry");
const conditions = flag("both") ? [true, false] : [!flag("no-brief")];
const out = value("out") ?? join(tmpdir(), "coherence-conversation-eval", now.toISOString().replace(/[:.]/g, "-"));

console.log(`Model: ${CHAT_MODEL_ID} · clock ${now.toISOString()} (${TIMEZONE}) · ${dry ? "dry run" : conditions.map((b) => `brief ${b ? "on" : "off"}`).join(" + ")}`);

const results = [];
for (const s of chosen) {
  for (const brief of conditions) {
    const r = await runScenario(s, { brief, now, dry });
    results.push(r);
    console.log(dry ? `  ${s.id} seeded${r.error ? ` — ERROR ${r.error.split("\n")[0]}` : ""}` : summaryLine(r));
  }
}

mkdirSync(out, { recursive: true });
const header = `# Conversation eval — ${CHAT_MODEL_ID} · ${now.toISOString()}\n\n`;
writeFileSync(join(out, "transcripts.md"), header + results.map((r) => transcript(r)).join("\n---\n\n"));
writeFileSync(join(out, "results.json"), JSON.stringify(results, null, 2));

if (!dry && conditions.length === 2) {
  // Blind packet: per scenario, the two conditions in a random order as A and B.
  // Nothing in it names the condition (token counts, which reveal the prefix size, stay out).
  const key = {};
  const blind = chosen.map((s) => {
    const pair = results.filter((r) => r.id === s.id);
    const [a, b] = Math.random() < 0.5 ? [pair[1], pair[0]] : pair;
    key[s.id] = { A: a.brief ? "brief on" : "brief off", B: b.brief ? "brief on" : "brief off" };
    return [transcript(a, { blindLabel: "A" }), transcript(b, { blindLabel: "B" })].join("\n");
  });
  writeFileSync(join(out, "blind.md"), `# Conversation eval — blind packet\n\nGrade each conversation on Voice and Use (docs/voice-eval-log.md → Grading) before opening key.json.\n\n${blind.join("\n---\n\n")}`);
  writeFileSync(join(out, "key.json"), JSON.stringify(key, null, 2));
}

console.log(`\nWrote ${out}/transcripts.md${!dry && conditions.length === 2 ? ", blind.md, key.json" : ""}, results.json`);

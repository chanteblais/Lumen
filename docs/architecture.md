# Lumen — Architecture

Status: **proposed 2026-09-11, pre-scaffold.** Revise freely until M2 lands; after that, changes go through `decisions.md`.

## 1. Stack

| Layer | Choice | Why (and the alternative considered) |
|---|---|---|
| App framework | **Next.js 16 (App Router, React 19), TypeScript** | One deployable for UI + API; Route Handlers stream; you already run this stack (Glåüm). Alternative: separate Hono/Fastify API + Vite SPA — cleaner for a future mobile client, but two deploys and more plumbing for a prototype. Mitigation: all domain + AI code lives in `src/core` with **zero Next/React imports**, so it can be lifted into a package or a separate server later. |
| AI runtime | **Vercel AI SDK v7** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) | Owns the hard, boring part of chat UX: streaming protocol, `useChat`, tool-call parts streamed into the UI, Zod-typed tools, multi-step loops, `UIMessage` persistence shape. `@ai-sdk/anthropic` is a first-party Anthropic provider (not an OpenAI-compatible shim); Anthropic-specific request fields (cache control, thinking, effort) pass through `providerOptions.anthropic`. Alternative: `@anthropic-ai/sdk` directly + hand-rolled SSE + React stream state — fewer abstractions and day-one access to every Anthropic feature, but ~2 days of plumbing we'd rather not own. **Escape hatch:** the model call is isolated in `src/core/ai/model.ts`; if a needed Anthropic feature can't pass through the provider, that one module switches to the raw SDK. |
| Model | **`claude-opus-5`** for the companion; adaptive thinking (default); `output_config.effort: "low"` for chat turns (raise to `medium` if quality demands) | Personality, judgement and restraint *are* the product; chat turns are short so per-turn cost is small. Prompt caching on the stable prefix (persona + tools) keeps input cost flat. `claude-sonnet-5` is the cost step-down lever; `claude-haiku-4-5` for background jobs (summaries, extraction) later. Enable server-side refusal fallbacks (`fallbacks: "default"`) if the provider exposes it; otherwise handle `stop_reason: "refusal"` gracefully (Lumi says "I couldn't answer that one" rather than erroring). |
| Database | **Postgres on Supabase**, accessed through **Drizzle ORM** over the `postgres` driver (Supavisor transaction pooler, `prepare: false`) — **not** `supabase-js` | Free tier, dashboard you know, pgvector available when memory needs embeddings. Drizzle makes the schema typed code (the domain model *is* the schema file), generates migrations, and has no vendor coupling — moving to Neon is a connection-string change. All DB access is server-side with the service role, so RLS is irrelevant. |
| Auth | **Clerk** (`@clerk/nextjs` 7) behind `src/lib/auth.ts` → `requireUser()` returning the **internal** `users.id` | Fastest path, Expo SDK exists for later. Nothing outside `lib/auth.ts`, `lib/auth-ui.tsx` and the sign-in/sign-up pages imports Clerk. Alternative: no auth for a single user — rejected: adding auth later touches every query; adding it now costs an hour. |
| Styling | **Tailwind v4** + CSS custom-property tokens; `next/font` for serifs | Tokens (`--ink`, `--paper`, `--brass`, `--rule`) defined once; Tailwind for layout only. No component library — the design is too specific and the surface too small. |
| Validation | **Zod 4** | Shared by tool input schemas and API bodies. |
| Voice | Two engines behind `useVoiceInput()` (`components/chat/voice/`): the **Web Speech API** where it works, else **Whisper in the browser** (`@huggingface/transformers`, `whisper-base.en` on WebGPU in a worker) → text into the same composer | Zero cost, no vendor, no key; audio never leaves the device. Speech engine: Chrome/Safari/Edge. Local engine: Brave, Firefox (Brave exposes the API but has no speech service behind it). Model (~90 MB) fetched from huggingface.co on the first tap and kept in the browser cache. |
| Hosting | **Vercel** (Hobby) + Supabase free tier | Streaming works under Fluid Compute; set `export const maxDuration = 60` on the chat route. Both free until real users. |
| Tests | **Vitest** on `src/core` only | Pure logic (staleness, context assembly, tool handlers against a test DB). No UI tests in V1. |

Env (`.env.local`): `ANTHROPIC_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

## 2. How the AI layer touches application state

**Principle: the conversation is the interface; structured state is the truth.** The model reads state through a context block and writes it through tools. The UI renders structured state from the database. Nothing ever parses Lumi's prose to discover what happened, and Lumi never edits state by "just saying so".

### One turn
```
client useChat ──POST /api/chat {messages}──▶ route handler
                                               │ requireUser()
                                               │ load conversation window (last ~30 UIMessages) + summary
                                               │ assembleContext(user)  → context block (see below)
                                               │ streamText({ system: [persona (cached) , context], messages, tools, stopWhen: stepCountIs(4) })
                                               │   tools execute server-side → DB writes + events → compact results
                                               │ onFinish: persist new user + assistant UIMessages; touch users.last_seen_at
                                               ◀── UIMessage stream (text parts + tool parts) ──
client renders text; tool parts render as quiet "ledger" lines (✦ Noted · Draft intro), with undo where cheap
```

### System prompt = stable prefix + volatile context
1. **Persona + behavioural rules + tool guidance** (`src/core/ai/persona.ts`). Byte-stable across turns; first cache breakpoint lives here. Keep it under ~2k tokens; the voice guide in `product.md` is its source.
2. **Context block** (`src/core/ai/context.ts`), regenerated every turn, placed *after* the cached prefix:
   - now (user's local time + weekday), timezone
   - time since last visit (`users.last_seen_at`), phrased in buckets ("3 hours", "9 days")
   - today's capacity report, if any
   - open intentions (≤ 25, newest-touched first; stale ones flagged `stale: 14d`), with ids
   - **recent changes** (≤ 12, newest first, last 36h; `core/domain/activity.ts`): every `intention.*` change joined to its title and current status, phrased by who did it — *they ticked "X" done on Today or Lists* (`payload.via: "app"`) vs *you marked "X" done* (a tool). This is how "add back the one I just checked off" works: ticks on a page never appear in the transcript, so the block carries them, with the id, and the persona says act on it rather than ask. Chat-only (pages don't load it).
   - recently done (≤ 5) with ids and when, so a mistaken tick can be undone by id (`reopen_intention`)
   - **active focus session** (M5), if any: id, goal, first step, minutes elapsed of planned, approach — with the instruction that Lumi is keeping them company (answer what they say, briefly; start nothing new). With none running, the last session that ended in the last day and a half (goal, first step, how it ended, when) for continuity — "pick it back up". A tap on the check-in or End arrives as this very message and gets a *Just now* line (what was tapped; that the session is already closed on Done/End; the intention id on Done so `complete_intention` is one call away)
   - beliefs (≤ 40), grouped by kind, ordered by confidence; strategies with evidence counts; low-confidence ones marked *tentative*
   - rolling summary of older conversation, if any
   - `preferences` (tone hint, default session length, check-in interval)
   The block is small on purpose. If a list outgrows its cap, we add a read tool (`search_intentions`) rather than growing the block.

### Tools (server-executed, Zod-typed, in `src/core/ai/tools.ts`) — built in M3; sessions in M5
Wired: `create_intention` (+ `list`, `estimate_minutes`), `update_intention`, `complete_intention`, `reopen_intention`, `drop_intention`, `report_capacity`, `start_focus_session`, `end_focus_session`, `remember`, `confirm_belief`, `contradict_belief`, `revise_belief`, `forget_belief`. The chat route runs `stopWhen: stepCountIs(5)` so Lumi can act, then speak. Completing/dropping through a tool also advances today's plan. The UI renders **ledger lines** (`components/chat/Ledger.tsx`) from tool parts — never from prose.
| Tool | Effect |
|---|---|
| `create_intention {title, next_action?, note?, due_at?, effort_hint?}` | insert; event `intention.created` |
| `update_intention {id, title?, next_action?, note?, due_at?, effort_hint?}` | patch; bumps `last_touched_at`; event |
| `complete_intention {id}` / `drop_intention {id, reason?}` | status change; event |
| `reopen_intention {id}` | done/dropped → open (a mistaken tick, a change of mind); event `intention.reopened {via: "chat"}`. Same domain call as the circle on Today/Lists (`via: "app"`). Does not touch today's path |
| `report_capacity {level, flags?, note?}` | event `capacity.reported` (source of truth for "today") |
| `start_focus_session {goal, first_step, approach?, minutes?, intention_id?}` | insert session (`minutes` defaults to `preferences.session_minutes`; `check_in_minutes` copied from preferences); `approach` = the strategy being tried, worded like an existing strategy belief when one fits; a session still open is closed as `stopped_early` first and reflected on; touches the intention; event `session.started`; returns the `SessionView` the client reads to show the bar (M5) |
| `end_focus_session {id, outcome: completed \| stopped_early}` | close when they say so in prose (Done/End taps close it in the route instead); event `session.ended`; flags `ToolContext.onSessionEnd` so the turn's `after()` reflects on it (M5) |
| `remember {kind, content, confidence?}` | new belief; `source: user_said` or `lumi_inferred` |
| `confirm {id}` / `contradict {id, note?}` | adjust evidence + confidence; events |
| `revise {id, content}` | new belief superseding the old (history kept) |
| `forget {id}` | user-requested retire |

Rules for tools:
- Every write tool also appends an `events` row (append-only). This is non-negotiable — it is the raw material for future pattern memory.
- Tool results are compact JSON (`{id, title, status}`), never prose. Lumi narrates in his own words.
- Tools never throw to the model; failures return `{error}` so Lumi can say "I couldn't save that" instead of the turn dying.
- No `list_*` read tools in V1; the context block covers reads. Add them when caps bite.
- Tool descriptions are part of the cached prefix — keep them stable.

### What is deterministic (no LLM call)
- **The greeting on page open.** Server-rendered from state: default "What are we working with today?"; after a gap ≥ 7 days, "It's been a minute. Want me to help figure out what's still relevant?"; with an abandoned session, "Looks like we left a session open on *X*." Instant, cheap, predictable — no wall of AI text on open. Lumi only speaks unprompted for session check-ins.
- **Focus session check-ins (M5).** The client timer (`components/focus/SessionBar.tsx`) fires at every `check_in_minutes` from the start and at the planned end when that comes first, strictly in the future (a page opened mid-session waits for the next boundary); the card asks *Still with it?* — or, at or past the planned length, *That's the time we set. Keep going?* — with Yep / Stuck / Got distracted / Done (`core/focus.ts` holds the copy and the timing). **Yep** → `POST /api/session` → `session.check_in {response: ok, minute}` and nothing else (no LLM call, no message). The other three, and **End** on the bar, post a real user message (the tap in words: "Stuck." / "Got distracted." / "Done." / "Let's stop here.") with `{ kind: "session_event", sessionId, response, minute }` in metadata; the route records the check-in, **closes the session in code on Done (`completed`) and End (`stopped_early`)** before the context is built, and Lumi replies in one line. Saying something else while the card is up dismisses it. Keeps Lumi "mostly quiet" and cheap.
- **Abandoned sessions (M5).** A session open past twice its planned length is closed as `abandoned` by `resolveSession` (`core/domain/sessions.ts`) — the one write inside `loadSnapshot`, so any page or turn does it. The Chat greeting then says "Looks like we left a session open on *X*. Pick it back up, or let it go?" until they've said anything since it closed; the context block carries the last session so "pick it back up" is one `start_focus_session` with the same goal.
- **Quick-start chips** ("Help me choose", "Break it down", "Body double", "Just talk") send a canned first user message. They are starting points, not modes.
- **Today's capacity prompt and the *Not this* question** (M4). "How much have we got today?" and "Fair. What's getting in the way?" are fixed copy in `core/declines.ts` / `components/today/CapacityPrompt.tsx`; the six decline answers post one visible user message (`{ kind: "declined", intentionId, reason }`) and Lumi replies to the reason.
- **Staleness, visit gap, sitting, "avoiding" signals** are derived queries (`src/core/domain`), never stored flags.

### The understanding layer (memory that learns)

This is a first-class subsystem, not a notes table. Its job: **continuously refine a model of what is most helpful to this particular user**, using their behaviour as the signal, without ever asking them to rate, tag, or maintain anything.

**Model: beliefs with evidence.** `memory_notes` rows are beliefs. Each has a `kind` (fact · project · preference · strategy · pattern · anti_pattern), a one-sentence `content`, a `confidence` (0–1), counts of `evidence_for` / `evidence_against`, timestamps for last confirmation and contradiction, and a `supersedes_id` so revisions keep history. Retirement is soft, with a reason. The user-facing name is **"What Lumi knows"**.

Facets and what they capture:
| kind | example | where the signal comes from |
|---|---|---|
| fact / project | "Thesis due 30 Oct; supervisor is Priya." | conversation |
| preference | "Wants blunt, short replies. Lists of options make her freeze." | conversation + how she responds to Lumi's style |
| strategy | "Opening the doc and reading the last paragraph gets her started." | sessions that begin with that approach and reach `completed` |
| pattern | "Starts real work after 10am; evenings are for small things." | events over time |
| anti_pattern | "Planning sessions become avoidance." | intentions touched repeatedly, never entered a session |

**Three inputs, one loop.**
1. **Explicit.** The user says something durable; Lumi calls `remember` (`source: user_said`, confidence 0.9). Corrections in Settings are `user_said` at 0.95 and retire the old belief — the highest-signal input there is.
2. **In-conversation inference.** Lumi notices ("third time this week you've mentioned that paper") and records a hypothesis at low confidence via `remember`, or adjusts an existing belief via `confirm` / `contradict` / `revise`. Tentative beliefs are rendered as tentative in the context block, so Lumi tests them gently ("Last time opening the doc first helped — try that?") rather than asserting them.
3. **Outcomes.** Every intervention is linked to a result through `events`. `start_focus_session` records the `approach` being tried; `session.ended` carries the outcome; `intention.completed` links back to the session. Nobody rates anything — starting, completing, abandoning and re-entering *are* the feedback.

**Reflection** (`src/core/ai/reflect.ts`) turns inputs 2 and 3 into belief updates. **Code applies the operations with guardrails** — never retire a `user_said` belief without the user, cap operations per run, every op writes a `memory.*` event — so the model proposes and the code decides. Triggers in V1 need no cron: (a) when a focus session ends (M5, built), (b) lazily on the first turn of a new local day (M6). Both run in Next's `after()` so they add no latency to the reply. Model: `claude-opus-5` at low effort while volume is tiny; `claude-haiku-4-5` is the step-down.

*Session-end reflection (M5, `reflectOnSession`)* runs in two steps. **Code first, no judgement:** a completed session whose `approach` names a `strategy` belief confirms it; an abandoned one contradicts it; stopped early is neutral (stopping is allowed and says little about the way in). The match is on content words, lightly stemmed (`matchesStrategy`: "read the last paragraph first" ≈ "Reading the last paragraph first gets her started."). **Then one model call** with structured output (`REFLECTION_RULES` + the session, its check-ins, the conversation around it, the active beliefs with ids) proposing `create | confirm | contradict | revise` (no retire — retirement only happens by contradiction drift or the user). `clampReflectionOps` keeps: ids that are active and untouched this run; strategy evidence only from a session that used that strategy (approach or first step); creates as `source: reflection` at ≤ 0.6; no strategy created twice; the run under `MAX_OPS_PER_RUN`. Evidence Lumi already recorded during the session (her own `confirm_belief` in the reply to "Done") is not recorded again. A session that ended within a couple of minutes without finishing skips the model step. Deterministic ops apply even if the model call fails; `reflection.ran {trigger: session_end, ops}` and `users.last_reflected_at` are written either way. Reflection runs **once per session** (`reflectedOn` checks for its `reflection.ran`): sessions ended in a chat turn are handed over by the route; a session the sweep closed as *abandoned* is handed over by the Chat page and by the next chat turn (whichever comes first), so leaving a session open is evidence too. Dev log: `[reflect] session=… ops=N`.

**Retrieval.** V1 injects all active beliefs, capped at ~40, ordered by kind then confidence, with strategies rendered alongside their evidence ("helped 4/5 sessions") so Lumi can prefer proven approaches. When beliefs outgrow the cap: pgvector embeddings and relevance retrieval on the current turn, and a `recall` tool.

**Adaptation without settings.** Tone, pace, and how much Lumi says are `preference` beliefs read by the persona each turn. There is no tone picker in V1; Lumi learns it, and the user can see and correct it in "What Lumi knows".

**Guardrails (EF check applies here too).** Learning is invisible and free: no thumbs, no tagging, no "was this helpful?", no memory setup. Beliefs never become stored judgements about the person's worth or capability — they describe what works, not who they are. Everything is visible and deletable.

### Conversation window
One continuous `main` conversation per user (Lumi is a person you keep talking to, not a folder of chats). The route loads the last ~30 messages; older history is folded into `conversations.summary` by a summarisation step that runs when the window overflows (M6). Time gaps between messages are rendered in the UI as fine rules with a date, and passed to the model as the visit-gap line — not as fake messages.

### Privacy posture
- Model calls happen only on the server; the key never reaches the client.
- Every table is keyed by `user_id`; export and delete are a single cascade.
- Conversation text never goes to Vercel logs; log ids and durations only.
- Anthropic API standard retention is 30 days; note this in the eventual privacy page. Zero-data-retention is an org-level option to revisit if Lumi gets real users.

## 3. Decisions that are expensive to reverse

| # | Decision | Pick | Why it's sticky |
|---|---|---|---|
| 1 | **Message storage shape** | Store AI SDK `UIMessage` parts as JSON, one row per message, with `format_version` | Chat history migrations are miserable; every renderer and the model-message conversion depend on it. Version it from day one. |
| 2 | **Append-only `events` table from day one** | Yes, every state change writes one | You cannot backfill behaviour you didn't record. Pattern memory, "what helps you start", and any future analytics depend on it. Costs one insert per write. |
| 3 | **Internal user ids vs auth-provider ids** | Internal UUID; `clerk_user_id` is a unique column | Swapping auth providers otherwise rewrites every foreign key. |
| 4 | **One thread per user vs chat sessions** | One `main` conversation + summary | Shapes the UI, context assembly and memory. Going from sessions → one thread later means merging; the reverse is easy (add `kind`). |
| 5 | **Framework-free core** | `src/core` has no Next/React imports; enforced by an ESLint `no-restricted-imports` rule | Mobile/CLI/cron reuse depends on this boundary existing before code accretes around Next. |
| 6 | **Timezone per user, stored** | `users.timezone` (IANA), captured on first visit | "Today", "yesterday", visit gaps, capacity-by-day all depend on it; retrofitting is a data-quality problem. |
| 7 | **Soft status, not hard delete, for intentions** | `open | done | dropped`; no delete | A dropped intention is signal (what gets abandoned). Deleting loses it. |
| 8 | **Tools as the only write path from the model** | Yes; no free-text parsing, ever | The moment prose parsing exists, structure erodes and the UI can't be trusted. |
| 9 | **Deterministic check-ins and greeting** | Not model-generated | Cost, latency and predictability; also keeps Lumi quiet by construction. Reversible in code, but the product feel depends on it. |
| 10 | **Model provider abstraction** | AI SDK provider + one `model.ts` module | Lets you move to Bedrock/Vertex/local for privacy without touching the app. Cheap now. |
| 11 | **Structured client events as user messages** | `session_event`/quick-start messages are real user messages with a metadata part | Keeps one transcript, one persistence path, one cache prefix. A side channel would fork the context. |
| 12 | **Beliefs carry confidence, evidence and supersession history** | Schema from day one | Confidence and evidence are what make learning possible; adding them later means every existing note is unweighted. Supersession keeps a correction from erasing history. |
| 13 | **Model proposes, code applies** | Reflection returns operations; `core/domain/memory.ts` applies them with guardrails | The alternative (the model writing beliefs freely) is unauditable and unsafe. The op format is a contract both sides depend on. |
| 14 | **Interventions link to outcomes via events** | `approach` on sessions; ids on completion events | Without the link, "what helps you start" is guesswork forever. |
| 15 | **Intentions stay flat in V1** | No projects table; `memory_notes.kind = 'project'` carries project context | Adding `parent_id` later is one nullable column. Adding a projects hierarchy first would drag the UI toward a task manager. |

## 4. Repository layout
```
lumen/
├── CLAUDE.md                     session brief (short; points here)
├── art/                          Lumi's source drawings (animation sheets); public/ sprites are cut from these
├── docs/
│   ├── product.md                brief, voice guide, visual direction
│   ├── architecture.md           this file
│   ├── domain.md                 tables, derived views, events catalogue
│   ├── v1-plan.md                milestones + done-when
│   └── decisions.md              ADR-lite log (append as things change)
├── src/
│   ├── app/
│   │   ├── layout.tsx            fonts, tokens, AuthProvider
│   │   ├── page.tsx              the conversation (soft landing)
│   │   ├── today/page.tsx        quiet list of open intentions
│   │   ├── settings/page.tsx     name, timezone, session defaults
│   │   ├── knows/page.tsx        "What Lumi knows" — beliefs, grouped, correct/delete inline
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── api/
│   │       ├── chat/route.ts     POST — one streamed turn
│   │       ├── session/route.ts  POST — check-in ticks (non-LLM)
│   │       └── intentions/route.ts  PATCH — complete/reopen from Today
│   ├── components/
│   │   ├── chat/                 Conversation, Message, Ledger, Composer, QuickStarts, LumiAvatar
│   │   ├── focus/                SessionBar (the bar + the check-in card + the client timer)
│   │   └── ui/                   Rule, Label, Button (tiny primitives)
│   ├── core/                     ← framework-agnostic, unit-tested
│   │   ├── domain/               users.ts intentions.ts sessions.ts capacity.ts memory.ts events.ts activity.ts plans.ts snapshot.ts
│   │   ├── ai/                   persona.ts context.ts tools.ts model.ts greeting.ts plan.ts today-plan.ts reflect.ts
│   │   ├── focus.ts              Focus Together client-side rules: check-in copy + timing, session-from-transcript
│   │   ├── declines.ts           the six *Not this* answers
│   │   └── time.ts               tz-aware today/gap helpers
│   ├── db/                       schema.ts (the domain model as code) client.ts (lazy postgres-js + drizzle) migrations/ (drizzle-kit)
│   ├── lib/                      auth.ts (server boundary → ensureUser) · auth-ui.tsx (provider, auth controls)
│   ├── proxy.ts                  clerkMiddleware: protected-first, sign-in/up public
│   └── styles/globals.css        tokens + paper texture
├── public/                       lumi-heads.png · lumi-idle.webp (cut sprite sheets; never edited by hand)
├── scripts/                      cut-lumi-idle.py (art/ → public/) · check-route-auth.mjs · voice-eval.mjs
├── drizzle.config.ts
├── .env.example
└── package.json
```

## 5. API routes

Every `src/app/api/**/route.ts` must call `requireUser()` (or check `CRON_SECRET`); `npm run check:routes` asserts it statically. Client components never touch the database — they call these routes; server components call `src/core` directly.

| Route | Method | Gate | What it does | Since |
|---|---|---|---|---|
| `/api/chat` | POST | `requireUser()` | One streamed turn, for both clients (the chat page and the companion's speech bubble; each has its own `useChat`, the server holds the one transcript). Body `{ id, message }` — the new user `UIMessage` only; the server loads the last 30 from the database, persists the user message, streams `claude-opus-5` with `instructions: [persona (cache_control ephemeral), context block]` at `effort: low` with server-side refusal fallbacks, and persists the assistant message in `onEnd`. `maxDuration = 60`. Dev logs a `[chat] tokens …` line with cache read/write counts | M2 |

| `/api/intentions/[id]` | PATCH | `requireUser()` | `{ action: "complete" \| "reopen" }` from Today / Lists. Complete also advances today's plan (`reflectClosedInPlan`). Both events carry `via: "app"`, which is how the chat context tells a tick on a page from a tool call | M3 |
| `/api/capacity` | POST | `requireUser()` | Today's capacity prompt. `{ level }` writes `capacity.reported` and re-cuts the path (`recutTodaysPlan(…, "capacity")` — skipped when the answer matches what the plan already assumed), returning `{ level, rightNow }`; `{ skip: true }` writes `capacity.asked {skipped}` so it isn't asked again today. `maxDuration = 60` (model call) | M4 |

| `/api/session` | POST | `requireUser()` | The one check-in answer that needs no reply: `{ id, response: "ok" }` (Yep) writes `session.check_in {response: ok, minute}` — no model call, no message. Returns `{ ok: true }`, or `{ ok: false, ended: true }` when that session is no longer running (swept as abandoned, or ended elsewhere) so the client drops the bar. Stuck / Got distracted / Done / End go through `/api/chat` instead, because Lumi answers them | M5 |

`/api/chat` also reads the incoming message's metadata: `kind: "declined"` with a valid `intentionId` records `intention.declined {reason}` before the context block is built, so Lumi answers the reason; the turn's `after()` then re-cuts the path (`reason: declined`). `kind: "session_event"` with a running `sessionId` and a `response` of `stuck | distracted | done | end` (M5) records `session.check_in` (not for `end`), closes the session in code on `done` (`completed`) and `end` (`stopped_early`), and gives the context block a *Just now* line so Lumi's reply is about a fact. `kind: "start_intention"` with an open `intentionId` (Today's *Start with Lumi*) gives the context block a *Just now* line too: the title, Today's first step (the path's `firstStep`, else the intention's `next_action`), the estimate, and the instruction that this is the start itself — call `start_focus_session` now rather than ask — or, if a session is already running on that intention, one line and no second session; on another intention, switch (the old one closes as stopped early). Tool writes that invalidate the path (`report_capacity`; `drop_intention` during a re-entry sitting) flag it through `ToolContext.onPlanChange`, and the same `after()` re-cuts once with the first reason raised. A session that closed during the turn (Done/End, `end_focus_session`, or replaced by a new `start_focus_session`) is flagged through `ToolContext.onSessionEnd` or the route itself, and a second `after()` runs `reflectAfterSession` on it.

Planned: `GET/DELETE /api/beliefs` (M6).

## 6. Key conventions

- **`src/core` is framework-free** — no `next`/`react` imports (eslint-enforced). Domain logic and AI assembly live there; unit tests too.
- **Model reads via the context block, writes via tools.** Every tool write appends an `events` row. Never parse prose for state.
- **Deterministic where it can be:** the greeting, focus check-ins, quick starts. Lumi speaks unprompted only at check-ins.
- **Store facts and events; derive judgements** (stale, avoided, gap, today's capacity). Never persist derived flags.
- **Beliefs:** model proposes ops, `core/domain/memory.ts` applies with guardrails. `user_said` beliefs are never retired without the user.
- **Cached prefix stays byte-stable:** persona + tool descriptions first, volatile context after. Verify with the `[chat] tokens` dev log line (`cacheRead` > 0 from the second turn). Anthropic's minimum cacheable prefix is model-dependent; a short persona may never cache — grow it before assuming a bug.
- **Message ids are UUIDs on both sides** (`generateId: () => crypto.randomUUID()` in `useChat`, `generateMessageId` in the route) because `messages.id` is a uuid column.
- **Proxy wall without `createRouteMatcher`** (deprecated in Clerk 7): `src/proxy.ts` matches the two public prefixes by hand and calls `auth.protect()` for everything else; every page and route still calls `requireUser()` itself (Clerk's resource-based recommendation).
- **Clerk only in `src/lib/auth.ts`, `src/lib/auth-ui.tsx` and the sign-in/sign-up pages.** Internal `users.id` everywhere else.
- **Copy lives in `src/core`** (greeting, persona, canned quick-start messages), not in components — so the voice is reviewable in one place.
- **No counts of undone things anywhere in the UI.** If a number would make someone feel behind, it doesn't ship.
- **EF-burden log** (`docs/ef-burden-log.md`) gets a row for every new user-maintained state, in the same commit.

## 7. The day plan (M3)
`core/ai/plan.ts → buildDayPlan()` asks the model for `{ dayLine, rightNow, afterThat, closingLine }` via structured output (`Output.object`) with the persona + planner rules + a compact inputs block (candidates with flags, fixed-time items, capacity, declined reasons, how-they-work beliefs). `clampPlan()` (pure, tested) enforces: ids must exist, no repeats, ≤3 after-that (≤1 on a low day), fixed-time items only in `later`, counts stripped from lines. Persisted per local date (`day_plans`). `core/ai/today-plan.ts → ensureTodaysPlan()` is the one reader/generator: it returns the persisted plan, or generates and saves it once per user per day (an in-flight map dedupes concurrent callers in a process). It is **primed off the response** — `primeTodaysPlan()` in Next's `after()` on the home page and at the end of every chat turn — so the model call (several seconds) has usually already happened by the time Today is opened; Today calls the same function under Suspense (`react.cache` dedupes the two halves) and only pays for generation if the prime hasn't landed. One code-derived refresh: a plan cut with nothing to choose from is re-cut (`reason: first_items`) once intentions exist, since priming on open makes "open app → brain-dump → Today" the normal order. A plan with a Right now is never regenerated by this path. Closing an intention anywhere advances the path in code (`plan-sync.ts`).

**Re-cuts (M4).** `recutTodaysPlan(db, user, reason)` is the only way an existing Right now moves, and it runs on exactly three triggers: `capacity` (Today's prompt via `/api/capacity`, or the `report_capacity` tool — skipped when the answer matches what the plan already assumed, e.g. normal-ish on a plan cut without a report), `declined` (a *Not this* answer arriving in `/api/chat`), and `reentry` (`drop_intention` during a sitting that began after ≥ 7 days away). Chat-side triggers are collected during the turn (`ToolContext.onPlanChange`, the declined metadata) and applied once in the route's `after()` — `primeTodaysPlan(db, user, recut)` — so nothing waits on the model twice. The planner sees today's declines with their reasons (`snapshot.declinedToday`) and `clampPlan` refuses to put a declined intention back in Right now, even if the model proposes it; it may still sit in After that ("too tired" is about now, not never). When everything left has been declined today, Right now is empty with a fixed line rather than a re-proposal. The gap passed to the planner is the one the *sitting* began after (`visitBeforeSitting`), not the seconds since the last request.

## 8. Data access

- `src/db/schema.ts` is the single source of truth for tables and their TS types (`User`, `Intention`, …). `docs/domain.md` is its prose twin — update both in the same commit.
- `db()` (`src/db/client.ts`) is a lazy singleton over `postgres` with `prepare: false` (Supabase transaction pooler, port 6543) and a small pool that keeps idle connections for five minutes — opening one costs ~0.5s against ~70ms per warm query (Vancouver → us-east-2), so a pause between page views must not cold-start the pool. Import only from server code.
- Domain functions in `src/core/domain/*` take the `Db` as their first argument (no module-level client) so they're testable against a scratch database and liftable into a worker.
- Every write goes through a domain function that also calls `appendEvent` — never `db().insert(...)` from a route or component.
- `ensureUser()` (`core/domain/users.ts`) is the only place a Clerk id enters the data layer; `src/lib/auth.ts` → `requireUser()` wraps Clerk's `auth()` (local session-cookie check) around it and returns the internal `User` row; the Clerk profile (`currentUser()`, a network call) is fetched only when the row has to be created, so it never sits on the request path. Timezone arrives via the `lumen_tz` cookie (`components/shell/TimezoneCapture.tsx`) and is kept current on every request. `recordVisit(user)` → `touchLastSeen` returns the previous visit and writes `app.opened {gap_seconds}` when the gap was ≥ 30 min; every page (Chat, Today, Lists) and every chat turn calls it (M4), so `last_seen_at` is always the last request and the newest `app.opened` is always the start of the current sitting.
- **The sitting, not the last request, carries the gap.** `loadSnapshot` includes `currentSitting` (newest `app.opened`). The greeting on Chat, the context block and the planner all read the gap the sitting began after, so "came back after two weeks" survives navigating Today → Chat and the fifth turn of the visit, and disappears once they've said something this sitting (greeting) or the next sitting begins (context). The route's `lastSeenAt` (previous request) still drives "same sitting" / "last here: 3 hours ago".

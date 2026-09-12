# Rali — Architecture

Status: **proposed 2026-09-11, pre-scaffold.** Revise freely until M2 lands; after that, changes go through `decisions.md`.

## 1. Stack

| Layer | Choice | Why (and the alternative considered) |
|---|---|---|
| App framework | **Next.js 16 (App Router, React 19), TypeScript** | One deployable for UI + API; Route Handlers stream; you already run this stack (Glåüm). Alternative: separate Hono/Fastify API + Vite SPA — cleaner for a future mobile client, but two deploys and more plumbing for a prototype. Mitigation: all domain + AI code lives in `src/core` with **zero Next/React imports**, so it can be lifted into a package or a separate server later. |
| AI runtime | **Vercel AI SDK v7** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) | Owns the hard, boring part of chat UX: streaming protocol, `useChat`, tool-call parts streamed into the UI, Zod-typed tools, multi-step loops, `UIMessage` persistence shape. `@ai-sdk/anthropic` is a first-party Anthropic provider (not an OpenAI-compatible shim); Anthropic-specific request fields (cache control, thinking, effort) pass through `providerOptions.anthropic`. Alternative: `@anthropic-ai/sdk` directly + hand-rolled SSE + React stream state — fewer abstractions and day-one access to every Anthropic feature, but ~2 days of plumbing we'd rather not own. **Escape hatch:** the model call is isolated in `src/core/ai/model.ts`; if a needed Anthropic feature can't pass through the provider, that one module switches to the raw SDK. |
| Model | **`claude-opus-5`** for the companion; adaptive thinking (default); `output_config.effort: "low"` for chat turns (raise to `medium` if quality demands) | Personality, judgement and restraint *are* the product; chat turns are short so per-turn cost is small. Prompt caching on the stable prefix (persona + tools) keeps input cost flat. `claude-sonnet-5` is the cost step-down lever; `claude-haiku-4-5` for background jobs (summaries, extraction) later. Enable server-side refusal fallbacks (`fallbacks: "default"`) if the provider exposes it; otherwise handle `stop_reason: "refusal"` gracefully (Rali says "I couldn't answer that one" rather than erroring). |
| Database | **Postgres on Supabase**, accessed through **Drizzle ORM** over the `postgres` driver (Supavisor transaction pooler, `prepare: false`) — **not** `supabase-js` | Free tier, dashboard you know, pgvector available when memory needs embeddings. Drizzle makes the schema typed code (the domain model *is* the schema file), generates migrations, and has no vendor coupling — moving to Neon is a connection-string change. All DB access is server-side with the service role, so RLS is irrelevant. |
| Auth | **Clerk** (`@clerk/nextjs` 7) behind `src/lib/auth.ts` → `requireUser()` returning the **internal** `users.id` | Fastest path, Expo SDK exists for later. Nothing outside `lib/auth.ts`, `lib/auth-ui.tsx` and the sign-in/sign-up pages imports Clerk. Alternative: no auth for a single user — rejected: adding auth later touches every query; adding it now costs an hour. |
| Styling | **Tailwind v4** + CSS custom-property tokens; `next/font` for serifs | Tokens (`--ink`, `--paper`, `--brass`, `--rule`) defined once; Tailwind for layout only. No component library — the design is too specific and the surface too small. |
| Validation | **Zod 4** | Shared by tool input schemas and API bodies. |
| Voice | **Web Speech API** (`SpeechRecognition`) behind `useVoiceInput()` → text into the same composer | Zero cost, works in Chrome/Safari desktop; hidden where unsupported. Later: server transcription (Whisper/Deepgram) behind the same hook signature. |
| Hosting | **Vercel** (Hobby) + Supabase free tier | Streaming works under Fluid Compute; set `export const maxDuration = 60` on the chat route. Both free until real users. |
| Tests | **Vitest** on `src/core` only | Pure logic (staleness, context assembly, tool handlers against a test DB). No UI tests in V1. |

Env (`.env.local`): `ANTHROPIC_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

## 2. How the AI layer touches application state

**Principle: the conversation is the interface; structured state is the truth.** The model reads state through a context block and writes it through tools. The UI renders structured state from the database. Nothing ever parses Rali's prose to discover what happened, and Rali never edits state by "just saying so".

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
   - active focus session, if any (goal, first step, minutes elapsed/planned)
   - beliefs (≤ 40), grouped by kind, ordered by confidence; strategies with evidence counts; low-confidence ones marked *tentative*
   - rolling summary of older conversation, if any
   - `preferences` (tone hint, default session length, check-in interval)
   The block is small on purpose. If a list outgrows its cap, we add a read tool (`search_intentions`) rather than growing the block.

### Tools (server-executed, Zod-typed, in `src/core/ai/tools.ts`)
| Tool | Effect |
|---|---|
| `create_intention {title, next_action?, note?, due_at?, effort_hint?}` | insert; event `intention.created` |
| `update_intention {id, title?, next_action?, note?, due_at?, effort_hint?}` | patch; bumps `last_touched_at`; event |
| `complete_intention {id}` / `drop_intention {id, reason?}` | status change; event |
| `report_capacity {level, flags?, note?}` | event `capacity.reported` (source of truth for "today") |
| `start_focus_session {goal, first_step, approach?, minutes, intention_id?}` | insert session; `approach` = the strategy being tried; event; client SessionBar appears |
| `end_focus_session {id, outcome}` | close; event |
| `remember {kind, content, confidence?}` | new belief; `source: user_said` or `rali_inferred` |
| `confirm {id}` / `contradict {id, note?}` | adjust evidence + confidence; events |
| `revise {id, content}` | new belief superseding the old (history kept) |
| `forget {id}` | user-requested retire |

Rules for tools:
- Every write tool also appends an `events` row (append-only). This is non-negotiable — it is the raw material for future pattern memory.
- Tool results are compact JSON (`{id, title, status}`), never prose. Rali narrates in his own words.
- Tools never throw to the model; failures return `{error}` so Rali can say "I couldn't save that" instead of the turn dying.
- No `list_*` read tools in V1; the context block covers reads. Add them when caps bite.
- Tool descriptions are part of the cached prefix — keep them stable.

### What is deterministic (no LLM call)
- **The greeting on page open.** Server-rendered from state: default "What are we working with today?"; after a gap ≥ 7 days, "It's been a minute. Want me to help figure out what's still relevant?"; with an abandoned session, "Looks like we left a session open on *X*." Instant, cheap, predictable — no wall of AI text on open. Rali only speaks unprompted for session check-ins.
- **Focus session check-ins.** The client timer fires at the interval; the UI shows *Still with it?* with Yep / Stuck / Got distracted / Done. **Yep** logs an event and nothing else (no LLM call, no message). The other three post a structured `session_event` user message; Rali replies in character. Keeps Rali "mostly quiet" and cheap.
- **Quick-start chips** ("Help me choose", "Break it down", "Body double", "Just talk") send a canned first user message. They are starting points, not modes.
- **Staleness, visit gap, "avoiding" signals** are derived queries (`src/core/domain`), never stored flags.

### The understanding layer (memory that learns)

This is a first-class subsystem, not a notes table. Its job: **continuously refine a model of what is most helpful to this particular user**, using their behaviour as the signal, without ever asking them to rate, tag, or maintain anything.

**Model: beliefs with evidence.** `memory_notes` rows are beliefs. Each has a `kind` (fact · project · preference · strategy · pattern · anti_pattern), a one-sentence `content`, a `confidence` (0–1), counts of `evidence_for` / `evidence_against`, timestamps for last confirmation and contradiction, and a `supersedes_id` so revisions keep history. Retirement is soft, with a reason. The user-facing name is **"What Rali knows"**.

Facets and what they capture:
| kind | example | where the signal comes from |
|---|---|---|
| fact / project | "Thesis due 30 Oct; supervisor is Priya." | conversation |
| preference | "Wants blunt, short replies. Lists of options make her freeze." | conversation + how she responds to Rali's style |
| strategy | "Opening the doc and reading the last paragraph gets her started." | sessions that begin with that approach and reach `completed` |
| pattern | "Starts real work after 10am; evenings are for small things." | events over time |
| anti_pattern | "Planning sessions become avoidance." | intentions touched repeatedly, never entered a session |

**Three inputs, one loop.**
1. **Explicit.** The user says something durable; Rali calls `remember` (`source: user_said`, confidence 0.9). Corrections in Settings are `user_said` at 0.95 and retire the old belief — the highest-signal input there is.
2. **In-conversation inference.** Rali notices ("third time this week you've mentioned that paper") and records a hypothesis at low confidence via `remember`, or adjusts an existing belief via `confirm` / `contradict` / `revise`. Tentative beliefs are rendered as tentative in the context block, so Rali tests them gently ("Last time opening the doc first helped — try that?") rather than asserting them.
3. **Outcomes.** Every intervention is linked to a result through `events`. `start_focus_session` records the `approach` being tried; `session.ended` carries the outcome; `intention.completed` links back to the session. Nobody rates anything — starting, completing, abandoning and re-entering *are* the feedback.

**Reflection** (`src/core/ai/reflect.ts`) turns inputs 2 and 3 into belief updates. It is one model call with structured output, over the events and messages since `users.last_reflected_at` plus the current active beliefs, returning a list of operations: `create | confirm | contradict | revise | retire`. **Code applies the operations with guardrails** — never retire a `user_said` belief without the user, cap operations per run, every op writes a `memory.*` event — so the model proposes and the code decides. Triggers in V1 need no cron: (a) when a focus session ends, (b) lazily on the first turn of a new local day. Both run in Next's `after()` so they add no latency to the reply. Model: `claude-opus-5` at low effort while volume is tiny; `claude-haiku-4-5` is the step-down.

**Retrieval.** V1 injects all active beliefs, capped at ~40, ordered by kind then confidence, with strategies rendered alongside their evidence ("helped 4/5 sessions") so Rali can prefer proven approaches. When beliefs outgrow the cap: pgvector embeddings and relevance retrieval on the current turn, and a `recall` tool.

**Adaptation without settings.** Tone, pace, and how much Rali says are `preference` beliefs read by the persona each turn. There is no tone picker in V1; Rali learns it, and the user can see and correct it in "What Rali knows".

**Guardrails (EF check applies here too).** Learning is invisible and free: no thumbs, no tagging, no "was this helpful?", no memory setup. Beliefs never become stored judgements about the person's worth or capability — they describe what works, not who they are. Everything is visible and deletable.

### Conversation window
One continuous `main` conversation per user (Rali is a person you keep talking to, not a folder of chats). The route loads the last ~30 messages; older history is folded into `conversations.summary` by a summarisation step that runs when the window overflows (M6). Time gaps between messages are rendered in the UI as fine rules with a date, and passed to the model as the visit-gap line — not as fake messages.

### Privacy posture
- Model calls happen only on the server; the key never reaches the client.
- Every table is keyed by `user_id`; export and delete are a single cascade.
- Conversation text never goes to Vercel logs; log ids and durations only.
- Anthropic API standard retention is 30 days; note this in the eventual privacy page. Zero-data-retention is an org-level option to revisit if Rali gets real users.

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
| 9 | **Deterministic check-ins and greeting** | Not model-generated | Cost, latency and predictability; also keeps Rali quiet by construction. Reversible in code, but the product feel depends on it. |
| 10 | **Model provider abstraction** | AI SDK provider + one `model.ts` module | Lets you move to Bedrock/Vertex/local for privacy without touching the app. Cheap now. |
| 11 | **Structured client events as user messages** | `session_event`/quick-start messages are real user messages with a metadata part | Keeps one transcript, one persistence path, one cache prefix. A side channel would fork the context. |
| 12 | **Beliefs carry confidence, evidence and supersession history** | Schema from day one | Confidence and evidence are what make learning possible; adding them later means every existing note is unweighted. Supersession keeps a correction from erasing history. |
| 13 | **Model proposes, code applies** | Reflection returns operations; `core/domain/memory.ts` applies them with guardrails | The alternative (the model writing beliefs freely) is unauditable and unsafe. The op format is a contract both sides depend on. |
| 14 | **Interventions link to outcomes via events** | `approach` on sessions; ids on completion events | Without the link, "what helps you start" is guesswork forever. |
| 15 | **Intentions stay flat in V1** | No projects table; `memory_notes.kind = 'project'` carries project context | Adding `parent_id` later is one nullable column. Adding a projects hierarchy first would drag the UI toward a task manager. |

## 4. Repository layout
```
rali/
├── CLAUDE.md                     session brief (short; points here)
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
│   │   ├── knows/page.tsx        "What Rali knows" — beliefs, grouped, correct/delete inline
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── api/
│   │       ├── chat/route.ts     POST — one streamed turn
│   │       ├── session/route.ts  POST — check-in ticks (non-LLM)
│   │       └── intentions/route.ts  PATCH — complete/reopen from Today
│   ├── components/
│   │   ├── chat/                 Conversation, Message, Ledger, Composer, QuickStarts, RaliAvatar
│   │   ├── focus/                SessionBar, CheckIn
│   │   └── ui/                   Rule, Label, Button (tiny primitives)
│   ├── core/                     ← framework-agnostic, unit-tested
│   │   ├── domain/               users.ts intentions.ts focus.ts capacity.ts memory.ts events.ts
│   │   ├── ai/                   persona.ts context.ts tools.ts model.ts greeting.ts reflect.ts
│   │   └── time.ts               tz-aware today/gap helpers
│   ├── db/                       schema.ts (the domain model as code) client.ts (lazy postgres-js + drizzle) migrations/ (drizzle-kit)
│   ├── lib/                      auth.ts (server boundary → ensureUser) · auth-ui.tsx (provider, auth controls)
│   ├── proxy.ts                  clerkMiddleware: protected-first, sign-in/up public
│   └── styles/globals.css        tokens + paper texture
├── drizzle.config.ts
├── .env.example
└── package.json
```

## 5. API routes

Every `src/app/api/**/route.ts` must call `requireUser()` (or check `CRON_SECRET`); `npm run check:routes` asserts it statically. Client components never touch the database — they call these routes; server components call `src/core` directly.

| Route | Method | Gate | What it does | Since |
|---|---|---|---|---|
| `/api/chat` | POST | `requireUser()` | One streamed turn. Body `{ id, message }` — the new user `UIMessage` only; the server loads the last 30 from the database, persists the user message, streams `claude-opus-5` with `instructions: [persona (cache_control ephemeral), context block]` at `effort: low` with server-side refusal fallbacks, and persists the assistant message in `onEnd`. `maxDuration = 60`. Dev logs a `[chat] tokens …` line with cache read/write counts | M2 |

Planned: `POST /api/session` check-in ticks (M5) · `PATCH /api/intentions` complete/reopen from Today (M3) · `GET/DELETE /api/beliefs` (M6).

## 6. Key conventions

- **`src/core` is framework-free** — no `next`/`react` imports (eslint-enforced). Domain logic and AI assembly live there; unit tests too.
- **Model reads via the context block, writes via tools.** Every tool write appends an `events` row. Never parse prose for state.
- **Deterministic where it can be:** the greeting, focus check-ins, quick starts. Rali speaks unprompted only at check-ins.
- **Store facts and events; derive judgements** (stale, avoided, gap, today's capacity). Never persist derived flags.
- **Beliefs:** model proposes ops, `core/domain/memory.ts` applies with guardrails. `user_said` beliefs are never retired without the user.
- **Cached prefix stays byte-stable:** persona + tool descriptions first, volatile context after. Verify with the `[chat] tokens` dev log line (`cacheRead` > 0 from the second turn). Anthropic's minimum cacheable prefix is model-dependent; a short persona may never cache — grow it before assuming a bug.
- **Message ids are UUIDs on both sides** (`generateId: () => crypto.randomUUID()` in `useChat`, `generateMessageId` in the route) because `messages.id` is a uuid column.
- **Proxy wall without `createRouteMatcher`** (deprecated in Clerk 7): `src/proxy.ts` matches the two public prefixes by hand and calls `auth.protect()` for everything else; every page and route still calls `requireUser()` itself (Clerk's resource-based recommendation).
- **Clerk only in `src/lib/auth.ts`, `src/lib/auth-ui.tsx` and the sign-in/sign-up pages.** Internal `users.id` everywhere else.
- **Copy lives in `src/core`** (greeting, persona, canned quick-start messages), not in components — so the voice is reviewable in one place.
- **No counts of undone things anywhere in the UI.** If a number would make someone feel behind, it doesn't ship.
- **EF-burden log** (`docs/ef-burden-log.md`) gets a row for every new user-maintained state, in the same commit.

## 7. Data access

- `src/db/schema.ts` is the single source of truth for tables and their TS types (`User`, `Intention`, …). `docs/domain.md` is its prose twin — update both in the same commit.
- `db()` (`src/db/client.ts`) is a lazy singleton over `postgres` with `prepare: false` (Supabase transaction pooler, port 6543) and a small pool. Import only from server code.
- Domain functions in `src/core/domain/*` take the `Db` as their first argument (no module-level client) so they're testable against a scratch database and liftable into a worker.
- Every write goes through a domain function that also calls `appendEvent` — never `db().insert(...)` from a route or component.
- `ensureUser()` (`core/domain/users.ts`) is the only place a Clerk id enters the data layer; `src/lib/auth.ts` → `requireUser()` wraps Clerk's `auth()` around it and returns the internal `User` row. Timezone arrives via the `rali_tz` cookie (`components/shell/TimezoneCapture.tsx`) and is kept current on every request. `recordVisit(user)` → `touchLastSeen` returns the previous visit for greeting/context.

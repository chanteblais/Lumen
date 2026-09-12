# Rali — V1 Implementation Plan

Small milestones, each shippable to Vercel. Every milestone ends with the question: **did this reduce executive-function burden or add to it?** Estimates assume AI-assisted sessions.

## M0 — Shell (½ day) — **built 2026-09-11, branch `feat/m0-shell`, pending review**
- `create-next-app` (TS, App Router, Tailwind 4, `src/`), Vitest, ESLint rule forbidding `next`/`react` imports inside `src/core`.
- Design tokens + paper texture + serif fonts via `next/font`; the landing page **static**, matching the mockup: sidebar (Chat / Today / Library / Insights / Settings — Library and Insights are placeholders), greeting card, quick-start chips, composer.
- Deploy to Vercel (empty env).
- **Done when:** the page loads in < 1s, says one thing, and looks like the mockup on desktop and acceptable at 390px.
- **EF check:** nothing on the page asks the user to decide or maintain anything.

## M1 — Identity & persistence (½ day) — **built 2026-09-11 (`feat/m0-shell` Clerk + `feat/m1-db` schema/auth wiring); migration pending apply**
- Clerk sign-in; `lib/auth.ts → requireUser()` creates the `users` row lazily and captures browser timezone on first visit.
- Drizzle schema for all seven tables (`docs/domain.md`), `drizzle-kit generate` + `migrate`, Supabase pooler connection.
- **Done when:** signing in creates a user row; `npm run check` (tsc + vitest) passes; migrations apply cleanly to a fresh database.

## M2 — The conversation (1 day) — **built 2026-09-12 on `feat/m2-conversation`; voice eval pending `ANTHROPIC_API_KEY`**
- `POST /api/chat`: `streamText` with the persona system prompt (cached prefix) and a minimal context block (name, local time, visit gap). No tools yet.
- Persist user + assistant `UIMessage`s; load the last 30 on page open; render history with date rules between visits.
- Server-rendered greeting (`core/ai/greeting.ts`) replaces the static card; quick-start chips send canned first messages.
- Verify prompt caching via `usage.cache_read_input_tokens > 0` on the second turn.
- **Voice eval (manual):** run the nine scenarios in `product.md` and note where Rali over-reassures, over-plans, or lectures; tune the persona.
- **Done when:** a returning user sees their history and a state-aware greeting, and Rali's replies pass the voice eval.
- **EF check:** Rali asks one thing at a time; the first reply to "I can't start" is a step, not a plan.

## M3 — Intentions and beliefs through tools (1–1½ days)
- Tools: `create_intention`, `update_intention`, `complete_intention`, `drop_intention`; every call writes an `events` row.
- Belief tools from the same day: `remember`, `confirm`, `contradict`, `revise`, `forget`, applied through `core/domain/memory.ts` (the same op-applier reflection will use). Beliefs injected into the context block with confidence and evidence.
- Ledger lines under assistant messages rendered from tool parts (✦ Noted · … / ✦ Done · …), with undo for complete → reopen.
- `/today`: open intentions with `next_action`, complete/reopen only — no editing UI, no sorting controls, no counts in the nav.
- Context block now includes open intentions with ids (cap 25).
- **Done when:** a brain dump becomes intentions without the user confirming each one; completing from chat and from Today both write events; "I hate being given options" becomes a `preference` belief and the next reply respects it.
- **EF check:** the user never has to "file" anything; Today is a view, not a chore.

## M4 — Context & re-entry (½–1 day)
- `report_capacity` tool; capacity in the context block; greeting variants for gap ≥ 7 days and abandoned sessions.
- Stale intentions flagged in context; persona guidance for the "what's still relevant?" pass (offer to drop in bulk, never list counts).
- `app.opened` events; `last_seen_at` on every turn.
- **Done when:** returning after a simulated 14-day gap yields the re-entry greeting and a two-minute cleanup, ending with one suggested next step.
- **EF check:** re-entry never shows a number of overdue things.

## M5 — Focus Together + outcome loop (1–1½ days)
- Tools `start_focus_session` (with `approach`) / `end_focus_session`; `SessionBar` (goal, first step, elapsed/planned, end) pinned above the composer while active.
- **Reflection v1** (`core/ai/reflect.ts`): runs in `after()` when a session ends; structured-output ops applied with guardrails; `reflection.ran` event. A completed session whose `approach` matches a `strategy` belief confirms it; an abandoned one contradicts it.
- Client timer fires check-ins at `check_in_minutes`: *Still with it?* → Yep (event only) / Stuck / Got distracted / Done (structured `session_event` user message; Rali replies).
- Abandoned-session detection on next visit; sessions close with a one-line acknowledgement, no stats.
- **Done when:** a 20-minute test session runs end to end with one distraction and re-entry, Rali says nothing between check-ins, and the strategy belief's evidence count moves after the session.
- **EF check:** the session asks for exactly three things up front (what, first step, how long) and nothing during.

## M6 — Reflection daily + "What Rali knows" (1 day)
- Lazy daily reflection: on the first turn of a new local day, reflect over events and messages since `last_reflected_at` (in `after()`). Covers patterns (time of day, capacity rhythm) and anti-patterns (intentions touched repeatedly, never started).
- `/knows`: beliefs grouped by kind, confidence shown as words (sure / fairly sure / guessing), correct or delete inline. Corrections supersede at 0.95.
- Rolling summary: when the window exceeds 30 messages, summarise the overflow into `conversations.summary` and inject it.
- **Done when:** after three simulated days, Rali holds at least one correct pattern belief nobody typed in; deleting a belief removes it from the next turn's context; a project named on day 1 is known on day 3 after 60+ messages.
- **EF check:** the user never sets up, tags, or rates anything; learning is invisible until they look.

## M7 — Voice, polish, ship (½ day)
- `useVoiceInput()` on Web Speech API; mic button in the composer; hidden when unsupported.
- Keyboard: Enter sends, Shift+Enter newline, ⌘K focuses composer. Loading, empty and error states in Rali's voice ("I lost the thread for a second — say that again?").
- Privacy note in Settings; `.env.example`; README; cache hit rate and p50 turn latency checked in production.
- **Done when:** the deployed app is used daily for a week without opening the code.

## After V1 (not now)
Embeddings + `recall` tool once beliefs exceed the cap · richer pattern features from events (cohorts of sessions by hour, capacity × outcome) · Rali avatar states · notifications/nudges · mobile (Expo, reusing `src/core`) · Library (saved strategies) · Insights (only if it can be framed without scores).

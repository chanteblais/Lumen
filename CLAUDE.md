# Rali — Session Brief

AI companion for task initiation, momentum, re-entry and body doubling. **Not a task manager.** Read `docs/product.md` once; it holds the brief and Rali's voice guide.

**The question that overrides everything:** does this reduce the user's executive-function burden, or accidentally create more of it? Ask it before adding any field, control, count, or setting.

## Stack
Next.js 16 (App Router, React 19) · TypeScript · Vercel AI SDK v7 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) · `claude-opus-5` · Postgres on Supabase via Drizzle (`postgres` driver, pooler) · Clerk · Tailwind 4 · Zod 4 · Vitest · Vercel.

## Docs — read on demand (index: `docs/README.md`)
- `docs/architecture.md` — stack, how the AI layer touches state (context block + tools), sticky decisions, repo layout
- `docs/domain.md` — the seven tables, events catalogue, derived views
- `docs/v1-plan.md` — milestones M0–M7 with done-when + EF checks
- `docs/decisions.md` — append when a decision changes
- `docs/features.md` — every page/feature (who, what, states) · `docs/design-system.md` — tokens, classes, patterns · `docs/design-philosophy.md` — what we are / are never (draft)
- `docs/ef-burden-log.md` — **standing ledger** of user-maintained state · `docs/voice-eval-log.md` — persona scenario runs · `docs/qa-log.md` / `docs/ux-review-log.md` · `docs/pre-prod.md`

## Conventions
- `src/core` is framework-free (no `next`/`react` imports; ESLint enforces). Domain logic and AI assembly live there and are unit-tested.
- The model **reads** state via the context block and **writes** only via tools. Every tool write appends an `events` row. Never parse prose for state.
- Greeting and focus check-ins are deterministic (no LLM call). Rali speaks unprompted only for check-ins.
- Store facts and events; derive judgements (stale, avoided, gap) at read time. Never persist derived flags.
- **Understanding layer is first-class:** beliefs (`memory_notes`) carry confidence + evidence; the model proposes belief ops, `core/domain/memory.ts` applies them with guardrails; outcomes (sessions, completions) are the feedback signal. The user never rates or tags anything.
- Persona prompt (`src/core/ai/persona.ts`) + tool descriptions are the cached prefix — keep them byte-stable; volatile context goes after.
- Clerk is imported only in `src/lib/auth.ts` (server: `requireUser()`), `src/lib/auth-ui.tsx` (provider + sign-in/up/account controls) and the sign-in/sign-up pages. Internal `users.id` everywhere else.
- Branching: `feat/` `fix/` `ux/` `docs/` off `main`; `main` deploys. Verify with `npm run check` (tsc + vitest) before merging. Print migrations verbatim in the session summary when created.
- Dev server for review: `npm run dev -- -p 3005` (3000–3004 are taken by other projects on this machine).

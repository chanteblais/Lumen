# Decisions log (ADR-lite)

Append-only. One entry per decision that changes `architecture.md`, `domain.md` or the plan. Format: date · decision · why · what it replaces.

- **2026-09-11 · Initial architecture, domain model and V1 plan proposed.** See `architecture.md` §1–4, `domain.md`, `v1-plan.md`. Not yet scaffolded.
- **2026-09-11 · Understanding layer promoted to first-class.** Beliefs carry confidence + evidence + supersession; model proposes ops, code applies with guardrails; interventions link to outcomes via `approach` on sessions; reflection triggers on session end and lazily on a new day. Tone is learned, not set. Memory tools move from M6 to M3. Replaces the "lightweight now, richer later" stance in the first proposal.
- **2026-09-11 · M0 scaffolded.** Next 16 + Tailwind 4 + Vitest; fonts Cormorant Garamond (display) / EB Garamond (body); `src/core` lint-guarded; `npm run check` = typegen+tsc, eslint, vitest. Greeting is already the deterministic `core/ai/greeting.ts`. Rali avatar is a brass monogram until the hooded figure exists as an SVG.
- **2026-09-11 · Clerk wired in (M1 start).** `@clerk/nextjs` 7 via `clerk init`; `src/proxy.ts` is protected-first (only `/sign-in`, `/sign-up` public); `src/lib/auth.ts → requireUser()` returns the Clerk id until the `users` table lands, then the internal id. Auth UI (provider, sign-in/up links, account button) is wrapped in `src/lib/auth-ui.tsx` so the provider swap stays a two-file change. Greeting tolerates an unknown first name.

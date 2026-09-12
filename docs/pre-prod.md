# Pre-Production Checklist

Things to sort before anyone but Chanté uses Lumen.

---

## Clerk
- [ ] Swap development keys for production keys on Vercel (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
- [ ] Sign-in page redirects are prop-driven (no deprecated `NEXT_PUBLIC_CLERK_AFTER_*` env vars).

## Database (Supabase / Drizzle)
- [x] `0000_initial_schema` applied (2026-09-11). Keep the ledger in `docs/domain.md` → Migrations Reference current for every later migration.
- [ ] Pooler connection string (port 6543, transaction mode) in `DATABASE_URL`; `prepare: false` in the driver config.
- [ ] Backups enabled.

## Anthropic
- [ ] `ANTHROPIC_API_KEY` set on Vercel; spend limit set in the Anthropic console.
- [ ] Prompt caching verified in prod (`cache_read_input_tokens > 0` on second turn).
- [ ] Refusal handling produces a Lumi-voice message, not an error.

## Environment variables (Vercel)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `CLERK_SECRET_KEY` · `DATABASE_URL` · `ANTHROPIC_API_KEY`

## Privacy
- [ ] Privacy note in Settings: conversations are sent to Anthropic's API (30-day retention by default), stored in our database keyed to your account, and deletable in full.
- [ ] Export + delete-everything path exists and is tested (single cascade by `user_id`).
- [ ] No conversation text in Vercel logs.

## General
- [ ] Full loop on the deployed URL: sign in → talk → intention created → focus session with one check-in → return next day → greeting reflects it.

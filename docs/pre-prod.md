# Pre-Production Checklist

Things to sort before anyone but Chanté uses Lumen.

---

## Clerk
- [ ] Swap development keys for production keys on Vercel (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
- [ ] Sign-in page redirects are prop-driven (no deprecated `NEXT_PUBLIC_CLERK_AFTER_*` env vars).
- [x] Keys and sign-in/up URL vars set on Vercel for **Production and Preview** (2026-09-12; still the dev `pk_test`/`sk_test` keys). Before this, Vercel held only Development-scoped keys, so every production request 500'd inside `clerkMiddleware` ("Missing publishableKey").

## Database (Supabase / Drizzle)
- [x] `0000_initial_schema` applied (2026-09-11). Keep the ledger in `docs/domain.md` → Migrations Reference current for every later migration.
- [x] Pooler connection string (port 6543, transaction mode) in `DATABASE_URL` on Vercel (2026-09-12); `prepare: false` in the driver config.
- [ ] Backups enabled.

## Anthropic
- [x] `ANTHROPIC_API_KEY` set on Vercel (2026-09-12).
- [ ] Spend limit set in the Anthropic console.
- [ ] Prompt caching verified in prod (`cache_read_input_tokens > 0` on second turn).
- [ ] Refusal handling produces a Lumi-voice message, not an error.

## Environment variables (Vercel)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `CLERK_SECRET_KEY` · `DATABASE_URL` · `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` · `NEXT_PUBLIC_CLERK_SIGN_UP_URL` · `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` · `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` (same values as `.env.local`; without them `auth.protect()` bounces to Clerk's hosted portal instead of `/sign-in`)
- Scope every variable to **Production and Preview**. A Development-only entry is invisible to deploys. Check with `vercel env ls --scope chante-s-projects1 --project lumen`; the app is `lumen` → https://lumen-nu-steel.vercel.app.

## Privacy
- [ ] Privacy note in Settings: conversations are sent to Anthropic's API (30-day retention by default), stored in our database keyed to your account, and deletable in full.
- [ ] Export + delete-everything path exists and is tested (single cascade by `user_id`).
- [ ] No conversation text in Vercel logs.

## General
- [ ] Full loop on the deployed URL: sign in → talk → intention created → focus session with one check-in → return next day → greeting reflects it.

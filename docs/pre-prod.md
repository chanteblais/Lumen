# Pre-Production Checklist

Things to sort before anyone but Chanté uses Coherence.

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
- Scope every variable to **Production and Preview**. A Development-only entry is invisible to deploys. Check with `vercel env ls --scope chante-s-projects1 --project lumen`; the app is `lumen` → https://lumen-nu-steel.vercel.app (the project keeps the old name until it's renamed; see below).

## Rename outside the repo (Coherence)
The app and docs say Coherence since 2026-09-12. These still say Lumen, and each is Chanté's call; none of them blocks anything.
- [ ] **Clerk application name** (dashboard → the *Lumen* app → Settings). This is the one a user sees: "Sign in to Lumen" on the sign-in and sign-up cards, and in verification emails. The name is per application, so dev and production change together; keys, instances and `clerk_user_id`s stay as they are.
- [ ] **Google OAuth consent screen** (Google Cloud console → APIs & Services → OAuth consent screen → App name, logo). It shows on Connect Google. In Testing mode the change is immediate. A published app with the `gmail.readonly` scope goes back through verification.
- [ ] **Vercel project** (`lumen` → Settings → General → Project Name). Local `.vercel/project.json` links by id, so it keeps working. The existing `lumen-nu-steel.vercel.app` URL stays; a `coherence-*.vercel.app` alias is optional. `clerk.burlyman.ca` doesn't change. After the rename, `--project lumen` in the command above becomes the new name.
- [ ] **GitHub repo** `chanteblais/Lumen` (Settings → Repository name). GitHub redirects the old URL, and Vercel's Git link follows (check Settings → Git). Then run `git remote set-url origin git@github-personal:chanteblais/<new>.git` once in the main checkout (worktrees share the config), and add a `decisions.md` line like the one from the `rali` rename.
- [ ] **The folder** `~/Projects/lumen`: a coordinated stop (`branching.md` rule 8): every session stops, the folder moves, `git worktree repair` runs, and every session restarts in the new path. Claude's project memory is keyed to the folder path (`~/.claude/projects/-Users-chante-Projects-lumen/`), so move that directory to the new path's slug or the memories stop loading. The least valuable rename. Fine to leave.

## Privacy
- [ ] Privacy note in Settings: conversations are sent to Anthropic's API (30-day retention by default), stored in our database keyed to your account, and deletable in full.
- [ ] Export + delete-everything path exists and is tested (single cascade by `user_id`).
- [ ] No conversation text in Vercel logs.

## General
- [ ] Full loop on the deployed URL: sign in → talk → intention created → focus session with one check-in → return next day → greeting reflects it.

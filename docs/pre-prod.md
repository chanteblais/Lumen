# Pre-Production Checklist

Things to sort before anyone but Chanté uses Coherence.

---

## Clerk
- [ ] Swap development keys for production keys on Vercel (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
- [ ] Sign-in page redirects are prop-driven (no deprecated `NEXT_PUBLIC_CLERK_AFTER_*` env vars).
- [x] Keys and sign-in/up URL vars set on Vercel for **Production and Preview** (2026-09-12; still the dev `pk_test`/`sk_test` keys). Before this, Vercel held only Development-scoped keys, so every production request 500'd inside `clerkMiddleware` ("Missing publishableKey").
- [ ] **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` has no Preview entry** (found 2026-09-13 with `vercel env ls`: Production and Development only; every other key, `OPENAI_API_KEY` included, covers Preview). A Preview deploy has no publishable key, so `clerkMiddleware` fails there, and since the startup env check it fails at startup naming the key. Chanté's call: add the Preview scope to the existing entry.

## Database (Supabase / Drizzle)
- [x] `0000_initial_schema` applied (2026-09-11). Keep the ledger in `docs/domain.md` → Migrations Reference current for every later migration.
- [x] Pooler connection string (port 6543, transaction mode) in `DATABASE_URL` on Vercel (2026-09-12); `prepare: false` in the driver config.
- [x] Node 22 in production (2026-09-13, Chanté): `"engines": { "node": "22.x" }` in `package.json` overrides the Vercel project's *Node.js Version* (24.x), so deploys run the major CI, `.nvmrc` and `@types/node` use. Moving to 24 is one change to all four.
- [x] Functions in the database's region: `cle1` (Cleveland) for Supabase us-east-2, set in `vercel.json` (2026-09-13; was `iad1`). If the database ever moves, move this with it.
- [ ] Backups enabled.

## OpenAI (Lumi's model since 2026-09-13)
- [x] `OPENAI_API_KEY` set on Vercel (2026-09-13, by Chanté).
- [ ] Spend limit set in the OpenAI dashboard.
- [ ] Prompt caching verified in prod (`cacheRead > 0` on the second turn; locally 2049 of ~2070 input tokens read from cache).
- [ ] Refusal handling produces a Lumi-voice message, not an error.
- [ ] `LUMI_MODEL` unset on Vercel (it's for local comparison runs).

## Anthropic (alongside, for comparison)
- [x] `ANTHROPIC_API_KEY` set on Vercel (2026-09-12). Unused in production unless `LUMI_MODEL=anthropic:…`; can be removed once the comparison is settled.

## Environment variables (Vercel)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `CLERK_SECRET_KEY` · `DATABASE_URL` · `OPENAI_API_KEY` (`ANTHROPIC_API_KEY` only for `LUMI_MODEL=anthropic:…`)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` · `NEXT_PUBLIC_CLERK_SIGN_UP_URL` · `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` · `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` (same values as `.env.local`; without them `auth.protect()` bounces to Clerk's hosted portal instead of `/sign-in`)
- **Checked at startup** (2026-09-13): `src/instrumentation.ts` runs `validateServerEnv` (`src/lib/env.ts`) once per server instance, Node.js runtime only. With `NODE_ENV=production` (Production and Preview deploys alike) a missing required key — the four in the first bullet, with Lumi's model key following `LUMI_MODEL` — or a malformed `LUMI_MODEL` throws, naming the keys and never their values, so every request fails with *An error occurred while loading instrumentation hook: Server environment is incomplete — missing: …*. In dev it logs `[env] …` and carries on. `next build` doesn't run it. The sign-in/up URL keys are optional there.
- **Never set `COHERENCE_DEV_USER`** on any Vercel environment. It is the local test user (`src/lib/dev-user.ts`, 2026-09-13): it signs every request in as one fixed user with no session. The code ignores it outside `next dev`, and a production server (Production and Preview alike) with it set throws at startup, *COHERENCE_DEV_USER is set in production …*, so every request fails until the key is removed.
- **Production** holds every key above, with the **live** Clerk keys: they work only on `burlyman.ca` (`clerk.burlyman.ca` refuses other origins), so they can't serve a preview on `*.vercel.app`.
- **Preview is not set up** (Chanté, 2026-09-13: "Let's skip preview"). It holds only `OPENAI_API_KEY` (checked 2026-09-13), so a preview deploy fails at startup by design, naming the missing keys. To set it up later, Preview needs the Clerk **development instance** keys (`grown-bluejay`: the `pk_test_…` / `sk_test_…` values in `.env.local`), `DATABASE_URL` and the four `NEXT_PUBLIC_CLERK_*_URL` keys. **Previews share the one database with production**, so a preview reads and writes real data.
  - Dashboard: `lumen` → Settings → Environment Variables → Add New; tick **Preview** only; mark secrets **Sensitive**; save, then redeploy a preview.
  - CLI: `npx vercel env add <NAME> preview --scope chante-s-projects1` (add `--sensitive` for a secret), and paste the value at the prompt, never in the command.
- A Development-only entry is invisible to deploys. Check with `vercel env ls --scope chante-s-projects1 --project lumen`; the app is `lumen` → https://lumen-nu-steel.vercel.app (the project keeps the old name until it's renamed; see below).

## Security headers (`next.config.ts`, 2026-09-13)
- [x] On every response: `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'` (no framing, not even same-origin) · `Referrer-Policy: strict-origin-when-cross-origin` · `X-Content-Type-Options: nosniff` · `Permissions-Policy: microphone=(self), camera=(), geolocation=()` (voice input uses the microphone on this origin; nothing uses the camera or location). `x-powered-by` is off (`poweredByHeader: false`).
- [ ] Check them on the deployed URL: `curl -sI https://lumen-nu-steel.vercel.app/sign-in`.
- [ ] A full Content-Security-Policy (scripts, styles, connections). Only `frame-ancestors` is set: Clerk's scripts and frames, the voice model's downloads from Hugging Face and its wasm each need an allowance, tested in a browser.

## Dependencies — `npm audit`
- **4 high, none reachable on the server (reviewed 2026-09-13, `npm audit --omit=dev`; decided: `@huggingface/transformers` stays).** All four come through `@huggingface/transformers@4.2.0`: `adm-zip <=0.6.0` (a crafted ZIP's 4 GB allocation; extraction following symlinks) via `onnxruntime-node@1.24.3`, and `sharp <=0.35.4-rc.0` (libvips and libheif CVEs) as its own nested copy, `sharp@0.34.5` — plus the two packages that carry them. Neither has a fix available.
  - Both are Node-side packages. The library is imported by exactly one file, `src/components/chat/voice/whisper.worker.ts`, a browser Web Worker that `localEngine.ts` starts (`new Worker(new URL("./whisper.worker.ts", import.meta.url))`) on the first voice tap; `localEngine.ts` imports only its types. In the browser the library uses `onnxruntime-web`, so the vulnerable code never runs on the server and never receives a ZIP or an image from anyone.
  - Next's own `sharp` (for `next/image`, used by `RoomScene.tsx`) is the top-level `sharp@0.35.4`, outside the flagged range.
  - **Revisit** if `@huggingface/transformers` is ever imported from server code (a route, a server component, `src/core`), or if `next/image` ever resolves the nested copy. Re-run `npm audit --omit=dev` when transformers updates.

## Rename outside the repo (Coherence)
The app and docs say Coherence since 2026-09-12. These still say Lumen, and each is Chanté's call; none of them blocks anything.
- [ ] **Clerk application name** (dashboard → the *Lumen* app → Settings). This is the one a user sees: "Sign in to Lumen" on the sign-in and sign-up cards, and in verification emails. The name is per application, so dev and production change together; keys, instances and `clerk_user_id`s stay as they are.
- [ ] **Google OAuth consent screen** (Google Cloud console → APIs & Services → OAuth consent screen → App name, logo). It shows on Connect Google. In Testing mode the change is immediate. A published app with the `gmail.readonly` scope goes back through verification.
- [ ] **Publish the Google consent screen** (2026-09-13). While it's in Testing, anyone not on the test-user list who picks *Continue with Google* is blocked, and test users see Google's unverified-app screen. Mail is switched off in the code (`MAIL_ON`), so: Google Auth Platform → **Data Access** → remove `gmail.readonly` → Save; **Audience** → *Publish app*. With only `openid`, email and profile there is no review. Adding a logo under Branding brings brand verification, so leave it off until that's worth doing. In Clerk (Lumen → Production → SSO connections → Google), the scopes should be only the defaults. Turning mail back on means the scope comes back and Google's restricted-scope verification before the app can stay published.
- [ ] **Vercel project** (`lumen` → Settings → General → Project Name). Local `.vercel/project.json` links by id, so it keeps working. The existing `lumen-nu-steel.vercel.app` URL stays; a `coherence-*.vercel.app` alias is optional. `clerk.burlyman.ca` doesn't change. After the rename, `--project lumen` in the command above becomes the new name.
- [ ] **GitHub repo** `chanteblais/Lumen` (Settings → Repository name). GitHub redirects the old URL, and Vercel's Git link follows (check Settings → Git). Then run `git remote set-url origin git@github-personal:chanteblais/<new>.git` once in the main checkout (worktrees share the config), and add a `decisions.md` line like the one from the `rali` rename.
- [ ] **The folder** `~/Projects/lumen`: a coordinated stop (`branching.md` rule 8): every session stops, the folder moves, `git worktree repair` runs, and every session restarts in the new path. Claude's project memory is keyed to the folder path (`~/.claude/projects/-Users-chante-Projects-lumen/`), so move that directory to the new path's slug or the memories stop loading. The least valuable rename. Fine to leave.

## Privacy
- [x] **Privacy policy page** at `/privacy` (public; linked under the sign-in and sign-up cards), 2026-09-13, for the Google consent screen's *Privacy policy link*: `https://www.burlyman.ca/privacy`, with `burlyman.ca` under Authorized domains. Written from the code, reviewed by Chanté; not legal advice. **Keep it true:** a new service, a new table of personal data, what goes to the model, the model provider (`LUMI_MODEL=anthropic:…` in production would mean naming Anthropic), mail coming back, or an in-app delete each change the page in the same commit.
- [ ] Privacy note in Settings: conversations, what Lumi has learned and short gists of recent mail are sent to OpenAI's API (not used for training; requests sent with `store: false`, though OpenAI may keep them up to 30 days for abuse monitoring; check the current terms before writing the note), stored in our database keyed to your account, and deletable in full.
- [ ] Export + delete-everything path exists and is tested (single cascade by `user_id`).
- [ ] No conversation text in Vercel logs.

## General
- [ ] Full loop on the deployed URL: sign in → talk → intention created → Today: *Not this* and *Break it down* on the card → return next day → greeting reflects it.

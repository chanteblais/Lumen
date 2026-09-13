# Development hygiene — an evolving strategy

*Claude's working doc, started 2026-09-13. Chanté's ask: catch problems like a stale `.next` or packages missing from `node_modules` earlier, in a doc that evolves to keep development as tidy as possible, developed by Claude's judgement and taken to her only when it has to be. Claude owns it: read it at session start, update it at session end. Branch rules, ports and the docs audit live in [`branching.md`](branching.md); this doc covers what surrounds the code — installs, generated files, env, servers, worktrees, hooks — and how its traps get caught.*

## The strategy
1. **Fail in the first second, with the fix in the message.** A trap that surfaces three steps later as a confusing error (tsc's *Cannot find module*, a server that dies at startup, a 500 at the first request) costs a turn to diagnose. A guard that runs first and says `npm ci` costs nothing. Guards live in `scripts/preflight.mjs` and `.githooks/`.
2. **Every snag becomes a row; a cheap catch becomes a guard now.** Anything that cost a turn goes in *Traps* in the same session: symptom, cause, how it's caught, fix. If the catch is a few lines of script, write it then rather than waiting for the second time.
3. **Generated state is disposable; nothing else is.** `.next/`, `node_modules/` and `tsconfig.tsbuildinfo` can be deleted and rebuilt without asking, once no running server uses them. Anything tracked, anything hand-made but untracked (`.env.local`, drafts in `art/`), and anything another session owns (branches, stashes, worktrees, servers) is never cleaned up on a guess.
4. **A merge brings environment, not just code.** Merging or pulling `main` can add a package, rename a route or add an env key. After any merge, run the preflight (`npm run check` does) before believing an error.
5. **Leave every checkout as you found it, or tidier.** Servers you started stopped, merged branches deleted, your worktree committed or clean, nothing stashed.

## Session start (≤ 1 minute)
1. `git branch --show-current` — is it yours? (`branching.md` → Parallel sessions.) In a worktree, rename a `worktree-*` or `claude/*` branch to `type/slug` before the first commit.
2. `npm run preflight` — or let `npm run check` / `npm run dev` run it. Do what it says before anything else.
3. Merged `origin/main` or pulled mid-session? Preflight again.
4. Skim *Traps* for the area you're about to touch.

## Session end (≤ 3 minutes, before the last commit)
1. Stop every server you started, and only those. Any left running for review: say which port serves which branch, as a clickable link.
2. Merged branches deleted; nothing of yours in `git stash list`; your worktree committed or clean.
3. Anything that cost a turn → a *Traps* row. Land one *Backlog* item, or re-rank it if something moved.
4. Fix what this doc got wrong; add a *Change log* line.

## Guards in place
| Guard | Catches | Runs | Where |
|---|---|---|---|
| Preflight | `node_modules` missing, a symlink, or behind `package-lock.json` (names each package) · generated route types pointing at routes that no longer exist (removes them; Next writes them again) · `.env.local` missing, or missing a key `.env.example` requires (key names only, never values) | before `npm run check` and `npm run dev` (npm's `precheck` / `predev`); by hand as `npm run preflight`. Env problems fail `dev` and are a note on `check`; skipped in CI | `scripts/preflight.mjs` |
| `npm run check` | types, lint incl. the `src/core` import guard, tests, the route-auth audit, the CSS prefix audit | before every merge; CI on every push to `main` and every PR | `package.json`, `.github/workflows/ci.yml` |
| CSS prefix audit | a rule in the compiled stylesheet that kept `-webkit-<prop>` but lost `<prop>` (lightningcss drops the unprefixed one when the prefixed line follows it) | inside `npm run check`; by hand as `npm run check:css` | `scripts/check-css-prefixes.mjs` |
| pre-commit hook | `.claude/` bookkeeping staged; direct commits to `main` | every commit | `.githooks/pre-commit` |
| Port etiquette | killing or reusing someone else's server; two servers in one checkout | before starting any server (by hand) | `CLAUDE.md`, `branching.md` → Dev servers |

## Traps — symptom → cause → catch → fix
Newest first. *By hand* in the catch column marks a backlog candidate.

| First seen | Symptom | Cause | Caught by | Fix |
|---|---|---|---|---|
| 2026-09-13 | No glass surface blurs on Home, Today or the Library; in Chrome `getComputedStyle(sidebar).backdropFilter` is `none`, and the served CSS has only `-webkit-backdrop-filter` in those rules | the source wrote `backdrop-filter` then `-webkit-backdrop-filter` in each rule; lightningcss (Turbopack's CSS pass in dev, Tailwind's optimize in a build) folds the pair into one property and the later prefixed line wins, so the unprefixed one is dropped. Order-dependent, not value-dependent (prefixed-first keeps both). Chrome ignores the prefix, so nothing errors | CSS prefix audit (`npm run check:css`) | write the unprefixed property only; the pipeline adds `-webkit-` for Safari from its targets |
| 2026-09-13 | Lumi fails in a worktree's dev server after the OpenAI switch | `.env.local` was copied into the worktree before `main` started needing `OPENAI_API_KEY` | preflight (keys against `.env.example`) | copy the key from the main checkout's `.env.local` |
| 2026-09-13 | `tsc`: *Cannot find module '@ai-sdk/openai'* right after merging `main` | the merge added a package; the worktree's `node_modules` predates it | preflight (installed versions against the lockfile) | `npm ci` |
| 2026-09-13 | `tsc`: *Cannot find module '../../../src/app/lists/page.js'* in `.next/dev/types/validator.ts` | Lists was renamed the Library; `next typegen` rewrites `.next/types` but not `.next/dev/types`, and `tsconfig.json` includes both | preflight (removes the stale types) | automatic; by hand, `rm -rf .next/dev/types` once no server of this checkout is running |
| 2026-09-13 | A worktree runs a different version of a hook than its own branch has | `core.hooksPath` is the shared checkout's absolute path (`/Users/chante/Projects/lumen/.githooks`), so every worktree runs the hooks of whatever branch the shared checkout has out; a hook changed on a branch is live nowhere until the shared checkout has it | by hand (`git config --get core.hooksPath`) | test a hook directly (`sh .githooks/<hook>`) from your worktree; Backlog #2 |
| 2026-09-13 | `grep --include=*.ts …` → *zsh: no matches found* | zsh expands the unquoted glob before grep sees it | by hand | quote globs (`--include='*.ts'`) |
| 2026-09-13 | `git merge -F -` with a heredoc: *could not read file '-'* in a worktree session | the Bash guard in worktree sessions | by hand | repeated `-m` paragraphs |
| 2026-09-12 | A worktree's review server dies at startup: *Symlink [project]/node_modules is invalid* — though `npm run check` passed | Turbopack refuses a `node_modules` symlink pointing outside the project; tsc and vitest don't mind | preflight (symlink check) | `rm node_modules && npm ci` |
| 2026-09-12 | A fresh worktree's server fails at the first request (Clerk keys) | `.env.local` is untracked, so a worktree has none | preflight (fails `dev`) | `cp <main checkout>/.env.local .env.local` |
| 2026-09-12 | Every session's cwd went stale after `rali` → `lumen` | the directory was renamed under running sessions | by hand | coordinated stop (`branching.md` → Parallel sessions 8) |
| — | The browser shows a different branch than the one under review | a dev server serves its checkout's live working tree, and someone switched branches there | by hand (`lsof -a -p $PID -d cwd`, then `git -C <cwd> branch --show-current`) | serve a review from your own worktree; say which port serves which branch |
| — | Pages half-build, `.next` errors | two `next dev` in one checkout share `.next` | by hand (port etiquette) | one server per checkout |

## Backlog — ranked; land or re-rank one per session
1. **Post-merge nudge.** A `post-merge` / `post-checkout` hook that says *package-lock.json changed — run npm ci* the moment it happens, not at the next check. Blocked on #2: with the absolute `hooksPath` a new hook is live only once the shared checkout has it.
2. **Hooks from each worktree's own branch.** Set `core.hooksPath` to the relative `.githooks`, so a worktree runs its own copy. It's shared git config: change it when no other session is mid-commit, and note it in the change log.
3. **Worktree census.** A read-only `scripts/worktrees.mjs`: each worktree, its branch (or detached), merged into `origin/main` or not, last commit, dirty or clean, any server serving it. Claude tidies the ones it made; the rest go to Chanté (below). On 2026-09-13 there were eight, several detached.
4. **Review-server helper.** One command that finds the first free port from 3005, never touches 3000–3004, checks what anything already listening serves, runs the preflight, starts `next dev` in the background and prints the clickable link.
5. **Pin Node.** An `.nvmrc` and `engines` at 22 (CI's version), with a preflight line when the local major differs.

### Landed
- 2026-09-13 — `scripts/preflight.mjs` wired as `precheck` / `predev` / `preflight`: installs against the lockfile, symlinked `node_modules`, stale generated route types, `.env.local` and its required keys. `.env.example` now lists required keys uncommented and optional ones commented, so the preflight can read it.

## What goes to Chanté
Only these; everything else Claude decides, does and records here.
- Anything touching her accounts, keys or money (Vercel, Clerk, Supabase, OpenAI, Anthropic, Google).
- Removing or rewriting anything another session or person owns: their worktrees, branches, stashes, running servers, or files in the shared checkout.
- Anything on ports 3000–3004 or in another project.
- A change to how *she* works: what she runs, reviews or applies herself (migrations, the review checklist).

## Change log
- 2026-09-13 — Started, from the stale `.next/dev/types` and the missing `@ai-sdk/openai` hit while merging `docs/today-spec-as-built`. Preflight landed; review links are always clickable (`CLAUDE.md` → Review server).
- 2026-09-13 — Trap and guard: lightningcss dropped `backdrop-filter` from every rule that also wrote `-webkit-backdrop-filter` after it, so no glass blurred in Chrome. The source now writes the unprefixed property alone, and `scripts/check-css-prefixes.mjs` (in `npm run check`) fails on any compiled rule that kept a prefix without its twin.

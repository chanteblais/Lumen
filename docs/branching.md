# Branching strategy

Deliberately chill (inherited from Glåüm, 2026-09-11). `main` always deploys cleanly and every non-trivial change is one visible, revertable unit — not ceremony.

## The rules

1. **`main` is the deployable truth.** Pushing `main` deploys production (Vercel). Never push `main` with something half-done in it.
2. **Branch for anything non-trivial.** Short-lived, named `type/slug`: `feat/…` · `fix/…` · `ux/…` · `docs/…` · `chore/…`. Milestones from `docs/v1-plan.md` are `feat/m<N>-<slug>` (e.g. `feat/m0-shell`).
3. **Verify before merging:** `npm run check` passes (`next typegen` + `tsc`, eslint incl. the `src/core` import guard, vitest, the route-auth audit) and you've clicked through the affected pages on a local dev server. CI (`.github/workflows/ci.yml`) runs the same on pushes and PRs.
4. **Merge with `--no-ff`, then delete the branch.** `git log --first-parent main` reads as a changelog.
5. **Tiny tweaks may go straight to `main`.** Copy edits, doc updates, one-line fixes — use judgment. The pre-commit guard asks for `LUMEN_ALLOW_MAIN=1` on those.
6. **Migrations ride the branch that needs them.** Apply to prod at merge+deploy time; note the migration in the merge commit message.
7. **Want eyes on something before it ships?** Push the *branch* — Vercel builds a preview URL — then merge when happy. A pushed branch may also go up as a **pull request** (first one: #1, 2026-09-12): CI runs on it, and the desktop app can watch it and auto-fix CI failures. Merge a PR with **Create a merge commit** — never squash or rebase-merge — so `git log --first-parent main` stays the changelog; delete the branch after. Local `--no-ff` merge and PR merge are interchangeable; the merge commit is the invariant. (`gh` must be on the personal account for this repo — `gh auth switch --user chanteblais`; the work account can push over the `github-personal` SSH alias but can't open PRs here.)

## Parallel sessions — one checkout is ONE git context

Branches belong to the *checkout*, not the session. Two sessions in one directory share one HEAD, one index, one working tree.

1. **The main checkout belongs to one git-active session at a time.** Check `git branch --show-current` before your first git command — a branch you didn't create means someone else is here: stop and ask, or take a worktree.
2. **A second concurrent session uses `git worktree`:**
   ```bash
   git worktree add ../lumen-<branch> -b <type>/<slug>
   # …work there; when merged:
   git worktree remove ../lumen-<branch>
   ```
   (Claude sessions: the EnterWorktree tool does this.) `.env.local` is untracked, so a fresh worktree has none — symlink it before starting a dev server there: `ln -s <main-checkout>/.env.local .env.local`. Run `npm ci` in the worktree too.
3. **Never `git add -A` / `git add .` in the shared checkout.** Stage explicit paths; glance at `git status` first.
3a. **In a worktree, keep every file path inside the worktree.** Read/Edit/Write take literal paths — an absolute path missing the worktree segment silently edits the shared checkout.
4. Sessions that only *read* need no branch and no worktree.
5. **Commit work-in-progress to the feature branch; never leave the shared checkout dirty between turns.** Sign-off triggers the merge, not the first commit.
6. **Never `git stash` in the shared checkout.**
7. **Release `main` the moment you're done with it.** A branch can only be checked out in one worktree at a time.
8. **Renaming or moving the project directory is a coordinated stop** (learned 2026-09-12, `rali` → `lumen`): every active session's cwd goes stale and any dev server keeps serving the old path. Message every session first (commit in flight, stop servers, no git for a few minutes), move, run `git worktree repair` from the new main checkout, then tell them the new path. A session that lands in a deleted cwd must restart in the new path before touching anything.

## Dev servers and ports

- **3005 is this project's review port.** 3000–3004 belong to other projects on this machine (3000 is Chanté's own — never start or stop anything there).
- **Check before you start:** `PID=$(lsof -nP -iTCP:3005 -sTCP:LISTEN -t)` then `lsof -a -p $PID -d cwd` tells you which checkout a running server serves (a detached `rali-main`/`lumen-main` view, a worktree, the shared checkout…). If it already serves the checkout + branch you need, reuse it. If it serves something else, take the next free port (3006, 3007, …) and serve from your own worktree. **Never kill a server you didn't start.**
- **One server per checkout.** Two `next dev` processes in one directory share `.next` and corrupt each other.
- **A server serves the working tree, not a branch.** Switching branches in that checkout switches what the browser shows — say so in the review checklist, and stop your server before switching away from the branch under review.
- **Worktrees have no `.env.local`** (untracked). Copy or symlink it from the main checkout before starting a server there.
- **Review server lifecycle:** start it when the change is implemented, leave it running with a review checklist (pages, what to look for, preconditions, which port serves which branch), stop it once the change is merged. Servers started only for Claude's own verification are stopped as soon as verification is done.

## Commit guards (pre-commit hook)

A versioned hook at `.githooks/pre-commit` (active via `core.hooksPath = .githooks`; a **fresh clone** must run `git config core.hooksPath .githooks` once). It enforces:

1. **No `.claude/` bookkeeping in commits** (only `launch.json` is allowed; the rest is gitignored too).
2. **No direct commits to `main`.** The crossed-session tripwire — a session that thinks it's in Glåüm or All Hands lands here on `main` and stops loudly. `--no-ff` merges are unaffected. Deliberate rule-5 tweaks: `LUMEN_ALLOW_MAIN=1 git commit …`.

## Claude sessions

**Every session branches before its first edit.** `type/slug` when the scope is clear, `session/YYYY-MM-DD-<topic>` when it isn't. Unrelated tasks in one session get separate branches. Merge with `--no-ff` after verification, delete the branch, and **push `main`** — Chanté's approval to merge covers the deploy. Guardrails on the push:

- **Approval first.** Merge + push happen when Chanté has signed off ("looks good", "merge it"). Never push work she hasn't seen.
- **A push ships all of `main`.** Check `git log --first-parent origin/main..main` before pushing and say what rides along.
- **Docs ride along — verify before pushing.** Every outgoing commit must have its docs folded in (the standing docs-before-commit sweep: `docs/domain.md` incl. migrations reference, `docs/features.md`, `docs/architecture.md` incl. API routes, the relevant spec, `docs/ef-burden-log.md`, `docs/decisions.md` if a decision moved). Stale docs → land the docs fix first, then push.
- **Migrations deploy with their code.** Claude applies additive migrations itself (`npm run db:migrate`) on the branch, before review; destructive ones wait for Chanté's explicit go. If a migration can't be applied, hold the push and say why.
- **When in doubt, don't.** Leave the push to Chanté.

## Day-to-day cheat sheet

```bash
git checkout -b fix/thing        # start
# …work, verify (npm run check + local click-through)…
git add <paths> && git commit -m "Fix thing"
git checkout main
git merge --no-ff fix/thing -m "Fix thing (fix/thing)"
git branch -d fix/thing
git push                          # on approval — approval to merge = approval to deploy
```

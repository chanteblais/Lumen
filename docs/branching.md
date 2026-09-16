# Branching strategy

Deliberately chill (inherited from Glåüm, 2026-09-11). `main` always deploys cleanly and every non-trivial change is one visible, revertable unit — not ceremony.

## The rules

1. **`main` is the deployable truth.** Pushing `main` deploys production (Vercel). Never push `main` with something half-done in it.
2. **Branch for anything non-trivial.** Short-lived, named `type/slug`: `feat/…` · `fix/…` · `ux/…` · `docs/…` · `chore/…`. Milestones from `docs/v1-plan.md` are `feat/m<N>-<slug>` (e.g. `feat/m0-shell`).
3. **Verify before merging:** `npm run check` passes (`next typegen` + `tsc`, eslint incl. the `src/core` import guard, vitest, the route-auth audit, the CSS prefix audit), you've clicked through the affected pages on a local dev server, and the **docs audit** (its own section below) is done — every doc the branch's changes touch reads true, fixed on the branch if not. CI (`.github/workflows/ci.yml`) runs the same checks on pushes and PRs; the docs audit is a human/Claude step, CI can't do it.
4. **Land with `npm run land -- <branch>`, then delete the branch.** It makes the same `--no-ff` merge commit without checking `main` out anywhere (*Landing on main*, below), so `git log --first-parent main` still reads as a changelog. Never `git checkout main && git merge`.
5. **Tiny tweaks still get a branch** — copy edits, doc updates, one-line fixes: a `docs/…` or `chore/…` branch, one commit, `npm run land`. It's a minute, and it keeps `main` free for everyone. The docs audit still applies in miniature: does any doc describe the line you just changed? (`COHERENCE_ALLOW_MAIN=1` still gets a commit past the guard in a checkout that has `main` out — an emergency, not a habit.)
6. **Migrations ride the branch that needs them.** Claude applies them (since 2026-09-13, `CLAUDE.md` → Apply and print migrations): an add-only one as soon as the branch's check passes, so it can be reviewed against real data; one that `main`'s code would trip on at merge+deploy time; a destructive one only on Chanté's yes. Note the migration in the merge commit message.
7. **Want eyes on something before it ships?** Push the *branch* — Vercel builds a preview URL — then merge when happy. A pushed branch may also go up as a **pull request** (first one: #1, 2026-09-12): CI runs on it, and the desktop app can watch it and auto-fix CI failures. Merge a PR with **Create a merge commit** — never squash or rebase-merge — so `git log --first-parent main` stays the changelog; delete the branch after. `npm run land` and PR merge are interchangeable; the merge commit is the invariant. (`gh` must be on the personal account for this repo — `gh auth switch --user chanteblais`; the work account can push over the `github-personal` SSH alias but can't open PRs here.)

## Landing on main — nobody parks on `main`

Git lets a branch be checked out in only one worktree at a time. With many sessions merging a day (about 19 moves of `main` on 2026-09-13 alone), `git checkout main && git merge` left `main` held by whichever checkout merged last, and every other session's merge was blocked until someone released it. So nobody checks `main` out any more:

- **`npm run land -- <branch> [-m "subject"] [-m "paragraph"]…`** (`scripts/land.mjs`), from any checkout. It builds the merge from refs alone — `git merge-tree --write-tree`, `git commit-tree` with parents `main` then the branch — and moves `main` with a compare-and-swap (`git update-ref <new> <old>`), so two sessions landing at once can't clobber each other. It touches no working tree. It refuses, saying why and what to run:
  - if any worktree has `main` checked out (moving the ref would leave that checkout's files out of step) — it names the checkout;
  - unless the branch already contains the latest `main` — merge `main` into the branch in its own checkout first, resolve, re-run `npm run check`, then land. That merge-in is where conflicts belong: on the branch, verified, never on `main`;
  - if `main` moved while landing — nothing changed; merge `main` in again and re-run.
- **The shared checkout parks detached at `main`'s commit** (`git switch --detach main`) — same files, no branch held. Its files trail `main` until the next session there runs `git switch --detach main` again (or starts a branch from `main`). The pre-commit guard blocks commits on that detached HEAD, so nothing lands on no branch.
- **A worktree never checks out `main` either.** Start branches from the ref: `git worktree add <path> -b <type>/<slug> main`.
- **Pushing needs no checkout:** `git push origin main` pushes the ref wherever you are.

## Docs audit — before every merge and push

The standing *docs-before-commit* sweep (`CLAUDE.md`) keeps each commit honest. This step keeps the **branch** honest: what a branch ends up changing is rarely what its first commit changed, and a doc updated on commit one is often stale by commit six. So the audit runs once more, whole-branch, as the last thing before a landing, a PR merge or a push of `main` — after `npm run check` and the click-through, never before them (a fix during verification changes the answer).

1. **List what changed.** `git diff main...HEAD --stat` on a branch; `git log --first-parent origin/main..main` plus `git diff origin/main..main --stat` before a push (a push ships all of `main`, so the audit covers everything riding along, not just your own work).
2. **Map every changed file to the doc that describes it,** then *read that passage* — not just check the file was touched:
   | Changed | Doc that must still read true |
   |---|---|
   | `src/db/schema.ts`, `src/db/migrations/*.sql` | `docs/domain.md` (tables + migrations reference) |
   | `src/app/api/**`, `src/core/ai/**`, conventions | `docs/architecture.md` (API routes, how the AI layer touches state, sticky decisions) |
   | a page or component (`src/app/**`, `src/components/**`) | `docs/features.md`; the page's spec where one exists (`docs/today.md`) |
   | anything visual — tokens, classes, ornaments, the companion | `docs/design-system.md`; `docs/design-philosophy.md` if a principle bent |
   | persona, tools, greeting, check-ins | `docs/architecture.md`; `docs/voice-eval-log.md` if a scenario was run |
   | a canon source of Lumi's brief (listed in `docs/philosophy/lumi-brief.md`; `npm run check:brief` names it) | `docs/philosophy/lumi-brief.md`: does the change alter what Lumi should understand? Update the brief if so, then `npm run brief -- --reviewed` and a change-log line either way |
   | copy or a control that asks the user to set, keep, rate or confirm anything | `docs/ef-burden-log.md` (a row, with its verdict) |
   | a decision that moved | `docs/decisions.md` (append); if it changes how the product behaves or why, also `docs/living/decisions.md`, and the affected canonical doc from `PROJECT-CANON.md` |
   | behaviour that now differs from the canon | surface it to Chanté: code changes, doc changes, or a new entry in `docs/living/open-questions.md`; never silently |
   | a working rule, port, script or session convention | `CLAUDE.md`, `docs/branching.md`, `docs/README.md` index |
   | `art/**`, `scripts/*lumi*`, `LumiSprite.tsx`, `LumiCompanion.tsx` loops | `docs/animation-pipeline.md` (ledger row, backlog, touch points, gates) and `art/README.md` (sheet table, what the cut corrects), on top of `docs/design-system.md` |
3. **Fix what's stale on the branch,** before the landing — its own `docs: …` commit is fine, amending the last commit is fine, "I'll do it after the merge" is not. If the audit finds something on `main` that's already stale (someone else's), land that docs fix first (its own `docs/…` branch), then push.
4. **Say what you audited.** The final summary lists the docs checked and the ones changed, or says *docs audited, nothing stale*. A landing or push isn't offered as ready until this line can be written.

## Parallel sessions — one checkout is ONE git context

Branches belong to the *checkout*, not the session. Two sessions in one directory share one HEAD, one index, one working tree.

1. **The main checkout belongs to one git-active session at a time.** Check `git branch --show-current` before your first git command — a branch you didn't create means someone else is here: stop and ask, or take a worktree. Empty output there means it's parked detached: `git switch --detach main` to catch its files up, then branch.
2. **A second concurrent session uses `git worktree`:**
   ```bash
   git worktree add ../lumen-<branch> -b <type>/<slug> main
   # …work there; when landed:
   git worktree remove ../lumen-<branch>
   ```
   (Claude sessions: the EnterWorktree tool does this.) A fresh worktree has no `node_modules` and no `.env.local` (both untracked). **Run `npm run preflight` straight after creating it** — `npm run check` / `npm run dev` run it too — and it fills in both: it clones `node_modules` from another checkout with a byte-identical `package-lock.json` (copy-on-write: ~1 s and no extra disk, against ~12 s and a fresh ~1 GB for `npm ci`) and copies the shared checkout's `.env.local`. When no checkout has a matching install — a branch that changes packages, or `main` just moved them — it says `npm ci`. Never symlink `node_modules`: Turbopack refuses it — [`dev-hygiene.md`](dev-hygiene.md).
3. **Never `git add -A` / `git add .` in the shared checkout.** Stage explicit paths; glance at `git status` first.
3a. **In a worktree, keep every file path inside the worktree.** Read/Edit/Write take literal paths — an absolute path missing the worktree segment silently edits the shared checkout.
4. Sessions that only *read* need no branch and no worktree.
5. **Commit work-in-progress to the feature branch; never leave the shared checkout dirty between turns.** Sign-off triggers the landing, not the first commit.
6. **Never `git stash` in the shared checkout.**
7. **Nobody parks on `main`** — not the shared checkout, not a worktree, not for a minute (*Landing on main*, above). Done in the shared checkout? Leave it on your branch until it lands, then `git switch --detach main`.
8. **Renaming or moving the project directory is a coordinated stop** (learned 2026-09-12, `rali` → `lumen`): every active session's cwd goes stale and any dev server keeps serving the old path. Message every session first (commit in flight, stop servers, no git for a few minutes), move, run `git worktree repair` from the new main checkout, then tell them the new path. A session that lands in a deleted cwd must restart in the new path before touching anything.
9. **Remove your worktree when its branch lands — or when you drop the work — as soon as it's safe, without asking.** Chanté's standing ask (2026-09-13): don't leave it for her to approve each time. **Safe** means all of: every branch you worked in it has landed (or you dropped the work on purpose), `git status` is clean, no server or shell of yours is still running in it, and no ignored file in it is worth keeping (sheet candidates, keys, an `.env.local` that differs from the shared checkout's). Then: `git switch --detach`, delete the branch with `git merge-base --is-ancestor <branch> main && git branch -D <branch>` (not `git branch -d`: it judges "merged" against the HEAD of the checkout it runs in, and the parked shared checkout trails `main`, so it refuses branches that have landed — `dev-hygiene.md` → Traps), and remove it — `git worktree remove <path>` from outside it, or, for a Claude session standing in its own worktree, the ExitWorktree tool with `action: "remove"` (this rule is the user's say-so the tool asks for). That tool removes only a worktree the session made with EnterWorktree; for one the desktop app made for the session (the session starts inside it) it is a no-op. Don't `git worktree remove` your own cwd from inside it — leave it detached at `main`, clean, branch deleted, say so in the summary, and the census (10) clears it once the session has ended and it has sat idle an hour. **Not safe** — uncommitted work, commits not on `main`, a review still open on its server, a file worth keeping — keep it and name it and the reason in your final summary. A worktree left behind keeps a ~1 GB `node_modules` (a cloned one shares its blocks until either copy changes, but `npm ci` in it writes a fresh one), a copy of `.env.local` and a branch or a detached HEAD nobody remembers; on 2026-09-13 fifteen had piled up. The census (10) catches what slips through.
10. **The census is how worktrees get cleared.** `npm run worktrees` lists every worktree and why it stays; `npm run worktrees -- --prune` removes only those that are safe: under `.claude/worktrees`, not locked, nothing running inside (session, shell or dev server), idle for an hour, no uncommitted changes, HEAD already on `main`, and no ignored file worth keeping (sheet candidates, keys, an `.env.local` that differs from the shared checkout's). It never touches the shared checkout, the checkout you run it from, or another tool's worktree, and deletes a branch only when its tip is on `main` (it checks ancestry against `main`, then `git branch -D`; `-d` judged against the HEAD of the checkout it ran from and kept branches that had landed). Run it at session end (`dev-hygiene.md` → Session end). Anything it keeps for a reason only its owner can settle — uncommitted work, unmerged commits, a differing `.env.local` — goes to Chanté, not to `--force`.

## Dev servers and ports

- **3005 is this project's review port.** 3000–3004 belong to other projects on this machine (3000 is Chanté's own — never start or stop anything there).
- **Check before you start:** `PID=$(lsof -nP -iTCP:3005 -sTCP:LISTEN -t)` then `lsof -a -p $PID -d cwd` tells you which checkout a running server serves (a detached `rali-main`/`lumen-main` view, a worktree, the shared checkout…). If it already serves the checkout + branch you need, reuse it. If it serves something else, take the next free port (3006, 3007, …) and serve from your own worktree. **Never kill a server you didn't start.**
- **One server per checkout.** Two `next dev` processes in one directory share `.next` and corrupt each other.
- **A server serves the working tree, not a branch.** Switching branches in that checkout switches what the browser shows — say so in the review checklist, and stop your server before switching away from the branch under review.
- **Worktrees have no `.env.local`** (untracked). The preflight before `npm run dev` copies the shared checkout's in; copy it by hand only when that checkout has none.
- **Review server lifecycle:** start it when the change is implemented, leave it running with a review checklist (pages, what to look for, preconditions, which port serves which branch), stop it once the change is landed. **Every URL in it is a clickable markdown link** — `[localhost:3005](http://localhost:3005)`, `[Today](http://localhost:3005/today)` — never a bare host or a URL in backticks. While it runs, **every reply from that session repeats the link** (and the branch it serves), even if it was given before — Chanté shouldn't have to scroll back for it. Servers started only for Claude's own verification are stopped as soon as verification is done.
- **Preflight first.** `npm run dev` runs `scripts/preflight.mjs` before starting (installs, stale generated types, `.env.local` and its keys); a fail names the fix. Traps and guards: [`dev-hygiene.md`](dev-hygiene.md).

## Commit guards (pre-commit hook)

A versioned hook at `.githooks/pre-commit` (active via `core.hooksPath = .githooks`; a **fresh clone** must run `git config core.hooksPath .githooks` once). The path is **relative** (since 2026-09-13; it was the shared checkout's absolute path), so every checkout — the shared one and each worktree — runs its own branch's copy: a hook changed on a branch is live in that branch's checkout at once, and in the others as they merge `main`. Keep it relative; an absolute path makes every worktree run whatever the shared checkout has out — it went absolute again once on 2026-09-13, so the preflight now fails on an absolute value and names the fix (`dev-hygiene.md` → Guards). It enforces:

1. **No `.claude/` bookkeeping in commits** (only `launch.json` and the project skills in `.claude/skills/` are allowed; the rest is gitignored too).
2. **No direct commits to `main`.** The crossed-session tripwire — a session that thinks it's in Glåüm or All Hands lands here and stops loudly. Emergencies only: `COHERENCE_ALLOW_MAIN=1 git commit …`.
3. **No commits on a detached HEAD in the shared checkout** — the parked state, where a commit would belong to no branch. Linked worktrees may detach freely. Deliberate (mid-rebase): `COHERENCE_ALLOW_DETACHED=1 git commit …`.

`npm run land` makes its merge commit with `git commit-tree`, which runs no hooks — its own refusals are the guard.

## Claude sessions

**Every session branches before its first edit.** `type/slug` when the scope is clear, `session/YYYY-MM-DD-<topic>` when it isn't. Unrelated tasks in one session get separate branches. After verification, merge `main` into the branch if it has moved, land with `npm run land`, delete the branch, remove the worktree (Parallel sessions 9), and **push `main`** — Chanté's approval to merge covers the deploy. End every session with `npm run worktrees -- --prune`. Guardrails on the push:

- **Approval first.** Landing + push happen when Chanté has signed off ("looks good", "merge it"). Never push work she hasn't seen.
- **A push ships all of `main`.** Check `git log --first-parent origin/main..main` before pushing and say what rides along.
- **Other sessions' landed merges may ride along without asking** (Chanté, 2026-09-13: "Typically if something gets merged to main it's because I approved the merge"). A merge on local `main` is approved work, so a push doesn't wait for the session that landed it. Three conditions instead of a question:
  1. **Diverged?** If `origin/main` has commits local `main` lacks, merge it into your branch (with local `main`), run `npm run check` on that combined tree, then land — the push is then a fast-forward. Two branches that each passed alone can break together; the check on the combined tree is what catches it.
  2. **Migrations first.** List the migrations the push carries (`git diff --name-only origin/main..main -- src/db/migrations`). For each, read `drizzle.__drizzle_migrations` and the schema: already applied (its sha256 recorded, its objects present) → nothing to do; additive → check the data first (duplicates against a new unique index, nulls against a new `not null`, a type a new index needs), then apply; destructive → Chanté's explicit yes. Never push code ahead of its migration: the push deploys it.
  3. **Anything fails → hold the push** and tell Chanté which check and why.
- **Docs audit before the landing and again before the push.** The whole-branch audit above is the gate: every commit that would ride along has its docs folded in and reading true. Stale docs → land the docs fix first (on the branch before its landing; its own `docs/…` branch before a push), then land or push. Never land with a docs fix "to follow".
- **Migrations deploy with their code.** Claude applies additive migrations itself (`npm run db:migrate`) on the branch, before review; destructive ones wait for Chanté's explicit go. If a migration can't be applied, hold the push and say why.
- **`land` refuses because a checkout holds `main`?** Name it to Chanté. Release it only if it's your own checkout, or she says no session is working there.
- **When in doubt, don't.** Leave the push to Chanté.

## Day-to-day cheat sheet

```bash
git switch -c fix/thing main       # start (or: git worktree add <path> -b fix/thing main)
# …work, verify (npm run check + local click-through)…
git add <paths> && git commit -m "Fix thing"
git merge main                     # if main moved: conflicts get resolved here, on the branch; npm run check again
git diff main...HEAD --stat        # docs audit: does every doc these files touch still read true? fix on the branch first
npm run land -- fix/thing -m "Merge branch 'fix/thing' — fix thing"
git switch --detach main           # in the shared checkout: park
git worktree remove <path>         # in a worktree: remove it once landed (from outside it)
git merge-base --is-ancestor fix/thing main && git branch -D fix/thing   # not -d: it judges against this checkout's HEAD
npm run worktrees -- --prune       # session end: clears every worktree that's safe to remove
git log --first-parent origin/main..main   # what rides along — audit its docs too
git push origin main               # on approval — approval to merge = approval to deploy
```

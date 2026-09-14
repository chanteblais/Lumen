---
name: desk
description: Refresh the Coherence Desk — fold Chanté's answers from the desk artifact into the repo, re-sweep what needs her, apply the ask test and standing delegations, journal what the desk learned, re-render and republish to the same link. Use when asked to refresh/update the desk, at the start of a session that will ask Chanté things, or when she says she answered on the desk.
---

# Refresh the desk

Read `docs/desk/README.md` first: the ask test, what each answer does, how the desk evolves. The artifact URL is at the bottom of that README. Work on your own branch (CLAUDE.md → Branching); desk changes are docs and land like any docs branch.

## 1. Collect her answers

- `Artifact` `action: "read_db"`, `url` = the desk, `db_op: "query"`, `collection: "responses"`, `query.where: [["processed", "==", false]]`.
- The same for `collection: "notes"`.
- Nothing there → skip to step 3.

## 2. Fold each answer in

For each response (`choice` → the README's table):
- Do or record what it says **in the item's home doc** (decision log, open question, spatial README, review log…), with her answer quoted as the rationale. A decision she made goes in `docs/living/decisions.md` when it moves how the product behaves; an engineering one in `docs/decisions.md`.
- Remove the item from `desk.json` `asks`/`hands`/`moving`; *Not now* moves it to `parked` with the date; *Bring forward* moves it to `asks` with a recommendation.
- Add it to `desk.json` `decisions` if it settled something (keep the newest ~6).
- *Don't bring me things like this* → draft a delegation and put **that** on the desk as one ask. Never write it into `delegations.md` until she says yes.
- Then mark it: `write_db` `db_op: "batch"`, `update` each `responses/<id>` / `notes/<id>` with `{processed: true, foldedIn: "<commit or date>"}`. Never delete her rows.

## 3. Sweep for what needs her

Look for new items since the last round (`journal.md` names the last commit swept): `git log --first-parent <last>..origin/main`, open questions and ideas that changed, art/animation approvals, review logs, memory files, branches in review (`npm run worktrees`), and anything a session left for her. For each candidate:
1. Does a delegation in `delegations.md` cover it? → Claude decides; add to `moving` for one round.
2. Does it pass the ask test (taste · direction · one-way door · her accounts/money/people)? → an ask, with `recommendation`, `ifSilent` (with a date for reversible ones; "waits" for one-way doors), `effort`, `sources`.
3. Neither → Claude decides, records it at home, `moving` for one round.

Clear `moving` rows older than one round. Past-date reversible asks: act on the default and move them to `moving` as done.

Order `asks` by what unblocks the most work soonest; taste and direction before tidy-ups. Keep asks few — if more than ~7 pass the test, the lowest go to `parked` under *Also waiting* with a note.

## 4. Reflect

Prepend a round to `docs/desk/journal.md` (format there): what went out, how she answered, signals (README → How the desk evolves) and what they moved, the desk's own measures, what the desk changes about itself, and anything *Carried to Coherence*. Update `desk.json` `reflection` from it, and write `letter`: 2–4 sentences restoring the present for someone who may have been away — what moved, what's hers now, what can wait. No counts of what's undone; no guilt about time away.

## 5. Render and publish

- `node scripts/desk/render.mjs` (it refuses an ask without a recommendation or silence default).
- `Artifact` publish `file_path: docs/desk/.out/desk.html` with `url` = the desk (from another session; same path in this one). Omit `favicon` and `capabilities` on a redeploy.
- Commit `desk.json`, `journal.md` and any home docs touched, on the branch; land per CLAUDE.md.

## Tell Chanté

In the reply: the desk link, one line on what's new, and the answers folded in with where each went. Don't restate the asks — the page is where she answers.

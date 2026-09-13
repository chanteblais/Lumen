# Lumi animation pipeline — the working doc

**Who this is for:** Claude, at the start of every session that touches Lumi's drawings, the cut, or the companion's loops. Read it top to bottom (three minutes), then follow *Session start*. Before the session ends, do *Session end*. The doc is a tool, not a record: rewrite what is wrong, delete what no longer earns its place, keep it short enough to read every time.

**The standing goal:** Chanté wants many animations. Every animation session leaves the pipeline faster than it found it — at least one move from the *Efficiency backlog* lands, or a new one is added with a reason it beats the ones above it. Measure the cost of each animation in the *Ledger* so the trend is visible.

**What it is not:** the how-the-cut-works reference. That lives in `art/README.md` (prompt recipe, what the cut corrects), `docs/design-system.md` → *Lumi sprites* / *Lumi companion* (what ships), and `docs/decisions.md` (why). This doc is the *process*: order of work, gates, touch points, costs, and what to fix next. **Where the art is heading and why** — the invariants of the character, the book-or-world tension, the ladder of animation tiers, what Lumi's motion means and the bets under test — is `docs/art-direction.md`; read its §4 and §8 before briefing an animation, since the cheapest tier that can carry a movement beats the fastest pipeline for a costlier one.

---

## Session start (≤ 3 minutes)

1. `ls art/lumi/` — any sheet not in the `art/README.md` table is new and uncut (`art/scenery/` is the painted rooms, `art/archived/` the earlier character's sheets). Sheets marked *retired with the character* are the earlier Lumi (before the lantern, 2026-09-12): reference for technique, never cut again. A sheet that carries a title, numbers or notes is cropped to its rows of cells before measuring, or the text counts as figures.
2. Read the *Ledger* (last two rows) and the top three of the *Efficiency backlog*, and the *Bets under test* in `docs/art-direction.md` §8 — work that tests an open bet is worth more than work that tests none. Decide which backlog move this session will land — the top one unless the animation at hand needs another first.
3. `python3 -c "import numpy, scipy, PIL"` — the scripts need all three (2.5 / 1.18 / 12.2 on 2026-09-12, `/usr/local/bin/python3`).
4. Port check (`lsof -nP -iTCP:3005 -sTCP:LISTEN -t`, then `lsof -a -p $PID -d cwd`) before starting a review server; the rules are in `CLAUDE.md`.
5. Branch: `ux/lumi-<movement>` for the animation; the backlog move rides on the same branch if it is what the animation needed, else its own `chore/lumi-<move>`.

---

## The pipeline, fastest known path

Seven stages. The cost of the first two animations sat almost entirely in stages 2 and 6 (bad sheets, and review rounds spent discovering what a number would have shown). Push every problem left: reject at *measure*, never at *review*.

### 1 · Brief (2 min, before any generation)
Write down, in the ledger row you open for this animation: the movement in one line, which part moves and which parts hold, where it plays (a variation on the breath loop · a reaction · a state), the frame budget (twelve or more in-betweens per motion; 120 ms a frame for a quick gesture, 320–560 ms for a slow one), and how it starts and ends (at or next to the breath rest frame, always — loops hand over there). Name its **tier** on the ladder in `docs/art-direction.md` §4; if a cheaper tier can carry the movement (light, synthesised from one drawing, layered), brief that tier instead of a generated sheet.

### 2 · Generate (Claude does this, unattended; since 2026-09-13)
```bash
python3 scripts/gen-lumi-sheet.py art/prompts/<sheet>.md [--model …] [--n 2]
```
OpenAI's image API (`OPENAI_API_KEY` in `.env.local`; copy it into a worktree), with the prompt file's references attached. Each candidate lands in `art/candidates/<sheet>/` (gitignored), is measured on arrival (stage 3) and gets a row in the prompt file's *Runs* table. Start a new sheet by copying the latest prompt file in `art/prompts/` — brief, settings, the prompt verbatim, what changed, runs — and iterate its words by the *Prompt lab* method below until a candidate passes the gates. Chanté sees the first candidate that passes, never the ones that failed, and approves it before it is cut; it then moves to `art/lumi/<sheet>.png`. (Until 2026-09-12 Chanté generated each sheet in ChatGPT by hand from a prompt Claude wrote — the courier step this replaces.)

The reference is the lantern sheet's rest cell alone, cropped off the sheet so its title, frame numbers and other poses are not there to copy (`art/lumi/lumi-lantern-idle.png crop=15,135,250,405 scale=2`; say the lantern holds unless it is the moving part). The template below is the recipe from `art/README.md` as a fill-in prompt; once a prompt file passes, that file is the better template.

```
One base drawing of this character; in every frame only <THE MOVING PART> changes.
The hood, face, ribbon, cloak folds and feet hold pixel for pixel unless named below.
Phases, in frame order:
  frames 1–<a>: <phase 1 — e.g. rest, then the head turns a little toward the left foot>
  frames <a+1>–<b>: <phase 2 — e.g. the left foot lifts and scuffs forward, head held turned>
  frames <b+1>–<n>: <phase 3 — e.g. everything returns to frame 1>
<n> frames in total, small even steps, slow in and slow out; frame 1 is the attached rest pose; the last frame equals frame 1.
Layout: a regular grid of <rows> rows × 8 columns, identical cell size, generous margins, the figure in the same place in every cell, feet on one baseline.
Ground: flat, untextured grey-blue (as in the attached sheet). No titles, labels, numbers or notes anywhere.
Same style, line weight, palette, lighting and costume as the reference: the sun on the hood, the ribbon with its brass medallions, the boots, the lantern; no scarf. Highest resolution, landscape.
```

Ask for the turn *back* explicitly and separately (the generator skipped it once and drew rest frames instead); if it is skipped again, the loop replays the way in reversed — that is fine and costs no sheet space.

### 3 · Measure (1 min — the gate)
```bash
python3 scripts/measure-lumi-sheet.py art/<sheet>.png
```
(On a sheet with a title or notes, crop to the rows of cells first — the lantern sheet's are at y 151–393 and 444–687 — or the text is counted as figures.) Read the numbers, then flip through the aligned strip it writes, then watch the `-motion.gif` beside it (the raw frames as motion, before any cut). A hand raised beside the hood enters the measured head region and moves the hood centre and the eyes' dx; read those against the strip before calling it drift. **Reject the sheet, and say why in one line, when any of these fails** — a cut cannot fix them, only hide them for a round or two:

| Gate | Pass | Fail → what to ask for |
|---|---|---|
| Frames found | equals rows × columns asked for | a merged or split figure: wider margins, plainer ground |
| Height per frame, within a row | spread ≤ 2% | figures boil: "one base drawing, only X changes" |
| Scale per row | rows within 5% of each other (the numbers are against the retired breath sheet's height, so a sheet drawn larger reads ~0.7 — fine, the cut scales down; above 1.05 the cut scales up and softens her) | rows drawn at different sizes: "identical cell size" |
| Head IoU per step, in a held phase | ≥ 0.975 | < 0.95 is a pop: a phase redrawn from scratch |
| Head IoU per step, in a turn | 0.95–0.975, monotone | jumps: too few in-betweens for that phase |
| Eyes dx | moves only in a glance phase | stray eye drift: hold the face |
| Dirt pixels | only where dirt is meant | specks on the ground: plainer ground |
| A phase present | every phase in the brief has frames | the generator skipped it: ask for it alone, or plan the reverse replay |
| Every step fails the IoU gate | — | a pose set, not an animation: usable as a *character* (one cell, breath and blink synthesised from it — the lantern sheet, 2026-09-12), never as a loop |

A sheet that passes all gates has, so far, needed one cut and one review round. A sheet that fails one has needed three.

### 4 · Cut (10–40 min today; backlog #1 brings it to ~5)
`scripts/cut-lumi-idle.py` regenerates `public/lumi-idle.webp` and `public/lumi-heads.png` from the lantern sheet. Today it cuts one rest cell and synthesises the breath (`breathe`) and the blink rows (`eyes_shut`), and cuts the six heads. A new in-betweened loop means adding its cells back: a row y-range for `frames(...)`, the cell list, a per-row scale to `FIGURE_H`, and — from the foot cut, in git history before the lantern commit — `settle` (cell 0 onto the breath rest frame, the rest onto cell 0) and the `hold_head` spans per phase. Run it with `--debug <dir>` for the cells on paper at 3×, and check the sheet size printed at the end.

### 5 · Wire (5 min — every touch point, in order)
1. `src/components/chat/LumiSprite.tsx` — `LUMI_LOOPS` (the name), `LUMI_LOOP_CELLS` (the play order over the row's cells; repeats and reversals are free), `LUMI_IDLE_FRAMES` if the row is the widest yet; the header comment's row map.
2. `src/components/shell/LumiCompanion.tsx` — `FRAME_MS` (with the one-line reason), `VARIATIONS` if it plays as a variation. The dev cue strip picks the new loop up on its own.
3. Docs, same commit: `art/README.md` table row · `docs/design-system.md` → Lumi sprites (the row map) and Lumi companion (timing) · `docs/features.md` → *Lumi in the corner* (the one-line description of what she does) · `docs/decisions.md` if a rule moved.

### 6 · Verify, then review (this is where rounds are won or lost)
**What Claude can verify without a browser, and should, before asking Chanté for anything:**
- The cut cells: `python3 scripts/preview-lumi-loop.py --row <n> --ms <ms> --blink 4 --out <dir>` writes a contact strip of the loop in play order and a GIF of it as the page plays it (the fade in four steps a frame). Look at the strip: the head must be one drawing across a held phase, the feet on one baseline, no cold rim, no grey fringe. Send the GIF to Chanté (SendUserFile) for a first look before any server is up.
- Frame-to-frame head IoU on the *cut* cells (same method as the measure script) — the settle should have made held phases ≥ 0.99.
- Fade: `fadeMs` is 80% of the faster loop's frame time; a fade longer than the frame reads as blur. A new frame time changes the fade for hand-overs automatically.
- Loop ends at or next to rest: first and last cells of the order.
- **Not** the Claude-in-Chrome tab: Chrome freezes CSS animation in that occluded window, and a capture shows her mid-fade. Say "verified from the cut cells and the measurements" and mean it.

**Then one review round, made to count.** Start the review server (`npm run dev -- -p 3005`, or the next free port from your checkout; say which branch it serves), and give Chanté in one message: the port and the cue button to press; the three numbers that matter (frame time, frames, fade); what changed since the last round in one line; and **one question per thing you suspect** ("does the head hold still through the kick?"), because "how does it look?" costs a round of translation. She judges motion by feel on her own screen and notices sub-pixel drift, fade ghosting and accidental gestures. If a gesture came from an accident (the crossfade morph once read as a head turn, and she liked it), say so before removing it — then draw it.

**When two treatments are plausible** (two orders, two frame times, hold vs no hold), cut both as separate loops and let the cue strip show each, so one round compares them instead of two rounds trying one each.

### 7 · Docs, ledger, commit
The docs sweep from stage 5 goes in the same commit as the cut. Then fill the ledger row (below) and update this doc — see *Session end*.

---

## Ledger — what each animation cost

Newest first. *Rounds* = messages from Chanté that sent the work back. *Wall clock* is from the first cut commit to the last, from `git log`, and includes other work interleaved on the same day.

| Date | Animation | Sheets generated | Rounds | Wall clock | Touch points | What cost the most | What it taught (→ where it is written) |
|---|---|---|---|---|---|---|---|
| 2026-09-13 | The wave (`lumi-wave.png`, 24 frames, 120 ms, a reaction on arrival) — tier 3 | 1 run of 4 candidates, generated by Claude (`gen-lumi-sheet.py`); 1 passed every gate | 0 — the sheet approved on first sight, before the cut | ~1 h 10 (00:19 first run → the cut commit), incl. writing the generator and the Prompt lab | 2 scripts (+ the generator) + 2 components + 7 docs | The cut, not the sheet: a hand that widens her on one side broke centring on the body (placed by the hood's right edge instead), and blink rows for 24 cells made the sheet 917 KB (dropped: 525 KB) | the prompt was the bottleneck, not the generator; judge the sheet's motion as a GIF before the cut; a short gesture needs no blink rows → Prompt lab findings, `art/README.md`, `decisions.md` |
| 2026-09-12 | The lantern character (`lumi-lantern-idle.png`): one rest cell, a synthesised nine-frame breath at 320 ms, blink lids, six heads | 1 (Chanté's; a pose sheet — failed the IoU gate as a loop, used as the character) | 0 before the first review | ~20 min (07:13 sheet added → 07:32 commit) | 2 scripts + 2 components + 5 docs | Two things the cut had never met — the lantern's light pool on the ground and a sheet with no blink row — and the head crop's chin line (0.44 → 0.53 of her height, one debug round) | a pose sheet is a character, not a loop; breath and blink can be synthesised from one cell; crop a titled sheet before measuring → `art/README.md`, `decisions.md` |
| 2026-09-12 | Playful foot with a glance (`lumi-idle-foot.png`, 15 cells, 21 frames, 120 ms) | 3 (`lumi-playful-foot` → `lumi-idle` → `lumi-idle-foot`) | 5 | ~2 h 05 (03:10 → 05:16) | 7 files + 4 docs | Sheet 1 was poses, not in-betweens (a whole sheet and two rounds lost); anchoring on the face (one round); a fade longer than the frame (one round); an accidental gesture removed and then drawn (one sheet, one round) | measure before judging; one drawing, only the moving part changes; a loop is an order over cells; hold a head cel per phase; fade ≤ 80% of frame → `art/README.md`, `decisions.md` |
| 2026-09-11/12 | Slow idle: breath · blink · sway (`lumi-slow-idle.png`) | 2 (`lumi-idle` → `lumi-slow-idle`) | 3 | ~1 h 05 (23:37 → 00:43) | first cut of everything | The first sheet's "micro variations" were separate drawings and read as image swaps; a hand cut keyed on paper ate the cream hood | matte by flood fill from outside; centre on the figure, not the sheet's spacing → `decisions.md` |

**Target for the next animation:** one sheet (rejected at *measure* if it must be), ≤ 2 rounds, ≤ 45 min wall clock, ≤ 3 code touch points.

---

## Efficiency backlog — ranked, one per session minimum

Rank by (rounds or minutes saved per animation) ÷ (effort once). Re-rank at session end. When a move lands, move it to *Landed* with the date and what it actually saved.

1. **The cut takes a sheet spec, not code edits.** Cheaper now the script holds one loop (2026-09-12). Give `scripts/cut-lumi-idle.py` a list of specs — `{sheet, contrast, rows (found by segmentation the way the measure script does, not hard-coded y-ranges), cells, holds: [(span, donor)], settle_to}` — so a new loop is one dict entry and one run. *Saves* ~30 min and the row-coordinate hunting per sheet; removes the "expect N frames" assertion failures. *Done when* the current three loops re-cut byte-identical (or visually identical) from the spec form and `lumi-stretch.png` cuts from a spec alone.
2. **One command each.** `npm run lumi:measure -- art/lumi/x.png`, `lumi:cut`, `lumi:preview`; `lumi:measure` exits non-zero and prints the failed gate from the table above, so a bad sheet is rejected by the tool, not by the fifth review round. *Saves* a few minutes and, more, the temptation to cut a sheet that should be rejected.
3. **A loop is one entry.** Move `FRAME_MS` next to `LUMI_LOOP_CELLS` (a `{cells, ms, variation}` record per loop in `LumiSprite.tsx`), derive `LUMI_IDLE_FRAMES` from the widest row, and have the cut script read the same table (or write it). Touch points for a new loop: 3 → 1 code file plus docs.
4. **Reactions as a table.** The wave landed the shape (`REACTIONS` in LumiCompanion, queued at the next rest frame, no variation scheduled after it) with its trigger written inline (arrival). The second reaction should move triggers into one place — a `lumi:react` window event any page can raise, with the arrival check as its first sender — so a new reaction is a sheet, a `REACTIONS` entry and one `dispatchEvent`.
5. **Compare in one round.** A cue-strip convention for candidate loops (`foot-a`, `foot-b`) that never ship: cut alternatives as extra rows, review once, delete the losers before merge.
6. **Gates in the generator.** `gen-lumi-sheet.py` records frames found but leaves the verdict to Claude reading `-measure.txt`; once #2 makes the measure script print pass/fail per gate, write that into the *Runs* row so a round needs no reading until something passes.

**Next animation, not a backlog move:** an idle variation drawn of her, so `VARIATIONS` stops being empty — a lantern lift (the lantern sheet's cell 12 shows the pose), from a copy of `art/prompts/lumi-wave.md` with the wave's first cell as the reference (it is the drawing the body is cut from now). Her breath is synthesised and fine; a drawn breath is not worth a sheet.

### Landed
- 2026-09-13 — **Claude generates the sheets** (`scripts/gen-lumi-sheet.py`, OpenAI's image API) and **prompts are files** (`art/prompts/<sheet>.md`, old backlog #4) with the *Prompt lab* method; the measure script writes a **motion GIF** of the raw frames for approval before the cut. Saved on the wave: Chanté's courier trip per sheet; the first run of four candidates took ~30 s and gave a sheet that passed every gate.
- 2026-09-12 — `scripts/preview-lumi-loop.py` (a contact strip and a GIF of a loop as the page plays it, the fade in four steps a frame). Saved the server-and-port dance for the first look at the lantern cut; Claude verified from the strip and the numbers, Chanté got the GIF before a server. Not yet checked against the page frame for frame.
- 2026-09-12 — `scripts/measure-lumi-sheet.py` (measure before judging; the aligned strip). `LUMI_LOOP_CELLS` (orders over cells, so reversals and repeats cost no sheet space). Per-row scale, quarter-pixel settle, per-phase head hold, the contrast-ground matte. The dev cue strip (a variation on demand instead of a 20–45 s wait). Written up in `art/README.md`.

---

## Prompt lab — the words get the pipeline's treatment

Bad sheets were the most expensive line in the ledger, so the prompt is iterated the way the pipeline is: measured, one change at a time, written down, and faster every session (Chanté, 2026-09-13).

- **One prompt file per sheet,** `art/prompts/<sheet>.md`: the brief, the settings (`version`, `model`, `size`, `quality`, `n`, `grid`, `reference` lines), the prompt verbatim under `## Prompt`, *What changed* per version, and *Runs*, appended by the script. The file's git history keeps the old words.
- **A round:** run → read each candidate's `-measure.txt` and aligned strip against the stage 3 gates → write the verdict in its *Runs* row (*pass*, or the first failed gate in a few words) → change **one** thing, say what and why under *What changed* → bump `version:` → run again. Two changes in one round teach nothing.
- **Cheapest lever first:** the reference (what is attached, cropped how) → the structure (frames per sheet, rows, one phase per sheet) → the words aimed at the failed gate (the gate table's *Fail* column) → the model → quality and size.
- **Budget:** the script stops at 4 images a run. Stop and tell Chanté after six runs or about $10 on one sheet without a pass: the movement may want a cheaper tier (`docs/art-direction.md` §4), not more words.
- **What Chanté sees:** the first passing candidate's aligned strip (a GIF once it is cut). She approves the sheet before the cut.
- **Findings compound below.** A finding that held on two sheets moves into the stage 2 template and gets a *Landed* line; one that held once stays a row. A finding that failed to repeat is struck, with the run that broke it.

### Findings

Newest first. *Evidence* names the runs (prompt file · version · candidate).

| Date | Finding | Evidence | Status |
|---|---|---|---|
| 2026-09-13 | **The generator can hold one drawing now.** The stage 2 template with the rest cell as the only reference gave in-betweens on the first run: head IoU 0.986–0.997 on every step of a 24-frame sheet, against 0.83–0.96 for the hand-made ChatGPT lantern sheet. The prompt, not the model's limits, was the bottleneck. | lumi-wave · v1 · `sunburst-…-1` | held once |
| 2026-09-13 | **`gpt-image-2.5-sunburst` for a movement with phases.** Both 2.5 models held the drawing (flare 0.967+), but flare compressed the rise and fall into one step each (the hand jumps from the hem to the chest) and in one candidate moved the lantern between rows; sunburst drew the six-frame rise and fall as asked. Same token cost, both ~30 s. | lumi-wave · v1 · all four | held once |
| 2026-09-13 | **Crop the reference to the one cell.** No titles, numbers, notes or stray poses in four of four candidates, and 24 of 24 frames found in each. | lumi-wave · v1 · all four | held once |
| 2026-09-13 | **Name the hand's shape.** One of two sunburst candidates waved a fist. "A small dark hand" is not enough; v2 says an open palm. | lumi-wave · v1 · `sunburst-…-2` | open |

### Prompt backlog — experiments, ranked

Rank by how many failed gates it could fix across sheets ÷ what a run costs. Re-rank at session end.

1. ~~**Model: `gpt-image-2.5-sunburst` against `-flare`**~~ — done on lumi-wave v1: sunburst (Findings).
2. **One motion per sheet.** The wave's rise, waves and fall as three short sheets that share a pose at the joins, against 24 frames on one sheet — fewer frames per image may hold the drawing better.
3. **Describe what the gates measure.** "The hood's outline is the same shape in every frame" against "pixel for pixel" — the generator may not read the second as a constraint.
4. **A second reference.** The rest cell plus the first passing sheet of the same character, for the grid and the in-between spacing.
5. **Bigger cells.** Sizes up to 3840 wide are accepted (multiples of 16); the measure script's canvases are sized for ~250px figures (300×320, head rows 140), so scale those or downscale the candidate first.

## Pitfalls that are not in `art/README.md`

Everything the generator gets wrong and the cut already corrects is in the README's table; do not repeat it here. These are the process traps:

- **Judging from the raw sheet or the browser tab first.** The numbers take a minute and have been right every time; eyes on the raw sheet were wrong twice.
- **Cutting a sheet that failed a gate** because "the cut can probably fix it". It fixed the scale and the hold; it never fixed poses-instead-of-in-betweens or a missing phase. Reject and regenerate; it is cheaper than the rounds.
- **Removing an accidental gesture silently.** Say what it was, ask whether to keep it, draw it if yes.
- **Verifying motion in the Claude-in-Chrome tab.** Frozen when occluded. Use the cut cells, the measurements, and the preview script.
- **Two dev servers from one checkout** corrupt `.next`; ports 3000–3004 belong to other projects. Check who is on a port before starting anything.
- **Docs after the merge.** The row map in `design-system.md`, the README table and `features.md` go in the same commit as the cut, or the next session reads a stale map and cuts over the wrong row.

---

## Session end (≤ 5 minutes, before the last commit)

1. Fill or update the ledger row: sheets, rounds, wall clock from `git log`, what cost the most, what it taught and where that is now written.
2. Move the landed backlog item to *Landed* with what it actually saved; re-rank the rest; add any new move with a one-line reason for its rank.
2a. *Prompt lab:* every *Runs* row has a verdict; each finding the session produced is a row under *Findings* (or moved into the stage 2 template once it held twice); the prompt backlog is re-ranked.
3. Fix anything in this doc that turned out wrong (a gate threshold, a stage's time, a touch point). Delete what did not help.
4. Open `docs/art-direction.md`: name the tier the animation used in its ledger row, move any bet it tested (§8), add a §1 row for any new sheet or mockup, and add a line to that doc's change log.
5. Append one line to the *Change log* below.
6. This doc is a doc: it goes in the same commit as the animation, and the docs audit before merge checks it like any other.

## Change log

- 2026-09-13 — The wave cut and wired: its ledger row (0 rounds, one run); backlog #4 rewritten as "reactions as a table" now the wave landed the shape; the next animation is an idle variation drawn from the wave's first cell. The cut reads rows by segmentation for the wave sheet (a first step of backlog #1).

- 2026-09-13 — Stage 2 is Claude's now: `scripts/gen-lumi-sheet.py` and prompt files in `art/prompts/`; the *Prompt lab* section (method, findings, prompt backlog) and a session-end step for it; the scale gate reads rows against each other, not against 1.0; the measure script's motion GIF; backlog renumbered (prompts-as-files landed, reactions moved up for the wave, gates-in-the-generator added). The wave's first sheet passed on the first run, awaiting Chanté's approval.

- 2026-09-12 — Linked to `docs/art-direction.md`, the evolving art direction and animation strategy: read its tiers and bets at session start, name the tier in the brief, move a bet at session end. No animation cut.
- 2026-09-12 — `art/` split into `lumi/` (her sheets), `scenery/` (the rooms) and `archived/` (the earlier character, renamed `rali-*`); the cut and measure scripts, the README table and every doc path follow. No animation cut.
- 2026-09-12 — The lantern character: the ledger's third row; backlog #2 (preview) landed and the list renumbered; a pose-sheet row in the gates; stage 2 and 4 rewritten for the new sheet and the one-cell cut; the crop-before-measure note.
- 2026-09-12 — Created after the playful-foot work: baseline ledger (two animations), the gates as numbers, the seven-stage path, the first ranked backlog. Prompt template reconstructed from the recipe, not verbatim.

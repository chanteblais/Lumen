# art/

Lumi's source drawings — the sheets her sprites are cut from. Kept in the repo so the cut can be redone; never served.

| Sheet | What it is | Used by |
|---|---|---|
| `lumi-slow-idle.png` | Breath · blink · sway, one pose, 1–2px movements (the corner companion's idle) | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` rows 0–5 |
| `lumi-idle-foot.png` | The playful foot with a glance, 24 in-betweened frames of one drawing on a flat ground: row 1 rest then the head turning toward the kicking foot (frame 8 a stray rest frame), row 2 the kick with the head held turned (drawn ~3.5% smaller, scaled at the cut), row 3 rest frames (the turn back was not drawn; the loop replays the glance in reverse). Fifteen cells are cut; the play order lives in `LumiSprite` | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` rows 6–8 |
| `lumi-idle.png` | The playful foot without the glance, sixteen frames of one drawing — superseded by `lumi-idle-foot.png` | not cut any more |
| `lumi-playful-foot.png` | The first foot-tap, eight frames, each a fresh drawing — superseded by `lumi-idle.png` (too few in-betweens; the whole figure boiled) | not cut any more |
| `lumi-stretch.png` | A stretch — candidate for another rare idle moment | not cut yet |

The head expressions (`public/lumi-heads.png`) were cut from an earlier character sheet that is not kept; the cells are the source now. Rules for what a sheet may become: `docs/design-system.md` → Lumi sprites.

## Adding a sheet (what the playful foot taught us, 2026-09-12)

**Ask for in-betweens of one drawing, not poses.** A sheet where every frame is a fresh drawing never reads as motion, whatever the cut does: the hood, ribbon and folds boil, and the moving part covers its travel in one step. The prompt that worked (ChatGPT image generation, with `lumi-idle.png` or `lumi-idle-foot.png` attached as the motion/style reference and `lumi-slow-idle.png` as the pose reference):

- ONE base drawing; change only what moves in each phase. Name the phases and their frame ranges, and say which parts hold "pixel for pixel" during each.
- Twelve or more frames per motion, small even steps, "slow in, slow out"; frame 1 = the slow-idle rest pose; last frame = frame 1.
- A regular grid (2 or 3 rows of 8), same cell size, generous margins, the figure in the same place in every cell, feet on one baseline.
- A flat, untextured, contrasting ground (the grey-blue of the current sheets); no titles, labels, numbers or notes anywhere.
- Same style, line weight, palette, lighting and hood ornament as the reference; highest resolution, landscape.

**Measure before judging** — `python3 scripts/measure-lumi-sheet.py art/<sheet>.png` prints per-frame geometry, the eye position (a glance), the per-step head change (IoU) and the scale per row, and writes an aligned strip to flip through. What the generator gets wrong, and what the cut already fixes:

| Seen on every sheet so far | Fix, in `scripts/cut-lumi-idle.py` |
|---|---|
| A whole phase (row) drawn at a different scale (the kick row: −3.5%) | scale each row to the breath rest height (`figure_height`) |
| A phase not drawn (the turn back), a stray rest frame mid-row | play what exists, forward then in reverse; skip the stray — the order lives in `LumiSprite` → `LUMI_LOOP_CELLS`, the cells cut in `FOOT_CELLS` |
| The hood rim and its sun redrawn a little every frame (IoU ~0.98) | hold one frame's head across the phase (`hold_head`, blended in under the chin) |
| Frames a pixel off each other | `settle`: whole pixels on the head silhouette, then a quarter-pixel refinement |
| A cold shadow and a grey rim from the contrasting ground | `Sheet(..., contrast=True)`: shadow found by its blue cast and redrawn warm; edges de-matted against the ground |
| The eyes moved by a glance | blink eyes are composited aligned on the eyes, not the face |

**Then wire it:** a row in `LUMI_LOOP_CELLS` and `LUMI_LOOP_FRAMES` (LumiSprite), a duration in `FRAME_MS` and a name in `VARIATIONS` (LumiCompanion), a cue button appears in the dev strip on its own. Frame fades last 80% of the faster loop's frame time — a fade longer than the frame reads as blur. Judge the result on port 3005/3006 with the dev cue strip, not in the Claude-in-Chrome tab (Chrome freezes animation there).

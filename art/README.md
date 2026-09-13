# art/

Source art, never served. Four folders:

- `lumi/` — Lumi's source drawings, the sheets her sprites are cut from. Kept in the repo so the cut can be redone.
- `scenery/` — the painted rooms. `scenery/home-background.png` is the room behind Home (not a sheet — served as `public/home-room.webp`, 1536×1024 at quality 84; `docs/design-system.md` → Home: the room). Regenerate after a repaint with `python3 -c "from PIL import Image; Image.open('art/scenery/home-background.png').convert('RGB').save('public/home-room.webp','WEBP',quality=84,method=6)"` (repainted 2026-09-12 to give Lumi more floor to wander). `scenery/today-background.png` is the greenhouse behind Today (served as `public/today-room.webp`, 1536×1024 at quality 84; `docs/design-system.md` → Today: the garden) — the same command with `today-background` / `today-room`.
- `mockups/` — the page mockups the scenes are built toward (`home.png`, `today-mockup.png`); reference only, never served.
- `archived/` — the earlier character (Rali) and the scene mockups; nothing here is cut or served. The scripts still read `archived/rali-slow-idle.png` as the height reference (`scripts/measure-lumi-sheet.py` → `REF`).

| Sheet | What it is | Used by |
|---|---|---|
| `lumi/lumi-lantern-idle.png` | **The lantern character** (2026-09-12): sixteen cells in two rows of eight on a flat grey-blue ground — neutral, glances, lowered lids, a smile, the lantern raised. Sixteen *drawings*, not in-betweens (head IoU 0.83–0.96 per step), so only the rest cell (row 1, frame 1) is cut for the body, with a breath synthesised from it; six cells become the avatar heads (neutral 1 · blink 1 with the eyes shut · happy 6 · curious 11 · excited 12 · sleepy 7) | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` (breath, rows 0–2) and `public/lumi-heads.png` |
| `lumi/lumi-idle.png` | A byte-identical copy of `lumi-lantern-idle.png` | nothing — the cut reads `lumi-lantern-idle.png` |
| `lumi/lumi-ref.png`, `lumi/lumi.png` | Reference drawings of the lantern character (a scene and a portrait), for prompting | nothing — never cut |
| `archived/rali-slow-idle.png` | The earlier character: breath · blink · sway, one pose, 1–2px movements | retired with the character — only the height reference for `scripts/measure-lumi-sheet.py` |
| `archived/rali-idle-foot.png` | The earlier character: the playful foot with a glance, 24 in-betweened frames of one drawing (rest, the head turning toward the kicking foot, the kick with the head held) | retired with the character — not cut any more |
| `archived/rali-idle.png` | The earlier character: the playful foot without the glance — superseded by `rali-idle-foot.png` | not cut any more |
| `archived/rali-playful-foot.png` | The earlier character: the first foot-tap, eight frames, each a fresh drawing — superseded by `rali-idle.png` (too few in-betweens; the whole figure boiled) | not cut any more |
| `archived/rali-stretch.png` | The earlier character: a stretch | retired with the character — never cut |

Rules for what a sheet may become: `docs/design-system.md` → Lumi sprites. The process (gates, touch points, costs): `docs/animation-pipeline.md`.

## Adding a sheet (what the playful foot taught us, 2026-09-12)

**Ask for in-betweens of one drawing, not poses.** A sheet where every frame is a fresh drawing never reads as motion, whatever the cut does: the hood, ribbon and folds boil, and the moving part covers its travel in one step. The lantern sheet is such a sheet (a pose set with expressions), which is why its body is one cell plus a synthesised breath. The prompt that worked for the foot (ChatGPT image generation, with `lumi-lantern-idle.png` attached as the pose/style reference — frame 1 is the rest pose):

- ONE base drawing; change only what moves in each phase. Name the phases and their frame ranges, and say which parts hold "pixel for pixel" during each.
- Twelve or more frames per motion, small even steps, "slow in, slow out"; frame 1 = the rest pose; last frame = frame 1.
- A regular grid (2 or 3 rows of 8), same cell size, generous margins, the figure in the same place in every cell, feet on one baseline.
- A flat, untextured, contrasting ground (the grey-blue of the current sheets); no titles, labels, numbers or notes anywhere.
- Same style, line weight, palette, lighting, hood ornament and lantern as the reference; highest resolution, landscape.

**Measure before judging** — `python3 scripts/measure-lumi-sheet.py art/lumi/<sheet>.png` prints per-frame geometry, the eye position (a glance), the per-step head change (IoU) and the scale per row, and writes an aligned strip to flip through. Crop the sheet to its rows of cells first if it carries a title or notes (the lantern sheet does: rows at y 151–393 and 444–687). What the generator gets wrong, and what the cut already fixes:

| Seen on every sheet so far | Fix, in `scripts/cut-lumi-idle.py` |
|---|---|
| A whole phase (row) drawn at a different scale | scale each row to `FIGURE_H` (hood top to feet) |
| A phase not drawn, a stray rest frame mid-row | play what exists, forward then in reverse; skip the stray — the order lives in `LumiSprite` → `LUMI_LOOP_CELLS` |
| The hood rim and its sun redrawn a little every frame (IoU ~0.98) | hold one frame's head across the phase (the foot cut's `hold_head`, in git history) |
| Frames a pixel off each other | settle on the head silhouette to a quarter pixel (the foot cut's `settle`, in git history) |
| A cold shadow and a grey rim from the contrasting ground | shadow found by its blue cast and redrawn warm; edges de-matted against the ground |
| The lantern's light pooling on the ground | found by its warm cast, lifted off as a translucent warm glow (`GLOW_RGB`, `GLOW_MAX`) |
| No blink row | lids drawn down over her own eyes (`eyes_shut`: half-shut keeps the bottom half, shut a thin lens; the eye's halo on the face goes with the lid) |
| No in-betweens at all | the rest cell alone, stretched ≤ 2px at the hood top with the feet held, nine frames (`breathe`) |

**Then wire it:** a row in `LUMI_LOOP_CELLS` and `LUMI_LOOP_FRAMES` (LumiSprite), a duration in `FRAME_MS` and a name in `VARIATIONS` (LumiCompanion), a cue button appears in the dev strip on its own. Frame fades last 80% of the faster loop's frame time — a fade longer than the frame reads as blur. Look first with `python3 scripts/preview-lumi-loop.py` (a strip and a GIF of the loop as the page plays it), then on port 3005/3006 with the dev cue strip — never in the Claude-in-Chrome tab (Chrome freezes animation there).

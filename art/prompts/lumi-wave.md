# lumi-wave — the prompt, its versions and every run

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-wave.md`. The method is `docs/animation-pipeline.md` → *Prompt lab*: change one thing per version, say what and why, let the gates judge.

## Brief

- **Movement:** a small wave hello — her free right hand (on the viewer's left) comes out of the cloak, waves twice, goes back.
- **Moves:** the right arm and hand, and the cloak's edge where the arm lifts it. **Holds:** the hood, the face and eyes, the ribbon and medallions, the cloak, the boots, the lantern in her other hand.
- **Where it plays:** a reaction, not an idle — in answer to the user arriving (`docs/art-direction.md` §5, *Lumi moves in answer*; backlog #6 decides the trigger). Tier 3, a drawn loop: a rare signature gesture.
- **Frames:** 24 — rest 2 · arm up 6 · two waves 8 · arm down 6 · rest 2. ~120 ms a frame (a quick gesture), ~3 s.
- **Starts and ends:** on the rest cell.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1776x896
- quality: high
- n: 2
- grid: 3x8
- reference: art/lumi/lumi-lantern-idle.png crop=15,135,250,405 scale=2

The reference is the lantern sheet's rest cell (frame 1) alone, on its own ground: no titles, numbers or the fifteen other poses for the generator to copy.

## Prompt (v1)

```text
Draw an animation sprite sheet of the character in the attached image: one base drawing, copied from the attachment, and in every frame only her right arm (on the viewer's left) moves. The hood with its sun embroidery, the black face and both glowing eyes, the ribbon with its brass medallions, the cloak and its folds, the boots, and the lantern in her other hand stay exactly the same, pixel for pixel, in every frame.

Phases, in frame order:
  frames 1–2: the rest pose, exactly as the attached image.
  frames 3–8: her right hand, the small dark hand by the cloak's hem on the viewer's left, rises to beside the hood, elbow bent, the arm coming out from under the cloak; the cloak's edge lifts a little with the arm.
  frames 9–16: two small waves — the raised hand swings outward and back twice, from the wrist and forearm, in small even steps.
  frames 17–22: the arm lowers back inside the cloak along the same path.
  frames 23–24: the rest pose again, identical to frame 1.
24 frames in total, small even steps, slow in and slow out. Frame 1 is the attached pose; the last frame equals frame 1.

Layout: a regular grid of 3 rows × 8 columns, every cell the same size, generous margins, the figure in the same place in every cell, feet on one baseline.
Ground: flat, untextured grey-blue, the same as the attached image. No titles, labels, frame numbers, arrows or notes anywhere.
Same style, line weight, palette and lighting as the attachment: the sun-embroidered hood, the ribbon with brass medallions, the boots and the lit lantern. No scarf.
```

## What changed, version to version

- **v1** — the pipeline template filled for a wave, with the rest cell alone as the reference. Run on both 2.5 models (sunburst: edit precision; flare: faster) to pick the model before tuning words.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 00:24 | v1 | gpt-image-2.5-flare · high · 1776x896 | `v1-2.5-flare-0913-002433-1.png` | 24 in 3 rows / 24 | 2578 / 2069 (run) | $0.04 | **fail · phase missing:** head holds (IoU ≥ 0.978), but the rise is one step (hem → chest, 2→3) and the fall one step (18→19), then six rest frames |
| 2026-09-13 00:24 | v1 | gpt-image-2.5-flare · high · 1776x896 | `v1-2.5-flare-0913-002433-2.png` | 24 in 3 rows / 24 | 2578 / 2069 (run) | $0.04 | **fail · lantern moves:** hangs lower in row 1 than rows 2–3; last→first IoU 0.921 |
| 2026-09-13 00:24 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-002431-1.png` | 24 in 3 rows / 24 | 2578 / 2069 (run) | $0.04 | **pass** — heights 254–257, rows within 1%, head IoU 0.986–0.997 every step, last→first 0.977; rise 3–8 and fall 17–22 drawn as asked. Watch: the eyes sit ~4px higher through the waves (dy 55.5 → 51 → 56); a `hold_head` in the cut removes it if it shows. **Sent to Chanté for approval.** |
| 2026-09-13 00:24 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-002431-2.png` | 24 in 3 rows / 24 | 2578 / 2069 (run) | $0.04 | **fail · wrong gesture:** a raised fist, not a wave; 8→9 IoU 0.975 on the line |

Both runs reported identical usage (2578 in / 2069 out for two images), which looks too low for two 1776×896 images at high quality — check the real spend on OpenAI's usage page before trusting the cost column.

# lumi-free-wave — the wave, holding nothing

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-free-wave.md`. A copy of `art/prompts/lumi-wave.md` v1 (passed on the first run) with the hub as the reference; the plan is `docs/art-direction.md` §4a step 4.

## Brief

- **Movement:** the arrival wave, as shipped, without the lantern: her right hand (on the viewer's left) rises beside the hood, waves twice, lowers. Her other hand stays empty at her side.
- **Moves:** the right arm and hand, and the cloak's edge where the arm lifts it. **Holds:** everything else, including the empty left hand.
- **Where it plays:** the arrival reaction (`REACTIONS`), replacing the lantern wave if the hands-free Lumi is taken. Tier 3.
- **Frames:** 24 — rest 2 · up 6 · two waves 8 · down 6 · rest 2. 120 ms a frame.
- **Starts and ends:** on the hub.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1776x896
- quality: high
- n: 2
- grid: 3x8
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6

## Prompt (v1)

```text
Draw an animation sprite sheet of the character in the attached image: one base drawing, copied from the attachment, and in every frame only her right arm (on the viewer's left) moves. The hood with its sun embroidery, the black face and both glowing eyes, the ribbon bow with its brass medallions, the cloak and its folds, the boots, and her other hand, empty at her side, stay exactly the same, pixel for pixel, in every frame.

Phases, in frame order:
  frames 1–2: the rest pose, exactly as the attached image.
  frames 3–8: her right hand, the small dark hand by the cloak's hem on the viewer's left, rises to beside the hood, elbow bent, the arm coming out from under the cloak; the cloak's edge lifts a little with the arm.
  frames 9–16: two small waves — the raised hand, an open palm facing the viewer, swings outward and back twice, from the wrist and forearm, in small even steps.
  frames 17–22: the arm lowers back inside the cloak along the same path.
  frames 23–24: the rest pose again, identical to frame 1.
24 frames in total, small even steps, slow in and slow out. Frame 1 is the attached pose; the last frame equals frame 1.

Layout: a regular grid of 3 rows × 8 columns, every cell the same size, generous margins, the figure in the same place in every cell, feet on one baseline.
Ground: flat, untextured grey-blue, the same as the attached image. No titles, labels, frame numbers, arrows or notes anywhere.
Same style, line weight, palette and lighting as the attachment. She holds nothing. No lantern, no scarf.
```

## What changed, version to version

- **v1** — `lumi-wave.md` v1 with the hub as the reference, the lantern replaced by the empty hand, and *an open palm facing the viewer* (the Prompt lab finding: one wave candidate drew a fist).

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 05:26 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-052657-1.png` | 24 in 3 rows / 24 | 2252 / 2069 (run) | $0.04 | **pass** — 24/24, heights 266–267, rows equal, head IoU 0.988–0.997 every step, last→first 0.990; rise 3–8, two waves 9–16 with an open palm, fall 17–22, rest 23–24. Eyes dx −26 → −22 through the waves is the raised hand entering the measured head region, not a glance → `art/lumi/lumi-free-wave.png` |
| 2026-09-13 05:26 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-052657-2.png` | 24 in 3 rows / 24 | 2252 / 2069 (run) | $0.04 | fail · ruled lines and cropped: lines between the cells, and the last column cut off at the sheet's edge (IoU 0.52 at every row's end) |

# lumi-free-idle — hands together, holding nothing

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-free-idle.md`. The method is `docs/animation-pipeline.md` → *Prompt lab*; the plan it belongs to is `docs/art-direction.md` §4a step 4.

## Brief

- **Movement:** her empty hands come together in front of her, rest there a moment, and go back to her sides. Quiet: an idle variation, below what pulls the eye (§5 *Presence, not performance*).
- **Moves:** both hands, and the cloak's front edges just above them. **Holds:** the hood, the face and eyes, the bow and medallions, the rest of the cloak, the boots.
- **Where it plays:** an idle variation (`VARIATIONS`), now and then between breaths. Tier 3, a path from the hub to a pose (hands together) and back.
- **Frames:** 16 — rest 1 · together 2–7 · held 8–10 · apart 11–15 · rest 16. A slow gesture: ~200 ms a frame, ~3 s.
- **Starts and ends:** on the hub.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1776x608
- quality: high
- n: 2
- grid: 2x8
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6

## Prompt (v1)

```text
Draw an animation sprite sheet of the character in the attached image: one base drawing, copied from the attachment, and in every frame only her two small dark hands and the front edges of the cloak just above them move. The hood with its sun embroidery, the black face and both glowing eyes, the ribbon bow with its brass medallions, the rest of the cloak and its folds, and the boots stay exactly the same, pixel for pixel, in every frame. She holds nothing.

Phases, in frame order:
  frame 1: the rest pose, exactly as the attached image, both hands empty at her sides.
  frames 2–7: both hands move in toward the middle of her body and meet in front of her, just below the medallions, fingers loosely laced; the cloak's front edges part a little over the arms.
  frames 8–10: the hands stay together, still.
  frames 11–15: the hands part and go back to her sides along the same path.
  frame 16: the rest pose again, identical to frame 1.
16 frames in total, small even steps, slow in and slow out. Frame 1 is the attached pose; the last frame equals frame 1.

Layout: a regular grid of 2 rows × 8 columns, every cell the same size, generous margins, the figure in the same place and at the same size in every cell, feet on one baseline.
Ground: flat, untextured grey-blue, the same as the attached image. No titles, labels, frame numbers, arrows or notes anywhere.
Same style, line weight, palette and lighting as the attachment. No lantern, no scarf.
```

## What changed, version to version

- **v1** — the wave's v1 structure with the hub as the reference; both hands move, so both sides are named.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 05:26 | v1 | gpt-image-2.5-sunburst · high · 1776x608 | `v1-2.5-sunburst-0913-052630-1.png` | 16 in 2 rows / 16 | 2202 / 1183 (run) | $0.03 | **pass** — 16/16, heights 270–271 (spread 0.4%), rows equal (0.641 / 0.638), head IoU 0.988–0.998 every step, last→first 0.984, eyes steady (dx −27.2 to −28.3); the phases as asked: the hands meet 2–7, held 8–10, apart 11–15 → `art/lumi/lumi-free-idle.png` |
| 2026-09-13 05:26 | v1 | gpt-image-2.5-sunburst · high · 1776x608 | `v1-2.5-sunburst-0913-052630-2.png` | 8 in 1 rows / 16 | 2202 / 1183 (run) | $0.03 | fail · ruled lines: lines drawn between the cells, so the measure read each row as one figure; by eye as good as 1 |

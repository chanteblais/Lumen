# lumi-free-rest — the hub: Lumi standing, holding nothing

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-free-rest.md`. The method is `docs/animation-pipeline.md` → *Prompt lab*; why this drawing is first is `docs/art-direction.md` §4a.

## Brief

- **What:** one drawing, not a loop — the rest pose of the wave sheet with the lantern gone and both hands empty. It becomes the hub every hands-free pose and path is drawn from, and the reference for the model sheet.
- **Changes:** the lantern and the hand holding it; her other hand to match. **Holds:** the hood and its sun, the face and eyes, the ribbon and medallions, the cloak, the boots, the size, the place on the ground.
- **Tier:** the source drawing for tiers 1–3.
- **Pass:** one figure found, the same height as the wave's first cell (±3%), no lantern and no light pool on the ground, the costume counted (sun on the hood, the bow, the medallions, the boots), both hands empty and alike.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 768x1024
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-wave.png crop=15,10,235,300 scale=2

The reference is the wave sheet's first cell, the drawing the companion's body is cut from today.

## Prompt (v1)

```text
Redraw the character in the attached image as one standing figure: the same pose, the same size, centred, on the same flat untextured grey-blue ground.

One change only: she carries nothing. The lantern is gone, and so is the warm light it cast on the ground. Both of her small dark hands hang relaxed and empty at her sides, just showing below the front edges of the cloak, mirror images of each other.

Everything else stays exactly as in the attachment: the hood with its sun embroidery, the black face and both glowing oval eyes looking straight ahead, the ribbon bow with its brass medallions, the cloak and every fold, the boots, the soft shadow under her feet.

Same style, line weight, palette and lighting. No scarf. No titles, labels, numbers or notes anywhere.
```

## What changed, version to version

- **v1** — first try: the wave's first cell as the only reference, one change named (no lantern, hands empty and mirrored).

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 05:21 | v1 | gpt-image-2.5-sunburst · high · 768x1024 | `v1-2.5-sunburst-0913-052136-1.png` | 1 in 1 rows / 1 | 3928 / 4815 (run) | $0.04 | **pass, chosen** — height 889 (drawn 3.5× the wave's cell, fine: the cut scales down), no lantern and no light pool, hands empty and mirrored, the costume counted (sun, bow, four medallions, boots); least dirt of the four (2 px). A little flatter in render than the wave sheet (the reference was upscaled 2×) → `art/lumi/lumi-free-rest.png` |
| 2026-09-13 05:21 | v1 | gpt-image-2.5-sunburst · high · 768x1024 | `v1-2.5-sunburst-0913-052136-2.png` | 1 in 1 rows / 1 | 3928 / 4815 (run) | $0.04 | pass — near-identical to 1 |
| 2026-09-13 05:21 | v1 | gpt-image-2.5-sunburst · high · 768x1024 | `v1-2.5-sunburst-0913-052136-3.png` | 1 in 1 rows / 1 | 3928 / 4815 (run) | $0.04 | pass — near-identical to 1, more dirt (16 px) |
| 2026-09-13 05:21 | v1 | gpt-image-2.5-sunburst · high · 768x1024 | `v1-2.5-sunburst-0913-052136-4.png` | 1 in 1 rows / 1 | 3928 / 4815 (run) | $0.04 | pass — near-identical to 1, hands a little smaller |

All four candidates came back almost the same drawing: with one change named and one reference, the generator varies very little.

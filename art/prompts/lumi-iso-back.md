# lumi-iso-back — the hands-free Lumi at the rooms' angle, turned away

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-back.md`. The second drawing for the walk test (`art/prototypes/lumi-walk/`): she walks away up and to the right in it; mirrored, up and to the left.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, turned three-quarters away from the viewer toward the upper right — the back of the hood, no face.
- **For the rig:** both boot heels visible below the hem and a little apart; the hands' tips visible at the cloak's sides; nothing overlapping her.
- **Reference:** the hub (the character) and the model sheet's last isometric facing (the angle, from behind).

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 3
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-model-sheet.png crop=1490,680,1830,1180

## Prompt (v1)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above and from behind at the angle of the second attached image: an isometric room's angle, her body turned three-quarters away from the viewer, toward the upper right. We see the back of her hood and cloak, not her face.

She is exactly the character in the first image: the big peaked cream hood with its orange sun embroidery and orange seams, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

The heels of both brown boots are clearly visible below the hem of the cloak, a little apart. The tips of both small dark hands show at the sides of the cloak. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — first back facing for the walk test: the hub for the character, the model sheet's last isometric facing for the angle; heels apart so the rig can cut them.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074309-1.png` | 1 in 1 rows / 1 | 5055 / 4116 (run) | $0.05 | usable but not chosen · the hood's point leans further over than the front drawing's. All three face the upper *left*, not the right the prompt asked for; the rig mirrors, so either works |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074309-2.png` | 1 in 1 rows / 1 | 5055 / 4116 (run) | $0.05 | usable but not chosen · a narrower hood than the front drawing's |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074309-3.png` | 1 in 1 rows / 1 | 5055 / 4116 (run) | $0.05 | **chosen** → `art/lumi/lumi-iso-back.png` · turned away toward the upper left, the hood's lining showing on the left; two hands at the cloak's sides; heels apart |

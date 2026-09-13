# lumi-iso-back — the hands-free Lumi at the rooms' angle, turned away

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-back.md`. The second drawing for the walk test (`art/prototypes/lumi-walk/`): she walks away up and to the right in it; mirrored, up and to the left.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, turned three-quarters away from the viewer toward the upper right — the back of the hood, no face.
- **For the rig:** both boot heels visible below the hem and a little apart; the hands' tips visible at the cloak's sides; nothing overlapping her.
- **Reference:** the hub (the character) and the model sheet's last isometric facing (the angle, from behind).

## Settings

- version: v2
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-iso-n.png scale=0.5
- reference: art/lumi/lumi-iso-w.png scale=0.5

## Prompt (v2)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above and from behind at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). The second image shows her facing straight away from the viewer; the third shows her side-on, facing the viewer's left. Draw her turned exactly halfway between those two: a 45-degree three-quarter back view, facing away from the viewer toward the upper left. We see the back of her hood and cloak and her right side about equally, not her face: the warm lining of the hood's opening shows as a thin edge along the left side of the hood, and the big sun embroidered on the back of the hood sits clearly right of the hood's centre.

She is exactly the character in the first image: the big peaked cream hood with its orange sun embroidery and orange seams, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

The heels of both brown boots are clearly visible below the hem of the cloak, a little apart, side by side along a line running from the lower left to the upper right. The tips of both small dark hands show at the sides of the cloak. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — first back facing for the walk test: the hub for the character, the model sheet's last isometric facing for the angle; heels apart so the rig can cut them.
- **v2** — one change: turned further, to a true 45° toward the upper left. The back of the hood's sun marks the turn (it slides the other way from the face); v1's chosen drawing measured ~17°, so walking the room's diagonal away from the viewer she looked sideways. The facing-away and side-on drawings are attached as the two ends; the gate is 38–52° measured.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074309-1.png` | 1 in 1 rows / 1 | 5055 / 4116 (run) | $0.05 | usable but not chosen · the hood's point leans further over than the front drawing's. All three face the upper *left*, not the right the prompt asked for; the rig mirrors, so either works |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074309-2.png` | 1 in 1 rows / 1 | 5055 / 4116 (run) | $0.05 | usable but not chosen · a narrower hood than the front drawing's |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074309-3.png` | 1 in 1 rows / 1 | 5055 / 4116 (run) | $0.05 | **chosen** → `art/lumi/lumi-iso-back.png` · turned away toward the upper left, the hood's lining showing on the left; two hands at the cloak's sides; heels apart |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085614-1.png` | 1 in 1 rows / 1 | 10028 / 5488 (run) | $0.06 | not chosen · turned too far, nearly side-on (the inside of the hood shows). The back's sun is no measure for these: it read 16–23° on all four while by eye they are turned 45° or more, because the hood's open front widens its silhouette. Judged by eye in a strip between the facing-away and side-on drawings |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085614-2.png` | 1 in 1 rows / 1 | 10028 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-back.png` (replaces v1) · halfway between facing away and side-on: the hood's lining a thin edge along the left, the sun just right of centre; hands' tips, heels apart |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085614-3.png` | 1 in 1 rows / 1 | 10028 / 5488 (run) | $0.06 | not chosen · past halfway, the lining broad |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085614-4.png` | 1 in 1 rows / 1 | 10028 / 5488 (run) | $0.06 | not chosen · a little past halfway |

# lumi-iso-wnw — the hands-free Lumi at the rooms' angle, turned mostly to the left, a little away from the viewer

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-wnw.md`. One of the walk test's sixteen facings (`art/prototypes/lumi-walk/`): a drawing she turns through, halfway between side-on (w) and the back diagonal (nw), turned 67.5° from facing away. Mirrored, the same turn to the right.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, turned mostly toward the viewer's left and a little away from the viewer — 67.5° from facing away.
- **Why:** smoother turns (Chanté, 2026-09-13): each change of drawing 22.5° instead of 45°.
- **Gate:** no face to measure on a view from behind; judged by eye in a strip between the two drawings it sits between.
- **Reference:** the hub, and the two drawings it sits between.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-iso-w.png scale=0.5
- reference: art/lumi/lumi-iso-back.png scale=0.5

## Prompt (v1)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). The second image shows her side-on, facing the viewer's left; the third shows her three-quarters away from the viewer, toward the upper left. Draw her turned exactly halfway between those two: turned mostly to the viewer's left, a little away from the viewer. We see the side of her hood and its opening edge-on along the left, with only a sliver of the black inside and no eyes showing, and more of her back than in the side-on drawing.

She is exactly the character in the attached images: the big peaked cream hood with its orange sun embroidery and orange seams, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

Both brown boots are clearly visible below the hem of the cloak, a little apart. The small dark hands show at the sides of the cloak. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — an in-between facing for smoother turns, "exactly halfway between" the two attached drawings.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-1.png` | 1 in 1 rows / 1 | 9860 / 5488 (run) | $0.06 | usable but not chosen · much like 2, the hood's dark inside a little less visible (judged by eye in a strip between side-on and the back diagonal) |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-2.png` | 1 in 1 rows / 1 | 9860 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-wnw.png` · between the two ends: a sliver of the hood's dark inside shows along its left edge (the back diagonal shows only lining, side-on shows the face) |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-3.png` | 1 in 1 rows / 1 | 9860 / 5488 (run) | $0.06 | not chosen · hardly different from the back diagonal |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-4.png` | 1 in 1 rows / 1 | 9860 / 5488 (run) | $0.06 | not chosen · hardly different from the back diagonal |

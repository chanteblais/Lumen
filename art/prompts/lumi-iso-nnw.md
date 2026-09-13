# lumi-iso-nnw — the hands-free Lumi at the rooms' angle, facing away and a little to the left

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-nnw.md`. One of the walk test's sixteen facings (`art/prototypes/lumi-walk/`): a drawing she turns through, halfway between the back diagonal (nw) and facing straight away (n), turned 22.5° from facing away. Mirrored, the same turn to the right.

## Brief

- **What:** Lumi standing, seen from above and behind at an isometric room's angle, facing away and turned a little toward the viewer's left — 22.5°.
- **Why:** smoother turns (Chanté, 2026-09-13): each change of drawing 22.5° instead of 45°.
- **Gate:** judged by eye in a strip between the two drawings it sits between.
- **Reference:** the hub, and the two drawings it sits between.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-iso-back.png scale=0.5
- reference: art/lumi/lumi-iso-n.png scale=0.5

## Prompt (v1)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above and from behind at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). The second image shows her three-quarters away from the viewer, toward the upper left; the third shows her facing straight away. Draw her turned exactly halfway between those two: facing away and a little to the viewer's left. We see the back of her hood and cloak; the hood's warm lining shows only as the thinnest edge along its left side, and the big sun on the back of the hood sits just right of the hood's centre.

She is exactly the character in the attached images: the big peaked cream hood with its orange sun embroidery and orange seams, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

The heels of both brown boots are clearly visible below the hem of the cloak, side by side and a little apart. The tips of both small dark hands show at the sides of the cloak. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — an in-between facing for smoother turns, "exactly halfway between" the two attached drawings.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-1.png` | 1 in 1 rows / 1 | 9896 / 5488 (run) | $0.06 | not chosen · hardly different from the back diagonal (judged by eye in a strip between the back diagonal and facing straight away) |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-2.png` | 1 in 1 rows / 1 | 9896 / 5488 (run) | $0.06 | not chosen · as 1 |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-3.png` | 1 in 1 rows / 1 | 9896 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-nnw.png` · the one between: a nearly straight back view, a hint of lining at the hood's top left, the sun just right of centre |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091509-4.png` | 1 in 1 rows / 1 | 9896 / 5488 (run) | $0.06 | not chosen · as 1 |

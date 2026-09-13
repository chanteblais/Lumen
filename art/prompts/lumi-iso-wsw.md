# lumi-iso-wsw — the hands-free Lumi at the rooms' angle, turned mostly to the left, still a little toward the viewer

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-wsw.md`. One of the walk test's sixteen facings (`art/prototypes/lumi-walk/`): a drawing she turns through, halfway between the front diagonal (sw) and side-on (w), turned 67.5° from facing the viewer. Mirrored, the same turn to the right.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, turned mostly toward the viewer's left and still a little toward the viewer — 67.5°.
- **Why:** smoother turns (Chanté, 2026-09-13): each change of drawing 22.5° instead of 45°.
- **Gate:** `prototypes/lumi-walk/facings.py --candidates art/candidates/lumi-iso-wsw --target 67.5` (60–75°).
- **Reference:** the hub, and the two drawings it sits between.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-iso-front.png scale=0.5
- reference: art/lumi/lumi-iso-w.png scale=0.5

## Prompt (v1)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). The second image shows her three-quarters toward the viewer's lower left; the third shows her side-on, facing the viewer's left. Draw her turned exactly halfway between those two: turned mostly to the viewer's left, still a little toward the viewer. Her black face sits near the left edge of the hood's opening with both glowing eyes still showing, the nearer one larger; the ribbon bow and its brass medallions sit near the left edge of her chest.

She is exactly the character in the attached images: the big peaked cream hood with its orange sun embroidery and orange trim, the black face with warm glowing eyes, the brown ribbon bow with its brass medallions, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

Both brown boots are clearly visible below the hem of the cloak, a little apart. Both small dark hands are visible at the sides of the cloak, empty and relaxed. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — an in-between facing for smoother turns, "exactly halfway between" the two attached drawings.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091508-1.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | fail · face turned 57.7° (target 67.5° ± 7.5°) |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091508-2.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | fail · 54.5° |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091508-3.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-wsw.png` · pass (62.6°); in a strip between the front diagonal and side-on it sits between: face near the hood's left edge, both eyes showing, the nearer larger |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091508-4.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | pass (61.3°) but not chosen · much like 3 |

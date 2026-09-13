# lumi-iso-front — the hands-free Lumi at the rooms' angle, turned toward the viewer

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-front.md`. One drawing for the walk test (`art/prototypes/lumi-walk/`): the rig moves it, so it is a pose to be cut into pieces, not a sheet of frames. Mirrored, it faces the other way.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, turned three-quarters toward the viewer's lower left — the direction she walks when she comes down and left across a room.
- **For the rig:** both boots clearly visible below the hem and a little apart, so each can be cut out and stepped; both small dark hands visible at the cloak's sides; nothing overlapping her.
- **Reference:** the hub (the character) and the model sheet's first isometric facing (the angle).

## Settings

- version: v2
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-iso-s.png scale=0.5
- reference: art/lumi/lumi-iso-w.png scale=0.5

## Prompt (v2)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). The second image shows her facing straight toward the viewer; the third shows her side-on, facing the viewer's left. Draw her turned exactly halfway between those two: a 45-degree three-quarter view, facing toward the viewer's lower left. Her black face and both glowing eyes sit in the left half of the hood's opening, so the right side of the hood fills much of her head; the ribbon bow and its three brass medallions sit on the left part of her chest; we see her front and her right side about equally.

She is exactly the character in the first image: the big peaked cream hood with its orange sun embroidery and orange trim, the black face with two warm glowing eyes, the brown ribbon bow with its three brass medallions, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

Both brown boots are clearly visible below the hem of the cloak, a little apart, side by side along a line running from the upper left to the lower right. Both small dark hands are visible at the sides of the cloak, empty and relaxed. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — first facing for the walk test: the hub for the character, the model sheet's isometric facing for the angle; boots apart and hands visible so the rig can cut them.
- **v2** — one change: turned further, to a true 45°. Marking the face (`prototypes/lumi-walk/facings.py`) measured v1's chosen drawing turned only ~29° from facing the viewer, so walking the room's diagonal she looked sideways (Chanté: "she's still not always walking forward"). The facing-you and side-on drawings are attached so "halfway between" has two drawn ends; the gate is 38–52° measured.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074308-1.png` | 1 in 1 rows / 1 | 5208 / 4116 (run) | $0.05 | usable (by eye: the costume, two hands, two boots) but not chosen · the boots sit closer together than in 2 |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074308-2.png` | 1 in 1 rows / 1 | 5208 / 4116 (run) | $0.05 | **chosen** → `art/lumi/lumi-iso-front.png` · turned toward the lower left, the hood's sun, three medallions and stars as the hub; two hands (one below the medallions, one at the hem); boots clearly apart |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074308-3.png` | 1 in 1 rows / 1 | 5208 / 4116 (run) | $0.05 | usable but not chosen · much like 2 |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085613-1.png` | 1 in 1 rows / 1 | 10080 / 5488 (run) | $0.06 | pass (face turned 40.6°, gate 38–52°) but not chosen · further from 45° than 2 and 4. For comparison, v1's three measured 25.6°, 28.2° (the one chosen then) and 26.9° |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085613-2.png` | 1 in 1 rows / 1 | 10080 / 5488 (run) | $0.06 | pass (46.1°) but not chosen · much like 4 |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085613-3.png` | 1 in 1 rows / 1 | 10080 / 5488 (run) | $0.06 | pass (41.0°) but not chosen |
| 2026-09-13 08:56 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-085613-4.png` | 1 in 1 rows / 1 | 10080 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-front.png` (replaces v1) · face turned 45.5°, and by eye halfway between the facing-you and side-on drawings; two hands, boots side by side; cuts cleanly with no keep box |

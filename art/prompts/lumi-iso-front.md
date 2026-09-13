# lumi-iso-front — the hands-free Lumi at the rooms' angle, turned toward the viewer

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-front.md`. One drawing for the walk test (`art/prototypes/lumi-walk/`): the rig moves it, so it is a pose to be cut into pieces, not a sheet of frames. Mirrored, it faces the other way.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, turned three-quarters toward the viewer's lower left — the direction she walks when she comes down and left across a room.
- **For the rig:** both boots clearly visible below the hem and a little apart, so each can be cut out and stepped; both small dark hands visible at the cloak's sides; nothing overlapping her.
- **Reference:** the hub (the character) and the model sheet's first isometric facing (the angle).

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 3
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-model-sheet.png crop=70,680,430,1180

## Prompt (v1)

```text
Draw the character from the first attached image as one full-body figure, standing still, seen from above at the angle of the second attached image: an isometric room's angle, her body turned three-quarters toward the viewer's lower left, her face and both glowing eyes turned the same way.

She is exactly the character in the first image: the big peaked cream hood with its orange sun embroidery and orange trim, the black face with two warm glowing eyes, the brown ribbon bow with its three brass medallions, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

Both brown boots are clearly visible below the hem of the cloak, a little apart, the one nearer the viewer slightly ahead. Both small dark hands are visible at the sides of the cloak, empty and relaxed. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — first facing for the walk test: the hub for the character, the model sheet's isometric facing for the angle; boots apart and hands visible so the rig can cut them.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074308-1.png` | 1 in 1 rows / 1 | 5208 / 4116 (run) | $0.05 | usable (by eye: the costume, two hands, two boots) but not chosen · the boots sit closer together than in 2 |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074308-2.png` | 1 in 1 rows / 1 | 5208 / 4116 (run) | $0.05 | **chosen** → `art/lumi/lumi-iso-front.png` · turned toward the lower left, the hood's sun, three medallions and stars as the hub; two hands (one below the medallions, one at the hem); boots clearly apart |
| 2026-09-13 07:43 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-074308-3.png` | 1 in 1 rows / 1 | 5208 / 4116 (run) | $0.05 | usable but not chosen · much like 2 |

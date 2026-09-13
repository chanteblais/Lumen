# lumi-iso-s — the hands-free Lumi at the rooms' angle, facing straight toward the viewer

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-s.md`. One of the walk test's eight facings (`art/prototypes/lumi-walk/`): she walks straight down the page in it, and passes through it when she turns from the lower left to the lower right.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, facing straight toward the viewer (down the page).
- **For the rig:** both boots visible below the hem side by side and a little apart; both hands visible at the sides; nothing overlapping her.
- **Reference:** the hub (the character) and the two isometric drawings already in the walk test (the angle, the size, the proportions), so the new facing turns the same figure.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 3
- grid: 1x1
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6
- reference: art/lumi/lumi-iso-front.png scale=0.5
- reference: art/lumi/lumi-iso-back.png scale=0.5

## Prompt (v1)

```text
Draw the character from the attached images as one full-body figure, standing still, seen from above at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). This time she faces straight toward the viewer, down the page: the opening of the hood, her black face and both glowing eyes are centred, and the ribbon bow with its three brass medallions is centred on her chest.

She is exactly the same character: the big peaked cream hood with its orange sun embroidery and orange trim, the black face with two warm glowing eyes, the brown ribbon bow with its three brass medallions, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

Both brown boots are clearly visible below the hem of the cloak, side by side and a little apart. Both small dark hands are visible at the sides of the cloak, empty and relaxed. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — the first in-between facing: the hub, and both walk-test drawings for the angle and size, so the turn from lower left to lower right has a drawing to pass through.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081952-1.png` | 1 in 1 rows / 1 | 7320 / 4116 (run) | $0.06 | usable (by eye: the costume, two hands, two boots) but not chosen · the hood a touch wider than the walk test's other drawings |
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081952-2.png` | 1 in 1 rows / 1 | 7320 / 4116 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-s.png` · facing straight toward the viewer, face and bow centred, three medallions; both hands at the sides; boots apart |
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081952-3.png` | 1 in 1 rows / 1 | 7320 / 4116 (run) | $0.06 | usable but not chosen · much like 2 |

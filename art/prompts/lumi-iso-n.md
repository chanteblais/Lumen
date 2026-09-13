# lumi-iso-n — the hands-free Lumi at the rooms' angle, facing straight away

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-n.md`. One of the walk test's eight facings (`art/prototypes/lumi-walk/`): she walks straight up the page in it, and passes through it when she turns from the upper left to the upper right.

## Brief

- **What:** Lumi standing, seen from above and behind at an isometric room's angle, facing straight away from the viewer (up the page).
- **For the rig:** the heels of both boots visible below the hem, side by side and a little apart; the tips of both hands at the cloak's sides; nothing overlapping her.
- **Reference:** the hub and the two isometric drawings already in the walk test (the angle, the size, the proportions).

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
Draw the character from the attached images as one full-body figure, standing still, seen from above and from behind at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). This time she faces straight away from the viewer, up the page: the back of her hood is centred, with its sun embroidery and seams, and we do not see her face.

She is exactly the same character: the big peaked cream hood with its orange sun embroidery and orange seams, the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

The heels of both brown boots are clearly visible below the hem of the cloak, side by side and a little apart. The tips of both small dark hands show at the sides of the cloak. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — the facing straight away: the hub, and both walk-test drawings for the angle and size, so the turn from upper left to upper right has a drawing to pass through.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081954-1.png` | 1 in 1 rows / 1 | 7242 / 4116 (run) | $0.06 | usable but not chosen · the hood rounder than the walk test's back drawing |
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081954-2.png` | 1 in 1 rows / 1 | 7242 / 4116 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-n.png` · facing straight away, the hood's back centred with its sun and seams; both hands' tips; heels apart |
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081954-3.png` | 1 in 1 rows / 1 | 7242 / 4116 (run) | $0.06 | usable but not chosen · much like 2 |

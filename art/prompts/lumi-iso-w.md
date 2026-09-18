# lumi-iso-w — the hands-free Lumi at the rooms' angle, side-on, facing the viewer's left

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-w.md`. One of the walk test's eight facings (`art/prototypes/lumi-walk/`): she walks straight left across the page in it (mirrored, right), and passes through it when she turns between the lower left and the upper left.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, in profile, facing the viewer's left.
- **For the rig:** both boots visible below the hem, one a little ahead (to the left) of the other; the near hand visible; nothing overlapping her.
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
Draw the character from the attached images as one full-body figure, standing still, seen from above at exactly the same angle, size and proportions as the second and third attached images (an isometric room's angle). This time she is turned side-on, in profile, facing the viewer's left: we see the side of her hood with its point behind her, the edge of the hood's opening on the left with a sliver of her black face and one glowing eye showing inside it, and the side of her cloak.

She is exactly the same character: the big peaked cream hood with its orange sun embroidery and orange trim, the black face with warm glowing eyes, the brown ribbon and brass medallions (only their edge shows from the side), the cream cloak with orange stars and trim, two small dark hands, two brown boots. No lantern, no scarf, nothing in her hands.

Both brown boots are clearly visible below the hem of the cloak, one a little ahead of the other toward the left. Her near small dark hand is visible at the side of the cloak, empty and relaxed. Nothing overlaps her.

One figure only, centred, filling most of the height, on a flat, untextured grey-blue ground like the attached images. No shadow on the ground, no floor, no titles, labels or notes. Same style, line weight, palette and soft lighting as the attached images.
```

## What changed, version to version

- **v1** — the side facing: the hub, and both walk-test drawings for the angle and size, so the turn from lower left to upper left has a drawing to pass through.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081953-1.png` | 1 in 1 rows / 1 | 7395 / 4116 (run) | $0.06 | usable but not chosen · the boots close together |
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081953-2.png` | 1 in 1 rows / 1 | 7395 / 4116 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-w.png` · side-on facing the viewer's left, one eye in the hood's opening, the medallions' edge; the near hand; one boot a step ahead |
| 2026-09-13 08:19 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-081953-3.png` | 1 in 1 rows / 1 | 7395 / 4116 (run) | $0.06 | usable but not chosen · much like 2 |

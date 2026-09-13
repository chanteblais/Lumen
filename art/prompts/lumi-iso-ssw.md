# lumi-iso-ssw — the hands-free Lumi at the rooms' angle, facing the viewer and a little to the left

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-ssw.md`. One of the walk test's sixteen facings (`art/prototypes/lumi-walk/`): not a walking direction, a drawing she turns through, halfway between facing the viewer (s) and the front diagonal (sw), turned 22.5°. Mirrored, it is the same turn to the right.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, facing the viewer and turned a little toward the viewer's left — 22.5°.
- **Why:** Chanté, 2026-09-13: "Turning could still be smoother." Every change of drawing was a 45° jump; with this and three more in-betweens each change is 22.5°.
- **Gate:** the face measured by `prototypes/lumi-walk/facings.py --candidates art/candidates/lumi-iso-ssw --target 22.5` (15–30°).
- **Reference:** the hub, and the two drawings it sits between.

## Settings

- version: v3
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-s.png
- reference: art/lumi/lumi-iso-front.png scale=0.5

## Prompt (v3)

```text
Redraw the first attached image with one small change: she turns very slightly toward the viewer's left, about a quarter of the way toward the pose in the second attached image, and no further. Everything else stays as in the first image: the same size, position, angle, style, line weight, palette and lighting, the same hood, cloak, ribbon, medallions, hands and boots.

After the turn her black face is still nearly centred in the hood's opening, shifted only a little to the left; both glowing eyes are fully visible and almost the same size; the ribbon bow and its three brass medallions sit only a little left of the centre of her chest; the hood shows only slightly more of its right side than in the first image. She is much closer to the first image than to the second.

Both brown boots stay visible below the hem, side by side and a little apart; both small dark hands stay visible at the sides of the cloak. No lantern, no scarf, nothing in her hands. One figure only, on the same flat, untextured grey-blue ground, with no shadow, floor, titles, labels or notes.
```

## What changed, version to version

- **v1** — an in-between facing for smoother turns, asked as "exactly halfway between" the two attached drawings (the Prompt lab finding that turned the diagonals to 45°).
- **v2** — one change: "only slightly … much closer to the second", face "almost centred". All four v1 candidates overshot toward the diagonal: faces measured 34–39° against a 22.5° target, so "halfway between" is pulled toward the more-turned end.
- **v3** — one change: the facing-you drawing is attached first and the prompt is an edit of it ("redraw the first attached image with one small change"), the hub dropped. v2 gave 32–35° on all four, and by eye all eight v1–v2 candidates look like the diagonal; asked as an edit, the generator keeps more of the base drawing.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091507-1.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | fail · face turned 35.9° (target 22.5° ± 7.5°) |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091507-2.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | fail · 37.9° |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091507-3.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | fail · 34.1° |
| 2026-09-13 09:15 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-091507-4.png` | 1 in 1 rows / 1 | 9948 / 5488 (run) | $0.06 | fail · 38.6° |
| 2026-09-13 09:20 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-092035-1.png` | 1 in 1 rows / 1 | 10052 / 5488 (run) | $0.06 | fail · 35.3°; by eye, like the diagonal |
| 2026-09-13 09:20 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-092035-2.png` | 1 in 1 rows / 1 | 10052 / 5488 (run) | $0.06 | fail · 32.4° |
| 2026-09-13 09:20 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-092035-3.png` | 1 in 1 rows / 1 | 10052 / 5488 (run) | $0.06 | fail · 34.6° |
| 2026-09-13 09:20 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-092035-4.png` | 1 in 1 rows / 1 | 10052 / 5488 (run) | $0.06 | fail · 33.2° |
| 2026-09-13 09:22 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-092258-1.png` | 1 in 1 rows / 1 | 10016 / 5488 (run) | $0.06 | fail · 12.4° (undershoots — asked as an edit, the base drawing pulls the other way) |
| 2026-09-13 09:22 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-092258-2.png` | 1 in 1 rows / 1 | 10016 / 5488 (run) | $0.06 | pass (16.2°) but not chosen |
| 2026-09-13 09:22 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-092258-3.png` | 1 in 1 rows / 1 | 10016 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-ssw.png` · pass (17.2°), the closest to 22.5° |
| 2026-09-13 09:22 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-092258-4.png` | 1 in 1 rows / 1 | 10016 / 5488 (run) | $0.06 | fail · 13.9° |

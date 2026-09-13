# lumi-iso-wbw — the hands-free Lumi at the rooms' angle, side-on, turned a touch away

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-wbw.md`. The walk test's seventeenth facing (`art/prototypes/lumi-walk/`): the drawing at the seam between side-on (w, 90° from facing you) and the first view from behind (wnw, 112.5°), turned about 101° from facing you. Mirrored, the same turn to the right.

## Brief

- **What:** Lumi standing, seen from above at an isometric room's angle, side-on to the viewer's left and turned a touch further away — about 101°, an eighth of the way past side-on toward the first back view.
- **Why:** the one pair on the ring whose two drawings hold different things (Chanté, 2026-09-13, on the morph: "Do the extra drawing"). Side-on still shows the ribbon bow, its medallions and an eye; the first view from behind has none of them, so the morph between the two dissolves the bow and the face instead of turning them away. A drawing between the two lets the bow shrink to a sliver and go, and the eye leave before the hood closes.
- **Gate:** neither script judges this one. `facings.py --candidates` reads the face's offset in the hood, and at ~101° the face is a sliver behind the hood's edge — a measurement that cannot be trusted (the same reason the back views are `JUDGED`). `elevation.py --candidates` measures the hem's squash on a view facing straight toward or away, which this is not. So: judged by eye in a contact strip between `w` and `wnw` (`art/prototypes/lumi-walk/out/wbw-strip.png`), for — the bow and medallions a sliver at her front edge and no more; no eye; the hood's opening nearly edge-on with a sliver of the black inside; the same size, angle, costume and lighting as its two neighbours; two boots; two hands.
- **Recorded as:** 101.25° from facing you = 78.75° from facing away, in `facings.py`'s `JUDGED` (back views are recorded as their turn from facing away).

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-w.png
- reference: art/lumi/lumi-iso-wnw.png scale=0.5

## Prompt (v1)

```text
Redraw the first attached image with one small change: she turns slightly further away from the viewer, about halfway toward the pose in the second attached image, and no further. Everything else stays as in the first image: the same size, position, angle, style, line weight, palette and lighting, the same hood, cloak, ribbon, medallions, hands and boots.

She is still almost side-on, facing the viewer's left, with only a little more of her back showing than in the first image. After the turn the opening of her hood is nearly edge-on: we see only a narrow sliver of the black inside it along its left edge, and no eye at all. The brown ribbon bow and its brass medallions are almost hidden behind the front edge of her cloak — only a narrow sliver of the bow and one medallion still peeks past it. She is much closer to the first image than to the second.

Both brown boots stay visible below the hem, a little apart; both small dark hands stay visible at the sides of the cloak, empty and relaxed. No lantern, no scarf, nothing in her hands. One figure only, centred, filling most of the height, on the same flat, untextured grey-blue ground, with no shadow, floor, titles, labels or notes.
```

## What changed, version to version

- **v1** — the seam drawing, asked as an edit of the side-on drawing (the Prompt lab finding: for a small turn "halfway between" is pulled toward the more-turned drawing, while "redraw the first attached image with one small change" keeps the base). Here the wanted turn is 11.25° past side-on — the smallest step yet asked for — and what matters is not a measured angle but what is left showing: a sliver of bow, no eye.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates. (The script appended these four rows without the header, because the table did not exist yet — the header below was written by hand.)

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 10:31 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-103134-1.png` | 1 in 1 rows / 1 | 10148 / 5488 (run) | $0.06 | usable, not chosen · the bow is a sliver and there is no eye, but the hood's opening is as shut as in `wnw` — nothing left to close between this and the back view |
| 2026-09-13 10:31 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-103134-2.png` | 1 in 1 rows / 1 | 10148 / 5488 (run) | $0.06 | usable, not chosen · like 1, and the sun on the hood has slid toward the middle, so the hood reads a touch further round than 1 |
| 2026-09-13 10:31 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-103134-3.png` | 1 in 1 rows / 1 | 10148 / 5488 (run) | $0.06 | **chosen** → `art/lumi/lumi-iso-wbw.png` · in the strip it sits between its neighbours on every count: the hood's opening still shows a crescent of the black inside, much narrower than side-on and wider than `wnw`'s line; no eye in it; the bow and two medallions a sliver past the cloak's front edge where side-on shows the whole bow and `wnw` none; two hands, two boots clearly apart; same size, angle, costume and lighting |
| 2026-09-13 10:31 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-103134-4.png` | 1 in 1 rows / 1 | 10148 / 5488 (run) | $0.06 | usable, not chosen · like 1; only one hand shows |

Judged in `art/prototypes/lumi-walk/out/wbw-strip.png` and the three zoomed bands beside it (`wbw-head.png`, `wbw-chest.png`, `wbw-low.png`), each figure scaled to one height with `w` at the left and `wnw` at the right. No script gate: `facings.py --candidates` reads the face's offset inside the hood and at this turn the face is a sliver behind the hood's edge, and `elevation.py --candidates` only measures a view facing straight toward or away.

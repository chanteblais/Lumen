# lumi-iso-ssw-lantern-left — the in-between facing (ssw), carrying her lantern high in her LEFT hand

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-ssw-lantern-left.md`. A holding drawing for the walk rig (`art/prototypes/lumi-walk/`), cut as the variant `ssw-lantern-left`.

## Brief

- **Why (Chanté, 2026-09-13, via the parent):** on the page she picks the lantern up facing se with the reach and grip mirrored, so it is in her left hand, and carries it through se and sse (sw-lantern and ssw-lantern mirrored, her left hand). Turning on through s to ssw and sw, the unmirrored holding drawings put it in her right hand and it jumped sides. With this drawing and its ssw/sw partner she keeps it in her left hand all the way round; at s the page uses `s-lantern` mirrored.
- **What:** `art/lumi/lumi-iso-ssw.png` with one change: her left hand, on the viewer's right (the far side in this view), raised with the elbow bent, the fist level with her eyes (0.28–0.34 of her height down), holding the lantern by its ring beside the back of the hood on the viewer's right, clear of both eyes and the face opening.
- **What holds:** everything else, including her right hand, empty and relaxed at the cloak on the viewer's left.
- **Gates:** `facings.py --candidates art/candidates/lumi-iso-ssw-lantern-left --target 22.5 --ref art/lumi/lumi-iso-ssw.png`; `hands.py --candidates … --ref art/lumi/lumi-iso-ssw.png`; the fist's height down from the hood top; the hands by eye at 3×.
- **References:** the empty-handed drawing first; the room's painted lantern; the lantern sheet's rest cell (its look only).

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-ssw.png
- reference: art/scenery/home/background.png crop=752,536,815,614 scale=4
- reference: art/lumi/lumi-lantern-idle.png crop=15,135,250,405 scale=2

## Prompt (v1)

```text
Redraw the first attached image with one change: she holds her lantern up high in her left hand, like a light held up to see by. Everything else stays exactly as in the first image: the same size, position, angle, style, line weight, palette and lighting; the same hood, black face and glowing eyes, ribbon bow, brass medallions, cloak folds and brown boots, in the same places.

The change: her left hand — the small dark hand on the viewer's right, at the right side of her cloak in the first image — rises. Her left arm lifts with the elbow bent, the cloak's edge on the viewer's right lifting over the arm, and the closed hand comes up just outside the right edge of her hood, level with her glowing eyes, beside the right side of her hood, on the viewer's right. The hand holds a small brass lantern by the ring on its top, and the lantern hangs straight down from the hand, beside the hood and the top of the cloak, on the viewer's right. The hand and the lantern stay on the viewer's right of the hood, away from her face: the lantern's glass never crosses the hood's opening, and both glowing eyes and the whole black face remain fully visible. The bottom of the lantern is level with her brass medallions, no lower. It is the lantern in the second attached image: a brass cap with a ring on top, a glass body lit warm from inside by a small flame, a round brass base, about a quarter of her height. The third attached image shows only what the lantern looks like in a hand — not that drawing's pose, height, angle, size or side.

Her other hand, her right hand on the viewer's left, stays exactly where it is in the first image: empty and relaxed at the left side of the cloak. She has exactly two hands: her left hand raised on the viewer's right and closed round the lantern's ring, and her right hand empty at the cloak on the viewer's left. No third hand.

One figure only, on the same flat, untextured grey-blue ground, with no shadow, floor, table, titles, labels or notes.
```

## What changed, version to version

- **v1** — the high holding prompt that passed for the right hand (`lumi-iso-ssw-lantern.md` v4: "level with her glowing eyes", eyes and face kept uncovered, the lantern's bottom "level with her brass medallions", the other hand named) mirrored in words to her left hand on the viewer's right, placed beside the hood's right edge (the right side of her hood), with the glass named as never crossing the hood's opening.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 18:44 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-184428-1.png` | 1 in 1 rows / 1 | 12964 / 5488 (run) | $0.07 | pass on facings (17.1°, --ref) and hands (2 vs 2, holds lantern), not chosen · fist 0.315 · eyes whole · diff away from the hand hoodFar 3.00, cloak 4.16 |
| 2026-09-13 18:44 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-184428-2.png` | 1 in 1 rows / 1 | 12964 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-ssw-lantern-left.png` · facings 17.1° (--ref `lumi-iso-ssw.png`; the empty ssw reads 17.2°) · hands 2 vs 2 (holds lantern) · fist 0.290 down · eyes both whole (5550/4244 → 5539/4241 px) · lantern 0.28 of her, 0 px on the face · 3×: fist closed through the ring outside the hood's right edge, lantern in front of the lifted left sleeve, clear of the face; resting hand whole · diff on the halves away from the raised hand: hoodFar 2.52 / 1.8%, cloak 3.31 / 2.0%, boots 2.12 / 0.5% — the steadiest of the four |
| 2026-09-13 18:44 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-184428-3.png` | 1 in 1 rows / 1 | 12964 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 17.1°, hands 2 vs 2, fist 0.285, eyes whole · cloak 3.84 |
| 2026-09-13 18:44 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-184428-4.png` | 1 in 1 rows / 1 | 12964 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 17.1°, hands 2 vs 2, fist 0.295, eyes whole · cloak 3.71 |

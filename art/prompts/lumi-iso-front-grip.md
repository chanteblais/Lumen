# lumi-iso-front-grip — the front diagonal (sw), her hand closed on the lantern's ring

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-front-grip.md`. The second key drawing for the pick-up on the walk rig (`art/prototypes/lumi-walk/`): after `lumi-iso-front-reach`, her hand closes on the ring of the lantern standing on Home's low table in front of her (Chanté, 2026-09-13). The page mirrors it to se; played backwards, it is the set-down.

## Brief

- **What:** `lumi-iso-front.png` (sw) in the reach pose of `lumi-iso-front-reach.png`, with the same right hand (on the viewer's left) now closed round the top ring of her lantern, which stands in front of her with nothing under it (the table will be the room's layer).
- **What matters:** the arm, the closed hand and the ring. Her lower body will be hidden behind the table.
- **What holds:** everything else from the empty-handed drawing — hood, face, eyes, bow, medallions, cloak, boots, the other hand.
- **Gates:** `facings.py --candidates art/candidates/lumi-iso-front-grip --target 45`; `hands.py --candidates … --ref art/lumi/lumi-iso-front.png`; the hands by eye at 3×; a difference image against `lumi-iso-front.png`.
- **References:** the empty-handed drawing first (the edit's base), the chosen reach drawing second (the pose), then the room's painted lantern for its look.

## Settings

- version: v2
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-front.png
- reference: art/lumi/lumi-iso-front-reach.png scale=0.5
- reference: art/scenery/home/background.png crop=752,536,815,614 scale=4

## Prompt (v2)

```text
Redraw the first attached image with one change: she takes hold of her lantern, high up. Everything else stays exactly as in the first image: the same size, position, angle, style, line weight, palette and lighting; the same hood, black face and glowing eyes, ribbon bow, brass medallions, cloak folds and brown boots, in the same places.

The change: her right hand — the small dark hand on the viewer's left, at the left edge of her cloak in the first image — is raised forward and up toward the viewer's left, exactly as in the second attached image: the same arm, the same lifted edge of the cloak over it, the hand in the same place, a little higher than her glowing eyes and just beyond the front edge of her hood. But now the hand is closed round the brass ring on top of a small lantern, gripping it, and the lantern hangs straight down below the hand, beside the front of her hood, with nothing under it: no table, no surface, no shadow. The hand and the lantern stay outside the hood's opening: both glowing eyes and the whole black face remain fully visible. It is the lantern in the third attached image: a brass cap with a ring on top, a glass body lit warm from inside by a small flame, a round brass base, about a quarter of her height.

Her other hand, her left hand on the viewer's right, stays exactly where it is in the first image: empty and relaxed at the lower edge of the cloak. She has exactly two hands: one raised and closed round the lantern's ring, one empty at the cloak. No third hand.

One figure only, on the same flat, untextured grey-blue ground, with no shadow, floor, table, titles, labels or notes.
```

## What changed, version to version

- **v1** — asked as an edit of the empty-handed drawing with the chosen reach attached for the pose, naming the hand that moves and the hand that stays.
- **v2** — one change: the grip moves up with the reach (Chanté, 2026-09-13, via the parent: the lantern at A has its ring about 85 px above her feet, 0.29 of her height down). The second reference is now the high reach (`lumi-iso-front-reach.png` v3), and the words name the height by landmarks as the reach's v3 did — "a little higher than her glowing eyes and just beyond the front edge of her hood" — keep the eyes and face uncovered, and ask the lantern a quarter of her height ("a third" drew 0.20–0.28).

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 16:02 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-160231-1.png` | 1 in 1 rows / 1 | 11788 / 5488 (run) | $0.06 | **pass, chosen** → `art/lumi/lumi-iso-front-grip.png` · facings 45.5° · hands 2 vs 2 · 3×: fist closed on the ring where the reach's hand was, resting hand whole · diff hood 3.34 / 1.6%, cloak 3.65 / 1.6%, boots 3.25 / 0.6%, all 8.24 / 6.8% — the lowest of the four |
| 2026-09-13 16:02 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-160231-2.png` | 1 in 1 rows / 1 | 11788 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.7°, hands 2 vs 2, diff all 9.16 |
| 2026-09-13 16:02 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-160231-3.png` | 1 in 1 rows / 1 | 11788 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.9°, hands 2 vs 2, diff all 8.89 |
| 2026-09-13 16:02 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-160231-4.png` | 1 in 1 rows / 1 | 11788 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.6°, hands 2 vs 2, diff all 8.94 |
| 2026-09-13 16:51 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-165145-1.png` | 1 in 1 rows / 1 | 11864 / 5488 (run) | $0.06 | pass on facings (45.6°, --ref) and hands (2 vs 2, holds lantern), not chosen · fist 0.262 down, above the 0.28–0.34 band · eyes whole · diff all 8.78 |
| 2026-09-13 16:51 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-165145-2.png` | 1 in 1 rows / 1 | 11864 / 5488 (run) | $0.06 | pass on facings (45.5°) and hands (2 vs 2), not chosen · fist 0.258, above the band · eyes whole |
| 2026-09-13 16:51 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-165145-3.png` | 1 in 1 rows / 1 | 11864 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.7°, hands 2 vs 2, eyes whole · fist 0.286 · 3×: fist through the ring, lantern clear of the face · diff hoodFar 2.75, cloak 3.98 / 2.4%, all 9.38 |
| 2026-09-13 16:51 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-165145-4.png` | 1 in 1 rows / 1 | 11864 / 5488 (run) | $0.06 | **pass, chosen** → `art/lumi/lumi-iso-front-grip.png` · facings 45.7° (--ref `lumi-iso-front.png`) · hands 2 vs 2 (holds lantern) · eyes both whole (3763/2737 → 3776/2763 px) · fist 0.287 down, in the band and within 0.01 of the reach (0.297) · lantern bottom 0.59 · 3×: fist closed through the ring beside the hood's front edge, lantern hanging below it with nothing under it, clear of the face; resting hand whole · diff hood 8.97 / 7.7%, hoodFar 3.19 / 1.9%, cloak 3.53 / 1.3%, boots 3.14 / 0.3%, all 9.34 / 7.5% — the steadier cloak of the two in the band |

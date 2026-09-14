# lumi-iso-front-lantern — the front diagonal (sw), carrying her lantern

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-front-lantern.md`. The first holding drawing for the walk rig (`art/prototypes/lumi-walk/`): Lumi carries her lantern along Home's low table, turning se → s → sw and back (Chanté, 2026-09-13). The page mirrors this drawing to se.

## Brief

- **What:** `lumi-iso-front.png` (sw, turned 45° toward the viewer's left) with one change: her right hand, on the viewer's left, carries her lit lantern by its top ring, hanging at her side clear of the cloak.
- **What holds:** everything else — hood, face, eyes, bow, medallions, cloak folds, boots, the other hand — so the rig's pieces and the morph line up with the empty-handed drawing.
- **The same hand in all three holding drawings** (sw, ssw, s): her right hand, on the viewer's left, so a turn morphs rather than swapping the lantern across her.
- **Scale:** the lantern about a third of her height (≈40 px of her 120 px in the room), as in `art/lumi/lumi-lantern-idle.png`.
- **Gates:** `facings.py --candidates art/candidates/lumi-iso-front-lantern --target 45` (38–52°); `hands.py --candidates … --ref art/lumi/lumi-iso-front.png` (no more hand blobs than the empty drawing); the hands by eye at 3×; a difference image against `lumi-iso-front.png` for what should hold.
- **References:** the empty-handed drawing first (the edit's base); the room's painted lantern for its look; the lantern sheet's rest cell for how she carries it.

## Settings

- version: v2
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-front.png
- reference: art/scenery/home/background.png crop=752,536,815,614 scale=4
- reference: art/lumi/lumi-lantern-idle.png crop=15,135,250,405 scale=2

## Prompt (v2)

```text
Redraw the first attached image with one change: she holds her lantern up high, like a light held up to see by. Everything else stays exactly as in the first image: the same size, position, angle, style, line weight, palette and lighting; the same hood, black face and glowing eyes, ribbon bow, brass medallions, cloak folds and brown boots, in the same places.

The change: her right hand — the small dark hand on the viewer's left, at the left edge of her cloak in the first image — rises. Her right arm lifts with the elbow bent, the cloak's edge lifting over the arm, and the closed hand comes up just outside the left edge of her hood, level with her glowing eyes, a little in front of her near shoulder, on the viewer's left. The hand holds a small brass lantern by the ring on its top, and the lantern hangs straight down from the hand, beside the hood and the top of the cloak, on the viewer's left. The lantern and the hand stay outside the hood's opening: both glowing eyes and the whole black face remain fully visible, nothing crosses them. The bottom of the lantern is level with her brass medallions, no lower. It is the lantern in the second attached image: a brass cap with a ring on top, a glass body lit warm from inside by a small flame, a round brass base, about a quarter of her height. The third attached image shows only what the lantern looks like in her hand — not that drawing's pose, height, angle, size or side.

Her other hand, her left hand on the viewer's right, stays exactly where it is in the first image: empty and relaxed at the lower edge of the cloak. She has exactly two hands: one raised and closed round the lantern's ring, one empty at the cloak. No third hand.

One figure only, on the same flat, untextured grey-blue ground, with no shadow, floor, table, titles, labels or notes.
```

## What changed, version to version

- **v1** — asked as an edit of the empty-handed drawing (the Prompt lab finding for small changes), naming the hand that moves and where it comes from, and the hand that stays (the three-hands finding).
- **v2** — one change: the pose moves up (Chanté, 2026-09-13, via the parent): at her pick-up stand the table layer's back edge crosses her about 47 px above her feet (0.61 of her height down) and a 40 px lantern standing at A has its ring about 85 px up (0.29 down), so a lantern held at her side is hidden behind the tabletop while she walks the back edge. The fist is asked for at 0.28–0.34 down, named by landmarks: the rig's empty-handed drawings put the eyes at 0.30–0.38 and the chin line at 0.46, so the words say "level with her glowing eyes … just outside the left edge of her hood" (the medallion wording held the last height where numbers would not), keep eyes and face uncovered, and end the lantern "level with her brass medallions". The lantern is asked a quarter of her height ("a third" drew 0.19–0.27, and the drawn one is cut away). The third reference is kept but its pose is disowned in words, since it shows a lantern held low.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155357-1.png` | 1 in 1 rows / 1 | 12472 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-front-lantern.png` · facings 45.5° · hands 2 vs 2 (holding hand counted) · 3×: a closed fist through the ring, resting hand whole at the hem · diff against `lumi-iso-front.png` (mean |Δ| / share of px off by >24): hood 2.89 / 2.0%, cloak 3.08 / 0.8%, boots 2.63 / 0.3%, all 6.40 / 5.0% — the lowest of the four · the only one clear of the cloak (gap ≥ 16 px, median 44) · hand 0.62 down; lantern 0.20 of her; its bottom 43 px below the far boot's top |
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155357-2.png` | 1 in 1 rows / 1 | 12472 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 45.6°, hands 2 vs 2 · the lantern touches the cloak in 102/170 rows; diff 6.73 |
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155357-3.png` | 1 in 1 rows / 1 | 12472 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 45.6°, hands 2 vs 2 · touches the cloak in 35/201 rows; diff 7.05 |
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155357-4.png` | 1 in 1 rows / 1 | 12472 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 45.6°, hands 2 vs 2 · touches the cloak in 114/175 rows; diff 7.72 |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164236-1.png` | 1 in 1 rows / 1 | 12808 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 45.0° (--ref), hands 2 vs 2 (holds lantern), eyes both whole · fist 0.277 of her height down, just above the 0.28–0.34 band · lantern bottom 0.57 · diff hoodFar 2.32, all 9.87 |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164236-2.png` | 1 in 1 rows / 1 | 12808 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 45.1°, hands 2 vs 2, eyes whole · fist 0.267, above the band · diff all 10.78 |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164236-3.png` | 1 in 1 rows / 1 | 12808 / 5488 (run) | $0.07 | fail · hands 1 vs 2 (warn: the raised fist not found) and facings 61.2° — the fist sits against the face opening's edge and joins the face's dark |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164236-4.png` | 1 in 1 rows / 1 | 12808 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-front-lantern.png` · facings 45.4° (hood from `lumi-iso-front.png`, `--ref`) · hands 2 vs 2 · eyes both whole (3763/2737 px empty-handed, 3765/2764 here) · fist 0.299 down (sw eyes 0.30–0.35) · lantern bottom 0.61 · 3×: fist closed through the ring beside the hood's front edge, the lantern hanging clear of the face; resting hand whole at the hem · diff hood 9.38 / 9.2% (the raised arm and lantern are in the hood rows), hoodFar 3.57 / 2.8%, cloak 3.20 / 0.8%, boots 2.67 / 0.2%, all 10.36 / 9.4% · the only candidate in the band with the fist found |

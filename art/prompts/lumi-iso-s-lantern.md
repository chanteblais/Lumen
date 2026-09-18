# lumi-iso-s-lantern — facing the viewer (s), carrying her lantern

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-s-lantern.md`. A holding drawing for the walk rig (`art/prototypes/lumi-walk/`): the facing she turns through, straight toward the viewer, while she carries her lantern along Home's low table (Chanté, 2026-09-13). Facing you, it is not mirrored.

## Brief

- **What:** `lumi-iso-s.png` (facing straight toward the viewer) with one change: her right hand, on the viewer's left, carries her lit lantern by its top ring, hanging at her side clear of the cloak.
- **What holds:** everything else — hood, face, eyes, bow, medallions, cloak folds, boots, the other hand.
- **The same hand in all three holding drawings** (sw, ssw, s): her right hand, on the viewer's left.
- **Scale:** the lantern about a third of her height.
- **Gates:** `facings.py --candidates art/candidates/lumi-iso-s-lantern --target 0` (−7.5–7.5°); `elevation.py --candidates art/candidates/lumi-iso-s-lantern` (the camera's height; s is the view it measures); `hands.py --candidates … --ref art/lumi/lumi-iso-s.png`; the hands by eye at 3×; a difference image against `lumi-iso-s.png`.
- **References:** the empty-handed drawing first; the room's painted lantern; the lantern sheet's rest cell.

## Settings

- version: v4
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-s.png
- reference: art/scenery/home/background.png crop=752,536,815,614 scale=4
- reference: art/lumi/lumi-lantern-idle.png crop=15,135,250,405 scale=2

## Prompt (v4)

```text
Redraw the first attached image with one change: she holds her lantern up high, like a light held up to see by. Everything else stays exactly as in the first image: the same size, position, angle, style, line weight, palette and lighting; the same hood, black face and glowing eyes, ribbon bow, brass medallions, cloak folds and brown boots, in the same places.

The change: her right hand — the small dark hand on the viewer's left, at the left side of her cloak in the first image — rises. Her right arm lifts with the elbow bent, the cloak's edge lifting over the arm, and the closed hand comes up just outside the left edge of her hood, level with her glowing eyes, a little in front of her near shoulder, on the viewer's left. The hand holds a small brass lantern by the ring on its top, and the lantern hangs straight down from the hand, beside the hood and the top of the cloak, on the viewer's left. The lantern and the hand stay outside the hood's opening: both glowing eyes and the whole black face remain fully visible, nothing crosses them. The bottom of the lantern is level with her brass medallions, no lower. It is the lantern in the second attached image: a brass cap with a ring on top, a glass body lit warm from inside by a small flame, a round brass base, about a quarter of her height. The third attached image shows only what the lantern looks like in her hand — not that drawing's pose, height, angle, size or side.

Her other hand, her left hand on the viewer's right, stays exactly where it is in the first image: empty and relaxed at the side of the cloak. She has exactly two hands: one raised and closed round the lantern's ring, one empty at the cloak. No third hand.

One figure only, on the same flat, untextured grey-blue ground, with no shadow, floor, table, titles, labels or notes.
```

## What changed, version to version

- **v1** — the sw holding prompt's words on this facing's empty-handed drawing.
- **v2** — one change: the hand's height is named ("lifts a little, the elbow bent under the cloak, … at the height of the lowest brass medallion"). All four v1 candidates passed every gate but held the hand where the empty-handed drawing rests it, 0.73–0.75 of her height down, so the lantern hung level with the boots (bottom 34–71 px above the feet line) where the brief asks for above them — and a 40 px lantern hung from a hand 30 px above her feet at room scale would pass her feet. The chosen sw holding drawing holds it at 0.63; the same height in all three keeps a turn from sliding the lantern up and down.
- **v3** — one change: the hand comes out beyond the cloak's edge ("… and comes out a little beyond the edge of the cloak, to the viewer's left"). v2 fixed the height (hand 0.59–0.62 down on three of four (the fourth kept it at 0.78, one hand counted) and the lantern's bottom 14–54 px above the boots' top, against v1's 0.67–0.74 and a lantern at boot level), but every v2 lantern hangs against the cloak: with a 3 px rim excluded, 104–213 of ~200 glass-and-base rows have no ground between the lantern and her, where the chosen sw drawing keeps at least 16 px (median 44). The raised hand stays under the lifted sleeve, so the lantern hangs at the sleeve's edge.
- **v4** — one change: the pose moves up (Chanté, 2026-09-13, via the parent): at her pick-up stand the table layer's back edge crosses her about 47 px above her feet (0.61 of her height down) and a 40 px lantern standing at A has its ring about 85 px up (0.29 down), so a lantern held at her side is hidden behind the tabletop while she walks the back edge. The fist is asked for at 0.28–0.34 down, named by landmarks: the rig's empty-handed drawings put the eyes at 0.30–0.38 and the chin line at 0.46, so the words say "level with her glowing eyes … just outside the left edge of her hood" (the medallion wording held the last height where numbers would not), keep eyes and face uncovered, and end the lantern "level with her brass medallions". The lantern is asked a quarter of her height ("a third" drew 0.19–0.27, and the drawn one is cut away). The third reference is kept but its pose is disowned in words, since it shows a lantern held low.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155400-1.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on facings (0.0°) and hands (2 vs 2), not used (→ v2) · elevation 29.4° on the free half (both halves 37.8°: the arm lifts its side's hem) · hand 0.72 down, bottom 100 px below the boots' top |
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155400-2.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on facings (0.1°) and hands (2 vs 2), not used (→ v2) · elevation 29.3° free half · hand 0.74, bottom 96 px below |
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155400-3.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on facings (0.0°) and hands (2 vs 2), not used (→ v2) · elevation 29.4° free half · hand 0.72, bottom 78 px below |
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155400-4.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on facings (0.0°) and hands (2 vs 2), not used (→ v2) · elevation 29.3° free half · hand 0.69, bottom 63 px below |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-1.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 0.1°, elevation 29.3° (free half), hands 2 vs 2 · hand 0.62, bottom +20 px · touches the cloak in 182/220 rows · 3×: fist inside the sleeve's opening |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-2.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 0.1°, elevation 29.3°, hands 2 vs 2 · hand 0.59, bottom +25 px · touches in 177/217 rows |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-3.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 0.1°, elevation 29.3°, hands 2 vs 2 · hand 0.62, bottom +14 px · touches in 204/243 rows |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-4.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | warn (hands) · 1 vs 2 — the holding hand is hidden inside the sleeve (3×: only the ring shows); hand 0.78 · facings 0.1°, elevation 29.4° |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161946-1.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-s-lantern.png` · facings 0.0° · elevation 29.4° on the half away from the lantern (the base drawing reads 29.3° both ways; both halves here read 44.5°, the arm lifting its own hem) · hands 2 vs 2 · 3×: the fist out past the sleeve's edge, closed through the ring; resting hand whole · diff against `lumi-iso-s.png` hood 2.52 / 1.3%, cloak 3.06 / 2.3%, boots 2.70 / 1.6%, all 9.82 / 9.1% · hand 0.58 down; lantern 0.23 of her, bottom 71 px above the boots' top · touches the cloak in 204/209 rows |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161946-2.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 0.1°, elevation 29.4°, hands 2 vs 2 · the fist back inside the sleeve's opening (lining behind the ring) · hand 0.62, bottom +7 px · diff all 11.08 |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161946-3.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | warn (hands) · 1 vs 2 — the holding hand hidden inside the sleeve, hand 0.78 · facings 0.1°, elevation 29.3° |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161946-4.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 0.1°, elevation 29.4°, hands 2 vs 2 · fist inside the sleeve's opening · hand 0.62, bottom +0 px · diff all 11.69 |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164238-1.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings -0.1° (--ref), elevation 29.4°, hands 2 vs 2 · fist 0.350, below the band |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164238-2.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings -0.6°, elevation 29.3°, hands 2 vs 2, eyes whole · fist 0.283 · diff hoodFar 2.92, all 14.74 |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164238-3.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings -0.3°, elevation 29.3°, hands 2 vs 2, eyes whole · fist 0.328 · diff hoodFar 3.29, cloak 3.90 |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164238-4.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-s-lantern.png` · facings 0.0° (--ref `lumi-iso-s.png`) · elevation 29.3° on the half away from the lantern (the empty drawing 29.3°) · hands 2 vs 2 · eyes both whole (5810/5806 → 5830/5825 px) · fist 0.310 down (s eyes 0.38), level with sw 0.299 and ssw 0.307 · lantern bottom 0.62 · 3×: fist closed through the ring beside the hood's left edge, lantern clear of the face; resting hand whole · diff hood 11.42 / 8.3%, hoodFar 2.94 / 1.1%, cloak 3.37 / 1.8%, boots 2.57 / 0.9%, all 14.58 / 12.6% — the lowest whole-figure diff of the four |

# lumi-iso-ssw-lantern — the in-between facing (ssw), carrying her lantern

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-ssw-lantern.md`. A holding drawing for the walk rig (`art/prototypes/lumi-walk/`): the facing she turns through between s and sw while she carries her lantern along Home's low table (Chanté, 2026-09-13). The page mirrors it to sse.

## Brief

- **What:** `lumi-iso-ssw.png` (turned 22.5° toward the viewer's left) with one change: her right hand, on the viewer's left, carries her lit lantern by its top ring, hanging at her side clear of the cloak.
- **What holds:** everything else — hood, face, eyes, bow, medallions, cloak folds, boots, the other hand.
- **The same hand in all three holding drawings** (sw, ssw, s): her right hand, on the viewer's left.
- **Scale:** the lantern about a third of her height.
- **Gates:** `facings.py --candidates art/candidates/lumi-iso-ssw-lantern --target 22.5` (15–30°); `hands.py --candidates … --ref art/lumi/lumi-iso-ssw.png`; the hands by eye at 3×; a difference image against `lumi-iso-ssw.png`.
- **References:** the empty-handed drawing first; the room's painted lantern; the lantern sheet's rest cell.

## Settings

- version: v4
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-ssw.png
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
- **v2** — one change: the hand's height is named ("lifts a little, the elbow bent under the cloak, … at the height of the lowest brass medallion"). All four v1 candidates passed every gate but held the hand at 0.68–0.73 of her height down, so the lantern hung level with the boots (bottom 38–95 px above the feet line) where the brief asks for above them, and three of four touched the cloak somewhere. The chosen sw holding drawing holds it at 0.63; the same height in all three keeps a turn from sliding the lantern up and down.
- **v3** — one change: the hand comes out beyond the cloak's edge ("… and comes out a little beyond the edge of the cloak, to the viewer's left"). v2 fixed the height (hand 0.59–0.61 of her height down and the lantern's bottom 19–53 px above the boots' top, against v1's 0.67–0.74 and a lantern at boot level), but every v2 lantern hangs against the cloak: with a 3 px rim excluded, 104–213 of ~200 glass-and-base rows have no ground between the lantern and her, where the chosen sw drawing keeps at least 16 px (median 44). The raised hand stays under the lifted sleeve, so the lantern hangs at the sleeve's edge.
- **v4** — one change: the pose moves up (Chanté, 2026-09-13, via the parent): at her pick-up stand the table layer's back edge crosses her about 47 px above her feet (0.61 of her height down) and a 40 px lantern standing at A has its ring about 85 px up (0.29 down), so a lantern held at her side is hidden behind the tabletop while she walks the back edge. The fist is asked for at 0.28–0.34 down, named by landmarks: the rig's empty-handed drawings put the eyes at 0.30–0.38 and the chin line at 0.46, so the words say "level with her glowing eyes … just outside the left edge of her hood" (the medallion wording held the last height where numbers would not), keep eyes and face uncovered, and end the lantern "level with her brass medallions". The lantern is asked a quarter of her height ("a third" drew 0.19–0.27, and the drawn one is cut away). The third reference is kept but its pose is disowned in words, since it shows a lantern held low.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155358-1.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on the gates, not used (→ v2) · facings 17.1°, hands 2 vs 2 · hand 0.72 down, lantern bottom 82 px below the boots' top; diff all 6.54 |
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155358-2.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on the gates, not used (→ v2) · facings 17.0°, hands 2 vs 2 · hand 0.68 down, bottom 70 px below the boots' top |
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155358-3.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on the gates, not used (→ v2) · facings 17.0°, hands 2 vs 2 · hand 0.67 down, bottom 39 px below the boots' top |
| 2026-09-13 15:53 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155358-4.png` | 1 in 1 rows / 1 | 12468 / 5488 (run) | $0.07 | pass on the gates, not used (→ v2) · facings 16.9°, hands 2 vs 2 · hand 0.72 down, bottom 95 px below the boots' top |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-1.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 17.1°, hands 2 vs 2 · hand 0.61 down, bottom 19 px above the boots' top · touches the cloak in 155/199 rows · 3×: fist inside the lifted sleeve's opening, lining behind the ring |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-2.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 17.0°, hands 2 vs 2 · hand 0.61, bottom +20 px · touches in 204/236 rows |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-3.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 16.9°, hands 2 vs 2 · hand 0.59, bottom +53 px · touches in 166/196 rows · diff all 9.08 (the lowest) |
| 2026-09-13 16:10 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-161041-4.png` | 1 in 1 rows / 1 | 12580 / 5488 (run) | $0.07 | pass on the gates, not used (→ v3) · facings 17.0°, hands 2 vs 2 · hand 0.59, bottom +21 px · touches in 104/188 rows |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161945-1.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 16.9°, hands 2 vs 2 · hand 0.60 down, bottom 58 px above the boots' top · the fist out past the sleeve · touches the cloak in 179/200 rows · diff all 9.26 |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161945-2.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-ssw-lantern.png` · facings 17.1° · hands 2 vs 2 · 3×: the fist out past the sleeve's edge, closed through the ring; resting hand whole at the side · diff against `lumi-iso-ssw.png` hood 2.00 / 1.3%, cloak 2.27 / 0.9%, boots 1.81 / 0.5%, all 8.72 / 7.0% — the steadiest of all twelve ssw candidates · hand 0.60 down (sw 0.62); lantern 0.23 of her, bottom 46 px above the boots' top · the lantern still touches the cloak in 184/200 glass-and-base rows |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161945-3.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 17.0°, hands 2 vs 2 · hand 0.60, bottom +27 px · touches in 156/206 rows · diff all 9.26 |
| 2026-09-13 16:19 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-161945-4.png` | 1 in 1 rows / 1 | 12648 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 17.1°, hands 2 vs 2 · hand 0.58, bottom +32 px · fist out past the sleeve · touches in 143/207 rows · diff hood 2.62, all 9.35 |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164237-1.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | fail (hands) · 1 vs 2 — the raised fist not counted · facings 25.8° (--ref) |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164237-2.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | **pass, chosen** → `art/lumi/lumi-iso-ssw-lantern.png` · facings 16.9° (--ref `lumi-iso-ssw.png`) · hands 2 vs 2 · eyes both whole (5550/4244 → 5543/4263 px) · fist 0.307 down (ssw eyes 0.37–0.39) · lantern bottom 0.67 · 3×: fist closed through the ring outside the hood's left edge, lantern clear of the face; resting hand whole · diff hood 9.95 / 8.4%, hoodFar 2.05 / 1.3%, cloak 2.35 / 1.3%, boots 2.19 / 1.6%, all 13.36 / 12.3% — the steadiest hoodFar and cloak of the four |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164237-3.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 17.0°, hands 2 vs 2, eyes whole · fist 0.331 · diff hoodFar 3.20, cloak 3.37 |
| 2026-09-13 16:42 | v4 | gpt-image-2.5-sunburst · high · 1024x1536 | `v4-2.5-sunburst-0913-164237-4.png` | 1 in 1 rows / 1 | 12804 / 5488 (run) | $0.07 | pass on the gates, not chosen · facings 16.0°, hands 2 vs 2, eyes whole · fist 0.287 · diff hoodFar 3.06, cloak 3.90 |

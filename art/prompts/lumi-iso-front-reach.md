# lumi-iso-front-reach — the front diagonal (sw), reaching for the lantern

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-iso-front-reach.md`. The first of two key drawings for the pick-up on the walk rig (`art/prototypes/lumi-walk/`): Lumi stands behind Home's low table facing se (the page mirrors this drawing) and reaches for the lantern's ring (Chanté, 2026-09-13). Played backwards, it is the set-down.

## Brief

- **What:** `lumi-iso-front.png` (sw) with one change: her right hand, on the viewer's left, reaches forward and a little down toward the viewer's lower left, open and empty, at about chest height, as if to take a handle on a low table in front of her.
- **What matters:** the arm and the hand. Her lower body will be hidden behind the table.
- **What holds:** everything else — hood, face, eyes, bow, medallions, cloak, boots, the other hand.
- **The same hand** as in the holding drawings: her right hand, on the viewer's left.
- **Gates:** `facings.py --candidates art/candidates/lumi-iso-front-reach --target 45`; `hands.py --candidates … --ref art/lumi/lumi-iso-front.png`; the hands by eye at 3×; a difference image against `lumi-iso-front.png`.

## Settings

- version: v3
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 4
- grid: 1x1
- reference: art/lumi/lumi-iso-front.png

## Prompt (v3)

```text
Redraw the attached image with one change: she reaches up with one hand. Everything else stays exactly as in the attached image: the same size, position, angle, style, line weight, palette and lighting; the same hood, black face and glowing eyes, ribbon bow, brass medallions, cloak folds and brown boots, in the same places.

The change: her right hand — the small dark hand on the viewer's left, at the left edge of her cloak in the attached image — rises forward and up, toward the viewer's left, until the open hand is a little higher than her glowing eyes — the whole hand above the level of the eyes, none of it below them — just beyond the front edge of her hood, as if to take the ring of a lantern standing just in front of her face. The arm comes out from under the front edge of the cloak, the cloak's edge lifting over it, the elbow a little bent. The hand is open and empty, palm down, the small dark fingers relaxed and a little curled. The hand stays outside the hood's opening: both glowing eyes and the whole black face remain fully visible.

Her other hand, her left hand on the viewer's right, stays exactly where it is in the attached image: empty and relaxed at the lower edge of the cloak. She has exactly two hands: the raised, reaching one and the resting one. No third hand. Nothing in either hand.

One figure only, on the same flat, untextured grey-blue ground, with no shadow, floor, table, lantern, titles, labels or notes.
```

## What changed, version to version

- **v1** — asked as an edit of the empty-handed drawing, naming the hand that moves and where it comes from, and the hand that stays.
- **v2** — one change: the reach moves up (Chanté, 2026-09-13, via the parent): a 40 px lantern standing at A has its ring about 85 px above her feet, 0.29 of her height down, where v1's hand reached 0.58 down. The hand is named by landmarks: "level with her glowing eyes, just beyond the front edge of her hood" (the eyes sit 0.30–0.35 down in the sw drawing), open, palm down, eyes and face kept uncovered.
- **v3** — one change: the hand is asked "a little higher than her glowing eyes — the whole hand above the level of the eyes, none of it below them". v2's "level with her glowing eyes" put the open hand's centre 0.367–0.383 of her height down on all four candidates (the sw eyes sit 0.30–0.35), below the 0.28–0.34 asked: the fingers hang below the palm, so a hand "level with" the eyes centres under them.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155401-1.png` | 1 in 1 rows / 1 | 7360 / 5488 (run) | $0.05 | fail (hands) · 3 vs 2 — the open hand's palm and fingers counted as two blobs; two hands by eye · facings 45.5° · (hands.py since merges pieces closer than 0.025 of her height: 2 vs 2) |
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155401-2.png` | 1 in 1 rows / 1 | 7360 / 5488 (run) | $0.05 | **pass, chosen** → `art/lumi/lumi-iso-front-reach.png` · facings 45.5° · hands 2 vs 2 · 3×: open hand, fingers a little curled, reaching forward and a little down; resting hand whole at the hem · diff hood 3.49 / 2.3%, cloak 3.78 / 0.8%, boots 3.67 / 0.6%, all 7.82 / 6.1% · chosen over 4 (all 7.56) for the hand angled more downward, as the brief asks; the grip was generated from it |
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155401-3.png` | 1 in 1 rows / 1 | 7360 / 5488 (run) | $0.05 | fail (hands) · 3 vs 2 — the same split open hand; two hands by eye · facings 45.9° · (after the merge fix: 2 vs 2) |
| 2026-09-13 15:54 | v1 | gpt-image-2.5-sunburst · high · 1024x1536 | `v1-2.5-sunburst-0913-155401-4.png` | 1 in 1 rows / 1 | 7360 / 5488 (run) | $0.05 | pass on the gates, not chosen · facings 45.6°, hands 2 vs 2, diff all 7.56 · the hand reaches level rather than down |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164240-1.png` | 1 in 1 rows / 1 | 7440 / 5488 (run) | $0.06 | fail (fist height) · hand 0.370 down, below the 0.28–0.34 band ("level with her eyes" centres the open hand under them) · facings 45.5° (--ref), hands 2 vs 2 |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164240-2.png` | 1 in 1 rows / 1 | 7440 / 5488 (run) | $0.06 | fail (fist height) · hand 0.367 · facings 45.6°, hands 2 vs 2 |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164240-3.png` | 1 in 1 rows / 1 | 7440 / 5488 (run) | $0.06 | fail (fist height) · hand 0.383 · facings 45.4°, hands 2 vs 2 |
| 2026-09-13 16:42 | v2 | gpt-image-2.5-sunburst · high · 1024x1536 | `v2-2.5-sunburst-0913-164240-4.png` | 1 in 1 rows / 1 | 7440 / 5488 (run) | $0.06 | fail (fist height) · hand 0.380 · facings 45.3°, hands 2 vs 2 |
| 2026-09-13 16:48 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-164836-1.png` | 1 in 1 rows / 1 | 7512 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.2° (--ref), hands 2 vs 2 (one open hand, now one blob), eyes whole · hand 0.304 · diff hoodFar 3.72, all 10.81 |
| 2026-09-13 16:48 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-164836-2.png` | 1 in 1 rows / 1 | 7512 / 5488 (run) | $0.06 | **pass, chosen** → `art/lumi/lumi-iso-front-reach.png` · facings 45.5° (--ref `lumi-iso-front.png`) · hands 2 vs 2 · eyes both whole (3763/2737 → 3763/2742 px) · open hand centred 0.297 of her height down (top 0.235, bottom 0.380; sw eyes 0.30–0.35) · 3×: open hand, fingers curled a little, raised just beyond the hood's front edge, the forearm dark against the face's side but outside the opening; resting hand whole · diff hood 8.85 / 7.4%, hoodFar 2.53 / 1.1%, cloak 3.34 / 1.2%, boots 2.97 / 0.4%, all 9.31 / 7.2% — the lowest of the four; the grip v2 was generated from it |
| 2026-09-13 16:48 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-164836-3.png` | 1 in 1 rows / 1 | 7512 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.2°, hands 2 vs 2, eyes whole · hand 0.282 · diff all 9.45 |
| 2026-09-13 16:48 | v3 | gpt-image-2.5-sunburst · high · 1024x1536 | `v3-2.5-sunburst-0913-164836-4.png` | 1 in 1 rows / 1 | 7512 / 5488 (run) | $0.06 | pass on the gates, not chosen · facings 45.5°, hands 2 vs 2, eyes whole · hand 0.293 · 3×: like 2, the fingers straighter · diff all 9.35 |

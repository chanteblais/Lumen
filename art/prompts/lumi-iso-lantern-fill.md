# lumi-iso-lantern-fill — what is behind the drawn lantern, for the holding drawings' cut

Generated with `python3 art/prototypes/lumi-walk/fill.py <variant> [--n 2]`. Not a new drawing: a masked edit of a holding or pick-up drawing (`art/lumi/lumi-iso-front-lantern.png`, `-ssw-lantern`, `-s-lantern`, `-front-grip`) that paints what the drawn lantern hides. `split.py` cuts the drawn lantern away (the room's lantern hangs from her hand instead) and fills only what the cut opened from the chosen fill, so the cloak beside the room's smaller lantern is whole rather than torn (lumi-walk grids at 9×, 2026-09-13: torn cloak strands beside the lantern on ssw and s, a holed cloak fragment beside the finial on front-grip).

## Brief

- **What:** inside the mask (the drawn lantern and its ring, grown, less the fist), no lantern: the cloak, its lifted sleeve and its trim continued, or the flat ground where no cloak would be.
- **What holds:** everything outside the mask, exactly — `fill.py` reports the drift outside it.
- **No new hand, arm or object:** `hands.py --image <candidate> --ref <the empty-handed drawing>` must not count more hands than the reference.
- **Gates:** hands.py as above; drift outside the mask; the cut region filled, by eye at 3× (`<candidate>-look.png`).

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1024x1536
- quality: high
- n: 2

## Prompt (v1)

```text
This is a finished character drawing of a small hooded figure in a cream cloak with orange embroidery, on a flat grey-blue background. Inside the transparent (masked) area, remove the small brass lantern and the ring it hangs from completely, and paint only what the lantern was hiding: the cream cloak and the lifted sleeve continuing their folds, outline, lining and orange trim from around the mask, and the same flat grey-blue background wherever no cloak would be. Keep the small dark closed hand exactly where it is, closed on nothing. Do not paint any lantern, ring, handle, light, glow, hand, arm or new object inside the mask. Same flat painterly style, line weight and palette. Everything outside the masked area stays exactly as it is.
```

## What changed, version to version

- **v1** — first run.

## Runs

Appended by `fill.py`; the verdict column is filled by hand from the gates.

| When | Version | Variant | Candidate | Mask px | Drift outside | Tokens (in / out) | Cost | Verdict |
|---|---|---|---|---|---|---|---|---|
| 2026-09-13 17:55 | v1 | sw-lantern | `sw-lantern-v1-0913-175537-1.png` | 67278 | 3.60 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · pass on the gates, not chosen · 3×: the sleeve fills the lantern's place, a smudged shadow under its fold |
| 2026-09-13 17:55 | v1 | sw-lantern | `sw-lantern-v1-0913-175537-2.png` | 67278 | 2.59 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · **pass, chosen** → `art/lumi/lumi-iso-front-lantern-fill.png` · 3×: the lifted sleeve hangs whole where the lantern was, its trim and a sun continued, no lantern, ring or glow left inside the mask |
| 2026-09-13 17:56 | v1 | ssw-lantern | `ssw-lantern-v1-0913-175613-1.png` | 74966 | 2.86 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · **pass, chosen** → `art/lumi/lumi-iso-ssw-lantern-fill.png` · 3×: the sleeve and its lining whole, the embroidery continued cleanly |
| 2026-09-13 17:56 | v1 | ssw-lantern | `ssw-lantern-v1-0913-175613-2.png` | 74966 | 2.08 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · pass on the gates, not chosen · 3×: the sun motif redrawn as a doubled ring |
| 2026-09-13 17:56 | v1 | s-lantern | `s-lantern-v1-0913-175652-1.png` | 71029 | 2.59 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · **pass, chosen** → `art/lumi/lumi-iso-s-lantern-fill.png` · 3×: the sleeve whole, one short dark crease at the fold |
| 2026-09-13 17:56 | v1 | s-lantern | `s-lantern-v1-0913-175652-2.png` | 71029 | 2.45 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · pass on the gates, not chosen · 3×: the trim lines break and cross under the sun |
| 2026-09-13 17:57 | v1 | front-grip | `front-grip-v1-0913-175731-1.png` | 81305 | 2.96 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · **pass, chosen** → `art/lumi/lumi-iso-front-grip-fill.png` · 3×: the sleeve continues the original's shape and trim |
| 2026-09-13 17:57 | v1 | front-grip | `front-grip-v1-0913-175731-2.png` | 81305 | 3.08 | 3410 / 2744 (run) | $0.05 | hands 2 vs 2 · pass on the gates, not chosen · 3×: clean, a paler lining than the reach and held drawings |

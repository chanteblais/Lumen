# lumi-model-sheet — the canon model sheet, hands-free

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-model-sheet.md`. Why: `docs/art-direction.md` §7 (one model sheet as canon) and §4a step 2.

## Brief

- **What:** a turnaround, not a loop — the hub (`art/lumi/lumi-free-rest.png`) at eye level from five sides, and at the rooms' isometric angle in four diagonal facings (§6, bet 5).
- **Pass (by eye and by count, the loop gates don't apply):** nine separate figures; the same height across a row (±3%); the costume the same in every view (sun on the hood, the bow, four medallions, the boots); hands empty; no lantern, no scarf, no words.
- **Used for:** the reference every later pose and path attaches beside the hub, and the facings a resident Lumi walks in.

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1920x1280
- quality: high
- n: 2
- grid: 2x5
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6

## Prompt (v1)

```text
Draw a character model sheet of the character in the attached image, for animators: the same character, costume, proportions and size in every view, standing, both hands empty at her sides, holding nothing.

Top row, at eye level, left to right, evenly spaced with their feet on one baseline:
  1. front, exactly as the attached image;
  2. three-quarter view, turned toward the viewer's left;
  3. side view, facing the viewer's left;
  4. back view: the hood and the cloak from behind, no face showing;
  5. three-quarter view, turned toward the viewer's right.
Bottom row, the same character seen from above at the angle of an isometric room, left to right, evenly spaced with their feet on one baseline:
  6. facing down and to the left;
  7. facing down and to the right;
  8. facing up and to the left, her back to the viewer, no face showing;
  9. facing up and to the right, her back to the viewer, no face showing.

In every view: the hood with the sun embroidery on its side, the black face with two glowing oval eyes wherever the face shows, the ribbon bow with its brass medallions, the cream cloak with its orange stitched stars and lines, small dark hands, brown boots. Same style, line weight, palette and lighting as the attachment.

Ground: flat, untextured grey-blue, as in the attachment. Every figure separate, with generous space between them. No titles, labels, numbers, arrows or notes anywhere. No lantern, no scarf.
```

## What changed, version to version

- **v1** — first try: the hub as the only reference; eye-level turnaround on top, isometric facings below.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 05:25 | v1 | gpt-image-2.5-sunburst · high · 1920x1280 | `v1-2.5-sunburst-0913-052549-1.png` | 9 in 2 rows / 10 | 2188 / 3424 (run) | $0.06 | **pass, chosen** by eye (a turnaround; the loop gates don't apply): nine figures, the costume the same in all nine (the sun on the hood's side, the bow, four medallions wherever the front shows, the boots), hands empty; every view as asked — the side view faces the viewer's left, the back views show no face. The isometric row reads steeper than the rooms' angle; check against a room before a resident is drawn from it → `art/lumi/lumi-model-sheet.png` |
| 2026-09-13 05:25 | v1 | gpt-image-2.5-sunburst · high · 1920x1280 | `v1-2.5-sunburst-0913-052549-2.png` | 9 in 2 rows / 10 | 2188 / 3424 (run) | $0.06 | fail · views swapped: view 3 faces the viewer's right and view 5 turns left, against the brief; the costume as consistent as 1 |

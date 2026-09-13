# lumi-free-pickup — she picks up a book (and, played back, sets it down)

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-free-pickup.md`. The first *path* of `docs/art-direction.md` §4a: from the hub to a new pose, holding a book, and played in reverse, back again (bet 7).

## Brief

- **Movement:** a small stack of books stands beside her; she takes the top one in one hand, lifts it to her chest, and holds it there with both hands.
- **Moves:** both arms and hands, the cloak's front edges above them, and the top book. **Holds:** the hood, the face and eyes, the bow and medallions, the rest of the cloak, the boots, and the two books left on the stack.
- **Where it plays:** a path between poses. Forward it is *pick up*, reversed *set down*; between them she can hold the book. On the paper the stack has to appear and go (the cut fades it); in a room it would stand in the painting (tier 4).
- **Frames:** 24 — rest 2 · reach 4 · lift 8 · the other hand joins 6 · holding 4. ~140 ms a frame.
- **Starts:** on the hub with the stack beside her. **Ends:** on a new pose, holding the book.
- **The body holds on purpose:** the stack is as high as her hands, so she doesn't bend. Bending would move the hood, the part the redraw keeps boiling; that is a later path.

## Settings

- version: v3
- model: gpt-image-2.5-sunburst
- size: 1776x896
- quality: high
- n: 2
- grid: 3x8
- reference: art/lumi/lumi-free-rest.png crop=40,40,720,1000 scale=0.6

## Prompt (v3)

```text
Draw an animation sprite sheet of the character in the attached image picking up a book: one base drawing, copied from the attachment, and in every frame only her arms, her small dark hands, the front edges of the cloak just above them, and one book move. The hood with its sun embroidery, the black face and both glowing eyes, the ribbon bow with its brass medallions, the rest of the cloak and its folds, and the boots stay exactly the same, pixel for pixel, in every frame.

Beside her on the ground, on the viewer's right, close to the edge of her cloak, stands a small stack of three closed leather books: dark green at the bottom, brown in the middle, dark red on top. The top of the stack is level with her hands. The green and the brown book never move. Once she lifts the red book off, it is gone from the stack: from frame 7 on the stack is only the green and the brown book, one book lower, and no other book appears.

Phases, in frame order:
  frames 1–2: the rest pose, exactly as the attached image, both hands empty at her sides, the stack beside her.
  frames 3–6: her left hand (on the viewer's right) reaches out to the dark red book on top of the stack and takes hold of it.
  frames 7–14: she lifts the red book up and in, in small even steps, until she holds it upright against her chest, just below the medallions, its cover facing the viewer.
  frames 15–20: her right hand (on the viewer's left), the one that was resting at the hem, lifts from the hem and comes across to hold the book too. She has only two hands: from frame 17 on there is no hand at the hem, both of her hands are on the book.
  frames 21–24: she stands holding the book with both hands, still, no hand at the hem.
24 frames in total, small even steps, slow in and slow out. Frame 1 is the attached pose with the stack beside her.

Layout: a regular grid of 3 rows × 8 columns, every cell the same size, generous margins, the figure and the stack in the same place and at the same size in every cell, feet on one baseline.
Ground: flat, untextured grey-blue, the same as the attached image. No titles, labels, frame numbers, arrows or notes anywhere.
Same style, line weight, palette and lighting as the attachment. No lantern, no scarf.
```

## What changed, version to version

- **v1** — first path: the hub as the reference; the object named by colour so the one that moves is unambiguous; the stack at hand height so the body can hold.
- **v2** — one change: say the stack loses the book (both v1 candidates kept three books on it after the lift). The ruled lines both drew are handled by the measure script, not the words.
- **v3** — one change: say which hand joins and that it leaves the hem (the chosen v2 drew a third hand: "her other hand comes across" added one rather than moving the resting one).

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 05:27 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-052732-1.png` | 1 in 1 rows / 24 | 2402 / 2069 (run) | $0.04 | fail · the stack keeps three books: once the red book is lifted a new one takes its place; and ruled lines between the cells (1 frame found). The movement itself reads, by eye: reach 3–6, lift 7–14, the second hand 15–20, held 21–24 |
| 2026-09-13 05:27 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-052732-2.png` | 1 in 1 rows / 24 | 2402 / 2069 (run) | $0.04 | fail · the same two faults as 1 (three books stay on the stack; ruled lines) |
| 2026-09-13 05:34 | v2 | gpt-image-2.5-sunburst · high · 1776x896 | `v2-2.5-sunburst-0913-053404-1.png` | 48 in 3 rows / 24 | 3726 / 3103 (run) | $0.04 | **pass, chosen — but three hands** (found at the cut, after review, chasing a 1.5px step in her boots): from frame 13 two hands hold the book while her right hand still hangs at the hem; the gates can't see anatomy. Frames 1–12 (one hand on the book) are sound. — re-measured with ruled lines painted over: 24/24, rows equal (0.684), head IoU 0.985–0.997 every step, last→first 0.988; three books before the lift, two after; reach 3–6, lift 7–12, the other hand joins 13–16, held 17–24 with the book one size throughout. (The 48 on arrival was the stack counted as its own figures and the ruled lines, before the fix.) → `art/lumi/lumi-free-pickup.png` |
| 2026-09-13 05:34 | v2 | gpt-image-2.5-sunburst · high · 1776x896 | `v2-2.5-sunburst-0913-053404-2.png` | 24 in 3 rows / 24 | 3726 / 3103 (run) | $0.04 | fail · phase compressed: every gate passes (IoU ≥ 0.989), but the book goes from the stack to her chest in one step (7→8) |
| 2026-09-13 05:34 | v2 | gpt-image-2.5-sunburst · high · 1776x896 | `v2-2.5-sunburst-0913-053404-3.png` | 24 in 3 rows / 24 | 3726 / 3103 (run) | $0.04 | pass on the gates (IoU ≥ 0.993, the steadiest) but not chosen · the book is drawn smaller and lower in row 3 than in row 2, a pop at 16→17 |
| 2026-09-13 06:34 | v3 | gpt-image-2.5-sunburst · high · 1776x896 | `v3-2.5-sunburst-0913-063457-1.png` | 24 in 3 rows / 24 | 3876 / 3103 (run) | $0.04 | pass on the gates (head IoU ≥ 0.984, rows within 1.4%) and two hands throughout, but not chosen · the resting hand vanishes from the hem between 13 and 16 instead of being seen to lift |
| 2026-09-13 06:34 | v3 | gpt-image-2.5-sunburst · high · 1776x896 | `v3-2.5-sunburst-0913-063457-2.png` | 24 in 3 rows / 24 | 3876 / 3103 (run) | $0.04 | **pass, chosen** — 24/24, rows equal (0.718 / 0.718 / 0.715), head IoU ≥ 0.984 every step, last→first 0.990; two hands in every frame, checked zoomed on each phase: one at the hem and one on the book until 15, the resting hand lifting at 16, both on the book 17–24; three books before the lift, two after → `art/lumi/lumi-free-pickup.png` (replaces v2) |
| 2026-09-13 06:34 | v3 | gpt-image-2.5-sunburst · high · 1776x896 | `v3-2.5-sunburst-0913-063457-3.png` | 24 in 3 rows / 24 | 3876 / 3103 (run) | $0.04 | fail · pops: head IoU 0.891 at 8→9 and 0.904 at 16→17, last→first 0.897 |

v2 fixed the book count in all three candidates; v3 fixed the third hand in two of three. Most candidates ruled lines between the cells.

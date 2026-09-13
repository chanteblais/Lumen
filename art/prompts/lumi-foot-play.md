# lumi-foot-play — the prompt, its versions and every run

Generated with `python3 scripts/gen-lumi-sheet.py art/prompts/lumi-foot-play.md`. The method is `docs/animation-pipeline.md` → *Prompt lab*: change one thing per version, say what and why, let the gates judge.

## Brief

- **Movement:** a shy idle — she looks down at the ground, scuffs the toe of one boot back and forth, and looks up again.
- **Moves:** the hood (a small dip forward) and the eyes (lowered toward the ground) · her right boot, on the viewer's left, away from the lantern. **Holds:** the cloak and its hem, the ribbon and medallions, the other boot, the lantern and the hand holding it, the hanging free hand.
- **Where it plays:** an idle variation, mixed into the breath now and then (`VARIATIONS`) — the first drawn of the lantern character. Tier 3, a drawn loop (`docs/art-direction.md` §4).
- **Frames:** 24 — rest 2 · the look down 4 · the foot 12 (toe lifts 2, out 2, back 2, out 2, back 2, settles 2) · the look up 4 · rest 2.
- **Built to be replayed in different orders** (Chanté: "a bunch of animations that … doesn't feel repetitive"): each phase starts and ends on a pose it shares with its neighbours, so one sheet gives several variations over `LUMI_LOOP_CELLS` — a glance down with no foot (look down, hold, look up), one scuff, two scuffs, a longer play with the scuff repeated.
- **Frame time:** ~160 ms for the head (a slow look), the scuffs perhaps faster; set at the cut.
- **Starts and ends:** on the rest cell (the wave sheet's first cell, the drawing the body is cut from).

## Settings

- version: v1
- model: gpt-image-2.5-sunburst
- size: 1776x896
- quality: high
- n: 4
- grid: 3x8
- reference: art/lumi/lumi-wave.png crop=14,1,235,317 scale=2

The reference is the wave sheet's first cell alone (the rest pose the cut takes the body from), on its own ground.

## Prompt (v1)

```text
Draw an animation sprite sheet of the character in the attached image: one base drawing, copied from the attachment, and in every frame only the parts named for that phase move. Everything not named stays exactly the same, pixel for pixel, as in the attachment: the cloak and its hem, the ribbon with its brass medallions, the small dark hand hanging at the cloak's edge, the lantern and the hand holding it, and both boots unless named.

Phases, in frame order:
  frames 1–2: the rest pose, exactly as the attached image.
  frames 3–6: she looks down at the ground in front of her feet. The hood dips forward a little, a few pixels, its outline otherwise the same, and both glowing eyes slide down toward the lower edge of the dark face. Nothing else moves.
  frames 7–18: she plays with her foot, shyly. The hood and eyes stay exactly as in frame 6. Only her right boot moves — the boot on the viewer's left, away from the lantern: frames 7–8 its toe lifts a little off the ground, the heel staying in place; frames 9–10 the toe scuffs out to the side along the ground; frames 11–12 it scuffs back; frames 13–14 out again; frames 15–16 back again; frames 17–18 the toe settles down, the boot exactly as in frame 1. The other boot, the cloak, the ribbon, the lantern and both hands are exactly frame 1.
  frames 19–22: she looks up again: frames 19, 20, 21 and 22 are exactly frames 6, 5, 4 and 3, in that order.
  frames 23–24: the rest pose again, identical to frame 1.
24 frames in total, small even steps, slow in and slow out. Frame 1 is the attached pose; the last frame equals frame 1.

Layout: a regular grid of 3 rows × 8 columns, every cell the same size, generous margins, the figure in the same place in every cell, feet on one baseline.
Ground: flat, untextured grey-blue, the same as the attached image. No titles, labels, frame numbers, arrows or notes anywhere.
Same style, line weight, palette and lighting as the attachment: the sun-embroidered hood, the ribbon with brass medallions, the boots and the lit lantern. No scarf.
```

## What changed, version to version

- **v1** — the wave's v1 prompt refilled for a look down and a foot scuff, with the wave sheet's first cell as the reference (the drawing the body is cut from). One deliberate difference from the template, testing Prompt backlog 1a: the holds are named per phase ("frames 7–18: the hood and eyes stay exactly as in frame 6 … the other boot, the cloak … are exactly frame 1"), and the look up is asked for as named repeats of the look down. Sunburst only (the wave's model finding), four candidates.
  *What 1a showed:* mixed. Candidate 1 held the hood and moved only the eyes, as named; candidate 2 lifted the hood again inside the phase that named it held (6→7); candidates 3 and 4 dipped the hood though the words asked only "a little". The cut takes only the eyes and the boot anyway, so the named holds mattered less than the phases sharing poses at their joins, which is what let one sheet play four ways. Held once; not yet in the template.

## Runs

Appended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.

| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 2026-09-13 04:56 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-045624-1.png` | 24 in 3 rows / 24 | 5084 / 4138 (run) | $0.04 | **pass, subtle** — heights 254–257, rows within 1%, head IoU ≥ 0.983 except the look up's first step (16→17, 0.965). The hood holds and only the eyes lower, eased: 165 → 156 → 149 → 148 → 147 → 145px above the feet over frames 2–7; up again in two ~10px steps (17, 19). The foot lifts rather than scuffs out (visible in 10, 11, 13–16), small at page size. **Approved by Chanté** (2026-09-13, beside candidate 4 at 160 ms: "gif 2 feels smoother") → `art/lumi/lumi-foot-play.png`. **Cut:** only the glance (its eyes) survived review; the scuffs were cut by difference and kept the rest pose's boot under the moving one — the sheet itself moves the boot correctly, so a re-cut that replaces the boot region could still use it. The glance lives on the lantern Lumi's sheet (`public/lumi-idle.webp` row 4); the hands-free body replaced that sheet the same day, so it isn't played |
| 2026-09-13 04:56 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-045624-2.png` | 24 in 3 rows / 24 | 5084 / 4138 (run) | $0.04 | **fail · the look down in one step:** the hood drops 7px at 2→3 (IoU 0.960), then the hood rises again at 6→7 (0.968) inside the phase that holds it |
| 2026-09-13 04:56 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-045624-3.png` | 24 in 3 rows / 24 | 5084 / 4138 (run) | $0.04 | **fail · pop:** 18→19 IoU 0.946 with a 4px shift; she shrinks through the sheet (268 → 254px, rows 0.653 / 0.665 / 0.681) |
| 2026-09-13 04:56 | v1 | gpt-image-2.5-sunburst · high · 1776x896 | `v1-2.5-sunburst-0913-045624-4.png` | 24 in 3 rows / 24 | 5084 / 4138 (run) | $0.04 | **pass, the clearer foot** — heights 262–264 / 259 / 258–261, rows within 1.5%, head IoU ≥ 0.985 through the foot phase, lantern within 2px. The hood dips 5px and the eyes drop to the chin, but mostly in one step (2→3: 167 → 151px, IoU 0.955, then 147, 146); up in three (156, 160, 166). The toe tips up at 7–9 and scuffs out at 10 and 13 (the boot's reach 136 → 150px), settled from 14. Last→first shifts 3px (the cut's align takes it). Shown to Chanté beside candidate 1; recommended |

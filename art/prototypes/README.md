# art/prototypes — throwaway tests of where Lumi's art could go

Nothing here is cut into `public/` or served by the app. Each prototype tests a bet in `docs/art-direction.md` §8 and is kept so the next session can rebuild it rather than start again. What each one showed goes in `docs/art-direction.md` §4a → *Progress*. Generated outputs are gitignored; the scripts rebuild them from the repo.

## `lumi-pieces/` — the pieces (puppet) test, bets 1 and 2

One drawing moved by code, beside today's whole-drawing sprite. Built 2026-09-13 by a subagent from the hands-free hub; published as the artifact [Lumi pieces](https://claude.ai/code/artifact/36d8ad96-7c2c-44f1-b138-a033e27129b1).

- `split.py` — splits `art/lumi/lumi-free-rest.png`: mattes her off the ground, paints the eyes and their glow out of the face, measures the eyes, face outline, neck pivot and head-weight rows into `rig.json`, and writes `body.png` (the figure at 600px) and `sprite.png` (the comparison sprite's breath rows from `public/lumi-idle.webp`).
- `index.src.html` — the page: two stages (today's sprite, the pieces), sizes 36 · 68 · 150 · 300, paper or a dark room, auto idle, and cues (blink, glances, happy, curious, sleepy, tilt). The head moves on a triangle mesh whose weight falls to zero across the bow, so the collar bends instead of tearing; the eyes are drawn in canvas with the measured colours. `build.py` inlines `body.png`, `sprite.png` and `rig.json` into `index.html`, the file that was published.
- `poses.py` — renders ten poses (`poses.png`), the avatar-size heads (`heads.png`) and close-ups, with the page's maths, to check without a browser.

Rebuild, from the repo root: `python3 art/prototypes/lumi-pieces/split.py && python3 art/prototypes/lumi-pieces/build.py && python3 art/prototypes/lumi-pieces/poses.py`.

**Status:** Chanté, 2026-09-13: "I think lumi pieces looks great", and asked for the walk test below. Before that she was open to puppeting "but still want[s] some sway/breathing motion. Don't want totally static" — the page has a breath but no sway yet. Weak spots it names: the hood tilts as one stiff shape, the eyes slide without foreshortening, the lids are straight cuts, and its breath is a little stronger than the sprite's (2px against 1.44px at 150px).

## `lumi-walk/` — the walk test: a rig walking a painted room, bets 2, 4 and 5

Lumi walking Home's painting, rigged in code from two drawings. Built 2026-09-13 after Chanté approved the pieces; published as the artifact [Lumi walks Home](https://claude.ai/code/artifact/ca116dea-7428-46c9-b11a-8f8275a715ee).

- **The drawings:** `art/lumi/lumi-iso-front.png` (toward the lower left) and `lumi-iso-back.png` (away, upper left), generated from the hub and the model sheet's isometric facings (`art/prompts/lumi-iso-*.md`). Each is mirrored for the other side, so four walking directions cost two drawings.
- `split.py` — cuts each into a body and two feet (boot and leg, with a dark leg drawn up under the hem so a step never opens a gap), finds the eyes for blinks and writes `rig-walk.json`; `keep` boxes hold a hand that touches a leg on the body. `debug-split.png` shows each facing whole, tinted by piece, and pulled apart.
- `room-home.json` — Home as a place to walk, in painting px: the walkable floor, each piece of furniture's footprint (for depth and for paths) and its cut-out (laid back over her when she is behind it), and the tour. Measured by eye on 2× zooms; a proposal, not a map.
- `index.src.html` — the page: the rig warps the body row by row in software (bob, squash, sway, lean, the hood's and hem's lag; seamless, and the same in headless Chrome), steps the feet with each boot planted while it carries her, stops, dips and changes drawing at a turn, and finds paths round the furniture on isometric ground coordinates. Click the floor to send her; pace, height, a follow camera and the floor plan for judging. `build.py` inlines the room, pieces and JSON into `index.html`.
- `capture.py` — renders frames headless (`?grid=` steps the tour at a fixed 1/60 s and lays follow-camera cells out in one screenshot) into `out/<name>-grid.png`, a GIF and a strip; `--page` screenshots the whole page. Motion checked without a browser tab.

Rebuild, from the repo root: `python3 art/prototypes/lumi-walk/split.py && python3 art/prototypes/lumi-walk/build.py`, then `python3 art/prototypes/lumi-walk/capture.py --plan --zoom 1.6 --cell 480x320 --step 2.5 --count 20 --cols 5 --start 0 --name tour`.

**Status:** open, awaiting Chanté's eye. What the renders showed before publishing: boots step and hold, the tabletop, lantern and plant cover her behind the table and she covers the cushions in front; a blink first left the painted eyes' rims as orange rings (the lid now takes the rim and glow). Known limits: a turn is a dip and a swap, not an in-between; one room, one tour; nothing in the app plays it.

**Chanté's first look (2026-09-13):** "This is looking great! She's clipping the table, so we'll need to work on our mapping. But she looks awesome!" The rig passed; the map didn't. Two mistakes, both fixed in `room-home.json` and the page: the table's footprint was traced from its legs' feet, but the top overhangs them by ~15px (it is now the tabletop's outline dropped by its 65px height); and the clearance kept her *feet* 11px off a footprint while her cloak reaches ~25px either side (now 24px). Still true after the fix: close behind a low table the tabletop covers most of her, because at this painting's angle a 65px table hides a lot of floor — hand-traced polygons and a bounding-box depth test are the weak part, not the drawings.

## `shadow-mock.py` — Lumi's shadows on the room paintings

The before and after behind *Lumi's shadow is drawn by the page* (`docs/decisions.md`, 2026-09-13): the companion's CSS contact shadow, cast shadow and room light reproduced in numpy on the Today and Library paintings at her spots, beside the baked cream shadow they replaced. Reads the current `public/lumi-free.webp`; the *before* side needs a sheet with the baked shadow in `out/lumi-free-before.webp` (`git show 129c4fe:public/lumi-free.webp > art/prototypes/out/lumi-free-before.webp`). Writes `out/shadow-<room>.png`. Its numbers copy the room variables in `globals.css` by hand — change both.

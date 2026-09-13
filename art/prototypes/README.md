# art/prototypes — throwaway tests of where Lumi's art could go

Nothing here is cut into `public/` or served by the app. Each prototype tests a bet in `docs/art-direction.md` §8 and is kept so the next session can rebuild it rather than start again. What each one showed goes in `docs/art-direction.md` §4a → *Progress*. Generated outputs are gitignored; the scripts rebuild them from the repo.

## `lumi-pieces/` — the pieces (puppet) test, bets 1 and 2

One drawing moved by code, beside today's whole-drawing sprite. Built 2026-09-13 by a subagent from the hands-free hub; published as the artifact [Lumi pieces](https://claude.ai/code/artifact/36d8ad96-7c2c-44f1-b138-a033e27129b1).

- `split.py` — splits `art/lumi/lumi-free-rest.png`: mattes her off the ground, paints the eyes and their glow out of the face, measures the eyes, face outline, neck pivot and head-weight rows into `rig.json`, and writes `body.png` (the figure at 600px) and `sprite.png` (the comparison sprite's breath rows from `public/lumi-idle.webp`).
- `index.src.html` — the page: two stages (today's sprite, the pieces), sizes 36 · 68 · 150 · 300, paper or a dark room, auto idle, and cues (blink, glances, happy, curious, sleepy, tilt). The head moves on a triangle mesh whose weight falls to zero across the bow, so the collar bends instead of tearing; the eyes are drawn in canvas with the measured colours. `build.py` inlines `body.png`, `sprite.png` and `rig.json` into `index.html`, the file that was published.
- `poses.py` — renders ten poses (`poses.png`), the avatar-size heads (`heads.png`) and close-ups, with the page's maths, to check without a browser.

Rebuild, from the repo root: `python3 art/prototypes/lumi-pieces/split.py && python3 art/prototypes/lumi-pieces/build.py && python3 art/prototypes/lumi-pieces/poses.py`.

**Status:** open. Chanté is open to puppeting "but still want[s] some sway/breathing motion. Don't want totally static" — the page has a breath but no sway yet. Weak spots it names: the hood tilts as one stiff shape, the eyes slide without foreshortening, the lids are straight cuts, and its breath is a little stronger than the sprite's (2px against 1.44px at 150px).

## `shadow-mock.py` — Lumi's shadows on the room paintings

The before and after behind *Lumi's shadow is drawn by the page* (`docs/decisions.md`, 2026-09-13): the companion's CSS contact shadow, cast shadow and room light reproduced in numpy on the Today and Library paintings at her spots, beside the baked cream shadow they replaced. Reads the current `public/lumi-free.webp`; the *before* side needs a sheet with the baked shadow in `out/lumi-free-before.webp` (`git show 129c4fe:public/lumi-free.webp > art/prototypes/out/lumi-free-before.webp`). Writes `out/shadow-<room>.png`. Its numbers copy the room variables in `globals.css` by hand — change both.

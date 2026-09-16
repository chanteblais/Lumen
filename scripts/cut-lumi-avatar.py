"""Cut Lumi's portrait into the drawing the round avatar holds.

    python3 scripts/cut-lumi-avatar.py [--preview]

art/lumi/lumi-avatar-head.png (2026-09-15, Chanté) → public/lumi-avatar.webp: the hooded head in the
medallion costume — the sun-embroidered hood, the ribbon with its three brass medallions — drawn once,
with real transparency and no ground. One drawing, not a sheet: the avatar never asked for an
expression, and the six heads it used to draw (`public/lumi-heads.png`, cut from the lantern sheet)
were a different hood from the Lumi standing in the corner (`docs/art-direction.md` §7).

The cell is square and `LumiAvatar` draws it at the circle's full size, so all the framing is here:

- the **hood** — the rows above the ribbon, found as the rows wider than half the drawing's widest —
  is scaled to `HOOD_W` of the cell and its middle put `HEAD_Y` down it, which leaves the bow and its
  medallions running off the bottom, where the circle crops them;
- across, the cell is centred between the hood's middle and the eyes (`EYE_BIAS`): the hood drapes
  well to her left, so centring the hood alone pushes the face into the right of the circle.

`--preview` writes the cut on the forest disc at the three sizes the app draws it (36 · 48 · 68) so
the framing can be judged before it ships.
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'art/lumi/lumi-avatar-head.png')
OUT = os.path.join(ROOT, 'public/lumi-avatar.webp')
PREVIEW = '/tmp/lumi-avatar-preview.png'

CELL = 272        # 4× the 68px the greeting draws it at
HOOD_W = 1.00     # the hood's width as a share of the cell
HEAD_Y = 0.44     # where the hood's middle sits down the cell
EYE_BIAS = 0.35   # how far the centring leans from the hood's middle toward the eyes
ALPHA = 8         # fainter than this is not the drawing
FOREST = (42, 52, 46)  # --forest, the disc behind her
PAPER = (241, 230, 207)


def hood_and_eyes(rgba):
    """The hood's box and the centre of the two lit eyes, in source pixels.

    The ribbon hangs below the hood and its bow is nearly as wide, so the hood is taken as the rows
    wider than half the widest row — below that the drawing is ribbon. The eyes are the brightest
    pixels inside the face's black.
    """
    alpha = rgba[:, :, 3]
    rows = np.where((alpha > ALPHA).any(axis=1))[0]
    widths = np.array([np.count_nonzero(alpha[y] > ALPHA) for y in rows])
    top, bottom = int(rows[0]), int(rows[widths > 0.5 * widths.max()][-1])
    cols = np.where((alpha[top:bottom + 1] > ALPHA).any(axis=0))[0]

    lum = rgba[:, :, :3].astype(np.float32).mean(axis=2)
    face = lum < 60
    ys, xs = np.where((lum > 235) & (alpha > 200))
    band = (ys > top + 0.2 * (bottom - top)) & (ys < bottom)
    ys, xs = ys[band], xs[band]
    # Lit pixels ringed by the face's black are the eyes; the hood's own highlights are not.
    in_face = np.array([face[max(0, y - 40):y + 40, max(0, x - 40):x + 40].mean() > 0.25 for y, x in zip(ys, xs)])
    return (int(cols[0]), top, int(cols[-1]), bottom), (float(xs[in_face].mean()), float(ys[in_face].mean()))


def disc(cell, size):
    """The cut drawn on the forest circle at `size`, the way the page draws it."""
    mask = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (size, size), FOREST + (255,)), (0, 0), mask)
    out.alpha_composite(cell.resize((size, size), Image.LANCZOS))
    out.putalpha(Image.fromarray(np.minimum(np.array(out)[:, :, 3], np.array(mask))))
    return out


def cut(preview=False):
    src = Image.open(SOURCE).convert('RGBA')
    (left, top, right, bottom), (eye_x, eye_y) = hood_and_eyes(np.array(src))

    scale = CELL * HOOD_W / (right - left + 1)
    big = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
    centre = (1 - EYE_BIAS) * (left + right + 1) / 2 + EYE_BIAS * eye_x
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(big, (round(CELL / 2 - centre * scale), round(CELL * HEAD_Y - (top + bottom) / 2 * scale)))
    cell.save(OUT, 'WEBP', quality=92, method=6, exact=True)
    print(f'{os.path.relpath(OUT, ROOT)}  {CELL}×{CELL}  {os.path.getsize(OUT) / 1024:.0f} KB'
          f'  (hood {right - left + 1}×{bottom - top + 1} at {left},{top}; eyes {eye_x:.0f},{eye_y:.0f})')

    if preview:
        sizes = (36, 48, 68)
        pad = gap = 16
        strip = Image.new('RGBA', (pad * 2 + sum(sizes) + gap * (len(sizes) - 1), pad * 2 + max(sizes)), PAPER + (255,))
        x = pad
        for size in sizes:
            strip.alpha_composite(disc(cell, size), (x, pad + max(sizes) - size))
            x += size + gap
        strip.resize((strip.width * 3, strip.height * 3), Image.LANCZOS).save(PREVIEW)
        print(f'preview → {PREVIEW}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', action='store_true', help='also write the disc preview at 36 · 48 · 68px')
    cut(**vars(ap.parse_args()))

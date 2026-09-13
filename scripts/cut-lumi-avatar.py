#!/usr/bin/env python3
"""Cut Lumi's chat avatar from art/lumi/avatar.png.

The painting is a round medallion (forest ground, brass rim) on white paper.
The cut keeps the medallion and nothing outside it: it finds the rim's outer
edge, squares the disc (the generator drew it a touch wider than tall,
1166 x 1138), and masks it to a circle set a hair inside the rim so no white
fringe survives. The mask is antialiased by drawing it at 4x and downsampling.

  python3 scripts/cut-lumi-avatar.py

writes public/lumi-avatar.webp (256px square, transparent outside the circle),
enough for the largest avatar (68px) at 3x.
"""
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'lumi', 'avatar.png')
OUT = os.path.join(ROOT, 'public', 'lumi-avatar.webp')
SIZE = 256
# Crop this far inside the rim's outer edge, as a fraction of the radius: past
# the antialiased pixels where the brass meets the white, so the circle is
# solid painting right to its edge (no pale fringe, no transparent sliver).
INSET = 0.005


def disc_bounds(rgb: np.ndarray) -> tuple[int, int, int, int]:
    """The medallion's extent, read along the middle row and column only, so
    nothing else on the paper can widen it."""
    ink = rgb.max(axis=2) < 200
    h, w = ink.shape
    row = np.nonzero(ink[h // 2])[0]
    col = np.nonzero(ink[:, w // 2])[0]
    return int(row.min()), int(col.min()), int(row.max()) + 1, int(col.max()) + 1


def main() -> None:
    im = Image.open(SRC).convert('RGB')
    left, top, right, bottom = disc_bounds(np.asarray(im))
    print(f'disc: x {left}..{right} ({right - left}px), y {top}..{bottom} ({bottom - top}px)')

    disc = im.crop((left, top, right, bottom)).resize((SIZE, SIZE), Image.LANCZOS)

    big = SIZE * 4
    pad = big / 2 * INSET
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).ellipse((pad, pad, big - pad, big - pad), fill=255)
    mask = mask.resize((SIZE, SIZE), Image.LANCZOS)

    out = disc.convert('RGBA')
    out.putalpha(mask)
    out.save(OUT, 'WEBP', quality=90, method=6)
    print(f'wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) / 1024:.0f} KB)')


if __name__ == '__main__':
    main()

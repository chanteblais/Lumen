"""Cut Chanté's painted nav rail into the three pieces the page stretches.

    python3 scripts/cut-nav-rail.py

Reads art/ui/nav-rail.png (1024x1536: the rail painted on a checkerboard drawn into the pixels, so
no real transparency) and writes, into public/:
- nav-rail-head.webp: the chamfered top, the compass star and the spark below it;
- nav-rail-body.webp: the plain length between, which the page stretches to the rail's height;
- nav-rail-foot.webp: the spark, the moon and the chamfered bottom.

The rail is keyed off the checkerboard by darkness (its green is about 37,38,17; the checker is light
grey): solid between each row's darkest extents, a soft edge from luminance in the ring just outside
them, and the edge pixels recoloured to the rail's green so no grey fringe survives. If the painting
changes, re-measure the crop and the two slice rows and keep the numbers in globals.css (.nav-rail,
.nav-toggle, .nav-mark: the source is 118px wide, the head 267px, the foot 236px, the star's centre
110.5px down, the right-hand rule 108.5px across) in step.
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'ui', 'nav-rail.png')
OUT = os.path.join(ROOT, 'public')

X0, X1 = 453, 571        # the rail's columns: 118px
Y0, Y1 = 33, 1487        # its rows, with a pixel of edge at either end
HEAD, FOOT = 300, 1251   # below the star's spark and its line; above the moon's spark
GREEN = np.array([37, 38, 17], dtype=float)
GROUND = 185             # luminance at or above this is the checkerboard


def dilate(mask, r):
    out = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


def main():
    img = np.asarray(Image.open(SRC).convert('RGB')).astype(float)[Y0:Y1, X0:X1]
    lum = img @ np.array([0.299, 0.587, 0.114])
    dark = lum < 100

    solid = np.zeros_like(dark)
    for y in range(dark.shape[0]):
        xs = np.flatnonzero(dark[y])
        if len(xs) > 2:
            solid[y, xs[0] + 1 : xs[-1]] = True

    soft = np.clip((GROUND - lum) / (GROUND - 40), 0, 1)
    alpha = np.where(solid, 1.0, np.where(dilate(solid, 2), soft, 0.0))
    rgb = np.where((alpha < 1)[..., None], GREEN, img)
    rgba = np.dstack([rgb, alpha * 255]).round().clip(0, 255).astype(np.uint8)

    pieces = {
        'nav-rail-head.webp': rgba[: HEAD - Y0],
        'nav-rail-body.webp': rgba[HEAD - Y0 : FOOT - Y0],
        'nav-rail-foot.webp': rgba[FOOT - Y0 :],
    }
    for name, arr in pieces.items():
        path = os.path.join(OUT, name)
        Image.fromarray(arr, 'RGBA').save(path, 'WEBP', quality=90, alpha_quality=100, method=6)
        print(f'{name}: {arr.shape[1]}x{arr.shape[0]}, {os.path.getsize(path) // 1024} KB')


if __name__ == '__main__':
    main()

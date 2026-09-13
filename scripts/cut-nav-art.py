"""Cut Chanté's painted nav pieces into what the page stretches.

    python3 scripts/cut-nav-art.py

Both sources in art/ui/ are painted on a checkerboard drawn into the pixels (no real transparency), so each
piece is keyed off it and cut into a head and a foot that keep their proportions and a body between them
that the page stretches to any height:

- art/ui/nav-rail.png → public/nav-rail-{head,body,foot}.webp. Keyed by darkness: the rail's green
  (about 37,38,17) against the light-grey checker. Kept at the source's 118px width; the numbers in
  globals.css (.nav-rail, .nav-toggle, .nav-mark) are its pixels: 118 wide, a 267px head, a 236px foot, the
  star's centre 110.5px down, the right-hand rule 108.5px across.
- art/ui/nav-parchment.png → public/nav-parchment-{head,body,foot}.webp. Keyed by saturation: the warm paper
  and its brown edge against the neutral checker. Resized to 384px wide (twice the 192px it's shown at);
  the head and foot are 67px each at that width, the corner flourishes inside them (.nav-panel::before).

Each: solid between each row's extents of the piece, a soft edge from the key in the ring just outside
them, and the edge pixels recoloured to the piece's rim so no grey fringe survives. If a painting changes,
re-measure its crop and slice rows and keep the numbers in globals.css in step.
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PIECES = [
    dict(
        name='nav-rail',
        crop=(453, 33, 571, 1487),  # x0, y0, x1, y1: the rail with a pixel of edge
        head=300, foot=1251,        # source rows: below the star's spark; above the moon's spark
        key='dark', rim=(37, 38, 17),
        width=None,
    ),
    dict(
        name='nav-parchment',
        crop=(121, 19, 761, 1745),  # the sheet with a pixel of edge
        head=130, foot=1633,        # source rows: below the top corner flourishes; above the bottom ones
        key='warm', rim=(110, 76, 34),
        width=384,
    ),
]


def dilate(mask, r):
    out = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


def key(img, kind):
    """(inside, soft alpha) for one piece: inside is a clear hit, soft the ramp for its edge."""
    if kind == 'dark':
        lum = img @ np.array([0.299, 0.587, 0.114])
        return lum < 100, np.clip((185 - lum) / 145, 0, 1)
    sat = img.max(-1) - img.min(-1)
    return sat > 30, np.clip((sat - 4) / 36, 0, 1)


def cut(p):
    x0, y0, x1, y1 = p['crop']
    img = np.asarray(Image.open(os.path.join(ROOT, 'art', 'ui', p['name'] + '.png')).convert('RGB')).astype(float)
    img = img[y0:y1, x0:x1]
    hit, soft = key(img, p['key'])

    solid = np.zeros_like(hit)
    for y in range(hit.shape[0]):
        xs = np.flatnonzero(hit[y])
        if len(xs) > 2:
            solid[y, xs[0] + 1 : xs[-1]] = True

    alpha = np.where(solid, 1.0, np.where(dilate(solid, 2), soft, 0.0))
    rgb = np.where((alpha < 1)[..., None], np.array(p['rim'], dtype=float), img)
    sheet = Image.fromarray(np.dstack([rgb, alpha * 255]).round().clip(0, 255).astype(np.uint8), 'RGBA')

    head, foot = p['head'] - y0, p['foot'] - y0
    if p['width']:
        k = p['width'] / sheet.width
        sheet = sheet.resize((p['width'], round(sheet.height * k)), Image.LANCZOS)
        head, foot = round(head * k), sheet.height - round((sheet.height / k - foot) * k)

    arr = np.asarray(sheet)
    for part, rows in (('head', arr[:head]), ('body', arr[head:foot]), ('foot', arr[foot:])):
        path = os.path.join(ROOT, 'public', f"{p['name']}-{part}.webp")
        Image.fromarray(rows, 'RGBA').save(path, 'WEBP', quality=90, alpha_quality=100, method=6)
        print(f"{p['name']}-{part}.webp: {rows.shape[1]}x{rows.shape[0]}, {os.path.getsize(path) // 1024} KB")


if __name__ == '__main__':
    for piece in PIECES:
        cut(piece)

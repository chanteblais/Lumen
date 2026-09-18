"""Cut Lumi's portrait into the avatar beside her lines.

    python3 scripts/cut-lumi-avatar.py [--preview]

art/lumi/lumi-avatar-head.png (2026-09-15, Chanté) → public/lumi-avatar.webp: the hooded head in the
medallion costume — the sun-embroidered hood, the ribbon with its three brass medallions — drawn once,
with real transparency and no ground. One drawing, not a sheet: the avatar has no expressions. It
replaces Chanté's painted medallion (`art/lumi/avatar.png`, 2026-09-13 to 09-18) and before that the
lantern sheet's heads, which were a different hood from the Lumi in the corner (`docs/art-direction.md` §7).

**Just her head, no background** (2026-09-18, Chanté's ask, as in `art/mockups/chat-mockup.png`): the
whole drawing — hood, ribbon and medallions — trimmed to its own extent and fitted inside a square cell
(`FILL` of it on its longer side), centred, on transparency. `LumiAvatar` draws the cell at its size with
nothing behind it, so the page (paper or a painted room) shows around her. (Until then this script cut the
painted medallion to its circle; that version is in git history.)

`--preview` writes the cut at the three sizes the app draws it (36 · 48 · 68) on the paper and on a dark
room tone, so it can be judged on both before it ships.
"""
import argparse
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'art/lumi/lumi-avatar-head.png')
OUT = os.path.join(ROOT, 'public/lumi-avatar.webp')
PREVIEW = '/tmp/lumi-avatar-preview.png'

CELL = 272        # 4× the 68px the greeting draws it at
FILL = 0.98       # the drawing's longer side as a share of the cell
ALPHA = 8         # fainter than this is not the drawing
PAPER = (241, 230, 207)
ROOM = (58, 42, 28)   # a lamplit room's dark, for the preview


def cut(preview=False):
    src = Image.open(SOURCE).convert('RGBA')
    alpha = np.array(src)[:, :, 3]
    ys, xs = np.where(alpha > ALPHA)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    drawing = src.crop(box)
    scale = CELL * FILL / max(drawing.size)
    drawing = drawing.resize((round(drawing.width * scale), round(drawing.height * scale)), Image.LANCZOS)
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(drawing, ((CELL - drawing.width) // 2, (CELL - drawing.height) // 2))
    cell.save(OUT, 'WEBP', quality=92, method=6, exact=True)
    print(f'{os.path.relpath(OUT, ROOT)}  {CELL}×{CELL}  {os.path.getsize(OUT) / 1024:.0f} KB'
          f'  (the drawing {box[2] - box[0]}×{box[3] - box[1]} at {box[0]},{box[1]} → {drawing.width}×{drawing.height})')

    if preview:
        sizes = (36, 48, 68)
        pad = gap = 16
        w = pad * 2 + sum(sizes) + gap * (len(sizes) - 1)
        strip = Image.new('RGBA', (w, (pad * 2 + max(sizes)) * 2), PAPER + (255,))
        strip.paste(ROOM + (255,), (0, pad * 2 + max(sizes), w, strip.height))
        for band in range(2):
            x = pad
            for size in sizes:
                strip.alpha_composite(cell.resize((size, size), Image.LANCZOS), (x, band * (pad * 2 + max(sizes)) + pad + max(sizes) - size))
                x += size + gap
        strip.resize((strip.width * 3, strip.height * 3), Image.LANCZOS).save(PREVIEW)
        print(f'preview → {PREVIEW}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', action='store_true', help='also write a preview at 36 · 48 · 68px on paper and on a dark room')
    cut(**vars(ap.parse_args()))

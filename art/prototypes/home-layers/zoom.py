"""Crop a region of an image, scale it up and rule a coordinate grid on it, for tracing by eye.

    python3 art/prototypes/home-layers/zoom.py x0 y0 x1 y1 [--scale 2] [--grid 20] [--src PATH] [--name NAME] [--poly FILE]

Writes out/zoom-<name>.png. Grid lines every --grid painting px (labels every 5th line). --src defaults to the Home
painting. --poly draws the layers' masks and footprints from out/masks.json over it.
"""
import json
import os
import sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


x0, y0, x1, y1 = (int(v) for v in sys.argv[1:5])
k = float(arg('--scale', 2))
g = int(arg('--grid', 20))
src = arg('--src', os.path.join(ROOT, 'art/scenery/home/background.png'))
name = arg('--name', f'{x0}-{y0}')
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
d = ImageDraw.Draw(im, 'RGBA')
for x in range((x0 // g + 1) * g, x1, g):
    major = x % (g * 5) == 0
    d.line([((x - x0) * k, 0), ((x - x0) * k, im.height)], fill=(0, 255, 255, 150 if major else 55), width=1)
    if major: d.text(((x - x0) * k + 2, 2), str(x), fill=(0, 255, 255, 255))
for y in range((y0 // g + 1) * g, y1, g):
    major = y % (g * 5) == 0
    d.line([(0, (y - y0) * k), (im.width, (y - y0) * k)], fill=(0, 255, 255, 150 if major else 55), width=1)
    if major: d.text((2, (y - y0) * k + 2), str(y), fill=(0, 255, 255, 255))
if '--poly' in sys.argv:
    spec = json.load(open(arg('--poly', '')))
    for L in spec['layers']:
        for key, col in (('mask', (255, 60, 200, 255)), ('footprint', (255, 255, 0, 255)), ('split', (0, 255, 0, 255))):
            p = L.get(key)
            if p:
                pts = [((a - x0) * k, (b - y0) * k) for a, b in p]
                d.line(pts + ([pts[0]] if key != 'split' else []), fill=col, width=2)
out = os.path.join(HERE, 'out', f'zoom-{name}.png')
im.save(out)
print(out, im.size)

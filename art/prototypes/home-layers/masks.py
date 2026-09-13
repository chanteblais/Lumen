"""Draw room.src.json's hand-traced polygons on the painting, to check them by eye.

    python3 art/prototypes/home-layers/masks.py [--zoom x0,y0,x1,y1,scale] [--src PATH]

Writes out/masks.png (the whole painting: masks magenta, bodies yellow, foliage green, footprints cyan, extents
white, anchors red, the floor dashed) and, with --zoom, out/masks-zoom.png. --src draws on another image (the plate).
"""
import json
import os
import sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def draw(im, room, k=1.0, ox=0, oy=0):
    d = ImageDraw.Draw(im, 'RGBA')
    P = lambda poly: [((x - ox) * k, (y - oy) * k) for x, y in poly]
    w = max(1, round(k))
    d.line(P(room['floor'] + room['floor'][:1]), fill=(255, 244, 214, 200), width=w)
    for b in room['blockers']:
        d.line(P(b['footprint'] + b['footprint'][:1]), fill=(255, 120, 0, 255), width=w)
    for L in room['layers']:
        d.line(P(L['mask'] + L['mask'][:1]), fill=(255, 60, 200, 255), width=w)
        for poly in L['body']:
            d.line(P(poly + poly[:1]), fill=(255, 235, 0, 255), width=w)
        for poly in L['foliage']:
            d.line(P(poly + poly[:1]), fill=(60, 255, 90, 255), width=w)
        d.line(P(L['footprint'] + L['footprint'][:1]), fill=(0, 230, 255, 255), width=w + 1)
        if L.get('extent'):
            d.line(P(L['extent'] + L['extent'][:1]), fill=(255, 255, 255, 200), width=w)
        for name, (x, y) in L['anchors'].items():
            (px, py), = P([(x, y)])
            d.ellipse([px - 3 * w, py - 3 * w, px + 3 * w, py + 3 * w], fill=(255, 40, 40, 255))
    return im


room = json.load(open(os.path.join(HERE, 'room.src.json')))
src = arg('--src', os.path.join(ROOT, room['painting']))
base = Image.open(src).convert('RGB')
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
draw(base.copy(), room).save(os.path.join(HERE, 'out', 'masks.png'))
print('wrote out/masks.png')
if '--zoom' in sys.argv:
    x0, y0, x1, y1, k = (float(v) for v in arg('--zoom').split(','))
    crop = base.crop((int(x0), int(y0), int(x1), int(y1)))
    crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS)
    name = f'masks-zoom-{int(x0)}-{int(y0)}.png'
    draw(crop, room, k, x0, y0).save(os.path.join(HERE, 'out', name))
    print('wrote out/' + name)

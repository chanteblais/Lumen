"""Compose the room with Lumi at a few points and cut zoomed close-ups — to judge an edge pixel by pixel.

    python3 art/prototypes/home-layers/look.py <set>:<index>[,...] | <x>,<y> ... [--k 5] [--box 90x150] [--name look]

A point is `table:8` (a frame of out/sweeps.json, 1-based) or `797,555`. Each close-up is three panels side by side:
the painting, the room composed with Lumi (plate, shadows, the layers not over her, Lumi, the layers over her, in depth
order — close enough to the page's sort to judge an edge), and the layers alone over magenta. Writes out/<name>.png.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
SCENE = os.path.join(ROOT, 'art', 'scenery', 'home')
sys.path.insert(0, HERE)
import depth  # noqa: E402


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


k = int(arg('--k', 5))
bw, bh = (int(v) for v in arg('--box', '90x150').split('x'))
name = arg('--name', 'look')
room = json.load(open(os.path.join(SCENE, 'layers.json')))
depth.MARGIN = room['depth'].get('margin', 0)
sweeps = json.load(open(os.path.join(HERE, 'out', 'sweeps.json')))
orig = np.array(Image.open(os.path.join(SCENE, room['painting'])).convert('RGB')).astype(float)
H, W = orig.shape[:2]
base = np.array(Image.open(os.path.join(SCENE, room['plate'])).convert('RGB')).astype(float)
for L in room['layers']:
    if L['shadow']:
        s = np.array(Image.open(os.path.join(SCENE, L['shadow']['src'])))[:, :, 3] / 255
        x, y = L['shadow']['offset']
        base[y:y + s.shape[0], x:x + s.shape[1]] *= (1 - s)[:, :, None]
full = {}
for L in room['layers']:
    im = np.array(Image.open(os.path.join(SCENE, L['src']))).astype(float)
    x, y = L['offset']
    c = np.zeros((H, W, 4))
    c[y:y + im.shape[0], x:x + im.shape[1]] = im
    full[L['id']] = c
still = Image.open(os.path.join(HERE, 'out', 'lumi-still.png'))
meta = json.load(open(os.path.join(HERE, 'out', 'lumi-still.json')))
sc = meta['scale']
lumi = np.array(still.resize((round(still.width / sc), round(still.height / sc)), Image.LANCZOS)).astype(float)
fx0, fy0 = meta['feet'][0] / sc, meta['feet'][1] / sc


def over(img, rgba):
    a = rgba[:, :, 3:4] / 255
    return img * (1 - a) + rgba[:, :, :3] * a


points = []
for tok in [t for t in sys.argv[1:] if not t.startswith('--') and sys.argv[sys.argv.index(t) - 1] not in ('--k', '--box', '--name')]:
    for part in tok.split(' '):
        if ':' in part:
            s, i = part.split(':')
            p = sweeps[s][int(i) - 1]
            points.append((f'{s} {i}', p['x'], p['y']))
        else:
            x, y = (int(v) for v in part.split(','))
            points.append((f'{x},{y}', x, y))

rows = []
for label, px, py in points:
    comp = base.copy()
    ids = room['depth']['order']
    front = [i for i in ids if depth.draws_over(next(L['extent'] or L['footprint'] for L in room['layers'] if L['id'] == i), px, py)]
    for i in ids:
        if i not in front:
            comp = over(comp, full[i])
    ox, oy = round(px - fx0), round(py - fy0)
    lay = np.zeros((H, W, 4))
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(H, oy + lumi.shape[0]), min(W, ox + lumi.shape[1])
    lay[y0:y1, x0:x1] = lumi[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    comp = over(comp, lay)
    for i in ids:
        if i in front:
            comp = over(comp, full[i])
    alone = np.full((H, W, 3), (255.0, 0, 255))
    for i in ids:
        alone = over(alone, full[i])
    box = (int(px - bw / 2), int(py - bh + 20), int(px + bw / 2), int(py + 20))
    panels = [Image.fromarray(np.clip(z, 0, 255).astype(np.uint8)).crop(box).resize((bw * k, bh * k), Image.NEAREST) for z in (orig, comp, alone)]
    row = Image.new('RGB', (bw * k * 3 + 8, bh * k), (0, 0, 0))
    for n, p in enumerate(panels):
        row.paste(p, (n * (bw * k + 4), 0))
    rows.append(row)
    print(label, (px, py), 'over her:', front, 'box', box)
out = Image.new('RGB', (rows[0].width, sum(r.height + 4 for r in rows)), (0, 0, 0))
yy = 0
for r in rows:
    out.paste(r, (0, yy))
    yy += r.height + 4
out.save(os.path.join(HERE, 'out', f'{name}.png'))
print(f'wrote out/{name}.png', out.size)

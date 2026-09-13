"""Walk Lumi in 8px steps just behind and beside each piece and count fringe pixels drawn over her.

    python3 art/prototypes/home-layers/sweep.py [--tag after] [--ref <commit> --margin 0 --tag before]

--ref counts the layers as committed at <commit> (writing out/sweeps-<commit>.json instead); --margin sets the depth
rule's margin for the run (0 was the rule before corners got one).

For each piece: points every 8px along its ground polygon grown by her clearance and 4px more (for the balustrade,
along the floor's front edge 4px in), kept where she can stand and where she is behind the piece or beside it (not
in front, where nothing is drawn over her). For each frame, the pixels of her stand-in (alpha > 0.5, at room scale)
that a layer drawn over her (depth.draws_over) covers with alpha > 0.1 where that layer's pixel is floor-coloured
(fringe.py). Writes out/sweeps.json (the points, with each frame's count, for build.py and capture.py --set) and
prints the totals per piece; --tag also appends them to out/sweep-totals.jsonl.
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import depth  # noqa: E402
import fringe  # noqa: E402

STEP = 8
REF = sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else None   # count the layers as committed there
MARGIN = float(sys.argv[sys.argv.index('--margin') + 1]) if '--margin' in sys.argv else None   # the depth margin to use
if MARGIN is not None:
    depth.MARGIN = MARGIN
room, orig, solid, fol, anyitem, alpha = fringe.load_room(REF)
floor, minus = room['walkable']['floor'], [m['poly'] for m in room['walkable']['minus']]
walk = lambda x, y: depth.walkable(x, y, floor, minus)
layers = room['layers']
flmap = {L['id']: fringe.floor_like(orig, alpha[L['id']], solid[L['id']], fol[L['id']], anyitem)[0] for L in layers}

still = Image.open(os.path.join(HERE, 'out', 'lumi-still.png'))
meta = json.load(open(os.path.join(HERE, 'out', 'lumi-still.json')))
k = meta['scale']
small = np.array(still.resize((round(still.width / k), round(still.height / k)), Image.LANCZOS))[:, :, 3] > 127
fx0, fy0 = meta['feet'][0] / k, meta['feet'][1] / k
H, W = alpha[layers[0]['id']].shape


def walk_poly(poly, closed=True):
    pts = poly + (poly[:1] if closed else [])
    out, carry = [], 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        L = math.hypot(x2 - x1, y2 - y1)
        t = carry
        while t < L:
            out.append((x1 + (x2 - x1) * t / L, y1 + (y2 - y1) * t / L))
            t += STEP
        carry = t - L
    return out


def outward(poly, d):
    cx, cy = sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)
    return [[x + (x - cx) / max(math.hypot(x - cx, y - cy), 1) * d, y + (y - cy) / max(math.hypot(x - cx, y - cy), 1) * d * 0.57] for x, y in poly]


def count(x, y):
    m = small
    ox, oy = round(x - fx0), round(y - fy0)
    ys, xs = np.where(m)
    ys, xs = ys + oy, xs + ox
    ok = (ys >= 0) & (ys < H) & (xs >= 0) & (xs < W)
    ys, xs = ys[ok], xs[ok]
    n, cover, over = 0, 0, []
    for L in layers:
        if depth.draws_over(L['extent'] or L['footprint'], x, y):
            a = alpha[L['id']][ys, xs] > 0.1
            if a.any():
                over.append(L['id'])
            cover += int(a.sum())
            n += int((a & flmap[L['id']][ys, xs]).sum())
    return n, cover, over


sweeps, totals = {}, {}
for L in layers:
    g = L['extent'] or L['footprint']
    gx0, gx1 = min(p[0] for p in g), max(p[0] for p in g)
    if L['id'] == 'balustrade':
        cands = [(x, y - 4) for x, y in walk_poly([[267, 690], [460, 790], [640, 880], [853, 945]], closed=False)]
    else:
        cands = []
        for hull in depth.grow(g):
            cands += walk_poly(outward(hull, 4))
        # where the floor stops short of the grown footprint (the desk and chair by the left wall), its own edge, 5px in
        gy0, gy1 = min(p[1] for p in g), max(p[1] for p in g)
        for x, y in walk_poly(floor):
            if gx0 - depth.REACH <= x <= gx1 + depth.REACH and gy0 - 150 <= y <= gy1 + 20:
                inward = [(x + dx, y + dy) for dx, dy in ((5, 0), (-5, 0), (0, 5), (0, -5), (4, 3), (-4, 3), (4, -3), (-4, -3))]
                cands += [p for p in inward if walk(*p)][:1]
    pts = []
    for x, y in cands:
        x, y = round(x), round(y)
        if not walk(x, y):
            continue
        behind = depth.draws_over(g, x, y)
        beside = x < gx0 or x > gx1
        if behind or beside:
            n, cover, over = count(x, y)
            pts.append({'label': f"{L['id']} {len(pts) + 1}", 'x': x, 'y': y, 'fringe': n, 'covered': cover, 'over': over})
    sweeps[L['id']] = pts
    totals[L['id']] = {'frames': len(pts), 'fringe': sum(p['fringe'] for p in pts), 'framesWithFringe': sum(1 for p in pts if p['fringe'])}
    print(f"{L['id']:14s} {len(pts):3d} frames, fringe px over her {totals[L['id']]['fringe']:5d} in {totals[L['id']]['framesWithFringe']} frames")
json.dump(sweeps, open(os.path.join(HERE, 'out', f'sweeps-{REF}.json' if REF else 'sweeps.json'), 'w'))
if '--tag' in sys.argv:
    with open(os.path.join(HERE, 'out', 'sweep-totals.jsonl'), 'a') as fh:
        fh.write(json.dumps({'tag': sys.argv[sys.argv.index('--tag') + 1], 'totals': totals}) + '\n')

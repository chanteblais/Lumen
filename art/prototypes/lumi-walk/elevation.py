"""Measure how far above the floor a drawing's camera sits, against the room's — the angle gate for new facings.

    python3 art/prototypes/lumi-walk/elevation.py                        # the rig's s and n drawings
    python3 art/prototypes/lumi-walk/elevation.py --candidates <dir>     # generated candidates (a facing-you or facing-away view)

Chanté, 2026-09-13: the drawings' angle is "a little steeper than Home's" (they were generated from the model
sheet's isometric facings, which read steep). The hem of her cloak is close to a circle on the ground, so on a
facing-you or facing-away drawing the front hem curve is half an ellipse whose squash is sin(elevation): the sag
from the hem at the cloak's sides to the hem at its middle, over half the cloak's width. The room's elevation
comes from its ground axes: in `room-home.json` the rug's and table's edges run `iso.slope` px down per px
across, and for a ground grid turned 45° that slope is sin(elevation) too. Home: 0.57 → 35°. A candidate passes
within GATE degrees of the room.
"""
import glob
import json
import math
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
ROOM = json.load(open(os.path.join(HERE, 'room-home.json')))
ROOM_DEG = math.degrees(math.asin(ROOM['iso']['slope']))
GATE = 6.0


def elevation(rgba):
    """Camera elevation in degrees from the front hem's squash, for a view facing straight toward or away."""
    a = rgba[:, :, 3] > 200
    rgb = rgba[:, :, :3].astype(int)
    lum = rgb.mean(axis=2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    cloth = a & ((lum > 165) | ((r > 180) & (r - b > 80) & (g > 70)))
    cloth = ndi.binary_opening(cloth, iterations=2)
    ys = np.where(a.any(axis=1))[0]
    top, feet = ys.min(), ys.max()
    fh = feet - top
    # the cloak's widest rows are just above the hem; take the hem as the lowest cloth per column over the lower half
    lower = np.zeros_like(cloth)
    lower[top + fh // 2:] = True
    cl = cloth & lower
    cols = np.where(cl.any(axis=0))[0]
    hem = np.array([np.where(cl[:, x])[0].max() for x in cols], float)
    hem = ndi.median_filter(hem, size=9)
    w = cols.max() - cols.min()
    # sides: the hem in the outer 12% of the width each side; middle: its lowest point in the central 30%
    k = max(3, int(0.12 * w))
    sides = np.median(np.concatenate([hem[:k], hem[-k:]]))
    mid = hem[int(0.35 * len(hem)):int(0.65 * len(hem))].max()
    squash = (mid - sides) / (w / 2)
    return math.degrees(math.asin(max(0.0, min(1.0, squash)))), squash


if '--candidates' in sys.argv:
    from lumi_cut import Sheet
    folder = sys.argv[sys.argv.index('--candidates') + 1].rstrip('/')
    print(f'room {ROOM_DEG:.1f}° (slope {ROOM["iso"]["slope"]}); gate ± {GATE}°')
    for path in sorted(glob.glob(os.path.join(folder, 'v*.png'))):
        if any(s in path for s in ('-aligned', '-motion', 'ref-')):
            continue
        sh = Sheet(path, glow=False, shadow=False)
        rows = sh.rows()
        rgba, main = sh.matte(sh.frames(rows[0][0], rows[-1][1], 1)[0])
        deg, sq = elevation(rgba)
        print(f"  {os.path.basename(path)}: hem squash {sq:.3f} → camera {deg:5.1f}°  {'pass' if abs(deg - ROOM_DEG) <= GATE else 'fail'}")
    sys.exit(0)

print(f'room {ROOM_DEG:.1f}° above the floor (slope {ROOM["iso"]["slope"]})')
for n in ('s', 'n'):
    p = os.path.join(HERE, 'parts', f'{n}-body.png')
    if not os.path.exists(p):
        continue
    deg, sq = elevation(np.array(Image.open(p).convert('RGBA')))
    print(f'{n}: hem squash {sq:.3f} → camera {deg:5.1f}° ({deg - ROOM_DEG:+.1f}° against the room)')

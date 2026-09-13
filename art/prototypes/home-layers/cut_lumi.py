"""A stand-in Lumi for the layers viewer: the facing-you drawing matted with scripts/lumi_cut.py, at twice her room height.

    python3 art/prototypes/home-layers/cut_lumi.py

Writes out/lumi-still.png (straight alpha, hood top to feet = 2 × lumi.height px) and out/lumi-still.json (her feet
point in that image, and the scale to draw it at).
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from lumi_cut import Sheet, scale  # noqa: E402

SUPER = 2
height = json.load(open(os.path.join(HERE, 'room.src.json')))['lumi']['height']
sheet = Sheet(os.path.join(ROOT, 'art', 'lumi', 'lumi-iso-s.png'), glow=False, shadow=False)
rows = sheet.rows()
bbox = sheet.frames(rows[0][0], rows[-1][1], 1)[0]
rgba, main = sheet.matte(bbox)
ys = np.where(main.any(axis=1))[0]
rgba, main = scale(rgba, main, SUPER * height / (ys.max() - ys.min()))
a = rgba[:, :, 3] > 0
yy, xx = np.where(a)
rgba, main = rgba[yy.min():yy.max() + 1, xx.min():xx.max() + 1], main[yy.min():yy.max() + 1, xx.min():xx.max() + 1]
ys, xs = np.where(main)
feet_y = int(ys.max())
low = main[feet_y - max(3, int(0.04 * (feet_y - ys.min()))):feet_y + 1]
feet_x = float(np.where(low)[1].mean())
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
Image.fromarray(rgba).save(os.path.join(HERE, 'out', 'lumi-still.png'))
json.dump({'feet': [round(feet_x, 1), feet_y + 0.5], 'scale': SUPER}, open(os.path.join(HERE, 'out', 'lumi-still.json'), 'w'))
print('out/lumi-still.png', rgba.shape[1], 'x', rgba.shape[0], 'feet', round(feet_x, 1), feet_y)

"""Cut public/lumi-idle.webp from art/lumi-slow-idle.png.

    python3 scripts/cut-lumi-idle.py

Each figure is matted by flood-filling paper from *outside* the figure, so the
cream hood (which is close to the paper colour) is never eaten. The soft
shadow under the feet is kept. Frames are centred on the figure and anchored
on the feet baseline: the sheet's own frame spacing wobbles by a few px, so
preserving it read as a sideways slide. Rows: breath open/half/shut eyes,
then sway likewise; the blink row's half-shut and shut eyes are pasted onto
every frame, aligned by the face.
"""
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art/lumi-slow-idle.png')
OUT = os.path.join(ROOT, 'public/lumi-idle.webp')
W, H = 144, 208
FEET_Y = 200          # feet baseline inside the cell
TOL = 45              # paper tolerance for the flood fill

src = np.array(Image.open(SRC).convert('RGB')).astype(int)
paper = np.median(src[590:610, 90:110].reshape(-1, 3), axis=0)
d_all = np.abs(src - paper).sum(axis=2)
lum = src.mean(axis=2)

BANDS = {'breath': (168, 362), 'blink': (440, 620), 'sway': (695, 885)}

def frames(band):
    y0, y1 = BANDS[band]
    m = d_all[y0:y1, 200:1285] > 60
    on = m.sum(axis=0) > 3
    segs, s = [], None
    for i, v in enumerate(on):
        if v and s is None: s = i
        if not v and s is not None: segs.append((s + 200, i + 200)); s = None
    if s is not None: segs.append((s + 200, len(on) + 200))
    out = []
    for x0, x1 in [sg for sg in segs if sg[1] - sg[0] > 40]:
        rows = np.where(m[:, x0 - 200:x1 - 200].sum(axis=1) > 2)[0]
        out.append((x0, x1, rows[0] + y0, rows[-1] + y0))
    assert len(out) == 9, (band, out)
    return out

def cut(bbox):
    """One figure as an RGBA 144x208 cell, centred on x, feet on FEET_Y."""
    x0, x1, y0, y1 = bbox
    X0, X1, Y0, Y1 = x0 - 5, x1 + 5, y0 - 8, y1 + 12
    rgb = src[Y0:Y1, X0:X1]
    d = d_all[Y0:Y1, X0:X1]
    l = lum[Y0:Y1, X0:X1]
    cand = d < TOL
    lab, n = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    outside = np.isin(lab, list(border))
    inside = ~outside
    # tidy: drop specks not connected to the main figure
    il, k = ndi.label(inside)
    sizes = ndi.sum(inside, il, range(1, k + 1))
    inside = il == (1 + int(np.argmax(sizes)))
    outside = ~inside
    alpha = np.where(inside, 255.0, 0.0)
    # soft shadow under the feet: darker-than-paper, neutral pixels outside the figure
    feet = np.where(inside.any(axis=1))[0].max()
    shadow_zone = outside.copy(); shadow_zone[:feet - 14] = False
    dark = np.clip((paper.mean() - l) - 6, 0, None) * 4.5
    chroma = (rgb.max(axis=2) - rgb.min(axis=2))
    alpha = np.where(shadow_zone & (chroma < 40), np.clip(dark, 0, 170), alpha)
    # feather the 1px edge with the pixel's distance from paper
    ring = inside & ~ndi.binary_erosion(inside)
    alpha = np.where(ring, np.clip(d / 50, 0.4, 1) * 255, alpha)
    cell = np.zeros((H, W, 4), dtype=np.uint8)
    ys, xs = np.where(inside)
    cx = (xs.min() + xs.max()) / 2
    ox = int(round(W / 2 - cx)); oy = FEET_Y - ys.max()
    rgba = np.dstack([rgb, alpha]).astype(np.uint8)
    h, w = rgba.shape[:2]
    # paste with clipping
    sy0, sx0 = max(0, -oy), max(0, -ox)
    ty0, tx0 = max(0, oy), max(0, ox)
    hh, ww = min(h - sy0, H - ty0), min(w - sx0, W - tx0)
    cell[ty0:ty0 + hh, tx0:tx0 + ww] = rgba[sy0:sy0 + hh, sx0:sx0 + ww]
    return cell

def face(cell):
    dark = (cell[:, :, :3].sum(axis=2) < 150) & (cell[:, :, 3] > 200)
    filled = ndi.binary_fill_holes(dark)
    fl, k = ndi.label(filled)
    sizes = ndi.sum(filled, fl, range(1, k + 1))
    filled = fl == (1 + int(np.argmax(sizes)))
    ys, xs = np.where(filled)
    return filled, dark, ((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2)

def with_eyes(target, donor):
    """Copy the donor's eye area onto the target, aligned by the face."""
    tf, td, tc = face(target); df, dd, dc = face(donor)
    def eye_rect(f, dk, c):
        ys, xs = np.where(f & ~dk)
        return (xs.min() - c[0], ys.min() - c[1], xs.max() - c[0], ys.max() - c[1])
    a, b = eye_rect(tf, td, tc), eye_rect(df, dd, dc)
    rx0, ry0 = min(a[0], b[0]) - 4, min(a[1], b[1]) - 4
    rx1, ry1 = max(a[2], b[2]) + 4, max(a[3], b[3]) + 4
    out = target.copy()
    oy, ox = int(round(tc[1] - dc[1])), int(round(tc[0] - dc[0]))  # donor -> target shift
    for dy in range(int(dc[1] + ry0), int(dc[1] + ry1) + 2):
        for dx in range(int(dc[0] + rx0), int(dc[0] + rx1) + 2):
            ty, tx = dy + oy, dx + ox
            if tf[ty, tx] and df[dy, dx]:
                out[ty, tx] = donor[dy, dx]
    return out

breath = [cut(b) for b in frames('breath')]
sway = [cut(b) for b in frames('sway')]
blink = frames('blink')
half, shut = cut(blink[2]), cut(blink[3])

sheet = np.zeros((H * 6, W * 9, 4), dtype=np.uint8)
for r, cells in enumerate([breath, [with_eyes(c, half) for c in breath], [with_eyes(c, shut) for c in breath],
                           sway, [with_eyes(c, half) for c in sway], [with_eyes(c, shut) for c in sway]]):
    for c, cell in enumerate(cells):
        sheet[r * H:(r + 1) * H, c * W:(c + 1) * W] = cell

Image.fromarray(sheet, 'RGBA').save(OUT, quality=90, method=6)
print('wrote', OUT, os.path.getsize(OUT), 'bytes')

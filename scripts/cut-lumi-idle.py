"""Cut public/lumi-idle.webp from the idle mockup sheets.

    python3 scripts/cut-lumi-idle.py

Sources:
- mockups/lumi-slow-idle.png — the breath loop (nine frames), the blink row,
  and the sway loop (nine frames).
- mockups/lumi-playful-foot.png — the playful-foot loop (eight frames, the
  top row of the sheet). Drawn about a fifth larger than the slow-idle sheet,
  so it is scaled down until her hood top and chin land where the breath
  loop's do; the kicked-up specks of dirt are kept.

Each figure is matted by flood-filling paper from *outside* the figure, so the
cream hood (which is close to the paper colour) is never eaten. The soft
shadow under the feet is kept. Frames are centred on the figure and anchored
on the feet baseline: the sheet's own frame spacing wobbles by a few px, so
preserving it read as a sideways slide. The foot frames are then settled
sideways on the head silhouette — frame 0 onto the breath rest pose, the rest
onto frame 0 — because the head holds still while the foot kicks. (Centring
them on the dark face instead had her hop ~14px on every hand-over, since her
face sits right of her hood's centre, and wander a few px through the kick as
the face read differently frame to frame.)

Output rows, each loop with open / half-shut / shut eyes (the blink row's
half-shut and shut eyes are pasted onto every frame, aligned by the face):
breath ×3, sway ×3, foot ×3. Nine columns; the foot rows leave the last empty.
"""
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/lumi-idle.webp')
W, H = 144, 208
COLS = 9
FEET_Y = 200          # feet baseline inside the cell
TOL = 45              # paper tolerance for the flood fill
FOOT_SCALE = 0.81     # playful-foot sheet → slow-idle sheet: hood top 26 / chin 118 vs the breath loop's 27 / 119
HEAD_ROWS = 122       # cell rows above this are hood + face — the part of her that holds still


class Sheet:
    def __init__(self, name, paper_box):
        self.src = np.array(Image.open(os.path.join(ROOT, 'mockups', name)).convert('RGB')).astype(int)
        (y0, y1), (x0, x1) = paper_box
        self.paper = np.median(self.src[y0:y1, x0:x1].reshape(-1, 3), axis=0)
        self.d_all = np.abs(self.src - self.paper).sum(axis=2)
        self.lum = self.src.mean(axis=2)

    def frames(self, y0, y1, x0, x1, expect):
        """Bounding boxes of the figures in one row of the sheet."""
        m = self.d_all[y0:y1, x0:x1] > 60
        on = m.sum(axis=0) > 3
        segs, s = [], None
        for i, v in enumerate(on):
            if v and s is None: s = i
            if not v and s is not None: segs.append((s + x0, i + x0)); s = None
        if s is not None: segs.append((s + x0, len(on) + x0))
        out = []
        for a, b in [sg for sg in segs if sg[1] - sg[0] > 40]:
            rows = np.where(m[:, a - x0:b - x0].sum(axis=1) > 2)[0]
            out.append((a, b, rows[0] + y0, rows[-1] + y0))
        assert len(out) == expect, (y0, out)
        return out

    def matte(self, bbox, specks=False):
        """One figure as straight-alpha RGBA plus the mask of its main body."""
        x0, x1, y0, y1 = bbox
        X0, X1, Y0, Y1 = x0 - 5, x1 + 5, y0 - 8, y1 + 12
        rgb = self.src[Y0:Y1, X0:X1]
        d = self.d_all[Y0:Y1, X0:X1]
        l = self.lum[Y0:Y1, X0:X1]
        cand = d < TOL
        lab, n = ndi.label(cand)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        border.discard(0)
        outside = np.isin(lab, list(border))
        inside = ~outside
        # tidy: drop specks not connected to the main figure (or, for the foot
        # loop, keep the kicked-up dirt — anything below the knees that is more
        # than a few pixels)
        il, k = ndi.label(inside)
        sizes = ndi.sum(inside, il, range(1, k + 1))
        main = il == (1 + int(np.argmax(sizes)))
        if specks:
            feet = np.where(main.any(axis=1))[0].max()
            keep = main.copy()
            for i in range(1, k + 1):
                comp = il == i
                if sizes[i - 1] >= 6 and np.where(comp.any(axis=1))[0].min() > feet - 30:
                    keep |= comp
            inside = keep
        else:
            inside = main
        outside = ~inside
        alpha = np.where(inside, 255.0, 0.0)
        # soft shadow under the feet: darker-than-paper, neutral pixels outside the figure
        feet = np.where(main.any(axis=1))[0].max()
        shadow_zone = outside.copy(); shadow_zone[:feet - 14] = False
        dark = np.clip((self.paper.mean() - l) - 6, 0, None) * 4.5
        chroma = (rgb.max(axis=2) - rgb.min(axis=2))
        alpha = np.where(shadow_zone & (chroma < 40), np.clip(dark, 0, 170), alpha)
        # feather the 1px edge with the pixel's distance from paper
        ring = inside & ~ndi.binary_erosion(inside)
        alpha = np.where(ring, np.clip(d / 50, 0.4, 1) * 255, alpha)
        return np.dstack([rgb, alpha]).astype(np.uint8), main


def scale(rgba, main, s):
    if s == 1: return rgba, main
    h, w = rgba.shape[:2]
    size = (int(round(w * s)), int(round(h * s)))
    rgba = np.array(Image.fromarray(rgba, 'RGBA').resize(size, Image.LANCZOS))
    main = np.array(Image.fromarray(main.astype(np.uint8) * 255, 'L').resize(size, Image.BILINEAR)) > 127
    return rgba, main


def place(rgba, main, cx):
    """Paste into a W×H cell with the main body's feet on FEET_Y and `cx` at the centre."""
    cell = np.zeros((H, W, 4), dtype=np.uint8)
    ys = np.where(main.any(axis=1))[0]
    ox = int(round(W / 2 - cx)); oy = FEET_Y - ys.max()
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


def cut(sheet, bbox):
    """Breath / sway: the figure centred on its own width."""
    rgba, main = sheet.matte(bbox)
    xs = np.where(main.any(axis=0))[0]
    return place(rgba, main, (xs.min() + xs.max()) / 2)


def cut_foot(sheet, bbox):
    """Playful foot: scaled to size, the dirt kept, centred on the figure like the rest (then settled)."""
    rgba, main = scale(*sheet.matte(bbox, specks=True), FOOT_SCALE)
    xs = np.where(main.any(axis=0))[0]
    return place(rgba, main, (xs.min() + xs.max()) / 2)


def head(cell):
    """Silhouette of the hood and face."""
    m = cell[:, :, 3] > 127
    m[HEAD_ROWS:] = False
    return m


def nudge(cell, dx):
    """The cell moved `dx` px sideways (its margins are empty, so nothing is lost)."""
    out = np.zeros_like(cell)
    if dx >= 0: out[:, dx:] = cell[:, :W - dx]
    else: out[:, :W + dx] = cell[:, -dx:]
    return out


def settle(cell, ref, reach=12):
    """Slide `cell` sideways so its head silhouette best overlaps `ref`'s."""
    r, c = head(ref), head(cell)
    dx = max(range(-reach, reach + 1), key=lambda d: (np.roll(c, d, axis=1) & r).sum())
    return nudge(cell, dx)


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


slow = Sheet('lumi-slow-idle.png', ((590, 610), (90, 110)))
breath = [cut(slow, b) for b in slow.frames(168, 362, 200, 1285, 9)]
sway = [cut(slow, b) for b in slow.frames(695, 885, 200, 1285, 9)]
blink = slow.frames(440, 620, 200, 1285, 9)
half, shut = cut(slow, blink[2]), cut(slow, blink[3])

playful = Sheet('lumi-playful-foot.png', ((440, 460), (40, 60)))
foot = [cut_foot(playful, b) for b in playful.frames(165, 400, 170, 1500, 8)]
# The head holds still while the foot kicks: settle frame 0 onto the breath
# rest pose (so the hand-over doesn't step sideways), then the rest onto frame 0.
foot[0] = settle(foot[0], breath[0])
foot[1:] = [settle(c, foot[0]) for c in foot[1:]]

loops = [breath, sway, foot]
sheet = np.zeros((H * 3 * len(loops), W * COLS, 4), dtype=np.uint8)
r = 0
for cells in loops:
    for eyes in [cells, [with_eyes(c, half) for c in cells], [with_eyes(c, shut) for c in cells]]:
        for c, cell in enumerate(eyes):
            sheet[r * H:(r + 1) * H, c * W:(c + 1) * W] = cell
        r += 1

Image.fromarray(sheet, 'RGBA').save(OUT, quality=90, method=6)
print('wrote', OUT, sheet.shape[1], 'x', sheet.shape[0], os.path.getsize(OUT), 'bytes')

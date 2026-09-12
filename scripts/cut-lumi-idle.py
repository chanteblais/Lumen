"""Cut public/lumi-idle.webp from the idle sheets in art/.

    python3 scripts/cut-lumi-idle.py

Sources:
- art/lumi-slow-idle.png — the breath loop (nine frames), the blink row,
  and the sway loop (nine frames).
- art/lumi-idle-foot.png — the playful foot with a glance: 24 in-betweened
  frames (three rows of eight) of one drawing on a flat grey-blue ground.
  Row 1: rest, then the head turns a little toward the foot she is about to
  kick with (frames 3–7; frame 8 is a stray rest frame, unused). Row 2: the
  kick, head held turned — drawn ~3.5% smaller than the other rows, so each
  row is scaled on its own until the figure stands as tall as the breath rest
  frame. Row 3: eight rest frames — the turn back was not drawn, so the loop
  plays the glance in reverse instead. The sheet keeps the fifteen unique
  cells (FOOT_CELLS); the order they play in, forward then back, lives with
  the other loops in LumiSprite (LUMI_LOOP_CELLS).

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
breath ×3, sway ×3, foot ×3. Fifteen columns (the most cells in a loop);
shorter loops leave their trailing columns empty.
"""
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/lumi-idle.webp')
W, H = 144, 208
COLS = 15             # the most cells in a loop
FEET_Y = 200          # feet baseline inside the cell
TOL = 45              # paper tolerance for the flood fill
# The foot sheet's cells, as (row, column): rest and the glance in (row 1,
# frames 1–7), then the kick (row 2). Cell 6 is the last glance frame; the
# kick holds its head, and the way back replays cells 6..1 (LumiSprite).
FOOT_CELLS = [(0, c) for c in range(7)] + [(1, c) for c in range(8)]
HEAD_ROWS = 122       # cell rows above this are hood + face — the part of her that holds still
SHADOW_RGB = (228, 218, 204)  # the slow-idle sheet's shadow tone; applied to every sheet so shadows match


class Sheet:
    def __init__(self, name, paper_box, contrast=False):
        """`contrast`: the ground is far from the figure's colours (the foot sheet's grey-blue), so
        edge pixels are de-matted against it and its shadow is read by darkness, not by distance."""
        self.contrast = contrast
        self.src = np.array(Image.open(os.path.join(ROOT, 'art', name)).convert('RGB')).astype(int)
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
        chroma = (rgb.max(axis=2) - rgb.min(axis=2))

        def flood(cand):
            lab, n = ndi.label(cand)
            border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
            border.discard(0)
            inside = ~np.isin(lab, list(border))
            il, k = ndi.label(inside)
            sizes = ndi.sum(inside, il, range(1, k + 1))
            return inside, il, k, sizes, il == (1 + int(np.argmax(sizes)))

        cand = d < TOL
        inside, il, k, sizes, main = flood(cand)
        if self.contrast:
            # On a contrasting ground the soft shadow is too far from paper to
            # flood as paper, so it lands inside the figure, opaque and cold.
            # Hand the darker, colourless pixels below the feet back to the ground.
            # (the shadow is the ground darkened, so it keeps the ground's blue
            # cast: b > r. Her feet and the dirt are warm, so they stay.)
            feet = np.where(main.any(axis=1))[0].max()
            below = np.zeros_like(cand); below[feet - 14:] = True
            cool = rgb[:, :, 2] > rgb[:, :, 0]
            cand |= below & cool & (chroma < 40) & (l < self.paper.mean()) & (d < 170)
            inside, il, k, sizes, main = flood(cand)
        # tidy: drop specks not connected to the main figure (or, for the foot
        # loop, keep the kicked-up dirt — anything below the knees that is more
        # than a few pixels)
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
        # soft shadow under the feet: darker-than-paper, neutral pixels outside
        # the figure, drawn in one warm tone whatever the sheet's ground (the
        # foot sheet's is grey-blue, and its shadow came out cold)
        feet = np.where(main.any(axis=1))[0].max()
        shadow_zone = outside.copy(); shadow_zone[:feet - 14] = False
        dark = np.clip((self.paper.mean() - l) - 6, 0, None) * 4.5
        shadow = shadow_zone & (chroma < 40) & (dark > 0)
        alpha = np.where(shadow, np.clip(dark, 0, 170), alpha)
        rgb = np.where(shadow[:, :, None], SHADOW_RGB, rgb)
        if self.contrast:
            # De-matte the 2px edge band against the known ground — otherwise
            # the anti-aliased edge keeps a grey-blue fringe. Each edge pixel's
            # own colour is taken to be that of the nearest interior pixel, so
            # its coverage is how far it has moved from paper toward that,
            # whether the edge there is cream hood or dark boot.
            interior = ndi.binary_erosion(inside, iterations=2)
            band = inside & ~interior
            iy, ix = ndi.distance_transform_edt(~interior, return_indices=True)[1]
            own = rgb[iy, ix]
            full = np.maximum(np.abs(own - self.paper).sum(axis=2), 1)
            a = np.clip(d / full, 0, 1)[:, :, None]
            clean = np.clip((rgb - (1 - a) * self.paper) / np.maximum(a, 0.05), 0, 255)
            rgb = np.where(band[:, :, None], clean, rgb)
            alpha = np.where(band, a[:, :, 0] * 255, alpha)
        else:
            # feather the 1px edge with the pixel's distance from paper
            ring = inside & ~ndi.binary_erosion(inside)
            alpha = np.where(ring, np.clip(d / 50, 0.4, 1) * 255, alpha)
        return np.dstack([rgb, alpha]).astype(np.uint8), main


def scale(rgba, main, s):
    """Resize with premultiplied alpha, so the edge doesn't pick up a dark halo from the transparent black outside."""
    if s == 1: return rgba, main
    h, w = rgba.shape[:2]
    size = (int(round(w * s)), int(round(h * s)))
    a = rgba[:, :, 3:4].astype(float) / 255
    pre = np.dstack([rgba[:, :, :3] * a, rgba[:, :, 3:4]]).astype(np.float32)
    out = np.dstack([np.array(Image.fromarray(pre[:, :, i]).resize(size, Image.LANCZOS)) for i in range(4)])
    a2 = np.clip(out[:, :, 3:4], 0, 255)
    rgb = np.clip(out[:, :, :3] / np.maximum(a2 / 255, 1e-3), 0, 255)
    rgba = np.dstack([rgb, a2]).astype(np.uint8)
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


def cut_foot(sheet, bbox, s):
    """Playful foot: scaled by `s`, the dirt kept, centred on the figure like the rest (then settled)."""
    rgba, main = scale(*sheet.matte(bbox, specks=True), s)
    xs = np.where(main.any(axis=0))[0]
    return place(rgba, main, (xs.min() + xs.max()) / 2)


def figure_height(sheet, bbox, specks=False):
    """Hood top to feet of the main body (the shadow and dirt excluded)."""
    _, main = sheet.matte(bbox, specks)
    ys = np.where(main.any(axis=1))[0]
    return ys.max() - ys.min()


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


def soft_head(cell):
    """Alpha of the hood and face, 0–1."""
    a = cell[:, :, 3].astype(float) / 255
    a[HEAD_ROWS:] = 0
    return a


def shift(cell, dx, dy):
    """The cell moved by a fractional (dx, dy): cubic resampling on premultiplied channels."""
    a = cell[:, :, 3:4].astype(float) / 255
    pre = np.dstack([cell[:, :, :3] * a, cell[:, :, 3:4].astype(float)])
    out = np.dstack([ndi.shift(pre[:, :, i], (dy, dx), order=3, mode='constant') for i in range(4)])
    a2 = np.clip(out[:, :, 3:4], 0, 255)
    rgb = np.clip(out[:, :, :3] / np.maximum(a2 / 255, 1e-3), 0, 255)
    return np.dstack([rgb, a2]).astype(np.uint8)


def settle(cell, ref, reach=12, fine=1.0, step=0.25):
    """Move `cell` so its head silhouette best overlaps `ref`'s: whole pixels sideways
    first, then a quarter-pixel refinement in both axes (a frame that sits half a
    pixel off its neighbour doubles the hood's edge under the crossfade)."""
    r, c = head(ref), head(cell)
    dx = max(range(-reach, reach + 1), key=lambda d: (np.roll(c, d, axis=1) & r).sum())
    cell = nudge(cell, dx)
    rs, cs = soft_head(ref), soft_head(cell)
    steps = np.arange(-fine, fine + step / 2, step)
    score = lambda fx, fy: (lambda s: np.minimum(s, rs).sum() / np.maximum(s, rs).sum())(ndi.shift(cs, (fy, fx), order=1))
    fx, fy = max(((fx, fy) for fx in steps for fy in steps), key=lambda p: score(*p))
    return cell if fx == 0 and fy == 0 else shift(cell, fx, fy)


def hold_head(cells, donor, top=112, bottom=124):
    """An animation hold: every frame keeps the donor's head — the breath rest
    frame's, so the head is the same drawing on both sides of the hand-over and
    through the loop. (The foot sheet is one drawing with only the foot moving,
    but the generator still redrew the hood rim and its sun a little each frame,
    and its hood is not quite the slow-idle sheet's: under the crossfade both
    read as a soft shimmer or a small head turn.) Blended in over the collar
    rows (`top`..`bottom`) on premultiplied channels, so the seam sits under the
    chin, inside the figure, above the ribbon; the cloak below keeps its own
    movement, which the kick carries all the way up to the collar."""
    def pre(c):
        a = c[:, :, 3:4].astype(float) / 255
        return np.dstack([c[:, :, :3] * a, c[:, :, 3:4].astype(float)])
    def straight(p):
        a = np.clip(p[:, :, 3:4], 0, 255)
        return np.dstack([np.clip(p[:, :, :3] / np.maximum(a / 255, 1e-3), 0, 255), a]).astype(np.uint8)
    w = np.clip((np.arange(H) - top) / (bottom - top), 0, 1)[:, None, None]  # 0 = the donor's head, 1 = the frame's own
    p0 = pre(donor)
    return [straight((1 - w) * p0 + w * pre(c)) for c in cells]


def with_eyes(target, donor):
    """Copy the donor's eye area onto the target, aligned on the eyes themselves
    (the glance slides them within the face, so the face's centre is no guide)."""
    tf, td, _ = face(target); df, dd, _ = face(donor)
    def eyes(f, dk):
        ys, xs = np.where(f & ~dk)
        return (xs.mean(), ys.mean()), (xs.min(), ys.min(), xs.max(), ys.max())
    tc, ta = eyes(tf, td); dc, da = eyes(df, dd)
    rel = lambda r, c: (r[0] - c[0], r[1] - c[1], r[2] - c[0], r[3] - c[1])
    a, b = rel(ta, tc), rel(da, dc)
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

playful = Sheet('lumi-idle-foot.png', ((5, 25), (5, 25)), contrast=True)
rows = [playful.frames(y0, y1, 0, 1774, 8) for y0, y1 in ((40, 315), (320, 590), (595, 870))]
# Each row scaled on its own so the figure stands as tall as the breath rest
# frame (the kick row is drawn ~3.5% smaller than the others).
rest_h = figure_height(slow, slow.frames(168, 362, 200, 1285, 9)[0])
scales = [rest_h / np.median([figure_height(playful, b, specks=True) for b in row]) for row in rows]
print('foot row scales', [round(s, 3) for s in scales])
foot = [cut_foot(playful, rows[r][c], scales[r]) for r, c in FOOT_CELLS]
# Settle cell 0 onto the breath rest pose (so the hand-over doesn't step
# sideways), then every other cell onto cell 0. Then the holds: the second rest
# cell keeps cell 0's head; the kick keeps the last glance frame's turned head,
# so the head is one drawing from the end of the glance in to its start back.
foot[0] = settle(foot[0], breath[0])
foot[1:] = [settle(c, foot[0]) for c in foot[1:]]
foot[1] = hold_head([foot[1]], foot[0])[0]
foot[7:] = hold_head(foot[7:], foot[6])

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

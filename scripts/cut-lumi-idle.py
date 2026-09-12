"""Cut public/lumi-idle.webp from the idle sheets in art/.

    python3 scripts/cut-lumi-idle.py

Sources:
- art/lumi-slow-idle.png — the breath loop (nine frames), the blink row,
  and the sway loop (nine frames).
- art/lumi-idle.png — the playful-foot loop: sixteen in-betweened frames
  (two rows of eight) of one drawing where only the foot and the kicked-up
  dirt move, on a flat grey-blue ground. Drawn larger than the slow-idle
  sheet, so it is scaled down until her hood top and chin land where the
  breath loop's do. The sheet is two scuffs with a full return to rest in the
  middle (frame 8) — FOOT_ORDER takes frames 1–7 and 10–16 so the cut is one
  eased kick out and back, fourteen frames.

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
breath ×3, sway ×3, foot ×3. Fourteen columns (the longest loop); shorter
loops leave their trailing columns empty.
"""
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/lumi-idle.webp')
W, H = 144, 208
COLS = 14             # the longest loop
FEET_Y = 200          # feet baseline inside the cell
TOL = 45              # paper tolerance for the flood fill
FOOT_SCALE = 0.71     # foot sheet → slow-idle sheet: hood top 27 / hood x 18–127 vs the breath loop's 27 / 17–126
FOOT_ORDER = [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15]  # sheet frames (0-based) → one kick out and back
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

playful = Sheet('lumi-idle.png', ((5, 25), (5, 25)), contrast=True)
boxes = playful.frames(140, 410, 0, 1774, 8) + playful.frames(490, 760, 0, 1774, 8)
foot = [cut_foot(playful, boxes[i]) for i in FOOT_ORDER]
# The head holds still while the foot kicks: settle frame 0 onto the breath
# rest pose (so the hand-over doesn't step sideways), then the rest onto frame 0.
foot[0] = settle(foot[0], breath[0])
foot[1:] = [settle(c, foot[0]) for c in foot[1:]]
foot = hold_head(foot, breath[0])

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

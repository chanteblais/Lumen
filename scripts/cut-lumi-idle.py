"""Cut Lumi's sprites from art/lumi/lumi-lantern-idle.png.

    python3 scripts/cut-lumi-idle.py [--debug <dir>]

Writes public/lumi-idle.webp (the corner companion's body) and
public/lumi-heads.png (the chat avatar's six heads).

The sheet (2026-09-12, the lantern character) is sixteen cells in two rows of
eight — but they are sixteen *drawings*, not in-betweens: the head silhouette
changes by 4–17% at every step (measure-lumi-sheet.py), so played in sequence
they would boil the way the first foot sheet did. Only the rest cell (row 1,
frame 1) is cut for the body. Her idle life is made from that one drawing:

- breath: nine cells, the figure stretched up to 2px at the hood top with the
  feet held (cubic resample on premultiplied channels, anchored on the feet
  baseline) — the 1–2px rise the slow-idle sheet drew, from one drawing, so
  nothing else moves;
- blink: half-shut and shut eyes drawn by bringing a lid down over her own
  eyes (the sheet has no blink row) — the lid is the face's own black, the
  bottom of each eye stays as a thin bright lens.

The heads come from six of the cells: neutral (1), blink (1 with the eyes
shut), happy (6), curious (11, a glance to the side), excited (12, the
lantern raised), sleepy (7, lowered lids).

Matte: paper is flood-filled from *outside* the figure (so the cream hood is
never eaten); on this contrasting grey-blue ground the 2px edge band is
de-matted against the ground, the shadow under the feet is read by its blue
cast and redrawn in the warm tone the cream sheets had, and the lantern's
light on the ground — a warm blend of the ground and an orange light — is
lifted off as a translucent warm glow, so on the paper she lights it a little.

Output: public/lumi-idle.webp is 9 columns × 3 rows of 160×208 cells (open /
half-shut / shut eyes); public/lumi-heads.png is one row of six 176px squares,
the hood 172px wide with its bottom on row 161 like the earlier cut.
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'lumi', 'lumi-lantern-idle.png')
OUT_BODY = os.path.join(ROOT, 'public', 'lumi-idle.webp')
OUT_HEADS = os.path.join(ROOT, 'public', 'lumi-heads.png')
DEBUG = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None

W, H = 160, 208       # body cell (wider than the earlier 144: the lantern's light pools on the ground beside her)
FEET_Y = 200          # feet baseline inside the cell
FIGURE_H = 173        # hood top to feet, px — what the earlier breath rest frame stood at, so she keeps her size on the page
TOL = 45              # ground tolerance for the flood fill
GROUND_BOX = ((5, 25), (5, 25))
ROWS = ((151, 393), (444, 687))   # y-range of each row of cells (the sheet also carries a title, numbers and notes)
COLS = 8
REST = (0, 0)
BREATH_FRAMES = 9
BREATH_RISE = 2.0     # px at the hood top, at the top of the breath
HEAD_CELL = 176
HEAD_W, HEAD_BOTTOM = 172, 161   # hood width and its bottom row inside the head cell
HEADS = [('neutral', (0, 0), 'open'), ('blink', (0, 0), 'shut'), ('happy', (0, 5), 'open'),
         ('curious', (1, 2), 'open'), ('excited', (1, 3), 'open'), ('sleepy', (0, 6), 'open')]
SHADOW_RGB = (228, 218, 204)   # the cream sheets' shadow tone
GLOW_RGB = (240, 190, 130)     # the light the ground pool is a blend of (ground → this)
GLOW_MAX = 0.55                # its alpha at the brightest


class Sheet:
    def __init__(self, path, ground_box):
        self.src = np.array(Image.open(path).convert('RGB')).astype(int)
        (y0, y1), (x0, x1) = ground_box
        self.paper = np.median(self.src[y0:y1, x0:x1].reshape(-1, 3), axis=0)
        self.d_all = np.abs(self.src - self.paper).sum(axis=2)
        self.lum = self.src.mean(axis=2)

    def frames(self, y0, y1, expect):
        """Bounding boxes of the figures in one row of the sheet."""
        m = self.d_all[y0:y1] > 60
        on = m.sum(axis=0) > 3
        segs, s = [], None
        for i, v in enumerate(on):
            if v and s is None: s = i
            if not v and s is not None: segs.append((s, i)); s = None
        if s is not None: segs.append((s, len(on)))
        out = []
        for a, b in [sg for sg in segs if sg[1] - sg[0] > 40]:
            rows = np.where(m[:, a:b].sum(axis=1) > 2)[0]
            out.append((a, b, rows[0] + y0, rows[-1] + y0))
        assert len(out) == expect, (y0, out)
        return out

    def cell(self, row, col):
        return self.frames(*ROWS[row], COLS)[col]

    def matte(self, bbox):
        """One figure as straight-alpha RGBA plus the mask of its main body."""
        x0, x1, y0, y1 = bbox
        X0, X1, Y0, Y1 = x0 - 8, x1 + 8, y0 - 8, y1 + 12
        rgb = self.src[Y0:Y1, X0:X1]
        d = self.d_all[Y0:Y1, X0:X1]
        l = self.lum[Y0:Y1, X0:X1]
        chroma = rgb.max(axis=2) - rgb.min(axis=2)
        ground_l = self.paper.mean()

        def flood(cand):
            lab, n = ndi.label(cand)
            border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
            border.discard(0)
            inside = ~np.isin(lab, list(border))
            il, k = ndi.label(inside)
            sizes = ndi.sum(inside, il, range(1, k + 1))
            return inside, il == (1 + int(np.argmax(sizes)))

        cand = d < TOL
        inside, main = flood(cand)
        feet = np.where(main.any(axis=1))[0].max()
        below = np.zeros_like(cand); below[feet - 14:] = True
        # The soft shadow is the ground darkened, so it keeps the ground's blue
        # cast (b > r); the lantern's pool of light is the ground warmed (r > b)
        # and brighter. Both are ground for the flood — otherwise they land
        # inside the figure, opaque — and are drawn back below.
        shadow = below & (rgb[:, :, 2] > rgb[:, :, 0]) & (chroma < 40) & (l < ground_l) & (d < 170)
        glow = below & (rgb[:, :, 0] > rgb[:, :, 2] + 12) & (l > ground_l + 3) & (l < 200)
        inside, main = flood(cand | shadow | glow)
        outside = ~inside
        alpha = np.where(inside, 255.0, 0.0)
        # shadow, in one warm tone whatever the sheet's ground
        dark = np.clip((ground_l - l) - 6, 0, None) * 4.5
        sh = outside & below & (chroma < 40) & (dark > 0)
        alpha = np.where(sh, np.clip(dark, 0, 170), alpha)
        rgb = np.where(sh[:, :, None], SHADOW_RGB, rgb)
        # the lantern's light on the ground, as a translucent warm glow
        gl = outside & glow & ~sh
        a_glow = np.clip((l - ground_l) / 110, 0, GLOW_MAX)
        alpha = np.where(gl, a_glow * 255, alpha)
        rgb = np.where(gl[:, :, None], GLOW_RGB, rgb)
        # De-matte the 2px edge band against the known ground — otherwise the
        # anti-aliased edge keeps a grey-blue fringe. Each edge pixel's own
        # colour is taken to be that of the nearest interior pixel, so its
        # coverage is how far it has moved from ground toward that.
        interior = ndi.binary_erosion(inside, iterations=2)
        band = inside & ~interior
        iy, ix = ndi.distance_transform_edt(~interior, return_indices=True)[1]
        own = rgb[iy, ix]
        full = np.maximum(np.abs(own - self.paper).sum(axis=2), 1)
        a = np.clip(d / full, 0, 1)[:, :, None]
        clean = np.clip((rgb - (1 - a) * self.paper) / np.maximum(a, 0.05), 0, 255)
        rgb = np.where(band[:, :, None], clean, rgb)
        alpha = np.where(band, a[:, :, 0] * 255, alpha)
        return np.dstack([rgb, alpha]).astype(np.uint8), main


def premul(c):
    a = c[:, :, 3:4].astype(float) / 255
    return np.dstack([c[:, :, :3] * a, c[:, :, 3:4].astype(float)])


def straight(p):
    a = np.clip(p[:, :, 3:4], 0, 255)
    return np.dstack([np.clip(p[:, :, :3] / np.maximum(a / 255, 1e-3), 0, 255), a]).astype(np.uint8)


def scale(rgba, main, s):
    """Resize on premultiplied alpha, so the edge doesn't pick up a dark halo from the transparent black outside."""
    if s == 1: return rgba, main
    h, w = rgba.shape[:2]
    size = (int(round(w * s)), int(round(h * s)))
    pre = premul(rgba).astype(np.float32)
    out = np.dstack([np.array(Image.fromarray(pre[:, :, i]).resize(size, Image.LANCZOS)) for i in range(4)])
    main = np.array(Image.fromarray(main.astype(np.uint8) * 255, 'L').resize(size, Image.BILINEAR)) > 127
    return straight(out), main


def place(rgba, main, w, h, feet_y, cx=None):
    """Paste into a w×h cell with the main body's feet on `feet_y` and the body (or `cx`) centred."""
    cell = np.zeros((h, w, 4), dtype=np.uint8)
    ys, xs = np.where(main)
    if cx is None: cx = (xs.min() + xs.max()) / 2
    ox = int(round(w / 2 - cx)); oy = feet_y - ys.max()
    hh, ww = rgba.shape[:2]
    sy0, sx0 = max(0, -oy), max(0, -ox)
    ty0, tx0 = max(0, oy), max(0, ox)
    hh, ww = min(hh - sy0, h - ty0), min(ww - sx0, w - tx0)
    cell[ty0:ty0 + hh, tx0:tx0 + ww] = rgba[sy0:sy0 + hh, sx0:sx0 + ww]
    return cell


def face(cell):
    """Mask of the dark face (holes filled, so the eyes are inside it) and of its dark pixels alone."""
    dark = (cell[:, :, :3].sum(axis=2) < 150) & (cell[:, :, 3] > 200)
    filled = ndi.binary_fill_holes(dark)
    fl, k = ndi.label(filled)
    sizes = ndi.sum(filled, fl, range(1, k + 1))
    return fl == (1 + int(np.argmax(sizes))), dark


def eyes_shut(cell, keep):
    """The cell with a lid drawn down over each eye, leaving the bottom `keep` of it
    (0.5 half-shut, 0.2 shut). The lid is the face's own black; the row it
    stops on is blended half and half, so the lid edge is not a jagged line."""
    filled, dark = face(cell)
    eyes = filled & ~dark
    lab, k = ndi.label(eyes)
    sizes = ndi.sum(eyes, lab, range(1, k + 1))
    black = np.median(cell[dark][:, :3], axis=0)
    out = cell.copy().astype(float)
    for i in np.argsort(sizes)[-2:]:
        eye = lab == i + 1
        ys = np.where(eye.any(axis=1))[0]
        lid = ys.min() + (ys.max() - ys.min() + 1) * (1 - keep)
        row = int(np.floor(lid)); part = lid - row
        cover = eye.copy(); cover[row:] = False
        lens = eye & ~cover
        # The eye lights the face around it a little; covered, that halo would
        # read as a ring, so the lid takes the halo with it (a few px around
        # the covered part, but not around the lens that stays lit).
        halo = ndi.binary_dilation(cover, iterations=5) & filled & ~ndi.binary_dilation(lens, iterations=3)
        out[halo, :3] = black
        edge = eye.copy(); edge[:row] = False; edge[row + 1:] = False
        out[edge, :3] = (1 - part) * out[edge, :3] + part * black
    return out.astype(np.uint8)


def breathe(cell, rise):
    """The cell stretched `rise` px taller at the hood top with the feet held — cubic resample on premultiplied channels."""
    if rise == 0: return cell
    sy = 1 + rise / FIGURE_H
    pre = premul(cell)
    out = np.dstack([ndi.affine_transform(pre[:, :, i], [1 / sy, 1], offset=[FEET_Y * (1 - 1 / sy), 0],
                                          output_shape=(H, W), order=3, mode='constant') for i in range(4)])
    return straight(out)


def head_cell(rgba, main, eyes):
    """The hood and face cut under the chin (above the ribbon), the hood HEAD_W wide with its bottom on HEAD_BOTTOM."""
    if eyes == 'shut': rgba = eyes_shut(rgba, 0.2)
    ys = np.where(main.any(axis=1))[0]
    top, h = ys.min(), ys.max() - ys.min()
    cut = top + int(round(h * 0.53))   # the chin's point sits at ~0.49 of her height; the hood's rim wraps a little under it
    rgba, main = rgba[:cut].copy(), main[:cut].copy()
    fade = np.linspace(0.3, 1, 4)[:, None]        # the last rows soften rather than end on a hard line
    rgba[-4:, :, 3] = (rgba[-4:, :, 3] * fade).astype(np.uint8)
    xs = np.where(main.any(axis=0))[0]
    rgba, main = scale(rgba, main, HEAD_W / (xs.max() - xs.min() + 1))
    return place(rgba, main, HEAD_CELL, HEAD_CELL, HEAD_BOTTOM)


sheet = Sheet(SRC, GROUND_BOX)

# The body: the rest cell, scaled so she stands FIGURE_H tall, centred with her lantern.
rgba, main = sheet.matte(sheet.cell(*REST))
ys = np.where(main.any(axis=1))[0]
s = FIGURE_H / (ys.max() - ys.min())
print(f'rest cell: figure {ys.max() - ys.min()}px tall → scale {s:.3f}')
rest = place(*scale(rgba, main, s), W, H, FEET_Y)
states = [rest, eyes_shut(rest, 0.5), eyes_shut(rest, 0.2)]
rises = [BREATH_RISE * (1 - np.cos(2 * np.pi * i / BREATH_FRAMES)) / 2 for i in range(BREATH_FRAMES)]
print('breath rise per frame, px:', [round(r, 2) for r in rises])
body = np.zeros((H * 3, W * BREATH_FRAMES, 4), dtype=np.uint8)
for r, cell in enumerate(states):
    for c, rise in enumerate(rises):
        body[r * H:(r + 1) * H, c * W:(c + 1) * W] = breathe(cell, rise)
Image.fromarray(body, 'RGBA').save(OUT_BODY, quality=90, method=6)
print('wrote', OUT_BODY, body.shape[1], 'x', body.shape[0], os.path.getsize(OUT_BODY), 'bytes')

heads = np.zeros((HEAD_CELL, HEAD_CELL * len(HEADS), 4), dtype=np.uint8)
for i, (name, at, eyes) in enumerate(HEADS):
    heads[:, i * HEAD_CELL:(i + 1) * HEAD_CELL] = head_cell(*sheet.matte(sheet.cell(*at)), eyes)
Image.fromarray(heads, 'RGBA').save(OUT_HEADS, optimize=True)
print('wrote', OUT_HEADS, heads.shape[1], 'x', heads.shape[0], os.path.getsize(OUT_HEADS), 'bytes')

if DEBUG:
    # Everything on the app's paper, 3×, to look at.
    paper = (246, 241, 232)
    def on_paper(a, k=3):
        im = Image.new('RGBA', (a.shape[1], a.shape[0]), paper + (255,))
        im.alpha_composite(Image.fromarray(a, 'RGBA'))
        return im.resize((im.width * k, im.height * k), Image.NEAREST)
    on_paper(body).save(os.path.join(DEBUG, 'cut-body.png'))
    on_paper(heads).save(os.path.join(DEBUG, 'cut-heads.png'))
    print('debug strips in', DEBUG)

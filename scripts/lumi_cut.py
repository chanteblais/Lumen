"""Shared pieces of Lumi's cut: matte a figure off a generated sheet, scale, place, align, breathe, draw lids.

Imported by scripts/cut-lumi-free.py. scripts/cut-lumi-idle.py (the lantern Lumi) still carries its own
copies of these; it moves onto this module if the lantern cut is kept (docs/animation-pipeline.md → backlog).
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

TOL = 45                          # ground tolerance for the flood fill
GROUND_BOX = ((5, 25), (5, 25))
SHADOW_RGB = (228, 218, 204)      # the cream sheets' shadow tone
GLOW_RGB = (240, 190, 130)        # a lantern's light on the ground is a blend of the ground and this
GLOW_MAX = 0.55


def runs(on, minlen):
    """Start and end of each run of True longer than `minlen`."""
    out, s = [], None
    for i, v in enumerate(on):
        if v and s is None: s = i
        if not v and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(on)))
    return [r for r in out if r[1] - r[0] > minlen]


def ruled(frac):
    """Indices of ruled lines, given the share of each column (or row) that differs from the ground: a line runs
    most of the sheet and is thin, with plain ground 4px either side. The thinness matters: a ground that darkens
    toward an edge makes whole rows differ, and painting those over cut the figures in half."""
    i = np.arange(len(frac))
    lo, hi = frac[np.clip(i - 4, 0, len(frac) - 1)], frac[np.clip(i + 4, 0, len(frac) - 1)]
    return np.where((frac > 0.85) & (lo < 0.5) & (hi < 0.5))[0]


class Sheet:
    def __init__(self, path, glow=True, ground_box=GROUND_BOX):
        self.src = np.array(Image.open(path).convert('RGB')).astype(int)
        (y0, y1), (x0, x1) = ground_box
        self.paper = np.median(self.src[y0:y1, x0:x1].reshape(-1, 3), axis=0)
        self.glow = glow
        self.unrule()
        self.d_all = np.abs(self.src - self.paper).sum(axis=2)
        self.lum = self.src.mean(axis=2)

    def unrule(self):
        """Paint over lines the generator ruled between the cells (the same test as scripts/measure-lumi-sheet.py)."""
        on = np.abs(self.src - self.paper).sum(axis=2) > 30
        for x in ruled(on.mean(axis=0)): self.src[:, max(0, x - 1):x + 2] = self.paper
        for y in ruled(on.mean(axis=1)): self.src[max(0, y - 1):y + 2] = self.paper

    def rows(self):
        """y-ranges of the rows of figures, found by segmentation (for a sheet with nothing on it but the cells)."""
        return runs((self.d_all > 60).sum(axis=1) > 3, 60)

    def frames(self, y0, y1, expect):
        """Bounding boxes of the `expect` figures in one row. A prop can stand apart from her (the book stack),
        so the closest spans are joined until there are `expect`."""
        m = self.d_all[y0:y1] > 60
        spans = runs(m.sum(axis=0) > 3, 8)
        while len(spans) > expect:
            k = min(range(len(spans) - 1), key=lambda i: spans[i + 1][0] - spans[i][1])
            spans[k:k + 2] = [(spans[k][0], spans[k + 1][1])]
        assert len(spans) == expect, (y0, spans)
        out = []
        for a, b in spans:
            rows = np.where(m[:, a:b].sum(axis=1) > 2)[0]
            out.append((a, b, rows[0] + y0, rows[-1] + y0))
        return out

    def matte(self, bbox):
        """One figure as straight-alpha RGBA plus the mask of its main body (the largest part: her, not a prop)."""
        x0, x1, y0, y1 = bbox
        X0, X1, Y0, Y1 = max(0, x0 - 8), x1 + 8, max(0, y0 - 8), y1 + 12
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
        # The soft shadow is the ground darkened, so it keeps the ground's blue cast (b > r); a lantern's pool of
        # light is the ground warmed (r > b) and brighter. Both are ground for the flood and are drawn back below.
        shadow = below & (rgb[:, :, 2] > rgb[:, :, 0]) & (chroma < 40) & (l < ground_l) & (d < 170)
        glow = below & (rgb[:, :, 0] > rgb[:, :, 2] + 12) & (l > ground_l + 3) & (l < 200) if self.glow else np.zeros_like(cand)
        inside, main = flood(cand | shadow | glow)
        # A gap the figure encloses — between the boots, under the hem — is ground the flood from outside can't
        # reach, and stayed opaque grey-blue between her feet. Ground-coloured holes in her lowest quarter are cut out.
        lab, k = ndi.label(inside & cand)
        if k:
            sizes = ndi.sum(inside & cand, lab, range(1, k + 1))
            low = np.zeros_like(cand)
            low[feet - int(np.ptp(np.where(main.any(axis=1))[0]) * 0.25):] = True
            inside &= ~(np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 12]) & low)
        outside = ~inside
        alpha = np.where(inside, 255.0, 0.0)
        dark = np.clip((ground_l - l) - 6, 0, None) * 4.5
        sh = outside & below & (chroma < 40) & (dark > 0)
        alpha = np.where(sh, np.clip(dark, 0, 170), alpha)
        rgb = np.where(sh[:, :, None], SHADOW_RGB, rgb)
        if self.glow:
            gl = outside & glow & ~sh
            alpha = np.where(gl, np.clip((l - ground_l) / 110, 0, GLOW_MAX) * 255, alpha)
            rgb = np.where(gl[:, :, None], GLOW_RGB, rgb)
        # De-matte the 2px edge band against the known ground, or the anti-aliased edge keeps a grey-blue fringe.
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


def shift(cell, dx, dy):
    """The cell moved by a fractional (dx, dy): cubic resampling on premultiplied channels."""
    pre = premul(cell)
    return straight(np.dstack([ndi.shift(pre[:, :, i], (dy, dx), order=3, mode='constant') for i in range(4)]))


def align(cell, ref, held, reach=6, fine=1.0, step=0.25):
    """Move `cell` so its coverage best matches `ref`'s over `held` (weights on the parts that hold still): whole
    pixels both ways within `reach`, then a quarter pixel. Returns the cell and the overlap."""
    r = ref[:, :, 3].astype(float) / 255 * held
    score = lambda a: np.minimum(a * held, r).sum() / np.maximum(a * held, r).sum()
    a = cell[:, :, 3].astype(float) / 255
    dx, dy = max(((dx, dy) for dx in range(-reach, reach + 1) for dy in range(-reach, reach + 1)),
                 key=lambda d: score(np.roll(np.roll(a, d[1], axis=0), d[0], axis=1)))
    a = np.roll(np.roll(a, dy, axis=0), dx, axis=1)
    steps = np.arange(-fine, fine + step / 2, step)
    fx, fy = max(((fx, fy) for fx in steps for fy in steps), key=lambda p: score(ndi.shift(a, (p[1], p[0]), order=1)))
    return shift(cell, dx + fx, dy + fy), score(ndi.shift(a, (fy, fx), order=1))


def face(cell):
    """Mask of the dark face (holes filled, so the eyes are inside it) and of its dark pixels alone."""
    dark = (cell[:, :, :3].sum(axis=2) < 150) & (cell[:, :, 3] > 200)
    filled = ndi.binary_fill_holes(dark)
    fl, k = ndi.label(filled)
    sizes = ndi.sum(filled, fl, range(1, k + 1))
    return fl == (1 + int(np.argmax(sizes))), dark


def eyes_shut(cell, keep):
    """The cell with a lid drawn down over each eye, leaving the bottom `keep` of it (0.5 half-shut, 0.2 shut). The
    lid is the face's own black; the row it stops on is blended half and half; the eye's halo goes with the lid."""
    filled, dark = face(cell)
    eyes = filled & ~dark
    lab, k = ndi.label(eyes)
    sizes = ndi.sum(eyes, lab, range(1, k + 1))
    lit = [i for i in np.argsort(sizes)[::-1] if cell[lab == i + 1][:, 0].mean() > 180][:2]
    black = np.median(cell[dark][:, :3], axis=0)
    out = cell.copy().astype(float)
    for i in lit:
        eye = lab == i + 1
        ys = np.where(eye.any(axis=1))[0]
        lid = ys.min() + (ys.max() - ys.min() + 1) * (1 - keep)
        row = int(np.floor(lid)); part = lid - row
        cover = eye.copy(); cover[row:] = False
        lens = eye & ~cover
        halo = ndi.binary_dilation(cover, iterations=5) & filled & ~ndi.binary_dilation(lens, iterations=3)
        out[halo, :3] = black
        edge = eye.copy(); edge[:row] = False; edge[row + 1:] = False
        out[edge, :3] = (1 - part) * out[edge, :3] + part * black
    return out.astype(np.uint8)


def breathe(cell, rise, feet_y, figure_h):
    """The cell stretched `rise` px taller at the hood top with the feet held — cubic resample on premultiplied channels."""
    if rise == 0: return cell
    sy = 1 + rise / figure_h
    pre = premul(cell)
    out = np.dstack([ndi.affine_transform(pre[:, :, i], [1 / sy, 1], offset=[feet_y * (1 - 1 / sy), 0],
                                          output_shape=cell.shape[:2], order=3, mode='constant') for i in range(4)])
    return straight(out)

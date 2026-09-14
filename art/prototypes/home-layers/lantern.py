"""The lantern as its own object in Home: cut out of the table layer, the tabletop filled under it, its light split off.

    python3 art/prototypes/home-layers/lantern.py            # build the files below from the chosen candidates, then check
    python3 art/prototypes/home-layers/lantern.py --check    # check the files as they are (after plate.py)

**Rebuild chain.**
1. `inpaint.py E --n 2` and `inpaint.py F --n 2`: candidates in out/inpaint/, about $0.11 a run (`.env.local`'s key).
   E's hole is the lantern and the pool of its light; F's is tight round the lantern.
2. Name the chosen ones in room.src.json → `plate_candidates.E` and `.F`.
3. `plate.py` calls build() here, then writes layers.json with the `objects` entry and a recompose measured from the
   files. Use `plate.py --keep` when the A-D candidates are not on disk: the room's other pieces stay as they are.
4. `lantern.py --check`: the acceptance numbers, the A/B overlap test, and the close-ups out/lantern-*.png.
5. `build.py`, `capture.py --test`, `sweep.py --tag after`.
6. lumi-walk: `build.py`, `capture.py --audit`, `capture.py --occlusion`.

build() reads the painting, plate.png, the shadows and layers drawn before the table, the table's alpha and the
candidates. It never reads the table's colours inside what it rewrites, so it can run again on its own output.

Writes art/scenery/home/layers/lantern.png, lantern-shadow.png, lantern-glow.png, table-light.png (the mask the glow and
shadow are drawn through), and table.png again. table.png keeps its size, offset and alpha; its colours change only
where the lantern, its shadow or its light reach. table-shadow.png is left as it is. The rug round the table shows no
falloff from the lantern: behind-left, its median luminance is 78, 82 and 77 at ground radius 120-180, 180-240 and
240-320, and the other quarters show no trend either. So the table's shadow carries none of its light.

**Method.** Ground distance d from a painting point (x, y) to the lantern's base (bx, by) is hypot(x - bx, (y - by)/slope),
in page px across: a ground circle. Divide by sqrt 2 for u/v units.
1. *The lantern's alpha* is the coverage of its `outline`, a polygon hand-traced on the painted silhouette at 12x
   (4x supersampled). The painted edge is about a pixel of antialiasing, so a traced outline gives a cleaner edge than a
   matte against a tabletop that has to be invented. The matte was tried first: plate.py's colour line, trimmed with
   fringe.py. It left tabletop-coloured specks round the base and glass.
2. *The candidates* are laid into the painting, as plate.py does. E, the unlit reference over the pool, is
   colour-corrected by its difference to the painting in a ring 3-14px outside its hole, on the tabletop, where d > 110
   (the pool has faded there). F, the fill, is corrected against the painting less the light (step 4), in a ring
   2-12px outside the lantern and d >= 46.
3. *The light, measured.* Over the tabletop in E's hole, away from the lantern (2px) and the other things, per channel:
   the painting minus corrected E, both Gaussian 6 and normalised by the same mask, so the plank texture mostly
   cancels. It is in levels, 0-255.
4. *The pool.* A profile L_c(d') = peak_c (1 + d'^2/h^2)^-n, centre offset free, is fitted to that where d > 28. On top,
   within d 40-70, the image keeps what the profile misses (spread, Gaussian 2 and 8). The tail fades to 0 over d
   150-210.
5. *Round the base* (fading out over d 30-46), corrected F aligns with the painting's planks, so the light is judged
   against it at Gaussian 1.5.
   - Where the painting is darker than F plus the light, the light is reduced first: the base hides the flame from the
     tabletop right beside it.
   - Only what is darker than F itself becomes the contact shadow.
   - Where the painting is brighter, the difference per channel is added to the light: the pool is brightest right in
     front of the base, finer than step 3 sees.
   All of it is spread under the lantern, so it moves with the lantern.
6. *How it is drawn and stored.* Over the table the page draws the glow as added light (canvas 'lighter'), then the
   shadow (black, alpha a), both through table-light.png. That is the table's opaque pixels above its top's front
   edges, so not its sides, legs or one-pixel soft edge. It also leaves out the pixels too dark to take the light:
   where the painting is darker than the light that falls on it at the painted spot (dark leaves, book-cover edges, a
   plank joint). The shadow's alpha is fitted to 8 bits: per pixel, up to 3 levels either side, whichever composes
   closest. Step 5 measures on the tabletop outside the things' own polygons, not grown, so the gap between the base and
   the gourd counts.
   The glow is stored additively: RGB light in levels on black. A multiplicative glow ('color-dodge',
   s = K/(1+K)) was tried. It lights texture more physically, but 8-bit table colours times its gain cannot recompose
   the painting: 0.037 over the whole painting, 0.034 with the glow dithered ±1.
7. *The unlit table.* Where the tabletop shows, the colour that composes to the painting through those two draws:
   U = (painting / (1 - shadow * m) - light * m - under (1 - alpha)) / alpha. Here m is the mask, alpha the table's,
   and `under` what is drawn before the table. Under the lantern U is corrected F.
8. *Colour* is de-matted against what the page draws behind the lantern at the quantised alpha. The alpha is raised
   where that would leave a colour out of range.
The base and grip are measured on the alpha, and so is the flame (the brightest point).
"""
import io
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.optimize import least_squares

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
OUT = os.path.join(HERE, 'out')
SCENE = os.path.join(ROOT, 'art', 'scenery', 'home')
sys.path.insert(0, HERE)
from inpaint import MARGIN, hole_for, poly_mask, tabletop  # noqa: E402

LUM = np.array([0.299, 0.587, 0.114])
FIT_R = (28, 200)       # ground radii the pool is fitted between
NEAR = (40, 70)         # the measured light kept on top of the fitted profile, faded out over this ground radius
TAIL = (150, 210)       # the glow's tail faded to nothing over this ground radius; its image ends at TAIL[1]
SHADOW_R = (30, 46)     # round the base: less light, the contact shadow, more light, faded out over this ground radius
CARRY_BASE = 10         # page px from the floor to the lantern's base when she carries it: in her lantern drawing
                        # (art/lumi/lumi-lantern-idle.png) its base hangs by her boot tops, about a twelfth of her height


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def nconv(v, m, s):
    return ndi.gaussian_filter(v * m, s), ndi.gaussian_filter(m.astype(float), s)


def spread(v, m, s1=6, s2=30):
    """plate.py's: v measured where m, spread everywhere (a fine normalised convolution where it has support, else coarse)."""
    c1, m1 = nconv(v, m, s1)
    c2, m2 = nconv(v, m, s2)
    t = np.clip(m1 / 0.05, 0, 1)
    return t * c1 / np.maximum(m1, 1e-6) + (1 - t) * c2 / np.maximum(m2, 1e-9)


def spread3(img, m, s1=6, s2=30):
    return np.dstack([spread(img[:, :, c], m, s1, s2) for c in range(img.shape[2])])


def soft_poly(poly, size, k=4):
    """A polygon's coverage per pixel, 0..1 (k x supersampled); a pixel (i, j) is the square [i, i+1) x [j, j+1)."""
    W, H = size
    im = Image.new('L', (W * k, H * k), 0)
    ImageDraw.Draw(im).polygon([(x * k, y * k) for x, y in poly], fill=255)
    return np.array(im.resize((W, H), Image.BOX)) / 255


def clip_poly(room, on):
    """The part of a surface layer above its top's two front edges: its top and the things on it, not its sides or legs."""
    top = tabletop(room, on)
    left, right, front = min(top, key=lambda p: p[0]), max(top, key=lambda p: p[0]), max(top, key=lambda p: p[1])
    return [[left[0] - 8, 0], [left[0] - 8, left[1]], list(left), list(front), list(right), [right[0] + 8, right[1]], [right[0] + 8, 0]]


def load(src, mode='RGBA'):
    return np.array(Image.open(os.path.join(SCENE, src)).convert(mode)).astype(np.float64)


def paste(img, x0, y0, size):
    """img (h, w, c) on a size canvas with its top-left at integer (x0, y0), clipped to the canvas."""
    W, H = size
    h, w = img.shape[:2]
    out = np.zeros((H, W, img.shape[2]))
    ax0, ay0, ax1, ay1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if ax1 > ax0 and ay1 > ay0:
        out[ay0:ay1, ax0:ax1] = img[ay0 - y0:ay1 - y0, ax0 - x0:ax1 - x0]
    return out


def place(img, base, at, scale, size, premult=False):
    """img (h, w, c) drawn with its point `base` (img px) at painting point `at`, scaled by `scale` about it."""
    if scale == 1 and float(at[0] - base[0]).is_integer() and float(at[1] - base[1]).is_integer():
        return paste(img, int(at[0] - base[0]), int(at[1] - base[1]), size)
    h, w, c = img.shape
    src = img.copy()
    if premult:
        src[:, :, :3] *= src[:, :, 3:4] / 255
    if scale < 1:
        sig = 0.5 * np.sqrt(1 / scale ** 2 - 1)
        src = ndi.gaussian_filter(src, (sig, sig, 0))
    X0, Y0 = int(np.floor(at[0] - base[0] * scale)) - 2, int(np.floor(at[1] - base[1] * scale)) - 2
    X1, Y1 = int(np.ceil(at[0] + (w - base[0]) * scale)) + 2, int(np.ceil(at[1] + (h - base[1]) * scale)) + 2
    yy, xx = np.mgrid[Y0:Y1, X0:X1]
    sx, sy = (xx - at[0]) / scale + base[0], (yy - at[1]) / scale + base[1]
    res = np.dstack([ndi.map_coordinates(src[:, :, k], [sy, sx], order=1, cval=0) for k in range(c)])
    if premult:
        res[:, :, :3] /= np.maximum(res[:, :, 3:4], 1e-6) / 255
        res = np.clip(res, 0, 255)
    return paste(res, X0, Y0, size)


def over(comp, rgba):
    a = rgba[:, :, 3:4] / 255
    return comp * (1 - a) + rgba[:, :, :3] * a


def under(layers, order, stop, size):
    """The plate with every shadow, then the layers drawn before `stop` in depth order."""
    comp = load('plate.png', 'RGB')
    for L in layers:
        if L['shadow']:
            comp *= 1 - paste(load(L['shadow']['src']), *L['shadow']['offset'], size)[:, :, 3:4] / 255
    for i in order:
        if i == stop:
            break
        L = next(l for l in layers if l['id'] == i)
        comp = over(comp, paste(load(L['src']), *L['offset'], size))
    return comp


def profile(th, gx, gy):
    return (1 + ((gx - th[3]) ** 2 + (gy - th[4]) ** 2) / th[5] ** 2) ** -th[6]


def box_of(mask):
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def candidate(room, cl, P):
    """The painting with cluster cl's chosen candidate laid in over its crop."""
    hole = hole_for(room, cl)
    ys, xs = np.where(hole)
    x0, y0 = max(0, xs.min() - MARGIN), max(0, ys.min() - MARGIN)
    cand = np.array(Image.open(os.path.join(OUT, 'inpaint', room['plate_candidates'][cl])).convert('RGB')).astype(np.float64)
    I = P.copy()
    I[y0:y0 + cand.shape[0], x0:x0 + cand.shape[1]] = cand
    return I, hole


def build(room, layers, order, obj=None):
    """Write the lantern, its shadow and glow, the light mask, and the table without them; return the layers.json
    `objects` entry."""
    obj = obj or room['objects'][0]
    size = tuple(room['size'])
    W, H = size
    S = room['iso']['slope']
    on = obj['on']
    surf = next(L for L in layers if L['id'] == on)
    src = next(L for L in room['layers'] if L['id'] == on)
    P = np.array(Image.open(os.path.join(ROOT, room['painting'])).convert('RGB')).astype(np.float64)
    comp0 = under(layers, order, on, size)
    table = paste(load(surf['src']), *surf['offset'], size)
    At = table[:, :, 3] / 255
    clip_p = clip_poly(room, on)
    ag0 = At * poly_mask([clip_p], size)
    things = ndi.binary_dilation(poly_mask(list(src['things'].values()), size), iterations=2)
    top = poly_mask([tabletop(room, on)], size)
    bx, by = obj['base']
    yy, xx = np.mgrid[0:H, 0:W]
    rg = np.hypot(xx - bx, (yy - by) / S)
    gx, gy = xx - bx, (yy - by) / S

    # 1. the lantern's alpha: its traced outline
    aL = soft_poly(obj['outline'], size)
    aL[aL < 0.03] = 0
    cover = aL > 0

    # 2-4. the unlit reference, the light measured against it, the pool
    E, holeE = candidate(room, obj['cluster'], P)
    dout = ndi.distance_transform_edt(~holeE)
    ring = (dout > 3) & (dout < 14) & top & ~things & (rg > 110)
    Ec = E + spread3(P - E, ring)
    T = top & holeE & ~ndi.binary_dilation(cover, iterations=2) & ~things & (At >= 1)
    Lm = np.dstack([(nconv(P[:, :, c], T, 6)[0] - nconv(Ec[:, :, c], T, 6)[0]) / np.maximum(nconv(P[:, :, c], T, 6)[1], 1e-6) for c in range(3)])
    sy, sx = np.where(T & (rg > FIT_R[0]) & (rg < FIT_R[1]))
    sy, sx = sy[::2], sx[::2]
    fit = least_squares(lambda th: (np.outer(profile(th, gx[sy, sx], gy[sy, sx]), th[:3]) - Lm[sy, sx]).ravel(),
                        [60, 50, 5, 0, 0, 60, 1.5], bounds=([0, 0, 0, -60, -60, 5, 0.3], [255, 255, 255, 60, 60, 600, 50]),
                        loss='soft_l1', f_scale=8)
    th = fit.x
    resid_fit = np.abs(np.outer(profile(th, gx[sy, sx], gy[sy, sx]), th[:3]) - Lm[sy, sx]).mean(axis=0)
    Lfit = profile(th, gx, gy)[:, :, None] * th[:3]
    Lres = spread3(Lm - Lfit, T & (rg < NEAR[1] + 10), 2, 8)
    light = np.clip(Lfit + Lres * (1 - smoothstep(NEAR[0], NEAR[1], rg))[:, :, None], 0, 255)
    light *= (1 - smoothstep(TAIL[0], TAIL[1], rg))[:, :, None]
    g8 = np.round(light)
    g8[rg > TAIL[1]] = 0
    Ubar = spread3(Ec, top & ~things & ~cover & (rg < 60), 6, 20)
    gain = th[:3] / np.maximum(Ubar[int(round(by + th[4] * S)), int(round(bx + th[3]))], 1)
    print(f'  pool: peak {np.round(th[:3], 1)} levels (gain on the unlit tabletop {np.round(gain, 3)}), h {th[5]:.1f}, n {th[6]:.2f}, '
          f'centre offset ({th[3]:.1f}, {th[4]:.1f}) ground px; fit residual {np.round(resid_fit, 1)}')

    # 2 and 5. the fill, and round the base against it
    F, _ = candidate(room, obj['fillCluster'], P)
    dC = ndi.distance_transform_edt(~cover)
    ring2 = (dC > 2) & (dC < 12) & top & ~things
    Fc = F + spread3(P - g8 * ag0[:, :, None] - F, ring2 & (rg >= SHADOW_R[1]), 6, 30)
    msh = top & ~ndi.binary_dilation(cover, iterations=1) & ~poly_mask(list(src['things'].values()), size) & (rg < SHADOW_R[1] + 4)
    _, mm = nconv(P[:, :, 0], msh, 1.5)
    sm = lambda v: nconv(v, msh, 1.5)[0] / np.maximum(mm, 1e-6)
    lit = g8 * ag0[:, :, None]
    lP, lF, lG = sm(P @ LUM), sm(Fc @ LUM), sm(lit @ LUM)
    fade = 1 - smoothstep(SHADOW_R[0], SHADOW_R[1], rg)
    keep = 1 - spread(1 - np.clip((lP - lF) / np.maximum(lG, 1e-6), 0, 1), msh, 1.5, 5) * fade
    more = np.dstack([spread(np.clip(sm(P[:, :, c]) - sm(Fc[:, :, c]) - sm(lit[:, :, c]), 0, None), msh, 1.5, 5) for c in range(3)]) * fade[:, :, None]
    a = spread(np.clip(1 - lP / np.maximum(lF, 1e-6), 0, 0.85), msh, 1.5, 5) * fade
    a[a < 0.03] = 0
    a8 = np.round(a * 255)
    g8 = np.clip(np.round(light * keep[:, :, None] + more), 0, 255)
    g8[rg > TAIL[1]] = 0
    print(f'  round the base: light kept down to {keep[rg < SHADOW_R[1]].min():.2f} ({int((keep < 0.98).sum())} px under 0.98), '
          f'light added up to {np.round(more.reshape(-1, 3).max(axis=0), 1)}; contact shadow {int((a8 > 0).sum())} px, max {a8.max() / 255:.2f}; '
          f'glow image peak {g8.reshape(-1, 3).max(axis=0)}')

    # 6-7. the light mask, and the table: what composes to the painting where it shows, the fill under the lantern
    def unlit(ag):
        shade = (1 - ag * a8 / 255)[:, :, None]
        return (P / shade - g8 * ag[:, :, None] - comp0 * (1 - At)[:, :, None]) / np.maximum(At, 1e-6)[:, :, None], shade
    dark = (unlit(ag0)[0] < -0.5).any(axis=2) & ~cover & (ag0 > 0)
    mask8 = np.round(255 * ag0 * ~dark * (At >= 1))    # not the layer's soft edge: light of a few levels there can't be seen,
                                                        # and dividing it back out by a partial alpha doesn't round to the painting
    ag = mask8 / 255
    # the contact shadow fitted to 8 bits: per shadow pixel where the table shows, its alpha or up to 3 levels either side,
    # whichever lets an integer table colour compose closest to the painting (a shadow of 0.15 +- 0.01 looks the same)
    seen_sh = (a8 > 0) & ~cover & (ag > 0)
    best_e, best_a = None, a8
    for da in (0, -1, 1, -2, 2, -3, 3):
        a_try = np.where(seen_sh, np.clip(a8 + da, 1, 255), a8)
        sh_try = (1 - ag * a_try / 255)[:, :, None]
        Ut = np.round(np.clip((P / sh_try - g8 * ag[:, :, None] - comp0 * (1 - At)[:, :, None]) / np.maximum(At, 1e-6)[:, :, None], 0, 255))
        e = np.abs(np.minimum(255, comp0 * (1 - At)[:, :, None] + Ut * At[:, :, None] + g8 * ag[:, :, None]) * sh_try - P).sum(axis=2)
        if best_e is None:
            best_e, best_a = e, a_try
        else:
            b = e < best_e - 1e-9
            best_e, best_a = np.where(b, e, best_e), np.where(b, a_try, best_a)
    a8 = best_a
    Uvis, shade = unlit(ag)
    Uvis = np.clip(Uvis, 0, 255)
    print(f'  light mask: {int(dark.sum())} px too dark to take the light at the painted spot')
    U = np.where(cover[:, :, None], np.clip(Fc, 0, 255), Uvis)
    R = (At > 0) & ((((g8.max(axis=2) > 0) | (a8 > 0)) & (ag > 0)) | cover)     # outside it the layer keeps its colours
    Unew = np.where(R[:, :, None], np.round(U), table[:, :, :3])

    # 8. colour, de-matted against what the page draws behind the lantern
    Bgf = np.minimum(255, comp0 * (1 - At)[:, :, None] + Unew * At[:, :, None] + g8 * ag[:, :, None]) * shade
    need = np.where(P > Bgf, (P - Bgf) / np.maximum(255 - Bgf, 1), (Bgf - P) / np.maximum(Bgf, 1)).max(axis=2)
    raised = int((np.clip(need, 0, 1) > aL + 1 / 510).sum() - (np.clip(need, 0, 1)[aL == 0] > 1 / 510).sum())
    aL = np.where(aL > 0, np.maximum(aL, np.clip(need, 0, 1)), 0)
    aq = np.round(aL * 255) / 255
    CL = np.clip((P - (1 - aq)[:, :, None] * Bgf) / np.maximum(aq, 0.02)[:, :, None], 0, 255)
    print(f'  lantern: {int((aq > 0).sum())} px, {int(((aq > 0) & (aq < 1)).sum())} partial; alpha raised to de-matte in range at {raised} px')

    # measure: base (the front of its bottom outline is an ellipse on the ground), top, grip, flame
    solid = aq > 0.5
    cols = slice(bx - 30, bx + 31)
    ylow = max(y for y in range(by - 20, by + 25) if solid[y, cols].any())
    rows = []
    for y in range(ylow - 14, ylow + 1):
        xs_ = np.where(solid[y, cols])[0]
        if len(xs_):
            rows.append((xs_.max() - xs_.min() + 1, (xs_.max() + xs_.min()) / 2 + bx - 30, y))
    wmax, cx, _ = max(rows)
    base_m = (cx, ylow + 0.5 - wmax / 2 * S)
    ytop = int(min(np.where(solid.any(axis=1))[0]))
    grip_m = (float(np.mean(np.where(solid[ytop])[0])), ytop)
    fl_l = ndi.gaussian_filter((P @ LUM) * (aq > 0.9), 1.5)
    yf, xf = np.unravel_index(np.argmax(fl_l), fl_l.shape)
    height = by - ytop
    print(f'  measured base ({base_m[0]:.1f}, {base_m[1]:.1f}) (traced {bx}, {by}; widest base row {wmax}px, bottom row {ylow}); '
          f'top {ytop}, grip ({grip_m[0]:.1f}, {grip_m[1]}); flame ({xf}, {yf}); painted height {height}px')
    if abs(base_m[0] - bx) > 1 or abs(base_m[1] - by) > 1:
        print('  WARNING: the traced base is more than 1px from the measured one; set room.src.json objects[].base and rebuild')

    # files
    lx0, ly0, lx1, ly1 = box_of(aq > 0)
    sx0, sy0, sx1, sy1 = box_of(a8 > 0) if (a8 > 0).any() else (bx, by, bx + 1, by + 1)
    gw = int(np.ceil(TAIL[1])) + 1
    gx0, gy0, gx1, gy1 = max(0, bx - gw), max(0, int(by - gw * S) - 1), min(W, bx + gw + 1), min(H, int(by + gw * S) + 2)
    lay = os.path.join(SCENE, 'layers')
    tx, ty = surf['offset']
    tw_, th_ = Image.open(os.path.join(SCENE, surf['src'])).size
    light_src = f'layers/{on}-light.png'
    Image.fromarray(np.dstack([np.round(CL), np.round(aq * 255)]).astype(np.uint8)[ly0:ly1, lx0:lx1]).save(os.path.join(lay, 'lantern.png'), optimize=True)
    Image.fromarray(np.dstack([np.zeros((H, W, 3)), a8]).astype(np.uint8)[sy0:sy1, sx0:sx1]).save(os.path.join(lay, 'lantern-shadow.png'), optimize=True)
    Image.fromarray(g8.astype(np.uint8)[gy0:gy1, gx0:gx1], 'RGB').save(os.path.join(lay, 'lantern-glow.png'), optimize=True)
    Image.fromarray(np.dstack([np.zeros((H, W, 3)), mask8]).astype(np.uint8)[ty:ty + th_, tx:tx + tw_]).save(os.path.join(SCENE, light_src), optimize=True)
    Image.fromarray(np.dstack([Unew, table[:, :, 3]]).astype(np.uint8)[ty:ty + th_, tx:tx + tw_]).save(os.path.join(SCENE, surf['src']), optimize=True)
    print(f'  wrote layers/lantern.png {lx1 - lx0}x{ly1 - ly0}, lantern-shadow.png {sx1 - sx0}x{sy1 - sy0}, '
          f'lantern-glow.png {gx1 - gx0}x{gy1 - gy0}, {light_src}, {surf["src"]} ({int(R.sum())} px rewritten)')

    # the parameters: the tabletop pool as fitted, the floor pool when she carries it, the scaled lantern
    scale = obj['drawnHeight'] / height
    r2 = np.sqrt(2)
    H0 = by - yf                                  # the flame's height over the base, page px
    carry = CARRY_BASE + scale * H0               # the flame's height over the floor when carried, page px
    floor_gain = gain * (scale * H0 / carry) ** 2
    tmask = poly_mask([src['mask']], size)
    rug = np.median(load('plate.png', 'RGB')[ndi.binary_dilation(tmask, iterations=40) & ~tmask], axis=0)
    floor_h = th[5] * carry / H0
    to_uv = lambda ox, oy: [round(float(ox + oy) / 2, 1), round(float(oy - ox) / 2, 1)]
    through = {'src': light_src, 'offset': [tx, ty],
               'note': f"alpha: where on the {on} layer the lantern's light and shadow land, the layer's alpha above its top's "
                       "front edges (`glow.clip`), less the pixels darker than the light that falls on them at the painted spot"}
    return {
        'id': obj['id'], 'surface': on, 'at': obj['at'],
        'src': 'layers/lantern.png', 'offset': [lx0, ly0],
        'base': [bx - lx0, by - ly0], 'grip': [round(grip_m[0] - lx0, 1), grip_m[1] - ly0],
        'height': int(height), 'drawnHeight': obj['drawnHeight'], 'scale': round(scale, 4),
        'glow': {
            'src': 'layers/lantern-glow.png', 'offset': [gx0, gy0], 'base': [bx - gx0, by - gy0],
            'mode': 'lighter',
            'store': "Additive: RGB light in levels (0-255) on black, what the painting adds over the unlit table. Drawn with "
                     "globalCompositeOperation 'lighter' it adds; black adds nothing.",
            'through': through,
            'clip': clip_p,
            'tabletop': {
                'profile': "L_c(d') = peak_c * (1 + d'^2/h^2)^-n levels, d' the ground distance from the pool's centre in page "
                           "px across (hypot(dx, dy/slope)); the centre is `centre` from the base; divide d' and h by sqrt 2 "
                           "for u/v units. The image also carries, within ground radius 70 of the base, the painted light the "
                           "profile misses (brightest just in front of the base, less right beside it), and fades the tail out "
                           "over 150-210.",
                'peak': np.round(th[:3], 1).tolist(), 'gain': np.round(gain, 3).tolist(),
                'h': round(float(th[5]), 1), 'hUV': round(float(th[5] / r2), 1), 'n': round(float(th[6]), 2),
                'centre': [round(float(th[3]), 1), round(float(th[4]), 1)], 'centreUV': to_uv(th[3], th[4]),
                'fitResidual': np.round(resid_fit, 1).tolist(),
                'note': '`gain` is the peak over the unlit tabletop colour under it: the light as a fraction of the surface it lands on',
            },
            'flame': {'height': int(H0), 'note': 'the flame over the base, page px, measured (the brightest point of the lantern)'},
            'scaled': "Draw the glow image scaled by `scale` about its base, like the lantern, at the same strength: the pool's "
                      "radius scales with the flame's height over the surface, and a flame that much smaller gives that much "
                      "less light (intensity ∝ size², falloff ∝ 1/height²), so its peak stays the same.",
            'floor': {
                'note': "When she carries it, no image: draw the same profile as added light, centred under the flame, on the "
                        "floor, before her and the layers over her. Held higher it lands wider and dimmer: h ∝ the flame's "
                        "height over the floor, gain ∝ (the flame's height over the tabletop at this scale / its height over "
                        "the floor)². The light added is gain × the floor's colour, so the rug gets less than the tabletop "
                        "did. Numbers for the base `carryBase` px above the floor at `scale`. For a lift L (page px from "
                        "the floor to the base): heightFlame = L + scale * flame.height, h = tabletop.h * heightFlame / "
                        "flame.height, gain = tabletop.gain * (scale * flame.height / heightFlame)², peak = gain * floor colour.",
                'carryBase': CARRY_BASE, 'heightFlame': round(float(carry), 1),
                'h': round(float(floor_h), 1), 'hUV': round(float(floor_h / r2), 1), 'n': round(float(th[6]), 2),
                'gain': np.round(floor_gain, 3).tolist(), 'rug': np.round(rug).astype(int).tolist(),
                'peak': np.round(floor_gain * rug, 1).tolist(),
                'colour': np.round(255 * th[:3] / th[:3].max()).astype(int).tolist(),
            },
        },
        'shadow': {'src': 'layers/lantern-shadow.png', 'offset': [sx0, sy0], 'base': [bx - sx0, by - sy0], 'through': through},
        'draw': "On the page, right after the surface layer (`surface`) in the depth order, at anchor point p and scale k: the "
                "lantern-glow ('lighter'), then the lantern-shadow (black, alpha), each with its `base` at p scaled by k, "
                "through `glow.through` (e.g. in an offscreen canvas: draw it, 'destination-in' the mask at its offset, then "
                "draw that canvas onto the room with 'lighter' for the glow and 'source-over' for the shadow); then the "
                "lantern with its `base` at p scaled by k. At `offset` and scale 1 the three recompose the painting.",
    }


def compose(doc, room, at=None, scale=1.0, parts=('glow', 'shadow', 'lantern')):
    """The room from the files: plate, shadows, layers in depth order, each object drawn after its surface layer (at its
    painted spot, or at `at` scaled by `scale`), with only `parts` of it."""
    size = tuple(room['size'])
    comp = under(doc['layers'], doc['depth']['order'], doc['depth']['order'][0], size)   # the plate and every shadow
    for i in doc['depth']['order']:
        L = next(l for l in doc['layers'] if l['id'] == i)
        comp = over(comp, paste(load(L['src']), *L['offset'], size))
        for o in doc.get('objects', []):
            if o['surface'] != i:
                continue
            ag = paste(load(o['glow']['through']['src']), *o['glow']['through']['offset'], size)[:, :, 3] / 255
            p = at or [o['offset'][0] + o['base'][0], o['offset'][1] + o['base'][1]]
            if 'glow' in parts:
                light = place(load(o['glow']['src'], 'RGB'), o['glow']['base'], p, scale, size)
                comp = np.minimum(255.0, comp + light * ag[:, :, None])
            if 'shadow' in parts:
                sh = place(load(o['shadow']['src'])[:, :, 3:4], o['shadow']['base'], p, scale, size)[:, :, 0] / 255
                comp *= (1 - sh * ag)[:, :, None]
            if 'lantern' in parts:
                comp = over(comp, place(load(o['src']), o['base'], p, scale, size, premult=True))
    return comp


def recompose(doc, room):
    """layers.json's `recompose`: the room from the files against the painting, the objects at their painted spots."""
    P = np.array(Image.open(os.path.join(ROOT, room['painting'])).convert('RGB')).astype(np.float64)
    size = tuple(room['size'])
    err = np.abs(compose(doc, room) - P)
    per = {}
    for L in room['layers']:
        m = poly_mask([L['mask']], size)
        per[L['id']] = {'meanAbs': round(float(err[m].mean()), 2), 'maxAbs': round(float(err[m].max())),
                        'over8': round(float((err.max(axis=2)[m] > 8).mean()), 4)}
    out = {'meanAbs': round(float(err.mean()), 5), 'maxAbs': round(float(err.max())), 'perMask': per}
    for o in room.get('objects', []):
        hole = hole_for(room, o['cluster'])
        out[o['id']] = {'hole': {'meanAbs': [round(float(v), 3) for v in err[hole].mean(axis=0)], 'maxAbs': round(float(err[hole].max())),
                                 'over8': round(float((err.max(axis=2)[hole] > 8).mean()), 4), 'px': int(hole.sum())},
                        'note': 'the hole: cluster ' + o['cluster'] + " in room.src.json, the lantern and its pool's middle"}
    return out


if __name__ == '__main__':
    room = json.load(open(os.path.join(HERE, 'room.src.json')))
    doc = json.load(open(os.path.join(SCENE, 'layers.json')))
    size = tuple(room['size'])
    P = np.array(Image.open(os.path.join(ROOT, room['painting'])).convert('RGB')).astype(np.float64)
    if '--check' not in sys.argv:
        print('building the lantern from', room['plate_candidates'][room['objects'][0]['cluster']], 'and', room['plate_candidates'][room['objects'][0]['fillCluster']])
        doc['objects'] = [build(room, doc['layers'], doc['depth']['order'])]
        print('(layers.json is not rewritten here: run plate.py --keep for that)')
    if not doc.get('objects'):
        sys.exit('layers.json has no objects: run plate.py (or plate.py --keep) first')
    o = doc['objects'][0]
    ro = next(r for r in room['objects'] if r['id'] == o['id'])
    comp = compose(doc, room)
    err = np.abs(comp - P)
    hole = hole_for(room, ro['cluster'])
    e8 = err.max(axis=2)
    print(f'recompose at the painted spot, scale 1.0: whole painting mean {err.mean():.4f} max {err.max():.0f}')
    print(f'  inside the hole ({int(hole.sum())} px): mean per channel {np.round(err[hole].mean(axis=0), 3)} (all {err[hole].mean():.3f}), '
          f'max {err[hole].max():.0f}, {100 * (e8[hole] > 8).mean():.2f}% of pixels off by more than 8')
    lanternpx = paste(load(o['src']), *o['offset'], size)[:, :, 3] > 0
    print(f'  of which under the lantern ({int(lanternpx.sum())} px): mean {err[lanternpx].mean():.3f}; '
          f'the tabletop that shows: mean {err[hole & ~lanternpx].mean():.3f}')
    for L in room['layers']:
        m = poly_mask([L['mask']], size)
        print(f"  {L['id']:14s} mask: mean {err[m].mean():.2f} max {err[m].max():.0f} ({100 * (e8[m] > 8).mean():.2f}% over 8)")

    # the table layer against the committed one: what changed, and how far from the lantern
    try:
        old = np.array(Image.open(io.BytesIO(subprocess.run(['git', 'show', 'HEAD:art/scenery/home/layers/table.png'], cwd=ROOT, check=True, capture_output=True).stdout))).astype(int)
        new = np.array(Image.open(os.path.join(SCENE, 'layers', 'table.png'))).astype(int)
        tl = next(l for l in doc['layers'] if l['id'] == o['surface'])
        diff = np.abs(new - old).max(axis=2)
        yy, xx = np.mgrid[0:diff.shape[0], 0:diff.shape[1]]
        bxp, byp = o['offset'][0] + o['base'][0], o['offset'][1] + o['base'][1]
        rgd = np.hypot(xx + tl['offset'][0] - bxp, (yy + tl['offset'][1] - byp) / room['iso']['slope'])
        far = rgd > TAIL[1]
        print(f"table.png against HEAD: same size {new.shape == old.shape}, alpha changed {int((new[:, :, 3] != old[:, :, 3]).sum())} px; "
              f"colour changed {int((diff > 0).sum())} px of {int((new[:, :, 3] > 0).sum())}, {int(((diff > 0) & far).sum())} of them beyond "
              f"ground radius {TAIL[1]} (max change there {int(diff[far].max()) if far.any() else 0})")
    except Exception as ex:  # noqa: BLE001
        print('table.png against HEAD: not compared', ex)

    # A and B: the lantern at its drawn size against the book stack and the plant
    src = next(L for L in room['layers'] if L['id'] == o['surface'])
    anchors = src['anchors']
    blocks = {k: ndi.binary_erosion(poly_mask([src['things'][k]], size), iterations=2) for k in ('books', 'plant')}
    top = tabletop(room, o['surface'])
    left, back = min(top, key=lambda p: p[0]), min(top, key=lambda p: p[1])
    edge = np.array(back, float) - np.array(left, float)
    edge /= np.linalg.norm(edge)
    alpha_img = load(o['src'])[:, :, 3:4]
    for name in ('table.lantern', 'table.place'):
        at = anchors[name]['at']

        def hit(p):
            A = place(alpha_img, o['base'], p, o['scale'], size)[:, :, 0] > 25
            return {k: int((A & m).sum()) for k, m in blocks.items()}
        h = hit(at)
        msg = f'{name} at {at}, {o["drawnHeight"]}px: overlap with ' + ', '.join(f'{k} {v} px' for k, v in h.items())
        if any(h.values()):
            for t in np.arange(0.5, 40.5, 0.5):
                found = next(([at[0] + sg * t * edge[0], at[1] + sg * t * edge[1]] for sg in (1, -1)
                              if not any(hit([at[0] + sg * t * edge[0], at[1] + sg * t * edge[1]]).values())), None)
                if found:
                    msg += f'; clears at ({found[0]:.1f}, {found[1]:.1f}), {t}px along the back-left edge'
                    break
        print(msg)

    # close-ups at 4x
    box = (600, 470, 880, 690)
    k = 4

    def save(img, name):
        im = Image.fromarray(np.clip(np.round(img), 0, 255).astype(np.uint8)).crop(box)
        im.resize((im.width * k, im.height * k), Image.NEAREST).save(os.path.join(OUT, name))

    save(P, 'lantern-painting.png')
    save(compose(doc, room, parts=()), 'lantern-table.png')
    save(comp, 'lantern-recomposed.png')
    heat = P * 0.35
    heat[:, :, 0] = np.maximum(heat[:, :, 0], np.clip(e8 * 20, 0, 255))
    save(heat, 'lantern-recompose-diff.png')
    for name, tag in (('table.lantern', 'A'), ('table.place', 'B')):
        save(compose(doc, room, at=anchors[name]['at'], scale=o['scale']), f'lantern-at-{tag}.png')
    spr = load(o['src'])
    for name, bgc in (('grey', 128.0), ('black', 0.0)):
        pad = np.full((spr.shape[0] + 8, spr.shape[1] + 8, 3), bgc)
        pad[4:-4, 4:-4] = over(np.full(spr.shape[:2] + (3,), bgc), spr)
        Image.fromarray(np.round(pad).astype(np.uint8)).resize((pad.shape[1] * k, pad.shape[0] * k), Image.NEAREST).save(os.path.join(OUT, f'lantern-{name}.png'))
    print('wrote out/lantern-painting.png, -table, -recomposed, -recompose-diff, -at-A, -at-B, -grey, -black (4x)')

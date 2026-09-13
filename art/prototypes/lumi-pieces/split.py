"""Split the hub drawing (art/lumi/lumi-free-rest.png) into pieces for the tier-2 rig prototype.

    /usr/local/bin/python3 split.py

Writes, next to this script:
  body.png     the whole figure (RGBA, soft contact shadow), FIG_H px from hood top to feet,
               with the painted eyes and their glow halo painted out in the face's own dark
  rig.json     eye geometry and colours, face polygon, neck pivot, head-weight rows,
               figure bounds, head-crop numbers, sprite metrics — in body.png pixels
  sprite.png   rows 0-2, cells 0-8 of public/lumi-idle.webp (the comparison stage)
  debug-split.png, debug-face.png   overlays to look at

Method (adapted from scripts/cut-lumi-idle.py):
- matte: flood fill of the grey-blue ground from outside, the contact shadow read by its
  blue cast and redrawn warm and translucent, the 2px edge band de-matted against the ground;
- face: dark pixels opened (so the hood's thin outline can't close a ring round the hood),
  holes filled, the largest blob; the eyes are its two largest bright holes;
- eye geometry: moments of the bright core and of the whole painted eye (rim included);
  the halo is read as a radial profile in the eye's own elliptical distance, and turned into
  one glow colour with alpha stops (the halo is the face's black blended toward that colour);
- eye removal: the eye plus its halo out to rho 2.3 is refilled with a harmonic (Laplace)
  fill from the surrounding face, so there is no ring and no seam;
- neck: the brown collar ribbon and bow are found by row profile; the pivot is the bow's
  knot, head weight is 1 down to the chin and 0 from the bow's bottom;
- all measured at full resolution, then one premultiplied-alpha Lanczos resize.
"""
import json
import os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
WT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # the repo root (this is art/prototypes/lumi-pieces/)
SRC = os.path.join(WT, 'art', 'lumi', 'lumi-free-rest.png')
SPRITE = os.path.join(WT, 'public', 'lumi-idle.webp')
FIG_H = 600          # target figure height, hood top to feet, px
PAD = 24             # transparent margin round the figure in body.png, px after the resize
TOL = 45
SHADOW_RGB = (228, 218, 204)
GLOW_RGB = np.array([240., 120., 50.])   # the halo is the face's black blended toward this
ERASE_RHO = 2.3      # the halo has settled to the face's black by rho ~2.0 in the hub
POLY_N = 72

src = np.array(Image.open(SRC).convert('RGB')).astype(float)
H0, W0 = src.shape[:2]
ground = np.median(src[5:25, 5:25].reshape(-1, 3), axis=0)
ground_l = ground.mean()
d = np.abs(src - ground).sum(axis=2)
lum = src.mean(axis=2)
chroma = src.max(axis=2) - src.min(axis=2)
print('ground', ground)


def flood(cand):
    lab, _ = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    inside = ~np.isin(lab, list(border))
    il, k = ndi.label(inside)
    sizes = ndi.sum(inside, il, range(1, k + 1))
    return inside, il == (1 + int(np.argmax(sizes)))


# ---- matte ---------------------------------------------------------------
cand = d < TOL
inside, main = flood(cand)
ys = np.where(main.any(axis=1))[0]
top0, bot0 = ys.min(), ys.max()
below = np.zeros_like(cand)
below[int(top0 + 0.86 * (bot0 - top0)):] = True
shadow = below & (src[:, :, 2] > src[:, :, 0]) & (chroma < 45) & (lum < ground_l) & (d < 170)
inside, main = flood(cand | shadow)
# ground the figure encloses (between the boots, under the hem) is ground too, not an opaque blue patch
enc = (cand | shadow) & inside & below
el, ek = ndi.label(enc)
esz = ndi.sum(enc, el, range(1, ek + 1))
enclosed = np.isin(el, [i + 1 for i, sz in enumerate(esz) if sz >= 40])
print('enclosed ground px', int(enclosed.sum()))
inside &= ~enclosed
outside = ~inside
alpha = np.where(inside, 255.0, 0.0)
rgb = src.copy()
dark_amt = np.clip((ground_l - lum) - 4, 0, None) * 4.0
sh = outside & below & (chroma < 45) & (dark_amt > 0)
alpha = np.where(sh, np.clip(dark_amt, 0, 160), alpha)
rgb = np.where(sh[:, :, None], SHADOW_RGB, rgb)
interior = ndi.binary_erosion(inside, iterations=2)
band = inside & ~interior
iy, ix = ndi.distance_transform_edt(~interior, return_indices=True)[1]
own = rgb[iy, ix]
full = np.maximum(np.abs(own - ground).sum(axis=2), 1)
a = np.clip(d / full, 0, 1)[:, :, None]
clean = np.clip((rgb - (1 - a) * ground) / np.maximum(a, 0.05), 0, 255)
rgb = np.where(band[:, :, None], clean, rgb)
alpha = np.where(band, a[:, :, 0] * 255, alpha)
fy = np.where(main.any(axis=1))[0]
fx = np.where(main.any(axis=0))[0]
fig_top, fig_bot, fig_left, fig_right = int(fy.min()), int(fy.max()), int(fx.min()), int(fx.max())
fig_h = fig_bot - fig_top
print('figure (hub px): top', fig_top, 'feet', fig_bot, 'x', fig_left, fig_right, 'height', fig_h)

# ---- face and eyes ---------------------------------------------------------
dark = (src.sum(axis=2) < 150) & (alpha > 200)
dark_o = ndi.binary_opening(dark, iterations=3)
filled = ndi.binary_fill_holes(dark_o)
fl, k = ndi.label(filled)
sizes = ndi.sum(filled, fl, range(1, k + 1))
face = fl == (1 + int(np.argmax(sizes)))
fyy, fxx = np.where(face)
print('face bbox (hub):', fxx.min(), fxx.max(), fyy.min(), fyy.max())
holes = face & ~dark_o
hl, hk = ndi.label(holes)
hs = ndi.sum(holes, hl, range(1, hk + 1))
bright = [i for i in np.argsort(hs)[::-1] if lum[hl == i + 1].mean() > 150][:2]
assert len(bright) == 2, 'expected two eyes'
face_black = np.median(src[face & dark & ~ndi.binary_dilation(holes, iterations=40)], axis=0)
print('face black', face_black)

Y, X = np.mgrid[0:H0, 0:W0]
eyes = []
for i in bright:
    m = hl == i + 1
    core = m & (lum > 200)
    yy, xx = np.where(core)
    rim = m & (lum > 95)
    yy2, xx2 = np.where(rim)
    e = dict(cx=float(xx2.mean()), cy=float(yy2.mean()),
             core_rx=float(2 * xx.std()), core_ry=float(2 * yy.std()),
             rx=float(2 * xx2.std()), ry=float(2 * yy2.std()),
             core_rgb=np.median(src[core], axis=0))
    e['rho'] = np.sqrt(((X - e['cx']) / e['rx']) ** 2 + ((Y - e['cy']) / e['ry']) ** 2)
    e['prof'] = {}
    for r0 in np.round(np.arange(0.0, 3.01, 0.1), 2):
        ring = face & (e['rho'] >= r0) & (e['rho'] < r0 + 0.1)
        if ring.sum():
            e['prof'][float(r0)] = np.median(src[ring], axis=0)
    eyes.append(e)
eyes.sort(key=lambda e: e['cx'])
prof = lambda r0: (eyes[0]['prof'][r0] + eyes[1]['prof'][r0]) / 2
for e in eyes:
    print('eye centre', round(e['cx'], 1), round(e['cy'], 1), 'outer r', round(e['rx'], 1), round(e['ry'], 1),
          'core r', round(e['core_rx'], 1), round(e['core_ry'], 1))
core_rgb = (eyes[0]['core_rgb'] + eyes[1]['core_rgb']) / 2
# the painted eye, centre to edge, in units of the outer radii
body_stops = [[0.0, core_rgb], [0.74, prof(0.7)], [0.84, prof(0.8)], [0.92, prof(0.9)], [0.985, prof(1.0)]]
glow_stops = []
for r0 in np.round(np.arange(1.0, 2.51, 0.1), 2):
    c = prof(float(r0))
    al = float(np.clip((c - face_black).sum() / (GLOW_RGB - face_black).sum(), 0, 1))
    glow_stops.append([round(float(r0) + 0.05, 2), round(al, 3)])
    if al < 0.004:
        break
glow_stops[-1][1] = 0.0
print('body stops', [(r, np.round(c).tolist()) for r, c in body_stops])
print('glow stops', glow_stops)

# ---- remove the painted eyes -------------------------------------------------
face_er = ndi.binary_erosion(face, iterations=2)
R = np.zeros((H0, W0), bool)
for e in eyes:
    R |= e['rho'] < ERASE_RHO
R &= face_er
ry_, rx_ = np.where(R)
y0, y1, x0, x1 = ry_.min() - 3, ry_.max() + 4, rx_.min() - 3, rx_.max() + 4
sub = rgb[y0:y1, x0:x1].copy()
m = R[y0:y1, x0:x1]
known = (face & ~R)[y0:y1, x0:x1].astype(float)
den = ndi.gaussian_filter(known, 14)
for c in range(3):
    num = ndi.gaussian_filter(sub[:, :, c] * known, 14)
    sub[:, :, c] = np.where(m, num / np.maximum(den, 1e-6), sub[:, :, c])
for it in range(3000):
    avg = (np.roll(sub, 1, 0) + np.roll(sub, -1, 0) + np.roll(sub, 1, 1) + np.roll(sub, -1, 1)) / 4
    sub = np.where(m[:, :, None], avg, sub)
before = rgb.copy()
rgb[y0:y1, x0:x1] = sub
for e in eyes:
    res = [(r0, round(float(np.median(rgb[face & (e['rho'] >= r0) & (e['rho'] < r0 + 0.2)].sum(axis=1))), 1))
           for r0 in (0.0, 0.6, 1.0, 1.4, 1.8, 2.2, 2.6)]
    print('after removal, rgb sum by rho', res, ' face black sum', face_black.sum())

# ---- neck: collar, bow, pivot ------------------------------------------------------
fcx = int(np.mean([e['cx'] for e in eyes]))
r_, g_, b_ = src[:, :, 0], src[:, :, 1], src[:, :, 2]
brown = (r_ > g_) & (g_ > b_) & (r_ - b_ > 45) & (lum > 30) & (lum < 150) & (alpha > 200) & ~face
win = brown[:, fcx - 120:fcx + 120]
count = win.sum(axis=1)
chin = int(np.where(face[:, fcx - 10:fcx + 10].any(axis=1))[0].max())
rows = np.arange(chin, fig_top + int(0.8 * fig_h))
collar = [y for y in rows if count[y] > 110]
collar_top = collar[0]
collar_bot = collar_top
while count[collar_bot + 1] > 110 or count[collar_bot + 2] > 110:
    collar_bot += 1
loops = np.arange(collar_bot + 8, collar_bot + 50)
lx = np.where(win[loops].any(axis=0))[0]
pivot_x = float(fcx - 120 + (lx.min() + lx.max()) / 2)
seek = np.arange(collar_bot + 45, collar_bot + 95)
sm = ndi.uniform_filter1d(count.astype(float), 7)
bow_bot = int(seek[np.argmin(sm[seek])])
pivot_y = float((collar_top + collar_bot) / 2)
weight_full = float(min(chin, collar_top) - 6)
weight_zero = float(bow_bot)
print('chin', chin, 'collar', collar_top, collar_bot, 'bow bottom', bow_bot, 'pivot', pivot_x, pivot_y)

# ---- resize --------------------------------------------------------------------
s = FIG_H / fig_h
ay, ax = np.where(alpha > 0)
m_ = int(np.ceil(PAD / s))
cy0, cy1, cx0, cx1 = ay.min() - m_, ay.max() + m_ + 1, ax.min() - m_, ax.max() + m_ + 1
rgba = np.dstack([rgb, alpha])
padw = ((max(0, -cy0), max(0, cy1 - H0)), (max(0, -cx0), max(0, cx1 - W0)), (0, 0))
rgba_p = np.pad(rgba, padw)
crop = rgba_p[cy0 + padw[0][0]:cy1 + padw[0][0], cx0 + padw[1][0]:cx1 + padw[1][0]]
face_p = np.pad(face, padw[:2])[cy0 + padw[0][0]:cy1 + padw[0][0], cx0 + padw[1][0]:cx1 + padw[1][0]]
ch, cw = crop.shape[:2]
OW, OH = int(round(cw * s)), int(round(ch * s))
sx, sy = OW / cw, OH / ch
mx = lambda x: (x - cx0 + 0.5) * sx - 0.5
my = lambda y: (y - cy0 + 0.5) * sy - 0.5
a1 = crop[:, :, 3:4] / 255
pre = np.dstack([crop[:, :, :3] * a1, crop[:, :, 3:4]]).astype(np.float32)
out = np.dstack([np.array(Image.fromarray(pre[:, :, i]).resize((OW, OH), Image.LANCZOS)) for i in range(4)])
oa = np.clip(out[:, :, 3:4], 0, 255)
body = np.dstack([np.clip(out[:, :, :3] / np.maximum(oa / 255, 1e-3), 0, 255), oa]).astype(np.uint8)
body[body[:, :, 3] == 0, :3] = 0
Image.fromarray(body, 'RGBA').save(os.path.join(HERE, 'body.png'), optimize=True)
print('body.png', OW, 'x', OH, os.path.getsize(os.path.join(HERE, 'body.png')), 'bytes; scale', round(s, 4))

face_s = np.array(Image.fromarray(face_p.astype(np.uint8) * 255).resize((OW, OH), Image.BILINEAR)) > 127
fy2, fx2 = np.where(face_s)
fcx2, fcy2 = fx2.mean(), fy2.mean()
dist = ndi.distance_transform_edt(face_s)
angles = np.linspace(0, 2 * np.pi, POLY_N, endpoint=False)
radii = []
for t in angles:
    r = 0
    while True:
        x, y = fcx2 + (r + 0.5) * np.cos(t), fcy2 + (r + 0.5) * np.sin(t)
        if not (0 <= int(y) < OH and 0 <= int(x) < OW and face_s[int(y), int(x)]):
            break
        r += 0.5
    radii.append(r - 1)
# the face's right edge shades into the lining, so the mask is ragged there: a circular median then mean
radii = ndi.uniform_filter1d(ndi.median_filter(np.array(radii), size=7, mode='wrap'), size=5, mode='wrap')
poly = [[round(float(fcx2 + r * np.cos(t)), 1), round(float(fcy2 + r * np.sin(t)), 1)] for r, t in zip(radii, angles)]
eye_row = int(round(my(np.mean([e['cy'] for e in eyes]))))
xs_row = np.where(face_s[eye_row])[0]
face_w = float(xs_row.max() - xs_row.min())

# head crop, as the avatar cut: the top HEAD_SHARE of her height for the hood width, cut at 0.53
ma = body[:, :, 3] > 200
top_b, feet_b = my(fig_top), my(fig_bot)
fig_hb = feet_b - top_b
hx = np.where(ma[int(top_b):int(top_b + 0.45 * fig_hb)].any(axis=0))[0]

rig = dict(
    source='art/lumi/lumi-free-rest.png', scale=round(s, 5), size=[OW, OH],
    figure=dict(top=round(top_b, 1), feet=round(feet_b, 1), left=round(mx(fig_left), 1), right=round(mx(fig_right), 1),
                height=round(fig_hb, 1)),
    pivot=[round(mx(pivot_x), 1), round(my(pivot_y), 1)],
    headWeight=dict(full=round(my(weight_full), 1), zero=round(my(weight_zero), 1)),
    ribbon=dict(chin=round(my(chin), 1), collarTop=round(my(collar_top), 1), collarBottom=round(my(collar_bot), 1),
                bowBottom=round(my(bow_bot), 1)),
    face=dict(bbox=[int(fx2.min()), int(fy2.min()), int(fx2.max()), int(fy2.max())], widthAtEyes=round(face_w, 1),
              black=np.round(face_black).astype(int).tolist(), polygon=poly),
    eyes=[dict(cx=round(mx(e['cx']), 2), cy=round(my(e['cy']), 2), rx=round(e['rx'] * sx, 2), ry=round(e['ry'] * sy, 2),
               coreRx=round(e['core_rx'] * sx, 2), coreRy=round(e['core_ry'] * sy, 2)) for e in eyes],
    eyeColour=dict(core=np.round(core_rgb).astype(int).tolist(), glow=GLOW_RGB.astype(int).tolist(),
                   bodyStops=[[r, np.round(c).astype(int).tolist()] for r, c in body_stops], glowStops=glow_stops),
    head=dict(hoodLeft=int(hx.min()), hoodRight=int(hx.max()), cut=round(top_b + 0.53 * fig_hb, 1)),
)

# ---- sprite: rows 0-2, cells 0-8 --------------------------------------------------
sp = np.array(Image.open(SPRITE).convert('RGBA'))
CW, CH = 160, 208
spc = sp[:3 * CH, :9 * CW]
Image.fromarray(spc, 'RGBA').save(os.path.join(HERE, 'sprite.png'), optimize=True)
cell = spc[:CH, :CW]
sa = cell[:, :, 3] > 200
sy_ = np.where(sa.any(axis=1))[0]
s_top, s_feet = int(sy_.min()), int(sy_.max())
shx = np.where(sa[s_top:s_top + int(0.45 * (s_feet - s_top))].any(axis=0))[0]
rig['sprite'] = dict(cellW=CW, cellH=CH, cols=9, rows=3, top=s_top, feet=s_feet, hoodLeft=int(shx.min()),
                     hoodRight=int(shx.max()), cut=round(s_top + 0.53 * (s_feet - s_top), 1))
print('sprite.png', spc.shape[1], 'x', spc.shape[0], os.path.getsize(os.path.join(HERE, 'sprite.png')), 'bytes', rig['sprite'])
with open(os.path.join(HERE, 'rig.json'), 'w') as f:
    json.dump(rig, f, indent=1)
print(json.dumps({k: v for k, v in rig.items() if k not in ('face',)}, indent=None))
print('face', {k: v for k, v in rig['face'].items() if k != 'polygon'})

# ---- debug ------------------------------------------------------------------------
im = Image.new('RGBA', (OW, OH), (246, 241, 232, 255))
im.alpha_composite(Image.fromarray(body, 'RGBA'))
dr = ImageDraw.Draw(im)
dr.polygon([tuple(p) for p in poly], outline=(0, 160, 255, 255))
for e in rig['eyes']:
    dr.ellipse([e['cx'] - e['rx'], e['cy'] - e['ry'], e['cx'] + e['rx'], e['cy'] + e['ry']], outline=(255, 0, 180, 255))
px, py = rig['pivot']
dr.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(255, 0, 0, 255))
for yv, col in ((rig['headWeight']['full'], (0, 200, 0, 255)), (rig['headWeight']['zero'], (200, 0, 0, 255)),
                (rig['figure']['top'], (0, 0, 0, 255)), (rig['figure']['feet'], (0, 0, 0, 255)), (rig['head']['cut'], (160, 0, 255, 255))):
    dr.line([0, yv, OW, yv], fill=col)
im.save(os.path.join(HERE, 'debug-split.png'))
# the face, contrast-lifted, to find any ring left where the painted eyes were
fb = body[int(fy2.min()):int(fy2.max()), int(fx2.min()):int(fx2.max()), :3].astype(float)
lift = np.clip((fb - 8) * 6, 0, 255).astype(np.uint8)
Image.fromarray(lift).resize((lift.shape[1] * 2, lift.shape[0] * 2), Image.NEAREST).save(os.path.join(HERE, 'debug-face.png'))

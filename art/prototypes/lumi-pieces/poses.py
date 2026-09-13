"""Render the rig's poses without a browser, with the same math as index.html.

    /usr/local/bin/python3 poses.py

poses.png  ten poses at 300px tall (the page's box: figure 173/208 of it, feet at 200/208)
heads.png  the same poses as the avatar head crop at 68px and 36px (and 3x nearest for looking)
"""
import json
import os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
rig = json.load(open(os.path.join(HERE, 'rig.json')))
body = np.array(Image.open(os.path.join(HERE, 'body.png'))).astype(float) / 255
H, W = body.shape[:2]
pre = np.dstack([body[:, :, :3] * body[:, :, 3:4], body[:, :, 3:4]])
FIG = rig['figure']
U = FIG['height'] / (150 * 173 / 208)        # body px per display px, in the 150px box
LENS = 0.14
GLANCE = 0.10
PX, PY = rig['pivot']
YA, YB = rig['headWeight']['full'], rig['headWeight']['zero']
EC = rig['eyeColour']
GLOW = np.array(EC['glow']) / 255
PAPER = np.array([246, 241, 232]) / 255

REST = dict(open=1.0, sc=1.0, arc=0.0, gx=0.0, theta=0.0, tx=0.0, ty=0.0, rise=0.0)
POSES = [
    ('rest', {}),
    ('blink shut', dict(open=0.0)),
    ('sleepy', dict(open=0.36, ty=0.6)),
    ('happy', dict(open=0.0, arc=1.0)),
    ('curious', dict(sc=1.12, theta=2.0)),
    ('glance left', dict(gx=-1.0, tx=-1.25, theta=-0.6)),
    ('glance right', dict(gx=1.0, tx=1.25, theta=0.6)),
    ('tilt left', dict(theta=-2.5)),
    ('tilt right', dict(theta=2.5)),
    ('breath top', dict(rise=2.0)),
]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def weight(y):
    return 1 - smoothstep(YA, YB, y)


def head_T(p, x, y):
    th = np.radians(p['theta'])
    c, s = np.cos(th), np.sin(th)
    X, Y = x - PX, y - PY
    return PX + c * X - s * Y + p['tx'] * U, PY + s * X + c * Y + p['ty'] * U


def sample(img, x, y):
    return np.dstack([ndi.map_coordinates(img[:, :, i], [y, x], order=1, mode='constant') for i in range(img.shape[2])])


def warp(img, p):
    """Output = breath(warp(img)). Inverse: undo the breath, then solve p = p' - w(p)(T(p) - p)."""
    Yo, Xo = np.mgrid[0:H, 0:W].astype(float)
    k = 1 + p['rise'] * U / FIG['height']
    yb = FIG['feet'] + (Yo - FIG['feet']) / k
    xs, ys = Xo.copy(), yb.copy()
    for _ in range(10):
        tx, ty = head_T(p, xs, ys)
        w = weight(ys)
        xs, ys = Xo - w * (tx - xs), yb - w * (ty - ys)
    return sample(img, xs, ys)


def interp_stops(r, stops):
    rs = [s[0] for s in stops]
    return np.interp(r, rs, [s[1] for s in stops])


def over(dst, rgb, a):
    """premultiplied dst, straight colour rgb (3,) or (h,w,3), alpha a (h,w)"""
    a = a[:, :, None]
    dst[:, :, :3] = rgb * a + dst[:, :, :3] * (1 - a)
    dst[:, :, 3:4] = a + dst[:, :, 3:4] * (1 - a)


def bez(p0, c, p2, n=80):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 2 * np.array(p0) + 2 * (1 - t) * t * np.array(c) + t ** 2 * np.array(p2)


def poly_dist(x, y, pts):
    d = np.full(x.shape, 1e9)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        vx, vy = bx - ax, by - ay
        t = np.clip(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy), 0, 1)
        d = np.minimum(d, np.hypot(x - ax - t * vx, y - ay - t * vy))
    return d


def eye_layer(p, ss=4):
    """Eyes in body coordinates (before the head transform), premultiplied, supersampled."""
    Hs, Ws = H * ss, W * ss
    lay = np.zeros((Hs, Ws, 4))
    Yg, Xg = (np.mgrid[0:Hs, 0:Ws] + 0.5) / ss - 0.5
    body_rs = [s[0] for s in EC['bodyStops']]
    body_cs = np.array([s[1] for s in EC['bodyStops']]) / 255
    v = LENS + (1 - LENS) * p['open']
    for e in rig['eyes']:
        cx = e['cx'] + p['gx'] * GLANCE * rig['face']['widthAtEyes']
        cy = e['cy']
        rx, ry = e['rx'] * p['sc'], e['ry'] * p['sc']
        # glow, squashed onto the part of the eye the lid leaves
        gcy = cy + ry - ry * v
        grx, gry = rx * (0.55 + 0.45 * v), ry * v
        rg = np.sqrt(((Xg - cx) / grx) ** 2 + ((Yg - gcy) / gry) ** 2)
        ga = interp_stops(np.maximum(rg, EC['glowStops'][0][0]), EC['glowStops']) * (1 - p['arc'])
        over(lay, GLOW, ga)
        # the painted eye, below the lid
        r = np.sqrt(((Xg - cx) / rx) ** 2 + ((Yg - cy) / ry) ** 2)
        col = np.dstack([np.interp(r, body_rs, body_cs[:, i]) for i in range(3)])
        lid = cy + ry - 2 * ry * v
        ba = np.clip((1.0 - r) / 0.015, 0, 1) * np.clip((Yg - lid) * ss / ss + 0.5, 0, 1) * (1 - p['arc'])
        over(lay, col, ba)
        if p['arc'] > 0:
            pts = bez((cx - rx * 1.05, cy + ry * 0.22), (cx, cy - ry * 0.82), (cx + rx * 1.05, cy + ry * 0.22))
            dd = poly_dist(Xg, Yg, pts)
            hw, rimw = rx * 0.34, rx * 0.12
            arc_glow = interp_stops(np.maximum(1 + (dd - hw - rimw) / (rx * 0.9), EC['glowStops'][0][0]), EC['glowStops'])
            over(lay, GLOW, arc_glow * p['arc'])
            over(lay, np.array(EC['bodyStops'][-1][1]) / 255, np.clip(hw + rimw - dd + 0.5, 0, 1) * p['arc'])
            over(lay, np.array(EC['bodyStops'][2][1]) / 255, np.clip(hw - dd + 0.5, 0, 1) * p['arc'])
            over(lay, np.array(EC['core']) / 255, np.clip(hw * 0.55 - dd + 0.5, 0, 1) * p['arc'])
    lay = lay.reshape(H, ss, W, ss, 4).mean(axis=(1, 3))
    # clipped to the face
    fm = Image.new('L', (W * 4, H * 4), 0)
    ImageDraw.Draw(fm).polygon([(x * 4 + 2, y * 4 + 2) for x, y in rig['face']['polygon']], fill=255)
    fm = np.array(fm.resize((W, H), Image.BOX)).astype(float) / 255
    return lay * fm[:, :, None]


def frame(p):
    p = {**REST, **p}
    b = warp(pre, p)
    e = warp(eye_layer(p), p)
    out = b.copy()
    out[:, :, :3] = e[:, :, :3] + out[:, :, :3] * (1 - e[:, :, 3:4])
    out[:, :, 3:4] = e[:, :, 3:4] + out[:, :, 3:4] * (1 - e[:, :, 3:4])
    return out


def on(ground, prem):
    return prem[:, :, :3] + ground * (1 - prem[:, :, 3:4])


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).round().astype(np.uint8))


def box_crop(img, box_h):
    """The page's full-figure box: box_h tall, figure 173/208 of it, feet at 200/208, figure centred."""
    k = (box_h * 173 / 208) / FIG['height']
    box_w = int(round(box_h * 180 / 208))
    cx = (FIG['left'] + FIG['right']) / 2
    # body px of the box's corners
    x0 = cx - box_w / 2 / k
    y0 = FIG['feet'] - box_h * 200 / 208 / k
    small = to_img(img).resize((int(round(W * k)), int(round(H * k))), Image.LANCZOS)
    return small.transform((box_w, box_h), Image.AFFINE, (1, 0, x0 * k, 0, 1, y0 * k), resample=Image.BILINEAR,
                           fillcolor=tuple((PAPER * 255).astype(int)))


def head_crop(img, n):
    hd = rig['head']
    k = n * 172 / 176 / (hd['hoodRight'] - hd['hoodLeft'])
    x0 = (hd['hoodLeft'] + hd['hoodRight']) / 2 - n / 2 / k
    y0 = hd['cut'] - n * 161 / 176 / k
    small = to_img(img).resize((max(1, int(round(W * k))), max(1, int(round(H * k)))), Image.LANCZOS)
    tile = small.transform((n, n), Image.AFFINE, (1, 0, x0 * k, 0, 1, y0 * k), resample=Image.BILINEAR,
                           fillcolor=tuple((PAPER * 255).astype(int)))
    arr = np.array(tile).astype(float)
    cut = int(round(n * 161 / 176))
    arr[cut:] = PAPER * 255
    return Image.fromarray(arr.astype(np.uint8))


frames = [(name, frame(p)) for name, p in POSES]
BOX = 300
tiles = [box_crop(on(PAPER, f), BOX) for _, f in frames]
tw = tiles[0].width
strip = Image.new('RGB', (tw * len(tiles), BOX + 22), tuple((PAPER * 255).astype(int)))
dr = ImageDraw.Draw(strip)
for i, ((name, _), t) in enumerate(zip(frames, tiles)):
    strip.paste(t, (i * tw, 0))
    dr.text((i * tw + 8, BOX + 5), name, fill=(43, 38, 32))
strip.save(os.path.join(HERE, 'poses.png'))
print('poses.png', strip.size)

# head crops at avatar size, shown 3x nearest so a person (or a model) can see the pixels
rows = []
for n in (68, 36):
    heads = [head_crop(on(PAPER, f), n) for _, f in frames]
    row = Image.new('RGB', (n * len(heads) + 4 * len(heads), n), tuple((PAPER * 255).astype(int)))
    for i, h in enumerate(heads):
        row.paste(h, (i * (n + 4), 0))
    rows.append(row.resize((row.width * 3, row.height * 3), Image.NEAREST))
hs = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows) + 12), tuple((PAPER * 255).astype(int)))
yy = 0
for r in rows:
    hs.paste(r, (0, yy))
    yy += r.height + 12
hs.save(os.path.join(HERE, 'heads.png'))
print('heads.png', hs.size)

# a close look at the seam band at the strongest tilt, 2x
t = to_img(on(PAPER, frames[8][1]))
band = t.crop((int(FIG['left']), int(YA - 60), int(FIG['right']), int(YB + 40)))
band.resize((band.width * 2, band.height * 2), Image.LANCZOS).save(os.path.join(HERE, 'seam-tilt.png'))

# close look: the painted hub's face (resized the same way) beside the drawn rest, then blink, sleepy, happy, tilt right
hub = Image.open(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), 'art', 'lumi', 'lumi-free-rest.png')).convert('RGB')
s = rig['scale']
hub_s = hub.resize((int(round(hub.width * s)), int(round(hub.height * s))), Image.LANCZOS)
# body.png's origin in hub-scaled pixels: match by the eye centre (measured in both)
ex = rig['eyes'][0]['cx']; ey = rig['eyes'][0]['cy']
box = (150, 40, 460, 440)
zs = []
off = (np.array(hub_s).shape, None)
# find the offset by the first eye's bright core in hub_s
hs_arr = np.array(hub_s).astype(float).mean(axis=2)
yy, xx = np.where(hs_arr[150:350, 120:300] > 200)
dx = 120 + xx.mean() - ex; dy = 150 + yy.mean() - ey
zs.append(hub_s.crop((box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy)))
for i in (0, 1, 2, 3, 8):
    zs.append(to_img(on(PAPER, frames[i][1])).crop(box))
z = Image.new('RGB', (sum(t.width for t in zs), zs[0].height), (255, 255, 255))
xo = 0
for t in zs:
    z.paste(t, (xo, 0)); xo += t.width
z.save(os.path.join(HERE, 'zoom.png'))
print('zoom.png', z.size, 'hub offset', round(dx, 1), round(dy, 1))

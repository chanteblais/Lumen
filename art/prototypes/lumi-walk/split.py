"""Split Lumi's isometric facings into the walk rig's pieces.

    python3 art/prototypes/lumi-walk/split.py

Ten drawings at the rooms' angle, named by the way she faces on the page: sw (art/lumi/lumi-iso-front.png),
nw (lumi-iso-back.png), s, w and n (lumi-iso-s/w/n.png), and the five she turns through — ssw, wsw, wbw, wnw,
nnw. The page mirrors every one that is neither facing you nor facing away, so eighteen ring positions cost ten
drawings. A facing whose drawing isn't there yet is skipped.

For each facing it writes, into parts/:
  <facing>-body.png     the figure without what is below the hem: hood, face, cloak, the coat's slit, hands
  <facing>-foot-0.png   the far boot (higher on the page), with a short ankle
  <facing>-foot-1.png   the near boot
All three share one canvas, FIG_H px from hood top to feet. The legs are not pieces: rig-walk.json gives each
leg as a hip under the cloak, an ankle at its boot, a width and a colour, and the page draws it from one to the
other every frame — so however the body bobs and the boots step, a leg is never cut off and a boot never floats
(Chanté, 2026-09-13: "her feet are walking nicely, but they appear to be floating beneath her. Same with her body
beneath the slit of her coat"). rig-walk.json also holds the feet's ground contacts, the hem, the head's weight
rows, and for a view with a face everything the page needs to draw the eyes in code over the painted ones — the
eyes' ellipses, the face's black, the face's outline to clip them to, its width at the eye rows (a glance shifts
them a share of it), the painted eye's colour from the middle out and the halo's falloff. debug-split.png shows each facing whole (body,
drawn legs and boots), tinted by piece, and pulled apart (the boots a stride apart, the body lifted, the legs
following), so a gap shows before any page does.

Method: the matte is scripts/lumi_cut.py's (flood from outside, holes between the boots cut out, no shadow).
The hem is the lowest cloth (cream or orange) in each column, bridged across narrow gaps by a running maximum
so the coat's slit stays on the body. Below it is every opaque pixel that isn't cloth (grown a few px to keep
the cloak's outline with the cloak), in the lower part of the figure, in a part that reaches the ground. The two
boots (brown) seed the two feet; a foot is its boot plus ANKLE of what is just above it. Everything else below
the hem — the painted legs — leaves the body, replaced by the drawn legs. `keep` boxes hold a hand that touches
a leg on the body.
"""
import json
import os
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from lumi_cut import Sheet, scale  # noqa: E402

FIG_H = 440          # hood top to feet in the pieces, px
LOW = 0.55           # nothing above this share of her height (from the top) is below the hem
ANKLE = 0.035        # a foot piece is its boot and this share of her height above the boot
BRIDGE = 0.07        # the hem is bridged across gaps (the coat's slit) up to this share of her height wide
FACE_STEP = 6        # the face outline is sampled every this many rows (the page clips the drawn eyes to it)
# The painted eye read at these radii (1.0 is the measured eye's edge) and the halo around it: the radii and the
# glow's alpha falloff are the pieces test's (art/prototypes/lumi-pieces/rig.json, measured ring by ring on the hub);
# the colours at each radius are measured here, on each drawing. The two agree to a point or two — same character.
EYE_STOPS = [0.0, 0.74, 0.84, 0.92, 0.985]
GLOW_RGB = [240, 120, 50]
GLOW_STOPS = [[1.05, 0.41], [1.15, 0.34], [1.25, 0.248], [1.35, 0.178], [1.45, 0.123], [1.55, 0.085], [1.65, 0.061],
              [1.75, 0.043], [1.85, 0.03], [1.95, 0.022], [2.05, 0.015], [2.15, 0.013], [2.25, 0.009], [2.35, 0.008],
              [2.45, 0.0]]
# `keep`: boxes (x0, y0, x1, y1) in the matte's full-resolution pixels that stay on the body whatever they touch.
# `chin`, `neck`: where the head's weight starts to fall and where it reaches zero, as shares of her height from
# the hood top — the hood's lower edge and the shoulders below it, read off debug-split.png.
FACINGS = [
    dict(name='sw', src='art/lumi/lumi-iso-front.png', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='nw', src='art/lumi/lumi-iso-back.png', eyes=False, chin=0.50, neck=0.62, keep=[]),
    dict(name='s', src='art/lumi/lumi-iso-s.png', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='w', src='art/lumi/lumi-iso-w.png', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='n', src='art/lumi/lumi-iso-n.png', eyes=False, chin=0.50, neck=0.62, keep=[]),
    # the in-betweens she turns through (sixteen facings, 22.5° apart)
    dict(name='ssw', src='art/lumi/lumi-iso-ssw.png', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='wsw', src='art/lumi/lumi-iso-wsw.png', eyes=True, chin=0.46, neck=0.58, keep=[]),
    # the seam between side-on and the first view from behind: the bow and medallions are a sliver here and gone in
    # wnw, so the morph has something to shrink rather than dissolve. A back-ish view: no eye, the hood edge-on.
    dict(name='wbw', src='art/lumi/lumi-iso-wbw.png', eyes=False, chin=0.50, neck=0.62, keep=[]),
    dict(name='wnw', src='art/lumi/lumi-iso-wnw.png', eyes=False, chin=0.50, neck=0.62, keep=[]),
    dict(name='nnw', src='art/lumi/lumi-iso-nnw.png', eyes=False, chin=0.50, neck=0.62, keep=[]),
]
OUT = os.path.join(HERE, 'parts')
os.makedirs(OUT, exist_ok=True)


def split(f):
    sheet = Sheet(os.path.join(ROOT, f['src']), glow=False, shadow=False)
    rows = sheet.rows()
    bbox = sheet.frames(rows[0][0], rows[-1][1], 1)[0]
    rgba, main = sheet.matte(bbox)
    rgb = rgba[:, :, :3].astype(int)
    alpha = rgba[:, :, 3].astype(int)
    lum = rgb.mean(axis=2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    H0, W0 = alpha.shape
    ys = np.where(main.any(axis=1))[0]
    top, feet = int(ys.min()), int(ys.max())
    fh = feet - top
    Y, X = np.mgrid[0:H0, 0:W0]

    cloth = (alpha > 200) & ((lum > 165) | ((r > 180) & (r - b > 80) & (g > 70)))
    cloth_d = ndi.binary_dilation(cloth, iterations=4)
    mid = top + int(0.4 * fh)
    raw = np.full(W0, -1e9)
    for x in range(W0):
        c = np.where(cloth[mid:, x])[0]
        if len(c):
            raw[x] = mid + c.max()
    # a closing fills only narrow dips (the coat's slit) and keeps steps (one panel hanging lower than the other); a
    # plain running maximum pulled the lower panel's hem across the far boot, which then stayed on the body
    hem = ndi.grey_closing(raw, size=max(3, int(BRIDGE * fh)))
    hem = np.where(hem < 0, top + LOW * fh, hem)
    under = (alpha > 60) & ~cloth_d & (Y > hem[X]) & (Y > top + LOW * fh)
    lab, k = ndi.label(under, structure=np.ones((3, 3)))
    keep_ids = [i + 1 for i in range(k) if (lab == i + 1).sum() > 150 and Y[lab == i + 1].max() >= feet - 0.05 * fh]
    under = np.isin(lab, keep_ids)
    kept_on_body = np.zeros_like(under)
    for x0, y0, x1, y1 in f.get('keep', []):
        kept_on_body[y0:y1, x0:x1] = True
    under &= ~kept_on_body

    # the boots are a very dark brown (~36, 20, 9 at their median); the legs above them are near-black (~19, 16, 12)
    brown = ndi.binary_opening(under & (r - b > 18) & (r > g) & (lum > 12), iterations=2)
    bl, bk = ndi.label(brown)
    sizes = ndi.sum(brown, bl, range(1, bk + 1))
    seeds = [i + 1 for i in np.argsort(sizes)[::-1][:2] if sizes[i] > 150]
    seed_masks = [bl == s for s in seeds]
    if len(seed_masks) == 1:   # heels touching: halve the one boot shape at its middle
        xm = np.median(X[seed_masks[0]])
        seed_masks = [seed_masks[0] & (X < xm), seed_masks[0] & (X >= xm)]
    assert len(seed_masks) == 2, (f['name'], 'expected two boots', sorted(sizes)[-4:])
    seed_lab = np.zeros(under.shape, int)
    for n, m in enumerate(seed_masks):
        seed_lab[m] = n + 1
    idx = ndi.distance_transform_edt(seed_lab == 0, return_indices=True)[1]
    nearest = seed_lab[idx[0], idx[1]]

    feet_info = []
    for n in (1, 2):
        side = under & (nearest == n)
        boot = seed_lab == n
        by = Y[boot]
        boot_top = by.min()
        # the ankle is the middle of the boot's top (its cuff), measured on the boot alone: the topmost pixels of the
        # whole foot region caught strips of the cloak's outline off to the side and put the legs beside the boots
        cuff = boot & (Y <= boot_top + 0.15 * (by.max() - boot_top))
        cx0, cx1 = X[cuff].min(), X[cuff].max()
        ankle = (float(X[cuff].mean()), float(boot_top + 2))
        foot = side & (Y >= boot_top - ANKLE * fh) & (X >= cx0 - 4) & (X <= cx1 + 4)
        foot |= boot
        width = float(np.clip((cx1 - cx0) * 0.62, 0.045 * fh, 0.11 * fh))
        legpix = side & (Y < boot_top) & (X >= cx0) & (X <= cx1) & (lum < 60)
        colour = np.median(rgb[legpix], axis=0) if legpix.sum() > 50 else np.array([22, 18, 14])
        my = Y[foot].max()
        contact = (float(X[foot & (Y >= my - 0.02 * fh)].mean()), float(my))
        feet_info.append(dict(mask=foot, ankle=ankle, width=width, colour=colour, contact=contact))
    feet_info.sort(key=lambda d: d['contact'][1])   # far foot first: its ground contact is higher on the page

    hood = np.where(main[top:top + int(0.4 * fh)].any(axis=0))[0]
    hood_x = float((hood.min() + hood.max()) / 2)
    for d in feet_info:
        ax = int(np.clip(round(d['ankle'][0]), 0, W0 - 1))
        # the hip sits up under the cloak, a little in toward her middle, where the body always covers it
        d['hip'] = (d['ankle'][0] + (hood_x - d['ankle'][0]) * 0.25, float(hem[ax] - 0.06 * fh))

    body = rgba.copy()
    body[under, 3] = 0
    pieces = []
    for d in feet_info:
        piece = np.zeros_like(rgba)
        piece[d['mask']] = rgba[d['mask']]
        pieces.append(piece)

    info = dict(top=top, feet=feet, height=fh)
    if f['eyes']:
        dark = (lum < 45) & (alpha > 200) & (Y < top + 0.55 * fh)
        dark_o = ndi.binary_opening(dark, iterations=2)
        filled = ndi.binary_fill_holes(dark_o)
        fl, fk = ndi.label(filled)
        fs = ndi.sum(filled, fl, range(1, fk + 1))
        face = fl == 1 + int(np.argmax(fs))
        holes = face & ~dark_o
        hl, hk = ndi.label(holes)
        hs = ndi.sum(holes, hl, range(1, hk + 1))
        bright = [i + 1 for i in np.argsort(hs)[::-1] if hs[i] > 40 and lum[hl == i + 1].mean() > 150][:2]
        assert bright, (f['name'], 'expected an eye')
        eyes = []
        for i in bright:
            rim = (hl == i) & (lum > 95)
            ey, ex = np.where(rim)
            eyes.append(dict(cx=ex.mean(), cy=ey.mean(), rx=2.2 * ex.std(), ry=2.2 * ey.std()))
        info['eyes'] = sorted(eyes, key=lambda e: e['cx'])
        info['faceBlack'] = np.median(rgb[face & dark], axis=0).round().astype(int).tolist()
        # The page draws the eyes in code over the painted ones (the pieces test's way), so it needs the face to clip
        # them to, the face's width at the eye rows for a glance, and the painted eye's colour from the middle out.
        # The outline: the face's own left and right edge every FACE_STEP rows, down one side and back up the other.
        fys = np.where(face.any(axis=1))[0]
        rows_f = list(range(int(fys.min()), int(fys.max()) + 1, FACE_STEP))
        if rows_f[-1] != int(fys.max()):
            rows_f.append(int(fys.max()))
        fcx = float(np.median(np.where(face)[1]))
        left, right = [], []
        for y in rows_f:
            xs_f = np.where(face[y])[0]
            if not len(xs_f):
                continue
            # only the run of dark that holds the face's own middle: low down the hood's dark meets the collar's
            # shadow in a second run, and taking the row's min and max there folded the outline back on itself
            cuts = np.where(np.diff(xs_f) > 1)[0]
            runs = np.split(xs_f, cuts + 1)
            run = min(runs, key=lambda q: abs((q[0] + q[-1]) / 2 - fcx))
            left.append((float(run[0]), float(y)))
            right.append((float(run[-1]), float(y)))
        info['facePoly'] = left + right[::-1]
        eye_rows = face[int(min(e['cy'] for e in eyes)):int(max(e['cy'] for e in eyes)) + 1]
        info['faceW'] = float(np.median([np.ptp(np.where(r)[0]) for r in eye_rows if r.any()]))
        # the eye's colour at the pieces test's radii, measured on this drawing (they agree to a point or two — the
        # same character, the same palette — so the shape of the profile and the glow's falloff are the pieces')
        e0 = info['eyes'][0]
        rho = np.sqrt(((X - e0['cx']) / max(1e-6, e0['rx'])) ** 2 + ((Y - e0['cy']) / max(1e-6, e0['ry'])) ** 2)
        stops = []
        for r0 in EYE_STOPS:
            band = (alpha > 200) & (rho >= max(0.0, r0 - 0.06)) & (rho < r0 + 0.06)
            col = np.median(rgb[band], axis=0) if band.sum() > 6 else np.array(info['faceBlack'])
            stops.append([r0, col.round().astype(int).tolist()])
        info['eyeBody'] = stops
    info['chin'] = top + f['chin'] * fh
    info['neck'] = top + f['neck'] * fh
    cols = np.where(raw > 0)[0]
    info['hem'] = float(np.median(hem[cols])) if len(cols) else top + 0.85 * fh

    s = FIG_H / fh
    layers = {'body': body, 'foot-0': pieces[0], 'foot-1': pieces[1]}
    scaled = {}
    for name, im in layers.items():
        scaled[name] = scale(im, im[:, :, 3] > 0, s)[0]
        Image.fromarray(scaled[name], 'RGBA').save(os.path.join(OUT, f"{f['name']}-{name}.png"), optimize=True)
    h, w = scaled['body'].shape[:2]
    S = lambda v: round(float((v + 0.5) * s - 0.5), 2)
    rig = dict(size=[w, h], top=S(info['top']), feet=S(info['feet']), height=round(fh * s, 2),
               chin=S(info['chin']), neck=S(info['neck']), hem=S(info['hem']), hoodX=S(hood_x),
               contact=[[S(d['contact'][0]), S(d['contact'][1])] for d in feet_info],
               legs=[dict(hip=[S(d['hip'][0]), S(d['hip'][1])], ankle=[S(d['ankle'][0]), S(d['ankle'][1])],
                          width=round(d['width'] * s, 2), colour=d['colour'].round().astype(int).tolist()) for d in feet_info])
    if f['eyes']:
        rig['eyes'] = [dict(cx=S(e['cx']), cy=S(e['cy']), rx=round(e['rx'] * s, 2), ry=round(e['ry'] * s, 2)) for e in info['eyes']]
        rig['faceBlack'] = info['faceBlack']
        rig['facePoly'] = [[S(px), S(py)] for px, py in info['facePoly']]
        rig['faceW'] = round(info['faceW'] * s, 2)
        rig['eyeBody'] = info['eyeBody']
        rig['eyeGlow'] = dict(colour=GLOW_RGB, stops=GLOW_STOPS)
    print(f['name'], json.dumps({k: v for k, v in rig.items() if k not in ('eyes',)}))
    return rig, scaled


def paper(im, bg=(246, 241, 232)):
    p = Image.new('RGBA', (im.shape[1], im.shape[0]), bg + (255,))
    p.alpha_composite(Image.fromarray(im, 'RGBA'))
    return p


def shifted(im, dx, dy):
    out = np.zeros_like(im)
    h, w = im.shape[:2]
    ys, xs = slice(max(0, dy), min(h, h + dy)), slice(max(0, dx), min(w, w + dx))
    yd, xd = slice(max(0, -dy), min(h, h - dy)), slice(max(0, -dx), min(w, w - dx))
    out[ys, xs] = im[yd, xd]
    return out


def legs_layer(rig, size, foot_shift=((0, 0), (0, 0)), body_shift=(0, 0)):
    im = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for k, leg in enumerate(rig['legs']):
        hx, hy = leg['hip'][0] + body_shift[0], leg['hip'][1] + body_shift[1]
        ax, ay = leg['ankle'][0] + foot_shift[k][0], leg['ankle'][1] + foot_shift[k][1]
        w, c = leg['width'], tuple(leg['colour']) + (255,)
        d.line([hx, hy, ax, ay], fill=c, width=int(round(w)))
        for x, y in ((hx, hy), (ax, ay)):
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=c)
    return np.array(im)


def over(*layers):
    acc = Image.fromarray(np.zeros_like(layers[0]), 'RGBA')
    for l in layers:
        acc.alpha_composite(Image.fromarray(l, 'RGBA'))
    return np.array(acc)


rigs, tiles = {}, []
for f in FACINGS:
    if not os.path.exists(os.path.join(ROOT, f['src'])):
        print(f['name'], 'skipped: no', f['src'])
        continue
    rig, L = split(f)
    rigs[f['name']] = rig
    size = (L['body'].shape[1], L['body'].shape[0])
    legs = legs_layer(rig, size)
    whole = over(legs, L['foot-0'], L['foot-1'], L['body'])
    tint = lambda im, c: np.dstack([np.full(im.shape[:2] + (3,), c, np.uint8), im[:, :, 3]])
    pieces = over(tint(legs, (40, 160, 90)), tint(L['foot-0'], (40, 110, 200)), tint(L['foot-1'], (200, 60, 60)), L['body'])
    st = int(0.06 * rig['height'])
    lift = -int(0.02 * rig['height'])
    fs = ((st, -st // 2), (-st, st // 2))
    apart = over(legs_layer(rig, size, fs, (0, lift)), shifted(L['foot-0'], *fs[0]), shifted(L['foot-1'], *fs[1]), shifted(L['body'], 0, lift))
    row = [paper(whole), paper(pieces), paper(apart), paper(apart, (60, 45, 35))]
    d = ImageDraw.Draw(row[0])
    for e in rig.get('eyes', []):
        d.ellipse([e['cx'] - e['rx'], e['cy'] - e['ry'], e['cx'] + e['rx'], e['cy'] + e['ry']], outline=(255, 0, 180, 255))
    for yv, col in ((rig['chin'], (0, 170, 0, 255)), (rig['neck'], (200, 0, 0, 255)), (rig['hem'], (0, 120, 255, 255))):
        d.line([0, yv, rig['size'][0], yv], fill=col)
    tiles.append(row)

tw = max(t.width for row in tiles for t in row)
th = max(t.height for row in tiles for t in row)
sheet = Image.new('RGBA', (tw * 4, th * len(tiles)), (255, 255, 255, 255))
for j, row in enumerate(tiles):
    for i, t in enumerate(row):
        sheet.paste(t, (i * tw, j * th))
sheet.save(os.path.join(HERE, 'debug-split.png'))
with open(os.path.join(HERE, 'rig-walk.json'), 'w') as fh_:
    json.dump(rigs, fh_, indent=1)
print('wrote parts/, rig-walk.json, debug-split.png for', ', '.join(rigs))

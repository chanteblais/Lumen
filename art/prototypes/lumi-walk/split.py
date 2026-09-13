"""Split Lumi's two isometric facings into the walk rig's pieces.

    python3 art/prototypes/lumi-walk/split.py

Reads art/lumi/lumi-iso-front.png (turned toward the lower left) and art/lumi/lumi-iso-back.png (turned away,
toward the upper left); the page mirrors each for the other side. For each facing it writes, into parts/:
  <facing>-body.png     the figure without what is below the hem: hood, face, cloak, hands
  <facing>-foot-0.png   the far boot and leg (higher on the page), with a dark leg drawn up under the hem
  <facing>-foot-1.png   the near boot and leg
All three share one canvas, FIG_H px from hood top to feet, so at rest they stack back into the drawing.
rig-walk.json holds, in those pixels: the feet's ground contacts, the hem, the head's weight rows, and for the
front the eyes (for blinks) and the face's black. debug-split.png shows each facing whole, as pieces, and
pulled apart (the feet a stride apart, the body lifted), so a gap under the hem shows before any page does.

Method: the matte is scripts/lumi_cut.py's (flood from outside, holes between the boots cut out, no shadow).
What is "below the hem" is every opaque pixel that isn't cloth (cream or orange, grown a few px to keep the
cloak's outline with the cloak), below the lowest cloth in its column, in the lower part of the figure, in a
part that reaches the ground. The two boots (brown) seed the two feet; each below-the-hem pixel goes to the
nearer boot, and only down to LEG above its boot, so a hand at the hem stays on the body.
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
LEG = 0.11           # a foot piece reaches this share of her height above its boot's top
EXT = 0.08           # the leg drawn up under the hem, as a share of her height
# `keep`: boxes (x0, y0, x1, y1) in the matte's full-resolution pixels that stay on the body whatever they touch.
# The front drawing's right hand hangs at the hem against the near leg, and would otherwise step with that foot.
# `chin`, `neck`: where the head's weight starts to fall and where it reaches zero, as shares of her height from
# the hood top — the hood's lower edge and the shoulders below it, read off debug-split.png.
FACINGS = [
    dict(name='front', src='art/lumi/lumi-iso-front.png', eyes=True, chin=0.46, neck=0.58, keep=[(495, 1064, 660, 1165)]),
    dict(name='back', src='art/lumi/lumi-iso-back.png', eyes=False, chin=0.50, neck=0.62, keep=[(630, 1015, 745, 1135)]),
]
OUT = os.path.join(HERE, 'parts')
os.makedirs(OUT, exist_ok=True)


def split(f):
    sheet = Sheet(os.path.join(ROOT, f['src']), glow=False, shadow=False)
    (y0, y1), = sheet.rows()[:1]
    bbox = sheet.frames(y0, y1, 1)[0]
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
    hem = np.full(W0, top + LOW * fh)
    for x in range(W0):
        c = np.where(cloth[mid:, x])[0]
        if len(c):
            hem[x] = max(hem[x], mid + c.max())
    under = (alpha > 60) & ~cloth_d & (Y > hem[X]) & (Y > top + LOW * fh)
    lab, k = ndi.label(under, structure=np.ones((3, 3)))
    keep = [i + 1 for i in range(k) if (lab == i + 1).sum() > 150 and Y[lab == i + 1].max() >= feet - 0.05 * fh]
    under = np.isin(lab, keep)

    # the boots are a very dark brown (~36, 20, 9 at their median); the legs above them are near-black (~19, 16, 12)
    brown = ndi.binary_opening(under & (r - b > 18) & (r > g) & (lum > 12), iterations=2)
    bl, bk = ndi.label(brown)
    sizes = ndi.sum(brown, bl, range(1, bk + 1))
    seeds = [i + 1 for i in np.argsort(sizes)[::-1][:2] if sizes[i] > 150]
    assert len(seeds) == 2, (f['name'], 'expected two boots', sorted(sizes)[-4:])
    seed_lab = np.zeros_like(bl)
    for n, s in enumerate(seeds):
        seed_lab[bl == s] = n + 1
    idx = ndi.distance_transform_edt(seed_lab == 0, return_indices=True)[1]
    nearest = seed_lab[idx[0], idx[1]]
    foot_masks = []
    for n in (1, 2):
        m = under & (nearest == n)
        boot_top = Y[seed_lab == n].min()
        m &= Y >= boot_top - LEG * fh
        for x0, y0, x1, y1 in f.get('keep', []):
            m[y0:y1, x0:x1] = False
        foot_masks.append(m)
    # far foot first: the one whose ground contact is higher on the page
    contact = []
    for m in foot_masks:
        my = Y[m].max()
        mx = X[m & (Y >= my - 0.02 * fh)].mean()
        contact.append((float(mx), float(my)))
    order = sorted(range(2), key=lambda i: contact[i][1])
    foot_masks = [foot_masks[i] for i in order]
    contact = [contact[i] for i in order]

    body = rgba.copy()
    moved = foot_masks[0] | foot_masks[1]
    body[moved, 3] = 0
    feet_rgba = []
    for m in foot_masks:
        piece = np.zeros_like(rgba)
        piece[m] = rgba[m]
        # a dark leg up under the hem, only where the body covers it at rest, so the drawing is unchanged
        t = Y[m].min()
        cols = np.where(m[t:t + 4].any(axis=0))[0]
        colour = np.median(rgb[m & (Y < t + 8)], axis=0)
        ext = np.zeros_like(m)
        ext[max(0, t - int(EXT * fh)):t, cols.min():cols.max() + 1] = True
        ext &= body[:, :, 3] > 250
        piece[ext, :3] = colour
        piece[ext, 3] = 255
        feet_rgba.append(piece)

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
        bright = [i + 1 for i in np.argsort(hs)[::-1] if lum[hl == i + 1].mean() > 150][:2]
        assert len(bright) == 2, (f['name'], 'expected two eyes')
        eyes = []
        for i in bright:
            rim = (hl == i) & (lum > 95)
            ey, ex = np.where(rim)
            eyes.append(dict(cx=ex.mean(), cy=ey.mean(), rx=2.2 * ex.std(), ry=2.2 * ey.std()))
        info['eyes'] = sorted(eyes, key=lambda e: e['cx'])
        info['faceBlack'] = np.median(rgb[face & dark], axis=0).round().astype(int).tolist()
    info['chin'] = top + f['chin'] * fh
    info['neck'] = top + f['neck'] * fh
    hood = np.where(main[top:top + int(0.4 * fh)].any(axis=0))[0]
    info['hoodX'] = float((hood.min() + hood.max()) / 2)
    info['hem'] = float(np.median(hem[np.where(cloth[mid:].any(axis=0))[0]]))
    info['contact'] = contact

    s = FIG_H / fh
    layers = {'body': body, 'foot-0': feet_rgba[0], 'foot-1': feet_rgba[1]}
    scaled = {}
    for name, im in layers.items():
        scaled[name] = scale(im, im[:, :, 3] > 0, s)[0]
        Image.fromarray(scaled[name], 'RGBA').save(os.path.join(OUT, f"{f['name']}-{name}.png"), optimize=True)
    h, w = scaled['body'].shape[:2]
    S = lambda v: round(float((v + 0.5) * s - 0.5), 2)
    rig = dict(size=[w, h], top=S(info['top']), feet=S(info['feet']), height=round(fh * s, 2),
               chin=S(info['chin']), neck=S(info['neck']), hem=S(info['hem']), hoodX=S(info['hoodX']),
               contact=[[S(x), S(y)] for x, y in info['contact']])
    if f['eyes']:
        rig['eyes'] = [dict(cx=S(e['cx']), cy=S(e['cy']), rx=round(e['rx'] * s, 2), ry=round(e['ry'] * s, 2)) for e in info['eyes']]
        rig['faceBlack'] = info['faceBlack']
    print(f['name'], json.dumps(rig))
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


def over(*layers):
    acc = Image.fromarray(np.zeros_like(layers[0]), 'RGBA')
    for l in layers:
        acc.alpha_composite(Image.fromarray(l, 'RGBA'))
    return np.array(acc)


rigs, tiles = {}, []
for f in FACINGS:
    rig, L = split(f)
    rigs[f['name']] = rig
    whole = over(L['foot-0'], L['foot-1'], L['body'])
    tint = lambda im, c: np.dstack([np.full(im.shape[:2] + (3,), c, np.uint8), im[:, :, 3]])
    pieces = over(tint(L['foot-0'], (40, 110, 200)), tint(L['foot-1'], (200, 60, 60)), L['body'])
    stride = int(0.09 * rig['height'])
    apart = over(shifted(L['foot-0'], stride, -stride // 2), shifted(L['foot-1'], -stride, stride // 2), shifted(L['body'], 0, -int(0.02 * rig['height'])))
    row = [paper(whole), paper(pieces), paper(apart), paper(whole, (60, 45, 35))]
    tiles.append(row)
    if 'eyes' in rig:
        d = ImageDraw.Draw(row[0])
        for e in rig['eyes']:
            d.ellipse([e['cx'] - e['rx'], e['cy'] - e['ry'], e['cx'] + e['rx'], e['cy'] + e['ry']], outline=(255, 0, 180, 255))
        for yv, col in ((rig['chin'], (0, 170, 0, 255)), (rig['neck'], (200, 0, 0, 255)), (rig['hem'], (0, 120, 255, 255))):
            d.line([0, yv, rig['size'][0], yv], fill=col)
        for x, y in rig['contact']:
            d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 0, 0, 255))

tw = max(t.width for row in tiles for t in row)
th = max(t.height for row in tiles for t in row)
sheet = Image.new('RGBA', (tw * 4, th * len(tiles)), (255, 255, 255, 255))
for j, row in enumerate(tiles):
    for i, t in enumerate(row):
        sheet.paste(t, (i * tw, j * th))
sheet.save(os.path.join(HERE, 'debug-split.png'))
with open(os.path.join(HERE, 'rig-walk.json'), 'w') as fh_:
    json.dump(rigs, fh_, indent=1)
print('wrote parts/, rig-walk.json, debug-split.png')

"""Find the knots a turn morphs through: per row, her two silhouette edges and one feature inside them.

    python3 art/prototypes/lumi-walk/morph.py

Run after split.py (it reads parts/<facing>-body.png and rig-walk.json), before build.py.

Chanté, 2026-09-13: "Swap appears slightly better, but it's still pretty choppy." Two neighbouring drawings differ in
more than angle — the hood is a different width, the cloak falls differently, the face sits somewhere else — so a
swap is a jump and a crossfade shows both at once. A morph needs to know what in drawing A is the same thing as what
in drawing B. This writes that correspondence, coarsely but enough: for every row of her, from the hood's top to the
feet line, three x knots

    xL  the silhouette's left edge      (alpha > 127, specks ignored)
    xF  one feature inside her          (see below)
    xR  the silhouette's right edge

and the page warps row by row through them, piecewise-linearly, so A's left edge, feature and right edge land on the
same three places as B's, and the two drawings can be crossfaded without ghosting.

The feature, chosen for being the one large high-contrast thing that slides across her as she turns:
  over the hood (hood top to the chin)  a view with a face: the dark void inside the hood — the face.
                                        a view from behind: the big orange sun embroidered on the hood.
  below the hood (chin to the hem)      the dark cluster at her front — the coat's slit, the bow and the medallions —
                                        where a drawing has one; a view from behind has none.
Rows with no feature take it from the nearest rows that do (a straight interpolation), and where a drawing has none at
all the knot is the silhouette's midpoint. The feature is then pulled back toward the midpoint as it leaves the rows
that measured it, so a drawing that has a bow and a neighbour that doesn't still agree low down her cloak. Each of the
three columns is smoothed vertically with a small Gaussian so no row disagrees with the row above it and the mesh
cannot tear.

Only the nine drawn facings are measured. The page mirrors the other seven itself (x → width − 1 − x, and L and R
swap), so they need no data. out/morph-knots.png draws the three curves over each drawing — the check that the face
knot really rides the face round the ring.
"""
import json
import os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
SIG_EDGE = 2.0      # rows of Gaussian on the silhouette edges — enough to steady them, not enough to round her off
                    # the shape (a smoothed edge lands somewhere the drawing's real edge isn't, and the two drawings'
                    # outlines then miss each other by a pixel and show as a doubled contour mid-morph)
SIG_FEAT = 9.0      # and on the feature, which is noisier
FADE = 0.10         # the feature relaxes to the silhouette midpoint over this share of her height past its last row
MIN_BLOB = 0.004    # a feature component must cover this share of the figure's pixels to count
NARROW = 0.06       # rows narrower than this share of her height are the empty tail below the hem, not silhouette


def largest(mask, area):
    """The biggest connected component of `mask`, or None if none is big enough."""
    lab, k = ndi.label(mask)
    if not k:
        return None
    sizes = ndi.sum(mask, lab, range(1, k + 1))
    i = int(np.argmax(sizes))
    if sizes[i] < MIN_BLOB * area:
        return None
    return lab == i + 1


def fill(col, have):
    """Interpolate a column where it has no value, from the nearest rows that do."""
    idx = np.where(have)[0]
    if not len(idx):
        return None
    return np.interp(np.arange(len(col)), idx, col[idx])


def knots(name, R):
    im = np.array(Image.open(os.path.join(HERE, 'parts', f'{name}-body.png')).convert('RGBA')).astype(int)
    a, rgb = im[:, :, 3], im[:, :, :3]
    lum = rgb.mean(axis=2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    H, W = a.shape
    Y, X = np.mgrid[0:H, 0:W]

    # the silhouette, specks removed: the biggest piece of her plus anything of size, so a sleeve held clear still counts
    sil = a > 127
    lab, k = ndi.label(ndi.binary_opening(sil, iterations=1))
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, k + 1))
    keep = [i + 1 for i in range(k) if sizes[i] > 40]
    sil = np.isin(lab, keep)

    row0, row1 = int(np.floor(R['top'])), int(np.ceil(R['feet']))
    rows = np.arange(row0, row1 + 1)
    xL = np.zeros(len(rows)); xR = np.zeros(len(rows)); have = np.zeros(len(rows), bool)
    for i, y in enumerate(rows):
        xs = np.where(sil[y])[0]
        if len(xs) and xs.max() - xs.min() > NARROW * R['height']:
            # below the hem the body is only a few dark scraps of the cloak's outline: a row that narrow is the empty
            # tail, and holding the hem's edges there keeps the mesh from collapsing to a line
            xL[i], xR[i], have[i] = xs.min(), xs.max(), True
    xL, xR = fill(xL, have), fill(xR, have)

    # the feature: the face or the hood's sun over the hood rows, the bow and medallions below them
    area = sil.sum()
    solid = a > 200
    inside = ndi.binary_erosion(solid, iterations=4)   # never the outline, which would only repeat the edges
    dark = inside & (lum < 55)
    orange = inside & (r > 150) & (r - b > 70) & (g > 60) & (g < 200)
    chin, hem = R['chin'], R['hem']
    head = Y < chin
    torso = (Y >= chin) & (Y < hem)
    feat = largest(dark & head, area) if not R.get('back') else largest(orange & head, area)
    if feat is None:
        feat = largest((dark | orange) & head, area)
    # only a drawing that shows her front has the bow: from behind the cloak's dark scraps are not the same thing at
    # all, and pairing them with a neighbour's bow would shear the cloak
    low = None if R.get('back') else largest(dark & torso, area)
    if low is not None:
        feat = feat | low if feat is not None else low

    xF = np.zeros(len(rows)); fh = np.zeros(len(rows), bool)
    if feat is not None:
        for i, y in enumerate(rows):
            xs = np.where(feat[y])[0]
            if len(xs):
                xF[i], fh[i] = xs.mean(), True
    mid = (xL + xR) / 2
    if fh.any():
        xF = fill(xF, fh)
        # away from the rows that measured it the feature is no longer evidence: fade it into the midpoint, so two
        # drawings that measured different things low down (a bow on one, nothing on the other) still agree there
        mrows = rows[fh]
        dist = np.maximum(mrows.min() - rows, rows - mrows.max()).clip(0)
        w = 1 - np.clip(dist / (FADE * R['height']), 0, 1)
        xF = xF * w + mid * (1 - w)
    else:
        xF = mid.copy()

    xL = ndi.gaussian_filter1d(xL, SIG_EDGE, mode='nearest')
    xR = ndi.gaussian_filter1d(xR, SIG_EDGE, mode='nearest')
    xF = ndi.gaussian_filter1d(xF, SIG_FEAT, mode='nearest')
    xF = np.clip(xF, xL + 0.5, xR - 0.5)   # the feature stays strictly between the edges: the warp must stay monotonic
    what = 'none' if feat is None else ('sun' if R.get('back') else 'face') + ('+bow' if low is not None else '')
    # which side of her the feature is on. The face and the bow are her front, the hood's sun her back: two drawings
    # that measured different sides measured different things, and the page must not pair them — between side-on and
    # the first view from behind it drops to the two silhouette knots alone rather than dragging the face inward.
    kind = 'back' if R.get('back') else 'front'
    return rows, xL, xF, xR, what, kind


rig = json.load(open(os.path.join(HERE, 'rig-walk.json')))
out, tiles = {}, []
for name in sorted(rig):
    R = rig[name]
    rows, xL, xF, xR, what, kind = knots(name, R)
    out[name] = dict(row0=int(rows[0]), head=[int(np.floor(R['top'])), int(round(R['chin']))],
                     hem=int(round(R['hem'])), feet=int(np.ceil(R['feet'])), what=what, kind=kind,
                     rows=[[round(float(l), 2), round(float(f), 2), round(float(r), 2)] for l, f, r in zip(xL, xF, xR)])
    at = lambda s: int(round(R['top'] + s * R['height'])) - rows[0]
    share = lambda i: (xF[i] - xL[i]) / max(1e-6, xR[i] - xL[i]) * 100
    print(f'{name:4s} rows {rows[0]}..{rows[-1]}  {what:9s} ({kind})  widest row {(xR - xL).max():5.1f}px  '
          f'feature across her: {share(at(0.2)):5.1f}% at the eyes, {share(at(0.45)):5.1f}% at the chin, {share(at(0.75)):5.1f}% at the waist')

    im = Image.open(os.path.join(HERE, 'parts', f'{name}-body.png')).convert('RGBA')
    tile = Image.new('RGBA', im.size, (246, 241, 232, 255))
    tile.alpha_composite(im)
    d = ImageDraw.Draw(tile)
    for col, colour in ((xL, (40, 110, 200)), (xF, (220, 20, 130)), (xR, (40, 160, 90))):
        d.line([(float(x), float(y)) for x, y in zip(col, rows)], fill=colour + (255,), width=2)
    d.text((4, 4), f'{name} ({what})', fill=(30, 20, 10, 255))
    tiles.append(tile)

with open(os.path.join(HERE, 'morph.json'), 'w') as fh:
    json.dump(out, fh, separators=(',', ':'))
tw, th = max(t.width for t in tiles), max(t.height for t in tiles)
sheet = Image.new('RGB', (tw * len(tiles), th), (255, 255, 255))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * tw, 0))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sheet.save(os.path.join(HERE, 'out', 'morph-knots.png'))
print('wrote morph.json and out/morph-knots.png for', ', '.join(sorted(out)))

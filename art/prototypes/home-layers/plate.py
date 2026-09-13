"""Build Home's empty plate, the furniture layers and their shadows from the painting and the chosen inpaint
candidates, check that they recompose to the painting, and write the room file.

    python3 art/prototypes/home-layers/plate.py

Reads room.src.json (the hand-traced polygons and `plate_candidates`, one out/inpaint/ file per cluster). Writes
art/scenery/home/plate.png, art/scenery/home/layers/<id>.png and <id>-shadow.png, art/scenery/home/layers.json, and
out/recompose-diff.png, out/seams-<cluster>-<k>.png, out/plate-small.png. Prints the recompose error.

**Method.**
1. *The inpaint, corrected.* Each candidate is laid into the painting inside its cluster's hole and colour-corrected by
   its difference to the relit painting (below) in a ring 3-14px outside the items' polygons, spread inward at two
   scales (Gaussian 6 and 30), so no colour step is left where it meets the painting.
2. *The shadow field.* Over the rest of the hole (floor the item shades but doesn't cover), a = 1 - the ratio of the
   painting's to the inpaint's local luminance (Gaussian 5, measured only on that floor), clipped to 0..0.85 and faded
   out over the hole's last 10px. The painting divided by (1 - a) is that floor unshaded, with its own pattern kept.
3. *A layer's alpha.* 1 inside its body polygons shrunk 2px. In its edge band — the body polygons grown 2px, and all of
   a foliage polygon grown 2px, each pixel belonging to the nearest item — the difference matte against the corrected
   inpaint: smoothstep(t, 3t) of the summed RGB difference, t = 10 + 4% of the pixel's brightness (so dark leaves on
   dark wood aren't lost), with parts under 6px touching nothing bigger dropped and one-pixel gaps closed.
4. *The plate.* The corrected inpaint where some layer covers (alpha > 0, feathered ~2px), the unshaded painting
   elsewhere in the hole, the painting outside it. So the inpaint is only ever seen through a layer's soft edge, and
   everywhere else the plate keeps the painting's own floor.
5. *Colour* de-matted against that plate: (painting - (1 - alpha) plate) / alpha. *Shadows*: black at alpha a (drawn on
   the plate it multiplies it by 1 - a), for the floor outside the layers, given to the nearest item that casts one;
   in the feather, the darkening that is left (1 - painting/plate luminance) goes there too.
Pixels inside two items' polygons belong to the one in front (depth.order).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)
import depth  # noqa: E402
import fringe  # noqa: E402
from inpaint import MARGIN, hole_for, poly_mask  # noqa: E402

OUT = os.path.join(HERE, 'out')
SCENE = os.path.join(ROOT, 'art', 'scenery', 'home')
LUM = np.array([0.299, 0.587, 0.114])
GROW = 2      # a polygon grown this far is where the item's pixels may be (traced ~2px outside the silhouette)
CORE = 2      # a solid polygon shrunk this far is surely the item (the polygons are traced ~2px outside the silhouette;
              # at 3 the tabletop's edge kept one-pixel holes her cloak showed through)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def nconv(v, m, s):
    return ndi.gaussian_filter(v * m, s), ndi.gaussian_filter(m.astype(float), s)


def spread(v, m, s1=6, s2=30):
    """v measured where m, spread everywhere: a fine normalised convolution where it has support, a coarse one elsewhere."""
    c1, m1 = nconv(v, m, s1)
    c2, m2 = nconv(v, m, s2)
    t = np.clip(m1 / 0.05, 0, 1)
    return t * c1 / np.maximum(m1, 1e-6) + (1 - t) * c2 / np.maximum(m2, 1e-9)


room = json.load(open(os.path.join(HERE, 'room.src.json')))
W, H = room['size']
orig = np.array(Image.open(os.path.join(ROOT, room['painting'])).convert('RGB')).astype(np.float64)
lum_o = orig @ LUM
byid = {L['id']: L for L in room['layers']}
ground = {L['id']: (L['extent'] or L['footprint']) for L in room['layers']}
order = depth.order(ground)                                   # back to front
solid = {i: poly_mask(byid[i]['body'], (W, H)) for i in order}
fol = {i: poly_mask(byid[i]['foliage'], (W, H)) if byid[i]['foliage'] else np.zeros((H, W), bool) for i in order}
items = {i: solid[i] | fol[i] for i in order}
anyitem = np.any(list(items.values()), axis=0)
own, taken = {}, np.zeros((H, W), bool)
for i in reversed(order):                                     # the front item keeps the pixels two items share
    own[i] = items[i] & ~taken
    taken |= items[i]
near_item = np.argmin([ndi.distance_transform_edt(~own[i]) for i in order], axis=0)

INP = orig.copy()                  # the corrected inpaint, inside the holes
SH = np.zeros((H, W))              # the shadow field, inside the holes
HOLE = np.zeros((H, W), bool)
IN = np.zeros((H, W), bool)        # where an item's pixels may be: its polygons grown GROW, inside a chosen hole
holes = {}
cands = room.get('plate_candidates', {})
for cl, spec in room['clusters'].items():
    if cl not in cands:
        print(f'cluster {cl}: no candidate chosen, left as painted')
        continue
    hole = hole_for(room, cl)
    holes[cl] = hole
    ys, xs = np.where(hole)
    x0, y0 = max(0, xs.min() - MARGIN), max(0, ys.min() - MARGIN)
    cand = np.array(Image.open(os.path.join(OUT, 'inpaint', cands[cl])).convert('RGB')).astype(np.float64)
    inp = orig.copy()
    inp[y0:y0 + cand.shape[0], x0:x0 + cand.shape[1]] = cand
    ids = spec['layers']
    cl_in = ndi.binary_dilation(np.any([items[i] for i in ids], axis=0), iterations=GROW) & hole
    floor = hole & ~cl_in
    if any(byid[i]['shadow'] for i in ids):
        no, mo = nconv(lum_o, floor, 5)
        ni, mi = nconv(inp @ LUM, floor, 5)
        k = (no / np.maximum(mo, 1e-6)) / np.maximum(ni / np.maximum(mi, 1e-6), 1)
        a = np.clip(1 - k, 0, 0.85) * np.clip((ndi.distance_transform_edt(hole) - 2) / 8, 0, 1)
        a[(a < 0.03) | ~hole] = 0
    else:
        a = np.zeros((H, W))
    relit = orig / (1 - a)[:, :, None]
    dout = ndi.distance_transform_edt(~cl_in)
    ring = (dout > 3) & (dout < 14) & hole
    corr = np.dstack([spread((relit - inp)[:, :, c], ring) for c in range(3)])
    INP = np.where(hole[:, :, None], inp + corr, INP)
    SH = np.where(hole, a, SH)
    HOLE |= hole
    IN |= cl_in
    print(f'cluster {cl}: {cands[cl]}, hole {int(hole.sum())} px, colour correction mean {np.abs(corr[cl_in]).mean():.1f}')

INP = np.clip(INP, 0, 255)
lum_i = INP @ LUM
d = np.abs(orig - INP).sum(axis=2)
bright = (orig.sum(axis=2) + INP.sum(axis=2)) / 2
t0 = 10 + 0.04 * bright
matte = smoothstep(t0, 3 * t0, d)

grown_all = ndi.binary_dilation(anyitem, iterations=GROW)
PB = np.zeros_like(orig)           # the floor colour next to a solid edge, and how much to trust it, for the plate under the edge
PBw = np.zeros((H, W))
alpha = {}
DIAG = {}
for n, i in enumerate(order):
    core = ndi.binary_erosion(solid[i], iterations=CORE) & own[i]
    region = (ndi.binary_dilation(solid[i], iterations=GROW) | ndi.binary_dilation(fol[i], iterations=GROW)) & IN & (near_item == n)
    a = np.where(region, matte, 0.0)
    use = np.zeros((H, W), bool)
    if core.any():
        # the colour line: in a solid polygon's band, the pixel's place between the item's own colour nearby (from its
        # core) and the floor's (the painting just outside every polygon) — the difference from the inpaint is unreliable
        # where the painted-in floor happens to match the item (a lamplit tabletop over lamplit rug)
        ring_bg = ndi.binary_dilation(items[i], iterations=GROW + 5) & ~grown_all & HOLE
        F = np.dstack([spread(orig[:, :, c], core, 2.5, 8) for c in range(3)])
        Bg = np.dstack([spread(orig[:, :, c], ring_bg, 3, 10) for c in range(3)])
        FB = F - Bg
        den = (FB ** 2).sum(axis=2)
        line = np.clip(((orig - Bg) * FB).sum(axis=2) / np.maximum(den, 1), 0, 1)
        trust = smoothstep(25, 60, np.sqrt(den))
        use = region & ~core & ~ndi.binary_dilation(fol[i], iterations=GROW)
        a = np.where(use, trust * line + (1 - trust) * matte, a)
        PB = np.where(use[:, :, None], Bg, PB)
        PBw = np.where(use, trust, PBw)
    on = (a > 0.4) | core
    lab, cnt = ndi.label(on)
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, cnt + 1)) if cnt else np.array([])
    small = np.isin(lab, [k + 1 for k, s in enumerate(sizes) if s < 6]) & ~core
    a = np.where(small, 0, a)
    gaps = ndi.binary_closing(on & ~small, iterations=1) & region & ~(on & ~small)
    a = np.where(gaps, np.maximum(a, 0.8), a)
    A = np.where(core, 1.0, a)
    A[A < 0.02] = 0
    alpha[i] = A
    DIAG[i] = dict(core=core, use=use, folreg=region & ndi.binary_dilation(fol[i], iterations=GROW), A_pre=A.copy(), gaps=gaps)

cover = np.any([alpha[i] > 0 for i in order], axis=0)
w = np.maximum(np.clip(ndi.gaussian_filter(cover.astype(float), 1.0) * 2, 0, 1) * IN, cover)
SH = np.where(cover, 0, SH)
relit = orig / (1 - SH)[:, :, None]
plate = np.where(HOLE[:, :, None], w[:, :, None] * INP + (1 - w[:, :, None]) * relit, orig)
# under a solid edge the plate is the floor colour the colour line was measured against, so the edge de-mattes to the item
ov = (PBw > 0) & cover
plate = np.where(ov[:, :, None], PBw[:, :, None] * PB + (1 - PBw[:, :, None]) * plate, plate)
plate = np.clip(plate, 0, 255)
# the smallest alpha that de-mattes to a colour in range: where the plate is not what was behind, the edge keeps a little more
need = np.where(orig > plate, (orig - plate) / np.maximum(255 - plate, 1), (plate - orig) / np.maximum(plate, 1)).max(axis=2)
for i in order:
    alpha[i] = np.where(alpha[i] > 0, np.maximum(alpha[i], np.clip(need, 0, 1)), 0)
# what each step of the matte kept, for fringe.py's attribution
for i in order:
    ys, xs = np.where((alpha[i] > 0) | DIAG[i]['use'] | DIAG[i]['folreg'])
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    np.savez_compressed(os.path.join(OUT, f'diag-{i}.npz'), origin=np.array([y0, x0]),
                        dinp=d[y0:y1, x0:x1].astype(np.float32),
                        **{k: (v[y0:y1, x0:x1].astype(np.float32) if k == 'A_pre' else v[y0:y1, x0:x1]) for k, v in DIAG[i].items()})
lum_p = plate @ LUM
# the feather, where the plate is part inpaint and nothing covers it: the darkening left over goes to the shadow
feather = (w > 0) & ~cover & HOLE
SH = np.where(feather, np.clip(1 - lum_o / np.maximum(lum_p, 1), 0, 0.85), SH)

# ---- the trim: floor a layer carries is not the piece, and layers draw over her -----------------------------------
# A layer loses (alpha 0): its pixels beyond its own (ungrown) polygons; below its ground outline, anything not inside a
# solid polygon or foliage (only legs reach below it); floor-coloured pixels (fringe.py) joined to those or to where the
# layer is already empty through other floor-coloured pixels; floor-coloured pixels in foliage (rug between leaves);
# and then any bit under 10px left touching neither its solid core nor a leaf.
TRIM = np.zeros((H, W), bool)
HARD = []
for i, rnd in [(i, r) for r in range(3) for i in order]:   # twice: the first trim exposes edges the second can reach;
    A = alpha[i]                                            # then hardened, and trimmed once more
    if rnd == 2:
        # teeth: a partial or one-pixel-empty edge lets her cloak show through the piece in white specks. Inside its
        # polygons (never where the trim took floor), fill one-pixel holes and raise partial alpha — only up, so the
        # de-matted colour stays in range and the recompose exact; the third trim takes back anything that is floor.
        inside = (solid[i] | fol[i]) & ~TRIM
        solidish = A > 0.5
        holes1 = ndi.binary_closing(solidish, structure=np.ones((3, 3)), iterations=1) & ~solidish & inside
        raised = np.where(A > 0, np.maximum(A, smoothstep(0.1, 0.45, A)), 0)
        A = np.where(holes1, np.maximum(raised, 1.0), np.where(inside, raised, A))
        HARD.append((i, int(holes1.sum()), int(((A > alpha[i] + 0.05) & ~holes1).sum())))
        alpha[i] = A
    fl = fringe.floor_like(orig, A, solid[i], fol[i], anyitem)[0]
    edge = (A > 0) & ndi.binary_dilation(A == 0, iterations=4)   # floor-coloured within 4px of where the layer is empty
    outside = (A > 0) & ~solid[i] & ~fol[i]
    below = np.zeros((H, W), bool)
    g = ground[i]
    for x in range(max(0, int(np.ceil(min(p[0] for p in g)))), min(W, int(max(p[0] for p in g)) + 1)):
        m = depth.strip_max_y(g, x, x)
        if m is not None:
            below[int(m) + 2:, x] = True
    below &= (A > 0) & ~solid[i] & ~fol[i]
    seeds = fl & ndi.binary_dilation((A == 0) | outside | below, iterations=1)
    trim = outside | below | ndi.binary_propagation(seeds, mask=fl) | (fl & ndi.binary_dilation(fol[i], iterations=GROW)) | (fl & edge)
    keep = (A > 0) & ~trim
    lab, cnt = ndi.label(keep, structure=np.ones((3, 3)))
    if cnt:
        anchor = ndi.binary_erosion(solid[i], iterations=CORE) | (fol[i] & (A > 0.5))
        sizes = ndi.sum(np.ones_like(lab), lab, range(1, cnt + 1))
        touch = ndi.maximum(anchor, lab, range(1, cnt + 1))
        trim |= np.isin(lab, [k + 1 for k in range(cnt) if sizes[k] < 10 and not touch[k]])
    trim &= A > 0
    print(f'  trim pass {rnd + 1} {i:14s} {int(trim.sum()):5d} px (alpha-weighted {A[trim].sum():7.1f}) of {int((A > 0).sum())}')
    alpha[i] = np.where(trim, 0, A)
    TRIM |= trim
for i, nh, nr in HARD:
    print(f'  hardened {i:14s} {nh:5d} one-pixel holes filled, {nr:5d} partial edge px raised')
# where the trim exposed the plate, the plate is the painting's own floor, relit by the shadow spread in from beside it
cover = np.any([alpha[i] > 0 for i in order], axis=0)
expose = TRIM & ~cover
SHf = np.clip(spread(SH, HOLE & ~cover & ~TRIM, 1.5, 6), 0, 0.85)
plate = np.where(expose[:, :, None], np.clip(orig / (1 - SHf)[:, :, None], 0, 255), plate)
lum_p = plate @ LUM
SH = np.where(expose, np.clip(1 - lum_o / np.maximum(lum_p, 1), 0, 0.85), SH)
print(f'trim: {int(expose.sum())} px of plate exposed')

lit = [n for n, i in enumerate(order) if byid[i]['shadow']]
near_lit = np.array(lit)[np.argmin([ndi.distance_transform_edt(~items[order[n]]) for n in lit], axis=0)]
shadow = {i: np.where(near_lit == n, SH, 0) if byid[i]['shadow'] else np.zeros((H, W)) for n, i in enumerate(order)}
colour = {i: np.clip((orig - (1 - alpha[i])[:, :, None] * plate) / np.maximum(alpha[i], 0.02)[:, :, None], 0, 255) for i in order}

# quantise as the files will hold them, then recompose from the quantised pieces
plate8 = np.round(plate).astype(np.uint8)
comp = plate8.astype(np.float64)
for i in order:
    comp *= (1 - np.round(shadow[i] * 255) / 255)[:, :, None]
for i in order:
    A8 = np.round(alpha[i] * 255) / 255
    comp = comp * (1 - A8[:, :, None]) + np.round(colour[i]) * A8[:, :, None]
err = np.abs(comp - orig)
union = HOLE
report = {'overall': (float(err.mean()), float(err.max())), 'holes': (float(err[union].mean()), float(err[union].max())) if union.any() else None}
print(f"recompose |error| (0-255, per channel): whole painting mean {report['overall'][0]:.3f} max {report['overall'][1]:.0f}")
if report['holes']:
    print(f"  inside the holes: mean {report['holes'][0]:.2f} max {report['holes'][1]:.0f}, "
          f"{100 * (err.max(axis=2)[union] > 8).mean():.2f}% of their pixels off by more than 8")
if expose.any():
    ex = err.max(axis=2)[expose]
    print(f'  where the trim exposed the plate ({int(expose.sum())} px): mean {err[expose].mean():.2f} max {err[expose].max():.0f}, '
          f'{100 * (ex > 8).mean():.2f}% off by more than 8')
    np.savez_compressed(os.path.join(OUT, 'exposed.npz'), expose=expose, err=err.max(axis=2).astype(np.float32))
per = {}
for i in order:
    m = poly_mask([byid[i]['mask']], (W, H))
    e = err[m]
    per[i] = (float(e.mean()), float(e.max()), float((err.max(axis=2)[m] > 8).mean()))
    print(f'  {i:14s} mask: mean {per[i][0]:.2f} max {per[i][1]:.0f}  ({100 * per[i][2]:.2f}% of pixels off by more than 8)')

os.makedirs(os.path.join(SCENE, 'layers'), exist_ok=True)
for f in os.listdir(os.path.join(SCENE, 'layers')):
    os.remove(os.path.join(SCENE, 'layers', f))
Image.fromarray(plate8).save(os.path.join(SCENE, 'plate.png'), optimize=True)


def crop(rgba, name):
    ys, xs = np.where(rgba[:, :, 3] > 0)
    if not len(ys):
        return None
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    Image.fromarray(rgba[box[1]:box[3], box[0]:box[2]]).save(os.path.join(SCENE, 'layers', name), optimize=True)
    return {'src': f'layers/{name}', 'offset': [box[0], box[1]]}


layers_out = []
for i in order:
    L = byid[i]
    body = crop(np.dstack([np.round(colour[i]), np.round(alpha[i] * 255)]).astype(np.uint8), f'{i}.png')
    sh = crop(np.dstack([np.zeros((H, W, 3)), np.round(shadow[i] * 255)]).astype(np.uint8), f'{i}-shadow.png') if L['shadow'] else None
    layers_out.append({
        'id': i, 'src': body['src'], 'offset': body['offset'], 'shadow': sh,
        'footprint': L['footprint'], 'extent': L['extent'], 'height': L['height'],
        'anchors': {k: {'at': v, 'proposal': True} for k, v in L['anchors'].items()},
    })

blocked = []
for L in room['layers']:
    blocked += [{'of': L['id'], 'poly': p} for p in depth.grow(L['extent'] or L['footprint'])]
for B in room['blockers']:
    blocked += [{'of': B['id'], 'poly': p} for p in depth.grow(B['footprint'])]
pairs = []
for x_ in order:
    for y_ in order:
        if x_ < y_:
            f = depth.in_front(ground[x_], ground[y_])
            if f: pairs.append([x_, y_] if f > 0 else [y_, x_])

doc = {
    'about': "Home as an empty plate plus furniture layers, cut from art/scenery/home/background.png (2026-09-13, "
             "art/prototypes/home-layers/). A prototype, not served. Painting px throughout. Draw the plate, then every "
             "shadow, then the layers and Lumi in depth order (`depth`). Built by plate.py from room.src.json.",
    'plate': 'plate.png',
    'painting': 'background.png',
    'size': room['size'],
    'iso': {'slope': room['iso']['slope'], 'note': 'ground u = (x + y/slope)/2, v = (y/slope - x)/2; toward the camera is +u and +v'},
    'lumi': {'height': room['lumi']['height'], 'halfWidth': depth.HALF, 'reach': depth.REACH, 'clearance': depth.CLEARANCE,
             'note': "hood top to feet in painting px at every depth; halfWidth is her cloak at her feet, reach how far her "
                     "drawing spreads either side of them (hem, hands), clearance her body's reach on the floor"},
    'depth': {
        'rule': "An item draws over Lumi when some point of its ground polygon (extent if given, else footprint) lies in "
                "one of her page columns (feet x ± halfWidth) lower on the page than her feet. In one page column two "
                "ground points differ only in u + v, so lower on the page is toward the camera. Items are vertical "
                "extrusions of their ground polygon, so one with no ground in her feet columns can only meet the wider "
                "parts of her drawing: if its ground comes within her reach (feet x ± reach), test at its column nearest "
                "her feet; out of reach it cannot overlap her. A ground point counts as lower only by more than `margin` "
                "px, so a footprint corner level with her feet doesn't cover her hem. Order the "
                "layers and Lumi by a topological sort of that relation (`infront` holds it between layers, [front, "
                "back]), ties by the lowest point. Shadows are drawn on the plate before any layer or Lumi.",
        'margin': depth.MARGIN,
        'order': order,
        'infront': pairs,
    },
    'layers': layers_out,
    'blockers': [{'id': B['id'], 'footprint': B['footprint'], 'note': 'stays in the plate; blocks the floor only'} for B in room['blockers']],
    'floor': room['floor'],
    'walkable': {
        'note': "Her feet may stand inside `floor` and outside every polygon of `minus`: each item's extent or footprint, and "
                "each blocker, grown by her clearance as a ground circle (an ellipse clearance wide and clearance*slope "
                "tall on the page; one hull per convex polygon, one per edge of a concave one).",
        'floor': room['floor'],
        'minus': blocked,
    },
    'inventory': room['inventory'],
    'recompose': {'meanAbs': round(report['overall'][0], 3), 'maxAbs': round(report['overall'][1]),
                  'perMask': {i: {'meanAbs': round(v[0], 2), 'maxAbs': round(v[1]), 'over8': round(v[2], 4)} for i, v in per.items()}},
}
json.dump(doc, open(os.path.join(SCENE, 'layers.json'), 'w'), indent=1)
print('wrote art/scenery/home/plate.png, layers/, layers.json')

# the heatmap: the painting dimmed, the largest channel error x6 in red, the masks outlined
heat = orig * 0.35
heat[:, :, 0] = np.maximum(heat[:, :, 0], np.clip(err.max(axis=2) * 6, 0, 255))
hm = Image.fromarray(heat.astype(np.uint8))
dr = ImageDraw.Draw(hm)
for i in order:
    dr.line([tuple(p) for p in byid[i]['mask'] + byid[i]['mask'][:1]], fill=(80, 200, 255), width=1)
hm.save(os.path.join(OUT, 'recompose-diff.png'))
Image.fromarray(plate8).resize((W // 2, H // 2), Image.LANCZOS).save(os.path.join(OUT, 'plate-small.png'))

# seams at 3x: tiles over each cluster's hole
for f in os.listdir(OUT):
    if f.startswith('seams-'):
        os.remove(os.path.join(OUT, f))
for cl, hole in holes.items():
    ys, xs = np.where(hole)
    k = 0
    for ty in range(ys.min() - 12, ys.max() + 12, 220):
        for tx in range(xs.min() - 12, xs.max() + 12, 300):
            box = (max(0, tx), max(0, ty), min(W, tx + 300), min(H, ty + 220))
            tile = Image.fromarray(plate8).crop(box)
            tile.resize((tile.width * 3, tile.height * 3), Image.LANCZOS).save(os.path.join(OUT, f'seams-{cl}-{k}-{box[0]}-{box[1]}.png'))
            k += 1
print('wrote out/recompose-diff.png, out/plate-small.png, out/seams-*.png')

"""Which of a layer's pixels are floor, not furniture — the measurement behind the fringe cleanup.

    python3 art/prototypes/home-layers/fringe.py            # classify the current layers, and (if plate.py left
                                                            # out/diag-*.npz) say which step of the matte kept them

**Floor-coloured.** For each pixel a layer draws (alpha > 0) outside its body polygons shrunk 4px, the nearest colour
among the painting's floor pixels nearby (a ring 3-20px outside every polygon, within ±40px of the pixel's 32px tile)
and among the piece's own pixels nearby (its body polygons shrunk 4px, plus foliage pixels far from any floor colour).
A pixel is floor-coloured when its colour is within 16 (RGB distance) of a nearby floor pixel and under 0.6 of the
distance to the nearest piece colour — or when it is a nearby floor colour in shade: its RGB direction within 0.02 of
a floor pixel's (and under 0.6 of the nearest piece colour's), at 0.3-1x its brightness. It judges the painting's
colour at the pixel, which is what a layer shows.

    --ref <commit>   classify the layers as committed there (extracted to out/ref-<commit>/), not the working tree's
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)
from inpaint import poly_mask  # noqa: E402

T, RATIO, TILE, PAD, RING = 16.0, 0.6, 32, 40, 20
SHADE_ANGLE = 0.02   # unit-RGB distance for "the same colour as that floor, in shade"


def nearest(pix, samples):
    if len(samples) < 6:
        return np.full(len(pix), np.inf)
    return cKDTree(samples).query(pix, k=1)[0]


def floor_like(orig, alpha, solid, fol, anyitem):
    """Boolean map: pixels this layer draws that are floor-coloured. Also returns the two distances."""
    H, W = alpha.shape
    ring = ndi.binary_dilation(solid | fol, iterations=RING) & ~ndi.binary_dilation(anyitem, iterations=3)
    core = ndi.binary_erosion(solid, iterations=4)
    judge = (alpha > 0) & ~core
    dfl = np.full((H, W), np.inf)
    dit = np.full((H, W), np.inf)
    want = judge | (fol & (alpha > 0.5))
    ys, xs = np.where(want)
    if not len(ys):
        return np.zeros((H, W), bool), dfl, dit
    boxes = [(ty, tx) for ty in range(ys.min(), ys.max() + 1, TILE) for tx in range(xs.min(), xs.max() + 1, TILE)]
    win = lambda ty, tx: (slice(max(0, ty - PAD), min(H, ty + TILE + PAD)), slice(max(0, tx - PAD), min(W, tx + TILE + PAD)))
    for ty, tx in boxes:                                  # distance to floor colours
        J = want[ty:ty + TILE, tx:tx + TILE]
        if not J.any():
            continue
        jy, jx = np.where(J)
        sw = win(ty, tx)
        dfl[ty + jy, tx + jx] = nearest(orig[ty + jy, tx + jx], orig[sw][ring[sw]])
    piece = core | (fol & (alpha > 0.5) & (dfl > 2.5 * T))
    unit = orig / np.maximum(np.linalg.norm(orig, axis=2, keepdims=True), 1)
    shaded = np.zeros((H, W), bool)
    for ty, tx in boxes:                                  # distance to the piece's own colours; floor in shade
        J = judge[ty:ty + TILE, tx:tx + TILE]
        if not J.any():
            continue
        jy, jx = np.where(J)
        sw = win(ty, tx)
        py, px = ty + jy, tx + jx
        dit[py, px] = nearest(orig[py, px], orig[sw][piece[sw]])
        # the same colour as a floor pixel nearby, only darker (0.3-1x): its direction in RGB, not its brightness
        fs, ps = orig[sw][ring[sw]], orig[sw][piece[sw]]
        if len(fs) >= 6 and len(ps) >= 6:
            fd, fi = cKDTree(unit[sw][ring[sw]]).query(unit[py, px], k=1)
            pd = cKDTree(unit[sw][piece[sw]]).query(unit[py, px], k=1)[0]
            kk = np.linalg.norm(orig[py, px], axis=1) / np.maximum(np.linalg.norm(fs[fi], axis=1), 1)
            shaded[py, px] = (fd < SHADE_ANGLE) & (fd < RATIO * pd) & (kk > 0.3) & (kk < 1.02)
    return judge & (((dfl < T) & (dfl < RATIO * dit)) | shaded), dfl, dit


def scene_at(ref=None):
    """art/scenery/home, or its layers.json and layers/ as committed at `ref`, extracted under out/ref-<ref>/."""
    scene = os.path.join(ROOT, 'art', 'scenery', 'home')
    if not ref:
        return scene
    import subprocess
    dest = os.path.join(HERE, 'out', f'ref-{ref}')
    os.makedirs(os.path.join(dest, 'layers'), exist_ok=True)
    show = lambda p: subprocess.run(['git', 'show', f'{ref}:art/scenery/home/{p}'], cwd=ROOT, check=True, capture_output=True).stdout
    open(os.path.join(dest, 'layers.json'), 'wb').write(show('layers.json'))
    for L in json.load(open(os.path.join(dest, 'layers.json')))['layers']:
        open(os.path.join(dest, L['src']), 'wb').write(show(L['src']))
    return dest


def load_room(ref=None):
    """The painting, the polygons, and each layer's alpha at full size (as committed at `ref`, if given). The polygons
    are always the working tree's room.src.json."""
    src = json.load(open(os.path.join(HERE, 'room.src.json')))
    scene = scene_at(ref)
    room = json.load(open(os.path.join(scene, 'layers.json')))
    W, H = room['size']
    orig = np.array(Image.open(os.path.join(ROOT, src['painting'])).convert('RGB')).astype(np.float64)
    polys = {L['id']: L for L in src['layers']}
    solid = {i: poly_mask(polys[i]['body'], (W, H)) for i in polys}
    fol = {i: poly_mask(polys[i]['foliage'], (W, H)) if polys[i]['foliage'] else np.zeros((H, W), bool) for i in polys}
    anyitem = np.any([solid[i] | fol[i] for i in polys], axis=0)
    alpha = {}
    for L in room['layers']:
        a = np.zeros((H, W))
        im = np.array(Image.open(os.path.join(scene, L['src'])))[:, :, 3] / 255
        x, y = L['offset']
        a[y:y + im.shape[0], x:x + im.shape[1]] = im
        alpha[L['id']] = a
    return room, orig, solid, fol, anyitem, alpha


if __name__ == '__main__':
    room, orig, solid, fol, anyitem, alpha = load_room(sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else None)
    maps = {}
    for L in room['layers']:
        i = L['id']
        fl, dfl, dit = floor_like(orig, alpha[i], solid[i], fol[i], anyitem)
        maps[i] = fl
        n = int(fl.sum())
        line = f'{i:14s} draws {int((alpha[i] > 0).sum()):6d} px, floor-coloured {n:5d} (alpha-weighted {alpha[i][fl].sum():7.1f})'
        diag = os.path.join(HERE, 'out', f'diag-{i}.npz')
        if n and os.path.exists(diag):
            D = np.load(diag)
            y0, x0 = D['origin']
            sub = lambda k: np.zeros_like(fl) if k not in D else np.pad(D[k], ((y0, fl.shape[0] - y0 - D[k].shape[0]), (x0, fl.shape[1] - x0 - D[k].shape[1])))
            core, use, folr, a_pre, gaps, dinp = sub('core'), sub('use'), sub('folreg'), sub('A_pre'), sub('gaps'), sub('dinp')
            lifted = (alpha[i] > a_pre + 0.05)
            f = lambda m: f'{100 * (fl & m).sum() / n:4.0f}%'
            line += (f"\n    kept by: core {f(core > 0)} · colour line {f((use > 0) & ~lifted)} · foliage matte {f((folr > 0) & ~(use > 0) & ~lifted)}"
                     f" · raised by the de-matte floor {f(lifted)} · gap closing {f(gaps > 0)}"
                     f"\n    of them, painting vs inpaint differ by > 40 (summed RGB): {f(dinp > 40)}; alpha > 0.5: {f(alpha[i] > 0.5)}")
        print(line)
    np.savez_compressed(os.path.join(HERE, 'out', 'floorlike.npz'), **{k: v for k, v in maps.items()})
    # --show: each layer over magenta with its floor-coloured pixels in cyan, cropped to the layer and zoomed 3x
    if '--show' in sys.argv:
        for L in room['layers']:
            i = L['id']
            a = alpha[i][:, :, None]
            img = np.full(orig.shape, (255.0, 0, 255)) * (1 - a) + orig * a
            img[maps[i]] = (0, 255, 255)
            ys, xs = np.where(alpha[i] > 0)
            crop = Image.fromarray(img.astype(np.uint8)).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
            k = max(1, min(3, 900 // max(crop.size)))
            crop.resize((crop.width * k, crop.height * k), Image.NEAREST).save(os.path.join(HERE, 'out', f'fl-{i}.png'))

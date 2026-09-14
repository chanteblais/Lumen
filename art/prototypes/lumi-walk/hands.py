"""The hands gate: count Lumi's hands in a candidate against the same facing's empty-handed drawing.

    python3 art/prototypes/lumi-walk/hands.py --candidates <dir> --ref <empty-handed drawing>
    python3 art/prototypes/lumi-walk/hands.py --image <png> --ref <empty-handed drawing>     # one file

No other gate sees anatomy: a pick-up sheet with three hands passed every number and a review (the Prompt lab's
three-hands finding, lumi-free-pickup v2). This counts what a hand looks like in these drawings and fails a
candidate that has more of them than its reference.

What counts as a hand: a separate, compact blob of near-black, low-saturation, slightly warm pixels, below the hood's
peak (HEAD), outside the face and not joined to the boots; pieces closer than MERGE of her height are one hand. Measured on the rig's drawings (lumi-iso-front, lumi-iso-s):
  hands        lum 6–27, saturation 8–22 (r − b about the same), median ~ (25, 15, 9)
  coat's slit  lum 3–15, saturation 3–7    — too grey: not hand-coloured
  legs         sw: saturation 3–10 (not hand-coloured); s: 13–31 (hand-coloured, but joined to a boot: excluded)
  boots        lum 14–58, saturation 23–82 — too brown and bright
  face         above the chin line; the hood's inside is excluded with it
The pixels are classified, smoothed (a majority over a small window, so shading inside a hand doesn't split it), opened
(so outlines and thin dark lines don't count), labelled, and each blob is kept if it is big enough (a share of her
height squared), compact (its minor axis at least a share of its major, from its second moments) and not touching the
boots grown by a few px.

The lantern isn't a hand: its lit glass (bright, warm), its brass (saturated, orange-yellow) and the dark frame drawn
round them are found as one region — grown from the lit glass through every non-cream, non-hand pixel within reach of
it, holes filled — and a blob is dropped when most of it lies inside that region. A hand that holds the ring touches it
but lies outside it, so it still counts.

Verdict per candidate, against the reference's count: more is `fail` (a third hand), the same is `pass`, fewer is
`warn` (a hand may be hidden behind the lantern or the cloak — look). Each candidate gets `<name>-hands.png` in --out
(default `<candidates>/hands/`, so the other gates' globs don't pick the overlays up): the blobs counted (magenta,
numbered), those not counted (cyan), the chin line, the boots (blue) and the lantern (yellow) outlined.
"""
import glob
import os
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from lumi_cut import Sheet  # noqa: E402

CHIN = 0.47          # the chin line, drawn on the overlay (hands were counted only below it until the lantern went high)
HEAD = 0.12          # hands are counted below this share of her height from the hood top: a raised hand holds the lantern
                     # level with her eyes (0.28–0.34 down); the face is excluded by shape, not by a line
MERGE = 0.025        # counted blobs closer than this share of her height are one hand (an open hand's palm and its
                     # fingers came apart into two blobs on front-reach v1 -1 and -3: a false third hand)
LUM = (4, 42)        # a hand pixel's brightness
SAT = (8, 26)        # its saturation (max − min channel); the slit is 3–7, the boots 23+ and brighter
MIN_AREA = 0.0012    # a hand covers at least this share of her height squared (~1,900 px at her 1,250 px)
MIN_ROUND = 0.30     # minor ÷ major axis: a hand is compact, a strip of shadow along a fold is not
BOOT_GROW = 6        # px a blob may come within the boots and still be a hand (legs join the boots)
LANTERN_SHARE = 0.5  # a blob with more than this share inside the lantern is part of it


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def figure(path):
    sh = Sheet(path, glow=False, shadow=False)
    rows = sh.rows()
    rgba, main = sh.matte(sh.frames(rows[0][0], rows[-1][1], 1)[0])
    return rgba


def face_mask(rgba, top, fh):
    """The black face and the dark inside of the hood round it, grown 14 px: the largest dark shape that reaches the upper
    third of her. A back view has none (the largest dark shape there doesn't reach so high), and gets an empty mask."""
    a = rgba[:, :, 3] > 200
    lum = rgba[:, :, :3].astype(int).mean(axis=2)
    H, W = a.shape
    dark = ndi.binary_opening(a & (lum < 45), iterations=2)
    dark[int(top + 0.6 * fh):] = False
    dark = ndi.binary_fill_holes(dark)
    lab, k = ndi.label(dark)
    if not k:
        return np.zeros_like(a)
    sizes = ndi.sum(dark, lab, range(1, k + 1))
    i = int(np.argmax(sizes))
    m = lab == i + 1
    if np.where(m)[0].min() > top + 0.33 * fh or sizes[i] < 0.01 * fh * fh:
        return np.zeros_like(a)
    return ndi.binary_dilation(m, iterations=14)


def lantern(rgba, top, fh, chin=None, hand=None):
    """The lantern as one region: lit glass seeds, grown through brass and dark frame near it, holes filled — but never
    over hand-coloured pixels, since the ring closes round the fingers that hold it and filling it would swallow them."""
    a = rgba[:, :, 3] > 200
    rgb = rgba[:, :, :3].astype(int)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    H, W = a.shape
    Y = np.arange(H)[:, None]
    # anywhere below the hood's peak but outside the face: the lantern is held high now, and the glowing eyes are the one
    # other bright warm thing on her (``chin`` is kept for callers and no longer used)
    below = (Y > top + HEAD * fh) & ~face_mask(rgba, top, fh)
    # the flame and the glass round it: brighter and yellower than the hood's lit lining (~230, 170, 110) or the
    # orange embroidery (~240, 120, 40)
    glass = a & below & (r > 240) & (g > 185) & (b < 190) & (r - b > 80)
    glass = ndi.binary_opening(glass, iterations=2)
    # the glass is lit in patches (flame, highlights, reflections) with the frame's bars between them: patches within a
    # few px are one lantern, and only then is its size compared (patch by patch, two of eight v1 lanterns were missed)
    lab, k = ndi.label(ndi.binary_dilation(glass, iterations=8))
    lab = lab * glass
    if not k:
        return np.zeros_like(a)
    sizes = ndi.sum(glass, lab, range(1, k + 1))
    seeds = np.zeros_like(a)
    for i in range(k):
        if sizes[i] >= 0.0008 * fh * fh:    # the lit glass is a sizeable patch; an orange star or trim spot is not
            seeds |= lab == i + 1
    if not seeds.any():
        return np.zeros_like(a)
    cream = (lum > 175) & (sat < 70)
    brass_or_glass = a & ~cream & ((sat > 45) | (lum > 150))
    # grown through glass and brass only, never through dark outlines (the cloak's outline would carry it across her),
    # and only near the glass: the lantern is ~a fifth of her height, the ring at most ~0.14 of it above the glass
    ys, xs = np.where(seeds)
    reach = 0.14 * fh
    disc = (np.arange(W)[None, :] - xs.mean()) ** 2 + (Y - ys.mean()) ** 2 < reach ** 2
    region = ndi.binary_propagation(seeds, mask=brass_or_glass & below & disc)
    # the lantern is upright and about as wide as its glass (the cap and base flare ~25% wider): clipped to that band
    # round the glass, or growth runs on through a lantern-lit sleeve lining beside it (front-grip v1 grew an arc over the
    # lining ~40 px past the lantern)
    gx = np.where(seeds)[1]
    half = (gx.max() - gx.min()) / 2
    region &= np.abs(np.arange(W)[None, :] - (gx.max() + gx.min()) / 2) <= 1.35 * half + 6
    region = ndi.binary_closing(region, iterations=5)
    region = ndi.binary_fill_holes(region)
    region = ndi.binary_dilation(region, iterations=4) & a   # the dark frame drawn round the glass and brass
    return region & ~hand if hand is not None else region


def count(rgba):
    a = rgba[:, :, 3] > 200
    rgb = rgba[:, :, :3].astype(int)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    ys = np.where(a.any(axis=1))[0]
    top, feet = int(ys.min()), int(ys.max())
    fh = feet - top
    chin = top + CHIN * fh
    H, W = a.shape
    Y = np.arange(H)[:, None] + np.zeros((1, W), int)

    boots = a & (Y > top + 0.8 * fh) & (sat >= 22) & (r > g) & (g >= b) & (lum > 12) & (lum < 90)
    boots = ndi.binary_opening(boots, iterations=3)
    bl, bk = ndi.label(boots)
    if bk:
        bs = ndi.sum(boots, bl, range(1, bk + 1))
        boots = np.isin(bl, [i + 1 for i in range(bk) if bs[i] > 0.002 * fh * fh])
    boots_g = ndi.binary_dilation(boots, iterations=BOOT_GROW)

    face = face_mask(rgba, top, fh)
    handpix = a & (Y > top + HEAD * fh) & ~face & (lum >= LUM[0]) & (lum <= LUM[1]) & (sat >= SAT[0]) & (sat <= SAT[1]) & (r >= b)
    # majority over a 9 px window: shading and highlights inside a hand don't split it, a thin line doesn't make one
    smooth = ndi.uniform_filter(handpix.astype(float), size=9) > 0.5
    smooth = ndi.binary_opening(smooth, iterations=3)
    lan = lantern(rgba, top, fh, chin, smooth)
    boots &= ~lan                                           # the lantern's brass base can hang low beside the boots
    boots_g = ndi.binary_dilation(boots, iterations=BOOT_GROW)
    lab, k = ndi.label(smooth)
    # pieces of one hand: blobs of hand size whose gap is under MERGE of her height share a label
    # (never a piece that touches the boots: a hand beside the leg would merge into the leg and go uncounted, w and
    # front-reach v1 -4)
    big = [i + 1 for i in range(k) if (lab == i + 1).sum() >= 0.3 * MIN_AREA * fh * fh and not ((lab == i + 1) & boots_g).any()]
    legs = np.isin(lab, [i + 1 for i in range(k) if ((lab == i + 1) & boots_g).any()])
    grown = ndi.binary_dilation(np.isin(lab, big), iterations=max(1, int(MERGE * fh / 2)))
    glab, _ = ndi.label(grown)
    lab = np.where(np.isin(lab, big), glab, 0)            # a label with no pixels left is skipped by the area test
    k = int(lab.max())
    lab = np.where(legs, k + 1 + ndi.label(legs)[0], lab)  # the pieces at the boots keep their own labels, reported as legs
    k = int(lab.max())
    blobs, rejected = [], []
    for i in range(1, k + 1):
        m = lab == i
        area = int(m.sum())
        if area < MIN_AREA * fh * fh:
            continue
        yy, xx = np.where(m)
        ev = np.sort(np.linalg.eigvalsh(np.cov(np.vstack([xx, yy]))))
        rnd = float(np.sqrt(max(ev[0], 1e-6) / max(ev[1], 1e-6)))
        inside = float((m & lan).sum()) / area
        info = dict(mask=m, x=float(xx.mean()), y=float(yy.mean()), area=area, round=round(rnd, 2),
                    inLantern=round(inside, 2), boot=bool((m & boots_g).any()))
        why = ('boot/leg' if info['boot'] else 'lantern' if inside > LANTERN_SHARE else
               'not compact' if rnd < MIN_ROUND else None)
        (rejected if why else blobs).append(dict(info, why=why))
    blobs.sort(key=lambda d: d['x'])
    return dict(blobs=blobs, rejected=rejected, top=top, feet=feet, fh=fh, chin=chin, boots=boots, lantern=lan, face=face,
                touching=[bool((ndi.binary_dilation(d['mask'], iterations=3) & lan).any()) for d in blobs])


def overlay(rgba, res, path, title):
    bg = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (70, 90, 120, 255))
    bg.alpha_composite(Image.fromarray(rgba, 'RGBA'))
    im = np.array(bg.convert('RGB')).astype(float)
    for d in res['blobs']:
        im[d['mask']] = im[d['mask']] * 0.35 + np.array([255, 0, 200]) * 0.65
    for d in res['rejected']:
        im[d['mask']] = im[d['mask']] * 0.6 + np.array([0, 200, 255]) * 0.4
    for m, col in ((res['boots'], (40, 110, 255)), (res['lantern'], (255, 220, 0)), (res['face'], (0, 220, 120))):
        edge = m & ~ndi.binary_erosion(m, iterations=3)
        im[edge] = col
    out = Image.fromarray(im.astype(np.uint8))
    d = ImageDraw.Draw(out)
    d.line([0, res['chin'], out.width, res['chin']], fill=(0, 220, 0), width=3)
    for n, bl in enumerate(res['blobs']):
        d.ellipse([bl['x'] - 14, bl['y'] - 14, bl['x'] + 14, bl['y'] + 14], outline=(255, 255, 255), width=3)
        d.text((bl['x'] + 18, bl['y'] - 8), str(n + 1), fill=(255, 255, 255))
    d.text((8, 8), title, fill=(255, 255, 255))
    out.save(path)


def describe(res):
    parts = [f"#{n + 1} ({d['x']:.0f},{d['y']:.0f}) {d['area']}px round {d['round']}{' holds lantern' if t else ''}"
             for n, (d, t) in enumerate(zip(res['blobs'], res['touching']))]
    rej = [f"({d['x']:.0f},{d['y']:.0f}) {d['area']}px {d['why']}" for d in res['rejected']]
    return ('; '.join(parts) or 'none') + (f" | not counted: {'; '.join(rej)}" if rej else '')


if __name__ == '__main__':
    ref_path = arg('--ref')
    if not ref_path:
        sys.exit(__doc__)
    ref_path = os.path.join(ROOT, ref_path) if not os.path.isabs(ref_path) else ref_path
    if '--image' in sys.argv:
        paths = [arg('--image')]
        folder = os.path.dirname(os.path.abspath(paths[0]))
    else:
        folder = arg('--candidates', '').rstrip('/')
        paths = [p for p in sorted(glob.glob(os.path.join(folder, 'v*.png')))
                 if not any(s in p for s in ('-aligned', '-motion', '-hands', '-diff', 'ref-'))]
    # overlays go in a subfolder, never beside the candidates, where facings.py and elevation.py would glob them up
    out_dir = arg('--out', os.path.join(folder, 'hands'))
    os.makedirs(out_dir, exist_ok=True)
    ref_rgba = figure(ref_path)
    ref = count(ref_rgba)
    n_ref = len(ref['blobs'])
    overlay(ref_rgba, ref, os.path.join(out_dir, 'ref-' + os.path.basename(ref_path)[:-4] + '-hands.png'), f'ref {n_ref}')
    print(f"reference {os.path.basename(ref_path)}: {n_ref} hand(s) — {describe(ref)}")
    worst = 0
    for p in paths:
        rgba = figure(p)
        res = count(rgba)
        n = len(res['blobs'])
        verdict = 'fail' if n > n_ref else 'pass' if n == n_ref else 'warn'
        worst = max(worst, 2 if verdict == 'fail' else 1 if verdict == 'warn' else 0)
        overlay(rgba, res, os.path.join(out_dir, os.path.basename(p)[:-4] + '-hands.png'), f'{n} vs ref {n_ref}: {verdict}')
        print(f"  {os.path.basename(p)}: {n} hand(s) vs {n_ref} → {verdict} — {describe(res)}"
              f"{' · lantern found' if res['lantern'].any() else ''}")
    sys.exit(1 if worst == 2 else 0)

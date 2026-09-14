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

Variants (VARIANTS, since 2026-09-13): drawings of a facing holding or reaching for something — carrying the lantern
(`sw-lantern`, `ssw-lantern`, `s-lantern`) and the pick-up's two keys (`front-reach`, `front-grip`, at sw). Each is
split exactly as a facing (body, feet, legs, eyes) after one step first: the drawn lantern is cut away, because the
room's lantern piece (`art/scenery/home/layers/lantern.png`) hangs from her hand instead — the same pixels on the table
and in her hand. The lantern is found by `hands.py` (lit glass grown through brass, the frame round it); the hand that
holds it is hands.py's hand blob on the variant's side (`hand`: the viewer's `left`), grown through the fist's darker,
lantern-lit side. The ring (thin brass near the fist, within 60 px of the lantern) goes with the lantern; brass of it
drawn across the fist is repainted from the fist's own nearest pixels. The lantern, with a 2 px rim, leaves the body
except the fist's dark outline. Ground the matte had kept inside the ring and between lantern, fist and cloak (its flood
only reaches ground from outside) is flooded out and its edge faded. Where the lantern bit a notch out of her own outline
(a 12 px closing of the outline left after the cut), the notch is filled from the empty-handed drawing (`base`, aligned
on the image canvas — the generator keeps position, shift 0,0 on all five), never where the base drawing has its own
hand; anything else it covered is left open (`leftOpenPx`): the room's lantern, drawn in front from the grip and larger
than the drawn one, covers it. Detached specks left by the cut are dropped.
Each variant also writes `parts/<variant>-hand.png` (the fist and its outline, in the same canvas: the page draws it
again over the lantern's ring) and, under `variants` in rig-walk.json, beside everything a facing has: `base`, `deg`,
`grip` (the fist's centre, where the ring hangs), `hand` (its box), `lanternSide`, `lantern` (the drawn lantern's
height and box, and the cut's pixel counts) and `toBase` (k, offset: a point p in this variant's canvas is
p·k + offset in its base facing's). The ten facings' parts and entries are unchanged — variants are processed after
them and written under their own key. debug-split-variants.png and out/lantern-hold-strip.png show them.
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
# Holding and pick-up drawings: each an edit of its base facing's drawing (art/prompts/lumi-iso-*-lantern.md, -reach,
# -grip), split after its drawn lantern is cut away. `hand`: which of hands.py's blobs holds or reaches — the viewer's
# left, her right hand, in all five. `deg`: the base facing's angle on the ring (facings.py's DEG).
VARIANTS = [
    dict(name='sw-lantern', base='sw', deg=45.0, src='art/lumi/lumi-iso-front-lantern.png', hand='left', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='ssw-lantern', base='ssw', deg=22.5, src='art/lumi/lumi-iso-ssw-lantern.png', hand='left', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='s-lantern', base='s', deg=0.0, src='art/lumi/lumi-iso-s-lantern.png', hand='left', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='front-reach', base='sw', deg=45.0, src='art/lumi/lumi-iso-front-reach.png', hand='left', eyes=True, chin=0.46, neck=0.58, keep=[]),
    dict(name='front-grip', base='sw', deg=45.0, src='art/lumi/lumi-iso-front-grip.png', hand='left', eyes=True, chin=0.46, neck=0.58, keep=[]),
]
SRC = {f['name']: f['src'] for f in FACINGS}
OUT = os.path.join(HERE, 'parts')
os.makedirs(OUT, exist_ok=True)


def matte_of(src):
    """A drawing matted as the rig does it, and where its matte sits on the image canvas (Sheet.matte's 8 px margin)."""
    sheet = Sheet(os.path.join(ROOT, src), glow=False, shadow=False)
    rows = sheet.rows()
    bbox = sheet.frames(rows[0][0], rows[-1][1], 1)[0]
    rgba, main = sheet.matte(bbox)
    return rgba, main, (max(0, bbox[0] - 8), max(0, bbox[2] - 8)), sheet.paper


def cut_lantern(f, rgba, origin, paper):
    """Cut a variant's drawn lantern away and fill what it covered from the base drawing (see the docstring)."""
    import hands   # this folder; only variants need it
    res = hands.count(rgba)
    a = rgba[:, :, 3] > 0
    assert res['blobs'], (f['name'], 'no hand found')
    pick = min if f['hand'] == 'left' else max
    hand = pick(res['blobs'], key=lambda d: d['x'])['mask']
    rgb_c = rgba[:, :, :3].astype(int)
    lum_i = rgb_c.mean(axis=2)
    sat_i = rgb_c.max(axis=2) - rgb_c.min(axis=2)
    dark = a & (lum_i < 75) & (sat_i < 70)
    # The lantern's light warms the side of the fist next to it (median ~45, 26, 14, saturation up to ~75) past hands.py's
    # hand colour, so the blob is only part of the fist. Grown through fist-like pixels near it: dark and low in red —
    # the brass of the ring is bright red-orange (median ~170, 105, 58), the cloak cream. Measured on sw-lantern, front-grip.
    # (not brighter: the ring's dark brass shading, ~100, 60, 30, would carry the fist round the ring and close it inside)
    # and only where it is thick: the ring's dark outline strokes (~4 px) are fist-coloured too, and growing along them
    # wrapped the fist round the ring, so the outline stayed as claws after the cut
    fistish = ndi.binary_opening(a & (rgb_c[:, :, 0] < 100) & (lum_i < 60), iterations=3)
    hand = ndi.binary_propagation(hand, mask=(fistish | hand) & ndi.binary_dilation(hand, iterations=30))
    hull = ndi.binary_fill_holes(ndi.binary_closing(hand, iterations=8))
    zone = ndi.binary_dilation(hull, iterations=5) & a             # the fist and its dark outline: the hand piece
    protect = ndi.binary_dilation(hull, iterations=3) & dark        # only the fist's dark outline is kept next to it
    lan = res['lantern']
    lan0 = lan.copy()                                               # glass, cap and base, without the ring: its height
    # the ring: thin brass joined to the lantern near the fist. The cap's dark outline separates it from the lantern region,
    # so it is grown from the region (grown 6 px) through brass within 45 px of the fist. Brass by colour ratio (blue well
    # under red, green under red: ~170, 105, 58) — lantern-lit cream and the sleeve's tan lining are too blue or too green —
    # and only its thin parts (what an opening of 5 px removes): the ring is a loop ~8 px thick, the lining a broad patch
    r_, g_, b_ = rgb_c[:, :, 0], rgb_c[:, :, 1], rgb_c[:, :, 2]
    brass = a & (b_ < 0.45 * r_) & (g_ < 0.78 * r_) & (r_ > 90) & (lum_i > 45)
    thin = brass & ~ndi.binary_opening(brass, iterations=5)
    fist = ndi.binary_fill_holes(hand)                              # the fist's own pixels, the ring's loop not closed in
    # the hand piece and what the cut spares round the fist come from the fist itself: the closed hull closes over the top
    # of the ring's loop, and sparing its dark pixels kept the ring's outline as thin claws round the fist (v3 ssw/s)
    zone = ndi.binary_dilation(fist, iterations=5) & a
    protect = ndi.binary_dilation(fist, iterations=3) & dark
    if lan.any():
        # every thin brass piece near the fist that isn't fist and comes within 60 px of the lantern: the ring is often
        # cut off from the lantern region by the cap's dark outline, and a closed hull hid its loop from the cut
        ring = thin & ndi.binary_dilation(hull, iterations=45) & ~fist
        lab_r, kr = ndi.label(ring)
        near_l = ndi.binary_dilation(lan, iterations=60)
        ring = np.isin(lab_r, [i + 1 for i in range(kr) if (near_l & (lab_r == i + 1)).any()])
        # the ring is drawn with a dark outline and a white highlight along it; within 6 px of its brass those go too —
        # dark pixels and thin light strokes only (what a 4 px opening removes), so the broad cream of a sleeve beside it
        # stays (without this the cut left thin claws of outline round the fist, v3 ssw/s)
        light = a & (lum_i > 170)
        thin_light = light & ~ndi.binary_opening(light, iterations=4)
        ring_zone = ndi.binary_dilation(ring, iterations=6) & ~fist & ((a & (lum_i < 90)) | thin_light)
        lan = lan | ((ndi.binary_dilation(ring, iterations=2) | ring_zone) & ~fist)
        info_ring = int(ring.sum())
    else:
        info_ring = 0
    out = rgba.copy()
    hy, hx = np.where(hull)
    zy, zx = np.where(zone)
    info = dict(zone=zone, grip=(float(hx.mean()), float(hy.mean())),
                handBox=(int(zx.min()), int(zy.min()), int(zx.max()), int(zy.max())), lantern=None)

    brgba, bmain, borigin, _ = matte_of(SRC[f['base']])
    canvas = np.zeros_like(rgba)
    dy, dx = borigin[1] - origin[1], borigin[0] - origin[0]
    H, W = rgba.shape[:2]
    bh, bw = brgba.shape[:2]
    ys0, xs0 = max(0, dy), max(0, dx)
    ys1, xs1 = min(H, dy + bh), min(W, dx + bw)
    canvas[ys0:ys1, xs0:xs1] = brgba[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    bys = np.where(bmain.any(axis=1))[0]
    info['baseOrigin'], info['baseFh'] = borigin, int(bys.max() - bys.min())

    if lan.any():
        # brass of the ring drawn across the fist: repainted from the fist's own nearest pixels
        over = lan & fist
        src = fist & ~lan
        if over.any() and src.any():
            iy, ix = ndi.distance_transform_edt(~src, return_indices=True)[1]
            out[over, :3] = rgba[iy[over], ix[over], :3]
            out[over, 3] = 255
        cut = ndi.binary_dilation(lan, iterations=2) & ~protect & a
        bres = hands.count(canvas) if (canvas[:, :, 3] > 0).any() else dict(blobs=[])
        base_hands = np.zeros_like(a)
        for bl in bres['blobs']:
            base_hands |= bl['mask']
        base_hands = ndi.binary_dilation(base_hands, iterations=12)
        on_base = cut & (canvas[:, :, 3] > 0)
        # Only notches: what the lantern bit out of the variant's own outline, found by closing that outline over 12 px.
        # Filling everything the base drawing has there pasted a panel of its hanging cloak under the variant's lifted
        # sleeve (ssw and s, v3), with a ghost of its outline. What is not a notch is left open: the room's lantern, drawn
        # in front of her from the grip and larger than the drawn one, covers it.
        kept = (out[:, :, 3] > 0) & ~cut
        notch = ndi.binary_closing(kept, iterations=12) & cut
        fill = on_base & ~base_hands & notch
        out[cut, 3] = 0
        out[fill] = canvas[fill]
        # A painted fill, when one is chosen (fill.py: what the drawn lantern hides, a masked edit of this drawing saved as
        # <src>-fill.png): what the cut opened is filled from it inside the edit's own mask (fill.mask_for, the same mask
        # that was sent) — never outside it (the ring's top, left in the edit, would come back), never on the fist, never
        # where the fill is ground. (A first rule, "wherever the edit changed the drawing", left holes the shape of the
        # glass and flame, whose highlights are as pale as the cloak painted over them.) Without it the cloak beside the
        # room's lantern showed torn at 9×.
        fill_src = f['src'].replace('.png', '-fill.png')
        if os.path.exists(os.path.join(ROOT, fill_src)):
            import fill as fillmod   # this folder
            frgba, _, forigin, _ = matte_of(fill_src)
            fc = np.zeros_like(rgba)
            fdy, fdx = forigin[1] - origin[1], forigin[0] - origin[0]
            fhh, fww = frgba.shape[:2]
            a0, b0, a1, b1 = max(0, fdy), max(0, fdx), min(H, fdy + fhh), min(W, fdx + fww)
            fc[a0:a1, b0:b1] = frgba[a0 - fdy:a1 - fdy, b0 - fdx:b1 - fdx]
            _, edit_full = fillmod.mask_for(f['src'])
            edit = np.zeros(cut.shape, bool)
            eh, ew = edit_full.shape
            sub = edit_full[origin[1]:origin[1] + H, origin[0]:origin[0] + W]
            edit[:sub.shape[0], :sub.shape[1]] = sub
            groundish_f = np.abs(fc[:, :, :3].astype(int) - np.asarray(paper, int)).sum(axis=2) < 70
            painted = cut & edit & (fc[:, :, 3] > 200) & ~groundish_f & ~ndi.binary_dilation(fist, iterations=2)
            out[painted] = fc[painted]
            info['paintedPx'] = int(painted.sum())
            print(f"  {f['name']}: {int(painted.sum())} px of the cut painted from {fill_src}")
        ly, lx = np.where(lan0)
        ry = np.where(lan.any(axis=1))[0]
        info['lantern'] = dict(box=(int(lx.min()), int(ly.min()), int(lx.max()), int(ly.max())),
                               height=int(ly.max() - ly.min() + 1), withRing=int(ry.max() - ry.min() + 1),
                               cutPx=int(cut.sum()), filledPx=int(fill.sum()),
                               leftOpenPx=int((on_base & ~fill).sum()),
                               overBodyPx=int((lan & (canvas[:, :, 3] > 200) & ~base_hands).sum()),
                               ringOverFistPx=int(over.sum()), ringPx=info_ring)
    # Ground the matte kept: Sheet.matte floods the ground only from outside the figure, so the ground enclosed by the ring,
    # the fist, the lantern and the cloak stayed opaque grey-blue, and the cut exposes it. Ground-coloured pixels joined to
    # the new transparency are flooded out; the 2 px band they leave is faded by its distance from the ground's colour
    # (the matte's own de-matte, lumi_cut.Sheet.matte), so no blue fringe is left along it.
    if lan.any():
        dist = np.abs(out[:, :, :3].astype(int) - np.asarray(paper, int)).sum(axis=2)
        clear = out[:, :, 3] == 0
        groundish = (dist < 70) & ~clear
        near_cut = ndi.binary_dilation(cut, iterations=60)
        flooded = ndi.binary_propagation(clear & near_cut, mask=(clear | groundish) & near_cut) & groundish
        out[flooded, 3] = 0
        band = ndi.binary_dilation(flooded, iterations=2) & (out[:, :, 3] > 0) & ~hull
        fade = np.clip(dist / 180.0, 0, 1)
        out[band, 3] = np.minimum(out[band, 3], (fade[band] * 255).astype(np.uint8))
        info['lantern']['groundFloodedPx'] = int(flooded.sum())
    # Leftovers of the drawn lantern's ring and cap round the fist (its white highlight, brass, dark outline strokes). The
    # page draws the hand piece again over the room's lantern, so anything but the fist in it shows on top of the lantern:
    # white specks by the fist at 9× (lumi-walk grids, 2026-09-13). The hand piece keeps the fist and its dark outline only.
    # In the body, what the cut left hanging off the fist — small once the fist is set aside, and near it — is dropped,
    # and light or brass pixels touching the fist below its middle over the drawn lantern's columns go too.
    if lan.any():
        alive = out[:, :, 3] > 0
        lum_o = out[:, :, :3].astype(int).mean(axis=2)
        tight = ndi.binary_dilation(fist, iterations=4)
        info['zone'] = (fist | (tight & (lum_o < 90))) & alive
        near_f = ndi.binary_dilation(fist, iterations=40)
        lab_s, ks = ndi.label(alive & ~tight)
        loose = np.zeros_like(alive)
        if ks:
            sizes_s = ndi.sum(np.ones_like(lab_s), lab_s, range(1, ks + 1))
            inside = ndi.sum(near_f, lab_s, range(1, ks + 1))
            bits = [i + 1 for i in range(ks) if sizes_s[i] < 0.01 * sizes_s.max() and inside[i] > 0.8 * sizes_s[i]]
            loose = np.isin(lab_s, bits)
        below = np.zeros_like(alive)
        below[int(hy.mean()):, :] = True
        over_lantern = ndi.binary_dilation(lan, iterations=8)
        ro, go, bo = out[:, :, 0].astype(int), out[:, :, 1].astype(int), out[:, :, 2].astype(int)
        brass_o = (bo < 0.45 * ro) & (go < 0.78 * ro) & (ro > 90)
        rim = alive & tight & ~fist & below & over_lantern & ((lum_o > 110) | brass_o)
        drop_bits = loose | rim
        out[drop_bits] = 0
        info['looseBitsPx'] = int(drop_bits.sum())
    # specks the cut leaves (the lantern's outline beyond its rim): keep what is sizeable
    lab, k = ndi.label(out[:, :, 3] > 0)
    if k > 1:
        sizes = ndi.sum(np.ones_like(lab), lab, range(1, k + 1))
        drop = np.isin(lab, [i + 1 for i in range(k) if sizes[i] < 0.05 * sizes.max()])
        info['specksPx'] = int(drop.sum())
        out[drop] = 0
    lab, k = ndi.label(out[:, :, 3] > 200)
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, k + 1))
    main = lab == 1 + int(np.argmax(sizes))
    info['orig'] = rgba
    return out, main, info


def split(f):
    if 'base' in f:
        rgba, main, origin, paper_c = matte_of(f['src'])
        rgba, main, extra = cut_lantern(f, rgba, origin, paper_c)
    else:
        sheet = Sheet(os.path.join(ROOT, f['src']), glow=False, shadow=False)
        rows = sheet.rows()
        bbox = sheet.frames(rows[0][0], rows[-1][1], 1)[0]
        rgba, main = sheet.matte(bbox)
        extra = None
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
    if extra:
        hand_im = body.copy()
        hand_im[~extra['zone']] = 0
        layers['hand'] = hand_im
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
    if extra:
        gx, gy = extra['grip']
        x0, y0, x1, y1 = extra['handBox']
        rig['base'] = f['base']
        rig['deg'] = f['deg']
        rig['back'] = False
        rig['grip'] = [S(gx), S(gy)]
        rig['hand'] = [S(x0), S(y0), S(x1), S(y1)]
        # the lantern hangs beside her on the viewer's side of the outline in all five drawings; drawn over her where the
        # two meet (overBodyPx counts where the drawn lantern covered what the base drawing shows as her)
        rig['lanternSide'] = 'front'
        L_ = extra['lantern']
        if L_:
            bx0, by0, bx1, by1 = L_['box']
            rig['lantern'] = dict(height=round(L_['height'] * s, 2), share=round(L_['height'] / fh, 3),
                                  withRing=round(L_['withRing'] * s, 2),
                                  box=[S(bx0), S(by0), S(bx1), S(by1)],
                                  **{k: L_[k] for k in ('cutPx', 'filledPx', 'leftOpenPx', 'overBodyPx', 'ringOverFistPx', 'ringPx', 'groundFloodedPx')})
        else:
            rig['lantern'] = None
        rig['specksPx'] = extra.get('specksPx', 0)
        # a point p in this canvas is p·k + offset in the base facing's canvas (both scaled to FIG_H from their own height)
        sb = FIG_H / extra['baseFh']
        k = sb / s
        rig['toBase'] = dict(k=round(k, 5), offset=[round(0.5 * k + (origin[i] - extra['baseOrigin'][i]) * sb - 0.5, 2) for i in (0, 1)])
        scaled['orig'] = scale(extra['orig'], extra['orig'][:, :, 3] > 0, s)[0]   # for the pictures only, never saved
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

# ---- variants: holding and pick-up drawings, after the ten facings (so their parts and entries are unchanged) ----------
variants, vrows, strip = {}, [], []
for f in VARIANTS:
    if not os.path.exists(os.path.join(ROOT, f['src'])) or f['base'] not in rigs:
        print(f['name'], 'skipped: no', f['src'])
        continue
    rig, L = split(f)
    variants[f['name']] = rig
    size = (L['body'].shape[1], L['body'].shape[0])
    legs = legs_layer(rig, size)
    whole = over(legs, L['foot-0'], L['foot-1'], L['body'])
    tint = lambda im, c: np.dstack([np.full(im.shape[:2] + (3,), c, np.uint8), im[:, :, 3]])
    pieces = over(tint(legs, (40, 160, 90)), tint(L['foot-0'], (40, 110, 200)), tint(L['foot-1'], (200, 60, 60)), L['body'],
                  tint(L['hand'], (240, 200, 0)))
    # the base facing's pieces whole, the variant's pieces whole with the grip and hand box marked, and tinted by piece
    # (hand yellow); for the strip also the drawing as generated (uncut, same scale)
    B = rigs[f['base']]
    bp = {n: np.array(Image.open(os.path.join(OUT, f"{f['base']}-{n}.png"))) for n in ('body', 'foot-0', 'foot-1')}
    bwhole = over(legs_layer(B, (bp['body'].shape[1], bp['body'].shape[0])), bp['foot-0'], bp['foot-1'], bp['body'])
    marked = paper(whole)
    d = ImageDraw.Draw(marked)
    gx, gy = rig['grip']
    d.rectangle(rig['hand'], outline=(240, 170, 0, 255), width=2)
    d.line([gx - 9, gy, gx + 9, gy], fill=(220, 0, 60, 255), width=2)
    d.line([gx, gy - 9, gx, gy + 9], fill=(220, 0, 60, 255), width=2)
    d.ellipse([gx - 4, gy - 4, gx + 4, gy + 4], outline=(220, 0, 60, 255), width=2)
    if rig['lantern']:
        d.rectangle(rig['lantern']['box'], outline=(0, 150, 220, 255), width=1)
    row = [paper(bwhole), marked, paper(pieces)]
    vrows.append((f['name'], row))
    # the strip: as generated · the empty-handed pieces · the cut pieces with the grip, and the room's lantern at its
    # 40 px-in-120 scale hung from the grip (dashed: its height only, the drawn lantern's width) to check it clears her feet
    hung = paper(whole)
    dh = ImageDraw.Draw(hung)
    lh = 40.0 / 120.0 * rig['height']
    lw = (rig['lantern']['box'][2] - rig['lantern']['box'][0]) * lh / max(1.0, rig['lantern']['box'][3] - rig['lantern']['box'][1]) \
        if rig['lantern'] else lh * 0.55
    for yy in np.arange(gy, gy + lh, 8):
        dh.line([gx - lw / 2, yy, gx - lw / 2, min(gy + lh, yy + 4)], fill=(0, 120, 220, 255), width=2)
        dh.line([gx + lw / 2, yy, gx + lw / 2, min(gy + lh, yy + 4)], fill=(0, 120, 220, 255), width=2)
    dh.line([gx - lw / 2, gy + lh, gx + lw / 2, gy + lh], fill=(0, 120, 220, 255), width=2)
    dh.line([0, rig['feet'], hung.width, rig['feet']], fill=(0, 170, 0, 255), width=1)
    dh.line([gx - 9, gy, gx + 9, gy], fill=(220, 0, 60, 255), width=2)
    dh.line([gx, gy - 9, gx, gy + 9], fill=(220, 0, 60, 255), width=2)
    rig['lanternAt40'] = dict(bottom=round(gy + lh, 2), feet=rig['feet'], clears=bool(gy + lh <= rig['feet']))
    strip.append((f['name'], [paper(L['orig']), paper(bwhole), hung]))

if variants:
    rigs['variants'] = variants
    tw = max(t.width for _, row in vrows for t in row)
    th = max(t.height for _, row in vrows for t in row)
    vs = Image.new('RGBA', (tw * 3, (th + 18) * len(vrows)), (255, 255, 255, 255))
    dv = ImageDraw.Draw(vs)
    for j, (name, row) in enumerate(vrows):
        for i, t in enumerate(row):
            vs.paste(t, (i * tw, j * (th + 18) + 18))
        dv.text((4, j * (th + 18) + 3), f"{name} (base {variants[name]['base']}): base pieces · pieces with the lantern "
                                         f"cut, grip + and hand box · tinted, hand yellow", fill=(0, 0, 0, 255))
    vs.save(os.path.join(HERE, 'debug-split-variants.png'))
    tw = max(t.width for _, row in strip for t in row)
    th = max(t.height for _, row in strip for t in row)
    ss = Image.new('RGBA', (tw * len(strip), (th + 18) * 3), (255, 255, 255, 255))
    ds = ImageDraw.Draw(ss)
    for i, (name, row) in enumerate(strip):
        ds.text((i * tw + 4, 3), name, fill=(0, 0, 0, 255))
        for j, t in enumerate(row):
            ss.paste(t, (i * tw, j * (th + 18) + 18))
    for j, label in enumerate(('as generated', 'empty-handed pieces (base facing)', 'pieces, lantern cut · grip + · a 40-in-120 lantern hung from it (blue) · feet (green)')):
        ds.text((4, j * (th + 18) + 18 + th - 14), label, fill=(90, 90, 90, 255))
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    ss.save(os.path.join(HERE, 'out', 'lantern-hold-strip.png'))
    print('wrote debug-split-variants.png and out/lantern-hold-strip.png for', ', '.join(variants))

with open(os.path.join(HERE, 'rig-walk.json'), 'w') as fh_:
    json.dump(rigs, fh_, indent=1)
print('wrote parts/, rig-walk.json, debug-split.png for', ', '.join(rigs))

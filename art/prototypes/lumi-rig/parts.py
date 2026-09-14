"""Split Lumi's sw drawing into a rig's layered parts, fill what each part hides, and write the meshes and weights.

    python3 art/prototypes/lumi-rig/parts.py --masks                 # masks + out/parts-masks.png, no API
    python3 art/prototypes/lumi-rig/parts.py --inpaint wing [--n 2]  # candidates for the torso under the near wing
    python3 art/prototypes/lumi-rig/parts.py --inpaint collar        # candidates for the torso under the hood's rim
    python3 art/prototypes/lumi-rig/parts.py                         # build parts/ and rig-sw.json from the chosen ones

Rebuild chain (from the repo root; the walk rig's parts must exist, `lumi-walk/split.py` writes them):
    python3 art/prototypes/lumi-rig/parts.py          # reads the chosen fills from fills/ (FILLS); --inpaint writes
                                                      # new candidates to art/candidates/lumi-rig/ (gitignored)
    python3 art/prototypes/lumi-rig/build.py          # inlines Home's layers, the parts and rig-sw.json -> index.html
    python3 art/prototypes/lumi-rig/capture.py --all  # grids, GIFs, compare images, numbers (out/)

The drawing is `art/lumi/lumi-iso-front.png` (sw), matted exactly as `lumi-walk/split.py` does (lumi_cut.Sheet), scaled
to her 440 px canvas (FIG_H), so every part lies pixel for pixel on `lumi-walk/parts/sw-body.png` (checked on every run:
the recomposed rest must match sw-body). Painting px (the 1024x1536 drawing) map to canvas px by
canvas = (p - origin + 0.5) * s - 0.5.

Parts, back to front (the page draws them in this order; legs are drawn in code from rig-walk.json's `sw`):
  boots      lumi-walk/parts/sw-foot-0.png, sw-foot-1.png, reused as they are
  farhand    her left hand under the hem (viewer's right): dark pixels in its box
  torso      the cloak and body: sw-body less every other part, with what they hide painted in (below)
  arm        the near arm: a forearm drawn in code, the hand (three shapes: the rest hand cut here, the open hand from
             lumi-walk/parts/front-reach-hand.png, the fist from front-grip-hand.png, both cleaned of cloak and ring
             pixels and put on this canvas with the variants' `toBase`), and the sleeve: the cloak's near wing, which
             falls over her right arm from under the hood to its point by the hand
  head       the hood and face, above the hood's lower outline (the eyes are drawn in code, as on the walk rig)
  bow        the ribbon, its knot and the medallions, on top of the hood's rim and the wing's top

Drawn sleeves (second round, no generation): the near sleeve as drawn raised, cut from lumi-walk's variant bodies
(front-reach, front-grip, sw-lantern; SLEEVES, traced on 4x zooms) into parts/sleeve-*.png with a 4 px mesh. The page skins
each along the upper arm and forearm from the pose its drawing was drawn in, and draws its cuff end again over the hood.
The default is front-reach's alone (?sleeve=reach); grip and held are kept for ?sleeve=auto|grip|held.

The chosen fills are in fills/ (cropped to their hole, offsets in FILLS), so this folder rebuilds from the repo alone.

Fills (OpenAI /v1/images/edits with a mask, the method of home-layers/inpaint.py; every call logged with its tokens and
cost in art/candidates/lumi-rig/log.jsonl):
  wing       the torso under the near wing and hand: what shows when the arm lifts
  collar     the torso under the hood's rim: the shoulders and collar, for a tilt or a glance of the hood
The fill is used only inside the hole, colour-matched to the ring round it, and matted against the drawing's ground.

Meshes: a grid over each moving part (the sleeve finer), triangles where the part has paint, and per vertex four
weights — neck, upper arm, forearm, cloak — the rest going to the root. Linear blend skinning on the page.
"""
import base64
import io
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from lumi_cut import Sheet, scale  # noqa: E402

SRC = 'art/lumi/lumi-iso-front.png'
WALK = os.path.join(ROOT, 'art', 'prototypes', 'lumi-walk')
CAND = os.path.join(ROOT, 'art', 'candidates', 'lumi-rig')
OUT = os.path.join(HERE, 'parts')
FIG_H = 440
MODEL = 'gpt-image-2.5-sunburst'
RATES = dict(text_in=5.0, image_in=8.0, image_out=30.0)   # $ per million tokens, as home-layers/inpaint.py
MAX_IMAGES = 3

# ---- traced in painting px on 2x-4x grid zooms of the drawing ----------------------------------------------------------
# the hood and face: everything above the hood's lower outline (its dark outline included), round the knot
HEAD = [(0, 0), (1024, 0), (1024, 640), (900, 640), (872, 590), (822, 632), (762, 672), (702, 702), (642, 730),
        (600, 742), (520, 749), (470, 737), (430, 724), (415, 713), (397, 704), (362, 691), (335, 678), (312, 665),
        (300, 673), (0, 692)]
# the near wing: from under the hood's rim and the bow down its outline to the point by the hand, back along its lower
# edge (over the hand) and up the fold under the medallions. Outer vertices lie a few px outside the outline.
WING = [(334, 690), (318, 718), (300, 744), (276, 776), (246, 810), (206, 850), (180, 880), (166, 905), (166, 934),
        (182, 951), (204, 972), (238, 991), (274, 1002), (301, 1003), (307, 950), (312, 900), (318, 850), (330, 800),
        (350, 760), (372, 730), (372, 700)]
# the ribbon, knot and medallions: brown and brass inside this outline
BOW = [(300, 686), (372, 684), (432, 696), (508, 720), (528, 800), (508, 900), (500, 992), (430, 1002), (362, 998),
       (296, 978), (286, 880), (296, 780)]
# boxes in canvas px (x0, y0, x1, y1) round the two hands at rest
NEAR_HAND_BOX = (4, 290, 46, 334)
FAR_HAND_BOX = (136, 348, 194, 392)
# the collar fill reaches this far (painting px) up into the hood above its lower outline
COLLAR_BAND = 44
# canvas row above which the torso under the wing must be solid wherever her rest silhouette is (see build)
WING_SOLID_Y = 265

PROMPTS = {
    'wing': ("A clean digital illustration of a small hooded character in an ivory cloak with orange sun embroidery, a brown "
             "ribbon bow with bronze medallions, on a plain flat blue background. Inside the transparent (masked) area on "
             "the left of the picture, remove the loose front flap of the cloak that falls over her right arm, and her dark "
             "right hand under it. Paint only what was underneath: the ivory cloak's front panel with its dotted orange "
             "border continuing straight up under the ribbon bow to the collar under the hood, and to its left the cloak's "
             "side in soft shadow falling from the shoulder under the hood down to the hem, with the same dark outline "
             "along its left edge. No arm, no hand, no sleeve, no flap, no new embroidery motif. Outside her, the same "
             "plain flat blue background. Same painterly style, colours and line weight. Everything outside the masked "
             "area stays exactly as it is."),
    'collar': ("A clean digital illustration of a small character's ivory cloak with orange embroidery and a brown ribbon "
               "bow with bronze medallions, on a plain flat blue background; her hood has been taken away. Inside the "
               "transparent (masked) area, paint the top of the ivory cloak continuing upward: its rounded shoulders and "
               "a soft collar closing round the neck, the dark brown ribbon band round the neck under the knot, in the same "
               "soft shading. Above the collar only the plain flat blue background: no hood, no head, no face, no eyes. "
               "Same painterly style, colours and dark outline. Everything outside the masked area stays exactly as it is."),
}
# the chosen candidate per fill (file names in art/candidates/lumi-rig/)
# wing v1-2: the flap and hand gone, the cloak's side falling from the bow with its dotted border, ring drift 6.4 (v1-1
# the same idea, 7.7). collar v1-1: a plain collar and ribbon band under where the hood was (v1-2 added loose ribbon
# strands); only the band under the rim, clipped to her silhouette, is used.
CHOSEN = {'wing': 'wing-v1-175319-2.png', 'collar': 'collar-v1-175320-1.png'}
# the chosen candidates, kept in the repo (fills/), cropped to their hole plus 40 painting px (only the hole and a 16 px
# ring round it are ever read) and the painting-px offset of each crop. --inpaint still writes new candidates to CAND.
FILLS = {'wing': ('fills/wing.png', (118, 642)), 'collar': ('fills/collar.png', (214, 506))}


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def poly_mask(poly, size):
    im = Image.new('L', size, 0)
    ImageDraw.Draw(im).polygon([tuple(map(float, v)) for v in poly], fill=255)
    return np.array(im) > 0


def load_drawing():
    sheet = Sheet(os.path.join(ROOT, SRC), glow=False, shadow=False)
    rows = sheet.rows()
    bbox = sheet.frames(rows[0][0], rows[-1][1], 1)[0]
    rgba, main = sheet.matte(bbox)
    origin = (max(0, bbox[0] - 8), max(0, bbox[2] - 8))
    ys = np.where(main.any(axis=1))[0]
    fh = int(ys.max() - ys.min())
    full = np.array(Image.open(os.path.join(ROOT, SRC)).convert('RGB'))
    return dict(sheet=sheet, rgba=rgba, main=main, origin=origin, s=FIG_H / fh, fh=fh, full=full, paper=sheet.paper)


def to_matte(mask_full, D):
    """A painting-sized mask cut to the matte's box."""
    ox, oy = D['origin']
    h, w = D['rgba'].shape[:2]
    return mask_full[oy:oy + h, ox:ox + w]


def to_canvas(mask_matte, D):
    """A matte-box mask scaled onto the 440 px canvas (area-weighted, as the parts are)."""
    im = np.dstack([np.zeros(mask_matte.shape + (3,), np.uint8), (mask_matte * 255).astype(np.uint8)])
    return scale(im, mask_matte, D['s'])[0][:, :, 3].astype(float) / 255


def masks(D):
    size = (D['full'].shape[1], D['full'].shape[0])
    body = np.array(Image.open(os.path.join(WALK, 'parts', 'sw-body.png')))
    a = body[:, :, 3].astype(float) / 255
    rgb = body[:, :, :3].astype(int)
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    head = to_canvas(to_matte(poly_mask(HEAD, size), D), D)
    wing = to_canvas(to_matte(poly_mask(WING, size), D), D)
    bowpoly = to_canvas(to_matte(poly_mask(BOW, size), D), D) > 0.5
    # the bow: brown and brass (not the cream cloth, not the orange embroidery on it), holes filled, its dark outline in
    cream = (lum > 150) & (sat < 90)
    orange = (rgb[:, :, 0] > 200) & (rgb[:, :, 0] - rgb[:, :, 2] > 110) & (lum > 110)
    brown = bowpoly & (a > 0.1) & ~cream & ~orange
    brown = ndi.binary_opening(brown, iterations=1)
    lab, k = ndi.label(brown)
    sizes = ndi.sum(brown, lab, range(1, k + 1))
    brown = np.isin(lab, [i + 1 for i in range(k) if sizes[i] > 60])
    bow = ndi.binary_fill_holes(ndi.binary_closing(brown, iterations=2)) & bowpoly
    bow = bow.astype(float)
    # the hands: dark, low-saturation pixels in their boxes, grown 1 px through their dark outline
    def hand_in(box, exclude):
        x0, y0, x1, y1 = box
        m = np.zeros(a.shape, bool)
        m[y0:y1, x0:x1] = True
        dark = m & (a > 0.05) & (lum < 70) & (sat < 45) & ~exclude
        dark = ndi.binary_opening(dark, iterations=1)
        lab, k = ndi.label(dark)
        sizes = ndi.sum(dark, lab, range(1, k + 1))
        dark = lab == 1 + int(np.argmax(sizes))
        dark = ndi.binary_fill_holes(dark)
        return (ndi.binary_dilation(dark, iterations=1) & m & ~exclude & (lum < 110)).astype(float)
    near = hand_in(NEAR_HAND_BOX, wing > 0.5)
    far = hand_in(FAR_HAND_BOX, np.zeros(a.shape, bool))
    # exclusive ownership, front part first: bow > head > wing > near hand > far hand > torso. Hard (each pixel belongs to
    # one part): soft shares left both sides of a seam part-transparent over a torso painted differently there, a visible
    # line at rest (the first build's rest check); a hard seam steps by one canvas px (0.27 page px), over a complete torso
    own = {}
    left = np.ones(a.shape, bool)
    for name, m in (('bow', bow), ('head', head), ('wing', wing), ('near', near), ('far', far)):
        w = (m >= 0.5) & left
        own[name] = w.astype(float)
        left &= ~w
    own['torso'] = left.astype(float)
    return body, own


def overlay(body, own, path):
    cols = dict(torso=(120, 120, 120), head=(60, 120, 255), wing=(255, 200, 0), near=(255, 0, 160), far=(0, 220, 120),
                bow=(200, 60, 20))
    bg = np.zeros(body.shape[:2] + (3,), float) + (40, 50, 60)
    a = body[:, :, 3:4] / 255.0
    base = bg * (1 - a) + body[:, :, :3] * a
    tint = np.zeros_like(base)
    for n, c in cols.items():
        tint += own[n][:, :, None] * np.array(c)
    mix = base * 0.45 + tint * 0.55 * a + base * 0.0
    k = 3
    im = Image.fromarray(np.hstack([base, mix]).clip(0, 255).astype(np.uint8)).resize((body.shape[1] * 2 * k, body.shape[0] * k), Image.NEAREST)
    im.save(path)


# ---- the API --------------------------------------------------------------------------------------------------------
def api_key():
    if os.environ.get('OPENAI_API_KEY'):
        return os.environ['OPENAI_API_KEY']
    for line in open(os.path.join(ROOT, '.env.local')):
        if line.startswith('OPENAI_API_KEY='):
            return line.split('=', 1)[1].strip().strip('"\'')
    sys.exit('OPENAI_API_KEY is not set')


def png_bytes(im):
    buf = io.BytesIO()
    im.save(buf, 'PNG')
    return buf.getvalue()


def multipart(fields, files):
    b = uuid.uuid4().hex
    parts = [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items()]
    for name, filename, data in files:
        head = f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: image/png\r\n\r\n'
        parts.append(head.encode() + data + b'\r\n')
    parts.append(f'--{b}--\r\n'.encode())
    return b''.join(parts), f'multipart/form-data; boundary={b}'


def holes_full(D):
    """The painting-px holes for each fill, and the image each is sent with."""
    size = (D['full'].shape[1], D['full'].shape[0])
    full = D['full'].copy()
    wing = poly_mask(WING, size)
    # the near hand in painting px: dark pixels round it (its box mapped back from canvas px)
    s, (ox, oy) = D['s'], D['origin']
    bx0, by0, bx1, by1 = [int(round((v + 0.5) / s - 0.5)) for v in NEAR_HAND_BOX]
    hand = np.zeros(wing.shape, bool)
    hand[by0 + oy:by1 + oy, bx0 + ox:bx1 + ox] = True
    lum = full.astype(int).mean(axis=2)
    hand &= lum < 90
    hand = ndi.binary_dilation(hand, iterations=6)
    head = poly_mask(HEAD, size)
    bow = poly_mask(BOW, size)
    fig = np.zeros(wing.shape, bool)
    fh_, fw_ = D['main'].shape
    fig[oy:oy + fh_, ox:ox + fw_] = D['rgba'][:, :, 3] > 0
    out = {}
    # wing: the wing and hand grown 8 px, never into the head (it stays, for context), the bow kept
    hole = (ndi.binary_dilation(wing | hand, iterations=8)) & ~head
    hole &= ~(bow & ~ndi.binary_dilation(wing, iterations=2))
    out['wing'] = (hole, full)
    # collar: the head painted out with the ground, the band under its lower outline up into it masked
    img = full.copy()
    img[head] = np.asarray(D['paper'], np.uint8)
    below = ~head
    band = head & ndi.binary_dilation(below, iterations=COLLAR_BAND) & ndi.binary_dilation(fig, iterations=4)
    band = ndi.binary_dilation(band, iterations=4) & ~(below & ~ndi.binary_dilation(head, iterations=10))
    out['collar'] = (band, img)
    return out


def inpaint(which, n, quality, tag, D):
    hole, img = holes_full(D)[which]
    rgba = np.dstack([img, np.where(hole, 0, 255).astype(np.uint8)])
    os.makedirs(CAND, exist_ok=True)
    Image.fromarray(rgba).save(os.path.join(CAND, f'{which}-hole.png'))
    print(f'{which}: hole {int(hole.sum())} px, {MODEL} {quality} x{n}')
    if '--dry-run' in sys.argv:
        return
    fields = dict(model=MODEL, prompt=PROMPTS[which], size=f'{img.shape[1]}x{img.shape[0]}', quality=quality, n=str(n),
                  background='opaque')
    body, ctype = multipart(fields, [('image[]', 'drawing.png', png_bytes(Image.fromarray(img))),
                                     ('mask', 'mask.png', png_bytes(Image.fromarray(rgba)))])
    req = urllib.request.Request('https://api.openai.com/v1/images/edits', body,
                                 {'Authorization': f'Bearer {api_key()}', 'Content-Type': ctype})
    tls = ssl.create_default_context()
    if os.path.exists('/etc/ssl/cert.pem'):
        tls.load_verify_locations('/etc/ssl/cert.pem')
    started = datetime.now()
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=600, context=tls))
    except urllib.error.HTTPError as e:
        sys.exit(f'{e.code}: {e.read().decode()[:800]}')
    secs = (datetime.now() - started).seconds
    usage = resp.get('usage') or {}
    det = usage.get('input_tokens_details') or {}
    cost = (det.get('text_tokens', 0) * RATES['text_in'] + det.get('image_tokens', 0) * RATES['image_in']
            + usage.get('output_tokens', 0) * RATES['image_out']) / 1e6
    print(f'{len(resp["data"])} image(s) in {secs}s; tokens {usage}; ~${cost:.3f}')
    stamp = started.strftime('%H%M%S')
    orig = img.astype(int)
    for k, item in enumerate(resp['data']):
        im = Image.open(io.BytesIO(base64.b64decode(item['b64_json']))).convert('RGB')
        if im.size != (img.shape[1], img.shape[0]):
            print('  resized from', im.size)
            im = im.resize((img.shape[1], img.shape[0]), Image.LANCZOS)
        name = f'{which}-{tag}-{stamp}-{k + 1}.png'
        im.save(os.path.join(CAND, name))
        ring = ndi.binary_dilation(hole, iterations=24) & ~hole
        drift = float(np.abs(np.array(im).astype(int) - orig)[ring].mean())
        print(f'  {name}: drift in the 24 px ring round the hole {drift:.1f}')
        with open(os.path.join(CAND, 'log.jsonl'), 'a') as fh:
            fh.write(json.dumps(dict(when=started.isoformat(timespec='seconds'), fill=which, tag=tag, file=name,
                                     quality=quality, secs=secs, usage=usage, cost=round(cost / len(resp['data']), 4),
                                     drift=round(drift, 2), prompt=PROMPTS[which])) + '\n')


# ---- the build ------------------------------------------------------------------------------------------------------
def fill_image(which, D, hole, img):
    """The chosen candidate inside the hole, colour-matched to the ring round it (mean per channel), matted against the
    ground; outside the hole the drawing. Returns painting-px RGBA. With no candidate chosen: the nearest painted pixel
    (a placeholder for wiring only; the report never uses it)."""
    name = CHOSEN.get(which)
    base = img.astype(float)
    paper = np.asarray(D['paper'], float)
    if name:
        # the crop in fills/ pasted over the image the fill was asked with (outside the crop is never read)
        path, (fx, fy) = FILLS[which]
        crop = np.array(Image.open(os.path.join(HERE, path)).convert('RGB')).astype(float)
        cand = base.copy()
        cand[fy:fy + crop.shape[0], fx:fx + crop.shape[1]] = crop
        # the matte is read on the candidate as generated, against its own ground (the ground it painted round her)
        d = np.abs(cand - paper).sum(axis=2)
        alpha = np.where(hole, np.clip((d - 40) / 70, 0, 1), np.clip(np.abs(base - paper).sum(axis=2) / 1e9 + 1, 0, 1))
        # colour: the mean offset on the cream cloth both show in the ring round the hole (not the ground, not the bow),
        # clamped, so a candidate that repainted the ring differently can't tint the fill
        ring = ndi.binary_dilation(hole, iterations=16) & ~hole
        cream = ring & (base.mean(axis=2) > 150) & (cand.mean(axis=2) > 150) & (np.abs(base - paper).sum(axis=2) > 150)
        off = np.clip((base[cream] - cand[cream]).mean(axis=0), -15, 15) if cream.sum() > 50 else np.zeros(3)
        rgb = np.where(hole[:, :, None], np.clip(cand + off, 0, 255), base)
        print(f'  {which}: {name}, colour offset {np.round(off, 1).tolist()} over {int(cream.sum())} cream ring px')
    else:
        keep = ~hole & (np.abs(base - paper).sum(axis=2) > 90)
        iy, ix = ndi.distance_transform_edt(~keep, return_indices=True)[1]
        rgb = np.where(hole[:, :, None], base[iy, ix], base)
        alpha = np.clip((np.abs(rgb - paper).sum(axis=2) - 40) / 70, 0, 1)
        print(f'  {which}: no candidate chosen, nearest-pixel placeholder')
    return np.dstack([rgb, alpha * 255]).astype(np.uint8)


def matte_box(full_rgba, D):
    ox, oy = D['origin']
    h, w = D['rgba'].shape[:2]
    return full_rgba[oy:oy + h, ox:ox + w]


def canvas_rgba(full_rgba, D):
    box = matte_box(full_rgba, D)
    return scale(box, box[:, :, 3] > 0, D['s'])[0]


def over(dst, src):
    """Straight-alpha 'over' of two float RGBA arrays (0-255)."""
    sa, da = src[:, :, 3:] / 255, dst[:, :, 3:] / 255
    oa = sa + da * (1 - sa)
    rgb = (src[:, :, :3] * sa + dst[:, :, :3] * da * (1 - sa)) / np.maximum(oa, 1e-6)
    return np.dstack([rgb, oa * 255])


def hand_shape(src_png, variant, clean_orange):
    """A hand piece from a variant, cleaned (no cloak, no ring) and put on the sw canvas with the variant's toBase."""
    rig = json.load(open(os.path.join(WALK, 'rig-walk.json')))
    V = rig['variants'][variant]
    im = np.array(Image.open(os.path.join(WALK, 'parts', src_png))).astype(float)
    rgb, a = im[:, :, :3], im[:, :, 3]
    lum = rgb.mean(axis=2)
    a = a * np.clip((125 - lum) / 45, 0, 1)                    # cream cloak and light rims go
    if clean_orange:
        warm = (rgb[:, :, 0] - rgb[:, :, 2] > 55) & (rgb[:, :, 0] > 70)
        a[warm] = 0                                            # the ring's brass left beside the fist
    m = a > 40
    lab, k = ndi.label(m)
    if k:
        sizes = ndi.sum(m, lab, range(1, k + 1))
        a[~np.isin(lab, [1 + int(np.argmax(sizes))])] = 0
    if clean_orange:
        # where the ring was cut out of the fist a notch is left between the knuckles and the forearm: closed, and painted
        # from the fist's own nearest pixels, so the fist is whole when no lantern hangs in front of it
        solid = a > 128
        closed = ndi.binary_fill_holes(ndi.binary_closing(solid, iterations=4)) & ~solid
        if closed.any():
            iy, ix = ndi.distance_transform_edt(~solid, return_indices=True)[1]
            rgb[closed] = rgb[iy[closed], ix[closed]]
            a[closed] = 255
    ys, xs = np.where(a > 0)
    k_, (ox, oy) = V['toBase']['k'], V['toBase']['offset']
    x0, y0 = np.floor(xs.min() * k_ + ox) - 2, np.floor(ys.min() * k_ + oy) - 2
    x1, y1 = np.ceil(xs.max() * k_ + ox) + 3, np.ceil(ys.max() * k_ + oy) + 3
    w, h = int(x1 - x0), int(y1 - y0)
    # output pixel (i, j) at sw canvas (x0 + i, y0 + j) samples variant px ((x0 + i - ox) / k, (y0 + j - oy) / k)
    pre = np.dstack([rgb * a[:, :, None] / 255, a])
    coeffs = (1 / k_, 0, (x0 - ox) / k_, 0, 1 / k_, (y0 - oy) / k_)
    chans = [np.array(Image.fromarray(pre[:, :, c].astype(np.float32)).transform((w, h), Image.AFFINE, coeffs, Image.BILINEAR)) for c in range(4)]
    A = np.clip(chans[3], 0, 255)
    rgbo = np.dstack([chans[c] / np.maximum(A / 255, 1e-3) for c in range(3)])
    out = np.dstack([np.clip(rgbo, 0, 255), A]).astype(np.uint8)
    gx, gy = V['grip']
    return out, [float(x0), float(y0)], [round(gx * k_ + ox, 2), round(gy * k_ + oy, 2)]


# ---- drawn sleeves: the near sleeve as drawn raised, cut from the walk rig's variants (no generation) ------------------
# Polygons in sw canvas px, traced on 4x grid zooms of each variant put on the sw canvas with its toBase. Outer vertices
# lie a few px outside the drawn outline; the edge along her cloak (the hem under the arm) is feathered over 3 px.
SLEEVE_PAD = (70, 10)          # the sleeves reach left of her canvas: cut on a canvas padded this much (left, top)
SLEEVES = {
    'reach': dict(variant='front-reach', poly=[(13.75, 131), (-17.5, 134), (-28, 165), (-28, 211), (-11, 223), (45, 243),
                                              (61, 211), (51, 190), (33.5, 152.5), (25, 136)]),
    'grip': dict(variant='front-grip', poly=[(0, 145), (-37, 162), (-45, 202), (-43, 217), (0, 243), (25, 253), (41, 247),
                                            (51, 215), (33.5, 172.5), (16, 150)]),
    'held': dict(variant='sw-lantern', poly=[(10, 137), (-27, 150), (-40, 202), (-33, 232), (12.5, 267), (50, 297),
                                            (56, 281), (58.5, 230), (46, 190), (26, 145)]),
}


def variant_on_sw(variant, png, pad):
    """A variant's piece resampled onto the padded sw canvas with its toBase (premultiplied bilinear)."""
    V = json.load(open(os.path.join(WALK, 'rig-walk.json')))['variants'][variant]
    k, (ox, oy) = V['toBase']['k'], V['toBase']['offset']
    im = np.array(Image.open(os.path.join(WALK, 'parts', png))).astype(np.float32)
    pre = np.dstack([im[:, :, :3] * im[:, :, 3:] / 255, im[:, :, 3:]])
    sw = json.load(open(os.path.join(WALK, 'rig-walk.json')))['sw']['size']
    size = (sw[0] + pad[0] + 30, sw[1] + pad[1])
    co = (1 / k, 0, (-pad[0] - ox) / k, 0, 1 / k, (-pad[1] - oy) / k)
    ch = [np.array(Image.fromarray(pre[:, :, c]).transform(size, Image.AFFINE, co, Image.BILINEAR)) for c in range(4)]
    A = np.clip(ch[3], 0, 255)
    return np.dstack([np.clip(np.dstack([ch[c] / np.maximum(A / 255, 1e-3) for c in range(3)]), 0, 255), A])


def sleeves(own, alpha):
    px, py = SLEEVE_PAD
    own = dict(own, head=own['head'] * (alpha > 128))   # the hood's paint, not HEAD's polygon (it takes in background)
    out, debug = {}, []
    walk = json.load(open(os.path.join(WALK, 'rig-walk.json')))
    for key, spec in SLEEVES.items():
        V = walk['variants'][spec['variant']]
        body = variant_on_sw(spec['variant'], f"{spec['variant']}-body.png", SLEEVE_PAD)
        hand = variant_on_sw(spec['variant'], f"{spec['variant']}-hand.png", SLEEVE_PAD)
        H, W = body.shape[:2]
        poly = poly_mask([(x + px, y + py) for x, y in spec['poly']], (W, H))
        head = np.zeros((H, W), bool)
        head[py:py + own['head'].shape[0], px:px + own['head'].shape[1]] = own['head'] > 0.5
        keep = poly & ~ndi.binary_dilation(head, iterations=1) & ~ndi.binary_dilation(hand[:, :, 3] > 40, iterations=1)
        # feather only where the cut crosses her paint (outside the polygon is still her): the seam onto the torso
        crossing = ndi.binary_dilation(~poly & (body[:, :, 3] > 128), iterations=3) & poly
        inside = ndi.distance_transform_edt(poly)
        feather = np.where(crossing, np.clip(inside / 3.0, 0, 1), 1.0)
        sl = body.copy()
        sl[:, :, 3] = body[:, :, 3] * keep * feather
        ys, xs = np.where(sl[:, :, 3] > 0)
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        im8 = np.clip(sl, 0, 255).astype(np.uint8)
        Image.fromarray(im8[y0:y1, x0:x1], 'RGBA').save(os.path.join(OUT, f'sleeve-{key}.png'), optimize=True)
        verts, tris = grid_mesh(im8[:, :, 3], 4)
        verts = verts - np.array([px, py])
        k, (ox, oy) = V['toBase']['k'], V['toBase']['offset']
        out[key] = dict(src=f'parts/sleeve-{key}.png', variant=spec['variant'], origin=[x0 - px, y0 - py], size=[x1 - x0, y1 - y0],
                        grip=[round(V['grip'][0] * k + ox, 2), round(V['grip'][1] * k + oy, 2)],
                        area=round(float(im8[:, :, 3].sum() / 255), 1),
                        mesh=dict(verts=np.round(verts, 2).ravel().tolist(), tris=np.array(tris, int).ravel().tolist()))
        print(f"  sleeve {key} from {spec['variant']}: {x1 - x0}x{y1 - y0}, {len(verts)} verts, area {out[key]['area']} px, grip {out[key]['grip']}")
        vis = np.zeros((H, W, 3)) + [60, 80, 100]
        a = body[:, :, 3:] / 255
        vis = vis * (1 - a) + body[:, :, :3] * a
        tint = sl[:, :, 3:] / 255
        vis = vis * (1 - 0.45 * tint) + np.array([255, 0, 200]) * 0.45 * tint
        edge = poly & ~ndi.binary_erosion(poly)
        vis[edge] = [255, 255, 0]
        debug.append(vis[py + 90:py + 320, 0:px + 130])
    Image.fromarray(np.hstack(debug).clip(0, 255).astype(np.uint8)).resize((sum(d.shape[1] for d in debug) * 3, debug[0].shape[0] * 3), Image.NEAREST).save(os.path.join(HERE, 'out', 'sleeves-cut.png'))
    return out


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def grid_mesh(alpha, g, pad=2):
    """Vertices on a g-px grid over the part's paint, two triangles per cell that has any paint."""
    ys, xs = np.where(alpha > 0)
    x0, y0 = int(xs.min()) - pad, int(ys.min()) - pad
    nx, ny = int(np.ceil((xs.max() + pad - x0) / g)) + 1, int(np.ceil((ys.max() + pad - y0) / g)) + 1
    grown = ndi.binary_dilation(alpha > 0, iterations=2)
    H, W = alpha.shape
    verts, index, tris = [], {}, []
    def vid(i, j):
        if (i, j) not in index:
            index[(i, j)] = len(verts)
            verts.append((x0 + i * g, y0 + j * g))
        return index[(i, j)]
    for j in range(ny - 1):
        for i in range(nx - 1):
            cx0, cy0 = x0 + i * g, y0 + j * g
            sub = grown[max(0, cy0):min(H, cy0 + g + 1), max(0, cx0):min(W, cx0 + g + 1)]
            if sub.size and sub.any():
                a, b, c, d = vid(i, j), vid(i + 1, j), vid(i, j + 1), vid(i + 1, j + 1)
                tris += [(a, b, d), (a, d, c)]
    return np.array(verts, float), tris


def build(D, body, own):
    fills = {}
    holes = holes_full(D)
    for which in ('wing', 'collar'):
        hole, img = holes[which]
        fills[which] = (hole, fill_image(which, D, hole, img))
    walk = json.load(open(os.path.join(WALK, 'rig-walk.json')))['sw']
    A = body.astype(float)
    alpha_b = A[:, :, 3]

    # the torso: the drawing, with the wing's and near hand's place painted from the wing fill, and the collar band under
    # the hood's rim painted from the collar fill (clipped to her rest silhouette); the head above the band is gone. The
    # bow and far hand stay painted on it too, under their own parts (they share its weights), so nothing opens under them.
    wing_hole = to_canvas(to_matte(holes['wing'][0], D), D)
    collar_hole = to_canvas(to_matte(holes['collar'][0], D), D)
    wfill = canvas_rgba(fills['wing'][1], D).astype(float)
    cfill = canvas_rgba(fills['collar'][1], D).astype(float)
    torso = A.copy()
    # the rest hand owns its pixels grown 1 px (its outline), less the wing's; the fill replaces exactly the wing and that
    near_full = np.zeros_like(own['near'])
    bx0, by0, bx1, by1 = NEAR_HAND_BOX
    grown = np.clip(ndi.grey_dilation(own['near'], size=3) - own['wing'], 0, 1)
    near_full[by0:by1, bx0:bx1] = grown[by0:by1, bx0:bx1]
    near_full *= (A[:, :, :3].mean(axis=2) < 140)          # its dark outline, never the cream panel beside it
    own['near'] = near_full
    t_w = np.clip(own['wing'] + own['near'], 0, 1)[:, :, None]
    # round the near hand the fill stays inside her rest silhouette: the candidate's cloak ran past it under the hand,
    # which showed at rest beside the hand's anti-aliased edge (a 40 px blob in the first rest check)
    zone = np.zeros(alpha_b.shape, bool)
    zone[by0 - 4:by1 + 4, bx0 - 4:bx1 + 4] = True
    wfill[:, :, 3] = np.where(zone & (own['wing'] < 0.5), np.minimum(wfill[:, :, 3], alpha_b), wfill[:, :, 3])
    # Under the wing's top (the shoulder, beside the bow and under the hood's rim) both candidates painted background inside
    # her rest silhouette (1,086 and 1,397 canvas px across the wing): lifted, the wing opened a hole of backdrop between the
    # bow, the hood and the cloak (the page's hole count, 4,700-8,300 px a frame at 9x). Above WING_SOLID_Y the fill is made
    # complete by extending its own nearest cloth (not painted: procedural); lower down a narrower cloak is allowed.
    need = (own['wing'] > 0.5) & (alpha_b > 128) & (wfill[:, :, 3] < 250)
    need[WING_SOLID_Y:] = False
    have = wfill[:, :, 3] >= 250
    if need.any() and have.any():
        iy, ix = ndi.distance_transform_edt(~have, return_indices=True)[1]
        wfill[need, :3] = wfill[iy[need], ix[need], :3]
        wfill[need, 3] = alpha_b[need]          # her own edge's alpha, so the silhouette at rest is unchanged
    print(f'  wing fill completed by nearest cloth above row {WING_SOLID_Y}: {int(need.sum())} canvas px')
    torso = torso * (1 - t_w) + wfill * t_w
    head_own = own['head']
    band = np.minimum(head_own, collar_hole)
    cf = cfill.copy()
    # only the collar's solid cloth: the candidate's faint strokes along the old hood outline (thin dark lines above the
    # collar in the second build) go, by a threshold and a 1 px opening
    solid = ndi.binary_opening(cf[:, :, 3] > 150, iterations=1)
    cf[:, :, 3] = np.where(solid, np.minimum(cf[:, :, 3], alpha_b), 0)
    torso[:, :, :3] = torso[:, :, :3] * (1 - band[:, :, None]) + cf[:, :, :3] * band[:, :, None]
    torso[:, :, 3] = torso[:, :, 3] * (1 - head_own) + cf[:, :, 3] * band
    parts = {
        'torso': torso,
        'head': np.dstack([A[:, :, :3], alpha_b * own['head']]),
        'bow': np.dstack([A[:, :, :3], alpha_b * own['bow']]),
        'wing': np.dstack([A[:, :, :3], alpha_b * own['wing']]),
        'farhand': np.dstack([A[:, :, :3], alpha_b * own['far']]),
        'hand-rest': np.dstack([A[:, :, :3], alpha_b * own['near']]),
    }
    os.makedirs(OUT, exist_ok=True)
    info = {}
    for name, im in parts.items():
        im8 = np.clip(im, 0, 255).astype(np.uint8)
        ys, xs = np.where(im8[:, :, 3] > 0)
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        Image.fromarray(im8[y0:y1, x0:x1], 'RGBA').save(os.path.join(OUT, f'{name}.png'), optimize=True)
        info[name] = dict(src=f'parts/{name}.png', origin=[x0, y0], size=[x1 - x0, y1 - y0], full=im8)

    # the rest check: every part over the drawn legs and boots, against the walk rig's sw body
    rest = np.zeros_like(A)
    for name in ('torso', 'farhand', 'hand-rest', 'wing', 'head', 'bow'):
        rest = over(rest, info[name]['full'].astype(float))
    on = alpha_b > 250
    diff = np.abs(rest[:, :, :3] - A[:, :, :3])[on]
    adiff = np.abs(rest[:, :, 3] - alpha_b)
    print(f'rest recompose vs sw-body: rgb mean {diff.mean():.3f} max {diff.max():.0f}; alpha mean {adiff.mean():.3f} max {adiff.max():.0f}')

    # hands: the rest hand (cut here), the open hand and the fist (from the variants)
    near = own['near']
    ys, xs = np.where(near > 0.5)
    rest_grip = [round(float(xs.mean()), 2), round(float(ys.mean()), 2)]
    hands = {'rest': dict(src='parts/hand-rest.png', origin=info['hand-rest']['origin'], grip=rest_grip)}
    for shape, png, variant, orange in (('open', 'front-reach-hand.png', 'front-reach', False),
                                        ('fist', 'front-grip-hand.png', 'front-grip', True)):
        im, origin, grip = hand_shape(png, variant, orange)
        Image.fromarray(im, 'RGBA').save(os.path.join(OUT, f'hand-{shape}.png'), optimize=True)
        hands[shape] = dict(src=f'parts/hand-{shape}.png', origin=[round(origin[0], 2), round(origin[1], 2)], grip=grip)
    # which way the forearm leaves each hand, toward the elbow, in degrees on the canvas (y down): read on 6x grid zooms of
    # the pieces — the open hand's and the fist's dark forearm stubs, and for the rest hand the line up to the elbow
    hands['open']['elbowDeg'] = 73.0
    hands['fist']['elbowDeg'] = 67.0

    # the arm at rest: the shoulder under the hood's rim where the wing is attached, the hand's grip, and the elbow halfway
    # with a slight bend toward the pole (down the canvas), so an IK solve at the rest target lands on the bind pose
    S0 = np.array([61.8, 206.6])
    H0 = np.array(rest_grip)
    d = (H0 - S0) / np.linalg.norm(H0 - S0)
    pole = np.array([0.17, 0.985])
    side = pole - (pole @ d) * d
    side /= np.linalg.norm(side)
    E0 = (S0 + H0) / 2 + side * 3.0
    L1, L2 = float(np.linalg.norm(E0 - S0)), float(np.linalg.norm(H0 - E0))
    hands['rest']['elbowDeg'] = round(float(np.degrees(np.arctan2(*(E0 - H0)[::-1]))), 2)

    # meshes and weights: [neck, upper arm, forearm, cloak], the rest to the root
    chin, neck = walk['chin'], walk['neck']
    def neck_w(v):
        return 1 - smoothstep(chin, neck, v[:, 1])
    meshes = {}
    for name, g in (('torso', 8), ('head', 8), ('bow', 6), ('wing', 4), ('farhand', 8)):
        full = info[name]['full']
        verts, tris = grid_mesh(full[:, :, 3], g)
        W = np.zeros((len(verts), 4))
        if name in ('torso', 'head', 'bow'):
            W[:, 0] = neck_w(verts)
        if name == 'torso':
            # the cloak round the shoulder follows the shoulder's lift a little (the soft cloak response)
            near_s = 1 - smoothstep(6, 44, np.linalg.norm(verts - S0, axis=1))
            W[:, 3] = 0.55 * near_s * (1 - W[:, 0])
        if name == 'wing':
            dist = np.linalg.norm(verts - S0, axis=1)
            attach = smoothstep(6, 30, dist)                       # the edge at the shoulder stays with the cloak
            # along the arm: 0 at the shoulder, 1 at the elbow, 2 at the hand (and on past it)
            def along(p, a, b):
                ab = b - a
                return np.clip(((p - a) @ ab) / (ab @ ab), -0.5, 1.8)
            u = np.where(along(verts, S0, E0) < 1, along(verts, S0, E0), 1 + along(verts, E0, H0))
            fore = attach * smoothstep(0.7, 1.3, u)
            W[:, 1] = attach - fore
            W[:, 2] = fore
            W[:, 3] = (1 - attach) * 0.9
            W[:, 0] = (1 - attach) * 0.1 * neck_w(verts)
        meshes[name] = dict(verts=np.round(verts, 2).ravel().tolist(), tris=np.array(tris, int).ravel().tolist(),
                            weights=np.round(W, 3).ravel().tolist())
        print(f'  mesh {name}: {len(verts)} verts, {len(tris)} tris (grid {g} px)')

    rig = dict(
        about="Lumi's sw drawing rigged: layered parts with hidden areas painted in, meshes with linear-blend weights, and a two-bone arm. Canvas px (440 px from hood top to feet, lumi-walk/parts/sw-body.png's canvas). Built by parts.py.",
        facing='sw', src=SRC, size=walk['size'], height=walk['height'], top=walk['top'], feet=walk['feet'],
        rootX=round((walk['contact'][0][0] + walk['contact'][1][0]) / 2, 2), hoodX=walk['hoodX'], chin=chin, neck=neck,
        hem=walk['hem'], contact=walk['contact'], legs=walk['legs'],
        face={k: walk[k] for k in ('eyes', 'faceBlack', 'facePoly', 'faceW', 'eyeBody', 'eyeGlow')},
        feetParts={'foot-0': 'lumi-walk/parts/sw-foot-0.png', 'foot-1': 'lumi-walk/parts/sw-foot-1.png'},
        order=['legs', 'boots', 'torso', 'farhand', 'forearm', 'hand', 'wing', 'head', 'bow'],
        parts={n: dict(src=info[n]['src'], origin=info[n]['origin'], size=info[n]['size'], mesh=meshes[n])
               for n in ('torso', 'head', 'bow', 'wing', 'farhand')},
        bones=dict(
            weights=['neck', 'upper', 'fore', 'cloak'],
            neck=dict(pivot=[walk['hoodX'], neck], note='rotation (a tilt) and a small translation (a glance, curious, sleepy)'),
            upper=dict(pivot=np.round(S0, 2).tolist()), fore=dict(pivot=np.round(E0, 2).tolist()),
            cloak=dict(note='follows the shoulder\'s lift (a translation), springy'),
        ),
        arm=dict(shoulder=np.round(S0, 2).tolist(), elbow=np.round(E0, 2).tolist(), grip=rest_grip, L1=round(L1, 2),
                 L2=round(L2, 2), pole=pole.tolist(), upperDeg=[55, 255], elbowMin=35,
                 shrug=[-1.5, -5.0], shrugNote='canvas px the shoulder rises by when the hand is a full arm above it',
                 forearm=dict(width=15.0, colour=[22, 13, 8])),
        hands=hands,
        sleeves=sleeves(own, alpha_b),
    )
    with open(os.path.join(HERE, 'rig-sw.json'), 'w') as fh:
        json.dump(rig, fh, indent=1)
    # debug: the parts pulled apart on a dark ground, the weights as colour on the wing's and torso's vertices
    k = 2
    sheet = Image.new('RGBA', ((walk['size'][0] + 40) * 3 * k, (walk['size'][1] + 40) * k), (40, 46, 56, 255))
    def paste(im8, dx, dy):
        sheet.alpha_composite(Image.fromarray(im8, 'RGBA').resize((im8.shape[1] * k, im8.shape[0] * k), Image.NEAREST), (dx * k, dy * k))
    paste(np.clip(rest, 0, 255).astype(np.uint8), 20, 20)
    ox = walk['size'][0] + 60
    for name, (dx, dy) in (('torso', (0, 0)), ('farhand', (18, 10)), ('hand-rest', (-26, 24)), ('wing', (-22, 8)),
                           ('head', (0, -14)), ('bow', (16, 6))):
        paste(info[name]['full'], ox + dx, 20 + dy)
    dr = ImageDraw.Draw(sheet)
    ox2 = (walk['size'][0] + 40) * 2 + 20
    paste(info['torso']['full'], ox2, 20)
    for name in ('wing', 'torso'):
        M = meshes[name]
        V = np.array(M['verts']).reshape(-1, 2)
        Wt = np.array(M['weights']).reshape(-1, 4)
        for (x, y), w in zip(V, Wt):
            c = (int(255 * w[1]), int(255 * w[2]), int(255 * min(1, w[3] + w[0])), 255)
            dr.ellipse([(ox2 + x) * k - 2, (20 + y) * k - 2, (ox2 + x) * k + 2, (20 + y) * k + 2], fill=c)
    for p in (S0, E0, H0):
        dr.ellipse([(ox2 + p[0]) * k - 5, (20 + p[1]) * k - 5, (ox2 + p[0]) * k + 5, (20 + p[1]) * k + 5], outline=(255, 255, 255, 255), width=2)
    dr.line([(ox2 + S0[0]) * k, (20 + S0[1]) * k, (ox2 + E0[0]) * k, (20 + E0[1]) * k, (ox2 + H0[0]) * k, (20 + H0[1]) * k], fill=(255, 255, 255, 255), width=2)
    sheet.save(os.path.join(HERE, 'out', 'parts-debug.png'))
    print('wrote parts/, rig-sw.json, out/parts-debug.png (rest · pulled apart · wing weights: red upper, green fore, blue cloak/neck)')


if __name__ == '__main__':
    D = load_drawing()
    if '--inpaint' in sys.argv:
        inpaint(arg('--inpaint'), int(arg('--n', 2)), arg('--quality', 'high'), arg('--tag', 'v1'), D)
        sys.exit(0)
    body, own = masks(D)
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    overlay(body, own, os.path.join(HERE, 'out', 'parts-masks.png'))
    if '--masks' in sys.argv:
        for which, (hole, img) in holes_full(D).items():
            vis = img.copy()
            vis[hole] = (vis[hole] * 0.4 + np.array([255, 0, 200]) * 0.6).astype(np.uint8)
            Image.fromarray(vis).resize((512, 768)).save(os.path.join(HERE, 'out', f'hole-{which}.png'))
        print('wrote out/parts-masks.png, out/hole-wing.png, out/hole-collar.png')
        sys.exit(0)
    build(D, body, own)

#!/usr/bin/env python3
"""Draw the Library's annotated spatial maps from its camera-view manifest.

    python3 scripts/draw-library-map.py

Reads art/scenery/library/library-views.json and the canonical painting, and
writes review images to art/scenery/library/spatial-map/ (annotations only; the
production painting is never touched):

  slots.png       the collection slots (numbered) as the wall faces they stand
                  on, plaques and their text-safe zones, Thread Group rows,
                  close-up frames, expansions, the central table
  lumi.png        Lumi's anchors and routes with her height at each, occluders,
                  and what the rail, a pinned parchment, the top-right cluster
                  and the cover crop hide at four windows
  closeups.png    each collection's close-up frame cut from the painting and,
                  on a side wall, un-sheared (the reference for generating it),
                  with its rows, plaque zone, entry band and anchors
  stills*.png     Lumi's rest frame at her standing anchors, once per scale in
                  the manifest's `lumi.still_scales`

Every coordinate comes from the manifest, so edit the numbers there and redraw.
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, 'art', 'scenery', 'library')
OUT = os.path.join(LIB, 'spatial-map')
M = json.load(open(os.path.join(LIB, 'library-views.json')))
SRC = Image.open(os.path.join(ROOT, M['source']['asset'])).convert('RGB')
W0, H0 = SRC.size
CHROME = M['chrome']
WIDEN = M['projection']['side_wall_widening']

WINDOWS = [(1920, 1080), (1440, 900), (1280, 800), (1100, 900)]
WINDOW_COLOURS = [(255, 120, 120), (255, 190, 90), (150, 220, 255), (200, 160, 255)]
STILL_ANCHORS = ['home', 'aisle_right', 'aisle_centre', 'collection_01.approach', 'collection_02.approach',
                 'collection_03.approach', 'collection_04.approach', 'expansion_03.approach', 'front_left']
TILE_W = 600

SLOT_COLOURS = [(236, 112, 99), (93, 173, 226), (88, 214, 141), (245, 176, 65)]
GOLD, WHITE, GREY, CREAM = (255, 214, 102), (255, 255, 255), (190, 190, 190), (255, 240, 200)


def font(size, bold=False):
    try:
        return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', size, index=1 if bold else 0)
    except OSError:
        return ImageFont.load_default()


def dim(img, amount):
    return Image.blend(img, Image.new('RGB', img.size, (0, 0, 0)), amount)


def dashed_line(d, a, b, fill, width=2, dash=10, gap=7):
    (x0, y0), (x1, y1) = a, b
    length = ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5 or 1
    step, t = dash + gap, 0.0
    while t < length:
        t1 = min(t + dash, length)
        d.line([(x0 + (x1 - x0) * t / length, y0 + (y1 - y0) * t / length),
                (x0 + (x1 - x0) * t1 / length, y0 + (y1 - y0) * t1 / length)], fill=fill, width=width)
        t += step


def dashed_poly(d, pts, fill, width=2, dash=10, gap=7):
    for a, b in zip(pts, pts[1:] + pts[:1]):
        dashed_line(d, a, b, fill, width, dash, gap)


def label(d, xy, text, f, fill=WHITE, bg=(0, 0, 0, 170), anchor='la', pad=4):
    box = d.textbbox(xy, text, font=f, anchor=anchor)
    d.rectangle([box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad], fill=bg)
    d.text(xy, text, font=f, fill=fill, anchor=anchor)


def rect_pts(r):
    return [[r['x'], r['y']], [r['x'] + r['w'], r['y']], [r['x'] + r['w'], r['y'] + r['h']], [r['x'], r['y'] + r['h']]]


def region_pts(region):
    return rect_pts(region) if isinstance(region, dict) else region


class Face:
    """A wall face: top-left, top-right and bottom-left corners in normalized wide coordinates."""

    def __init__(self, f):
        self.o, tr, bl = f['tl'], f['tr'], f['bl']
        self.u = (tr[0] - self.o[0], tr[1] - self.o[1])
        self.v = (bl[0] - self.o[0], bl[1] - self.o[1])

    def pt(self, u, v):
        return [self.o[0] + u * self.u[0] + v * self.v[0], self.o[1] + u * self.u[1] + v * self.v[1]]

    def quad(self, b):
        return [self.pt(b['u'], b['v']), self.pt(b['u'] + b['w'], b['v']),
                self.pt(b['u'] + b['w'], b['v'] + b['h']), self.pt(b['u'], b['v'] + b['h'])]


class Frame:
    """Maps normalized wide coordinates into pixels of an output image (the whole painting)."""

    def __init__(self, img):
        self.img = img

    def pt(self, p):
        return (p[0] * self.img.width, p[1] * self.img.height)

    def pts(self, ps):
        return [self.pt(p) for p in ps]


def slots(kind):
    return [s for s in M['slots'] if s['kind'] == kind]


def view(view_id):
    return next(v for v in M['views'] if v['view_id'] == view_id)


def anchor(ref):
    if '.' in ref:
        slot_id, name = ref.split('.', 1)
        return next(s for s in M['slots'] if s['id'] == slot_id)['lumi'][name]
    return M['anchors'][ref]


def lumi_height(a):
    """Her height at an anchor, as a fraction of the painting's height (constant in a parallel projection)."""
    return M['lumi']['height_at_home'] * a.get('scale', 1)


def window_bounds(vw, vh):
    """What a window shows of the painting under today's cover fit, in normalized painting coordinates."""
    px = max(vw / W0, vh / H0)
    ox, oy = (W0 * px - vw) / 2, (H0 * px - vh) / 2
    cw, ch = CHROME['top_cluster_px']['w'], CHROME['top_cluster_px']['h']
    return {
        'rail': (CHROME['rail_px'] + ox) / (W0 * px), 'parchment': (CHROME['parchment_px'] + ox) / (W0 * px),
        'right': (vw + ox) / (W0 * px), 'top': oy / (H0 * px), 'bottom': (vh + oy) / (H0 * px),
        'cluster': {'x': (vw - cw + ox) / (W0 * px), 'y': oy / (H0 * px), 'w': cw / (W0 * px), 'h': ch / (H0 * px)},
    }


def base(scale):
    return SRC.resize((round(W0 * scale), round(H0 * scale)), Image.LANCZOS)


def draw_slots():
    img = dim(base(1.5), 0.42)
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d, fr = ImageDraw.Draw(over), Frame(img)
    f_big, f_mid, f_small = font(40, True), font(20, True), font(15)

    for s in slots('expansion'):
        pts = fr.pts(region_pts(s['region']))
        d.polygon(pts, fill=(160, 160, 160, 60))
        dashed_poly(d, pts, GREY, 3)
        n = s['id'].split('_')[1]
        label(d, (min(p[0] for p in pts) + 6, min(p[1] for p in pts) + 6), f"E{int(n)}  {s['id']}", f_mid, fill=GREY)
        if 'plaque' in s:
            d.polygon(fr.pts(region_pts(s['plaque']['panel'])), outline=GREY, width=2)

    t = fr.pts(rect_pts(M['central_table']['region']))
    dashed_poly(d, t, CREAM, 3)
    label(d, ((t[0][0] + t[1][0]) / 2, t[2][1] + 8), 'central_table', f_mid, fill=CREAM, anchor='ma')

    for i, s in enumerate(slots('collection')):
        c = SLOT_COLOURS[i % len(SLOT_COLOURS)]
        face = Face(s['face'])
        whole = fr.pts(face.quad({'u': 0, 'v': 0, 'w': 1, 'h': 1}))
        d.polygon(whole, fill=c + (46,), outline=c + (255,), width=4)
        dashed_poly(d, fr.pts(face.quad(view(s['view'])['frame'])), WHITE, 2, 6, 6)
        for g in s['thread_groups']:
            q = fr.pts(face.quad(g['bounds']))
            d.polygon(q, outline=c + (230,), width=2)
            d.text((q[0][0] + 3, q[0][1] + 2), 'tg' + g['id'][-2:], font=f_small, fill=WHITE)
        d.polygon(fr.pts(face.quad(s['plaque']['panel'])), outline=GOLD, width=2)
        dashed_poly(d, fr.pts(face.quad(s['plaque']['text_safe'])), GOLD, 2, 5, 4)
        ts = s['plaque']['text_safe']
        ax, ay = fr.pt(face.pt(ts['u'] + ts['w'] / 2, ts['v'] + ts['h'] / 2))
        n = s['id'].split('_')[1]
        d.ellipse([ax - 28, ay - 28, ax + 28, ay + 28], fill=c + (235,), outline=WHITE, width=3)
        d.text((ax, ay), n, font=f_big, fill=(20, 20, 20), anchor='mm')
        bottom = max(p[1] for p in whole)
        centre = sum(p[0] for p in whole) / 4
        suffix = ' (conditional)' if s.get('conditional') else ''
        label(d, (centre, bottom + 8), s['id'] + suffix, f_mid, fill=c, anchor='ma')
        if 'ladder' in s:
            d.polygon(fr.pts(s['ladder']), outline=(255, 255, 255, 200), width=2)

    legend = ['filled, numbered: collection slot (the wall face it stands on, and its click region); gold: plaque, dashed gold: label text-safe zone',
              'thin quads tg01…: Thread Group rows (shelves) · dashed white: the close-up frame (un-sheared into 2:3 on a side wall)',
              'grey, E1…: reserved for expansion · dashed cream: the central (reading) table']
    y = img.height - 18 - 26 * len(legend)
    for line in legend:
        label(d, (18, y), line, f_small)
        y += 26
    label(d, (18, 18), f"Library: proposed collection slots on {os.path.basename(M['source']['asset'])}, from library-views.json v{M['version']} (proposal, not approved)", f_mid)
    Image.alpha_composite(img.convert('RGBA'), over).convert('RGB').save(os.path.join(OUT, 'slots.png'))


def draw_lumi():
    img = dim(base(1.5), 0.45)
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d, fr = ImageDraw.Draw(over), Frame(img)
    f_mid, f_small = font(18, True), font(14)

    for k, (vw, vh) in enumerate(WINDOWS):
        b, col = window_bounds(vw, vh), WINDOW_COLOURS[k]
        x, _ = fr.pt((b['rail'], 0))
        d.line([(x, 0), (x, img.height)], fill=col, width=2)
        xp, _ = fr.pt((b['parchment'], 0))
        dashed_line(d, (xp, 0), (xp, img.height), col, 2, 14, 8)
        if b['right'] < 1:
            xr, _ = fr.pt((b['right'], 0))
            dashed_line(d, (xr, 0), (xr, img.height), col, 2, 4, 6)
        if b['top'] > 0:
            for yy in (b['top'], b['bottom']):
                _, yv = fr.pt((0, yy))
                dashed_line(d, (0, yv), (img.width, yv), col, 2, 4, 6)
        d.polygon(fr.pts(rect_pts(b['cluster'])), outline=col, width=2)
        label(d, (xp + 6, 60 + 26 * k), f'{vw}x{vh}: rail (solid), pinned parchment (dashed), crop (dotted), clock cluster (box)', f_small, fill=col)

    for o in M.get('occluders', []):
        q = fr.pts(rect_pts(o['region']))
        d.polygon(q, fill=CREAM + (40,), outline=CREAM, width=2)
        d.text((q[0][0] + 4, q[2][1] + 4), o['id'], font=f_small, fill=CREAM, stroke_width=2, stroke_fill=(0, 0, 0))

    for r in M['routes']:
        pts = [fr.pt(anchor(p)['at']) for p in r['points']]
        d.line(pts, fill=(255, 236, 160, 220), width=3, joint='curve')

    named = list(M['anchors'].items())
    for s in M['slots']:
        named += [(f"{s['id']}.{k}", v) for k, v in s.get('lumi', {}).items() if isinstance(v, dict)]
    for name, a in named:
        x, y = fr.pt(a['at'])
        h = lumi_height(a) * img.height
        d.line([(x, y), (x, y - h)], fill=(120, 255, 200, 200), width=5)
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 80, 80), outline=WHITE, width=2)
        d.text((x + 9, y - 8), name, font=f_small, fill=WHITE, stroke_width=2, stroke_fill=(0, 0, 0))

    label(d, (18, 18), 'Lumi: anchors (red), routes (yellow), occluders (cream), her height at each anchor (green bar)', f_mid)
    label(d, (18, img.height - 40), f"Height bar: her {M['lumi']['figure_height_px']}px drawing at a 1440x900 window; the same everywhere in a parallel projection.", f_small)
    Image.alpha_composite(img.convert('RGBA'), over).convert('RGB').save(os.path.join(OUT, 'lumi.png'))


def closeup_tile(s, c):
    """The frame cut from the painting and un-sheared: output (i, j) samples face point frame.u + i/W*frame.w, frame.v + j/H*frame.h."""
    v = view(s['view'])
    face, fb = Face(s['face']), v['frame']
    o = face.pt(fb['u'], fb['v'])
    ux, uy = face.u[0] * fb['w'] * W0, face.u[1] * fb['w'] * H0
    vx, vy = face.v[0] * fb['h'] * W0, face.v[1] * fb['h'] * H0
    width = (ux ** 2 + uy ** 2) ** 0.5 if v['rectify'] == 'none' else abs(ux) * WIDEN
    height = abs(vy)
    th = round(TILE_W * height / width)
    tile = SRC.transform((TILE_W, th), Image.AFFINE, (ux / TILE_W, vx / th, o[0] * W0, uy / TILE_W, vy / th, o[1] * H0), Image.BICUBIC).convert('RGBA')

    def to_tile(p):  # a wide point back into tile pixels, through the face's inverse
        dx, dy = p[0] - face.o[0], p[1] - face.o[1]
        det = face.u[0] * face.v[1] - face.u[1] * face.v[0]
        fu = (dx * face.v[1] - dy * face.v[0]) / det
        fv = (face.u[0] * dy - face.u[1] * dx) / det
        return ((fu - fb['u']) / fb['w'] * TILE_W, (fv - fb['v']) / fb['h'] * th)

    over = Image.new('RGBA', tile.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    f_mid, f_small = font(17, True), font(13)
    band = v['readable_viewport']['entry_band']
    by0, by1 = (band['v'] - fb['v']) / fb['h'] * th, (band['v'] + band['h'] - fb['v']) / fb['h'] * th
    d.rectangle([3, max(3, by0), TILE_W - 3, min(th - 3, by1)], outline=(255, 255, 255, 230), width=3)
    d.text((TILE_W - 10, min(th - 8, by1) - 6), 'entry viewport', font=f_small, fill=WHITE, anchor='rd', stroke_width=2, stroke_fill=(0, 0, 0))

    def local_box(b):
        return [((b['u'] - fb['u']) / fb['w'] * TILE_W, (b['v'] - fb['v']) / fb['h'] * th),
                ((b['u'] + b['w'] - fb['u']) / fb['w'] * TILE_W, (b['v'] + b['h'] - fb['v']) / fb['h'] * th)]

    for g in s['thread_groups']:
        (x0, y0), (x1, y1) = local_box(g['bounds'])
        d.rectangle([x0, y0, x1, y1], fill=c + (40,), outline=c + (255,), width=2)
        d.rectangle([x0, y0, x0 + (x1 - x0) * 0.55, y0 + (y1 - y0) * 0.30], fill=(24, 30, 22, 170), outline=GOLD, width=1)
        d.text((x0 + 4, y0 + 2), g['id'].split('.')[1], font=f_small, fill=GOLD)
    (x0, y0), (x1, y1) = local_box(s['plaque']['text_safe'])
    dashed_poly(d, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], GOLD, 2, 5, 4)
    for k, a in s['lumi'].items():
        if isinstance(a, dict):
            x, y = to_tile(a['at'])
            if 0 <= x <= TILE_W and 0 <= y <= th:
                h = lumi_height(a) * H0 / height * th
                d.line([(x, y), (x, y - h)], fill=(120, 255, 200, 230), width=4)
                d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 80, 80), outline=WHITE, width=2)
                d.text((x + 9, y - 8), k, font=f_small, fill=WHITE, stroke_width=2, stroke_fill=(0, 0, 0))
    tile = Image.alpha_composite(tile, over)
    how = 'un-sheared, widened ×%.2f' % WIDEN if v['rectify'] != 'none' else 'a plain crop'
    head = Image.new('RGBA', (TILE_W, 44), (20, 18, 16, 255))
    ImageDraw.Draw(head).text((12, 12), f"{v['view_id']}  ·  {how}  ·  ×{th / height:.1f}", font=f_mid, fill=c)
    col = Image.new('RGBA', (TILE_W, 44 + th), (20, 18, 16, 255))
    col.paste(head, (0, 0))
    col.paste(tile, (0, 44))
    return col


def draw_closeups():
    tiles = [closeup_tile(s, SLOT_COLOURS[i % len(SLOT_COLOURS)]) for i, s in enumerate(slots('collection'))]
    sheet = Image.new('RGB', (len(tiles) * (TILE_W + 10) - 10, max(t.height for t in tiles)), (20, 18, 16))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert('RGB'), (i * (TILE_W + 10), 0))
    sheet.save(os.path.join(OUT, 'closeups.png'))


def draw_stills(scale):
    sp = M['lumi']['sprite']
    sheet = Image.open(os.path.join(ROOT, sp['asset'])).convert('RGBA')
    cw, ch = sp['cell']
    figure = sheet.crop((0, 0, cw, ch)).crop(tuple(sp['figure_bbox']))
    if sp.get('mirrored'):
        figure = ImageOps.mirror(figure)

    img = base(1.5).convert('RGBA')
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d, fr = ImageDraw.Draw(over), Frame(img)
    f_mid, f_small = font(18, True), font(14)
    for ref in STILL_ANCHORS:
        a = anchor(ref)
        x, y = fr.pt(a['at'])
        h = lumi_height(a) * scale * img.height
        k = h / figure.height
        fig = figure.resize((max(1, round(figure.width * k)), max(1, round(h))), Image.LANCZOS)
        img.alpha_composite(fig, (round(x - fig.width / 2), round(y - fig.height)))
        d.text((x, y + 8), ref, font=f_small, fill=WHITE, anchor='ma', stroke_width=2, stroke_fill=(0, 0, 0))
    label(d, (18, 18), f"Lumi's rest frame at her standing anchors at ×{scale:g} her usual size (always drawn on top: occluders ignored)", f_mid)
    label(d, (18, img.height - 40), f"×{scale:g}: her drawing {round(M['lumi']['figure_height_px'] * scale)}px tall at a 1440x900 window (a {round(M['lumi']['rendered_height_px'] * scale)}px companion box).", f_small)
    name = 'stills.png' if scale == 1 else f'stills-{round(scale * 100)}.png'
    Image.alpha_composite(img, over).convert('RGB').save(os.path.join(OUT, name))


os.makedirs(OUT, exist_ok=True)
draw_slots()
draw_lumi()
draw_closeups()
for sc in M['lumi'].get('still_scales', [1.0]):
    draw_stills(sc)
print('wrote', ', '.join(sorted(f for f in os.listdir(OUT) if f.endswith('.png'))), 'in', os.path.relpath(OUT, ROOT))

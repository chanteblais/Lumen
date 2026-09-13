#!/usr/bin/env python3
"""Draw the Library's annotated spatial maps from its camera-view manifest.

    python3 scripts/draw-library-map.py

Reads art/scenery/library/library-views.json and the canonical painting, and
writes three review images to art/scenery/library/spatial-map/ (annotations
only; the production painting is never touched):

  slots.png     the collection slots (numbered), plaques and their text-safe
                zones, Thread Group rows, close-up frames, expansions, the table
  lumi.png      Lumi's anchors and routes with her estimated height at each,
                and what the sidebar, top bar and cover crop hide at four windows
  closeups.png  each collection's close-up frame cut from the painting, with its
                rows, plaque zone, entry band and anchors projected into it

Every coordinate comes from the manifest, so edit the numbers there and redraw.
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, 'art', 'scenery', 'library')
OUT = os.path.join(LIB, 'spatial-map')
M = json.load(open(os.path.join(LIB, 'library-views.json')))
SRC = Image.open(os.path.join(ROOT, M['source']['asset'])).convert('RGB')
W0, H0 = SRC.size

SIDEBAR_PX, HEADER_PX = 272, 72  # the shell's sidebar column; the top bar's height, estimated
WINDOWS = [(1920, 1080), (1440, 900), (1280, 800), (1100, 900)]

SLOT_COLOURS = [(236, 112, 99), (93, 173, 226), (88, 214, 141), (245, 176, 65)]
GOLD, WHITE, GREY = (255, 214, 102), (255, 255, 255), (190, 190, 190)


def font(size, bold=False):
    path = '/System/Library/Fonts/Helvetica.ttc'
    try:
        return ImageFont.truetype(path, size, index=1 if bold else 0)
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


def dashed_rect(d, box, fill, width=2, dash=10, gap=7):
    x0, y0, x1, y1 = box
    for a, b in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]:
        dashed_line(d, a, b, fill, width, dash, gap)


def label(d, xy, text, f, fill=WHITE, bg=(0, 0, 0, 170), anchor='la', pad=4):
    box = d.textbbox(xy, text, font=f, anchor=anchor)
    d.rectangle([box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad], fill=bg)
    d.text(xy, text, font=f, fill=fill, anchor=anchor)


class Frame:
    """Maps wide-view normalized coordinates into pixels of an output image."""

    def __init__(self, img, region=None):
        self.img, self.r = img, region or {'x': 0, 'y': 0, 'w': 1, 'h': 1}

    def pt(self, p):
        return ((p[0] - self.r['x']) / self.r['w'] * self.img.width,
                (p[1] - self.r['y']) / self.r['h'] * self.img.height)

    def box(self, b):
        x0, y0 = self.pt((b['x'], b['y']))
        x1, y1 = self.pt((b['x'] + b['w'], b['y'] + b['h']))
        return [x0, y0, x1, y1]


def slots(kind):
    return [s for s in M['slots'] if s['kind'] == kind]


def anchor_point(ref):
    if '.' in ref:
        slot_id, name = ref.split('.', 1)
        slot = next(s for s in M['slots'] if s['id'] == slot_id)
        return slot['lumi'][name]['at']
    return M['anchors'][ref]['at']


def lumi_height(anchor):
    """Her estimated height at an anchor, as a fraction of the painting's height."""
    s = M['lumi']['depth_scale']
    if 'scale' in anchor:
        scale = anchor['scale']
    else:
        k = (s['scale_front'] - s['scale_back']) / (s['y_front'] - s['y_back'])
        scale = max(0.2, s['scale_back'] + (anchor.get('floor_y', anchor['at'][1]) - s['y_back']) * k)
    return M['lumi']['height_at_home'] * scale


def base(scale):
    return SRC.resize((round(W0 * scale), round(H0 * scale)), Image.LANCZOS)


def draw_slots():
    img = dim(base(1.5), 0.42)
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d, fr = ImageDraw.Draw(over), Frame(img)
    f_big, f_mid, f_small = font(46, True), font(20, True), font(15)

    for s in slots('expansion'):
        b = fr.box(s['region'])
        d.rectangle(b, fill=(160, 160, 160, 55))
        for i in range(int(b[0]) - int(b[3] - b[1]), int(b[2]), 18):  # hatching
            d.line([(max(i, b[0]), b[3] - max(0, b[0] - i)), (min(i + (b[3] - b[1]), b[2]), b[1] + max(0, i + (b[3] - b[1]) - b[2]))], fill=(220, 220, 220, 90), width=1)
        dashed_rect(d, b, GREY, 3)
        n = s['id'].split('_')[1]
        label(d, (b[0] + 8, b[1] + 8), f"E{int(n)}  {s['id']}", f_mid, fill=GREY)
        if 'plaque' in s:
            d.rectangle(fr.box(s['plaque']['panel']), outline=GREY, width=2)

    t = M['central_table']
    tb = fr.box(t['region'])
    dashed_rect(d, tb, (255, 240, 200), 3)
    label(d, (tb[0] + 8, tb[3] - 34), 'central_table', f_mid, fill=(255, 240, 200))

    for i, s in enumerate(slots('collection')):
        c = SLOT_COLOURS[i % len(SLOT_COLOURS)]
        hb = fr.box(s['hit_region'])
        d.rectangle(hb, fill=c + (46,), outline=c + (255,), width=4)
        view = next(v for v in M['views'] if v['view_id'] == s['view'])
        dashed_rect(d, fr.box(view['target_region']), WHITE, 2, 6, 6)
        for g in s['thread_groups']:
            gb = fr.box(g['bounds'])
            d.rectangle(gb, outline=c + (230,), width=2)
            d.text((gb[0] + 3, gb[1] + 2), 'tg' + g['id'][-2:], font=f_small, fill=WHITE)
        p = s['plaque']
        d.rectangle(fr.box(p['panel']), outline=GOLD, width=2)
        dashed_rect(d, fr.box(p['text_safe']), GOLD, 2, 5, 4)
        ax, ay = fr.pt(p['label_anchor'])
        n = s['id'].split('_')[1]
        d.ellipse([ax - 34, ay - 34, ax + 34, ay + 34], fill=c + (235,), outline=WHITE, width=3)
        d.text((ax, ay), n, font=f_big, fill=(20, 20, 20), anchor='mm')
        suffix = ' (conditional)' if s.get('conditional') else ''
        label(d, (hb[0] + (hb[2] - hb[0]) / 2, hb[3] + 8), s['id'] + suffix, f_mid, fill=c, anchor='ma')
        if 'ladder' in s:
            d.polygon([fr.pt(q) for q in s['ladder']], outline=(255, 255, 255, 200), width=2)

    legend = ['filled, numbered: collection slot (click region); gold: plaque, dashed gold: label text-safe zone',
              'thin boxes tg01…: Thread Group rows (shelves) · dashed white: the 2:3 close-up frame',
              'grey hatched, E1…: reserved for expansion · dashed cream: the central table']
    y = img.height - 18 - 26 * len(legend)
    for line in legend:
        label(d, (18, y), line, f_small)
        y += 26
    label(d, (18, 18), 'Library: proposed collection slots, from library-views.json (proposal, not approved)', f_mid)
    Image.alpha_composite(img.convert('RGBA'), over).convert('RGB').save(os.path.join(OUT, 'slots.png'))


def draw_lumi():
    img = dim(base(1.5), 0.45)
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d, fr = ImageDraw.Draw(over), Frame(img)
    f_mid, f_small = font(18, True), font(14)

    for k, (vw, vh) in enumerate(WINDOWS):  # what each window hides under today's cover fit
        px = max(vw / W0, vh / H0)
        ox, oy = (W0 * px - vw) / 2, (H0 * px - vh) / 2
        left = (SIDEBAR_PX + ox) / (W0 * px)
        top = (HEADER_PX + oy) / (H0 * px)
        right = (vw + ox) / (W0 * px)
        bottom = (vh + oy) / (H0 * px)
        col = [(255, 120, 120), (255, 190, 90), (150, 220, 255), (200, 160, 255)][k]
        x, _ = fr.pt((left, 0))
        dashed_line(d, (x, 0), (x, img.height), col, 2, 14, 8)
        _, y = fr.pt((0, top))
        dashed_line(d, (0, y), (img.width, y), col, 2, 14, 8)
        if right < 1:
            xr, _ = fr.pt((right, 0))
            dashed_line(d, (xr, 0), (xr, img.height), col, 2, 4, 6)
        if bottom < 1:
            _, yb = fr.pt((0, bottom))
            dashed_line(d, (0, yb), (img.width, yb), col, 2, 4, 6)
        label(d, (x + 6, 60 + 26 * k), f'{vw}x{vh}: sidebar edge, top bar, crop (dotted)', f_small, fill=col)

    for r in M['routes']:
        pts = [fr.pt(anchor_point(p)) for p in r['points']]
        hidden_at = r['points'].index(r['hidden_from']) if 'hidden_from' in r else len(pts)
        for i in range(len(pts) - 1):
            if i >= hidden_at:
                dashed_line(d, pts[i], pts[i + 1], (255, 255, 255, 200), 3, 8, 8)
            else:
                d.line([pts[i], pts[i + 1]], fill=(255, 236, 160, 220), width=3)

    named = list(M['anchors'].items())
    for s in M['slots']:
        for k, v in s.get('lumi', {}).items():
            if isinstance(v, dict):
                named.append((f"{s['id']}.{k}", v))
    for name, a in named:
        x, y = fr.pt(a['at'])
        h = lumi_height(a) * img.height
        d.line([(x, y), (x, y - h)], fill=(120, 255, 200, 230), width=5)  # her estimated height here
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 80, 80), outline=WHITE, width=2)
        d.text((x + 9, y - 8), name, font=f_small, fill=WHITE, stroke_width=2, stroke_fill=(0, 0, 0))

    label(d, (18, 18), "Lumi: anchors (red), routes (dashed where hidden behind the table), her estimated height at each anchor (green bar)", f_mid)
    label(d, (18, img.height - 40), 'Height bar: 150px at home, scaled by the manifest depth_scale (an estimate from the furniture, to check with a still).', f_small)
    Image.alpha_composite(img.convert('RGBA'), over).convert('RGB').save(os.path.join(OUT, 'lumi.png'))


def draw_closeups():
    tiles = []
    for i, s in enumerate(slots('collection')):
        c = SLOT_COLOURS[i % len(SLOT_COLOURS)]
        view = next(v for v in M['views'] if v['view_id'] == s['view'])
        r = view['target_region']
        crop = SRC.crop((round(r['x'] * W0), round(r['y'] * H0), round((r['x'] + r['w']) * W0), round((r['y'] + r['h']) * H0)))
        tile = crop.resize((600, 900), Image.LANCZOS).convert('RGBA')
        over = Image.new('RGBA', tile.size, (0, 0, 0, 0))
        d, fr = ImageDraw.Draw(over), Frame(tile, r)
        f_mid, f_small = font(17, True), font(13)
        band = view['readable_viewport']['entry_band']
        bx0, by0 = fr.pt((r['x'], band['y']))
        bx1, by1 = fr.pt((r['x'] + r['w'], band['y'] + band['h']))
        d.rectangle([bx0 + 2, by0, bx1 - 2, by1], outline=(255, 255, 255, 230), width=3)
        d.text((bx1 - 8, by1 - 6), 'entry viewport', font=f_small, fill=WHITE, anchor='rd', stroke_width=2, stroke_fill=(0, 0, 0))
        for g in s['thread_groups']:
            gb = fr.box(g['bounds'])
            d.rectangle(gb, fill=c + (40,), outline=c + (255,), width=2)
            pw = (gb[2] - gb[0]) * 0.55
            ph = (gb[3] - gb[1]) * 0.30
            d.rectangle([gb[0], gb[1], gb[0] + pw, gb[1] + ph], fill=(24, 30, 22, 170), outline=GOLD, width=1)
            d.text((gb[0] + 4, gb[1] + 2), g['id'].split('.')[1], font=f_small, fill=GOLD)
        p = s['plaque']
        dashed_rect(d, fr.box(p['text_safe']), GOLD, 2, 5, 4)
        for k, v in s['lumi'].items():
            if isinstance(v, dict):
                x, y = fr.pt(v['at'])
                if 0 <= x <= tile.width and 0 <= y <= tile.height:
                    d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 80, 80), outline=WHITE, width=2)
                    d.text((x + 9, y - 8), k, font=f_small, fill=WHITE, stroke_width=2, stroke_fill=(0, 0, 0))
        tile = Image.alpha_composite(tile, over)
        head = Image.new('RGBA', (600, 44), (20, 18, 16, 255))
        ImageDraw.Draw(head).text((12, 12), f"{view['view_id']}  ·  x{view['camera_scale']}  ·  {view['aspect_ratio']}", font=f_mid, fill=c)
        col = Image.new('RGBA', (600, 944))
        col.paste(head, (0, 0))
        col.paste(tile, (0, 44))
        tiles.append(col)
    sheet = Image.new('RGB', (len(tiles) * 610 - 10, 944), (20, 18, 16))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert('RGB'), (i * 610, 0))
    sheet.save(os.path.join(OUT, 'closeups.png'))


os.makedirs(OUT, exist_ok=True)
draw_slots()
draw_lumi()
draw_closeups()
print('wrote', ', '.join(sorted(os.listdir(OUT))), 'in', os.path.relpath(OUT, ROOT))

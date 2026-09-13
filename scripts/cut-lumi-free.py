"""Cut the hands-free Lumi from her sheets, one spec per loop.

    python3 scripts/cut-lumi-free.py [--debug <dir>]

Writes public/lumi-free.webp, the corner companion's body for the hands-free Lumi (docs/art-direction.md §4a,
bet 8). The lantern Lumi's cut, scripts/cut-lumi-idle.py, is untouched: it still writes public/lumi-idle.webp
and the avatar heads.

Every loop is held to one drawing, REST (the wave sheet's first cell), so loops hand over without a swap even
though each comes from its own generated sheet. Per loop, as its spec in LOOPS says:
- each row of the sheet is scaled so she stands FIGURE_H tall, and each cell placed with the hood's centre at
  HOOD_X (measured by the hood's right edge, which no hand reaches);
- aligned onto REST over the parts that hold (`region` decides which: the right half for a left-hand gesture,
  the head and boots otherwise), within 6px and then to a quarter pixel;
- held: the cell keeps REST's pixels except where its moving part may be (`region`) and actually differs;
- the rest cells are REST exactly; a phase hold keeps one donor cell through a span ('hand': only the hand and
  wrist swing; 'all': the whole cell); `monotone` makes the lower cloak move one way through a rise or a fall;
- `ease` cells next to a rest cell move from REST's drawing into their own (a sheet that isn't REST's draws the
  cloak a little differently, and it swapped shape at the join), anything dark kept out of the blend;
- a `prop` (the book stack) is kept in the rest cells, and PROP_FADE cells before the loop bring it in.
The breath is REST stretched up to 2px at the hood top with the feet held, with lids drawn over her eyes for
the half-shut and shut rows. This is the lantern cut's method (art/README.md → Adding a sheet) with the
per-sheet constants moved into specs (docs/animation-pipeline.md, backlog #2).

Output: rows of W×H cells — breath (nine cells) with open / half-shut / shut eyes in rows 0–2, then one row per
loop in LOOPS order, eyes open. LumiSprite's LUMI_LOOP_CELLS says the play order over each row.
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lumi_cut import Sheet, align, breathe, eyes_shut, face, place, premul, scale, straight  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'art', 'lumi')
OUT = os.path.join(ROOT, 'public', 'lumi-free.webp')
DEBUG = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None

W, H = 176, 208       # wider than the lantern cut's 160: a prop can stand beside her
FEET_Y = 200
FIGURE_H = 173        # hood top to feet, px — the lantern Lumi's size, so she keeps her size on the page
HEAD_SHARE = 0.45     # the top of her height that is hood and face
HOOD_X = 0.45         # the hood's centre across the cell: a little left of the middle, leaving room for a prop on her left (the viewer's right)
BREATH_FRAMES = 9
BREATH_RISE = 2.0
HAND_ROWS = 135       # a waving hand never comes below this row
LOW_ROW = 140         # the lower cloak on her right (the viewer's left), below a raised arm

LOOPS = [
    # the arrival wave: her right hand (the viewer's left) rises 2–7, waves 8–15, lowers 16–21
    dict(name='wave', sheet='lumi-free-wave.png', cells=24, region='left', rest=[0, 1, 22, 23],
         holds=[(range(9, 16), 8, 'hand')], monotone=[(range(2, 8), True), (range(16, 22), False)]),
    # both hands meet in front 1–6, rest there 7–9, part 10–14
    dict(name='hands', sheet='lumi-free-idle.png', cells=16, region='front', rest=[0, 15],
         holds=[(range(8, 10), 7, 'all')], monotone=[], ease=2),
    # a stack of books beside her: she reaches 2–5, lifts the red book 6–11, the other hand joins 12–15, holds it 16–23
    dict(name='pickup', sheet='lumi-free-pickup.png', cells=24, region='below-head', rest=[0, 1],
         holds=[(range(17, 24), 16, 'all')], monotone=[], prop=True, ease=2),
]
PROP_FADE = (0.25, 0.5, 0.75)   # cells before a loop with a prop, fading it in (played backwards, out)
REST_FROM = 'wave'

height = lambda main: np.ptp(np.where(main.any(axis=1))[0])


def hood(main):
    """The hood's right edge and its centre, over the head rows."""
    ys = np.where(main.any(axis=1))[0]
    xs = np.where(main[ys.min():ys.min() + int((ys.max() - ys.min()) * HEAD_SHARE)].any(axis=0))[0]
    return xs.max(), (xs.min() + xs.max()) / 2


def load(spec):
    """The spec's sheet as cells: matted, each row scaled to FIGURE_H, placed by the hood."""
    sheet = Sheet(os.path.join(ART, spec['sheet']), glow=False)
    rows = sheet.rows()
    per = spec['cells'] // len(rows)
    boxes = [(r, b) for r, (y0, y1) in enumerate(rows) for b in sheet.frames(y0, y1, per)]
    assert len(boxes) == spec['cells'], (spec['name'], len(boxes))
    matted = [(r, *sheet.matte(b)) for r, b in boxes]
    row_scale = {r: FIGURE_H / np.median([height(m) for rr, _, m in matted if rr == r]) for r in sorted({r for r, _, _ in matted})}
    print(spec['name'], 'row scales', {r: round(float(s), 3) for r, s in row_scale.items()})
    scaled = [scale(rgba, main, row_scale[r]) for r, rgba, main in matted]
    right0, centre0 = hood(scaled[0][1])
    anchor = right0 - centre0
    return [place(rgba, main, W, H, FEET_Y, cx=hood(main)[0] - anchor + W / 2 - HOOD_X * W) for rgba, main in scaled]


cut = {spec['name']: load(spec) for spec in LOOPS}
rest = cut[REST_FROM][0].copy()
head_rows = FEET_Y - FIGURE_H + int(FIGURE_H * HEAD_SHARE)
hx = np.where((rest[:head_rows, :, 3] > 127).any(axis=0))[0]
col0 = int((hx.min() + hx.max()) / 2)
face_left = int(np.where(face(rest)[0][:head_rows].any(axis=0))[0].min())
feet_right = int(np.where((rest[FEET_Y - 10:FEET_Y, :, 3] > 200).any(axis=0))[0].max())
print(f'rest: hood centre col {col0}, head rows < {head_rows}, face from col {face_left}, boots to col {feet_right}')


def allowed(region):
    """Where a loop's moving part may be."""
    m = np.zeros((H, W), bool)
    if region == 'left':          # her right arm, on the viewer's left, beside the hood but never over the face
        m[:FEET_Y - 8, :col0] = True
        m[:head_rows, face_left - 2:] = False
    elif region == 'front':       # both hands, below the chin
        m[head_rows:FEET_Y - 8] = True
    elif region == 'below-head':  # arms, hands and what they carry, and a prop standing beside her
        m[head_rows:FEET_Y - 8] = True
        m[head_rows:, feet_right + 3:] = True
    return m


def held_weights(region):
    """The parts a loop is aligned on: what never moves in it."""
    w = np.zeros((H, W))
    if region == 'left':
        w[:, col0:] = 1
    else:
        w[:head_rows] = 1
    w[FEET_Y - 10:, :feet_right + 2] = 1
    return w


def hold(cell, mask):
    """Everything but what moves comes from REST. What moves is where the cell differs from REST in blobs, not lines
    (an opening drops the 1–2px outlines a redraw shifts), inside `mask`, dilated a little and feathered."""
    pc, pr = premul(cell), premul(rest)
    moving = (np.abs(pc - pr).sum(axis=2) > 90) & mask
    moving = ndi.binary_fill_holes(ndi.binary_dilation(ndi.binary_opening(moving, iterations=2), iterations=3))
    w = ndi.gaussian_filter(moving.astype(float), 1.5)[:, :, None]
    return straight(w * pc + (1 - w) * pr)


dark = lambda c: (c[:, :, :3].sum(axis=2) < 150) & (c[:, :, 3] > 200)
opaque = lambda c: c[:, :, 3] > 127


def hold_hand(cell, donor, mask):
    """Inside a phase, everything but the hand and wrist is `donor`'s: the hand is where cell and donor disagree about
    what is dark or opaque, inside `mask` and above HAND_ROWS, in blobs of 30px or more, dilated to take the wrist."""
    hand = ((dark(cell) ^ dark(donor)) | (opaque(cell) ^ opaque(donor))) & mask
    hand[HAND_ROWS:] = False
    hand = ndi.binary_opening(hand, iterations=1)
    lab, k = ndi.label(hand)
    sizes = ndi.sum(hand, lab, range(1, k + 1))
    hand = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 30])
    moving = ndi.binary_fill_holes(ndi.binary_dilation(hand, iterations=4))
    w = ndi.gaussian_filter(moving.astype(float), 1.5)[:, :, None]
    return straight(w * premul(cell) + (1 - w) * premul(donor))


lower_area = lambda cell: cell[LOW_ROW:FEET_Y - 8, :col0, 3].astype(float).sum() / 255


def with_lower(cell, src):
    """`cell` with `src`'s lower cloak on the viewer's left, the seam feathered, keeping out anything dark in either."""
    w = np.clip((np.arange(H) - (LOW_ROW - 8)) / 10, 0, 1)[:, None] * (np.arange(W) < col0)[None, :]
    w = w * ~ndi.binary_dilation(dark(cell) | dark(src), iterations=4)
    w = ndi.gaussian_filter(w, 1.5)[:, :, None]
    return straight(w * premul(src) + (1 - w) * premul(cell))


def monotone_lower(cells, span, start, lifting):
    """Through a phase the lower cloak moves one way only; a cell that moves back keeps the last good cell's."""
    kept = start
    for i in span:
        back = lower_area(cells[i]) > lower_area(kept) if lifting else lower_area(cells[i]) < lower_area(kept)
        if back:
            cells[i] = with_lower(cells[i], kept)
        else:
            kept = cells[i]
    return [round(float(lower_area(cells[i]) - lower_area(rest)), 1) for i in span]


def ease(cell, base, t):
    """`t` of the way from `base` to `cell`, except anything dark in either (her hands, a book's edge), which stays the
    cell's so no hand ghosts; feathered."""
    w = np.full((H, W), t)
    w[ndi.binary_dilation(dark(cell) | dark(base), iterations=3)] = 1
    w = ndi.gaussian_filter(w, 1.5)[:, :, None]
    return straight(w * premul(cell) + (1 - w) * premul(base))


for spec in LOOPS:
    cells, mask = cut[spec['name']], allowed(spec['region'])
    aligned = [align(c, rest, held_weights(spec['region'])) for c in cells]
    print(spec['name'], 'overlap with REST on the held parts, after aligning:', [round(float(o), 3) for _, o in aligned])
    cells[:] = [hold(c, mask) for c, _ in aligned]
    for span, donor_at, kind in spec['holds']:
        donor = cells[donor_at]
        for i in span:
            cells[i] = hold_hand(cells[i], donor, mask) if kind == 'hand' else donor.copy()
    for span, lifting in spec['monotone']:
        start = cells[span[0] - 1]
        print(spec['name'], 'lower cloak through', f'{span[0]}–{span[-1]}', 'px² from rest:', monotone_lower(cells, span, start, lifting))
    base, with_prop = rest, None
    if spec.get('prop'):
        # A prop standing beside her is in the sheet's first cell and not in REST. Her rest cells are REST with the
        # prop, and PROP_FADE cells before them bring it in, so the hand-over from the breath doesn't pop it.
        zone = np.zeros((H, W), bool)
        zone[head_rows:, feet_right + 3:] = True
        pw = ndi.gaussian_filter((zone & (rest[:, :, 3] < 8)).astype(float), 1.0)[:, :, None]
        first = cells[0]
        with_prop = lambda t: straight(pw * t * premul(first) + (1 - pw * t) * premul(rest))
        base = with_prop(1)
    for i in spec['rest']:
        cells[i] = base
    # Two sheets never draw the cloak quite alike, so the moving cells next to a rest cell are eased from the rest
    # drawing into their own over EASE cells, instead of the cloak swapping shape at the join.
    rs = set(spec['rest'])
    moving = [i for i in range(len(cells)) if i not in rs]
    joins = []
    if moving and moving[0] > 0:
        joins += [(moving[0] + k, k) for k in range(spec.get('ease', 0))]
    if moving and moving[-1] < len(cells) - 1:
        joins += [(moving[-1] - k, k) for k in range(spec.get('ease', 0))]
    for i, k in joins:
        cells[i] = ease(cells[i], base, (k + 1) / (spec['ease'] + 1))
    if with_prop:
        cells[:0] = [with_prop(t) for t in PROP_FADE]

rises = [BREATH_RISE * (1 - np.cos(2 * np.pi * i / BREATH_FRAMES)) / 2 for i in range(BREATH_FRAMES)]
lids = lambda cell, keep: cell if keep is None else eyes_shut(cell, keep)
rows = [[breathe(lids(rest, keep), r, FEET_Y, FIGURE_H) for r in rises] for keep in (None, 0.5, 0.2)]
rows += [cut[spec['name']] for spec in LOOPS]
cols = max(len(r) for r in rows)
body = np.zeros((H * len(rows), W * cols, 4), dtype=np.uint8)
for r, cells in enumerate(rows):
    for c, cell in enumerate(cells):
        body[r * H:(r + 1) * H, c * W:(c + 1) * W] = cell
Image.fromarray(body, 'RGBA').save(OUT, quality=90, method=6)
print('wrote', OUT, f'{cols}×{len(rows)} cells of {W}×{H},', os.path.getsize(OUT), 'bytes; rows: breath open/half/shut, ' + ', '.join(s['name'] for s in LOOPS))

if DEBUG:
    os.makedirs(DEBUG, exist_ok=True)
    paper = Image.new('RGBA', (body.shape[1], body.shape[0]), (246, 241, 232, 255))
    paper.alpha_composite(Image.fromarray(body, 'RGBA'))
    paper.save(os.path.join(DEBUG, 'cut-free-body.png'))
    print('debug strip in', DEBUG)

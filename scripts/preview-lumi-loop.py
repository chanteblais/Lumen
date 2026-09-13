"""Preview a companion loop without a browser, and check its held parts.

    python3 scripts/preview-lumi-loop.py [--sheet public/lumi-idle.webp] [--w 160] [--row 0] [--eye-rows 3]
        [--cells 0,1,2,...] [--ms 320] [--blink 4] [--held-from 0] [--out art/preview] [--name loop-0]

Reads a body sheet (public/lumi-idle.webp by default; public/lumi-free.webp is the hands-free Lumi, --w 176) and
renders one loop the way LumiCompanion plays it: the cells in play order at `ms` a frame, each frame fading in
over the last for 80% of the frame time (capped at 260 ms), on the app's paper. `--row` is the loop's row among
loops and `--eye-rows` how many eye rows each loop has (3 on lumi-idle.webp; on lumi-free.webp the breath has 3
and every other loop 1, so pass its sheet row with --eye-rows 1). Writes <out>/<name>.gif (looping, the fade in
four steps a frame) and <out>/<name>-strip.png (the cells in play order). `--blink N` composites one blink
(half · shut · half) starting at frame N, from the sheet's eye rows.

Held parts: every cell is compared on alpha with the loop's first cell over the head (rows above HEAD_ROWS,
columns from --held-from, so a hand raised beside the hood is left out) and the boots, to a quarter pixel. A
held part that moves more than half a pixel is a jump Chanté will see (both of the wave's review rounds were
exactly this), so the check prints FAIL before anyone looks.

Judge from these, not from a capture of the Claude-in-Chrome tab (Chrome freezes CSS animation in that occluded window).
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


SHEET = os.path.join(ROOT, arg('--sheet', os.path.join('public', 'lumi-idle.webp')))
W, H = int(arg('--w', 160)), 208   # a body cell, as in LumiSprite
EYE_ROWS = int(arg('--eye-rows', 3))
PAPER = (246, 241, 232)
SUBSTEPS = 4          # GIF frames per animation frame (the fade drawn in steps)
FEET_Y, HEAD_ROWS = 200, 104
HELD_PX = 0.5

row = int(arg('--row', 0))
ms = int(arg('--ms', 320))
blink_at = int(arg('--blink', -1))
held_from = int(arg('--held-from', 0))
out_dir = arg('--out', os.path.join(ROOT, 'art', 'preview'))
name = arg('--name', f'row-{row}')
moving = set(filter(None, arg('--moving', '').split(',')))
monotone = [m.split(':') for m in filter(None, arg('--monotone', '').split(','))]
os.makedirs(out_dir, exist_ok=True)

sheet = np.array(Image.open(SHEET).convert('RGBA'))
cols = sheet.shape[1] // W
cell = lambda c, eyes=0: sheet[(row + eyes) * H:(row + eyes + 1) * H, c * W:(c + 1) * W]
present = [c for c in range(cols) if cell(c)[:, :, 3].any()]
cells = [int(c) for c in arg('--cells', ','.join(map(str, present))).split(',')]
fade = min(260, round(ms * 0.8))
print(f'row {row}: {len(present)} cells cut, playing {len(cells)} frames at {ms} ms, fade {fade} ms')

# eyes per frame: open, except a blink (half · shut · half) starting at --blink
eyes = [0] * len(cells)
if 0 <= blink_at < len(cells):
    for k, e in enumerate((1, 2, 1)):
        eyes[(blink_at + k) % len(cells)] = e


def offset(ref, a, mask):
    """How far `a` sits from `ref` over `mask`, on alpha: the best whole pixel within 3, then a quarter pixel."""
    err = lambda dx, dy: np.abs(ndi.shift(a, (dy, dx), order=1) - ref)[mask].sum()
    dx, dy = min(((dx, dy) for dx in range(-3, 4) for dy in range(-3, 4)), key=lambda d: err(*d))
    q = np.arange(-0.75, 0.76, 0.25)
    fx, fy = min(((dx + fx, dy + fy) for fx in q for fy in q), key=lambda d: err(*d))
    return -fx, -fy


head = np.zeros((H, W), bool); head[:HEAD_ROWS, held_from:] = True
# the boots from just below the hem: rows closer to the feet alone missed boots taken from each cell's drawing,
# which jittered once no baked shadow hid their edge (2026-09-13)
boots = np.zeros((H, W), bool); boots[FEET_Y - 14:FEET_Y + 2] = True
if '--feet-only' in sys.argv:   # a loop whose head moves by design (the breath)
    head[:] = False
ref = cell(cells[0])[:, :, 3].astype(float) / 255
worst = 0.0
for c in sorted(set(cells)):
    a = cell(c)[:, :, 3].astype(float) / 255
    (hx, hy) = offset(ref, a, head) if head.any() else (0.0, 0.0)
    (bx, by) = offset(ref, a, boots)
    m = max(abs(hx), abs(hy), abs(bx), abs(by))
    worst = max(worst, m)
    if m > 0:
        print(f'  cell {c:2d}: head ({hx:+.2f}, {hy:+.2f}) boots ({bx:+.2f}, {by:+.2f}){"  <- moves" if m > HELD_PX else ""}')
print(f'held parts against cell {cells[0]}: the most any moves is {worst:.2f}px — {"pass" if worst <= HELD_PX else "FAIL"} (≤ {HELD_PX}px)')


def on_paper(rgba):
    im = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), PAPER + (255,))
    im.alpha_composite(Image.fromarray(np.ascontiguousarray(rgba), 'RGBA'))
    return im


# the contact strip: play order, side by side
strip = Image.new('RGB', (W * len(cells), H), PAPER)
for i, c in enumerate(cells):
    strip.paste(on_paper(cell(c, eyes[i])).convert('RGB'), (i * W, 0))
strip_path = os.path.join(out_dir, f'{name}-strip.png')
strip.save(strip_path)

# the GIF: each frame fades in on top of the previous over `fade` ms
frames, durations = [], []
prev = on_paper(cell(cells[-1], eyes[-1]))
for i, c in enumerate(cells):
    cur = on_paper(cell(c, eyes[i]))
    step = ms / SUBSTEPS
    for s in range(SUBSTEPS):
        t = min(1.0, ((s + 1) * step) / fade)      # how far the fade has got by the end of this substep
        t = t * t * (3 - 2 * t)                     # ease-in-out, like the CSS
        frames.append(Image.blend(prev, cur, t).convert('RGB'))
        durations.append(int(round(step)))
    prev = cur
gif_path = os.path.join(out_dir, f'{name}.gif')
frames[0].save(gif_path, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=False)
print('wrote', strip_path, 'and', gif_path, f'({len(frames)} frames, {sum(durations)} ms a loop)')

# Held parts, on alpha, against the first cell of the order.
first = cell(cells[0])
alpha0 = first[:, :, 3] > 127
rows_on = np.where(alpha0.any(axis=1))[0]
top = rows_on.min()
head_rows = top + int((FEET_Y - top) * 0.45)
hx = np.where(alpha0[:head_rows].any(axis=0))[0]
col0 = int((hx.min() + hx.max()) / 2)
boot_top = FEET_Y - 12


def eye_mask(c):
    # The whole face first, then the eyes above the chin: cutting the face at the head rows before filling it
    # opened it under eyes lowered to the ground, and they stopped being holes (the foot play read no eyes).
    dark = (c[:, :, :3].astype(int).sum(axis=2) < 150) & (c[:, :, 3] > 200)
    filled = ndi.binary_fill_holes(dark)
    lab, k = ndi.label(filled)
    if not k: return filled
    face = lab == (1 + int(np.argmax(ndi.sum(filled, lab, range(1, k + 1)))))
    holes = face & ~dark
    holes[top + int((FEET_Y - top) * 0.53):] = False
    hl, hk = ndi.label(holes)
    if not hk: return holes
    sizes = ndi.sum(holes, hl, range(1, hk + 1))
    return np.isin(hl, [j + 1 for j in np.argsort(sizes)[::-1][:2]])


box = lambda y0, y1, x0, x1: (slice(y0, y1), slice(x0, x1))
REGIONS = {
    'hood': box(0, head_rows, 0, W),
    'lantern': box(head_rows, boot_top, col0, W),
    'cloak-left': box(head_rows, boot_top, 0, col0),
    'boot-left': box(boot_top, H, 0, col0),
    'boot-right': box(boot_top, H, col0, W),
}


def measure(c):
    a = c[:, :, 3].astype(float) / 255
    out = {}
    for region, (ys, xs) in REGIONS.items():
        out[region] = a[ys, xs]
    out['eyes'] = eye_mask(c).astype(float)
    return out


def centroid(m):
    s = m.sum()
    if s == 0: return np.array([np.nan, np.nan])
    yy, xx = np.indices(m.shape)
    return np.array([(xx * m).sum() / s, (yy * m).sum() / s])


ref = measure(first)
names = list(REGIONS) + ['eyes']
print(f'\nheld parts against cell {cells[0]}: shift px (IoU); moving: {", ".join(sorted(moving)) or "none"}')
print('frame cell  ' + '  '.join(f'{n:>15}' for n in names) + '   coverage (moving regions, px²)')
worst = {n: (0.0, 1.0) for n in names}
broke = []
coverage = []
for i, c in enumerate(cells):
    m = measure(cell(c))
    parts, cov = [], {}
    for n in names:
        shift = float(np.nan_to_num(np.hypot(*(centroid(m[n]) - centroid(ref[n]))), nan=99))
        iou = np.minimum(m[n], ref[n]).sum() / max(np.maximum(m[n], ref[n]).sum(), 1e-6)
        worst[n] = (max(worst[n][0], shift), min(worst[n][1], iou))
        parts.append(f'{shift:5.2f} ({iou:.3f})')
        if n in moving: cov[n] = round(float(m[n].sum()), 1)
        # The eyes are found by colour, which the WebP keeps lossy: their overlap reads 0.976–0.983 on the approved
        # wave's held eyes (a 0.17px shift at most), so they are judged on position alone.
        elif shift > HELD_PX or (n != 'eyes' and iou < HELD_IOU): broke.append((i, c, n))
    coverage.append(cov)
    print(f'{i:5d} {c:4d}  ' + '  '.join(f'{p:>15}' for p in parts) + '   ' + ' '.join(f'{k} {v}' for k, v in cov.items()))

# A part that moves keeps its size. The foot play's boot grew to 1.25× its rest coverage because the cut drew the
# lifted boot over the rest one instead of moving it — read as motion, sent to review, "a foot growing out of her
# foot". The wave's arm and cloak stay within 0.97–1.12×, the glance's eyes within 0.92–1.15×.
warned = []
for n in sorted(moving & set(names)):
    vals = [cv[n] for cv in coverage]
    lo, hi = min(vals) / max(vals[0], 1e-6), max(vals) / max(vals[0], 1e-6)
    if hi > 1.2 or lo < 0.8:
        warned.append(n)
        print(f'LOOK at {n} at 3×: its coverage runs {lo:.2f}–{hi:.2f}× the first cell\'s. A part that moves keeps its size; '
              'one that grows may be drawn over the rest pose instead of replacing it.')

for span, direction, region in monotone:
    a, b = (int(v) for v in span.split('-'))
    vals = [measure(cell(cells[i]))[region].sum() for i in range(a, b + 1)]
    back = [cells[a + k + 1] for k in range(len(vals) - 1)
            if (vals[k + 1] < vals[k] - 1 if direction == '+' else vals[k + 1] > vals[k] + 1)]
    if back: broke += [(None, c, f'{region} moves back in {span}') for c in back]
    print(f'{region} coverage over frames {span} ({direction}):', [round(float(v), 1) for v in vals])

print('\nworst per region:', ', '.join(f'{n} {s:.2f}px ({u:.3f})' for n, (s, u) in worst.items()))
if broke:
    print('held parts: FAIL —', '; '.join(f'cell {c} {n}' for _, c, n in broke[:12]) + (' …' if len(broke) > 12 else ''))
else:
    print(f'held parts: PASS (every region not moving within {HELD_PX}px and {HELD_IOU})')

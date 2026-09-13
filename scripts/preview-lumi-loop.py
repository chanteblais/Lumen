"""Preview a companion loop without a browser, and check that what should hold does.

    python3 scripts/preview-lumi-loop.py --row 4 [--cells 0,1,2,...] [--ms 160] [--blink 4] [--moving eyes,boot-left]
        [--monotone 2-7:-:cloak-left] [--out art/preview] [--name foot]

Reads public/lumi-idle.webp and renders one loop the way LumiCompanion plays
it: the cells in play order at `ms` a frame, each frame fading in over the
last for 80% of the frame time (capped at 260 ms), on the app's paper. Writes
<out>/<name>.gif (looping, the fade approximated in four steps a frame) and
<out>/<name>-strip.png (the cells in play order, side by side) — look at the
strip for the drawing, the GIF for the motion. `--row` is the body sheet's row
(LumiSprite's row map); `--blink N` composites one blink (half · shut · half)
starting at frame N from the two rows below it, so only for a loop with eye rows.

**Held parts** (the check both of the wave's review rounds wanted). Every cell
in play order against the first, on alpha (lossless in the WebP; colour
thresholds read compression noise as movement), in regions found on the first
cell: `hood` (the head rows), `eyes` (the bright holes in the dark face),
`lantern` (below the head, right of the hood's centre), `cloak-left` (below
the head, left of it — her free side), `boot-left` and `boot-right` (the bottom
rows either side). Each region's shift (alpha centroid) and overlap (IoU) are
printed; regions not named in `--moving` must stay within 0.5px and 0.98, and
the last line says PASS or FAIL with the cells that broke it. `--monotone
a-b:+|-:region` (repeatable, comma-separated) flags a region whose coverage
grows (`+`) or shrinks (`-`) the wrong way inside cells a–b of the order — the
hem that bobbed inside the wave's rise.

Judge from these, not from a capture of the Claude-in-Chrome tab (Chrome
freezes CSS animation in that occluded window).
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, 'public', 'lumi-idle.webp')
W, H = 160, 208       # a body cell, as in LumiSprite
FEET_Y = 200          # the feet baseline inside the cell, as in the cut
PAPER = (246, 241, 232)
SUBSTEPS = 4          # GIF frames per animation frame (the fade drawn in steps)
HELD_PX, HELD_IOU = 0.5, 0.98


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


row = int(arg('--row', 0))
ms = int(arg('--ms', 320))
blink_at = int(arg('--blink', -1))
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
print(f'row {row}: {len(present)} cells cut, playing {cells} at {ms} ms, fade {fade} ms')

# eyes per frame: open, except a blink (half · shut · half) starting at --blink
eyes = [0] * len(cells)
if 0 <= blink_at < len(cells):
    for k, e in enumerate((1, 2, 1)):
        eyes[(blink_at + k) % len(cells)] = e


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

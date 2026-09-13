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
name = arg('--name', f'loop-{row}')
os.makedirs(out_dir, exist_ok=True)

sheet = np.array(Image.open(SHEET).convert('RGBA'))
cols = sheet.shape[1] // W
cell = lambda c, eyes=0: sheet[(row * EYE_ROWS + eyes) * H:(row * EYE_ROWS + eyes + 1) * H, c * W:(c + 1) * W]
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

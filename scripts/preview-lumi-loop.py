"""Preview a companion loop without a browser.

    python3 scripts/preview-lumi-loop.py [--row 0] [--cells 0,1,2,...] [--ms 320] [--blink 4] [--out art/preview]

Reads public/lumi-idle.webp and renders one loop the way LumiCompanion plays
it: the cells in play order at `ms` a frame, each frame fading in over the
last for 80% of the frame time (capped at 260 ms), on the app's paper. Writes
<out>/<name>.gif (looping, the fade approximated in four steps a frame) and
<out>/<name>-strip.png (the cells in play order, side by side) — look at the
strip for the drawing, the GIF for the motion. `--blink N` composites one
blink (half · shut · half) starting at frame N, from the sheet's eye rows.

Judge from these, not from a capture of the Claude-in-Chrome tab (Chrome
freezes CSS animation in that occluded window).
"""
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, 'public', 'lumi-idle.webp')
W, H = 160, 208       # a body cell, as in LumiSprite
EYE_ROWS = 3          # open / half-shut / shut, per loop
PAPER = (246, 241, 232)
SUBSTEPS = 4          # GIF frames per animation frame (the fade drawn in steps)


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


row = int(arg('--row', 0))
ms = int(arg('--ms', 320))
blink_at = int(arg('--blink', -1))
out_dir = arg('--out', os.path.join(ROOT, 'art', 'preview'))
name = arg('--name', f'loop-{row}')
os.makedirs(out_dir, exist_ok=True)

sheet = np.array(Image.open(SHEET).convert('RGBA'))
cols = sheet.shape[1] // W
cell = lambda c, eyes=0: sheet[(row * EYE_ROWS + eyes) * H:(row * EYE_ROWS + eyes + 1) * H, c * W:(c + 1) * W]
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

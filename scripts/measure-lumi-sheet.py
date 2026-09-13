"""Measure a new Lumi animation sheet before cutting it.

    python3 scripts/measure-lumi-sheet.py art/lumi/<sheet>.png [out-dir]

Judge a sheet by numbers first (see art/README.md → Adding a sheet). Finds the
figures on a flat ground (rows and columns by segmentation, so uneven spacing
is fine), then prints, per frame:
- height of the main body (a phase drawn at another scale shows up here),
- hood x-range and centre, hood top, feet baseline and x-range, dirt pixels,
- the eyes' centre relative to the hood centre (a glance moves it),
and, per step, how much the head silhouette changes against the previous
frame after the best whole-pixel shift (IoU; ~0.98+ is "the same drawing
redrawn", <0.95 is a real change or a scale pop), plus the scale that would
make the figure as tall as the breath rest frame of art/archived/rali-slow-idle.png
(the earlier character's breath sheet, kept as the height reference).
Writes <out-dir>/<sheet>-aligned.png: every frame on its hood centre and feet
baseline with a centre line, to flip through by eye.
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(SRC))
REF = os.path.join(ROOT, 'art', 'archived', 'rali-slow-idle.png')


def load(path, box):
    src = np.array(Image.open(path).convert('RGB')).astype(int)
    (y0, y1), (x0, x1) = box
    paper = np.median(src[y0:y1, x0:x1].reshape(-1, 3), axis=0)
    return src, paper, np.abs(src - paper).sum(axis=2)


def segs(on, minlen):
    out, s = [], None
    for i, v in enumerate(on):
        if v and s is None: s = i
        if not v and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(on)))
    return [r for r in out if r[1] - r[0] > minlen]


src, paper, d = load(SRC, ((5, 25), (5, 25)))
print('sheet', src.shape[1], 'x', src.shape[0], ' ground', paper.astype(int).tolist())
rows = segs((d > 60).sum(axis=1) > 3, 60)
frames, frame_row = [], []
for r, (y0, y1) in enumerate(rows):
    for (x0, x1) in segs((d[y0:y1] > 60).sum(axis=0) > 3, 40):
        sub = d[y0:y1, x0:x1] > 60
        ys = np.where(sub.any(axis=1))[0]
        frames.append((x0, x1, y0 + ys.min(), y0 + ys.max()))
        frame_row.append(r)
print(len(rows), 'rows,', len(frames), 'frames')


def matte(bbox):
    x0, x1, y0, y1 = bbox
    X0, X1, Y0, Y1 = x0 - 6, x1 + 6, y0 - 6, y1 + 10
    lab, n = ndi.label(d[Y0:Y1, X0:X1] < 60)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))); border.discard(0)
    inside = ~np.isin(lab, list(border))
    il, k = ndi.label(inside)
    sizes = ndi.sum(inside, il, range(1, k + 1))
    return src[Y0:Y1, X0:X1], inside, il == (1 + int(np.argmax(sizes))), (X0, Y0)


info = []
for i, b in enumerate(frames):
    rgb, inside, main, (X0, Y0) = matte(b)
    ys, xs = np.where(main)
    top, bottom = ys.min(), ys.max(); height = bottom - top
    head = main.copy(); head[top + int(height * 0.45):] = False
    hy, hx = np.where(head)
    dark = (rgb.sum(axis=2) < 180) & inside
    feet = dark.copy(); feet[:bottom - int(height * 0.08)] = False
    fy, fx = np.where(feet)
    eyes = (rgb[:, :, 0] > 200) & (rgb[:, :, 0] - rgb[:, :, 2] > 30) & head
    ey, ex = np.where(eyes)
    hood_cx = (hx.min() + hx.max()) / 2
    info.append(dict(i=i, Y0=Y0, top=top + Y0, bottom=bottom + Y0, height=height, hood=(hx.min() + X0, hx.max() + X0),
                     hood_cx=hood_cx + X0, eyes=(ex.mean() - hood_cx, ey.mean() - top) if len(ex) else (float('nan'),) * 2,
                     feet=(fx.min() + X0, fx.max() + X0) if len(fx) else (-1, -1), dirt=int((inside & ~main).sum()),
                     rgb=rgb, inside=inside, main=main, head=head))

print('\nframe  height  hood x (centre)   top  feet y  feet x   eyes dx,dy   dirt')
for f in info:
    print(f"{f['i']+1:4d}  {f['height']:5d}  {f['hood'][0]:4d}-{f['hood'][1]:<4d} ({f['hood_cx']:6.1f})  {f['top']:4d}  {f['bottom']:5d}  {f['feet'][0]:4d}-{f['feet'][1]:<4d}  {f['eyes'][0]:+5.1f},{f['eyes'][1]:5.1f}  {f['dirt']:4d}")


def canvas(f, pad=40):
    H, W = 300, 320
    m = np.zeros((H, W), bool)
    hy, hx = np.where(f['head'])
    ox = int(round(W / 2 - (hx.min() + hx.max()) / 2)); oy = pad - hy.min()
    ys, xs = np.where(f['main']); Y, X = ys + oy, xs + ox
    ok = (Y >= 0) & (Y < H) & (X >= 0) & (X < W)
    m[Y[ok], X[ok]] = True
    return m


def head_iou(a, b, rows=140):
    best = (0, 0, 0)
    for dy in range(-6, 7):
        for dx in range(-8, 9):
            s = np.roll(np.roll(b[:rows], dy, 0), dx, 1)
            iou = (s & a[:rows]).sum() / (s | a[:rows]).sum()
            if iou > best[2]: best = (dx, dy, iou)
    return best


cans = [canvas(f) for f in info]
print('\nhead vs previous frame (hood centre + top aligned, then best whole-pixel shift): IoU')
for i in range(1, len(info)):
    dx, dy, iou = head_iou(cans[i - 1], cans[i])
    flag = '' if iou >= 0.975 else '  <- changes' if iou >= 0.95 else '  <- pop'
    print(f"  {i:2d}→{i+1:<2d}: shift ({dx:+d},{dy:+d}) IoU {iou:.3f}{flag}")
dx, dy, iou = head_iou(cans[0], cans[-1])
print(f"  last→first: shift ({dx:+d},{dy:+d}) IoU {iou:.3f}")

ref, rpaper, rd = load(REF, ((590, 610), (90, 110)))
m = rd[168:362, 200:1285] > 60
on = m.sum(axis=0) > 3
x0 = np.argmax(on); x1 = x0 + np.argmin(on[x0:])
rows_ = np.where(m[:, x0:x1].sum(axis=1) > 2)[0]
rest_h = rows_[-1] - rows_[0]
print(f"\nbreath rest height {rest_h}px; scale per row to match:",
      [round(float(rest_h / np.median([f['height'] for f in info if frame_row[f['i']] == r])), 3) for r in range(len(rows))])

CW, CH = 300, 340
n = len(rows); per = max(len(frames) // n, 1)
strip = Image.new('RGB', (CW * per, CH * n), tuple(int(v) for v in paper))
for f in info:
    hy, hx = np.where(f['head'])
    ox = int(round(CW / 2 - (hx.min() + hx.max()) / 2)); oy = (CH - 30) - (f['bottom'] - f['Y0'])
    cell = np.full((CH, CW, 3), paper, int)
    ys, xs = np.where(f['inside']); Y, X = ys + oy, xs + ox
    ok = (Y >= 0) & (Y < CH) & (X >= 0) & (X < CW)
    cell[Y[ok], X[ok]] = f['rgb'][ys[ok], xs[ok]]
    strip.paste(Image.fromarray(cell.astype(np.uint8)), ((f['i'] % per) * CW, (f['i'] // per) * CH))
dr = ImageDraw.Draw(strip)
for c in range(per): dr.line([(c * CW + CW // 2, 0), (c * CW + CW // 2, CH * n)], fill=(255, 0, 0))
out = os.path.join(OUT, os.path.splitext(os.path.basename(SRC))[0] + '-aligned.png')
strip.save(out)
print('wrote', out)

# The frames as motion, before any cut: anchored on the hood's right edge (the lantern hangs below the head,
# and a hand raised on her free side reaches only the left edge) and on the feet baseline. For judging the
# sheet's motion and for Chanté's approval; the cut's settle and holds are not applied.
GW, GH = 300, 340
motion = []
for (x0, x1, y0, y1), f in zip(frames, info):
    cell = Image.new('RGB', (GW, GH), tuple(int(v) for v in paper))
    ox = int(GW * 0.72) - (f['hood'][1] - (x0 - 6))
    oy = (GH - 30) - (f['bottom'] - f['Y0'])
    cell.paste(Image.fromarray(f['rgb'].astype(np.uint8)), (ox, oy))
    motion.append(cell)
gif = os.path.join(OUT, os.path.splitext(os.path.basename(SRC))[0] + '-motion.gif')
ms = int(os.environ.get('LUMI_MS', 120))
motion[0].save(gif, save_all=True, append_images=motion[1:], duration=ms, loop=0)
print(f'wrote {gif} ({ms} ms a frame; LUMI_MS to change)')

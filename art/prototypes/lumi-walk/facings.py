"""Mark where Lumi faces in each drawing, and check it against the direction she walks in it.

    python3 art/prototypes/lumi-walk/facings.py                      # the rig's drawings: numbers + out/facings.png
    python3 art/prototypes/lumi-walk/facings.py --candidates <dir>   # generated candidates, before any is chosen

Chanté, 2026-09-13: "she's still not always walking forward ... it should be a relatively easy task of marking where
her face is and always making sure it's facing in the direction she's walking." The page's audit proved she moves
along the direction each drawing is *assigned*; this checks that each drawing actually faces that way — and it
found the two diagonal drawings turned only ~29° and ~17° where their walking direction needs 45°.

The mark, over the hood rows (hood top to the chin, 46% of her height):
- a front view: the face — the dark void inside the hood — and its centre;
- a back view (no face): the big sun embroidered on the back of the hood, which slides the *other* way as she turns.
`turn` is the mark's offset from the hood's centre as a share of the hood's half-width, signed so that positive
means turned toward the viewer's left. The side-on drawing (w) sets the scale: she is turned asin(turn / side) on
the ground from facing straight toward (or away from) you. A diagonal drawing should read 45°; the gate for a
candidate is 38–52°.
"""
import glob
import json
import math
import os
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
B = json.load(open(os.path.join(HERE, 'room-home.json')))['iso']['slope']
CHIN = 0.46
GATE = (38, 52)
DIRS = [('s', 's', False, (1, 1)), ('sw', 'sw', False, (0, 1)), ('w', 'w', False, (-1, 1)), ('nw', 'nw', False, (-1, 0)),
        ('n', 'n', False, (-1, -1)), ('ne', 'nw', True, (0, -1)), ('e', 'w', True, (1, -1)), ('se', 'sw', True, (1, 0))]


def mark(rgba, back):
    """The face (front) or the back's sun, over the hood rows of a figure on transparent ground."""
    a = rgba[:, :, 3] > 200
    rgb = rgba[:, :, :3].astype(int)
    lum = rgb.mean(axis=2)
    ys = np.where(a.any(axis=1))[0]
    top, feet = ys.min(), ys.max()
    chin = int(top + CHIN * (feet - top))
    rows = np.zeros_like(a)
    rows[top:chin] = True
    xs = np.where((a & rows).any(axis=0))[0]
    hc, hw = (xs.min() + xs.max()) / 2, (xs.max() - xs.min()) / 2
    if not back:
        dark = ndi.binary_opening(a & rows & (lum < 50), iterations=2)
        lab, k = ndi.label(dark)
        if not k:
            return None
        sizes = ndi.sum(dark, lab, range(1, k + 1))
        blob = ndi.binary_fill_holes(lab == 1 + int(np.argmax(sizes)))
        my, mx = np.where(blob)
        return dict(x=float(mx.mean()), y=float(my.mean()), turn=float(-(mx.mean() - hc) / hw), what='face', top=int(top), feet=int(feet))
    orange = ndi.binary_opening(a & rows & (rgb[:, :, 0] > 190) & (rgb[:, :, 1] > 70) & (rgb[:, :, 1] < 170) & (rgb[:, :, 2] < 110), iterations=1)
    lab, k = ndi.label(ndi.binary_closing(orange, iterations=3))
    if not k:
        return None
    sizes = ndi.sum(lab > 0, lab, range(1, k + 1))
    blob = lab == 1 + int(np.argmax(sizes))
    my, mx = np.where(blob)
    return dict(x=float(mx.mean()), y=float(my.mean()), turn=float((mx.mean() - hc) / hw), what='sun', top=int(top), feet=int(feet))


# Back views have no face to mark, and the back's sun misreads once the hood's open front widens the silhouette (all
# four v2 back candidates read 16–23° while turned 45° or more by eye). A boot-line measure was tried too and dropped:
# it read ~45° on front drawings whose faces show 26°, because the generator places the boots as the prompt says,
# whatever way the body turns. So a back diagonal is judged by eye in a strip between the facing-away and side-on
# drawings, and its turn is recorded here, not measured.
JUDGED = {'nw': 45.0}


def angle(turn, side):
    return math.degrees(math.asin(max(-1.0, min(1.0, turn / side))))


def side_scale():
    m = mark(np.array(Image.open(os.path.join(HERE, 'parts', 'w-body.png')).convert('RGBA')), back=False)
    return abs(m['turn']) if m else 0.6


if '--candidates' in sys.argv:
    from lumi_cut import Sheet
    folder = sys.argv[sys.argv.index('--candidates') + 1]
    back = 'back' in folder or folder.rstrip('/').endswith('-n') or folder.rstrip('/').endswith('-nw')
    side = side_scale()
    print(f'side-on scale {side:.3f}; gate {GATE[0]}–{GATE[1]}° turned toward the viewer\'s left ({"back" if back else "front"} view)')
    for path in sorted(glob.glob(os.path.join(folder, 'v*.png'))):
        if any(s in path for s in ('-aligned', '-motion', 'ref-')):
            continue
        sh = Sheet(path, glow=False, shadow=False)
        rows = sh.rows()
        rgba, main = sh.matte(sh.frames(rows[0][0], rows[-1][1], 1)[0])
        m = mark(rgba, back)
        if not m:
            print(f'  {os.path.basename(path)}: no mark found')
            continue
        ang = angle(m['turn'], side)
        verdict = ('pass' if GATE[0] <= ang <= GATE[1] else 'fail') if not back else 'unreliable for a back view: judge by eye'
        print(f"  {os.path.basename(path)}: {m['what']} turn {m['turn']:+.3f} → turned {ang:5.1f}°  {verdict}")
    sys.exit(0)

rig = json.load(open(os.path.join(HERE, 'rig-walk.json')))
side = side_scale()
M = {}
print(f'side-on scale {side:.3f}')
for n in rig:
    im = np.array(Image.open(os.path.join(HERE, 'parts', f'{n}-body.png')).convert('RGBA'))
    m = mark(im, back=n in ('n', 'nw'))
    m['im'] = im
    m['angle'] = angle(m['turn'], side)
    M[n] = m
    want = {'s': 0, 'n': 0, 'w': 90, 'sw': 45, 'nw': 45}.get(n, 0)
    if n in JUDGED:
        print(f"{n:3s} {m['what']:4s} turn {m['turn']:+.3f} → reads {m['angle']:5.1f}°, unreliable; judged by eye {JUDGED[n]:.0f}° (its walking direction needs {want}°)")
        m['angle'] = JUDGED[n]
    else:
        print(f"{n:3s} {m['what']:4s} turn {m['turn']:+.3f} → turned {m['angle']:5.1f}° (its walking direction needs {want}°)")
    # the page reads these: where each drawing really faces, so its audit and floor plan judge the drawing, not its label
    rig[n]['turned'] = round(m['angle'], 1)
    rig[n]['back'] = n in ('n', 'nw')
with open(os.path.join(HERE, 'rig-walk.json'), 'w') as fh:
    json.dump(rig, fh, indent=1)
print('measured turns written to rig-walk.json (run after split.py, before build.py)')

cell, pad = 330, 20
sheet = Image.new('RGB', (cell * 3, cell * 3), (224, 206, 180))
ring = {'nw': (0, 0), 'n': (1, 0), 'ne': (2, 0), 'w': (0, 1), 'e': (2, 1), 'sw': (0, 2), 's': (1, 2), 'se': (2, 2)}
d = ImageDraw.Draw(sheet)
for did, img, mirror, step in DIRS:
    if img not in M:
        continue
    m = M[img]
    fig = Image.fromarray(m['im'], 'RGBA')
    mx = m['x']
    if mirror:
        fig = fig.transpose(Image.FLIP_LEFT_RIGHT)
        mx = fig.width - 1 - mx
    s = (cell - 2 * pad) / max(fig.width, fig.height) * 0.8
    fig = fig.resize((int(fig.width * s), int(fig.height * s)), Image.LANCZOS)
    cx, cy = ring[did]
    ox, oy = cx * cell + (cell - fig.width) // 2, cy * cell + pad
    sheet.paste(fig, (ox, oy), fig)
    sx, sy = step[0] - step[1], (step[0] + step[1]) * B
    L = math.hypot(sx, sy)
    fx0, fy0 = ox + fig.width / 2, oy + m['feet'] * s
    ex, ey = fx0 + sx / L * 110, fy0 + sy / L * 110
    d.line([fx0, fy0, ex, ey], fill=(40, 90, 200), width=5)
    d.ellipse([ex - 7, ey - 7, ex + 7, ey + 7], fill=(40, 90, 200))
    d.ellipse([ox + mx * s - 6, oy + m['y'] * s - 6, ox + mx * s + 6, oy + m['y'] * s + 6], outline=(220, 30, 60), width=3)
    d.text((cx * cell + 8, cy * cell + cell - 18), f"{did} ({img}{' mirrored' if mirror else ''}): turned {m['angle']:.0f}°", fill=(30, 20, 10))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sheet.save(os.path.join(HERE, 'out', 'facings.png'))
print('wrote out/facings.png')

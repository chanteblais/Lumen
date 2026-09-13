"""Mark where Lumi faces in each drawing, and check it against the direction she walks or turns through in it.

    python3 art/prototypes/lumi-walk/facings.py                                  # the rig's drawings: numbers + out/facings.png
    python3 art/prototypes/lumi-walk/facings.py --candidates <dir> [--target 45] # generated candidates, before any is chosen

Chanté, 2026-09-13: "she's still not always walking forward ... it should be a relatively easy task of marking where
her face is and always making sure it's facing in the direction she's walking." The page's audit proved she moved
along the direction each drawing was *assigned*; this checks each drawing actually faces that way — and it found
the two diagonals turned ~29° and well short of 45°. Since "Turning could still be smoother" the ring is dense: ten
drawn facings (s, ssw, sw, wsw, w facing you round to side-on; wbw, wnw, nw, nnw, n on round to facing away) and
eight mirrored, eighteen in all. They are **not evenly spaced**: nine sit 22.5° apart, and `wbw` sits at 101.25°,
between side-on and the first view from behind, where the bow and the medallions leave. The page reads each
drawing's angle from `DEG` here, interpolates her facing in degrees and morphs between the two nearest.

The mark, over the hood rows (hood top to the chin, 46% of her height), for a view with a face: the face — the
dark void inside the hood — and its centre. `turn` is its offset from the hood's centre as a share of the hood's
half-width, positive toward the viewer's left; the side-on drawing (w) sets the scale, so she is turned
asin(turn / side) on the ground from facing you. A candidate passes within 7.5° of its target.

Views from behind have no face. The back's sun misreads once the hood's open front widens the silhouette (the v2
back diagonals read 16–23° while turned 45° or more by eye), and the line between the boots was tried and dropped (it
read ~45° on front drawings whose faces show 26°: the generator places boots as told, whatever the body does). So a
view from behind is judged by eye in a strip between the two drawings it sits between, and its turn is recorded in
JUDGED, not measured.
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
B = json.load(open(os.path.join(ROOT, 'art', 'scenery', 'home', 'layers.json')))['iso']['slope']
CHIN = 0.46
GATE = 7.5
# The drawn facings and the angle each one is turned on the ground, facing you (0°) round to facing away (180°).
# Not even steps any more: `wbw` sits at 101.25°, an eighth of a turn-step past side-on, because that is where the
# ribbon bow and the medallions leave (Chanté, 2026-09-13: "Do the extra drawing").
ORDER = ['s', 'ssw', 'sw', 'wsw', 'w', 'wbw', 'wnw', 'nw', 'nnw', 'n']
DEG = {'s': 0.0, 'ssw': 22.5, 'sw': 45.0, 'wsw': 67.5, 'w': 90.0, 'wbw': 101.25, 'wnw': 112.5, 'nw': 135.0,
       'nnw': 157.5, 'n': 180.0}
BACK = {'wbw', 'wnw', 'nw', 'nnw', 'n'}
# what each drawing should measure: its turn from facing you for a view with a face, from facing away for one without
WANT = {n: (DEG[n] if n not in BACK else 180 - DEG[n]) for n in ORDER}
JUDGED = {'nw': 45.0, 'wbw': 78.75, 'wnw': 67.5, 'nnw': 22.5}
# the page's ring: every drawing at its angle, plus a mirror of each one that is neither facing you nor facing away
MIRROR = {'ssw': 'sse', 'sw': 'se', 'wsw': 'ese', 'w': 'e', 'wbw': 'ebe', 'wnw': 'ene', 'nw': 'ne', 'nnw': 'nne'}
RING = sorted([(DEG[n], n, n, False) for n in ORDER]
              + [(360 - DEG[n], MIRROR[n], n, True) for n in ORDER if 0 < DEG[n] < 180])


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def mark(rgba):
    """The face over the hood rows of a figure on transparent ground, or None."""
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
    dark = ndi.binary_opening(a & rows & (lum < 50), iterations=2)
    lab, k = ndi.label(dark)
    if not k:
        return dict(x=hc, y=(top + chin) / 2, turn=0.0, what='none', top=int(top), feet=int(feet))
    sizes = ndi.sum(dark, lab, range(1, k + 1))
    blob = ndi.binary_fill_holes(lab == 1 + int(np.argmax(sizes)))
    my, mx = np.where(blob)
    return dict(x=float(mx.mean()), y=float(my.mean()), turn=float(-(mx.mean() - hc) / hw), what='face', top=int(top), feet=int(feet))


def angle(turn, side):
    return math.degrees(math.asin(max(-1.0, min(1.0, turn / side))))


def side_scale():
    return abs(mark(np.array(Image.open(os.path.join(HERE, 'parts', 'w-body.png')).convert('RGBA')))['turn']) or 0.6


if '--candidates' in sys.argv:
    from lumi_cut import Sheet
    folder = arg('--candidates', '').rstrip('/')
    target = float(arg('--target', 45))
    back = os.path.basename(folder) in ('lumi-iso-back', 'lumi-iso-n', 'lumi-iso-wbw', 'lumi-iso-wnw', 'lumi-iso-nnw')
    side = side_scale()
    if back:
        print(f'{os.path.basename(folder)}: a view from behind has no face to measure — judge by eye in a strip between its two neighbours')
        sys.exit(0)
    print(f'side-on scale {side:.3f}; target {target:.1f}° ± {GATE}° turned toward the viewer\'s left')
    for path in sorted(glob.glob(os.path.join(folder, 'v*.png'))):
        if any(s in path for s in ('-aligned', '-motion', 'ref-')):
            continue
        sh = Sheet(path, glow=False, shadow=False)
        rows = sh.rows()
        rgba, main = sh.matte(sh.frames(rows[0][0], rows[-1][1], 1)[0])
        m = mark(rgba)
        ang = angle(m['turn'], side)
        print(f"  {os.path.basename(path)}: {m['what']} turn {m['turn']:+.3f} → turned {ang:5.1f}°  {'pass' if abs(ang - target) <= GATE else 'fail'}")
    sys.exit(0)

rig = json.load(open(os.path.join(HERE, 'rig-walk.json')))
side = side_scale()
M = {}
print(f'side-on scale {side:.3f}')
for n in ORDER:
    if n not in rig:
        print(f'{n:3s} not drawn yet — the page borrows its nearest drawn neighbour')
        continue
    im = np.array(Image.open(os.path.join(HERE, 'parts', f'{n}-body.png')).convert('RGBA'))
    m = mark(im)
    m['im'] = im
    if n in BACK and n != 'n':
        m['angle'] = JUDGED[n]
        print(f"{n:3s} from behind: judged by eye {JUDGED[n]:.1f}° (needs {WANT[n]:.1f}°)")
    elif n == 'n':
        m['angle'] = 0.0
        print(f"n   from behind, straight away: 0° (needs 0°)")
    else:
        m['angle'] = angle(m['turn'], side)
        print(f"{n:3s} {m['what']} turn {m['turn']:+.3f} → turned {m['angle']:5.1f}° (needs {WANT[n]:.1f}°)")
    # the page reads these: the angle the drawing sits at on the ring (it builds the ring from them, and mirrors each
    # one strictly between facing you and facing away), and where the drawing really faces, so the audit and the floor
    # plan judge the drawing and not its label
    rig[n]['deg'] = DEG[n]
    rig[n]['turned'] = round(m['angle'], 1)
    rig[n]['back'] = n in BACK
    M[n] = m
with open(os.path.join(HERE, 'rig-walk.json'), 'w') as fh:
    json.dump(rig, fh, indent=1)
print('turns written to rig-walk.json (run after split.py, before build.py)')

size, cell = 1500, 250
sheet = Image.new('RGB', (size, size), (224, 206, 180))
d = ImageDraw.Draw(sheet)
cx0 = cy0 = size / 2
for deg, name, img, mirror in RING:
    if img not in M:
        continue
    m = M[img]
    fig = Image.fromarray(m['im'], 'RGBA')
    mx = m['x']
    if mirror:
        fig = fig.transpose(Image.FLIP_LEFT_RIGHT)
        mx = fig.width - 1 - mx
    s = cell * 0.78 / fig.height
    fig = fig.resize((int(fig.width * s), int(fig.height * s)), Image.LANCZOS)
    phi = math.radians(deg)
    du, dv = (math.cos(phi) - math.sin(phi)) / math.sqrt(2), (math.cos(phi) + math.sin(phi)) / math.sqrt(2)
    sx, sy = du - dv, (du + dv) * B
    L = math.hypot(sx, sy)
    ox, oy = int(cx0 + sx / L * 560 - fig.width / 2), int(cy0 + sy / L * 560 - fig.height / 2)
    sheet.paste(fig, (ox, oy), fig)
    fx0, fy0 = ox + fig.width / 2, oy + m['feet'] * s
    d.line([fx0, fy0, fx0 + sx / L * 70, fy0 + sy / L * 70], fill=(40, 90, 200), width=4)
    d.ellipse([ox + mx * s - 5, oy + m['y'] * s - 5, ox + mx * s + 5, oy + m['y'] * s + 5], outline=(220, 30, 60), width=3)
    d.text((ox, oy + fig.height + 2), f"{name} ({img}{' mirrored' if mirror else ''}) {deg:.4g}° · drawn {m['angle']:.0f}°", fill=(30, 20, 10))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sheet.save(os.path.join(HERE, 'out', 'facings.png'))
print('wrote out/facings.png')

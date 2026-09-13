"""Inline the room file, the plate, the layers, the painting and the stand-in Lumi into index.src.html -> index.html,
with the test points and depth cases computed by depth.py.

    python3 art/prototypes/home-layers/build.py

Run plate.py and cut_lumi.py first. The test points ring every layer (behind, in front, left, right, each pushed out
until it is on the walkable floor) and add a row close behind the low table; the depth cases are every test point
against every layer, answered by depth.py, for the page's ?test=1 to check the JS against.
"""
import base64
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
SCENE = os.path.join(ROOT, 'art', 'scenery', 'home')
sys.path.insert(0, HERE)
import depth  # noqa: E402


def uri(path, mime='image/png'):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


room = json.load(open(os.path.join(SCENE, 'layers.json')))
floor, minus = room['walkable']['floor'], [m['poly'] for m in room['walkable']['minus']]
walk = lambda x, y: depth.walkable(x, y, floor, minus)


def push(x, y, dx, dy, limit=90):
    """From (x, y), step along (dx, dy) until the point is walkable."""
    for t in range(0, limit, 2):
        px, py = round(x + dx * t), round(y + dy * t)
        if walk(px, py):
            return px, py
    return None


points = []
for L in room['layers']:
    g = L['extent'] or L['footprint']
    xs, ys = [p[0] for p in g], [p[1] for p in g]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    for label, (sx, sy, dx, dy) in {
        'behind': (cx, min(ys), 0, -1), 'in front': (cx, max(ys), 0, 1),
        'left': (min(xs), cy, -1, 0), 'right': (max(xs), cy, 1, 0),
    }.items():
        p = push(sx, sy, dx, dy)
        if p:
            points.append({'label': f'{L["id"]} · {label}', 'x': p[0], 'y': p[1]})
table = next(L for L in room['layers'] if L['id'] == 'table')
for x in (670, 720, 760, 800, 850, 900, 940):
    top = depth.column_interval(table['extent'], x)
    p = push(x, top[0], 0, -1) if top else None
    if p:
        points.append({'label': f'close behind the table · x {x}', 'x': p[0], 'y': p[1]})
for label, x, y in (('behind the tall balustrade post', 474, 784), ('behind the rail, right of the post', 560, 836),
                     ('behind the first balustrade post', 300, 700), ('between the cushions, in front of the table', 800, 800),
                     ('right of the desk, by the chair back', 494, 470)):
    p = push(x, y, 0, -1, 40)
    if p:
        points.append({'label': label, 'x': p[0], 'y': p[1]})

# a layer whose pixels reach past its ground polygon's columns breaks the rule (it could overlap her with no ground in her columns)
from PIL import Image  # noqa: E402
for L in room['layers']:
    a = Image.open(os.path.join(SCENE, L['src'])).getchannel('A')
    box = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    g = L['extent'] or L['footprint']
    gx0, gx1 = min(p[0] for p in g), max(p[0] for p in g)
    ix0, ix1 = L['offset'][0] + box[0], L['offset'][0] + box[2]
    if ix0 < gx0 - 3 or ix1 > gx1 + 3:
        print(f'  note: {L["id"]} pixels span x {ix0}-{ix1}, its ground only {gx0}-{gx1}')

cases = [{'layer': L['id'], 'x': p['x'], 'y': p['y'], 'want': depth.draws_over(L['extent'] or L['footprint'], p['x'], p['y'])}
         for p in points for L in room['layers']]
walk_cases = [{'x': x, 'y': y, 'want': walk(x, y)} for x in range(100, 1500, 37) for y in range(250, 1024, 41)]
sweeps_path = os.path.join(HERE, 'out', 'sweeps.json')        # sweep.py's frames, for capture.py --set <piece>
sweeps = json.load(open(sweeps_path)) if os.path.exists(sweeps_path) else {}
cases += [{'layer': L['id'], 'x': p['x'], 'y': p['y'], 'want': depth.draws_over(L['extent'] or L['footprint'], p['x'], p['y'])}
          for pts in sweeps.values() for p in pts for L in room['layers']]
tests = {'points': points, 'cases': cases, 'walk': walk_cases, 'sweeps': sweeps}
json.dump(tests, open(os.path.join(HERE, 'out', 'tests.json'), 'w'), indent=1)

lumi = json.load(open(os.path.join(HERE, 'out', 'lumi-still.json')))
images = {
    'plate': uri(os.path.join(SCENE, room['plate'])),
    'painting': uri(os.path.join(SCENE, room['painting'])),
    'lumi': uri(os.path.join(HERE, 'out', 'lumi-still.png')),
    'layers': {L['id']: uri(os.path.join(SCENE, L['src'])) for L in room['layers']},
    'shadows': {L['id']: uri(os.path.join(SCENE, L['shadow']['src'])) for L in room['layers'] if L['shadow']},
}
html = open(os.path.join(HERE, 'index.src.html')).read()
html = (html.replace('/*ROOM*/null', json.dumps(room, separators=(',', ':')))
            .replace('/*IMAGES*/null', json.dumps(images))
            .replace('/*LUMI*/null', json.dumps(lumi))
            .replace('/*TESTS*/null', json.dumps(tests, separators=(',', ':'))))
for token in ('/*ROOM*/', '/*IMAGES*/', '/*LUMI*/', '/*TESTS*/'):
    assert token not in html, token
out = os.path.join(HERE, 'index.html')
open(out, 'w').write(html)
print('index.html', os.path.getsize(out), 'bytes;', len(points), 'test points,', len(cases), 'depth cases')

"""Inline Home's layers, the pieces, rig-walk.json, morph.json and tour-home.json into index.src.html -> index.html.

    python3 art/prototypes/lumi-walk/build.py

Run split.py, facings.py, morph.py and elevation.py first. index.html is the file that is published (and the one
capture.py renders).

The room is `art/scenery/home/`: `layers.json` (the walkable floor, each layer's footprint, extent and anchors, the
depth rule's constants), `plate.png` (the empty room), `layers/<id>.png` and `layers/<id>-shadow.png`. The tour
(`tour-home.json`) names anchors from layers.json where it can; each stop is resolved here and checked against the
walkable floor with home-layers/depth.py, the reference the page's JS copies. For the page's ?occlusion=1 count, each
layer's floor-coloured pixels are listed by home-layers/fringe.py's classifier (the one the plate's trim uses, so a
zero there is a check on the composite, not independent evidence about the matte).
"""
import base64
import io
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
SCENE = os.path.join(ROOT, 'art', 'scenery', 'home')
LAYERS_DIR = os.path.join(ROOT, 'art', 'prototypes', 'home-layers')
sys.path.insert(0, LAYERS_DIR)
import depth  # noqa: E402


def uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def plate_uri(path):
    """The plate as lossless WebP when that is smaller than its PNG (the same pixels either way)."""
    png = open(path, 'rb').read()
    buf = io.BytesIO()
    Image.open(path).save(buf, 'WEBP', lossless=True, quality=100, method=6)
    if buf.tell() < len(png):
        return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    return 'data:image/png;base64,' + base64.b64encode(png).decode()


rig = json.load(open(os.path.join(HERE, 'rig-walk.json')))
morph_path = os.path.join(HERE, 'morph.json')
morph = json.load(open(morph_path)) if os.path.exists(morph_path) else {}   # no morph.json: the page falls back to Swap
parts = {f'{f}-{l}': uri(os.path.join(HERE, 'parts', f'{f}-{l}.png'), 'image/png')
         for f in rig if f != 'variants' for l in ('body', 'foot-0', 'foot-1')}   # every facing split.py wrote
# the holding and pick-up drawings (split.py's `variants`): the same three pieces plus the hand drawn over the lantern
parts.update({f'{f}-{l}': uri(os.path.join(HERE, 'parts', f'{f}-{l}.png'), 'image/png')
              for f in rig.get('variants', {}) for l in ('body', 'foot-0', 'foot-1', 'hand')})

# ---- the room: Home's layers ---------------------------------------------------------------------------------------
layers = json.load(open(os.path.join(SCENE, 'layers.json')))
floor, minus = layers['walkable']['floor'], [m['poly'] for m in layers['walkable']['minus']]
anchor_of = {n: a for L in layers['layers'] for n, a in L['anchors'].items()}
anchors = {n: a['at'] for n, a in anchor_of.items()}

# ---- the tour: anchors where they fit, every stop on the walkable floor -------------------------------------------
# A lantern stop (`lantern`: from and to, two of the lantern's surface anchors) is the lantern moment: she walks to the
# `from` anchor's stand, picks it up, carries it to `to` and sets it down. Its stands sit inside her clearance band behind
# the table, so they are not checked against the walkable floor; the page derives each exact stand from the pick-up
# drawing's grip and enters it along its facing.
tour_src = json.load(open(os.path.join(HERE, 'tour-home.json')))
tour = []
lantern = next((o for o in layers.get('objects', []) if o['id'] == 'lantern'), None)
for i, t in enumerate(tour_src['tour']):
    if 'lantern' in t:
        assert lantern, f'tour stop {i} is a lantern moment but layers.json has no lantern object'
        for end in ('from', 'to'):
            a = anchor_of.get(t['lantern'][end])
            assert a and 'stand' in a and a.get('facing') == 'se', f'tour stop {i}: {t["lantern"][end]} needs a stand facing se'
            assert t['lantern'][end].split('.')[0] == lantern['surface'], f'tour stop {i}: {t["lantern"][end]} is not on the {lantern["surface"]}'
        tour.append({'lantern': {'from': t['lantern']['from'], 'to': t['lantern']['to']}, 'rest': t['rest'],
                     'at': anchor_of[t['lantern']['from']]['stand'], 'name': t.get('name', 'the lantern')})
        continue
    at = anchors[t['anchor']] if 'anchor' in t else t['at']
    assert depth.walkable(at[0], at[1], floor, minus), f'tour stop {i} {t} at {at} is not on the walkable floor'
    tour.append({'at': at, 'rest': t['rest'], 'name': t.get('anchor') or t.get('name', '')})

# ---- floor-coloured layer pixels (fringe.py), for ?occlusion=1 ------------------------------------------------------
import fringe  # noqa: E402
_, orig, solid, fol, anyitem, alpha = fringe.load_room()
floorlike = {}
for L in layers['layers']:
    fl = fringe.floor_like(orig, alpha[L['id']], solid[L['id']], fol[L['id']], anyitem)[0]
    ys, xs = fl.nonzero()
    floorlike[L['id']] = [[int(x), int(y)] for x, y in zip(xs, ys)]

room = {k: layers[k] for k in ('size', 'iso', 'lumi', 'depth', 'layers', 'blockers', 'walkable')}
room['objects'] = layers.get('objects', [])
room['occluders'] = (layers.get('occluders') or {}).get('items', [])   # the things on the table, for the lantern's depth
room['tour'] = tour
room['floorlike'] = floorlike
scene = {
    'layers': {L['id']: uri(os.path.join(SCENE, L['src']), 'image/png') for L in layers['layers']},
    'shadows': {L['id']: uri(os.path.join(SCENE, L['shadow']['src']), 'image/png') for L in layers['layers'] if L['shadow']},
}
if lantern:
    # the lantern piece, its additive glow, its contact shadow and the mask both are drawn through
    scene['lantern'] = {'src': uri(os.path.join(SCENE, lantern['src']), 'image/png'),
                        'glow': uri(os.path.join(SCENE, lantern['glow']['src']), 'image/png'),
                        'shadow': uri(os.path.join(SCENE, lantern['shadow']['src']), 'image/png'),
                        'through': uri(os.path.join(SCENE, lantern['glow']['through']['src']), 'image/png')}
scene['occluders'] = {o['id']: uri(os.path.join(SCENE, o['src']), 'image/png') for o in room['occluders']}

html = open(os.path.join(HERE, 'index.src.html')).read()
html = (html.replace('/*RIG*/null', json.dumps(rig, separators=(',', ':')))
            .replace('/*MORPH*/null', json.dumps(morph, separators=(',', ':')))
            .replace('/*ROOM*/null', json.dumps(room, separators=(',', ':')))
            .replace('/*SCENE*/null', json.dumps(scene))
            .replace('/*PARTS*/null', json.dumps(parts))
            .replace('__PLATE_URI__', plate_uri(os.path.join(SCENE, layers['plate']))))
for token in ('/*RIG*/', '/*MORPH*/', '/*ROOM*/', '/*SCENE*/', '/*PARTS*/', '__PLATE_URI__'):
    assert token not in html, token
out = os.path.join(HERE, 'index.html')
open(out, 'w').write(html)
print('index.html', os.path.getsize(out), 'bytes;', len(tour), 'tour stops;',
      'floor-coloured layer px', {k: len(v) for k, v in floorlike.items() if v})

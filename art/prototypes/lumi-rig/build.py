"""Inline the rig (parts/, rig-sw.json), the drawn poses it is compared with, and Home's layers into index.src.html ->
index.html.

    python3 art/prototypes/lumi-rig/build.py

Run parts.py first. Reads, never writes: art/scenery/home/ (layers.json, plate, layers, the lantern), lumi-walk/parts/
(the boots, and the drawn variants front-reach, front-grip and sw-lantern for the side-by-side), lumi-walk/rig-walk.json
(the variants' measures), home-layers/depth.py (the depth rule at her stand).

The stand is table.lantern's, refined the way the walk page refines it: the grip key's hand, at rest and facing se, closes
on the finial of the lantern standing at the anchor (it lands within 1 px of layers.json's proposal).
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
WALK = os.path.join(ROOT, 'art', 'prototypes', 'lumi-walk')
sys.path.insert(0, os.path.join(ROOT, 'art', 'prototypes', 'home-layers'))
import depth  # noqa: E402


def uri(path):
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


rig = json.load(open(os.path.join(HERE, 'rig-sw.json')))
walk = json.load(open(os.path.join(WALK, 'rig-walk.json')))
layers = json.load(open(os.path.join(SCENE, 'layers.json')))
lantern = next(o for o in layers['objects'] if o['id'] == 'lantern')
table = next(L for L in layers['layers'] if L['id'] == lantern['surface'])
anchor = table['anchors'][lantern['at']]

# the refined stand (lumi-walk index.src.html lanternPlaces): at - (base - grip) * scale - the grip key's grip from her feet
g = walk['variants']['front-grip']
q = layers['lumi']['height'] / g['height']
root = (g['contact'][0][0] + g['contact'][1][0]) / 2
dx, dy = -(g['grip'][0] - root) * q, (g['grip'][1] - g['feet']) * q      # mirrored: sw drawn at se
k = lantern['scale']
bg = ((lantern['base'][0] - lantern['grip'][0]) * k, (lantern['base'][1] - lantern['grip'][1]) * k)
stand = [anchor['at'][0] - bg[0] - dx, anchor['at'][1] - bg[1] - dy]
print('stand', [round(v, 2) for v in stand], 'proposal', anchor['stand'])

# the depth order at the stand: layers drawn before her, then her, then those the rule puts over her (in the room's order)
fx, fy = stand
over = [L['id'] for L in layers['layers'] if depth.draws_over(L.get('extent') or L['footprint'], fx, fy)]
order = layers['depth']['order']
stage = dict(stand=stand, anchor=anchor['at'], before=[i for i in order if i not in over], after=[i for i in order if i in over],
             surface=lantern['surface'], surfaceHeight=table['height'])
assert lantern['surface'] in stage['after'], 'the table should draw over her at the stand'
print('before her', stage['before'], 'over her', stage['after'])

parts = {n: uri(os.path.join(HERE, p['src'])) for n, p in rig['parts'].items()}
parts.update({f'hand-{s}': uri(os.path.join(HERE, h['src'])) for s, h in rig['hands'].items()})
parts.update({f'sleeve-{k}': uri(os.path.join(HERE, s['src'])) for k, s in rig.get('sleeves', {}).items()})
parts.update({f: uri(os.path.join(WALK, 'parts', f'sw-{f}.png')) for f in ('foot-0', 'foot-1')})
parts['sw-body'] = uri(os.path.join(WALK, 'parts', 'sw-body.png'))      # the walk rig's drawing at rest: the baseline
VARIANTS = ('front-reach', 'front-grip', 'sw-lantern')
for v in VARIANTS:
    for l in ('body', 'foot-0', 'foot-1', 'hand'):
        parts[f'{v}-{l}'] = uri(os.path.join(WALK, 'parts', f'{v}-{l}.png'))
drawn = {v: walk['variants'][v] for v in VARIANTS}
drawn['sw'] = {k_: walk['sw'][k_] for k_ in ('size', 'top', 'feet', 'height', 'contact', 'legs')}

room = {k_: layers[k_] for k_ in ('size', 'iso', 'lumi')}
room['layers'] = [{k_: L.get(k_) for k_ in ('id', 'src', 'offset', 'shadow', 'extent', 'footprint', 'height')} for L in layers['layers']]
room['lantern'] = lantern
scene = {
    'plate': 'data:image/png;base64,' + base64.b64encode(open(os.path.join(SCENE, layers['plate']), 'rb').read()).decode(),
    'layers': {L['id']: uri(os.path.join(SCENE, L['src'])) for L in layers['layers']},
    'shadows': {L['id']: uri(os.path.join(SCENE, L['shadow']['src'])) for L in layers['layers'] if L.get('shadow')},
    'lantern': uri(os.path.join(SCENE, lantern['src'])),
    'lantern:glow': uri(os.path.join(SCENE, lantern['glow']['src'])),
    'lantern:shadow': uri(os.path.join(SCENE, lantern['shadow']['src'])),
    'lantern:through': uri(os.path.join(SCENE, lantern['glow']['through']['src'])),
}

html = open(os.path.join(HERE, 'index.src.html')).read()
for token, value in (('/*RIG*/null', rig), ('/*DRAWN*/null', drawn), ('/*ROOM*/null', room), ('/*STAGE*/null', stage),
                     ('/*PARTS*/null', parts), ('/*SCENE*/null', scene)):
    assert token in html, token
    html = html.replace(token, json.dumps(value, separators=(',', ':')))
out = os.path.join(HERE, 'index.html')
open(out, 'w').write(html)
print('index.html', os.path.getsize(out), 'bytes')

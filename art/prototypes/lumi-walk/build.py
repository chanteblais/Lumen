"""Inline the room, the pieces, rig-walk.json and room-home.json into index.src.html -> index.html.

    python3 art/prototypes/lumi-walk/build.py

Run split.py first. index.html is the file that is published (and the one capture.py renders).
"""
import base64
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))


def uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


rig = json.load(open(os.path.join(HERE, 'rig-walk.json')))
room = json.load(open(os.path.join(HERE, 'room-home.json')))
parts = {f'{f}-{l}': uri(os.path.join(HERE, 'parts', f'{f}-{l}.png'), 'image/png')
         for f in ('front', 'back') for l in ('body', 'foot-0', 'foot-1')}
html = open(os.path.join(HERE, 'index.src.html')).read()
html = (html.replace('/*RIG*/null', json.dumps(rig, separators=(',', ':')))
            .replace('/*ROOM*/null', json.dumps(room, separators=(',', ':')))
            .replace('/*PARTS*/null', json.dumps(parts))
            .replace('__ROOM_URI__', uri(os.path.join(ROOT, 'public', 'home-room.webp'), 'image/webp')))
for token in ('/*RIG*/', '/*ROOM*/', '/*PARTS*/', '__ROOM_URI__'):
    assert token not in html, token
out = os.path.join(HERE, 'index.html')
open(out, 'w').write(html)
print('index.html', os.path.getsize(out), 'bytes')

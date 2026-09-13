"""Inline body.png, sprite.png and rig.json into index.src.html -> index.html; the script alone -> check.js."""
import base64
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
uri = lambda name: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(HERE, name), 'rb').read()).decode()
rig = json.load(open(os.path.join(HERE, 'rig.json')))
html = open(os.path.join(HERE, 'index.src.html')).read()
html = html.replace('/*RIG*/null', json.dumps(rig, separators=(',', ':')))
html = html.replace('__BODY_URI__', uri('body.png')).replace('__SPRITE_URI__', uri('sprite.png'))
assert '__BODY_URI__' not in html and '/*RIG*/' not in html
open(os.path.join(HERE, 'index.html'), 'w').write(html)
script = re.search(r'<script>(.*)</script>', html, re.S).group(1)
open(os.path.join(HERE, 'check.js'), 'w').write(script)
print('index.html', os.path.getsize(os.path.join(HERE, 'index.html')), 'bytes')

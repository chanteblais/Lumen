"""Inpaint one cluster of layers out of Home's painting with OpenAI's image edit API (a mask whose transparent pixels
are the hole), and keep only the hole's neighbourhood of each result.

    python3 art/prototypes/home-layers/inpaint.py <cluster A|B|C|D|E> [--n 2] [--quality high] [--tag v1] [--dry-run]

The hole is the union of the cluster's `mask` polygons (or, for a layer with `shadow: false`, its bodies grown by
10px) from room.src.json. An object's cluster (E, the lantern) has a `hole` instead: a patch of a surface layer's top
round the object, less the other things on it (`hole_for`); lantern.py uses its candidate, not plate.py's floor pass. The API regenerates the whole image; each candidate is cropped to the hole's bounds plus
48px and saved as out/inpaint/<cluster>-<tag>-<k>.png, with its offset, tokens and estimated cost appended to
out/inpaint/log.jsonl. plate.py picks the candidates named in room.src.json → `plate_candidates`.
The call is the same as scripts/gen-lumi-sheet.py's (multipart, the SSL context fix); MAX_IMAGES caps one run.
"""
import base64
import io
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
MODEL = 'gpt-image-2.5-sunburst'
MAX_IMAGES = 3
RATES = dict(text_in=5.0, image_in=8.0, image_out=30.0)   # $ per million tokens, as gen-lumi-sheet.py
MARGIN = 48

PROMPTS = {
    'rug': ("An isometric painted cutaway of a cosy lamplit cabin room. Inside the transparent (masked) area, remove the low "
            "wooden table with everything on it and the two floor cushions in front of it. Paint only what was underneath: "
            "the same dark green rug with its small cream and rust flowers and vines scattered evenly all over, exactly like "
            "the rug around the mask. The rug's field has no central medallion, no frame, no border and no new motif inside "
            "it: only the same small all-over flowers at the same size and spacing, lit by the same warm evening light, a "
            "little brighter near where the lantern was. Nothing stands there: no "
            "furniture, no objects, no cast shadows of the removed things. Same painterly style and texture. Everything "
            "outside the masked area stays exactly as it is."),
    'corner': ("An isometric painted cutaway of a cosy lamplit cabin room. Inside the transparent (masked) area, remove the "
               "green armchair with its star pillow and two cream throws, and the small round wooden stool with the books "
               "and little plant on it. Paint only what was behind and under them: the pale wooden floor planks continuing "
               "in the same direction, the base of the cream plaster wall with its wooden skirting board, and the wooden "
               "bookcase and wall post continuing straight down to the floor. Nothing stands there: no furniture, no "
               "objects, no cast shadows of the removed things. Same warm light, same painterly style. Everything outside "
               "the masked area stays exactly as it is."),
    'window': ("An isometric painted cutaway of a cosy lamplit cabin room. Inside the transparent (masked) area, remove the "
               "wooden writing desk with its drawer cabinet, brass lamp, books, open book, mug and potted plant, and the "
               "wooden chair with its cream throw. Paint only what was behind and under them: the cream plaster wall under "
               "the window continuing down to a wooden skirting board along the floor, the wooden window sill, the dark "
               "timber wall post, and the pale wooden floor planks with the warm window-light patches continuing. Nothing "
               "stands there: no furniture, no objects, no cast shadows of the removed things. Same painterly style. "
               "Everything outside the masked area stays exactly as it is."),
    'stairwell': ("An isometric painted cutaway of a cosy lamplit cabin room. Inside the transparent (masked) area, remove the "
                  "wooden balustrade: its square posts, handrails and spindles, and the ivy hanging from it. Paint only what "
                  "was behind them: the pale wooden floor planks in warm sunlight continuing to the floor's edge, and the "
                  "wooden stair treads going down beyond the edge, in the same light and painterly style. No railing, no "
                  "posts, no plants. Everything outside the masked area stays exactly as it is."),
    'tabletop': ("An isometric painted cutaway of a cosy cabin room. Inside the transparent (masked) area on top of the low "
                 "wooden table, remove the small brass oil lantern and all of the warm light it casts. Paint only the bare "
                 "tabletop that was under and around it: the same warm-brown wooden planks running in the same direction, "
                 "with their joints lining up with the planks around the mask, lit only by the room's soft, even evening "
                 "light, as dim as the tabletop at the table's far corners. No bright pool of light, no glow, no flame "
                 "reflections, no highlights. Nothing stands there: no lantern, no candle, no objects, no cast shadows. "
                 "Same painterly style and texture. Everything outside the masked area stays exactly as it is."),
}


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def api_key():
    if os.environ.get('OPENAI_API_KEY'):
        return os.environ['OPENAI_API_KEY']
    for line in open(os.path.join(ROOT, '.env.local')):
        if line.startswith('OPENAI_API_KEY='):
            return line.split('=', 1)[1].strip().strip('"\'')
    sys.exit('OPENAI_API_KEY is not set')


def poly_mask(polys, size):
    im = Image.new('L', size, 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        d.polygon([tuple(v) for v in p], fill=255)
    return np.array(im) > 0


def tabletop(room, on):
    """A surface layer's top: its extent raised by its height, in painting px."""
    L = next(l for l in room['layers'] if l['id'] == on)
    return [[x, y - L['height']] for x, y in L['extent']]


def ground_disc(size, centre, r, slope):
    """Painting px within ground radius r of centre (a ground circle: r across the page, r * slope down it)."""
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    return np.hypot(xx - centre[0], (yy - centre[1]) / slope) <= r


def hole_for(room, cluster):
    size = tuple(room['size'])
    spec = room['clusters'][cluster]
    if 'hole' in spec:                      # an object's cluster: a patch of a surface layer, not floor
        h = spec['hole']
        L = next(l for l in room['layers'] if l['id'] == h['on'])
        obj = next(o for o in room['objects'] if o['id'] == spec['object'])
        if 'around' in h:                   # tight round the object: its body grown, less the other things grown 1px
            things = ndi.binary_dilation(poly_mask([L['things'][k] for k in h['keep']], size), iterations=1)
            return ndi.binary_dilation(poly_mask(obj['body'], size), iterations=h['grow']) & ~things
        top = ndi.binary_erosion(poly_mask([tabletop(room, h['on'])], size), iterations=h['inset'])
        things = ndi.binary_dilation(poly_mask([L['things'][k] for k in h['keep']], size), iterations=2)
        body = ndi.binary_dilation(poly_mask(obj['body'], size), iterations=2)
        return (top & ground_disc(size, h['centre'], h['groundRadius'], room['iso']['slope']) & ~things) | body
    hole = np.zeros(size[::-1], bool)
    for L in room['layers']:
        if L['id'] not in room['clusters'][cluster]['layers']:
            continue
        bodies = poly_mask(L['body'] + L['foliage'], size)
        if L['shadow']:
            hole |= poly_mask([L['mask']], size) | ndi.binary_dilation(bodies, iterations=10)
        else:
            hole |= ndi.binary_dilation(bodies, iterations=10)
    return hole


def png_bytes(im):
    buf = io.BytesIO()
    im.save(buf, 'PNG')
    return buf.getvalue()


def multipart(fields, files):
    b = uuid.uuid4().hex
    parts = [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items()]
    for name, filename, data in files:
        head = f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: image/png\r\n\r\n'
        parts.append(head.encode() + data + b'\r\n')
    parts.append(f'--{b}--\r\n'.encode())
    return b''.join(parts), f'multipart/form-data; boundary={b}'


if __name__ == '__main__':
    cluster = sys.argv[1]
    n = int(arg('--n', 2))
    quality = arg('--quality', 'high')
    tag = arg('--tag', 'v1')
    if n > MAX_IMAGES:
        sys.exit(f'--n {n} is over the cap of {MAX_IMAGES}')
    room = json.load(open(os.path.join(HERE, 'room.src.json')))
    painting = Image.open(os.path.join(ROOT, room['painting'])).convert('RGBA')
    hole = hole_for(room, cluster)
    ys, xs = np.where(hole)
    box = tuple(int(v) for v in (max(0, xs.min() - MARGIN), max(0, ys.min() - MARGIN), min(hole.shape[1], xs.max() + MARGIN + 1), min(hole.shape[0], ys.max() + MARGIN + 1)))
    mask = np.array(painting).copy()
    mask[:, :, 3] = np.where(hole, 0, 255)
    out_dir = os.path.join(HERE, 'out', 'inpaint')
    os.makedirs(out_dir, exist_ok=True)
    Image.fromarray(mask).crop(box).save(os.path.join(out_dir, f'{cluster}-hole.png'))
    prompt = PROMPTS[room['clusters'][cluster]['prompt']]
    print(f'cluster {cluster}: hole {int(hole.sum())} px, box {box}, {MODEL} {quality} x{n}')
    if '--dry-run' in sys.argv:
        print(prompt)
        sys.exit(0)

    fields = dict(model=MODEL, prompt=prompt, size=f'{room["size"][0]}x{room["size"][1]}', quality=quality, n=str(n), background='opaque')
    if '--fidelity' in sys.argv:
        fields['input_fidelity'] = 'high'
    body, ctype = multipart(fields, [('image[]', 'painting.png', png_bytes(painting)), ('mask', 'mask.png', png_bytes(Image.fromarray(mask)))])
    req = urllib.request.Request('https://api.openai.com/v1/images/edits', body, {'Authorization': f'Bearer {api_key()}', 'Content-Type': ctype})
    tls = ssl.create_default_context()
    if os.path.exists('/etc/ssl/cert.pem'):
        tls.load_verify_locations('/etc/ssl/cert.pem')
    started = datetime.now()
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=240, context=tls))
    except urllib.error.HTTPError as e:
        sys.exit(f'{e.code}: {e.read().decode()[:800]}')
    secs = (datetime.now() - started).seconds
    usage = resp.get('usage') or {}
    details = usage.get('input_tokens_details') or {}
    tout = usage.get('output_tokens', 0)
    cost = (details.get('text_tokens', 0) * RATES['text_in'] + details.get('image_tokens', 0) * RATES['image_in'] + tout * RATES['image_out']) / 1e6
    print(f'{len(resp["data"])} image(s) in {secs}s; tokens {usage}; ~${cost:.2f}')
    stamp = started.strftime('%H%M%S')
    for k, item in enumerate(resp['data']):
        im = Image.open(io.BytesIO(base64.b64decode(item['b64_json']))).convert('RGB')
        if im.size != tuple(room['size']):
            print('  resized from', im.size)
            im = im.resize(tuple(room['size']), Image.LANCZOS)
        name = f'{cluster}-{tag}-{stamp}-{k + 1}.png'
        im.crop(box).save(os.path.join(out_dir, name))
        # how far the API moved the untouched area: mean abs difference outside the hole, within the crop
        orig = np.array(painting.convert('RGB')).astype(int)
        got = np.array(im).astype(int)
        ring = ~hole
        ring[:box[1]] = False; ring[box[3]:] = False; ring[:, :box[0]] = False; ring[:, box[2]:] = False
        drift = float(np.abs(got - orig)[ring].mean())
        print(f'  out/inpaint/{name}: outside-hole drift {drift:.1f}')
        with open(os.path.join(out_dir, 'log.jsonl'), 'a') as fh:
            fh.write(json.dumps(dict(when=started.isoformat(timespec='seconds'), cluster=cluster, tag=tag, file=name, box=box,
                                     quality=quality, secs=secs, usage=usage, cost=round(cost / len(resp['data']), 4),
                                     drift=round(drift, 2), prompt=prompt)) + '\n')

"""Paint what a holding drawing's drawn lantern hides, with OpenAI's masked image edit, for split.py's cut.

    python3 art/prototypes/lumi-walk/fill.py <variant> [--n 2] [--quality high] [--dry-run]
    python3 art/prototypes/lumi-walk/fill.py <variant> --choose <candidate png>    # copy it to art/lumi/<drawing>-fill.png

<variant> is one of split.py's VARIANTS with a drawn lantern (sw-lantern, ssw-lantern, s-lantern, front-grip). The mask
is the drawn lantern and its ring as split.py finds them (hands.py's lantern region, and thin brass within 45 px of the
holding fist that comes within 60 px of it), grown 14 px, less the fist grown 3 px, on the drawing's own canvas. The
words and settings come from art/prompts/lumi-iso-lantern-fill.md (the first fenced block under `## Prompt`, the
`- model:`, `- size:`, `- quality:`, `- version:` lines); each candidate lands in art/candidates/lumi-iso-lantern-fill/
(gitignored) with the mask as sent, a 3× look at the masked region beside the original (`-look.png`), its drift outside
the mask, and hands.py's verdict against the empty-handed drawing, and gets a row in the prompt file's Runs table.
split.py fills only what its cut opens from the chosen fill (`fill` in its VARIANTS). `.env.local`'s OPENAI_API_KEY.
"""
import base64
import io
import json
import os
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
sys.path.insert(0, HERE)
from lumi_cut import Sheet  # noqa: E402
import hands  # noqa: E402

PROMPT_FILE = os.path.join(ROOT, 'art', 'prompts', 'lumi-iso-lantern-fill.md')
OUT = os.path.join(ROOT, 'art', 'candidates', 'lumi-iso-lantern-fill')
MAX_IMAGES = 4
RATES = dict(text_in=5.0, image_in=8.0, image_out=30.0)   # $ per million tokens, gpt-image-2.5 at launch (an estimate)
SRC = {'sw-lantern': ('art/lumi/lumi-iso-front-lantern.png', 'art/lumi/lumi-iso-front.png'),
       'ssw-lantern': ('art/lumi/lumi-iso-ssw-lantern.png', 'art/lumi/lumi-iso-ssw.png'),
       's-lantern': ('art/lumi/lumi-iso-s-lantern.png', 'art/lumi/lumi-iso-s.png'),
       'front-grip': ('art/lumi/lumi-iso-front-grip.png', 'art/lumi/lumi-iso-front.png')}


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def api_key():
    if os.environ.get('OPENAI_API_KEY'):
        return os.environ['OPENAI_API_KEY']
    for line in open(os.path.join(ROOT, '.env.local')):
        if line.startswith('OPENAI_API_KEY='):
            return line.split('=', 1)[1].strip().strip('"\'')
    sys.exit('OPENAI_API_KEY is not set')


def mask_for(src):
    """The editable area on the drawing's canvas: the drawn lantern and its ring grown 14 px, less the fist grown 3 px."""
    sheet = Sheet(os.path.join(ROOT, src), glow=False, shadow=False)
    rows = sheet.rows()
    bbox = sheet.frames(rows[0][0], rows[-1][1], 1)[0]
    rgba, _ = sheet.matte(bbox)
    ox, oy = max(0, bbox[0] - 8), max(0, bbox[2] - 8)
    res = hands.count(rgba)
    a = rgba[:, :, 3] > 0
    rgb = rgba[:, :, :3].astype(int)
    lum = rgb.mean(axis=2)
    hand = min(res['blobs'], key=lambda d: d['x'])['mask']   # her right hand, the viewer's left, in all of them
    fistish = ndi.binary_opening(a & (rgb[:, :, 0] < 100) & (lum < 60), iterations=3)
    hand = ndi.binary_propagation(hand, mask=(fistish | hand) & ndi.binary_dilation(hand, iterations=30))
    fist = ndi.binary_fill_holes(hand)
    lan = res['lantern']
    r_, g_, b_ = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    brass = a & (b_ < 0.45 * r_) & (g_ < 0.78 * r_) & (r_ > 90) & (lum > 45)
    thin = brass & ~ndi.binary_opening(brass, iterations=5)
    ring = thin & ndi.binary_dilation(fist, iterations=45) & ~fist & ndi.binary_dilation(lan, iterations=60)
    edit = ndi.binary_dilation(lan | ring, iterations=14) & ~ndi.binary_dilation(fist, iterations=3)
    img = Image.open(os.path.join(ROOT, src)).convert('RGBA')
    full = np.zeros((img.height, img.width), bool)
    h, w = edit.shape
    full[oy:oy + h, ox:ox + w] = edit[:img.height - oy, :img.width - ox]
    return img, full


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
    variant = sys.argv[1]
    src, ref = SRC[variant]
    if '--choose' in sys.argv:
        dst = os.path.join(ROOT, src.replace('.png', '-fill.png'))
        Image.open(arg('--choose')).convert('RGB').save(dst)
        print('wrote', os.path.relpath(dst, ROOT))
        sys.exit(0)
    doc = open(PROMPT_FILE).read()
    setting = lambda k, d: (re.search(rf'^- {k}: *(.+)$', doc, re.M) or [None, d])[1].strip()
    prompt = re.search(r'## Prompt[^\n]*\n+```[a-z]*\n(.*?)\n```', doc, re.S).group(1)
    model, size, version = setting('model', 'gpt-image-2.5-sunburst'), setting('size', '1024x1536'), setting('version', 'v1')
    quality, n = arg('--quality', setting('quality', 'high')), int(arg('--n', setting('n', 2)))
    if n > MAX_IMAGES:
        sys.exit(f'--n {n} is over the cap of {MAX_IMAGES}')
    img, edit = mask_for(src)
    os.makedirs(OUT, exist_ok=True)
    mask = np.array(img).copy()
    mask[:, :, 3] = np.where(edit, 0, 255)
    Image.fromarray(mask).save(os.path.join(OUT, f'{variant}-mask.png'))
    ys, xs = np.where(edit)
    box = (max(0, xs.min() - 30), max(0, ys.min() - 30), min(img.width, xs.max() + 30), min(img.height, ys.max() + 30))
    print(f'{variant}: mask {int(edit.sum())} px, box {box}, {model} {quality} x{n}')
    if '--dry-run' in sys.argv:
        sys.exit(0)
    # (no input_fidelity: gpt-image-2.5-sunburst refuses it, invalid_input_fidelity_model, 2026-09-13)
    fields = dict(model=model, prompt=prompt, size=size, quality=quality, n=str(n), background='opaque')
    body, ctype = multipart(fields, [('image[]', 'drawing.png', png_bytes(img.convert('RGB'))), ('mask', 'mask.png', png_bytes(Image.fromarray(mask)))])
    req = urllib.request.Request('https://api.openai.com/v1/images/edits', body, {'Authorization': f'Bearer {api_key()}', 'Content-Type': ctype})
    tls = ssl.create_default_context()
    if os.path.exists('/etc/ssl/cert.pem'):
        tls.load_verify_locations('/etc/ssl/cert.pem')
    started = datetime.now()
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=420, context=tls))
    except urllib.error.HTTPError as e:
        sys.exit(f'{e.code}: {e.read().decode()[:800]}')
    usage = resp.get('usage') or {}
    det = usage.get('input_tokens_details') or {}
    tin, tout = usage.get('input_tokens', 0), usage.get('output_tokens', 0)
    cost = (det.get('text_tokens', 0) * RATES['text_in'] + det.get('image_tokens', 0) * RATES['image_in'] + tout * RATES['image_out']) / 1e6
    print(f'{len(resp["data"])} image(s) in {(datetime.now() - started).seconds}s; ~${cost:.2f}')
    orig = np.array(img.convert('RGB')).astype(int)
    stamp = started.strftime('%m%d-%H%M%S')
    rows = []
    for k, item in enumerate(resp['data']):
        im = Image.open(io.BytesIO(base64.b64decode(item['b64_json']))).convert('RGB')
        if im.size != img.size:
            im = im.resize(img.size, Image.LANCZOS)
        name = f'{variant}-{version}-{stamp}-{k + 1}.png'
        path = os.path.join(OUT, name)
        im.save(path)
        got = np.array(im).astype(int)
        drift = float(np.abs(got - orig)[~ndi.binary_dilation(edit, iterations=4)].mean())
        look = Image.new('RGB', ((box[2] - box[0]) * 6, (box[3] - box[1]) * 3))
        look.paste(img.convert('RGB').crop(box).resize(((box[2] - box[0]) * 3, (box[3] - box[1]) * 3), Image.NEAREST), (0, 0))
        look.paste(im.crop(box).resize(((box[2] - box[0]) * 3, (box[3] - box[1]) * 3), Image.NEAREST), ((box[2] - box[0]) * 3, 0))
        look.save(path.replace('.png', '-look.png'))
        verdict = subprocess.run([sys.executable, os.path.join(HERE, 'hands.py'), '--image', path, '--ref', os.path.join(ROOT, ref)],
                                 capture_output=True, text=True).stdout.strip().splitlines()
        hv = verdict[-1] if verdict else 'hands.py printed nothing'
        print(f'  {name}: drift outside {drift:.2f}; hands: {hv}')
        rows.append(f"| {started.strftime('%Y-%m-%d %H:%M')} | {version} | {variant} | `{name}` | {int(edit.sum())} | {drift:.2f} | "
                    f"{tin} / {tout} (run) | ${cost / len(resp['data']):.2f} | hands: {hv} |")
    with open(PROMPT_FILE, 'a') as fh:
        fh.write('\n'.join(rows) + '\n')

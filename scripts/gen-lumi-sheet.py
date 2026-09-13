"""Generate a Lumi sheet from its prompt file, straight from OpenAI's image API, and measure it.

    python3 scripts/gen-lumi-sheet.py art/prompts/<sheet>.md [--model M] [--quality Q] [--size WxH] [--n 2] [--dry-run]

The prompt file is the record (docs/animation-pipeline.md → Prompt lab). The script reads from it:
- the first fenced block under a `## Prompt` heading — the words sent, verbatim;
- `- version:`, `- model:`, `- size:`, `- quality:`, `- n:`, `- grid: <rows>x<cols>` lines;
- `- reference: <path> [crop=x0,y0,x1,y1] [scale=k]` lines — each becomes an attached image, in order.
Flags override the file's settings for one run.

Each candidate lands in art/candidates/<sheet>/ (gitignored) with the references as sent, is measured by
scripts/measure-lumi-sheet.py (its output in <candidate>-measure.txt, its aligned strip beside it), and gets
a row appended to the prompt file's `## Runs` table: when, version, settings, frames found against the grid,
tokens and an estimated cost. Bump `version:` whenever the prompt's words change, so every row points at the
exact words that made it. Fill the row's verdict by hand after reading the gates.

MAX_IMAGES caps one run, so a typo in --n cannot spend.
"""
import base64
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
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEASURE = os.path.join(ROOT, 'scripts', 'measure-lumi-sheet.py')
MAX_IMAGES = 4
# $ per million tokens for gpt-image-2.5 as reported at its launch (2026-09-08); an estimate, the tokens are the record
RATES = dict(text_in=5.0, image_in=8.0, image_out=30.0)


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def api_key():
    if os.environ.get('OPENAI_API_KEY'):
        return os.environ['OPENAI_API_KEY']
    path = os.path.join(ROOT, '.env.local')
    if os.path.exists(path):
        for line in open(path):
            if line.startswith('OPENAI_API_KEY='):
                return line.split('=', 1)[1].strip().strip('"\'')
    sys.exit('OPENAI_API_KEY is not set (environment or .env.local)')


def reference(path, opts, k, out_dir):
    im = Image.open(os.path.join(ROOT, path)).convert('RGB')
    c = re.search(r'crop=(\d+),(\d+),(\d+),(\d+)', opts)
    if c:
        im = im.crop(tuple(int(v) for v in c.groups()))
    s = re.search(r'scale=([\d.]+)', opts)
    if s:
        f = float(s.group(1))
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    out = os.path.join(out_dir, f'ref-{k + 1}.png')
    im.save(out)
    return out


def multipart(fields, files):
    b = uuid.uuid4().hex
    parts = [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items()]
    for name, path in files:
        head = f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{os.path.basename(path)}"\r\nContent-Type: image/png\r\n\r\n'
        parts.append(head.encode() + open(path, 'rb').read() + b'\r\n')
    parts.append(f'--{b}--\r\n'.encode())
    return b''.join(parts), f'multipart/form-data; boundary={b}'


prompt_file = sys.argv[1]
text = open(prompt_file).read()
sheet = os.path.splitext(os.path.basename(prompt_file))[0]
settings = dict(re.findall(r'^- (version|model|size|quality|n|grid):\s*(.+?)\s*$', text, re.M))
refs = re.findall(r'^- reference:\s*(\S+)(.*)$', text, re.M)
found = re.search(r'^## Prompt[^\n]*\n.*?```[a-z]*\n(.*?)\n```', text, re.S | re.M)
if not found:
    sys.exit('no fenced prompt under a "## Prompt" heading')
prompt = found.group(1)

version = settings.get('version', 'v?')
model = arg('--model', settings.get('model', 'gpt-image-2.5-sunburst'))
size = arg('--size', settings.get('size', '1776x896'))
quality = arg('--quality', settings.get('quality', 'high'))
n = int(arg('--n', settings.get('n', 1)))
rows, cols = (int(v) for v in settings.get('grid', '0x0').split('x'))
if n > MAX_IMAGES:
    sys.exit(f'--n {n} is over the cap of {MAX_IMAGES} a run')

out_dir = os.path.join(ROOT, 'art', 'candidates', sheet)
os.makedirs(out_dir, exist_ok=True)
ref_paths = [reference(p, o, k, out_dir) for k, (p, o) in enumerate(refs)]
print(f'{sheet} {version}: {model} {size} {quality} ×{n}, {len(ref_paths)} reference(s), grid {rows}×{cols}')
if '--dry-run' in sys.argv:
    print(prompt)
    print('references written to', out_dir)
    sys.exit(0)

fields = dict(model=model, prompt=prompt, size=size, quality=quality, n=str(n), background='opaque')
if ref_paths:
    body, ctype = multipart(fields, [('image[]', p) for p in ref_paths])
    url = 'https://api.openai.com/v1/images/edits'
else:
    body, ctype = json.dumps({**fields, 'n': n}).encode(), 'application/json'
    url = 'https://api.openai.com/v1/images/generations'
req = urllib.request.Request(url, body, {'Authorization': f'Bearer {api_key()}', 'Content-Type': ctype})
tls = ssl.create_default_context()
if os.path.exists('/etc/ssl/cert.pem'):  # python.org's macOS build ships without CA certificates
    tls.load_verify_locations('/etc/ssl/cert.pem')
started = datetime.now()
try:
    resp = json.load(urllib.request.urlopen(req, timeout=900, context=tls))
except urllib.error.HTTPError as e:
    sys.exit(f'{e.code}: {e.read().decode()[:600]}')
secs = (datetime.now() - started).seconds

usage = resp.get('usage') or {}
details = usage.get('input_tokens_details') or {}
tin, tout = usage.get('input_tokens', 0), usage.get('output_tokens', 0)
cost = (details.get('text_tokens', 0) * RATES['text_in'] + details.get('image_tokens', 0) * RATES['image_in'] + tout * RATES['image_out']) / 1e6
print(f'{len(resp["data"])} image(s) in {secs}s; tokens in {tin}, out {tout}; ~${cost:.2f} at gpt-image-2.5 rates')

if '## Runs' not in text:
    with open(prompt_file, 'a') as fh:
        fh.write('\n## Runs\n\nAppended by `scripts/gen-lumi-sheet.py`; the verdict column is filled by hand from the gates.\n\n'
                 '| When | Version | Model · quality · size | Candidate | Frames / grid | Tokens in / out | ~Cost | Verdict |\n'
                 '|---|---|---|---|---|---|---|---|\n')

stamp = started.strftime('%m%d-%H%M%S')
for k, item in enumerate(resp['data']):
    path = os.path.join(out_dir, f'{version}-{model.replace("gpt-image-", "")}-{stamp}-{k + 1}.png')
    open(path, 'wb').write(base64.b64decode(item['b64_json']))
    m = subprocess.run([sys.executable, MEASURE, path], capture_output=True, text=True)
    open(path[:-4] + '-measure.txt', 'w').write(m.stdout + m.stderr)
    counted = re.search(r'(\d+) rows, (\d+) frames', m.stdout)
    frames = f'{counted.group(2)} in {counted.group(1)} rows' if counted else 'measure failed'
    grid = f' / {rows * cols}' if rows else ''
    print(f'  {os.path.relpath(path, ROOT)}: {frames}{grid}')
    with open(prompt_file, 'a') as fh:
        fh.write(f'| {started:%Y-%m-%d %H:%M} | {version} | {model} · {quality} · {size} | `{os.path.basename(path)}` | '
                 f'{frames}{grid} | {tin} / {tout} (run) | ${cost / len(resp["data"]):.2f} | |\n')

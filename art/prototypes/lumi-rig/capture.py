"""Render the rig test in headless Chrome: frame grids, GIFs, the side-by-side with the drawn poses, and the numbers.

    python3 art/prototypes/lumi-rig/capture.py --all            # everything below, into out/
    python3 art/prototypes/lumi-rig/capture.py --grid pickup-9x  # one named grid (see GRIDS)
    python3 art/prototypes/lumi-rig/capture.py --check          # the numbers per frame (?check=1) -> out/check.json
    python3 art/prototypes/lumi-rig/capture.py --compare        # out/compare-{reach,grip,held}.png + ?check=compare numbers
    python3 art/prototypes/lumi-rig/capture.py --hands          # stills (?export=1) through lumi-walk/hands.py

Modelled on lumi-walk/capture.py: the page's `?grid=` mode steps the motion on a fixed clock from t = 0 (the pendulum
and the cloak's spring are integrated at 1/240 s, so a grid and the numbers see exactly what the page plays) and lays the
cells out in one canvas; one screenshot holds them. Long runs are cut into chunks (`part`), each its own screenshot, and
joined here into the grid PNG and the GIF. Build index.html first (build.py).
"""
import base64
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
OUT = os.path.join(HERE, 'out')
END = 11.4          # the page's pick-up and set-down end here (index.src.html KEYS)
# name: (seq, start, step, count, cols, cell, zoom, focus, chunk)
GRIDS = {
    'pickup-9x': ('pickup', 0.8, 1 / 30, 105, 6, (780, 740), 9, 'upper', 30),      # reach -> hold (0.8 s to 4.3 s)
    'setdown-9x': ('pickup', 7.2, 1 / 30, 111, 6, (780, 740), 9, 'upper', 30),     # hold -> rest (7.2 s to 10.9 s)
    'reach-9x': ('reach', 0, 0, 5, 5, (780, 1260), 9, 'reach', 5),                 # ground heights 0, 40, 62, 82, 100
    'reach-9x-bare': ('reach', 0, 0, 5, 5, (780, 1260), 9, 'reach', 5, 'bare=1'),  # the same without the room: the arm below the tabletop
    'pickup-3x': ('pickup', 0, 1 / 30, int(END * 30), 12, (300, 400), 3, 'whole', 120),
}


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def url(query):
    return 'file://' + os.path.join(HERE, 'index.html') + '?' + query


def shot(query, w, h, path, budget=60000):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    f'--window-size={w},{h}', f'--virtual-time-budget={budget}', f'--screenshot={path}', url(query)],
                   check=True, capture_output=True, timeout=900)
    return Image.open(path).convert('RGB')


def dump(query, budget=600000):
    dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', f'--virtual-time-budget={budget}', '--dump-dom', url(query)],
                         check=True, capture_output=True, text=True, timeout=1800).stdout
    found = re.search(r'<pre id="audit">(.*?)</pre>', dom, re.S)
    if not found:
        sys.exit('no audit in the page (did it throw?)\n' + dom[-2000:])
    return json.loads(found.group(1).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>'))


def grid(name):
    seq, start, step, count, cols, (cw, ch), zoom, focus, chunk = GRIDS[name][:9]
    extra = ('&' + GRIDS[name][9]) if len(GRIDS[name]) > 9 else ''
    frames = []
    for c0 in range(0, count, chunk):
        n = min(chunk, count - c0)
        rows = (n + cols - 1) // cols
        q = f'grid={start + c0 * step:.5f},{step:.6f},{n},{cols}&seq={seq}&cell={cw}x{ch}&zoom={zoom}&focus={focus}&from={start:.5f}&index={c0}' + extra
        im = shot(q, cw * cols, ch * rows, os.path.join(OUT, f'{name}-part.png'))
        frames += [im.crop((i % cols * cw, i // cols * ch, i % cols * cw + cw, i // cols * ch + ch)) for i in range(n)]
    os.remove(os.path.join(OUT, f'{name}-part.png'))
    rows = (count + cols - 1) // cols
    sheet = Image.new('RGB', (cw * cols, ch * rows))
    for i, f in enumerate(frames):
        sheet.paste(f, (i % cols * cw, i // cols * ch))
    sheet.save(os.path.join(OUT, f'{name}-grid.png'))
    # the grid is also cut into pages of 30 cells (5 rows of 6), for looking at them at the zoom they were rendered at
    if count > 30 and seq == 'pickup':
        for p in range(0, count, 30):
            sub = frames[p:p + 30]
            pc = 6 if cw > 400 else cols
            pr = (len(sub) + pc - 1) // pc
            pg = Image.new('RGB', (cw * pc, ch * pr))
            for i, f in enumerate(sub):
                pg.paste(f, (i % pc * cw, i // pc * ch))
            pg.save(os.path.join(OUT, f'{name}-grid-{p // 30 + 1}.png'))
    if step > 0:
        frames[0].save(os.path.join(OUT, f'{name}.gif'), save_all=True, append_images=frames[1:],
                       duration=int(round(step * 1000)), loop=0)
    print(f'wrote out/{name}-grid.png' + (f', out/{name}.gif' if step > 0 else ''), f'({count} frames)')


def compare():
    for pose in ('reach', 'grip', 'held'):
        cw, ch = 780, 740
        im = shot(f'compare={pose}&cell={cw}x{ch}', cw * 2, ch * 2, os.path.join(OUT, f'compare-{pose}.png'))
        im.save(os.path.join(OUT, f'compare-{pose}.png'))
    res = dump('check=compare')
    json.dump(res, open(os.path.join(OUT, 'compare.json'), 'w'), indent=1)
    print(json.dumps(res, indent=1))


def hands():
    sys.path.insert(0, os.path.join(ROOT, 'art', 'prototypes', 'lumi-walk'))
    import hands as H
    res = dump('export=1')
    os.makedirs(os.path.join(OUT, 'stills'), exist_ok=True)
    report = {}
    for name, data in res['stills'].items():
        raw = base64.b64decode(data.split(',', 1)[1])
        path = os.path.join(OUT, 'stills', f'{name}.png')
        open(path, 'wb').write(raw)
        rgba = np.array(Image.open(path).convert('RGBA'))
        r = H.count(rgba)
        H.overlay(rgba, r, os.path.join(OUT, 'stills', f'{name}-hands.png'), f'{name}: {len(r["blobs"])} hands')
        report[name] = dict(hands=len(r['blobs']), detail=H.describe(r), lantern=bool(r['lantern'].any()))
        print(f'{name}: {len(r["blobs"])} hand(s) — {H.describe(r)}')
    json.dump(report, open(os.path.join(OUT, 'hands.json'), 'w'), indent=1)


def before_after():
    """out/sleeve-before-after.png: the first round's worst frames (kept in out/before/) beside the same frames now."""
    from PIL import ImageDraw
    B = os.path.join(OUT, 'before')
    # (label, file, box) — boxes in the grid PNGs: pickup-9x pages are 6 cells of 780x740 a row, reach grids 780x1260 cells
    items = [
        ('reaching past the hood, t 1.567 s (9x)', 'pickup-9x-grid-1.png', (5 * 780, 3 * 740, 6 * 780, 4 * 740)),
        ('holding high, t 4.0 s (9x)', 'pickup-9x-grid-4.png', (0, 740, 780, 2 * 740)),
        ('bare reach to 62 px (9x)', 'reach-9x-bare-grid.png', (2 * 780, 0, 3 * 780, 900)),
        ('bare reach to 82 px (9x)', 'reach-9x-bare-grid.png', (3 * 780, 0, 4 * 780, 900)),
        ('bare reach to 100 px (9x)', 'reach-9x-bare-grid.png', (4 * 780, 0, 5 * 780, 900)),
        ('the held pose in the room (9x)', 'compare-held.png', (0, 0, 780, 740)),
    ]
    cw = 520
    rows = []
    for label, f, box in items:
        pair = []
        for side, d in (('before', B), ('after', OUT)):
            im = Image.open(os.path.join(d, f)).convert('RGB').crop(box)
            im = im.resize((cw, int(im.height * cw / im.width)), Image.LANCZOS)
            dr = ImageDraw.Draw(im)
            dr.rectangle([0, 0, cw, 22], fill=(0, 0, 0))
            dr.text((6, 5), f'{side}: {label}', fill=(255, 255, 255))
            pair.append(im)
        rows.append(pair)
    H = sum(max(p[0].height, p[1].height) for p in rows)
    sheet = Image.new('RGB', (cw * 2 + 8, H + 8 * len(rows)), (20, 20, 20))
    y = 0
    for a, b in rows:
        sheet.paste(a, (0, y)); sheet.paste(b, (cw + 8, y))
        y += max(a.height, b.height) + 8
    sheet.save(os.path.join(OUT, 'sleeve-before-after.png'))
    print('wrote out/sleeve-before-after.png')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    if '--before-after' in sys.argv:
        before_after()
    if '--grid' in sys.argv:
        grid(arg('--grid'))
    if '--check' in sys.argv:
        res = dump('check=1')
        json.dump(res, open(os.path.join(OUT, 'check.json'), 'w'), indent=1)
        print(json.dumps(res['summary'], indent=1))
    if '--compare' in sys.argv:
        compare()
    if '--hands' in sys.argv:
        hands()
    if '--all' in sys.argv:
        for g in GRIDS:
            grid(g)
        compare()
        hands()
        res = dump('check=1')
        json.dump(res, open(os.path.join(OUT, 'check.json'), 'w'), indent=1)
        print(json.dumps(res['summary'], indent=1))

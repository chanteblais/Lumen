"""Render the layers viewer in headless Chrome — judge depth order without a browser tab.

    python3 art/prototypes/home-layers/capture.py [--cell 300x260] [--zoom 2.2] [--cols 6] [--view composed|tinted|plate]
                                                  [--plan] [--name grid]
    python3 art/prototypes/home-layers/capture.py --page [WxH]
    python3 art/prototypes/home-layers/capture.py --test

Default: the page's ?grid= mode, Lumi at every test point build.py made (behind, in front, left and right of each
layer, and a row close behind the low table), one cell each, labelled with the layers drawn over her, in one
screenshot: out/<name>.png. --page screenshots the page as a visitor sees it (out/page.png). --test prints the JS depth
rule's disagreements with depth.py. Build index.html first.
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
PAGE = 'file://' + os.path.join(HERE, 'index.html')


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv and sys.argv.index(name) + 1 < len(sys.argv) else default


out_dir = os.path.join(HERE, 'out')
os.makedirs(out_dir, exist_ok=True)

if '--test' in sys.argv:
    dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=20000', '--dump-dom', PAGE + '?test=1'],
                         check=True, capture_output=True, text=True, timeout=180).stdout
    found = re.search(r'<pre id="test">(.*?)</pre>', dom, re.S)
    print(found.group(1) if found else 'no test output in the page (did it throw?)')
    sys.exit(0)

if '--page' in sys.argv:
    size = arg('--page', '1280x1500')
    size = size if 'x' in size else '1280x1500'
    shot = os.path.join(out_dir, 'page.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    f'--window-size={size.replace("x", ",")}', '--virtual-time-budget=10000', f'--screenshot={shot}', PAGE],
                   check=True, capture_output=True, timeout=180)
    print('wrote out/page.png')
    sys.exit(0)

cw, ch = (int(v) for v in arg('--cell', '300x260').split('x'))
cols, zoom, name = int(arg('--cols', 6)), float(arg('--zoom', 2.2)), arg('--name', 'grid')
count = len(json.load(open(os.path.join(out_dir, 'tests.json')))['points'])
rows = (count + cols - 1) // cols
query = f'grid=1&cell={cw}x{ch}&zoom={zoom}&cols={cols}&view={arg("--view", "composed")}' + ('&plan=1' if '--plan' in sys.argv else '')
shot = os.path.join(out_dir, f'{name}.png')
subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                f'--window-size={cw * cols},{ch * rows}', '--virtual-time-budget=20000', f'--screenshot={shot}', PAGE + '?' + query],
               check=True, capture_output=True, timeout=240)
print(f'wrote out/{name}.png ({count} points, {cols}x{rows})')

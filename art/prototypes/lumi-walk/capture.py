"""Render the walk test in headless Chrome and cut the frames — look at motion without a browser tab.

    python3 art/prototypes/lumi-walk/capture.py [--start 2.5] [--step 0.0833] [--count 48] [--cols 6]
                                                [--zoom 4] [--cell 420x340] [--size 120] [--plan] [--name walk]
                                                [--turn morph|swap] [--query 'cue=curious@0.5&idle=0']

The page's `?grid=` mode steps the tour from t = 0 at a fixed 1/60 s, renders one follow-camera cell per
frame and lays them out in one canvas; one screenshot holds them all (no animation clock, so the frozen
automation-tab trap in docs/animation-pipeline.md can't bite). Writes out/<name>-grid.png, out/<name>.gif at
the real frame time, and out/<name>-strip.png (every fourth frame in a row). Build index.html first.

The idle runs on the same sim clock, so a grid shows it — but its scheduler is sparse on purpose (a glance or tilt
every 8–20 s, an expression every 40–90 s), so a short grid will rarely catch one. `--query` appends to the page's
query string, for these testing params:
  cue=<name>@<seconds>[,<name>@<seconds>…]   fire idle cues at those sim times, whatever the scheduler is doing:
                                             blink, glance, glanceLeft, glanceRight, tilt, tiltLeft, tiltRight,
                                             happy, curious, sleepy (a tilt or an expression only holds while she
                                             stands — she rests at the start of the tour until 3 s)
  idle=0                                     no scheduled idle at all (cues still fire)
  tour=0                                     she never sets off, so a tilt or an expression can play out whole
e.g. `--start 0 --step 0.25 --count 40 --zoom 9 --query 'cue=curious@0.3,glanceLeft@4.5&idle=0&tour=0' --name idle`.
"""
import os
import subprocess
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


start, step = float(arg('--start', 2.5)), float(arg('--step', 1 / 12))
count, cols = int(arg('--count', 48)), int(arg('--cols', 6))
zoom, size, name = float(arg('--zoom', 4)), int(arg('--size', 120)), arg('--name', 'walk')
cw, ch = (int(v) for v in arg('--cell', '420x340').split('x'))
rows = (count + cols - 1) // cols
out_dir = os.path.join(HERE, 'out')
os.makedirs(out_dir, exist_ok=True)

if '--audit' in sys.argv or '--trace' in sys.argv:
    # the page's ?audit=1 mode (facing against movement, turns and flips, over the tour and 60 random clicks), or
    # ?trace=start,step,count (her position, drawing, facing and heading at each sample)
    # --audit --query 'around=905.2,905.5' adds every frame between those sim times to the audit's JSON, for a worst
    # case found among the random clicks, which --trace (the tour only) cannot reach
    query = ('audit=1' if '--audit' in sys.argv else 'trace=' + arg('--trace', '0,1,10')) \
        + (('&' + arg('--query', '').lstrip('?&')) if '--query' in sys.argv else '')
    dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=120000', '--dump-dom',
                          'file://' + os.path.join(HERE, 'index.html') + '?' + query], check=True, capture_output=True,
                         text=True, timeout=300).stdout
    import re
    found = re.search(r'<pre id="audit">(.*?)</pre>', dom, re.S)
    print(found.group(1) if found else 'no audit in the page (did it throw?)')
    sys.exit(0)

if '--page' in sys.argv:
    # the whole page as a visitor first sees it (`--page [WxH]`), for one look at the layout before publishing
    at = sys.argv.index('--page') + 1   # `--page` may be last, with no size after it
    size = sys.argv[at] if at < len(sys.argv) and 'x' in sys.argv[at] else '1280x1480'
    shot = os.path.join(out_dir, f'{name}-page.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    f'--window-size={size.replace("x", ",")}', '--virtual-time-budget=6000', f'--screenshot={shot}',
                    'file://' + os.path.join(HERE, 'index.html')], check=True, capture_output=True, timeout=120)
    print('wrote', os.path.relpath(shot, HERE))
    sys.exit(0)
grid_png = os.path.join(out_dir, f'{name}-grid.png')
query = (f'grid={start},{step},{count},{cols}&cell={cw}x{ch}&zoom={zoom}&size={size}'
         + ('&plan=1' if '--plan' in sys.argv else '') + f'&turn={arg("--turn", "morph")}'
         + (('&' + arg('--query', '').lstrip('?&')) if '--query' in sys.argv else ''))
url = 'file://' + os.path.join(HERE, 'index.html') + '?' + query
cmd = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
       f'--window-size={cw * cols},{ch * rows}', '--virtual-time-budget=15000', f'--screenshot={grid_png}', url]
subprocess.run(cmd, check=True, capture_output=True, timeout=180)
grid = Image.open(grid_png).convert('RGB')
frames = [grid.crop((i % cols * cw, i // cols * ch, i % cols * cw + cw, i // cols * ch + ch)) for i in range(count)]
frames[0].save(os.path.join(out_dir, f'{name}.gif'), save_all=True, append_images=frames[1:],
               duration=int(round(step * 1000)), loop=0)
picked = frames[::4]
strip = Image.new('RGB', (cw * len(picked), ch), (0, 0, 0))
for i, f in enumerate(picked):
    strip.paste(f, (i * cw, 0))
strip.save(os.path.join(out_dir, f'{name}-strip.png'))
print('wrote', os.path.relpath(grid_png, HERE), f'out/{name}.gif', f'out/{name}-strip.png', f'({count} frames, {step:.3f}s each, from {start}s)')

"""Mock the companion's CSS shadows on the room paintings, before (baked cream shadow) and after (drawn shadows).
Same geometry as globals.css: a 176x208 cell shown 150px tall, mirrored, feet at 45% (55% on screen) and 96.2% down,
her spot mapped at one painting pixel per CSS pixel (a 1536x1024 window).

    python3 art/prototypes/shadow-mock.py

Needs out/lumi-free-before.webp, a sheet with the baked cream shadow:
    git show 129c4fe:public/lumi-free.webp > art/prototypes/out/lumi-free-before.webp
Writes out/shadow-today.png and out/shadow-library.png (before | after). The room numbers below copy the
room variables in src/app/globals.css by hand — change both."""
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, 'out') + os.sep
ROOT = os.path.dirname(os.path.dirname(HERE)) + os.sep   # the repo root (this is art/prototypes/)
os.makedirs(S, exist_ok=True)
ROOMS = [
    ('today', 'art/scenery/today/background.png', 630, 346, dict(contact=0.45, shade=(92, 56, 28), cast_a=0.55, lean=42, length=0.5, light=(255, 218, 170), light_a=0.45)),
    ('library', 'art/scenery/library/background.png', 1190, 890, dict(contact=0.45, shade=(74, 38, 20), cast_a=0.5, lean=55, length=0.4, light=(255, 206, 160), light_a=0.5)),
]
H_CSS, W_CSS = 150, round(150 * 176 / 208)


def cell(path, row, col):
    sheet = Image.open(path).convert('RGBA')
    c = sheet.crop((col * 176, row * 208, (col + 1) * 176, (row + 1) * 208))
    return c.resize((W_CSS, H_CSS), Image.LANCZOS).transpose(Image.FLIP_LEFT_RIGHT)


def box(x, y):
    right = x + 58                       # --lumi-right maps the box's right edge to painting x + 58
    bottom = y + 14                      # and its bottom to painting y + 14
    return right - W_CSS, bottom - H_CSS


def before(room):
    name, painting, x, y, v = room
    im = Image.open(ROOT + painting).convert('RGBA')
    left, top = box(x, y)
    im.alpha_composite(cell(S + 'lumi-free-before.webp', 0, 0), (left, top))
    return im


def after(room):
    name, painting, x, y, v = room
    im = np.array(Image.open(ROOT + painting).convert('RGB')).astype(float)
    left, top = box(x, y)
    fx, fy = left + 0.55 * W_CSS, top + 0.962 * H_CSS
    fig = cell(ROOT + 'public/lumi-free.webp', 0, 0)
    a = np.array(fig)[:, :, 3].astype(float) / 255
    # cast: the silhouette flipped below the feet, squashed to `length`, leaned right by `lean`
    Hh, Ww = im.shape[:2]
    cast = np.zeros((Hh, Ww))
    t = np.tan(np.radians(v['lean']))
    ys, xs = np.mgrid[int(fy):min(Hh, int(fy + H_CSS * v['length']) + 2), int(left - 10):min(Ww, int(left + W_CSS + H_CSS))]
    dy = ys - fy
    sy = (fy - dy / v['length']) - top
    sx = (xs - dy * t) - left
    ok = (sy >= 0) & (sy < H_CSS) & (sx >= 0) & (sx < W_CSS)
    vals = np.zeros(ys.shape)
    vals[ok] = a[sy[ok].astype(int), sx[ok].astype(int)]
    cast[ys, xs] = vals
    cast = np.array(Image.fromarray((cast * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float) / 255 * v['cast_a']
    on = np.where(cast > 0.05)
    print(name, 'cast: max alpha', round(float(cast.max()), 2), 'pixels', len(on[0]),
          'spans x', (int(on[1].min()), int(on[1].max())) if len(on[0]) else None, 'y', (int(on[0].min()), int(on[0].max())) if len(on[0]) else None,
          'feet at', (round(fx), round(fy)))
    im = im * (1 - cast[:, :, None]) + np.array(v['shade'])[None, None, :] * cast[:, :, None]
    # contact: the floor darkened under a soft oval (brightness + a little saturation, approximated by brightness)
    yy, xx = np.mgrid[0:Hh, 0:Ww]
    r = np.sqrt(((xx - fx) / (0.26 * W_CSS)) ** 2 + ((yy - fy) / (0.045 * H_CSS)) ** 2)
    m = np.interp(r, [0, 0.25, 0.62, 1], [1, 1, 0.55, 0])
    im = im * (1 - m[:, :, None] * (1 - v['contact']))
    # her, with the room's light multiplied over her
    f = np.array(fig).astype(float)
    tint = 1 - v['light_a'] * (1 - np.array(v['light']) / 255)
    rgb = f[:, :, :3] * tint
    region = im[top:top + H_CSS, left:left + W_CSS]
    region[:] = region * (1 - a[:, :, None]) + rgb * a[:, :, None]
    return Image.fromarray(np.clip(im, 0, 255).astype(np.uint8))


for room in ROOMS:
    name, _, x, y, _ = room
    left, top = box(x, y)
    crop = (left - 60, top - 20, left + W_CSS + 120, top + H_CSS + 70)
    b, c = before(room).convert('RGB').crop(crop), after(room).crop(crop)
    w, h = b.size
    out = Image.new('RGB', (w * 2 + 10, h), (30, 30, 30))
    out.paste(b, (0, 0)); out.paste(c, (w + 10, 0))
    out.resize((out.width * 2, out.height * 2), Image.LANCZOS).save(S + f'shadow-{name}.png')
    print('wrote', S + f'shadow-{name}.png')

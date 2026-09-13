"""Make the favicon files from Chanté's compass-star icon.

    python3 scripts/make-favicon.py

The source, art/scenery/library/icon.png, is gold on white with no transparency, so the white is taken back
out: each pixel's alpha is how far it sits from white (1 − its lightest channel) and its colour is
un-composited from white, which keeps the gold's anti-aliased edges instead of leaving a pale fringe. The
mark is then cropped square to its extents with a little margin.

- src/app/favicon.ico (16, 32, 48) and src/app/icon.png (32): the tab sizes. The hairlines vanish below
  about 64px, so these are thickened: drawn at four times the size, the alpha grown by a 5px max filter and
  lifted (a 0.7 power), the colour pulled toward the mid gold so thin strokes don't wash out to pale
  yellow, then scaled down. It reads on light and dark tabs alike.
- src/app/apple-icon.png (180): the untouched mark on the nav rail's olive green (about 37,38,17), where the
  same compass star already sits; iOS fills transparency with black, so this one is opaque.

If the painting changes, re-run; nothing in the CSS depends on these.
"""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'art/scenery/library/icon.png')
APP = os.path.join(ROOT, 'src/app')

MID_GOLD = np.array([196, 144, 40], dtype=np.float64)
RAIL_GREEN = (37, 38, 17, 255)


def keyed_master():
    rgb = np.asarray(Image.open(SOURCE).convert('RGB')).astype(np.float64) / 255
    alpha = np.clip(((1 - rgb).max(axis=2) - 0.02) / 0.98, 0, 1)  # the 0.02 drops paper noise
    safe = np.where(alpha > 0, alpha, 1)[..., None]
    colour = np.clip((rgb - (1 - alpha[..., None])) / safe, 0, 1)
    img = Image.fromarray((np.dstack([colour, alpha]) * 255).round().astype(np.uint8), 'RGBA')
    x0, y0, x1, y1 = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    cx, cy, side = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) * 1.04
    return img.crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2)))


def tab_size(master, size):
    big = master.resize((size * 4, size * 4), Image.LANCZOS)
    alpha = big.getchannel('A').filter(ImageFilter.MaxFilter(5))
    alpha = alpha.point(lambda v: min(255, int(255 * (v / 255) ** 0.7)))
    colour = np.asarray(big.convert('RGB')).astype(np.float64) * 0.4 + MID_GOLD * 0.6
    big = Image.merge('RGBA', (*Image.fromarray(colour.astype(np.uint8)).split(), alpha))
    return big.resize((size, size), Image.LANCZOS)


def main():
    master = keyed_master()

    tabs = {s: tab_size(master, s) for s in (16, 32, 48)}
    tabs[48].save(os.path.join(APP, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)],
                  append_images=[tabs[16], tabs[32]])
    tabs[32].save(os.path.join(APP, 'icon.png'), optimize=True)

    apple = Image.new('RGBA', (180, 180), RAIL_GREEN)
    mark = master.resize((136, 136), Image.LANCZOS)
    apple.alpha_composite(mark, (22, 22))
    apple.convert('RGB').save(os.path.join(APP, 'apple-icon.png'), optimize=True)

    print('wrote src/app/favicon.ico, icon.png, apple-icon.png')


if __name__ == '__main__':
    main()

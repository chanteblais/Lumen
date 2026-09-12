# art/

Lumi's source drawings — the sheets her sprites are cut from. Kept in the repo so the cut can be redone; never served.

| Sheet | What it is | Used by |
|---|---|---|
| `lumi-slow-idle.png` | Breath · blink · sway, one pose, 1–2px movements (the corner companion's idle) | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` rows 0–5 |
| `lumi-idle.png` | The playful foot, sixteen in-betweened frames of one drawing (only the foot and dirt move) on a flat ground — an occasional variation on the breath loop; cut as frames 1–7 + 10–16, one kick out and back | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` rows 6–8 |
| `lumi-playful-foot.png` | The first foot-tap, eight frames, each a fresh drawing — superseded by `lumi-idle.png` (too few in-betweens; the whole figure boiled) | not cut any more |
| `lumi-stretch.png` | A stretch — candidate for another rare idle moment | not cut yet |

The head expressions (`public/lumi-heads.png`) were cut from an earlier character sheet that is not kept; the cells are the source now. Rules for what a sheet may become: `docs/design-system.md` → Lumi sprites.

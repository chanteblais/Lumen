# art/

Lumi's source drawings — the sheets her sprites are cut from. Kept in the repo so the cut can be redone; never served.

| Sheet | What it is | Used by |
|---|---|---|
| `lumi-slow-idle.png` | Breath · blink · sway, one pose, 1–2px movements (the corner companion's idle) | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` rows 0–5 |
| `lumi-idle-foot.png` | The playful foot with a glance, 24 in-betweened frames of one drawing on a flat ground: row 1 rest then the head turning toward the kicking foot (frame 8 a stray rest frame), row 2 the kick with the head held turned (drawn ~3.5% smaller, scaled at the cut), row 3 rest frames (the turn back was not drawn; the loop replays the glance in reverse). Fifteen cells are cut; the play order lives in `LumiSprite` | `scripts/cut-lumi-idle.py` → `public/lumi-idle.webp` rows 6–8 |
| `lumi-idle.png` | The playful foot without the glance, sixteen frames of one drawing — superseded by `lumi-idle-foot.png` | not cut any more |
| `lumi-playful-foot.png` | The first foot-tap, eight frames, each a fresh drawing — superseded by `lumi-idle.png` (too few in-betweens; the whole figure boiled) | not cut any more |
| `lumi-stretch.png` | A stretch — candidate for another rare idle moment | not cut yet |

The head expressions (`public/lumi-heads.png`) were cut from an earlier character sheet that is not kept; the cells are the source now. Rules for what a sheet may become: `docs/design-system.md` → Lumi sprites.

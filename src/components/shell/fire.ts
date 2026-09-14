/**
 * Home's stove fire, moving: the painting's own flames warped a frame at a
 * time (art-direction §4, tier 1 — motion computed from one drawing). Pure,
 * with no DOM, so it can be rendered headless and tested; `HomeFire` draws it.
 * Every coordinate here is in the painting's pixels (public/home-room.webp, 1536×1024).
 */

/** The crop the canvas covers: the stove's glass, with a margin that never moves. */
export const FIRE_CROP = { x: 598, y: 192, w: 74, h: 68 } as const;
/** Buffer pixels per painting pixel, so the flames move in sub-pixel steps. */
export const FIRE_SCALE = 3;
/** Where the firelight is centred. */
export const FIRE_LIGHT = { x: 634, y: 238 } as const;

/** The log bed: nothing below it moves. */
const BED = 251;
/** The part of the glass that may move (an ellipse clear of the frame). */
const GLASS = { cx: 635, cy: 226, rx: 31, ry: 27 };

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (from: number, to: number, v: number) => {
  const u = clamp01((v - from) / (to - from));
  return u * u * (3 - 2 * u);
};

/** How high the fire burns at `t` seconds, 0–1. Incommensurate periods, so it never visibly repeats. */
export function fireLevel(t: number): number {
  return clamp01(
    0.5 +
      0.2 * Math.sin((TAU * t) / 1.3) +
      0.13 * Math.sin((TAU * t) / 0.53 + 1) +
      0.1 * Math.sin((TAU * t) / 3.7 + 2) +
      0.06 * Math.sin((TAU * t) / 0.29 + 0.5),
  );
}

export type FlameFrame = (t: number, out: Uint8ClampedArray) => void;

/**
 * `src` is the crop as RGBA, FIRE_CROP scaled by FIRE_SCALE (`w` × `h`).
 * Returns a renderer that writes the frame at `t` seconds into `out` (the same
 * size): the flames, swaying and licking upward and burning taller or lower
 * with `fireLevel`, and transparent wherever nothing moves, so the painting
 * underneath shows through unchanged and there is no seam.
 */
export function createFlame(src: Uint8ClampedArray, w: number, h: number): FlameFrame {
  const s = FIRE_SCALE;
  // Where the flames are: bright and warm, spread a few pixels so the space they lick into moves too.
  const flame = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    flame[i] = clamp01(((src[i * 4] ?? 0) - 150) / 80) * clamp01(((src[i * 4 + 1] ?? 0) - 70) / 110);
  }
  const near = boxBlur(boxBlur(flame, w, h, 3 * s), w, h, 3 * s);

  // How far each pixel may move: inside the glass, above the log bed, most where the flames are.
  const moving: { at: number; x: number; y: number; k: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const X = FIRE_CROP.x + (x + 0.5) / s;
      const Y = FIRE_CROP.y + (y + 0.5) / s;
      const e = ((X - GLASS.cx) / GLASS.rx) ** 2 + ((Y - GLASS.cy) / GLASS.ry) ** 2;
      const i = y * w + x;
      // The dark logs hold their shape (they bent with the flames); the flames and the glow behind them move.
      const lit = Math.max(src[i * 4] ?? 0, src[i * 4 + 1] ?? 0) / 255;
      const k = (1 - ease(0.5, 1, e)) * ease(BED, BED - 14, Y) * (0.15 + 0.85 * clamp01((near[i] ?? 0) * 2.5)) * ease(0.25, 0.5, lit);
      if (k > 0.002) moving.push({ at: i * 4, x: X, y: Y, k });
    }
  }

  return (t, out) => {
    out.fill(0);
    const stretch = 0.88 + 0.24 * fireLevel(t);
    for (const { at, x: X, y: Y, k } of moving) {
      const above = BED - Y;
      // Waves travel up the flame (the phase rises with t); the tips sway most.
      const sway = clamp01(above / 36);
      const dx = sway * (1.3 * Math.sin(0.42 * Y + 6 * t + 0.25 * X) + 0.7 * Math.sin(0.23 * Y + 3.7 * t - 0.4 * X + 1.3));
      // Taller when it flares (sampled from nearer the bed), with a lick running up it.
      const dy = above * (1 - 1 / stretch) + 0.9 * Math.sin(0.31 * Y + 7.3 * t + 0.5 * X);
      sample(src, w, h, (X + k * dx - FIRE_CROP.x) * s - 0.5, (Y + k * dy - FIRE_CROP.y) * s - 0.5, out, at);
      out[at + 3] = Math.round(255 * clamp01(k * 3));
    }
  };
}

/** Bilinear RGB from `src` at (x, y), clamped to its edges, into `out` at `o`. */
function sample(src: Uint8ClampedArray, w: number, h: number, x: number, y: number, out: Uint8ClampedArray, o: number) {
  const cx = x < 0 ? 0 : x > w - 1 ? w - 1 : x;
  const cy = y < 0 ? 0 : y > h - 1 ? h - 1 : y;
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const fx = cx - x0;
  const fy = cy - y0;
  const a = (y0 * w + x0) * 4;
  const b = (y0 * w + x1) * 4;
  const c = (y1 * w + x0) * 4;
  const d = (y1 * w + x1) * 4;
  for (let ch = 0; ch < 3; ch++) {
    const sa = src[a + ch] ?? 0;
    const sc = src[c + ch] ?? 0;
    const top = sa + ((src[b + ch] ?? 0) - sa) * fx;
    const bottom = sc + ((src[d + ch] ?? 0) - sc) * fx;
    out[o + ch] = top + (bottom - top) * fy;
  }
}

/** A box blur of radius `r`, one pass horizontally and one vertically. */
function boxBlur(a: Float32Array, w: number, h: number, r: number): Float32Array {
  const across = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let i = Math.max(0, x - r); i <= Math.min(w - 1, x + r); i++, n++) sum += a[y * w + i] ?? 0;
      across[y * w + x] = sum / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let i = Math.max(0, y - r); i <= Math.min(h - 1, y + r); i++, n++) sum += across[i * w + x] ?? 0;
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

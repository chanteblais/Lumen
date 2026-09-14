import { describe, expect, it } from "vitest";
import { FIRE_CROP, FIRE_SCALE, createFlame, fireLevel } from "./fire";

const W = FIRE_CROP.w * FIRE_SCALE;
const H = FIRE_CROP.h * FIRE_SCALE;

/** A crop that is fire everywhere, brighter toward the top, so any movement changes a pixel. */
function fireCrop() {
  const src = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      src.set([255, 120 + Math.round((120 * (H - y)) / H), 40 + ((x * 7 + y * 3) % 50), 255], o);
    }
  }
  return src;
}

describe("fireLevel", () => {
  it("stays within 0–1 and never holds still", () => {
    const levels = Array.from({ length: 600 }, (_, i) => fireLevel(i / 30));
    expect(Math.min(...levels)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...levels)).toBeLessThanOrEqual(1);
    expect(Math.max(...levels) - Math.min(...levels)).toBeGreaterThan(0.5);
  });
});

describe("createFlame", () => {
  const draw = createFlame(fireCrop(), W, H);
  const frame = (t: number) => {
    const out = new Uint8ClampedArray(W * H * 4);
    draw(t, out);
    return out;
  };
  const alpha = (out: Uint8ClampedArray, x: number, y: number) => out[(y * W + x) * 4 + 3];

  it("leaves the crop's edges and everything below the log bed to the painting", () => {
    const out = frame(1.7);
    for (let x = 0; x < W; x++) {
      expect(alpha(out, x, 0)).toBe(0);
      expect(alpha(out, x, H - 1)).toBe(0);
    }
    for (let y = 0; y < H; y++) {
      expect(alpha(out, 0, y)).toBe(0);
      expect(alpha(out, W - 1, y)).toBe(0);
    }
    const bedRow = (251 - FIRE_CROP.y) * FIRE_SCALE;
    for (let y = bedRow; y < H; y++) for (let x = 0; x < W; x++) expect(alpha(out, x, y)).toBe(0);
  });

  it("moves the flames from one frame to the next", () => {
    const a = frame(2);
    const b = frame(2.1);
    const centre = ((226 - FIRE_CROP.y) * FIRE_SCALE * W + (635 - FIRE_CROP.x) * FIRE_SCALE) * 4;
    expect(a[centre + 3]).toBe(255);
    let changed = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i + 1] !== b[i + 1]) changed++;
    expect(changed).toBeGreaterThan(1000);
  });
});

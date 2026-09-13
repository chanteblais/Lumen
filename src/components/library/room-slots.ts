import type { CSSProperties } from "react";

/**
 * Where the Library's names go on the painting. Measured on the served
 * art/scenery/library/background.png (1536×1024, the full-size-armchairs
 * render, 2026-09-13), in the shape of art/scenery/library/library-views.json:
 * each bookcase's wall face — its top-left, top-right and bottom-left corners
 * (the arch surround's outer edge, a line just over the arch, the cabinet's
 * base), normalized to the painting — and its plaque, in the face's own u/v
 * (0..1 across and down the face). The manifest is still v3, measured on the
 * archived painting before this one, so these no longer copy it. The room page
 * lays them on a stage the size of the painting under the Library's fit
 * (globals.css → Library: sections on the bookcases), so a percentage of the
 * stage is a fraction of the painting.
 */
export const PAINTING = { w: 1536, h: 1024 } as const;

type Pt = readonly [x: number, y: number];
type Rect = { u: number; v: number; w: number; h: number };

export type BookcaseSlot = {
  id: "collection_01" | "collection_02" | "collection_03";
  face: { tl: Pt; tr: Pt; bl: Pt };
  /** The manifest's `plaque.panel`: what warms on hover. */
  panel: Rect;
  /** The manifest's `plaque.text_safe`, run down to just above the panel's lower border so a name can take two lines; clear of the star above. */
  name: Rect;
  /** The name's type size in painting px (on screen, never under 12px). */
  type: number;
  /** The manifest's `chars_per_line_at_wide`: a name longer than two lines of it ends in an ellipsis. */
  charsPerLine: number;
};

/** In fill order (the manifest's `fill_order`): the centre bay, the ladder bay, the stair bay. */
export const BOOKCASES: readonly BookcaseSlot[] = [
  {
    id: "collection_02",
    face: { tl: [0.4199, 0.207], tr: [0.5475, 0.207], bl: [0.4199, 0.5586] },
    panel: { u: 0.065, v: 0.073, w: 0.86, h: 0.112 },
    name: { u: 0.134, v: 0.098, w: 0.726, h: 0.076 },
    type: 12.5,
    charsPerLine: 20,
  },
  {
    id: "collection_01",
    face: { tl: [0.2949, 0.2656], tr: [0.3952, 0.2148], bl: [0.2949, 0.6338] },
    panel: { u: 0.07, v: 0.092, w: 0.86, h: 0.09 },
    name: { u: 0.15, v: 0.105, w: 0.7, h: 0.07 },
    type: 12.5,
    charsPerLine: 16,
  },
  {
    id: "collection_03",
    face: { tl: [0.7207, 0.3867], tr: [0.7962, 0.4316], bl: [0.7207, 0.6719] },
    panel: { u: 0.05, v: 0.06, w: 0.92, h: 0.12 },
    name: { u: 0.12, v: 0.085, w: 0.78, h: 0.09 },
    type: 11.5,
    charsPerLine: 12,
  },
];

/** Where the slip for the table lies: on the round table's top, over the open book. */
export const TABLE_SLIP = { x: 0.4948, y: 0.7422 } as const;

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

/**
 * A face as a box on the stage. A side wall's vertical edges stay vertical, so
 * the box is only skewed along y, about its top-left corner, by the wall's
 * slope in painting px; then a point (u, v) inside it lands on
 * tl + u·(tr − tl) + v·(bl − tl), as the manifest defines.
 */
export function faceStyle(slot: BookcaseSlot): CSSProperties {
  const { tl, tr, bl } = slot.face;
  const slope = ((tr[1] - tl[1]) * PAINTING.h) / ((tr[0] - tl[0]) * PAINTING.w);
  return {
    left: pct(tl[0]),
    top: pct(tl[1]),
    width: pct(tr[0] - tl[0]),
    height: pct(bl[1] - tl[1]),
    transform: slope ? `skewY(${Math.atan(slope).toFixed(5)}rad)` : undefined,
  };
}

/** A rectangle in a face's u/v, inside its face box. */
export function rectStyle(r: Rect): CSSProperties {
  return { left: pct(r.u), top: pct(r.v), width: pct(r.w), height: pct(r.h) };
}

export function pointStyle(p: { x: number; y: number }): CSSProperties {
  return { left: pct(p.x), top: pct(p.y) };
}

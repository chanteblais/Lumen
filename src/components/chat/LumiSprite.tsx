import type { CSSProperties } from "react";

/**
 * The single source of Lumi's drawings, cut from the character sheet
 * (`mockups/lumi.png`, checkerboard keyed out):
 *
 * - `public/lumi-heads.png` — one row of 176px square cells, the six head
 *   expressions. Used inside the round avatar.
 * - `public/lumi-body.png`  — one row of 208×288 cells: the standing front
 *   pose, two blink frames derived from it (eyes painted out), then four idle
 *   moments from the sheet's idle row, scaled to the standing figure's face.
 *
 * A new state is a new cell in one of these lists, never a new component.
 */
export const LUMI_EXPRESSIONS = ["neutral", "blink", "happy", "curious", "excited", "sleepy"] as const;
export const LUMI_POSES = ["stand", "stand-blink-half", "stand-blink", "perk", "tilt", "wave", "lean"] as const;
/** The idle moments Lumi drifts into now and then. */
export const LUMI_MOMENTS = ["perk", "tilt", "wave", "lean"] as const satisfies readonly LumiPose[];

export type LumiExpression = (typeof LUMI_EXPRESSIONS)[number];
export type LumiPose = (typeof LUMI_POSES)[number];

const SHEETS = {
  head: { src: "/lumi-heads.png", cells: LUMI_EXPRESSIONS as readonly string[], w: 176, h: 176 },
  body: { src: "/lumi-body.png", cells: LUMI_POSES as readonly string[], w: 208, h: 288 },
} as const;

type Props = ({ sheet: "head"; cell: LumiExpression } | { sheet: "body"; cell: LumiPose }) & {
  /** Rendered cell height in px; width follows the cell's aspect. */
  height: number;
  className?: string;
  style?: CSSProperties;
};

/** One cell of a sheet. Decorative: the parent labels it. */
export function LumiSprite({ sheet, cell, height, className = "", style }: Props) {
  const s = SHEETS[sheet];
  const index = s.cells.indexOf(cell);
  const count = s.cells.length;
  return (
    <span
      aria-hidden
      className={`block ${className}`}
      style={{
        width: (height * s.w) / s.h,
        height,
        backgroundImage: `url(${s.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${count * 100}% 100%`,
        backgroundPosition: `${(index / (count - 1)) * 100}% 0`,
        ...style,
      }}
    />
  );
}

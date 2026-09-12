import type { CSSProperties } from "react";

/**
 * The single source of Lumi's drawings.
 *
 * - `public/lumi-heads.png` — one row of 176px square cells, the six head
 *   expressions from `mockups/lumi.png`. Used inside the round avatar.
 * - `public/lumi-idle.webp` — a 8×4 grid of 208×288 cells from
 *   `mockups/lumi-idle.png`: row 0 is the eight-frame idle loop (breathe +
 *   sway), rows 1–2 are the same frames with the sheet's half-shut and shut
 *   eyes composited on, row 3 is the eight micro variations.
 *
 * A new state is a new cell in one of these lists, never a new component.
 */
export const LUMI_EXPRESSIONS = ["neutral", "blink", "happy", "curious", "excited", "sleepy"] as const;
export const LUMI_EYES = ["open", "half", "closed"] as const;
export const LUMI_MOMENTS = ["head-tilt", "curious", "look-down", "look-up", "fidget", "adjust-cloak", "small-step", "stretch"] as const;
export const LUMI_IDLE_FRAMES = 8;

export type LumiExpression = (typeof LUMI_EXPRESSIONS)[number];
export type LumiEyes = (typeof LUMI_EYES)[number];
export type LumiMoment = (typeof LUMI_MOMENTS)[number];

const SHEETS = {
  head: { src: "/lumi-heads.png", cols: LUMI_EXPRESSIONS.length, rows: 1, w: 176, h: 176 },
  body: { src: "/lumi-idle.webp", cols: LUMI_IDLE_FRAMES, rows: LUMI_EYES.length + 1, w: 208, h: 288 },
} as const;

export type LumiCell = { sheet: keyof typeof SHEETS; col: number; row: number };

export const headCell = (expression: LumiExpression): LumiCell => ({ sheet: "head", col: LUMI_EXPRESSIONS.indexOf(expression), row: 0 });
/** Idle frame 0–7 with the given eye state. */
export const idleCell = (frame: number, eyes: LumiEyes): LumiCell => ({ sheet: "body", col: frame, row: LUMI_EYES.indexOf(eyes) });
export const momentCell = (moment: LumiMoment): LumiCell => ({ sheet: "body", col: LUMI_MOMENTS.indexOf(moment), row: LUMI_EYES.length });

/** Rendered size of a cell drawn at `height` px. */
export function cellSize(sheet: keyof typeof SHEETS, height: number) {
  const s = SHEETS[sheet];
  return { width: (height * s.w) / s.h, height };
}

type Props = { cell: LumiCell; height: number; className?: string; style?: CSSProperties };

/** One cell of a sheet. Decorative: the parent labels it. */
export function LumiSprite({ cell, height, className = "", style }: Props) {
  const s = SHEETS[cell.sheet];
  const pct = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
  return (
    <span
      aria-hidden
      className={`block ${className}`}
      style={{
        ...cellSize(cell.sheet, height),
        backgroundImage: `url(${s.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${s.cols * 100}% ${s.rows * 100}%`,
        backgroundPosition: `${pct(cell.col, s.cols)}% ${pct(cell.row, s.rows)}%`,
        ...style,
      }}
    />
  );
}

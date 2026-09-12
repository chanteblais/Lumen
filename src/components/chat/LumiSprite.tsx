import type { CSSProperties } from "react";

/**
 * The single source of Lumi's drawings.
 *
 * - `public/lumi-heads.png` — one row of 176px square cells, the six head
 *   expressions from `mockups/lumi.png`. Used inside the round avatar.
 * - `public/lumi-idle.webp` — a 9×9 grid of 144×208 cells, three rows per
 *   loop (open / half-shut / shut eyes, the blink frames composited on):
 *   rows 0–2 the nine-frame breath loop and rows 3–5 the nine-frame sway loop
 *   from `mockups/lumi-slow-idle.png`, rows 6–8 the eight-frame playful-foot
 *   loop from `mockups/lumi-playful-foot.png` (last column empty). One pose,
 *   tiny movements; every loop starts and ends at the same rest frame.
 *   Cut by `scripts/cut-lumi-idle.py`.
 *
 * A new state is a new cell in one of these lists, never a new component.
 */
export const LUMI_EXPRESSIONS = ["neutral", "blink", "happy", "curious", "excited", "sleepy"] as const;
export const LUMI_EYES = ["open", "half", "closed"] as const;
export const LUMI_LOOPS = ["breath", "sway", "foot"] as const;
/** Columns in the body sheet — the longest loop. */
export const LUMI_IDLE_FRAMES = 9;

export type LumiExpression = (typeof LUMI_EXPRESSIONS)[number];
export type LumiEyes = (typeof LUMI_EYES)[number];
export type LumiLoop = (typeof LUMI_LOOPS)[number];

/** Frames in each loop; shorter loops leave the sheet's trailing columns empty. */
export const LUMI_LOOP_FRAMES: Record<LumiLoop, number> = { breath: 9, sway: 9, foot: 8 };

const SHEETS = {
  head: { src: "/lumi-heads.png", cols: LUMI_EXPRESSIONS.length, rows: 1, w: 176, h: 176 },
  body: { src: "/lumi-idle.webp", cols: LUMI_IDLE_FRAMES, rows: LUMI_LOOPS.length * LUMI_EYES.length, w: 144, h: 208 },
} as const;

export type LumiCell = { sheet: keyof typeof SHEETS; col: number; row: number };

export const headCell = (expression: LumiExpression): LumiCell => ({ sheet: "head", col: LUMI_EXPRESSIONS.indexOf(expression), row: 0 });
/** One frame of a loop (0 to `LUMI_LOOP_FRAMES[loop] - 1`) with the given eye state. */
export const idleCell = (loop: LumiLoop, frame: number, eyes: LumiEyes): LumiCell => ({
  sheet: "body",
  col: frame,
  row: LUMI_LOOPS.indexOf(loop) * LUMI_EYES.length + LUMI_EYES.indexOf(eyes),
});

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

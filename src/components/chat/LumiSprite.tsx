import type { CSSProperties } from "react";

/**
 * The single source of Lumi's drawings.
 *
 * - `public/lumi-heads.png` — one row of 176px square cells, the six head
 *   expressions from the original `lumi.png` character sheet (not kept). Used inside the round avatar.
 * - `public/lumi-idle.webp` — a 15×9 grid of 144×208 cells, three rows per
 *   loop (open / half-shut / shut eyes, the blink frames composited on):
 *   rows 0–2 the nine-cell breath loop and rows 3–5 the nine-cell sway loop
 *   from `art/lumi-slow-idle.png`, rows 6–8 the fifteen cells of the playful
 *   foot (a glance toward the foot, then the kick) from `art/lumi-idle-foot.png`.
 *   A loop is an order over its cells (`LUMI_LOOP_CELLS`); every loop starts
 *   and ends near the same rest frame. Cut by `scripts/cut-lumi-idle.py`.
 *
 * A new state is a new cell in one of these lists, never a new component.
 */
export const LUMI_EXPRESSIONS = ["neutral", "blink", "happy", "curious", "excited", "sleepy"] as const;
export const LUMI_EYES = ["open", "half", "closed"] as const;
export const LUMI_LOOPS = ["breath", "sway", "foot"] as const;
/** Columns in the body sheet — the most cells in a loop. */
export const LUMI_IDLE_FRAMES = 15;

export type LumiExpression = (typeof LUMI_EXPRESSIONS)[number];
export type LumiEyes = (typeof LUMI_EYES)[number];
export type LumiLoop = (typeof LUMI_LOOPS)[number];

const run = (n: number) => Array.from({ length: n }, (_, i) => i);
/**
 * Each loop as the order its row's cells play in. A cell may play more than
 * once: the foot loop is rest and a glance toward the kicking foot (cells 0–6),
 * the kick with the head held turned (7–14), then the glance in reverse (6–1).
 * Shorter loops leave the sheet's trailing columns empty.
 */
export const LUMI_LOOP_CELLS: Record<LumiLoop, readonly number[]> = {
  breath: run(9),
  sway: run(9),
  foot: [...run(15), 6, 5, 4, 3, 2, 1],
};
/** Frames in each loop. */
export const LUMI_LOOP_FRAMES: Record<LumiLoop, number> = {
  breath: LUMI_LOOP_CELLS.breath.length,
  sway: LUMI_LOOP_CELLS.sway.length,
  foot: LUMI_LOOP_CELLS.foot.length,
};

const SHEETS = {
  head: { src: "/lumi-heads.png", cols: LUMI_EXPRESSIONS.length, rows: 1, w: 176, h: 176 },
  body: { src: "/lumi-idle.webp", cols: LUMI_IDLE_FRAMES, rows: LUMI_LOOPS.length * LUMI_EYES.length, w: 144, h: 208 },
} as const;

export type LumiCell = { sheet: keyof typeof SHEETS; col: number; row: number };

export const headCell = (expression: LumiExpression): LumiCell => ({ sheet: "head", col: LUMI_EXPRESSIONS.indexOf(expression), row: 0 });
/** One frame of a loop (0 to `LUMI_LOOP_FRAMES[loop] - 1`) with the given eye state. */
export const idleCell = (loop: LumiLoop, frame: number, eyes: LumiEyes): LumiCell => ({
  sheet: "body",
  col: LUMI_LOOP_CELLS[loop][frame],
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

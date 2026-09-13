import type { CSSProperties } from "react";

/**
 * The single source of Lumi's drawings.
 *
 * Both are cut by `scripts/cut-lumi-idle.py`.
 * - `public/lumi-heads.png` — one row of 176px square cells, the six head
 *   expressions (neutral · blink · happy · curious · excited · sleepy), each
 *   from one of the cells of `art/lumi/lumi-lantern-idle.png` (the lantern
 *   character, 2026-09-12). Used inside the round avatar.
 * - `public/lumi-idle.webp` — a 24×5 grid of 160×208 cells, one row of
 *   drawings per `LUMI_ROWS` entry with the eye rows `LUMI_ROW_EYES` gives it:
 *   rows 0–2 the nine-cell breath (the wave sheet's first cell stretched up to
 *   2px at the hood top with the feet held) with open / half-shut / shut eyes;
 *   row 3 the 24-cell wave (`art/lumi/lumi-wave.png`, 2026-09-13), eyes open;
 *   row 4 the 24-cell foot play (`art/lumi/lumi-foot-play.png`, 2026-09-13),
 *   eyes open — the wave's first cell with only the eyes and her right boot
 *   taken from that sheet. A blink during a row without eye rows shows the open
 *   cell. Every row is one drawing, so loops hand over at the rest cell without
 *   a swap.
 *
 * A loop is an order over one row's cells (`LUMI_LOOP_ROW`, `LUMI_LOOP_CELLS`),
 * so one row can play several ways; every loop starts at the rest cell and
 * ends at or next to it. A new state is a new cell or a new order, never a new
 * component.
 */
export const LUMI_EXPRESSIONS = ["neutral", "blink", "happy", "curious", "excited", "sleepy"] as const;
export const LUMI_EYES = ["open", "half", "closed"] as const;
/** The body sheet's rows of drawings, top to bottom. */
export const LUMI_ROWS = ["breath", "wave", "foot"] as const;
export const LUMI_LOOPS = ["breath", "wave", "glance", "scuff", "foot", "dawdle"] as const;
/** Columns in the body sheet — the most cells in a row. */
export const LUMI_IDLE_FRAMES = 24;

export type LumiExpression = (typeof LUMI_EXPRESSIONS)[number];
export type LumiEyes = (typeof LUMI_EYES)[number];
export type LumiRow = (typeof LUMI_ROWS)[number];
export type LumiLoop = (typeof LUMI_LOOPS)[number];

const run = (n: number) => Array.from({ length: n }, (_, i) => i);
const hold = (cell: number, n: number) => Array.from({ length: n }, () => cell);

/** The row each loop plays over. */
export const LUMI_LOOP_ROW: Record<LumiLoop, LumiRow> = {
  breath: "breath",
  wave: "wave",
  glance: "foot",
  scuff: "foot",
  foot: "foot",
  dawdle: "foot",
};

// The foot row: rest 0–1 · the eyes lower 2–3 · eyes down and still 4–7 · the boot lifts and scuffs 8–15 (out at
// 10 and 13) · the sheet's own look up 16–17 · rest 18–23. The look up replays the look down (3, then 2): the drawn
// one rose half way and held for two frames. The loop ends next to rest; the breath takes over at the rest cell.
const DOWN = [0, 2, 3];
const UP = [3, 2];
const SCUFF = [8, 9, 10, 11];
const SCUFF_AGAIN = [12, 13, 14, 15];
/**
 * Each loop as the order its row's cells play in. A cell may play more than
 * once; shorter rows leave the sheet's trailing columns empty.
 */
export const LUMI_LOOP_CELLS: Record<LumiLoop, readonly number[]> = {
  breath: run(9),
  wave: run(24), // rest 0–1 · the hand rises 2–7 · two waves 8–15 · it lowers 16–21 · rest 22–23
  glance: [...DOWN, ...hold(4, 8), ...UP], // a look at the ground, nothing more
  scuff: [...DOWN, ...hold(4, 2), ...SCUFF, ...hold(4, 2), ...UP],
  foot: [...DOWN, ...hold(4, 2), ...SCUFF, ...SCUFF_AGAIN, ...hold(4, 2), ...UP],
  dawdle: [...DOWN, ...hold(4, 2), ...SCUFF, ...SCUFF_AGAIN, ...hold(4, 3), ...SCUFF, ...hold(4, 3), ...UP],
};
/** Frames in each loop. */
export const LUMI_LOOP_FRAMES = Object.fromEntries(LUMI_LOOPS.map((loop) => [loop, LUMI_LOOP_CELLS[loop].length])) as Record<LumiLoop, number>;
/** The eye rows each row of drawings has on the body sheet, in order; an eye state a row lacks shows its open cell. */
export const LUMI_ROW_EYES: Record<LumiRow, readonly LumiEyes[]> = {
  breath: LUMI_EYES,
  wave: ["open"],
  foot: ["open"],
};
const eyeRows = (rows: readonly LumiRow[]) => rows.reduce((n, row) => n + LUMI_ROW_EYES[row].length, 0);

const SHEETS = {
  head: { src: "/lumi-heads.png", cols: LUMI_EXPRESSIONS.length, rows: 1, w: 176, h: 176 },
  body: { src: "/lumi-idle.webp", cols: LUMI_IDLE_FRAMES, rows: eyeRows(LUMI_ROWS), w: 160, h: 208 },
} as const;

export type LumiCell = { sheet: keyof typeof SHEETS; col: number; row: number };

export const headCell = (expression: LumiExpression): LumiCell => ({ sheet: "head", col: LUMI_EXPRESSIONS.indexOf(expression), row: 0 });
/** One frame of a loop (0 to `LUMI_LOOP_FRAMES[loop] - 1`) with the given eye state. */
export const idleCell = (loop: LumiLoop, frame: number, eyes: LumiEyes): LumiCell => {
  const row = LUMI_LOOP_ROW[loop];
  return {
    sheet: "body",
    col: LUMI_LOOP_CELLS[loop][frame],
    row: eyeRows(LUMI_ROWS.slice(0, LUMI_ROWS.indexOf(row))) + Math.max(0, LUMI_ROW_EYES[row].indexOf(eyes)),
  };
};

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

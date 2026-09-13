import type { CSSProperties } from "react";

/**
 * The single source of Lumi's drawings.
 *
 * Both are cut by `scripts/cut-lumi-idle.py`.
 * - `public/lumi-heads.png` — one row of 176px square cells, the six head
 *   expressions (neutral · blink · happy · curious · excited · sleepy), each
 *   from one of the cells of `art/lumi/lumi-lantern-idle.png` (the lantern
 *   character, 2026-09-12). Used inside the round avatar.
 * - `public/lumi-free.webp` — the hands-free Lumi (2026-09-13, cut by
 *   `scripts/cut-lumi-free.py`; `docs/art-direction.md` §4a): a 27×6 grid of
 *   176×208 cells. Rows 0–2 the nine-cell breath loop (the hands-free wave
 *   sheet's first cell stretched up to 2px at the hood top with the feet held)
 *   with open / half-shut / shut eyes; row 3 the 24-cell wave; row 4 the
 *   16-cell hands-together idle; row 5 the pick-up (three cells fading the
 *   book stack in, then 24 cells: reach, lift, both hands, holding). Those
 *   three have their eyes open only (`LUMI_LOOP_EYES`: a blink mid-loop shows
 *   the open cell). Every loop is held to the one rest drawing, so loops hand
 *   over at the rest cell without a swap. A loop is an order over its cells
 *   (`LUMI_LOOP_CELLS`), which is how the pick-up is also the set-down; every
 *   loop starts and ends at (or fading from) the rest cell. The lantern Lumi's
 *   body, `public/lumi-idle.webp` (`scripts/cut-lumi-idle.py`), is kept beside
 *   it for now (hands-free is settled, 2026-09-13).
 *
 * A new state is a new cell in one of these lists, never a new component.
 */
export const LUMI_EXPRESSIONS = ["neutral", "blink", "happy", "curious", "excited", "sleepy"] as const;
export const LUMI_EYES = ["open", "half", "closed"] as const;
export const LUMI_LOOPS = ["breath", "wave", "hands", "pickup"] as const;
/** Columns in the body sheet — the most cells in a loop. */
export const LUMI_IDLE_FRAMES = 27;

export type LumiExpression = (typeof LUMI_EXPRESSIONS)[number];
export type LumiEyes = (typeof LUMI_EYES)[number];
export type LumiLoop = (typeof LUMI_LOOPS)[number];

const run = (n: number) => Array.from({ length: n }, (_, i) => i);
/**
 * Each loop as the order its row's cells play in. A cell may play more than
 * once (the retired foot loop replayed its glance in reverse); shorter loops
 * leave the sheet's trailing columns empty.
 */
export const LUMI_LOOP_CELLS: Record<LumiLoop, readonly number[]> = {
  breath: run(9),
  wave: run(24), // rest 0–1 · the hand rises 2–7 · two waves 8–15 · it lowers 16–21 · rest 22–23
  hands: run(16), // rest 0 · the hands meet 1–6 · rest together 7–9 · part 10–14 · rest 15
  // the stack fades in 0–2 · rest 3–4 · reach 5–8 · lift 9–14 · both hands 15–18 · holding 19–26,
  // held a moment, then the same cells backwards: she sets it down and the stack fades out
  pickup: [...run(27), ...Array<number>(8).fill(26), ...run(27).reverse()],
};
/** Frames in each loop. */
export const LUMI_LOOP_FRAMES = Object.fromEntries(LUMI_LOOPS.map((loop) => [loop, LUMI_LOOP_CELLS[loop].length])) as Record<LumiLoop, number>;
/** The eye rows each loop has on the body sheet, in order; an eye state a loop lacks shows its open cell. */
export const LUMI_LOOP_EYES: Record<LumiLoop, readonly LumiEyes[]> = {
  breath: LUMI_EYES,
  wave: ["open"],
  hands: ["open"],
  pickup: ["open"],
};
const eyeRows = (loops: readonly LumiLoop[]) => loops.reduce((n, loop) => n + LUMI_LOOP_EYES[loop].length, 0);

const SHEETS = {
  head: { src: "/lumi-heads.png", cols: LUMI_EXPRESSIONS.length, rows: 1, w: 176, h: 176 },
  body: { src: "/lumi-free.webp", cols: LUMI_IDLE_FRAMES, rows: eyeRows(LUMI_LOOPS), w: 176, h: 208 },
} as const;

export type LumiCell = { sheet: keyof typeof SHEETS; col: number; row: number };

export const headCell = (expression: LumiExpression): LumiCell => ({ sheet: "head", col: LUMI_EXPRESSIONS.indexOf(expression), row: 0 });
/** One frame of a loop (0 to `LUMI_LOOP_FRAMES[loop] - 1`) with the given eye state. */
export const idleCell = (loop: LumiLoop, frame: number, eyes: LumiEyes): LumiCell => ({
  sheet: "body",
  col: LUMI_LOOP_CELLS[loop][frame],
  row: eyeRows(LUMI_LOOPS.slice(0, LUMI_LOOPS.indexOf(loop))) + Math.max(0, LUMI_LOOP_EYES[loop].indexOf(eyes)),
});

/** Rendered size of a cell drawn at `height` px. */
export function cellSize(sheet: keyof typeof SHEETS, height: number) {
  const s = SHEETS[sheet];
  return { width: (height * s.w) / s.h, height };
}

type Props = { cell: LumiCell; height: number; className?: string; style?: CSSProperties; mask?: boolean };

/**
 * One cell of a sheet. Decorative: the parent labels it. With `mask`, the cell
 * is the element's mask instead of its picture — her silhouette, to fill with a
 * colour (her cast shadow, the room's light on her).
 */
export function LumiSprite({ cell, height, className = "", style, mask = false }: Props) {
  const s = SHEETS[cell.sheet];
  const pct = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
  const image = `url(${s.src})`;
  const size = `${s.cols * 100}% ${s.rows * 100}%`;
  const position = `${pct(cell.col, s.cols)}% ${pct(cell.row, s.rows)}%`;
  const paint: CSSProperties = mask
    ? {
        maskImage: image,
        WebkitMaskImage: image,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: size,
        WebkitMaskSize: size,
        maskPosition: position,
        WebkitMaskPosition: position,
      }
    : { backgroundImage: image, backgroundRepeat: "no-repeat", backgroundSize: size, backgroundPosition: position };
  return <span aria-hidden className={`block ${className}`} style={{ ...cellSize(cell.sheet, height), ...paint, ...style }} />;
}

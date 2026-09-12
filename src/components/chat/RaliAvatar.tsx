/**
 * Rali's avatar: the hooded figure from the character sheet (`mockups/rali.png`),
 * cropped into `public/rali-sprites.png` — one row of eight 176px cells, in the
 * order below. The figure sits in the forest circle from the sheet's icon.
 *
 * States are props, not new drawings. Deterministic surfaces (greeting, check-ins)
 * pick an expression; conversation turns will pick one from M2.
 */
export const RALI_EXPRESSIONS = [
  "neutral",
  "happy",
  "thinking",
  "excited",
  "curious",
  "focused",
  "supportive",
  "playful",
] as const;

export type RaliExpression = (typeof RALI_EXPRESSIONS)[number];

type Props = { size?: number; expression?: RaliExpression; className?: string };

const CELLS = RALI_EXPRESSIONS.length;

export function RaliAvatar({ size = 68, expression = "neutral", className = "" }: Props) {
  const index = RALI_EXPRESSIONS.indexOf(expression);
  // The figure fills ~70% of its cell, bottom-anchored; scale the cell up so she
  // fills the circle, and nudge her down a touch so the hood's peak clears the rim.
  const cell = size * 1.06;
  const offsetX = (size - cell) / 2;
  const offsetY = (size - cell) / 2 + size * 0.03;

  return (
    <span
      role="img"
      aria-label={`Rali, ${expression}`}
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-forest ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute block"
        style={{
          width: cell,
          height: cell,
          left: offsetX,
          top: offsetY,
          backgroundImage: "url(/rali-sprites.png)",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${CELLS * 100}% 100%`,
          backgroundPosition: `${(index / (CELLS - 1)) * 100}% 0`,
        }}
      />
    </span>
  );
}

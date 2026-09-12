import { LumiSprite, headCell, type LumiExpression } from "./LumiSprite";

export { LUMI_EXPRESSIONS, type LumiExpression } from "./LumiSprite";

type Props = { size?: number; expression?: LumiExpression; className?: string };

/**
 * Lumi's avatar beside her lines: the hooded head in the forest circle.
 * States are props, not new drawings.
 */
export function LumiAvatar({ size = 68, expression = "neutral", className = "" }: Props) {
  // Heads are wider than tall and sit low in their square cell; draw the cell a
  // touch smaller than the circle and lift it so the face is centred.
  const cell = size * 0.88;
  return (
    <span
      role="img"
      aria-label={`Lumi, ${expression}`}
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-forest ${className}`}
      style={{ width: size, height: size }}
    >
      <LumiSprite
        cell={headCell(expression)}
        height={cell}
        className="absolute"
        style={{ left: (size - cell) / 2, top: (size - cell) / 2 - cell * 0.03 }}
      />
    </span>
  );
}

type Props = { size?: number; className?: string };

/**
 * Rali's avatar. M0: a brass monogram on the dark circle from the mockup.
 * Later: the hooded figure with eye states (thinking, focused, amused, waiting…).
 */
export function RaliAvatar({ size = 68, className = "" }: Props) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-forest ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="font-display select-none text-brass-soft" style={{ fontSize: size * 0.5, lineHeight: 1, transform: "translateY(-1px)" }}>
        R
      </span>
    </span>
  );
}

type Props = { size?: number; className?: string };

/**
 * Lumi's avatar beside her lines: her painted medallion (`art/lumi/avatar.png`,
 * cut to the circle by `scripts/cut-lumi-avatar.py`). One drawing, no
 * expressions yet.
 */
export function LumiAvatar({ size = 68, className = "" }: Props) {
  return (
    <span
      role="img"
      aria-label="Lumi"
      className={`inline-block shrink-0 rounded-full bg-cover bg-center ${className}`}
      style={{ width: size, height: size, backgroundImage: "url(/lumi-avatar.webp)" }}
    />
  );
}

type Props = { size?: number; className?: string };

/**
 * Lumi's avatar beside her lines: the hooded head on the forest circle.
 *
 * One drawing — `public/lumi-avatar.webp`, cut from `art/lumi/lumi-avatar-head.png`
 * by `scripts/cut-lumi-avatar.py` (2026-09-15), in the medallion costume the Lumi
 * in the corner wears. The framing lives in the cut: a square cell drawn at the
 * circle's full size, the hood centred with a margin of forest either side and the
 * ribbon's medallions running off the bottom, where the circle crops them.
 */
export function LumiAvatar({ size = 68, className = "" }: Props) {
  return (
    <span
      role="img"
      aria-label="Lumi"
      className={`inline-block shrink-0 rounded-full bg-forest bg-cover bg-center ${className}`}
      style={{ width: size, height: size, backgroundImage: "url(/lumi-avatar.webp)" }}
    />
  );
}

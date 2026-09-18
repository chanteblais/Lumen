type Props = { size?: number; className?: string };

/**
 * Lumi's avatar beside her lines: just her hooded head, nothing behind it.
 *
 * One drawing — `public/lumi-avatar.webp`, cut from `art/lumi/lumi-avatar-head.png`
 * by `scripts/cut-lumi-avatar.py`, in the medallion costume the Lumi in the corner
 * wears. The cut trims the whole drawing (hood, ribbon and medallions) and fits it
 * in a square on transparency, so the page shows around her (2026-09-18: no disc).
 */
export function LumiAvatar({ size = 68, className = "" }: Props) {
  return (
    <span
      role="img"
      aria-label="Lumi"
      className={`inline-block shrink-0 bg-contain bg-center bg-no-repeat ${className}`}
      style={{ width: size, height: size, backgroundImage: "url(/lumi-avatar.webp)" }}
    />
  );
}

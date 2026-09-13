/**
 * The rail's icons, one line icon per place. Inline SVG, `currentColor`, round
 * caps (design-system → Icons); each sits on the rail beside its name on the
 * parchment. The compass star and the moon are painted into the rail itself.
 */

type IconProps = { className?: string };

function Glyph({ children, size = 24, className = "" }: IconProps & { children: React.ReactNode; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [(12 + r * Math.cos(a)).toFixed(2), (12 + r * Math.sin(a)).toFixed(2)] as const;
};

export function HomeIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.4V20h4.4v-5.4h3.2V20H18V9.4" />
    </Glyph>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="3.6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const [x1, y1] = at(6.4, deg);
        const [x2, y2] = at(8.9, deg);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </Glyph>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M12 6.6C10 5.1 7 4.6 3.5 5v13.2c3.5-.4 6.5.1 8.5 1.6 2-1.5 5-2 8.5-1.6V5C17 4.6 14 5.1 12 6.6Z" />
      <path d="M12 6.6v13.2" />
    </Glyph>
  );
}

export function SprigIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M12 21V7.5" />
      <path d="M12 12.6c-3.4 0-5.6-2-6.1-5.1 3.3 0 5.5 1.9 6.1 5.1Z" />
      <path d="M12 16.4c3.4 0 5.6-2 6.1-5.1-3.3 0-5.5 1.9-6.1 5.1Z" />
      <path d="M12 7.5c-1.5-1.1-1.5-3.6 0-4.8 1.5 1.2 1.5 3.7 0 4.8Z" />
    </Glyph>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="12" cy="12" r="6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const [x1, y1] = at(6.6, deg);
        const [x2, y2] = at(8.4, deg);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2.4} />;
      })}
    </Glyph>
  );
}

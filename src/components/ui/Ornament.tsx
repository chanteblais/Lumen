/**
 * Printer's ornaments — the engraved marks an old book decorates with. They are
 * not icons and never stand in for one (the nav's places have line icons).
 * All inline SVG in brass, hairline weight, `aria-hidden`: they decorate, they
 * never carry meaning. One flourish per surface.
 */

type GlyphProps = { size?: number; className?: string };

/** ✦ A four-pointed star with drawn-in sides. The smallest mark we have. */
export function Diamond({ size = 9, className = "" }: GlyphProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className={`ornament ${className}`}>
      <path d="M8 1C8 5.4 10.6 8 15 8C10.6 8 8 10.6 8 15C8 10.6 5.4 8 1 8C5.4 8 8 5.4 8 1Z" fill="currentColor" />
    </svg>
  );
}

/** ✧ A slender four-pointed star, its upright arms longer than its cross — the nav's parchment marks (after `art/mockups/rail-nav.png`). */
export function Sparkle({ size = 12, className = "" }: GlyphProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className={`ornament ${className}`}>
      <path d="M8 0Q8.7 7.3 14.5 8Q8.7 8.7 8 16Q7.3 8.7 1.5 8Q7.3 7.3 8 0Z" fill="currentColor" />
    </svg>
  );
}

/** Hairline · sparkle · hairline, the hairlines fading toward their ends. The nav's parchment divider. */
export function Flourish({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`flourish ${className}`}>
      <i className="hair" />
      <Sparkle />
      <i className="hair" />
    </span>
  );
}

/** ❦ The hedera — the ivy leaf that has closed chapters since Rome. */
export function Fleuron({ size = 18, className = "" }: GlyphProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={`ornament ${className}`}>
      {/* leaf: two lobes, a long tip */}
      <path
        d="M10.5 9.4C9.6 7.2 7.2 6.4 5.6 7.8 3.8 9.4 4.4 12.4 6.6 14.6 8.4 16.4 9.9 18.6 10.5 22.4 11.1 18.6 12.6 16.4 14.4 14.6 16.6 12.4 17.2 9.4 15.4 7.8 13.8 6.4 11.4 7.2 10.5 9.4Z"
        fill="currentColor"
      />
      {/* vein, in the paper's colour */}
      <path d="M10.5 10.6V19.4" fill="none" stroke="var(--paper)" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
      {/* stem, curling away */}
      <path d="M10.5 9.4C11 5.8 13 3 17.4 1.8C18.9 1.4 19.6 2.6 18.6 3.4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** ⁂ Three stars — the mark for a pause in the text. */
export function Asterism({ size = 16, className = "" }: GlyphProps) {
  const star = "M0-5.5C0-2.2 2.2 0 5.5 0 2.2 0 0 2.2 0 5.5 0 2.2-2.2 0-5.5 0-2.2 0 0-2.2 0-5.5Z";
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={`ornament ${className}`} fill="currentColor">
      <path d={star} transform="translate(12 6.5)" />
      <path d={star} transform="translate(6.5 16)" />
      <path d={star} transform="translate(17.5 16)" />
    </svg>
  );
}

/** Hairline · diamond · hairline. Replaces the short rule under every kicker. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`divider ${className}`}>
      <i className="hair" />
      <Diamond />
      <i className="hair" />
    </span>
  );
}

/** The tailpiece that closes a page with nothing more to say. */
export function Tailpiece({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`tailpiece ${className}`}>
      <i className="hair" />
      <Fleuron />
      <i className="hair" />
    </div>
  );
}

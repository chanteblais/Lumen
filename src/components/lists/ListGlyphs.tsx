/**
 * The Lists sheet's small line icons, in the rail icons' hand (NavIcons →
 * Glyph: inline SVG, `currentColor`, round caps). Each sits beside a word;
 * none stands alone without an accessible name.
 */
import { Glyph } from "@/components/shell/NavIcons";

type P = { className?: string; size?: number };

export function AllGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </Glyph>
  );
}

function SchoolGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
      <path d="M6.5 11.6v4.1c1.6 1.4 3.5 2 5.5 2s3.9-.6 5.5-2v-4.1" />
      <path d="M21.5 9.5v5" />
    </Glyph>
  );
}

function WorkGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V5.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3v1.7" />
      <path d="M3.5 12.5h17" />
    </Glyph>
  );
}

function PersonalGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M5 19c0-8 5-13.5 14.5-14-.3 9.5-5.8 14.5-14 14Z" />
      <path d="M5 19l8-8" />
    </Glyph>
  );
}

function LaterGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M7 3.5h10M7 20.5h10" />
      <path d="M8 3.5c0 4 4 5.5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5.5-4 8.5s4 4.5 4 8.5" />
    </Glyph>
  );
}

function ShelfGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M7 3.5h10v17l-5-3.8-5 3.8v-17Z" />
    </Glyph>
  );
}

/** A list's icon by its name: the four default lists have their own; any other list is a bookmark. */
export function ListNameGlyph({ name, className, size }: P & { name: string }) {
  const Icon = { school: SchoolGlyph, work: WorkGlyph, personal: PersonalGlyph, later: LaterGlyph }[name.toLowerCase()] ?? ShelfGlyph;
  return <Icon className={className} size={size} />;
}

export function DoneGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Glyph>
  );
}

export function TodayGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <circle cx="12" cy="14.6" r="1.6" />
    </Glyph>
  );
}

export function SoonGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M7.5 14.5h.01M12 14.5h.01M16.5 14.5h.01" strokeWidth={2.4} />
    </Glyph>
  );
}

export function SearchGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </Glyph>
  );
}

export function PlusGlyph({ className, size = 18 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

export function CloseGlyph({ className, size = 20 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Glyph>
  );
}

export function MoreGlyph({ className, size = 20 }: P) {
  return (
    <Glyph size={size} className={className}>
      <path d="M5.5 12h.01M12 12h.01M18.5 12h.01" strokeWidth={2.8} />
    </Glyph>
  );
}

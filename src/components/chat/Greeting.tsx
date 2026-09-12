import { Asterism } from "@/components/ui/Ornament";
import { LumiAvatar } from "./LumiAvatar";
import { QuickStarts } from "./QuickStarts";

type Props = { lines: string[]; onQuickStart?: (text: string) => void; compact?: boolean };

/**
 * The greeting as a chapter opening, set on the paper itself the way a chapter
 * begins in a book: a headpiece across the measure (hairline · asterism ·
 * hairline), Lumi's portrait in the margin, the first line as the title, the
 * second beneath it in the softer ink, then the quick starts. No box — the
 * ornament and the white space are the break between what was there and this
 * visit. Lines come from core/ai/greeting.ts; never hardcode copy here.
 */
export function Greeting({ lines, onQuickStart, compact = false }: Props) {
  const [title, ...rest] = lines;
  return (
    <section className={`opening${compact ? " is-compact" : ""}`} aria-label="Lumi">
      <div className="opening-head" aria-hidden>
        <i className="hair" />
        <Asterism size={compact ? 14 : 18} />
        <i className="hair" />
      </div>
      <div className="opening-body">
        <LumiAvatar className="medallion opening-portrait" size={compact ? 44 : 64} />
        <div className="min-w-0 flex-1">
          <p className="opening-title">{title}</p>
          {rest.map((line, i) => (
            <p key={i} className="opening-line">
              {line}
            </p>
          ))}
          {!compact && <QuickStarts onPick={onQuickStart} />}
        </div>
      </div>
    </section>
  );
}

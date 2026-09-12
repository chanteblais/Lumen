import { LumiAvatar } from "./LumiAvatar";
import { QuickStarts } from "./QuickStarts";

type Props = { lines: string[]; onQuickStart?: (text: string) => void; compact?: boolean };

export function GreetingCard({ lines, onQuickStart, compact = false }: Props) {
  return (
    <section className={`card plate px-8 sm:px-10 ${compact ? "py-6 sm:py-7" : "py-8 sm:py-9"}`} aria-label="Lumi">
      <div className="flex gap-7 sm:gap-10">
        <LumiAvatar className="medallion mt-1" size={compact ? 48 : 68} />
        <div className="min-w-0 flex-1">
          {lines.map((line, i) => (
            <p key={i} className={`font-display leading-[1.35] text-ink ${compact ? "text-[22px] sm:text-[24px]" : "text-[26px] sm:text-[30px]"} ${i === 0 ? "" : compact ? "mt-2" : "mt-6"}`}>
              {line}
            </p>
          ))}
          {!compact && <QuickStarts onPick={onQuickStart} />}
        </div>
      </div>
    </section>
  );
}

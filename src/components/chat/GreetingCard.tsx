import { RaliAvatar } from "./RaliAvatar";
import { QuickStarts } from "./QuickStarts";

type Props = { lines: string[] };

export function GreetingCard({ lines }: Props) {
  return (
    <section className="card px-8 py-8 sm:px-10 sm:py-9" aria-label="Rali">
      <div className="flex gap-7 sm:gap-10">
        <RaliAvatar className="mt-1" />
        <div className="min-w-0 flex-1">
          {lines.map((line, i) => (
            <p key={i} className={`font-display text-[26px] leading-[1.35] text-ink sm:text-[30px] ${i === 0 ? "" : "mt-6"}`}>
              {line}
            </p>
          ))}
          <QuickStarts />
        </div>
      </div>
    </section>
  );
}

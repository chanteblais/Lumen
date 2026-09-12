import { LumiAvatar } from "@/components/chat/LumiAvatar";
import { Tailpiece } from "@/components/ui/Ornament";
import { listSuggestedLeads } from "@/core/domain/leads";
import { ensureFreshMailScan } from "@/core/email/scan";
import type { EmailReader } from "@/core/email/types";
import { INSIGHTS_LINES, leadMetaLine, lookedLine } from "@/core/insights";
import { db } from "@/db/client";
import type { User } from "@/db/schema";
import { ConnectMail } from "@/lib/auth-mail";
import { LeadActions } from "./LeadActions";

/**
 * Looks through the mail if the last look is stale (a Gmail read plus one
 * model call — seconds, streamed under Suspense), then asks the one question.
 * Never a count; a lead is gone once answered.
 */
export async function LeadsSection({ user, reader }: { user: User; reader: EmailReader }) {
  const outcome = await ensureFreshMailScan(db(), user, reader);
  if (outcome.status === "disconnected") {
    return (
      <Opener line={INSIGHTS_LINES.disconnected}>
        <div className="mt-7">
          <ConnectMail />
        </div>
      </Opener>
    );
  }
  const now = new Date();
  const suggested = await listSuggestedLeads(db(), user.id);

  return (
    <>
      <Opener line={suggested.length ? INSIGHTS_LINES.question : INSIGHTS_LINES.nothing}>
        <p className="label label-mute mt-3">{lookedLine(outcome.scan.at, now)}</p>
      </Opener>
      {suggested.length ? (
        <ul className="mt-10 flex flex-col gap-5" aria-label="From your mail">
          {suggested.map((l) => (
            <li key={l.id} className="card px-7 py-6 sm:px-9 sm:py-7">
              <p className="font-display text-[26px] leading-[1.2] text-ink sm:text-[28px]">{l.title}</p>
              {l.why && <p className="mt-2 text-[17px] leading-snug text-ink-soft">{l.why}</p>}
              <p className="label label-mute mt-4">
                {leadMetaLine(l, now)}
                {l.dueAt ? ` · ${fmtDue(l.dueAt, user.timezone)}` : ""}
              </p>
              <LeadActions id={l.id} title={l.title} />
            </li>
          ))}
        </ul>
      ) : (
        <Tailpiece className="mt-14" />
      )}
    </>
  );
}

export function Opener({ line, children }: { line: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6">
      <LumiAvatar size={48} className="medallion mt-1" />
      <div className="min-w-0">
        <h1 className="font-display text-[30px] leading-[1.2] text-ink sm:text-[36px]">{line}</h1>
        {children}
      </div>
    </div>
  );
}

function fmtDue(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "short", day: "numeric" }).format(d);
}

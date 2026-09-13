import type { Metadata } from "next";
import { Suspense } from "react";
import { LeadsSection, Opener } from "@/components/insights/LeadsSection";
import { Divider } from "@/components/ui/Ornament";
import { INSIGHTS_LINES } from "@/core/insights";
import { requireVisit } from "@/lib/auth";
import { ConnectMail } from "@/lib/auth-mail";
import { mailAccessFor } from "@/lib/email";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Insights" };

/**
 * Insights: what Lumi noticed in the mail that might need doing, and one
 * question — do any of these still need doing? Not an inbox, not a feed.
 * docs/features.md → Insights.
 */
export default async function InsightsPage() {
  const { user } = await requireVisit();
  const access = await mailAccessFor(user);

  return (
    <div className="mx-auto w-full max-w-[880px] px-1 pb-14">
      <p className="label">Insights</p>
      <div className="my-4">
        <Divider />
      </div>

      {access.status === "ready" ? (
        <Suspense fallback={<Opener line={INSIGHTS_LINES.reading} />}>
          <LeadsSection user={user} reader={access.reader} />
        </Suspense>
      ) : (
        <Opener line={access.status === "needs_scope" ? INSIGHTS_LINES.needsScope : INSIGHTS_LINES.notConnected}>
          <p className="mt-3 text-[17px] leading-snug text-ink-soft">{INSIGHTS_LINES.notConnectedAside}</p>
          <div className="mt-7">
            <ConnectMail label={access.status === "needs_scope" ? "Allow mail" : "Connect Google"} />
          </div>
        </Opener>
      )}
    </div>
  );
}

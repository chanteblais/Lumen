"use client";

// The one control that connects mail: Google through Clerk, asking for the
// read-only Gmail scope. Part of the auth boundary (imports Clerk); the page
// just places the chip. After Google, Clerk sends the browser back to `returnTo`.
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { GMAIL_READONLY_SCOPE } from "@/core/email/types";

type Props = { label?: string; returnTo?: string };

export function ConnectMail({ label = "Connect Google", returnTo = "/insights" }: Props) {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  const go = async () => {
    if (!user || state === "busy") return;
    setState("busy");
    try {
      const redirectUrl = new URL(returnTo, window.location.origin).toString();
      const google = user.externalAccounts.find((a) => a.provider === "google");
      const account = google
        ? await google.reauthorize({ additionalScopes: [GMAIL_READONLY_SCOPE], redirectUrl })
        : await user.createExternalAccount({ strategy: "oauth_google", additionalScopes: [GMAIL_READONLY_SCOPE], redirectUrl });
      const url = account.verification?.externalVerificationRedirectURL;
      if (!url) throw new Error("Clerk returned no redirect for the Google connection");
      window.location.assign(url.toString());
    } catch (e) {
      console.warn("[mail] connect failed", e);
      setState("failed");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <button type="button" className="chip" onClick={go} disabled={!isLoaded || state === "busy"}>
        {state === "busy" ? "Opening Google…" : label}
      </button>
      {state === "failed" && <p className="text-[15px] text-ink-mute">That didn&rsquo;t open. Try once more in a moment.</p>}
    </div>
  );
}

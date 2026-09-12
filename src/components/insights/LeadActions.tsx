"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; title: string };

/** The two answers to "does this still need doing?" — keep it (it becomes an intention) or let it go. Nothing else is asked. */
export function LeadActions({ id, title }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "kept" | "gone">("idle");

  const act = async (action: "keep" | "dismiss") => {
    if (state !== "idle") return;
    setState("busy");
    try {
      const r = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      if (!r.ok) {
        setState("idle");
        return;
      }
      setState(action === "keep" ? "kept" : "gone");
      router.refresh();
    } catch {
      setState("idle");
    }
  };

  if (state === "kept" || state === "gone") {
    return (
      <p className="mt-5 text-[14px] tracking-[0.02em] text-ink-mute" aria-live="polite">
        <span className="ledger-mark">✦</span>
        {state === "kept" ? "On your list." : "Let go."}
      </p>
    );
  }
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3" role="group" aria-label={`Still needs doing: ${title}`}>
      <button type="button" className="chip" disabled={state === "busy"} onClick={() => act("keep")}>
        Still needs doing
      </button>
      <button type="button" className="tool-link ml-1" disabled={state === "busy"} onClick={() => act("dismiss")}>
        Let it go
      </button>
    </div>
  );
}

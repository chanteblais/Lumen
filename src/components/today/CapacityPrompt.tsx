"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CapacityLevel } from "@/core/domain/capacity";

const ANSWERS: { level: CapacityLevel; label: string }[] = [
  { level: "low", label: "Not much" },
  { level: "normal", label: "Normal-ish" },
  { level: "high", label: "Lots" },
];

/**
 * "How much have we got today?" — asked at most once a day, skippable, never
 * blocking. Answering re-cuts the path; the page refreshes with the new one.
 * Capacity is context Lumi uses, not a metric the user tracks. docs/today.md → Anatomy.
 */
export function CapacityPrompt() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "answering" | "skipping" | "failed">("idle");

  const post = async (body: { level: CapacityLevel } | { skip: true }, next: "answering" | "skipping") => {
    setState(next);
    try {
      const r = await fetch("/api/capacity", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(String(r.status));
      router.refresh();
    } catch {
      setState("failed");
    }
  };

  if (state === "answering") {
    return <p className="font-display text-[22px] italic leading-[1.3] text-ink-mute">Shaping the day around that…</p>;
  }

  const busy = state === "skipping";
  return (
    <section aria-label="Capacity" className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <p className="font-display text-[22px] leading-[1.3] text-ink-soft">{state === "failed" ? "That didn't take. Once more?" : "How much have we got today?"}</p>
      <div className="flex flex-wrap items-center gap-2">
        {ANSWERS.map((a) => (
          <button key={a.level} type="button" className="chip" disabled={busy} onClick={() => post({ level: a.level }, "answering")}>
            {a.label}
          </button>
        ))}
        <button type="button" className="tool-link ml-1" disabled={busy} onClick={() => post({ skip: true }, "skipping")}>
          Skip
        </button>
      </div>
    </section>
  );
}

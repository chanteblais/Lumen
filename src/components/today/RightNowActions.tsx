"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DECLINE_PROMPT, DECLINE_REASONS, type DeclineReason } from "@/core/declines";

type Props = { id: string; title: string };

/**
 * The Right now card's controls. "Not this" opens the six quick answers in
 * place — Lumi's question is deterministic, no model call — and the answer
 * hands off into Chat as one visible message carrying the reason. Resistance
 * adapts the plan; it is never recorded as failure. docs/today.md → Principles (5).
 */
export function RightNowActions({ id, title }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<DeclineReason | null>(null);

  if (open) {
    return (
      <div className="mt-8" role="group" aria-label={`Not this: ${title}`}>
        <p className="font-display text-[22px] leading-[1.3] text-ink">{DECLINE_PROMPT}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(Object.entries(DECLINE_REASONS) as [DeclineReason, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="chip"
              disabled={picked !== null}
              aria-pressed={picked === key}
              onClick={() => {
                setPicked(key);
                router.push(`/?decline=${id}&reason=${key}`);
              }}
            >
              {label}
            </button>
          ))}
          <button type="button" className="tool-link ml-1" disabled={picked !== null} onClick={() => setOpen(false)}>
            Keep it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Link href={{ pathname: "/", query: { start: id } }} className="btn-primary">
        Start with Lumi
      </Link>
      <button type="button" className="btn-ghost cursor-pointer" onClick={() => setOpen(true)}>
        Not this
      </button>
      <Link href={{ pathname: "/", query: { breakdown: id } }} className="tool-link ml-2">
        Break it down
      </Link>
    </div>
  );
}

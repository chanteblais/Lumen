"use client";

import { ledgerLines, type LedgerToolPart } from "@/core/ai/ledger";
import type { CoherenceUIMessage } from "@/core/domain/conversations";

/** Quiet record of what Lumi did during a reply. Rendered from tool parts (`core/ai/ledger.ts`); never from prose. */
export function Ledger({ message }: { message: CoherenceUIMessage }) {
  const lines = ledgerLines(message.parts as LedgerToolPart[]);
  if (lines.length === 0) return null;
  return (
    <ul className="ledger" aria-label="What Lumi did">
      {lines.map((l, i) => (
        <li key={i}>
          <span className="ledger-mark">✦</span>
          {l}
        </li>
      ))}
    </ul>
  );
}

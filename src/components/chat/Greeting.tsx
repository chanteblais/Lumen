"use client";

import { useId, useState } from "react";
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
 *
 * On Home it hangs as a scroll, and its bottom rod is a button: tap it and the
 * scroll rolls up to the title line between its rods; tap again to unroll.
 * Rolled lasts for this page open only — the next visit opens unrolled, so
 * there is nothing to remember or put back.
 */
export function Greeting({ lines, onQuickStart, compact = false }: Props) {
  const [title, ...rest] = lines;
  const [rolled, setRolled] = useState(false);
  const sheetId = useId();
  return (
    <section className={`opening${compact ? " is-compact" : ""}${rolled ? " is-rolled" : ""}`} aria-label="Lumi">
      <div className="opening-roll">
        <div className="opening-sheet" id={sheetId} inert={rolled}>
          <div className="opening-head" aria-hidden>
            <i className="hair" />
            <Asterism size={compact ? 14 : 18} />
            <i className="hair" />
          </div>
          <div className="opening-body">
            <LumiAvatar className="opening-portrait" size={compact ? 44 : 64} />
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
        </div>
      </div>
      <p className="opening-rolled" aria-hidden={!rolled}>
        {title}
      </p>
      <button
        type="button"
        className="opening-rod"
        aria-expanded={!rolled}
        aria-controls={sheetId}
        aria-label={rolled ? "Unroll the greeting" : "Roll up the greeting"}
        title={rolled ? "Unroll" : "Roll up"}
        onClick={() => setRolled((r) => !r)}
      />
    </section>
  );
}

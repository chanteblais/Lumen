"use client";

import type { LumenUIMessage } from "@/core/domain/conversations";

type ToolPart = { type: string; state?: string; input?: unknown; output?: unknown };

function line(p: ToolPart): string | null {
  if (p.state !== "output-available") return null;
  const out = (p.output ?? {}) as Record<string, unknown>;
  if (out.error) return null;
  const inp = (p.input ?? {}) as Record<string, unknown>;
  switch (p.type) {
    case "tool-create_intention":
      return `Noted · ${out.title ?? inp.title}${out.list ? ` · ${out.list}` : ""}`;
    case "tool-update_intention":
      return `Updated · ${out.title ?? ""}`;
    case "tool-complete_intention":
      return `Done · ${out.title ?? ""}`;
    case "tool-reopen_intention":
      return `Back on the list · ${out.title ?? ""}`;
    case "tool-drop_intention":
      return `Let go · ${out.title ?? ""}`;
    case "tool-report_capacity":
      return `Today · ${out.level === "low" ? "not much" : out.level === "high" ? "lots" : "normal-ish"}`;
    case "tool-reshape_today":
      return `Reshaped Today · ${String(out.ask ?? inp.ask ?? "").slice(0, 60)}`;
    case "tool-remember":
      return `Remembered · ${String(out.content ?? inp.content ?? "").slice(0, 90)}`;
    case "tool-confirm_belief":
      return "Noted · that held up";
    case "tool-contradict_belief":
      return "Noted · that didn't hold";
    case "tool-revise_belief":
      return "Reworded something I know";
    case "tool-forget_belief":
      return "Forgotten";
    case "tool-look_at_email":
      return "Looked through your mail";
    case "tool-keep_lead":
      return `Noted · ${out.title ?? ""}`;
    case "tool-dismiss_lead":
      return `Let go · ${out.title ?? ""}`;
    default:
      return null;
  }
}

/** Quiet record of what Lumi did during a reply. Rendered from tool parts; never from prose. */
export function Ledger({ message }: { message: LumenUIMessage }) {
  const lines = message.parts.map((p) => line(p as ToolPart)).filter((l): l is string => Boolean(l));
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

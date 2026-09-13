/**
 * The ledger: the quiet record under a reply of what Lumi did, one line per
 * tool write. Derived from the message's tool parts, never from prose
 * (architecture → the model writes only via tools).
 *
 * Two kinds of update are folded away so the ledger says what happened to the
 * user, not what the model did: an update that changed nothing (`changed: []`
 * from the tool — nothing was written), and an update to a thing created in
 * the same reply, which the *Noted* line already covers (2026-09-13: "Noted ·
 * Call Kendra" then "Updated · Call Kendra" for one thing, when the model
 * filled a due date it then took back).
 */
export type LedgerToolPart = { type: string; state?: string; input?: unknown; output?: unknown };

function line(p: LedgerToolPart): string | null {
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
    case "tool-start_focus_session":
      return `Together · ${out.goal ?? inp.goal ?? ""}${out.plannedMinutes ? ` · ${out.plannedMinutes} min` : ""}`;
    case "tool-end_focus_session":
      return `Session closed · ${out.goal ?? ""}`;
    case "tool-reshape_today":
      return `Reshaped Today · ${String(out.ask ?? inp.ask ?? "").slice(0, 60)}`;
    case "tool-remember":
      if (out.already_held) return null;
      return `${out.held_as === "your guess" ? "Noticed" : "Remembered"} · ${String(out.content ?? inp.content ?? "").slice(0, 90)}`;
    case "tool-correct_belief":
      return `Corrected · ${String(out.content ?? inp.content ?? "").slice(0, 90)}`;
    case "tool-add_to_library":
      if (out.already_held) return null;
      return `Kept for ${String(out.thread ?? "the Library")} · ${String(out.content ?? inp.content ?? "").slice(0, 80)}`;
    case "tool-forget_from_library":
      return "Forgotten";
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

/** An update the ledger has nothing to say about: it wrote nothing, or it touched a thing this reply already noted. */
function silentUpdate(p: LedgerToolPart, createdHere: Set<unknown>): boolean {
  if (p.type !== "tool-update_intention") return false;
  const out = (p.output ?? {}) as Record<string, unknown>;
  if (Array.isArray(out.changed) && out.changed.length === 0) return true;
  return createdHere.has(out.id ?? (p.input as Record<string, unknown> | undefined)?.id);
}

/** The ledger lines for one reply's parts, in order. */
export function ledgerLines(parts: readonly LedgerToolPart[]): string[] {
  const createdHere = new Set<unknown>();
  for (const p of parts) {
    if (p.type !== "tool-create_intention" || p.state !== "output-available") continue;
    const id = (p.output as Record<string, unknown> | undefined)?.id;
    if (id) createdHere.add(id);
  }
  const out: string[] = [];
  for (const p of parts) {
    if (silentUpdate(p, createdHere)) continue;
    const l = line(p);
    if (l) out.push(l);
  }
  return out;
}

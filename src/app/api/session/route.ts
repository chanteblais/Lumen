import { recordCheckIn } from "@/core/domain/sessions";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

/**
 * A check-in tick that needs no reply: "Yep" on *Still with it?*. Writes
 * `session.check_in {response: ok, minute}` and nothing else — no model
 * call, no message. The other answers go through `/api/chat` as a
 * `session_event` message, because Lumi answers them.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; response?: unknown };
  if (typeof body.id !== "string" || body.response !== "ok") {
    return Response.json({ error: "id and response: ok required" }, { status: 400 });
  }
  const s = await recordCheckIn(db(), user.id, body.id, "ok");
  // `ended` tells the client the session it thinks is running has since closed (swept as abandoned, or ended elsewhere).
  return Response.json(s ? { ok: true } : { ok: false, ended: true });
}

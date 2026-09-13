import { z } from "zod";
import { recordCheckIn } from "@/core/domain/sessions";
import { idSchema } from "@/core/ids";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { readBody } from "@/lib/http";

const Body = z.object({ id: idSchema, response: z.literal("ok") });

/**
 * A check-in tick that needs no reply: "Yep" on *Still with it?*. Writes
 * `session.check_in {response: ok, minute}` and nothing else — no model
 * call, no message. The other answers go through `/api/chat` as a
 * `session_event` message, because Lumi answers them.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const { data: body, error } = await readBody(req, Body, "id and response: ok required");
  if (error) return error;
  const s = await recordCheckIn(db(), user.id, body.id, "ok");
  // `ended` tells the client the session it thinks is running has since closed (swept as abandoned, or ended elsewhere).
  return Response.json(s ? { ok: true } : { ok: false, ended: true });
}

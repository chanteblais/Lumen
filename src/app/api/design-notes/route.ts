import { isDesignPartner, listDesignContributions, listDesignHistory } from "@/core/domain/design-contributions";
import { listDesignDigests, renderDesignDigests, renderDesignNotebook } from "@/core/domain/design-digest";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

/**
 * Lumi's design notebook, readable as plain text (markdown): the last week of design
 * digests by default, or `?view=notebook` for every note as it stands with its
 * history. Design partners only — anyone else gets a 404, as if it weren't there.
 * Read-only: feedback happens in conversation with Lumi, never here.
 */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!isDesignPartner(user)) return new Response("Not found", { status: 404 });
  let body: string;
  if (new URL(req.url).searchParams.get("view") === "notebook") {
    const [contributions, history] = await Promise.all([listDesignContributions(db(), user.id), listDesignHistory(db(), user.id)]);
    body = renderDesignNotebook(contributions, history, user.timezone);
  } else {
    body = renderDesignDigests(await listDesignDigests(db(), user.id, 7));
  }
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

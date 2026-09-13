/**
 * Reading a route's JSON body against a schema: a body that isn't JSON, or
 * doesn't fit, is a 400 with the route's own message — never a 500 from a
 * cast that lied.
 */
import type { z } from "zod";

type Parsed<T> = { data: T; error?: undefined } | { data?: undefined; error: Response };

export async function readBody<T>(req: Request, schema: z.ZodType<T>, message: string): Promise<Parsed<T>> {
  const raw: unknown = await req.json().catch(() => undefined);
  const r = schema.safeParse(raw);
  return r.success ? { data: r.data } : { error: badRequest(message) };
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

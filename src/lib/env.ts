/**
 * The server's environment, checked once when a server starts
 * (`src/instrumentation.ts` → `register()`, Node.js runtime only). Messages name
 * keys, never values.
 *
 * Required and optional follow what the code does without each key:
 * - Clerk's two keys: `clerkMiddleware` (src/proxy.ts) fails every request.
 * - `DATABASE_URL`: `db()` throws at the first query (src/db/client.ts).
 * - Lumi's model key follows `LUMI_MODEL` (src/core/ai/model.ts): OpenAI's
 *   unless it names Anthropic. `LUMI_MODEL` itself is optional (unset or empty
 *   means `openai:gpt-6-astra`) and must read `openai:<model>` or `anthropic:<model>`.
 * - The Clerk sign-in/up URL keys are optional: without them `auth.protect()`
 *   sends a visitor to Clerk's hosted page instead of `/sign-in` (docs/pre-prod.md).
 * - `COHERENCE_DEV_USER` (the local test user, src/lib/dev-user.ts) must never
 *   reach production: a production server with it set refuses to start.
 *
 * The lazy reads in client.ts and model.ts stay as they are; this only makes a
 * missing key show at startup rather than at the first request. The same list
 * is what the preflight asks `.env.local` for (from `.env.example`).
 */
import { z } from "zod";
import { DEV_TEST_USER_KEY } from "./dev-user";

/** Unset and empty are the same thing to the code (`if (!url)`, `LUMI_MODEL || DEFAULT`). */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const key = z.string().trim().min(1);

const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: key,
    CLERK_SECRET_KEY: key,
    DATABASE_URL: key,
    LUMI_MODEL: optional(z.string().regex(/^(openai|anthropic):.+$/)),
    OPENAI_API_KEY: optional(key),
    ANTHROPIC_API_KEY: optional(key),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: optional(key),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: optional(key),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: optional(key),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: optional(key),
  })
  .superRefine((env, ctx) => {
    const modelKey = env.LUMI_MODEL?.startsWith("anthropic:") ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    if (!env[modelKey]) ctx.addIssue({ code: "custom", path: [modelKey], message: "missing" });
  });

type EnvProblems = { missing: string[]; invalid: string[] };

/** Which keys are missing and which are set but malformed. Names only. */
export function envProblems(env: Record<string, string | undefined>): EnvProblems {
  const result = serverEnvSchema.safeParse(env);
  const missing = new Set<string>();
  const invalid = new Set<string>();
  for (const issue of result.success ? [] : result.error.issues) {
    const name = String(issue.path[0]);
    const value = env[name];
    (value === undefined || value.trim() === "" ? missing : invalid).add(name);
  }
  return { missing: [...missing], invalid: [...invalid] };
}

const FORMATS: Record<string, string> = {
  LUMI_MODEL: 'must read "openai:<model>" or "anthropic:<model>"',
};

/**
 * Throws in production when a required key is missing or a key is malformed,
 * so a deploy without its keys fails loudly at startup. Elsewhere it warns: the
 * preflight already stops `npm run dev` on a missing key. A production server
 * with the local test user switched on always throws.
 */
export function validateServerEnv(
  env: Record<string, string | undefined> = process.env,
  { production = process.env.NODE_ENV === "production", warn = console.warn } = {},
): EnvProblems {
  if (production && env[DEV_TEST_USER_KEY]?.trim()) {
    throw new Error(
      `${DEV_TEST_USER_KEY} is set in production — the local test user signs every request in without a session, so it must never reach a deploy (src/lib/dev-user.ts). Remove the key from this environment.`,
    );
  }
  const problems = envProblems(env);
  const lines = [
    ...(problems.missing.length ? [`missing: ${problems.missing.join(", ")}`] : []),
    ...problems.invalid.map((k) => `${k} ${FORMATS[k] ?? "is malformed"}`),
  ];
  if (!lines.length) return problems;
  const message = `Server environment is incomplete — ${lines.join("; ")}. See .env.example (locally) or docs/pre-prod.md → Environment variables (Vercel).`;
  if (production) throw new Error(message);
  warn(`[env] ${message}`);
  return problems;
}

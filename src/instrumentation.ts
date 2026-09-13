// Runs once when a Next.js server instance starts, before it serves a request
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md).
// Not during `next build`: Next skips register() in the production build phase.

export async function register() {
  // The proxy may run on the edge runtime; the env check is for the Node.js server.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateServerEnv } = await import("@/lib/env");
  validateServerEnv();
}

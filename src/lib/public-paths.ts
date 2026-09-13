// The pages a signed-out visitor may see: the auth pages themselves, and the
// privacy policy (Google's consent screen links to it, 2026-09-13). The proxy
// lets only these through without a session, and the app's own chrome (the
// nav) stays off them — it belongs to the space you enter after signing in.
export const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/privacy"];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

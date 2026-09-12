import { clerkMiddleware } from "@clerk/nextjs/server";

// Protected-first: every surface is signed-in (docs/features.md). Only the
// auth pages themselves are public. This wall is defence in depth — every
// page and route also calls requireUser() itself (Clerk's recommended
// resource-based check; the route-auth audit enforces it for API routes).
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up"];

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  if (!isPublic) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};

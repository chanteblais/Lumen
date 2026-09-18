import { clerkMiddleware } from "@clerk/nextjs/server";
import { devTestUserEnabled } from "@/lib/dev-user";
import { isPublicPath } from "@/lib/public-paths";

// Protected-first: every surface is signed-in (docs/features.md). Only the
// auth pages themselves and the privacy policy are public. This wall is defence in depth — every
// page and route also calls requireUser() itself (Clerk's recommended
// resource-based check; the route-auth audit enforces it for API routes).
// The public pages are listed in src/lib/public-paths.ts.
//
// Under `npm run dev` with COHERENCE_DEV_USER=1 the wall stands aside: every
// request is the local test user, which requireUser() supplies (src/lib/dev-user.ts).

export default clerkMiddleware(async (auth, req) => {
  if (devTestUserEnabled()) return;
  if (!isPublicPath(req.nextUrl.pathname)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};

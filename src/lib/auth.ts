// The server-side auth boundary. This file and src/lib/auth-ui.tsx are the
// only places outside the sign-in/sign-up pages that import Clerk.
// Everything else works with AppUser.
//
// TODO(M1): resolve the Clerk id to the internal users.id (create the row
// lazily, capture timezone on first visit) and return that instead. Until
// the users table exists, id is the Clerk user id.
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AppUser = {
  id: string;
  displayName: string | null;
};

/** The signed-in user, or a redirect to sign-in. Server components and route handlers only. */
export async function requireUser(): Promise<AppUser> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  return {
    id: userId,
    displayName: user?.firstName ?? user?.username ?? null,
  };
}

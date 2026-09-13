// A local-only test user, for driving the signed-in app without a login — the
// iOS Simulator mobile pass, where Claude can't sign in (2026-09-13, Chanté's
// call). With COHERENCE_DEV_USER=1 in .env.local under `npm run dev`, the proxy
// lets every page through and requireUser()/requireVisit() act as one fixed
// user, created on its first request like anyone else. Its rows are real rows
// in whatever database DATABASE_URL names.
//
// Never in production: it is ignored unless NODE_ENV is "development", and
// validateServerEnv() refuses to start a production server with the key set.
// No Clerk import here — the proxy and auth.ts ask this file, not the other way.

/** The `users.clerk_user_id` the test user is stored under. Not a Clerk id: Clerk's start with `user_`. */
export const DEV_TEST_CLERK_USER_ID = "dev_test_user";

/** The name Lumi greets the test user by. */
export const DEV_TEST_DISPLAY_NAME = "Test";

export const DEV_TEST_USER_KEY = "COHERENCE_DEV_USER";

/** On only for `next dev` with the key set to exactly "1". */
export function devTestUserEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "development" && env[DEV_TEST_USER_KEY] === "1";
}

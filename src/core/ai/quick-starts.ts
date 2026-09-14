/**
 * The landing-page chips. The sent message is the label itself; the persona
 * (`persona.ts` → Quick starts) says what each one means. Its own module so
 * the client chips don't pull the whole prompt into the bundle. *Body double*
 * went with focus sessions (2026-09-13).
 */
export const QUICK_STARTS = ["Help me choose", "Break it down", "Just talk"] as const;
export type QuickStart = (typeof QUICK_STARTS)[number];

/**
 * The four landing-page chips. The sent message is the label itself; the
 * persona (`persona.ts` → Quick starts) says what each one means. Its own
 * module so the client chips don't pull the whole prompt into the bundle.
 */
export const QUICK_STARTS = ["Help me choose", "Break it down", "Body double", "Just talk"] as const;
export type QuickStart = (typeof QUICK_STARTS)[number];

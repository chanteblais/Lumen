/**
 * Work that must not overlap for one key — re-cutting one user's path — runs
 * one at a time, in the order it was asked for, in this process. A failure
 * doesn't stop the next one. Across instances nothing is serialised: the last
 * save still wins there, which a second request a moment later settles.
 */
const tails = new Map<string, Promise<unknown>>();

export function serially<T>(key: string, work: () => Promise<T>): Promise<T> {
  const prev = tails.get(key) ?? Promise.resolve();
  const run = prev.then(work, work);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  tails.set(key, tail);
  void tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });
  return run;
}

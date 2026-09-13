/**
 * The one row a write returned. An insert, or an update of a row the same
 * transaction has just claimed or locked, always returns it; none means the
 * database did something the code can't go on from, so this throws naming the
 * write (as `ensureMainConversation` does) instead of handing `undefined` on.
 * Writes that can legitimately match nothing check `const [row]` themselves.
 */
export function returnedRow<T>(rows: T[], write: string): T {
  const [row] = rows;
  if (row === undefined) throw new Error(`${write}: the write returned no row`);
  return row;
}

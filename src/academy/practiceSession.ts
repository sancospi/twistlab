// The practice dialog's rules, apart from the page (practice.ts draws them): when the solution is on screen, how a new
// time reads against the case's record, and the numbers of the sitting.
import { average, type CaseStats } from './store.ts';

/** Clean repetitions in a row after which the solution hides by itself: from then on, the case is done from memory. */
export const FADE_AFTER = 3;

export type SolutionView = 'shown' | 'hidden';

/** The solution on screen: the user's choice for this sitting if they made one, else shown until FADE_AFTER clean in a
 *  row (a mistake brings it back: the streak starts over). */
export const solutionView = (streak: number, choice: SolutionView | null): SolutionView =>
  choice ?? (streak >= FADE_AFTER ? 'hidden' : 'shown');

/** A new time against the case's stats before it: the first one, a new best (by how much), or off the average. */
export type Comparison = { kind: 'first' } | { kind: 'best'; by: number } | { kind: 'avg'; delta: number };

const shown = (ms: number) => Math.floor(ms / 10) * 10; // as formatTime shows it: hundredths, truncated

/** `clean`: whether the time will count (a failed or helped one never claims a first mark or a best: only clean times
 *  make them); null when there's nothing to say. A best by less than a shown hundredth isn't one. */
export function compare(ms: number, before: CaseStats | undefined, clean = true): Comparison | null {
  const avg = before && average(before);
  if (!before || before.best === null || avg == null) return clean ? { kind: 'first' } : null;
  const by = shown(before.best) - shown(ms);
  if (clean && by > 0) return { kind: 'best', by };
  return { kind: 'avg', delta: ms - avg };
}

/** One repetition of the sitting, as the session strip shows it. */
export interface SessionRep {
  ms: number;
  clean: boolean;
}

/** The sitting's numbers: how many, and the best and mean of the clean ones (null with none), as the case's stats. */
export function summary(reps: readonly SessionRep[]): { reps: number; best: number | null; mean: number | null } {
  const times = reps.filter((r) => r.clean).map((r) => r.ms);
  if (!times.length) return { reps: reps.length, best: null, mean: null };
  return { reps: reps.length, best: Math.min(...times), mean: times.reduce((a, b) => a + b, 0) / times.length };
}

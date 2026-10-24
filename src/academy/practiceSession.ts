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

export function compare(ms: number, before: CaseStats | undefined): Comparison {
  const avg = before && average(before);
  if (!before || before.best === null || avg == null) return { kind: 'first' };
  if (ms < before.best) return { kind: 'best', by: before.best - ms };
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

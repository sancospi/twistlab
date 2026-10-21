// How often each last-layer case comes up at its stage, counted exactly: every last-layer state the stage can start
// from (F2L solved; in a 2-look phase, the phase's previous step done too) is classified by the case of the phase
// that solves it (with an AUF before), or as a skip when the stage's goal is already met. Lazy and cached per phase.
import { KPattern, type KPuzzle, type KTransformation } from 'cubing/kpuzzle';
import { IDENTITY, centerMoves } from '../notation.ts';
import { goalReached } from './cube.ts';
import { METHODS } from './methods.ts';
import type { Phase, Stage } from './types.ts';

// orientation: 8 edge flips (even) × 27 corner twists (sum 0 mod 3) = 216; permutation: 4! × 4! of equal parity = 288
const FAMILY: Partial<Record<Stage, 'orientation' | 'permutation'>> = {
  'oll-cross': 'orientation', 'oll-corners': 'orientation', 'pll-corners': 'permutation', 'pll-edges': 'permutation',
};
// 2-look: when the phase also teaches this step, the stage starts with it done
const PREVIOUS: Partial<Record<Stage, Stage>> = { 'oll-corners': 'oll-cross', 'pll-edges': 'pll-corners' };
const AUFS = ['', 'U ', "U' ", 'U2 '];

const range = (n: number) => [...Array(n).keys()];
const perms = (xs: number[]): number[][] =>
  xs.length ? xs.flatMap((x, i) => perms(xs.filter((_, j) => j !== i)).map((p) => [x, ...p])) : [[]];
const parity = (p: number[]) => p.reduce((s, x, i) => s + p.slice(i + 1).filter((y) => y < x).length, 0) % 2;
/** Every tuple of `n` values in 0..base-1 whose sum is 0 mod `base`. */
const sums0 = (n: number, base: number): number[][] =>
  range(base ** n).map((i) => range(n).map((j) => Math.floor(i / base ** j) % base)).filter((xs) => xs.reduce((a, b) => a + b, 0) % base === 0);

/** The last-layer states of a family, F2L solved (slots 0–3 of each orbit are the U layer). */
function llStates(kpuzzle: KPuzzle, family: 'orientation' | 'permutation'): KPattern[] {
  const solved = kpuzzle.defaultPattern().patternData;
  const state = (ep: number[], eo: number[], cp: number[], co: number[]) => new KPattern(kpuzzle, {
    ...solved,
    EDGES: { pieces: [...ep, ...range(12).slice(4)], orientation: [...eo, ...Array(8).fill(0)] },
    CORNERS: { pieces: [...cp, ...range(8).slice(4)], orientation: [...co, ...Array(4).fill(0)] },
  });
  const id = range(4), zero = [0, 0, 0, 0];
  if (family === 'orientation') return sums0(4, 2).flatMap((eo) => sums0(4, 3).map((co) => state(id, eo, id, co)));
  return perms(id).flatMap((ep) => perms(id).filter((cp) => parity(cp) === parity(ep)).map((cp) => state(ep, zero, cp, zero)));
}

export interface StageCounts {
  total: number;
  skip: number;
  byCase: Map<string, number>;
}

const cache = new Map<string, StageCounts | null>();
/** How many of the stage's states each case of the phase gets; null when the stage isn't a last-layer one or some
 *  state is solved by none of the phase's cases (an incomplete set: no honest number to give). */
export function stageCounts(phase: Phase, stage: Stage, kpuzzle: KPuzzle): StageCounts | null {
  const key = `${phase.id} ${stage}`;
  if (cache.has(key)) return cache.get(key)!;
  const family = FAMILY[stage];
  const cases = phase.groups.flatMap((g) => g.cases);
  const prev = PREVIOUS[stage];
  const twoLook = prev && cases.some((c) => c.stage === prev);
  const own = cases.filter((c) => c.stage === stage);
  let counts: StageCounts | null = null;
  if (family && own.length) {
    const solve: KTransformation[][] = own.map((c) => AUFS.map((a) => kpuzzle.algToTransformation(centerMoves(a + c.algs[0].alg, IDENTITY).join(' '))));
    counts = { total: 0, skip: 0, byCase: new Map(own.map((c) => [c.id, 0])) };
    for (const p of llStates(kpuzzle, family)) {
      if (twoLook && !goalReached(prev, p, 'U')) continue;
      counts.total++;
      if (goalReached(stage, p, 'U')) {
        counts.skip++;
        continue;
      }
      const i = solve.findIndex((ts) => ts.some((t) => goalReached(stage, p.applyTransformation(t), 'U')));
      if (i < 0) {
        counts = null;
        break;
      }
      counts.byCase.set(own[i].id, counts.byCase.get(own[i].id)! + 1);
    }
  }
  cache.set(key, counts);
  return counts;
}

/** Probability that a solve presents this case at its stage; null for stages where it isn't counted (F2L, beginner's
 *  last layer). */
export function caseProbability(caseId: string, kpuzzle: KPuzzle): number | null {
  const phase = phaseOf(caseId);
  const c = phase?.groups.flatMap((g) => g.cases).find((x) => x.id === caseId);
  const counts = phase && c && stageCounts(phase, c.stage, kpuzzle);
  return counts ? counts.byCase.get(caseId)! / counts.total : null;
}

export const phaseOf = (caseId: string): Phase | undefined =>
  METHODS.flatMap((m) => m.phases).find((p) => p.groups.some((g) => g.cases.some((c) => c.id === caseId)));

/** The probability as a reduced fraction ("1/54", "4/27", "2/3"): one format, so cards compare at a glance. Every
 *  count here is over at most 288 states, so the smallest denominator that makes it whole is exact. */
export function formatProbability(p: number): string {
  const n = range(1000).find((i) => i > 0 && Math.abs(Math.round(i * p) - i * p) < 1e-9)!;
  return `${Math.round(n * p)}/${n}`;
}

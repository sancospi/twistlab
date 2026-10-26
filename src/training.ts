// Training scrambles (the Resolver's "Entrenar" entries, timer.ts TRAINS): a 3x3 state that leaves one case of the
// Academia to solve, which main.ts turns into a scramble the way it does with the smart cube (the solver's solution,
// inverted: it doesn't end in the case's algorithm backwards). The cases are written yellow up (the Academia's frame);
// the scramble is applied white up, green front (the WCA's), a z2 away.
// - pll / oll: a case with a random AUF before and after; an OLL with a random PLL under it (as in a solve)
// - f2l: a case of the last pair (front right slot) over a random last layer: the pair, then OLL and PLL
// - mine: the cases practised in the Academia and the slowest of the smart cube's solves (solve-analysis.ts), as they are
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { is2x2, isRoux, type Case } from './academy/types.ts';
import { allCases, findCase, METHODS } from './academy/methods.ts';
import { cfopFull } from './academy/cfopFull.ts';
import { learningFor } from './academy/store.ts';
import { SLOWEST, slowestCases } from './solve-analysis.ts';
import type { TrainId } from './timer.ts';

const AUF = ['', 'U', 'U2', "U'"];
const pick = <T>(a: readonly T[], rand: () => number): T => a[Math.floor(rand() * a.length)];
const full = allCases(cfopFull);
const ofStage = (stage: Case['stage']) => full.filter((c) => c.stage === stage);
const PLL = ofStage('pll-edges');
const OLL = ofStage('oll-corners');
const F2L = ofStage('f2l');

/** The cases a training draws from (mine: none until something is practised, or analysed with a smart cube). */
export function trainCases(kind: TrainId): Case[] {
  if (kind !== 'mine') return kind === 'pll' ? PLL : kind === 'oll' ? OLL : F2L;
  const ids = new Set(slowestCases().slice(0, SLOWEST).map((c) => c.id));
  // ponytail: every 3x3 case outside Roux (its M slice moves the centers a solve can't); scanned on each scramble
  for (const m of METHODS) for (const c of allCases(m)) if (learningFor(c.id)) ids.add(c.id);
  return [...ids].flatMap((id) => findCase(id) ?? []).filter((c) => !isRoux(c.stage) && !is2x2(c.stage));
}

/** A state with one of `cases` to solve (null if there are none), and that case. The centers end home: a case whose
 *  setup moves them is skipped. */
export function trainingPattern(kpuzzle: KPuzzle, kind: TrainId, cases: Case[], rand = Math.random): { pattern: KPattern; c: Case } | null {
  for (let tries = 0; cases.length && tries < 10; tries++) {
    const c = pick(cases, rand);
    const under = kind === 'oll' ? [pick(PLL, rand).setup] : kind === 'f2l' ? [pick(PLL, rand).setup, pick(AUF, rand), pick(OLL, rand).setup] : [];
    const alg = ['z2', ...under, pick(AUF, rand), c.setup, pick(AUF, rand), 'z2'].filter(Boolean).join(' ');
    const pattern = kpuzzle.defaultPattern().applyAlg(alg);
    if (pattern.patternData.CENTERS.pieces.every((x, i) => x === i)) return { pattern, c };
  }
  return null;
}

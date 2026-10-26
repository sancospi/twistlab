// The case on the user's cube, live (Cubo screen, with a smart cube): with the white cross done, each F2L pair's case and
// how to do it; with the first two layers done, the OLL or PLL case. In the Academia's frame (yellow up, green front),
// where the cases are written: the F2L ones all for the front-right slot.
import type { KPattern } from 'cubing/kpuzzle';
import { cfopFull } from './cfopFull.ts';
import { caseState, goalReached, llSteps, seenAfter } from './cube.ts';
import { allCases } from './methods.ts';
import { solutionFor } from './score.ts';
import { IDENTITY, invertTokens, tokenize, type Face } from '../notation.ts';
import { isSolved } from '../guide.ts';
import type { Case } from './types.ts';

/** A case to do now: `moves` = how to hold the cube (a y rotation, for a pair: its slot to front-right), the U turn
 *  it needs and the user's algorithm for it, the U turn folded into the algorithm's first (score.ts solutionFor).
 *  `colors`: a pair's slot sides in the Academia's frame (paint.color.*), to name it. */
export interface PairCase { colors: [Face, Face]; c: Case; moves: string[] }
export type Inspection = { kind: 'solved' } | { kind: 'cross' } | { kind: 'f2l'; pairs: PairCase[] } | { kind: 'll'; c: Case; moves: string[] }
  | { kind: 'auf'; moves: string[] }; // only the top layer to turn

const CASES = allCases(cfopFull);
const F2L = CASES.filter((c) => c.stage === 'f2l');
const LL = CASES.filter((c) => c.stage === 'oll-corners' || c.stage === 'pll-edges');
const AUFS = ['', 'U', "U'", 'U2'];
// The whole-cube turns that bring each slot to front-right, and that slot's sides as they were (y: the right face comes
// to the front)
const ROTATIONS: [string, [Face, Face]][] = [['', ['F', 'R']], ['y', ['R', 'B']], ['y2', ['B', 'L']], ["y'", ['L', 'F']]];
const CROSS = [4, 5, 6, 7]; // EDGES DF DR DB DL: the white cross, user frame
const DRF = 4; // CORNERS slot (and piece) of the front-right pair's corner, user frame; EDGES' FR is 8
const FR = 8;
const inv = (alg: string) => invertTokens(tokenize(alg)).join(' ');

/** Where the front-right pair's two pieces are, and how they're turned. */
function pairAt(q: KPattern): string {
  const { CORNERS: c, EDGES: e } = q.patternData;
  const cs = c.pieces.indexOf(DRF);
  const es = e.pieces.indexOf(FR);
  return `${cs}.${c.orientation[cs]} ${es}.${e.orientation[es]}`;
}

let bySig: Map<string, Case> | null = null;
/** Each case's pair, as its main algorithm undone leaves it (the case's canonical state, caseState). */
const signatures = (p: KPattern) => (bySig ??= new Map(F2L.map((c) => [pairAt(caseState(p.kpuzzle, c.algs[0].alg, IDENTITY)), c])));

/** `p`: the cube's state (cube frame: white U, green F). `alg`: the algorithm the user plays for a case. ponytail: the
 *  white cross only, as the Academia teaches; color neutral if asked for. */
export function inspect(p: KPattern, alg: (c: Case) => string): Inspection {
  if (isSolved(p)) return { kind: 'solved' };
  const user = seenAfter(p, 'z2'); // yellow up, green front
  if (!CROSS.every((i) => user.patternData.EDGES.pieces[i] === i && user.patternData.EDGES.orientation[i] === 0)) return { kind: 'cross' };
  if (goalReached('f2l', user, 'U')) {
    const steps = llSteps(user, LL, alg);
    if (steps?.length) return { kind: 'll', c: steps[0].c, moves: tokenize(solutionFor(steps[0].c, alg(steps[0].c), user)) };
    const auf = AUFS.find((a) => a && isSolved(user.applyAlg(a)));
    return auf ? { kind: 'auf', moves: [auf] } : { kind: 'f2l', pairs: [] }; // no case fits: as stuck pieces
  }
  const sigs = signatures(p);
  const pairs = ROTATIONS.flatMap(([rot, colors]) => {
    const held = rot ? seenAfter(user, rot) : user;
    for (const auf of AUFS) {
      const c = sigs.get(pairAt(auf ? held.applyAlg(auf) : held));
      // the user's algorithm and its own U turn, from the case's canonical state off by this AUF (the other pairs done:
      // the F2L goal needs them)
      if (c) return [{ colors, c, moves: [...(rot ? [rot] : []), ...tokenize(solutionFor(c, alg(c), caseState(p.kpuzzle, c.algs[0].alg, IDENTITY).applyAlg(auf ? inv(auf) : '')))] }];
    }
    return []; // solved, or its pieces in another slot
  });
  return { kind: 'f2l', pairs };
}

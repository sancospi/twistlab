// Cube states for the academy: where a case starts, whether a stage's goal is met, and random quiz states.
// Everything works on KPatterns with fixed centers, so wide moves, slices and rotations are just face turns
// (via notation.ts) and the last layer is simply "the pieces of the face whose center is yellow".
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { IDENTITY, centerMoves, htm, invertTokens, mapMove, merge, type Face, type Frame } from '../notation.ts';
import { METHODS, allCases } from './methods.ts';
import type { AlgVariant, Case, Stage } from './types.ts';

// cubing.js 3x3x3 orbit slot order; orientation 0 = the piece's U/D (or F/B) sticker on the slot's U/D (F/B) face.
const EDGES = 'UF UR UB UL DF DR DB DL FR FL BR BL'.split(' ');
const CORNERS = 'UFR URB UBL ULF DRF DFL DLB DBR'.split(' ');

export type Auf = '' | 'U' | "U'" | 'U2';
const AUFS: Auf[] = ['', 'U', "U'", 'U2'];

/** The state a case's algorithm solves: solved, then the algorithm undone. Centers never move. */
export function caseState(kpuzzle: KPuzzle, alg: string, frame0: Frame): KPattern {
  return kpuzzle.defaultPattern().applyAlg(invertTokens(centerMoves(alg, frame0)).join(' '));
}

/** Home/oriented flags of the pieces whose home slot does (ll) or doesn't touch `llFace` (any face, really). */
function pieces(p: KPattern, llFace: Face, ll: boolean) {
  const out: { home: boolean; oriented: boolean; corner: boolean }[] = [];
  for (const [orbit, names] of [['EDGES', EDGES], ['CORNERS', CORNERS]] as const) {
    const { pieces, orientation } = p.patternData[orbit];
    names.forEach((name, i) => {
      if (name.includes(llFace) === ll) out.push({ home: pieces[i] === i, oriented: orientation[i] === 0, corner: orbit === 'CORNERS' });
    });
  }
  return out;
}

// The pattern under each of the four turns of the last layer (AUF before or after doesn't matter).
const llTurns = (p: KPattern, llFace: Face) => AUFS.map((a) => (a ? p.applyMove(llFace + a.slice(1)) : p));

const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

/** Whether a case of `stage` is done; llFace = 'U' in the user frame, YELLOW_UP.U on the cube. */
export function goalReached(stage: Stage, p: KPattern, llFace: Face): boolean {
  if (stage === 'first-layer') return pieces(p, OPPOSITE[llFace], true).every((x) => x.home && x.oriented);
  const f2l = pieces(p, llFace, false).every((x) => x.home && x.oriented);
  const ll = pieces(p, llFace, true);
  // the last layer meets `ok` piece by piece after some U turn
  const afterAuf = (ok: (x: (typeof ll)[number]) => boolean) => llTurns(p, llFace).some((q) => pieces(q, llFace, true).every(ok));
  switch (stage) {
    case 'f2l':
    case 'second-layer':
      return f2l;
    case 'oll-cross':
      return f2l && ll.every((x) => x.corner || x.oriented);
    case 'oll-corners':
      return f2l && ll.every((x) => x.oriented);
    case 'pll-corners':
      return f2l && ll.every((x) => x.oriented) && afterAuf((x) => !x.corner || x.home);
    case 'll-edges':
      return f2l && afterAuf((x) => x.corner || (x.home && x.oriented));
    case 'll-corners-placed':
      return f2l && afterAuf((x) => x.home && (x.corner || x.oriented));
    case 'pll-edges':
    case 'll-corners-twist':
      return f2l && afterAuf((x) => x.home && x.oriented);
  }
}

/** A generated quiz state: `moves` (user-frame center turns) from solved; `auf` goes before the case's algorithm. */
export interface QuizSpec {
  caseId: string;
  moves: string[];
  auf: Auf;
}

// mulberry32: tiny seeded PRNG so a quiz can be replayed from its seed.
function mulberry32(seed: number) {
  // A fractional seed (Math.random()) would truncate to 0 and every quiz would be the same one.
  let a = (Number.isInteger(seed) ? seed : Math.floor(seed * 2 ** 32)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const pick = <T>(rng: Rng, xs: T[]): T => xs[Math.floor(rng() * xs.length)];

// Random quiz states are products of U turns and other cases' algorithms (as center turns). A pool may only hold
// algorithms that keep its stage's goal: every goal is a group of states, so then any product keeps it too.
// quizPool filters by goal, since a stage may hold algorithms that don't (cube.test.ts checks pools aren't emptied).
const LL: Stage[] = ['oll-cross', 'oll-corners', 'pll-corners', 'pll-edges', 'll-edges', 'll-corners-placed', 'll-corners-twist'];
export const POOL_STAGES: Record<Stage, Stage[]> = {
  'first-layer': ['second-layer', ...LL], // none of them touches the first layer
  'second-layer': LL,
  f2l: LL,
  'oll-cross': ['oll-corners', 'pll-corners', 'pll-edges', 'll-edges', 'll-corners-placed', 'll-corners-twist'], // edges stay oriented
  'oll-corners': ['pll-corners', 'pll-edges'], // everything stays oriented
  'pll-corners': ['pll-edges'], // corners stay a cycle of the U layer
  'pll-edges': [],
  'll-edges': ['ll-corners-placed', 'll-corners-twist'], // corners only
  'll-corners-placed': ['ll-corners-twist'], // twists only
  'll-corners-twist': [],
};
const COUNTS: Record<Stage, number[]> = {
  'first-layer': [3, 4], 'second-layer': [3, 4], f2l: [3, 4], 'oll-cross': [2, 3], 'oll-corners': [2, 3], 'pll-corners': [0, 1],
  'pll-edges': [0], 'll-edges': [2, 3], 'll-corners-placed': [0, 1], 'll-corners-twist': [0],
};
const poolAlgs = (stages: Stage[]) =>
  METHODS.flatMap(allCases).filter((c) => stages.includes(c.stage)).flatMap((c) => c.algs.map((v) => centerMoves(v.alg, IDENTITY)));
const pools = new Map<Stage, { algs: string[][]; count: number[] }>();
/** The quiz pool of `stage`: algorithms of POOL_STAGES's stages that really keep its goal (a stage may mix kinds,
 * e.g. cfop-completo's full OLL sits in 'oll-corners' but flips edges, so it can't go in the 'oll-cross' pool). */
export function quizPool(stage: Stage, kpuzzle: KPuzzle) {
  let pool = pools.get(stage);
  if (!pool) {
    const solved = kpuzzle.defaultPattern();
    const algs = poolAlgs(POOL_STAGES[stage]).filter((a) => goalReached(stage, solved.applyAlg(a.join(' ')), 'U'));
    pools.set(stage, (pool = { algs, count: COUNTS[stage] }));
  }
  return pool;
}

function randomLL(rng: Rng, stage: Stage, kpuzzle: KPuzzle): string[] {
  const { algs, count } = quizPool(stage, kpuzzle);
  const moves: string[] = [];
  // no algorithms of the pool's stages (yet): just the case and its AUF
  for (let i = algs.length ? pick(rng, count) : 0; i > 0; i--) moves.push(pick(rng, AUFS), ...pick(rng, algs));
  if (moves.length) moves.push(pick(rng, AUFS));
  return moves.filter(Boolean); // '' = no AUF
}

function quizSpec(rng: Rng, c: Case, kpuzzle: KPuzzle): QuizSpec {
  const auf = pick(rng, AUFS);
  const moves = [...randomLL(rng, c.stage, kpuzzle), ...centerMoves(c.setup, IDENTITY), ...(auf ? invertTokens([auf]) : [])];
  return { caseId: c.id, moves: merge(moves), auf }; // merged so scrambles stay short
}

/**
 * `perCase` random states of each case (deterministic for a seed), in rounds so cases interleave.
 * Each state is the case's setup on top of a random last layer the stage doesn't care about, plus a random AUF.
 */
export function makeQuizItems(cases: Case[], perCase: number, seed: number, kpuzzle: KPuzzle): QuizSpec[] {
  const rng = mulberry32(seed);
  const items: QuizSpec[] = [];
  for (let round = 0; round < perCase; round++) {
    const order = cases.map((c) => [rng(), c] as const).sort((a, b) => a[0] - b[0]).map(([, c]) => c);
    if (order.length > 1 && order[0].id === items.at(-1)?.caseId) order.push(order.shift()!); // no repeat at the seam
    for (const c of order) {
      let spec = quizSpec(rng, c, kpuzzle);
      // ponytail: a random LL can't undo a setup today; this guard only bounds a future data mistake.
      for (let i = 0; i < 10 && goalReached(c.stage, quizPattern(kpuzzle, spec, IDENTITY), 'U'); i++) spec = quizSpec(rng, c, kpuzzle);
      items.push(spec);
    }
  }
  return items;
}

/** The quiz state on a cube held in `frame` (YELLOW_UP for the GAN cube, IDENTITY for diagrams). */
export function quizPattern(kpuzzle: KPuzzle, spec: QuizSpec, frame: Frame): KPattern {
  return kpuzzle.defaultPattern().applyAlg(spec.moves.map((m) => mapMove(m, frame)).join(' '));
}

/** Reference length (HTM) of solving the case with `variant` after `auf`, to compare the user's solve against. */
export function referenceMoves(_c: Case, variant: AlgVariant, auf: Auf): number {
  return htm(centerMoves(`${auf} ${variant.alg}`, IDENTITY));
}

/** Face whose center is the last layer's color when the cube is held in `frame`. */
export const llFaceOf = (frame: Frame): Face => frame.U;

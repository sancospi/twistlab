// Cube states for the academy: where a case starts, whether a stage's goal is met, random quiz states, and which
// pieces a 3D player shows in color.
// Everything works on KPatterns with fixed centers, so wide moves, slices and rotations are just face turns
// (via notation.ts) and the last layer is simply "the pieces of the face whose center is yellow".
import { KPattern, type KPuzzle, type KTransformation } from 'cubing/kpuzzle';
import { cube2x2x2 } from 'cubing/puzzles';
import { experimentalSolve2x2x2, experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { IDENTITY, centerMoves, expand, htm, invertTokens, mapMove, merge, tokenize, type Face, type Frame } from '../notation.ts';
import { METHODS, allCases } from './methods.ts';
import { is2x2, isRoux, type AlgVariant, type Case, type Puzzle, type Stage, type Stage2x2, type StageRoux } from './types.ts';

// cubing.js 3x3x3 orbit slot order; orientation 0 = the piece's U/D (or F/B) sticker on the slot's U/D (F/B) face.
export const EDGES = 'UF UR UB UL DF DR DB DL FR FL BR BL'.split(' ');
export const CORNERS = 'UFR URB UBL ULF DRF DFL DLB DBR'.split(' ');

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

export const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

// The whole-cube turn that brings a side face to U: orientation 0 is about U/D stickers, so a goal on a side face
// is checked on the state as seen from there.
const TO_U: Partial<Record<Face, string>> = { F: 'x', B: "x'", R: "z'", L: 'z' };

/** `p` seen after the whole-cube turn `rot`, centers home again (rot⁻¹ · p · rot). */
export function seenAfter(p: KPattern, rot: string): KPattern {
  const r = p.kpuzzle.algToTransformation(rot);
  return KPattern.fromTransformation(r.invert().applyTransformation(p.experimentalToTransformation()!).applyTransformation(r));
}
/** The whole-cube turn that brings `face` to U ('' for U): withUp's, and the one a side cross's lesson starts with. */
export const turnToUp = (face: Face): string => (face === 'U' ? '' : TO_U[face] ?? 'x2');
/** `p` turned whole so its `face` is U: a last layer as the cases (llSteps) see it. */
export const withUp = (p: KPattern, face: Face): KPattern => (face === 'U' ? p : seenAfter(p, turnToUp(face)));

// --- 2x2: the corners of a 3x3 state, up to a turn of the whole cube ---

// A whole-cube turn as face turns, on corners: x = R L', y = U D', z = F B' (no centers on a 2x2).
const ROTATIONS = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap((r) => ['', 'y', 'y2', "y'"].map((y) => `${r} ${y}`.trim()));
const asFaceTurns = (rot: string) => rot.replace(/([xyz])(2|')?/g, (_, a: 'x' | 'y' | 'z', s = '') => {
  const [p, q] = { x: 'RL', y: 'UD', z: 'FB' }[a];
  return `${p}${s} ${q}${s === '2' ? '2' : s ? '' : "'"}`;
});
const DLB = 6; // CORNERS slot (and piece) DLB: white-blue-red in the user frame
const holds = new WeakMap<KPuzzle, Map<string, { t: KTransformation; moves: string[] }>>();
/** The whole-cube turn (as face turns) that brings the DLB piece home, white down, by where it is now. */
function holdFor(p: KPattern) {
  let table = holds.get(p.kpuzzle);
  if (!table) {
    table = new Map();
    for (const rot of ROTATIONS) {
      const moves = tokenize(asFaceTurns(rot));
      const t = p.kpuzzle.algToTransformation(moves.join(' '));
      const { pieces, orientation } = p.kpuzzle.defaultPattern().applyTransformation(t.invert()).patternData.CORNERS;
      const at = pieces.indexOf(DLB);
      table.set(`${at} ${orientation[at]}`, { t, moves });
    }
    holds.set(p.kpuzzle, table);
  }
  const { pieces, orientation } = p.patternData.CORNERS;
  const at = pieces.indexOf(DLB);
  return table.get(`${at} ${orientation[at]}`)!;
}
/** A 2x2 state held the one way its goals are checked: DLB piece home (so white down, yellow up, green front). */
export const held2x2 = (p: KPattern): KPattern => p.applyTransformation(holdFor(p).t);

const D_SLOTS = [4, 5, 6, 7];
function goal2x2(stage: Stage2x2, q: KPattern): boolean {
  const { pieces, orientation } = q.patternData.CORNERS;
  const oriented = orientation.every((o) => o === 0);
  const firstLayer = D_SLOTS.every((i) => pieces[i] === i && orientation[i] === 0); // DLB home: ADF is a whole-cube turn
  switch (stage) {
    case '2x2-first-layer': return firstLayer;
    case '2x2-first-face': return D_SLOTS.every((i) => pieces[i] >= 4 && orientation[i] === 0);
    case '2x2-oll': return oriented && D_SLOTS.every((i) => pieces[i] >= 4); // white down too, not just twisted right
    case '2x2-pbl':
    case '2x2-ll-corners':
      return oriented && firstLayer && llTurns(q, 'U').some((x) => x.patternData.CORNERS.pieces.slice(0, 4).every((c, i) => c === i));
  }
}

// --- Roux: two 1x2x3 blocks, the M slice free ---

const BLOCK_L = { EDGES: [7, 9, 11], CORNERS: [5, 6] }; // DL FL BL, DFL DLB
const BLOCK_R = { EDGES: [5, 8, 10], CORNERS: [4, 7] }; // DR FR BR, DRF DBR
const LSE_EDGES = [0, 1, 2, 3, 4, 6]; // UF UR UB UL DF DB
const solvedAt = (p: KPattern, slots: { EDGES: number[]; CORNERS: number[] }) =>
  (['EDGES', 'CORNERS'] as const).every((o) => slots[o].every((i) => p.patternData[o].pieces[i] === i && p.patternData[o].orientation[i] === 0));

/** `p` with the M slice turned so the left block lines up with the centers, and how many M' turns that took; null
 *  when no M turn does it. Centers never move here, so an M turn is R L' (and a whole-cube turn): undone by R' L. */
export function rouxAligned(p: KPattern): { q: KPattern; m: number } | null {
  for (let m = 0, q = p; m < 4; m++, q = q.applyAlg("R' L")) if (solvedAt(q, BLOCK_L)) return { q, m };
  return null;
}

function rouxGoal(stage: StageRoux, p: KPattern): boolean {
  const aligned = rouxAligned(p);
  if (!aligned || stage === 'roux-fb') return !!aligned;
  const { q, m } = aligned;
  if (!solvedAt(q, BLOCK_R)) return false;
  if (stage === 'roux-sb') return true;
  const top = llTurns(q, 'U').find((x) => [0, 1, 2, 3].every((i) => x.patternData.CORNERS.pieces[i] === i && x.patternData.CORNERS.orientation[i] === 0));
  if (!top || stage === 'cmll') return !!top;
  if (!LSE_EDGES.every((i) => q.patternData.EDGES.orientation[i] === 0)) return false;
  if (stage === 'lse-eo') return true;
  const home = (edges: number[]) => edges.every((i) => top.patternData.EDGES.pieces[i] === i);
  if (stage === 'lse-ulur') return home([1, 3]);
  return m === 0 && home(LSE_EDGES); // lse-4c: the M slice lined up too
}

// A whole-cube turn by the frame it leaves (expand's): seenAfter(p, it) is the cube as the person holding it that way sees it.
const ROTATION_OF = new Map(ROTATIONS.map((r) => [JSON.stringify(expand(r, IDENTITY).frame), r]));

/**
 * Whether a case of `stage` is done. `held`: the face whose center is the last layer's color (the user frame's U,
 * YELLOW_UP.U on the cube, any face color neutral), or the whole grip's frame, which Roux's goals need (its left
 * block is the user's left). With only a face, Roux's left is L ('U'), R ('D': the GAN cube, a z2) or as TO_U turns it.
 */
export function goalReached(stage: Stage, p: KPattern, held: Face | Frame): boolean {
  if (isRoux(stage)) {
    if (typeof held !== 'string') return rouxGoal(stage, seenAfter(p, ROTATION_OF.get(JSON.stringify(held))!));
    return rouxGoal(stage, held === 'U' ? p : seenAfter(p, held === 'D' ? 'z2' : TO_U[held]!));
  }
  const llFace = typeof held === 'string' ? held : held.U;
  if (is2x2(stage)) return goal2x2(stage, held2x2(llFace === 'U' ? p : seenAfter(p, TO_U[llFace] ?? 'x2')));
  const rot = TO_U[llFace];
  if (rot) return goalReached(stage, seenAfter(p, rot), 'U');
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
    case 'coll':
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
export type Rng = () => number;
export const pick = <T>(rng: Rng, xs: T[]): T => xs[Math.floor(rng() * xs.length)];

// Random quiz states are products of U turns and other cases' algorithms (as center turns). A pool may only hold
// algorithms that keep its stage's goal: every goal is a group of states, so then any product keeps it too.
// quizPool filters by goal, since a stage may hold algorithms that don't (cube.test.ts checks pools aren't emptied).
const LL2: Stage[] = ['2x2-oll', '2x2-pbl', '2x2-ll-corners'];
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
  '2x2-first-layer': LL2,
  '2x2-first-face': LL2,
  '2x2-oll': ['2x2-pbl', '2x2-ll-corners'], // the ones that keep the first layer too (POOL_KEEPS)
  '2x2-pbl': [],
  '2x2-ll-corners': [],
  coll: ['pll-edges'], // edges permuted, corners kept
  // Roux: the later steps keep the earlier ones (quizPool keeps only those that leave the M slice lined up)
  'roux-fb': ['roux-sb', 'cmll', 'lse-eo', 'lse-ulur', 'lse-4c'],
  'roux-sb': ['cmll', 'lse-eo', 'lse-ulur', 'lse-4c'],
  cmll: ['lse-eo', 'lse-ulur', 'lse-4c'],
  'lse-eo': ['lse-ulur', 'lse-4c'],
  // none: with the top turned, a 4c algorithm's M turns carry UL/UR into the M slice (that goal is no group), so AUFs only
  'lse-ulur': [],
  'lse-4c': [],
};
// ponytail: one pool per stage, so the 2x2 OLL quiz keeps the first layer solved: right for the beginner's OLL, and
// Ortega's doesn't care. Mix in Ortega's bottom permutations here if its quiz should show them.
const POOL_KEEPS: Partial<Record<Stage, Stage>> = { '2x2-oll': '2x2-first-layer' };
const COUNTS: Record<Stage, number[]> = {
  'first-layer': [3, 4], 'second-layer': [3, 4], f2l: [3, 4], 'oll-cross': [2, 3], 'oll-corners': [2, 3], 'pll-corners': [0, 1],
  'pll-edges': [0], 'll-edges': [2, 3], 'll-corners-placed': [0, 1], 'll-corners-twist': [0],
  '2x2-first-layer': [2, 3], '2x2-first-face': [2, 3], '2x2-oll': [1, 2], '2x2-pbl': [0], '2x2-ll-corners': [0],
  coll: [0, 1], 'roux-fb': [2, 3], 'roux-sb': [2, 3], cmll: [1, 2], 'lse-eo': [1, 2], 'lse-ulur': [0, 1], 'lse-4c': [0],
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
    const keep = POOL_KEEPS[stage];
    const algs = poolAlgs(POOL_STAGES[stage])
      // 2x2: held back DLB home, so the next one starts from the same grip (goals hold up to a whole-cube turn, products don't)
      .map((a) => (is2x2(stage) ? [...a, ...holdFor(solved.applyAlg(a.join(' '))).moves] : a))
      .filter((a) => [stage, ...(keep ? [keep] : [])].every((s) => goalReached(s, solved.applyAlg(a.join(' ')), 'U')))
      // Roux: only algorithms that end with the M slice lined up. One that leaves it off by an M turn keeps the goal from
      // solved, but the next one, done as if the centers were home, would turn a block's layer instead of the top.
      .filter((a) => !isRoux(stage) || rouxAligned(solved.applyAlg(a.join(' ')))?.m === 0);
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
/**
 * Practicar's scramble, for learning: exactly the chosen algorithm backwards, so the solution is exactly the algorithm
 * (no extra U turns). Not a random state: the Quiz does that.
 */
export function practiceSpec(c: Case, alg: string): QuizSpec {
  // inverted after the conversion to center turns, like caseState: an algorithm with a rotation (y' r' U' R U M') then works
  return { caseId: c.id, moves: merge(invertTokens(centerMoves(tokenize(alg), IDENTITY))), auf: '' };
}

export function makeQuizItems(cases: Case[], perCase: number, seed: number, kpuzzle: KPuzzle): QuizSpec[] {
  const rng = mulberry32(seed);
  const items: QuizSpec[] = [];
  for (let round = 0; round < perCase; round++) {
    const order = cases.map((c) => [rng(), c] as const).sort((a, b) => a[0] - b[0]).map(([, c]) => c);
    if (order.length > 1 && order[0].id === items.at(-1)?.caseId) order.push(order.shift()!); // no repeat at the seam
    for (const c of order) items.push(unsolvedSpec(rng, c, kpuzzle));
  }
  return items;
}

function unsolvedSpec(rng: Rng, c: Case, kpuzzle: KPuzzle): QuizSpec {
  let spec = quizSpec(rng, c, kpuzzle);
  // ponytail: a random LL can't undo a setup today; this guard only bounds a future data mistake.
  for (let i = 0; i < 10 && goalReached(c.stage, quizPattern(kpuzzle, spec, IDENTITY), 'U'); i++) spec = quizSpec(rng, c, kpuzzle);
  return spec;
}

/** A random state of each case of `order`, in that order (deterministic for a seed): for orders made elsewhere. */
export function specsFor(order: Case[], seed: number, kpuzzle: KPuzzle): QuizSpec[] {
  const rng = mulberry32(seed);
  return order.map((c) => unsolvedSpec(rng, c, kpuzzle));
}

/** A scramble from solved to `p` found by the solver (a random-state scramble): unlike the merged setup it doesn't
 *  end in the case's algorithm backwards. `p` has its centers home, so the scramble is face turns only. A 2x2: the
 *  corners of `p` exactly (U, F, L and R turns), so the cube ends held as the diagram shows it. */
export async function randomStateScramble(p: KPattern, puzzle: Puzzle = '3x3x3'): Promise<string[]> {
  const solution = puzzle === '2x2x2'
    ? await experimentalSolve2x2x2(new KPattern(await cube2x2x2.kpuzzle(), { CORNERS: p.patternData.CORNERS }))
    : await experimentalSolve3x3x3IgnoringCenters(p);
  return merge(solution.invert().toString().split(' ').filter(Boolean)); // merge: "R2'" is "R2"
}

/** The quiz state on a cube held in `frame` (YELLOW_UP for the GAN cube, IDENTITY for diagrams). */
export function quizPattern(kpuzzle: KPuzzle, spec: QuizSpec, frame: Frame): KPattern {
  return kpuzzle.defaultPattern().applyAlg(spec.moves.map((m) => mapMove(m, frame)).join(' '));
}

/** Reference length (HTM) of solving the case with `variant` after `auf`, to compare the user's solve against. */
export function referenceMoves(_c: Case, variant: AlgVariant, auf: Auf): number {
  return htm(centerMoves(`${auf} ${variant.alg}`, IDENTITY));
}

/** The 24 ways to hold the cube (which color up × a y turn), as frames of the user frame: place -> color (user face). */
export const HOLDS: Frame[] = ROTATIONS.map((r) => expand(r, IDENTITY).frame);

/** The whole-cube turn from yellow up, green front to `hold`: a 3D player's, after its z2, so it shows the colors the
 *  figures paint for that hold (heldColors). */
export const holdRotation = (hold: Frame): string =>
  ROTATIONS[HOLDS.findIndex((h) => (Object.keys(h) as Face[]).every((f) => h[f] === hold[f]))] ?? '';

/** A 3D player's stickering mask, per piece and sticker (cubing.js's StickeringMask). */
export type HeldMask = { orbits: Record<string, { pieces: { facelets: string[] }[] }> };
const STICKERS = { EDGES: 2, CORNERS: 3, CENTERS: 1 } as const;
// cubing.js's serialized piece masks, as its parser reads them: the first sticker (the U/D one, or F/B) and the rest
const PIECE: Record<string, [string, string]> = {
  '-': ['regular', 'regular'], D: ['dim', 'dim'], I: ['ignored', 'ignored'], X: ['invisible', 'invisible'],
  O: ['regular', 'ignored'], P: ['dim', 'regular'], o: ['dim', 'ignored'],
};

// A 3D player starts from z2 (yellow up), so cubing.js's named stickerings, which pick pieces by their
// home (white = last layer), would grey the wrong layer. These masks name the pieces by home slot instead:
// yellow = cubing's D layer. Order: EDGES UF UR UB UL DF DR DB DL FR FL BR BL, CORNERS UFR URB UBL ULF DRF DFL DLB DBR.
// D = dim, I = ignored, O = only the yellow sticker, P = only the side colors, - = regular.
export const MASKS: Record<Stage, string> = {
  'first-layer': 'EDGES:----IIIIIIII,CORNERS:----IIII,CENTERS:------', // the white pieces only
  'second-layer': 'EDGES:DDDDIIII----,CORNERS:DDDDIIII,CENTERS:------', // the four middle-layer edges in color
  f2l: 'EDGES:DDDDIIIID-DD,CORNERS:DDD-IIII,CENTERS:------', // the green-orange pair stays in color
  'oll-cross': 'EDGES:DDDDOOOODDDD,CORNERS:DDDDIIII,CENTERS:------',
  'oll-corners': 'EDGES:DDDDOOOODDDD,CORNERS:DDDDOOOO,CENTERS:------',
  'pll-corners': 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:------',
  'pll-edges': 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:------',
  'll-edges': 'EDGES:DDDD----DDDD,CORNERS:DDDDIIII,CENTERS:------',
  'll-corners-placed': 'EDGES:DDDD----DDDD,CORNERS:DDDD----,CENTERS:------',
  'll-corners-twist': 'EDGES:DDDD----DDDD,CORNERS:DDDD----,CENTERS:------',
  // the 2x2 player has corners only
  '2x2-first-layer': 'CORNERS:----IIII',
  '2x2-first-face': 'CORNERS:OOOOIIII', // only the white stickers
  '2x2-oll': 'CORNERS:DDDDOOOO',
  '2x2-pbl': 'CORNERS:--------',
  '2x2-ll-corners': 'CORNERS:DDDD----',
  coll: 'EDGES:DDDD----DDDD,CORNERS:DDDD----,CENTERS:------', // the last layer in full: its edges are read too
  // Roux (yellow up, so the user's L block is cubing's R side): each step's own pieces, the blocks already built dim
  'roux-fb': 'EDGES:I-IIIIII-I-I,CORNERS:--IIIIII,CENTERS:III-II', // the left block and its center
  'roux-sb': 'EDGES:IDI-IIIID-D-,CORNERS:DD--IIII,CENTERS:I-IDII',
  cmll: 'EDGES:IDIDIIIIDDDD,CORNERS:DDDD----,CENTERS:IDIDII', // the top corners only
  'lse-eo': 'EDGES:-D-D----DDDD,CORNERS:DDDDDDDD,CENTERS:-D-D--', // the 6 edges and the M slice's centers
  'lse-ulur': 'EDGES:-D-D----DDDD,CORNERS:DDDDDDDD,CENTERS:-D-D--',
  'lse-4c': 'EDGES:-D-D----DDDD,CORNERS:DDDDDDDD,CENTERS:-D-D--',
};
// The white cross (cubing's U layer, yellow up after z2): its 4 edges and the centers, as its figure (diagram.ts's
// 'cross' mask). Every piece in color, per puzzle: a player's default when it shows no case.
export const CROSS_MASK = 'EDGES:----IIIIIIII,CORNERS:IIIIIIII,CENTERS:------';
export const FULL_MASK: Record<Puzzle, string> = { '3x3x3': 'EDGES:------------,CORNERS:--------,CENTERS:------', '2x2x2': 'CORNERS:--------' };

/** A player's mask (MASKS: pieces by home slot, for the cube held yellow up after its z2) for the cube
 *  held as `hold`: each piece takes, sticker by sticker, the mask of the one in its place when held yellow up, so
 *  the stage's pieces stay where the figure shows them (the last layer on top, whatever its color). On a sticker:
 *  piece sticker k shows at its slot's sticker (k - orientation), as facelets.ts reads cubing.js's states. */
export function heldMask(kpuzzle: KPuzzle, mask: string, hold: Frame): HeldMask | string {
  const turn = holdRotation(hold);
  if (!turn) return mask;
  const [yellowUp, held] = ['z2', `z2 ${turn}`].map((a) => kpuzzle.defaultPattern().applyAlg(a).patternData);
  const orbits: HeldMask['orbits'] = {};
  for (const part of mask.split(',')) {
    const [name, chars] = part.split(':') as [keyof typeof STICKERS, string];
    const n = STICKERS[name];
    const from = [...chars].map((c) => [PIECE[c][0], ...Array<string>(n - 1).fill(PIECE[c][1])]);
    const pieces = from.map(() => ({ facelets: Array<string>(n) }));
    const [y, h] = [yellowUp[name], held[name]];
    for (let i = 0; i < from.length; i++) for (let s = 0; s < n; s++) {
      pieces[h.pieces[i]].facelets[(s + h.orientation[i]) % n] = from[y.pieces[i]][(s + y.orientation[i]) % n];
    }
    orbits[name] = { pieces };
  }
  return { orbits };
}

/** A cube in `frame` (user face -> center) held as `hold`: place -> center, e.g. holdIn(hold, YELLOW_UP) on the GAN cube. */
export const holdIn = (hold: Frame, frame: Frame): Frame =>
  Object.fromEntries((Object.keys(hold) as Face[]).map((f) => [f, frame[hold[f]]])) as Record<Face, Face>;

// --- Full last layer (OLL then PLL in one go) ---

/** The last-layer steps in solving order: a 1-look method has cases of one OLL and one PLL stage, a 2-look one of all. */
export const LL_STEPS: Stage[] = ['oll-cross', 'oll-corners', 'pll-corners', 'pll-edges'];

/** `n` random last-layer states (F2L solved, OLL, PLL and AUFs anything; none solved up to an AUF), deterministic per
 *  seed. ponytail: products of the pooled LL algorithms like the F2L quiz's, close to uniform; enumerate the 62208
 *  states if exact odds matter. `caseId` is empty: the state's cases depend on the method (llSteps). */
export function llSpecs(n: number, seed: number, kpuzzle: KPuzzle): QuizSpec[] {
  const rng = mulberry32(seed);
  const solved = kpuzzle.defaultPattern();
  return Array.from({ length: n }, () => {
    let moves: string[];
    do moves = merge(randomLL(rng, 'f2l', kpuzzle));
    while (goalReached('pll-edges', solved.applyAlg(moves.join(' ')), 'U'));
    return { caseId: '', moves, auf: '' };
  });
}

/** One step of a last-layer solve: the case, the AUF before it and its algorithm (as written). */
export interface LLStep {
  c: Case;
  auf: Auf;
  alg: string;
}

/** How `cases` (a method's OLL and PLL sets) solve the last-layer state `p` (user frame) with `alg` of each case: the
 *  case of each step and its AUF, in order; a step already done is left out (a skip). null when no case fits. */
export function llSteps(p: KPattern, cases: Case[], alg: (c: Case) => string): LLStep[] | null {
  const steps: LLStep[] = [];
  for (const stage of LL_STEPS) {
    const own = cases.filter((c) => c.stage === stage);
    if (!own.length || goalReached(stage, p, 'U')) continue;
    let next: KPattern | null = null;
    for (const c of own) {
      for (const auf of AUFS) {
        const q = p.applyAlg(centerMoves(`${auf} ${alg(c)}`, IDENTITY).join(' '));
        if (!goalReached(stage, q, 'U')) continue;
        steps.push({ c, auf, alg: alg(c) });
        next = q;
        break;
      }
      if (next) break;
    }
    if (!next) return null;
    p = next;
  }
  return steps;
}

// "Pinta tu cubo", guided: the painted state solved stage by stage with the beginner's method (academy/beginner.ts),
// yellow up and white down (the user frame). The white cross is cross.ts's shortest one; every other stage is a greedy
// search over macros — a y rotation, a U turn and one of the stage's case algorithms — keeping the macro that solves
// the most pieces of the stage. When none solves one more, two macros in a row: the first takes a stuck piece out.
// Every step strictly adds solved pieces, so each stage ends; a stage that doesn't throws (beginnerSolve.test.ts).
import type { KPattern, KTransformation } from 'cubing/kpuzzle';
import { beginner } from './academy/beginner.ts';
import { goalReached } from './academy/cube.ts';
import { solveCross } from './academy/cross.ts';
import type { Stage } from './academy/types.ts';
import { IDENTITY, expand, merge, tokenize, type Frame } from './notation.ts';

export type BStage = 'cross' | Stage;
export const BSTAGES: BStage[] = ['cross', 'first-layer', 'second-layer', 'oll-cross', 'll-edges', 'll-corners-placed', 'll-corners-twist'];

export interface BStep {
  stage: BStage;
  /** cross: the shortest white cross; case: a case's algorithm; out: a case's algorithm that takes a stuck piece
   *  out (the next step puts it in); auf: the last U turn. */
  kind: 'cross' | 'case' | 'out' | 'auf';
  caseId?: string; // case and out: the case whose main algorithm `alg` is
  setup: string[]; // a y rotation and/or a U turn before the algorithm, as you hold the cube
  alg: string[];
  pieces: string[]; // first two layers: the pieces it solves (out: takes out), by home slot ('DRF', 'FR'…)
}

// cubing.js 3x3x3 orbit slot order, as cube.ts.
const ORBITS = [
  ['EDGES', 'UF UR UB UL DF DR DB DL FR FL BR BL'.split(' ')],
  ['CORNERS', 'UFR URB UBL ULF DRF DFL DLB DBR'.split(' ')],
] as const;

/** Slots whose own piece is home and oriented. */
function solved(p: KPattern): string[] {
  const out: string[] = [];
  for (const [orbit, names] of ORBITS) {
    const { pieces, orientation } = p.patternData[orbit];
    names.forEach((name, i) => pieces[i] === i && orientation[i] === 0 && out.push(name));
  }
  return out;
}

/** Pieces (by home slot) that sat wrong in one of `own`'s slots and that the step from `a` to `b` moved. */
function movedOut(a: KPattern, b: KPattern, own: (slot: string) => boolean): string[] {
  const out: string[] = [];
  for (const [orbit, names] of ORBITS) {
    const x = a.patternData[orbit], y = b.patternData[orbit];
    names.forEach((name, i) => {
      const piece = names[x.pieces[i]];
      const wrong = x.pieces[i] !== i || x.orientation[i] !== 0;
      const moved = y.pieces[i] !== x.pieces[i] || y.orientation[i] !== x.orientation[i];
      if (own(name) && own(piece) && wrong && moved) out.push(piece);
    });
  }
  return out;
}

const aufs = (p: KPattern) => [p, p.applyMove('U'), p.applyMove('U2'), p.applyMove("U'")];
const top = (slot: string) => slot.includes('U');
const most = (p: KPattern, n: (q: KPattern) => number) => Math.max(...aufs(p).map(n));
const crossDone = (p: KPattern) => ['DF', 'DR', 'DB', 'DL'].every((e) => solved(p).includes(e));

interface StageDef {
  id: Stage;
  phase: string; // beginner.ts phase whose cases it uses
  keep: (p: KPattern) => boolean; // what the stages before solved
  count: (p: KPattern) => number; // solved pieces of the stage: grows with every step
  own: (slot: string) => boolean; // the pieces steps name
  turns?: string[]; // U turns allowed before an algorithm (default all)
}
const after = (stage: Stage) => (p: KPattern) => goalReached(stage, p, 'U');
const none = () => false;
const STAGES: StageDef[] = [
  { id: 'first-layer', phase: 'prin-capa1', keep: crossDone, count: (p) => solved(p).filter((s) => s.includes('D')).length, own: (s) => s.includes('D') },
  { id: 'second-layer', phase: 'prin-capa2', keep: after('first-layer'), count: (p) => solved(p).filter((s) => !top(s)).length, own: (s) => !top(s) },
  { id: 'oll-cross', phase: 'prin-cruz', keep: after('second-layer'), count: (p) => p.patternData.EDGES.orientation.slice(0, 4).filter((o) => !o).length, own: none },
  { id: 'll-edges', phase: 'prin-aristas', keep: after('oll-cross'), count: (p) => most(p, (q) => solved(q).filter((s) => top(s) && s.length === 2).length), own: none },
  {
    id: 'll-corners-placed', phase: 'prin-esquinas', keep: after('ll-edges'), own: none, turns: [''], // the method: rotate, don't turn U
    count: (p) => most(p, (q) => (solved(q).filter((s) => top(s) && s.length === 2).length < 4 ? 0 : q.patternData.CORNERS.pieces.slice(0, 4).filter((x, i) => x === i).length)),
  },
  { id: 'll-corners-twist', phase: 'prin-orientar', keep: after('ll-corners-placed'), count: (p) => most(p, (q) => solved(q).filter(top).length), own: none },
];

type Macro = { caseId: string; setup: string[]; alg: string[] };
const ROTATIONS = ['', 'y', 'y2', "y'"];
const TURNS = ['', 'U', "U'", 'U2'];

const macroCache = new Map<string, Macro[]>();
/** Every rotation × U turn × case of the stage's phase (main algorithm). */
function macros(def: StageDef): Macro[] {
  let ms = macroCache.get(def.phase);
  if (!ms) {
    const cases = beginner.phases.find((p) => p.id === def.phase)!.groups.flatMap((g) => g.cases);
    ms = ROTATIONS.flatMap((r) => (def.turns ?? TURNS).flatMap((u) => cases.map((c) => ({ caseId: c.id, setup: [r, u].filter(Boolean), alg: tokenize(c.algs[0].alg) }))));
    macroCache.set(def.phase, ms);
  }
  return ms;
}

const playCache = new Map<string, { t: KTransformation; frame: Frame }>();
/** The macro done holding the cube in `frame` (only y rotations happen: 4 frames). Centres never move. */
function play(p: KPattern, frame: Frame, m: Macro): { p: KPattern; frame: Frame } {
  const key = `${Object.values(frame).join('')} ${m.setup.join(' ')} ${m.caseId}`;
  let c = playCache.get(key);
  if (!c) {
    const x = expand([...m.setup, ...m.alg], frame);
    c = { t: p.kpuzzle.algToTransformation(x.steps.flatMap((s) => s.moves).join(' ')), frame: x.frame };
    playCache.set(key, c);
  }
  return { p: p.applyTransformation(c.t), frame: c.frame };
}

type Try = { m: Macro; p: KPattern; frame: Frame; n: number; cost: number };
function tries(def: StageDef, p: KPattern, frame: Frame): Try[] {
  return macros(def).flatMap((m) => {
    const r = play(p, frame, m);
    return def.keep(r.p) ? [{ m, ...r, n: def.count(r.p), cost: m.setup.length + m.alg.length }] : [];
  });
}

const MAX_STEPS = 12; // per stage: every step solves a piece, so at most 8 (1000 random states: 6)

/** The steps that solve `start` (user frame, centres home) with the beginner's method. Throws if it can't. */
export function beginnerSolve(start: KPattern): BStep[] {
  const steps: BStep[] = [];
  let p = start;
  let frame = IDENTITY;
  if (!crossDone(p)) {
    const alg = solveCross(p, 'D', 1)[0];
    steps.push({ stage: 'cross', kind: 'cross', setup: [], alg, pieces: [] });
    p = p.applyAlg(alg.join(' '));
  }
  for (const def of STAGES) {
    const step = (t: Try, kind: BStep['kind'], pieces: string[]) => {
      steps.push({ stage: def.id, kind, caseId: t.m.caseId, setup: t.m.setup, alg: t.m.alg, pieces });
      ({ p, frame } = t);
    };
    const newly = (a: KPattern, b: KPattern) => solved(b).filter((s) => def.own(s) && !solved(a).includes(s));
    for (let k = 0; !goalReached(def.id, p, 'U'); k++) {
      if (k >= MAX_STEPS) throw new Error(`beginnerSolve: ${def.id} not solved`);
      const base = def.count(p);
      let best: Try | undefined;
      for (const x of tries(def, p, frame)) if (!best || x.n > best.n || (x.n === best.n && x.cost < best.cost)) best = x;
      if (best && best.n > base) {
        step(best, 'case', newly(p, best.p));
        continue;
      }
      let pair: [Try, Try] | undefined; // nothing solves one more: a stuck piece
      for (const a of tries(def, p, frame)) {
        if (a.n < base) continue;
        for (const b of tries(def, a.p, a.frame)) {
          if (b.n > base && (!pair || b.n > pair[1].n || (b.n === pair[1].n && a.cost + b.cost < pair[0].cost + pair[1].cost))) pair = [a, b];
        }
      }
      if (!pair) throw new Error(`beginnerSolve: ${def.id} stuck`);
      const [a, b] = pair;
      const before = p;
      const inNext = newly(a.p, b.p);
      const out = movedOut(before, a.p, def.own);
      step(a, 'out', out.length ? out : inNext);
      step(b, 'case', inNext);
    }
  }
  const auf = TURNS.find((u) => solved(u ? p.applyMove(u) : p).length === 20);
  if (auf === undefined) throw new Error('beginnerSolve: not solved');
  if (auf) steps.push({ stage: 'll-corners-twist', kind: 'auf', setup: [], alg: [auf], pieces: [] });
  return steps;
}

/** All the steps' tokens in a row, as you'd do them. */
/** What to show and play: a setup U that meets the algorithm's first U merges with it ("U U'" vanishes). `setup` of them are preparation. */
export function stepView(s: BStep): { tokens: string[]; setup: number } {
  const setup = [...s.setup];
  let alg = s.alg;
  if (/^U/.test(setup.at(-1) ?? '') && /^U/.test(alg[0] ?? '')) alg = [...merge([setup.pop()!, alg[0]]), ...alg.slice(1)];
  return { tokens: [...setup, ...alg], setup: setup.length };
}
export const stepTokens = (s: BStep): string[] => stepView(s).tokens;

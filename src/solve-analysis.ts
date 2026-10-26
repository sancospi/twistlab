// Solve analysis (smart cube): a solve's moves and times split into CFOP's steps (the cross, the 4 F2L pairs, OLL, PLL
// and the last AUF), each with its time, moves and recognition (the pause before its first move), plus the OLL and PLL
// cases met. Moves are the cube's: its centers never move (a smart cube reports face turns), so a face is a color.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { CORNERS, EDGES, OPPOSITE, goalReached, llSteps, turnToUp, withUp } from './academy/cube.ts';
import { cfopReduced } from './academy/cfop.ts';
import { cfopFull } from './academy/cfopFull.ts';
import { crossDistance, solveCross } from './academy/cross.ts';
import { crossGuide } from './academy/crossGuide.ts';
import { allCases } from './academy/methods.ts';
import { load } from './academy/store.ts';
import { YELLOW_UP, invertTokens, turnCount, unmapMove, type Face } from './notation.ts';

export const ANALYSIS_KEY = 'cube-analysis';
/** The newest ones kept: ~0.5 KB each, far under the account's 512 KB per key. */
export const MAX_ANALYSES = 200;

/** As stored: `at` = its result's, `m` the moves (cube frame), `t` the ms from the previous move (the first: from the
 *  start), `c` the cross's face, `s` the moves done at the end of the cross, each pair, OLL and PLL (the AUF: the rest),
 *  `oll` / `pll` the case met (none: a skip), `o2` / `p2` when that step took two algorithms (2-look): the reduced
 *  CFOP's case of each, and the moves done when the second began. */
export interface Analysis { at: number; m: string; t: number[]; c: Face; s: number[]; oll?: string; pll?: string; o2?: TwoLook; p2?: TwoLook }
type TwoLook = [first: string, second: string, at: number];

export const STEPS = ['cross', 'f2l1', 'f2l2', 'f2l3', 'f2l4', 'oll', 'pll', 'auf'] as const;
export type StepKey = (typeof STEPS)[number];
/** One step: `ms` from the end of the previous one, `recog` of them before its first move (the rest is execution). */
export interface Step { key: StepKey; moves: number; ms: number; recog: number }

const FACES: Face[] = ['U', 'D', 'F', 'B', 'R', 'L'];
const solvedAt = (p: KPattern, orbit: 'EDGES' | 'CORNERS', i: number) => p.patternData[orbit].pieces[i] === i && p.patternData[orbit].orientation[i] === 0;
// Per cross face: its 4 edges, and its 4 F2L slots as [corner, edge] (the edge between the corner's two side faces)
const SLOTS = new Map(FACES.map((f) => [f, {
  cross: EDGES.flatMap((e, i) => (e.includes(f) ? [i] : [])),
  pairs: CORNERS.flatMap((c, i) => (c.includes(f) ? [[i, EDGES.findIndex((e) => !e.includes(f) && [...e].every((x) => c.includes(x)))]] : [])),
}]));
/** 0: no cross on `f`; else 1 + the F2L pairs solved (5: the first two layers). */
function level(p: KPattern, f: Face): number {
  const { cross, pairs } = SLOTS.get(f)!;
  return cross.every((i) => solvedAt(p, 'EDGES', i)) ? 1 + pairs.filter(([c, e]) => solvedAt(p, 'CORNERS', c) && solvedAt(p, 'EDGES', e)).length : 0;
}

const CASES = allCases(cfopFull);
const OLLS = CASES.filter((c) => c.stage === 'oll-corners');
const PLLS = CASES.filter((c) => c.stage === 'pll-edges');
const REDUCED = allCases(cfopReduced).filter((c) => c.stage !== 'f2l'); // the 2-look OLL and PLL
/** The case of `cases` met on `p` (its last layer on `ll`); undefined: already solved (a skip). */
const caseAt = (p: KPattern, ll: Face, cases: typeof CASES) => llSteps(withUp(p, ll), cases, (c) => c.algs[0].alg)?.[0]?.c.id;

/** The moves done (between `from` and `to`, both left out) after which a step's first half holds: OLL's edges oriented
 *  (`oll-cross`) or PLL's corners placed (`pll-corners`). Not a 1-look algorithm midway: they need the first two layers
 *  whole, which an algorithm breaks until its end; so any is where a second algorithm began. */
function midway(states: KPattern[], from: number, to: number, sub: 'oll-cross' | 'pll-corners', ll: Face): number[] {
  const out: number[] = [];
  if (goalReached(sub, states[from], ll)) return out; // the first half was already done (or skipped)
  for (let i = from + 1; i < to; i++) if (goalReached(sub, states[i], ll)) out.push(i);
  return out;
}

/** The state before each move of a solve that ends solved, and the solved one: `moves.length + 1` of them. */
function statesOf(kpuzzle: KPuzzle, moves: string[]): KPattern[] {
  const states = [kpuzzle.defaultPattern().applyAlg(invertTokens(moves).join(' '))];
  for (const m of moves) states.push(states[states.length - 1].applyMove(m));
  return states;
}

/**
 * Splits a solve that ends solved: `moves` (cube frame) and `times` (ms since the start, one per move). The cross is
 * the face whose first two layers got done first. Each step ends the first time its goal is met after the previous
 * one (0 moves: a skip; a pair broken and redone costs the next pair its time). ponytail: first times, as inserting a
 * pair or an LL algorithm breaks what's done for a moment; a pair made by chance and broken later ends a step early.
 * Made for CFOP: other methods (Roux, a beginner's layer by layer) still split, just oddly.
 */
export function analyseSolve(kpuzzle: KPuzzle, at: number, moves: string[], times: number[]): Analysis {
  const states = statesOf(kpuzzle, moves);
  const first = (f: Face, k: number) => states.findIndex((p) => level(p, f) >= k);
  // The last move can finish two faces' first two layers (a last-layer skip: the cross face's and the one opposite that
  // move's layer), so F2L done only on the last two states ties, and the earlier cross wins.
  const rank = (f: Face) => Math.min(first(f, 5), moves.length - 1) * (moves.length + 1) + first(f, 1);
  const c = FACES.reduce((a, b) => (rank(b) < rank(a) ? b : a));
  const ll = OPPOSITE[c];
  // the cross, then each pair: the first time after the previous step (inserting a pair breaks the cross for a moment)
  const ends: number[] = [];
  for (let k = 1; k <= 5; k++) ends.push(states.findIndex((p, i) => i >= (ends[k - 2] ?? 0) && level(p, c) >= k));
  const f2l = ends[4];
  const after = (from: number, stage: 'oll-corners' | 'pll-edges') => states.findIndex((p, i) => i >= from && goalReached(stage, p, ll));
  const oll = after(f2l, 'oll-corners');
  const pll = after(oll, 'pll-edges');
  const ollCase = caseAt(states[f2l], ll, OLLS);
  const pllCase = caseAt(states[oll], ll, PLLS);
  // done in two: the reduced CFOP's case of each half, from the real states (the corners' case depends on the edges' alg)
  const twoLook = (from: number, to: number, sub: 'oll-cross' | 'pll-corners'): TwoLook | undefined => {
    const j = midway(states, from, to, sub, ll)[0];
    const [first, second] = j === undefined ? [] : [caseAt(states[from], ll, REDUCED), caseAt(states[j], ll, REDUCED)];
    return first && second ? [first, second, j] : undefined;
  };
  const o2 = twoLook(f2l, oll, 'oll-cross');
  const p2 = twoLook(oll, pll, 'pll-corners');
  return {
    at, m: moves.join(' '), t: times.map((x, i) => Math.max(0, Math.round(x - (i ? times[i - 1] : 0)))), c, s: [...ends, oll, pll],
    ...(ollCase && { oll: ollCase }), ...(pllCase && { pll: pllCase }), ...(o2 && { o2 }), ...(p2 && { p2 }),
  };
}

/** The ms since the start at each move. */
const timesOf = (a: Analysis) => {
  const at: number[] = [];
  a.t.reduce((sum, dt) => (at.push(sum + dt), sum + dt), 0);
  return at;
};
/** The moves `from` to `to` (left out): their count, their time from the end of the move before, and its pause. */
function span(at: number[], from: number, to: number) {
  if (to === from) return { moves: 0, ms: 0, recog: 0 };
  const prev = from ? at[from - 1] : 0;
  return { moves: to - from, ms: at[to - 1] - prev, recog: at[from] - prev };
}

/** Each step's numbers (STEPS' order). */
export function stepsOf(a: Analysis): Step[] {
  const at = timesOf(a);
  const bounds = [0, ...a.s, a.t.length];
  return STEPS.map((key, k) => ({ key, ...span(at, bounds[k], bounds[k + 1]) }));
}

/** A stored 2-look half: two case ids and where the second began, inside its step (`from`..`to`). */
const isTwoLook = (v: unknown, from: number, to: number) =>
  Array.isArray(v) && v.length === 3 && typeof v[0] === 'string' && typeof v[1] === 'string' && Number.isInteger(v[2]) && v[2] > from && v[2] < to;

/** Stored analyses, newest first; anything malformed (storage, another device) is dropped. */
export function parseAnalyses(raw: unknown): Analysis[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((a): a is Analysis => {
    if (!a || typeof a !== 'object' || typeof a.at !== 'number' || typeof a.m !== 'string' || !FACES.includes(a.c)) return false;
    const n = a.m.split(' ').filter(Boolean).length;
    return Array.isArray(a.t) && a.t.length === n && a.t.every((x: unknown) => typeof x === 'number' && x >= 0)
      && Array.isArray(a.s) && a.s.length === 7 && a.s.every((x: unknown, i: number) => Number.isInteger(x) && (x as number) >= (i ? a.s[i - 1] : 0) && (x as number) <= n)
      && (a.oll === undefined || typeof a.oll === 'string') && (a.pll === undefined || typeof a.pll === 'string');
  }).map((a) => { // a bad 2-look half is left out, not the solve: its moves and times are what can't be rebuilt
    const { o2, p2, ...rest } = a;
    return { ...rest, ...(o2 && isTwoLook(o2, a.s[4], a.s[5]) && { o2 }), ...(p2 && isTwoLook(p2, a.s[5], a.s[6]) && { p2 }) };
  });
}

/** `a` first, then `list` without another of the same solve, capped. */
export const addAnalysis = (list: Analysis[], a: Analysis): Analysis[] => [a, ...list.filter((x) => x.at !== a.at)].slice(0, MAX_ANALYSES);

export type Group = 'cross' | 'f2l' | 'oll' | 'pll';
export const GROUP_OF: Record<StepKey, Group> = { cross: 'cross', f2l1: 'f2l', f2l2: 'f2l', f2l3: 'f2l', f2l4: 'f2l', oll: 'oll', pll: 'pll', auf: 'pll' };
/** A typical CFOP split of the time, PLL with its AUF. ponytail: one reference for every level (roughly a sub-20
 *  solver's, as commonly quoted); per-level ones if it matters. */
export const TYPICAL: Record<Group, number> = { cross: 0.12, f2l: 0.5, oll: 0.16, pll: 0.22 };

export interface Summary {
  n: number;
  steps: Step[]; // the mean of each
  total: number;
  /** Each group's mean, its recognition and how much over the typical split of `total` it is. */
  groups: { group: Group; ms: number; recog: number; over: number }[];
  /** The OLL and PLL cases met, slowest first: the mean time of their step, and of its recognition (the pause before).
   *  A step done in two (2-look): each half as its reduced CFOP case, the case the user really executed. */
  cases: { id: string; n: number; ms: number; recog: number }[];
}

export function summarize(list: Analysis[]): Summary {
  const all = list.map(stepsOf);
  const mean = (f: (s: Step[]) => number) => all.reduce((sum, s) => sum + f(s), 0) / all.length;
  const steps = STEPS.map((key, k) => ({ key, moves: mean((s) => s[k].moves), ms: mean((s) => s[k].ms), recog: mean((s) => s[k].recog) }));
  const total = steps.reduce((sum, s) => sum + s.ms, 0);
  const groups = (Object.keys(TYPICAL) as Group[]).map((group) => {
    const own = steps.filter((s) => GROUP_OF[s.key] === group);
    const ms = own.reduce((sum, s) => sum + s.ms, 0);
    return { group, ms, recog: own.reduce((sum, s) => sum + s.recog, 0), over: ms - TYPICAL[group] * total };
  });
  type Part = { ms: number; recog: number };
  const byCase = new Map<string, Part[]>();
  const add = (id: string, part: Part) => byCase.set(id, [...(byCase.get(id) ?? []), part]);
  list.forEach((a, i) => {
    const at = timesOf(a);
    for (const [id, two, k] of [[a.oll, a.o2, 5], [a.pll, a.p2, 6]] as const) {
      if (two) add(two[0], span(at, a.s[k - 1], two[2])), add(two[1], span(at, two[2], a.s[k]));
      else if (id) add(id, all[i][k]); // ponytail: analyses from before o2/p2 count a 2-look step under the full case, until newer ones push them out
    }
  });
  const avg = (s: Part[], f: (x: Part) => number) => s.reduce((sum, x) => sum + f(x), 0) / s.length;
  const cases = [...byCase].map(([id, s]) => ({ id, n: s.length, ms: avg(s, (x) => x.ms), recog: avg(s, (x) => x.recog) })).sort((a, b) => b.ms - a.ms);
  return { n: list.length, steps, total, groups, cases };
}

/** Progreso's means are over these many latest analyses. */
export const LAST = 50;
/** The slowest cases listed (Progreso, Hoy), drilled and trained (training.ts's "mine"). */
export const SLOWEST = 5;

/** The slowest cases of the latest smart-cube solves, slowest first (Hoy's and training's: Progreso's without its DNF
 *  filter). */
export function slowestCases(): Summary['cases'] {
  const list = parseAnalyses(load(ANALYSIS_KEY)).slice(0, LAST);
  return list.length ? summarize(list).cases : [];
}

/** What a solve could have done better, the most costly first. `save`: an estimate of the ms it cost. */
export type Lesson = { save: number } & (
  | { kind: 'cross'; extra: number; rot: string; alg: string[] } // turns over the shortest cross: `rot`, then `alg` (its length)
  | { kind: 'two-look'; step: 'oll' | 'pll' } // done in two algorithms; the case is a[step]
  | { kind: 'pause'; step: 'f2l' | 'pll' }); // long pauses before the pairs, or recognising the PLL

/**
 * The lessons of an analysed solve (`a` as analyseSolve made it):
 * - cross: more turns than the shortest cross (from the scrambled state) than its cross guide level lets over, plus 2.
 *   The shortest is given as the user would hold it: the white cross with yellow up, green front (the Academia's), the
 *   yellow one with white up, a side one after the whole-cube turn `rot` that puts it on D (white up, green front first).
 *   ponytail: skipped when the cross ends with a pair (an x-cross); a pair built during the cross and inserted right
 *   after still counts as cross, and a pair solved by chance hides a long cross. An x-cross optimum would fix both.
 * - two-look: the OLL's edges (or the PLL's corners) got done before the rest, by a first algorithm.
 * - pause: recognition over a floor, before the pairs (together) or the PLL.
 */
export function lessonsOf(kpuzzle: KPuzzle, a: Analysis): Lesson[] {
  const moves = a.m.split(' ').filter(Boolean);
  const states = statesOf(kpuzzle, moves);
  const steps = stepsOf(a);
  const ll = OPPOSITE[a.c];
  const out: Lesson[] = [];

  if (a.s[1] !== a.s[0]) {
    const side = a.c !== 'U' && a.c !== 'D';
    const view = side ? withUp(states[0], ll) : states[0];
    const face = a.c === 'U' ? 'U' : 'D';
    // ponytail: the first call per face builds the cross table (~40 ms on a desktop, cached after); warm it on connect if it nags
    const best = crossDistance(view, face);
    // ponytail: every turn counts, as in the cross trainer (crossTrainer.ts): a slip and its undo cost time
    const turns = turnCount(moves.slice(0, a.s[0]));
    const extra = turns - best;
    const level = crossGuide.levels.find((l) => best <= l.moves.max) ?? crossGuide.levels[crossGuide.levels.length - 1];
    if (extra > level.goal.overOptimal + 2) {
      const alg = solveCross(view, face, 1)[0];
      out.push({
        kind: 'cross', extra, rot: side ? turnToUp(ll) : '', alg: a.c === 'U' ? alg.map((m) => unmapMove(m, YELLOW_UP)) : alg,
        save: Math.round((steps[0].ms * extra) / turns), // ponytail: the cross's own pace; the user's mean TPS if it misleads
      });
    }
  }

  // ponytail: no pause needed to tell two algorithms from one: no 1-look OLL or PLL of the Academia goes through these
  // states midway (they need the first two layers whole, which an algorithm breaks until its end)
  const twoLook = (step: 'oll' | 'pll', from: number, to: number) => {
    const mid = midway(states, from, to, step === 'oll' ? 'oll-cross' : 'pll-corners', ll);
    // the longest pause after a midway state (one after an AUF counts too)
    if (mid.length) out.push({ kind: 'two-look', step, save: Math.max(...mid.map((i) => a.t[i])) });
  };
  twoLook('oll', a.s[4], a.s[5]);
  twoLook('pll', a.s[5], a.s[6]);

  // ponytail: fixed floors (a regrip or a y between steps is ~0.3–0.6 s, and the cube doesn't report rotations), or
  // twice the user's own median gap if they turn slower; per user from their history if they nag
  const sorted = [...a.t].sort((x, y) => x - y);
  const gap = 2 * sorted[sorted.length >> 1];
  const f2l = steps.slice(1, 5).reduce((sum, s) => sum + Math.max(0, s.recog - Math.max(gap, 600)), 0);
  if (f2l >= 1000) out.push({ kind: 'pause', step: 'f2l', save: f2l });
  const pll = Math.max(0, steps[6].recog - Math.max(gap, 800));
  if (pll >= 500) out.push({ kind: 'pause', step: 'pll', save: pll });

  return out.sort((x, y) => y.save - x.save);
}

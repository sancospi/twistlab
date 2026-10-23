// Solve analysis (smart cube): a solve's moves and times split into CFOP's steps (the cross, the 4 F2L pairs, OLL, PLL
// and the last AUF), each with its time, moves and recognition (the pause before its first move), plus the OLL and PLL
// cases met. Moves are the cube's: its centers never move (a smart cube reports face turns), so a face is a color.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { CORNERS, EDGES, OPPOSITE, goalReached, llSteps, withUp } from './academy/cube.ts';
import { cfopFull } from './academy/cfopFull.ts';
import { allCases } from './academy/methods.ts';
import { invertTokens, type Face } from './notation.ts';

export const ANALYSIS_KEY = 'cube-analysis';
/** The newest ones kept: ~0.5 KB each, far under the account's 512 KB per key. */
export const MAX_ANALYSES = 200;

/** As stored: `at` = its result's, `m` the moves (cube frame), `t` the ms from the previous move (the first: from the
 *  start), `c` the cross's face, `s` the moves done at the end of the cross, each pair, OLL and PLL (the AUF: the rest),
 *  `oll` / `pll` the case met (none: a skip). */
export interface Analysis { at: number; m: string; t: number[]; c: Face; s: number[]; oll?: string; pll?: string }

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
/** The case of `cases` met on `p` (its last layer on `ll`); undefined: already solved (a skip). */
const caseAt = (p: KPattern, ll: Face, cases: typeof CASES) => llSteps(withUp(p, ll), cases, (c) => c.algs[0].alg)?.[0]?.c.id;

/**
 * Splits a solve that ends solved: `moves` (cube frame) and `times` (ms since the start, one per move). The cross is
 * the face whose first two layers got done first. Each step ends the first time its goal is met after the previous
 * one (0 moves: a skip; a pair broken and redone costs the next pair its time). ponytail: first times, as inserting a
 * pair or an LL algorithm breaks what's done for a moment; a pair made by chance and broken later ends a step early.
 * Made for CFOP: other methods (Roux, a beginner's layer by layer) still split, just oddly.
 */
export function analyseSolve(kpuzzle: KPuzzle, at: number, moves: string[], times: number[]): Analysis {
  const states = [kpuzzle.defaultPattern().applyAlg(invertTokens(moves).join(' '))];
  for (const m of moves) states.push(states[states.length - 1].applyMove(m));
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
  return {
    at, m: moves.join(' '), t: times.map((x, i) => Math.max(0, Math.round(x - (i ? times[i - 1] : 0)))), c, s: [...ends, oll, pll],
    ...(ollCase && { oll: ollCase }), ...(pllCase && { pll: pllCase }),
  };
}

/** Each step's numbers (STEPS' order). */
export function stepsOf(a: Analysis): Step[] {
  const at: number[] = [];
  a.t.reduce((sum, dt) => (at.push(sum + dt), sum + dt), 0);
  const bounds = [0, ...a.s, a.t.length];
  return STEPS.map((key, k) => {
    const [from, to] = [bounds[k], bounds[k + 1]];
    if (to === from) return { key, moves: 0, ms: 0, recog: 0 };
    const prev = from ? at[from - 1] : 0;
    return { key, moves: to - from, ms: at[to - 1] - prev, recog: at[from] - prev };
  });
}

/** Stored analyses, newest first; anything malformed (storage, another device) is dropped. */
export function parseAnalyses(raw: unknown): Analysis[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((a): a is Analysis => {
    if (!a || typeof a !== 'object' || typeof a.at !== 'number' || typeof a.m !== 'string' || !FACES.includes(a.c)) return false;
    const n = a.m.split(' ').filter(Boolean).length;
    return Array.isArray(a.t) && a.t.length === n && a.t.every((x: unknown) => typeof x === 'number' && x >= 0)
      && Array.isArray(a.s) && a.s.length === 7 && a.s.every((x: unknown, i: number) => Number.isInteger(x) && (x as number) >= (i ? a.s[i - 1] : 0) && (x as number) <= n)
      && (a.oll === undefined || typeof a.oll === 'string') && (a.pll === undefined || typeof a.pll === 'string');
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
  /** The OLL and PLL cases met, slowest first: the mean time of their step. */
  cases: { id: string; n: number; ms: number }[];
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
  const byCase = new Map<string, number[]>();
  list.forEach((a, i) => {
    for (const [id, k] of [[a.oll, 5], [a.pll, 6]] as const) if (id) byCase.set(id, [...(byCase.get(id) ?? []), all[i][k].ms]);
  });
  const cases = [...byCase].map(([id, ms]) => ({ id, n: ms.length, ms: ms.reduce((a, b) => a + b, 0) / ms.length })).sort((a, b) => b.ms - a.ms);
  return { n: list.length, steps, total, groups, cases };
}

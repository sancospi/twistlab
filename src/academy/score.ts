// Quiz scoring: pure functions over a session's attempts, the reference to grade efficiency against, and the
// stored history of sessions (validated on read: storage may be corrupted or hand-edited).
import type { KPattern } from 'cubing/kpuzzle';
import { IDENTITY, amount, centerMoves, compact, htm, merge, tokenize } from '../notation.ts';
import { goalReached, referenceMoves, type Auf } from './cube.ts';
import { isDue, learnStatus, type Grade, type Learning } from './store.ts';
import type { AlgVariant, Case } from './types.ts';

export type QuizMode = 'recognition' | 'execution';

export interface Attempt {
  caseId: string;
  correct: boolean; // recognition: picked the right case; execution: solved it without skipping or looking
  recognitionMs: number; // until the answer (recognition) or the first move (execution)
  executionMs?: number; // first move to the stage goal
  moves?: number; // quarter turns reported by the cube
  htm?: number; // the same moves in half-turn metric
  refHtm?: number; // shortest known solution from that state
}

/** 1 = as short as the best known algorithm; never above 1 (a shorter solve is just as good). */
export const efficiency = (refHtm: number, userHtm: number): number => (userHtm > 0 ? Math.min(1, refHtm / userHtm) : 1);

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface Score {
  n: number;
  correct: number;
  accuracy: number; // 0..1
  recognitionMs: number | null; // averages over correct attempts only: a skipped or wrong one has no real time
  executionMs: number | null;
  ms: number | null; // recognition + execution
  efficiency: number | null;
}

export function score(attempts: Attempt[]): Score {
  const ok = attempts.filter((a) => a.correct);
  return {
    n: attempts.length,
    correct: ok.length,
    accuracy: attempts.length ? ok.length / attempts.length : 0,
    recognitionMs: mean(ok.map((a) => a.recognitionMs)),
    executionMs: mean(ok.flatMap((a) => a.executionMs ?? [])),
    ms: mean(ok.map((a) => a.recognitionMs + (a.executionMs ?? 0))),
    efficiency: mean(ok.flatMap((a) => (a.htm != null && a.refHtm != null ? efficiency(a.refHtm, a.htm) : []))),
  };
}

export interface CaseScore extends Score {
  caseId: string;
}

// No time / efficiency (nothing correct) sorts as the worst.
const worse = (a: Score, b: Score) =>
  a.accuracy - b.accuracy || (b.ms ?? Number.MAX_VALUE) - (a.ms ?? Number.MAX_VALUE) || (a.efficiency ?? -1) - (b.efficiency ?? -1);

/** Per-case scores, worst first: lowest accuracy, then slowest, then least efficient. */
export function byCase(attempts: Attempt[]): CaseScore[] {
  const groups = new Map<string, Attempt[]>();
  for (const a of attempts) groups.set(a.caseId, [...(groups.get(a.caseId) ?? []), a]);
  return [...groups].map(([caseId, as]) => ({ caseId, ...score(as) })).sort(worse);
}

export const SLOW = 1.5; // a case this many times slower than the session's average is worth repeating

/** Cases to repeat: any miss, or clearly slower than the rest of the session. */
export function toRetry(cases: CaseScore[], overall: Score): string[] {
  return cases.filter((c) => c.accuracy < 1 || (c.ms != null && overall.ms != null && c.ms > SLOW * overall.ms)).map((c) => c.caseId);
}

/** The U turn before `alg` that takes `p` (user frame) to the stage goal; null if none does. When several do (a
 *  symmetric case), the one that gives the fewest turns, e.g. the one that cancels the algorithm's first U. */
export function aufFor(c: Case, alg: string, p: KPattern): Auf | null {
  let best: Auf | null = null, bestLen = Infinity;
  for (const auf of ['', 'U', "U'", 'U2'] as const) {
    const moves = centerMoves(`${auf} ${alg}`, IDENTITY), len = htm(moves);
    if (len < bestLen && goalReached(c.stage, p.applyAlg(moves.join(' ')), 'U')) [best, bestLen] = [auf, len];
  }
  return best;
}

/** `n` quarter turns of `base` as one token, or none. */
const turn = (base: string, n: number): string[] => {
  const k = ((n % 4) + 4) % 4;
  return k ? [base + ['', '', '2', "'"][k]] : [];
};

/** `alg` with the AUF `p` needs, folded into its leading U turns: a y rotation doesn't move the U center and d is a
 *  U turn plus y', so "U2" + "y' U R'…" is "U' y' R'…" and "U2" + "d R'…" is "U' y' R'…". This is what the user is
 *  shown, so doing it exactly takes as many turns as the reference. */
export function solutionFor(c: Case, alg: string, p: KPattern): string {
  const tokens = tokenize(alg);
  const auf = aufFor(c, tokens.join(' '), p);
  if (!auf) return tokens.join(' ');
  let u = amount(auf), y = 0, i = 0;
  for (; i < tokens.length; i++) {
    const m = /^(U|y|d|Dw)(2'?|'|)$/.exec(tokens[i]);
    if (!m) break;
    const k = amount(`U${m[2]}`);
    if (m[1] === 'U') u += k;
    else if (m[1] === 'y') y += k;
    else [u, y] = [u + k, y - k];
  }
  return [...turn('U', u), ...turn('y', y), ...tokens.slice(i)].join(' ');
}

/** HTM of solving the case from `p` with `variant` (and the AUF it needs) — what a solve is compared with: the
 *  algorithm the user is practising, so efficiency measures the execution, not the choice of algorithm.
 *  Without a variant: the shortest of the case's algorithms. */
export function referenceHtm(c: Case, p: KPattern, variant?: AlgVariant): number | null {
  const lengths = (variant ? [variant] : c.algs).flatMap((v) => {
    const auf = aufFor(c, v.alg, p);
    return auf === null ? [] : [referenceMoves(c, v, auf)];
  });
  return lengths.length ? Math.min(...lengths) : null;
}

// --- Error review (solve mode): what was done vs what the practised algorithm does ---

export type Issue = 'skipped' | 'assisted' | 'extra';
export interface Review {
  mine: string[]; // the user's turns, compacted: undone slips stay (cube frame)
  expected: string[]; // the algorithm's turns with its AUF, merged (cube frame)
  divergeAt: number; // first index where they differ (mine.length when mine is a prefix of, or equal to, expected)
  extra: number; // turns beyond the algorithm's
  issue: Issue | null; // null: solved cleanly (the same length or shorter, even by another route)
}

const OPPOSITE: Record<string, string> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
/** Turns on opposite faces commute (a slice is reported as both, in either order): fix their order to compare. */
function canonical(moves: string[], fold: (m: string[]) => string[]): string[] {
  const out = fold(moves);
  for (let i = 0; i + 1 < out.length; i++) {
    if (OPPOSITE[out[i][0]] === out[i + 1][0] && out[i][0] > out[i + 1][0]) [out[i], out[i + 1]] = [out[i + 1], out[i]];
  }
  return out;
}

export function review(done: string[], expected: string[], skipped = false, assisted = false): Review {
  const mine = canonical(done, compact), exp = canonical(expected, merge); // the user's undone slips stay visible
  let i = 0;
  while (i < mine.length && i < exp.length && mine[i] === exp[i]) i++;
  const issue: Issue | null = skipped ? 'skipped' : assisted ? 'assisted' : mine.length > exp.length ? 'extra' : null;
  return { mine, expected: exp, divergeAt: i, extra: Math.max(0, mine.length - exp.length), issue };
}

// --- History ---

/** One finished session, compact: enough for "last result" and progress over time. */
export interface SessionRecord {
  scope: string;
  at: number; // epoch ms
  mode: QuizMode;
  n: number;
  accuracy: number;
  ms: number | null;
  efficiency: number | null;
}

// ponytail: a cap so a full storage quota can't silently stop saving; ~150 bytes a session, 1000 ≈ 150 kB
export const HISTORY_MAX = 1000;

export const addSession = (history: SessionRecord[], rec: SessionRecord): SessionRecord[] => [...history, rec].slice(-HISTORY_MAX);

export function lastSession(history: SessionRecord[], scope: string): SessionRecord | undefined {
  for (let i = history.length - 1; i >= 0; i--) if (history[i].scope === scope) return history[i];
  return undefined;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const isRatio = (n: unknown): n is number => isNum(n) && n <= 1;

/** Keeps only well-formed records (oldest first), at most HISTORY_MAX. */
export function parseHistory(raw: unknown): SessionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is SessionRecord =>
      !!r && typeof r === 'object' && typeof r.scope === 'string' && isNum(r.at) && (r.mode === 'recognition' || r.mode === 'execution') &&
      Number.isInteger(r.n) && r.n > 0 && isRatio(r.accuracy) && (r.ms === null || isNum(r.ms)) && (r.efficiency === null || isRatio(r.efficiency)))
    .map(({ scope, at, mode, n, accuracy, ms, efficiency }) => ({ scope, at, mode, n, accuracy, ms, efficiency }))
    .slice(-HISTORY_MAX);
}

// --- Smart trainer: which cases, in which order, and each item's grade for the spaced repetition ---

/** Solve mode grades itself: a clean solve is good, and easy when faster than the case's own average. */
export const autoGrade = (issue: Issue | null, ms: number, avgMs: number | null): Grade =>
  issue ? 'fail' : avgMs !== null && ms < avgMs ? 'easy' : 'good';

// ponytail: fixed thresholds; tune them here (or per stage) if they step in too early or too late
export const STUCK_EXTRA = 8; // turns beyond the algorithm's (with its AUF)
export const STUCK_MS = 60_000; // since the first turn

/** Solving on the smart cube: the quiz steps in and explains the algorithm past STUCK_EXTRA extra turns or STUCK_MS. */
export const isStuck = (turns: number, refHtm: number | null, ms: number): boolean =>
  (refHtm !== null && turns > refHtm + STUCK_EXTRA) || ms > Math.max(STUCK_MS, 6000 * (refHtm ?? 0)); // long algorithms get more time

export type Selection = 'one' | 'pick' | 'known' | 'learning' | 'slow' | 'due' | 'all';
export type Order = 'uniform' | 'probability' | 'spaced';

export interface SelectContext {
  one: Case | null; // the case the quiz was opened from
  picked: ReadonlySet<string>; // ticked by hand
  learning: (caseId: string) => Learning | undefined;
  now: number;
  timeKey: 'recognitionMs' | 'solveMs'; // the mode's time, for "slowest"
}

/** The cases of `pool` a selection asks; "slow" is the slowest third of those with a time, slowest first. */
export function selectCases(sel: Selection, pool: Case[], ctx: SelectContext): Case[] {
  const of = (c: Case) => ctx.learning(c.id);
  switch (sel) {
    case 'one': return ctx.one ? [ctx.one] : [];
    case 'pick': return pool.filter((c) => ctx.picked.has(c.id));
    case 'known':
    case 'learning': return pool.filter((c) => learnStatus(of(c)) === sel);
    case 'due': return pool.filter((c) => isDue(of(c), ctx.now));
    case 'slow': {
      const ms = (c: Case) => of(c)?.[ctx.timeKey] ?? null;
      const timed = pool.filter((c) => ms(c) !== null).sort((a, b) => ms(b)! - ms(a)!);
      return timed.slice(0, Math.ceil(timed.length / 3));
    }
    case 'all': return pool;
  }
}

/** `n` independent draws from `xs`, each as likely as its weight (an unknown one: the mean of the known ones). Repeats
 *  are allowed: "real probability" means a 4/5 case comes up 4 times in 5, even twice in a row. */
export function weightedOrder<T>(xs: T[], weights: (number | null)[], n: number, rng: () => number): T[] {
  const known = weights.filter((w): w is number => w !== null);
  const mean = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1;
  let w = xs.map((_, i) => weights[i] ?? mean);
  if (!w.some((x) => x > 0)) w = xs.map(() => 1); // all zero: uniform
  const total = w.reduce((a, b) => a + b, 0);
  const out: T[] = [];
  for (let k = 0; k < n && xs.length; k++) {
    let r = rng() * total, i = 0;
    while (i < xs.length - 1 && (r -= w[i]) >= 0) i++;
    if (w[i] === 0) i = w.findIndex((x) => x > 0); // rounding at the end of the range
    out.push(xs[i]);
  }
  return out;
}

/** Spaced review: the cases due today first, then the new ones, then the rest. */
export function spacedTiers(cases: Case[], learning: (caseId: string) => Learning | undefined, now: number): Case[][] {
  const due = cases.filter((c) => isDue(learning(c.id), now));
  const fresh = cases.filter((c) => !learning(c.id));
  const rest = cases.filter((c) => learning(c.id) && !isDue(learning(c.id), now));
  return [due, fresh, rest].filter((tier) => tier.length);
}

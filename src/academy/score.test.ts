import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { IDENTITY, centerMoves, htm, invertTokens, turnCount } from '../notation.ts';
import { goalReached, makeQuizItems, quizPattern } from './cube.ts';
import { METHODS, allCases, findCase } from './methods.ts';
import { cfopReduced } from './cfop.ts';
import {
  addSession, aufFor, autoGrade, byCase, efficiency, HISTORY_MAX, isStuck, lastSession, parseHistory, referenceHtm, review, score, selectCases,
  solutionFor, spacedTiers, STUCK_EXTRA, STUCK_MS, toRetry, weightedOrder, type Attempt, type SelectContext, type SessionRecord,
} from './score.ts';
import type { Learning } from './store.ts';
import type { Case } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();

test('efficiency: reference over user moves, capped at 1', () => {
  assert.equal(efficiency(7, 14), 0.5);
  assert.equal(efficiency(7, 5), 1);
  assert.equal(efficiency(7, 0), 1);
});

const rec = (caseId: string, correct: boolean, recognitionMs: number, extra: Partial<Attempt> = {}): Attempt => ({ caseId, correct, recognitionMs, ...extra });

test('score: accuracy over all, times and efficiency over correct attempts only', () => {
  const s = score([
    rec('a', true, 1000, { executionMs: 2000, htm: 8, refHtm: 8 }),
    rec('a', true, 3000, { executionMs: 4000, htm: 16, refHtm: 8 }),
    rec('b', false, 50, { executionMs: 99999, htm: 1, refHtm: 8 }),
  ]);
  assert.equal(s.n, 3);
  assert.equal(s.correct, 2);
  assert.equal(s.accuracy, 2 / 3);
  assert.equal(s.recognitionMs, 2000);
  assert.equal(s.executionMs, 3000);
  assert.equal(s.ms, 5000);
  assert.equal(s.efficiency, 0.75);
  assert.deepEqual(score([]), { n: 0, correct: 0, accuracy: 0, recognitionMs: null, executionMs: null, ms: null, efficiency: null });
  assert.equal(score([rec('a', true, 1)]).efficiency, null); // recognition mode: no efficiency
});

test('byCase: worst first (accuracy, then slower, then less efficient); toRetry picks misses and slow cases', () => {
  const attempts = [
    rec('fast', true, 1000), rec('fast', true, 1000),
    rec('slow', true, 4000), rec('slow', true, 4000),
    rec('miss', true, 1000), rec('miss', false, 1000),
    rec('never', false, 500),
    rec('mid', true, 2000, { htm: 10, refHtm: 5 }), rec('mid2', true, 2000, { htm: 5, refHtm: 5 }),
  ];
  const cases = byCase(attempts);
  assert.deepEqual(cases.map((c) => c.caseId), ['never', 'miss', 'slow', 'mid', 'mid2', 'fast']);
  assert.deepEqual(toRetry(cases, score(attempts)), ['never', 'miss', 'slow']); // slow: 4000 > 1.5 × 2000
});

test('aufFor / referenceHtm: official quiz items need the right U turn, and the reference is the shortest variant', () => {
  for (const q of cfopReduced.phases.flatMap((p) => p.quizzes)) {
    for (const it of q.items) {
      const c = findCase(it.answer)!;
      const p = kpuzzle.defaultPattern().applyAlg(centerMoves(it.scramble, IDENTITY).join(' '));
      assert.notEqual(aufFor(c, c.algs[0].alg, p), null, `${q.id} ${it.scramble}`);
      const ref = referenceHtm(c, p)!;
      assert.ok(ref > 0 && ref <= htm(centerMoves(c.algs[0].alg, IDENTITY)) + 1, q.id); // main alg + at most one AUF
      const own = referenceHtm(c, p, c.algs[0])!; // the practised algorithm: its own length, plus at most one AUF
      assert.ok(own >= ref && own - htm(centerMoves(c.algs[0].alg, IDENTITY)) <= 1, q.id);
    }
  }
  // Generated items: the stored AUF is one that works for the main algorithm.
  const sune = findCase('cfop-oll-sune')!;
  for (const spec of makeQuizItems([sune], 8, 42, kpuzzle)) {
    const p = quizPattern(kpuzzle, spec, IDENTITY);
    assert.notEqual(aufFor(sune, sune.algs[0].alg, p), null);
  }
  assert.equal(aufFor(sune, sune.algs[0].alg, kpuzzle.defaultPattern().applyAlg("F U F'")), null); // not this case at all
});

test('solutionFor: doing the shown solution exactly is a clean solve, as short as the reference', () => {
  const quarters = (moves: string[]) => moves.flatMap((m) => (m[1] === '2' ? [m[0], m[0]] : [m])); // as the cube reports them
  for (const c of METHODS.flatMap(allCases)) {
    for (const v of c.algs) {
      for (const auf of ['', 'U', "U'", 'U2']) {
        const p = kpuzzle.defaultPattern().applyAlg(invertTokens(centerMoves(`${auf} ${v.alg}`, IDENTITY)).join(' '));
        const sol = solutionFor(c, v.alg, p);
        const done = quarters(centerMoves(sol, IDENTITY));
        const at = `${c.id} ${v.id} ${auf}: ${sol}`;
        assert.ok(goalReached(c.stage, p.applyAlg(done.join(' ')), 'U'), at);
        assert.equal(review(done, centerMoves(sol, IDENTITY)).issue, null, at);
        assert.equal(turnCount(done), referenceHtm(c, p, v), at);
      }
    }
  }
  // A leading rotation or d doesn't stop the AUF from folding into the U turn after it
  const b4 = findCase('cfop-f2l-b4')!;
  const atB4 = (auf: string) => kpuzzle.defaultPattern().applyAlg(invertTokens(centerMoves(`${auf} y' U R' U R U' R' U' R`, IDENTITY)).join(' '));
  assert.equal(solutionFor(b4, "y' U R' U R U' R' U' R", atB4("U'")), "y' R' U R U' R' U' R");
  assert.equal(solutionFor(b4, "y' U R' U R U' R' U' R", atB4('U2')), "U' y' R' U R U' R' U' R");
  // Symmetric case (Z perm): of the AUFs that work, the one that cancels the algorithm's first U
  const z = findCase('cfop-pll-z')!;
  const zAlg = z.algs.find((v) => v.alg.startsWith('U '))!.alg;
  const zp = kpuzzle.defaultPattern().applyAlg(invertTokens(centerMoves(`U ${zAlg}`, IDENTITY)).join(' '));
  assert.equal(aufFor(z, zAlg, zp), "U'");
  assert.ok(!solutionFor(z, zAlg, zp).startsWith('U2'));
});

const session = (scope: string, at: number): SessionRecord => ({ scope, at, mode: 'recognition', n: 5, accuracy: 0.8, ms: 1200, efficiency: null });

test('history: keeps the last HISTORY_MAX, finds the last per scope, drops corrupted entries', () => {
  let h: SessionRecord[] = [];
  for (let i = 0; i < HISTORY_MAX + 10; i++) h = addSession(h, session(i % 2 ? 'odd' : 'even', i));
  assert.equal(h.length, HISTORY_MAX);
  assert.equal(h[0].at, 10);
  assert.equal(lastSession(h, 'odd')?.at, HISTORY_MAX + 9);
  assert.equal(lastSession(h, 'even')?.at, HISTORY_MAX + 8);
  assert.equal(lastSession(h, 'none'), undefined);

  assert.deepEqual(parseHistory(null), []);
  assert.deepEqual(parseHistory({ a: 1 }), []);
  const good = { ...session('x', 1), mode: 'execution', efficiency: 0.9, extra: 'dropped' };
  const parsed = parseHistory([good, null, 7, { ...good, accuracy: 2 }, { ...good, n: 0 }, { ...good, mode: 'other' }, { ...good, ms: 'x' }, { ...good, at: -1 }]);
  assert.deepEqual(parsed, [{ ...session('x', 1), mode: 'execution', efficiency: 0.9 }]);
  assert.equal(parseHistory(Array.from({ length: HISTORY_MAX + 30 }, (_, i) => session('s', i))).length, HISTORY_MAX);
});

test('review: clean solves, extra turns, where it went wrong, slices in either order', () => {
  const sune = ['R', 'U', "R'", 'U', 'R', 'U2', "R'"];
  assert.deepEqual(review(['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"], sune), { mine: sune, expected: sune, divergeAt: 7, extra: 0, issue: null });
  const wrong = review(['R', 'U', 'R', "R'", "R'", 'U', 'R', 'U2', "R'", 'U', "U'"], sune); // a slip undone, then a stray U U'
  assert.equal(wrong.issue, 'extra', 'undone slips are real turns: they show and count');
  assert.equal(wrong.extra, 4);
  assert.equal(wrong.divergeAt, 2);
  const extra = review(['R', 'U', "R'", "U'", 'U', 'U', 'R', 'U2', "R'", 'F', "F'", 'B'], sune);
  assert.equal(extra.issue, 'extra');
  assert.equal(extra.extra, 5); // "U' U U" for a U (2 wasted), then "F F' B" after the algorithm
  assert.equal(extra.divergeAt, 3);
  const detour = review(['U', 'R', 'U', "R'"], ['R', 'U', "R'"]);
  assert.equal(detour.divergeAt, 0);
  assert.equal(detour.issue, 'extra');
  assert.equal(review(["L'", 'R', 'U'], ['R', "L'", 'U']).issue, null, 'a slice reported L then R');
  assert.equal(review(['R'], sune, true).issue, 'skipped');
  assert.equal(review(sune, sune, false, true).issue, 'assisted');
});

test('autoGrade: errors fail, a clean solve is good, easy when faster than its average', () => {
  assert.equal(autoGrade('skipped', 1000, 5000), 'fail');
  assert.equal(autoGrade('assisted', 1000, null), 'fail');
  assert.equal(autoGrade('extra', 1000, 5000), 'fail');
  assert.equal(autoGrade(null, 1000, null), 'good', 'no average yet');
  assert.equal(autoGrade(null, 6000, 5000), 'good');
  assert.equal(autoGrade(null, 4000, 5000), 'easy');
});

const NOW = new Date(2026, 0, 10, 12).getTime();
const learn = (interval: number, due: number, solveMs: number | null = null): Learning => ({ due, interval, lapses: 0, recognitionMs: null, solveMs });
const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id }) as Case);
const LEARN: Record<string, Learning> = {
  a: learn(10, NOW + 5 * 86_400_000, 1000), // known, not due
  b: learn(8, NOW - 1000, 3000), // known, due
  c: learn(0, NOW, 9000), // failed today: learning, due
  d: learn(1, NOW + 86_400_000, 5000), // learning, due tomorrow
  e: learn(2, NOW + 2 * 86_400_000), // learning, no time
  // f, g: new
};
const ctx = (over: Partial<SelectContext> = {}): SelectContext =>
  ({ one: null, picked: new Set(), learning: (id) => LEARN[id], now: NOW, ...over });
const ids = (cs: Case[]) => cs.map((c) => c.id);

test('selectCases: one, by hand, by status, slowest, due, all', () => {
  assert.deepEqual(ids(selectCases('one', pool, ctx({ one: pool[3] }))), ['d']);
  assert.deepEqual(selectCases('one', pool, ctx()), []);
  assert.deepEqual(ids(selectCases('pick', pool, ctx({ picked: new Set(['g', 'a', 'zz']) }))), ['a', 'g']);
  assert.deepEqual(ids(selectCases('known', pool, ctx())), ['a', 'b']);
  assert.deepEqual(ids(selectCases('learning', pool, ctx())), ['c', 'd', 'e', 'f', 'g'], 'not known: learning and new');
  assert.deepEqual(ids(selectCases('due', pool, ctx())), ['b', 'c']);
  assert.deepEqual(ids(selectCases('slow', pool, ctx())), ['c', 'd'], 'slowest third of the 4 with a time');
  assert.equal(selectCases('all', pool, ctx()), pool);
});

test('spacedTiers: due first, then new, then the rest', () => {
  assert.deepEqual(spacedTiers(pool, (id) => LEARN[id], NOW).map(ids), [['b', 'c'], ['f', 'g'], ['a', 'd', 'e']]);
  assert.deepEqual(spacedTiers(pool.slice(5), (id) => LEARN[id], NOW).map(ids), [['f', 'g']]);
});

test('weightedOrder: follows the weights, unknown ones get the mean', () => {
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const drawn = weightedOrder(['x', 'y', 'z'], [0.6, 0.1, null], 6000, rng);
  assert.equal(drawn.length, 6000);
  const share = (k: string) => drawn.filter((d) => d === k).length / drawn.length;
  // z weighs the mean, 0.35: shares 0.6/1.05, 0.1/1.05, 0.35/1.05
  for (const [k, w] of [['x', 0.6], ['y', 0.1], ['z', 0.35]] as const) assert.ok(Math.abs(share(k) - w / 1.05) < 0.02, `${k}: ${share(k)}`);
  const two = weightedOrder(['t', 'y'], [0.8, 0.2], 6000, rng); // T-perm / Y-perm among the corner PLLs
  assert.ok(Math.abs(two.filter((d) => d === 't').length / two.length - 0.8) < 0.02);
  assert.deepEqual(weightedOrder(['solo'], [0.2], 3, rng), ['solo', 'solo', 'solo']);
  assert.deepEqual(weightedOrder([], [], 3, rng), []);
  assert.equal(new Set(weightedOrder(['x', 'y'], [0, 0], 10, rng)).size, 2, 'all zero: uniform');
});

test('isStuck: too many turns beyond the algorithm, or too long', () => {
  assert.equal(isStuck(10, 10, 1000), false);
  assert.equal(isStuck(10 + STUCK_EXTRA, 10, 1000), false); // at the threshold: still trying
  assert.equal(isStuck(11 + STUCK_EXTRA, 10, 1000), true);
  assert.equal(isStuck(3, 10, STUCK_MS + 1), true);
  assert.equal(isStuck(99, null, 1000), false); // no reference: only the clock
});

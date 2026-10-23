import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { mapMove, tokenize } from './notation.ts';
import { HOLDS } from './academy/cube.ts';
import { MAX_ANALYSES, addAnalysis, analyseSolve, parseAnalyses, stepsOf, summarize } from './solve-analysis.ts';

const kpuzzle = await cube3x3x3.kpuzzle();

// A CFOP solve built from its steps (cross on D, so the last layer is U): the scramble is the solve undone. Each pair
// goes in with a trigger that keeps the cross and the pairs already in: FR, FL, BR, BL.
const PARTS = ["F2 R2 D'", "R U R'", "L' U' L", "R' U' R", "L U L'", "R U R' U R U2 R'", "R U R' U' R' F R2 U' R' U' R U R' F'", 'U'];
const solve = (parts: string[]) => parts.flatMap(tokenize);
const ends = (parts: string[]) => parts.slice(0, -1).map((_, i) => solve(parts.slice(0, i + 1)).length);
// 100 ms per move, plus a 400 ms pause before each step but the cross
const timesOf = (parts: string[]) => {
  const times: number[] = [];
  let at = 0;
  parts.forEach((p, k) => tokenize(p).forEach((_, i) => times.push((at += 100 + (k && !i ? 400 : 0)))));
  return times;
};

test('a CFOP solve splits into cross, 4 pairs, OLL, PLL and AUF, with its cases', () => {
  const a = analyseSolve(kpuzzle, 1, solve(PARTS), timesOf(PARTS));
  assert.equal(a.c, 'D');
  assert.deepEqual(a.s, ends(PARTS));
  assert.equal(a.oll, 'cfopc-oll-27'); // Sune
  assert.equal(a.pll, 'cfopc-pll-t');
  const steps = stepsOf(a);
  assert.deepEqual(steps.map((s) => s.moves), PARTS.map((p) => tokenize(p).length));
  assert.deepEqual(steps[0], { key: 'cross', moves: 3, ms: 300, recog: 100 });
  assert.deepEqual(steps[1], { key: 'f2l1', moves: 3, ms: 700, recog: 500 });
  assert.equal(steps.reduce((n, s) => n + s.ms, 0), timesOf(PARTS).at(-1));
});

test('any cross color: the same solve held any of the 24 ways', () => {
  for (const hold of HOLDS) {
    const a = analyseSolve(kpuzzle, 1, solve(PARTS).map((m) => mapMove(m, hold)), timesOf(PARTS));
    assert.equal(a.c, hold.D, JSON.stringify(hold));
    assert.deepEqual(a.s, ends(PARTS));
    assert.equal(a.oll, 'cfopc-oll-27');
    assert.equal(a.pll, 'cfopc-pll-t');
  }
});

test('skips: no OLL case and a 0-move step', () => {
  const parts = PARTS.filter((_, i) => i !== 5);
  const a = analyseSolve(kpuzzle, 1, solve(parts), timesOf(parts));
  assert.equal(a.oll, undefined);
  assert.equal(a.s[5], a.s[4]);
  assert.deepEqual(stepsOf(a)[5], { key: 'oll', moves: 0, ms: 0, recog: 0 });
  assert.equal(a.pll, 'cfopc-pll-t');
});

test('a last-layer skip: the last pair solves the cube, the cross is still the cross', () => {
  const parts = PARTS.slice(0, 5);
  for (const hold of HOLDS) {
    const a = analyseSolve(kpuzzle, 1, solve(parts).map((m) => mapMove(m, hold)), timesOf(parts));
    assert.equal(a.c, hold.D, JSON.stringify(hold));
    assert.deepEqual(stepsOf(a).map((s) => s.moves), [3, 3, 3, 3, 3, 0, 0, 0]);
  }
});

test('a pair broken and redone: the redo is part of the next pair', () => {
  const parts = ["F2 R2 D'", "R U R'", "R U' R'", "R U R'", "L' U' L", "R' U' R", "L U L'", "R U R' U R U2 R'", "R U R' U' R' F R2 U' R' U' R U R' F'", 'U'];
  const a = analyseSolve(kpuzzle, 1, solve(parts), timesOf(parts));
  assert.deepEqual(a.s.slice(0, 3), [3, 6, 15]); // pair 2: R U' R' R U R' L' U' L
});

test('stored analyses: kept compact, parsed back, malformed dropped', () => {
  const a = analyseSolve(kpuzzle, 1, solve(PARTS), timesOf(PARTS));
  assert.deepEqual(parseAnalyses(JSON.parse(JSON.stringify([a]))), [a]);
  assert.deepEqual(parseAnalyses([{ ...a, t: a.t.slice(1) }, { ...a, s: [1, 2] }, { ...a, c: 'X' }, null, 'x']), []);
  assert.deepEqual(parseAnalyses('nope'), []);
  // 200 long solves (100 moves, slow) stay well under the account's 512 KB per key
  const long = { ...a, m: Array(100).fill("R'").join(' '), t: Array(100).fill(1234) };
  let list = [] as typeof a[];
  for (let i = 0; i < MAX_ANALYSES + 5; i++) list = addAnalysis(list, { ...long, at: i });
  assert.equal(list.length, MAX_ANALYSES);
  assert.ok(JSON.stringify(list).length < 200 * 1024);
  assert.equal(addAnalysis(list, { ...long, at: 204 }).length, MAX_ANALYSES); // the same solve again: replaced
});

test('summary: means per step, the group over its typical split, slowest cases', () => {
  const a = analyseSolve(kpuzzle, 1, solve(PARTS), timesOf(PARTS));
  const s = summarize([a, a]);
  assert.equal(s.n, 2);
  assert.equal(s.total, timesOf(PARTS).at(-1));
  const worst = s.groups.reduce((x, y) => (y.over > x.over ? y : x));
  assert.equal(worst.group, 'pll'); // 15 of 37 moves, with pauses: far over 22 %
  assert.deepEqual(s.cases.map((c) => c.id), ['cfopc-pll-t', 'cfopc-oll-27']);
  assert.equal(s.cases[0].n, 2);
});

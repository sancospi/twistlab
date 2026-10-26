import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { IDENTITY, YELLOW_UP, centerMoves, invertTokens, mapMove, tokenize } from './notation.ts';
import { EDGES, HOLDS } from './academy/cube.ts';
import { MAX_ANALYSES, addAnalysis, analyseSolve, lessonsOf, parseAnalyses, stepsOf, summarize } from './solve-analysis.ts';

const kpuzzle = await cube3x3x3.kpuzzle();

// A CFOP solve built from its steps (cross on D, so the last layer is U): the scramble is the solve undone. Each pair
// goes in with a trigger that keeps the cross and the pairs already in: FR, FL, BR, BL.
const PARTS = ["F2 R2 D'", "R U R'", "L' U' L", "R' U' R", "L U L'", "R U R' U R U2 R'", "R U R' U' R' F R2 U' R' U' R U R' F'", 'U'];
const solve = (parts: string[]) => parts.flatMap(tokenize);
const ends = (parts: string[]) => parts.slice(0, -1).map((_, i) => solve(parts.slice(0, i + 1)).length);
// 100 ms per move, plus a 400 ms pause before each step but the cross (and `extra[k]` more before part k)
const timesOf = (parts: string[], extra: Record<number, number> = {}) => {
  const times: number[] = [];
  let at = 0;
  parts.forEach((p, k) => tokenize(p).forEach((_, i) => times.push((at += 100 + (k && !i ? 400 + (extra[k] ?? 0) : 0)))));
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
  // recognising a case: the pause before its step, apart from its time
  const b = analysed(PARTS, { 6: 1000 });
  const slow = summarize([b, a]).cases[0];
  assert.deepEqual([slow.id, slow.ms, slow.recog], ['cfopc-pll-t', (stepsOf(b)[6].ms + stepsOf(a)[6].ms) / 2, 1000]);
});

// --- Lessons ---

const analysed = (parts: string[], extra: Record<number, number> = {}) => analyseSolve(kpuzzle, 1, solve(parts), timesOf(parts, extra));
const lessons = (parts: string[], extra: Record<number, number> = {}) => lessonsOf(kpuzzle, analysed(parts, extra));
const LONG_CROSS = ["F' U' F' U L L' R2 D'", ...PARTS.slice(1)]; // a 3-move cross with a detour and a slip: 8 turns

test('solve lessons: a clean CFOP solve has none', () => {
  assert.deepEqual(lessons(PARTS), []);
});

test('solve lessons: a long cross counts every turn, a slip and its undo too', () => {
  const a = analysed(LONG_CROSS);
  const [l] = lessonsOf(kpuzzle, a);
  assert.equal(l.kind, 'cross');
  assert.ok(l.kind === 'cross');
  assert.equal(l.extra, 5);
  assert.equal(l.alg.length, 3);
  assert.equal(l.save, Math.round((stepsOf(a)[0].ms * 5) / 8));
  // 3 turns over a 3-move cross: level 2 lets 1 over, so no lesson below 4
  assert.deepEqual(lessons(["F' U' F' U R2 D'", ...PARTS.slice(1)]), []);
});

test('solve lessons: an x-cross is not a long cross', () => {
  for (const xcross of ["R U R' D'", "F2 L' U L R U' R' U2 R U R' D'"]) {
    const parts = [xcross, ...PARTS.slice(2)];
    const a = analysed(parts);
    assert.equal(a.s[0], a.s[1], xcross);
    assert.ok(!lessonsOf(kpuzzle, a).some((l) => l.kind === 'cross'), xcross);
  }
});

test('solve lessons: the cross shown solves that cross, any of the 24 holds', () => {
  for (const hold of HOLDS) {
    const moves = solve(LONG_CROSS).map((m) => mapMove(m, hold));
    const a = analyseSolve(kpuzzle, 1, moves, timesOf(LONG_CROSS));
    const l = lessonsOf(kpuzzle, a).find((x) => x.kind === 'cross');
    assert.ok(l?.kind === 'cross', JSON.stringify(hold));
    assert.equal(l.alg.length, 3);
    // done as shown, from the scrambled cube: white cross with yellow up, any other with white up (and its rotation)
    const p0 = kpuzzle.defaultPattern().applyAlg(invertTokens(moves).join(' '));
    const shown = centerMoves([l.rot, ...l.alg].filter(Boolean).join(' '), a.c === 'U' ? YELLOW_UP : IDENTITY);
    const { pieces, orientation } = p0.applyAlg(shown.join(' ')).patternData.EDGES;
    assert.ok(EDGES.every((e, i) => !e.includes(a.c) || (pieces[i] === i && orientation[i] === 0)), JSON.stringify({ hold, shown }));
    assert.equal(l.rot === '', a.c === 'U' || a.c === 'D');
  }
});

test('solve lessons: OLL or PLL in two parts, whatever the pause', () => {
  const oll = [...PARTS.slice(0, 5), "F R U R' U' F'", "R U R' U R U2 R'", ...PARTS.slice(6)];
  assert.deepEqual(lessons(oll), [{ kind: 'two-look', step: 'oll', save: 500 }]);
  assert.ok(analysed(oll).oll);
  // the same two algorithms back to back: still two parts
  const joined = [...PARTS.slice(0, 5), "F R U R' U' F' R U R' U R U2 R'", ...PARTS.slice(6)];
  assert.deepEqual(lessons(joined), [{ kind: 'two-look', step: 'oll', save: 100 }]);
  const pll = [...PARTS.slice(0, 6), "R' F R' B2 R F' R' B2 R2", "R2 U R U R' U' R' U' R' U R'", 'U'];
  assert.deepEqual(lessons(pll).map((l) => l.kind === 'two-look' && l.step), ['pll']);
  // OLL skipped: nothing to say about it
  assert.deepEqual(lessons(PARTS.filter((_, i) => i !== 5)), []);
});

test('solve lessons: long pauses between pairs, sorted by what they cost', () => {
  assert.deepEqual(lessons(PARTS, { 2: 1500, 3: 1500 }), [{ kind: 'pause', step: 'f2l', save: 2800 }]);
  assert.deepEqual(lessons(PARTS, { 6: 1000 }), [{ kind: 'pause', step: 'pll', save: 700 }]);
  const both = lessons(LONG_CROSS, { 2: 5000 });
  assert.deepEqual(both.map((l) => l.kind), ['pause', 'cross']);
  assert.ok(both[0].save > both[1].save);
});

// --- 2-look solves: the reduced CFOP's cases ---

// edges as a line (F R U R' U' F'), then Sune; corners with a T-perm, then Ub
const TWO_LOOK = [...PARTS.slice(0, 5), "F R U R' U' F'", "R U R' U R U2 R'", "R U R' U' R' F R2 U' R' U' R U R' F'", "R2 U R U R' U' R' U' R' U R'"];

test('2-look: each part stored as its reduced CFOP case, with the move the second began', () => {
  const a = analysed(TWO_LOOK);
  assert.deepEqual(a.o2, ['cfop-oll-linea', 'cfop-oll-sune', solve(TWO_LOOK.slice(0, 6)).length]);
  assert.deepEqual(a.p2, ['cfop-pll-t', 'cfop-pll-ub', solve(TWO_LOOK.slice(0, 8)).length]);
  assert.ok(a.oll && a.pll); // the full OLL and PLL met too, as before
  const one = analysed(PARTS);
  assert.equal(one.o2, undefined);
  assert.equal(one.p2, undefined);
});

test('2-look: stored and parsed back; a malformed half is left out (not the solve), an old one without them stays', () => {
  const a = analysed(TWO_LOOK);
  assert.deepEqual(parseAnalyses(JSON.parse(JSON.stringify([a]))), [a]);
  const j = a.o2![2];
  const { o2: _o, ...withoutO2 } = a;
  for (const o2 of [['cfop-oll-linea', 'cfop-oll-sune'], ['cfop-oll-linea', 3, j], ['cfop-oll-linea', 'cfop-oll-sune', a.s[5]], ['a', 'b', 1.5], 'x']) {
    assert.deepEqual(parseAnalyses([{ ...a, o2 }]), [withoutO2], JSON.stringify(o2));
  }
  const { o2: _o2, p2: _p, ...old } = a;
  assert.deepEqual(parseAnalyses([old]), [old]);
});

test('2-look: the summary times each part as its own case', () => {
  const a = analysed(TWO_LOOK);
  const s = summarize([a]);
  const byId = new Map(s.cases.map((c) => [c.id, c]));
  assert.deepEqual([...byId.keys()].sort(), ['cfop-oll-linea', 'cfop-oll-sune', 'cfop-pll-t', 'cfop-pll-ub']);
  const steps = stepsOf(a);
  assert.equal(byId.get('cfop-oll-linea')!.ms + byId.get('cfop-oll-sune')!.ms, steps[5].ms);
  assert.equal(byId.get('cfop-pll-t')!.ms + byId.get('cfop-pll-ub')!.ms, steps[6].ms);
  assert.equal(byId.get('cfop-oll-linea')!.recog, steps[5].recog); // the pause before the step is the first part's
  assert.equal(byId.get('cfop-oll-sune')!.recog, 500); // the pause before the second algorithm
});

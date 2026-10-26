import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { IDENTITY, centerMoves, invertTokens, tokenize } from '../notation.ts';
import { goalReached, llSpecs, llSteps, quizPattern } from './cube.ts';
import { cfopReduced } from './cfop.ts';
import { cfopFull } from './cfopFull.ts';
import { allCases, findCase } from './methods.ts';
import type { Case } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const main = (c: Case) => c.algs[0].alg;
const LL = ['oll-cross', 'oll-corners', 'pll-corners', 'pll-edges'];
const llCases = (m: typeof cfopFull) => allCases(m).filter((c) => LL.includes(c.stage));

test('llSpecs: random last-layer states, F2L solved and LL unsolved, face turns only, deterministic per seed', () => {
  const specs = llSpecs(60, 7, kpuzzle);
  assert.equal(specs.length, 60);
  assert.deepEqual(llSpecs(60, 7, kpuzzle), specs);
  assert.notDeepEqual(llSpecs(60, 8, kpuzzle), specs);
  for (const s of specs) {
    assert.ok(s.moves.every((m) => /^[URFDLB]['2]?$/.test(m)), s.moves.join(' '));
    const p = quizPattern(kpuzzle, s, IDENTITY);
    assert.ok(goalReached('f2l', p, 'U'));
    assert.ok(!goalReached('pll-edges', p, 'U'));
  }
  // not always the same kind of state: some need an OLL, some are oriented already
  const oriented = specs.filter((s) => goalReached('oll-corners', quizPattern(kpuzzle, s, IDENTITY), 'U')).length;
  assert.ok(oriented > 0 && oriented < specs.length);
});

test('llSteps: both CFOPs solve every random state, steps in order, each one reaching its goal', () => {
  for (const m of [cfopFull, cfopReduced]) {
    const cases = llCases(m);
    for (const s of llSpecs(80, 3, kpuzzle)) {
      let p = quizPattern(kpuzzle, s, IDENTITY);
      const steps = llSteps(p, cases, main);
      assert.ok(steps && steps.length, `${m.id}: ${s.moves.join(' ')}`);
      const stages = steps.map((x) => x.c.stage);
      assert.deepEqual(stages, [...stages].sort((a, b) => LL.indexOf(a) - LL.indexOf(b)));
      if (m === cfopFull) assert.ok(steps.length <= 2);
      for (const x of steps) {
        p = p.applyAlg(centerMoves(`${x.auf} ${x.alg}`, IDENTITY).join(' '));
        assert.ok(goalReached(x.c.stage, p, 'U'));
      }
      assert.ok(goalReached('pll-edges', p, 'U'));
    }
  }
});

test('llSteps: names the OLL and PLL of a known state, with the AUFs between them', () => {
  const sune = findCase('cfopc-oll-27')!, tperm = findCase('cfopc-pll-t')!;
  const user = (alg: string) => solved.applyAlg(invertTokens(centerMoves(alg, IDENTITY)).join(' '));
  const steps = llSteps(user(`U ${main(sune)} U2 ${main(tperm)}`), llCases(cfopFull), main)!;
  assert.deepEqual(steps.map((x) => [x.c.id, x.auf]), [['cfopc-oll-27', 'U'], ['cfopc-pll-t', 'U2']]);
  // oriented already: OLL skip, only the PLL
  assert.deepEqual(llSteps(user(main(tperm)), llCases(cfopFull), main)!.map((x) => x.c.id), ['cfopc-pll-t']);
  // the chosen algorithm decides the state after it: Sune by its #2 permutes other pieces, so another PLL follows
  const alt = (c: Case) => (c === sune ? c.algs[1].alg : main(c));
  const other = llSteps(user(`${main(sune)} ${main(tperm)}`), llCases(cfopFull), alt)!.map((x) => x.c.id);
  assert.equal(other[0], 'cfopc-oll-27');
  assert.notEqual(other[1], 'cfopc-pll-t');
  // an incomplete set: no answer
  assert.equal(llSteps(user(`${main(sune)} ${main(tperm)}`), [tperm], main), null);
  // 2-look: cross, corners, corners of the PLL, edges
  const reduced = llSteps(user(`F R U R' U' F' ${tokenize("R U R' U R U2 R'").join(' ')}`), llCases(cfopReduced), main)!;
  assert.ok(reduced.length >= 2 && reduced[0].c.stage === 'oll-cross');
});

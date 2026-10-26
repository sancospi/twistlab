import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { goalReached } from './academy/cube.ts';
import { crossSolved } from './academy/cross.ts';
import { trainCases, trainingPattern } from './training.ts';
import type { TrainId } from './timer.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const seeded = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const AUF = ['', 'U', 'U2', "U'"];

test('training states: white cross whole, centers home, and the case solved by its algorithm after some AUF', () => {
  for (const kind of ['pll', 'oll', 'f2l'] as TrainId[]) {
    const rand = seeded(7);
    for (let i = 0; i < 30; i++) {
      const { pattern, c } = trainingPattern(kpuzzle, kind, trainCases(kind), rand)!;
      assert.ok(crossSolved(pattern, 'U'), `${kind} ${c.id}`); // white on U in cubing's frame
      // held yellow up (a z2): an AUF, one of the case's algorithms, and its goal is reached (yellow on the cube's D;
      // an algorithm that starts with a y turns the centers: goalReached reads pieces against fixed slots)
      const solved = c.algs.some((v) => !/^[xyz]/.test(v.alg) && AUF.some((a) => goalReached(c.stage, pattern.applyAlg(`z2 ${a} ${v.alg} z2`), 'D')));
      assert.ok(solved, `${kind} ${c.id}`);
    }
  }
});

test('no cases, no state', () => {
  assert.equal(trainingPattern(kpuzzle, 'mine', []), null);
});

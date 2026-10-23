// The look-ahead trainer's logic: F2L scrambles and pause counting.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { crossSolved } from './cross.ts';
import { goalReached } from './cube.ts';
import { f2lScramble, parseRounds, pauses, realTps } from './lookahead.ts';

const kpuzzle = await cube3x3x3.kpuzzle();

test('F2L scrambles: the white cross solved on D, the F2L not, and different each time', () => {
  let a = 7;
  const rng = () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const s = f2lScramble(kpuzzle, rng);
    const p = kpuzzle.defaultPattern().applyAlg(s.join(' '));
    assert.ok(crossSolved(p, 'D'), s.join(' '));
    assert.ok(!goalReached('f2l', p, 'U'), s.join(' '));
    seen.add(s.join(' '));
  }
  assert.equal(seen.size, 50);
});

test('pauses: gaps longer than 2 beats between turns', () => {
  assert.equal(pauses([], 500), 0);
  assert.equal(pauses([0], 500), 0);
  assert.equal(pauses([0, 500, 1000, 2000, 2500], 500), 0); // exactly 2 beats isn't a pause
  assert.equal(pauses([0, 500, 1600, 2000, 5000], 500), 2);
  assert.equal(pauses([0, 900, 1800], 250), 2); // at 4 TPS, under a second is already a pause
});

test('rounds: bad entries dropped, real TPS only with turns', () => {
  const ok = { at: 1, tps: 2, ms: 10000, pauses: 1, turns: 25 };
  assert.deepEqual(parseRounds([ok, { at: 1, tps: 2, ms: -1, pauses: 0 }, null, { ...ok, turns: 'x' }, { at: 2, tps: 1, ms: 5, pauses: 0 }]), [ok, { at: 2, tps: 1, ms: 5, pauses: 0 }]);
  assert.deepEqual(parseRounds('nope'), []);
  assert.equal(realTps(ok), 2.5);
  assert.equal(realTps({ at: 1, tps: 2, ms: 10000, pauses: 0 }), null);
});

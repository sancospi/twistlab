import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptValue, parseRounds, roundFormat, roundResult, storedResult } from './round.ts';

const D = Infinity;

test('formats per event', () => {
  assert.deepEqual(['333', '666', '777', '333bf', '555bf', 'minx'].map((e) => roundFormat(e as never)), ['ao5', 'mo3', 'mo3', 'bo3', 'bo3', 'ao5']);
});

test('ao5: unfinished has no result, one DNF counts as the dropped worst, two DNF is DNF', () => {
  assert.equal(roundResult([10000, 11000], 'ao5').final, null);
  assert.equal(roundResult([10000, 11000], 'ao5').done, false);
  const one = roundResult([10000, D, 11000, 12000, 9000], 'ao5');
  assert.deepEqual([one.done, one.final, one.best], [true, 11000, 9000]);
  const two = roundResult([10000, D, 11000, D, 9000], 'ao5');
  assert.deepEqual([two.final, two.best], [D, 9000]);
});

test('mo3: any DNF is DNF; mean rounded', () => {
  assert.equal(roundResult([10000, 11000, 12005], 'mo3').final, 11000); // 11001.67 -> 11000
  assert.equal(roundResult([10000, D, 12000], 'mo3').final, D);
});

test('bo3: best single, DNF only if all are', () => {
  assert.equal(roundResult([D, 9000, 8000], 'bo3').final, 8000);
  assert.equal(roundResult([D, D, D], 'bo3').final, D);
});

test('cutoff: ao5 needs one of the first 2 under it; a failed round ends with the best single only', () => {
  const failed = roundResult([12000, 13000], 'ao5', { cutoff: 12000 }); // equal is not under
  assert.deepEqual([failed.done, failed.cutoffFailed, failed.final, failed.best], [true, true, null, 12000]);
  assert.equal(roundResult([13000], 'ao5', { cutoff: 12000 }).done, false); // still has the second attempt
  const ok = roundResult([13000, 11999, 10000, 10000, 10000], 'ao5', { cutoff: 12000 });
  assert.deepEqual([ok.cutoffFailed, ok.done, ok.final], [false, true, 10670]);
  assert.equal(roundResult([13000], 'mo3', { cutoff: 12000 }).cutoffFailed, true); // mo3: the first
  assert.equal(roundResult([D, 5000], 'ao5', { cutoff: 12000 }).cutoffFailed, false);
});

test('time limit turns slower attempts into DNF', () => {
  assert.equal(attemptValue({ ms: 20000, penalty: 0 }, 20000), 20000);
  assert.equal(attemptValue({ ms: 19000, penalty: 2000 }, 20000), D);
  assert.equal(attemptValue({ ms: 25000, penalty: 0 }), 25000);
});

test('stored rounds are validated', () => {
  const good = { event: '333', at: 1, values: [1000, null, 3000], cutoff: 5000 };
  const rounds = parseRounds([good, { ...good, event: 'x' }, { ...good, values: [1, 2, 3, 4, 5, 6] }, { ...good, values: ['a'] }, null, { ...good, at: 'now' }]);
  assert.deepEqual(rounds, [good]);
  assert.deepEqual(parseRounds('junk'), []);
  assert.equal(storedResult({ event: '333', at: 1, values: [1000, null, 3000] }).final, null); // unfinished
});

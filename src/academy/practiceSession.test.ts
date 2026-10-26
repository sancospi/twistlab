import test from 'node:test';
import assert from 'node:assert/strict';
import { FADE_AFTER, compare, solutionView, summary } from './practiceSession.ts';
import { addRep, type CaseStats } from './store.ts';

test('solutionView: shown while learning, hidden from FADE_AFTER clean in a row, the user\'s choice first', () => {
  assert.equal(solutionView(0, null), 'shown');
  assert.equal(solutionView(FADE_AFTER - 1, null), 'shown');
  assert.equal(solutionView(FADE_AFTER, null), 'hidden');
  assert.equal(solutionView(12, null), 'hidden');
  assert.equal(solutionView(12, 'shown'), 'shown');
  assert.equal(solutionView(0, 'hidden'), 'hidden');
});

test('compare: first time, new best, off the average', () => {
  assert.deepEqual(compare(2000, undefined), { kind: 'first' });
  const empty: CaseStats = { reps: 0, clean: 0, best: null, last: [], streak: 0, bestStreak: 0, lastPracticed: 0 };
  assert.deepEqual(compare(2000, empty), { kind: 'first' });
  let s = addRep(undefined, { ms: 3000, moves: 7, htm: 7, clean: true }, 1);
  s = addRep(s, { ms: 2000, moves: 7, htm: 7, clean: true }, 2); // best 2000, average 2500
  assert.deepEqual(compare(1500, s), { kind: 'best', by: 500 });
  assert.deepEqual(compare(2000, s), { kind: 'avg', delta: -500 }); // equal to the best isn't a new one
  assert.deepEqual(compare(2800, s), { kind: 'avg', delta: 300 });
  assert.deepEqual(compare(1500, s, false), { kind: 'avg', delta: -1000 }); // not clean: never a best
  assert.equal(compare(1500, undefined, false), null); // ...nor a first mark
  assert.deepEqual(compare(1995, s), { kind: 'best', by: 10 }); // 1.99 against 2.00: a best by a shown hundredth...
  const close = addRep(s, { ms: 1999, moves: 7, htm: 7, clean: true }, 3); // best 1999, shown 1.99
  assert.equal(compare(1991, close)?.kind, 'avg'); // ...but 1.99 again isn't one
  assert.deepEqual(compare(1989, close), { kind: 'best', by: 10 });
});

test('summary: all the reps of the sitting, the best and mean of the clean ones', () => {
  assert.deepEqual(summary([]), { reps: 0, best: null, mean: null });
  assert.deepEqual(summary([{ ms: 3000, clean: true }, { ms: 1000, clean: false }, { ms: 2000, clean: true }]), { reps: 3, best: 2000, mean: 2500 });
  assert.deepEqual(summary([{ ms: 400, clean: false }]), { reps: 1, best: null, mean: null });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, mergeValue, reconcile, union, type Base, type Item } from './sync.ts';

const NOW = 1_000_000;
const synced = (v: string | null, t: number): Base => ({ h: hash(v), t });

test('hash: tells values apart, absent is its own', () => {
  assert.equal(hash('[]'), hash('[]'));
  assert.notEqual(hash('[1]'), hash('[2]'));
  assert.notEqual(hash(''), hash(null));
});

test('reconcile: only what changed moves, and only one way', () => {
  const base = { 'cube-event': synced('"333"', 10), 'cube-calls': synced('true', 10) };
  // nothing changed
  assert.deepEqual(reconcile({ 'cube-event': '"333"', 'cube-calls': 'true' }, {}, base, NOW), { apply: {}, push: {}, keys: base });
  // changed here: pushed over the version it replaces, stamped when the change was first seen
  const mine = reconcile({ 'cube-event': '"222"', 'cube-calls': 'true' }, {}, base, NOW);
  assert.deepEqual(mine.push, { 'cube-event': { v: '"222"', t: NOW, b: 10 } });
  assert.equal(mine.keys['cube-event'].d, NOW);
  assert.equal(reconcile({ 'cube-event': '"222"' }, {}, mine.keys, NOW + 5).push['cube-event'].t, NOW); // still the first sighting
  // deleted here: a tombstone
  assert.deepEqual(reconcile({ 'cube-event': '"333"' }, {}, base, NOW).push, { 'cube-calls': { v: null, t: NOW, b: 10 } });
  // changed in the account: written here
  const theirs = reconcile({ 'cube-event': '"333"', 'cube-calls': 'true' }, { 'cube-event': { v: '"444"', t: 20 }, 'cube-calls': { v: null, t: 30 } }, base, NOW);
  assert.deepEqual(theirs.apply, { 'cube-event': '"444"', 'cube-calls': null });
  assert.deepEqual(theirs.push, {});
  assert.deepEqual(theirs.keys['cube-event'], synced('"444"', 20));
  // the same value on both sides: just in sync
  assert.deepEqual(reconcile({ 'cube-event': '"444"' }, { 'cube-event': { v: '"444"', t: 20 } }, base, NOW).keys['cube-event'], synced('"444"', 20));
});

test('reconcile: changed on both sides, the newer one wins (a setting)', () => {
  const base = { 'cube-event': { ...synced('"333"', 10), d: 50 } };
  const older: Record<string, Item> = { 'cube-event': { v: '"444"', t: 40 } };
  const newer: Record<string, Item> = { 'cube-event': { v: '"444"', t: 60 } };
  assert.deepEqual(reconcile({ 'cube-event': '"222"' }, older, base, NOW).push, { 'cube-event': { v: '"222"', t: NOW, b: 40 } });
  const lost = reconcile({ 'cube-event': '"222"' }, newer, base, NOW);
  assert.deepEqual([lost.apply, lost.push, lost.keys['cube-event']], [{ 'cube-event': '"444"' }, {}, synced('"444"', 60)]);
});

test('first sign-in: both sides kept; solves done on each device are all there', () => {
  const here = JSON.stringify([{ ms: 9000, penalty: 0, at: 300 }, { ms: 9500, penalty: 0, at: 100 }]);
  const there = JSON.stringify([{ ms: 8000, penalty: 0, at: 200 }, { ms: 9500, penalty: 0, at: 100 }]);
  const plan = reconcile({ 'cube-results': here, 'cube-event': '"222"' }, { 'cube-results': { v: there, t: 400 }, 'progress-goal': { v: '{}', t: 5 } }, {}, NOW);
  const merged = JSON.stringify([{ ms: 9000, penalty: 0, at: 300 }, { ms: 8000, penalty: 0, at: 200 }, { ms: 9500, penalty: 0, at: 100 }]);
  assert.deepEqual(plan.apply, { 'cube-results': merged, 'progress-goal': '{}' });
  assert.deepEqual(plan.push, { 'cube-results': { v: merged, t: NOW, b: 400 }, 'cube-event': { v: '"222"', t: NOW, b: 0 } });
  // the other device then gets the merge as is (it had nothing new since)
  const other = reconcile({ 'cube-results': there }, { 'cube-results': { v: merged, t: NOW } }, { 'cube-results': synced(there, 400) }, NOW + 1);
  assert.deepEqual([other.apply, other.push], [{ 'cube-results': merged }, {}]);
});

test('a key the account lost goes up again instead of being deleted here', () => {
  const plan = reconcile({ 'cube-event': '"222"' }, {}, { 'cube-event': synced('"222"', 10) }, NOW, true);
  assert.deepEqual([plan.apply, plan.push], [{}, { 'cube-event': { v: '"222"', t: NOW, b: 0 } }]);
});

test('union: by date, in the list\'s order; undated solves keep their place; null when nothing is new', () => {
  const a = [{ at: 5 }, { at: 3 }, { ms: 1 }];
  assert.equal(union(a, [{ at: 3 }, { ms: 1 }], -1), null);
  assert.deepEqual(union(a, [{ at: 6 }, { at: 4 }, { ms: 2 }], -1), [{ at: 6 }, { at: 5 }, { at: 4 }, { ms: 2 }, { at: 3 }, { ms: 1 }]); // {ms: 2} came after {at: 4}
  assert.deepEqual(union([{ at: 1 }, { at: 3 }], [{ at: 2 }, { at: 4 }], 1), [{ at: 1 }, { at: 2 }, { at: 3 }, { at: 4 }]);
});

test('merge: lists as a union, per-case records entry by entry, anything else the newer side', () => {
  assert.equal(mergeValue('academy-cross-history', '[{"at":1}]', '[{"at":2}]', false), '[{"at":1},{"at":2}]');
  assert.equal(mergeValue('cube-results', '[{"at":1}]', '[{"at":1}]', false), '[{"at":1}]');
  assert.equal(mergeValue('academy-stats', '{"a":1,"b":1}', '{"b":2,"c":2}', true), '{"b":1,"c":2,"a":1}');
  assert.equal(mergeValue('academy-stats', '{"a":1,"b":1}', '{"b":2,"c":2}', false), '{"a":1,"b":2,"c":2}');
  assert.equal(mergeValue('progress-goal', '{"a":1}', '{"b":2}', true), '{"a":1}');
  assert.equal(mergeValue('cube-results', 'oops', '[{"at":1}]', false), '[{"at":1}]'); // not a list: the newer side
});

test('first sign-in (no synced version here): the account wins a setting; a case keeps its last practice', () => {
  const plan = reconcile({ 'cube-event': '"222"' }, { 'cube-event': { v: '"333"', t: 5 } }, {}, NOW);
  assert.deepEqual([plan.apply, plan.push], [{ 'cube-event': '"333"' }, {}]);
  const here = JSON.stringify({ T: { reps: 2, lastPracticed: 10 }, Y: { reps: 1, lastPracticed: 50 } });
  const there = JSON.stringify({ T: { reps: 100, lastPracticed: 40 }, Y: { reps: 3, lastPracticed: 20 } });
  assert.equal(reconcile({ 'academy-stats': here }, { 'academy-stats': { v: there, t: 5 } }, {}, NOW).push['academy-stats'].v,
    JSON.stringify({ T: { reps: 100, lastPracticed: 40 }, Y: { reps: 1, lastPracticed: 50 } }));
});

test('merge: a solve on both sides with a different penalty: the newer side\'s copy', () => {
  const local = '[{"at":2,"penalty":0},{"at":1,"penalty":0}]', remote = '[{"at":1,"penalty":2000}]';
  assert.equal(mergeValue('cube-results', local, remote, false), '[{"at":2,"penalty":0},{"at":1,"penalty":2000}]');
  assert.equal(mergeValue('cube-results', local, remote, true), local);
});

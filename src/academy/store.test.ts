import test from 'node:test';
import assert from 'node:assert/strict';
import { addRep, average, parsePrefs, parseStats, preferred, type CaseStats } from './store.ts';
import { findCase } from './methods.ts';

test('addRep aggregates reps, best, last 10, streaks', () => {
  let s: CaseStats | undefined;
  for (let i = 0; i < 12; i++) s = addRep(s, { ms: 1000 + i, moves: 8, htm: 7, clean: i !== 5 }, 100 + i);
  assert.equal(s!.reps, 12);
  assert.equal(s!.clean, 11);
  assert.equal(s!.best, 1000);
  assert.deepEqual(s!.last, [1011, 1010, 1009, 1008, 1007, 1006, 1005, 1004, 1003, 1002]);
  assert.equal(average(s!), 1006.5);
  assert.equal(s!.streak, 6); // reps 6..11 after the miss at 5
  assert.equal(s!.bestStreak, 6);
  assert.equal(s!.lastPracticed, 111);
  const missed = addRep(s, { ms: 900, moves: 9, htm: 9, clean: false }, 200);
  assert.equal(missed.streak, 0);
  assert.equal(missed.bestStreak, 6);
  assert.equal(missed.best, 900);
});

test('parseStats keeps valid entries and drops corrupted ones', () => {
  const ok: CaseStats = { reps: 3, clean: 2, best: 1500, last: [1500, 2000, 1800], streak: 1, bestStreak: 2, lastPracticed: 5 };
  const parsed = parseStats({
    a: ok,
    b: { ...ok, reps: -1 },
    c: { ...ok, clean: 9 }, // more clean reps than reps
    d: { ...ok, last: [1, 'x'] },
    e: { ...ok, best: 'fast' },
    f: null,
    g: { ...ok, best: null, last: [] },
  });
  assert.deepEqual(Object.keys(parsed), ['a', 'g']);
  assert.deepEqual(parsed.a, ok);
  for (const junk of [null, 42, 'x', [], [ok]]) assert.deepEqual(parseStats(junk), {});
});

test('parsePrefs keeps string choices; preferred falls back to the main algorithm', () => {
  assert.deepEqual(parsePrefs({ a: 'plan-b', b: 3, c: null }), { a: 'plan-b' });
  assert.deepEqual(parsePrefs([1]), {});
  const c = findCase('cfop-f2l-a1')!;
  assert.equal(preferred(c), c.algs[0]); // nothing stored (no localStorage in node)
});

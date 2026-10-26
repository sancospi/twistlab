import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KNOWN_DAYS, addRep, average, byChoice, graded, isDue, learnStatus, marked, parseLearning, parsePrefs, parseStats, preferred, timed,
  type CaseStats, type Learning,
} from './store.ts';
import { findCase } from './methods.ts';

test('addRep aggregates reps, best and last 10 of the clean ones, streaks', () => {
  let s: CaseStats | undefined;
  for (let i = 0; i < 12; i++) s = addRep(s, { ms: 1000 + i, moves: 8, htm: 7, clean: i !== 5 }, 100 + i);
  assert.equal(s!.reps, 12);
  assert.equal(s!.clean, 11);
  assert.equal(s!.best, 1000);
  assert.deepEqual(s!.last, [1011, 1010, 1009, 1008, 1007, 1006, 1004, 1003, 1002, 1001]); // the miss (1005) left out
  assert.equal(average(s!), 1006.1);
  assert.equal(s!.streak, 6); // reps 6..11 after the miss at 5
  assert.equal(s!.bestStreak, 6);
  assert.equal(s!.lastPracticed, 111);
  const missed = addRep(s, { ms: 900, moves: 9, htm: 9, clean: false }, 200);
  assert.equal(missed.streak, 0);
  assert.equal(missed.bestStreak, 6);
  assert.equal(missed.best, 1000); // a failed rep's time isn't a mark
  assert.deepEqual(missed.last, s!.last);
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

const DAY = 86_400_000;
const at = (day: number, hour = 10) => new Date(2026, 0, day, hour).getTime(); // local time, like the app

test('graded: fail back to today at half the interval, good doubles, easy triples, early reviews do not grow', () => {
  let s = graded(undefined, 'good', at(1));
  assert.deepEqual([s.interval, s.due, s.lapses], [1, at(1) + DAY, 0]);
  assert.equal(graded(s, 'good', at(1, 18)), s, 'the same case again in the session: no growth');
  assert.ok(!isDue(s, at(1, 23)) && isDue(s, at(2, 8)), 'due from the start of the next day');
  s = graded(s, 'good', at(2, 8));
  assert.equal(s.interval, 2);
  s = graded(s, 'easy', at(4));
  assert.equal(s.interval, 6);
  assert.equal(learnStatus(s), 'known');
  const failed = graded(s, 'fail', at(5));
  assert.deepEqual([failed.interval, failed.lapses, failed.due], [3, 1, at(5)], 'a slip halves the 6 days');
  assert.ok(isDue(failed, at(5, 11)));
  assert.equal(graded(failed, 'good', at(5, 11)).interval, 6, 'relearned later that day: back where it was');
  const twice = graded(graded(failed, 'fail', at(5, 12)), 'fail', at(5, 13));
  assert.deepEqual([twice.interval, learnStatus(twice)], [0, 'learning'], 'failing again and again: from the start');
  assert.equal(graded(twice, 'good', at(5, 14)).interval, 1);
  assert.equal(graded(undefined, 'easy', at(1)).interval, 2);
  assert.equal(graded(undefined, 'fail', at(1)).lapses, 1);
  let long: Learning = { ...s, interval: 150, due: at(1) };
  long = graded(long, 'easy', at(1));
  assert.equal(long.interval, 180, 'capped');
});

test('learnStatus and isDue: new, learning, known', () => {
  assert.equal(learnStatus(undefined), 'new');
  assert.ok(!isDue(undefined, at(1)));
  const base: Learning = { due: at(3), interval: KNOWN_DAYS - 1, lapses: 0, recognitionMs: null, solveMs: null };
  assert.equal(learnStatus(base), 'learning');
  assert.equal(learnStatus({ ...base, interval: KNOWN_DAYS }), 'known');
  assert.ok(isDue(base, at(3, 0)) && isDue(base, at(9)) && !isDue(base, at(2, 23)));
});

test('marked: known staggers new and learning cases, keeps longer intervals and lapses; unlearning is due today', () => {
  const learningCase: Learning = { due: at(1), interval: 1, lapses: 2, recognitionMs: null, solveMs: 1500 };
  const fresh = marked(undefined, true, at(1));
  assert.deepEqual([learnStatus(fresh), fresh.interval, fresh.due], ['known', KNOWN_DAYS, at(1) + KNOWN_DAYS * DAY]);
  const second = marked(learningCase, true, at(1), 1);
  assert.deepEqual([learnStatus(second), second.interval, second.lapses, second.solveMs], ['known', KNOWN_DAYS + 1, 2, 1500]);
  assert.equal(marked(undefined, true, at(1), 4).interval, KNOWN_DAYS, 'the stagger wraps after 4 days');
  const long: Learning = { ...learningCase, interval: 48, due: at(30) };
  assert.equal(marked(long, true, at(1)), long, 'already known: untouched');
  const again = marked(long, false, at(1));
  assert.deepEqual([learnStatus(again), again.lapses, again.solveMs], ['learning', 2, 1500]);
  assert.ok(isDue(again, at(1)));
});

test('timed: moving average of the times', () => {
  const s: Learning = { due: 0, interval: 0, lapses: 0, recognitionMs: null, solveMs: null };
  const once = timed(s, 2000);
  assert.equal(once.solveMs, 2000);
  assert.equal(once.recognitionMs, null);
  assert.equal(timed(once, 1000).solveMs, 1700);
});

test('parseLearning keeps valid entries and drops corrupted ones', () => {
  const ok: Learning = { due: 5, interval: 2, lapses: 1, recognitionMs: 900, solveMs: null };
  const parsed = parseLearning({
    a: ok, b: { ...ok, due: -1 }, c: { ...ok, interval: 9999 }, d: { ...ok, lapses: 1.5 }, e: { ...ok, solveMs: 'x' }, f: null, g: { ...ok, recognitionMs: undefined },
  });
  assert.deepEqual(parsed, { a: ok });
  for (const junk of [null, 42, 'x', [ok]]) assert.deepEqual(parseLearning(junk), {});
});

test('byChoice: chosen, then the Plan B (else the next one), then the rest in order', () => {
  const v = (id: string, source: 'speedcubedb' | 'plan-b' = 'speedcubedb') => ({ id, alg: 'R', source });
  const [a, b, pb, c] = [v('a'), v('b'), v('pb', 'plan-b'), v('c')];
  const ids = (xs: { id: string }[]) => xs.map((x) => x.id).join();
  assert.equal(ids(byChoice([a, b, pb, c], a)), 'a,pb,b,c');
  assert.equal(ids(byChoice([a, b, pb, c], c)), 'c,pb,a,b');
  assert.equal(ids(byChoice([a, b, pb, c], pb)), 'pb,a,b,c'); // the Plan B chosen: the next in order is the secondary
  assert.equal(ids(byChoice([a], a)), 'a');
});

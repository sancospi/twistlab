// The weekly challenge's pure rules (api/_lib/weekly.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ao5, parseWeekly, parseWeekPlay, rank, scrambleIndex, weekOf } from '../api/_lib/weekly.js';
import { average, type Result } from './timer.ts';

test('week: its Monday (UTC), Monday 00:00 to Sunday 23:59', () => {
  assert.equal(weekOf(Date.UTC(2026, 9, 26, 0, 0)), '2026-10-26'); // a Monday
  assert.equal(weekOf(Date.UTC(2026, 10, 1, 23, 59)), '2026-10-26'); // its Sunday
  assert.equal(weekOf(Date.UTC(2026, 10, 2, 0, 0)), '2026-11-02');
  assert.equal(weekOf(Date.UTC(2027, 0, 1, 12)), '2026-12-28'); // across the year
});

test('scrambles: 5 a week from the pool\'s start, from the first again after the last', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((k) => scrambleIndex('2026-10-26', '2026-10-26', 100, k)), [0, 1, 2, 3, 4]);
  assert.equal(scrambleIndex('2026-11-02', '2026-10-26', 100, 0), 5);
  assert.equal(scrambleIndex('2027-04-12', '2026-10-26', 100, 4), (24 * 5 + 4) % 100); // 24 weeks on: across DST, whole weeks
  assert.equal(scrambleIndex('2026-10-19', '2026-10-26', 100, 0), 95); // before the start: from the end
});

test('submission: the week, which of its 5 solves, the daily\'s time rules', () => {
  const ok = { week: '2026-10-26', index: 2, ms: 12_340, penalty: 0 };
  assert.deepEqual(parseWeekly(ok), { ...ok, moves: null, times: null });
  assert.deepEqual(parseWeekly({ ...ok, moves: "R U2' R'" }), { ...ok, moves: "R U2' R'", times: null });
  for (const bad of [{ index: 5 }, { index: -1 }, { index: 1.5 }, { index: '2' }, { week: '26/10/2026' }, { ms: -1 }, { ms: 12.5 }, { penalty: '+2' }, { moves: 'x' }]) {
    assert.equal(parseWeekly({ ...ok, ...bad }), null, JSON.stringify(bad));
  }
  assert.equal(parseWeekly(null), null);
  // a time out of the daily's range is a DNF (one attempt each: rejecting it would leave the week incomplete)
  assert.deepEqual(parseWeekly({ ...ok, ms: 800 }), { ...ok, ms: 3000, penalty: 'DNF', moves: null, times: null });
  assert.equal(parseWeekly({ ...ok, ms: 700_000 })?.penalty, 'DNF');
});

test('ao5: WCA, as the timer counts it (best and worst out, +2 counts, two DNF make it DNF)', () => {
  const r = (...v: (number | 'DNF')[]): Result[] => v.map((x) => (x === 'DNF' ? { ms: 10000, penalty: 'DNF' } : { ms: x, penalty: 0 }));
  for (const solves of [r(10000, 12000, 11000, 9000, 13000), r(10000, 10010, 10010, 9000, 13000), r(10000, 'DNF', 11000, 9000, 13000),
    r(10000, 'DNF', 11000, 'DNF', 13000), [{ ms: 10000, penalty: 2000 as const }, ...r(12000, 11000, 9000, 13000)]]) {
    assert.equal(ao5(solves), average(solves, 5), JSON.stringify(solves));
  }
  assert.equal(ao5(r(10000, 12000, 11000)), null); // not all 5 yet
});

test('ranking: complete averages first, best first (DNF last, then the best single, then who finished first)', () => {
  const entry = (user: number, values: (number | 'DNF')[], done: number) =>
    values.map((v, index) => ({ user_id: user, name: `u${user}`, index, ms: v === 'DNF' ? 10000 : v, penalty: v === 'DNF' ? 'DNF' : '0', verified: false, at: done + index }));
  const rows = [
    ...entry(1, [12000, 12000, 12000, 12000, 12000], 0),
    ...entry(2, [11000, 11000, 11000, 11000, 11000], 50),
    ...entry(3, [11000, 11000, 11000, 11000, 9000], 10), // same average as 2, better single
    ...entry(4, ['DNF', 'DNF', 9000, 9000, 9000], 0),
    ...entry(5, [9000, 9000], 0), // 2 of 5: not ranked yet
  ];
  const r = rank(rows, 5);
  assert.deepEqual(Object.keys(r).sort(), ['count', 'me', 'top']); // the shape weekly-view.ts reads
  assert.deepEqual(r.top.map((e) => e.name), ['u3', 'u2', 'u1', 'u4']);
  assert.deepEqual(r.top.map((e) => e.rank), [1, 2, 3, 4]);
  assert.equal(r.top[3].avg, 'DNF');
  assert.equal(r.top[0].avg, 11000);
  assert.equal(r.count, 4);
  assert.deepEqual(r.me, null);
  const mine = rank(rows, 5, 5);
  assert.deepEqual(mine.me, { rank: null, name: 'u5', avg: null, best: 9000, done: 2, verified: false });
  assert.equal(rank(rows, 2, 1).top.length, 2);
  assert.equal(rank(rows, 2, 1).me?.rank, 3); // yours below the top
});

test('a play of the week: one of its 5 solves, this week only', () => {
  assert.equal(parseWeekPlay({ week: '2026-10-19', index: 4 }, '2026-10-19'), 'w:2026-10-19:4');
  for (const bad of [{ week: '2026-10-12', index: 0 }, { week: '2026-10-19', index: 5 }, { week: '2026-10-19', index: '1' }, null]) assert.equal(parseWeekPlay(bad, '2026-10-19'), null);
});

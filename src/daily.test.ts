// The daily challenge's pure rules (api/_lib/daily.js) and its streak (daily-view.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayIndex, normalizeName, parseSubmission, utcDay, verify } from '../api/_lib/daily.js';
import { SCRAMBLES, START } from '../api/_lib/daily-scrambles.js';
import { streak } from './daily-view.ts';

test('day → scramble: one a day from the pool\'s start (UTC), from the first again after the last', () => {
  assert.equal(utcDay(Date.UTC(2026, 9, 22, 23, 59)), '2026-10-22');
  assert.equal(utcDay(Date.UTC(2026, 9, 23, 0, 0)), '2026-10-23');
  assert.equal(dayIndex('2026-10-22', '2026-10-22', 800), 0);
  assert.equal(dayIndex('2026-10-23', '2026-10-22', 800), 1);
  assert.equal(dayIndex('2027-03-29', '2026-10-22', 800), 158); // across the DST change: whole days
  assert.equal(dayIndex('2028-12-30', '2026-10-22', 800), 0);
  assert.equal(dayIndex('2026-10-21', '2026-10-22', 800), 799);
  assert.ok(SCRAMBLES.length >= 365 && /^\d{4}-\d{2}-\d{2}$/.test(START));
  assert.equal(new Set(SCRAMBLES).size, SCRAMBLES.length);
});

test('submission: a day, 3 s ≤ ms < 10 min, the timer\'s penalties, an optional log of face turns', () => {
  const ok = { date: '2026-10-22', ms: 12_340, penalty: 0 };
  assert.deepEqual(parseSubmission(ok), { ...ok, moves: null });
  assert.deepEqual(parseSubmission({ ...ok, moves: '' }), { ...ok, moves: null }); // a cube connected, no move of it (timed by hand)
  assert.deepEqual(parseSubmission({ ...ok, penalty: 'DNF', moves: "R U2' R' U'" }), { ...ok, penalty: 'DNF', moves: "R U2' R' U'" });
  assert.equal(parseSubmission({ ...ok, ms: 3000 })?.ms, 3000);
  assert.equal(parseSubmission({ ...ok, penalty: 2000 })?.penalty, 2000);
  for (const bad of [{ ms: 2999 }, { ms: 600_000 }, { ms: 12.5 }, { ms: '12340' }, { penalty: 2 }, { penalty: '+2' }, { date: '22/10/2026' },
    { date: undefined }, { moves: 'R U x' }, { moves: 'R  U' }, { moves: 'R;DROP' }, { moves: 7 }, { moves: Array(2001).fill('R').join(' ') }]) {
    assert.equal(parseSubmission({ ...ok, ...bad }), null, JSON.stringify(bad).slice(0, 60));
  }
  assert.equal(parseSubmission(null), null);
});

test('verified: the moves solve the scramble (any orientation), at a human pace', async () => {
  const scramble = "R U R' U' F2 D L'";
  const solution = "L D' F2 U R U' R'";
  assert.equal(await verify(scramble, solution, 5000), true);
  assert.equal(await verify(scramble, `${solution} R`, 5000), false);
  assert.equal(await verify(scramble, solution, 300), false); // 7 moves in 0.3 s
});

test('name: trimmed, 2 to 20 letters, digits, spaces, _ or -; empty = none', () => {
  assert.equal(normalizeName('  Ana  María_99 '), 'Ana María_99');
  assert.equal(normalizeName('Łukasz-Ñ'), 'Łukasz-Ñ');
  assert.equal(normalizeName(''), '');
  assert.equal(normalizeName('   '), '');
  assert.equal(normalizeName('Jose\u0301'), 'José'); // NFC
  assert.equal(normalizeName('ที่นี่'), 'ที่นี่'); // Thai: 2 marks on a letter
  assert.equal(normalizeName('Badminton'), 'Badminton');
  for (const bad of ['a', 'x'.repeat(21), '<b>hi</b>', 'a@b.co', 'semi;colon', null, 5, 'a\u0301\u0300\u0302\u0303b', 'ab \u0301c', 'TwistLab', 'twistlab_fan', 'Admin']) assert.equal(normalizeName(bad), null, String(bad));
});

test('streak: days played in a row, up to today or yesterday', () => {
  assert.equal(streak([], '2026-10-22'), 0);
  assert.equal(streak(['2026-10-22'], '2026-10-22'), 1);
  assert.equal(streak(['2026-10-20', '2026-10-21'], '2026-10-22'), 2); // today's still to play
  assert.equal(streak(['2026-10-20', '2026-10-21', '2026-10-22'], '2026-10-22'), 3);
  assert.equal(streak(['2026-10-19', '2026-10-21', '2026-10-22'], '2026-10-22'), 2);
  assert.equal(streak(['2026-10-20'], '2026-10-22'), 0);
  assert.equal(streak(['2026-02-28', '2026-03-01'], '2026-03-01'), 2);
});

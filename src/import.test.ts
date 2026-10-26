import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeResults, parseCsTimer, parseImport, parseSessions, parseStored, parseTwistyTimer } from './import.ts';

const CSTIMER = JSON.stringify({
  session1: [
    [[0, 12345], "R U R' F2", '', 1700000000],
    [[2000, 15000], 'U2 L', 'oops', 1700000100],
    [[-1, 30000], 'B', '', 1700000200],
    [[4000, 9000], 'F', '', 1700000300], // unknown penalty
    [[0, 'x'], 'F', '', 1700000400], // bad time
    'garbage',
  ],
  session2: JSON.stringify([[[0, 3000], 'R', '', 1700000500]]), // 2x2 session, stored as a string
  properties: { sessionData: JSON.stringify({ 1: { name: 1, opt: {} }, 2: { name: '2x2', opt: { scrType: '222so' } } }) },
});

test('csTimer: penalties 0 / 2000 / -1, dates in seconds, each session to its event; bad solves counted as skipped', () => {
  const { results, skipped } = parseCsTimer(JSON.parse(CSTIMER));
  assert.deepEqual(results, [
    { ms: 12340, penalty: 0, at: 1700000000000, scramble: "R U R' F2" },
    { ms: 15000, penalty: 2000, at: 1700000100000, scramble: 'U2 L', comment: 'oops' },
    { ms: 30000, penalty: 'DNF', at: 1700000200000, scramble: 'B' },
    { ms: 3000, penalty: 0, at: 1700000500000, scramble: 'R', event: '222' },
  ]);
  assert.equal(skipped, 3);
  assert.equal(parseImport(CSTIMER).format, 'csTimer');
  assert.deepEqual(parseCsTimer([1, 2]), { results: [], skipped: 0 });
});

test('csTimer: WCA scramble types map to events, unknown ones to the chosen event, FMC and multi-blind are skipped', () => {
  const session = (n: number) => [[[0, 10000], 'R', '', 1700000000 + n]];
  const types = ['333ni', 'mgmp', 'sqrs', '555bld', 'input', '333fm', 'r3ni'];
  const data = Object.fromEntries([
    ...types.map((_, i) => [`session${i + 1}`, session(i)]),
    ['properties', { sessionData: JSON.stringify(Object.fromEntries(types.map((scrType, i) => [i + 1, { opt: { scrType } }]))) }],
  ]);
  const { results, skipped } = parseImport(JSON.stringify(data), 'skewb');
  assert.deepEqual(results.map((r) => r.event), ['333bf', 'minx', 'sq1', '555bf', 'skewb']);
  assert.equal(skipped, 2);
});

test('Twisty Timer backup: rows to the event of their puzzle, +2 already in the stored time, DNF; bad rows skipped', () => {
  const text = [
    'Puzzle,Category,Time(millis),Date(millis),Scramble,Penalty,Comment',
    '"333";"Normal";"12345";"1700000000000";"R U";"0";""',
    '"333";"OH";"17000";"1700000001000";"F";"1";"plus two"',
    '"333";"Normal";"20000";"1700000002000";"B";"2";""',
    '"mega";"Normal";"3000";"1700000003000";"R++";"0";""',
    '"fto";"Normal";"3000";"1700000003500";"R";"0";""',
    '"333";"Normal";"3000";"1700000004000";"R";"10";""',
    '"333";"Normal";"abc";"1700000005000";"R";"0";""',
    '',
  ].join('\r\n');
  const parsed = parseImport(text);
  assert.equal(parsed.format, 'Twisty Timer');
  assert.deepEqual(parsed.results, [
    { ms: 12340, penalty: 0, at: 1700000000000, scramble: 'R U' },
    { ms: 15000, penalty: 2000, at: 1700000001000, scramble: 'F', comment: 'plus two' },
    { ms: 20000, penalty: 'DNF', at: 1700000002000, scramble: 'B' },
    { ms: 3000, penalty: 0, at: 1700000003000, scramble: 'R++', event: 'minx' },
  ]);
  assert.equal(parsed.skipped, 3);
  assert.deepEqual(parseTwistyTimer('hello'), { results: [], skipped: 1 });
});

test('merge: no repeats by date, newest first, undated old solves keep their place', () => {
  const existing = [{ ms: 1, penalty: 0 as const, at: 300 }, { ms: 2, penalty: 0 as const }, { ms: 3, penalty: 0 as const, at: 100 }];
  const { results, added } = mergeResults(existing, [
    { ms: 9, penalty: 0, at: 400 }, { ms: 8, penalty: 0, at: 300 }, { ms: 7, penalty: 0, at: 200 }, { ms: 7, penalty: 0, at: 200 },
  ]);
  assert.equal(added, 2);
  assert.deepEqual(results.map((r) => r.ms), [9, 1, 2, 7, 3]);
  assert.equal(mergeResults(results, [{ ms: 9, penalty: 0, at: 400 }]).added, 0);
});

test('stored list: old entries still load (as 3x3), junk and unknown fields are dropped', () => {
  assert.deepEqual(parseStored([
    { ms: 1000, penalty: 0 }, { ms: 2000, penalty: 'DNF', at: 5, scramble: 'R', x: 1 }, { ms: 'a', penalty: 0 }, null, { ms: 1, penalty: 1 },
    { ms: 3000, penalty: 0, event: 'sq1' }, { ms: 4000, penalty: 0, event: '333' }, { ms: 5000, penalty: 0, event: '333fm' },
  ]), [
    { ms: 1000, penalty: 0 },
    { ms: 2000, penalty: 'DNF', at: 5, scramble: 'R' },
    { ms: 3000, penalty: 0, event: 'sq1' },
    { ms: 4000, penalty: 0 },
  ]);
  assert.deepEqual(parseStored('nope'), []);
});

test('stored solves keep their training, session, phases and comment if well formed', () => {
  const ok = { ms: 20000, penalty: 0, at: 1, train: 'pll', session: 's1', splits: [5000, 12000], comment: 'nice' };
  assert.deepEqual(parseStored([ok]), [ok]);
  assert.deepEqual(parseStored([{ ms: 20000, penalty: 0, train: 'x', session: 3, splits: [12000, 5000], comment: '' }]), [{ ms: 20000, penalty: 0 }]);
  assert.deepEqual(parseStored([{ ms: 20000, penalty: 0, splits: [25000] }]), [{ ms: 20000, penalty: 0 }]); // a phase after the end
});

test('sessions: names by id, deleted ones kept as tombstones, malformed ones dropped', () => {
  assert.deepEqual(parseSessions({ a: { name: 'OH' }, b: { name: 'Old', deleted: true }, c: { name: '' }, d: 3 }), { a: { name: 'OH' }, b: { name: 'Old', deleted: true } });
  assert.deepEqual(parseSessions([{ id: 'a', name: 'x' }]), {});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import type { Result } from './timer.ts';
import { activity, appData, daily, dayOf, estimateGoal, packBackup, parseGoal, replaceAppData, unpackBackup, type Day, type StorageLike } from './progress.ts';

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 21, 18).getTime(); // a Wednesday, 18:00 local
const daysAgo = (n: number, h = 12) => new Date(2026, 9, 21 - n, h).getTime();
/** Daily averages: `avgs[i]` is `avgs.length - 1 - i` days ago. */
const series = (avgs: number[]): Day[] => avgs.map((avg, i) => ({ day: dayOf(daysAgo(avgs.length - 1 - i)), best: avg, avg }));

test('daily: best single and mean of the windows that ended each day; undated solves only fill windows', () => {
  const res: Result[] = [ // newest first
    { ms: 9000, penalty: 0, at: daysAgo(0) },
    { ms: 11000, penalty: 0, at: daysAgo(0, 10) },
    { ms: 12000, penalty: 'DNF', at: daysAgo(1) },
    { ms: 10000, penalty: 0, at: daysAgo(1, 9) },
    { ms: 14000, penalty: 0 },
  ];
  const d = daily(res, 'mo3');
  assert.deepEqual(d.map((x) => x.day), [dayOf(daysAgo(1)), dayOf(daysAgo(0))]);
  assert.equal(d[0].best, 10000);
  assert.equal(d[0].avg, null); // its only full window has the DNF
  assert.equal(d[1].best, 9000);
  assert.equal(d[1].avg, null); // both windows of today include the DNF too
  const ok = daily(res.map((r) => ({ ...r, penalty: 0 })), 'mo3');
  assert.equal(ok[0].avg, 12000); // 14 10 12
  assert.equal(ok[1].avg, Math.round((11000 + 10670) / 2)); // 10 12 11 and 12 11 9 -> 11 and 10.67
});

test('goal estimate: a straight line through the recent daily averages', () => {
  // 1 s better each day, from 40 s: 36 s today, 30 s 6 days later
  const eta = estimateGoal(series([40000, 39000, 38000, 37000, 36000]), 30000, NOW);
  assert.equal(eta.kind, 'eta');
  if (eta.kind === 'eta') assert.equal(eta.at, dayOf(NOW + 6 * DAY));
  assert.deepEqual(estimateGoal(series([40000, 39000, 38000, 37000]), 30000, NOW), { kind: 'few' });
  assert.deepEqual(estimateGoal(series([36000, 37000, 36500, 37000, 37500]), 30000, NOW), { kind: 'flat' });
  assert.deepEqual(estimateGoal(series([36000, 36000, 36000, 36000, 36000]), 30000, NOW), { kind: 'flat' });
  assert.deepEqual(estimateGoal(series([40000, 39990, 39980, 39970, 39960]), 30000, NOW), { kind: 'far' });
  assert.deepEqual(estimateGoal(series([60000, 60000.0001, 60000.0002, 60000.0003, 60000.0004].reverse()), 5000, NOW), { kind: 'far' });
  assert.deepEqual(estimateGoal(series([31000, 29000]), 30000, NOW), { kind: 'reached' });
  // only the last 4 weeks count: improving long ago, flat lately
  const longAgo = Array.from({ length: 30 }, (_, i): Day => ({ day: dayOf(daysAgo(60 - i)), best: 0, avg: 60000 - i * 1000 }));
  assert.deepEqual(estimateGoal(longAgo, 30000, NOW), { kind: 'few' }); // all of it older than the window
  assert.deepEqual(estimateGoal([...longAgo, ...series([31000, 31000, 31000, 31000, 31000])], 30000, NOW), { kind: 'flat' });
  // the line already crossed: not before tomorrow
  const crossed = estimateGoal(series([40000, 30000, 30500, 30200, 30100]), 30000, NOW);
  assert.ok(crossed.kind === 'eta' && crossed.at === dayOf(NOW + DAY));
});

test('goal: only a valid event, average and time is kept', () => {
  assert.deepEqual(parseGoal({ event: '333', avg: 'ao5', ms: 30000 }), { event: '333', avg: 'ao5', ms: 30000 });
  for (const bad of [null, [], 'x', { event: 'fmc', avg: 'ao5', ms: 1 }, { event: '333', avg: 'ao7', ms: 1 }, { event: '333', avg: 'ao5', ms: -1 }, { event: '333', avg: 'ao5', ms: '30' }, { event: '333', avg: 'ao5', ms: Infinity }]) {
    assert.equal(parseGoal(bad), null);
  }
});

test('activity: whole weeks from Monday to today, counted per local day', () => {
  const a = activity([daysAgo(0, 1), daysAgo(0, 23), daysAgo(2), daysAgo(40), NOW + DAY], NOW, 2);
  assert.equal(a.length, 7 + 3); // last week, then Mon..Wed
  assert.equal(new Date(a[0].day).getDay(), 1);
  assert.equal(a.at(-1)!.day, dayOf(NOW));
  assert.equal(a.at(-1)!.n, 2);
  assert.equal(a.at(-3)!.n, 1);
  assert.equal(a.reduce((s, x) => s + x.n, 0), 3);
});

const fakeStorage = (init: Record<string, string>, quota = Infinity): StorageLike & { map: Map<string, string> } => {
  const map = new Map(Object.entries(init));
  return {
    map,
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { if (map.size >= quota) throw new Error('QuotaExceededError'); map.set(k, v); },
    removeItem: (k) => void map.delete(k),
  };
};

test('backup: pack and unpack round-trip every key but the cube MACs', () => {
  const s = fakeStorage({ 'cube-results': '[{"ms":9000,"penalty":0}]', 'academy-learning': '{}', 'quiz-net': 'true', 'cube-mac:GAN_1': '"AA:BB"' });
  const data = appData(s);
  assert.deepEqual(Object.keys(data).sort(), ['academy-learning', 'cube-results', 'quiz-net']);
  const back = unpackBackup(packBackup(data, NOW));
  assert.deepEqual(back, { ok: true, data, exportedAt: NOW });
});

test('backup: a file that is not a valid backup of this version is refused', () => {
  const file = (o: object) => JSON.stringify({ app: 'cube', version: 1, exportedAt: '2026-10-21T10:00:00.000Z', data: {}, ...o });
  assert.deepEqual(unpackBackup('not json'), { ok: false, error: 'json' });
  assert.deepEqual(unpackBackup('null'), { ok: false, error: 'shape' });
  assert.deepEqual(unpackBackup(file({ app: 'other' })), { ok: false, error: 'shape' });
  assert.deepEqual(unpackBackup(file({ version: 2 })), { ok: false, error: 'version' });
  assert.deepEqual(unpackBackup(file({ data: [] })), { ok: false, error: 'shape' });
  assert.deepEqual(unpackBackup(file({ exportedAt: 'ayer' })), { ok: false, error: 'shape' });
  assert.deepEqual(unpackBackup(file({ data: { 'cube-results': 5 } })), { ok: false, error: 'shape' });
  assert.deepEqual(unpackBackup(file({ data: { 'cube-results': '{bad' } })), { ok: false, error: 'shape' });
  assert.deepEqual(unpackBackup(file({ data: { 'cube-mac:x': '"AA"' } })), { ok: false, error: 'shape' });
  assert.equal(unpackBackup(file({ data: { 'cube-results': '[]' } })).ok, true);
});

test('backup: replacing keeps the MACs, drops keys not in the file, and rolls back when storage is full', () => {
  const s = fakeStorage({ 'cube-results': '[]', 'old-key': '1', 'cube-mac:GAN_1': '"AA"' });
  assert.equal(replaceAppData(s, { 'cube-results': '[{"ms":1,"penalty":0}]', 'academy-stats': '{}' }), true);
  assert.deepEqual(Object.fromEntries(s.map), { 'cube-mac:GAN_1': '"AA"', 'cube-results': '[{"ms":1,"penalty":0}]', 'academy-stats': '{}' });
  const full = fakeStorage({ a: '1', 'cube-mac:x': '"AA"' }, 2);
  assert.equal(replaceAppData(full, { b: '1', c: '2', d: '3' }), false);
  assert.deepEqual(Object.fromEntries(full.map), { 'cube-mac:x': '"AA"', a: '1' });
});

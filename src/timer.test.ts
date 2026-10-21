import test from 'node:test';
import assert from 'node:assert/strict';
import { average, formatAverage, formatResult, formatTime, inspectionPenalty, recordTime, resultValue, type Result } from './timer.ts';

test('inspection penalties follow WCA limits', () => {
  assert.equal(inspectionPenalty(15000), 0);
  assert.equal(inspectionPenalty(15001), 2000);
  assert.equal(inspectionPenalty(17000), 2000);
  assert.equal(inspectionPenalty(17001), 'DNF');
});

test('times are truncated to hundredths and shown as m:ss.cc past a minute', () => {
  assert.equal(formatTime(12349), '12.34');
  assert.equal(formatTime(999), '0.99');
  assert.equal(formatTime(62340), '1:02.34');
  assert.equal(formatResult({ ms: 12340, penalty: 2000 }), '14.34+');
  assert.equal(formatResult({ ms: 12340, penalty: 'DNF' }), 'DNF');
  assert.ok(resultValue({ ms: 1, penalty: 'DNF' }) > resultValue({ ms: 99999, penalty: 2000 }));
});

test('singles are truncated to hundredths, rounded to the second from 10 minutes', () => {
  assert.equal(recordTime(12349), 12340);
  assert.equal(recordTime(600499), 600000);
  assert.equal(recordTime(600500), 601000);
});

test('ao5 drops best and worst, rounds the mean, one DNF counts as worst, two make it DNF', () => {
  const r = (...ms: (number | 'DNF')[]): Result[] => ms.map((m) => (m === 'DNF' ? { ms: 1, penalty: 'DNF' } : { ms: m, penalty: 0 }));
  assert.equal(average(r(10000, 12000, 11000, 9000, 13000), 5), 11000);
  assert.equal(average(r(10000, 10010, 10010, 9000, 13000), 5), 10010); // 10006.67 -> 10.01
  assert.equal(average(r(10000, 'DNF', 11000, 9000, 13000), 5), 11330); // 11333.3 -> 11.33
  assert.equal(average(r(10000, 'DNF', 11000, 'DNF', 13000), 5), Infinity);
  assert.equal(average([{ ms: 10000, penalty: 2000 }, ...r(12000, 11000, 9000, 13000)], 5), 11670); // +2 counts: 11, 12, 12
  assert.equal(average(r(10000, 11000), 5), null);
  assert.equal(formatAverage(Infinity), 'DNF');
});

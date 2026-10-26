import test from 'node:test';
import assert from 'node:assert/strict';
import { average, EVENTS, eventField, eventOf, formatAverage, formatResult, formatRunning, formatTime, hasInspection, parseTime, inspectionCall, inspectionPenalty, is333, isEvent, recordTime, resultValue, trimFor, type Result } from './timer.ts';

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

test('inspection calls at 8 and 12 seconds', () => {
  assert.deepEqual([0, 7999, 8000, 11999, 12000, 16000].map(inspectionCall), [0, 0, 8, 8, 12, 12]);
});

test('mo3 trims nothing, a DNF makes it DNF; ao50+ trims 5% at each end', () => {
  const r = (...ms: number[]): Result[] => ms.map((m) => ({ ms: m, penalty: 0 }));
  assert.equal(average(r(10000, 11000, 12010), 3, 0), 11000); // 11003.3 -> 11.00
  assert.equal(average([...r(10000, 11000), { ms: 1, penalty: 'DNF' }], 3, 0), Infinity);
  assert.equal(trimFor(50), 3);
  assert.equal(trimFor(100), 5);
  assert.equal(trimFor(1000), 50);
  // ao50: 3 terrible solves at the top and 3 lucky ones at the bottom are dropped
  assert.equal(average(r(...Array(44).fill(10000), 1, 1, 1, 99000, 99000, 99000), 50), 10000);
});

test('events: blindfolded ones have no inspection, 3x3 ones are the smart cube\'s, no event field means 3x3', () => {
  assert.deepEqual(EVENTS.filter((e) => !hasInspection(e)), ['333bf', '444bf', '555bf']);
  assert.deepEqual(EVENTS.filter(is333), ['333', '333bf', '333oh']);
  assert.equal(eventOf({ ms: 1, penalty: 0 }), '333');
  assert.equal(eventOf({ ms: 1, penalty: 0, ...eventField('minx') }), 'minx');
  assert.deepEqual(eventField('333'), {});
  assert.ok(isEvent('sq1') && !isEvent('333fm') && !isEvent(undefined));
});

test('the running clock: hundredths, tenths, seconds or hidden', () => {
  assert.equal(formatRunning(12345, 'cs'), '12.34');
  assert.equal(formatRunning(12345, 'ds'), '12.3');
  assert.equal(formatRunning(65432, 'ds'), '1:05.4');
  assert.equal(formatRunning(12999, 's'), '12');
  assert.equal(formatRunning(65432, 's'), '1:05');
  assert.equal(formatRunning(12345, 'none'), '…');
});

test('typed times: seconds, minutes, csTimer digits, +2 and DNF; anything else is null', () => {
  assert.deepEqual(parseTime('12.34'), { ms: 12340, penalty: 0 });
  assert.deepEqual(parseTime(' 12,349 '), { ms: 12340, penalty: 0 }); // truncated as the clock records it
  assert.deepEqual(parseTime('1:05.20'), { ms: 65200, penalty: 0 });
  assert.deepEqual(parseTime('1234'), { ms: 12340, penalty: 0 });
  assert.deepEqual(parseTime('10523'), { ms: 65230, penalty: 0 });
  assert.deepEqual(parseTime('12.34+'), { ms: 12340, penalty: 2000 });
  assert.deepEqual(parseTime('12.34 +2'), { ms: 12340, penalty: 2000 });
  assert.deepEqual(parseTime('dnf'), { ms: 0, penalty: 'DNF' });
  assert.deepEqual(parseTime('DNF(12.34)'), { ms: 12340, penalty: 'DNF' });
  for (const bad of ['', 'abc', '0', '1:75', '12.3.4', 'DNF(x)', '-5']) assert.equal(parseTime(bad), null, bad);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { duelLink, outcome, parseDuel } from './duel.ts';

const scramble = "R U2 F' L2 D B2 U' R2 F2 L2 B2";

test('duel: a link with the scramble and the time, read back', () => {
  const url = new URL(duelLink('https://twistlab.app/en/', { scramble, ms: 12340, penalty: 0 }));
  assert.equal(url.origin + url.pathname, 'https://twistlab.app/en/');
  assert.deepEqual(parseDuel(url.search), { scramble, ms: 12340, penalty: 0 });
  assert.deepEqual(parseDuel(new URL(duelLink('https://twistlab.app/', { scramble, ms: 9990, penalty: 2000 })).search), { scramble, ms: 9990, penalty: 2000 });
  for (const ms of [800, 700_000]) assert.equal(parseDuel(new URL(duelLink('https://twistlab.app/', { scramble, ms, penalty: 0 })).search)?.ms, ms); // any time a solve has
});

test('duel: anything else is no duel', () => {
  for (const search of ['', '?reto=', `?reto=${encodeURIComponent(scramble)}`, `?reto=${encodeURIComponent(scramble)}&t=abc`,
    `?reto=${encodeURIComponent(scramble)}&t=0`, `?reto=${encodeURIComponent(scramble)}&t=90000000`, `?reto=${encodeURIComponent(scramble)}&t=12000&p=constructor`, `?reto=${encodeURIComponent(scramble)}&t=12000&p=__proto__`, `?reto=${encodeURIComponent('R U <script>')}&t=12000`, `?reto=${encodeURIComponent(Array(60).fill('R').join(' '))}&t=12000`,
    `?reto=${encodeURIComponent(scramble)}&t=12000&p=7`]) {
    assert.equal(parseDuel(search), null, search);
  }
});

test('duel: who wins, penalties counted, a DNF never wins', () => {
  const them = { scramble, ms: 12000, penalty: 0 as const };
  assert.equal(outcome({ ms: 11000, penalty: 0 }, them), 'win');
  assert.equal(outcome({ ms: 11000, penalty: 2000 }, them), 'lose'); // 13.00
  assert.equal(outcome({ ms: 12000, penalty: 0 }, them), 'tie');
  assert.equal(outcome({ ms: 5000, penalty: 'DNF' }, them), 'lose');
  assert.equal(outcome({ ms: 20000, penalty: 0 }, { ...them, penalty: 'DNF' }), 'win');
});

// The PLL recognition and AUF trainers' logic: states, answers, picking and scores.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { patternToFacelets } from '../facelets.ts';
import { PLLS, after, finishing, parseProgress, pickCase, pllItem, preAufs, scored, tallied } from './pllRecognition.ts';
import type { Rng } from './cube.ts';
import { aufAnswers } from './aufTrainer.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const seq = (...xs: number[]): Rng => () => xs.shift() ?? 0;

test('a PLL item: its AUF before, the algorithm and its AUF after solve it', () => {
  for (const c of PLLS) {
    for (let i = 0; i < 16; i++) {
      const item = pllItem(kpuzzle, c, c.algs[0].alg, seq((i % 4) / 4, Math.floor(i / 4) / 4));
      assert.deepEqual(finishing(item.pattern), [], `${c.id} isn't solved by a U turn`);
      assert.ok(preAufs(item.pattern, item.alg).includes(item.pre), c.id);
      assert.deepEqual(finishing(after(after(item.pattern, item.pre), item.alg)), [item.post], c.id);
      assert.deepEqual(aufAnswers(item, 'post'), [item.post]);
    }
  }
});

test('before the algorithm: one right AUF, two for Z and E, any for H and the N perms', () => {
  const count = (code: string) => {
    const c = PLLS.find((x) => x.code === code)!;
    return aufAnswers(pllItem(kpuzzle, c, c.algs[0].alg, Math.random), 'pre').length;
  };
  for (const code of ['H', 'Na', 'Nb']) assert.equal(count(code), 4, code);
  for (const code of ['Z', 'E']) assert.equal(count(code), 2, code);
  for (const code of ['T', 'Ua', 'Ga', 'V', 'Y', 'Aa']) assert.equal(count(code), 1, code);
});

test('two sides name one PLL: the front and right top rows tell every case apart, whatever the AUFs', () => {
  const cycle = 'FRBL';
  const seen = new Map<string, string>();
  for (const c of PLLS) {
    for (let i = 0; i < 16; i++) {
      const f = patternToFacelets(pllItem(kpuzzle, c, c.algs[0].alg, seq((i % 4) / 4, Math.floor(i / 4) / 4)).pattern);
      // colors as they relate to the front-left sticker's (same, next, opposite…): what a solver reads
      const key = [18, 19, 20, 9, 10, 11].map((k) => (cycle.indexOf(f[k]) - cycle.indexOf(f[18]) + 4) % 4).join('');
      assert.ok(!seen.has(key) || seen.get(key) === c.id, `${c.id} looks like ${seen.get(key)} (${key})`);
      seen.set(key, c.id);
    }
  }
});

test('scores: a miss weighs 2, a hit takes 1 off; weak cases come back more often, never twice in a row', () => {
  let s = scored(undefined, false, 900);
  assert.deepEqual(s, { n: 1, ok: 0, ms: 0, weak: 2 });
  s = scored(s, true, 1200.4);
  assert.deepEqual(s, { n: 2, ok: 1, ms: 1200, weak: 1 });
  const [a, b] = PLLS;
  const p = { best: 0, cases: { [a.id]: { n: 1, ok: 0, ms: 0, weak: 6 } } };
  assert.equal(pickCase([a, b], p, () => 0.8).id, a.id); // weights 7 : 1
  assert.equal(pickCase([a, b], p, () => 0.9).id, b.id);
  assert.equal(pickCase([a, b], p, () => 0, a.id).id, b.id);
  assert.equal(pickCase([a], p, () => 0, a.id).id, a.id);
  assert.deepEqual(tallied({ n: 3, ok: 3, ms: 3000, streak: 3 }, false, 500), { n: 4, ok: 3, ms: 3000, streak: 0 });
});

test('stored progress: junk is dropped', () => {
  assert.deepEqual(parseProgress(null), { best: 0, cases: {} });
  assert.deepEqual(parseProgress({ best: 4, cases: { x: { n: 1, ok: 1, ms: 5, weak: 0 }, y: { n: -1 }, z: null } }),
    { best: 4, cases: { x: { n: 1, ok: 1, ms: 5, weak: 0 } } });
});

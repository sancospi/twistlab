import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { METHODS } from './methods.ts';
import { caseProbability, formatProbability, stageCounts } from './probability.ts';
import type { Stage } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const p = (id: string) => caseProbability(id, kpuzzle);
const phase = (id: string) => METHODS.flatMap((m) => m.phases).find((x) => x.id === id)!;

test('every last-layer stage of every phase: its cases and the skip add up to all its states', () => {
  const expected: Record<string, [Stage, number][]> = {
    'prin-cruz': [['oll-cross', 216]], // beginner's yellow cross
    oll: [['oll-cross', 216], ['oll-corners', 27]],
    pll: [['pll-corners', 288], ['pll-edges', 48]],
    'cfopc-oll': [['oll-corners', 216]],
    'cfopc-pll': [['pll-edges', 288]],
  };
  for (const [id, stages] of Object.entries(expected)) {
    for (const [stage, total] of stages) {
      const c = stageCounts(phase(id), stage, kpuzzle)!;
      assert.ok(c, `${id} ${stage}`);
      assert.equal(c.total, total, `${id} ${stage}`);
      assert.equal(c.skip + [...c.byCase.values()].reduce((a, b) => a + b, 0), total, `${id} ${stage}`);
      for (const [caseId, n] of c.byCase) assert.ok(n > 0, `${caseId} never comes up`);
    }
  }
});

test('known values', () => {
  // full OLL: skip 1/216, H 1/108, Sune 1/54, most cases 1/54, a few 1/108 (symmetric)
  assert.equal(stageCounts(phase('cfopc-oll'), 'oll-corners', kpuzzle)!.skip, 1);
  assert.equal(p('cfopc-oll-21'), 1 / 108); // H
  assert.equal(p('cfopc-oll-27'), 1 / 54); // Sune
  assert.equal(p('cfopc-oll-20'), 1 / 216); // all edges flipped, all corners up
  assert.equal(p('cfopc-oll-57'), 1 / 108);
  // full PLL: skip 1/72, H 1/72, T 1/18, Z 1/36, Ua 1/18, Na 1/72, G 1/18
  assert.equal(stageCounts(phase('cfopc-pll'), 'pll-edges', kpuzzle)!.skip, 4);
  assert.equal(p('cfopc-pll-h'), 1 / 72);
  assert.equal(p('cfopc-pll-t'), 1 / 18);
  assert.equal(p('cfopc-pll-z'), 1 / 36);
  assert.equal(p('cfopc-pll-ua'), 1 / 18);
  assert.equal(p('cfopc-pll-na'), 1 / 72);
  assert.equal(p('cfopc-pll-ga'), 1 / 18);
  // 2-look OLL: Dot 1/8, Line 1/4, L 1/2; OCLL Sune 4/27, H 2/27
  assert.equal(p('cfop-oll-punto'), 1 / 8);
  assert.equal(p('cfop-oll-linea'), 1 / 4);
  assert.equal(p('cfop-oll-l'), 1 / 2);
  assert.equal(p('cfop-oll-sune'), 4 / 27);
  assert.equal(p('cfop-oll-h'), 2 / 27);
  // 2-look PLL: T 2/3, Y 1/6 (skip 1/6); Ua 1/3, H 1/12, Z 1/6 (skip 1/12)
  assert.equal(p('cfop-pll-t'), 2 / 3);
  assert.equal(p('cfop-pll-y'), 1 / 6);
  assert.equal(p('cfop-pll-ua'), 1 / 3);
  assert.equal(p('cfop-pll-h'), 1 / 12);
  assert.equal(p('cfop-pll-z'), 1 / 6);
  // not counted: F2L, beginner's other last-layer steps, unknown ids
  assert.equal(p('cfop-f2l-a1'), null);
  assert.equal(p('cfopc-f2l-01'), null);
  assert.equal(p('nope'), null);
});

test('formatProbability: always a reduced fraction', () => {
  assert.equal(formatProbability(1 / 54), '1/54');
  assert.equal(formatProbability(1 / 3), '1/3');
  assert.equal(formatProbability(4 / 27), '4/27');
  assert.equal(formatProbability(2 / 3), '2/3');
  assert.equal(formatProbability(8 / 216), '1/27');
});

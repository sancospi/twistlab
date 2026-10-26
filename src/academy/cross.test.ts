import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { IDENTITY, YELLOW_UP, mapMove } from '../notation.ts';
import { crossCase, crossDistance, crossSolved, crossTable, edgeTables, seededScramble, solveCross } from './cross.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const MOVES = 'U D R L F B'.split(' ').flatMap((f) => [f, f + "'", f + '2']);

test('table build is fast, and the depth distribution is the known one', () => {
  for (const face of ['U', 'D'] as const) {
    const t0 = performance.now();
    const d = crossTable(kpuzzle, face);
    assert.ok(performance.now() - t0 < 2000, `${face} built in ${performance.now() - t0} ms`);
    const counts = Array(9).fill(0);
    for (const x of d) if (x !== 255) counts[x]++;
    assert.deepEqual(counts, [1, 15, 158, 1394, 9809, 46381, 97254, 34966, 102]);
    // FNV-1a of the whole table, taken from the array-based step() before its integer rewrite: same table, byte for byte
    let h = 2166136261;
    for (const x of d) h = Math.imul(h ^ x, 16777619) >>> 0;
    assert.equal(h, { U: 3952224661, D: 1213830213 }[face]);
  }
});

test('edge tables agree with KPattern.applyMove', () => {
  const tables = edgeTables(kpuzzle);
  const start = seededScramble(kpuzzle, 7);
  MOVES.forEach((m, i) => {
    const { pieces, orientation } = start.patternData.EDGES;
    const after = start.applyMove(m).patternData.EDGES;
    for (let s = 0; s < 12; s++) {
      const to = tables[i].to[s];
      assert.equal(after.pieces[to], pieces[s], `${m} slot ${s}`);
      assert.equal(after.orientation[to], orientation[s] ^ tables[i].flip[s], `${m} flip ${s}`);
    }
  });
});

test('solved is 0; any single turn is 1, except the opposite face, which leaves the cross alone', () => {
  for (const face of ['U', 'D'] as const) {
    assert.ok(crossSolved(solved, face));
    const opposite = face === 'U' ? 'D' : 'U';
    for (const m of MOVES) assert.equal(crossDistance(solved.applyMove(m), face), m[0] === opposite ? 0 : 1, `${face} ${m}`);
  }
});

test('200 seeded states: optimal, distinct, cross-solving solutions; cases land on exactly k', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const s = seededScramble(kpuzzle, seed);
    for (const face of ['U', 'D'] as const) {
      const d = crossDistance(s, face);
      const sols = solveCross(s, face);
      assert.ok(sols.length >= 1);
      assert.equal(new Set(sols.map((x) => x.join(' '))).size, sols.length, 'distinct');
      for (const sol of sols) {
        assert.equal(sol.length, d);
        assert.ok(crossSolved(s.applyAlg(sol.join(' ')), face), `${seed} ${face} ${sol.join(' ')}`);
      }
      for (let k = 1; k <= 8; k++) {
        const e = crossCase(s, face, k);
        if (d < k) assert.equal(e, null);
        else assert.equal(crossDistance(s.applyAlg(e!.join(' ')), face), k, `${seed} ${face} k=${k}`);
      }
    }
  }
});

test('the same physical state has the same distance in the user frame (D) and the GAN frame (U)', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const moves = Array.from({ length: 20 }, (_, i) => MOVES[(seed * 31 + i * i * 7 + i * seed) % MOVES.length]);
    const user = solved.applyAlg(moves.map((m) => mapMove(m, IDENTITY)).join(' '));
    const cube = solved.applyAlg(moves.map((m) => mapMove(m, YELLOW_UP)).join(' '));
    assert.equal(crossDistance(user, 'D'), crossDistance(cube, 'U'), moves.join(' '));
  }
});

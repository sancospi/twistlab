import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { crossDistance, seededScramble } from './cross.ts';
import { crossGuide } from './crossGuide.ts';
import {
  CROSS_HISTORY_MAX, addCrossSession, crossItem, extraTurns, levelProgress, nextLevel, parseCrossHistory, summarize,
  type CrossAttempt, type CrossSession,
} from './crossScore.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const [n1, n2] = crossGuide.levels;

test('crossItem lands every level in its range, from real scrambles', () => {
  for (const level of crossGuide.levels) {
    let made = 0;
    for (let seed = 1; made < 20; seed++) {
      const s = seededScramble(kpuzzle, seed * 31 + level.moves.min);
      const item = crossItem(s, level.moves, (seed % 10) / 10);
      if (!item) {
        assert.ok(crossDistance(s, 'D') < level.moves.min, 'null only when the scramble is already shorter');
        continue;
      }
      made++;
      const d = crossDistance(s.applyAlg(item.moves.join(' ')), 'D');
      assert.equal(d, item.k);
      assert.ok(d >= level.moves.min && d <= level.moves.max, `${level.id}: ${d}`);
    }
  }
});

const at = (turns: number, optimal: number, execMs = 1000, planMs = 5000): CrossAttempt => ({ optimal, turns, planMs, execMs });

test('summary: extra turns, share optimal, times and the level goal', () => {
  assert.equal(extraTurns(at(5, 4)), 1);
  assert.equal(extraTurns(at(3, 4)), 0, 'never negative');
  assert.equal(summarize([], n1, 5), null);
  const s = summarize([at(2, 2), at(3, 2), at(1, 1, 3000)], n1, 3)!;
  assert.equal(s.n, 3);
  assert.equal(s.avgExtra, 1 / 3);
  assert.equal(s.optimalShare, 2 / 3);
  assert.equal(s.execMs, 5000 / 3);
  assert.equal(s.planMs, 5000);
  assert.equal(s.passed, false, 'n1 allows no extra turns');
  assert.equal(summarize([at(2, 2), at(1, 1)], n1, 2)!.passed, true);
  assert.equal(summarize([at(2, 2, 2500)], n1, 1)!.passed, false, 'executed over the 2 s of n1');
  assert.equal(summarize([at(2, 2, 1000, 14000)], n1, 1)!.passed, true, 'inspection is not solve time');
  assert.equal(summarize([at(2, 2, 1000, 16000)], n1, 1)!.passed, false, 'planning past the 15 s of inspection');
  assert.equal(summarize([at(5, 4), at(4, 4)], n2, 2)!.passed, true, 'n2 allows 1 extra on average');
});

test('summary: skipped or unplayed items count against the goal', () => {
  assert.equal(summarize([at(2, 2)], n1, 10)!.passed, false, '1 optimal solve and 9 skips');
  const eight = Array.from({ length: 8 }, () => at(2, 2));
  assert.equal(summarize(eight, n1, 10)!.passed, true, '8 of 10 is enough');
  assert.equal(summarize(eight.slice(1), n1, 10)!.passed, false, '7 of 10 is not');
});

test('nextLevel suggests the following level, none after the last', () => {
  assert.equal(nextLevel(crossGuide.levels, 'n1'), n2);
  assert.equal(nextLevel(crossGuide.levels, 'n4'), null);
});

const session = (level: CrossSession['level'], avgExtra: number, ms: number, passed = false): CrossSession =>
  ({ level, at: 1, mode: 'virtual', n: 5, avgExtra, optimalShare: 0.5, planMs: ms / 2, execMs: ms / 2, passed });

test('history: corrupted entries are dropped, capped, and per-level progress', () => {
  const ok = session('n2', 1, 4000);
  const parsed = parseCrossHistory([ok, null, 'x', { ...ok, level: 'n9' }, { ...ok, n: 0 }, { ...ok, optimalShare: 2 }, { ...ok, planMs: -1 }, { ...ok, passed: 'yes' }, { ...ok, extra: 1 }]);
  assert.deepEqual(parsed, [ok, ok]); // the last one keeps its known fields only
  assert.deepEqual(parseCrossHistory({}), []);
  assert.deepEqual(parseCrossHistory('[oops'), []);
  let h: CrossSession[] = [];
  for (let i = 0; i < CROSS_HISTORY_MAX + 5; i++) h = addCrossSession(h, { ...ok, at: i });
  assert.equal(h.length, CROSS_HISTORY_MAX);
  assert.equal(h[0].at, 5);
  const p = levelProgress([session('n1', 2, 6000), session('n1', 0.5, 9000, true), session('n2', 0, 100)], 'n1')!;
  assert.deepEqual(p, { sessions: 2, bestExtra: 0.5, avgExtra: 1.25, bestMs: 3000, avgMs: 3750, passed: true }); // execution only
  assert.equal(levelProgress([], 'n3'), null);
});

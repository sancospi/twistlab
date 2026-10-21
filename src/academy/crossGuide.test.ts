import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import { IDENTITY, centerMoves } from '../notation.ts';
import { crossGuide } from './crossGuide.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const play = (p: KPattern, alg: string) => p.applyAlg(centerMoves(alg, IDENTITY).join(' '));
// User frame: the white cross is the D layer, EDGES slots DF DR DB DL (4..7), each piece home and oriented.
const crossDone = (p: KPattern) => [4, 5, 6, 7].every((i) => p.patternData.EDGES.pieces[i] === i && p.patternData.EDGES.orientation[i] === 0);
const NOTATION = /^(?:[URFDLB](?:2|')?)(?: [URFDLB](?:2|')?)*$/; // face turns only, ASCII primes
const MOVES = [...'URFDLB'].flatMap((f) => [f, `${f}'`, `${f}2`]);

/** Is the cross solvable in at most n face turns? (brute force: the examples are short) */
function within(p: KPattern, n: number): boolean {
  if (crossDone(p)) return true;
  return n > 0 && MOVES.some((m) => within(p.applyMove(m), n - 1));
}

const examples = crossGuide.lessons.flatMap((l) => (l.examples ?? []).map((e) => ({ lesson: l.id, ...e })));

test('cross guide: every example breaks the cross and its solution is a shortest one', () => {
  assert.ok(crossGuide.lessons.find((l) => l.id === 'una-arista')!.examples!.length >= 8);
  assert.ok(crossGuide.lessons.find((l) => l.id === 'relativas')!.examples!.length >= 2);
  for (const e of examples) {
    const p = play(solved, e.setup);
    assert.ok(!crossDone(p), `${e.setup} breaks the cross`);
    assert.ok(crossDone(play(p, e.solution)), `${e.setup} -> ${e.solution}`);
    const n = e.solution.split(' ').length;
    assert.ok(!within(p, n - 1), `${e.setup}: ${e.solution} is not the shortest`);
    assert.ok(e.caption.es, e.setup);
  }
});

test('cross guide: ids, text and clean notation', () => {
  const ids = crossGuide.lessons.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(crossGuide.id, 'cruz');
  for (const s of [crossGuide.name, crossGuide.summary, crossGuide.intro]) assert.ok(s.es);
  for (const l of crossGuide.lessons) assert.ok(l.title.es && l.body.es, l.id);
  for (const e of examples) for (const s of [e.setup, e.solution]) assert.match(s, NOTATION);
});

test('cross guide: 4 levels with growing, contiguous ranges and goals', () => {
  const { levels } = crossGuide;
  assert.deepEqual(levels.map((l) => l.id), ['n1', 'n2', 'n3', 'n4']);
  assert.equal(levels[0].moves.min, 1);
  assert.equal(levels.at(-1)!.moves.max, 8); // every cross is solvable in 8
  levels.forEach((l, i) => {
    assert.ok(l.moves.min <= l.moves.max && l.name.es && l.description.es, l.id);
    if (!i) return;
    const prev = levels[i - 1];
    assert.equal(l.moves.min, prev.moves.max + 1, l.id);
    assert.ok(l.goal.seconds > prev.goal.seconds && l.goal.overOptimal >= prev.goal.overOptimal, l.id);
  });
});

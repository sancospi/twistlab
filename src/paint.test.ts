import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
import { EMPTY, isPainting, neighbour, scramblePainting, validate } from './paint.ts';

const swap = (f: string, ...pairs: [number, number][]) => {
  const a = [...f];
  for (const [i, j] of pairs) [a[i], a[j]] = [a[j], a[i]];
  return a.join('');
};
const kinds = (f: string) => validate(f).map((p) => p.kind);

test('paint: real states pass', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  assert.deepEqual(validate(SOLVED_FACELETS), []);
  for (const alg of ['R', "R U R' U'", "F2 D L' B U2 R2 F' D2 L B'", 'U2 D2 F2 B2 L2 R2']) {
    assert.deepEqual(validate(patternToFacelets(solved.applyAlg(alg))), [], alg);
  }
});

test('paint: a scramble (white up) painted yellow up', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const as = (alg: string) => patternToFacelets(kpuzzle.defaultPattern().applyAlg(alg));
  assert.equal(scramblePainting(kpuzzle, "R U' F2"), as("L D' F2"));
  assert.ok(isPainting(scramblePainting(kpuzzle, "R2 B L' D2 U R’")!));
  for (const bad of ['', 'M', "R x'", 'Rw', 'hola']) assert.equal(scramblePainting(kpuzzle, bad), null, bad);
});

test('paint: colours not painted, or not 9 times each', () => {
  assert.deepEqual(validate(EMPTY), [{ kind: 'blank', n: 48 }]);
  const tenYellow = SOLVED_FACELETS.slice(0, 9) + 'U' + SOLVED_FACELETS.slice(10); // an orange sticker painted yellow
  assert.deepEqual(validate(tenYellow), [{ kind: 'count', face: 'U', n: 10 }, { kind: 'count', face: 'R', n: 8 }]);
  // with blanks, only a colour already over 9 is wrong
  assert.deepEqual(validate('.' + tenYellow.slice(1)), [{ kind: 'blank', n: 1 }]);
});

test('paint: pieces that do not exist, or appear twice', () => {
  // URF corner as U F R: the mirror image of the real corner
  assert.deepEqual(validate(swap(SOLVED_FACELETS, [9, 20])), [{ kind: 'piece', stickers: [8, 9, 20] }]);
  // URF gets UF's green (U F F: impossible); UF becomes U R, a second UR edge
  assert.deepEqual(validate(swap(SOLVED_FACELETS, [9, 19])), [
    { kind: 'piece', stickers: [8, 9, 20] },
    { kind: 'repeated', stickers: [5, 10, 7, 19] },
  ]);
});

test('paint: a twisted corner, a flipped edge, two swapped pieces', () => {
  const twisted = [...SOLVED_FACELETS];
  [twisted[8], twisted[9], twisted[20]] = [SOLVED_FACELETS[20], SOLVED_FACELETS[8], SOLVED_FACELETS[9]]; // URF turned in place
  assert.deepEqual(kinds(twisted.join('')), ['twist']);
  assert.deepEqual(kinds(swap(SOLVED_FACELETS, [5, 10])), ['flip']); // UR flipped
  assert.deepEqual(kinds(swap(SOLVED_FACELETS, [5, 7], [10, 19])), ['parity']); // UR and UF swapped
  assert.deepEqual(kinds(swap(SOLVED_FACELETS, [5, 10], [7, 19])), []); // two flips cancel out
});

test('paint: stored paintings keep their centres', () => {
  assert.ok(isPainting(EMPTY) && isPainting(SOLVED_FACELETS));
  assert.ok(!isPainting(swap(SOLVED_FACELETS, [4, 13]))); // a centre moved
  assert.ok(!isPainting(SOLVED_FACELETS.slice(1)));
});

test('paint: arrow keys walk the net', () => {
  assert.equal(neighbour(6, 0, 1), 18); // U's bottom-left -> F's top-left
  assert.equal(neighbour(18, 0, -1), 6);
  assert.equal(neighbour(20, 1, 0), 9); // F -> R
  assert.equal(neighbour(36, -1, 0), 47); // L wraps round to B's right column
  assert.equal(neighbour(47, 1, 0), 36);
  assert.equal(neighbour(0, -1, 0), 0); // nothing left of U
  assert.equal(neighbour(0, 0, -1), 0);
  assert.equal(neighbour(42, 0, 1), 42); // nothing under L
  assert.equal(neighbour(26, 0, 1), 29); // F's bottom-right -> D's top-right
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { METHODS, allCases } from './academy/methods.ts';
import { tokenize } from './notation.ts';
import { algSeconds, algUnits, formatSeconds, otherMoves, REF_TPS, ruVerdict, TIE_S, timed } from './speed.ts';

const units = (alg: string) => algUnits(tokenize(alg));
const tm = (alg: string) => timed(alg, tokenize(alg));
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test('algUnits: R and U turns weigh 1, halves and other faces more, regrips and rotations most', () => {
  close(units("R U R' U'"), 4);
  close(units('U2'), 1.2);
  close(units('R2'), 1.4);
  close(units("R' F R F'"), 4.4); // sledgehammer: F right after R', no regrip
  close(units('F'), 1.2 + 1.5); // F from the home grip: a regrip
  close(units("F' U' F"), 1.2 + 1 + 1.2 + 1.5); // F' with the left thumb; then F needs the regrip
  close(units("L' U' L"), 1.2 * 2 + 1); // the left hand, no regrip
  close(units("y' R U R'"), 2 + 3);
  close(units("Rw U Rw'"), units("r U r'")); // Rw = r
  close(units("R2'"), units('R2'));
});

test('algSeconds: units at the reference pace; formatSeconds with a dot', () => {
  close(algSeconds(tokenize("R U R' U'")), 4 / REF_TPS);
  assert.equal(formatSeconds(0.571), '0.6');
  assert.equal(formatSeconds(-0.25), '0.3'); // a difference: its size
});

test('every algorithm of every method has a cost: no move without a weight', () => {
  for (const m of METHODS) for (const c of allCases(m)) for (const v of c.algs) {
    const u = units(v.alg);
    assert.ok(Number.isFinite(u) && u > 0, `${c.id} ${v.alg}`);
  }
});

test('otherMoves: what an algorithm uses besides R and U, once each, in order', () => {
  assert.deepEqual(otherMoves(tokenize("R U R' U'")), []);
  assert.deepEqual(otherMoves(tokenize("y' R' F R F' y")), ['y', 'F']);
  assert.deepEqual(otherMoves(tokenize("M' U' M U2 r U' r'")), ['M', 'r']);
});

test('ruVerdict: which pays off, R and U only or another move; null without both kinds', () => {
  // F2L 15: the R U version is 4 moves longer than the M/r one
  const f15 = ruVerdict([tm("M U r U' r' U' M'"), tm("R U R' U2 R U' R' U R U' R'")])!;
  assert.equal(f15.winner, 'other');
  assert.equal(f15.other.alg, "M U r U' r' U' M'");
  assert.ok(f15.saved >= TIE_S);
  // B1: R U only wins against the F ending
  assert.equal(ruVerdict([tm("U' R U R' U2 R U' R'"), tm("U' R U R' U R' F R F'")])!.winner, 'ru');
  // A1: the sledgehammer is as fast as the reverse sexy move
  const a1 = ruVerdict([tm("U R U' R'"), tm("R' F R F'")])!;
  assert.equal(a1.winner, 'tie');
  assert.ok(a1.saved < TIE_S);
  // the fastest of each kind is compared
  assert.equal(ruVerdict([tm("R U R' U2 R U' R' U R U' R'"), tm("R U2 R' U' R U R'"), tm("F' U F U2 R U R'")])!.ru.alg, "R U2 R' U' R U R'");
  assert.equal(ruVerdict([tm("R U R'"), tm("U R U' R'")]), null);
  assert.equal(ruVerdict([tm("R' F R F'")]), null);
  assert.equal(ruVerdict([]), null);
});

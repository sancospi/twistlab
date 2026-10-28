import test from 'node:test';
import assert from 'node:assert/strict';
import { METHODS, allCases } from './academy/methods.ts';
import { tokenize } from './notation.ts';
import { algTenths, algUnits, formatTenths, otherMoves, ruVerdict, timed } from './speed.ts';

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
  close(units("x R"), 2); // an x tilts the cube: both wrists, like one turn
  close(units("y R"), 3);
  close(units("Rw U Rw'"), units("r U r'")); // Rw = r
  close(units("R2'"), units('R2'));
  close(units("x R' U R' D2 R U' R' D2 R2 x'"), units("x R' U R' D2 R U' R' D2 R2")); // Aa: the closing x' isn't done
  close(units("R U R' y"), 3);
  close(units('y'), 0);
  assert.equal(units("R U R' F R F' R U R' F R F'"), 15.8); // exactly: no float noise (two regripped Fs)
});

test('algTenths: seconds at 7 turns per second, to the tenth shown; formatTenths with a dot', () => {
  assert.equal(algTenths(tokenize("R U R' U'")), 6); // 4/7 s
  assert.equal(algTenths(tokenize("R' F R F'")), 6); // 4.4/7: the same tenth, as fast
  assert.equal(formatTenths(6), '0.6');
  assert.equal(formatTenths(12), '1.2');
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
  assert.equal(f15.saved, 5); // 1.6 s against 1.1 s
  // B1: R U only wins against the F ending
  assert.equal(ruVerdict([tm("U' R U R' U2 R U' R'"), tm("U' R U R' U R' F R F'")])!.winner, 'ru');
  // A1: the sledgehammer is as fast as the reverse sexy move (the same tenth)
  const a1 = ruVerdict([tm("U R U' R'"), tm("R' F R F'")])!;
  assert.equal(a1.winner, 'tie');
  assert.equal(a1.saved, 0);
  // the fastest of each kind is compared
  assert.equal(ruVerdict([tm("R U R' U2 R U' R' U R U' R'"), tm("R U2 R' U' R U R'"), tm("F' U F U2 R U R'")])!.ru.alg, "R U2 R' U' R U R'");
  assert.equal(ruVerdict([tm("R U R'"), tm("U R U' R'")]), null);
  assert.equal(ruVerdict([tm("R' F R F'")]), null);
  assert.equal(ruVerdict([]), null);
});

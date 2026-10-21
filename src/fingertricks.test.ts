import test from 'node:test';
import assert from 'node:assert/strict';
import { fingertricks } from './fingertricks.ts';
import { tokenize } from './notation.ts';

// Hints as "label" with the markers in front: "+recoloca" (regrip) / "+base" (back to home grip).
const read = (alg: string) => fingertricks(tokenize(alg)).map((h) => [h.regrip ? '+recoloca ' : '', h.home ? '+base ' : '', h.label].join(''));

const R = 'Muñeca der. arriba', Ri = 'Muñeca der. abajo', R2 = 'Muñeca der. ×2';
const U = 'Índice der.', Ui = 'Índice izq.', U2 = 'Índice y medio der.';
const F = 'Índice der.', Fi = 'Pulgar izq.';

test('sexy move and Sune: wrist and index flicks, no regrips', () => {
  assert.deepEqual(read("R U R' U'"), [R, U, Ri, Ui]);
  assert.deepEqual(read("R U R' U R U2 R'"), [R, U, Ri, U, R, U2, Ri]);
  assert.deepEqual(read("R U2 R' U' R U' R'"), [R, U2, Ri, Ui, R, Ui, Ri]); // Antisune
});

test("T-perm and J-perm: F after R' with the right index, F' with the left thumb", () => {
  assert.deepEqual(read("R U R' U' R' F R2 U' R' U' R U R' F'"), [R, U, Ri, Ui, Ri, F, R2, Ui, Ri, Ui, R, U, Ri, Fi]);
  assert.deepEqual(read("R U R' F' R U R' U' R' F R2 U' R'"), [R, U, Ri, Fi, R, U, Ri, Ui, Ri, F, R2, Ui, Ri]);
  assert.deepEqual(read("R' F R F'"), [Ri, F, R, Fi]); // sledgehammer
});

test('F from home is a regrip, and the next R/U move goes back to the home grip', () => {
  assert.deepEqual(read("F R U R' U' F'"), [`+recoloca ${F}`, `+base ${R}`, U, Ri, Ui, Fi]);
  assert.deepEqual(read("R U B"), [R, U, '+recoloca Anular der.']); // B after R
  assert.deepEqual(read("S R U R' U' R' F R f'"), ['+recoloca Con ambas manos', `+base ${R}`, U, Ri, Ui, Ri, F, R, Fi]);
});

test('U after R′ is a plain flick; U2 there is the left double flick', () => {
  assert.deepEqual(read("R' U R"), [Ri, U, R]);
  assert.deepEqual(read("R' U2 R"), [Ri, 'Índice y medio izq.', R]);
  assert.deepEqual(read("R2 U'"), [R2, Ui]); // the left index is free
});

test('D, M, L, wide moves and rotations', () => {
  assert.deepEqual(read("D D' M' M M2 L L'"), ['Anular izq.', 'Anular der.', 'Anular izq., tira', 'Anular izq., empuja', 'Anular izq. ×2', 'Muñeca izq. abajo', 'Muñeca izq. arriba']);
  assert.deepEqual(read("r U r' Rw"), [R, U, Ri, R]);
  assert.deepEqual(read("x y' z2"), ['Gira el cubo', 'Gira el cubo', 'Gira el cubo']);
  assert.deepEqual(read("F y R"), [`+recoloca ${F}`, 'Gira el cubo', R]); // a rotation leaves the hands home: no marker
});

test('R2\' reads as a half turn', () => {
  assert.deepEqual(read("R2' U"), [R2, U]);
});

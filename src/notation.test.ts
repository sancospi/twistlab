import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import { IDENTITY, YELLOW_UP, centerMoves, expand, htm, invertTokens, mapMove, merge, tokenize, unmapMove, compact, turnCount, explainMove, moveCamera, repeats, formatAlg } from './notation.ts';

const ALGS = [
  "r U R' U' r' F R F'", "M2 U M U2 M' U M2", "U M' U' M2 U' M2 U' M' U2 M2", "y' U R U' R' U' R",
  "x R' U R' D2 R U' R' D2 R2 x'", "f R U R' U' f'", "S R U R' U' R' F R f'", "r' U2 R2 U R2 U r",
  "Rw U Rw'", "E2 S' u d' b l'", "Uw2' Lw Fw' Dw Bw2 z2 y x'", "R2' U2' l2' S2' E' M2'",
];

// Seeded so a failure reproduces.
function randomAlg(seed: number, n: number): string {
  const bases = ['U', 'D', 'R', 'L', 'F', 'B', 'u', 'd', 'r', 'l', 'f', 'b', 'Rw', 'Uw', 'Fw', 'M', 'E', 'S', 'x', 'y', 'z'];
  const suffixes = ['', "'", '2', "2'"];
  let s = seed;
  const rnd = (k: number) => ((s = (s * 1103515245 + 12345) % 2 ** 31), s % k);
  return Array.from({ length: n }, () => bases[rnd(bases.length)] + suffixes[rnd(4)]).join(' ');
}

test('tokenize normalises primes and rejects junk', () => {
  assert.deepEqual(tokenize("  R′ U’  F` Rw2' x "), ["R'", "U'", "F'", "Rw2'", 'x']);
  assert.deepEqual(tokenize(''), []);
  assert.throws(() => tokenize('R Q U'), /"Q"/);
  assert.throws(() => tokenize("R3"), /"R3"/);
  assert.throws(() => tokenize('Mw'), /"Mw"/);
});

test('invertTokens reverses and flips', () => {
  assert.deepEqual(invertTokens(["R", "U'", 'F2', "r2'", 'x']), ["x'", 'r2', 'F2', 'U', "R'"]);
});

test('centerMoves matches cubing.js up to a whole-cube rotation', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  const algs = [...ALGS, ...Array.from({ length: 40 }, (_, i) => randomAlg(i + 1, 30))];
  const pow = ['', '', '2', "'"];
  const rotations = [0, 1, 2, 3].flatMap((a) => [0, 1, 2, 3].flatMap((b) => [0, 1, 2, 3].map((c) =>
    [a && 'x' + pow[a], b && 'y' + pow[b], c && 'z' + pow[c]].filter(Boolean).join(' '))));
  for (const alg of algs) {
    // cubing.js keeps the puzzle rotated after x/y/z, and later moves turn whatever face is in place; so first
    // rotate back by our final frame, then the inverse center moves must leave it exactly solved.
    const { frame } = expand(alg, IDENTITY);
    const home = rotations.find((r) => JSON.stringify(expand(r, frame).frame) === JSON.stringify(IDENTITY))!;
    const back = new Alg(centerMoves(alg, IDENTITY).join(' ')).invert();
    const p = solved.applyAlg(alg).applyAlg(home).applyAlg(back);
    assert.ok(p.experimentalIsSolved({ ignorePuzzleOrientation: false, ignoreCenterOrientation: true }), alg);
    // The cube frame is the identity frame seen through YELLOW_UP.
    assert.deepEqual(centerMoves(alg, YELLOW_UP), centerMoves(alg, IDENTITY).map((m) => mapMove(m, YELLOW_UP)), alg);
  }
});

test('expand keeps powers whole, rotations empty, and returns the final frame', () => {
  const { steps, frame } = expand("r2 M' y U2'", IDENTITY);
  assert.deepEqual(steps.map((s) => s.moves), [['L2'], ["R'", 'L'], [], ['B2']]);
  assert.deepEqual(frame, { U: 'B', D: 'F', F: 'R', R: 'D', B: 'L', L: 'U' });
  assert.deepEqual(expand('x', YELLOW_UP).frame, { U: 'F', F: 'U', D: 'B', B: 'D', R: 'L', L: 'R' });
});

test('mapMove renames user faces to cube centers', () => {
  assert.equal(mapMove('R', YELLOW_UP), 'L');
  assert.equal(mapMove("U'", YELLOW_UP), "D'");
  assert.equal(mapMove('F2', YELLOW_UP), 'F2');
});

test('htm merges consecutive turns on one axis', () => {
  assert.equal(htm(['R', 'R']), 1);
  assert.equal(htm(['R', "R'"]), 0);
  assert.equal(htm(['R', 'R', 'R', 'R']), 0);
  assert.equal(htm(['R', 'L', 'R']), 2); // opposite faces commute: R2 L
  assert.equal(htm(['R', 'L', 'R', 'L']), 2); // an M2 as the cube reports it
  assert.equal(htm(['R', 'U', 'R']), 3); // no merging across another axis
  assert.deepEqual(merge(['U', 'R', "R'", 'D', 'U']), ['U2', 'D']); // a cancelled run lets the runs around it meet
  assert.equal(htm(['R2', 'R']), 1);
  assert.equal(htm(centerMoves("R U R' U'", IDENTITY)), 4);
  assert.deepEqual(merge(["R2'", 'R', 'U', 'U', "U2'", 'L']), ["R'", 'L']);
  assert.equal(htm(["R2'", 'R2']), 0);
});

test('unmapMove inverts mapMove in any frame', () => {
  assert.equal(unmapMove("D'", YELLOW_UP), "U'"); // yellow up: the cube's D is the user's U
  assert.equal(unmapMove('L2', YELLOW_UP), 'R2');
  for (const alg of ['', 'y', "x y'", 'z2 x', "y' x2 z"]) {
    const { frame } = expand(alg, YELLOW_UP);
    for (const m of ['U', "R'", 'F2', 'D', "L'", 'B2']) assert.equal(unmapMove(mapMove(m, frame), frame), m, `${alg} ${m}`);
  }
});

test('compact / turnCount: what a person did, without hiding undone turns', () => {
  assert.deepEqual(compact(['R', 'R']), ['R2']);
  assert.deepEqual(compact(['R', 'L', 'R', 'L']), ['R2', 'L2']); // a slice, reported interleaved
  assert.deepEqual(compact(['F', "F'"]), ['F', "F'"]); // a slip and its undo: two real turns
  assert.equal(turnCount(['F', 'U', "F'", 'F', "U'", "F'"]), 6); // a detour that merge() would cancel to nothing
  assert.equal(htm(['F', 'U', "F'", 'F', "U'", "F'"]), 0);
  assert.deepEqual(compact(['R', 'L', "R'"]), ['R', "R'", 'L']); // R undone around an L: L happened, R twice
  assert.deepEqual(compact(['R', "R'", "R'"]), ['R', "R'", "R'"]); // a wrong flick, its undo, then the right turn
  assert.deepEqual(compact(['R', 'R', 'R']), ['R', 'R', 'R']); // three quarters for an R': two wasted
  assert.deepEqual(compact(['U2', 'U']), ['U2', 'U']); // a U' made with three quarters: stays as made
  assert.deepEqual(compact(["U'", "U'"]), ['U2']);
  const sune = ['R', 'U', "R'", 'U', 'R', 'U2', "R'"];
  assert.equal(turnCount(sune), htm(sune)); // an algorithm counts the same either way
});

test('explainMove: what turns and which way, for every kind of token', () => {
  assert.deepEqual(explainMove('R'), { what: 'Cara derecha · 1 capa', how: 'Horario, mirando la cara derecha de frente' });
  assert.deepEqual(explainMove("U'"), { what: 'Cara de arriba · 1 capa', how: 'Antihorario, mirando la cara de arriba de frente' });
  assert.equal(explainMove('F2').how, 'Media vuelta (180°): el sentido da igual');
  assert.equal(explainMove("B2'").how, 'Media vuelta (180°): el sentido da igual');
  assert.equal(explainMove('r').what, 'Dos capas: la cara derecha y la del medio');
  assert.equal(explainMove("Rw'").what, explainMove("r'").what);
  assert.equal(explainMove("r'").how, 'Antihorario, mirando la cara derecha de frente');
  assert.equal(explainMove('M').what, 'Capa del medio, entre izquierda y derecha · gira como L');
  assert.equal(explainMove("M'").how, 'Antihorario, mirando la cara izquierda de frente'); // M follows L
  assert.equal(explainMove('E').how, 'Horario, mirando la cara de abajo de frente');
  assert.equal(explainMove("y'").what, 'Todo el cubo · gira como U');
  assert.equal(explainMove('x').how, 'Horario, mirando la cara derecha de frente');
  assert.throws(() => explainMove('Q'));
});

test('moveCamera: the turning layer is in view', () => {
  assert.deepEqual(moveCamera('R'), { latitude: 30, longitude: 30 });
  assert.equal(moveCamera("L'").longitude, -30);
  assert.equal(moveCamera('d').latitude, -30);
  assert.equal(moveCamera('B2').longitude, 150);
  assert.deepEqual(moveCamera('M'), { latitude: 30, longitude: 30 });
});

test('repeats: blocks repeated in a row are grouped for display, the rest stays as is', () => {
  const f = (alg: string) => formatAlg(tokenize(alg));
  assert.equal(f("R' D' R D R' D' R D U R' D' R D R' D' R D U'"), "(R' D' R D)×2 U (R' D' R D)×2 U'");
  assert.equal(f("U R U' R' U R U' R' U R U' R'"), "(U R U' R')×3");
  assert.equal(f("R U R' U R U2 R'"), "R U R' U R U2 R'", 'no repetition: unchanged');
  assert.equal(f("R U R' U' R U R'"), "R U R' U' R U R'", 'a block and a half is not a repetition');
  assert.equal(f("R U R U R U R U"), '(R U)×4', 'on a tie the shorter block wins');
  assert.equal(f('U U'), 'U U', 'single moves are never grouped');
  assert.equal(f("R' D' R D R' D' R D R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U"), "((R' D' R D)×4 U)×2", 'nested');
  assert.deepEqual(repeats([]), []);
  assert.deepEqual(repeats(tokenize("F R U R' U' R U R' U' F'")).map((r) => r.times), [1, 2, 1]);
});

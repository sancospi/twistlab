import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { checkCustomAlg } from './customAlg.ts';
import { METHODS, allCases, findCase } from './methods.ts';
import { parseCustom, preferred, variants } from './store.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const oll = METHODS[1].phases[1].groups.flatMap((g) => g.cases); // CFOP reducido, OLL in 2 steps
const sune = findCase('cfop-oll-sune')!;
const check = (text: string) => checkCustomAlg(kpuzzle, sune, oll, text);

test('checkCustomAlg: bad token, solves (any AUF, any primes), backwards, another case, nothing', () => {
  assert.deepEqual(check("R U R' U Rx U2 R'"), { kind: 'bad-token', token: 'Rx' });
  assert.deepEqual(check("(R U)2"), { kind: 'bad-token', token: '2' });
  assert.deepEqual(check("(R U R' U) [R U2 R']"), { kind: 'solves', alg: "R U R' U R U2 R'" }); // trigger brackets
  assert.deepEqual(check("  R U R′ U R U2 R´ "), { kind: 'solves', alg: "R U R' U R U2 R'" });
  assert.deepEqual(check("U2 R U R' U R U2 R'"), { kind: 'solves', alg: "U2 R U R' U R U2 R'" }); // its own AUF
  assert.deepEqual(check("y' R' U2 R U R' U R"), { kind: 'solves', alg: "y' R' U2 R U R' U R" }); // SpeedCubeDB's #2
  assert.deepEqual(check("R U2 R' U' R U' R'"), { kind: 'other', case: findCase('cfop-oll-antisune') }); // the inverse, but Antisune's own
  assert.deepEqual(checkCustomAlg(kpuzzle, sune, [sune], "R U2 R' U' R U' R'"), { kind: 'inverse', alg: "R U R' U R U2 R'" }); // no Antisune to solve
  assert.deepEqual(checkCustomAlg(kpuzzle, findCase('cfop-oll-h')!, oll, "R U R' U R U2 R'"), { kind: 'other', case: sune });
  assert.equal((check("F R U R' U' F'") as { case: { code: string } }).case.code, 'Línea'); // another step of the phase counts too
  assert.deepEqual(check("R U R' U'"), { kind: 'none' });
  // a 2x2 case: face turns and rotations only
  const sune2 = { ...sune, id: 'fixture-2x2-sune', stage: '2x2-oll' as const };
  assert.deepEqual(checkCustomAlg(kpuzzle, sune2, [sune2], "y R U2 R' U' R U' R' y'"), { kind: 'inverse', alg: "y R U R' U R U2 R' y'" });
  assert.deepEqual(checkCustomAlg(kpuzzle, sune2, [sune2], "r U R' U R U2 r'"), { kind: 'bad-token', token: 'r' });
});

test('custom algorithms: storage is validated; data algorithms never use the custom source', () => {
  assert.deepEqual(parseCustom({ a: ["R U R'", "R  U R'", 'Rx', 3, ''], b: 'R', c: [] }), { a: ["R U R'"] });
  for (const junk of [null, 1, 'x', [["R"]]]) assert.deepEqual(parseCustom(junk), {});
  const c = findCase('cfop-oll-sune')!;
  assert.deepEqual(variants(c), c.algs); // nothing stored in node
  assert.equal(preferred(c), c.algs[0]);
  for (const k of METHODS.flatMap(allCases)) for (const v of k.algs) assert.notEqual(v.source, 'custom', k.id);
});

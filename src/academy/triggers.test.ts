import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { invertTokens, tokenize } from '../notation.ts';
import { METHODS } from './methods.ts';
import { appearsIn, contains, drillReps, parseBests, period, tps, triggerGuide } from './triggers.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const byId = (id: string) => triggerGuide.triggers.find((x) => x.id === id)!;
const moved = (p: KPattern, orbit: 'EDGES' | 'CORNERS', i: number) => p.patternData[orbit].pieces[i] !== i || p.patternData[orbit].orientation[i] !== 0;

test('triggers: valid notation, unique ids', () => {
  const ids = triggerGuide.triggers.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const x of triggerGuide.triggers) for (const alg of [x.alg, x.back ?? x.alg]) assert.doesNotThrow(() => tokenize(alg), x.id);
});

test('period: repetitions back to solved', () => {
  const want: Record<string, number> = { sexy: 6, sledgehammer: 6, insercion: 4, 'insercion-u2': 2, sune: 6, 'f-sexy': 6, 'sexy-ancho': 12 };
  for (const [id, n] of Object.entries(want)) assert.equal(period(kpuzzle, byId(id).alg), n, id);
  assert.deepEqual([1, 2, 4, 6, 12].map(drillReps), [6, 6, 8, 6, 12]); // whole periods, at least 6
});

test('the inverses the cards name are the inverses', () => {
  const inv = (id: string) => invertTokens(tokenize(byId(id).alg)).join(' ');
  assert.equal(inv('sexy'), byId('sexy-inverso').alg);
  assert.equal(inv('sledgehammer'), byId('hedgeslammer').alg);
  assert.equal(inv('sune'), byId('antisune').alg);
});

test('what the cards say they do', () => {
  // the last-layer triggers leave the first two layers (edges 4-11, corners 4-7) and the centers alone
  for (const id of ['sune', 'antisune', 'f-sexy', 'f-ancho-sexy']) {
    const p = solved.applyAlg(byId(id).alg);
    for (let i = 4; i < 12; i++) assert.ok(!moved(p, 'EDGES', i), `${id} edge ${i}`);
    for (let i = 4; i < 8; i++) assert.ok(!moved(p, 'CORNERS', i), `${id} corner ${i}`);
    assert.deepEqual(p.patternData.CENTERS.pieces, solved.patternData.CENTERS.pieces, id);
  }
  // F sexy F': the horizontal line (UF and UB flipped) becomes the cross; f sexy f': the L at front and right (UB, UL flipped)
  const flipped = (...edges: number[]) => {
    const d = structuredClone(solved.patternData);
    for (const i of edges) d.EDGES.orientation[i] = 1;
    return new KPattern(kpuzzle, d);
  };
  const cross = (p: KPattern) => p.patternData.EDGES.orientation.every((o) => o === 0);
  assert.ok(cross(flipped(0, 2).applyAlg(byId('f-sexy').alg)));
  assert.ok(cross(flipped(2, 3).applyAlg(byId('f-ancho-sexy').alg)));
  // the inserts: into the front-right slot (DRF, FR); the back forms into the back-right one (DBR, BR)
  for (const x of triggerGuide.triggers.filter((x) => x.back)) {
    const [front, back] = [solved.applyAlg(x.alg), solved.applyAlg(x.back!)];
    assert.ok(moved(front, 'CORNERS', 4) && moved(front, 'EDGES', 8) && !moved(front, 'CORNERS', 7), x.id);
    assert.ok(moved(back, 'CORNERS', 7) && moved(back, 'EDGES', 10) && !moved(back, 'CORNERS', 4), x.id);
  }
  // R U R': the corner above the slot (UFR) and the back edge (UB) go in
  const p = solved.applyAlg(byId('insercion').alg);
  assert.deepEqual([p.patternData.CORNERS.pieces[4], p.patternData.EDGES.pieces[8]], [0, 2]);
});

test('Aparece en: the moves in a row, R2\' as R2 and Rw as r', () => {
  assert.ok(contains("U R U' R'", "U R U' R'")); // F2L's basic case: its U is part of the trigger
  assert.ok(contains("y' R U R' U R U2' R'", "R U R' U R U2 R'"));
  assert.ok(contains("Rw U R' U' Rw' F R F'", "r U R' U'"));
  assert.ok(!contains("R U R' U'", "R U R' U' R"));
  assert.ok(!contains("R U2 R'", "R U R'"));
  const sune = appearsIn("R U R' U R U2 R'", METHODS);
  assert.ok(sune.find((x) => x.method.id === 'cfop-completo')?.cases.some((c) => c.id === 'cfopc-oll-27'));
  assert.ok(sune.every((x) => x.cases.length > 0));
});

test('tps and the stored bests', () => {
  assert.equal(tps(4, 6, 6000), 4);
  assert.deepEqual(parseBests({ sexy: { tps: 4, reps: 6, ms: 6000, at: 1 }, bad: { tps: 'x' }, worse: null }), { sexy: { tps: 4, reps: 6, ms: 6000, at: 1 } });
  assert.deepEqual(parseBests([1]), {});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, YELLOW_UP, centerMoves, mapMove } from '../notation.ts';
import { caseState, goalReached, llFaceOf, makeQuizItems, quizPattern, referenceMoves } from './cube.ts';
import { METHODS, allCases, findCase } from './methods.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const user = (alg: string) => solved.applyAlg(centerMoves(alg, IDENTITY).join(' '));
const cases = METHODS.flatMap(allCases);
const STAGES = ['f2l', 'oll-cross', 'oll-corners', 'pll-corners', 'pll-edges'] as const;

test('goalReached: solved meets every goal, on either last-layer face', () => {
  for (const stage of STAGES) for (const ll of ['U', 'D'] as const) assert.ok(goalReached(stage, solved, ll), `${stage} ${ll}`);
  assert.ok(goalReached('pll-edges', solved.applyMove("U'"), 'U')); // only an AUF away
  assert.ok(!goalReached('f2l', solved.applyMove("U'"), 'D')); // ...but that's a first-layer turn for llFace D
});

test('goalReached: hand-made states', () => {
  const pairOut = user("R U R' U'");
  assert.deepEqual(STAGES.map((s) => goalReached(s, pairOut, 'U')), [false, false, false, false, false]);
  const sune = user("R U2 R' U' R U' R'"); // Sune setup: cross done, corners twisted
  assert.deepEqual(STAGES.map((s) => goalReached(s, sune, 'U')), [true, true, false, false, false]);
  const tperm = user("F R U' R' U R U R2 F' R U R U' R'");
  assert.deepEqual(STAGES.map((s) => goalReached(s, tperm, 'U')), [true, true, true, false, false]);
  const ua = user("M2 U' M U2 M' U' M2");
  assert.deepEqual(STAGES.map((s) => goalReached(s, ua, 'U')), [true, true, true, true, false]);
  const line = user("F U R U' R' F'");
  assert.deepEqual(STAGES.map((s) => goalReached(s, line, 'U')), [true, false, false, false, false]);
});

test('orientation 0 in a last-layer slot = last-layer color on the last-layer face (checked on stickers)', () => {
  // User frame: U stickers of the U face; cube frame (YELLOW_UP): yellow is the D face.
  for (const [frame, face, slice] of [[IDENTITY, 'U', 0], [YELLOW_UP, 'D', 27]] as const) {
    for (const setup of ["R U2 R' U' R U' R'", "F U R U' R' F'", "f U R U' R' f'", "R2 D R' U2 R D' R' U2 R'"]) {
      const p = solved.applyAlg(centerMoves(setup, frame).join(' '));
      const top = patternToFacelets(p).slice(slice, slice + 9);
      const edgesUp = [1, 3, 5, 7].every((i) => top[i] === face);
      const allUp = [...top].every((s) => s === face);
      assert.equal(goalReached('oll-cross', p, face), edgesUp, `${setup} cross`);
      assert.equal(goalReached('oll-corners', p, face), allUp, `${setup} corners`);
    }
  }
});

test('caseState: the main algorithm solves it, and it is not solved before', () => {
  for (const c of cases) {
    for (const frame of [IDENTITY, YELLOW_UP]) {
      const p = caseState(kpuzzle, c.algs[0].alg, frame);
      assert.ok(!goalReached(c.stage, p, llFaceOf(frame)), c.id);
      assert.ok(p.applyAlg(centerMoves(c.algs[0].alg, frame).join(' ')).isIdentical(solved), c.id);
    }
  }
});

test('makeQuizItems: every item is its case, solved by AUF + the main algorithm, on the user and the GAN frames', () => {
  const failures: string[] = [];
  for (const c of cases) {
    const items = makeQuizItems([c], 20, 7, kpuzzle);
    assert.equal(items.length, 20);
    for (const spec of items) {
      for (const frame of [IDENTITY, YELLOW_UP]) {
        const p = quizPattern(kpuzzle, spec, frame);
        const ll = llFaceOf(frame);
        if (goalReached(c.stage, p, ll)) failures.push(`${c.id}: already at goal`);
        const after = p.applyAlg(centerMoves(`${spec.auf} ${c.algs[0].alg}`, frame).join(' '));
        if (!goalReached(c.stage, after, ll)) failures.push(`${c.id} (${frame.U}): auf "${spec.auf}" + main alg misses the ${c.stage} goal`);
      }
    }
    const distinct = new Set(items.map((s) => patternToFacelets(quizPattern(kpuzzle, s, IDENTITY)))).size;
    assert.ok(distinct >= (c.stage === 'pll-edges' ? 3 : 10), `${c.id}: only ${distinct} distinct states`);
  }
  assert.deepEqual([...new Set(failures)], []);
});

test('makeQuizItems: deterministic per seed, interleaved, moves in user-frame face turns', () => {
  const group = cases.filter((c) => c.stage === 'oll-corners');
  const a = makeQuizItems(group, 5, 42, kpuzzle);
  assert.deepEqual(a, makeQuizItems(group, 5, 42, kpuzzle));
  assert.notDeepEqual(a, makeQuizItems(group, 5, 43, kpuzzle));
  assert.equal(a.length, group.length * 5);
  for (const c of group) assert.equal(a.filter((s) => s.caseId === c.id).length, 5);
  a.slice(1).forEach((s, i) => assert.notEqual(s.caseId, a[i].caseId));
  for (const s of a) for (const m of s.moves) assert.match(m, /^[UDRLFB](2|')?$/);
});

test('quizPattern maps the user moves onto the GAN frame', () => {
  const spec = { caseId: 'x', moves: ['R', "U'"], auf: '' as const };
  assert.ok(quizPattern(kpuzzle, spec, YELLOW_UP).isIdentical(solved.applyAlg(['R', "U'"].map((m) => mapMove(m, YELLOW_UP)).join(' '))));
  assert.ok(quizPattern(kpuzzle, spec, YELLOW_UP).isIdentical(solved.applyAlg("L D'")));
});

test('referenceMoves counts the AUF and merges it into the algorithm', () => {
  const t = findCase('cfop-pll-t')!;
  assert.equal(referenceMoves(t, t.algs[0], ''), 14);
  assert.equal(referenceMoves(t, t.algs[0], 'U'), 15);
  const a1 = findCase('cfop-f2l-a1')!; // U R U' R': a leading U' cancels its first move
  assert.equal(referenceMoves(a1, a1.algs[0], "U'"), 3);
  assert.equal(llFaceOf(YELLOW_UP), 'D');
});

test('makeQuizItems: edge cases (no rounds, no cases, one case) and float seeds like Math.random()', () => {
  assert.deepEqual(makeQuizItems(cases, 0, 1, kpuzzle), []);
  assert.deepEqual(makeQuizItems([], 3, 1, kpuzzle), []);
  const one = makeQuizItems([cases[0]], 3, 1, kpuzzle);
  assert.equal(one.length, 3);
  assert.ok(one.every((s) => s.caseId === cases[0].id));
  const f2l = cases.filter((c) => c.stage === 'f2l');
  assert.notDeepEqual(makeQuizItems(f2l, 2, 0.25, kpuzzle), makeQuizItems(f2l, 2, 0.75, kpuzzle));
  assert.deepEqual(makeQuizItems(f2l, 2, 0.25, kpuzzle), makeQuizItems(f2l, 2, 0.25, kpuzzle));
});

test('goalReached: states that are almost the goal', async () => {
  const { KPattern } = await import('cubing/kpuzzle');
  // Slots: EDGES UF UR UB UL DF DR DB DL FR FL BR BL; CORNERS UFR URB UBL ULF DRF DFL DLB DBR.
  const edit = (fn: (d: typeof solved.patternData) => void) => {
    const d = structuredClone(solved.patternData);
    fn(d);
    return new KPattern(kpuzzle, d);
  };
  const swap = (xs: number[], i: number, j: number) => ([xs[i], xs[j]] = [xs[j], xs[i]]);
  const goals = (p: typeof solved, ll: 'U' | 'D' = 'U') => STAGES.map((s) => +goalReached(s, p, ll)).join('');
  assert.equal(goals(edit((d) => { d.EDGES.orientation[0] = d.EDGES.orientation[1] = 1; })), '10000'); // 2 LL edges flipped
  assert.equal(goals(edit((d) => { d.EDGES.orientation[8] = d.EDGES.orientation[0] = 1; })), '00000'); // pair edge flipped in its slot
  assert.equal(goals(edit((d) => { d.CORNERS.orientation[4] = 1; d.CORNERS.orientation[0] = 2; })), '00000'); // pair corner twisted
  assert.equal(goals(edit((d) => { d.CORNERS.orientation[0] = 1; d.CORNERS.orientation[1] = 2; })), '11000'); // corners home, twisted
  assert.equal(goals(edit((d) => { swap(d.CORNERS.pieces, 0, 2); swap(d.EDGES.pieces, 0, 2); })), '11100'); // diagonal swap
  assert.equal(goals(edit((d) => { d.CORNERS.pieces = [1, 2, 3, 0, 4, 5, 6, 7]; })), '11110'); // corners a U turn off the edges
  assert.equal(goals(edit((d) => { d.EDGES.pieces = [1, 2, 0, ...d.EDGES.pieces.slice(3)]; })), '11110'); // edge 3-cycle
  assert.equal(goals(edit((d) => { swap(d.EDGES.pieces, 8, 9); swap(d.EDGES.pieces, 0, 1); })), '00000'); // E-slice swap
  assert.equal(goals(edit((d) => { d.EDGES.orientation[4] = d.EDGES.orientation[5] = 1; }), 'D'), '10000'); // same, yellow on D
  assert.equal(goals(edit((d) => { d.EDGES.orientation[0] = d.EDGES.orientation[1] = 1; }), 'D'), '00000'); // U is F2L there
});

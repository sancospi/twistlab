import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { patternToFacelets } from '../facelets.ts';
import { KPattern } from 'cubing/kpuzzle';
import { IDENTITY, YELLOW_UP, centerMoves, invertTokens, mapMove, tokenize } from '../notation.ts';
import {
  HOLDS, POOL_STAGES, caseState, goalReached, holdIn, llFaceOf, makeQuizItems, quizPattern, quizPool, randomStateScramble, referenceMoves, specsFor,
} from './cube.ts';
import { METHODS, allCases, findCase } from './methods.ts';
import type { Case, Stage } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const user = (alg: string) => solved.applyAlg(centerMoves(alg, IDENTITY).join(' '));
const STAGES = ['f2l', 'oll-cross', 'oll-corners', 'pll-corners', 'pll-edges'] as const;
const ALL_STAGES = Object.keys(POOL_STAGES) as Stage[];

// Typical beginner algorithms, one case each, for the stages no method has cases of yet.
const fixture = (stage: Stage, alg: string, i: number): Case => ({
  id: `fixture-${stage}-${i}`, code: 'X', name: { es: 'X' }, recognition: { es: 'X' }, stage,
  algs: [{ id: 'main', alg, source: 'community' }], setup: invertTokens(tokenize(alg)).join(' '), scdb: null,
});
const FIXTURES = ([
  ['first-layer', "U R U' R'"], // white corner from above into its slot
  ['second-layer', "U R U' R' U' F' U F"], // middle-layer edge to the right
  ['second-layer', "U' L' U L U F U' F'"], // ...and to the left
  ['oll-cross', "F R U R' U' F'"],
  ['ll-edges', "R U R' U R U2 R' U"], // swaps two yellow edges
  ['ll-corners-placed', "U R U' L' U R' U' L"], // cycles three corners
  ['ll-corners-twist', "R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U'"], // two corners twisted
] as const).map(([stage, alg], i) => fixture(stage, alg, i));
const cases = [...METHODS.flatMap(allCases), ...FIXTURES];

// Slots: EDGES UF UR UB UL DF DR DB DL FR FL BR BL; CORNERS UFR URB UBL ULF DRF DFL DLB DBR.
const edit = (fn: (d: typeof solved.patternData) => void) => {
  const d = structuredClone(solved.patternData);
  fn(d);
  return new KPattern(kpuzzle, d);
};
const swap = (xs: number[], i: number, j: number) => ([xs[i], xs[j]] = [xs[j], xs[i]]);

test('goalReached: solved meets every goal, on either last-layer face', () => {
  for (const stage of ALL_STAGES) for (const ll of ['U', 'D'] as const) assert.ok(goalReached(stage, solved, ll), `${stage} ${ll}`);
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
    assert.ok(distinct >= (quizPool(c.stage, kpuzzle).algs.length ? 10 : 3), `${c.id}: only ${distinct} distinct states`); // 3+: AUFs only
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

test('goalReached: states that are almost the goal', () => {
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

test('goalReached: the beginner stages, on hand-made states', () => {
  const NEW = ['first-layer', 'second-layer', 'll-edges', 'll-corners-placed', 'll-corners-twist'] as const;
  const goals = (p: typeof solved, ll: 'U' | 'D' = 'U') => NEW.map((s) => +goalReached(s, p, ll)).join('');
  assert.equal(goals(solved.applyMove('U')), '11111'); // everything only an AUF away
  assert.equal(goals(solved.applyMove('D')), '00000'); // a first-layer turn
  assert.equal(goals(edit((d) => { d.EDGES.orientation[4] = d.EDGES.orientation[5] = 1; })), '00000'); // white edges flipped
  assert.equal(goals(edit((d) => { d.CORNERS.orientation[4] = 1; d.CORNERS.orientation[5] = 2; })), '00000'); // white corners twisted
  assert.equal(goals(edit((d) => { swap(d.CORNERS.pieces, 4, 5); swap(d.CORNERS.pieces, 0, 1); })), '00000'); // white corners swapped
  assert.equal(goals(edit((d) => { swap(d.EDGES.pieces, 8, 9); swap(d.EDGES.pieces, 0, 1); })), '10000'); // middle edges swapped
  assert.equal(goals(edit((d) => { d.EDGES.orientation[8] = d.EDGES.orientation[0] = 1; })), '10000'); // middle edge flipped
  assert.equal(goals(edit((d) => { d.EDGES.orientation[0] = d.EDGES.orientation[1] = 1; })), '11000'); // yellow edges flipped
  assert.equal(goals(edit((d) => { d.EDGES.pieces = [1, 2, 0, ...d.EDGES.pieces.slice(3)]; })), '11000'); // yellow edge 3-cycle
  assert.equal(goals(edit((d) => { swap(d.EDGES.pieces, 0, 1); swap(d.CORNERS.pieces, 0, 1); })), '11000'); // yellow edges swapped
  assert.equal(goals(edit((d) => { swap(d.CORNERS.pieces, 0, 2); swap(d.CORNERS.pieces, 1, 3); })), '11100'); // yellow corners swapped
  assert.equal(goals(edit((d) => { d.CORNERS.pieces = [1, 2, 3, 0, 4, 5, 6, 7]; })), '11100'); // corners a U turn off the edges
  assert.equal(goals(edit((d) => { d.CORNERS.orientation[0] = 1; d.CORNERS.orientation[1] = 2; })), '11110'); // corners home, twisted
  assert.equal(goals(edit((d) => { d.CORNERS.orientation[0] = 1; d.CORNERS.orientation[1] = 2; }).applyMove("U'")), '11110'); // ...and turned
  // yellow on D: the first layer is U
  assert.equal(goals(solved.applyMove('U'), 'D'), '00000');
  assert.equal(goals(solved.applyMove('D'), 'D'), '11111');
  assert.equal(goals(edit((d) => { d.EDGES.orientation[4] = d.EDGES.orientation[5] = 1; }), 'D'), '11000');
  assert.equal(goals(edit((d) => { d.EDGES.orientation[0] = d.EDGES.orientation[1] = 1; }), 'D'), '00000');
});

test('quiz pools: every pooled algorithm keeps its stage goal (goals are groups of states, so their products do too)', () => {
  const broken: string[] = [];
  const keeps = (stage: Stage, alg: string[] | string) =>
    goalReached(stage, solved.applyAlg(typeof alg === 'string' ? centerMoves(alg, IDENTITY).join(' ') : alg.join(' ')), 'U');
  for (const stage of ALL_STAGES) {
    for (const alg of quizPool(stage, kpuzzle).algs) if (!keeps(stage, alg)) broken.push(`${stage}: ${alg.join(' ')}`);
    for (const f of FIXTURES) if (POOL_STAGES[stage].includes(f.stage) && !keeps(stage, f.algs[0].alg)) broken.push(`${stage}: ${f.id}`);
  }
  assert.deepEqual(broken, []);
  // ...and they really are pooled where the stage allows (a stage never pools its own algorithms)
  for (const stage of ALL_STAGES) assert.ok(!POOL_STAGES[stage].includes(stage), stage);
  for (const stage of ['first-layer', 'f2l', 'oll-cross', 'oll-corners', 'pll-corners'] as const) assert.ok(quizPool(stage, kpuzzle).algs.length > 0, stage);
  // what a pool leaves out really would break it: twists undo OLL, an F2L insert undoes the first layer
  assert.ok(!keeps('oll-corners', FIXTURES.at(-1)!.algs[0].alg) && !keeps('first-layer', "U R U' R'"));
});

test('specsFor: a random state of each case, in the given order, deterministic per seed', () => {
  const [a, b] = cases.filter((c) => c.stage === 'pll-edges');
  const specs = specsFor([a, a, b], 3, kpuzzle);
  assert.deepEqual(specs.map((s) => s.caseId), [a.id, a.id, b.id]);
  assert.deepEqual(specs, specsFor([a, a, b], 3, kpuzzle));
  for (const [s, c] of specs.map((s, i) => [s, [a, a, b][i]] as const)) {
    const p = quizPattern(kpuzzle, s, IDENTITY);
    assert.ok(!goalReached(c.stage, p, 'U') && goalReached(c.stage, p.applyAlg(centerMoves(`${s.auf} ${c.algs[0].alg}`, IDENTITY).join(' ')), 'U'));
  }
});

/** Ends in the case's setup (its algorithm backwards), once the trailing U turns (the AUF) are stripped. */
const endsInSetup = (moves: string[], setup: string) => {
  const noAuf = (ms: string[]) => ms.slice(0, ms.findLastIndex((m) => !/^U/.test(m)) + 1);
  const [end, tail] = [noAuf(moves), noAuf(centerMoves(setup, IDENTITY))];
  return tail.length <= end.length && end.slice(-tail.length).join(' ') === tail.join(' ');
};

test('randomStateScramble: leads to the quiz state in face turns, not by the setup backwards', async () => {
  for (const id of ['cfop-pll-t', 'cfop-oll-sune', 'cfop-f2l-a1']) {
    const c = findCase(id)!;
    for (const spec of makeQuizItems([c], 2, 11, kpuzzle)) {
      const p = quizPattern(kpuzzle, spec, IDENTITY);
      const scramble = await randomStateScramble(p);
      assert.ok(solved.applyAlg(scramble.join(' ')).isIdentical(p), id);
      for (const m of scramble) assert.match(m, /^[UDRLFB](2|')?$/);
      assert.ok(!endsInSetup(scramble, c.setup), id);
      assert.ok(endsInSetup(spec.moves, c.setup), `${id}: the old merged scramble gives the case away`); // the check can fail
    }
  }
});

test('color neutral: HOLDS are the 24 ways to hold the cube; holding it the usual way changes nothing', () => {
  assert.equal(new Set(HOLDS.map((h) => JSON.stringify(h))).size, 24);
  assert.equal(new Set(HOLDS.map((h) => h.U)).size, 6);
  for (const h of HOLDS) assert.equal(new Set(Object.values(h)).size, 6);
  assert.deepEqual(HOLDS[0], IDENTITY);
  assert.deepEqual(holdIn(IDENTITY, YELLOW_UP), YELLOW_UP);
  const x = HOLDS[4]; // x: green on top, white in front
  assert.deepEqual([x.U, x.F], ['F', 'D']);
  assert.deepEqual([holdIn(x, YELLOW_UP).U, holdIn(x, YELLOW_UP).F], ['F', 'U']); // the GAN cube's green and white centers
});

test('goalReached on a side face: a turn of that face is only an AUF away, of the opposite one breaks the first layer', () => {
  const OPP = { F: 'B', B: 'F', R: 'L', L: 'R' } as const;
  for (const f of ['F', 'B', 'R', 'L'] as const) {
    for (const stage of ALL_STAGES) assert.ok(goalReached(stage, solved.applyMove(`${f}'`), f), `${stage} ${f}`);
    assert.ok(!goalReached('first-layer', solved.applyMove(OPP[f]), f), f);
    assert.ok(!goalReached('f2l', solved.applyMove(f), 'U'), f);
  }
});

test('color neutral: a case held any of the 24 ways is still that case, and its algorithm in that grip solves it', () => {
  const failures: string[] = [];
  for (const c of cases) {
    const [spec] = makeQuizItems([c], 1, 5, kpuzzle);
    const solution = centerMoves(`${spec.auf} ${c.algs[0].alg}`, IDENTITY);
    const user = quizPattern(kpuzzle, spec, IDENTITY);
    // the goal along the way, as the user frame sees it: every grip must agree on each step
    const expected = solution.map((_, i) => goalReached(c.stage, user.applyAlg(solution.slice(0, i).join(' ')), 'U'));
    for (const hold of HOLDS) {
      for (const frame of [IDENTITY, YELLOW_UP]) {
        const f = holdIn(hold, frame);
        const p = quizPattern(kpuzzle, spec, f);
        const moves = centerMoves(`${spec.auf} ${c.algs[0].alg}`, f); // the algorithm conjugated by the grip
        if (moves.join(' ') !== solution.map((m) => mapMove(m, f)).join(' ')) failures.push(`${c.id}: moves`);
        if (!goalReached(c.stage, p.applyAlg(moves.join(' ')), llFaceOf(f))) failures.push(`${c.id} ${f.U}${f.F}: not solved`);
        if (frame !== YELLOW_UP) continue; // the smart cube's frame, step by step
        moves.forEach((_, i) => {
          if (goalReached(c.stage, p.applyAlg(moves.slice(0, i).join(' ')), llFaceOf(f)) !== expected[i]) failures.push(`${c.id} ${f.U}${f.F}: step ${i}`);
        });
      }
    }
  }
  assert.deepEqual([...new Set(failures)], []);
});

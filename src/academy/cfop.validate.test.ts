// Checks every method's data against the simulator: every setup, algorithm and official quiz must agree with the
// case it claims to be. A failure here is a transcription error until the source says otherwise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import { IDENTITY, centerMoves, tokenize } from '../notation.ts';
import { caseState, goalReached, held2x2 } from './cube.ts';
import { bases2x2 } from './bases2x2.ts';
import { beginner2x2 } from './beginner2x2.ts';
import { cfopFull } from './cfopFull.ts';
import { ortega } from './ortega.ts';
import { stageCounts } from './probability.ts';
import { METHODS, allCases, findCase } from './methods.ts';
import { puzzleOf, type Case } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const user = (alg: string) => solved.applyAlg(centerMoves(alg, IDENTITY).join(' '));
const cases = METHODS.flatMap(allCases);
const AUFS = ['', 'U ', "U' ", 'U2 '];
// Supported notation tokens, ASCII primes only (no ′ or ’)
const NOTATION = /^(?:[URFDLBrludfbMESxyz](?:2'?|')?)(?: [URFDLBrludfbMESxyz](?:2'?|')?)*$/;
// The 2x2: face turns and rotations only (no slices; a wide move is the whole cube there, and cubing.js's 2x2 rejects it)
const NOTATION_2X2 = /^(?:[URFDLBxyz](?:2'?|')?)(?: [URFDLBxyz](?:2'?|')?)*$/;

// A U turn before the alg is the AUF; one after (last layer) is already allowed by goalReached itself.
const solves = (c: Case, alg: string, from = caseState(kpuzzle, c.algs[0].alg, IDENTITY)) =>
  AUFS.some((auf) => goalReached(c.stage, from.applyAlg(centerMoves(auf + alg, IDENTITY).join(' ')), 'U'));

test('all methods: case ids unique across methods; phase and group ids too (page anchors, quiz history)', () => {
  const dupes = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes(cases.map((c) => c.id)), []);
  const sections = METHODS.flatMap((m) => m.phases.flatMap((p) => [p.id, ...p.groups.map((g) => g.id)]));
  assert.deepEqual(dupes([...sections, ...cases.map((c) => c.id)]), []);
  assert.deepEqual(dupes(METHODS.map((m) => m.id)), []);
  assert.deepEqual(METHODS.map((m) => m.id), ['principiante', 'cfop-reducido', 'cfop-completo', 'f2l-avanzado', 'coll', 'roux', 'principiante-2x2', 'ortega']);
});

test('all methods: every case is of its method\'s puzzle', () => {
  for (const m of METHODS) for (const c of allCases(m)) assert.equal(puzzleOf(c.stage), m.puzzle ?? '3x3x3', `${m.id}: ${c.id} (${c.stage})`);
});

test("all methods: a phase's goal figure shows its goal reached (the solved cube, or the case it names; none if false)", () => {
  for (const m of METHODS) for (const p of m.phases.filter((x) => x.goal)) {
    const stage = p.groups.at(-1)?.cases.at(-1)?.stage; // the figure is masked as the phase's last cases
    assert.ok(stage, `${p.id}: a goal needs cases`);
    if (p.goalFigure === false) continue; // no figure: nothing to check
    const shown = p.goalFigure ? allCases(m).find((c) => c.id === p.goalFigure) : null;
    assert.ok(!p.goalFigure || shown, `${p.id}: ${p.goalFigure} isn't a case of ${m.id}`);
    assert.ok(goalReached(stage, shown ? caseState(kpuzzle, shown.algs[0].alg, IDENTITY) : solved, 'U'), p.id);
  }
});

test('all methods: setups and algorithms tokenize in clean notation, setup = main alg undone (centers fixed)', () => {
  for (const c of cases) {
    assert.ok(c.algs.length >= 1 && c.algs[0].id === 'main', c.id);
    assert.equal(new Set(c.algs.map((v) => v.id)).size, c.algs.length, c.id);
    for (const s of [c.setup, ...c.algs.map((v) => v.alg)]) {
      assert.doesNotThrow(() => tokenize(s), c.id);
      assert.match(s, puzzleOf(c.stage) === '2x2x2' ? NOTATION_2X2 : NOTATION, c.id);
    }
    const [a, b] = [user(c.setup), caseState(kpuzzle, c.algs[0].alg, IDENTITY)];
    // a 2x2 has corners only: the setup may move the 3x3's edges another way
    assert.ok(puzzleOf(c.stage) === '2x2x2' ? JSON.stringify(a.patternData.CORNERS) === JSON.stringify(b.patternData.CORNERS) : a.isIdentical(b), c.id);
  }
});

test('all methods: the setup is not at the stage goal yet, and the main algorithm reaches it', () => {
  for (const c of cases) {
    const from = user(c.setup);
    assert.ok(!goalReached(c.stage, from, 'U'), `${c.id}: the setup already meets ${c.stage}`);
    assert.ok(goalReached(c.stage, from.applyAlg(centerMoves(c.algs[0].alg, IDENTITY).join(' ')), 'U'), c.id);
  }
});

test('all methods: every variant (plan B, SpeedCubeDB extras) solves its case to the stage goal', () => {
  for (const c of cases) for (const v of c.algs.slice(1)) assert.ok(solves(c, v.alg), `${c.id} ${v.id}: ${v.alg}`);
});

test('all methods: SpeedCubeDB extras are tagged with their rank, at most 4 per case', () => {
  for (const c of cases) {
    const scdb = c.algs.filter((v) => v.id.startsWith('scdb-'));
    assert.ok(scdb.length <= 4, c.id);
    for (const v of scdb) assert.ok(v.source === 'speedcubedb' && v.id === `scdb-${v.rank}`, `${c.id} ${v.id}`);
  }
  // CFOP reducido
  assert.ok(allCases(METHODS[1]).some((c) => c.algs.some((v) => v.id.startsWith('scdb-'))));
  assert.equal(findCase('cfop-oll-sune')?.scdb?.url, 'https://speedcubedb.com/a/3x3/OLL/OLL_27');
  assert.equal(findCase('cfop-f2l-a1')?.scdb?.url, 'https://speedcubedb.com/a/3x3/F2L/F2L_1');
  assert.equal(findCase('cfop-pll-ua')?.scdb?.url, 'https://speedcubedb.com/a/3x3/PLL/Ua');
});

test('all methods: official quizzes are solved by their answer, and by no other case of the phase', () => {
  const ambiguous: string[] = [];
  for (const p of METHODS.flatMap((m) => m.phases)) {
    const own = p.groups.flatMap((g) => g.cases);
    for (const q of p.quizzes) {
      q.items.forEach((it, i) => {
        const answer = findCase(it.answer);
        const where = `${q.id} #${i + 1}`;
        assert.ok(answer && own.includes(answer), `${where}: ${it.answer} is not a case of ${p.id}`);
        const state = user(it.scramble);
        assert.ok(!goalReached(answer.stage, state, 'U'), `${where} already solved`);
        assert.ok(solves(answer, answer.algs[0].alg, state), `${where}: ${it.answer} doesn't solve it`);
        for (const c of own) if (c !== answer && c.stage === answer.stage && solves(c, c.algs[0].alg, state)) ambiguous.push(`${where}: ${c.id}`);
      });
    }
  }
  assert.deepEqual(ambiguous, []);
});

// --- CFOP completo: exactly the 41 / 57 / 21 cases, none twice ---

// Slots: EDGES UF UR UB UL DF DR DB DL FR FL BR BL; CORNERS UFR URB UBL ULF DRF DFL DLB DBR.
const U_TURNS = ['', 'U', "U'", 'U2'];
const canonical = (keys: string[]) => keys.sort()[0];
const where = (p: KPattern, orbit: 'EDGES' | 'CORNERS', piece: number) => {
  const slot = p.patternData[orbit].pieces.indexOf(piece);
  return `${slot}:${p.patternData[orbit].orientation[slot]}`;
};
const at = (c: Case, before: string, after = '') => user([before, c.setup, after].filter(Boolean).join(' '));

/** F2L: where the FR pair (edge FR, corner DRF) is, up to a U turn before; both in the U layer or the FR slot. */
function f2lKey(c: Case): string {
  const p = at(c, '');
  for (let e = 4; e < 8; e++) assert.ok(where(p, 'EDGES', e) === `${e}:0`, `${c.id}: the cross is not solved`);
  const [edge, corner] = [p.patternData.EDGES.pieces.indexOf(8), p.patternData.CORNERS.pieces.indexOf(4)];
  assert.ok((edge < 4 || edge === 8) && (corner < 4 || corner === 4), `${c.id}: the pair is not in the U layer or its slot`);
  return canonical(U_TURNS.map((u) => {
    const q = at(c, '', u); // the AUF before the algorithm = a U turn after the setup
    return `${where(q, 'EDGES', 8)} ${where(q, 'CORNERS', 4)}`;
  }));
}

/** OLL: the last layer's orientation, up to a U turn after the setup (one before it doesn't change orientation). */
function ollKey(c: Case): string {
  assert.ok(goalReached('f2l', at(c, ''), 'U'), `${c.id}: F2L is not solved`);
  return canonical(U_TURNS.map((u) => {
    const q = at(c, '', u);
    return [...q.patternData.EDGES.orientation.slice(0, 4), ...q.patternData.CORNERS.orientation.slice(0, 4)].join('');
  }));
}

/** PLL: the last layer's permutation, up to U turns before (conjugation) and after (AUF) the setup. */
function pllKey(c: Case): string {
  assert.ok(goalReached('oll-corners', at(c, ''), 'U'), `${c.id}: OLL is not solved`);
  return canonical(U_TURNS.flatMap((before) => U_TURNS.map((after) => {
    const q = at(c, before, after);
    return [...q.patternData.EDGES.pieces.slice(0, 4), ...q.patternData.CORNERS.pieces.slice(0, 4)].join(' ');
  })));
}

for (const [phase, total, key] of [[cfopFull.phases[0], 41, f2lKey], [cfopFull.phases[1], 57, ollKey], [cfopFull.phases[2], 21, pllKey]] as const) {
  const own = phase.groups.flatMap((g) => g.cases);
  test(`cfop completo: ${phase.id} has exactly ${total} cases, none repeated`, { skip: !own.length && 'no cases yet' }, () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const c of own) {
      const k = key(c);
      if (seen.has(k)) dupes.push(`${c.id} = ${seen.get(k)}`);
      seen.set(k, c.id);
    }
    assert.deepEqual(dupes, []);
    assert.equal(own.length, total);
  });
}

test('cfop completo coverage keys tell cases apart (fixtures)', () => {
  const k = (fn: (c: Case) => string, setup: string) => fn({ id: setup, setup } as Case);
  // F2L: the same pair state seen after a U turn is the same case; a different one isn't; another slot isn't a case
  assert.equal(k(f2lKey, "R U R' U'"), k(f2lKey, "R U R' U2"));
  assert.notEqual(k(f2lKey, "R U R' U'"), k(f2lKey, "R U' R' U"));
  assert.throws(() => k(f2lKey, "R U R' L' U' L"), /not in the U layer/);
  // OLL: Sune from any angle is Sune; Sune and Antisune differ
  const sune = "R U2 R' U' R U' R'", antisune = "R U R' U R U2 R'";
  assert.equal(k(ollKey, sune), k(ollKey, `${sune} U`));
  assert.equal(k(ollKey, sune), k(ollKey, `U ${sune}`));
  assert.notEqual(k(ollKey, sune), k(ollKey, antisune));
  // PLL: Ua from any angle and AUF is Ua; Ua and Ub differ (one is the other undone); so do Aa and Ab
  const ua = "M2 U' M U2 M' U' M2", ub = "M2 U M U2 M' U M2";
  assert.equal(k(pllKey, ua), k(pllKey, `U ${ua} U2`));
  assert.notEqual(k(pllKey, ua), k(pllKey, ub));
  const aa = "x R' U R' D2 R U' R' D2 R2 x'", ab = "x R2 D2 R U R' D2 R U' R x'";
  assert.notEqual(k(pllKey, aa), k(pllKey, ab));
  // CFOP reducido's own F2L and PLL cases are all different cases
  const reduced = allCases(METHODS[1]);
  const distinct = (stages: string[], fn: (c: Case) => string) => {
    const own = reduced.filter((c) => stages.includes(c.stage));
    assert.equal(new Set(own.map(fn)).size, own.length, stages.join());
  };
  distinct(['f2l'], f2lKey);
  distinct(['pll-corners', 'pll-edges'], pllKey);
});

// --- The 2x2 ---

test('bases del 2x2: examples in 2x2 notation', () => {
  for (const l of bases2x2.lessons) for (const x of l.examples ?? []) for (const alg of [x.setup, x.solution]) assert.match(alg, NOTATION_2X2, `${l.id}: ${alg}`);
});

test('principiante 2x2: the yellow face and the top corners keep the first layer', () => {
  for (const c of allCases(beginner2x2).filter((x) => x.stage !== '2x2-first-layer')) {
    const from = user(c.setup);
    assert.ok(goalReached('2x2-first-layer', from, 'U'), `${c.id}: the first layer isn't solved`);
    for (const v of c.algs) assert.ok(AUFS.some((auf) => goalReached('2x2-first-layer', from.applyAlg(centerMoves(auf + v.alg, IDENTITY).join(' ')), 'U')), `${c.id} ${v.id}`);
  }
});

/** A 2x2 state as its goals see it (held DLB home), as text. */
const held = (c: Case, before: string, after: string) => held2x2(at(c, before, after)).patternData.CORNERS;
const UD_TURNS = U_TURNS.flatMap((u) => U_TURNS.map((d) => `${u} ${d.replace('U', 'D')}`.trim()));

/** Ortega OLL: the top layer's twists, up to a U turn; the white face done. */
function oll2Key(c: Case): string {
  assert.ok(goalReached('2x2-first-face', at(c, ''), 'U'), `${c.id}: the white face is not done`);
  return canonical(U_TURNS.map((u) => held(c, '', u).orientation.slice(0, 4).join('')));
}

/** Ortega PBL: both layers' permutation, up to U and D turns before (conjugation) and after; all oriented. */
function pblKey(c: Case): string {
  assert.ok(goalReached('2x2-oll', at(c, ''), 'U'), `${c.id}: OLL is not solved`);
  return canonical(UD_TURNS.flatMap((before) => UD_TURNS.map((after) => held(c, before, after).pieces.join(''))));
}

for (const [phase, total, key] of [[ortega.phases[1], 7, oll2Key], [ortega.phases[2], 5, pblKey]] as const) {
  const own = phase.groups.flatMap((g) => g.cases);
  test(`ortega: ${phase.id} has exactly ${total} cases, none repeated, and they solve every state`, { todo: !own.length && 'no cases yet' }, () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const c of own) {
      const k = key(c);
      if (seen.has(k)) dupes.push(`${c.id} = ${seen.get(k)}`);
      seen.set(k, c.id);
    }
    assert.deepEqual(dupes, []);
    assert.equal(own.length, total);
    assert.ok(stageCounts(phase, own[0].stage, kpuzzle), `${phase.id}: some state is solved by none of its cases`); // with AUF, ADF, x2
  });
}

test('2x2 coverage keys tell cases apart (fixtures)', () => {
  const k = (fn: (c: Case) => string, setup: string) => fn({ id: setup, setup } as Case);
  const sune = "R U2 R' U' R U' R'", antisune = "R U R' U R U2 R'";
  assert.equal(k(oll2Key, sune), k(oll2Key, `U ${sune} U'`));
  assert.notEqual(k(oll2Key, sune), k(oll2Key, antisune));
  assert.throws(() => k(oll2Key, 'R'), /white face/);
  const adjadj = "R2 U' B2 U2 R2 U' R2", diagdiag = 'R2 F2 R2';
  assert.equal(k(pblKey, adjadj), k(pblKey, `U D' ${adjadj} D2 U`));
  assert.equal(k(pblKey, adjadj), k(pblKey, `y ${adjadj} y'`)); // a whole-cube turn is no other case
  assert.notEqual(k(pblKey, adjadj), k(pblKey, diagdiag));
});

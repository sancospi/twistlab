// Checks every method's data against the simulator: every setup, algorithm and official quiz must agree with the
// case it claims to be. A failure here is a transcription error until the source says otherwise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import { IDENTITY, centerMoves, tokenize } from '../notation.ts';
import { caseState, goalReached } from './cube.ts';
import { cfopFull } from './cfopFull.ts';
import { METHODS, allCases, findCase } from './methods.ts';
import type { Case } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const user = (alg: string) => solved.applyAlg(centerMoves(alg, IDENTITY).join(' '));
const cases = METHODS.flatMap(allCases);
const AUFS = ['', 'U ', "U' ", 'U2 '];
// Supported notation tokens, ASCII primes only (no ′ or ’)
const NOTATION = /^(?:[URFDLBrludfbMESxyz](?:2'?|')?)(?: [URFDLBrludfbMESxyz](?:2'?|')?)*$/;

// A U turn before the alg is the AUF; one after (last layer) is already allowed by goalReached itself.
const solves = (c: Case, alg: string, from = caseState(kpuzzle, c.algs[0].alg, IDENTITY)) =>
  AUFS.some((auf) => goalReached(c.stage, from.applyAlg(centerMoves(auf + alg, IDENTITY).join(' ')), 'U'));

test('all methods: case ids unique across methods; phase and group ids too (page anchors, quiz history)', () => {
  const dupes = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes(cases.map((c) => c.id)), []);
  const sections = METHODS.flatMap((m) => m.phases.flatMap((p) => [p.id, ...p.groups.map((g) => g.id)]));
  assert.deepEqual(dupes([...sections, ...cases.map((c) => c.id)]), []);
  assert.deepEqual(dupes(METHODS.map((m) => m.id)), []);
  assert.deepEqual(METHODS.map((m) => m.id), ['principiante', 'cfop-reducido', 'cfop-completo']);
});

test('all methods: setups and algorithms tokenize in clean notation, setup = main alg undone (centers fixed)', () => {
  for (const c of cases) {
    assert.ok(c.algs.length >= 1 && c.algs[0].id === 'main', c.id);
    assert.equal(new Set(c.algs.map((v) => v.id)).size, c.algs.length, c.id);
    for (const s of [c.setup, ...c.algs.map((v) => v.alg)]) {
      assert.doesNotThrow(() => tokenize(s), c.id);
      assert.match(s, NOTATION, c.id);
    }
    assert.ok(user(c.setup).isIdentical(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), c.id);
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

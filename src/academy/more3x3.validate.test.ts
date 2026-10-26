// The 3x3 methods beyond CFOP: F2L avanzado, COLL and Roux. cfop.validate.test.ts already checks every case of every
// method (notation, setup = main undone, setup not at the goal, every variant reaches it); this file checks what each
// set must be: the right stage per phase, the right starting point, and COLL / CMLL complete (40 / 42 cases, none
// twice, every state solved by one). The completeness tests are todo until the cases are written.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import { IDENTITY, centerMoves } from '../notation.ts';
import { caseState, goalReached, rouxAligned } from './cube.ts';
import { coll } from './coll.ts';
import { f2lAdvanced } from './f2lAdvanced.ts';
import { roux } from './roux.ts';
import { allCases } from './methods.ts';
import { caseProbability, formatProbability, stageCounts } from './probability.ts';
import type { Case, Method, Phase, Stage } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const user = (alg: string) => solved.applyAlg(centerMoves(alg, IDENTITY).join(' '));
const U_TURNS = ['', 'U', "U'", 'U2'];
const phase = (m: Method, id: string) => m.phases.find((p) => p.id === id)!;
const own = (p: Phase) => p.groups.flatMap((g) => g.cases);
const at = (c: Case, before = '', after = '') => user([before, c.setup, after].filter(Boolean).join(' '));

// Slots: EDGES UF UR UB UL DF DR DB DL FR FL BR BL; CORNERS UFR URB UBL ULF DRF DFL DLB DBR.
const SLOTS = { FR: [8, 4], FL: [9, 5], BL: [11, 6], BR: [10, 7] } as const; // [edge, corner]
const home = (p: KPattern, orbit: 'EDGES' | 'CORNERS', i: number) => p.patternData[orbit].pieces[i] === i && p.patternData[orbit].orientation[i] === 0;
const slotSolved = (p: KPattern, [e, c]: readonly [number, number]) => home(p, 'EDGES', e) && home(p, 'CORNERS', c);

test('every phase: its cases are of its stages; ids carry the method prefix', () => {
  const stages: [Method, Record<string, Stage[]>, string][] = [
    [f2lAdvanced, { 'f2la-atras': ['f2l'], 'f2la-hueco': ['f2l'], 'f2la-libres': ['f2l'] }, 'f2la-'],
    [coll, { 'coll-casos': ['coll'] }, 'coll-'],
    [roux, { 'roux-bloque1': ['roux-fb'], 'roux-bloque2': ['roux-sb'], 'roux-cmll': ['cmll'], 'roux-lse': ['lse-eo', 'lse-ulur', 'lse-4c'] }, 'roux-'],
  ];
  for (const [m, byPhase, prefix] of stages) {
    assert.deepEqual(m.phases.map((p) => p.id), Object.keys(byPhase), m.id);
    for (const p of m.phases) for (const c of own(p)) {
      assert.ok(byPhase[p.id].includes(c.stage), `${c.id}: ${c.stage} in ${p.id}`);
      assert.ok(c.id.startsWith(prefix), c.id);
    }
  }
});

test('F2L avanzado: the cross is solved; back slots start with the front ones done; stuck pieces sit in another slot', () => {
  for (const p of f2lAdvanced.phases) for (const c of own(p)) {
    const s = at(c);
    for (const e of [4, 5, 6, 7]) assert.ok(home(s, 'EDGES', e), `${c.id}: the cross is not solved`);
    if (p.id === 'f2la-atras') {
      assert.ok(slotSolved(s, SLOTS.FR) && slotSolved(s, SLOTS.FL), `${c.id}: a front slot is not solved`);
    }
    if (p.id === 'f2la-hueco') {
      // some F2L piece (E-layer edge or D corner) sits in an F2L slot that isn't its own
      const stuck = Object.values(SLOTS).some(([e, cn]) => {
        const [pe, pc] = [s.patternData.EDGES.pieces[e], s.patternData.CORNERS.pieces[cn]];
        return (pe >= 8 && pe !== e) || (pc >= 4 && pc !== cn);
      });
      assert.ok(stuck, `${c.id}: no piece is stuck in another slot`);
    }
  }
});

/** COLL / CMLL: the top corners (places and twists), up to U turns before (conjugation) and after (AUF) the setup. */
function cornersKey(c: Case): string {
  return U_TURNS.flatMap((before) => U_TURNS.map((after) => {
    const p = at(c, before, after);
    const q = c.stage === 'cmll' ? rouxAligned(p)!.q : p;
    const { pieces, orientation } = q.patternData.CORNERS;
    return `${pieces.slice(0, 4).join('')} ${orientation.slice(0, 4).join('')}`;
  })).sort()[0];
}

test('COLL: F2L done and the top edges oriented at the start; the corners not all oriented (that is a PLL)', () => {
  for (const c of allCases(coll)) {
    const s = at(c);
    assert.ok(goalReached('oll-cross', s, 'U'), `${c.id}: F2L or the yellow cross not done`);
    assert.ok(!goalReached('oll-corners', s, 'U'), `${c.id}: the corners are already oriented`);
    if (c.scdb) assert.equal(c.scdb.set, 'COLL', c.id);
  }
});

// every algorithm, not just the main: Practicar sets the chosen one up on its own (its algorithm undone)
test('Roux: each step starts where the one before ends, from every algorithm', () => {
  const before: Partial<Record<Stage, Stage>> = { 'roux-sb': 'roux-fb', cmll: 'roux-sb', 'lse-eo': 'cmll', 'lse-ulur': 'lse-eo', 'lse-4c': 'lse-ulur' };
  for (const c of allCases(roux)) {
    const prev = before[c.stage];
    if (prev) for (const v of c.algs) assert.ok(goalReached(prev, caseState(kpuzzle, v.alg, IDENTITY), 'U'), `${c.id} ${v.id}: ${prev} not done at the start`);
    if (c.stage === 'cmll' && c.scdb) assert.equal(c.scdb.set, 'CMLL', c.id);
  }
});

for (const [p, stage, total] of [[phase(coll, 'coll-casos'), 'coll', 40], [phase(roux, 'roux-cmll'), 'cmll', 42]] as const) {
  test(`${p.id}: exactly ${total} cases, none twice, and together they solve every state`, { todo: !own(p).length && 'no cases yet' }, () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const c of own(p)) {
      const k = cornersKey(c);
      if (seen.has(k)) dupes.push(`${c.id} = ${seen.get(k)}`);
      seen.set(k, c.id);
    }
    assert.deepEqual(dupes, []);
    assert.equal(own(p).length, total);
    assert.ok(stageCounts(p, stage, kpuzzle), `${p.id}: some state is solved by none of its cases`);
  });
}

test('COLL odds: 38 cases 2/81, 2 of H 1/81; skip (corners already oriented: PLL) 1/27', { todo: !own(phase(coll, 'coll-casos')).length && 'no cases yet' }, () => {
  const p = phase(coll, 'coll-casos');
  const odds = own(p).map((c) => formatProbability(caseProbability(c.id, kpuzzle)!)).sort();
  assert.deepEqual(odds, [...Array(2).fill('1/81'), ...Array(38).fill('2/81')]);
  const counts = stageCounts(p, 'coll', kpuzzle)!;
  assert.equal(formatProbability(counts.skip / counts.total), '1/27');
});

test('CMLL odds: 39 cases 2/81, 2 of H 1/81, O diagonal 1/162; skip 1/162', { todo: !own(phase(roux, 'roux-cmll')).length && 'no cases yet' }, () => {
  const p = phase(roux, 'roux-cmll');
  const odds = own(p).map((c) => formatProbability(caseProbability(c.id, kpuzzle)!)).sort();
  assert.deepEqual(odds, ['1/162', ...Array(2).fill('1/81'), ...Array(39).fill('2/81')]);
  const counts = stageCounts(p, 'cmll', kpuzzle)!;
  assert.equal(formatProbability(counts.skip / counts.total), '1/162');
});

test('coverage keys tell COLL / CMLL cases apart (fixtures)', () => {
  const k = (stage: Stage, setup: string) => cornersKey({ id: setup, setup, stage } as Case);
  const sune = "R U2 R' U' R U' R'", antisune = "R U R' U R U2 R'";
  for (const stage of ['coll', 'cmll'] as const) {
    assert.equal(k(stage, sune), k(stage, `U ${sune} U2`));
    assert.notEqual(k(stage, sune), k(stage, antisune));
  }
  assert.equal(k('cmll', `M ${sune}`), k('cmll', sune)); // the M slice doesn't make another CMLL case
});

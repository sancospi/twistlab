import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { findCase } from './methods.ts';
import { phaseOf } from './probability.ts';
import { caseSet, inverseCase, matches, mirrorCase, type LibraryFilter } from './library.ts';
import type { Learning } from './store.ts';
import type { Case } from './types.ts';

const get = (id: string): Case => findCase(id)!;
const among = (c: Case) => phaseOf(c.id)!.groups.flatMap((g) => g.cases);

test('inverse and mirror cases, found in the simulator', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const related = (id: string) => {
    const c = get(id);
    return [inverseCase(kpuzzle, c, c.algs[0].alg, among(c))?.id, mirrorCase(kpuzzle, c, c.algs[0].alg, among(c))?.id];
  };
  assert.deepEqual(related('cfopc-oll-27'), ['cfopc-oll-26', 'cfopc-oll-26']); // Sune: Antisune both ways
  assert.deepEqual(related('cfopc-oll-21'), ['cfopc-oll-21', 'cfopc-oll-21']); // H: its own inverse and mirror
  assert.deepEqual(related('cfopc-pll-ja'), ['cfopc-pll-ja', 'cfopc-pll-jb']);
  assert.deepEqual(related('cfopc-pll-ua'), ['cfopc-pll-ub', 'cfopc-pll-ub']);
  assert.deepEqual(related('cfopc-f2l-01'), ['cfopc-f2l-04', 'cfopc-f2l-02']); // the mirror needs a y: front-left slot
  const c = get('cfopc-oll-23'); // the user's own algorithm counts: U undone, written for the L
  assert.equal(inverseCase(kpuzzle, c, "R2 D R' U2 R D' R' U2 R'", among(c))?.id, 'cfopc-oll-25');
  const aa = get('cfopc-pll-aa'); // ends rotated: the inverse starts from that frame
  assert.equal(inverseCase(kpuzzle, aa, "U' x L2 D2 L' U' L D2 L' U L'", among(aa))?.id, 'cfopc-pll-ab');
});

test('library: search by code, name, recognition or algorithm; filters by set and status', () => {
  const sune = get('cfopc-oll-27'), t = get('cfopc-pll-t'), lightning = get('cfopc-oll-07'), a1 = get('cfop-f2l-a1');
  const now = Date.parse('2026-10-21T12:00:00');
  const f = (query: string, more: Partial<LibraryFilter> = {}): LibraryFilter => ({ query, set: '', status: '', ...more });
  const ok = (c: Case, filter: LibraryFilter, learning?: Learning) => matches(c, c.algs.map((v) => v.alg), filter, learning, now);
  assert.ok(ok(sune, f('')));
  assert.ok(ok(sune, f('sune')));
  assert.ok(ok(sune, f("R U R′ U R U2"))); // typographic primes, part of the algorithm
  assert.ok(!ok(t, f("R U R' U R U2")));
  assert.ok(ok(lightning, f('relampago'))); // no accents needed
  assert.ok(ok(t, f('  t ')));
  assert.ok(!ok(sune, f('t')), 'a 1-letter code is not a substring of the text');
  assert.ok(!ok(sune, f("r U R' U'")), 'wide r is not R');
  assert.ok(!ok(sune, f('sune pll')), 'every word must match');
  assert.ok(ok(sune, f('', { set: 'oll' })) && !ok(sune, f('', { set: 'pll' })));
  assert.equal(caseSet(get('prin-cruz-linea').stage), 'oll');
  assert.equal(caseSet(get('prin-capa2-derecha').stage), 'beginner');
  assert.equal(caseSet(a1.stage), 'f2l');
  const learning = (interval: number, due: number): Learning => ({ due, interval, lapses: 0, recognitionMs: null, solveMs: null });
  assert.ok(ok(sune, f('', { status: 'new' })));
  assert.ok(!ok(sune, f('', { status: 'due' })));
  assert.ok(ok(sune, f('', { status: 'learning' }), learning(1, now + 86_400_000)));
  assert.ok(ok(sune, f('', { status: 'known' }), learning(6, now - 1)));
  assert.ok(ok(sune, f('', { status: 'due' }), learning(6, now - 1)), 'known and due today: both');
  assert.ok(!ok(sune, f('', { status: 'due' }), learning(6, now + 3 * 86_400_000)));
});

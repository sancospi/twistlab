import test from 'node:test';
import assert from 'node:assert/strict';
import { METHODS, allCases, findCase, scdbUrl } from './methods.ts';
import { cfopReduced } from './cfop.ts';

const cases = allCases(cfopReduced);
// Supported notation tokens, ASCII primes only (no ′ or ’); SpeedCubeDB extras also use S, d, u, l, x…
const NOTATION = /^(?:[URFDLBrludfbMESxyz](?:2'?|')?)(?: [URFDLBrludfbMESxyz](?:2'?|')?)*$/;

test('cfop reducido: unique ids, cases per phase, lookups', () => {
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  assert.deepEqual(cfopReduced.phases.map((p) => p.groups.flatMap((g) => g.cases).length), [19, 10, 6]);
  assert.deepEqual(cfopReduced.phases.map((p) => p.id), ['f2l', 'oll', 'pll']);
  assert.ok(METHODS.includes(cfopReduced));
  assert.equal(findCase('cfop-pll-z')?.code, 'Z-perm');
  assert.equal(findCase('nope'), undefined);
  const groupIds = cfopReduced.phases.flatMap((p) => p.groups.map((g) => g.id));
  assert.equal(new Set(groupIds).size, groupIds.length);
});

test('cfop reducido: every case has a main alg and clean notation', () => {
  for (const c of cases) {
    assert.ok(c.algs.length >= 1, c.id);
    assert.equal(c.algs[0].id, 'main', c.id);
    assert.equal(new Set(c.algs.map((a) => a.id)).size, c.algs.length, c.id);
    for (const s of [c.setup, ...c.algs.map((a) => a.alg)]) assert.match(s, NOTATION, c.id);
    assert.ok(c.recognition.es && c.name.es, c.id);
    if (c.scdb) assert.equal(c.scdb.url, scdbUrl(c.scdb.set, c.scdb.id));
  }
  assert.equal(findCase('cfop-oll-punto')?.scdb, null);
  assert.equal(cases.filter((c) => c.algs.some((a) => a.source === 'plan-b')).length, 9);
});

test('cfop reducido: quizzes answer existing cases of their own phase', () => {
  const quizIds = cfopReduced.phases.flatMap((p) => p.quizzes.map((q) => q.id));
  assert.equal(quizIds.length, 9);
  assert.equal(new Set(quizIds).size, quizIds.length);
  for (const p of cfopReduced.phases) {
    const own = new Set(p.groups.flatMap((g) => g.cases.map((c) => c.id)));
    for (const q of p.quizzes) {
      assert.ok(q.items.length > 0, q.id);
      for (const it of q.items) {
        assert.ok(own.has(it.answer), `${q.id}: ${it.answer}`);
        assert.match(it.scramble, NOTATION, q.id);
      }
    }
  }
});

test('cfop reducido: SpeedCubeDB extras name real cases; a group holds one stage; diagram fits the stages', async () => {
  const { SCDB_ALTS } = await import('./cfop.ts');
  const { maskFor } = await import('./diagram.ts');
  for (const id of Object.keys(SCDB_ALTS)) assert.ok(findCase(id), `SCDB_ALTS key ${id} has no case`);
  for (const p of cfopReduced.phases) {
    for (const g of p.groups) assert.equal(new Set(g.cases.map((c) => c.stage)).size, 1, g.id);
    for (const c of p.groups.flatMap((g) => g.cases)) {
      assert.ok(c.id.startsWith(`cfop-${p.id}-`), c.id);
      assert.equal(p.diagram === 'iso', maskFor(c.stage) === 'f2l', c.id);
    }
  }
});

test("the plan's notation, calendar and stage goals are part of the method", () => {
  const m = cfopReduced;
  assert.match(m.notation!.es, /Gatillos/);
  for (let week = 1; week <= 6; week++) assert.match(m.schedule!.es, new RegExp(`Semana ${week} `));
  assert.match(m.schedule!.es, /cruz en menos de 4 s, F2L en menos de 25 s, OLL en menos de 7 s y PLL en menos de 7 s/);
});

test("a method's next names another method of the same puzzle", () => {
  for (const m of METHODS.filter((x) => x.next)) {
    const next = METHODS.find((x) => x.id === m.next);
    assert.ok(next && next !== m && next.puzzle === m.puzzle, m.id);
  }
});

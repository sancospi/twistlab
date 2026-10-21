// Checks the CFOP data against the simulator: every setup, algorithm and official quiz must agree with the
// case it claims to be. A failure here is a transcription error until the PDF says otherwise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { IDENTITY, centerMoves, tokenize } from '../notation.ts';
import { caseState, goalReached } from './cube.ts';
import { cfopReduced } from './cfop.ts';
import { allCases, findCase } from './methods.ts';
import type { Case } from './types.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const user = (alg: string) => solved.applyAlg(centerMoves(alg, IDENTITY).join(' '));
const cases = allCases(cfopReduced);
const AUFS = ['', 'U ', "U' ", 'U2 '];

// A U turn before the alg is the AUF; one after (pll) is already allowed by goalReached itself.
const solves = (c: Case, alg: string, from = caseState(kpuzzle, c.algs[0].alg, IDENTITY)) =>
  AUFS.some((auf) => goalReached(c.stage, from.applyAlg(centerMoves(auf + alg, IDENTITY).join(' ')), 'U'));

test('cfop data: setups and algorithms tokenize, setup = main alg undone (centers fixed)', () => {
  for (const c of cases) {
    for (const s of [c.setup, ...c.algs.map((v) => v.alg)]) assert.doesNotThrow(() => tokenize(s), c.id);
    assert.ok(user(c.setup).isIdentical(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), c.id);
  }
});

test('cfop data: every variant (plan B, SpeedCubeDB extras) solves its case to the stage goal', () => {
  for (const c of cases) for (const v of c.algs.slice(1)) assert.ok(solves(c, v.alg), `${c.id} ${v.id}: ${v.alg}`);
});

test('cfop data: SpeedCubeDB extras are tagged with their rank, at most 4 per case', () => {
  let extras = 0;
  for (const c of cases) {
    const scdb = c.algs.filter((v) => v.id.startsWith('scdb-'));
    assert.ok(scdb.length <= 4, c.id);
    for (const v of scdb) assert.ok(v.source === 'speedcubedb' && v.id === `scdb-${v.rank}`, `${c.id} ${v.id}`);
    extras += scdb.length;
  }
  assert.ok(extras > 0);
  assert.equal(findCase('cfop-oll-sune')?.scdb?.url, 'https://speedcubedb.com/a/3x3/OLL/OLL_27');
  assert.equal(findCase('cfop-f2l-a1')?.scdb?.url, 'https://speedcubedb.com/a/3x3/F2L/F2L_1');
  assert.equal(findCase('cfop-pll-ua')?.scdb?.url, 'https://speedcubedb.com/a/3x3/PLL/Ua');
});

test('cfop data: official quizzes are solved by their answer, and by no other case of the phase', () => {
  const ambiguous: string[] = [];
  for (const p of cfopReduced.phases) {
    const own = p.groups.flatMap((g) => g.cases);
    for (const q of p.quizzes) {
      q.items.forEach((it, i) => {
        const answer = findCase(it.answer)!;
        const state = user(it.scramble);
        const where = `${q.id} #${i + 1}`;
        assert.ok(!goalReached(answer.stage, state, 'U'), `${where} already solved`);
        assert.ok(solves(answer, answer.algs[0].alg, state), `${where}: ${it.answer} doesn't solve it`);
        for (const c of own) if (c !== answer && c.stage === answer.stage && solves(c, c.algs[0].alg, state)) ambiguous.push(`${where}: ${c.id}`);
      });
    }
  }
  assert.deepEqual(ambiguous, []);
});

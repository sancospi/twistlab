import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { goalReached, caseState } from './academy/cube.ts';
import { crossSolved, seededScramble } from './academy/cross.ts';
import { beginner } from './academy/beginner.ts';
import { IDENTITY, expand, tokenize } from './notation.ts';
import { BSTAGES, beginnerSolve, stepTokens, type BStep } from './beginnerSolve.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const PHASE: Record<string, string> = {
  'first-layer': 'prin-capa1', 'second-layer': 'prin-capa2', 'oll-cross': 'prin-cruz', 'll-edges': 'prin-aristas',
  'll-corners-placed': 'prin-esquinas', 'll-corners-twist': 'prin-orientar',
};
const casesOf = (phase: string) => beginner.phases.find((p) => p.id === phase)!.groups.flatMap((g) => g.cases);

test('beginnerSolve: 100 random states solved, stage by stage, with the method\'s cases', () => {
  let longest = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const start = seededScramble(kpuzzle, seed);
    const steps = beginnerSolve(start);
    longest = Math.max(longest, steps.length);
    assert.ok(steps.length <= 20, `seed ${seed}: ${steps.length} steps`);
    // stages in order, each one's goal reached once its steps are done
    assert.deepEqual(steps.map((s) => BSTAGES.indexOf(s.stage)), steps.map((s) => BSTAGES.indexOf(s.stage)).sort((a, b) => a - b), `seed ${seed}`);
    let p = start;
    let frame = IDENTITY;
    steps.forEach((s: BStep, i) => {
      const x = expand(stepTokens(s), frame);
      p = p.applyAlg(x.steps.flatMap((t) => t.moves).join(' '));
      frame = x.frame;
      if (s.kind === 'case' || s.kind === 'out') {
        const c = casesOf(PHASE[s.stage]).find((c) => c.id === s.caseId);
        assert.ok(c, `seed ${seed}: ${s.caseId} is a case of ${s.stage}`);
        assert.deepEqual(s.alg, tokenize(c.algs[0].alg));
        assert.ok(s.setup.every((m) => /^[yU]['2]?$/.test(m)) && s.setup.length <= 2);
        if (s.stage === 'first-layer' || s.stage === 'second-layer') assert.ok(s.pieces.length, `seed ${seed}: step ${i} names a piece`);
      }
      if (steps[i + 1]?.stage !== s.stage) {
        const ok = s.stage === 'cross' ? crossSolved(p, 'D') : goalReached(s.stage, p, 'U');
        assert.ok(ok, `seed ${seed}: ${s.stage} reached`);
      }
    });
    assert.ok(p.isIdentical(solved), `seed ${seed} solved`);
  }
  assert.ok(longest > 10);
});

test('beginnerSolve: solved needs nothing; a case is solved by its own algorithm', () => {
  assert.deepEqual(beginnerSolve(solved), []);
  const c = casesOf('prin-capa1').find((c) => c.id === 'prin-capa1-blanco-derecha')!;
  const [first] = beginnerSolve(caseState(kpuzzle, c.algs[0].alg, IDENTITY));
  assert.deepEqual({ ...first, alg: [] }, { stage: 'first-layer', kind: 'case', caseId: c.id, setup: [], alg: [], pieces: ['DRF'] });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../notation.ts';
import { beginner } from './beginner.ts';
import { cfopReduced } from './cfop.ts';
import { crossGuide } from './crossGuide.ts';
import { caseChoices, courseFor, minutes, moveQuestion, nextLesson, parseDone, splitSteps } from './lessons.ts';
import type { Case } from './types.ts';

test('lessons: a guide text splits into one idea per step', () => {
  const steps = splitSteps(['Intro.', 'More intro.', '- **A:** one', '- **B:** two', '1. first', '2. back to 1', '- also', 'After.', '## Head', 'Under it.', '- kept together', '## Next', 'x'].join('\n'));
  assert.deepEqual(steps, [
    { text: 'Intro.\nMore intro.' },
    { text: '**A:** one' },
    { text: '**B:** two' },
    { text: '1. first\n2. back to 1\n- also' }, // a numbered list stays whole, with its numbers
    { text: 'After.' },
    { title: 'Head', text: 'Under it.\n- kept together' },
    { title: 'Next', text: 'x' },
  ]);
  assert.deepEqual(splitSteps('a\n- b\nc'), [{ text: 'a' }, { text: 'b' }, { text: 'c' }]); // order kept around a list
  assert.deepEqual(splitSteps('a\nThe cases:\n- b\n- c\nd'), [{ text: 'a\nThe cases:\n- b\n- c' }, { text: 'd' }]); // led in by ":"
  assert.deepEqual(splitSteps(''), []);
});

test('lessons: "which move?" has 4 different choices with the answer among them', () => {
  for (const bases of [['U', 'D', 'R', 'L', 'F', 'B'], ['x', 'y', 'z']]) {
    for (const i of [0, 1, 2]) {
      const q = moveQuestion(bases, i);
      assert.equal(q.kind, 'move');
      if (q.kind !== 'move') continue;
      assert.equal(new Set(q.choices).size, 4);
      assert.ok(q.choices.includes(q.move));
      q.choices.forEach((c) => tokenize(c)); // valid notation
    }
  }
  const moves = [0, 1, 2].map((i) => (moveQuestion(['U', 'D', 'R', 'L', 'F', 'B'], i) as { move: string }).move);
  assert.equal(new Set(moves).size, 3); // three different questions per lesson
});

test('lessons: case choices are at most 4, include the answer and keep the phase order', () => {
  const cases = [...'abcdef'].map((id) => ({ id }) as Case);
  assert.deepEqual(caseChoices(cases, 5).map((c) => c.id), ['a', 'b', 'c', 'f']);
  assert.deepEqual(caseChoices(cases, 1).map((c) => c.id), ['b', 'c', 'd', 'e']);
  assert.equal(caseChoices(cases.slice(0, 3), 0).length, 3);
});

test('lessons: every guide with lessons builds them from its own data', () => {
  assert.equal(courseFor('cfop-completo'), null); // a reference, no lessons
  const notation = courseFor('notacion')!;
  assert.deepEqual(notation.lessons.map((l) => l.id), ['caras', 'dos-capas', 'capas-del-medio', 'todo-el-cubo']);
  const cross = courseFor(crossGuide.id)!;
  assert.equal(cross.lessons.length, crossGuide.lessons.length);
  const examples = cross.lessons.flatMap((l) => l.steps).filter((s) => s.kind === 'cube');
  assert.equal(examples.length, crossGuide.lessons.flatMap((l) => l.examples ?? []).length);
  const prin = courseFor(beginner.id)!;
  assert.equal(prin.lessons.length, beginner.phases.length + 1); // how to hold it, then one per phase
  for (const c of [notation, cross, prin]) {
    assert.equal(new Set(c.lessons.map((l) => l.id)).size, c.lessons.length, `${c.id}: unique ids`);
    for (const l of c.lessons) {
      assert.ok(l.title && l.steps.length >= 2, `${c.id}/${l.id}`);
      assert.ok(minutes(l) >= 1);
      for (const s of l.steps) {
        if (s.kind === 'cube') tokenize(`${s.setup} ${s.alg}`);
        if (s.kind === 'case') assert.ok(s.choices.some((x) => x.id === s.caseId) && s.choices.length >= 2);
      }
    }
  }
  // each beginner case is shown once, with the algorithm passed in (the user's choice in the app)
  const cases = beginner.phases.flatMap((p) => p.groups.flatMap((g) => g.cases));
  const shown = courseFor(beginner.id, (c) => `${c.algs[0].alg} U U'`)!.lessons.flatMap((l) => l.steps).filter((s) => s.kind === 'cube' && s.stage);
  assert.equal(shown.length, cases.length);
  assert.ok(shown.every((s) => s.kind === 'cube' && s.alg.endsWith("U U'")));  // the 2x2's lessons play on a 2x2
  for (const id of ['principiante-2x2', 'ortega']) assert.equal(courseFor(id)?.puzzle, '2x2x2');
});

test('lessons: progress is validated and the next lesson is the first not done', () => {
  assert.deepEqual(parseDone({ cruz: ['a', 'a', 3, 'b'], x: 'no', y: [], z: [null] }), { cruz: ['a', 'b'] });
  assert.deepEqual(parseDone(null), {});
  assert.deepEqual(parseDone(['a']), {});
  const ls = ['a', 'b', 'c'].map((id) => ({ id, title: id, steps: [] }));
  assert.equal(nextLesson(ls, [])!.id, 'a');
  assert.equal(nextLesson(ls, ['a', 'c'])!.id, 'b');
  assert.equal(nextLesson(ls, ['a', 'b', 'c']), null);
  const step = (kind: 'text' | 'cube') => (kind === 'text' ? { kind, text: '' } : { kind, text: '', setup: '', alg: 'R', doSetup: false });
  assert.equal(minutes({ id: 'x', title: 'x', steps: [step('text')] }), 1); // never "~0 min"
  assert.equal(minutes({ id: 'x', title: 'x', steps: [...Array(6)].map(() => step('cube')) }), 3); // 30 s per cube step
});

test('lessons: CFOP reducido gets a lesson per group in big phases, every case shown once', () => {
  const c = courseFor(cfopReduced.id)!;
  const cases = cfopReduced.phases.flatMap((p) => p.groups.flatMap((g) => g.cases));
  const shown = c.lessons.flatMap((l) => l.steps).filter((s) => s.kind === 'cube');
  assert.equal(shown.length, cases.length);
  for (const l of c.lessons) assert.ok(l.steps.filter((s) => s.kind === 'cube').length <= 8, l.id); // short lessons
  assert.equal(new Set(c.lessons.map((l) => l.id)).size, c.lessons.length); // ids unique (progress keys)
});

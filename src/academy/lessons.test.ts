import test from 'node:test';
import assert from 'node:assert/strict';
import { loc, t } from '../i18n.ts';
import { tokenize } from '../notation.ts';
import { beginner } from './beginner.ts';
import { cfopReduced } from './cfop.ts';
import { crossGuide } from './crossGuide.ts';
import { f2lAdvanced } from './f2lAdvanced.ts';
import { roux } from './roux.ts';
import { beginner2x2 } from './beginner2x2.ts';
import { ortega } from './ortega.ts';
import { caseChoices, commonName, courseFor, minutes, moveQuestion, nextLesson, parseDone, splitSteps, suggestedLesson } from './lessons.ts';
import { findCase } from './methods.ts';
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

test('lessons: case choices are at most 4, include the answer and keep the cyclic phase order from a random start', () => {
  const cases = [...'abcdef'].map((id) => ({ id }) as Case);
  assert.deepEqual(caseChoices(cases, 5, () => 0).map((c) => c.id), ['a', 'b', 'c', 'f']);
  assert.deepEqual(caseChoices(cases, 1, () => 0).map((c) => c.id), ['b', 'c', 'd', 'e']);
  assert.equal(caseChoices(cases.slice(0, 3), 0).length, 3);
  // the last case isn't always the last button
  assert.deepEqual(caseChoices(cases.slice(0, 4), 3, () => 0.3).map((c) => c.id), ['b', 'c', 'd', 'a']);
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
  assert.ok(shown.every((s) => s.kind === 'cube' && s.alg.endsWith("U U'")));
  // a phase taught step by step: its goal opens the lesson, its tips come right after the cases
  for (const [phase, l] of beginner.phases.map((p, i) => [p, prin.lessons[i + 1]] as const)) {
    assert.deepEqual(l.steps[0], { kind: 'text', text: loc(phase.goal!) }, l.id);
    const tips = l.steps.findIndex((s) => s.kind === 'text' && s.title === t('academy.tips'));
    assert.ok(tips > 0 && l.steps[tips - 1].kind === 'cube' && l.steps.slice(tips + 1).every((s) => s.kind === 'case'), l.id);
  }  // the 2x2's lessons play on a 2x2
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

test('lessons: a lesson with cases ends on their Quiz, under the id of a Quiz button in the Guía', () => {
  for (const m of [beginner, cfopReduced, f2lAdvanced, roux, beginner2x2, ortega]) {
    // the Guía's buttons (view.ts): one per group, one per phase of several groups
    const buttons = new Set(m.phases.flatMap((p) => [...p.groups.map((g) => g.id), ...(p.groups.length > 1 ? [p.id] : [])]));
    for (const l of courseFor(m.id)!.lessons) {
      const shown = l.steps.filter((s) => s.kind === 'cube').length;
      if (l.id === 'sostener' || !shown) { assert.equal(l.quiz, undefined, l.id); continue; }
      assert.ok(l.quiz && buttons.has(l.quiz.id), `${m.id}/${l.id}`); // the beginner's 'capa1' is no button's id
      assert.equal(l.quiz.cases.length, shown, l.id);
    }
  }
});

test('commonName: the names cubers learn (PLL, OCLL, 2-look OLL, OLL numbers, PBL), never another catalogue number', () => {
  const named = (id: string) => commonName(findCase(id)!);
  for (const id of ['cfopc-pll-t', 'cfopc-oll-27', 'cfop-oll-punto', 'cfopc-oll-45']) assert.ok(named(id), id);
  for (const id of ['cfop-f2l-a1', 'cfopc-f2l-01', 'coll-h-1']) assert.ok(!named(id), id);
});

test('lessons: a case question asks names only, and only when every choice has one; F2L asks nothing', () => {
  let asked = 0;
  for (const m of [beginner, cfopReduced, f2lAdvanced, roux, beginner2x2, ortega]) {
    const byId = new Map(m.phases.flatMap((p) => p.groups.flatMap((g) => g.cases)).map((c) => [c.id, c]));
    for (const s of courseFor(m.id)!.lessons.flatMap((l) => l.steps)) {
      if (s.kind !== 'case') continue;
      asked++;
      assert.ok(s.choices.length >= 2, s.caseId);
      assert.equal(new Set(s.choices.map((c) => c.label)).size, s.choices.length); // never two right answers
      s.choices.forEach((c) => assert.ok(commonName(byId.get(c.id)!) && c.label === byId.get(c.id)!.code, c.id));
    }
  }
  assert.ok(asked > 0);
  for (const l of courseFor(cfopReduced.id)!.lessons.filter((x) => x.quiz?.cases.some((c) => c.stage === 'f2l'))) {
    assert.ok(l.steps.every((s) => s.kind !== 'case'), l.id);
  }
});

test('suggestedLesson: the recent course first, then one started, then the cross; finished courses are skipped', () => {
  assert.equal(suggestedLesson([], {})!.course.id, 'cruz'); // a new user
  assert.equal(suggestedLesson(['cfop-completo'], {})!.course.id, 'cruz'); // a reference without lessons
  const first = suggestedLesson(['principiante'], {})!;
  assert.equal(first.course.id, 'principiante');
  assert.equal(first.lesson.id, first.course.lessons[0].id);
  assert.equal(suggestedLesson([], { notacion: ['x'] })!.course.id, 'notacion');
  const cross = courseFor('cruz')!.lessons.map((l) => l.id);
  assert.equal(suggestedLesson([], { cruz: cross })!.course.id, 'principiante'); // the cross done: the beginner's method next
  // a first-timer: the cross's basics, then the beginner's method, then the rest of the cross
  assert.equal(suggestedLesson([], { cruz: cross.slice(0, 1) })!.lesson.id, cross[1]);
  assert.equal(suggestedLesson([], { cruz: cross.slice(0, 2) })!.course.id, 'principiante');
  const beginnerAll = courseFor('principiante')!.lessons.map((l) => l.id);
  assert.equal(suggestedLesson(['principiante'], { cruz: cross.slice(0, 2), principiante: beginnerAll })!.lesson.id, cross[2]);
  // on another course: the whole cross, as before
  assert.equal(suggestedLesson(['cfop-reducido'], { cruz: cross.slice(0, 2), 'cfop-reducido': ['x'] })!.course.id, 'cfop-reducido');
  assert.equal(suggestedLesson([], { cruz: cross.slice(0, 2), 'cfop-reducido': courseFor('cfop-reducido')!.lessons.map((l) => l.id) })!.lesson.id, cross[2]);
  // a finished course hands over to its `next`: the beginner's method to CFOP reducido, the 2x2's to Ortega
  assert.equal(suggestedLesson([], { cruz: cross, principiante: beginnerAll })!.course.id, 'cfop-reducido');
  assert.equal(suggestedLesson(['principiante-2x2'], { 'principiante-2x2': courseFor('principiante-2x2')!.lessons.map((l) => l.id) })!.course.id, 'ortega');
});

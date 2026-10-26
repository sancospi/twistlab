// The lesson player and the lesson list. The player is a static card in index.html (#lesson), outside #mod-academy:
// pages are rebuilt there, and the one 3D player must never be re-attached. One step at a time with a progress bar,
// Anterior and Continuar, the step kept in the page's history entry (Back finds the lesson where it was left); cube
// steps let you watch it ("Cubo virtual") or do it ("Lo hago en mi cubo": followed move by move on a synced smart cube,
// else just the moves); questions answer on the spot. A finished lesson is remembered in this browser; a course's last
// one leads on to the lesson Hoy would suggest (suggestedLesson), usually the next course. A lesson with cases ends on
// their Quiz too ("Practicar estos casos"): only the Quiz makes a case known and brings it back in Hoy's review. The
// cross guide's lessons, which ask nothing, end on its trainer instead: checked practice with no smart cube needed.
import type { TwistyPlayer } from 'cubing/twisty';
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, YELLOW_UP, expand, explainMove, tokenize, unmapMove, type Frame } from '../notation.ts';
import { algView } from '../notation-view.ts';
import { prose } from '../rich-text-view.ts';
import { loc, t, tp } from '../i18n.ts';
import { guidePage, navigate, routePath } from '../router.ts';
import { FULL_MASK, MASKS, caseState } from './cube.ts';
import { caseDiagram } from './diagram.ts';
import { crossGuide } from './crossGuide.ts';
import { openCrossTrainer } from './crossTrainer.ts';
import { MAX_UNDO, REDO_MS, StepFollower } from './follow.ts';
import { minutes, nextLesson, parseDone, suggestedLesson, type Course, type Lesson, type LessonStep } from './lessons.ts';
import type { Stage } from './types.ts';
import { cube, type CubeListener } from './link.ts';
import { findCase } from './methods.ts';
import { aim, setPuzzle } from './practice.ts';
import { openQuiz } from './quiz.ts';
import { $, el } from '../el.ts';
import { load, save } from './store.ts';

const section = $('lesson');
const bar = $('lesson-progress') as HTMLProgressElement;
const stage = $('lesson-player');
const textBox = $('lesson-text');
const body = $('lesson-body');
const feedback = $('lesson-feedback'); // persistent live region: the step's content is rebuilt
const next = $('lesson-next') as HTMLButtonElement;
const prev = $('lesson-prev') as HTMLButtonElement;

const DONE_KEY = 'academy-lessons';
const puzzle = () => course.puzzle ?? '3x3x3';

const lessonPath = (course: string, id: string) => routePath({ mod: 'academy', page: { kind: 'lesson', course, id } });
const guidePath = (course: string) => routePath({ mod: 'academy', page: guidePage(course) });

const doneIn = (course: string): string[] => parseDone(load(DONE_KEY))[course] ?? [];
/** How many of a guide's lessons are finished (ids no longer in it don't count): "1/6 lecciones" on its tile. */
export function lessonsDone(course: string, lessons: { id: string }[]): number {
  const done = doneIn(course);
  return lessons.filter((l) => done.includes(l.id)).length;
}
function markDone(course: string, id: string) {
  const all = parseDone(load(DONE_KEY));
  all[course] = [...new Set([...(all[course] ?? []), id])];
  save(DONE_KEY, all);
}

// --- The list (view.ts shows it in place of the guide) ---

/** The guide's lessons under its title (and `intro`, what the guide puts first), the next one to do on top. */
export function lessonList(c: Course, ...intro: Node[]): HTMLElement {
  const done = doneIn(c.id);
  const rec = nextLesson(c.lessons, done);
  const items = c.lessons.map((l, i) => {
    const isDone = done.includes(l.id);
    const status = isDone ? t('lesson.done') : l === rec ? t('lesson.next') : '';
    return el('li', {}, el('a', { className: `lesson-item${l === rec ? ' recommended' : ''}${isDone ? ' done' : ''}`, href: lessonPath(c.id, l.id) },
      el('span', { className: 'lesson-num', ariaHidden: 'true', textContent: isDone ? '✓' : String(i + 1) }),
      el('span', { className: 'lesson-info' },
        el('strong', { textContent: l.title }),
        el('span', { className: 'hint', textContent: `${t('lesson.minutes', { n: minutes(l) })} · ${tp('lesson.steps', l.steps.length)}` })),
      ...(status ? [el('span', { className: 'lesson-status', textContent: status })] : [])));
  });
  return el('section', { className: 'lesson-list' },
    el('h2', { className: 'page-title', textContent: c.title }),
    ...intro,
    el('p', { className: 'hint', textContent: t('lesson.listIntro') }),
    lessonStart(c) ?? el('p', { className: 'hint', textContent: t('lesson.allDone') }),
    el('ol', { ariaLabel: t('lesson.lessons') }, ...items));
}

/** "Empezar: …" or "Seguir: …", the next lesson to do; null once they are all done. The guide's way in, in either view. */
export function lessonStart(c: Course): HTMLElement | null {
  const done = doneIn(c.id);
  const rec = nextLesson(c.lessons, done);
  return rec && el('div', { className: 'row' },
    el('a', { className: 'button primary', href: lessonPath(c.id, rec.id), textContent: t(done.length ? 'lesson.resume' : 'lesson.start', { title: rec.title }) }));
}

// --- The player ---

let kpuzzle: KPuzzle;
let course: Course;
let lesson: Lesson;
let index = 0;
// Per question step shown, its first answer: right or not, null while unanswered. Kept with the step in the history
// entry, so going back to a question or leaving and coming back never counts it twice.
let answers = new Map<number, boolean | null>();
let player: TwistyPlayer | null = null;
let autoplay = 0;
let follower: StepFollower | null = null;
let followed: string[] = []; // the tokens being followed on the cube
let redoUntil = 0;
// How the smart cube is held: slices and wide turns followed in earlier steps moved its centres, and the user keeps
// holding it as it is (Notación: r, then u). Anterior leaves it alone: going back a step doesn't turn the cube back.
let held: Frame = YELLOW_UP;
let onCube = false; // the last way picked: the next cube step starts with it
/** The synced smart cube, if the course is of its puzzle (it's a 3x3: a 2x2 course shows the moves only). */
const smart = () => (puzzle() === '3x3x3' ? cube.pattern() : null);

type Saved = { step?: number; answers?: [number, boolean | null][] } | null;

/** Shows the lesson in the static card, from the step its history entry was left at (else the first); view.ts has put
 *  the crumbs above it. */
export function playLesson(c: Course, l: Lesson, k: KPuzzle): void {
  // cubing/twisty when the first lesson with a 3D cube opens (one of text and questions never loads it): the card
  // shows once it's in, if the route is still this lesson's
  if (!player && l.steps.some((s) => s.kind === 'cube' || s.kind === 'move')) {
    stopLesson(); // not the last lesson's card meanwhile
    const at = location.href;
    return void import('cubing/twisty').then(({ TwistyPlayer }) => {
      player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'bottom-row', experimentalSetupAnchor: 'start', hintFacelets: 'none' });
      if (location.href === at) playLesson(c, l, k);
    });
  }
  kpuzzle = k;
  course = c;
  lesson = l;
  const saved = history.state as Saved;
  index = Math.min(saved?.step ?? 0, l.steps.length);
  answers = new Map(saved?.answers);
  // ponytail: a resumed lesson holds the smart cube yellow up; its grip after slices and wide turns (Notación) isn't
  // kept in the entry, save `held` there too if that bites
  held = YELLOW_UP;
  section.hidden = false;
  section.dataset.puzzle = puzzle(); // for the move tooltips
  $('lesson-title').textContent = l.title;
  show();
}

/** Leaving the lesson's route: hide the card and let go of the 3D player and the cube. */
export function stopLesson(): void {
  section.hidden = true;
  release();
}

function release() {
  clearTimeout(autoplay);
  player?.pause();
  follower = null;
  if (cube.listener === listener) cube.listener = null;
}

next.onclick = () => {
  index++;
  show();
};
prev.onclick = () => {
  index--;
  show();
};

// 1–4 answer a question (from a button too: "Ver otra vez" keeps focus); Enter = Continuar when focus isn't on a control.
section.addEventListener('keydown', (e) => {
  const on = (sel: string) => !!(e.target as Element).closest?.(sel);
  if (e.ctrlKey || e.metaKey || e.altKey || on('input, select, textarea, twisty-player')) return; // the player's own controls too
  if (/^[1-4]$/.test(e.key)) body.querySelectorAll<HTMLButtonElement>('.lesson-choices button:not(:disabled)')[Number(e.key) - 1]?.click();
  else if (e.key === 'Enter' && !next.hidden && !on('button, a, summary')) {
    e.preventDefault();
    next.click();
  }
});

function show() {
  release();
  const steps = lesson.steps;
  bar.max = steps.length;
  bar.value = Math.min(index + 1, steps.length); // step 1 of 3 fills a third, as "Paso 1 de 3" says
  $('lesson-count').textContent = index < steps.length ? t('lesson.step', { n: index + 1, total: steps.length }) : ''; // the end says it in its heading
  feedback.textContent = '';
  feedback.className = 'lesson-feedback';
  next.hidden = index >= steps.length;
  prev.hidden = index === 0 || index >= steps.length; // the end has its own way on
  if (index >= steps.length) finish();
  else {
    const s = steps[index];
    stage.hidden = s.kind !== 'cube' && s.kind !== 'move';
    if (s.kind === 'text') {
      textBox.replaceChildren(...heading(s.title), prose(s.text));
      body.replaceChildren();
    } else if (s.kind === 'cube') cubeStep(s);
    else if (s.kind === 'move') moveStep(s);
    else caseStep(s);
  }
  textBox.focus(); // read the new step first; Enter continues
  keep();
}

const keep = () => history.replaceState({ ...history.state, step: index, answers: [...answers] }, '');

const heading = (title?: string) => (title ? [el('h3', { textContent: title })] : []);

/** The 3D cube at `setup` (yellow up), ready to play `alg`; a case's stage: seen from its figure's corner. */
function cubeAt(setup: string, alg: string, mask = FULL_MASK[puzzle()], caseStage?: Stage) {
  stage.hidden = false; // before the player: a 3D view set up at zero size stays blank
  const p = player!; // playLesson loaded it
  if (!p.isConnected) stage.append(p);
  setPuzzle(p, puzzle());
  aim(p, kpuzzle, caseStage, tokenize(setup));
  p.experimentalSetupAlg = `z2 ${setup}`;
  p.alg = alg;
  p.experimentalStickeringMaskOrbits = mask;
  p.jumpToStart();
  return p;
}

function playOnce(delay = 0) {
  clearTimeout(autoplay);
  autoplay = window.setTimeout(() => {
    player!.jumpToStart();
    player!.play();
  }, delay);
}

// --- Cube steps: watch it or do it ---

function cubeStep(s: Extract<LessonStep, { kind: 'cube' }>) {
  textBox.replaceChildren(...heading(s.title), prose(s.text));
  cubeAt(s.setup, s.alg, s.stage ? MASKS[s.stage] : FULL_MASK[puzzle()], s.stage);
  const area = el('div', { className: 'lesson-do', ariaLive: 'polite' }); // the next move and corrections, as in practice
  const virtual = el('button', { type: 'button', textContent: t('lesson.virtual') });
  const mine = el('button', { type: 'button', textContent: t('lesson.onCube') });
  const pick = (b: HTMLButtonElement | null) => [virtual, mine].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  pick(null);
  const watch = (play: boolean, delay = 0) => {
    pick(virtual);
    onCube = false;
    stopFollowing();
    area.replaceChildren(el('p', { className: 'hint', textContent: t('lesson.virtualHint') }));
    if (play) playOnce(delay);
  };
  virtual.onclick = () => watch(true);
  mine.onclick = () => {
    pick(mine);
    onCube = true;
    clearTimeout(autoplay);
    player?.jumpToStart();
    doIt(s, area);
  };
  body.replaceChildren(el('div', { className: 'row lesson-ways', role: 'group', ariaLabel: t('lesson.how') }, virtual, mine), area);
  // a synced cube is followed right away; else it plays once, unless the system asks for less motion (the player's own
  // play button, or "Cubo virtual", still plays it at once). A case waits first: its "Reconocimiento" describes the
  // state before it's solved, so the learner sees that state while reading
  if (smart() || onCube) mine.click();
  else watch(!matchMedia('(prefers-reduced-motion: reduce)').matches, s.stage ? 1500 : 0);
}

function stopFollowing() {
  follower = null;
  if (cube.listener === listener) cube.listener = null;
}

/** "Lo hago en mi cubo": followed on a synced smart cube (from wherever it is now), else the moves and Continuar. */
function doIt(s: Extract<LessonStep, { kind: 'cube' }>, area: HTMLElement) {
  const setup = s.doSetup ? tokenize(s.setup) : [];
  followed = [...setup, ...tokenize(s.alg)];
  const parts = (mark?: (i: number) => string) => el('dl', {},
    ...(setup.length ? [el('dt', { textContent: t('lesson.setup') }), el('dd', {}, algView(setup, mark && { mark }))] : []),
    el('dt', { textContent: t(setup.length ? 'lesson.solution' : 'lesson.moves') }),
    el('dd', {}, algView(followed.slice(setup.length), mark && { mark: (i) => mark(i + setup.length) })));
  const steps = expand(followed, held).steps;
  const canFollow = steps.some((x) => x.moves.length); // just a rotation: the cube can't see those
  if (!smart() || !canFollow) {
    stopFollowing();
    if (canFollow && puzzle() === '3x3x3') { // not synced yet (or disconnected): follow once it syncs
      cube.listener = listener;
      renderFollow = () => void (cube.pattern() && doIt(s, area));
    }
    area.replaceChildren(el('p', { className: 'hint', textContent: t(setup.length ? 'lesson.doHintSetup' : 'lesson.doHint') }), parts());
    return;
  }
  follower = new StepFollower(steps);
  redoUntil = 0;
  cube.listener = listener;
  const moved = Object.entries(YELLOW_UP).some(([k, v]) => held[k as keyof Frame] !== v);
  const hint = t(setup.length ? 'lesson.followHintSetup' : moved ? 'lesson.followHintHeld' : 'lesson.followHint');
  renderFollow = () => {
    const f = follower;
    if (!f) return doIt(s, area); // the cube went away: back to the moves, until it syncs again
    if (f.done) {
      area.replaceChildren(parts(() => 'done'));
      return;
    }
    const i = f.index;
    const frame = expand(followed.slice(0, i), held).frame; // how the cube is held now
    const name = (m: string) => unmapMove(m, frame);
    const rotations: string[] = [];
    for (let j = i - 1; j >= 0 && !f.steps[j].moves.length; j--) rotations.unshift(f.steps[j].token);
    const undo = f.undo.reverse();
    const left = f.remaining();
    area.replaceChildren(
      el('p', { className: 'hint', textContent: hint }),
      ...(rotations.length ? [el('div', { className: 'rotate', textContent: t('practice.rotate', { rotation: rotations.join(' ') }) })] : []),
      el('div', { className: 'next', textContent: undo.length ? name(undo[0]) : f.steps[i].token }),
      el('div', { textContent: undo.length ? t('practice.wrong', { moves: undo.map(name).join(' ') })
        : performance.now() < redoUntil ? t('lesson.restart')
        : left.join(' ') !== f.steps[i].moves.join(' ') ? t('practice.left', { moves: left.map(name).join(' ') }) : '' }),
      parts((j) => (j < i ? 'done' : j === i ? 'current' : '')));
  };
  renderFollow();
}
let renderFollow = () => {};

const listener: CubeListener = {
  move(move) {
    const f = follower;
    if (!f || f.done) return;
    f.feed(move);
    if (f.undo.length > MAX_UNDO) {
      follower = new StepFollower(expand(followed, held).steps); // from wherever the cube is now
      redoUntil = performance.now() + REDO_MS;
    }
    renderFollow();
    if (follower?.done) {
      held = expand(followed, held).frame; // the next step goes on from this grip
      feedback.textContent = t('lesson.followDone');
      feedback.className = 'lesson-feedback ok';
      next.focus();
    }
  },
  sync() {
    if (!cube.pattern()) follower = null; // disconnected: renderFollow falls back to Continuar
    renderFollow(); // re-synced: the moves go on from the corrected state
  },
};

// --- Questions ---

/** Choice buttons; the first answer counts, and shows right/wrong on the spot. */
function choices(options: { label: string; right: boolean }[], wrongText: string): HTMLElement {
  const at = index;
  if (!answers.has(at)) answers.set(at, null);
  let answered = false;
  const buttons = options.map((o, i) => el('button', { type: 'button' }, el('kbd', { textContent: String(i + 1) }), o.label));
  buttons.forEach((b, i) => (b.onclick = () => {
    if (answered) return;
    answered = true;
    if (answers.get(at) === null) {
      answers.set(at, options[i].right);
      keep();
    }
    buttons.forEach((x, j) => {
      x.disabled = true;
      x.classList.toggle('right', options[j].right);
      x.classList.toggle('wrong', j === i && !options[j].right);
    });
    feedback.textContent = options[i].right ? t('quiz.correct') : wrongText;
    feedback.className = `lesson-feedback ${options[i].right ? 'ok' : 'bad'}`;
    next.focus();
  }));
  return el('div', { className: 'lesson-choices', role: 'group', ariaLabel: t('lesson.choices') }, ...buttons);
}

function moveStep(s: Extract<LessonStep, { kind: 'move' }>) {
  textBox.replaceChildren(el('h3', { textContent: t('lesson.whichMove') }), el('p', { className: 'hint', textContent: t('lesson.whichMoveHint') }));
  cubeAt('', s.move);
  playOnce(600); // the start first, then the move
  const { how } = explainMove(s.move);
  body.replaceChildren(
    el('div', { className: 'row' }, el('button', { type: 'button', textContent: t('lesson.replay'), onclick: () => playOnce() })),
    choices(s.choices.map((m) => ({ label: m, right: m === s.move })), t('lesson.wrongMove', { move: s.move, how })));
}

function caseStep(s: Extract<LessonStep, { kind: 'case' }>) {
  const pic = el('div', { className: 'quiz-diagram' });
  const q = s.title ?? t('quiz.question');
  pic.innerHTML = caseDiagram(s.diagram, s.stage, patternToFacelets(caseState(kpuzzle, s.alg, IDENTITY)), { size: 180, title: q });
  textBox.replaceChildren(el('h3', { textContent: q }), pic);
  const answer = s.choices.find((c) => c.id === s.caseId)!.label;
  // a miss says how to recognise it, as a wrong move says how it turns (the template ends the sentence; a few recognitions already do)
  const wrong = t('lesson.wrongCase', { name: answer, how: loc(findCase(s.caseId)!.recognition).replace(/\.$/, '') });
  const box = choices(s.choices.map((c) => ({ label: c.label, right: c.id === s.caseId })), wrong);
  box.classList.toggle('algs', !!s.title); // the labels are algorithms (lessons.ts caseQuestion)
  body.replaceChildren(box);
}

// --- The end ---

function finish() {
  markDone(course.id, lesson.id);
  stage.hidden = true;
  const i = course.lessons.indexOf(lesson);
  const after = course.lessons[i + 1];
  const right = [...answers.values()].filter(Boolean).length;
  textBox.replaceChildren(el('h3', { textContent: t('lesson.finished') }),
    ...(answers.size ? [el('p', { textContent: t('lesson.score', { right, n: answers.size }) })] : []));
  const back = el('button', { type: 'button', textContent: t('lesson.back'), onclick: () => navigate(guidePath(course.id)) });
  // the course's last lesson: on to the lesson Hoy would suggest now (its `next` course when this one is finished)
  const way = after ? { course, lesson: after } : suggestedLesson([course.id], parseDone(load(DONE_KEY)));
  const title = way && (way.course.id === course.id ? way.lesson.title : `${way.course.title}: ${way.lesson.title}`);
  const { quiz } = lesson;
  const practiceFirst = !!quiz && right < answers.size; // a question missed: practising the cases comes first
  body.replaceChildren(el('div', { className: 'row' },
    ...(quiz ? [el('button', { type: 'button', className: practiceFirst ? 'primary' : '', textContent: t('lesson.practice'),
      onclick: () => void openQuiz({ kind: 'cases', id: quiz.id, cases: quiz.cases, title: lesson.title }) })] : []),
    ...(way ? [el('button', { type: 'button', className: practiceFirst ? '' : 'primary', textContent: t('lesson.nextLesson', { title: title! }), onclick: () => navigate(lessonPath(way.course.id, way.lesson.id), true) })] : []), // Volver: still one Back to the guide
    // the cross lessons have no questions: their checked practice is the trainer (a secondary door, the next lesson leads)
    ...(course.id === crossGuide.id ? [el('button', { type: 'button', textContent: t('cross.open'), onclick: () => void openCrossTrainer() })] : []),
    back));
  if (!way && !practiceFirst) back.classList.add('primary');
}

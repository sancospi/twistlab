// Academia: a home of tiles (the white cross first, one per method, plus Notación and Gatillos), then each on its own route.
// A method page starts with the Quiz of the whole method (and how many cases are due today), then shows its phases
// and groups, each case as a card that opens its page (caseView.ts: Practicar, Quiz, Memoria muscular), with Quiz
// buttons per group and phase, plus the plan's own quizzes: the same Quiz, only the scope changes.
import { prose } from '../rich-text-view.ts';
import { TERMS } from '../terms.ts';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, formatAlg, tokenize } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { explainMove } from '../notation.ts';
import { algView } from '../notation-view.ts';
import type { MessageKey } from '../i18n.ts';
import { loc, t, tp } from '../i18n.ts';
import { goBack, guidePage, guideSegment, routePath, type AcademyPage, type GuidePage, type Trainer } from '../router.ts';
import { LL_STEPS, caseState } from './cube.ts';
import { crossGuide } from './crossGuide.ts';
import { guideSections, trainerButton } from './crossView.ts';
import { bases2x2 } from './bases2x2.ts';
import { triggerGuide } from './triggers.ts';
import { triggersView } from './triggerView.ts';
import { courseFor, MOVE_GROUPS, type Course } from './lessons.ts';
import { lessonList, playLesson, stopLesson } from './lessonView.ts';
import { libraryView, showCase, stopCase } from './caseView.ts';
import { caseDiagram, netSVG, twoSidesSVG } from './diagram.ts';
import { pllRecognitionView, stopPllRecognition } from './pllRecognition.ts';
import { aufTrainerView, stopAufTrainer } from './aufTrainer.ts';
import { lookaheadView, stopLookahead } from './lookahead.ts';
import { howToSolve } from './howToSolve.ts';
import { howToSections } from './howToView.ts';
import { dueCases, todayView } from './todayView.ts';
import { METHODS, allCases } from './methods.ts';
import { el } from './practice.ts';
import { caseLabel, lastResult, openQuiz, percent, scopeId, type QuizScope } from './quiz.ts';
import { caseProbability, formatProbability } from './probability.ts';
import { isDue, learningFor, preferred, save, setting, statsFor } from './store.ts';
import { puzzleOf, type Case, type Group, type Method, type Phase, type Puzzle } from './types.ts';
export { stopCase, stopLesson }; // for main.ts, which loads the academy with its first page

// The trainers' pages: their view and what stops them when they're left
const TRAINER_VIEWS: Record<Trainer, { view: (k: KPuzzle) => HTMLElement; stop: () => void }> = {
  'reconocer-pll': { view: pllRecognitionView, stop: stopPllRecognition },
  auf: { view: aufTrainerView, stop: stopAufTrainer },
  anticipacion: { view: lookaheadView, stop: stopLookahead },
};
/** Leaving a trainer's page (for main.ts too). */
export const stopTrainers = (): void => Object.values(TRAINER_VIEWS).forEach((x) => x.stop());

let kpuzzle: KPuzzle;

const academyLink = (page: AcademyPage) => routePath({ mod: 'academy', page });

/** Renders one Academia page; returns its title (for the document title), e.g. "CFOP reducido · Academia". */
export async function showAcademy(root: HTMLElement, page: AcademyPage): Promise<string> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  delete root.dataset.puzzle; // a 3x3 page, unless set below (the move tooltips read it)
  if (page.kind !== 'case') stopCase();
  stopTrainers(); // a trainer's page starts over too
  if (page.kind === 'trainer') {
    const title = t(`trainer.${page.id}.title`);
    root.replaceChildren(crumbs(title), TRAINER_VIEWS[page.id].view(kpuzzle));
    return inAcademy(title);
  }
  if (page.kind === 'lesson') return lessonPage(root, page.course, page.id);
  stopLesson();
  if (page.kind === 'case') return casePage(root, page.method, page.id);
  if (page.kind === 'library') {
    root.replaceChildren(libraryView(kpuzzle)); // a menu entry of its own: no Academia crumbs
    return t('library.title');
  }
  if (page.kind === 'today') {
    root.replaceChildren(await todayView()); // a menu entry of its own, like the library
    return t('today.title');
  }
  if (page.kind === 'home') {
    root.replaceChildren(homeView());
    return t('menu.academy');
  }
  if (page.kind === 'howto') {
    const sections = howToSections(kpuzzle);
    const nav = el('nav', { className: 'academy-nav', ariaLabel: loc(howToSolve.nav) },
      ...sections.map((s) => el('a', { href: `#${s.id}`, textContent: s.querySelector('h2')!.textContent! })));
    root.replaceChildren(crumbs(loc(howToSolve.name)), el('div', { className: 'academy-layout' }, nav, el('div', { className: 'academy-body' }, ...sections)));
    followPhase(root, nav);
    return loc(howToSolve.name); // its URL is outside /academia: "… · TwistLab", as seo.ts writes it
  }
  if (page.kind === 'triggers') {
    root.replaceChildren(crumbs(loc(triggerGuide.name)), triggersView(kpuzzle));
    return inAcademy(loc(triggerGuide.name));
  }
  // A guide with lessons can be read either way: "Ver como: Guía · Lecciones"
  const course = courseFor(guideSegment(page), (c) => preferred(c).alg);
  const asLessons = !!course && guideView() === 'lessons';
  const head = (title: string) => [crumbs(title), ...(course ? [viewSwitch(() => showAcademy(root, page))] : [])];
  if (page.kind === 'notation') {
    root.replaceChildren(...head(t('glossary.title')), asLessons ? lessonList(course) : notationView());
    return inAcademy(t('glossary.title'));
  }
  if (page.kind === 'cross' || page.kind === 'bases2x2') {
    const cross = page.kind === 'cross';
    if (!cross) root.dataset.puzzle = '2x2x2';
    const title = cross ? t('cross.title') : loc(bases2x2.name);
    if (asLessons) {
      root.replaceChildren(...head(title), ...(cross ? [trainerButton()] : []), lessonList(course));
      return inAcademy(title);
    }
    const sections = cross ? guideSections() : guideSections(bases2x2, '2x2x2');
    const nav = el('nav', { className: 'academy-nav', ariaLabel: t(cross ? 'cross.nav' : 'bases2x2.nav') },
      ...sections.map((s) => el('a', { href: `#${s.id}`, textContent: s.querySelector('h2')!.textContent! })));
    root.replaceChildren(...head(title),
      el('div', { className: 'academy-layout' }, nav, el('div', { className: 'academy-body' }, ...sections)));
    followPhase(root, nav);
    return inAcademy(title);
  }
  const m = METHODS.find((x) => x.id === page.id);
  if (!m) {
    root.replaceChildren(crumbs(t('academy.notFound')), text(t('academy.notFoundHint'), 'hint'));
    return inAcademy(t('academy.notFound'));
  }
  if (m.puzzle) root.dataset.puzzle = m.puzzle;
  if (asLessons) {
    root.replaceChildren(...head(loc(m.name)), ...methodTop(m), lessonList(course));
    return inAcademy(loc(m.name));
  }
  const nav = el('nav', { className: 'academy-nav', ariaLabel: t('academy.nav') }, ...navView(m));
  root.replaceChildren(...head(loc(m.name)),
    el('div', { className: 'academy-layout' }, nav, el('div', { className: 'academy-body' }, ...methodView(m))));
  followPhase(root, nav);
  return inAcademy(loc(m.name));
}

// --- Lessons: the switch on a guide page, and a lesson's own page (the player is lessonView.ts) ---

type GuideView = 'guide' | 'lessons';
const VIEW_KEY = 'academy-view'; // one choice for every guide: the way this person likes to learn
const guideView = () => setting<GuideView>(VIEW_KEY, 'guide', (v) => v === 'guide' || v === 'lessons');

function viewSwitch(redraw: () => Promise<unknown>): HTMLElement {
  const current = guideView();
  const option = (v: GuideView, label: string) => el('button', {
    type: 'button', textContent: label, ariaPressed: String(v === current),
    onclick: () => {
      if (v === current) return;
      save(VIEW_KEY, v);
      void redraw().then(() => document.querySelector<HTMLElement>('.view-switch [aria-pressed="true"]')?.focus());
    },
  });
  return el('div', { className: 'row view-switch', role: 'group', ariaLabel: t('lesson.viewAs') },
    el('span', { className: 'hint', ariaHidden: 'true', textContent: t('lesson.viewAs') }),
    option('guide', t('lesson.guide')), option('lessons', t('lesson.lessons')));
}

function lessonPage(root: HTMLElement, courseId: string, id: string): string {
  const course: Course | null = courseFor(courseId, (c) => preferred(c).alg);
  const lesson = course?.lessons.find((l) => l.id === id);
  if (!course || !lesson) {
    stopLesson();
    root.replaceChildren(crumbs(t('lesson.notFound')), text(t('lesson.notFoundHint'), 'hint'));
    return inAcademy(t('lesson.notFound'));
  }
  root.replaceChildren(crumbs(lesson.title, guidePage(courseId), course.title));
  playLesson(course, lesson, kpuzzle);
  return inAcademy(lesson.title);
}

/** A case's page (caseView.ts), under its method. */
function casePage(root: HTMLElement, methodId: string, id: string): string {
  const m = METHODS.find((x) => x.id === methodId);
  const c = m && allCases(m).find((x) => x.id === id);
  if (!m || !c) {
    stopCase();
    root.replaceChildren(crumbs(t('case.notFound')), text(t('case.notFoundHint'), 'hint'),
      el('p', {}, el('a', { href: academyLink({ kind: 'library' }), textContent: t('library.title') })));
    return inAcademy(t('case.notFound'));
  }
  root.dataset.puzzle = puzzleOf(c.stage);
  root.replaceChildren(crumbs(caseLabel(c), { kind: 'method', id: m.id }, loc(m.name)), showCase(m, c, kpuzzle));
  return t('app.pageTitle', { page: caseLabel(c), app: loc(m.name) }); // "Sune · OLL 27 · CFOP completo": OLL cases share names across methods (seo.ts)
}

const inAcademy = (page: string) => t('app.pageTitle', { page, app: t('menu.academy') }); // "CFOP reducido · Academia"

/** Marks the nav link of the phase being read (the pills on phones, the side list on wide screens). */
let phaseObserver: IntersectionObserver | null = null;
function followPhase(root: HTMLElement, nav: HTMLElement) {
  phaseObserver?.disconnect();
  const links = new Map([...nav.querySelectorAll<HTMLAnchorElement>(':scope > a')].map((a) => [a.hash.slice(1), a]));
  phaseObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a, id) => (id === e.target.id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
      const a = links.get(e.target.id);
      // phones: keep the pill in view by scrolling the row sideways only (never the page under the reader)
      if (a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    }
  }, { root: root.closest('.panel'), rootMargin: '-25% 0px -70% 0px' }); // "being read" = crossing the upper part
  root.querySelectorAll('.academy-phase').forEach((s) => phaseObserver!.observe(s));
}

/** Academia › (parent ›) current page, with the way back. */
const crumbs = (current: string, parent?: GuidePage, parentName = '') =>
  el('nav', { className: 'crumbs', ariaLabel: t('academy.crumbs') },
    // phones (and the installed app) have no browser Back: this one keeps the scroll of the page you came from
    el('button', { type: 'button', className: 'crumbs-back', textContent: `← ${t('academy.back')}`,
      onclick: () => goBack(academyLink(parent ?? { kind: 'home' })) }),
    el('a', { href: academyLink({ kind: 'home' }), textContent: t('menu.academy') }), ' › ',
    ...(parent ? [el('a', { href: academyLink(parent), textContent: parentName }), ' › '] : []),
    el('span', { ariaCurrent: 'page', textContent: current }));

// --- Home: one tile per method (what it covers, how far along you are), and the notation ---

function homeView(): HTMLElement {
  const tiles = (puzzle: Puzzle) => METHODS.filter((m) => (m.puzzle ?? '3x3x3') === puzzle).map((m) => {
    const cases = allCases(m);
    const practiced = cases.filter((c) => statsFor(c.id)).length;
    // a taste of each phase: its first case's diagram
    const strip = el('div', { className: 'tile-strip', ariaHidden: 'true' });
    strip.innerHTML = m.phases.map((phase) => {
      const c = phase.groups.flatMap((g) => g.cases)[0];
      if (!c) return ''; // a phase still being written
      return caseDiagram(phase.diagram, c.stage, patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), { size: 64 });
    }).join('');
    return el('a', { className: 'tile', href: academyLink({ kind: 'method', id: m.id }) },
      strip,
      el('strong', { textContent: loc(m.name) }),
      text(loc(m.summary ?? m.description), 'hint'),
      el('span', { className: 'tile-meta', textContent: [tp('academy.tilePhases', m.phases.length), tp('academy.tileCases', cases.length), tp('academy.tilePracticed', practiced)].join(' · ') }),
      ...(dueCount(cases) ? [el('span', { className: 'tile-meta tile-due', textContent: tp('srs.due', dueCount(cases)) })] : []));
  });
  const notation = el('a', { className: 'tile tile-notation', href: academyLink({ kind: 'notation' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: "R U R′ U′" }),
    el('strong', { textContent: t('glossary.title') }),
    text(t('glossary.tileSummary'), 'hint'),
    el('span', { className: 'tile-meta', textContent: t('glossary.tileMeta') }));
  const triggers = el('a', { className: 'tile', href: academyLink({ kind: 'triggers' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: "R′ F R F′" }),
    el('strong', { textContent: loc(triggerGuide.name) }),
    text(loc(triggerGuide.summary), 'hint'),
    el('span', { className: 'tile-meta', textContent: tp('triggers.tileCount', triggerGuide.triggers.length) }));
  // no smart cube: paint yours and get its solution (a page of the Cubo screen)
  const paint = el('a', { className: 'tile', href: routePath({ mod: 'cube', page: 'paint' }) },
    el('div', { className: 'tile-strip tile-net', ariaHidden: 'true', innerHTML: netSVG(patternToFacelets(kpuzzle.defaultPattern().applyAlg("R U F' L2"))) }),
    el('strong', { textContent: t('paint.seoTitle') }),
    text(t('paint.summary'), 'hint'),
    el('span', { className: 'tile-meta', textContent: t('paint.tileMeta') }));
  // the timer, named as people search for it
  const timer = el('a', { className: 'tile', href: routePath({ mod: 'solve' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: '0:12.34' }),
    el('strong', { textContent: t('solve.seoTitle') }),
    text(t('solve.tileSummary'), 'hint'));
  // the beginner's article (where searches for "how to solve a Rubik's cube" land): the whole method in one read
  const howto = el('a', { className: 'tile', href: academyLink({ kind: 'howto' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: '1 2 3 4 5 6 7' }),
    el('strong', { textContent: loc(howToSolve.name) }),
    text(loc(howToSolve.summary), 'hint'));
  // the cross comes first: it is the first step of CFOP and of most methods
  const cross = el('a', { className: 'tile', href: academyLink({ kind: 'cross' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: "R′ F R" }),
    el('span', { className: 'tile-badge', textContent: t('cross.firstStep') }),
    el('strong', { textContent: loc(crossGuide.name) }),
    text(loc(crossGuide.summary), 'hint'),
    el('span', { className: 'tile-meta', textContent: [tp('cross.tileLessons', crossGuide.lessons.length), tp('cross.tileLevels', crossGuide.levels.length)].join(' · ') }));
  // the 2x2 starts with its basics, as the 3x3 with the cross
  const basics = el('a', { className: 'tile', href: academyLink({ kind: 'bases2x2' }) },
    el('div', { className: 'tile-strip', ariaHidden: 'true', innerHTML: caseDiagram('iso', '2x2-pbl', patternToFacelets(kpuzzle.defaultPattern()), { size: 64 }) }),
    el('span', { className: 'tile-badge', textContent: t('cross.firstStep') }),
    el('strong', { textContent: loc(bases2x2.name) }),
    text(loc(bases2x2.summary), 'hint'),
    el('span', { className: 'tile-meta', textContent: tp('cross.tileLessons', bases2x2.lessons.length) }));
  // the trainers: one skill each, across methods
  const trainer = (id: Trainer, strip: HTMLElement) => el('a', { className: 'tile', href: academyLink({ kind: 'trainer', id }) },
    strip, el('strong', { textContent: t(`trainer.${id}.title`) }), text(t(`trainer.${id}.summary`), 'hint'));
  const tperm = patternToFacelets(caseState(kpuzzle, "R U R' U' R' F R2 U' R' U' R U R' F'", IDENTITY));
  const trainers = el('section', { className: 'academy-puzzle', ariaLabel: t('trainers.title') },
    el('h3', { textContent: t('trainers.title') }), el('div', { className: 'tiles' },
      trainer('reconocer-pll', el('div', { className: 'tile-strip', ariaHidden: 'true', innerHTML: twoSidesSVG(tperm, { size: 64 }) })),
      trainer('auf', el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: "U · U′ · U2" })),
      trainer('anticipacion', el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: '♩ ♩ ♩ ♩' }))));
  const group = (puzzle: Puzzle, ...items: HTMLElement[]) => el('section', { className: 'academy-puzzle', ariaLabel: t(`library.puzzle.${puzzle}`) },
    el('h3', { textContent: t(`library.puzzle.${puzzle}`) }), el('div', { className: 'tiles' }, ...items));
  // Hoy on top: the day's review and session (/hoy)
  const due = dueCases().length;
  const today = el('a', { className: 'tile tile-today', href: academyLink({ kind: 'today' }) },
    el('strong', { textContent: due ? tp('today.homeDue', due) : t('today.homeNone') }), text(t('today.homeHint'), 'hint'));
  return el('section', { className: 'academy-home' },
    el('h2', { textContent: t('menu.academy') }),
    text(t('academy.homeIntro'), 'prose hint'),
    today,
    group('3x3x3', howto, cross, ...tiles('3x3x3'), notation, triggers, paint, timer),
    group('2x2x2', basics, ...tiles('2x2x2')),
    trainers,
    el('p', { className: 'foot-link' }, el('a', { href: routePath({ mod: 'about' }), textContent: t('about.link') })));
}

// Section anchors for the side navigation (phase and group ids are unique across methods)
const anchor = (id: string) => `academy-${id}`;

/** Jump links within the method: each phase, and on wide screens its groups with their number of cases. */
function navView(m: Method): Node[] {
  return m.phases.flatMap((phase) => [
    el('a', { href: `#${anchor(phase.id)}`, textContent: loc(phase.name) }),
    el('ul', {}, ...phase.groups.map((g) => el('li', {}, el('a', { href: `#${anchor(g.id)}` },
      el('span', { textContent: loc(g.name) }), el('span', { textContent: String(g.cases.length) }))))),
  ]);
}

// --- Notation glossary: every kind of move (tappable, animated in a tooltip) and the plan's terms ---

const g = (key: string) => t(`glossary.${key}` as MessageKey);

function notationView(): HTMLElement {
  const moves = MOVE_GROUPS.map(({ key, bases }) => el('section', { className: 'academy-group glossary-group' },
    el('h3', { textContent: g(key) }),
    text(g(`${key}Note`), 'hint'),
    el('div', { className: 'glossary' }, ...bases.map((base) => {
      const { what } = explainMove(base);
      return el('div', { className: 'glossary-entry' }, algView([base, `${base}'`, `${base}2`]), el('span', { textContent: what }));
    }))));
  const terms = el('section', { className: 'academy-group glossary-group glossary-terms' },
    el('h3', { textContent: g('terms') }),
    el('dl', {}, ...TERMS.flatMap(({ key, example }) => [
      el('dt', { textContent: g(`term.${key}`) }),
      el('dd', {}, g(`def.${key}`), ...(example ? [' ', algView(example)] : [])),
    ])));
  return el('section', { className: 'academy-phase', id: anchor('notation') },
    el('h2', { textContent: g('title') }),
    text(g('intro'), 'prose hint'),
    el('div', { className: 'academy-groups' }, ...moves, terms));
}

const text = (s: string, className = '') => el('p', { textContent: s, className });

const dueCount = (cases: Case[]) => cases.filter((c) => isDue(learningFor(c.id), Date.now())).length;

/** The Quiz of the whole method (which cases: chosen in its setup), and how many are due today (refreshed when it closes). */
function trainView(m: Method): HTMLElement {
  const cases = allCases(m);
  const due = el('span', { className: 'tile-due' });
  const fill = () => (due.textContent = dueCount(cases) ? tp('srs.due', dueCount(cases)) : '');
  fill();
  const train = el('button', { type: 'button', className: 'primary', textContent: t('srs.train') });
  train.onclick = () => void openQuiz({ kind: 'cases', id: m.id, cases, title: loc(m.name) }, fill);
  return el('div', { className: 'academy-train' }, el('div', { className: 'row' }, train, due), text(t('srs.trainHint'), 'hint'));
}

/** Opens the quiz; shows the scope's last accuracy, refreshed when the quiz closes. */
function quizButton(label: string, scope: QuizScope, ariaLabel?: string) {
  const b = el('button', { type: 'button', className: 'small' });
  const fill = () => {
    const last = lastResult(scopeId(scope));
    const withLast = (s: string) => (last ? t('academy.quizLast', { label: s, pct: percent(last.accuracy) }) : s);
    b.textContent = withLast(label);
    if (ariaLabel) b.setAttribute('aria-label', withLast(ariaLabel));
  };
  fill();
  b.onclick = () => void openQuiz(scope, fill);
  return b;
}

function methodView(m: Method): Node[] {
  const about = el('details', { className: 'academy-about' },
    el('summary', { textContent: t('academy.about') }),
    prose(loc(m.description)),
    el('h3', { textContent: t('academy.orientation') }),
    prose(loc(m.orientation)),
    ...(m.notation ? [el('h3', { textContent: t('academy.notation') }), prose(loc(m.notation))] : []),
    ...(m.schedule ? [el('h3', { textContent: t('academy.schedule') }), prose(loc(m.schedule))] : []));
  return [...methodTop(m), about, ...m.phases.map(phaseView)];
}

/** The method's trainer and the link to the cross that comes before it: on top of the guide and of its lessons. */
const methodTop = (m: Method): HTMLElement[] => [
  ...(allCases(m).length ? [trainView(m)] : []),
  el('p', { className: 'hint' }, m.before ? el('a', { href: m.before.path, textContent: loc(m.before.label) })
    : m.puzzle === '2x2x2' ? el('a', { href: academyLink({ kind: 'bases2x2' }), textContent: t('bases2x2.before') })
    : el('a', { href: academyLink({ kind: 'cross' }), textContent: t('cross.before') })),
];

function phaseView(phase: Phase): HTMLElement {
  const cases = phase.groups.flatMap((g) => g.cases);
  // Two kinds of quiz, kept apart: generated (random states of every case, as many as you like) and the plan's own
  const set = (label: string, hint: string, ...buttons: HTMLElement[]) =>
    el('div', { className: 'quiz-set', role: 'group', ariaLabel: label }, el('span', { className: 'quiz-set-label', textContent: label, title: hint }), ...buttons);
  const quizzes = !cases.length ? [] : [el('div', { className: 'quiz-sets' },
    set(t('academy.quizGenerated'), t('academy.quizGeneratedHint'),
      quizButton(t('academy.quizPhase'), { kind: 'cases', id: phase.id, cases, title: loc(phase.name) }, t('academy.quizOf', { name: loc(phase.name) })),
      ...lastLayerButton(phase)),
    ...(phase.quizzes.length ? [set(t('academy.quizOfficial'), t('academy.quizOfficialHint'),
      ...phase.quizzes.map((quiz) => quizButton(loc(quiz.name), { kind: 'official', quiz, phase })))] : []))]; // none without cases
  return el('section', { className: 'academy-phase', id: anchor(phase.id) },
    el('h2', { textContent: loc(phase.name) }),
    ...(phase.goal ? [goalView(phase)] : []),
    // with a goal, the description is the lesson itself: full-size text, not a note
    ...(phase.description ? [prose(loc(phase.description), phase.goal ? 'prose' : 'prose hint')] : []),
    ...(phase.tips ? [el('details', { className: 'academy-tips' }, el('summary', { textContent: t('academy.tips') }), prose(loc(phase.tips)))] : []),
    ...(phase.progression ? [el('details', {}, el('summary', { textContent: t('academy.progression') }), prose(loc(phase.progression)))] : []),
    ...quizzes,
    el('div', { className: 'academy-groups' }, ...phase.groups.map((g) => groupView(phase, g))));
}

/** A phase's goal: what it leaves done, beside the cube as it ends up (masked as its cases: what doesn't matter yet, grey). */
function goalView(phase: Phase): HTMLElement {
  const shown = allCases(METHODS.find((x) => x.phases.includes(phase))!).find((c) => c.id === phase.goalFigure);
  const state = shown ? caseState(kpuzzle, shown.algs[0].alg, IDENTITY) : kpuzzle.defaultPattern();
  const figure = el('div', { className: 'phase-goal-figure', ariaHidden: 'true' });
  figure.innerHTML = caseDiagram(phase.diagram, phase.groups[0].cases[0].stage, patternToFacelets(state), { size: 84 });
  return el('div', { className: 'phase-goal' }, figure, prose(loc(phase.goal!)));
}

/** "Última capa completa" (OLL then PLL on random states), in the PLL phase of a method that has OLL and PLL. */
function lastLayerButton(phase: Phase): HTMLElement[] {
  const m = METHODS.find((x) => x.phases.includes(phase))!;
  const cases = allCases(m).filter((c) => LL_STEPS.includes(c.stage));
  if (!phase.groups.some((g) => g.cases.some((c) => c.stage === 'pll-edges')) || !cases.some((c) => c.stage.startsWith('oll'))) return [];
  const b = quizButton(t('ll.title'), { kind: 'll', id: `${m.id}:ll`, cases, title: `${t('ll.title')} · ${loc(m.name)}` });
  b.title = t('ll.hint');
  return [b];
}

function groupView(phase: Phase, g: Group): HTMLElement {
  const head = el('div', { className: 'academy-group-head' },
    el('h3', { textContent: loc(g.name) }),
    quizButton(t('academy.quiz'), { kind: 'cases', id: g.id, cases: g.cases, title: loc(g.name) }, t('academy.quizOf', { name: loc(g.name) })));
  return el('section', { className: 'academy-group', id: anchor(g.id) },
    head,
    ...(g.description ? [prose(loc(g.description), 'prose hint')] : []),
    el('div', { className: 'cards' }, ...g.cases.map((c) => card(phase, c))));
}

/** A case's card: opens its page, where it's practised. */
function card(phase: Phase, c: Case): HTMLAnchorElement {
  const m = METHODS.find((x) => x.phases.includes(phase))!;
  const link = el('a', { className: 'card', href: academyLink({ kind: 'case', method: m.id, id: c.id }) });
  const p = caseProbability(c.id, kpuzzle);
  const alg = preferred(c).alg;
  link.innerHTML = caseDiagram(phase.diagram, c.stage, patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), { size: 84, title: t('academy.diagram', { code: c.code }), arrows: true }); // the case, as its recognition reads
  const s = statsFor(c.id);
  link.append(
    el('strong', { textContent: c.code }),
    el('code', { textContent: formatAlg(tokenize(alg)) }),
    ...(p === null ? [] : [el('span', { className: 'hint', textContent: t('prob.card', { p: formatProbability(p) }) })]),
    el('span', { className: 'hint', textContent: s ? `${tp('academy.reps', s.reps)}${s.best === null ? '' : ` · ${t('academy.best', { time: formatTime(s.best) })}`}` : t('academy.notPracticed') }),
  );
  return link;
}

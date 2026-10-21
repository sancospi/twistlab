// Academia: a home of tiles (the white cross first, one per method, plus Notación), then each on its own route.
// A method page shows its phases and groups, each case as a card that opens its practice, with quiz buttons
// per group and phase, plus the plan's own quizzes.
import { prose } from '../rich-text-view.ts';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, formatAlg, tokenize } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { explainMove } from '../notation.ts';
import { algView } from '../notation-view.ts';
import type { MessageKey } from '../i18n.ts';
import { loc, t, tp } from '../i18n.ts';
import { routePath, type AcademyPage } from '../router.ts';
import { caseState } from './cube.ts';
import { crossGuide } from './crossGuide.ts';
import { crossSections } from './crossView.ts';
import { isoSVG, maskFor, topSVG } from './diagram.ts';
import { METHODS, allCases } from './methods.ts';
import { el, openPractice } from './practice.ts';
import { caseLabel, lastResult, openQuiz, percent, scopeId, type QuizScope } from './quiz.ts';
import { preferred, statsFor } from './store.ts';
import type { Case, Group, Method, Phase } from './types.ts';

let kpuzzle: KPuzzle;

const academyLink = (page: AcademyPage) => routePath({ mod: 'academy', page });

/** Renders one Academia page; returns its title (for the document title), e.g. "CFOP reducido · Academia". */
export async function showAcademy(root: HTMLElement, page: AcademyPage): Promise<string> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  if (page.kind === 'home') {
    root.replaceChildren(homeView());
    return t('menu.academy');
  }
  if (page.kind === 'notation') {
    root.replaceChildren(crumbs(t('glossary.title')), notationView());
    return inAcademy(t('glossary.title'));
  }
  if (page.kind === 'cross') {
    const sections = crossSections();
    const nav = el('nav', { className: 'academy-nav', ariaLabel: t('cross.nav') },
      ...sections.map((s) => el('a', { href: `#${s.id}`, textContent: s.querySelector('h2')!.textContent! })));
    root.replaceChildren(crumbs(t('cross.title')),
      el('div', { className: 'academy-layout' }, nav, el('div', { className: 'academy-body' }, ...sections)));
    followPhase(root, nav);
    return inAcademy(t('cross.title'));
  }
  const m = METHODS.find((x) => x.id === page.id);
  if (!m) {
    root.replaceChildren(crumbs(t('academy.notFound')), text(t('academy.notFoundHint'), 'hint'));
    return inAcademy(t('academy.notFound'));
  }
  const nav = el('nav', { className: 'academy-nav', ariaLabel: t('academy.nav') }, ...navView(m));
  root.replaceChildren(crumbs(loc(m.name)),
    el('div', { className: 'academy-layout' }, nav, el('div', { className: 'academy-body' }, ...methodView(m))));
  followPhase(root, nav);
  return inAcademy(loc(m.name));
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

/** Academia › current page, with the way back. */
const crumbs = (current: string) =>
  el('nav', { className: 'crumbs', ariaLabel: t('academy.crumbs') },
    el('a', { href: academyLink({ kind: 'home' }), textContent: t('menu.academy') }), ' › ',
    el('span', { ariaCurrent: 'page', textContent: current }));

// --- Home: one tile per method (what it covers, how far along you are), and the notation ---

function homeView(): HTMLElement {
  const tiles = METHODS.map((m) => {
    const cases = allCases(m);
    const practiced = cases.filter((c) => statsFor(c.id)).length;
    // a taste of each phase: its first case's diagram
    const strip = el('div', { className: 'tile-strip', ariaHidden: 'true' });
    strip.innerHTML = m.phases.map((phase) => {
      const c = phase.groups.flatMap((g) => g.cases)[0];
      if (!c) return ''; // a phase still being written
      const draw = phase.diagram === 'iso' ? isoSVG : topSVG;
      return draw(patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), maskFor(c.stage), { size: 64 });
    }).join('');
    return el('a', { className: 'tile', href: academyLink({ kind: 'method', id: m.id }) },
      strip,
      el('strong', { textContent: loc(m.name) }),
      text(loc(m.summary ?? m.description), 'hint'),
      el('span', { className: 'tile-meta', textContent: [tp('academy.tilePhases', m.phases.length), tp('academy.tileCases', cases.length), tp('academy.tilePracticed', practiced)].join(' · ') }));
  });
  const notation = el('a', { className: 'tile tile-notation', href: academyLink({ kind: 'notation' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: "R U R′ U′" }),
    el('strong', { textContent: t('glossary.title') }),
    text(t('glossary.tileSummary'), 'hint'),
    el('span', { className: 'tile-meta', textContent: t('glossary.tileMeta') }));
  // the cross comes first: it is the first step of CFOP and of most methods
  const cross = el('a', { className: 'tile', href: academyLink({ kind: 'cross' }) },
    el('div', { className: 'tile-strip tile-moves', ariaHidden: 'true', textContent: "R′ F R" }),
    el('span', { className: 'tile-badge', textContent: t('cross.firstStep') }),
    el('strong', { textContent: loc(crossGuide.name) }),
    text(loc(crossGuide.summary), 'hint'),
    el('span', { className: 'tile-meta', textContent: [tp('cross.tileLessons', crossGuide.lessons.length), tp('cross.tileLevels', crossGuide.levels.length)].join(' · ') }));
  return el('section', { className: 'academy-home' },
    el('h2', { textContent: t('menu.academy') }),
    text(t('academy.homeIntro'), 'prose hint'),
    el('div', { className: 'tiles' }, cross, ...tiles, notation));
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

const MOVE_GROUPS: { key: string; bases: string[] }[] = [
  { key: 'faces', bases: ['U', 'D', 'R', 'L', 'F', 'B'] },
  { key: 'wide', bases: ['r', 'l', 'u', 'd', 'f', 'b'] },
  { key: 'slices', bases: ['M', 'E', 'S'] },
  { key: 'rotations', bases: ['x', 'y', 'z'] },
];
const TERMS: { key: string; example?: string }[] = [
  { key: 'auf', example: "U U' U2" }, { key: 'trigger', example: "R U R' U'" }, { key: 'setup' }, { key: 'planB' },
  { key: 'htm' }, { key: 'cross' }, { key: 'slot' }, { key: 'f2l' }, { key: 'oll' }, { key: 'pll' }, { key: 'headlights' }, { key: 'inspection' },
];
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
  const before = el('p', { className: 'hint' }, el('a', { href: academyLink({ kind: 'cross' }), textContent: t('cross.before') }));
  return [before, about, ...m.phases.map(phaseView)];
}

function phaseView(phase: Phase): HTMLElement {
  const cases = phase.groups.flatMap((g) => g.cases);
  // Two kinds of quiz, kept apart: generated (random states of every case, as many as you like) and the plan's own
  const set = (label: string, hint: string, ...buttons: HTMLElement[]) =>
    el('div', { className: 'quiz-set', role: 'group', ariaLabel: label }, el('span', { className: 'quiz-set-label', textContent: label, title: hint }), ...buttons);
  const quizzes = !cases.length ? [] : [el('div', { className: 'quiz-sets' },
    set(t('academy.quizGenerated'), t('academy.quizGeneratedHint'),
      quizButton(t('academy.quizPhase'), { kind: 'cases', id: phase.id, cases, title: loc(phase.name) })),
    ...(phase.quizzes.length ? [set(t('academy.quizOfficial'), t('academy.quizOfficialHint'),
      ...phase.quizzes.map((quiz) => quizButton(loc(quiz.name), { kind: 'official', quiz, phase })))] : []))]; // none without cases
  return el('section', { className: 'academy-phase', id: anchor(phase.id) },
    el('h2', { textContent: loc(phase.name) }),
    ...(phase.description ? [prose(loc(phase.description), 'prose hint')] : []),
    ...(phase.progression ? [el('details', {}, el('summary', { textContent: t('academy.progression') }), prose(loc(phase.progression)))] : []),
    ...quizzes,
    el('div', { className: 'academy-groups' }, ...phase.groups.map((g) => groupView(phase, g))));
}

function groupView(phase: Phase, g: Group): HTMLElement {
  const head = el('div', { className: 'academy-group-head' },
    el('h3', { textContent: loc(g.name) }),
    quizButton(t('academy.quiz'), { kind: 'cases', id: g.id, cases: g.cases, title: loc(g.name) }, t('academy.quizOf', { name: loc(g.name) })));
  return el('section', { className: 'academy-group', id: anchor(g.id) },
    head,
    ...(g.description ? [prose(loc(g.description), 'prose hint')] : []),
    el('div', { className: 'cards' }, ...g.cases.map((c) => card(phase, g, c))));
}

function card(phase: Phase, g: Group, c: Case): HTMLButtonElement {
  const button = el('button', { type: 'button', className: 'card' });
  const fill = () => {
    const alg = preferred(c).alg;
    const facelets = patternToFacelets(caseState(kpuzzle, alg, IDENTITY));
    const draw = phase.diagram === 'iso' ? isoSVG : topSVG;
    const mask = maskFor(c.stage);
    button.innerHTML = draw(facelets, mask, { size: 84, title: t('academy.diagram', { code: c.code }), arrows: mask === 'pll' });
    const s = statsFor(c.id);
    button.append(
      el('strong', { textContent: c.code }),
      el('code', { textContent: formatAlg(tokenize(alg)) }),
      el('span', { className: 'hint', textContent: s ? `${tp('academy.reps', s.reps)}${s.best === null ? '' : ` · ${t('academy.best', { time: formatTime(s.best) })}`}` : t('academy.notPracticed') }),
    );
  };
  fill();
  // Quiz of this one case: many random states of it, answered among its group's cases.
  const quiz = () => void openQuiz({ kind: 'cases', id: c.id, cases: [c], answers: g.cases, title: caseLabel(c) }, fill);
  button.onclick = () => void openPractice(c, fill, quiz);
  return button;
}

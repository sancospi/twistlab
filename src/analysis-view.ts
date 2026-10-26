// Solve analysis on screen (solve-analysis.ts): one solve's timeline and table (the Resolver, after a solve with the
// smart cube) and the means of the latest ones (Progreso). Loaded only when there's one to show.
import { loc, t, tp, type MessageKey } from './i18n.ts';
import { el } from './el.ts';
import { learningFor, load, save, statsFor } from './academy/store.ts';
import { cfopReduced } from './academy/cfop.ts';
import { cfopFull } from './academy/cfopFull.ts';
import { allCases } from './academy/methods.ts';
import { routePath } from './router.ts';
import { formatTime, type Result } from './timer.ts';
import { algView } from './notation-view.ts';
import {
  ANALYSIS_KEY, GROUP_OF, LAST, SLOWEST, addAnalysis, analyseSolve, lessonsOf, parseAnalyses, stepsOf, summarize, type Analysis,
  type Lesson, type Step, type Summary,
} from './solve-analysis.ts';
import type { Case } from './academy/types.ts';

/** Cross and two-look lessons are shown only if they cost at least this much (pauses have their own floors, solve-analysis.ts). */
const SHOW_MS = 500;

// the cases a solve can meet: full OLL and PLL, or the reduced CFOP's 2-look halves (solve-analysis.ts)
const CASES = new Map([cfopFull, cfopReduced].flatMap((m) => allCases(m).map((c) => [c.id, { c, method: m.id }] as const)));
const caseLink = (id: string) => {
  const k = CASES.get(id);
  return k ? el('a', { href: routePath({ mod: 'academy', page: { kind: 'case', method: k.method, id } }), textContent: loc(k.c.name) }) : id;
};
const secs = (ms: number) => formatTime(Math.round(ms));
const secs1 = (ms: number) => (ms / 1000).toFixed(1); // an estimate: hundredths would be false precision
const tps = (moves: number, ms: number) => (ms > 0 ? (moves / (ms / 1000)).toFixed(1) : '–');
const stepName = (s: Step) => t(`analysis.step.${s.key}`);
/** Cases met in the solves that the user practises in the Academia (a learner's 2-look cases aren't theirs yet). */
const practised = (id: string) => !!(learningFor(id) || statsFor(id));

/** Analyses a solve that ended solved (moves in the cube's frame, times in ms since the start), stores it and returns its view. */
export async function recordSolve(at: number, moves: string[], times: number[]): Promise<HTMLElement[]> {
  const { cube3x3x3 } = await import('cubing/puzzles');
  const kpuzzle = await cube3x3x3.kpuzzle();
  const a = analyseSolve(kpuzzle, at, moves, times);
  if (a.s[4] === a.s[0]) return []; // no F2L pair took a move: not CFOP (or a scramble that left F2L whole), the split means nothing
  const prev = parseAnalyses(load(ANALYSIS_KEY));
  save(ANALYSIS_KEY, addAnalysis(prev, a));
  // one lesson, the costliest worth saying (above the table: on a phone it'd be out of sight below it)
  const lesson = lessonsOf(kpuzzle, a).find((l) => worthSaying(l, a, prev));
  return [el('h3', { textContent: t('analysis.title') }), el('p', { className: 'hint', textContent: t(`analysis.cross.${a.c}`) }),
    ...(lesson ? [lessonView(a, lesson)] : []), ...stepsView(stepsOf(a), { oll: a.o2 ? [a.o2[0], a.o2[1]] : a.oll, pll: a.p2 ? [a.p2[0], a.p2[1]] : a.pll })];
}

/** A stored solve's analysis (the Resolver's sheet of a time): its timeline and table; none if it wasn't analysed. */
export function analysisOf(at: number): HTMLElement[] {
  const a = parseAnalyses(load(ANALYSIS_KEY)).find((x) => x.at === at);
  return a ? [el('h3', { textContent: t('analysis.title') }), el('p', { className: 'hint', textContent: t(`analysis.cross.${a.c}`) }),
    ...stepsView(stepsOf(a), { oll: a.o2 ? [a.o2[0], a.o2[1]] : a.oll, pll: a.p2 ? [a.p2[0], a.p2[1]] : a.pll })] : [];
}

/** A two-look of a case not practised yet is the method being learnt, not a mistake (the Academia: solve it in two
 *  steps until you know it); a long cross only when it's longer than the user's usual one, else it'd be every solve. */
function worthSaying(l: Lesson, a: Analysis, prev: Analysis[]): boolean {
  if (l.save < SHOW_MS) return false;
  if (l.kind === 'two-look') return practised(a[l.step]!);
  if (l.kind === 'cross') return !prev.length || stepsOf(a)[0].moves > summarize(prev.slice(0, LAST)).steps[0].moves;
  return true;
}

/** The lesson in a line, with where to practise it: the cross guide, the case's page or a trainer (links: in the
 *  Resolver the cube drives the timer, and it names moves white up). */
function lessonView(a: Analysis, l: Lesson): HTMLElement {
  const saved = t('analysis.save', { s: secs1(l.save) });
  const link = (page: Parameters<typeof routePath>[0], text: string) => el('a', { className: 'button', href: routePath(page), textContent: text });
  if (l.kind === 'cross') {
    // the white cross as the Academia holds it, yellow up; any other white up, a side one after its rotation
    const hold = { up: t(a.c === 'U' ? 'paint.color.U' : 'paint.color.D'), front: t('paint.color.F') };
    return el('p', {}, `${tp('analysis.crossExtra', l.extra)} ${tp('cross.optimalIs', l.alg.length)}. ${saved} ${t('analysis.crossHold', hold)} `,
      algView([l.rot, ...l.alg].filter(Boolean), { frame: a.c === 'U' ? 'yellow-up' : 'white-up' }), ' ',
      link({ mod: 'academy', page: { kind: 'cross' } }, t('analysis.crossTrain')));
  }
  if (l.kind === 'two-look') return el('p', {}, `${t(`analysis.twoLook.${l.step}`)} `, caseLink(a[l.step]!), `. ${saved}`);
  const trainer = l.step === 'f2l' ? 'anticipacion' : 'reconocer-pll';
  return el('p', {}, `${t(`analysis.pause.${l.step}`, { s: secs1(l.save) })} `, link({ mod: 'academy', page: { kind: 'trainer', id: trainer } }, t(`trainer.${trainer}.title`)));
}

/** The timeline (each step's width its time, the recognition lighter) and the table; cases link to their pages. */
function stepsView(steps: Step[], cases: { oll?: string | string[]; pll?: string | string[] } = {}, decimals = 0): HTMLElement[] {
  const total = steps.reduce((n, s) => n + s.ms, 0);
  const bar = el('div', { className: 'analysis-bar', ariaHidden: 'true' }, // the table says the same
    ...steps.filter((s) => s.ms > 0).map((s) => {
      const seg = el('span', { className: GROUP_OF[s.key], title: stepName(s) });
      seg.style.flexGrow = String(s.ms);
      seg.style.setProperty('--r', `${Math.round((100 * s.recog) / s.ms)}%`);
      return seg;
    }));
  const cell = (tag: 'th' | 'td', ...c: (Node | string)[]) => el(tag, {}, ...c);
  const moves = (n: number) => n.toFixed(decimals);
  const row = (s: Step) => {
    const ids = [s.key === 'oll' ? cases.oll : s.key === 'pll' ? cases.pll : undefined].flat().filter((x) => x !== undefined); // two: 2-look
    const name = el('th', { scope: 'row' }, stepName(s), ...ids.flatMap((id, i) => [i ? ' + ' : ' · ', caseLink(id)]));
    return el('tr', { className: GROUP_OF[s.key] }, name, cell('td', s.ms ? secs(s.ms) : '–'), cell('td', moves(s.moves)), cell('td', tps(s.moves, s.ms)),
      cell('td', s.ms ? secs(s.recog) : '–'), cell('td', s.ms ? secs(s.ms - s.recog) : '–'));
  };
  const all = steps.reduce((n, s) => n + s.moves, 0);
  const table = el('table', { className: 'quiz-table analysis-table' },
    el('thead', {}, el('tr', {}, ...['', 'analysis.time', 'analysis.moves', 'TPS', 'analysis.recog', 'analysis.exec'].map((k) =>
      el('th', { scope: 'col', textContent: k.startsWith('analysis.') ? t(k as MessageKey) : k })))),
    el('tbody', {}, ...steps.map(row)),
    el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', textContent: t('analysis.total') }), cell('td', secs(total)), cell('td', moves(all)), cell('td', tps(all, total)),
      cell('td', secs(steps.reduce((n, s) => n + s.recog, 0))), cell('td', secs(steps.reduce((n, s) => n + s.ms - s.recog, 0))))));
  return [bar, el('div', { className: 'table-scroll' }, table), el('p', { className: 'hint', textContent: t('analysis.hint') })];
}

/** Progreso: the means of the latest analyses, where the most time goes over a typical split, the slowest cases. */
export function analysisSection(results: Result[]): HTMLElement {
  // only solves still in the times and not DNF: a deleted one or a DNF stops counting (its analysis stays stored, capped)
  const kept = new Set(results.flatMap((r) => (r.penalty === 'DNF' ? [] : [r.at])));
  const list = parseAnalyses(load(ANALYSIS_KEY)).filter((a) => kept.has(a.at)).slice(0, LAST);
  const box = el('section', { className: 'cube-block analysis' }, el('h3', { textContent: t('analysis.progressTitle') }));
  if (!list.length) return box.append(el('p', { className: 'hint', textContent: t('analysis.empty') })), box;
  const s = summarize(list);
  const worst = s.groups.reduce((a, b) => (b.over > a.over ? b : a));
  box.append(el('p', { className: 'hint', textContent: t('analysis.over', { n: s.n }) }), ...stepsView(s.steps, {}, 1));
  if (worst.over > 0) {
    box.append(el('p', {}, el('strong', { textContent: t('analysis.worst', { step: t(`analysis.group.${worst.group}`), over: secs(worst.over), recog: secs(worst.recog) }) })));
  }
  if (s.cases.length) {
    const slow = s.cases.slice(0, SLOWEST);
    box.append(el('h4', { textContent: t('analysis.cases') }),
      el('ol', { className: 'analysis-cases' }, ...slow.map((c) =>
        el('li', {}, caseLink(c.id), ` · ${secs(c.ms)} · ${t('analysis.casePause', { s: secs(c.recog) })} (×${c.n})`))));
    const quiz = slowQuiz(slow);
    if (quiz) box.append(quiz.button);
  }
  return box;
}

/** Of the slowest cases, the ones already practised in the Academia (a 2-look learner's: the reduced CFOP's), and a
 *  button for their quiz (Progreso, Hoy); null without any. */
export function slowQuiz(slow: Summary['cases'], onDone?: () => void): { cases: Case[]; button: HTMLElement } | null {
  const cases = slow.slice(0, SLOWEST).flatMap((c) => (practised(c.id) && CASES.get(c.id)?.c) || []);
  if (!cases.length) return null;
  const button = el('button', {
    type: 'button', className: 'primary', textContent: t('academy.quiz'),
    // still on that screen once quiz.ts is loaded (ponytail: not re-checked across openQuiz's own first kpuzzle load)
    onclick: () => void import('./academy/quiz.ts').then((m) => {
      if (button.isConnected && !button.closest('[hidden]')) void m.openQuiz({ kind: 'cases', id: 'analysis-slow', cases, title: t('analysis.cases') }, onDone);
    }),
  });
  return { cases, button };
}

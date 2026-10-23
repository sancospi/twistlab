// Solve analysis on screen (solve-analysis.ts): one solve's timeline and table (the Resolver, after a solve with the
// smart cube) and the means of the latest ones (Progreso). Loaded only when there's one to show.
import { loc, t, type MessageKey } from './i18n.ts';
import { el } from './el.ts';
import { load, save } from './academy/store.ts';
import { cfopFull } from './academy/cfopFull.ts';
import { allCases } from './academy/methods.ts';
import { routePath } from './router.ts';
import { formatTime, type Result } from './timer.ts';
import { ANALYSIS_KEY, GROUP_OF, addAnalysis, analyseSolve, parseAnalyses, stepsOf, summarize, type Step } from './solve-analysis.ts';

/** Progreso's means are over these many latest analyses. */
const LAST = 50;

const CASES = new Map(allCases(cfopFull).map((c) => [c.id, c]));
const caseLink = (id: string) => {
  const c = CASES.get(id);
  return c ? el('a', { href: routePath({ mod: 'academy', page: { kind: 'case', method: cfopFull.id, id } }), textContent: loc(c.name) }) : id;
};
const secs = (ms: number) => formatTime(Math.round(ms));
const tps = (moves: number, ms: number) => (ms > 0 ? (moves / (ms / 1000)).toFixed(1) : '–');
const stepName = (s: Step) => t(`analysis.step.${s.key}` as MessageKey);

/** Analyses a solve that ended solved (moves in the cube's frame, times in ms since the start), stores it and returns its view. */
export async function recordSolve(at: number, moves: string[], times: number[]): Promise<HTMLElement[]> {
  const { cube3x3x3 } = await import('cubing/puzzles');
  const a = analyseSolve(await cube3x3x3.kpuzzle(), at, moves, times);
  if (a.s[4] === a.s[0]) return []; // no F2L pair took a move: not CFOP (or a scramble that left F2L whole), the split means nothing
  save(ANALYSIS_KEY, addAnalysis(parseAnalyses(load(ANALYSIS_KEY)), a));
  return [el('h3', { textContent: t('analysis.title') }), el('p', { className: 'hint', textContent: t(`analysis.cross.${a.c}` as MessageKey) }),
    ...stepsView(stepsOf(a), { oll: a.oll, pll: a.pll })];
}

/** The timeline (each step's width its time, the recognition lighter) and the table; cases link to their pages. */
function stepsView(steps: Step[], cases: { oll?: string; pll?: string } = {}, decimals = 0): HTMLElement[] {
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
    const id = s.key === 'oll' ? cases.oll : s.key === 'pll' ? cases.pll : undefined;
    const name = el('th', { scope: 'row' }, stepName(s), ...(id ? [' · ', caseLink(id)] : []));
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
    box.append(el('p', {}, el('strong', { textContent: t('analysis.worst', { step: t(`analysis.group.${worst.group}` as MessageKey), over: secs(worst.over), recog: secs(worst.recog) }) })));
  }
  if (s.cases.length) {
    box.append(el('h4', { textContent: t('analysis.cases') }),
      el('ol', { className: 'analysis-cases' }, ...s.cases.slice(0, 5).map((c) => el('li', {}, caseLink(c.id), ` · ${secs(c.ms)} (×${c.n})`))));
  }
  return box;
}

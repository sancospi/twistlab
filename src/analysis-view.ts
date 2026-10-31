// Solve analysis on screen (solve-analysis.ts): one solve's timeline, table and reconstruction (the Resolver, after a
// solve with the smart cube, and a time's sheet) and the means of the latest ones (Progreso). Loaded only when there's
// one to show.
import { loc, t, tp, type MessageKey } from './i18n.ts';
import { el } from './el.ts';
import { learningFor, load, preferred, save, statsFor } from './academy/store.ts';
import { cfopReduced } from './academy/cfop.ts';
import { cfopFull } from './academy/cfopFull.ts';
import { allCases } from './academy/methods.ts';
import { routePath } from './router.ts';
import { formatTime, type Result } from './timer.ts';
import { algView } from './notation-view.ts';
import { YELLOW_UP, invertTokens, unmapMove, type Face } from './notation.ts';
import {
  ANALYSIS_KEY, GROUP_OF, LAST, SLOWEST, STEPS, addAnalysis, analyseSolve, extrasOf, lessonsOf, parseAnalyses, reconstruction, stepsOf,
  summarize, type Analysis, type Lesson, type Step, type Summary,
} from './solve-analysis.ts';
import type { KPuzzle } from 'cubing/kpuzzle';
import type { TwistyPlayer } from 'cubing/twisty';
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

const kpuzzle = async () => (await import('cubing/puzzles')).cube3x3x3.kpuzzle();

/** Analyses a solve that ended solved (moves in the cube's frame, times in ms since the start), stores it and returns its view. */
export async function recordSolve(at: number, moves: string[], times: number[]): Promise<HTMLElement[]> {
  const kp = await kpuzzle();
  const a = analyseSolve(kp, at, moves, times);
  if (a.s[4] === a.s[0]) return []; // no F2L pair took a move: not CFOP (or a scramble that left F2L whole), the split means nothing
  const prev = parseAnalyses(load(ANALYSIS_KEY));
  save(ANALYSIS_KEY, addAnalysis(prev, a));
  // one lesson, the costliest worth saying (above the table: on a phone it'd be out of sight below it)
  return solveView(kp, a, lessonsOf(kp, a).find((l) => worthSaying(l, a, prev)));
}

/** A stored solve's analysis (the Resolver's sheet of a time); none if it wasn't analysed. */
export async function analysisOf(at: number): Promise<HTMLElement[]> {
  const a = parseAnalyses(load(ANALYSIS_KEY)).find((x) => x.at === at);
  return a ? solveView(await kpuzzle(), a) : [];
}

/** One solve's analysis: its cross, a lesson, the timeline and the table with the turns over each step's reference
 *  (the user's algorithm for a case: the one chosen in the Academia, now), and its reconstruction. */
function solveView(kp: KPuzzle, a: Analysis, lesson?: Lesson): HTMLElement[] {
  const steps = stepsOf(a);
  return [el('h3', { textContent: t('analysis.title') }), el('p', { className: 'hint', textContent: t(`analysis.cross.${a.c}`) }),
    ...(lesson ? [lessonView(a, lesson)] : []),
    ...stepsView(steps, { oll: a.o2 ? [a.o2[0], a.o2[1]] : a.oll, pll: a.p2 ? [a.p2[0], a.p2[1]] : a.pll }, 0, extrasOf(kp, a, (c) => preferred(c).alg)),
    reconstructionView(a, steps)];
}

/** The reconstruction, folded: each step's turns held with its cross down, and a 3D cube (cubing/twisty, built when
 *  first opened) that shows the whole solve or plays a step, at the pace its turns were made (from its first turn to
 *  its last: the pauses before the steps are the table's); its controls step through it move by move. */
function reconstructionView(a: Analysis, steps: Step[]): HTMLElement {
  const r = reconstruction(a);
  const all = r.steps.flat();
  const starts = r.steps.map((_, k) => r.steps.slice(0, k).reduce((n, s) => n + s.length, 0));
  // turns a second while turning, the cube's tempo: a cubing.js quarter turn takes 1 s at tempo 1 (a half one 1.5 s: a
  // bit slower); a step of one turn has no such time, the whole solve's goes
  const turning = (sel: Step[]) => {
    const ms = sel.reduce((n, s) => n + s.ms - s.recog, 0);
    return ms > 0 ? sel.reduce((n, s) => n + s.moves, 0) / (ms / 1000) : 0;
  };
  const pace = (k0: number, k1: number) => Math.max(1, turning(steps.slice(k0, k1)) || turning(steps));
  const box = el('div', { className: 'recon-player' });
  let player: TwistyPlayer | undefined;
  /** Steps k0..k1 (left out) on the cube from where they began; `play`: played, else at their start. */
  const show = async (k0: number, k1: number, play: boolean) => {
    const { TwistyPlayer } = await import('cubing/twisty');
    player ??= box.appendChild(new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'bottom-row', experimentalSetupAnchor: 'start', hintFacelets: 'none' }));
    player.experimentalSetupAlg = [r.rot, ...invertTokens(all.slice(starts[k0]))].join(' ');
    player.alg = all.slice(starts[k0], starts[k1 - 1] + r.steps[k1 - 1].length).join(' ');
    player.tempoScale = pace(k0, k1);
    player.jumpToStart();
    if (play) player.play();
  };
  // a center's color as the Academia names it (paint.color.*: yellow up, green front)
  const color = (place: Face) => t(`paint.color.${unmapMove(r.frame[place], YELLOW_UP) as Face}`);
  const frame = a.c === 'U' ? 'yellow-up' : 'white-up'; // the move tooltips' cube, as the cross lesson's
  const fold = el('details', { className: 'recon' }, el('summary', { textContent: t('analysis.recon') }),
    el('p', { className: 'hint', textContent: t('analysis.reconHold', { up: color('U'), front: color('F') }) }), box,
    el('ul', { className: 'recon-steps' }, ...STEPS.flatMap((key, k) => (r.steps[k].length ? [el('li', {},
      el('button', { type: 'button', textContent: t(`analysis.step.${key}`), onclick: () => void show(k, k + 1, true) }), ' ', algView(r.steps[k], { frame }))] : []))),
    el('button', { type: 'button', textContent: t('analysis.reconAll'), onclick: () => void show(0, STEPS.length, true) }));
  fold.ontoggle = () => { if (fold.open && !player) void show(0, STEPS.length, false); };
  return fold;
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

/** The timeline (each step's width its time, the recognition lighter) and the table; cases link to their pages. One
 *  solve's has each step's `extras` (extrasOf) as "+n" by its turns, none when 0: not Progreso's means (they'd need
 *  every solve's states). */
function stepsView(steps: Step[], cases: { oll?: string | string[]; pll?: string | string[] } = {}, decimals = 0, extras?: number[]): HTMLElement[] {
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
  const turns = (n: number, extra?: number) => cell('td', moves(n), ...(extra ? ['\u2009', el('span', { className: 'analysis-extra' }, `+${extra}`,
    el('span', { className: 'sr-only', textContent: ` ${t('analysis.extra')}` }))] : []));
  const row = (s: Step, k: number) => {
    const ids = [s.key === 'oll' ? cases.oll : s.key === 'pll' ? cases.pll : undefined].flat().filter((x) => x !== undefined); // two: 2-look
    const name = el('th', { scope: 'row' }, stepName(s), ...ids.flatMap((id, i) => [i ? ' + ' : ' · ', caseLink(id)]));
    return el('tr', { className: GROUP_OF[s.key] }, name, cell('td', s.ms ? secs(s.ms) : '–'), turns(s.moves, extras?.[k]), cell('td', tps(s.moves, s.ms)),
      cell('td', s.ms ? secs(s.recog) : '–'), cell('td', s.ms ? secs(s.ms - s.recog) : '–'));
  };
  const all = steps.reduce((n, s) => n + s.moves, 0);
  const table = el('table', { className: 'quiz-table analysis-table' },
    el('thead', {}, el('tr', {}, ...['', 'analysis.time', 'analysis.moves', 'TPS', 'analysis.recog', 'analysis.exec'].map((k) =>
      el('th', { scope: 'col', textContent: k.startsWith('analysis.') ? t(k as MessageKey) : k })))),
    el('tbody', {}, ...steps.map(row)),
    el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', textContent: t('analysis.total') }), cell('td', secs(total)),
      turns(all, extras?.reduce((n, x) => n + x, 0)), cell('td', tps(all, total)),
      cell('td', secs(steps.reduce((n, s) => n + s.recog, 0))), cell('td', secs(steps.reduce((n, s) => n + s.ms - s.recog, 0))))));
  return [bar, el('div', { className: 'table-scroll' }, table),
    el('p', { className: 'hint', textContent: [t('analysis.hint'), ...(extras ? [t('analysis.hintExtra')] : [])].join(' ') })];
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

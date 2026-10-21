// Quizzes. Recognition: pick the case shown in a diagram, on the clock (the only mode without a cube).
// Execution, with a synced cube: guided to each state, then solve it on the clock without being asked its name
// and without feedback between items; time, turns and efficiency are measured and the errors reviewed at the end.
// Scoring lives in score.ts; a short history of sessions is kept in this browser.
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, YELLOW_UP, centerMoves, turnCount } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { lang, loc, t, tp } from '../i18n.ts';
import { goalReached, llFaceOf, makeQuizItems, quizPattern, type QuizSpec } from './cube.ts';
import { isoSVG, maskFor, netSVG, topSVG } from './diagram.ts';
import { cube, type CubeListener } from './link.ts';
import { METHODS, findCase } from './methods.ts';
import { el } from './practice.ts';
import { load, preferred, save, setting } from './store.ts';
import {
  addSession, aufFor, byCase, lastSession, parseHistory, referenceHtm, review, score, solutionFor, toRetry,
  type Attempt, type QuizMode, type SessionRecord,
} from './score.ts';
import type { Case, OfficialQuiz, Phase } from './types.ts';

export type QuizScope =
  | { kind: 'cases'; id: string; cases: Case[]; title: string; answers?: Case[] } // answers: default `cases`
  | { kind: 'official'; quiz: OfficialQuiz; phase: Phase };

const $ = (id: string) => document.getElementById(id)!;
const dialog = $('quiz') as HTMLDialogElement;
const body = $('quiz-body');
const status = $('quiz-status'); // persistent live region: #quiz-body is rebuilt, so one inside it wouldn't be announced reliably

const PER_CASE = [3, 5, 10, 20];
const KEYS = '123456789abcdefghijklmnopqrstuvwxyz'; // answer shortcuts, in button order
const HISTORY_KEY = 'academy-quiz-history';

export const scopeId = (s: QuizScope): string => (s.kind === 'cases' ? s.id : s.quiz.id);
const scopeTitle = (s: QuizScope): string => (s.kind === 'cases' ? s.title : loc(s.quiz.name));

/** Cases the user may answer: an official quiz covers the groups its answers come from. */
function scopeCases(s: QuizScope): Case[] {
  if (s.kind === 'cases') return s.answers ?? s.cases;
  const answers = new Set(s.quiz.items.map((it) => it.answer));
  return s.phase.groups.filter((g) => g.cases.some((c) => answers.has(c.id))).flatMap((g) => g.cases);
}

const history = (): SessionRecord[] => parseHistory(load(HISTORY_KEY));
/** Last finished session of a scope, for the academy's quiz buttons. */
export const lastResult = (id: string): SessionRecord | undefined => lastSession(history(), id);
export const percent = (x: number): string => new Intl.NumberFormat(lang, { style: 'percent' }).format(x);

const phaseOf = (c: Case): Phase | undefined =>
  METHODS.flatMap((m) => m.phases).find((p) => p.groups.some((g) => g.cases.includes(c)));

interface Item {
  spec: QuizSpec;
  c: Case;
  user: KPattern; // the state in the user frame: diagram, AUF and reference length
}

type Screen = 'setup' | 'ask' | 'scramble' | 'solve' | 'reveal' | 'results';
let kpuzzle: KPuzzle;
let scope: QuizScope;
let onClose: () => void = () => {};
let perCase = setting('quiz-per-case', 5, (n) => PER_CASE.includes(n));
let mode: QuizMode = 'recognition';
let screen: Screen = 'setup';
let rendered: Screen | null = null; // the screen last drawn, to keep the focus only within one screen
let items: Item[] = [];
let index = 0;
let attempts: Attempt[] = [];
let chosen: string | null = null; // recognition: the case picked for the current item
let shownAt = 0; // the item became answerable / solvable
let firstMoveAt = 0;
let done: string[] = []; // quarter turns while solving the current item
let assisted = false;
let wantExecution = setting('quiz-on-cube', true); // with a cube: solve on the cube (default) or name the case
let showNet = setting('quiz-net', false); // the scramble's 2D net, to check the cube by eye (kept across items)
/** Execution: what happened on each item, for the review at the end. */
let logs: { item: Item; n: number; done: string[]; skipped: boolean; assisted: boolean }[] = [];

const guide = new PathGuide(() => cube.pattern(), () => {
  if (screen === 'scramble' && guide.reached()) beginSolve(); // an empty plan: already at the state
  render();
});

/** Opens a quiz on its setup screen; `onDone` runs when the dialog closes (the history may have changed). */
export async function openQuiz(s: QuizScope, onDone: () => void = () => {}): Promise<void> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  scope = s;
  onClose = onDone;
  guide.stop();
  screen = 'setup';
  $('quiz-title').textContent = scopeTitle(s);
  cube.listener = listener;
  if (!dialog.open) dialog.showModal(); // "repeat the failed ones" reopens from inside
  render();
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: the dialog was reopened meanwhile
  if (cube.listener === listener) cube.listener = null;
  guide.stop();
  screen = 'setup';
  onClose();
});

function makeItems(): Item[] {
  const specs: QuizSpec[] = scope.kind === 'official'
    ? scope.quiz.items.map((it) => {
      const c = findCase(it.answer)!;
      const moves = centerMoves(it.scramble, IDENTITY);
      const user = kpuzzle.defaultPattern().applyAlg(moves.join(' '));
      return { caseId: c.id, moves, auf: aufFor(c, c.algs[0].alg, user) ?? '' };
    })
    : makeQuizItems(scope.cases, perCase, crypto.getRandomValues(new Uint32Array(1))[0], kpuzzle);
  return specs.map((spec) => ({ spec, c: findCase(spec.caseId)!, user: quizPattern(kpuzzle, spec, IDENTITY) }));
}

function start() {
  mode = cube.pattern() && wantExecution ? 'execution' : 'recognition';
  items = makeItems();
  index = 0;
  attempts = [];
  logs = [];
  startItem();
}

function startItem() {
  chosen = null;
  assisted = false;
  done = [];
  firstMoveAt = 0;
  if (mode === 'execution') {
    screen = 'scramble';
    void guide.start(quizPattern(kpuzzle, items[index].spec, YELLOW_UP)); // cube frame: yellow is the cube's D
  } else {
    screen = 'ask';
    shownAt = performance.now();
  }
  render();
}

function beginSolve() {
  guide.stop();
  screen = 'solve';
  shownAt = performance.now();
  requestAnimationFrame(tick);
}

function answer(caseId: string) {
  if (screen !== 'ask') return;
  chosen = caseId;
  attempts.push({ caseId: items[index].c.id, correct: caseId === items[index].c.id, recognitionMs: performance.now() - shownAt });
  screen = 'reveal';
  render();
}

function solved() {
  const now = performance.now();
  const item = items[index];
  attempts.push({
    caseId: item.c.id,
    correct: !assisted,
    recognitionMs: firstMoveAt - shownAt,
    executionMs: now - firstMoveAt,
    moves: done.length,
    htm: turnCount(done), // undone slips count: they cost time
    refHtm: referenceHtm(item.c, item.user, preferred(item.c)) ?? undefined, // the algorithm being practised
  });
  logs.push({ item, n: index + 1, done, skipped: false, assisted });
  next(); // no verdict between items: the errors are reviewed at the end
}

function skip() {
  guide.stop();
  attempts.push({ caseId: items[index].c.id, correct: false, recognitionMs: screen === 'solve' ? performance.now() - shownAt : 0 });
  logs.push({ item: items[index], n: index + 1, done, skipped: true, assisted });
  next();
}

function next() {
  if (++index < items.length) startItem();
  else finish();
}

function finish() {
  guide.stop();
  screen = 'results';
  if (attempts.length) {
    const s = score(attempts);
    save(HISTORY_KEY, addSession(history(), { scope: scopeId(scope), at: Date.now(), mode, n: s.n, accuracy: s.accuracy, ms: s.ms, efficiency: s.efficiency }));
  }
  render();
}

const listener: CubeListener = {
  move(move) {
    if (screen === 'scramble') {
      guide.onMove(move);
      if (guide.reached()) beginSolve();
    } else if (screen === 'solve') {
      firstMoveAt ||= performance.now();
      done.push(move);
      if (goalReached(items[index].c.stage, cube.pattern()!, llFaceOf(YELLOW_UP))) return solved();
    } else return;
    render();
  },
  sync(reset) {
    if (screen === 'setup') render(); // the mode follows the cube until the quiz starts
    else if (mode === 'execution' && !cube.pattern() && screen !== 'results') finish(); // disconnected: score what was done
    else if (screen === 'scramble') void guide.replan();
    else if (screen === 'solve' && reset) startItem(); // the item's state is gone: set it up again
    // the cube lost the last turn and the corrected state is at the goal (any other drift: the next turn is judged right)
    else if (screen === 'solve' && goalReached(items[index].c.stage, cube.pattern()!, llFaceOf(YELLOW_UP))) solved();
  },
};

// Live clock while solving (one loop per item, started in beginSolve); stops by itself when the screen changes.
function tick() {
  if (screen !== 'solve' || !dialog.open) return;
  const clock = document.getElementById('quiz-clock'); // re-rendered on every move: look it up each frame
  if (clock) clock.textContent = formatTime(performance.now() - shownAt);
  requestAnimationFrame(tick);
}

// On document: re-rendering drops the focus to <body>, outside the dialog, where its own listener can't hear.
document.addEventListener('keydown', (e) => {
  if (!dialog.open || screen !== 'ask' || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = KEYS.indexOf(e.key.toLowerCase());
  const cases = scopeCases(scope);
  if (i < 0 || i >= cases.length) return;
  e.preventDefault();
  answer(cases[i].id);
});

// --- Rendering ---

const p = (text: string, className = '') => el('p', { textContent: text, className });
const button = (text: string, onclick: () => void, className = '') => el('button', { type: 'button', textContent: text, onclick, className });
/** A button that keeps the focus across re-renders (each cube move rebuilds the screen). */
const action = (name: string, text: string, onclick: () => void) => {
  const b = button(text, onclick);
  b.dataset.action = name;
  return b;
};
export const caseLabel = (c: Case) => (loc(c.name) === c.code ? c.code : `${c.code} · ${loc(c.name)}`);
const timeOr = (ms: number | null) => (ms === null ? '–' : formatTime(ms));
const pctOr = (x: number | null) => (x === null ? '–' : percent(x));

/** The preferred algorithm with the AUF this state needs, folded into its leading U turns ("U" + "U R…" = "U2 R…"). */
const solution = (item: Item): string => solutionFor(item.c, preferred(item.c).alg, item.user);

function render() {
  if (!dialog.open) return;
  const view = { setup: renderSetup, ask: renderItem, scramble: renderScramble, solve: renderSolve, reveal: renderItem, results: renderResults }[screen];
  const focused = body.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.action : undefined;
  const same = screen === rendered;
  rendered = screen;
  body.replaceChildren(...view());
  // Keyboard flow: on the same screen the button the user was on keeps the focus, else the screen's main action
  // takes it; a new screen's main action comes first (answered: "Next", not the scramble toggle that's still there).
  const kept = focused ? body.querySelector<HTMLElement>(`[data-action="${focused}"]`) : null;
  const main = body.querySelector<HTMLElement>('[data-focus]');
  (same ? kept || main : main || kept)?.focus();
  const text = statusText();
  if (status.textContent !== text) status.textContent = text; // unchanged text isn't announced again
}

/** What the live region says: the question, the next scramble move, the verdict… */
function statusText(): string {
  const where = items.length ? t('quiz.progress', { n: index + 1, total: items.length }) : '';
  switch (screen) {
    case 'ask': return `${where}. ${t('quiz.question')}`;
    case 'scramble': return `${nextMove() ?? ''} ${scrambleDesc()}`.trim();
    case 'solve': return `${where}. ${t('quiz.solveHint')}`; // not the clock: it would talk every frame
    case 'reveal': return verdict(items[index]).map((node) => node.textContent).join(' ');
    case 'results': return t('quiz.results');
    default: return '';
  }
}

function renderSetup(): Node[] {
  const execution = !!cube.pattern();
  const out: Node[] = [];
  if (scope.kind === 'official') {
    out.push(p(loc(scope.quiz.instructions), 'prose'), p(tp('quiz.items', scope.quiz.items.length), 'hint'));
  } else {
    const select = el('select', {}, ...PER_CASE.map((n) => el('option', { value: String(n), textContent: String(n), selected: n === perCase })));
    select.onchange = () => save('quiz-per-case', (perCase = +select.value));
    out.push(el('label', { className: 'academy-method' }, t('quiz.perCase'), select), p(tp('quiz.cases', scope.cases.length), 'hint')); // what's asked, not the answers
  }
  if (execution) {
    const option = (value: boolean, label: string, hint: string) => {
      const input = el('input', { type: 'radio', name: 'quiz-mode', checked: wantExecution === value });
      input.onchange = () => save('quiz-on-cube', (wantExecution = value));
      return el('label', { className: 'quiz-mode' }, input, el('span', {}, el('strong', { textContent: label }), el('br'), el('small', { textContent: hint })));
    };
    out.push(el('fieldset', { className: 'quiz-modes' }, el('legend', { textContent: t('quiz.modeChoose') }),
      option(true, t('quiz.optExecution'), t('quiz.optExecutionHint')),
      option(false, t('quiz.optRecognition'), t('quiz.optRecognitionHint'))));
  } else {
    out.push(p(t('quiz.modeRecognition')));
  }
  const last = lastResult(scopeId(scope));
  if (last) out.push(p(t('quiz.last', { result: summaryLine(last) }), 'hint'));
  const go = button(t('quiz.start'), start, 'primary');
  go.dataset.focus = '';
  out.push(el('div', { className: 'row' }, go));
  return out;
}

const summaryLine = (r: SessionRecord) =>
  [percent(r.accuracy), timeOr(r.ms), ...(r.efficiency === null ? [] : [t('quiz.effShort', { pct: percent(r.efficiency) })])].join(' · ');

const progress = () => p(t('quiz.progress', { n: index + 1, total: items.length }), 'hint');

function diagram(item: Item): HTMLElement {
  const draw = phaseOf(item.c)?.diagram === 'iso' ? isoSVG : topSVG;
  const box = el('div', { className: 'quiz-diagram' });
  box.innerHTML = draw(patternToFacelets(item.user), maskFor(item.c.stage), { size: 180, title: t('quiz.question') });
  return box;
}

/** Recognition question and its verdict. */
function renderItem(): Node[] {
  const item = items[index];
  const out: Node[] = [progress()];
  out.push(diagram(item));
  if (screen === 'ask') {
    out.push(...officialScramble(), el('p', {}, el('strong', { textContent: t('quiz.question') })),
      el('div', { className: 'answers', role: 'group', ariaLabel: t('quiz.answers') }, ...scopeCases(scope).map((c, i) =>
        el('button', { type: 'button', onclick: () => answer(c.id) }, ...(i < KEYS.length ? [el('kbd', { textContent: KEYS[i] })] : []), c.code))));
    return out;
  }
  out.push(...officialScramble(), ...verdict(item));
  const more = index + 1 < items.length;
  const go = button(t(more ? 'quiz.next' : 'quiz.finish'), next, 'primary');
  go.dataset.focus = '';
  out.push(el('div', { className: 'row' }, go));
  return out;
}

/** The plan's scramble for this item: without a smart cube, the user applies it by hand. */
const officialScramble = (): Node[] =>
  scope.kind === 'official' && mode === 'recognition'
    ? scrambleToggle([`${t('quiz.scramble')}: `, el('code', { textContent: scope.quiz.items[index].scramble })])
    : [];

/** Tapping the scramble shows (or hides) the whole state it leads to as a 2D net, to check the cube by eye. */
function scrambleToggle(content: (Node | string)[]): Node[] {
  const b = action('net', '', () => { save('quiz-net', (showNet = !showNet)); render(); });
  b.className = 'scramble-toggle';
  b.ariaExpanded = String(showNet);
  b.title = t(showNet ? 'quiz.netHide' : 'quiz.netShow');
  b.append(...content);
  if (!showNet) return [b];
  const net = el('figure', { className: 'quiz-net' });
  net.innerHTML = netSVG(patternToFacelets(items[index].user), { size: 260, title: t('quiz.netTitle') });
  net.append(el('figcaption', { className: 'hint', textContent: t('quiz.netCaption') }));
  return [b, net];
}

/** Recognition verdict (solve mode has none between items: its errors are reviewed at the end). */
function verdict(item: Item): Node[] {
  const a = attempts.at(-1)!;
  return [
    p(a.correct ? t('quiz.correct') : t('quiz.wrong', { chosen: findCase(chosen!)?.code ?? '' }), a.correct ? 'ok' : 'bad'),
    p(t('quiz.time', { time: formatTime(a.recognitionMs) }), 'hint'),
    el('p', {}, el('strong', { textContent: caseLabel(item.c) }), ' · ', algView(solution(item))),
  ];
}

const nextMove = () => {
  const n = guide.guide && nextStep(guide.guide);
  return n ? cube.label(n) : null;
};
function scrambleDesc(): string {
  const shown = nextMove();
  const desc = shown && describe(shown);
  return !desc ? t('guide.planning') : guide.guide!.half ? t('guide.secondHalf', { desc }) : desc;
}

function renderScramble(): Node[] {
  const g = guide.guide;
  return [
    progress(),
    ...(index > 0 ? [p(t('quiz.recorded'), 'hint')] : []), // no verdict: that's for the review at the end
    el('ol', { className: 'steps' },
      el('li', { ariaCurrent: 'step', textContent: t('practice.stepScramble') }),
      el('li', { textContent: t('quiz.stepSolve') })),
    el('div', { className: 'next', textContent: nextMove() ?? '…' }),
    el('div', { textContent: scrambleDesc() }),
    ...scrambleToggle([el('span', { className: 'tokens' }, ...(g?.steps ?? []).flatMap((m, i) => [el('span', { textContent: cube.label(m), className: i === 0 ? 'current' : '' }), ' ']))]),
    p(t('practice.scrambleHint'), 'hint'),
    el('div', { className: 'row' }, action('skip', t('quiz.skip'), skip)),
  ];
}

function renderSolve(): Node[] {
  const item = items[index];
  return [
    progress(),
    el('ol', { className: 'steps' },
      el('li', { textContent: t('practice.stepScramble') }),
      el('li', { ariaCurrent: 'step', textContent: t('quiz.stepSolve') })),
    el('div', { id: 'quiz-clock', className: 'next', role: 'timer', textContent: formatTime(performance.now() - shownAt) }),
    p(t('quiz.solveHint'), 'hint'),
    ...(assisted ? [el('p', {}, el('strong', { textContent: caseLabel(item.c) }), ' · ', algView(solution(item)))] : []),
    p(tp('quiz.turns', turnCount(done)), 'hint'), // as the review counts them
    el('div', { className: 'row' },
      action('skip', t('quiz.skip'), skip),
      ...(assisted ? [] : [action('solution', t('quiz.showSolution'), () => { assisted = true; render(); })])),
  ];
}

function renderResults(): Node[] {
  if (!attempts.length) return [p(t('quiz.empty')), el('div', { className: 'row' }, button(t('dialog.close'), () => dialog.close()))];
  const s = score(attempts);
  const cases = byCase(attempts);
  const execution = mode === 'execution';
  const row = (k: string, v: string) => [el('dt', { textContent: k }), el('dd', { textContent: v })];
  const summary = el('dl', {},
    ...row(t('quiz.accuracy'), t('quiz.accuracyValue', { pct: percent(s.accuracy), correct: s.correct, n: s.n })),
    ...row(t('quiz.avgRecognition'), timeOr(s.recognitionMs)),
    ...(execution ? [...row(t('quiz.avgExecution'), timeOr(s.executionMs)), ...row(t('quiz.avgEfficiency'), pctOr(s.efficiency))] : []));
  const th = (text: string) => el('th', { textContent: text, scope: 'col' });
  const td = (text: string) => el('td', { textContent: text });
  const table = el('table', { className: 'quiz-table' },
    el('thead', {}, el('tr', {}, th(t('quiz.colCase')), th(t('quiz.colAccuracy')), th(t('quiz.colTime')), ...(execution ? [th(t('quiz.colEfficiency'))] : []))),
    el('tbody', {}, ...cases.map((c) => el('tr', {},
      td(findCase(c.caseId)?.code ?? c.caseId),
      td(`${c.correct}/${c.n}`),
      td(timeOr(c.ms)),
      ...(execution ? [td(pctOr(c.efficiency))] : [])))));
  const issues = execution ? reviewed() : [];
  // the review's errors (e.g. extra turns) are worth repeating too, not only misses and slow cases
  const retry = [...new Set([...toRetry(cases, s), ...issues.map(({ l }) => l.item.c.id)])].map((id) => findCase(id)!);
  const close = button(t('dialog.close'), () => dialog.close());
  const actions = el('div', { className: 'row' });
  if (retry.length) {
    const again = button(t('quiz.retry', { n: retry.length }), () => void openQuiz({
      kind: 'cases', id: `${scopeId(scope)}:retry`, cases: retry, answers: scopeCases(scope), title: t('quiz.retryTitle', { title: scopeTitle(scope) }),
    }, onClose), 'primary');
    again.dataset.focus = '';
    actions.append(again, close);
  } else {
    close.dataset.focus = '';
    actions.append(close);
  }
  return [el('h3', { textContent: t('quiz.results') }), summary, table, ...(execution ? reviewSection(issues) : []),
    ...(retry.length ? [] : [p(t('quiz.allGood'), 'ok')]), actions];
}

/** Solve mode: every item with an error, with its review. */
const reviewed = () => logs
  .map((l) => ({ l, r: review(l.done, centerMoves(solution(l.item), YELLOW_UP), l.skipped, l.assisted) }))
  .filter(({ r }) => r.issue);

/** What was done on each item with an error, next to what the chosen algorithm does. */
function reviewSection(issues: ReturnType<typeof reviewed>): Node[] {
  const title = el('h3', { textContent: t('quiz.review') });
  if (!issues.length) return [title, p(t('quiz.reviewClean'), 'ok')];
  const turns = (moves: string[], mark: (i: number) => boolean, cls: string) => algView(moves.map(cube.label), { mark: (i) => (mark(i) ? cls : '') });
  return [title, p(tp('quiz.reviewCount', issues.length, { total: logs.length }), 'hint'), ...issues.map(({ l, r }) =>
    el('div', { className: 'review' },
      el('p', {}, el('strong', { textContent: `${l.n}. ${caseLabel(l.item.c)}` }), ' · ',
        el('span', { className: 'bad', textContent: r.issue === 'extra' ? tp('quiz.reviewExtra', r.extra) : t(r.issue === 'skipped' ? 'quiz.reviewSkipped' : 'quiz.reviewAssisted') })),
      el('p', {}, `${t('quiz.reviewAlg')}: `, algView(solution(l.item))),
      // where it went off course: the user's turns from there in red, the expected turn at that point underlined
      ...(l.skipped && !r.mine.length ? [] : [el('p', {}, `${t('quiz.reviewMine')}: `, turns(r.mine, (i) => i >= r.divergeAt, 'bad'))]),
      el('p', {}, `${t('quiz.reviewExpected')}: `, turns(r.expected, (i) => !l.skipped && i === r.divergeAt && r.divergeAt < r.mine.length, 'current'))))];
}

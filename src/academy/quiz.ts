// Quizzes, a smart trainer. Setup: which cases (by hand, by learning status, slowest, due today…) and in which order
// (uniform, as often as they come up in a solve, due first). Recognition: pick the case shown in a diagram, on the
// clock (the only mode without a cube); a random-state scramble lets you set it up on a normal cube, and after a right
// answer you say whether you solved it. Execution, with a synced cube: guided to each state, then solve it on the
// clock without being asked its name; graded by itself, the previous item's result shown while setting up the next,
// time, turns and efficiency measured and the errors reviewed at the end. Every item grades its case for the
// spaced repetition (store.ts). Scoring lives in score.ts; a short history of sessions is kept in this browser.
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, YELLOW_UP, centerMoves, turnCount, unmapMove, type Frame } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { lang, loc, t, tp, type MessageKey } from '../i18n.ts';
import {
  HOLDS, caseState, goalReached, holdIn, llFaceOf, makeQuizItems, quizPattern, randomStateScramble, specsFor, type QuizSpec,
} from './cube.ts';
import { heldColors, isoSVG, maskFor, netSVG, topSVG } from './diagram.ts';
import { cube, type CubeListener } from './link.ts';
import { METHODS, findCase } from './methods.ts';
import { el, openPractice } from './practice.ts';
import { caseProbability } from './probability.ts';
import { learningFor, load, preferred, recordGrade, save, setting, type Grade } from './store.ts';
import {
  addSession, aufFor, autoGrade, byCase, lastSession, parseHistory, referenceHtm, review, score, selectCases, solutionFor, spacedTiers,
  toRetry, weightedOrder, type Attempt, type Issue, type Order, type QuizMode, type Selection, type SessionRecord,
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
const SELECTIONS: Selection[] = ['one', 'pick', 'due', 'learning', 'known', 'slow', 'all'];
const ORDERS: Order[] = ['uniform', 'probability', 'spaced'];
const SCRAMBLE_MS = 3000; // the solver's first run loads it; past this, the merged setup is the scramble
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

/** The quiz of one case, answered among its group's cases. */
const caseScope = (c: Case): QuizScope => ({
  kind: 'cases', id: c.id, cases: [c], title: caseLabel(c),
  answers: METHODS.flatMap((m) => m.phases).flatMap((p) => p.groups).find((g) => g.cases.includes(c))?.cases,
});

/** Answers for an item: the scope's cases of its phase (a whole method would be too many buttons). */
function answersFor(item: Item): Case[] {
  const all = scopeCases(scope);
  const phase = phaseOf(item.c);
  const same = all.filter((c) => phaseOf(c) === phase);
  return same.length ? same : all;
}

interface Item {
  spec: QuizSpec;
  c: Case;
  user: KPattern; // the state in the user frame: diagram, AUF and reference length
  scramble?: string | null; // recognition, generated: the random-state scramble (null while the solver works)
  random?: boolean; // ...found by the solver (else, too slow: the merged setup)
  hold: Frame; // color neutral: how the cube is held (place -> color), IDENTITY = yellow up, green front
}

/** The item's frame on the GAN cube: its moves, goal and solution are those of the grip it's held in. */
const onCube = (item: Item): Frame => holdIn(item.hold, YELLOW_UP);

/** What the user is told about an item once it's done. */
interface Feedback {
  item: Item;
  grade: Grade;
  issue: Issue | null; // solve mode: why it failed
  extra: number; // ...and by how many turns, for 'extra'
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
let neutral = setting('quiz-neutral', false); // color neutral: each item held a random way (another color on top)
let selection: Selection = 'all'; // which cases (setup), see openQuiz
let order = setting<Order>('quiz-order', 'uniform', (v) => ORDERS.includes(v));
let picked = new Set<string>(); // "Elegir a mano"
let pickGrid: HTMLElement | null = null; // built once per scope: one diagram per case
let grade: Grade | null = null; // recognition: the current item's grade, once known
let feedback: Feedback | null = null; // solve mode: the last item's, shown while setting up the next
let failed = new Set<string>(); // cases graded as failed this session: repeated with the misses
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
  picked = new Set(s.kind === 'cases' ? s.cases.map((c) => c.id) : []);
  pickGrid = null;
  selection = initialSelection();
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

// --- Which cases, in which order ---

/** The case the quiz was opened from (its scope answers among its group). */
const oneCase = (): Case | null => (scope.kind === 'cases' && scope.cases.length === 1 && scopeCases(scope).length > 1 ? scope.cases[0] : null);
const executionNext = () => !!cube.pattern() && wantExecution;
const selectContext = () => ({
  one: oneCase(), picked, learning: learningFor, now: Date.now(), timeKey: executionNext() ? 'solveMs' as const : 'recognitionMs' as const,
});
const selected = (sel = selection): Case[] => selectCases(sel, scopeCases(scope), selectContext());

/** From a case: that case; a retry: its cases, ticked by hand; otherwise the last choice, if it has cases. */
function initialSelection(): Selection {
  if (scope.kind !== 'cases') return 'all';
  if (oneCase()) return 'one';
  if (scope.cases.length < scopeCases(scope).length) return 'pick';
  if (scope.id.endsWith(':retry')) return 'all'; // every case is being retried
  const last = setting<Selection>('quiz-select', 'all', (v) => SELECTIONS.includes(v));
  return last !== 'one' && selected(last).length ? last : selected('due').length ? 'due' : 'all';
}

function makeSpecs(): QuizSpec[] {
  if (scope.kind === 'official') {
    return scope.quiz.items.map((it) => {
      const c = findCase(it.answer)!;
      const moves = centerMoves(it.scramble, IDENTITY);
      const user = kpuzzle.defaultPattern().applyAlg(moves.join(' '));
      return { caseId: c.id, moves, auf: aufFor(c, c.algs[0].alg, user) ?? '' };
    });
  }
  const cases = selected();
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  if (order === 'spaced') return spacedTiers(cases, learningFor, Date.now()).flatMap((tier, i) => makeQuizItems(tier, perCase, seed + i, kpuzzle));
  if (order === 'probability') {
    // a case whose probability isn't counted (F2L, the beginner's last layer) weighs as the mean; none counted: uniform
    const weights = cases.map((c) => caseProbability(c.id, kpuzzle));
    return specsFor(weightedOrder(cases, weights, cases.length * perCase, Math.random), seed, kpuzzle);
  }
  return makeQuizItems(cases, perCase, seed, kpuzzle);
}

function start() {
  mode = executionNext() ? 'execution' : 'recognition';
  // the state stays the same in the grip (diagram, scramble, AUF, answers): only the colors and the cube's frame change
  items = makeSpecs().map((spec) => ({
    spec, c: findCase(spec.caseId)!, user: quizPattern(kpuzzle, spec, IDENTITY),
    hold: neutral ? HOLDS[Math.floor(Math.random() * HOLDS.length)] : IDENTITY,
  }));
  index = 0;
  attempts = [];
  logs = [];
  feedback = null;
  failed = new Set();
  startItem();
}

/** Recognition: the item's random-state scramble, solved for ahead of time (this item and the next). */
function prefetch(i: number) {
  const item = items[i];
  if (!item || item.scramble !== undefined || scope.kind === 'official' || mode !== 'recognition') return;
  item.scramble = null;
  const late = new Promise<null>((resolve) => setTimeout(resolve, SCRAMBLE_MS, null));
  void Promise.race([randomStateScramble(item.user), late]).catch(() => null).then((moves) => {
    item.scramble = (moves ?? item.spec.moves).join(' ');
    item.random = !!moves;
    // patched in place: re-rendering the question would drop the focus and a tap in progress on an answer
    const code = items[index] === item && body.querySelector<HTMLElement>('[data-scramble]');
    if (!code) return;
    code.textContent = item.scramble;
    code.ariaBusy = 'false';
    body.querySelector<HTMLElement>('[data-random]')!.hidden = !item.random;
  });
}

/** Grades the item's case for the spaced repetition; `time` only for a real one (right answer, solve without help). */
function gradeItem(item: Item, g: Grade, time?: Parameters<typeof recordGrade>[2]) {
  recordGrade(item.c.id, g, time);
  if (g === 'fail') failed.add(item.c.id);
}

function startItem() {
  chosen = null;
  grade = null;
  assisted = false;
  done = [];
  firstMoveAt = 0;
  prefetch(index);
  prefetch(index + 1);
  if (mode === 'execution') {
    screen = 'scramble';
    void guide.start(quizPattern(kpuzzle, items[index].spec, onCube(items[index]))); // cube frame: yellow is the cube's D
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
  const item = items[index];
  attempts.push({ caseId: item.c.id, correct: caseId === item.c.id, recognitionMs: performance.now() - shownAt });
  if (caseId !== item.c.id) gradeItem(item, (grade = 'fail')); // right: the user says how the solve went
  screen = 'reveal';
  render();
}

/** Recognition, after a right answer: "¿Lo resolviste bien?" — well: next; failed: stay for "Repasar ahora". */
function selfGrade(g: 'good' | 'fail') {
  gradeItem(items[index], (grade = g), { key: 'recognitionMs', ms: attempts.at(-1)!.recognitionMs });
  if (g === 'good') next();
  else render();
}

/** Closes the quiz and drills the case: its practice on the Memoria muscular tab. */
function reviewNow(c: Case) {
  saveSession(); // the items done so far count
  dialog.close(); // releases the cube for the practice
  void openPractice(c, () => {}, () => void openQuiz(caseScope(c))).then(() =>
    // ponytail: through the dialog's own tab button, which also remembers the tab; a parameter if it ever needs more
    document.querySelector<HTMLButtonElement>('#practice-tabs [data-tab="drill"]')?.click());
}

function solved() {
  const now = performance.now();
  const item = items[index];
  const { issue, extra } = review(done, centerMoves(solution(item), onCube(item)), false, assisted);
  const g = autoGrade(issue, now - shownAt, item.hold !== IDENTITY ? null : learningFor(item.c.id)?.solveMs ?? null);
  gradeItem(item, g, issue || item.hold !== IDENTITY ? undefined : { key: 'solveMs', ms: now - shownAt }); // regripping is in the clock when neutral
  feedback = { item, grade: g, issue, extra };
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
  next(); // nothing stops between items: the verdict shows while the next one is set up, the errors at the end
}

function skip() {
  guide.stop();
  if (screen === 'solve') {
    gradeItem(items[index], 'fail');
    feedback = { item: items[index], grade: 'fail', issue: 'skipped', extra: 0 };
  } else feedback = null; // still setting it up: not tried, not graded
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
  saveSession();
  render();
}

function saveSession() {
  if (!attempts.length) return;
  const s = score(attempts);
  save(HISTORY_KEY, addSession(history(), { scope: scopeId(scope), at: Date.now(), mode, n: s.n, accuracy: s.accuracy, ms: s.ms, efficiency: s.efficiency }));
}

const listener: CubeListener = {
  move(move) {
    if (screen === 'scramble') {
      guide.onMove(move);
      if (guide.reached()) beginSolve();
    } else if (screen === 'solve') {
      firstMoveAt ||= performance.now();
      done.push(move);
      if (goalReached(items[index].c.stage, cube.pattern()!, llFaceOf(onCube(items[index])))) return solved();
    } else return;
    render();
  },
  sync(reset) {
    if (screen === 'setup') render(); // the mode follows the cube until the quiz starts
    else if (mode === 'execution' && !cube.pattern() && screen !== 'results') finish(); // disconnected: score what was done
    else if (screen === 'scramble') void guide.replan();
    else if (screen === 'solve' && reset) startItem(); // the item's state is gone: set it up again
    // the cube lost the last turn and the corrected state is at the goal (any other drift: the next turn is judged right)
    else if (screen === 'solve' && goalReached(items[index].c.stage, cube.pattern()!, llFaceOf(onCube(items[index])))) solved();
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
  const cases = answersFor(items[index]);
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
  // setup: it's taller than a phone, and its choices come first, above "Empezar"
  if (!same && screen === 'setup') dialog.scrollTop = 0;
  (same ? kept || main : main || kept)?.focus({ preventScroll: screen === 'setup' });
  const text = statusText();
  if (status.textContent !== text) status.textContent = text; // unchanged text isn't announced again
}

/** What the live region says: the question, the next scramble move, the verdict… */
function statusText(): string {
  const where = items.length ? t('quiz.progress', { n: index + 1, total: items.length }) : '';
  switch (screen) {
    case 'ask': return `${where}. ${neutral ? `${holdText(items[index])} ` : ''}${t('quiz.question')}`;
    // the last item's grade once, while the next one is being planned; then the moves
    case 'scramble': return [feedback && !guide.total ? feedbackText(feedback) : '', nextMove() ?? '', scrambleDesc(), neutral && items[index] ? holdText(items[index], 'neutral.holdAfter') : ''].join(' ').trim();
    case 'solve': return `${where}. ${t('quiz.solveHint')}${neutral ? ` ${holdText(items[index], 'neutral.holdSolve')}` : ''}`; // not the clock: it would talk every frame
    case 'reveal': return [...verdict(items[index]).map((node) => node.textContent), grade === null ? t('quiz.gradeAsk') : ''].join(' ').trim();
    case 'results': return t('quiz.results');
    default: return '';
  }
}

/** A radio option (label, optional hint) that keeps the focus across re-renders. */
function option(name: string, value: string, checked: boolean, choose: () => void, label: string, hint = '', disabled = false): HTMLElement {
  const input = el('input', { type: 'radio', name, checked, disabled });
  input.dataset.action = `${name}-${value}`;
  input.onchange = () => {
    choose();
    render();
  };
  return el('label', { className: 'quiz-mode' }, input,
    el('span', {}, el('strong', { textContent: label }), ...(hint ? [el('br'), el('small', { textContent: hint })] : [])));
}

const SELECTION_LABEL: Record<Selection, MessageKey> = {
  one: 'quiz.selOne', pick: 'quiz.selPick', due: 'quiz.selDue', learning: 'quiz.selLearning', known: 'quiz.selKnown', slow: 'quiz.selSlow', all: 'quiz.selAll',
};
const ORDER_LABEL: Record<Order, [MessageKey, MessageKey]> = {
  uniform: ['quiz.orderUniform', 'quiz.orderUniformHint'],
  probability: ['quiz.orderProbability', 'quiz.orderProbabilityHint'],
  spaced: ['quiz.orderSpaced', 'quiz.orderSpacedHint'],
};

function renderSetup(): Node[] {
  const execution = !!cube.pattern();
  const out: Node[] = [];
  let n: number; // items
  if (scope.kind === 'official') {
    n = scope.quiz.items.length;
    out.push(p(loc(scope.quiz.instructions), 'prose'), p(tp('quiz.items', n), 'hint'));
  } else {
    const one = oneCase();
    const choices = SELECTIONS.filter((x) => x !== 'one' || one).map((x) => {
      const count = selected(x).length;
      const label = t(SELECTION_LABEL[x], { code: one?.code ?? '' });
      // by hand stays choosable with none ticked: that's where you tick them
      const choice = option('quiz-select', x, x === selection, () => save('quiz-select', (selection = x)), label, tp('quiz.cases', count), !count && x !== 'pick');
      choice.querySelector('small')!.dataset.count = x;
      return choice;
    });
    // no case of the scope with a probability (F2L, the beginner's last layer): it would just be uniform
    const noOdds = scopeCases(scope).every((c) => caseProbability(c.id, kpuzzle) === null);
    const orders = ORDERS.map((x) => option('quiz-order', x, x === order, () => save('quiz-order', (order = x)), t(ORDER_LABEL[x][0]), t(ORDER_LABEL[x][1]),
      x === 'probability' && noOdds));
    const select = el('select', {}, ...PER_CASE.map((k) => el('option', { value: String(k), textContent: String(k), selected: k === perCase })));
    select.onchange = () => {
      save('quiz-per-case', (perCase = +select.value));
      render();
    };
    const cases = selected().length;
    n = cases * perCase;
    const summary = p(setupSummary(cases), 'hint');
    summary.dataset.count = 'total';
    out.push(
      el('fieldset', { className: 'quiz-modes quiz-choices' }, el('legend', { textContent: t('quiz.which') }), ...choices),
      ...(selection === 'pick' ? [pickView()] : []),
      ...(selection === 'one' ? [] : [el('fieldset', { className: 'quiz-modes' }, el('legend', { textContent: t('quiz.order') }), ...orders)]),
      el('label', { className: 'academy-method' }, t('quiz.perCase'), select),
      summary);
  }
  if (execution) {
    out.push(el('fieldset', { className: 'quiz-modes' }, el('legend', { textContent: t('quiz.modeChoose') }),
      option('quiz-mode', 'cube', wantExecution, () => save('quiz-on-cube', (wantExecution = true)), t('quiz.optExecution'), t('quiz.optExecutionHint')),
      option('quiz-mode', 'name', !wantExecution, () => save('quiz-on-cube', (wantExecution = false)), t('quiz.optRecognition'), t('quiz.optRecognitionHint'))));
  } else {
    out.push(p(t('quiz.modeRecognition')));
  }
  const box = el('input', { type: 'checkbox', checked: neutral });
  box.dataset.action = 'neutral';
  box.onchange = () => save('quiz-neutral', (neutral = box.checked));
  out.push(el('label', { className: 'quiz-mode' }, box,
    el('span', {}, el('strong', { textContent: t('neutral.option') }), el('br'), el('small', { textContent: t('neutral.optionHint') }))));
  const last = lastResult(scopeId(scope));
  if (last) out.push(p(t('quiz.last', { result: summaryLine(last) }), 'hint'));
  const go = button(t('quiz.start'), start, 'primary');
  go.disabled = !n;
  go.dataset.focus = '';
  out.push(el('div', { className: 'row' }, go));
  return out;
}

const setupSummary = (cases: number) => `${tp('quiz.cases', cases)} · ${tp('quiz.items', cases * perCase)}`;

/** Ticking cases only changes counts: patched in place, so the grid keeps its scroll (and Safari, which doesn't focus a
 *  clicked checkbox, doesn't move the focus to "Empezar"). */
function pickedChanged() {
  const n = selected('pick').length;
  body.querySelector('[data-count="pick"]')!.textContent = tp('quiz.cases', n);
  body.querySelector('[data-count="total"]')!.textContent = setupSummary(n);
  body.querySelector<HTMLButtonElement>('[data-focus]')!.disabled = !n;
}

/** "Elegir a mano": every case of the scope with its diagram, to tick. Built once per scope (it's a lot of SVG). */
function pickView(): HTMLElement {
  if (pickGrid) return pickGrid;
  const inputs = scopeCases(scope).map((c) => {
    const input = el('input', { type: 'checkbox', checked: picked.has(c.id) });
    input.dataset.action = `pick-${c.id}`;
    input.onchange = () => {
      if (input.checked) picked.add(c.id);
      else picked.delete(c.id);
      pickedChanged();
    };
    return [c, input] as const;
  });
  const all = (on: boolean) => () => {
    for (const [c, input] of inputs) {
      input.checked = on;
      if (on) picked.add(c.id);
      else picked.delete(c.id);
    }
    pickedChanged();
  };
  return (pickGrid = el('div', { className: 'quiz-picks' },
    el('div', { className: 'row' }, action('pick-all', t('quiz.pickAll'), all(true)), action('pick-none', t('quiz.pickNone'), all(false))),
    el('div', { className: 'quiz-pick-grid', role: 'group', ariaLabel: t('quiz.selPick') }, ...inputs.map(([c, input]) => {
      const box = el('label', { className: 'quiz-pick', title: caseLabel(c) }, input);
      const pic = el('span', { ariaHidden: 'true' }); // the code names it
      pic.innerHTML = caseSVG(c, 56);
      box.append(pic, el('span', { textContent: c.code }));
      return box;
    }))));
}

/** The case as the academy's cards draw it. */
function caseSVG(c: Case, size: number, user = caseState(kpuzzle, preferred(c).alg, IDENTITY), hold = IDENTITY): string {
  const draw = phaseOf(c)?.diagram === 'iso' ? isoSVG : topSVG;
  return draw(patternToFacelets(user), maskFor(c.stage), { size, colors: heldColors(hold) });
}

const color = (face: string) => t(`paint.color.${face}` as MessageKey);
/** Color neutral: which colors go up and in front for this item. */
const holdText = (item: Item, key: MessageKey = 'neutral.hold') => t(key, { up: color(item.hold.U), front: color(item.hold.F) });
const holdHint = (item: Item, key?: MessageKey): Node[] => (neutral ? [el('p', {}, el('strong', { textContent: holdText(item, key) }))] : []);

const summaryLine = (r: SessionRecord) =>
  [percent(r.accuracy), timeOr(r.ms), ...(r.efficiency === null ? [] : [t('quiz.effShort', { pct: percent(r.efficiency) })])].join(' · ');

const progress = () => p(t('quiz.progress', { n: index + 1, total: items.length }), 'hint');

function diagram(item: Item): HTMLElement {
  const draw = phaseOf(item.c)?.diagram === 'iso' ? isoSVG : topSVG;
  const box = el('div', { className: 'quiz-diagram' });
  box.innerHTML = draw(patternToFacelets(item.user), maskFor(item.c.stage), { size: 180, title: t('quiz.question'), colors: heldColors(item.hold) });
  return box;
}

/** Recognition question and its verdict. */
function renderItem(): Node[] {
  const item = items[index];
  const out: Node[] = [progress(), ...holdHint(item)];
  out.push(diagram(item));
  if (screen === 'ask') {
    out.push(...itemScramble(), el('p', {}, el('strong', { textContent: t('quiz.question') })),
      el('div', { className: 'answers', role: 'group', ariaLabel: t('quiz.answers') }, ...answersFor(item).map((c, i) =>
        el('button', { type: 'button', onclick: () => answer(c.id) }, ...(i < KEYS.length ? [el('kbd', { textContent: KEYS[i] })] : []), c.code))));
    return out;
  }
  out.push(...itemScramble(), ...verdict(item));
  if (grade === null) { // a right answer: did the solve go well too?
    const good = action('good', t('quiz.gradeGood'), () => selfGrade('good'));
    good.className = 'primary';
    good.dataset.focus = '';
    out.push(p(t('quiz.gradeAsk')), el('div', { className: 'row' }, good, action('fail', t('quiz.gradeFail'), () => selfGrade('fail'))));
    return out;
  }
  const more = index + 1 < items.length;
  const go = button(t(more ? 'quiz.next' : 'quiz.finish'), next, 'primary');
  go.dataset.focus = '';
  out.push(el('div', { className: 'row' }, go, reviewButton(item.c)));
  return out;
}

/** "Repasar ahora": it leaves the quiz, so it says so. */
function reviewButton(c: Case): HTMLElement {
  const b = action('drill', t('quiz.reviewNow'), () => reviewNow(c));
  b.title = t('quiz.reviewNowHint');
  return b;
}

/** Without a smart cube the user sets each item up by hand: the plan's scramble, or a random-state one. */
function itemScramble(): Node[] {
  if (mode !== 'recognition') return [];
  if (scope.kind === 'official') return scrambleToggle([`${t('quiz.scramble')}: `, el('code', { textContent: scope.quiz.items[index].scramble })]);
  const { scramble: s, random } = items[index];
  const code = el('code', { textContent: s ?? '…', ariaBusy: String(s == null) });
  code.dataset.scramble = ''; // filled in place when the solver answers (prefetch)
  const hint = el('p', { className: 'hint', textContent: t('quiz.randomState'), hidden: !random }); // not true of the fallback
  hint.dataset.random = '';
  return [...scrambleToggle([`${t('quiz.scramble')}: `, code]), hint];
}

/** Tapping the scramble shows (or hides) the whole state it leads to as a 2D net, to check the cube by eye. */
function scrambleToggle(content: (Node | string)[]): Node[] {
  const b = action('net', '', () => { save('quiz-net', (showNet = !showNet)); render(); });
  b.className = 'scramble-toggle';
  b.ariaExpanded = String(showNet);
  b.title = t(showNet ? 'quiz.netHide' : 'quiz.netShow');
  b.append(...content);
  if (!showNet) return [b];
  const net = el('figure', { className: 'quiz-net' });
  const item = items[index];
  net.innerHTML = netSVG(patternToFacelets(item.user), { size: 260, title: t('quiz.netTitle'), colors: heldColors(item.hold) });
  net.append(el('figcaption', { className: 'hint', textContent: neutral ? holdText(item, 'neutral.netCaption') : t('quiz.netCaption') }));
  return [b, net];
}

/** Recognition verdict, with the case and how to solve it. */
function verdict(item: Item): Node[] {
  const a = attempts.at(-1)!;
  return [
    p(a.correct ? t('quiz.correct') : t('quiz.wrong', { chosen: findCase(chosen!)?.code ?? '' }), a.correct ? 'ok' : 'bad'),
    ...(a.correct && grade === 'fail' ? [p(t('quiz.gradedFail'), 'bad')] : []), // "Fallé": it comes back today
    p(t('quiz.time', { time: formatTime(a.recognitionMs) }), 'hint'),
    // right answer: the solution only once the user says how the solve went, as the smart cube counts a look as a fail
    ...(a.correct && grade === null ? [] : a.correct ? howTo(item) : [wrongCase(item)]),
  ];
}

/** A wrong answer: the right case's diagram beside its name and algorithm. */
function wrongCase(item: Item): HTMLElement {
  const pic = el('div', { ariaHidden: 'true' }); // the case's name is next to it
  pic.innerHTML = caseSVG(item.c, 72, undefined, item.hold);
  return el('div', { className: 'quiz-verdict-case' }, pic, el('div', {}, ...howTo(item)));
}

/** The case's name, the AUF it needed and the chosen algorithm. */
function howTo(item: Item): Node[] {
  const alg = preferred(item.c).alg;
  const auf = aufFor(item.c, alg, item.user);
  return [
    el('p', {}, el('strong', { textContent: caseLabel(item.c) })),
    ...(auf ? [el('p', {}, `${t('quiz.aufBefore')} `, algView(auf))] : []),
    el('p', {}, algView(alg)),
  ];
}

/** Solve mode: how the last item went, while the next one is set up (nothing stops between items). */
function feedbackText(f: Feedback): string {
  if (f.grade !== 'fail') return t(f.grade === 'easy' ? 'quiz.gradedEasy' : 'quiz.gradedGood');
  const why = f.issue === 'extra' ? tp('quiz.reviewExtra', f.extra) : f.issue ? t(f.issue === 'skipped' ? 'quiz.reviewSkipped' : 'quiz.reviewAssisted') : '';
  return why ? `${t('quiz.gradedFail')} · ${why}` : t('quiz.gradedFail');
}

function feedbackView(f: Feedback): HTMLElement {
  const pic = el('div', { className: 'quiz-feedback-diagram', ariaHidden: 'true' }); // the case's name is next to it
  pic.innerHTML = caseSVG(f.item.c, 72, f.item.user, f.item.hold);
  return el('div', { className: 'quiz-feedback' }, pic, el('div', {},
    p(feedbackText(f), f.grade === 'fail' ? 'bad' : 'ok'),
    ...howTo(f.item),
    ...(f.grade === 'fail' ? [el('div', { className: 'row' }, reviewButton(f.item.c))] : [])));
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
    el('ol', { className: 'steps' },
      el('li', { ariaCurrent: 'step', textContent: t('practice.stepScramble') }),
      el('li', { textContent: t('quiz.stepSolve') })),
    el('div', { className: 'next', textContent: nextMove() ?? '…' }),
    el('div', { textContent: scrambleDesc() }),
    ...holdHint(items[index], 'neutral.holdAfter'),
    ...scrambleToggle([el('span', { className: 'tokens' }, ...(g?.steps ?? []).flatMap((m, i) => [el('span', { textContent: cube.label(m), className: i === 0 ? 'current' : '' }), ' ']))]),
    p(t('practice.scrambleHint'), 'hint'),
    el('div', { className: 'row' }, action('skip', t('quiz.skip'), skip)),
    ...(feedback ? [feedbackView(feedback)] : []), // below: the guide stays where it always is
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
    ...holdHint(item, 'neutral.holdSolve'),
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
  const retry = [...new Set([...toRetry(cases, s), ...issues.map(({ l }) => l.item.c.id), ...failed])].map((id) => findCase(id)!);
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
  .map((l) => ({ l, r: review(l.done, centerMoves(solution(l.item), onCube(l.item)), l.skipped, l.assisted) }))
  .filter(({ r }) => r.issue);

/** What was done on each item with an error, next to what the chosen algorithm does. */
function reviewSection(issues: ReturnType<typeof reviewed>): Node[] {
  const title = el('h3', { textContent: t('quiz.review') });
  if (!issues.length) return [title, p(t('quiz.reviewClean'), 'ok')];
  const turns = (item: Item, moves: string[], mark: (i: number) => boolean, cls: string) => algView(moves.map((m) => item.hold === IDENTITY ? cube.label(m) : unmapMove(m, onCube(item))), { mark: (i) => (mark(i) ? cls : '') });
  return [title, p(tp('quiz.reviewCount', issues.length, { total: logs.length }), 'hint'), ...issues.map(({ l, r }) =>
    el('div', { className: 'review' },
      el('p', {}, el('strong', { textContent: `${l.n}. ${caseLabel(l.item.c)}` }), ' · ',
        el('span', { className: 'bad', textContent: r.issue === 'extra' ? tp('quiz.reviewExtra', r.extra) : t(r.issue === 'skipped' ? 'quiz.reviewSkipped' : 'quiz.reviewAssisted') })),
      el('p', {}, `${t('quiz.reviewAlg')}: `, algView(solution(l.item))),
      // where it went off course: the user's turns from there in red, the expected turn at that point underlined
      ...(l.skipped && !r.mine.length ? [] : [el('p', {}, `${t('quiz.reviewMine')}: `, turns(l.item, r.mine, (i) => i >= r.divergeAt, 'bad'))]),
      el('p', {}, `${t('quiz.reviewExpected')}: `, turns(l.item, r.expected, (i) => !l.skipped && i === r.divergeAt && r.divergeAt < r.mine.length, 'current'))))];
}

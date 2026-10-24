// The Quiz (retener), the same activity from a case page, a group, a phase, the whole method or the plan's own
// quizzes: only the scope changes. Setup: which cases (by hand, by learning status, slowest, due today…) and in which
// order (uniform, as often as they come up in a solve, due first). Each item, timed:
// - With a synced cube: 1) Mezcla, guided to a random state of the case; 2) Resuelve, on the clock from the first
//   turn, without being asked its name. Graded by itself (time, turns, efficiency).
// - Without one: the clock card, as in Practicar: the figure (no arrows: they'd give the case away) and the random-state
//   scramble, big; a tap (or Space) hides them and starts the clock, the next stops it, then Limpio (Siguiente) or Fallé
//   (the answer, graded as failed).
// Solved: the time, turns and grade with the case's best and average, then Repetir (the same case, another state) or
// Siguiente. A wrong answer, "Me atasqué", or (with the cube) too many turns or too long: the explanation (figure,
// algorithm with its triggers, recognition, fingers, animation on demand), then Reintentar or Siguiente. Saltar is
// always there. Every item grades its case for the spaced repetition (store.ts) and every solve counts as a repetition
// of it; scoring lives in score.ts, a short history of sessions in this browser; the errors are reviewed at the end.
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, YELLOW_UP, centerMoves, htm, merge, tokenize, turnCount, unmapMove, type Frame } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView, scrambleNote } from '../notation-view.ts';
import { lang, loc, t, tp, type MessageKey } from '../i18n.ts';
import {
  HOLDS, caseState, goalReached, holdIn, llSpecs, llSteps, makeQuizItems, quizPattern, randomStateScramble, specsFor,
  type Auf, type LLStep, type QuizSpec,
} from './cube.ts';
import { heldColors, netSVG } from './diagram.ts';
import { cube, type CubeListener } from './link.ts';
import { METHODS, findCase } from './methods.ts';
import { inlineText } from '../rich-text-view.ts';
import { Animation, caseSVG, comparisonText, deltaClass, el, fingersView, loadCase, movesView, openPractice } from './practice.ts';
import { compare } from './practiceSession.ts';
import { caseProbability } from './probability.ts';
import { average, learningFor, load, preferred, recordGrade, recordRep, save, setting, statsFor, type Grade } from './store.ts';
import {
  addSession, aufFor, autoGrade, byCase, isStuck, lastSession, parseHistory, referenceHtm, review, score, selectCases, solutionFor, spacedTiers,
  toRetry, weightedOrder, type Attempt, type Issue, type Order, type QuizMode, type Selection, type SessionRecord,
} from './score.ts';
import { puzzleOf, type Case, type OfficialQuiz, type Phase } from './types.ts';

export type QuizScope =
  | { kind: 'cases'; id: string; cases: Case[]; title: string; answers?: Case[] } // answers: default `cases`
  | { kind: 'official'; quiz: OfficialQuiz; phase: Phase }
  | { kind: 'll'; id: string; cases: Case[]; title: string }; // full last layer: random LL states, `cases` = the method's OLL and PLL

const $ = (id: string) => document.getElementById(id)!;
const dialog = $('quiz') as HTMLDialogElement;
const body = $('quiz-body');
const helpBox = $('quiz-help'); // the "?": how the screen works, in full (outside #quiz-body, which is rebuilt)
const helpToggle = $('quiz-help-toggle');
helpToggle.onclick = () => {
  helpBox.hidden = !helpBox.hidden;
  helpToggle.ariaExpanded = String(!helpBox.hidden);
};
const status = $('quiz-status'); // persistent live region: #quiz-body is rebuilt, so one inside it wouldn't be announced reliably

const PER_CASE = [3, 5, 10, 20];
const SELECTIONS: Selection[] = ['one', 'pick', 'due', 'learning', 'known', 'slow', 'all'];
const ORDERS: Order[] = ['uniform', 'probability', 'spaced'];
const HISTORY_KEY = 'academy-quiz-history';

export const scopeId = (s: QuizScope): string => (s.kind === 'official' ? s.quiz.id : s.id);
const scopeTitle = (s: QuizScope): string => (s.kind === 'official' ? loc(s.quiz.name) : s.title);

/** Cases the user may answer: an official quiz covers the groups its answers come from. */
function scopeCases(s: QuizScope): Case[] {
  if (s.kind !== 'official') return s.kind === 'cases' ? s.answers ?? s.cases : s.cases;
  const answers = new Set(s.quiz.items.map((it) => it.answer));
  return s.phase.groups.filter((g) => g.cases.some((c) => answers.has(c.id))).flatMap((g) => g.cases);
}

const history = (): SessionRecord[] => parseHistory(load(HISTORY_KEY));
/** Last finished session of a scope, for the academy's quiz buttons. */
export const lastResult = (id: string): SessionRecord | undefined => lastSession(history(), id);
export const percent = (x: number): string => new Intl.NumberFormat(lang, { style: 'percent' }).format(x);

/** The quiz of one case, answered among its group's cases. */
const caseScope = (c: Case): QuizScope => {
  const group = METHODS.flatMap((m) => m.phases).flatMap((p) => p.groups).find((g) => g.cases.includes(c));
  // titled by the group: its cases come up too (Uno solo narrows it to this one)
  return { kind: 'cases', id: c.id, cases: [c], title: group ? t('academy.quizOf', { name: loc(group.name) }) : caseLabel(c), answers: group?.cases };
};

interface Item {
  spec: QuizSpec;
  c: Case;
  user: KPattern; // the state in the user frame: diagram, AUF and reference length
  scramble?: string | null; // recognition: the plan's scramble, or the random-state one (null while the solver works)
  random?: boolean; // ...found by the solver (else, too slow: the merged setup)
  hold: Frame; // color neutral: how the cube is held (place -> color), IDENTITY = yellow up, green front
  steps?: LLStep[]; // full last layer: its OLL and PLL cases (c is then the drill, see llCase)
}

/** The item's frame on the GAN cube: its moves, goal and solution are those of the grip it's held in. */
const onCube = (item: Item): Frame => holdIn(item.hold, YELLOW_UP);

/** What the user is told about an item once it's solved. */
interface Feedback {
  item: Item;
  grade: Grade;
  issue: Issue | null; // solve mode: why it failed
  extra: number; // ...and by how many turns, for 'extra'
}

// ask (Reconoce) → clock (Resuelve) without a cube, scramble (Mezcla) → solve (Resuelve) with one; then done, or
// explain after a mistake
type Screen = 'setup' | 'clock' | 'scramble' | 'solve' | 'done' | 'explain' | 'results';
type Why = 'stuck' | 'fail'; // why the explanation is up
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
let shownAt = 0; // the item became answerable / solvable
let firstMoveAt = 0;
let fromClock = false; // the explanation follows a failed solve on the hand clock: Reintentar goes back to it
let retried = false; // Reintentar: the item is not graded for the SRS again
let done: string[] = []; // quarter turns while solving the current item
let assisted = false;
let clockAt = 0; // without a cube: > 0 while the solve clock runs
let clockMs: number | null = null; // ...its time, once stopped
let why: Why = 'stuck';
let showNet = setting('quiz-net', false); // the scramble's 2D net, to check the cube by eye (kept across items)
let neutral = setting('quiz-neutral', false); // color neutral: each item held a random way (another color on top)
let selection: Selection = 'all'; // which cases (setup), see openQuiz
let order = setting<Order>('quiz-order', 'uniform', (v) => ORDERS.includes(v));
let picked = new Set<string>(); // "Elegir a mano"
let pickGrid: HTMLElement | null = null; // built once per scope: one diagram per case
let feedback: Feedback | null = null; // the solved item's, on the done screen
let failed = new Set<string>(); // cases graded as failed this session: repeated with the misses
/** Execution: what happened on each item, for the review at the end. */
let logs: { item: Item; n: number; done: string[]; skipped: boolean; assisted: boolean }[] = [];

const guide = new PathGuide(() => cube.pattern(), () => {
  if (screen === 'scramble' && guide.reached()) beginSolve(); // an empty plan: already at the state
  render();
});

// The explanation's animation: the item's state and its solution.
const anim = new Animation($('quiz-player'), (pl) => {
  const item = items[index];
  loadCase(pl, kpuzzle, item.c.stage, item.spec.moves, tokenize(solution(item)));
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
  helpBox.hidden = true;
  helpToggle.ariaExpanded = 'false';
  cube.listener = listener;
  if (!dialog.open) dialog.showModal(); // "repeat the failed ones" reopens from inside
  render();
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: the dialog was reopened meanwhile
  if (cube.listener === listener) cube.listener = null;
  guide.stop();
  anim.set(false);
  screen = 'setup';
  onClose();
});

// --- Which cases, in which order ---

/** The case the quiz was opened from (its scope answers among its group). */
const oneCase = (): Case | null => (scope.kind === 'cases' && scope.cases.length === 1 && scopeCases(scope).length > 1 ? scope.cases[0] : null);
/** The smart cube is a 3x3: a 2x2 quiz is solved on a normal cube (the hand clock). */
const smartScope = () => scopeCases(scope).every((c) => puzzleOf(c.stage) === '3x3x3');
const executionNext = () => !!cube.pattern() && smartScope(); // with a cube the quiz is solved on it
const selectContext = () => ({
  one: oneCase(), picked, learning: learningFor, now: Date.now(), timeKey: executionNext() ? 'solveMs' as const : 'recognitionMs' as const,
});
const selected = (sel = selection): Case[] => selectCases(sel, scopeCases(scope), selectContext());

/** From a case: random cases of its group ("Uno solo" one tap away); a retry: its cases (that one, or ticked by hand);
 *  otherwise the last choice, if it has cases. */
function initialSelection(): Selection {
  if (scope.kind !== 'cases') return 'all';
  const retry = scope.id.endsWith(':retry');
  if (oneCase()) return retry ? 'one' : 'all';
  if (scope.cases.length < scopeCases(scope).length) return 'pick';
  if (retry || scope.id === 'today') return 'all'; // every case is being retried, or is due (Hoy's review)
  const last = setting<Selection>('quiz-select', 'all', (v) => SELECTIONS.includes(v));
  return last !== 'one' && selected(last).length ? last : selected('due').length ? 'due' : 'all';
}

function makeSpecs(): QuizSpec[] {
  if (scope.kind === 'll') return llSpecs(perCase, crypto.getRandomValues(new Uint32Array(1))[0], kpuzzle);
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

// the state stays the same in the grip (diagram, scramble, AUF, answers): only the colors and the cube's frame change
function makeItem(spec: QuizSpec, scramble?: string): Item {
  const user = quizPattern(kpuzzle, spec, IDENTITY);
  // ponytail: a method's OLL and PLL sets are complete (ll.test.ts), so no step is ever missing
  const steps = scope.kind === 'll' ? llSteps(user, scope.cases, (c) => preferred(c).alg) ?? [] : undefined;
  return {
    spec, c: steps ? llCase(steps) : findCase(spec.caseId)!, user, steps,
    hold: neutral ? HOLDS[Math.floor(Math.random() * HOLDS.length)] : IDENTITY,
    ...(scramble === undefined ? {} : { scramble, random: false }),
  };
}

/** A full last layer item as a case of its own: its steps one after another, as face turns (so a rotation in one
 *  algorithm can't turn the next), done up to an AUF. Its id is the drill's: times and grades are the drill's. */
function llCase(steps: LLStep[]): Case {
  const code = steps.map((s) => caseLabel(s.c)).join(' + ');
  return {
    id: scopeId(scope), code, name: { es: code }, recognition: { es: '' },
    stage: 'll-corners-twist', // solved up to an AUF, with every last-layer sticker in color (pll-edges shows only the sides)
    algs: [{ id: 'main', alg: merge(steps.flatMap((s) => centerMoves(`${s.auf} ${s.alg}`, IDENTITY))).join(' '), source: 'custom' }],
    setup: '', scdb: null,
  };
}

function start() {
  mode = executionNext() ? 'execution' : 'recognition';
  items = makeSpecs().map((spec, i) => makeItem(spec, scope.kind === 'official' ? scope.quiz.items[i].scramble : undefined));
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
  if (!item || item.scramble !== undefined || mode !== 'recognition') return;
  item.scramble = null;
  // wait for the solver however long its first load takes ("Preparando la mezcla…"): the merged setup is 45–120 turns,
  // so it's only the last resort when the solver fails outright
  void randomStateScramble(item.user, puzzleOf(item.c.stage)).catch(() => null).then((moves) => {
    item.scramble = (moves ?? item.spec.moves).join(' ');
    item.random = !!moves;
    // patched in place: re-rendering the question would drop the focus and a tap in progress on an answer
    const code = items[index] === item && body.querySelector<HTMLElement>('[data-scramble]');
    if (!code) return;
    code.textContent = item.scramble;
    code.ariaBusy = 'false';
    body.querySelector<HTMLElement>('[data-random]')!.hidden = !item.random;
    helpBox.textContent = helpText(); // the "?" explains the random state
  });
}

/** Grades the item's case for the spaced repetition; `time` only for a real one (right answer, solve without help). */
function gradeItem(item: Item, g: Grade, time?: Parameters<typeof recordGrade>[2]) {
  if (!retried) recordGrade(item.c.id, g, time); // a retry, after the answer was shown, doesn't touch the SRS
  if (g === 'fail') failed.add(item.c.id);
}

function startItem() {
  rendered = null; // a new item is a new screen for the focus: its clock, not the last item's Saltar or Lo resolví
  assisted = false;
  done = [];
  firstMoveAt = 0;
  clockAt = 0;
  clockMs = null;
  anim.set(false);
  prefetch(index);
  prefetch(index + 1);
  if (mode === 'execution') {
    screen = 'scramble';
    void guide.start(quizPattern(kpuzzle, items[index].spec, onCube(items[index]))); // cube frame: yellow is the cube's D
  } else {
    // without a cube: the scramble, you start the clock and solve it on your cube (no "which case is it?")
    screen = 'clock';
    shownAt = performance.now();
    attempts.push({ caseId: items[index].c.id, correct: true, recognitionMs: 0 });
  }
  render();
}

function beginSolve() {
  guide.stop();
  screen = 'solve';
  shownAt = performance.now();
  requestAnimationFrame(tick);
}

/** Without a cube, the solve clock: started and stopped by hand (tap or Space); stopped, the user says how it went. */
function toggleClock() {
  if (screen !== 'clock' || clockMs !== null) return;
  if (!clockAt) {
    clockAt = performance.now();
    attempts.at(-1)!.recognitionMs = clockAt - shownAt; // looking at the scramble and planning, before the clock
    requestAnimationFrame(tick);
  } else {
    clockMs = performance.now() - clockAt;
    clockAt = 0;
    attempts.at(-1)!.executionMs = clockMs;
  }
  render();
}

/** Without a cube, after the solve: Siguiente (solved: graded good, the time recorded), Ver respuesta (graded failed,
 *  explained) or Reintentar (the same scramble again, not graded). */
function solvedByHand() {
  const item = items[index];
  if (!retried) gradeItem(item, 'good', { key: 'recognitionMs', ms: attempts.at(-1)!.recognitionMs });
  const n = htm(centerMoves(solution(item), IDENTITY)); // ponytail: no cube, so the moves are the algorithm's
  recordRep(item.c.id, { ms: clockMs!, moves: n, htm: n, clean: true });
  logs.push({ item, n: index + 1, done, skipped: false, assisted: false });
  next();
}

/** Without a cube, "Lo resolví" without stopping a clock: graded good like Siguiente. A running clock is stopped and
 *  counted; never started, nothing is timed (left out of the averages). */
function solvedNoClock() {
  if (clockAt) {
    toggleClock();
    return solvedByHand();
  }
  const item = items[index];
  Object.assign(attempts.at(-1)!, { untimed: true });
  if (!retried) gradeItem(item, 'good');
  logs.push({ item, n: index + 1, done, skipped: false, assisted: false });
  next();
}

function retryClock() {
  retried = true;
  clockAt = 0;
  clockMs = null;
  render();
}

/** "Me atasqué", "Ver respuesta", Fallé (`fail`), or (on the cube) too many turns or too long: graded as failed,
 *  explained. */
function stuck(w: Why = 'stuck') {
  const item = items[index];
  guide.stop();
  if (screen === 'clock') attempts.at(-1)!.correct = false;
  if (screen === 'solve') {
    assisted = true;
    attempts.push({ caseId: item.c.id, correct: false, recognitionMs: (firstMoveAt || performance.now()) - shownAt });
    logs.push({ item, n: index + 1, done, skipped: false, assisted });
  }
  gradeItem(item, 'fail');
  explain(w);
}

function explain(w: Why) {
  why = w;
  fromClock = screen === 'clock';
  screen = 'explain';
  render();
}

/** Closes the quiz and drills the case: its practice on the Memoria muscular tab. */
function reviewNow(c: Case) {
  saveSession(); // the items done so far count
  dialog.close(); // releases the cube for the practice
  void openPractice(c, () => {}, () => void openQuiz(caseScope(c)), 'drill');
}

function solved() {
  const now = performance.now();
  const item = items[index];
  const { issue, extra } = review(done, centerMoves(solution(item), onCube(item)), false, assisted);
  const g = autoGrade(issue, now - shownAt, item.hold !== IDENTITY ? null : learningFor(item.c.id)?.solveMs ?? null);
  recordRep(item.c.id, { ms: now - firstMoveAt, moves: done.length, htm: turnCount(done), clean: !issue });
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
  screen = 'done';
  render();
}

/** Saltar: tried on the cube, it's a fail; not tried yet, it isn't graded. Recognised (clock), the answer stands. */
function skip() {
  guide.stop();
  const item = items[index];
  if (screen === 'solve') gradeItem(item, 'fail');
  if (screen === 'clock') attempts.at(-1)!.correct = false;
  else attempts.push({ caseId: item.c.id, correct: false, recognitionMs: screen === 'solve' ? performance.now() - shownAt : 0 });
  logs.push({ item, n: index + 1, done, skipped: true, assisted });
  next();
}

/** Repetir: the same case again, from another random state (an item more, right after this one). */
function repeat() {
  const c = items[index].c, seed = crypto.getRandomValues(new Uint32Array(1))[0];
  items.splice(index + 1, 0, makeItem(scope.kind === 'll' ? llSpecs(1, seed, kpuzzle)[0] : specsFor([c], seed, kpuzzle)[0]));
  next();
}

function next() {
  retried = false;
  if (++index < items.length) startItem();
  else finish();
}

function finish() {
  guide.stop();
  anim.set(false);
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
      if (goalReached(items[index].c.stage, cube.pattern()!, onCube(items[index]))) return solved();
      if (isStuck(turnCount(done), referenceHtm(items[index].c, items[index].user, preferred(items[index].c)), performance.now() - firstMoveAt)) return stuck();
    } else return;
    render();
  },
  sync(reset) {
    if (screen === 'setup') render(); // the mode follows the cube until the quiz starts
    else if (mode === 'execution' && !cube.pattern() && screen !== 'results') finish(); // disconnected: score what was done
    else if (screen === 'scramble') void guide.replan();
    else if (screen === 'solve' && reset) startItem(); // the item's state is gone: set it up again
    // the cube lost the last turn and the corrected state is at the goal (any other drift: the next turn is judged right)
    else if (screen === 'solve' && goalReached(items[index].c.stage, cube.pattern()!, onCube(items[index]))) solved();
  },
};

// Live clocks (one loop per solve, started in beginSolve / toggleClock); they stop by themselves when the screen changes.
// On the cube the time runs from the first turn; too long, and the quiz steps in (isStuck).
function tick() {
  if (!dialog.open || !(screen === 'solve' || (screen === 'clock' && clockAt))) return;
  const now = performance.now();
  if (screen === 'solve' && firstMoveAt && isStuck(0, null, now - firstMoveAt)) return stuck();
  const clock = document.getElementById('quiz-clock'); // re-rendered on every move: look it up each frame
  if (clock) clock.textContent = formatTime(screen === 'solve' ? (firstMoveAt ? now - firstMoveAt : 0) : now - clockAt);
  requestAnimationFrame(tick);
}

// On document: re-rendering drops the focus to <body>, outside the dialog, where its own listener can't hear.
// The hand clock's keys: Space starts and stops it, then means Limpio; X, once stopped, is Fallé.
document.addEventListener('keydown', (e) => {
  if (!dialog.open || e.ctrlKey || e.metaKey || e.altKey || screen !== 'clock' || e.repeat) return;
  const target = e.target as Element;
  if (e.code === 'KeyX' && clockMs !== null && !target.closest?.('input')) {
    e.preventDefault();
    return stuck('fail');
  }
  if (e.code !== 'Space' || target.closest?.('button, input, select, summary, a')) return;
  e.preventDefault(); // a focused button presses itself; elsewhere Space is the clock
  if (clockMs !== null) solvedByHand();
  else toggleClock();
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
  dialog.dataset.puzzle = items.length ? puzzleOf(items[0].c.stage) : '3x3x3'; // for the move tooltips: a quiz is of one puzzle
  const view = { setup: renderSetup, clock: renderClock, scramble: renderScramble, solve: renderSolve, done: renderDone, explain: renderExplain, results: renderResults }[screen];
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
  helpBox.textContent = helpText();
  helpToggle.hidden = !helpBox.textContent;
  if (helpToggle.hidden) helpBox.hidden = true;
}

/** The "?" of each screen: what the screen itself keeps to a line. */
function helpText(): string {
  switch (screen) {
    case 'setup': return [t(executionNext() ? 'quiz.howCube' : 'quiz.howNoCube'), `${t('neutral.option')}: ${t('neutral.optionHint')}`].join(' ');
    case 'clock': return [t(clockMs !== null ? 'quiz.helpClockDone' : 'quiz.helpClock'), items[index]?.random ? t('quiz.randomState') : ''].join(' ').trim();
    case 'scramble': return t('quiz.helpScramble');
    case 'solve': return t('quiz.helpSolve');
    case 'done': return t(feedback?.grade === 'fail' ? 'quiz.helpDoneFail' : 'quiz.helpDone');
    case 'explain': return t('quiz.helpExplain');
    default: return '';
  }
}

/** What the live region says: the question, the next scramble move, the result… */
function statusText(): string {
  const where = items.length ? t('quiz.progress', { n: index + 1, total: items.length }) : '';
  const item = items[index];
  switch (screen) {
    case 'clock': return clockMs !== null // stopped: the time, against the case's record, and the question
      ? `${where}. ${formatTime(clockMs)}. ${comparisonText(compare(clockMs, statsFor(item.c.id))!)}. ${t('practice.card.grade')}`
      : `${where}. ${neutral && !clockAt ? `${holdText(item)} ` : ''}${t(clockAt ? 'practice.timerStop' : 'quiz.helpClock')}`;
    case 'scramble': return [nextMove() ?? '', scrambleDesc(), neutral && item ? holdText(item, 'neutral.holdAfter') : ''].join(' ').trim();
    case 'solve': return `${where}. ${t('quiz.helpSolve')}${neutral ? ` ${holdText(item, 'neutral.holdSolve')}` : ''}`; // not the clock: it would talk every frame
    case 'done': return `${feedbackText(feedback!)} ${t('quiz.time', { time: formatTime(itemTime()) })}`;
    case 'explain': return `${whyText()} ${caseLabel(item.c)}`;
    case 'results': return t('quiz.results');
    default: return '';
  }
}

/** A choice as a chip (a radio or a checkbox, with an optional count) that keeps the focus across re-renders. */
function chip(type: 'radio' | 'checkbox', name: string, value: string, checked: boolean, choose: (on: boolean) => void, label: string, count?: number, disabled = false): HTMLElement {
  const input = el('input', { type, name, checked, disabled });
  input.dataset.action = `${name}-${value}`;
  input.onchange = () => {
    choose(input.checked);
    render();
  };
  return el('label', { className: 'quiz-chip' }, input, el('span', { textContent: label }), ...(count === undefined ? [] : [chipCount(count)]));
}

/** A chip's count: the number on screen, "7 casos" for a screen reader. */
function chipCount(n: number): HTMLElement {
  const box = el('small');
  setCount(box, n);
  return box;
}
const setCount = (box: HTMLElement, n: number) =>
  box.replaceChildren(el('span', { ariaHidden: 'true', textContent: String(n) }), el('span', { className: 'sr-only', textContent: tp('quiz.cases', n) }));

const SELECTION_LABEL: Record<Selection, MessageKey> = {
  one: 'quiz.selOne', pick: 'quiz.selPick', due: 'quiz.selDue', learning: 'quiz.selLearning', known: 'quiz.selKnown', slow: 'quiz.selSlow', all: 'quiz.selAll',
};
const ORDER_LABEL: Record<Order, [MessageKey, MessageKey]> = {
  uniform: ['quiz.orderUniform', 'quiz.orderUniformHint'],
  probability: ['quiz.orderProbability', 'quiz.orderProbabilityHint'],
  spaced: ['quiz.orderSpaced', 'quiz.orderSpacedHint'],
};

function renderSetup(): Node[] {
  const execution = executionNext();
  const out: Node[] = [];
  let n: number; // items
  if (scope.kind === 'official') {
    n = scope.quiz.items.length;
    out.push(p(loc(scope.quiz.instructions), 'prose'), p(tp('quiz.items', n), 'hint'));
  } else if (scope.kind === 'll') {
    n = perCase;
    out.push(p(t('ll.intro'), 'prose'), el('label', { className: 'academy-method' }, t('ll.count'), perCaseSelect()));
  } else {
    const one = oneCase();
    const choices = SELECTIONS.filter((x) => x !== 'one' || one).map((x) => {
      const count = selected(x).length;
      const label = t(SELECTION_LABEL[x], { code: one?.code ?? '' });
      // by hand stays choosable with none ticked: that's where you tick them
      const choice = chip('radio', 'quiz-select', x, x === selection, () => save('quiz-select', (selection = x)), label, count, !count && x !== 'pick');
      choice.querySelector('small')!.dataset.count = x;
      return choice;
    });
    // no case of the scope with a probability (F2L, the beginner's last layer): it would just be uniform
    const noOdds = scopeCases(scope).every((c) => caseProbability(c.id, kpuzzle) === null);
    const orders = ORDERS.map((x) => chip('radio', 'quiz-order', x, x === order, () => save('quiz-order', (order = x)), t(ORDER_LABEL[x][0]), undefined,
      x === 'probability' && noOdds));
    const cases = selected().length;
    n = cases * perCase;
    out.push(
      el('fieldset', { className: 'chips-field' }, el('legend', { textContent: t('quiz.which') }), el('div', { className: 'chip-set' }, ...choices)),
      ...(selection === 'pick' ? [pickView()] : []),
      ...(selection === 'one' ? [] : [el('fieldset', { className: 'chips-field' }, el('legend', { textContent: t('quiz.order') }),
        el('div', { className: 'chip-set' }, ...orders), p(t(ORDER_LABEL[order][1]), 'hint'))]),
      el('div', { className: 'row quiz-setup-row' }, el('label', { className: 'academy-method' }, t('quiz.perCase'), perCaseSelect()), neutralChip()));
  }
  if (scope.kind !== 'cases') out.push(el('div', { className: 'row quiz-setup-row' }, neutralChip()));
  if (cube.pattern() && !execution) out.push(p(t('practice.no2x2Cube'), 'hint'));
  const go = button(t('quiz.start'), start, 'primary practice-start');
  go.disabled = !n;
  go.dataset.focus = '';
  const last = lastResult(scopeId(scope));
  const summary = p([...(scope.kind === 'cases' ? [setupSummary(n / perCase)] : []), ...(last ? [t('quiz.last', { result: summaryLine(last) })] : [])].join(' · '), 'hint');
  summary.dataset.count = 'total';
  out.push(go, summary);
  return out;
}

/** Color neutral, as a chip (its explanation is behind the "?"). */
const neutralChip = () => chip('checkbox', 'neutral', 'on', neutral, (on) => save('quiz-neutral', (neutral = on)), t('neutral.option'));

function perCaseSelect(): HTMLSelectElement {
  const select = el('select', {}, ...PER_CASE.map((k) => el('option', { value: String(k), textContent: String(k), selected: k === perCase })));
  select.onchange = () => {
    save('quiz-per-case', (perCase = +select.value));
    render();
  };
  return select;
}

const setupSummary = (cases: number) => `${tp('quiz.cases', cases)} · ${tp('quiz.items', cases * perCase)}`;

/** Ticking cases only changes counts: patched in place, so the grid keeps its scroll (and Safari, which doesn't focus a
 *  clicked checkbox, doesn't move the focus to "Empezar"). */
function pickedChanged() {
  const n = selected('pick').length;
  setCount(body.querySelector<HTMLElement>('[data-count="pick"]')!, n);
  const last = lastResult(scopeId(scope));
  body.querySelector('[data-count="total"]')!.textContent = [setupSummary(n), ...(last ? [t('quiz.last', { result: summaryLine(last) })] : [])].join(' · ');
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
      pic.innerHTML = caseSVG(c, caseState(kpuzzle, c.algs[0].alg, IDENTITY), { size: 56 });
      box.append(pic, el('span', { textContent: c.code }));
      return box;
    }))));
}


const color = (face: string) => t(`paint.color.${face}` as MessageKey);
/** Color neutral: which colors go up and in front for this item. */
const holdText = (item: Item, key: MessageKey = 'neutral.hold') => t(key, { up: color(item.hold.U), front: color(item.hold.F) });
const holdHint = (item: Item, key?: MessageKey): Node[] => (neutral ? [el('p', {}, el('strong', { textContent: holdText(item, key) }))] : []);

const summaryLine = (r: SessionRecord) =>
  [percent(r.accuracy), timeOr(r.ms), ...(r.efficiency === null ? [] : [t('quiz.effShort', { pct: percent(r.efficiency) })])].join(' · ');

/** "3 de 35" with a bar. */
const progress = () => {
  const bar = el('div', { className: 'quiz-bar', ariaHidden: 'true' }, el('span'));
  (bar.firstChild as HTMLElement).style.width = `${(100 * index) / items.length}%`;
  return el('div', { className: 'quiz-progress' }, bar, el('span', { className: 'hint', textContent: t('quiz.progress', { n: index + 1, total: items.length }) }));
};

/** The clock card (practice.ts draws Practicar's the same way): `state` for its look, `onTap` makes it a tap target. */
function card(state: string, children: Node[], onTap?: () => void): HTMLElement {
  const box = el('div', { className: 'practice-card quiz-card' }, ...children);
  box.dataset.state = state;
  if (onTap) {
    box.toggleAttribute('data-tap', true);
    box.onclick = (e) => {
      if (!(e.target as Element).closest('button:not([data-action="clock"]), a, summary, input')) onTap(); // the clock: its tap bubbles here
    };
  }
  return box;
}

/** The row of the screen's other actions, under the card. */
const actions = (...buttons: HTMLElement[]) => el('div', { className: 'row practice-actions' }, ...buttons);

/** The item's state as a figure; `arrows` (PLL) only once the case is known. */
function diagram(item: Item, size = 180, arrows = false): HTMLElement {
  const box = el('div', { className: 'quiz-diagram' });
  box.innerHTML = caseSVG(item.c, item.user, { size, title: arrows ? caseLabel(item.c) : t('quiz.question'), colors: heldColors(item.hold), arrows: arrows && !item.steps });
  return box;
}

/** Step indicator: 1 Reconoce (no cube) or Mezcla (cube) · 2 Resuelve. */
const steps = (current: 1 | 2) => el('ol', { className: 'steps', ariaLabel: t('practice.steps') },
  ...[t('practice.stepScramble'), t('practice.stepSolve')].map((text, i) =>
    el('li', { textContent: text, ...(i + 1 === current ? { ariaCurrent: 'step' } : {}) })));

/** "Me atasqué" (or "No lo sé" on the question): the explanation. */
const stuckButton = (label: MessageKey = 'quiz.stuck') => action('stuck', t(label), () => stuck());

/** Without a cube, the clock card: listo, the figure (no arrows: the case isn't named) and the scramble, big; a tap or
 *  Space hides them and starts the clock; parado, the time against the case's record, Limpio (solved: Siguiente) or
 *  Fallé (the answer). Lo resolví, Saltar and Ver respuesta stay under it. */
function renderClock(): Node[] {
  const item = items[index];
  const stopped = clockMs !== null;
  const ready = !clockAt && !stopped;
  // stopped, it's no longer a button: the focus moves on to Limpio
  const clock = stopped ? el('div', { className: 'practice-clock', textContent: formatTime(clockMs!) })
    : el('button', { type: 'button', className: `practice-clock${clockAt ? ' running' : ''}${ready ? ' small' : ''}` },
      el('span', { id: 'quiz-clock', textContent: formatTime(clockAt ? performance.now() - clockAt : 0) }));
  if (!stopped) Object.assign(clock.dataset, { action: 'clock', focus: '' });
  const hint = p(t(stopped ? 'practice.card.grade' : clockAt ? 'practice.timerStop' : 'practice.card.ready'), 'hint');
  hint.id = 'quiz-card-hint';
  clock.setAttribute('aria-describedby', hint.id);
  if (!stopped) {
    return [progress(), card(clockAt ? 'running' : 'ready', [...holdHint(item), ...(ready ? itemScramble() : []), clock, hint], toggleClock),
      actions(action('solved', t('quiz.solvedNoClock'), solvedNoClock), action('skip', t('quiz.skip'), skip), stuckButton('quiz.showAnswer'))];
  }
  const c = compare(clockMs!, statsFor(item.c.id))!; // clean until said otherwise: never null
  const delta = p(comparisonText(c), ['delta', deltaClass(c)].filter(Boolean).join(' '));
  const ok = action('next', t('practice.cleanBtn'), solvedByHand);
  ok.className = 'primary';
  ok.dataset.focus = '';
  const miss = action('stuck', '', () => stuck('fail'));
  miss.ariaKeyShortcuts = 'x';
  miss.append(el('span', { textContent: t('practice.failBtn') }), el('kbd', { className: 'key-hint', ariaHidden: 'true', textContent: 'X' }));
  return [progress(), card('stopped', [clock, delta, hint, el('div', { className: 'row grade' }, ok, miss)]),
    actions(action('retry', t('quiz.retryItem'), retryClock))];
}

/** The item's time: on the cube, first turn to solved; without one, the hand clock. */
const itemTime = () => attempts.at(-1)?.executionMs ?? 0;

/** Reintentar: the same item; without a cube, after a failed solve, only the solve clock (the case is already known). */
function retryButton(): HTMLElement {
  const b = action('retry', t('quiz.retryItem'), () => {
    retried = true;
    anim.set(false); // the explanation's animation: the clock card comes back alone
    if (fromClock) {
      clockAt = 0;
      clockMs = null;
      screen = 'clock';
      return render();
    }
    startItem();
  });
  b.dataset.focus = '';
  return b;
}

/** Siguiente, or Ver resultados after the last item. */
function nextButton(primary: boolean): HTMLElement {
  const b = action('next', t(index + 1 < items.length ? 'quiz.next' : 'quiz.finish'), next);
  if (primary) {
    b.className = 'primary';
    b.dataset.focus = '';
  }
  return b;
}

/** Solved: time, turns and grade, the case's best and average; Repetir (the same case, another state) or Siguiente. */
function renderDone(): Node[] {
  const f = feedback!;
  const a = attempts.at(-1)!;
  const s = statsFor(f.item.c.id);
  const avg = s && average(s);
  return [
    progress(),
    card('result', [
      el('div', { className: 'practice-clock', textContent: formatTime(itemTime()) }),
      p(feedbackText(f), `delta ${f.grade === 'fail' ? 'slower' : 'faster'}`),
      p(t('quiz.recognized', { time: formatTime(a.recognitionMs) }), 'hint'),
      ...(a.htm === undefined ? [] : [p(t('practice.rep', { moves: a.moves!, htm: a.htm, ref: a.refHtm ?? '–' }), 'hint')]),
      ...(s ? [p(t('quiz.caseStats', { best: timeOr(s.best), avg: timeOr(avg ?? null) }), 'hint')] : []),
      el('div', { className: 'row grade' }, nextButton(true), ...(f.grade === 'fail' ? [retryButton()] : [action('repeat', t('quiz.repeat'), repeat)])),
    ]),
    feedbackView(f),
    ...(f.grade === 'fail' ? [actions(action('repeat', t('quiz.repeat'), repeat), ...reviewButton(f.item))] : []),
  ];
}

const whyText = () => t(why === 'stuck' ? 'quiz.whyStuck' : 'quiz.whyFail');

/** After a mistake: the case explained (figure, algorithm with its triggers, how to recognise it, fingers, animation on
 *  demand); Reintentar (the same item) or Siguiente. */
function renderExplain(): Node[] {
  const item = items[index];
  const tokens = tokenize(solution(item));
  const retry = retryButton();
  retry.className = 'primary';
  return [
    progress(), p(whyText(), 'bad'), diagram(item, 140, true),
    ...(item.steps ? howTo(item) : [ // full last layer: each case with its AUF and algorithm
      el('p', {}, el('strong', { textContent: caseLabel(item.c) })),
      el('p', { className: 'hint' }, ...inlineText(loc(item.c.recognition))),
      movesView(tokens), fingersView(tokens)]),
    el('div', { className: 'row' }, anim.button()),
    el('div', { className: 'row' }, retry, nextButton(false), ...reviewButton(item)),
  ];
}

/** "Repasar ahora": it leaves the quiz, so it says so. Not for a full last layer: it's no case of its own. */
function reviewButton(item: Item): HTMLElement[] {
  if (item.steps) return [];
  const b = action('drill', t('quiz.reviewNow'), () => reviewNow(item.c));
  b.title = t('quiz.reviewNowHint');
  return [b];
}

/** Without a smart cube the user sets each item up by hand: the plan's scramble, or a random-state one, big on the card
 *  next to the state's figure. */
function itemScramble(): Node[] {
  if (mode !== 'recognition') return [];
  const { scramble: s, random } = items[index];
  const code = el('code', { className: 'card-moves', textContent: s ?? t('quiz.preparing'), ariaBusy: String(s == null) });
  code.dataset.scramble = ''; // filled in place when the solver answers (prefetch)
  const hint = el('p', { className: 'hint', textContent: t('quiz.randomStateShort'), hidden: !random }); // not true of the fallback
  hint.dataset.random = '';
  return [el('div', { className: 'card-scramble' }, diagram(items[index], 96),
    el('div', {}, code, scrambleNote(items[index].hold.U, items[index].hold.F), hint)), ...netToggle()];
}

/** "Ver en 2D": the whole state the scramble leads to as a net, to check the cube by eye (kept across items). */
function netToggle(): Node[] {
  const b = action('net', t(showNet ? 'quiz.net2dHide' : 'quiz.net2d'), () => {
    save('quiz-net', (showNet = !showNet));
    render();
    body.querySelector<HTMLElement>('[data-action="clock"]')?.focus({ preventScroll: true }); // Space: the clock again, not the net
  });
  b.className = 'small';
  b.ariaExpanded = String(showNet);
  b.title = t(showNet ? 'quiz.netHide' : 'quiz.netShow');
  if (!showNet) return [b];
  const net = el('figure', { className: 'quiz-net' });
  const item = items[index];
  net.innerHTML = netSVG(patternToFacelets(item.user), { size: 220, title: t('quiz.netTitle'), colors: heldColors(item.hold) });
  net.append(el('figcaption', { className: 'hint', textContent: neutral ? holdText(item, 'neutral.netCaption') : t('quiz.netCaption') }));
  return [b, net];
}

/** The case's name, the AUF it needed and the chosen algorithm; a full last layer: each of its cases so, and its skips. */
function howTo(item: Item): Node[] {
  const alg = preferred(item.c).alg;
  const steps: { c: Case; auf: Auf | null; alg: string }[] = item.steps ?? [{ c: item.c, auf: aufFor(item.c, alg, item.user), alg }];
  const skipped = (k: string) => !!item.steps && !item.steps.some((s) => s.c.stage.startsWith(k));
  return [
    ...(skipped('oll') ? [p(t('ll.ollSkip'), 'hint')] : []),
    ...steps.flatMap((s) => [
      el('p', {}, el('strong', { textContent: caseLabel(s.c) })),
      ...(s.auf ? [el('p', {}, `${t('quiz.aufBefore')} `, algView(s.auf))] : []),
      el('p', {}, algView(s.alg)),
    ]),
    ...(skipped('pll') ? [p(t('ll.pllSkip'), 'hint')] : []),
  ];
}

/** How a solved item went: its grade, and why it failed. */
function feedbackText(f: Feedback): string {
  if (f.grade !== 'fail') return t(f.grade === 'easy' ? 'quiz.gradedEasy' : 'quiz.gradedGood');
  const why = f.issue === 'extra' ? tp('quiz.reviewExtra', f.extra) : f.issue ? t(f.issue === 'skipped' ? 'quiz.reviewSkipped' : 'quiz.reviewAssisted') : '';
  return why ? `${t('quiz.gradedFail')} · ${why}` : t('quiz.gradedFail');
}

/** The solved case: its figure, name and algorithm (the grade is on the card above). */
function feedbackView(f: Feedback): HTMLElement {
  const pic = el('div', { className: 'quiz-feedback-diagram', ariaHidden: 'true' }); // the case's name is next to it
  pic.innerHTML = caseSVG(f.item.c, f.item.user, { size: 72, colors: heldColors(f.item.hold), arrows: !f.item.steps });
  return el('div', { className: 'quiz-feedback' }, pic, el('div', {}, ...howTo(f.item)));
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
    card('scramble', [
      steps(1),
      el('div', { className: 'next', textContent: nextMove() ?? '…' }),
      el('div', { textContent: scrambleDesc() }),
      ...holdHint(items[index], 'neutral.holdAfter'),
      el('div', { className: 'tokens' }, ...(g?.steps ?? []).flatMap((m, i) => [el('span', { textContent: cube.label(m), className: i === 0 ? 'current' : '' }), ' '])),
      diagram(items[index], 96), // where the scramble leads
      ...netToggle(),
    ]),
    actions(action('skip', t('quiz.skip'), skip)),
  ];
}

function renderSolve(): Node[] {
  const item = items[index];
  return [
    progress(),
    card(firstMoveAt ? 'running' : 'solve', [
      steps(2),
      ...holdHint(item, 'neutral.holdSolve'),
      el('div', { id: 'quiz-clock', className: `practice-clock${firstMoveAt ? ' running' : ''}`, role: 'timer', textContent: formatTime(firstMoveAt ? performance.now() - firstMoveAt : 0) }),
      p(tp('quiz.turns', turnCount(done)), 'hint'), // as the review counts them
      diagram(item, 96),
    ]),
    actions(action('skip', t('quiz.skip'), skip), stuckButton()),
  ];
}

function renderResults(): Node[] {
  if (!attempts.length) return [p(t('quiz.empty')), el('div', { className: 'row' }, button(t('dialog.close'), () => dialog.close()))];
  const s = score(attempts);
  const cases = byCase(attempts);
  const execution = mode === 'execution';
  const tile = (k: string, v: string, sub = '') => el('div', {}, el('small', { textContent: k }), el('strong', { textContent: v }), ...(sub ? [el('small', { textContent: sub })] : []));
  const summary = el('div', { className: 'quiz-tiles' },
    tile(t('quiz.accuracy'), percent(s.accuracy), t('quiz.accuracyOf', { correct: s.correct, n: s.n })),
    tile(t('quiz.avgRecognition'), timeOr(s.recognitionMs)),
    tile(t('quiz.avgExecution'), timeOr(s.executionMs)), // both modes time the solve
    ...(execution ? [tile(t('quiz.avgEfficiency'), pctOr(s.efficiency))] : []));
  const th = (text: string) => el('th', { textContent: text, scope: 'col' });
  const td = (text: string) => el('td', { textContent: text });
  const table = el('table', { className: 'quiz-table' },
    el('thead', {}, el('tr', {}, th(t('quiz.colCase')), th(t('quiz.colAccuracy')), th(t('quiz.colTime')), ...(execution ? [th(t('quiz.colEfficiency'))] : []))),
    el('tbody', {}, ...cases.map((c) => el('tr', {},
      td(findCase(c.caseId)?.code ?? scopeTitle(scope)), // a full last layer's items are the drill's
      td(`${c.correct}/${c.n}`),
      td(timeOr(c.ms)),
      ...(execution ? [td(pctOr(c.efficiency))] : [])))));
  const issues = execution ? reviewed() : [];
  // the review's errors (e.g. extra turns) are worth repeating too, not only misses and slow cases
  const bad = [...new Set([...toRetry(cases, s), ...issues.map(({ l }) => l.item.c.id), ...failed])];
  const retry = bad.flatMap((id) => findCase(id) ?? []); // a full last layer has no cases to retry: a new round is its retry
  const close = button(t('dialog.close'), () => dialog.close());
  const actions = el('div', { className: 'row' });
  if (retry.length) {
    const again = button(t('quiz.retry', { n: retry.length }), () => void openQuiz({
      kind: 'cases', id: `${scopeId(scope)}:retry`, cases: retry, answers: scopeCases(scope), title: t('quiz.retryTitle', { title: scopeTitle(scope) }),
    }, onClose), 'primary practice-start');
    again.dataset.focus = '';
    actions.append(again, close);
  } else {
    close.dataset.focus = '';
    actions.append(close);
  }
  return [el('h3', { textContent: t('quiz.results') }), summary, table, ...(execution ? reviewSection(issues) : []),
    ...(bad.length ? [] : [p(t('quiz.allGood'), 'ok')]), actions];
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

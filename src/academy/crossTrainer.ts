// White-cross trainer, a modal launched from the guide page: first the setup (level, size, hint), then the session.
// Each item is a real random scramble brought to a cross of the level's length (crossItem).
// With a synced cube: guided to that state, up to 15 s to plan (Space or the first turn starts), then the cross on
// the cube. Without one: the state in 3D and a move pad. After each item, the user's turns next to up to 3
// optimal crosses; at the end, the session against the level's goal (crossScore.ts), kept in a short history.
import { TwistyPlayer } from 'cubing/twisty';
import { randomScrambleForEvent } from 'cubing/scramble';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import type { Puzzle } from './types.ts';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { YELLOW_UP, centerMoves, compact, explainMove, invertTokens, turnCount } from '../notation.ts';
import { formatTime, INSPECTION_MS } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { lang, loc, percent, t, tp } from '../i18n.ts';
import { crossSolved, solveCross } from './cross.ts';
import { crossGuide, type CrossLevel } from './crossGuide.ts';
import {
  addCrossSession, crossItem, extraTurns, levelProgress, minSolved, nextLevel, parseCrossHistory, summarize,
  type CrossAttempt, type CrossMode, type CrossSession,
} from './crossScore.ts';
import { cube, type CubeListener } from './link.ts';
import { aim, setPuzzle } from './practice.ts';
import { FULL_MASK } from './cube.ts';
import { $, el } from '../el.ts';
import { load, save, setting } from './store.ts';

const dialog = $('cross') as HTMLDialogElement;
const viewer = $('cross-viewer') as HTMLDialogElement;
const body = $('cross-body');
const status = $('cross-status'); // persistent live region: #cross-body is rebuilt on every move
const stage = $('cross-player'); // the virtual mode's 3D cube: outside #cross-body, so it's never re-attached

const HISTORY_KEY = 'academy-cross-history';
const crossHistory = (): CrossSession[] => parseCrossHistory(load(HISTORY_KEY));

/** The pad's moves, a row per amount so each face is a column. */
const PAD = ['', "'", '2'].flatMap((s) => [...'UDRLFB'].map((f) => f + s));

interface Item {
  scramble: string; // user frame, from solved (yellow up, green front)
  pattern: KPattern; // the state, user frame: the white cross is D
  optimal: number;
  solutions: string[][]; // up to 3 optimal crosses, user frame
}

type Screen = 'setup' | 'loading' | 'scramble' | 'inspect' | 'solve' | 'feedback' | 'summary';
let kpuzzle: KPuzzle;
const COUNTS = [5, 10, 20];
let level: CrossLevel;
let picked = false; // first open: the level last chosen, else the first one whose goal isn't met yet
let count = setting('cross-count', 10, (n) => COUNTS.includes(n));
let showOptimal = setting('cross-optimal', false);
const pick = (l: CrossLevel) => save('cross-level', (level = l).id);
let mode: CrossMode = 'virtual';
let screen: Screen = 'setup';
let rendered: Screen | null = null;
let session = 0; // bumps on every new session and on close: late items of an old one are dropped
let index = 0;
let item: Item | null = null;
let upcoming: Promise<Item> | null = null; // the next item, generated while this one is solved
let attempts: CrossAttempt[] = [];
let last: CrossAttempt | null = null; // this item's attempt; null when it was revealed unscored
let revealMs = 0; // a revealed item: time from shown to 'reveal'
let skipped = 0;
let retrying = false; // a repeat of this item: practice, not counted (the optimal solution was already shown)
let shownAt = 0; // planning starts: inspection (cube) or the state shown (virtual)
let firstAt = 0; // the solve starts: first turn, or Space during inspection
let done: string[] = []; // turns of this item: cube frame (cube) or user frame (virtual)
let local: KPattern | null = null; // virtual: the state as the pad changes it

const guide = new PathGuide(() => cube.pattern(), () => {
  if (screen === 'scramble' && guide.reached()) beginInspect(); // an empty plan: already there
  render();
});

/** Opens the trainer on its setup screen. */
export async function openCrossTrainer(): Promise<void> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  const stored = setting<string>('cross-level', '');
  if (!picked) level = crossGuide.levels.find((l) => l.id === stored) ?? crossGuide.levels.find((l) => !levelProgress(crossHistory(), l.id)?.passed) ?? crossGuide.levels[0];
  picked = true;
  cube.listener = listener;
  dialog.showModal();
  toSetup();
}

function toSetup() {
  session++; // drops an item still loading
  guide.stop();
  screen = 'setup';
  $('cross-title').textContent = t('cross.trainer');
  render();
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: reopened meanwhile
  if (cube.listener === listener) cube.listener = null;
  guide.stop();
  session++;
  player?.pause();
});

function start() {
  session++;
  $('cross-title').textContent = loc(level.name);
  mode = cube.pattern() ? 'cube' : 'virtual';
  index = 0;
  attempts = [];
  skipped = 0;
  upcoming = null;
  void startItem();
}

// --- Items: a random state (like WCA scrambles), then the first turns of its optimal cross down to the length wanted

const timeout = (ms: number) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

/** ponytail: if the solver worker can't start, 25 random turns: not uniform, but plenty for a cross. */
function randomTurns(n = 25): string {
  const out: string[] = [];
  while (out.length < n) {
    const m = 'UDRLFB'[Math.floor(Math.random() * 6)] + ['', "'", '2'][Math.floor(Math.random() * 3)];
    if (m[0] !== out.at(-1)?.[0]) out.push(m);
  }
  return out.join(' ');
}

async function randomState(): Promise<string> {
  try {
    return (await Promise.race([randomScrambleForEvent('333'), timeout(8000)])).toString().replace(/2'/g, '2');
  } catch {
    return randomTurns();
  }
}

async function makeItem(range = level.moves): Promise<Item> {
  for (;;) { // a state whose cross is already shorter than the level (rare above level 3): draw another
    const scramble = await randomState();
    const s = kpuzzle.defaultPattern().applyAlg(scramble);
    const it = crossItem(s, range, Math.random());
    if (!it) continue;
    const pattern = s.applyAlg(it.moves.join(' '));
    return { scramble: [scramble, ...it.moves].join(' '), pattern, optimal: it.k, solutions: solveCross(pattern, 'D', 3) };
  }
}

async function startItem() {
  const id = session;
  screen = 'loading';
  item = null;
  retrying = false;
  guide.stop();
  render();
  const next = await (upcoming ?? makeItem());
  if (id !== session) return;
  upcoming = index + 1 < count ? makeItem() : null;
  item = next;
  if (mode === 'cube') return scrambleTo(next);
  showVirtual(next);
}

function showVirtual(it: Item) {
  done = [];
  firstAt = 0;
  local = it.pattern;
  screen = 'solve';
  shownAt = performance.now();
  render(); // shows the stage before the player is set up: a 3D view set up at zero size stays blank
  loadPlayer(it);
  startClock();
}

/** The same item again, as practice: on the cube, guided back to its state. */
function retry() {
  retrying = true;
  if (mode === 'cube') scrambleTo(item!);
  else showVirtual(item!);
}

/** Cube: walk the real cube to the item (cube frame: the plan's moves through YELLOW_UP). */
function scrambleTo(it: Item) {
  screen = 'scramble';
  done = [];
  firstAt = 0;
  void guide.start(kpuzzle.defaultPattern().applyAlg(centerMoves(it.scramble, YELLOW_UP).join(' ')));
  render();
}

function beginInspect() {
  guide.stop();
  screen = 'inspect';
  shownAt = performance.now();
  startClock();
}

function beginSolve() {
  screen = 'solve';
  firstAt = performance.now();
}

function solved() {
  const now = performance.now();
  last = { optimal: item!.optimal, turns: turnCount(done), planMs: firstAt - shownAt, execMs: now - firstAt };
  if (!retrying) attempts.push(last);
  screen = 'feedback';
  render();
}

function skip() {
  if (!retrying) skipped++;
  next();
}

/** Virtual, done on a real cube: the solutions and the time, unscored (a skip for the goal: the turns are unknown). */
function reveal() {
  if (!retrying) skipped++;
  last = null;
  revealMs = performance.now() - shownAt;
  screen = 'feedback';
  render();
}

function next() {
  if (++index < count) void startItem();
  else finish();
}

function finish() {
  session++; // an item still loading (a disconnect mid-load) must not replace the summary
  guide.stop();
  screen = 'summary';
  const s = summarize(attempts, level, count);
  if (s) save(HISTORY_KEY, addCrossSession(crossHistory(), { ...s, level: level.id, at: Date.now(), mode }));
  render();
}

const listener: CubeListener = {
  move(move) {
    if (mode !== 'cube') return; // a cube connected mid-session: the virtual session carries on
    if (screen === 'scramble') {
      guide.onMove(move);
      if (guide.reached()) beginInspect();
    } else if (screen === 'inspect' || screen === 'solve') {
      if (screen === 'inspect') beginSolve(); // the first turn starts the solve
      done.push(move);
      if (crossSolved(cube.pattern()!, 'U')) return solved(); // cube frame: white is U
    } else return;
    render();
  },
  sync(reset) {
    if (screen === 'setup') return void (modeLine && (modeLine.textContent = modeText())); // only that line: a re-render would steal the focus
    if (mode !== 'cube' || screen === 'summary') return;
    if (!cube.pattern()) return finish(); // disconnected: score what was done
    if (screen === 'scramble') void guide.replan();
    else if ((screen === 'inspect' || screen === 'solve') && reset) scrambleTo(item!); // the state is gone: set it up again
    else if (screen === 'solve' && crossSolved(cube.pattern()!, 'U')) solved(); // the cube lost the last turn
  },
};

// --- Virtual mode: the state in 3D, turned with the pad or the keyboard ---

let player: TwistyPlayer | null = null;
function loadPlayer(it: Item) {
  player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'none' }); // floating hint stickers show the cross underneath
  if (!player.isConnected) stage.append(player);
  player.experimentalSetupAlg = `z2 ${it.scramble}`;
  player.alg = '';
}

function play(move: string) {
  if (screen !== 'solve' || mode !== 'virtual') return;
  firstAt ||= performance.now();
  done.push(move);
  local = local!.applyMove(move);
  player!.experimentalAddMove(move, { cancel: false });
  if (crossSolved(local, 'D')) return solved();
  render();
}

/** Takes back the last turn: it doesn't count (the clock keeps running). */
function undo() {
  const m = done.pop();
  if (!m || screen !== 'solve') return;
  local = item!.pattern.applyAlg(done.join(' '));
  player!.experimentalAddMove(invertTokens([m])[0], { cancel: true });
  render();
}

// On document: re-rendering drops the focus to <body>, outside the dialog, where its own listener can't hear.
document.addEventListener('keydown', (e) => {
  if (!dialog.open || viewer.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.repeat && e.code !== 'Space') return; // a held key is one turn, not many
  if (screen === 'inspect' && e.code === 'Space' && !(e.target as Element).closest?.('button')) { // on a button, Space presses it
    e.preventDefault();
    if (e.repeat) return;
    beginSolve();
    return render();
  }
  if (screen !== 'solve' || mode !== 'virtual' || (e.target as Element).closest?.('input, select, textarea')) return;
  const face = e.key.toUpperCase();
  if (e.key === 'Backspace') undo();
  else if (e.key.length === 1 && 'UDRLFB'.includes(face)) play(face + (e.shiftKey ? "'" : '')); // twice is a half turn: it counts as one
  else return;
  e.preventDefault();
});

// Live clock: a single loop (a skip starts the next item within the same frame), ends by itself when the screen changes.
let raf = 0;
function startClock() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}
function tick() {
  if (!dialog.open || (screen !== 'inspect' && screen !== 'solve')) return;
  const clock = document.getElementById('cross-clock'); // re-rendered on every move: look it up each frame
  if (clock) clock.textContent = clockText();
  raf = requestAnimationFrame(tick);
}

function clockText(): string {
  const now = performance.now();
  if (screen === 'inspect') {
    const left = INSPECTION_MS - (now - shownAt);
    return left > 0 ? String(Math.ceil(left / 1000)) : t('cross.overInspection');
  }
  return formatTime(now - (firstAt || shownAt)); // virtual, before the first turn: planning time
}

// --- The 3D viewer: examples on the page and optimal solutions, one shared player ---

let viewerPlayer: TwistyPlayer | null = null;
let autoplay = 0;
/** Shows `alg` played from `setup` (user frame), yellow up, with controls. */
/** `mask`: the pieces in color, as practice.ts's masks (a guide's example: as its figure); default, every piece. */
export function show3D(title: string, setup: string, alg: string, puzzle: Puzzle = '3x3x3', mask = FULL_MASK[puzzle]): void {
  $('cross-viewer-title').textContent = title;
  viewer.dataset.puzzle = puzzle; // for the move tooltips
  $('cross-viewer-alg').replaceChildren(algView(alg));
  viewer.showModal(); // before the player: a 3D view set up at zero size stays blank
  viewerPlayer ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'bottom-row', experimentalSetupAnchor: 'start' });
  if (!viewerPlayer.isConnected) $('cross-viewer-player').append(viewerPlayer);
  setPuzzle(viewerPlayer, puzzle);
  viewerPlayer.experimentalSetupAlg = `z2 ${setup}`;
  viewerPlayer.alg = alg;
  viewerPlayer.experimentalStickeringMaskOrbits = mask; // reset too: the last example's may still be on
  aim(viewerPlayer); // the figures' corner, whatever the last drag left
  viewerPlayer.jumpToStart();
  clearTimeout(autoplay);
  autoplay = window.setTimeout(() => viewerPlayer!.play(), 600); // the start first, then the solution once
}
viewer.addEventListener('close', () => {
  clearTimeout(autoplay);
  viewerPlayer?.pause();
});

// --- Rendering ---

const p = (text: string, className = '') => el('p', { textContent: text, className });
const button = (text: string, onclick: () => void, className = '') => el('button', { type: 'button', textContent: text, onclick, className });
/** A button that keeps the focus across re-renders (each move rebuilds the screen). */
const action = (name: string, text: string, onclick: () => void, className = '') => {
  const b = button(text, onclick, className);
  b.dataset.action = name;
  return b;
};
const main = <T extends HTMLElement>(e: T): T => ((e.dataset.focus = ''), e);
const progress = () => p(t('quiz.progress', { n: index + 1, total: count }) + (retrying ? ` · ${t('cross.retrying')}` : ''), 'hint');
const dl = (...rows: [string, string | Node][]) => el('dl', {}, ...rows.flatMap(([k, v]) => [el('dt', { textContent: k }), el('dd', {}, v)]));

function render() {
  if (!dialog.open) return;
  stage.hidden = !(mode === 'virtual' && screen === 'solve');
  const view = { setup: renderSetup, loading: renderLoading, scramble: renderScramble, inspect: renderInspect, solve: renderSolve, feedback: renderFeedback, summary: renderSummary }[screen];
  const focused = body.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.action : undefined;
  const same = screen === rendered;
  rendered = screen;
  body.replaceChildren(...view());
  // the button the user was on keeps the focus within a screen; a new screen gives it to its main element
  const kept = focused ? body.querySelector<HTMLElement>(`[data-action="${CSS.escape(focused)}"]`) : null;
  const first = body.querySelector<HTMLElement>('[data-focus]');
  (same ? kept || first : first || kept)?.focus();
  const text = statusText();
  if (status.textContent !== text) status.textContent = text;
}

/** What the live region says: the next scramble move, the start of the solve, the verdict… */
function statusText(): string {
  switch (screen) {
    case 'setup': return '';
    case 'loading': return t('cross.loading');
    case 'scramble': return `${nextMove() ?? ''} ${scrambleDesc()}`.trim();
    case 'inspect': return t('cross.inspectHint');
    case 'solve': return mode === 'virtual' && !firstAt ? t('cross.virtualHint') : ''; // not every move: the turn count is on screen
    case 'feedback': return last ? verdict(last) : t('cross.revealed');
    case 'summary': return t('quiz.results');
  }
}

const steps = (current: 0 | 1 | 2) => el('ol', { className: 'steps' },
  ...[t('practice.stepScramble'), t('cross.stepInspect'), t('practice.stepSolve')].map((s, i) =>
    el('li', { textContent: s, ...(i === current ? { ariaCurrent: 'step' } : {}) })));

function progressText(l: CrossLevel): string {
  const p = levelProgress(crossHistory(), l.id);
  if (!p) return t('cross.notPlayed');
  return [
    tp('cross.sessions', p.sessions),
    t('cross.progressExtra', { best: formatExtra(p.bestExtra), avg: formatExtra(p.avgExtra) }),
    t('cross.progressTime', { best: formatTime(p.bestMs), avg: formatTime(p.avgMs) }),
    ...(p.passed ? [t('cross.goalMet')] : []),
  ].join(' · ');
}

const modeText = () => t(cube.pattern() ? 'cross.modeCube' : 'cross.modeVirtual');
let modeLine: HTMLElement | null = null;

function renderSetup(): Node[] {
  const levels = el('fieldset', { className: 'quiz-modes' }, el('legend', { textContent: t('cross.level') }));
  for (const l of crossGuide.levels) {
    const input = el('input', { type: 'radio', name: 'cross-level', value: l.id, checked: l.id === level.id });
    if (l.id === level.id) main(input); // the form's first stop, not the Start button below it
    input.onchange = () => pick(l);
    levels.append(el('label', { className: 'quiz-mode' }, input, el('span', {},
      el('strong', { textContent: loc(l.name) }), el('br'),
      el('small', { textContent: loc(l.description) }), el('br'),
      el('small', { textContent: goalText(l) }), el('br'),
      el('small', { className: 'cross-progress', textContent: progressText(l) }))));
  }
  const select = el('select', {}, ...COUNTS.map((n) => el('option', { value: String(n), textContent: String(n), selected: n === count })));
  select.onchange = () => save('cross-count', (count = +select.value));
  const hint = el('input', { type: 'checkbox', checked: showOptimal });
  hint.onchange = () => save('cross-optimal', (showOptimal = hint.checked));
  return [
    p(t('cross.trainerIntro'), 'hint'),
    levels,
    el('label', { className: 'academy-method' }, t('cross.count'), select),
    el('label', { className: 'academy-method' }, hint, t('cross.showOptimal')),
    p(t('cross.showOptimalHint'), 'hint'),
    (modeLine = p(modeText(), 'hint')),
    el('div', { className: 'row' }, button(t('cross.start'), start, 'primary')),
  ];
}

const optimalHint = () => (showOptimal ? [p(tp('cross.optimalIs', item!.optimal), 'ok')] : []);

function renderLoading(): Node[] {
  return [progress(), p(t('cross.loading'), 'hint')];
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
    steps(0),
    el('div', { className: 'next', textContent: nextMove() ?? '…' }),
    el('div', { textContent: scrambleDesc() }),
    algView((g?.steps ?? []).map(cube.label), { mark: (i) => (i === 0 ? 'current' : '') }),
    p(t('practice.scrambleHint'), 'hint'),
    el('div', { className: 'row' }, action('skip', t('quiz.skip'), skip)),
  ];
}

/** The clock takes the focus: Space must start the solve, not press a button. */
const clock = (label: string) => el('div', { className: 'cross-clock' },
  el('span', { className: 'hint', textContent: label }),
  main(el('div', { id: 'cross-clock', className: 'next', role: 'timer', tabIndex: -1, textContent: clockText() })));

function renderInspect(): Node[] {
  return [
    progress(),
    steps(1),
    clock(t('cross.inspecting')),
    p(t('cross.inspectHint')),
    ...optimalHint(),
    el('div', { className: 'row' },
      action('go', t('cross.go'), () => (beginSolve(), render()), 'primary'),
      action('skip', t('quiz.skip'), skip)),
  ];
}

function renderSolve(): Node[] {
  const turns = p(tp('quiz.turns', turnCount(done)), 'hint');
  if (mode === 'cube') {
    return [progress(), steps(2), clock(t('cross.executing')), p(t('cross.solveCubeHint'), 'hint'), ...optimalHint(), turns,
      el('div', { className: 'row' }, action('skip', t('quiz.skip'), skip))];
  }
  const pad = el('div', { className: 'cross-pad', role: 'group', ariaLabel: t('cross.pad') }, ...PAD.map((m) => {
    const b = action(m, m, () => play(m));
    const { what, how } = explainMove(m);
    b.ariaLabel = t('notation.tip', { move: m, what, how });
    return b;
  }));
  // the pad right under the clock: on a phone it must fit next to the cube without scrolling
  return [
    progress(),
    clock(t(firstAt ? 'cross.executing' : 'cross.planning')),
    pad,
    el('div', { className: 'row' },
      action('undo', t('cross.undo'), undo),
      action('skip', t('quiz.skip'), skip)),
    turns,
    ...optimalHint(),
    p(t('cross.virtualHint'), 'hint'),
    el('details', {}, el('summary', { textContent: t('cross.realCube') }), p(t('cross.realCubeHint'), 'hint'), algView(item!.scramble),
      el('div', { className: 'row' }, action('reveal', t('cross.reveal'), reveal))),
  ];
}

const verdict = (a: CrossAttempt) => {
  const extra = extraTurns(a);
  return extra ? tp('cross.extra', extra) : t('cross.optimal');
};

/** Times next to the goal, so the time half of it shows on every item: execution within the level's seconds,
 *  planning within inspection (it doesn't count as solve time, as in WCA). */
const execRow = (label: string, ms: number): [string, Node] => [label, el('span', {
  className: ms <= level.goal.seconds * 1000 ? 'ok' : 'bad',
  textContent: t('cross.vsGoal', { time: formatTime(ms), seconds: level.goal.seconds }),
})];
const planRow = (label: string, ms: number): [string, string | Node] => [label, ms > INSPECTION_MS
  ? el('span', { className: 'bad', textContent: t('cross.planOver', { time: formatTime(ms) }) })
  : formatTime(ms)];

function renderFeedback(): Node[] {
  const a = last;
  const it = item!;
  const mine = mode === 'cube' ? compact(done).map(cube.label) : compact(done); // the user's names: the 3D view's frame
  const more = index + 1 < count;
  return [
    progress(),
    ...(a ? [
      p(verdict(a), extraTurns(a) ? 'bad' : 'ok'),
      dl(
        [t('cross.yourTurns'), el('span', {}, `${a.turns} · `, algView(mine))],
        [t('cross.optimalTurns'), String(a.optimal)],
        planRow(t('cross.planTime'), a.planMs),
        execRow(t('cross.execTime'), a.execMs),
      ),
    ] : [p(t('cross.revealed'), 'hint'), dl([t('cross.optimalTurns'), String(it.optimal)], [t('cross.planTime'), formatTime(revealMs)])]),
    ...(retrying ? [p(t('cross.retryNote'), 'hint')] : []),
    el('h3', { textContent: tp('cross.solutions', it.solutions.length) }),
    el('ul', { className: 'cross-solutions' }, ...it.solutions.map((s) => el('li', {}, algView(s), ' ',
      el('button', { type: 'button', className: 'small', textContent: t('cross.watch'), ariaLabel: t('cross.watchOf', { alg: s.join(' ') }),
        onclick: () => show3D(t('cross.optimalTitle'), it.scramble, s.join(' ')) })))),
    el('div', { className: 'row' }, main(button(t(more ? 'quiz.next' : 'quiz.finish'), next, 'primary')), button(t('cross.retry'), retry)),
  ];
}

function renderSummary(): Node[] {
  const s = summarize(attempts, level, count);
  const close = button(t('dialog.close'), () => dialog.close());
  const again = button(t('cross.again'), start);
  const setup = button(t('cross.changeLevel'), toSetup);
  if (!s) return [p(t('quiz.empty')), el('div', { className: 'row' }, main(again), setup, close)];
  const after = nextLevel(crossGuide.levels, level.id);
  const actions = el('div', { className: 'row' });
  if (s.passed && after) {
    actions.append(main(button(t('cross.nextLevel', { name: loc(after.name) }), () => (pick(after), start()), 'primary')), again, setup, close);
  } else actions.append(main(again), setup, close);
  return [
    el('h3', { textContent: t('quiz.results') }),
    dl(
      [t('cross.solved'), `${s.n}${skipped ? ` · ${tp('cross.skipped', skipped)}` : ''}`],
      [t('cross.avgExtra'), formatExtra(s.avgExtra)],
      [t('cross.optimalShare'), percent(s.optimalShare)],
      planRow(t('cross.avgPlan'), s.planMs),
      execRow(t('cross.avgExec'), s.execMs),
    ),
    p(goalText(level), 'hint'),
    ...(s.n < minSolved(count) ? [p(t('cross.tooFew', { min: minSolved(count), total: count }), 'hint')] : []),
    p(t(s.passed ? (after ? 'cross.passed' : 'cross.passedLast') : 'cross.notPassed'), s.passed ? 'ok' : 'bad'),
    actions,
  ];
}

const formatExtra = (x: number): string => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(x);

/** The level's goal in words. */
const goalText = (l: CrossLevel): string =>
  l.goal.overOptimal ? t('cross.goal', { extra: tp('cross.extra', l.goal.overOptimal), seconds: l.goal.seconds }) : t('cross.goalOptimal', { seconds: l.goal.seconds });

// Practice one case, in three ways (tabs), the same three as on its page and in this order:
// - Practicar (aprender): a fresh scramble of the case each repetition (another AUF and last layer, so it isn't learnt
//   as text), solved with its solution. With a synced cube: 1) Mezcla walks the cube there, 2) Resuelve follows the
//   solution token by token, with corrections, timed from the first turn. Without one: the scramble big on the clock
//   card; a tap (or Space) hides it and starts the clock, the next stops it, and the user says how it went (Limpio /
//   Fallé) before the next scramble comes up.
// - Quiz (retener): explains and opens the quiz of the case's group (quiz.ts).
// - Memoria muscular (agilizar): the algorithm alone, no scramble. With a cube it's followed from whatever state the
//   cube is in (the next turn after a rep starts another); without one, a series: each tap ends a repetition and starts
//   the next (X for a failed one), until Terminar serie.
// Two views: Preparar (the case, its recognition, the algorithm to use, Empezar) and Practicar (the clock card, big,
// with the screen kept awake). The solution shows while learning and hides by itself after FADE_AFTER clean in a row
// (Solución toggles it for the sitting; Ver solución shows it once, and that repetition isn't clean). Every repetition
// (time, moves, clean) counts towards the plan's drill criterion: the streak of STREAK_GOAL, drawn as dots.
import { TwistyPlayer } from 'cubing/twisty';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { CAMERA, IDENTITY, YELLOW_UP, caseSetup, centerMoves, expand, formatAlg, htm, mapMove, tokenize, triggerSegments, turnCount, unmapMove } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView, scrambleNote } from '../notation-view.ts';
import { inlineText } from '../rich-text-view.ts';
import { loc, t, tp, type MessageKey } from '../i18n.ts';
import { goalReached, practiceSpec, quizPattern, type QuizSpec } from './cube.ts';
import { caseDiagram, isoTurns, type DiagramOpts } from './diagram.ts';
import { StepFollower } from './follow.ts';
import { cube, type CubeListener } from './link.ts';
import { addCustom, average, byChoice, preferred, recordRep, removeCustom, save, setPreferred, setting, statsFor, STREAK_GOAL, variants, type Rep } from './store.ts';
import { FADE_AFTER, compare, solutionView, summary, type Comparison, type SessionRep, type SolutionView } from './practiceSession.ts';
import { puzzleOf, type AlgSource, type AlgVariant, type Case, type Puzzle, type Stage } from './types.ts';
import { checkCustomAlg } from './customAlg.ts';
import { fingertricks, type FingerHint } from '../fingertricks.ts';
import { caseProbability, formatProbability, phaseOf } from './probability.ts';
import { el } from '../el.ts';

const $ = (id: string) => document.getElementById(id)!;
export { el }; // lives in el.ts so the Resolver can use it without loading the academy
const dialog = $('practice') as HTMLDialogElement;

const MAX_UNDO = 4; // more pending corrections than this: easier to set the case up again
const REDO_MS = 1500; // how long "too many mistakes" stays up after re-planning
const SESSION_SHOWN = 12; // the sitting's latest times on screen (its numbers count them all)

// The static player starts from z2 (yellow up), so cubing.js's named stickerings, which pick pieces by their
// home (white = last layer), would grey the wrong layer. These masks name the pieces by home slot instead:
// yellow = cubing's D layer. Order: EDGES UF UR UB UL DF DR DB DL FR FL BR BL, CORNERS UFR URB UBL ULF DRF DFL DLB DBR.
// D = dim, I = ignored, O = only the yellow sticker, P = only the side colors, - = regular.
export const MASKS: Record<Stage, string> = {
  'first-layer': 'EDGES:----IIIIIIII,CORNERS:----IIII,CENTERS:------', // the white pieces only
  'second-layer': 'EDGES:DDDDIIII----,CORNERS:DDDDIIII,CENTERS:------', // the four middle-layer edges in color
  f2l: 'EDGES:DDDDIIIID-DD,CORNERS:DDD-IIII,CENTERS:------', // the green-orange pair stays in color
  'oll-cross': 'EDGES:DDDDOOOODDDD,CORNERS:DDDDIIII,CENTERS:------',
  'oll-corners': 'EDGES:DDDDOOOODDDD,CORNERS:DDDDOOOO,CENTERS:------',
  'pll-corners': 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:------',
  'pll-edges': 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:------',
  'll-edges': 'EDGES:DDDD----DDDD,CORNERS:DDDDIIII,CENTERS:------',
  'll-corners-placed': 'EDGES:DDDD----DDDD,CORNERS:DDDD----,CENTERS:------',
  'll-corners-twist': 'EDGES:DDDD----DDDD,CORNERS:DDDD----,CENTERS:------',
  // the 2x2 player has corners only
  '2x2-first-layer': 'CORNERS:----IIII',
  '2x2-first-face': 'CORNERS:OOOOIIII', // only the white stickers
  '2x2-oll': 'CORNERS:DDDDOOOO',
  '2x2-pbl': 'CORNERS:--------',
  '2x2-ll-corners': 'CORNERS:DDDD----',
  coll: 'EDGES:DDDD----DDDD,CORNERS:DDDD----,CENTERS:------', // the last layer in full: its edges are read too
  // Roux (yellow up, so the user's L block is cubing's R side): each step's own pieces, the blocks already built dim
  'roux-fb': 'EDGES:I-IIIIII-I-I,CORNERS:--IIIIII,CENTERS:III-II', // the left block and its center
  'roux-sb': 'EDGES:IDI-IIIID-D-,CORNERS:DD--IIII,CENTERS:I-IDII',
  cmll: 'EDGES:IDIDIIIIDDDD,CORNERS:DDDD----,CENTERS:IDIDII', // the top corners only
  'lse-eo': 'EDGES:-D-D----DDDD,CORNERS:DDDDDDDD,CENTERS:-D-D--', // the 6 edges and the M slice's centers
  'lse-ulur': 'EDGES:-D-D----DDDD,CORNERS:DDDDDDDD,CENTERS:-D-D--',
  'lse-4c': 'EDGES:-D-D----DDDD,CORNERS:DDDDDDDD,CENTERS:-D-D--',
};

const puzzles = new WeakMap<TwistyPlayer, Puzzle>(); // every player here starts as a 3x3
/** Sets a player's puzzle, only when it changes: setting it reloads the model, and it can't be read back. */
export function setPuzzle(p: TwistyPlayer, puzzle: Puzzle): void {
  if ((puzzles.get(p) ?? '3x3x3') === puzzle) return;
  p.puzzle = puzzle;
  puzzles.set(p, puzzle);
}

/** Points a 3D player at the figures' corner (CAMERA: yellow up, green front, orange right), or, for a stage whose iso
 *  figure turns (an F2L back slot), at the corner it turns to: the view moves, the cube stays held green front, so the
 *  algorithm still reads as written. Also undoes a drag left over from the last case. `setup`: user frame. */
export function aim(p: TwistyPlayer, kpuzzle?: KPuzzle, stage?: Stage, setup: string[] = []): void {
  const turns = kpuzzle && stage ? isoTurns(stage, () => patternToFacelets(kpuzzle.defaultPattern().applyAlg(setup.join(' ')))) : 0;
  p.cameraLatitude = CAMERA.latitude;
  p.cameraLongitude = CAMERA.longitude + 90 * turns;
}

/** Sets a player up: `alg` from the state `setup` leads to (user frame: yellow up, green front; face turns, as from
 *  caseSetup, so it starts held like the figure), the stage's pieces in color, seen from the figure's corner. */
export function loadCase(p: TwistyPlayer, kpuzzle: KPuzzle, stage: Stage, setup: string[], alg: string[]): void {
  setPuzzle(p, puzzleOf(stage));
  p.experimentalSetupAlg = ['z2', ...setup].join(' '); // the player starts white up: z2 is the plan's yellow up
  p.alg = alg.join(' ');
  p.experimentalStickeringMaskOrbits = MASKS[stage];
  aim(p, kpuzzle, stage, setup);
  p.jumpToStart();
}

/** The 3D animation, only on demand ("Ver animación"). One player per slot: a fixed element of index.html, outside
 *  anything that's rebuilt, so the player is created the first time it's asked for and then only shown and hidden,
 *  never re-attached (browsers allow few WebGL contexts, and a moved player starts over). `load` sets it up for
 *  what's on screen. */
export class Animation {
  #player: TwistyPlayer | null = null;
  #label: (() => void) | null = null; // relabels the last button made

  constructor(readonly slot: HTMLElement, readonly load: (p: TwistyPlayer) => void) {
    slot.hidden = true;
  }

  get open(): boolean {
    return !this.slot.hidden;
  }

  set(open: boolean): void {
    this.slot.hidden = !open; // before loading: a 3D view set up at zero size stays blank
    this.#label?.();
    if (!open) return void this.#player?.pause();
    // drag stays on so the case can be inspected from any angle; hint facelets only add clutter here
    this.#player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'bottom-row', experimentalSetupAnchor: 'start', hintFacelets: 'none' });
    if (!this.#player.isConnected) this.slot.append(this.#player);
    this.load(this.#player);
  }

  /** What's on screen changed: reload the player if it's showing. */
  refresh(): void {
    if (this.open && this.#player) this.load(this.#player);
  }

  /** "Ver animación" / "Ocultar animación". */
  button(): HTMLButtonElement {
    const b = el('button', { type: 'button', className: 'small' });
    b.setAttribute('aria-controls', this.slot.id);
    const label = () => {
      b.textContent = t(this.open ? 'anim.hide' : 'anim.show');
      b.ariaExpanded = String(this.open);
    };
    b.onclick = () => this.set(!this.open);
    this.#label = label;
    label();
    return b;
  }
}

/** The case's flat figure, as the academy draws it: iso for the first layers and F2L, top view for the last layer, with
 *  the PLL arrows when `arrows` (never in a recognition question: they'd give it away). `user`: the state, user frame. */
export function caseSVG(c: Case, user: KPattern, opts: DiagramOpts = {}): string {
  return caseDiagram(phaseOf(c.id)?.diagram ?? 'top', c.stage, patternToFacelets(user), opts);
}

/** The algorithm with its triggers as labelled groups; every move stays tappable. */
export function movesView(tokens: string[]): HTMLElement {
  const out = el('div', { className: 'case-moves' });
  triggerSegments(tokens).forEach((s, i) => {
    if (i) out.append(' '); // real spaces: readable when copied
    if (!s.trigger) return void out.append(algView(s.tokens));
    const name = t(`case.trigger.${s.trigger}`);
    const label = s.left ? t('case.triggerLeft', { name }) : name;
    out.append(el('span', { className: 'trigger', role: 'group', ariaLabel: label },
      algView(s.tokens), el('span', { className: 'trigger-name', ariaHidden: 'true', textContent: label })));
  });
  return out;
}

type Mode = 'static' | 'scramble' | 'solve' | 'result'; // the smart cube's flow
type Hand = 'ready' | 'running' | 'stopped'; // the hand clock's, without a cube (stopped: Practicar waits for Limpio / Fallé)
type View = 'prep' | 'focus'; // Preparar / Practicar
export type Tab = 'practice' | 'quiz' | 'drill';
const TABS: Tab[] = ['practice', 'quiz', 'drill'];
let tab = setting<Tab>('practice-tab', 'practice', (v) => TABS.includes(v));
let kpuzzle: KPuzzle;
let kase: Case;
let variant: AlgVariant;
let tokens: string[] = []; // the algorithm
let rep: { spec: QuizSpec; user: KPattern; tokens: string[] }; // Practicar: this repetition's state and its solution
let view: View = 'prep';
let mode: Mode = 'static';
let hand: Hand = 'ready';
let follower: StepFollower | null = null;
let startedAt = 0; // first move of the Resolver phase
let done: string[] = []; // quarter turns of this repetition
let clean = true;
let lastRep: Rep | null = null;
let comparison: Comparison | null = null; // the last time against the case's stats before it
let redoUntil = 0;
let onUpdate: (c: Case) => void = () => {};
let onQuiz: () => void = () => {};
let timerAt = 0; // > 0 while the no-cube clock runs (Memoria muscular: since the current lap started)
let timerRaf = 0;
let stoppedMs = 0; // Practicar without a cube: the time waiting for Limpio / Fallé
let choice: SolutionView | null = null; // Solución, for this sitting; null: by the streak
let peek = false; // Ver solución: the hidden solution on screen for this repetition
let helped = false; // ...and so the repetition isn't clean (also when Solución is turned on mid-repetition)
let session: SessionRep[] = []; // this sitting's repetitions
let series: SessionRep[] = []; // Memoria muscular without a cube: the running series' laps
let seriesDone: SessionRep[] = []; // ...and the last one finished, summed up until the next starts
let notice = ''; // the solution just hid or came back, the criterion was met
let celebrate = false; // the streak just reached the goal: its dots pop once

/** The synced smart cube, if the case is of its puzzle (it's a 3x3: a 2x2 case is practised on the hand clock). */
const linked = () => (puzzleOf(kase.stage) === '3x3x3' ? cube.pattern() : null);

const streakNow = () => statsFor(kase.id)?.streak ?? 0;
/** The solution (or the algorithm) on screen in Practicar: as Solución says, or once by Ver solución. */
const solutionShown = () => peek || solutionView(streakNow(), choice) === 'shown';
/** A repetition under way: the hand clock running, or the cube's solve started. */
const midRep = () => (linked() ? mode === 'solve' && startedAt > 0 : hand === 'running');

const guide = new PathGuide(() => cube.pattern(), () => {
  if (mode === 'scramble' && guide.reached()) beginSolve(); // an empty plan: already at the case
  render();
});

/** Opens the practice dialog for a case, on Preparar; `onChange` runs when its preferred algorithm or stats change,
 *  `quiz` opens a quiz of this case (the caller knows its group, for the answers). `startTab`: open on that tab
 *  (remembered, as if the user had picked it); else on the last one used. */
export async function openPractice(c: Case, onChange: (c: Case) => void, quiz: () => void, startTab?: Tab): Promise<void> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  if (startTab) save('practice-tab', (tab = startTab));
  kase = c;
  dialog.dataset.puzzle = puzzleOf(c.stage); // for the move tooltips
  onUpdate = onChange;
  onQuiz = quiz;
  view = 'prep';
  choice = null;
  customInput.value = customStatus.textContent = '';
  helpBox.hidden = true;
  helpToggle.ariaExpanded = 'false';
  anim.set(false); // the figure is the default; the animation is asked for
  renderInfo();
  cube.listener = puzzleOf(c.stage) === '3x3x3' ? listener : null;
  dialog.showModal();
  choose(preferred(c));
  $('practice-start').focus(); // Space/Enter: Empezar
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: the dialog was reopened meanwhile
  if (cube.listener === listener) cube.listener = null; // the quiz may have taken the cube already
  stopAll();
  view = 'prep';
  void keepAwake(false);
  anim.set(false);
});

// Escape in Practicar goes back to Preparar; in Preparar it closes
dialog.addEventListener('cancel', (e) => {
  if (view !== 'focus') return;
  e.preventDefault();
  showPrep();
});

const tabButtons = [...$('practice-tabs').querySelectorAll<HTMLButtonElement>('button')];
for (const b of tabButtons) b.onclick = () => {
  save('practice-tab', (tab = b.dataset.tab as Tab));
  showContent();
  render();
};

/** The algorithm to practise: a new one starts the sitting over (its times aren't the other's). */
function choose(v: AlgVariant) {
  variant = v;
  tokens = tokenize(v.alg);
  newRep();
  lastRep = null;
  session = [];
  seriesDone = [];
  if (view === 'focus') return start();
  showContent();
  render();
}

/** What's being done: Practicar's solution for this repetition, or the algorithm alone. */
const active = () => (tab === 'practice' ? rep.tokens : tokens);

/** Practicar: the chosen algorithm backwards as the scramble, the algorithm itself as the solution. */
function newRep() {
  const spec = practiceSpec(kase, variant.alg);
  rep = { spec, user: quizPattern(kpuzzle, spec, IDENTITY), tokens: tokenize(variant.alg) };
  peek = helped = false;
}

/** Stops whatever runs: the guide, the follower, the clock. */
function stopAll() {
  guide.stop();
  stopTimer();
  follower = null;
  mode = 'static';
  hand = 'ready';
  series = [];
}

/** Preparar: the case, the algorithm, Empezar. Nothing runs. */
function showPrep() {
  view = 'prep';
  stopAll();
  void keepAwake(false);
  anim.set(false);
  notice = '';
  showContent();
  render();
  $('practice-start').focus();
}

/** Empezar: the quiz (it takes the dialog's place), or Practicar on the clock card. */
function enterFocus() {
  if (tab === 'quiz') {
    dialog.close(); // releases the cube for the quiz
    return onQuiz();
  }
  view = 'focus';
  notice = '';
  seriesDone = [];
  void keepAwake(true);
  start();
}

/** Starts the current tab on the card: with a cube, set the case up (Practicar) or follow the algorithm from anywhere
 *  (Memoria muscular); otherwise the hand clock waits for its first tap. */
function start() {
  stopAll();
  comparison = null;
  peek = helped = false;
  showContent();
  if (linked() && tab === 'practice') return startScramble();
  if (linked() && tab === 'drill') {
    beginSolve();
    return render();
  }
  render();
  $('practice-clock').focus(); // Space then starts the clock natively
}

/** The figures (the chosen algorithm's case), the scramble, the algorithm and its fingers. */
function showContent() {
  const figure = (size: number) => caseSVG(kase, rep.user, { size, title: t('academy.diagram', { code: kase.code }), arrows: true });
  // the chosen algorithm backwards on every tab: the same case seen the same way as its scramble and animation
  $('practice-diagram').innerHTML = figure(120);
  $('practice-card-diagram').innerHTML = figure(84);
  $('practice-chosen').replaceChildren(movesView(tokens),
    el('span', { className: 'hint', textContent: `${sourceLabel(variant)} · ${t('practice.htm', { n: htm(centerMoves(tokens, IDENTITY)) })}` }));
  $('practice-setup').replaceChildren(algView(rep.spec.moves));
  $('practice-setup-note').replaceWith(Object.assign(scrambleNote(), { id: 'practice-setup-note' }));
  $('practice-alg-label').textContent = t(tab === 'practice' ? 'practice.solution' : 'practice.alg');
  $('practice-alg').replaceChildren(algView(active()));
  hints = fingertricks(active());
  const wasOpen = fingers.querySelector('details')?.open ?? false;
  fingers.replaceChildren(fingersView(active()));
  fingers.querySelector('details')!.open = wasOpen;
  anim.refresh();
}

// Practicar: from this repetition's scramble; Memoria muscular: the algorithm backwards, as on the case page.
const anim = new Animation($('practice-player'), (p) => loadCase(p, kpuzzle, kase.stage, tab === 'practice' ? rep.spec.moves : caseSetup(tokens), active()));
$('practice-anim').append(anim.button());

function startScramble() {
  mode = 'scramble';
  follower = null;
  // cube frame (yellow is the cube's D). From solved, the repetition's own scramble; from anywhere else the solver's.
  void guide.start(quizPattern(kpuzzle, rep.spec, YELLOW_UP), rep.spec.moves.map((m) => mapMove(m, YELLOW_UP)));
  render();
}

function beginSolve() {
  guide.stop();
  mode = 'solve';
  follower = new StepFollower(expand(active(), YELLOW_UP).steps);
  startedAt = 0;
  done = [];
  clean = true;
  peek = helped = false;
}

function finishRep() {
  record({ ms: performance.now() - startedAt, moves: done.length, htm: turnCount(done), clean: clean && !helped });
  mode = 'result';
  render();
  $('practice-again').focus(); // Space/Enter start the next rep natively (otherwise × keeps the focus and Space closes)
}

/** Records a repetition: the stats, the sitting, and what changed with it (the solution's view, the criterion). */
function record(r: Rep) {
  const before = statsFor(kase.id);
  const was = solutionView(before?.streak ?? 0, choice);
  comparison = compare(r.ms, before);
  lastRep = r;
  const s = recordRep(kase.id, r);
  session.push({ ms: r.ms, clean: r.clean });
  onUpdate(kase);
  const now = solutionView(s.streak, choice);
  notice = s.streak === STREAK_GOAL ? t('practice.streakDone', { goal: STREAK_GOAL })
    : now !== was ? t(now === 'hidden' ? 'practice.fadeHidden' : 'practice.fadeShown', { n: FADE_AFTER }) : '';
  celebrate = s.streak === STREAK_GOAL;
}

const listener: CubeListener = {
  move(move) {
    if (view !== 'focus') return; // Preparar: the cube is free
    if (mode === 'result' && tab === 'drill') beginSolve(); // the next turn starts the next repetition
    if (mode === 'scramble') {
      guide.onMove(move);
      if (guide.reached()) beginSolve();
    } else if (mode === 'solve' && follower) {
      if (!startedAt) {
        startedAt = performance.now();
        notice = '';
        tick();
      }
      done.push(move);
      if (follower.feed(move) === 'wrong') clean = false;
      if (follower.undo.length > MAX_UNDO) {
        redoUntil = performance.now() + REDO_MS;
        if (tab === 'drill') beginSolve();
        else startScramble();
      } else if (follower.done) {
        if (tab === 'drill' || goalReached(kase.stage, cube.pattern()!, YELLOW_UP)) finishRep(); // drill: any start state; the frame: Roux's blocks
        else startScramble(); // can't happen from the exact state; start over rather than record nonsense
      }
    }
    render();
  },
  sync() {
    if (view === 'focus') {
      if (!cube.pattern()) {
        if (mode !== 'static') start(); // disconnected: the hand clock
      } else if ((mode === 'static' && linked()) || mode === 'solve') {
        start(); // a cube just synced, or the state drifted mid-algorithm: start the repetition again
      } else if (mode === 'scramble') {
        void guide.replan();
      }
    }
    render();
  },
};

// The suggested fingers: for the current move while following (Memoria muscular), all of them without a cube.
let hints: FingerHint[] = [];
const fingerNow = el('p', { className: 'hint', role: 'status' });
$('practice-desc').after(fingerNow);
const fingers = $('practice-fingers');
const markText = (h: FingerHint) => (h.regrip ? t('fingers.regrip') : h.home ? t('fingers.home') : '');

/** The algorithm move by move with its suggested fingers, folded under "Ver dedos"; every move stays tappable. */
export function fingersView(tokens: string[]): HTMLDetailsElement {
  const item = (h: FingerHint) => el('li', {}, algView([h.token]),
    el('small', {}, ...(markText(h) ? [el('span', { className: 'finger-mark', textContent: `${markText(h)} · ` })] : []), h.label));
  return el('details', { className: 'fingers-box' },
    el('summary', { textContent: t('fingers.title'), ariaLabel: t('fingers.titleFor', { alg: tokens.join(' ') }) }),
    el('p', { className: 'hint', textContent: t('fingers.hint') }),
    el('ol', { className: 'fingers', ariaLabel: t('fingers.list') }, ...fingertricks(tokens).map(item)));
}

$('practice-start').onclick = enterFocus;
$('practice-back').onclick = showPrep;
/** After a button on the card: the clock keeps the focus, so Space is the clock again (not that button once more). */
const refocus = () => $('practice-clock').focus();
$('practice-again').onclick = () => {
  newRep();
  start();
};
$('practice-another').onclick = () => {
  newRep();
  if (linked()) startScramble();
  else {
    hand = 'ready';
    showContent();
    render();
  }
  refocus();
};
$('practice-peek').onclick = () => {
  peek = helped = true;
  render();
  refocus();
};
$('practice-reveal').onclick = () => {
  const shown = solutionView(streakNow(), choice) === 'shown';
  choice = shown ? 'hidden' : 'shown';
  if (shown) peek = false;
  else if (midRep()) helped = true; // seen mid-repetition: it isn't from memory any more
  notice = '';
  render();
};
$('practice-clean').onclick = () => grade(true);
$('practice-fail').onclick = () => grade(false);
$('practice-lap-fail').onclick = () => {
  lap(false);
  refocus();
};
$('practice-finish').onclick = finishSeries;

// The "?": how this tab works, in full (the screen itself keeps to a line)
const helpBox = $('practice-help');
const helpToggle = $('practice-help-toggle');
helpToggle.onclick = () => {
  helpBox.hidden = !helpBox.hidden;
  helpToggle.ariaExpanded = String(!helpBox.hidden);
};

// Without a cube: the card is the clock (tap anywhere on it, or Space). Its moves and buttons keep their own taps.
const clockTime = $('practice-clock');
$('practice-card').addEventListener('click', (e) => {
  if (!(e.target as Element).closest('button:not(#practice-clock), a, summary, input')) act();
});
dialog.addEventListener('keydown', (e) => {
  const target = e.target as Element;
  if (e.code === 'KeyX' && !e.repeat && view === 'focus' && !linked() && !target.closest?.('input')) {
    if (tab === 'practice' && hand === 'stopped' && !helped) grade(false);
    else if (tab === 'drill' && hand === 'running') lap(false);
    else return;
    return e.preventDefault();
  }
  if (e.code !== 'Space' || target.closest?.('button, input, select, summary, a')) return;
  if (view === 'prep') {
    e.preventDefault();
    if (!e.repeat) enterFocus();
    return;
  }
  if (linked()) return;
  e.preventDefault(); // a focused button presses itself; elsewhere Space is the clock
  if (!e.repeat) act();
});

/** A tap on the card: start, stop (Practicar: then Limpio / Fallé), or end a lap (Memoria muscular). */
function act() {
  if (view !== 'focus' || linked() || hand === 'stopped') return;
  const now = performance.now();
  if (hand === 'ready') {
    timerAt = now;
    hand = 'running';
    series = [];
    seriesDone = [];
    comparison = null;
    notice = '';
    tick();
  } else if (tab === 'drill') {
    return lap(true);
  } else {
    stoppedMs = now - timerAt;
    stopTimer();
    hand = 'stopped';
    comparison = compare(stoppedMs, statsFor(kase.id));
    render();
    return $('practice-clean').focus(); // Space: Limpio; X: Fallé
  }
  render();
}

/** Practicar without a cube: how the stopped repetition went; then the next scramble. */
function grade(ok: boolean) {
  if (hand !== 'stopped') return;
  // ponytail: no cube, so the moves are the algorithm's and "clean" is the user's word for it
  const n = htm(centerMoves(active(), IDENTITY));
  record({ ms: stoppedMs, moves: n, htm: n, clean: ok && !helped });
  newRep();
  hand = 'ready';
  showContent();
  render();
  refocus();
}

/** Memoria muscular without a cube: a repetition ends (clean or not) and the next one starts. */
function lap(ok: boolean) {
  if (hand !== 'running') return;
  const now = performance.now();
  const n = htm(centerMoves(active(), IDENTITY));
  const r = { ms: now - timerAt, moves: n, htm: n, clean: ok && !helped };
  timerAt = now;
  record(r);
  series.push({ ms: r.ms, clean: r.clean });
  peek = helped = false;
  render();
}

/** Terminar serie: the lap under way is dropped; the series is summed up. */
function finishSeries() {
  seriesDone = series;
  stopAll();
  peek = helped = false;
  render();
  refocus();
}

/** The running time, frame by frame: the hand clock, or the cube's solve since its first turn. */
function tick() {
  cancelAnimationFrame(timerRaf);
  const from = timerAt || (mode === 'solve' ? startedAt : 0);
  if (!from || !dialog.open) return;
  clockTime.textContent = formatTime(performance.now() - from);
  timerRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  cancelAnimationFrame(timerRaf);
  timerAt = 0;
}

/** The screen stays on while practising (hands on the cube, no taps to keep it awake). */
let wake: WakeLockSentinel | null = null;
async function keepAwake(on: boolean) {
  if (!on) {
    void wake?.release();
    wake = null;
    return;
  }
  if (wake || !('wakeLock' in navigator)) return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (!dialog.open || view !== 'focus') return void lock.release(); // left meanwhile
    wake = lock;
    lock.addEventListener('release', () => void (wake === lock && (wake = null)));
  } catch {} // not allowed (battery saver, a hidden page): the screen just behaves as usual
}
// the browser releases it when the page is hidden: back on screen, take it again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dialog.open && view === 'focus') void keepAwake(true);
});

const SOURCES: Record<Exclude<AlgSource, 'speedcubedb'>, MessageKey> = { 'plan-b': 'practice.planB', community: 'practice.community', custom: 'custom.source' };
export const sourceLabel = (v: AlgVariant): string =>
  [
    v.id === 'main' ? t('practice.main') : '',
    v.source === 'speedcubedb' ? t('practice.scdbRank', { rank: v.rank ?? '–' }) : t(SOURCES[v.source]),
  ].filter(Boolean).join(' · ');

/** Makes `v` the case's algorithm everywhere (cards, practice, quizzes). */
function prefer(v: AlgVariant) {
  setPreferred(kase, v.id);
  choose(v);
  onUpdate(kase);
}

// "Añadir mi algoritmo" (folded: rarely used): checked against the case on submit; added (and chosen) only if it
// solves it.
const customInput = el('input', { id: 'practice-custom', type: 'text', required: true, pattern: '.*\\S.*', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, placeholder: t('custom.placeholder'), ariaLabel: t('custom.add') });
const customStatus = el('p', { className: 'hint', ariaLive: 'polite' });
const customForm = el('form', { className: 'custom-alg' },
  el('div', { className: 'row' }, customInput, el('button', { type: 'submit', textContent: t('custom.submit') })),
  customStatus);
const customBox = el('details', {}, el('summary', { textContent: t('custom.add') }), customForm);
const algOptions = el('div', { className: 'algs' }); // rebuilt per case; the form stays put (focus, live status)
$('practice-algs').replaceChildren(el('legend', { className: 'sr-only', textContent: t('practice.algs') }),
  el('p', { className: 'hint', textContent: t('practice.algsHint') }), algOptions, customBox);
/** Cleared first, so the same message twice in a row is announced again. */
function say(msg: string) {
  customStatus.textContent = '';
  requestAnimationFrame(() => (customStatus.textContent = msg));
}
const caseTitle = (c: Case) => (loc(c.name) === c.code ? c.code : `${c.code} · ${loc(c.name)}`);
customForm.onsubmit = (e) => {
  e.preventDefault();
  const r = checkCustomAlg(kpuzzle, kase, phaseOf(kase.id)?.groups.flatMap((g) => g.cases) ?? [], customInput.value);
  if (r.kind === 'solves') {
    const known = variants(kase).find((v) => tokenize(v.alg).join(' ') === r.alg);
    prefer(known ?? addCustom(kase.id, r.alg));
    customInput.value = '';
    renderInfo();
    say(t(known ? 'custom.exists' : 'custom.added'));
    customInput.focus();
    return;
  }
  if (r.kind === 'inverse') customInput.value = r.alg;
  say(r.kind === 'bad-token' ? t('custom.badToken', { token: r.token })
    : r.kind === 'inverse' ? t('custom.inverse', { alg: r.alg })
    : r.kind === 'other' ? t('custom.other', { name: caseTitle(r.case) }) : t('custom.none'));
};

function removeButton(v: AlgVariant) {
  const b = el('button', { type: 'button', className: 'small', textContent: t('custom.remove'), ariaLabel: t('custom.removeLabel', { alg: v.alg }) });
  b.onclick = () => {
    removeCustom(kase.id, v.alg);
    if (variant.id === v.id) prefer(preferred(kase)); // it was the chosen one: back to the main algorithm
    renderInfo();
    customBox.open = true;
    customInput.value = v.alg; // the undo: Añadir brings it back
    say(t('custom.removed'));
    customInput.focus();
  };
  return b;
}

// Case facts and the algorithm choice: they only change when another case opens (or the algorithms do).
function renderInfo() {
  $('practice-title').textContent = caseTitle(kase);
  $('practice-recognition').replaceChildren(...inlineText(loc(kase.recognition)));
  $('practice-note').replaceChildren(...(kase.note ? inlineText(loc(kase.note)) : []));
  $('practice-note').hidden = !kase.note;
  const link = $('practice-scdb') as HTMLAnchorElement;
  link.hidden = !kase.scdb;
  link.href = kase.scdb?.url ?? '';
  $('practice-more').hidden = !kase.note && !kase.scdb;
  const p = caseProbability(kase.id, kpuzzle);
  $('practice-prob').textContent = p === null ? '' : t('prob.practice', { p: formatProbability(p) });
  $('practice-prob').hidden = p === null;
  const all = variants(kase);
  $('practice-change-label').textContent = all.length > 1 ? `${t('practice.change')} (${all.length})` : t('practice.change');
  const current = preferred(kase);
  const option = (v: AlgVariant, folded: boolean) => {
    const input = el('input', { type: 'radio', name: 'practice-alg', value: v.id, checked: v.id === current.id });
    input.onchange = () => {
      prefer(v);
      if (!folded) return; // ponytail: only a folded pick re-orders: arrow keys between the two shown would swap them back and forth
      renderInfo();
      algOptions.querySelector<HTMLInputElement>('input:checked')!.focus();
    };
    const label = el('label', { className: 'alg-option' }, input,
      el('code', { textContent: formatAlg(tokenize(v.alg)) }),
      el('span', { className: 'hint', textContent: `${sourceLabel(v)} · ${t('practice.htm', { n: htm(centerMoves(v.alg, IDENTITY)) })}` }),
      ...(v.note ? [el('span', { className: 'hint alg-note' }, ...inlineText(loc(v.note)))] : []));
    return v.source === 'custom' ? [label, removeButton(v)] : [label]; // outside the label: not part of the radio's name
  };
  const [first, second, ...more] = byChoice(all, current);
  algOptions.replaceChildren(...option(first, false), ...(second ? option(second, false) : []),
    ...(more.length ? [moreAlgs(more.length, more.flatMap((v) => option(v, true)))] : []));
}

/** The algorithms past the chosen one and its secondary, folded ("Más algoritmos (n)"); the case page uses it too. */
export const moreAlgs = (n: number, items: Node[]): HTMLDetailsElement =>
  el('details', { className: 'more-algs' }, el('summary', { textContent: t('case.moreAlgs', { n }) }), el('div', {}, ...items));

/** The "?": how the tab works, with a cube or without. */
const helpKey = (): MessageKey =>
  tab === 'quiz' ? 'practice.testHint'
  : tab === 'drill' ? (linked() ? 'practice.drillHint' : 'practice.helpDrill')
  : linked() ? 'practice.helpPracticeCube' : 'practice.helpPractice';

const show = (id: string, on: boolean) => void ($(id).hidden = !on);
const text = (id: string, s: string) => {
  $(id).textContent = s;
  show(id, !!s);
};

function render() {
  if (!dialog.open) return;
  const twoByTwo = cube.pattern() && !linked() && tab !== 'quiz' ? ` ${t('practice.no2x2Cube')}` : '';
  helpBox.textContent = t(helpKey(), { n: FADE_AFTER }) + twoByTwo;
  show('practice-prep', view === 'prep');
  show('practice-focus', view === 'focus');
  // the stats: under Empezar, or over the card
  if (view === 'prep') $('practice-start').after(tiles);
  else $('practice-card').before(tiles);
  renderTiles();
  if (view === 'prep') {
    for (const b of tabButtons) b.setAttribute('aria-pressed', String(b.dataset.tab === tab));
    $('practice-lead').textContent = t(`practice.lead.${tab}`) + twoByTwo;
    $('practice-start').textContent = t(tab === 'quiz' ? 'practice.testStart' : 'practice.start');
    return;
  }
  renderFocus();
}

/** Practicar: the bar, the card in its state, the buttons under it, the sitting. */
function renderFocus() {
  const shown = solutionShown();
  const on = solutionView(streakNow(), choice) === 'shown'; // Solución (a peek aside)
  $('practice-mode').textContent = t(`practice.tab.${tab}`);
  const reveal = $('practice-reveal');
  reveal.textContent = t(on ? 'practice.solutionShown' : 'practice.solutionHidden');
  reveal.ariaPressed = String(on);
  const cubeOn = !!linked();
  const card = $('practice-card');
  card.dataset.state = cubeOn ? mode : hand;
  card.toggleAttribute('data-tap', !cubeOn && hand !== 'stopped');
  // everything off, then what the state shows
  for (const id of ['practice-steps', 'practice-card-scramble', 'practice-rotate', 'practice-next', 'practice-delta', 'practice-desc',
    'practice-list', 'practice-solution', 'practice-grade', 'practice-again', 'practice-peek', 'practice-another', 'practice-lap-fail', 'practice-finish']) show(id, false);
  fingerNow.hidden = true; // renderSolve shows it
  $('practice-delta').className = 'delta';
  const clock = $('practice-clock');
  clock.classList.toggle('running', midRep());
  clock.classList.toggle('small', false);
  show('practice-clock', true);
  if (cubeOn) renderCube(shown);
  else renderHand(shown);
  text('practice-notice', notice);
  show('practice-fingers', shown);
  show('practice-anim', shown);
  if (!shown) anim.set(false);
  renderSession();
}

/** The hand clock: Listo (the scramble, big), corriendo (the time), parado (Limpio / Fallé); Memoria muscular in laps. */
function renderHand(shown: boolean) {
  const practice = tab === 'practice';
  const clock = $('practice-clock');
  const ready = hand === 'ready';
  if (hand !== 'running') clock.textContent = formatTime(hand === 'stopped' ? stoppedMs : 0);
  clock.classList.toggle('small', practice && ready);
  show('practice-card-scramble', practice && ready);
  show('practice-solution', shown);
  text('practice-card-top', practice ? (ready ? t('practice.setup') : hand === 'running' && !shown ? t('practice.memory') : '')
    : hand === 'running' ? t('practice.lap', { n: series.length + 1 }) : '');
  if (hand === 'stopped') {
    deltaView(comparison);
    show('practice-grade', true);
    $('practice-clean').textContent = t(helped ? 'practice.next' : 'practice.cleanBtn');
    show('practice-fail', !helped);
  } else if (!practice && hand === 'running' && series.length) {
    const last = series.at(-1)!;
    text('practice-delta', t('practice.lastLap', { time: formatTime(last.ms) }) + (last.clean ? '' : ' ✗'));
  } else if (!practice && ready && seriesDone.length) {
    const s = summary(seriesDone);
    const n = htm(centerMoves(active(), IDENTITY));
    text('practice-delta', t('practice.series', { reps: tp('academy.reps', s.reps), mean: formatTime(s.mean!), tps: ((n * 1000) / s.mean!).toFixed(1) }));
  }
  text('practice-card-hint', hand === 'stopped' ? t(helped ? 'practice.card.peeked' : 'practice.card.grade')
    : practice ? t(ready ? 'practice.card.ready' : 'practice.timerStop')
    : t(ready ? 'practice.card.readyDrill' : 'practice.card.lap'));
  show('practice-peek', !shown && hand !== 'stopped');
  show('practice-another', practice && ready);
  show('practice-lap-fail', !practice && hand === 'running');
  show('practice-finish', !practice && hand === 'running');
}

/** The time against the case's record, colored: a new best or faster than the average green, slower yellow. */
function deltaView(c: Comparison | null, extra = '') {
  if (!c) return;
  const d = $('practice-delta');
  const sign = (ms: number) => (ms < 0 ? '−' : '+') + formatTime(Math.abs(ms));
  text('practice-delta', (c.kind === 'first' ? t('practice.first')
    : c.kind === 'best' ? t('practice.newBest', { by: formatTime(c.by) })
    : t('practice.vsAvg', { delta: sign(c.delta) })) + extra);
  d.classList.toggle('faster', c.kind === 'best' || (c.kind === 'avg' && c.delta < 0));
  d.classList.toggle('slower', c.kind === 'avg' && c.delta > 0);
}

/** With the smart cube: Mezcla (walk there), Resuelve (follow the solution), the result. */
function renderCube(shown: boolean) {
  const practice = tab === 'practice';
  show('practice-steps', practice && mode !== 'result');
  $('practice-step-scramble').setAttribute('aria-current', mode === 'scramble' ? 'step' : 'false');
  $('practice-step-solve').setAttribute('aria-current', mode === 'solve' ? 'step' : 'false');
  text('practice-card-top', mode === 'solve' && !shown ? t('practice.memory') : '');
  text('practice-card-hint', mode === 'result' && !practice ? t('practice.card.nextTurn') : '');
  if (mode === 'scramble') {
    show('practice-clock', false);
    show('practice-another', practice);
    return renderScramble();
  }
  if (mode === 'solve') {
    if (!startedAt) $('practice-clock').textContent = formatTime(0);
    $('practice-clock').classList.toggle('small', shown); // the next move is the big thing
    show('practice-peek', !shown);
    return renderSolve(shown);
  }
  renderResult();
}

function renderScramble() {
  const g = guide.guide;
  const next = g && nextStep(g);
  const shown = next && cube.label(next);
  text('practice-next', shown ?? '…');
  const desc = shown && describe(shown);
  text('practice-desc', performance.now() < redoUntil ? t('practice.restart')
    : !desc ? t('guide.planning') : g!.half ? t('guide.secondHalf', { desc }) : desc);
  show('practice-list', true);
  $('practice-list').replaceChildren(algView((g?.steps ?? []).map(cube.label), { mark: (i) => (i === 0 ? 'current' : '') }));
}

function renderSolve(shown: boolean) {
  const f = follower!;
  const i = f.index;
  const step = f.steps[i];
  const tokens = active();
  const frame = expand(tokens.slice(0, i), YELLOW_UP).frame; // how the user holds the cube now
  const name = (m: string) => unmapMove(m, frame);
  const undo = f.undo.reverse(); // next correction first
  const left = f.remaining();
  const partial = left.join(' ') !== step.moves.join(' ');
  // from memory: only the corrections (they don't give the algorithm away), never the next move
  text('practice-desc', undo.length ? t('practice.wrong', { moves: undo.map(name).join(' ') })
    : tab === 'drill' && performance.now() < redoUntil ? t('practice.restartDrill')
    : shown && partial ? t('practice.left', { moves: left.map(name).join(' ') }) : '');
  if (!shown) return;
  // Rotations right before this step: the user turns the whole cube first.
  const rotations: string[] = [];
  for (let j = i - 1; j >= 0 && !f.steps[j].moves.length; j--) rotations.unshift(f.steps[j].token);
  text('practice-rotate', rotations.length ? t('practice.rotate', { rotation: rotations.join(' ') }) : '');
  text('practice-next', undo.length ? name(undo[0]) : step.token);
  if (tab === 'drill' && !undo.length && hints[i]) {
    fingerNow.hidden = false;
    fingerNow.textContent = t('fingers.now', { hint: [markText(hints[i]), hints[i].label].filter(Boolean).join(' · ') });
  }
  show('practice-list', true);
  $('practice-list').replaceChildren(algView(tokens, { mark: (j) => (j < i ? 'done' : j === i ? 'current' : '') }));
}

function renderResult() {
  const r = lastRep!;
  $('practice-clock').textContent = formatTime(r.ms);
  deltaView(comparison, ` · ${t(r.clean ? 'practice.clean' : 'practice.notClean')}`);
  text('practice-desc', t('practice.rep', { moves: r.moves, htm: r.htm, ref: htm(centerMoves(active(), IDENTITY)) }));
  show('practice-again', tab === 'practice');
  $('practice-again').textContent = t('practice.again');
}

// The case's numbers: best, average of the last ones, and the streak towards the criterion as dots.
const tiles = $('practice-tiles');
function renderTiles() {
  const s = statsFor(kase.id);
  const avg = s && average(s);
  const streak = s?.streak ?? 0;
  const tile = (label: string, ...value: Node[]) => el('div', {}, el('small', { textContent: label }), ...value);
  const dots = el('div', {
    className: ['streak', streak >= STREAK_GOAL ? 'done' : '', celebrate ? 'celebrate' : ''].filter(Boolean).join(' '),
    role: 'img',
    ariaLabel: streak >= STREAK_GOAL ? t('practice.streakDone', { goal: STREAK_GOAL }) : t('practice.streak', { n: streak, goal: STREAK_GOAL }),
  }, ...Array.from({ length: STREAK_GOAL }, (_, i) => el('i', { className: i < streak ? 'on' : '' })),
  el('span', { textContent: `${streak}/${STREAK_GOAL}` }));
  celebrate = false; // once: the next render draws the dots still
  tiles.replaceChildren(
    tile(t('practice.tile.best'), el('strong', { textContent: s?.best == null ? '–' : formatTime(s.best) })),
    tile(t('practice.tile.avg'), el('strong', { textContent: avg == null ? '–' : formatTime(avg) })),
    tile(t('practice.tile.streak'), dots));
}

/** This sitting: how many, best and mean, and each time (the newest first; failed ones struck through). */
function renderSession() {
  const box = $('practice-session');
  box.hidden = !session.length;
  if (!session.length) return box.replaceChildren();
  const s = summary(session);
  const shown = session.slice(-SESSION_SHOWN).reverse();
  box.replaceChildren(
    el('p', { className: 'hint', textContent: t('practice.session', { reps: tp('academy.reps', s.reps), best: formatTime(s.best!), mean: formatTime(s.mean!) }) }),
    el('ol', { className: 'session-reps', ariaLabel: t('practice.sessionList') }, ...shown.map((r) => {
      const time = formatTime(r.ms);
      return el('li', r.clean ? { textContent: time } : { className: 'bad', textContent: time, ariaLabel: t('practice.repBad', { time }) });
    })));
}

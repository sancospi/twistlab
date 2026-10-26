// Practice one case, in two of the three ways its page offers (the third, the Quiz, is quiz.ts's), the dialog opening
// straight on the clock card, big, with the screen kept awake:
// - Practicar (aprender): the case set up from solved by the chosen algorithm backwards, and solved with the algorithm
//   (a random state is the Quiz's). With a synced cube: 1) Mezcla walks the cube there, 2) Resuelve follows the
//   solution token by token, with corrections, timed from the first turn; the next turn (or Otra vez) starts another
//   repetition. Without one: the scramble big on the clock card; a tap (or Space) hides it and starts the clock, the
//   next stops it, and the user says how it went (Limpio / Fallé) before the scramble comes back for the next one.
// - Memoria muscular (agilizar): the algorithm alone, no scramble. With a cube it's followed from whatever state the
//   cube is in (the next turn after a rep starts another); without one, a series: each tap ends a repetition and starts
//   the next (X for a failed one), until Terminar serie.
// The algorithm to use is changed under the card. The solution shows while learning and hides by itself after
// FADE_AFTER clean in a row (Solución toggles it for the sitting; Ver solución shows it once, and that repetition isn't
// clean). Every repetition (time, moves, clean) counts towards the plan's drill criterion: the streak of STREAK_GOAL,
// drawn as dots; only the clean ones' times make the best and the average.
import { TwistyPlayer, type TwistyPlayerConfig } from 'cubing/twisty';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { CAMERA, IDENTITY, YELLOW_UP, caseSetup, centerMoves, expand, formatAlg, htm, invertMove, mapMove, tokenize, triggerSegments, turnCount, unmapMove, type Frame } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView, scrambleNote } from '../notation-view.ts';
import { inlineText, richText } from '../rich-text-view.ts';
import { loc, t, tp, type MessageKey } from '../i18n.ts';
import { MASKS, goalReached, heldMask, holdRotation, practiceSpec, quizPattern, type QuizSpec } from './cube.ts';
import { caseDiagram, isoTurns, type DiagramOpts } from './diagram.ts';
import { MAX_UNDO, REDO_MS, StepFollower } from './follow.ts';
import { cube, type CubeListener } from './link.ts';
import { addCustom, average, byChoice, preferred, recordRep, removeCustom, setPreferred, statsFor, STREAK_GOAL, variants, type Rep } from './store.ts';
import { FADE_AFTER, compare, solutionView, summary, type Comparison, type SessionRep, type SolutionView } from './practiceSession.ts';
import { caseLabel, puzzleOf, type AlgSource, type AlgVariant, type Case, type Puzzle, type Stage } from './types.ts';
import { checkCustomAlg } from './customAlg.ts';
import { fingertricks, type FingerHint } from '../fingertricks.ts';
import { phaseOf } from './probability.ts';
import { $, el } from '../el.ts';
import { openSheet } from '../router.ts';

const dialog = $('practice') as HTMLDialogElement;

const SESSION_SHOWN = 12; // the sitting's latest times on screen (its numbers count them all)

type StickeringMask = NonNullable<TwistyPlayerConfig['experimentalStickeringMaskOrbits']>; // cubing.js doesn't export it
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
 *  caseSetup, so it starts held like the figure), the stage's pieces in color, seen from the figure's corner. `hold`:
 *  the cube held another way (color neutral), its colors as the figure paints them; the turns stay the places'. */
export function loadCase(p: TwistyPlayer, kpuzzle: KPuzzle, stage: Stage, setup: string[], alg: string[], hold: Frame = IDENTITY): void {
  setPuzzle(p, puzzleOf(stage));
  p.experimentalSetupAlg = ['z2', holdRotation(hold), ...setup].filter(Boolean).join(' '); // the player starts white up: z2 is the plan's yellow up
  p.alg = alg.join(' ');
  p.experimentalStickeringMaskOrbits = heldMask(kpuzzle, MASKS[stage], hold) as StickeringMask; // held: the mask turns too
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
export type Tab = 'practice' | 'drill'; // Practicar / Memoria muscular
let tab: Tab = 'practice';
let kpuzzle: KPuzzle;
let kase: Case;
let variant: AlgVariant;
let tokens: string[] = []; // the algorithm
let rep: { spec: QuizSpec; user: KPattern; tokens: string[] }; // Practicar: this repetition's state and its solution
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

/** Opens the practice dialog for a case on Practicar or Memoria muscular, its clock card ready; `onChange` runs when
 *  its preferred algorithm or stats change. Escape, ×, or Back close it. */
export async function openPractice(c: Case, onChange: (c: Case) => void, startTab: Tab): Promise<void> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  tab = startTab;
  kase = c;
  dialog.dataset.puzzle = puzzleOf(c.stage); // for the move tooltips
  onUpdate = onChange;
  choice = null;
  notice = '';
  customInput.value = customStatus.textContent = '';
  helpBox.hidden = true;
  helpToggle.ariaExpanded = 'false';
  anim.set(false); // the figure is the default; the animation is asked for
  renderInfo();
  cube.listener = listener; // a 2x2 case too: its note on the 3x3 cube follows the connection
  openSheet(dialog);
  void keepAwake(true);
  choose(preferred(c));
  dialog.scrollTop = 0;
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: the dialog was reopened meanwhile
  if (cube.listener === listener) cube.listener = null; // the quiz may have taken the cube already
  stopAll();
  void keepAwake(false);
  anim.set(false);
});

/** The algorithm to practise: a new one starts the sitting over (its times aren't the other's). */
function choose(v: AlgVariant) {
  variant = v;
  tokens = tokenize(v.alg);
  newRep();
  session = [];
  seriesDone = [];
  start();
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

/** Starts the current tab on the card: with a cube, set the case up (Practicar) or follow the algorithm from anywhere
 *  (Memoria muscular); otherwise the hand clock waits for its first tap. `undo`: the cube's turn since it was solved. */
function start(undo?: string) {
  stopAll();
  comparison = null;
  lastRep = null;
  peek = helped = false;
  showContent();
  if (linked()) {
    if (tab === 'practice') startScramble(undo);
    else {
      beginSolve();
      render();
    }
    return focus('practice-card'); // inside the dialog (not ×, where Space would close it); the cube drives it
  }
  render();
  refocus();
}

/** The figures (the chosen algorithm's case), the scramble, the algorithm and its fingers. */
function showContent() {
  const figure = (size: number) => caseSVG(kase, rep.user, { size, title: t('academy.diagram', { code: kase.code }), arrows: true });
  // the chosen algorithm backwards on both tabs: the same case seen the same way as its scramble and animation
  $('practice-card-diagram').innerHTML = figure(96);
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

function startScramble(undo?: string) {
  mode = 'scramble';
  follower = null;
  // cube frame (yellow is the cube's D). From solved (or one turn past it), the repetition's own scramble; from
  // anywhere else the solver's.
  void guide.start(quizPattern(kpuzzle, rep.spec, YELLOW_UP), [...(undo ? [invertMove(undo)] : []), ...rep.spec.moves.map((m) => mapMove(m, YELLOW_UP))]);
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
  const r: Rep = { ms: performance.now() - startedAt, moves: done.length, htm: turnCount(done), clean: clean && !helped };
  record(r);
  mode = 'result';
  render();
  announce(`${formatTime(r.ms)}. ${comparison ? `${comparisonText(comparison)} · ` : ''}${t(r.clean ? 'practice.clean' : 'practice.notClean')}. ${notice}`);
  if (tab === 'practice') focus('practice-again'); // Space/Enter start the next rep natively (otherwise × keeps the focus and Space closes)
}

/** Records a repetition: the stats, the sitting, and what changed with it (the solution's view, the criterion). */
function record(r: Rep) {
  const before = statsFor(kase.id);
  const was = solutionView(before?.streak ?? 0, choice);
  comparison = compare(r.ms, before, r.clean);
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
    if (!linked()) return; // a 2x2 case isn't done on it
    if (mode === 'result') { // the next turn starts the next repetition: Practicar's scramble undoes it first
      if (tab === 'practice') return newRep(), start(move);
      beginSolve();
    }
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
        // drill: any start state; the frame: Roux's blocks. finishRep renders and places the focus: nothing after it
        if (tab === 'drill' || goalReached(kase.stage, cube.pattern()!, YELLOW_UP)) return finishRep();
        else startScramble(); // can't happen from the exact state; start over rather than record nonsense
      }
    }
    render();
  },
  sync() {
    if (!cube.pattern()) {
      if (mode !== 'static') start(); // disconnected: the hand clock
    } else if ((mode === 'static' && linked()) || mode === 'solve') {
      start(); // a cube just synced, or the state drifted mid-algorithm: start the repetition again
    } else if (mode === 'scramble') {
      void guide.replan();
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

/** Focus without scrolling: on a phone the sheet would jump to the element, past the title and the bar. */
const focus = (id: string) => $(id).focus({ preventScroll: true });
/** After a button: the clock keeps the focus, so Space is the clock again (not that button once more), or the card
 *  while the clock is hidden (Space on it is the clock too); stopped, Limpio; with the cube, after a rep, Otra vez. */
const refocus = () => {
  if (!linked()) focus(hand === 'stopped' ? 'practice-clean' : $('practice-clock').hidden ? 'practice-card' : 'practice-clock');
  else if (tab === 'practice' && mode === 'result') focus('practice-again');
};
$('practice-again').onclick = () => {
  newRep();
  start();
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
  refocus();
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

// Without a cube: the card is the clock (tap anywhere on it, or Space). Its moves and buttons keep their own taps, and
// the tap that closes a move's tooltip (light dismiss lets it through, even on the tooltip: it's outside the modal) is
// only that. Running, the touch itself stops it, as the Resolver's does: a click is lost when a hurried tap slides, and
// comes only once the finger lifts. Memoria muscular's lap ends as the finger lifts, timed from the touch: its card
// scrolls (Fallé and Terminar serie can be under the fold), and a swipe is cancelled instead of being a clean lap. Its
// moves don't take taps then (_practice.scss): the whole card ends the lap.
const clockTime = $('practice-clock');
const ownTap = (e: Event) => !!(e.target as Element).closest('button:not(#practice-clock), a, summary, input');
let tipAtDown = false;
let downActed = false; // this press already stopped the clock: its click, wherever it lands (Limpio shows up under the finger), is only that
let lapAt = 0; // Memoria muscular: when the press that may end the lap came down (0: none, or it became a scroll)
dialog.addEventListener('pointerdown', () => {
  tipAtDown = !!document.getElementById('tip')?.matches(':popover-open');
  downActed = false;
  lapAt = 0;
}, true);
dialog.addEventListener('click', (e) => {
  if (downActed && e.detail > 0) e.stopPropagation();
  downActed = false;
}, true);
const card = $('practice-card');
card.addEventListener('pointerdown', (e) => {
  if (hand !== 'running' || e.button !== 0 || ownTap(e)) return;
  if (tab === 'drill') lapAt = performance.now();
  else (downActed = true), act();
});
card.addEventListener('pointerup', () => {
  if (!lapAt || hand !== 'running') return;
  downActed = true;
  lap(true, lapAt);
  lapAt = 0;
});
card.addEventListener('pointercancel', () => (lapAt = 0));
card.addEventListener('click', (e) => {
  const dismissing = tipAtDown && e.detail > 0 && hand !== 'running'; // e.detail 0: Space or Enter on the clock; running, a tap stops
  tipAtDown = false;
  if (!dismissing && !ownTap(e)) act();
});
dialog.addEventListener('keydown', (e) => {
  const target = e.target as Element;
  if (e.code === 'KeyX' && !e.repeat && !linked() && !target.closest?.('input')) {
    if (tab === 'practice' && hand === 'stopped' && !helped) grade(false);
    else if (tab === 'drill' && hand === 'running') lap(false);
    else return;
    return e.preventDefault();
  }
  // a focused control presses itself (inside the 3D player's shadow DOM too, hence the composed path)
  if (e.code !== 'Space' || e.composedPath().some((n) => n instanceof Element && n.matches('button, input, select, summary, a, twisty-player'))) return;
  if (linked()) { // with the cube Space is only Otra vez, after a rep (wherever the focus went)
    if (tab !== 'practice' || mode !== 'result') return;
    e.preventDefault();
    if (!e.repeat) $('practice-again').click();
    return;
  }
  e.preventDefault(); // elsewhere Space is the clock; stopped (the focus left Limpio), Limpio
  if (e.repeat) return;
  if (tab === 'practice' && hand === 'stopped') grade(true);
  else act();
});

/** A tap on the card: start, stop (Practicar: then Limpio / Fallé), or end a lap (Memoria muscular). */
function act() {
  if (linked() || hand === 'stopped') return;
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
    comparison = compare(stoppedMs, statsFor(kase.id), false); // no best before Limpio: Fallé would take it back
    render();
    announce(`${formatTime(stoppedMs)}. ${comparison ? `${comparisonText(comparison)}. ` : ''}${t(helped ? 'practice.card.peeked' : 'practice.card.grade')}`);
    return focus('practice-clean'); // Space: Limpio; X: Fallé
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
  announce(notice);
  refocus();
}

/** Memoria muscular without a cube: a repetition ends (clean or not) and the next one starts, `now` (a touch's start). */
function lap(ok: boolean, now = performance.now()) {
  if (hand !== 'running') return;
  const n = htm(centerMoves(active(), IDENTITY));
  const r = { ms: now - timerAt, moves: n, htm: n, clean: ok && !helped };
  timerAt = now;
  record(r);
  series.push({ ms: r.ms, clean: r.clean });
  peek = helped = false;
  render();
  announce(`${t(r.clean ? 'practice.lastLap' : 'practice.repBad', { time: formatTime(r.ms) })}. ${notice}`);
}

/** Terminar serie: the lap under way is dropped; the series is summed up. */
function finishSeries() {
  seriesDone = series;
  stopAll();
  peek = helped = false;
  render();
  announce($('practice-delta').textContent ?? '');
  refocus();
}

/** Read out once (the card's own texts aren't live regions: they'd repeat on every render). Cleared first, so the
 *  same message twice in a row is read again. */
function announce(msg: string) {
  const status = $('practice-status');
  status.textContent = '';
  requestAnimationFrame(() => (status.textContent = msg.trim()));
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
    if (wake || !dialog.open) return void lock.release(); // another request won, or left meanwhile
    wake = lock;
    lock.addEventListener('release', () => void (wake === lock && (wake = null)));
  } catch {} // not allowed (battery saver, a hidden page): the screen just behaves as usual
}
// the browser releases it when the page is hidden: back on screen, take it again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dialog.open) void keepAwake(true);
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
    : r.kind === 'other' ? t('custom.other', { name: caseLabel(r.case) }) : t('custom.none'));
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

// The case's name and the algorithm choice: they only change when another case opens (or the algorithms do).
function renderInfo() {
  $('practice-title').textContent = caseLabel(kase);
  const all = variants(kase);
  $('practice-change-label').textContent = all.length > 1 ? `${t('practice.change')} (${all.length})` : t('practice.change');
  const current = preferred(kase);
  const option = (v: AlgVariant, folded: boolean) => {
    const input = el('input', { type: 'radio', name: 'practice-alg', value: v.id, checked: v.id === current.id });
    input.onchange = () => {
      prefer(v); // starts over, the clock taking the focus: give it back, for the arrow keys
      if (!folded) return input.focus(); // ponytail: only a folded pick re-orders: arrow keys between the two shown would swap them back and forth
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
  tab === 'drill' ? (linked() ? 'practice.drillHint' : 'practice.helpDrill')
  : linked() ? 'practice.helpPracticeCube' : 'practice.helpPractice';

// renderCard hides everything and shows what the state needs; applied at the end, only what changes (hiding a focused
// button, even for an instant, drops its focus)
let batch: Map<string, boolean> | null = null;
const show = (id: string, on: boolean) => void (batch ? batch.set(id, on) : ($(id).hidden = !on));
const text = (id: string, s: string) => {
  $(id).textContent = s;
  show(id, !!s);
};

function render() {
  if (!dialog.open) return;
  const twoByTwo = cube.pattern() && !linked() ? `\n${t('practice.no2x2Cube')}` : '';
  helpBox.replaceChildren(...richText(t(helpKey(), { n: FADE_AFTER }) + twoByTwo)); // a line per idea
  renderTiles();
  renderCard();
}

/** The bar, the card in its state, the buttons under it, the sitting. */
function renderCard() {
  const shown = solutionShown();
  const on = solutionView(streakNow(), choice) === 'shown'; // Solución (a peek aside)
  $('practice-mode').textContent = t(`practice.tab.${tab}`);
  const reveal = $('practice-reveal');
  reveal.textContent = t(on ? 'practice.solutionShown' : 'practice.solutionHidden'); // the label says the state
  reveal.classList.toggle('off', !on);
  const cubeOn = !!linked();
  card.dataset.state = cubeOn ? mode : hand;
  card.dataset.tab = tab; // Memoria muscular keeps its card while running (index.html)
  card.classList.remove('undo'); // renderSolve marks a correction under way
  card.toggleAttribute('data-tap', !cubeOn && hand !== 'stopped');
  card.tabIndex = !cubeOn && tab === 'practice' && hand === 'ready' ? 0 : -1; // the clock hidden (renderHand): Tab reaches the card instead
  // everything off, then what the state shows
  batch = new Map();
  for (const id of ['practice-steps', 'practice-card-diagram', 'practice-card-scramble', 'practice-rotate', 'practice-next', 'practice-delta', 'practice-desc',
    'practice-list', 'practice-solution', 'practice-grade', 'practice-again', 'practice-peek', 'practice-lap-fail', 'practice-finish']) show(id, false);
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
  for (const [id, on] of batch) if ($(id).hidden === on) $(id).hidden = !on;
  batch = null;
  if (!shown) anim.set(false);
  renderSession();
}

/** The hand clock: Listo (the scramble, big), corriendo (the time), parado (Limpio / Fallé); Memoria muscular in laps. */
function renderHand(shown: boolean) {
  const practice = tab === 'practice';
  const clock = $('practice-clock');
  const ready = hand === 'ready';
  if (hand !== 'running') clock.textContent = formatTime(hand === 'stopped' ? stoppedMs : 0);
  show('practice-clock', !(practice && ready)); // an empty 0.00 between the scramble and the solution: the card is the clock
  show('practice-card-diagram', ready || !practice); // what the scramble leads to; the case Memoria muscular drills
  show('practice-card-scramble', practice && ready);
  show('practice-solution', shown);
  text('practice-card-top', practice ? (ready ? t('practice.setup') : hand === 'running' && !shown ? t('practice.memory') : '')
    : hand === 'running' ? t('practice.lap', { n: series.length + 1 }) : '\u00a0'); // ponytail: a blank line keeps the lap's place, so the clock doesn't move
  if (practice && ready && lastRep) {
    deltaView(comparison, ` · ${t(lastRep.clean ? 'practice.clean' : 'practice.notClean')}`); // the one just graded
  } else if (hand === 'stopped') {
    deltaView(comparison);
    show('practice-grade', true);
    $('practice-clean').replaceChildren(el('span', { textContent: t(helped ? 'practice.next' : 'practice.cleanBtn') }),
      el('kbd', { className: 'key-hint', ariaHidden: 'true', textContent: t('opts.spaceKey') }));
    show('practice-fail', !helped);
  } else if (!practice && hand === 'running' && series.length) {
    const last = series.at(-1)!;
    text('practice-delta', t('practice.lastLap', { time: formatTime(last.ms) }) + (last.clean ? '' : ' ✗'));
  } else if (!practice && ready && seriesDone.length) {
    const s = summary(seriesDone);
    const n = htm(centerMoves(active(), IDENTITY));
    const reps = tp('academy.reps', s.reps);
    text('practice-delta', s.mean === null ? t('practice.seriesNone', { reps })
      : t('practice.series', { reps, mean: formatTime(s.mean), tps: ((n * 1000) / s.mean).toFixed(1) }));
  }
  text('practice-card-hint', hand === 'stopped' ? t(helped ? 'practice.card.peeked' : 'practice.card.grade')
    : practice ? t(ready ? 'practice.card.ready' : 'practice.timerStop')
    : t(ready ? 'practice.card.readyDrill' : 'practice.card.lap'));
  show('practice-peek', !shown && hand !== 'stopped');
  show('practice-lap-fail', !practice && hand === 'running');
  show('practice-finish', !practice && hand === 'running');
}

/** "Tu primera marca", "¡Mejor marca! (−0.25)", "+0.32 vs. tu media" (the quiz's clock card says it too). */
export function comparisonText(c: Comparison): string {
  if (c.kind === 'first') return t('practice.first');
  if (c.kind === 'best') return t('practice.newBest', { by: formatTime(c.by) });
  const delta = formatTime(Math.abs(c.delta));
  return t('practice.vsAvg', { delta: delta === formatTime(0) ? delta : (c.delta < 0 ? '−' : '+') + delta });
}

/** Its color: a new best or faster than the average green ('faster'), slower yellow ('slower'). */
export const deltaClass = (c: Comparison | null): string =>
  !c || c.kind === 'first' ? '' : c.kind === 'best' || c.delta < 0 ? 'faster' : c.delta > 0 ? 'slower' : '';

/** The time against the case's record, colored; `extra` after it (or alone, with nothing to compare). */
function deltaView(c: Comparison | null, extra = '') {
  const s = (c ? comparisonText(c) : '') + extra;
  text('practice-delta', c ? s : s.replace(/^ · /, ''));
  $('practice-delta').className = ['delta', deltaClass(c)].filter(Boolean).join(' ');
}

/** With the smart cube: Mezcla (walk there), Resuelve (follow the solution), the result. */
function renderCube(shown: boolean) {
  const practice = tab === 'practice';
  show('practice-steps', practice && mode !== 'result');
  $('practice-step-scramble').setAttribute('aria-current', mode === 'scramble' ? 'step' : 'false');
  $('practice-step-solve').setAttribute('aria-current', mode === 'solve' ? 'step' : 'false');
  text('practice-card-top', mode === 'solve' && !shown ? t('practice.memory') : '');
  text('practice-card-hint', mode === 'result' ? t('practice.card.nextTurn') : '');
  if (mode === 'scramble') {
    show('practice-clock', false);
    show('practice-card-diagram', true);
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
  $('practice-card').classList.toggle('undo', undo.length > 0); // the undo in red: not the next turn of the algorithm
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
  }, el('span', { className: 'dots' }, ...Array.from({ length: STREAK_GOAL }, (_, i) => el('i', { className: i < streak ? 'on' : '' }))),
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
    el('p', { className: 'hint', textContent: t('practice.session', { reps: tp('academy.reps', s.reps), best: s.best === null ? '–' : formatTime(s.best), mean: s.mean === null ? '–' : formatTime(s.mean) }) }),
    el('ol', { className: 'session-reps', ariaLabel: t('practice.sessionList') }, ...shown.map((r) => {
      const time = formatTime(r.ms);
      return el('li', r.clean ? { textContent: time } : { className: 'bad', textContent: time, ariaLabel: t('practice.repBad', { time }) });
    })));
}

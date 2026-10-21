// Practice one case, in three ways (tabs), the same three as on its page and in this order:
// - Practicar (aprender): a fresh scramble of the case each repetition (another AUF and last layer, so it isn't learnt
//   as text), solved with its solution. With a synced cube: 1) Mezcla walks the cube there, 2) Resuelve follows the
//   solution token by token, with corrections, timed from the first turn. Without one: figure, scramble and solution
//   together, and a clock started and stopped by hand (Espacio or tap); Otra mezcla is the next repetition.
// - Quiz (retener): explains and opens the quiz of the case's group (quiz.ts).
// - Memoria muscular (agilizar): the algorithm alone, no scramble. With a cube it's followed from whatever state the
//   cube is in (the next turn after a rep starts another); without one, the same hand clock.
// Every repetition (time, moves, clean) counts towards the plan's drill criterion. The case's flat figure is always
// on top; the 3D animation only when asked for (Animation, shared with the case page and the quiz).
import { TwistyPlayer } from 'cubing/twisty';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { IDENTITY, YELLOW_UP, centerMoves, expand, formatAlg, htm, invertTokens, mapMove, tokenize, triggerSegments, turnCount, unmapMove } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { loc, t, tp, type MessageKey } from '../i18n.ts';
import { caseState, goalReached, llFaceOf, makeQuizItems, quizPattern, type QuizSpec } from './cube.ts';
import { isoSVG, maskFor, topSVG, type DiagramOpts } from './diagram.ts';
import { StepFollower } from './follow.ts';
import { cube, type CubeListener } from './link.ts';
import { solutionFor } from './score.ts';
import { addCustom, average, preferred, recordRep, removeCustom, save, setPreferred, setting, statsFor, STREAK_GOAL, variants, type Rep } from './store.ts';
import type { AlgSource, AlgVariant, Case, Stage } from './types.ts';
import { checkCustomAlg } from './customAlg.ts';
import { fingertricks, type FingerHint } from '../fingertricks.ts';
import { caseProbability, formatProbability, phaseOf } from './probability.ts';

const $ = (id: string) => document.getElementById(id)!;
/** Element with properties and children: enough DOM building for the academy's views. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e: HTMLElementTagNameMap[K] = document.createElement(tag);
  Object.assign(e, props);
  e.append(...children);
  return e;
}
const dialog = $('practice') as HTMLDialogElement;

const MAX_UNDO = 4; // more pending corrections than this: easier to set the case up again
const REDO_MS = 1500; // how long "too many mistakes" stays up after re-planning

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
};

/** Sets a player up: `alg` from the state `setup` leads to (user frame: yellow up, green front), the stage's pieces in color. */
export function loadCase(p: TwistyPlayer, stage: Stage, setup: string[], alg: string[]): void {
  p.experimentalSetupAlg = ['z2', ...setup].join(' '); // the player starts white up: z2 is the plan's yellow up
  p.alg = alg.join(' ');
  p.experimentalStickeringMaskOrbits = MASKS[stage];
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
  const mask = maskFor(c.stage);
  return (phaseOf(c.id)?.diagram === 'iso' ? isoSVG : topSVG)(patternToFacelets(user), mask, { ...opts, arrows: !!opts.arrows && mask === 'pll' });
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

type Mode = 'static' | 'scramble' | 'solve' | 'result';
export type Tab = 'practice' | 'quiz' | 'drill';
const TABS: Tab[] = ['practice', 'quiz', 'drill'];
let tab = setting<Tab>('practice-tab', 'practice', (v) => TABS.includes(v));
let kpuzzle: KPuzzle;
let kase: Case;
let variant: AlgVariant;
let tokens: string[] = []; // the algorithm
let rep: { spec: QuizSpec; user: KPattern; tokens: string[] }; // Practicar: this repetition's state and its solution
let mode: Mode = 'static';
let follower: StepFollower | null = null;
let startedAt = 0; // first move of the Resolver phase
let done: string[] = []; // quarter turns of this repetition
let clean = true;
let lastRep: Rep | null = null;
let redoUntil = 0;
let onUpdate: (c: Case) => void = () => {};
let onQuiz: () => void = () => {};
let timerAt = 0; // > 0 while the no-cube clock runs
let timerRaf = 0;

const guide = new PathGuide(() => cube.pattern(), () => {
  if (mode === 'scramble' && guide.reached()) beginSolve(); // an empty plan: already at the case
  render();
});

/** Opens the practice dialog for a case; `onChange` runs when its preferred algorithm or stats change,
 *  `quiz` opens a quiz of this case (the caller knows its group, for the answers). `startTab`: open on that tab
 *  (remembered, as if the user had picked it); else on the last one used. */
export async function openPractice(c: Case, onChange: (c: Case) => void, quiz: () => void, startTab?: Tab): Promise<void> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  if (startTab) save('practice-tab', (tab = startTab));
  kase = c;
  onUpdate = onChange;
  onQuiz = quiz;
  lastRep = null;
  customInput.value = customStatus.textContent = '';
  anim.set(false); // the figure is the default; the animation is asked for
  renderInfo();
  cube.listener = listener;
  dialog.showModal();
  choose(preferred(c));
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: the dialog was reopened meanwhile
  if (cube.listener === listener) cube.listener = null; // the quiz may have taken the cube already
  guide.stop();
  stopTimer();
  follower = null;
  mode = 'static';
  anim.set(false);
});

const tabButtons = [...$('practice-tabs').querySelectorAll<HTMLButtonElement>('button')];
for (const b of tabButtons) b.onclick = () => {
  save('practice-tab', (tab = b.dataset.tab as Tab));
  start();
};

function choose(v: AlgVariant) {
  variant = v;
  tokens = tokenize(v.alg);
  newRep();
  lastRep = null;
  start();
}

/** What's being done: Practicar's solution for this repetition, or the algorithm alone. */
const active = () => (tab === 'practice' ? rep.tokens : tokens);

/** Practicar: a fresh random state of the case (another AUF and last layer), solved with the chosen algorithm. */
function newRep() {
  const spec = makeQuizItems([kase], 1, crypto.getRandomValues(new Uint32Array(1))[0], kpuzzle)[0];
  const user = quizPattern(kpuzzle, spec, IDENTITY);
  rep = { spec, user, tokens: tokenize(solutionFor(kase, variant.alg, user)) };
}

/** Starts the current tab: with a cube, set the case up (Practicar) or follow the algorithm from anywhere (Memoria
 *  muscular); otherwise nothing runs until the user acts (quiz button, clock). */
function start() {
  stopTimer();
  showContent();
  if (cube.pattern() && tab === 'practice') return startScramble();
  if (cube.pattern() && tab === 'drill') {
    guide.stop();
    beginSolve();
    return render();
  }
  showStatic();
  if (tab !== 'quiz') $('practice-clock').focus(); // Space then starts the clock natively
}

/** The figure (this repetition's state in Practicar, the case otherwise), the scramble, the algorithm and its fingers. */
function showContent() {
  const practice = tab === 'practice';
  $('practice-diagram').innerHTML = caseSVG(kase, practice ? rep.user : caseState(kpuzzle, variant.alg, IDENTITY),
    { size: 120, title: t('academy.diagram', { code: kase.code }), arrows: true });
  $('practice-setup-row').hidden = !practice;
  $('practice-setup').replaceChildren(algView(rep.spec.moves));
  $('practice-alg-label').textContent = t(practice ? 'practice.solution' : 'practice.alg');
  $('practice-alg').replaceChildren(algView(active()));
  hints = fingertricks(active());
  const wasOpen = fingers.querySelector('details')?.open ?? false;
  fingers.replaceChildren(fingersView(active()));
  fingers.querySelector('details')!.open = wasOpen;
  anim.refresh();
}

// Practicar: from this repetition's scramble; Memoria muscular: the algorithm backwards, as on the case page.
const anim = new Animation($('practice-player'), (p) => loadCase(p, kase.stage, tab === 'practice' ? rep.spec.moves : invertTokens(tokens), active()));
$('practice-anim').append(anim.button());

function showStatic() {
  mode = 'static';
  guide.stop();
  follower = null;
  render();
}

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
}

function finishRep() {
  lastRep = { ms: performance.now() - startedAt, moves: done.length, htm: turnCount(done), clean };
  recordRep(kase.id, lastRep);
  mode = 'result';
  onUpdate(kase);
  render();
  $('practice-again').focus(); // Space/Enter start the next rep natively (otherwise × keeps the focus and Space closes)
}

const listener: CubeListener = {
  move(move) {
    if (mode === 'result' && tab === 'drill') beginSolve(); // the next turn starts the next repetition
    if (mode === 'scramble') {
      guide.onMove(move);
      if (guide.reached()) beginSolve();
    } else if (mode === 'solve' && follower) {
      startedAt ||= performance.now();
      done.push(move);
      if (follower.feed(move) === 'wrong') clean = false;
      if (follower.undo.length > MAX_UNDO) {
        redoUntil = performance.now() + REDO_MS;
        if (tab === 'drill') beginSolve();
        else startScramble();
      } else if (follower.done) {
        if (tab === 'drill' || goalReached(kase.stage, cube.pattern()!, llFaceOf(YELLOW_UP))) finishRep(); // drill: any start state
        else startScramble(); // can't happen from the exact state; start over rather than record nonsense
      }
    }
    render();
  },
  sync() {
    if (!cube.pattern()) {
      if (mode !== 'static') start(); // disconnected
    } else if (mode === 'static' || mode === 'solve') {
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
$('practice-next').after(fingerNow);
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

$('practice-again').onclick = () => {
  if (tab === 'practice') newRep();
  start();
};
$('practice-another').onclick = () => {
  newRep();
  lastRep = null;
  start();
};

// Without a cube (Practicar, Memoria muscular): a clock the user starts and stops (tap or Space).
const clockTime = el('span', { textContent: formatTime(0) });
const clockLabel = el('small', { className: 'hint' });
$('practice-clock').replaceChildren(clockTime, el('br'), clockLabel);
$('practice-clock').onclick = toggleTimer;
dialog.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || tab === 'quiz' || cube.pattern() || (e.target as Element).closest?.('button, input, select, summary, a')) return;
  e.preventDefault(); // a focused button presses itself; elsewhere Space is the clock
  if (!e.repeat) toggleTimer();
});

function toggleTimer() {
  if (!timerAt) {
    timerAt = performance.now();
    const tick = () => {
      clockTime.textContent = formatTime(performance.now() - timerAt);
      timerRaf = requestAnimationFrame(tick);
    };
    tick();
  } else {
    const n = htm(centerMoves(active(), IDENTITY));
    // ponytail: no cube, so the moves are the algorithm's and "clean" is the user's word for it
    lastRep = { ms: performance.now() - timerAt, moves: n, htm: n, clean: true };
    stopTimer();
    recordRep(kase.id, lastRep);
    onUpdate(kase);
  }
  render();
}

function stopTimer() {
  cancelAnimationFrame(timerRaf);
  timerAt = 0;
}
$('practice-quiz').onclick = () => {
  dialog.close(); // releases the cube for the quiz
  onQuiz();
};

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

// "Añadir mi algoritmo" (folded: rarely used, and it'd push each tab's content down on a phone): checked against the
// case on submit; added (and chosen) only if it solves it.
const customInput = el('input', { id: 'practice-custom', type: 'text', required: true, pattern: '.*\\S.*', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, placeholder: t('custom.placeholder'), ariaLabel: t('custom.add') });
const customStatus = el('p', { className: 'hint', ariaLive: 'polite' });
const customForm = el('form', { className: 'custom-alg' },
  el('div', { className: 'row' }, customInput, el('button', { type: 'submit', textContent: t('custom.submit') })),
  customStatus);
const customBox = el('details', {}, el('summary', { textContent: t('custom.add') }), customForm);
const algOptions = el('div', { className: 'algs' }); // rebuilt per case; the form stays put (focus, live status)
$('practice-algs').replaceChildren(el('legend', { textContent: t('practice.algs') }), algOptions, customBox);
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
    customInput.focus(); // prefer() may have moved it to the clock
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

// Case facts and the algorithm choice: they only change when another case opens.
function renderInfo() {
  $('practice-title').textContent = caseTitle(kase);
  $('practice-recognition').textContent = loc(kase.recognition);
  $('practice-note').textContent = kase.note ? loc(kase.note) : '';
  $('practice-note').hidden = !kase.note;
  const link = $('practice-scdb') as HTMLAnchorElement;
  link.hidden = !kase.scdb;
  link.href = kase.scdb?.url ?? '';
  const p = caseProbability(kase.id, kpuzzle);
  $('practice-prob').textContent = p === null ? '' : t('prob.practice', { p: formatProbability(p) });
  $('practice-prob').hidden = p === null;
  const current = preferred(kase);
  algOptions.replaceChildren(
    ...variants(kase).flatMap((v) => {
      const input = el('input', { type: 'radio', name: 'practice-alg', value: v.id, checked: v.id === current.id });
      input.onchange = () => prefer(v);
      const option = el('label', { className: 'alg-option' }, input,
        el('code', { textContent: formatAlg(tokenize(v.alg)) }),
        el('span', { className: 'hint', textContent: `${sourceLabel(v)} · ${t('practice.htm', { n: htm(centerMoves(v.alg, IDENTITY)) })}` }),
        ...(v.note ? [el('span', { className: 'hint alg-note', textContent: loc(v.note) })] : []));
      return v.source === 'custom' ? [option, removeButton(v)] : [option]; // outside the label: not part of the radio's name
    }),
  );
}


/** The helper of what's on screen: what to do now, how it ends, what comes next. */
const helpKey = (): MessageKey =>
  tab === 'quiz' ? 'practice.testHint'
  : tab === 'drill' ? (cube.pattern() ? 'practice.drillHint' : 'practice.timerHint')
  : mode === 'scramble' ? 'practice.scrambleHint' : mode === 'solve' ? 'practice.solveHint' : mode === 'result' ? 'practice.resultHint' : 'practice.staticHint';

function render() {
  if (!dialog.open) return;
  for (const b of tabButtons) b.setAttribute('aria-pressed', String(b.dataset.tab === tab));
  const guided = mode !== 'static';
  const timer = tab !== 'quiz' && !cube.pattern();
  $('practice-help').textContent = t(helpKey());
  $('practice-test').hidden = tab !== 'quiz';
  $('practice-static').hidden = !timer; // with a cube, the guidance lists the moves
  $('practice-timer').hidden = !timer;
  $('practice-another').hidden = tab !== 'practice';
  if (timer) {
    if (!timerAt) clockTime.textContent = formatTime(lastRep?.ms ?? 0);
    clockLabel.textContent = t(timerAt ? 'practice.timerStop' : 'practice.timerStart');
    $('practice-clock').classList.toggle('running', !!timerAt);
  }
  $('practice-guided').hidden = !guided;
  $('practice-steps').hidden = tab === 'drill'; // nothing to set up
  fingerNow.hidden = true; // renderSolve shows it
  renderStats();
  if (!guided) return;
  const solving = mode !== 'scramble';
  $('practice-step-scramble').setAttribute('aria-current', solving ? 'false' : 'step');
  $('practice-step-solve').setAttribute('aria-current', solving ? 'step' : 'false');
  $('practice-again').hidden = mode !== 'result';
  $('practice-result').hidden = mode !== 'result';
  if (mode === 'scramble') renderScramble();
  else if (mode === 'solve') renderSolve();
  else renderResult();
}

function renderScramble() {
  const g = guide.guide;
  const next = g && nextStep(g);
  const shown = next && cube.label(next);
  $('practice-rotate').textContent = '';
  $('practice-next').textContent = shown ?? '…';
  const desc = shown && describe(shown);
  $('practice-desc').textContent = performance.now() < redoUntil ? t('practice.restart')
    : !desc ? t('guide.planning') : g!.half ? t('guide.secondHalf', { desc }) : desc;
  $('practice-list').replaceChildren(algView((g?.steps ?? []).map(cube.label), { mark: (i) => (i === 0 ? 'current' : '') }));
}

function renderSolve() {
  const f = follower!;
  const i = f.index;
  const step = f.steps[i];
  const tokens = active();
  const frame = expand(tokens.slice(0, i), YELLOW_UP).frame; // how the user holds the cube now
  const name = (m: string) => unmapMove(m, frame);
  // Rotations right before this step: the user turns the whole cube first.
  const rotations: string[] = [];
  for (let j = i - 1; j >= 0 && !f.steps[j].moves.length; j--) rotations.unshift(f.steps[j].token);
  $('practice-rotate').textContent = rotations.length ? t('practice.rotate', { rotation: rotations.join(' ') }) : '';
  const undo = f.undo.reverse(); // next correction first
  const left = f.remaining();
  const partial = left.join(' ') !== step.moves.join(' ');
  $('practice-next').textContent = undo.length ? name(undo[0]) : step.token;
  $('practice-desc').textContent = undo.length ? t('practice.wrong', { moves: undo.map(name).join(' ') })
    : partial ? t('practice.left', { moves: left.map(name).join(' ') }) : '';
  if (tab === 'drill' && !undo.length && performance.now() < redoUntil) $('practice-desc').textContent = t('practice.restartDrill');
  if (tab === 'drill' && !undo.length && hints[i]) {
    fingerNow.hidden = false;
    fingerNow.textContent = t('fingers.now', { hint: [markText(hints[i]), hints[i].label].filter(Boolean).join(' · ') });
  }
  $('practice-list').replaceChildren(algView(tokens, { mark: (j) => (j < i ? 'done' : j === i ? 'current' : '') }));
}

function renderResult() {
  const r = lastRep!;
  const s = statsFor(kase.id)!;
  $('practice-rotate').textContent = '';
  $('practice-next').textContent = formatTime(r.ms);
  $('practice-desc').textContent = t('practice.rep', { moves: r.moves, htm: r.htm, ref: htm(centerMoves(active(), IDENTITY)) });
  $('practice-list').replaceChildren();
  $('practice-result').textContent = [
    t(r.clean ? 'practice.clean' : 'practice.notClean'),
    s.streak >= STREAK_GOAL ? t('practice.streakDone', { goal: STREAK_GOAL }) : t('practice.streak', { n: s.streak, goal: STREAK_GOAL }),
  ].join(' · ');
}

function renderStats() {
  const s = statsFor(kase.id);
  const avg = s && average(s);
  $('practice-stats').textContent = !s ? t('practice.noStats') : t('practice.stats', {
    reps: tp('academy.reps', s.reps),
    last: formatTime(s.last[0]),
    clean: s.clean,
    best: s.best === null ? '–' : formatTime(s.best),
    avg: avg == null ? '–' : formatTime(avg),
    streak: s.bestStreak,
  });
}

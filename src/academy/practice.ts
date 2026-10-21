// Practice one case. Without a synced cube: a 3D player shows the case and plays the algorithm (static).
// With one: 1) Mezcla walks the cube to the case, 2) Resolver follows the algorithm token by token,
// with corrections, and records each repetition (time, moves, clean) towards the plan's drill criterion.
import { TwistyPlayer } from 'cubing/twisty';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPuzzle } from 'cubing/kpuzzle';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { IDENTITY, YELLOW_UP, centerMoves, expand, htm, invertTokens, merge, tokenize, turnCount, unmapMove } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { loc, t, tp } from '../i18n.ts';
import { caseState, goalReached, llFaceOf } from './cube.ts';
import { StepFollower } from './follow.ts';
import { cube, type CubeListener } from './link.ts';
import { average, preferred, recordRep, save, setPreferred, setting, statsFor, STREAK_GOAL, type Rep } from './store.ts';
import type { AlgVariant, Case, Stage } from './types.ts';

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
const MASKS: Record<Stage, string> = {
  f2l: 'EDGES:DDDDIIIID-DD,CORNERS:DDD-IIII,CENTERS:------', // the green-orange pair stays in color
  'oll-cross': 'EDGES:DDDDOOOODDDD,CORNERS:DDDDIIII,CENTERS:------',
  'oll-corners': 'EDGES:DDDDOOOODDDD,CORNERS:DDDDOOOO,CENTERS:------',
  'pll-corners': 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:------',
  'pll-edges': 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:------',
};

// One player, reused: browsers allow only a few WebGL contexts.
let player: TwistyPlayer | null = null;
function staticPlayer(): TwistyPlayer {
  // drag stays on so the case can be inspected from any angle; hint facelets only add clutter here
  player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'bottom-row', experimentalSetupAnchor: 'start', hintFacelets: 'none' });
  if (!player.isConnected) $('practice-player').append(player);
  return player;
}

type Mode = 'static' | 'scramble' | 'solve' | 'result';
let kpuzzle: KPuzzle;
let kase: Case;
let variant: AlgVariant;
let tokens: string[] = [];
let mode: Mode = 'static';
let follower: StepFollower | null = null;
let startedAt = 0; // first move of the Resolver phase
let done: string[] = []; // quarter turns of this repetition
let clean = true;
let lastRep: Rep | null = null;
let redoUntil = 0;
let onUpdate: (c: Case) => void = () => {};
let onQuiz: () => void = () => {};

const guide = new PathGuide(() => cube.pattern(), () => {
  if (mode === 'scramble' && guide.reached()) beginSolve(); // an empty plan: already at the case
  render();
});

/** Opens the practice dialog for a case; `onChange` runs when its preferred algorithm or stats change,
 *  `quiz` opens a quiz of this case (the caller knows its group, for the answers). */
export async function openPractice(c: Case, onChange: (c: Case) => void, quiz: () => void): Promise<void> {
  kpuzzle ??= await cube3x3x3.kpuzzle();
  kase = c;
  onUpdate = onChange;
  onQuiz = quiz;
  lastRep = null;
  renderInfo();
  cube.listener = listener;
  dialog.showModal();
  choose(preferred(c));
}

dialog.addEventListener('close', () => {
  if (dialog.open) return; // 'close' is queued: the dialog was reopened meanwhile
  if (cube.listener === listener) cube.listener = null; // the quiz may have taken the cube already
  guide.stop();
  follower = null;
  mode = 'static';
  player?.pause();
});

function choose(v: AlgVariant) {
  variant = v;
  tokens = tokenize(v.alg);
  lastRep = null;
  loadPlayer(); // static it's the content; guided it's behind "Ver el caso"
  if (cube.pattern()) startScramble();
  else showStatic();
}

/** The case and the chosen algorithm in the 3D player (yellow up, ready to play). */
function loadPlayer() {
  const p = staticPlayer();
  p.experimentalSetupAlg = ['z2', ...invertTokens(tokens)].join(' ');
  p.alg = tokens.join(' ');
  p.experimentalStickeringMaskOrbits = MASKS[kase.stage];
  p.jumpToStart();
}

function showStatic() {
  mode = 'static';
  guide.stop();
  follower = null;
  render();
}

function startScramble() {
  mode = 'scramble';
  follower = null;
  // cube frame (yellow is the cube's D). From solved, the plan's way in: the algorithm backwards — short and
  // familiar; from anywhere else the guide falls back to the solver.
  const backwards = merge(invertTokens(centerMoves(variant.alg, YELLOW_UP)));
  void guide.start(caseState(kpuzzle, variant.alg, YELLOW_UP), backwards);
  render();
}

function beginSolve() {
  guide.stop();
  mode = 'solve';
  follower = new StepFollower(expand(tokens, YELLOW_UP).steps);
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
    if (mode === 'scramble') {
      guide.onMove(move);
      if (guide.reached()) beginSolve();
    } else if (mode === 'solve' && follower) {
      startedAt ||= performance.now();
      done.push(move);
      if (follower.feed(move) === 'wrong') clean = false;
      if (follower.undo.length > MAX_UNDO) {
        redoUntil = performance.now() + REDO_MS;
        startScramble();
      } else if (follower.done) {
        if (goalReached(kase.stage, cube.pattern()!, llFaceOf(YELLOW_UP))) finishRep();
        else startScramble(); // can't happen from the exact case state; start over rather than record nonsense
      }
    }
    render();
  },
  sync() {
    if (!cube.pattern()) {
      if (mode !== 'static') showStatic(); // disconnected
    } else if (mode === 'static' || mode === 'solve') {
      startScramble(); // a cube just synced, or the state drifted mid-algorithm: set the case up again
    } else if (mode === 'scramble') {
      void guide.replan();
    }
    render();
  },
};

$('practice-again').onclick = startScramble;
$('practice-quiz').onclick = () => {
  dialog.close(); // releases the cube for the quiz
  onQuiz();
};

const sourceLabel = (v: AlgVariant) =>
  [
    v.id === 'main' ? t('practice.main') : '',
    v.source === 'speedcubedb' ? t('practice.scdbRank', { rank: v.rank ?? '–' }) : t(v.source === 'plan-b' ? 'practice.planB' : 'practice.community'),
  ].filter(Boolean).join(' · ');

// Case facts and the algorithm choice: they only change when another case opens.
function renderInfo() {
  $('practice-title').textContent = loc(kase.name) === kase.code ? kase.code : `${kase.code} · ${loc(kase.name)}`;
  $('practice-recognition').textContent = loc(kase.recognition);
  $('practice-note').textContent = kase.note ? loc(kase.note) : '';
  $('practice-note').hidden = !kase.note;
  const link = $('practice-scdb') as HTMLAnchorElement;
  link.hidden = !kase.scdb;
  link.href = kase.scdb?.url ?? '';
  $('practice-setup').replaceChildren(algView(kase.setup));
  const current = preferred(kase);
  $('practice-algs').replaceChildren(
    el('legend', { textContent: t('practice.algs') }),
    ...kase.algs.map((v) => {
      const input = el('input', { type: 'radio', name: 'practice-alg', value: v.id, checked: v === current });
      input.onchange = () => {
        setPreferred(kase, v.id);
        choose(v);
        onUpdate(kase);
      };
      return el('label', { className: 'alg-option' }, input,
        el('code', { textContent: v.alg }),
        el('span', { className: 'hint', textContent: `${sourceLabel(v)} · ${t('practice.htm', { n: htm(centerMoves(v.alg, IDENTITY)) })}` }),
        ...(v.note ? [el('span', { className: 'hint alg-note', textContent: loc(v.note) })] : []));
    }),
  );
}


let showCase = setting('practice-show-case', false); // guided: whether the user keeps the case open
$('practice-case').addEventListener('toggle', () => {
  const box = $('practice-case') as HTMLDetailsElement;
  if (box.classList.contains('collapsible')) save('practice-show-case', (showCase = box.open));
});

function render() {
  if (!dialog.open) return;
  const guided = mode !== 'static';
  // Guided, the case (3D player, scramble, algorithm) is one tap away, below the guidance; static, it's the content.
  const caseBox = $('practice-case') as HTMLDetailsElement;
  caseBox.classList.toggle('collapsible', guided);
  caseBox.open = !guided || showCase;
  $('practice-static-hint').hidden = guided;
  $('practice-guided').hidden = !guided;
  $('practice-alg').replaceChildren(algView(tokens));
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
  $('practice-hint').textContent = t('practice.scrambleHint');
  $('practice-list').replaceChildren(algView((g?.steps ?? []).map(cube.label), { mark: (i) => (i === 0 ? 'current' : '') }));
}

function renderSolve() {
  const f = follower!;
  const i = f.index;
  const step = f.steps[i];
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
  $('practice-hint').textContent = t('practice.solveHint');
  $('practice-list').replaceChildren(algView(tokens, { mark: (j) => (j < i ? 'done' : j === i ? 'current' : '') }));
}

function renderResult() {
  const r = lastRep!;
  const s = statsFor(kase.id)!;
  $('practice-rotate').textContent = '';
  $('practice-next').textContent = formatTime(r.ms);
  $('practice-desc').textContent = t('practice.rep', { moves: r.moves, htm: r.htm, ref: htm(centerMoves(tokens, IDENTITY)) });
  $('practice-hint').textContent = '';
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
    clean: s.clean,
    best: s.best === null ? '–' : formatTime(s.best),
    avg: avg == null ? '–' : formatTime(avg),
    streak: s.bestStreak,
  });
}

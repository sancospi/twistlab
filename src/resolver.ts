// The Resolver: a WCA-style attempt (Regulations A3/A4, Stackmat behaviour) on a WCA scramble of the event chosen.
// Scramble -> Space: 15 s inspection -> hold Space (red) until green -> release starts the solve (or the smart cube's
// first turn) -> Space or the cube being solved stops it -> judge penalty -> Space: next scramble. Also its options
// (Opciones), the judge's calls, typed times, the keyboard, the big net and Retar. The times are times-view.ts's, the
// round round-view.ts's, the smart cube cube-link.ts's; this module plugs into each (their useResolver hooks).
import type { TwistyPlayer } from 'cubing/twisty';
import { experimentalSolve3x3x3IgnoringCenters, random333Pattern } from 'cubing/search';
import { randomScrambleForEvent } from 'cubing/scramble';
import { cube3x3x3, wcaEvents } from 'cubing/puzzles';
import {
  EVENTS, eventField, eventOf, formatResult, formatRunning, formatTime, has3d, hasInspection, HOLD_MS, HOLDS, INSPECTION_MS, inspectionCall,
  inspectionPenalty, is333, parseTime, PRECISIONS, recordTime, TRAINS, type CubeLog, type EventId, type Penalty, type Precision, type Result, type TrainId,
} from './timer.ts';
import * as duel from './duel-view.ts'; // small; Retar shares within the tap (a share sheet needs the user's gesture)
import { t } from './i18n.ts';
import { algView, scrambleNote } from './notation-view.ts';
import { $, btn, el } from './el.ts';
import * as challenges from './challenges-view.ts';
import type { Resolver } from './challenges-view.ts';
import { netState, setAlg, setNet, setNetPuzzle } from './cube-3d.ts';
import { save, setting } from './academy/store.ts';
import { navigate } from './router.ts';
import { idle, mod } from './screen.ts';
import * as times from './times-view.ts';
import { addSolve, dropSolve, event, renderResults, results, session, setEvent, showTime, train } from './times-view.ts';
import * as rounds from './round-view.ts';
import { countIn, finishIfDone, leaveOut, renderRound, renderRoundList, round } from './round-view.ts';
import * as cube from './cube-link.ts';
import { conn, guide, isSolved, load3d, moves, pattern, render, render3d, startGuide } from './cube-link.ts';

type Phase = 'scramble' | 'ready' | 'inspect' | 'solving' | 'done';
let phase: Phase = 'ready';
export const timing = () => phase === 'inspect' || phase === 'solving'; // mid-attempt: the event, session, round… can't change
let inspectStart = 0;
let solveStart = 0;
let holdStart = 0; // > 0 while Space / the screen is held during inspection
let pressPhase: Phase | null = null; // phase the current press began in; its release only acts there
let penalty: Penalty = 0;

let scrambleText = ''; // the current scramble, kept with the solve
let called = 0; // inspection call already made: 0, 8 or 12 (s)
let splits: number[] = []; // this solve's phase ends (ms from its start), with Opciones: Fases

// Opciones, Cronómetro (remembered): how long to hold before it's green, what the running clock shows, phases per solve
// (each tap but the last ends one, as csTimer's multi-phase), and times typed from another timer instead of this clock
const HOLD_KEY = 'cube-hold', PRECISION_KEY = 'cube-precision', PHASES_KEY = 'cube-phases', TYPING_KEY = 'cube-typing';
const PHASES = [1, 2, 3, 4];
let holdMs = setting<number>(HOLD_KEY, HOLD_MS, (v) => HOLDS.includes(v));
let precision = setting<string>(PRECISION_KEY, 'cs', (v) => (PRECISIONS as readonly string[]).includes(v)) as Precision;
let phases = setting<number>(PHASES_KEY, 1, (v) => PHASES.includes(v));
let typing = setting<boolean>(TYPING_KEY, false);
/** A select of the options sheet: its choices, the stored one picked, and what a change does. */
function option<T extends string | number>(id: string, values: readonly T[], label: (v: T) => string, value: T, change: (v: T) => void) {
  const select = $(id) as HTMLSelectElement;
  select.replaceChildren(...values.map((v) => new Option(label(v), String(v), false, v === value)));
  select.onchange = () => change(values.find((v) => String(v) === select.value)!);
}
const secondsText = (ms: number) => `${(ms / 1000).toLocaleString(document.documentElement.lang)} s`;
option('opt-hold', HOLDS, (v) => (v ? secondsText(v) + (v === HOLD_MS ? ` (${t('opts.stackmat')})` : '') : t('opts.holdNone')), holdMs, (v) => save(HOLD_KEY, (holdMs = v)));
option('opt-precision', PRECISIONS, (v) => t(`opts.precision.${v}`), precision, (v) => save(PRECISION_KEY, (precision = v)));
option('opt-phases', PHASES, (v) => (v === 1 ? t('opts.phasesOne') : String(v)), phases, (v) => save(PHASES_KEY, (phases = v)));
option('opt-entry', ['timer', 'typed'] as const, (v) => t(`opts.entry.${v}`), typing ? 'typed' : 'timer', (v) => {
  save(TYPING_KEY, (typing = v === 'typed'));
  $('typed-status').textContent = '';
  renderTimer();
});

// The event picker (the times of each: times-view.ts): the WCA events and the 3x3 trainings
const pickValue = () => (train ? `train:${train}` : event);
const eventSelect = $<HTMLSelectElement>('event');
eventSelect.append(
  ...EVENTS.map((e) => new Option(t(`event.${e}`), e, false, e === pickValue())),
  el('optgroup', { label: t('train.group') }, ...TRAINS.map((k) => new Option(t(`train.${k}`), `train:${k}`, false, `train:${k}` === pickValue()))),
  Object.assign(new Option(t('event.missing')), { disabled: true }),
);
eventSelect.onchange = () => {
  eventSelect.blur(); // keys must reach the timer, not the picker
  if (timing()) return void (eventSelect.value = pickValue()); // not mid-attempt
  chooseEvent(eventSelect.value);
  void newScramble();
};
/** The picker's choice (an event, or 'train:<id>'): its times, puzzle and remembered choice; the caller makes the scramble. */
function chooseEvent(v: string) {
  eventSelect.value = v;
  const tr = v.startsWith('train:') ? (v.slice(6) as TrainId) : null;
  setEvent(tr ? '333' : (v as EventId), tr);
  setNet(''); // the old scramble may not be valid on the new puzzle
  setNetPuzzle(wcaEvents[event].puzzleID);
  render3d();
}

let scrambleId = 0;

let solveFrom = -1; // this solve's first move in `moves`; -1: no cube
let solveTimes: number[] = []; // ms from solveStart of each of those moves (the solve analysis, analysis-view.ts)
// What Jugar on Retos needs of the Resolver (challenges-view.ts): no challenge during a round, nor once an attempt
// started; playing one makes the event 3x3 and the challenge's scramble the next one
export const resolver: Resolver = {
  inRound: () => !!round,
  busy: () => !!round || timing(),
  play() {
    if (event !== '333' || train) chooseEvent('333');
    if (mod === 'solve') void newScramble();
    else navigate('/'); // the Resolver makes it its scramble (setModule)
  },
};

async function newScramble() {
  finishIfDone(); // the last attempt was already timed
  const id = ++scrambleId;
  scrambleText = '';
  const fixedChallenge = challenges.takeNext();
  const fixed = fixedChallenge?.scramble ?? '';
  guide.stop();
  stopInspection(); // e.g. N during inspection: no call may still be spoken
  const cube = !!conn && is333(event); // the smart cube only plays 3x3 events
  phase = cube && pattern ? 'scramble' : 'ready'; // without a cube it's a plain timer: ready right away
  $('scramble-text').textContent = t('solve.generating');
  $('scramble-text').classList.remove('long');
  setNet('');
  render();
  // WCA scrambles (cubing.js, per event). With the cube, a 3x3 one is made from its target state, which the guide needs:
  // a uniformly random state written as a sequence from solved, like cubing's own "333" (blindfolded: without the
  // random orientation at the end, which the cube couldn't follow).
  let target = cube ? (fixed ? (await cube3x3x3.kpuzzle()).defaultPattern().applyAlg(fixed) : await random333Pattern()) : null;
  if (train && !fixed) { // a training's state, found the same way (with the cube, the guide walks there)
    const [m, kpuzzle] = await Promise.all([import('./training.ts'), cube3x3x3.kpuzzle()]);
    target = m.trainingPattern(kpuzzle, train, m.trainCases(train))?.pattern ?? null;
    if (!target) { // Mis casos, before any: where they come from
      if (id === scrambleId) $('scramble-text').replaceChildren(el('span', { className: 'hint' }, t('train.mineEmpty') + ' ', el('a', { href: '/academia', textContent: t('menu.academy') })));
      return;
    }
  }
  const alg = fixed || (target ? (await experimentalSolve3x3x3IgnoringCenters(target)).invert() : await randomScrambleForEvent(event));
  const scramble = alg.toString().replace(/2'/g, '2'); // half turns have no direction in WCA notation
  if (id !== scrambleId) return; // superseded by a newer scramble
  scrambleText = scramble;
  challenges.showing(fixedChallenge);
  // 3x3: tappable moves (white up, green front, as WCA scrambles); other puzzles: text. Big ones (6x6, 7x7, Megaminx…)
  // get smaller, scrollable text, keeping Megaminx's lines.
  $('scramble-text').replaceChildren(is333(event) ? algView(scramble, { frame: 'white-up' }) : scramble);
  $('scramble-text').classList.toggle('long', scramble.length > 80);
  $('scramble-note').replaceWith(Object.assign(scrambleNote('D'), { id: 'scramble-note' })); // WCA: white up, green front
  setNet(scramble);
  if (!conn && has3d(event)) setAlg(scramble); // no cube: the 3D model shows the scrambled state too (3x3 or 2x2)
  else if (phase === 'scramble') await startGuide(target); // walk the real cube there from wherever it is
  render();
  idle(load3d); // the scramble is up: now the net and the 3D cube
}

function startInspection() {
  if (phase !== 'ready' || !scrambleText || typing) return; // still generating; typed times have no clock
  phase = 'inspect';
  inspectStart = performance.now();
  called = 0;
  $('stage-call').textContent = '';
  if (callsVoice) speechSynthesis.speak(new SpeechSynthesisUtterance('')); // iOS only lets a page speak once it did so in a gesture
  renderTimer();
}

/** Leaves inspection without solving (Esc, N, another screen); its calls stop too. */
function stopInspection() {
  if (phase !== 'inspect') return;
  phase = 'ready';
  holdStart = 0;
  if (canSpeak) speechSynthesis.cancel();
  renderTimer();
}

/** `at`: when the hand let go (the event's time), not when this runs: a phone can run it later (a busy main thread, a
 *  speech engine starting up on its first cancel), and the solve would lose that much. */
function startSolve(at = performance.now()) {
  if ((phase !== 'ready' && phase !== 'inspect') || typing) return;
  penalty = phase === 'inspect' && hasInspection(event) ? inspectionPenalty(at - inspectStart) : 0;
  holdStart = 0;
  if (canSpeak) speechSynthesis.cancel(); // a late call mustn't talk over the solve
  phase = 'solving';
  solveStart = at;
  solveFrom = conn ? moves.length : -1;
  solveTimes = [];
  splits = [];
  renderTimer();
}

/** A tap (or Space) while solving: the end of a phase (Opciones: Fases), the last one stops the clock. */
function lap(at: number) {
  if (splits.length < phases - 1) {
    splits.push(recordTime(at - solveStart));
    renderTimer();
  } else stopSolve(at);
}

/** A new solve of the list shown, with the scramble shown: kept, counted in the round, sent to its challenge. */
function record(time: Pick<Result, 'ms' | 'penalty'> & Partial<Result>, log: CubeLog | null): Result {
  const solve: Result = { ...time, at: Date.now(), ...(scrambleText && { scramble: scrambleText }), ...eventField(event), ...(train && { train }), ...(session && { session }) };
  countIn(solve); // the round's (a DNF if over its time limit)
  addSolve(solve);
  challenges.solved(solve, scrambleText, log);
  return solve;
}

function stopSolve(at = performance.now()) {
  if (phase !== 'solving') return;
  const ms = recordTime(at - solveStart);
  const done = splits.filter((x) => x < ms);
  const log = conn && solveFrom >= 0 && moves.length > solveFrom ? { moves: moves.slice(solveFrom).join(' '), times: solveTimes.map(Math.round) } : null;
  const solve = record({ ms, penalty, ...(done.length && { splits: done }) }, log);
  // With the smart cube, a 3x3 solve that ended solved is split into CFOP's steps, once the clock has stopped
  const steps = !train && conn && solveFrom >= 0 && is333(event) && hasInspection(event) && isSolved(pattern) ? moves.slice(solveFrom) : [];
  const times = solveTimes;
  $('analysis').hidden = true;
  if (steps.length && steps.length === times.length) {
    idle(() => void import('./analysis-view.ts').then((m) => m.recordSolve(solve.at!, steps, times)).then((view) => {
      $('analysis').replaceChildren(...view);
      $('analysis').hidden = !view.length;
    }));
  }
  phase = 'done';
  renderResults(); // first: the timer shows the event's newest result
  renderTimer();
}

const armed = () => holdStart > 0 && performance.now() - holdStart >= holdMs;

// Space or a touch on the timer screen, at the event's time (when(), clamped: never ahead of the clock)
const when = (e: Event) => Math.min(e.timeStamp, performance.now());
function press(at: number) {
  pressPhase = phase;
  if (phase === 'inspect') holdStart = at; // red until the hold time, then green
  else if (phase === 'solving') lap(at);
  renderTimer();
}

function release(at: number) {
  const began = pressPhase;
  pressPhase = null;
  if (began !== phase) return; // e.g. the release of the press that stopped the clock
  if (phase === 'ready') startInspection();
  else if (phase === 'done') void newScramble();
  else if (phase === 'inspect' && armed()) startSolve(at);
  else if (phase === 'inspect') { holdStart = 0; renderTimer(); } // released on red: keep inspecting
}

function stageHint() {
  if (phase === 'inspect') {
    if (holdStart) return t(armed() ? 'timer.release' : 'timer.hold');
    return t(!hasInspection(event) ? 'event.bldHold' : conn && is333(event) ? 'timer.inspectCube' : 'timer.inspect');
  }
  if (phase === 'solving') {
    const hint = t(conn && is333(event) ? 'timer.solvingCube' : 'timer.solving');
    return phases > 1 ? `${t('timer.phase', { n: splits.length + 1, total: phases })} · ${hint}` : hint;
  }
  return t('timer.done');
}

function renderTimer() {
  const staged = mod === 'solve' && (timing() || phase === 'done');
  $('stage').hidden = !staged;
  $('stage-hint').textContent = stageHint();
  $('penalties').hidden = phase !== 'done';
  btn('stage-cancel').hidden = phase !== 'inspect';
  const last = phase === 'done' ? results[0] : undefined; // Retar: a 3x3 solve with its scramble, not a DNF nor a training's
  btn('duel-share').hidden = !(last?.scramble && eventOf(last) === '333' && !last.train && last.penalty !== 'DNF'); // the link plays it as 3x3
  btn('stage-challenges').hidden = !challenges.isChallengeSolve(last); // a challenge's: sent (and ranked) on Retos
  if (phase !== 'done') $('duel-status').textContent = '';
  renderRound();
  $('stage-call').hidden = phase !== 'inspect';
  $('timer-hint').textContent = t(phase === 'scramble' ? 'solve.applyScramble' : typing ? 'typed.hint' : hasInspection(event) ? 'solve.spaceToInspect' : 'event.spaceToStart');
  $('timer-hint').classList.toggle('keys', phase !== 'scramble' && !typing); // a key to press: hidden on touch screens
  btn('start').disabled = phase !== 'ready' || !scrambleText;
  btn('net').disabled = !scrambleText;
  btn('start').hidden = typing;
  $('typed').hidden = !typing;
  $('scramble-text').hidden = !!guide.guide; // with a cube the guide shows the moves to do
  $('scramble-note').hidden = !!guide.guide || !scrambleText || !/^\d/.test(event); // cubes (NxN) only: Pyraminx, Megaminx… hold otherwise
  if (phase === 'solving') $('big').className = 'big';
  if (phase === 'done') {
    showTime($('big'), formatResult(results[0]));
    $('big').className = 'big';
    document.querySelectorAll<HTMLButtonElement>('[data-pen]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pen === String(results[0].penalty))));
  }
}

// The judge's 8 s / 12 s calls: shown big for a moment (optional) and spoken (optional, where the browser can)
const CALL_MS = 900;
const CALLS_KEY = 'cube-calls';
const VOICE_KEY = 'cube-calls-voice';
const canSpeak = typeof speechSynthesis !== 'undefined';
let callsVisual = setting<boolean>(CALLS_KEY, true);
let callsVoice = canSpeak && setting<boolean>(VOICE_KEY, false);
const callsBox = $('calls-visual') as HTMLInputElement;
const voiceBox = $('calls-voice') as HTMLInputElement;
callsBox.checked = callsVisual;
voiceBox.checked = callsVoice;
voiceBox.closest('label')!.hidden = !canSpeak;
const renderCalls = () => ($('stage-call').className = callsVisual ? 'stage-hint' : 'sr-only'); // screen readers hear it either way
renderCalls();
callsBox.onchange = () => (save(CALLS_KEY, (callsVisual = callsBox.checked)), renderCalls());
voiceBox.onchange = () => save(VOICE_KEY, (callsVoice = voiceBox.checked));
// After a click the box keeps focus and the next Space would toggle it instead of starting the timer
// (detail is 0 for a keyboard toggle, which keeps its focus).
callsBox.onclick = voiceBox.onclick = (e) => e.detail && (e.currentTarget as HTMLElement).blur();

function announce(call: number) {
  const words = t(call === 8 ? 'timer.call8' : 'timer.call12');
  $('stage-call').textContent = words; // under the countdown (or only for screen readers)
  if (!callsVoice) return;
  const u = new SpeechSynthesisUtterance(words);
  u.lang = document.documentElement.lang;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function tick() {
  const now = performance.now();
  if (phase === 'inspect') {
    const elapsed = now - inspectStart;
    const left = INSPECTION_MS - elapsed;
    const timed = hasInspection(event); // blindfolded: no countdown, just the hold to start
    const call = timed ? inspectionCall(elapsed) : 0;
    if (call > called) announce((called = call));
    const flash = callsVisual && call && elapsed - call * 1000 < CALL_MS;
    showTime($('big'), !timed ? formatTime(0) : left > 0 ? String(Math.ceil(left / 1000)) : inspectionPenalty(elapsed) === 'DNF' ? 'DNF' : '+2');
    // hold: red -> green; otherwise the judge's 8 s / 12 s calls
    $('big').className = `big ${holdStart ? (armed() ? 'go' : 'hold') : call === 12 ? 'late' : call === 8 ? 'warn' : ''}${flash ? ' call' : ''}`;
    if (holdStart) $('stage-hint').textContent = stageHint();
  } else if (phase === 'solving') {
    showTime($('big'), formatRunning(now - solveStart, precision));
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

$('start').onclick = startInspection;
$('new-scramble').onclick = () => void newScramble();
$('stage-cancel').onclick = stopInspection;

/** A solve's penalty (the stage's buttons, a time's sheet, Ctrl+1/2/3). */
function setPenalty(r: Result, p: Penalty) {
  if (!r.ms && p !== 'DNF') return; // a DNF typed without its time has none to count
  r.penalty = p;
  renderTimer();
  renderResults();
}
/** Drops a solve (Eliminar on the stage or on its sheet, Ctrl+Z): from the round too, where that attempt is made
 *  again; the stage's latest also moves on to a new scramble (e.g. a false start). */
function removeSolve(r: Result) {
  const latest = r === results[0] && phase === 'done';
  leaveOut(r);
  dropSolve(r);
  if (latest) void newScramble();
}
document.querySelectorAll<HTMLButtonElement>('[data-pen]').forEach((b) => (b.onclick = () => {
  if (results[0]) setPenalty(results[0], b.dataset.pen === 'DNF' ? 'DNF' : (Number(b.dataset.pen) as Penalty));
}));

// Typed times (Opciones: Entrada): another timer's, with this scramble
$('typed').onsubmit = (e) => {
  e.preventDefault();
  const input = $('typed-time') as HTMLInputElement;
  const time = parseTime(input.value);
  if (!time || !scrambleText || phase !== 'ready') return void ($('typed-status').textContent = t(!time ? 'typed.invalid' : phase === 'scramble' ? 'solve.applyScramble' : 'solve.generating'));
  $('typed-status').textContent = '';
  input.value = '';
  record(time, null);
  renderResults();
  void newScramble();
};
// Retar (the stage, after a 3x3 solve): a link with its scramble and time (duel.ts)
$('duel-share').onclick = () => {
  const r = results[0];
  if (r?.scramble && r.penalty !== 'DNF') void duel.shareDuel({ scramble: r.scramble, ms: r.ms, penalty: r.penalty }, (s) => ($('duel-status').textContent = s));
};
$('delete-last').onclick = () => results[0] && removeSolve(results[0]);
$('stage-challenges').onclick = () => navigate('/retos'); // the challenge's card: send it, see the ranking
// the 2D net, big, with its scramble: a second player, made on the first tap
let netBig: TwistyPlayer | undefined;
$('net').onclick = async () => {
  if (!scrambleText) return;
  const { TwistyPlayer } = await import('cubing/twisty');
  netBig ??= $('net-big').appendChild(new TwistyPlayer({ visualization: '2D', background: 'none', controlPanel: 'none', experimentalDragInput: 'none', hintFacelets: 'none' }));
  netBig.puzzle = wcaEvents[event].puzzleID;
  netBig.experimentalSetupAlg = netState();
  $('net-scramble').replaceChildren(is333(event) ? algView(scrambleText, { frame: 'white-up' }) : scrambleText);
  ($('net-dialog') as HTMLDialogElement).showModal();
};
$('opts-open').onclick = () => { $('import-status').textContent = ''; ($('solve-opts') as HTMLDialogElement).showModal(); }; // inspection calls, voice, round settings
$('stage').addEventListener('pointerdown', (e) => {
  if ((e.target as Element).closest('button')) return;
  e.preventDefault();
  press(when(e));
});
$('stage').addEventListener('pointerup', (e) => !(e.target as Element).closest('button') && release(when(e)));

// Not while a dialog is open, nor from a checkbox (Space toggles it)
const timerKeys = (e: KeyboardEvent) => mod === 'solve' && !document.querySelector('dialog[open]') && !(e.target as Element).closest?.('input, select');
// The last solve's penalty and Eliminar (as csTimer): Ctrl (or Alt: some browsers keep Ctrl+digit for their tabs) +1 OK,
// +2 +2, +3 DNF; +Z Eliminar, only for the solve just timed (the stage's, as its button: not an older time by an undo
// reflex). The same as the stage's buttons and the time's sheet.
const PEN_KEYS: Record<string, Penalty> = { Digit1: 0, Digit2: 2000, Digit3: 'DNF', Numpad1: 0, Numpad2: 2000, Numpad3: 'DNF' };
addEventListener('keydown', (e) => {
  if (!timerKeys(e) || e.repeat || !results[0] || timing() || e.shiftKey) return;
  if ((e.ctrlKey || e.altKey) && !e.metaKey && e.code in PEN_KEYS) {
    e.preventDefault();
    setPenalty(results[0], PEN_KEYS[e.code]);
  } else if ((e.ctrlKey || e.altKey) && !e.metaKey && e.code === 'KeyZ' && phase === 'done') {
    e.preventDefault();
    removeSolve(results[0]);
  }
});
addEventListener('keydown', (e) => {
  if (!timerKeys(e) || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.code === 'Space') {
    e.preventDefault(); // also keeps Space from clicking a focused button
    if (!e.repeat) press(when(e));
  } else if (e.repeat) {
    return;
  } else if (e.key === 'Escape') {
    stopInspection();
  } else if (e.key.toLowerCase() === 'n' && phase !== 'solving') {
    void newScramble();
  }
});
addEventListener('keyup', (e) => {
  if (!timerKeys(e) || e.code !== 'Space') return;
  e.preventDefault();
  release(when(e));
});


// The Resolver's side of the times, the round and the smart cube
times.useResolver({ busy: timing, changed: () => { renderRoundList(); challenges.renderCards(); }, penalty: setPenalty, remove: removeSolve });
rounds.useResolver({ phase: () => phase, newScramble: () => void newScramble(), renderTimer });
cube.useResolver({
  busy: timing,
  turning() { if (mod === 'solve' && is333(event) && hasInspection(event)) startSolve(); }, // blindfolded: Space did, before memorising
  turned(at) {
    // the solve analysis's and a challenge's log (cheap: the clock never waits); never back in time: a GAN cube's
    // recovered moves are timed when they arrive, after the live move that revealed them
    if (phase === 'solving' && solveFrom >= 0) solveTimes.push(Math.max(at - solveStart, solveTimes.at(-1) ?? -Infinity));
    if (mod === 'solve' && phase === 'solving' && is333(event) && isSolved(pattern)) stopSolve();
  },
  synced() { if (mod === 'solve' && phase === 'ready' && is333(event)) challenges.keep(), void newScramble(); },
  lost() { if (mod === 'solve' && phase === 'scramble') challenges.keep(), void newScramble(); },
  scrambled() { if (mod === 'solve' && phase === 'scramble') phase = 'ready'; },
  render: renderTimer,
});
renderResults();

/** Leaving the Resolver (another screen): an inspection under way stops, calls and all. */
export const leave = stopInspection;
/** Back on the Resolver: a challenge's scramble if Jugar brought one (challenges-view.ts), or the one left unplayed. */
export const show = () => (challenges.keep(), void newScramble());

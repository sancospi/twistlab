import { TwistyPlayer } from 'cubing/twisty';
import { experimentalSolve3x3x3IgnoringCenters, random333Pattern } from 'cubing/search';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import { Euler, Quaternion, Vector3, type Scene } from 'three';
import { connectGanCube, type GanCubeConnection, type GanCubeEvent, type MacAddressProvider } from 'gan-web-bluetooth';
import { faceletsToPattern, patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
// Emits cubing.js's solver worker as a self-contained bundle where cubing.js looks for it (see vite.config.ts)
import searchWorkerUrl from '../node_modules/cubing/dist/lib/cubing/chunks/search-worker-entry.js?worker&url';
import { describe, nextStep, PathGuide, toView } from './guide.ts';
import { trustFirstMove } from './gan-fix.ts';
import { average, formatAverage, formatResult, formatTime, HOLD_MS, INSPECTION_MS, inspectionPenalty, recordTime, resultValue, type Penalty, type Result } from './timer.ts';
import { t, type MessageKey } from './i18n.ts';
import { algView } from './notation-view.ts';
import { cube as academyCube } from './academy/link.ts';
import { showAcademy } from './academy/view.ts';
import { startRouter, type Route } from './router.ts';
// (static markup is already translated: src/boot.ts does it before loading this module)

const $ = (id: string) => document.getElementById(id)!;

// Fetch the solver worker early so the first scramble is quicker (this use also keeps the worker in the build)
document.head.append(Object.assign(document.createElement('link'), { rel: 'prefetch', href: searchWorkerUrl }));
const btn = (id: string) => $(id) as HTMLButtonElement;

const player = new TwistyPlayer({
  puzzle: '3x3x3',
  visualization: 'PG3D',
  alg: '',
  experimentalSetupAnchor: 'start',
  background: 'none',
  controlPanel: 'none',
  hintFacelets: 'none',
  experimentalDragInput: 'none',
  cameraLatitude: 0,
  cameraLongitude: 0,
  cameraLatitudeLimit: 0,
  tempoScale: 5,
});
$('cube').append(player);

// cubing.js animates each live move linearly (catchUpMs / tempoScale = 100ms), which looks choppy.
// Swap its catch-up frame callback for an ease-out one: snappier start, smooth landing.
// ponytail: patches cubing.js internals (CatchUpHelper); re-check after upgrading cubing.
const MOVE_MS = 160; // ~95% of the turn done by 100ms
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const catchUp = (player as any).controller.animationController.catchUpHelper;
catchUp.scheduler.callback = (now: number) => {
  catchUp.scheduler.requestAnimFrame();
  const dt = (now - catchUp.lastTimestamp) / MOVE_MS;
  catchUp.lastTimestamp = now;
  catchUp.model.catchUpMove.set((async () => {
    const prev = await catchUp.model.catchUpMove.get();
    if (prev.move === null) return prev;
    const t = 1 - Math.cbrt(1 - prev.amount) + dt; // un-ease current amount, advance linearly
    if (t >= 1) {
      catchUp.stop();
      catchUp.model.timestampRequest.set('end');
      return { move: null, amount: 0 };
    }
    return { move: prev.move, amount: easeOut(t) };
  })());
};

// --- Orientation: scene = 3/4 camera tilt * user's view (arrows) * gyro (cubes with IMU) ---
const deg = Math.PI / 180;
const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const TILT = new Quaternion().setFromEuler(new Euler(30 * deg, -30 * deg, 0)); // top and right faces visible
const DEFAULT_VIEW = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 180 * deg); // z2: yellow up, green front, orange right
const WCA_VIEW = new Quaternion(); // competition orientation: white up, green front

// Modules: 'solve' = competition attempt (WCA notation, never translated); 'cube' = the cube's options and guided tools, in the viewer's frame;
// 'academy' = learn a method's algorithms (same frame as the guide)
type Mod = 'solve' | 'cube' | 'academy';
let mod: Mod = 'solve';
const homeView = () => (mod === 'solve' ? WCA_VIEW : DEFAULT_VIEW);
const label = (m: string) => (mod === 'solve' ? m : toView(m, view));
const view = homeView().clone();
const gyro = new Quaternion(); // rotation since last gyro calibration; identity on cubes without gyro
const target = new Quaternion();
const updateTarget = () => target.copy(TILT).multiply(view).multiply(gyro);
updateTarget();
let basis: Quaternion | null = null;

let vantage: { render(): unknown; scene: { scene(): Promise<unknown> } | null } | undefined; // Twisty3DVantage isn't exported
let scene: Scene | undefined;

async function frame() {
  // vantage/scene only exist once the player has rendered, so keep trying
  vantage ??= [...(await player.experimentalCurrentVantages())][0];
  scene ??= (await vantage?.scene?.scene()) as Scene | undefined;
  if (scene) {
    scene.quaternion.slerp(target, 0.25); // ponytail: fixed smoothing factor, tune if it feels laggy
    vantage!.render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function onGyro({ x, y, z, w }: { x: number; y: number; z: number; w: number }) {
  // GAN: +X red, +Y blue, +Z white -> three.js: +Y up
  const q = new Quaternion(x, z, -y, w).normalize();
  basis ??= q.clone().conjugate();
  gyro.copy(q.premultiply(basis));
  updateTarget();
}

// Arrows rotate the view in 90° steps around the displayed vertical / horizontal axes
const TURNS: Record<string, [Vector3, number]> = { left: [Y, -90], right: [Y, 90], up: [X, -90], down: [X, 90] };
function turnView(dir: string) {
  if (dir === 'reset') view.copy(homeView());
  else view.premultiply(new Quaternion().setFromAxisAngle(TURNS[dir][0], TURNS[dir][1] * deg));
  updateTarget();
  render(); // move names depend on the view
}
document.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach((b) => (b.onclick = () => turnView(b.dataset.turn!)));
addEventListener('keydown', (e) => {
  // arrows belong to an open dialog or to the focused control (radio groups, selects…)
  if (document.querySelector('dialog[open]') || (e.target as Element).closest?.('input, select, textarea')) return;
  const dir = e.key.startsWith('Arrow') && e.key.slice(5).toLowerCase();
  if (dir && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); turnView(dir); }
});

// --- State: mirror every move, detect solved ---
let pattern: KPattern | null = null;
let moves: string[] = []; // cube frame; shown in the viewer's frame

const isSolved = (p: KPattern | null) => !!p?.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });

function render() {
  const solved = isSolved(pattern);
  if (guide.reached()) {
    mixed = !!guide.goal; // reached the guide's target
    guide.stop();
    if (mixed && mod === 'solve' && phase === 'scramble') phase = 'ready';
  }
  $('status').textContent = t(solved ? 'cube.solved' : mixed ? 'cube.mixed' : conn ? 'cube.connected' : 'cube.noCube');
  $('status').classList.toggle('solved', solved || mixed);
  $('moves').textContent = moves.slice(-40).map(label).join(' ');
  renderGuide();
  renderTimer();
}

// --- Guide: walk the cube to a target state (solved, or a random scramble), step by step (see PathGuide).
const guide = new PathGuide(() => pattern, () => render());
let mixed = false;

function startGuide(target: KPattern | null | Promise<KPattern | null>) {
  mixed = false;
  return guide.start(target);
}

function renderGuide() {
  const g = guide.guide;
  $('guide').hidden = !g;
  $('guide-actions').hidden = !!g;
  btn('guide-start').disabled = !conn || !pattern || isSolved(pattern);
  btn('scramble-start').disabled = !conn || !pattern;
  if (!g) return;
  const next = nextStep(g);
  const shown = next && label(next);
  $('guide-title').textContent = t(guide.goal ? 'guide.titleScramble' : 'guide.titleSolve');
  $('guide-progress').textContent = next ? t('guide.progress', { n: guide.total - g.steps.length + 1, total: guide.total }) : '';
  $('guide-next').textContent = shown ?? '…';
  const desc = shown && describe(shown);
  $('guide-desc').textContent = !desc ? t('guide.planning') : g.half ? t('guide.secondHalf', { desc }) : desc;
  $('guide-steps').replaceChildren(algView(g.steps.map(label), { frame: mod === 'solve' ? 'white-up' : 'yellow-up', mark: (i) => (i === 0 ? 'current' : '') }));
}

$('guide-start').onclick = () => void startGuide(null);
$('scramble-start').onclick = () => void startGuide(random333Pattern()); // random state, like WCA scrambles
$('guide-stop').onclick = () => {
  guide.stop();
  if (mod === 'solve' && phase === 'scramble') phase = 'ready'; // scrambling by hand instead
  render();
};

let lastMoveAt = 0;

// The cube sends its full state on connect and then about once per second. Use it as the source of
// truth: sync on connect, and re-sync if the mirrored state drifted (lost or phantom moves).
async function onFacelets(facelets: string) {
  if (pattern && (performance.now() - lastMoveAt < 1000 || patternToFacelets(pattern) === facelets)) return;
  const movedAt = lastMoveAt;
  const p = await faceletsToPattern(facelets);
  const alg = facelets === SOLVED_FACELETS ? '' : (await experimentalSolve3x3x3IgnoringCenters(p)).invert();
  if (lastMoveAt !== movedAt) return; // a move arrived while solving; the next state event retries
  player.alg = alg;
  const firstSync = !pattern;
  pattern = p;
  if (firstSync && mod === 'solve' && phase === 'ready') void newScramble(); // now it can be guided on the cube
  if (conn) saveMac(conn.deviceName, conn.deviceMAC); // valid state decoded => the MAC is right
  render();
  void guide.replan(); // state was corrected: the old plan no longer applies
  if (mod === 'academy') academyCube.listener?.sync();
}

function onMove(move: string) {
  lastMoveAt = performance.now();
  if (mod === 'solve') startSolve(); // first turn after the scramble starts the clock
  mixed = false;
  player.experimentalAddMove(move, { cancel: false });
  pattern = pattern?.applyMove(move) ?? null;
  moves.push(move);
  guide.onMove(move);
  if (mod === 'academy') academyCube.listener?.move(move);
  if (mod === 'solve' && phase === 'solving' && isSolved(pattern)) stopSolve();
  render();
}

academyCube.pattern = () => (conn ? pattern : null); // only a connected cube can be practised on
academyCube.label = label;

// --- Connection ---
let conn: GanCubeConnection | null = null;
let liveMoveSeen = false;

// The MAC salts the encryption key. Chrome rarely exposes it, so ask once and remember it per cube.
const macKey = (name: string) => `cube-mac:${name}`;
const loadMac = (name: string) => { try { return localStorage.getItem(macKey(name)); } catch { return null; } };
const saveMac = (name: string, mac: string) => { try { localStorage.setItem(macKey(name), mac); } catch {} };
const forgetMac = (name: string) => { try { localStorage.removeItem(macKey(name)); } catch {} };

const macProvider: MacAddressProvider = async (device, isFallback) => {
  const saved = loadMac(device.name ?? '');
  if (saved) return saved;
  if (!isFallback && typeof device.watchAdvertisements === 'function') return null; // library reads it from the advertisement
  // GAN names end with the MAC's last two bytes, e.g. GANic4_8CA7 -> ..:8C:A7
  const tail = device.name?.match(/_([0-9A-F]{2})([0-9A-F]{2})$/i);
  const input = prompt(
    t('cube.macPrompt', { name: device.name ?? '' }) + (tail ? '\n' + t('cube.macTail', { tail: `${tail[1]}:${tail[2]}` }) : ''),
    tail ? `XX:XX:XX:XX:${tail[1]}:${tail[2]}`.toUpperCase() : '',
  );
  if (input === null) return null;
  const mac = input.trim().toUpperCase().replace(/-/g, ':');
  if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) throw new Error(t('cube.macInvalid'));
  return mac;
};

function handle(e: GanCubeEvent) {
  switch (e.type) {
    case 'GYRO': return onGyro(e.quaternion);
    case 'MOVE':
      // Recovered moves (no local timestamp) before the first live one are pre-connection history the
      // library replays because some firmwares (GANic4 1.0) report serial 0 in state events.
      // They're already part of the synced state, so applying them would double them.
      if (e.localTimestamp === null && !liveMoveSeen) return;
      liveMoveSeen ||= e.localTimestamp !== null;
      return onMove(e.move);
    case 'FACELETS': return void onFacelets(e.facelets).catch(() => {});
    case 'BATTERY': $('battery').textContent = `${e.batteryLevel}%`; return;
    case 'HARDWARE': $('device').textContent = [e.hardwareName, e.softwareVersion].filter(Boolean).join(' · '); return;
    case 'DISCONNECT': return disconnected();
  }
}

function disconnected() {
  conn = null;
  pattern = null;
  moves = [];
  guide.stop();
  mixed = false;
  liveMoveSeen = false;
  academyCube.listener?.sync(); // an open practice falls back to its static view
  player.alg = '';
  $('status').textContent = t('cube.disconnected');
  $('status').classList.remove('solved');
  $('moves').textContent = '';
  $('connect').textContent = t('cube.connect');
  btn('reset-gyro').disabled = btn('reset-state').disabled = true;
  if (mod === 'solve' && phase === 'scramble') void newScramble();
}

$('connect').onclick = async () => {
  if (conn) return conn.disconnect();
  if (!navigator.bluetooth) {
    $('status').textContent = t('cube.noBluetooth');
    return;
  }
  try {
    $('status').textContent = t('cube.connecting');
    const c = (conn = await connectGanCube(macProvider));
    trustFirstMove((c as unknown as { driver: unknown }).driver);
    c.events$.subscribe(handle);
    $('device').textContent = `${c.deviceName} (${c.deviceMAC})`;
    $('connect').textContent = t('cube.disconnect');
    btn('reset-gyro').disabled = btn('reset-state').disabled = false;
    $('status').textContent = t('cube.connected');
    for (const type of ['REQUEST_HARDWARE', 'REQUEST_FACELETS', 'REQUEST_BATTERY'] as const) {
      await c.sendCubeCommand({ type });
    }
    // A wrong MAC decrypts to garbage and the library stays silent: no valid state => wrong MAC.
    setTimeout(async () => {
      if (conn !== c || pattern) return;
      forgetMac(c.deviceName);
      await c.disconnect();
      $('status').textContent = t('cube.badMac');
    }, 5000);
  } catch (err) {
    conn = null;
    $('status').textContent = t('cube.error', { message: (err as Error).message });
  }
};

$('reset-gyro').onclick = () => (basis = null);

// --- Solve module: a WCA-style attempt (Regulations A3/A4, Stackmat behaviour).
// Scramble -> Space: 15 s inspection -> hold Space (red) until green -> release starts the solve (or the
// cube's first turn) -> Space or the cube being solved stops it -> judge penalty -> Space: next scramble.
type Phase = 'scramble' | 'ready' | 'inspect' | 'solving' | 'done';
let phase: Phase = 'ready';
let inspectStart = 0;
let solveStart = 0;
let holdStart = 0; // > 0 while Space / the screen is held during inspection
let pressPhase: Phase | null = null; // phase the current press began in; its release only acts there
let penalty: Penalty = 0;

// Times persist in this browser; anything malformed in storage is dropped
const RESULTS_KEY = 'cube-results';
const results: Result[] = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(RESULTS_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((r) => Number.isFinite(r?.ms) && [0, 2000, 'DNF'].includes(r?.penalty)) : [];
  } catch {
    return [];
  }
})();
const saveResults = () => {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch {}
};

// 2D net of the scrambled state (WCA scramble-sheet style: white up, green front)
const net = new TwistyPlayer({ puzzle: '3x3x3', visualization: '2D', background: 'none', controlPanel: 'none', experimentalDragInput: 'none', hintFacelets: 'none' });
$('net').append(net);
let scrambleId = 0;

async function newScramble() {
  const id = ++scrambleId;
  guide.stop();
  phase = conn && pattern ? 'scramble' : 'ready'; // without a cube it's a plain timer: ready right away
  $('scramble-text').textContent = t('solve.generating');
  net.experimentalSetupAlg = '';
  render();
  // Like WCA scrambles: a uniformly random state, written as a sequence from solved
  const target = await random333Pattern();
  const scramble = (await experimentalSolve3x3x3IgnoringCenters(target)).invert().toString().replace(/2'/g, '2'); // half turns have no direction in WCA notation
  if (id !== scrambleId) return; // superseded by a newer scramble
  $('scramble-text').replaceChildren(algView(scramble, { frame: 'white-up' })); // WCA scrambles: white up, green front
  net.experimentalSetupAlg = scramble;
  if (!conn) player.alg = scramble; // no cube: the 3D model shows the scrambled state too
  else if (phase === 'scramble') await startGuide(target); // walk the real cube there from wherever it is
  render();
}

function startInspection() {
  if (phase !== 'ready') return;
  phase = 'inspect';
  inspectStart = performance.now();
  renderTimer();
}

function startSolve() {
  if (phase !== 'ready' && phase !== 'inspect') return;
  penalty = phase === 'inspect' ? inspectionPenalty(performance.now() - inspectStart) : 0;
  holdStart = 0;
  phase = 'solving';
  solveStart = performance.now();
  renderTimer();
}

function stopSolve() {
  if (phase !== 'solving') return;
  results.unshift({ ms: recordTime(performance.now() - solveStart), penalty });
  phase = 'done';
  renderTimer();
}

const armed = () => holdStart > 0 && performance.now() - holdStart >= HOLD_MS;

// Space or a touch on the timer screen
function press() {
  pressPhase = phase;
  if (phase === 'inspect') holdStart = performance.now(); // red until HOLD_MS, then green
  else if (phase === 'solving') stopSolve();
  renderTimer();
}

function release() {
  const began = pressPhase;
  pressPhase = null;
  if (began !== phase) return; // e.g. the release of the press that stopped the clock
  if (phase === 'ready') startInspection();
  else if (phase === 'done') void newScramble();
  else if (phase === 'inspect' && armed()) startSolve();
  else if (phase === 'inspect') { holdStart = 0; renderTimer(); } // released on red: keep inspecting
}

function stageHint() {
  if (phase === 'inspect') {
    if (holdStart) return t(armed() ? 'timer.release' : 'timer.hold');
    return t(conn ? 'timer.inspectCube' : 'timer.inspect');
  }
  if (phase === 'solving') return t(conn ? 'timer.solvingCube' : 'timer.solving');
  return t('timer.done');
}

function renderTimer() {
  const staged = mod === 'solve' && (phase === 'inspect' || phase === 'solving' || phase === 'done');
  $('stage').hidden = !staged;
  $('stage-hint').textContent = stageHint();
  $('penalties').hidden = phase !== 'done';
  $('timer-hint').textContent = t(phase === 'scramble' ? 'solve.applyScramble' : 'solve.spaceToInspect');
  btn('start').disabled = phase !== 'ready';
  $('scramble-text').hidden = !!guide.guide; // with a cube the guide shows the moves to do
  if (phase === 'solving') $('big').className = 'big';
  if (phase === 'done') {
    $('big').textContent = formatResult(results[0]);
    $('big').className = 'big';
    document.querySelectorAll<HTMLButtonElement>('[data-pen]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pen === String(results[0].penalty))));
  }
  const best = results.reduce<Result | null>((b, r) => (!b || resultValue(r) < resultValue(b) ? r : b), null);
  $('stats').textContent = best
    ? t('timer.stats', { best: formatResult(best), ao5: formatAverage(average(results, 5)), ao12: formatAverage(average(results, 12)) })
    : '';
  saveResults(); // every change to `results` is followed by a render
  $('reset-results').hidden = !results.length;
  $('results').replaceChildren(...results.map((r, i) => {
    const del = Object.assign(document.createElement('button'), { className: 'del', textContent: '×', title: t('results.delete') });
    del.setAttribute('aria-label', t('results.deleteOne', { time: formatResult(r) }));
    del.onclick = () => {
      results.splice(i, 1);
      renderTimer();
    };
    const li = document.createElement('li');
    li.append(formatResult(r), del);
    return li;
  }));
}

function tick() {
  const now = performance.now();
  if (phase === 'inspect') {
    const elapsed = now - inspectStart;
    const left = INSPECTION_MS - elapsed;
    $('big').textContent = left > 0 ? String(Math.ceil(left / 1000)) : inspectionPenalty(elapsed) === 'DNF' ? 'DNF' : '+2';
    // hold: red -> green; otherwise the judge's 8 s / 12 s calls
    $('big').className = `big ${holdStart ? (armed() ? 'go' : 'hold') : elapsed >= 12000 ? 'late' : elapsed >= 8000 ? 'warn' : ''}`;
    if (holdStart) $('stage-hint').textContent = stageHint();
  } else if (phase === 'solving') {
    $('big').textContent = formatTime(now - solveStart);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

$('start').onclick = startInspection;
$('new-scramble').onclick = () => void newScramble();
document.querySelectorAll<HTMLButtonElement>('[data-pen]').forEach((b) => (b.onclick = () => {
  results[0].penalty = b.dataset.pen === 'DNF' ? 'DNF' : (Number(b.dataset.pen) as Penalty);
  renderTimer();
}));
$('delete-last').onclick = () => {
  results.shift(); // e.g. a false start: drop the attempt and move on
  void newScramble();
};

// Clearing every time takes a second press within 3 s
let resetTimer = 0;
const resetLabel = () => ($('reset-results').textContent = t('results.deleteAll'));
$('reset-results').onclick = () => {
  if (!resetTimer) {
    $('reset-results').textContent = t('results.confirmReset');
    resetTimer = setTimeout(() => ((resetTimer = 0), resetLabel()), 3000);
    return;
  }
  clearTimeout(resetTimer);
  resetTimer = 0;
  resetLabel();
  results.length = 0;
  renderTimer();
};

$('stage').addEventListener('pointerdown', (e) => {
  if ((e.target as Element).closest('button')) return;
  e.preventDefault();
  press();
});
$('stage').addEventListener('pointerup', (e) => !(e.target as Element).closest('button') && release());

addEventListener('keydown', (e) => {
  if (mod !== 'solve' || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.code === 'Space') {
    e.preventDefault(); // also keeps Space from clicking a focused button
    if (!e.repeat) press();
  } else if (e.repeat) {
    return;
  } else if (e.key === 'Escape' && phase === 'inspect') {
    phase = 'ready';
    holdStart = 0;
    renderTimer();
  } else if (e.key.toLowerCase() === 'n' && phase !== 'solving') {
    void newScramble();
  }
});
addEventListener('keyup', (e) => {
  if (mod !== 'solve' || e.code !== 'Space') return;
  e.preventDefault();
  release();
});

// --- Menu ---
// Everything below the bar is placed from its real height (it wraps on medium widths, shrinks on phones).
new ResizeObserver(([entry]) =>
  document.documentElement.style.setProperty('--header-h', `${(entry.target as HTMLElement).offsetHeight}px`),
).observe(document.querySelector('.app-header')!);

function setModule(m: Mod) {
  if (m === mod && document.body.dataset.module === m) return; // e.g. between Academia pages: nothing to reset
  mod = m;
  guide.stop();
  mixed = false;
  view.copy(homeView());
  updateTarget();
  document.querySelectorAll<HTMLElement>('[data-mod]').forEach((a) => (a.dataset.mod === m ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.body.dataset.module = m; // the academy widens the panel
  $('header-module').textContent = t(`menu.${m}` as MessageKey); // shown next to ☰ on phones
  $('mod-solve').hidden = m !== 'solve';
  $('mod-cube').hidden = m !== 'cube';
  $('mod-academy').hidden = m !== 'academy';
  if (!conn) player.alg = ''; // the solve module's text scramble only applies there
  render();
  if (m === 'solve') void newScramble();
}
// Each screen has its URL (router.ts): the menu and the Academia tiles are plain links.
const pageTitle = (page: string) => t('app.pageTitle', { page, app: t('app.title') });
let routeId = 0;
async function onRoute(r: Route) {
  const id = ++routeId;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close()); // back/forward leaves any modal
  const menu = $('header-menu');
  if (menu.matches(':popover-open')) menu.hidePopover(); // phones: following a link closes the menu
  setModule(r.mod);
  if (r.mod !== 'academy') {
    document.title = r.mod === 'solve' ? t('app.title') : pageTitle(t('menu.cube'));
    return;
  }
  const title = await showAcademy($('mod-academy'), r.page);
  if (id !== routeId) return; // a newer route won while the puzzle was loading
  document.title = pageTitle(title);
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();
  else document.querySelector('.panel')!.scrollTop = 0; // a new page starts at the top
}
startRouter((r) => void onRoute(r));

$('reset-state').onclick = async () => {
  await conn?.sendCubeCommand({ type: 'REQUEST_RESET' });
  player.alg = '';
  pattern = (await cube3x3x3.kpuzzle()).defaultPattern();
  moves = [];
  render();
  void guide.replan(); // the state changed: the old plan no longer applies
  academyCube.listener?.sync(true);
};

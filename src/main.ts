import type { TwistyPlayer } from 'cubing/twisty';
import type { Alg } from 'cubing/alg';
import { experimentalSolve3x3x3IgnoringCenters, random333Pattern } from 'cubing/search';
import { randomScrambleForEvent } from 'cubing/scramble';
import { cube3x3x3, wcaEvents } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import type { Quaternion, Scene } from 'three';
import type { GanCubeConnection, GanCubeEvent, MacAddressProvider } from 'gan-web-bluetooth';
import { faceletsToPattern, patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
// Emits cubing.js's solver worker as a self-contained bundle where cubing.js looks for it (see vite.config.ts)
import searchWorkerUrl from '../node_modules/cubing/dist/lib/cubing/chunks/search-worker-entry.js?worker&url';
import { axisAngle, describe, mul, nextStep, PathGuide, toView, type Quat, type Vec } from './guide.ts';
import { trustFirstMove } from './gan-fix.ts';
import { average, EVENTS, eventField, eventOf, formatAverage, formatResult, formatTime, hasInspection, HOLD_MS, INSPECTION_MS, inspectionCall, inspectionPenalty, is333, isEvent, isMo3, recordTime, resultValue, type EventId, type Penalty, type Result } from './timer.ts';
import { histogramSvg, rolling, summary, trendSvg } from './stats.ts';
import { ATTEMPTS, attemptValue, parseRounds, roundFormat, roundResult, storedResult, type RoundOpts, type StoredRound } from './round.ts';
import { mergeResults, parseImport, parseStored } from './import.ts';
import { t, tp, type MessageKey } from './i18n.ts';
import { algView } from './notation-view.ts';
import { cube as academyCube } from './academy/link.ts';
import { el } from './el.ts';
import { load, save, setting } from './academy/store.ts';
import { routePath, startRouter, type Route } from './router.ts';
// (static markup is already translated: src/boot.ts does it before loading this module)
// The other screens (Academia, Progreso, Pinta tu cubo), the 3D/2D players and the smart-cube library are loaded
// when needed (dynamic import), so the Resolver shows its scramble with the least code.

const $ = (id: string) => document.getElementById(id)!;
const btn = (id: string) => $(id) as HTMLButtonElement;
/** Runs `fn` once the page is idle (Safari has no requestIdleCallback). */
const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 2000 }) : setTimeout(fn, 300));

// The big 3D cube and the scramble's 2D net (cubing/twisty + three: the heaviest code) are built after the first
// scramble is shown (loadTwisty); until then what they should show is kept here and handed over when they're built.
let player: TwistyPlayer | undefined;
let net: TwistyPlayer | undefined;
let playerAlg: Alg | string = '';
let netAlg = '';
const setAlg = (alg: Alg | string) => {
  playerAlg = alg;
  if (player) player.alg = alg;
};
const setNet = (alg: string) => {
  netAlg = alg;
  if (net) net.experimentalSetupAlg = alg;
};
let twisty: Promise<void> | undefined;
function loadTwisty(): Promise<void> {
  return (twisty ??= import('cubing/twisty').then(({ TwistyPlayer }) => {
    // 2D net of the scrambled state (WCA scramble-sheet style: white up, green front)
    net = new TwistyPlayer({ puzzle: wcaEvents[event].puzzleID, visualization: '2D', background: 'none', controlPanel: 'none', experimentalDragInput: 'none', hintFacelets: 'none', experimentalSetupAlg: netAlg });
    $('net').append(net);
    shown3d = puzzle3d();
    player = new TwistyPlayer({
      puzzle: shown3d,
      visualization: 'PG3D',
      alg: playerAlg,
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
    easeMoves(player);
    requestAnimationFrame(frame);
    // The solver worker's entry, ahead of the first solve that needs it (this use also keeps the worker in the build)
    document.head.append(Object.assign(document.createElement('link'), { rel: 'prefetch', href: searchWorkerUrl }));
  }));
}

// cubing.js animates each live move linearly (catchUpMs / tempoScale = 100ms), which looks choppy.
// Swap its catch-up frame callback for an ease-out one: snappier start, smooth landing.
// ponytail: patches cubing.js internals (CatchUpHelper); re-check after upgrading cubing.
const MOVE_MS = 160; // ~95% of the turn done by 100ms
const easeOut = (t: number) => 1 - (1 - t) ** 3;
function easeMoves(player: TwistyPlayer) {
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
}

// --- Orientation: scene = 3/4 camera tilt * user's view (arrows) * gyro (cubes with IMU) ---
const deg = Math.PI / 180;
const X: Vec = [1, 0, 0];
const Y: Vec = [0, 1, 0];
const TILT = mul(axisAngle(X, 30 * deg), axisAngle(Y, -30 * deg)); // top and right faces visible
const DEFAULT_VIEW = axisAngle([0, 0, 1], 180 * deg); // z2: yellow up, green front, orange right
const WCA_VIEW: Quat = { x: 0, y: 0, z: 0, w: 1 }; // competition orientation: white up, green front

// Modules: 'solve' = competition attempt (WCA notation, never translated); 'cube' = the cube's options and guided tools, in the viewer's frame;
// 'academy' = learn a method's algorithms (same frame as the guide); 'progress' = statistics and learning progress (no cube)
type Mod = 'solve' | 'cube' | 'academy' | 'progress' | 'about'; // about: /acerca, static markup shown by CSS
let mod: Mod = 'solve';
const homeView = () => (mod === 'solve' ? WCA_VIEW : DEFAULT_VIEW);
const label = (m: string) => (mod === 'solve' ? m : toView(m, view));
let view = homeView();
let gyro = WCA_VIEW; // rotation since last gyro calibration; identity on cubes without gyro
let target = WCA_VIEW;
const updateTarget = () => (target = mul(mul(TILT, view), gyro));
updateTarget();
let basis: Quat | null = null;

let vantage: { render(): unknown; scene: { scene(): Promise<unknown> } | null } | undefined; // Twisty3DVantage isn't exported
let scene: Scene | undefined;
let to: Quaternion | undefined; // target as a three.js quaternion, for slerp

async function frame() {
  // vantage/scene only exist once the player has rendered, so keep trying
  vantage ??= [...(await player!.experimentalCurrentVantages())][0];
  scene ??= (await vantage?.scene?.scene()) as Scene | undefined;
  if (scene) {
    to ??= scene.quaternion.clone();
    scene.quaternion.slerp(to.set(target.x, target.y, target.z, target.w), 0.25); // ponytail: fixed smoothing factor, tune if it feels laggy
    vantage!.render();
  }
  requestAnimationFrame(frame);
}

function onGyro({ x, y, z, w }: { x: number; y: number; z: number; w: number }) {
  // GAN: +X red, +Y blue, +Z white -> three.js: +Y up
  const l = Math.hypot(x, y, z, w) || 1;
  const q = { x: x / l, y: z / l, z: -y / l, w: w / l };
  basis ??= { x: -q.x, y: -q.y, z: -q.z, w: q.w }; // the inverse of the first reading
  gyro = mul(basis, q);
  updateTarget();
}

// Arrows rotate the view in 90° steps around the displayed vertical / horizontal axes
const TURNS: Record<string, [Vec, number]> = { left: [Y, -90], right: [Y, 90], up: [X, -90], down: [X, 90] };
function turnView(dir: string) {
  if (dir === 'reset') view = homeView();
  else view = mul(axisAngle(TURNS[dir][0], TURNS[dir][1] * deg), view);
  updateTarget();
  render(); // move names depend on the view
}
document.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach((b) => (b.onclick = () => turnView(b.dataset.turn!)));
addEventListener('keydown', (e) => {
  // arrows belong to the paint page, an open dialog or to the focused control (radio groups, selects…)
  if (document.body.dataset.paint || document.querySelector('dialog[open]') || (e.target as Element).closest?.('input, select, textarea')) return;
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
  setAlg(alg);
  const firstSync = !pattern;
  pattern = p;
  if (firstSync && mod === 'solve' && phase === 'ready' && is333(event)) void newScramble(); // now it can be guided on the cube
  if (conn) saveMac(conn.deviceName, conn.deviceMAC); // valid state decoded => the MAC is right
  render();
  void guide.replan(); // state was corrected: the old plan no longer applies
  if (mod === 'academy') academyCube.listener?.sync();
}

function onMove(move: string) {
  lastMoveAt = performance.now();
  if (mod === 'solve' && is333(event) && hasInspection(event)) startSolve(); // first turn after the scramble starts the clock (blindfolded: Space did, before memorising)
  mixed = false;
  player?.experimentalAddMove(move, { cancel: false }); // built before connecting (see connect)
  pattern = pattern?.applyMove(move) ?? null;
  moves.push(move);
  guide.onMove(move);
  if (mod === 'academy') academyCube.listener?.move(move);
  if (mod === 'solve' && phase === 'solving' && is333(event) && isSolved(pattern)) stopSolve();
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
  render3d(); // the Resolver's 2x2 event gets its 2x2 model back
  pattern = null;
  moves = [];
  guide.stop();
  mixed = false;
  liveMoveSeen = false;
  academyCube.listener?.sync(); // an open practice falls back to its static view
  setAlg('');
  $('status').textContent = t('cube.disconnected');
  $('status').classList.remove('solved');
  $('moves').textContent = '';
  $('connect').textContent = t('cube.connect');
  btn('reset-gyro').disabled = btn('reset-state').disabled = true;
  if (mod === 'solve' && phase === 'scramble') void newScramble();
}

// iPhone/iPad (iPadOS reports a Mac with touch): no browser there has Web Bluetooth but Bluefy, so the Cubo screen
// shows how to use it
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
$('ios-ble').hidden = !!navigator.bluetooth || !ios;

$('connect').onclick = async () => {
  if (conn) return conn.disconnect();
  if (!navigator.bluetooth) {
    $('status').textContent = t(ios ? 'cube.noBluetoothIos' : 'cube.noBluetooth');
    return;
  }
  try {
    $('status').textContent = t('cube.connecting');
    void loadTwisty(); // the 3D cube mirrors every move: it loads while the device picker is open
    const { connectGanCube } = await import('gan-web-bluetooth'); // usually prefetched by the Cubo screen
    const c = (conn = await connectGanCube(macProvider));
    render3d(); // the model mirrors the smart cube: a 3x3, whatever the event
    trustFirstMove((c as unknown as { driver: unknown }).driver);
    c.events$.subscribe(handle); // right away: events$ doesn't replay, a DISCONNECT here must not be lost
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

let scrambleText = ''; // the current scramble, kept with the solve
let called = 0; // inspection call already made: 0, 8 or 12 (s)

// The WCA event being timed (remembered); each keeps its own times, scrambles and puzzle
const EVENT_KEY = 'cube-event';
let event = setting<EventId>(EVENT_KEY, '333', isEvent);
const eventSelect = $('event') as HTMLSelectElement;
eventSelect.append(
  ...EVENTS.map((e) => new Option(t(`event.${e}`), e, false, e === event)),
  Object.assign(new Option(t('event.missing')), { disabled: true }),
);
eventSelect.onchange = () => {
  eventSelect.blur(); // keys must reach the timer, not the picker
  if (phase === 'inspect' || phase === 'solving') return void (eventSelect.value = event); // not mid-attempt
  clearTimeout(resetTimer); // a pending 'Borrar todos' confirmation was for the old event
  resetTimer = 0;
  resetLabel();
  event = eventSelect.value as EventId;
  save(EVENT_KEY, event);
  setNet(''); // the old scramble may not be valid on the new puzzle
  if (net) net.puzzle = wcaEvents[event].puzzleID;
  render3d();
  renderResults();
  void newScramble();
};
/** The big 3D model: a 3x3, or a 2x2 for the 2x2 event in the Resolver (without a smart cube, which is a 3x3); other
 *  events hide it and its view arrows. */
const has3d = (e: EventId) => is333(e) || e === '222';
let shown3d: '2x2x2' | '3x3x3' = '3x3x3';
const puzzle3d = (): '2x2x2' | '3x3x3' => (mod === 'solve' && event === '222' && !conn ? '2x2x2' : '3x3x3');
const render3d = () => {
  document.body.classList.toggle('other-puzzle', mod === 'solve' && !has3d(event));
  if (player && shown3d !== puzzle3d()) {
    player.puzzle = shown3d = puzzle3d(); // TwistyPlayer can't read .puzzle back: track it here
    scene = undefined; // the new puzzle comes with its own scene: frame() looks it up again
    to = undefined;
  }
};

// Times persist in this browser (newest first, every event in one list); anything malformed in storage is dropped
const RESULTS_KEY = 'cube-results';
let all: Result[] = parseStored(load(RESULTS_KEY));
let results: Result[] = []; // the event's (the same objects as in `all`), set by renderResults()
/** false when the browser refused (private mode, quota). */
const saveResults = () => {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
};

// WCA round simulator: the format's attempts in a row (Regulations 9f/9g); the solves also count as normal results.
const ROUNDS_KEY = 'cube-rounds';
let rounds = parseRounds(load(ROUNDS_KEY));
let round: { format: ReturnType<typeof roundFormat>; opts: RoundOpts; solves: Result[]; pb: number | null; pbSingle: number | null } | null = null;
const roundValues = () => round!.solves.map((r) => attemptValue(r, round!.opts.limit));
const seconds = (id: string) => {
  const v = parseFloat(($(id) as HTMLInputElement).value);
  return v > 0 ? Math.round(v * 1000) : undefined;
};
const finite = (v: number | null | undefined) => (v != null && Number.isFinite(v) ? v : null);
const min = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.min(a, b));

function renderRound() {
  const format = roundFormat(event);
  const n = ATTEMPTS[format];
  const k = format === 'ao5' ? 2 : 1;
  $('round-hint').textContent = tp('round.hint', k, { format: t(`round.${format}`) });
  btn('round-start').hidden = !!round;
  btn('round-stop').hidden = !round;
  btn('round-start').disabled = phase === 'inspect' || phase === 'solving';
  if (round) round.solves = round.solves.filter((r) => all.includes(r)); // deleted from the history = not in the round
  eventSelect.disabled = !!round; // the event can't change mid-round
  eventSelect.title = round ? t('round.eventLocked') : '';
  for (const id of ['round-cutoff', 'round-limit']) ($(id) as HTMLInputElement).disabled = !!round; // read once, at start
  let text = '';
  if (round) {
    const res = roundResult(roundValues(), round.format, round.opts);
    const last = round.solves[round.solves.length - 1];
    text = res.done && phase === 'done' ? t(res.cutoffFailed ? 'round.overCutoff' : 'round.over')
      : t('round.attempt', { n: Math.min(round.solves.length + (phase === 'done' ? 0 : 1), n), total: n });
    if (phase === 'done' && last && round.opts.limit !== undefined && resultValue(last) > round.opts.limit) text += ' · ' + t('round.overLimit');
  }
  if ($('round-status').textContent !== text) $('round-status').textContent = text;
  $('stage-round').textContent = text;
  $('round-list').setAttribute('aria-label', t('round.recent'));
  const date = (at: number) => new Date(at).toLocaleDateString(document.documentElement.lang, { day: 'numeric', month: 'short' });
  $('round-list').replaceChildren(...rounds.filter((r) => r.event === event).slice(0, 5).map((r) => {
    const res = storedResult(r);
    const params = { format: t(`round.${format}`), best: formatAverage(res.best), date: date(r.at), value: formatAverage(res.final) };
    return el('li', { textContent: t(res.final === null ? 'round.itemFailed' : 'round.item', params) });
  }));
}

function startRound() {
  if (round || phase === 'inspect' || phase === 'solving') return;
  const format = roundFormat(event);
  const rows = summary(results).rows;
  const best = (label: string) => finite(rows.find((r) => r.label === label)?.best);
  const earlier = rounds.filter((r) => r.event === event).map((r) => finite(storedResult(r).final));
  round = {
    format, opts: { cutoff: seconds('round-cutoff'), limit: seconds('round-limit') }, solves: [],
    pb: earlier.reduce(min, best(format === 'bo3' ? 'single' : format)),
    pbSingle: best('single'),
  };
  void newScramble(); // a fresh scramble for attempt 1 (renders)
}

function finishRound() {
  const r = round!;
  const values = roundValues();
  const res = roundResult(values, r.format, r.opts);
  round = null;
  rounds = [{ event, at: Date.now(), values: values.map(finite), ...(r.opts.cutoff && { cutoff: r.opts.cutoff }), ...(r.opts.limit && { limit: r.opts.limit }) } satisfies StoredRound, ...rounds].slice(0, 200);
  save(ROUNDS_KEY, rounds);
  const versus = (value: number, pb: number | null) =>
    !Number.isFinite(value) ? '' : ' · ' + (pb === null ? t('round.firstPb') : value < pb ? t('round.newPb') : t('round.vsPb', { pb: formatTime(pb), diff: formatTime(value - pb) }));
  const p = (textContent: string) => el('p', { textContent });
  const format = t(`round.${r.format}`);
  $('round-title').textContent = t('round.dialogTitle', { event: t(`event.${event}`) });
  $('round-body').replaceChildren(
    p(values.map(formatAverage).join(' · ')),
    p(res.cutoffFailed ? t('round.cutoffFailed', { cutoff: formatTime(r.opts.cutoff!), format }) : t('round.result', { format, value: formatAverage(res.final) }) + versus(res.final!, r.pb)),
    ...(r.format === 'bo3' && !res.cutoffFailed ? [] : [p(t('round.best', { value: formatAverage(res.best) }) + versus(res.best, r.pbSingle))]),
  );
  ($('round-dialog') as HTMLDialogElement).showModal();
  renderResults();
}
btn('round-start').onclick = startRound;
btn('round-stop').onclick = () => ((round = null), renderResults(), renderTimer());

let scrambleId = 0;

async function newScramble() {
  if (round && roundResult(roundValues(), round.format, round.opts).done) finishRound(); // the last attempt was already timed
  const id = ++scrambleId;
  scrambleText = '';
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
  const target = cube ? await random333Pattern() : null;
  const alg = target ? (await experimentalSolve3x3x3IgnoringCenters(target)).invert() : await randomScrambleForEvent(event);
  const scramble = alg.toString().replace(/2'/g, '2'); // half turns have no direction in WCA notation
  if (id !== scrambleId) return; // superseded by a newer scramble
  scrambleText = scramble;
  // 3x3: tappable moves (white up, green front, as WCA scrambles); other puzzles: text. Big ones (6x6, 7x7, Megaminx…)
  // get smaller, scrollable text, keeping Megaminx's lines.
  $('scramble-text').replaceChildren(is333(event) ? algView(scramble, { frame: 'white-up' }) : scramble);
  $('scramble-text').classList.toggle('long', scramble.length > 80);
  setNet(scramble);
  if (!conn && has3d(event)) setAlg(scramble); // no cube: the 3D model shows the scrambled state too (3x3 or 2x2)
  else if (phase === 'scramble') await startGuide(target); // walk the real cube there from wherever it is
  render();
  idle(loadTwisty); // the scramble is up: now the net and the 3D cube
}

function startInspection() {
  if (phase !== 'ready' || !scrambleText) return; // still generating
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

function startSolve() {
  if (phase !== 'ready' && phase !== 'inspect') return;
  penalty = phase === 'inspect' && hasInspection(event) ? inspectionPenalty(performance.now() - inspectStart) : 0;
  holdStart = 0;
  if (canSpeak) speechSynthesis.cancel(); // a late call mustn't talk over the solve
  phase = 'solving';
  solveStart = performance.now();
  renderTimer();
}

function stopSolve() {
  if (phase !== 'solving') return;
  const solve: Result = { ms: recordTime(performance.now() - solveStart), penalty, at: Date.now(), ...(scrambleText && { scramble: scrambleText }), ...eventField(event) };
  if (round && attemptValue(solve, round.opts.limit) === Infinity) solve.penalty = 'DNF'; // over the time limit
  all.unshift(solve);
  round?.solves.push(solve);
  phase = 'done';
  renderResults(); // first: the timer shows the event's newest result
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
    return t(!hasInspection(event) ? 'event.bldHold' : conn && is333(event) ? 'timer.inspectCube' : 'timer.inspect');
  }
  if (phase === 'solving') return t(conn && is333(event) ? 'timer.solvingCube' : 'timer.solving');
  return t('timer.done');
}

function renderTimer() {
  const staged = mod === 'solve' && (phase === 'inspect' || phase === 'solving' || phase === 'done');
  $('stage').hidden = !staged;
  $('stage-hint').textContent = stageHint();
  $('penalties').hidden = phase !== 'done';
  renderRound();
  $('stage-call').hidden = phase !== 'inspect';
  $('timer-hint').textContent = t(phase === 'scramble' ? 'solve.applyScramble' : hasInspection(event) ? 'solve.spaceToInspect' : 'event.spaceToStart');
  btn('start').disabled = phase !== 'ready' || !scrambleText;
  $('scramble-text').hidden = !!guide.guide; // with a cube the guide shows the moves to do
  if (phase === 'solving') $('big').className = 'big';
  if (phase === 'done') {
    $('big').textContent = formatResult(results[0]);
    $('big').className = 'big';
    document.querySelectorAll<HTMLButtonElement>('[data-pen]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pen === String(results[0].penalty))));
  }
}

/** The times list and the line of stats; called whenever `results` changes (not on every move: it can be thousands). */
function renderResults() {
  results = all.filter((r) => eventOf(r) === event);
  const best = results.reduce<Result | null>((b, r) => (!b || resultValue(r) < resultValue(b) ? r : b), null);
  $('stats').textContent = best
    ? isMo3(event)
      ? t('event.statsMo3', { best: formatResult(best), mo3: formatAverage(average(results, 3, 0)) })
      : t('timer.stats', { best: formatResult(best), ao5: formatAverage(average(results, 5)), ao12: formatAverage(average(results, 12)) })
    : '';
  saveResults();
  $('reset-results').hidden = !results.length;
  // ponytail: only the latest 100 (an import can bring thousands of focusable ×); the stats dialog covers the rest
  ($('results') as HTMLOListElement).start = results.length; // the list is reversed: numbered from the newest
  $('results').replaceChildren(...results.slice(0, 100).map((r) => {
    const del = Object.assign(document.createElement('button'), { className: 'del', textContent: '×', title: t('results.delete') });
    del.setAttribute('aria-label', t('results.deleteOne', { time: formatResult(r) }));
    del.onclick = () => {
      all.splice(all.indexOf(r), 1);
      renderResults();
    };
    const li = document.createElement('li');
    li.append(formatResult(r), del);
    return li;
  }));
}
renderResults();
// First visit (body.fresh, see index.html): each of the welcome card's choices hides it for good
$('welcome').onclick = (e) => {
  if (!(e.target as Element).closest('a, button')) return;
  save('cube-welcome', true);
  document.body.classList.remove('fresh');
  if ((e.target as Element).closest('#welcome-timer')) btn('start').focus(); // the card (and the focus) is gone: on to the timer
};

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
    $('big').textContent = !timed ? formatTime(0) : left > 0 ? String(Math.ceil(left / 1000)) : inspectionPenalty(elapsed) === 'DNF' ? 'DNF' : '+2';
    // hold: red -> green; otherwise the judge's 8 s / 12 s calls
    $('big').className = `big ${holdStart ? (armed() ? 'go' : 'hold') : call === 12 ? 'late' : call === 8 ? 'warn' : ''}${flash ? ' call' : ''}`;
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
  if (!results[0]) return;
  results[0].penalty = b.dataset.pen === 'DNF' ? 'DNF' : (Number(b.dataset.pen) as Penalty);
  renderTimer();
  renderResults();
}));
$('delete-last').onclick = () => {
  if (!results[0]) return;
  if (round) round.solves = round.solves.filter((r) => r !== results[0]); // the attempt is made again
  all.splice(all.indexOf(results[0]), 1); // e.g. a false start: drop the attempt and move on
  renderResults();
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
  all = all.filter((r) => eventOf(r) !== event); // the event's times; the others stay
  renderResults();
};

// Statistics: every average's current and best, a histogram and the trend; also where times are imported
const statsDialog = $('stats-dialog') as HTMLDialogElement;
function renderStats() {
  if (!results.length) return $('stats-body').replaceChildren(el('p', { className: 'hint', textContent: t('stats.empty') }));
  const s = summary(results);
  const cell = (tag: 'th' | 'td', textContent: string) => el(tag, { textContent });
  const table = el('table', { className: 'quiz-table' },
    el('thead', {}, el('tr', {}, cell('th', ''), cell('th', t('stats.current')), cell('th', t('stats.best')))),
    el('tbody', {}, ...s.rows.filter((r) => r.best !== null).map((r) =>
      el('tr', {}, el('th', { scope: 'row', textContent: r.label === 'single' ? t('stats.single') : r.label }), cell('td', formatAverage(r.current)), cell('td', formatAverage(r.best))))));
  const values = results.map(resultValue).reverse(); // oldest first
  const figure = (title: string, svg: string, ...legend: Node[]) => {
    const f = el('figure', { className: 'chart' }, el('figcaption', { textContent: title }));
    f.insertAdjacentHTML('beforeend', svg);
    if (legend.length) f.append(el('p', { className: 'chart-legend hint' }, ...legend));
    return f;
  };
  const key = (cls: string, text: string) => el('span', { className: cls, textContent: text });
  const done = values.filter(Number.isFinite);
  $('stats-body').replaceChildren(
    table,
    el('p', { className: 'hint', textContent: tp('stats.count', s.count, { dnf: s.dnf, mean: formatAverage(s.mean) }) }),
    el('p', { className: 'hint', textContent: t('stats.caption') }),
    ...(done.length ? [figure(t('stats.histogram'), histogramSvg(values, t('stats.histogramAlt', { from: formatTime(done.reduce((a, b) => Math.min(a, b))) })))] : []),
    ...(values.length > 1 ? [figure(t('stats.trend'),
      trendSvg(values, [{ cls: 'ao5', avgs: rolling(values, 5) }, { cls: 'ao12', avgs: rolling(values, 12) }], t('stats.trendAlt', { n: values.length })),
      key('pt', t('stats.legendSolve')), key('ao5', 'ao5'), key('ao12', 'ao12'))] : []),
  );
}
$('opts-open').onclick = () => { $('import-status').textContent = ''; ($('solve-opts') as HTMLDialogElement).showModal(); }; // inspection calls, voice, round settings
$('stats-open').onclick = () => {
  $('stats-title').textContent = t('event.statsTitle', { event: t(`event.${event}`) });
  renderStats();
  statsDialog.showModal();
};
$('import-choose').onclick = () => $('import-file').click();
$('import-file').onchange = async () => {
  const input = $('import-file') as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ''; // the same file can be chosen again
  if (!file) return;
  const parsed = parseImport(await file.text(), event);
  if (!parsed.results.length) return void ($('import-status').textContent = t('import.none'));
  const before = all;
  const merged = mergeResults(all, parsed.results);
  all = merged.results;
  // Too big for the browser's storage: keep what was there, or every later solve would fail to save too
  if (!saveResults()) return void ((all = before), ($('import-status').textContent = t('import.saveFailed')));
  renderResults();
  renderStats();
  $('import-status').textContent = t('import.done', { format: parsed.format, added: merged.added, dup: parsed.results.length - merged.added, skipped: parsed.skipped });
};

$('stage').addEventListener('pointerdown', (e) => {
  if ((e.target as Element).closest('button')) return;
  e.preventDefault();
  press();
});
$('stage').addEventListener('pointerup', (e) => !(e.target as Element).closest('button') && release());

// Not while a dialog is open, nor from a checkbox (Space toggles it)
const timerKeys = (e: KeyboardEvent) => mod === 'solve' && !document.querySelector('dialog[open]') && !(e.target as Element).closest?.('input, select');
addEventListener('keydown', (e) => {
  if (!timerKeys(e) || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.code === 'Space') {
    e.preventDefault(); // also keeps Space from clicking a focused button
    if (!e.repeat) press();
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
  release();
});

// --- Menu ---
let shownMod: Mod | null = null; // the screen setModule last set up
function setModule(m: Mod) {
  if (m === shownMod) return; // e.g. between Academia pages: nothing to reset
  shownMod = mod = m;
  guide.stop();
  stopInspection(); // e.g. Back during inspection: no calls on another screen
  mixed = false;
  view = homeView();
  updateTarget();
  document.body.dataset.module = m; // the academy widens the panel
  render3d();
  $('mod-solve').hidden = m !== 'solve';
  $('mod-cube').hidden = m !== 'cube';
  $('mod-academy').hidden = m !== 'academy';
  $('mod-progress').hidden = m !== 'progress';
  if (!conn) setAlg(''); // the solve module's text scramble only applies there
  render();
  if (m === 'solve') void newScramble();
  if (m === 'cube') idle(() => { void loadTwisty(); void import('gan-web-bluetooth'); }); // ready for Conectar (requestDevice needs the tap's activation, ~5 s)
}
// Each screen has its URL (router.ts): the menu and the Academia tiles are plain links.
const pageTitle = (page: string) => t('app.pageTitle', { page, app: t('app.title') });
let routeId = 0;
let academy: typeof import('./academy/view.ts') | undefined; // loaded by the first Academia page
// One canonical URL per screen (crawlers run this script; /resolver and the like point to /)
const canonical = document.querySelector<HTMLLinkElement>('link[rel=canonical]') // the build's static pages bring theirs (src/seo.ts)
  ?? document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }));
async function onRoute(r: Route, scroll: number | null = null) {
  const id = ++routeId;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close()); // back/forward leaves any modal
  const menu = $('header-menu');
  if (menu.matches(':popover-open')) menu.hidePopover(); // phones: following a link closes the menu
  setModule(r.mod);
  // the menu entry: the algorithm library is drawn by the academy but has its own entry
  const entry = r.mod === 'academy' && r.page.kind === 'library' ? 'library' : r.mod;
  document.querySelectorAll<HTMLElement>('[data-mod]').forEach((a) => (a.dataset.mod === entry ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $('header-module').textContent = t(entry === 'progress' ? 'nav.progress' : entry === 'about' ? 'about.menu' : (`menu.${entry}` as MessageKey)); // shown next to ☰ on phones
  // "Pinta tu cubo" (/cubo/pintar): a page of the Cubo screen, full width like the Academia
  const painting = r.mod === 'cube' && r.page === 'paint';
  document.body.toggleAttribute('data-paint', painting);
  $('mod-paint').hidden = !painting;
  if (r.mod === 'cube') $('mod-cube').hidden = painting;
  canonical.href = `https://twistlab.app${routePath(r)}`;
  if (painting) void import('./paint-view.ts').then((m) => id === routeId && m.showPaint());
  if (r.mod === 'progress') void import('./progress-view.ts').then((m) => id === routeId && m.showProgress($('mod-progress'))); // read again on every visit: the other screens may have saved
  if (painting || r.mod === 'progress' || r.mod === 'about') panelEl().scrollTop = scroll ?? 0;
  if (r.mod !== 'academy') {
    academy?.stopCase();
    academy?.stopLesson(); // a lesson left for another module lets go of the cube and its 3D player
    academy?.stopTrainers();
    document.title = r.mod === 'solve' ? t('app.title') : pageTitle(t(painting ? 'paint.title' : r.mod === 'progress' ? 'nav.progress' : r.mod === 'about' ? 'about.title' : 'menu.cube'));
    return;
  }
  academy = await import('./academy/view.ts');
  if (id !== routeId) return;
  const title = await academy.showAcademy($('mod-academy'), r.page);
  if (id !== routeId) return; // a newer route won while the puzzle was loading
  document.title = pageTitle(title);
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (scroll !== null) panelEl().scrollTop = scroll; // Back: where you were (e.g. down a method's case list)
  else if (target) target.scrollIntoView();
  else panelEl().scrollTop = 0; // a new page starts at the top
}
const panelEl = () => document.querySelector<HTMLElement>('.panel')!;
startRouter((r, scroll) => void onRoute(r, scroll), () => panelEl().scrollTop);

$('reset-state').onclick = async () => {
  await conn?.sendCubeCommand({ type: 'REQUEST_RESET' });
  setAlg('');
  pattern = (await cube3x3x3.kpuzzle()).defaultPattern();
  moves = [];
  render();
  void guide.replan(); // the state changed: the old plan no longer applies
  academyCube.listener?.sync(true);
};

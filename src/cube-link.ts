// The smart cube: its connection (the connection block, also in a dialog from any screen), the state mirrored from its
// moves and its full-state reports, the status line, the gestures, "En tu cubo" and the guide that walks it to a
// target (solved, or the Resolver's scramble). The Resolver (resolver.ts) plugs in through `useResolver`: the clock
// starts on the first turn and stops when the cube is solved, a scramble waits for the cube, and so on.
import { experimentalSolve3x3x3IgnoringCenters, random333Pattern } from 'cubing/search';
import { cube3x3x3, wcaEvents } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import type { MacAddressProvider } from 'gan-web-bluetooth';
import { faceletsToPattern, patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
import { describe, nextStep, PathGuide } from './guide.ts';
import { bluefy, connectCube, errorText, gestureOf, requestCube, type CubeEvent, type SmartCube } from './smart-cube.ts';
import { has3d } from './timer.ts';
import { t } from './i18n.ts';
import { algView } from './notation-view.ts';
import { cube as academyCube } from './academy/link.ts';
import { $, btn } from './el.ts';
import { addMove, inView, loadTwisty, onGyro, resetGyro, setAlg, setModel, turnView, type Model } from './cube-3d.ts';
import { openSheet, plainClick } from './router.ts';
import { mod } from './screen.ts';
import { event } from './times-view.ts';

/** The Resolver, as the cube needs it: an attempt under way (no gestures then), the clock's start and stop around a
 *  move, a scramble to make or remake when the cube syncs or is lost, the scramble reached, its stage drawn. */
export interface Hooks { busy(): boolean; turning(): void; turned(at: number): void; synced(): void; lost(): void; scrambled(): void; render(): void }
let hooks: Hooks = { busy: () => false, turning() {}, turned() {}, synced() {}, lost() {}, scrambled() {}, render() {} };
export const useResolver = (h: Hooks) => void (hooks = h);

const label = (m: string) => (mod === 'solve' ? m : inView(m)); // the Resolver writes WCA notation; the guides, as seen

/** The big 3D model: a 3x3, or a 2x2 for the 2x2 event in the Resolver (without a smart cube, which is a 3x3); other
 *  events hide it and its view arrows. */
const puzzle3d = (): Model => (mod === 'solve' && event === '222' && !conn ? '2x2x2' : '3x3x3');
export const render3d = () => {
  document.body.classList.toggle('other-puzzle', mod === 'solve' && !has3d(event));
  setModel(puzzle3d());
};
/** The net and the 3D cube, built once (cube-3d.ts), for the event and model of now. */
export const load3d = () => loadTwisty(wcaEvents[event].puzzleID, puzzle3d());


/** A new screen: no guide nor its target, the home model; the 3D cube without the Resolver's scramble. */
export function leaveScreen() {
  guide.stop();
  mixed = false;
  render3d();
  if (!conn) setAlg(''); // the solve module's text scramble only applies there
}

// The view's arrows (on screen and on the keyboard) turn the 3D cube; move names depend on the view
const turn = (dir: string) => { turnView(dir); render(); };
document.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach((b) => (b.onclick = () => turn(b.dataset.turn!)));
addEventListener('keydown', (e) => {
  // arrows belong to the paint page, an open dialog or to the focused control (radio groups, selects…)
  if (document.body.dataset.paint || document.querySelector('dialog[open]') || (e.target as Element).closest?.('input, select, textarea')) return;
  const dir = e.key.startsWith('Arrow') && e.key.slice(5).toLowerCase();
  if (dir && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); turn(dir); }
});

// The cube's status, in the header and (the header covered) the connection dialog: written only here. Connected, it's
// the cube's state (or for a moment what a gesture did); not, how the last connection went (connNote).
let connNote: 'cube.connecting' | 'cube.disconnected' | 'cube.failed' | null = null;
function renderStatus(solved = isSolved(pattern)) {
  const text = notice && performance.now() < notice.until ? notice.text
    : t(!conn ? connNote ?? 'cube.noCube' : solved ? 'cube.solved' : mixed ? 'cube.mixed' : 'cube.connected');
  for (const id of ['status', 'conn-status']) if ($(id).textContent !== text) $(id).textContent = text; // conn-status is a live region: only on a change
  $('status').classList.toggle('solved', !!conn && (solved || mixed));
}

// --- State: mirror every move, detect solved ---
export let pattern: KPattern | null = null;
export let moves: string[] = []; // cube frame; shown in the viewer's frame

export const isSolved = (p: KPattern | null) => !!p?.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });

/** Everything that shows the cube's state: the status, its moves, the Cubo screen's case and guide, the Resolver's stage. */
export function render() {
  const solved = isSolved(pattern);
  if (guide.reached()) {
    mixed = !!guide.goal; // reached the guide's target
    guide.stop();
    if (mixed) hooks.scrambled();
  }
  renderStatus(solved);
  $('moves').textContent = moves.slice(-40).map(label).join(' ');
  renderInspect();
  renderGuide();
  hooks.render();
}

// "En tu cubo" (Cubo screen): the case on the cube, redrawn on every move; its module loads the first time it's shown
let inspectView: ((p: KPattern) => Node[]) | null | undefined; // null: loading
function renderInspect() {
  const on = mod === 'cube' && !!conn && !!pattern;
  $('inspect').hidden = !on;
  if (!on) return;
  if (inspectView) return void $('inspect-body').replaceChildren(...inspectView(pattern!));
  if (inspectView === undefined) {
    inspectView = null;
    void import('./academy/inspectView.ts').then((m) => { inspectView = m.inspectView; renderInspect(); });
  }
}

// --- Guide: walk the cube to a target state (solved, or a random scramble), step by step (see PathGuide).
export const guide = new PathGuide(() => pattern, () => render());
let mixed = false; // the guide brought the cube to its scramble

export function startGuide(target: KPattern | null | Promise<KPattern | null>) {
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
  hooks.scrambled(); // scrambling by hand instead
  render();
};

let lastMoveAt = 0;
let recent: { move: string; at: number }[] = []; // the latest moves, for the cube's gestures (smart-cube.ts gestureOf)
let notice: { text: string; until: number } | null = null; // what a gesture did, on the status line for a moment

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
  if (firstSync) hooks.synced(); // the Resolver's scramble can now be guided on the cube
  if (conn?.deviceMAC) saveMac(conn.deviceName, conn.deviceMAC); // valid state decoded => the MAC is right
  render();
  void guide.replan(); // state was corrected: the old plan no longer applies
  if (mod !== 'solve') academyCube.listener?.sync();
}

function onMove(move: string, at = performance.now()) {
  lastMoveAt = performance.now();
  hooks.turning(); // the Resolver: the first turn after the scramble starts the clock
  mixed = false;
  addMove(move); // built before connecting (see connect)
  pattern = pattern?.applyMove(move) ?? null;
  moves.push(move);
  recent = [...recent.slice(-7), { move, at }];
  // a full turn of the white face recalibrates the orientation, two of the yellow one mark it solved (smart-cube.ts);
  // not on the Resolver's clock, and marking solved not under an Academia dialog (it would re-guide from a false state)
  const gesture = gestureOf(recent);
  if (gesture && !(mod === 'solve' && hooks.busy()) && !(gesture === 'D' && academyCube.listener)) {
    recent = [];
    if (gesture === 'U') resetGyro();
    else void markSolved();
    notice = { text: t(gesture === 'U' ? 'cube.gyroReset' : 'cube.markedSolved'), until: performance.now() + 4000 };
    setTimeout(render, 4100); // back to the cube's state, moves or not
  }
  guide.onMove(move);
  // ponytail: outside the Academia only Progreso's quiz has a listener (leaving the Academia closes its dialogs and
  // frees its pages); never the Resolver, which names moves white up and where a turn in 'ready' starts the clock
  if (mod !== 'solve') academyCube.listener?.move(move);
  hooks.turned(at); // the Resolver: the move's time in the solve's log, and the clock stops if it solved the cube
  render();
}

academyCube.pattern = () => (conn ? pattern : null); // only a connected cube can be practised on
academyCube.label = label;
academyCube.moves = () => moves;
academyCube.refresh = () => void conn?.sendCubeCommand({ type: 'REQUEST_FACELETS' }).catch(() => {});

// --- Connection ---
export let conn: SmartCube | null = null;
let liveMoveSeen = false;

// The MAC salts the encryption key. Chrome rarely exposes it, so ask once and remember it per cube.
const macKey = (name: string) => `cube-mac:${name}`;
const loadMac = (name: string) => { try { return localStorage.getItem(macKey(name)); } catch { return null; } };
const saveMac = (name: string, mac: string) => { try { localStorage.setItem(macKey(name), mac); } catch {} };
const forgetMac = (name: string) => { try { localStorage.removeItem(macKey(name)); } catch {} };

let macCancelled = false; // the user cancelled the MAC prompt (to look it up): not an error to show
const macProvider: MacAddressProvider = async (device, isFallback) => {
  const saved = loadMac(device.name ?? '');
  if (saved) return saved;
  // GAN asks twice: first (not a fallback) before trying the advertisement, then as the fallback: prompt only then
  if (!isFallback) return null;
  // GAN names end with the MAC's last two bytes, e.g. GANic4_8CA7 -> ..:8C:A7
  const tail = device.name?.match(/_([0-9A-F]{2})([0-9A-F]{2})$/i);
  ($('mac-help') as HTMLDetailsElement).open = true; // how to find it, on screen once the prompt closes
  const input = prompt(
    t('cube.macPrompt', { name: device.name ?? '' }) + (tail ? '\n' + t('cube.macTail', { tail: `${tail[1]}:${tail[2]}` }) : '') + '\n' + t('cube.macWhere'),
    tail ? `XX:XX:XX:XX:${tail[1]}:${tail[2]}`.toUpperCase() : '',
  );
  if (input === null) {
    macCancelled = true;
    return null;
  }
  const mac = input.trim().toUpperCase().replace(/-/g, ':');
  if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) throw new Error(t('cube.macInvalid'));
  return mac;
};

function handle(e: CubeEvent) {
  switch (e.type) {
    case 'GYRO': // the first reading enables Recalibrar: whether a cube has a gyroscope depends on the model, not the brand
      btn('reset-gyro').disabled = false;
      return onGyro(e.quaternion);
    case 'MOVE':
      // Recovered moves (no local timestamp) before the first live one are pre-connection history the
      // library replays because some firmwares (GANic4 1.0) report serial 0 in state events.
      // They're already part of the synced state, so applying them would double them.
      if (e.localTimestamp === null && !liveMoveSeen) return;
      liveMoveSeen ||= e.localTimestamp !== null;
      return onMove(e.move, e.localTimestamp ?? undefined);
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
  connNote = 'cube.disconnected';
  renderStatus();
  $('moves').textContent = '';
  $('connect').textContent = t('cube.connect');
  btn('reset-gyro').disabled = btn('reset-state').disabled = true;
  $('cube-note').hidden = true;
  hooks.lost();
}

// iPhone/iPad (iPadOS reports a Mac with touch): no browser there has Web Bluetooth but Bluefy, so the Cubo screen
// shows how to use it
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
$('ios-ble').hidden = !!navigator.bluetooth || !ios;
$('bluefy-hint').hidden = !bluefy();

/** A connection that failed: short in the header, what happened and what to do in the connection block. */
function connFailed(why: string) {
  connNote = 'cube.failed';
  renderStatus();
  $('conn-error').textContent = why;
  $('conn-error').hidden = false;
}

let connecting = false; // a second tap while connecting would connect twice (and tangle withDevice's swaps)
$('connect').onclick = async () => {
  if (conn) return conn.disconnect();
  if (connecting) return;
  const sim = import.meta.env.DEV && new URLSearchParams(location.search).get('simcube'); // dev only, see smart-cube-sim.ts
  if (!navigator.bluetooth && !sim) {
    connFailed(t(ios ? 'cube.noBluetoothIos' : 'cube.noBluetooth'));
    return;
  }
  macCancelled = false;
  $('conn-error').hidden = true;
  let device: BluetoothDevice | undefined;
  connecting = true;
  try {
    connNote = 'cube.connecting';
    renderStatus();
    void load3d(); // the 3D cube mirrors every move: it loads while the device picker is open
    if (!sim) {
      try {
        device = await requestCube();
      } catch (err) {
        console.error(err);
        // Bluefy answers a closed chooser, and one it couldn't open, with a bare number: say what to check, not "Error: 2"
        if ((err as Error)?.name === 'NotFoundError') connNote = 'cube.disconnected', renderStatus();
        else connFailed(bluefy() && !(err instanceof Error) ? t('cube.bluefyPicker') : t('cube.error', { message: errorText(err) }));
        return;
      }
    }
    const c = (conn = sim ? (await import('./smart-cube-sim.ts')).simulate(sim) : await connectCube(device!, macProvider, loadMac));
    render3d(); // the model mirrors the smart cube: a 3x3, whatever the event
    c.events$.subscribe(handle); // right away: events$ doesn't replay, a DISCONNECT here must not be lost
    $('device').textContent = `${c.brand} · ${c.deviceName}` + (c.deviceMAC ? ` (${c.deviceMAC})` : '');
    $('connect').textContent = t('cube.disconnect');
    btn('reset-state').disabled = false;
    $('cube-note').hidden = c.facelets;
    renderStatus();
    for (const type of ['REQUEST_HARDWARE', 'REQUEST_FACELETS', 'REQUEST_BATTERY'] as const) {
      await c.sendCubeCommand({ type }).catch(console.error); // connected anyway: a cube that stays silent is the timer's below
    }
    // A wrong MAC decrypts to garbage and the library stays silent: no valid state => wrong MAC.
    setTimeout(async () => {
      if (conn !== c || pattern) return;
      forgetMac(c.deviceName);
      await c.disconnect();
      connFailed(t('cube.badMac'));
      ($('mac-help') as HTMLDetailsElement).open = true;
    }, 5000);
  } catch (err) {
    conn = null;
    console.error(err);
    // a cancelled MAC prompt: the help is open, nothing went wrong; else the cube's name says which one failed
    if (macCancelled) connNote = 'cube.disconnected', renderStatus();
    else connFailed(t('cube.error', { message: `${device?.name ?? ''} ${errorText(err)}`.trim() }));
  } finally {
    connecting = false;
  }
};

$('reset-gyro').onclick = resetGyro;

// The connection from any screen: the header's status opens it in a dialog (a lesson, a quiz, the Resolver stay put).
// One block, moved: into the dialog while it's open, back to the Cubo screen when it closes; on that screen the link
// just goes there. Its status line repeats the header's (renderStatus), which the dialog covers on a phone. A sheet:
// full screen on a phone, so Back closes it rather than leaving the page under it (or the installed app).
const cubeDialog = $('cube-dialog') as HTMLDialogElement;
document.querySelector<HTMLAnchorElement>('.header-status-link')!.addEventListener('click', (e) => {
  if (mod === 'cube' || !plainClick(e)) return; // the router takes it
  e.preventDefault();
  cubeDialog.append($('conn'));
  openSheet(cubeDialog);
});
cubeDialog.addEventListener('close', () => $('conn-home').append($('conn')));
cubeDialog.addEventListener('click', (e) => { if ((e.target as Element).closest('a[href^="/"]')) cubeDialog.close(); }); // a page link: the page, not the dialog
renderStatus();

$('reset-state').onclick = () => void markSolved();
/** The user says the cube is solved (it was solved by hand while the app lost track): the button, or the yellow face's gesture. */
async function markSolved() {
  await conn?.sendCubeCommand({ type: 'REQUEST_RESET' });
  setAlg('');
  pattern = (await cube3x3x3.kpuzzle()).defaultPattern();
  moves = [];
  render();
  void guide.replan(); // the state changed: the old plan no longer applies
  academyCube.listener?.sync(true);
}

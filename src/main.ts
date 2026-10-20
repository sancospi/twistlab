import { TwistyPlayer } from 'cubing/twisty';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { randomScrambleForEvent } from 'cubing/scramble';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';
import { Euler, Quaternion, type Scene } from 'three';
import { connectGanCube, type GanCubeConnection, type GanCubeEvent, type MacAddressProvider } from 'gan-web-bluetooth';
import { faceletsToPattern, SOLVED_FACELETS } from './facelets.ts';

const $ = (id: string) => document.getElementById(id)!;
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

// --- Orientation: the cube's gyro quaternion drives the whole 3D scene ---
const HOME = new Quaternion().setFromEuler(new Euler((15 * Math.PI) / 180, (-20 * Math.PI) / 180, 0));
const target = new Quaternion().setFromEuler(new Euler((30 * Math.PI) / 180, (-30 * Math.PI) / 180, 0));
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
  target.copy(q.premultiply(basis).premultiply(HOME));
}

// --- State: mirror every move, detect solved ---
let pattern: KPattern | null = null;
let moves: string[] = [];

function render() {
  const solved = pattern?.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
  $('status').textContent = solved ? '¡Resuelto!' : conn ? 'Conectado' : 'Demo';
  $('status').classList.toggle('solved', !!solved);
  $('moves').textContent = moves.slice(-40).join(' ');
}

async function onFacelets(facelets: string) {
  if (pattern) return; // only sync initial state; moves keep it updated afterwards
  const p = await faceletsToPattern(facelets);
  player.alg = facelets === SOLVED_FACELETS ? '' : (await experimentalSolve3x3x3IgnoringCenters(p)).invert();
  pattern = p;
  render();
}

function onMove(move: string) {
  player.experimentalAddMove(move, { cancel: false });
  pattern = pattern?.applyMove(move) ?? null;
  moves.push(move);
  render();
}

// --- Connection ---
let conn: GanCubeConnection | null = null;

const macProvider: MacAddressProvider = async (device, isFallback) => {
  if (!isFallback && typeof device.watchAdvertisements === 'function') return null;
  return prompt(
    'No se pudo leer la MAC del cubo automáticamente.\n' +
      'Activa chrome://flags/#enable-experimental-web-platform-features o escríbela (ej. AB:12:34:56:78:9A):',
  );
};

function handle(e: GanCubeEvent) {
  switch (e.type) {
    case 'GYRO': return onGyro(e.quaternion);
    case 'MOVE': return onMove(e.move);
    case 'FACELETS': return void onFacelets(e.facelets);
    case 'BATTERY': $('battery').textContent = `${e.batteryLevel}%`; return;
    case 'HARDWARE': $('device').textContent = [e.hardwareName, e.softwareVersion].filter(Boolean).join(' · '); return;
    case 'DISCONNECT': return disconnected();
  }
}

function disconnected() {
  conn = null;
  pattern = null;
  moves = [];
  player.alg = '';
  $('status').textContent = 'Desconectado';
  $('status').classList.remove('solved');
  $('moves').textContent = '';
  $('connect').textContent = 'Conectar cubo GAN';
  btn('reset-gyro').disabled = btn('reset-state').disabled = true;
}

$('connect').onclick = async () => {
  if (conn) return conn.disconnect();
  if (!navigator.bluetooth) {
    $('status').textContent = 'Este navegador no soporta Web Bluetooth (usa Chrome/Edge en escritorio o Android).';
    return;
  }
  try {
    $('status').textContent = 'Conectando…';
    conn = await connectGanCube(macProvider);
    conn.events$.subscribe(handle);
    $('device').textContent = `${conn.deviceName} (${conn.deviceMAC})`;
    $('connect').textContent = 'Desconectar';
    btn('reset-gyro').disabled = btn('reset-state').disabled = false;
    $('status').textContent = 'Conectado';
    for (const type of ['REQUEST_HARDWARE', 'REQUEST_FACELETS', 'REQUEST_BATTERY'] as const) {
      await conn.sendCubeCommand({ type });
    }
  } catch (err) {
    conn = null;
    $('status').textContent = `Error: ${(err as Error).message}`;
  }
};

$('reset-gyro').onclick = () => (basis = null);

// --- Demo: fake the cube's GYRO/MOVE events so the app can be tried without hardware ---
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

$('demo').onclick = async () => {
  btn('demo').disabled = btn('connect').disabled = true;
  player.alg = '';
  pattern = (await cube3x3x3.kpuzzle()).defaultPattern();
  moves = [];
  basis = null;
  let running = true;
  const t0 = performance.now();
  const wobble = () => {
    if (!running) return;
    const a = 0.5 * Math.sin((performance.now() - t0) / 1500); // spin around the white (GAN +Z) axis
    onGyro({ x: 0, y: 0, z: Math.sin(a / 2), w: Math.cos(a / 2) });
    requestAnimationFrame(wobble);
  };
  wobble();

  const scramble = (await randomScrambleForEvent('333')).toString().split(' ');
  for (const m of scramble) { onMove(m); await sleep(150); }
  await sleep(1000);
  const solution = (await experimentalSolve3x3x3IgnoringCenters(pattern!)).toString().split(' ');
  for (const m of solution) { onMove(m); await sleep(400); }

  running = false;
  btn('demo').disabled = btn('connect').disabled = false;
};

$('reset-state').onclick = async () => {
  await conn?.sendCubeCommand({ type: 'REQUEST_RESET' });
  player.alg = '';
  pattern = (await cube3x3x3.kpuzzle()).defaultPattern();
  moves = [];
  render();
};

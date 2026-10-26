// The Resolver's 3D cube and the scramble's 2D net (cubing/twisty + three: the heaviest code). They are built after
// the first scramble shows (loadTwisty); until then what they should show is kept here and handed over when they are.
// Also the 3D view's orientation: a 3/4 camera tilt, times the viewer's turns (arrows), times the cube's gyroscope.
// It knows nothing of the Resolver's state: main.ts says which puzzle, which model and which home view.
import type { PuzzleID, TwistyPlayer } from 'cubing/twisty';
import type { Alg } from 'cubing/alg';
import type { Quaternion, Scene } from 'three';
// Emits cubing.js's solver worker as a self-contained bundle where cubing.js looks for it (see vite.config.ts)
import searchWorkerUrl from '../node_modules/cubing/dist/lib/cubing/chunks/search-worker-entry.js?worker&url';
import { axisAngle, mul, toView, type Quat, type Vec } from './guide.ts';
import { $ } from './el.ts';

export type Model = '2x2x2' | '3x3x3';

let player: TwistyPlayer | undefined;
let net: TwistyPlayer | undefined;
let playerAlg: Alg | string = '';
let netAlg = '';
let model: Model = '3x3x3'; // TwistyPlayer can't read .puzzle back: tracked here
/** What the 3D cube shows (the moves from its start); kept for when it's built. */
export const setAlg = (alg: Alg | string) => {
  playerAlg = alg;
  if (player) player.alg = alg;
};
/** The 2D net's scrambled state (its setup alg); kept for when it's built. */
export const setNet = (alg: string) => {
  netAlg = alg;
  if (net) net.experimentalSetupAlg = alg;
};
/** The net's state now, for its big view (main.ts's #net-dialog). */
export const netState = () => netAlg;
export const setNetPuzzle = (puzzle: PuzzleID) => { if (net) net.puzzle = puzzle; };
/** A smart cube's move, animated on the 3D cube (when it's built). */
export const addMove = (move: string) => player?.experimentalAddMove(move, { cancel: false });

let twisty: Promise<void> | undefined;
/** Builds the net (for `netPuzzle`) and the 3D cube (`initial` model) once; later calls wait for the same build. */
export function loadTwisty(netPuzzle: PuzzleID, initial: Model): Promise<void> {
  return (twisty ??= import('cubing/twisty').then(({ TwistyPlayer }) => {
    // 2D net of the scrambled state (WCA scramble-sheet style: white up, green front)
    net = new TwistyPlayer({ puzzle: netPuzzle, visualization: '2D', background: 'none', controlPanel: 'none', experimentalDragInput: 'none', hintFacelets: 'none', experimentalSetupAlg: netAlg });
    $('net').append(net);
    model = initial;
    player = new TwistyPlayer({
      puzzle: model,
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

/** The 3D model: a 3x3, or a 2x2 (the Resolver's 2x2 event without a smart cube). */
export function setModel(m: Model) {
  if (!player || model === m) return;
  player.puzzle = model = m;
  scene = undefined; // the new puzzle comes with its own scene: frame() looks it up again
  to = undefined;
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

let wca = true; // the home view: the Resolver's competition orientation, else the guides' (yellow up)
let view: Quat = WCA_VIEW;
let gyro = WCA_VIEW; // rotation since last gyro calibration; identity on cubes without gyro
let target = WCA_VIEW;
let basis: Quat | null = null;
const updateTarget = () => (target = mul(mul(TILT, view), gyro));
updateTarget();

/** Back to the home view: the competition one (the Resolver) or the guides' (yellow up, green front). */
export function setHome(competition: boolean) {
  wca = competition;
  view = wca ? WCA_VIEW : DEFAULT_VIEW;
  updateTarget();
}
/** A move as the viewer sees it, turned with the view (the guides' frame). */
export const inView = (move: string) => toView(move, view);

// Arrows rotate the view in 90° steps around the displayed vertical / horizontal axes
const TURNS: Record<string, [Vec, number]> = { left: [Y, -90], right: [Y, 90], up: [X, -90], down: [X, 90] };
export function turnView(dir: string) {
  if (dir === 'reset') view = wca ? WCA_VIEW : DEFAULT_VIEW;
  else view = mul(axisAngle(TURNS[dir][0], TURNS[dir][1] * deg), view);
  updateTarget();
}

export function onGyro({ x, y, z, w }: Quat) {
  // GAN: +X red, +Y blue, +Z white -> three.js: +Y up
  const l = Math.hypot(x, y, z, w) || 1;
  const q = { x: x / l, y: z / l, z: -y / l, w: w / l };
  basis ??= { x: -q.x, y: -q.y, z: -q.z, w: q.w }; // the inverse of the first reading
  gyro = mul(basis, q);
  updateTarget();
}
/** The next gyroscope reading becomes "as it is now" (Recalibrar, or a full turn of the white face). */
export const resetGyro = () => (basis = null);

let vantage: { render(): unknown; scene: { scene(): Promise<unknown> } | null } | undefined; // Twisty3DVantage isn't exported
let scene: Scene | undefined;
let to: Quaternion | undefined; // target as a three.js quaternion, for slerp

async function frame() {
  // vantage/scene only exist once the player has rendered, so keep trying
  vantage ??= [...(await player!.experimentalCurrentVantages())][0];
  scene ??= (await vantage?.scene?.scene()) as Scene | undefined;
  // Only while the view turns towards its target: cubing.js draws its own moves, so a cube at rest costs nothing
  // (it used to redraw 60 times a second, hidden or not)
  if (scene && scene.quaternion.angleTo((to ??= scene.quaternion.clone()).set(target.x, target.y, target.z, target.w)) > 1e-4) {
    scene.quaternion.slerp(to, 0.25); // ponytail: fixed smoothing factor, tune if it feels laggy
    vantage!.render();
  }
  requestAnimationFrame(frame);
}

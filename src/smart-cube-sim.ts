// Dev only (main.ts loads it behind import.meta.env.DEV, so production drops it): a fake smart cube that goes through
// the same brand adapters as a real one. Open the app with ?simcube=moyu|qiyi|giiker|gocube, tap Conectar, then
// drive it from the console: simCube.move("R U R' U'"), simCube.gyro({ x, y, z, w }), simCube.battery(42),
// simCube.state(facelets), simCube.drop() (the cube switches off).
import type { BluetoothPuzzle } from 'cubing/bluetooth';
import type { SmartCube as BtCube } from 'btcube-web';
import { fromBtcube, fromCubing, type Brand, type SmartCube } from './smart-cube.ts';
import { SOLVED_FACELETS } from './facelets.ts';

type Fn = (v: never) => void;
// a stream that replays its last value, like btcube-web's
function stream() {
  const subs: Fn[] = [];
  let last: unknown;
  return {
    subscribe: (fn: Fn) => { subs.push(fn); if (last !== undefined) fn(last as never); },
    next: (v: unknown) => { last = v; subs.forEach((fn) => fn(v as never)); },
  };
}

const BRANDS: Record<string, Brand> = { moyu: 'MoYu', qiyi: 'QiYi', giiker: 'GiiKER', gocube: 'GoCube' };

export function simulate(kind: string): SmartCube {
  const brand = BRANDS[kind] ?? 'MoYu';
  const device = Object.assign(new EventTarget(), { name: `${brand}-SIM` }) as unknown as BluetoothDevice;
  const sim = { move(_alg: string) {}, gyro(_q: object) {}, battery(_n: number) {}, state(_f: string) {}, drop() {} };
  (globalThis as { simCube?: typeof sim }).simCube = sim;

  if (brand === 'MoYu' || brand === 'QiYi') {
    const s = { moves: stream(), state: stream(), info: stream(), orientation: stream(), connection: stream() };
    s.state.next({ type: 'status', facelets: SOLVED_FACELETS });
    s.info.next({ type: 'battery', battery: 80 });
    const cube = {
      device, macAddress: 'CC:A3:00:00:12:34', capabilities: { orientation: brand === 'MoYu' }, events: s,
      commands: { freshState: async () => {}, requestBattery: async () => {}, requestInfo: async () => s.info.next({ type: 'device', name: device.name, firmwareVersion: 'sim' }), sync: async () => {}, disconnect: async () => sim.drop() },
    };
    Object.assign(sim, {
      move: (alg: string) => alg.split(/\s+/).filter(Boolean).forEach((move) => s.moves.next({ move })),
      gyro: (quaternion: object) => s.orientation.next({ type: 'orientation', quaternion }),
      battery: (battery: number) => s.info.next({ type: 'battery', battery }),
      state: (facelets: string) => s.state.next({ type: 'status', facelets }),
      drop: () => s.connection.next({ type: 'disconnected' }),
    });
    return fromBtcube(brand, cube as unknown as BtCube);
  }

  const moves: Fn[] = [];
  const turns: Fn[] = [];
  const puzzle = {
    addAlgLeafListener: (fn: Fn) => moves.push(fn),
    addOrientationListener: (fn: Fn) => turns.push(fn),
    getPattern: async () => { throw new Error('the sim keeps no state'); }, // GiiKER's real one does: assumed solved here
    disconnect: () => sim.drop(),
  };
  Object.assign(sim, {
    move: (alg: string) => alg.split(/\s+/).filter(Boolean).forEach((m) => moves.forEach((fn) => fn({ latestAlgLeaf: m } as never))),
    gyro: (quaternion: object) => turns.forEach((fn) => fn({ quaternion } as never)),
    drop: () => device.dispatchEvent(new Event('gattserverdisconnected')),
  });
  return fromCubing(brand, device, puzzle as unknown as BluetoothPuzzle);
}

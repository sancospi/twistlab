// One smart cube, whatever the brand: the app consumes GAN's event vocabulary (gan-web-bluetooth, the cube the app was
// built and tested with) and the other brands are adapted to it. One Bluetooth chooser lists every supported brand;
// the picked device is routed by name to its library, all loaded only once a cube is picked:
// GAN -> gan-web-bluetooth (MIT), MoYu and QiYi -> btcube-web (MIT), GiiKER and GoCube -> cubing/bluetooth (MPL).
import type { GanCubeCommand, MacAddressProvider } from 'gan-web-bluetooth';
import type { BluetoothPuzzle } from 'cubing/bluetooth';
import type { SmartCube as BtCube } from 'btcube-web';
import { patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
import { closeGaps } from './gan-fix.ts';

type Quat = { x: number; y: number; z: number; w: number };
/** The part of GanCubeEvent the app reads; GAN's events are passed as they are. */
export type CubeEvent =
  | { type: 'MOVE'; move: string; localTimestamp: number | null } // null: a recovered move (GAN), not a live one
  | { type: 'FACELETS'; facelets: string } // Kociemba order, like GAN's
  | { type: 'GYRO'; quaternion: Quat } // GAN's axes: +X red, +Y blue, +Z white
  | { type: 'BATTERY'; batteryLevel: number }
  | { type: 'HARDWARE'; hardwareName?: string; softwareVersion?: string }
  | { type: 'DISCONNECT' };

export type Brand = 'GAN' | 'MoYu' | 'QiYi' | 'GiiKER' | 'GoCube';
export interface SmartCube {
  brand: Brand;
  deviceName: string;
  deviceMAC: string; // '' when the brand doesn't need one
  gyro: boolean; // sends GYRO
  facelets: boolean; // reports its state; false: it's assumed solved on connect
  events$: { subscribe(fn: (e: CubeEvent) => void): unknown }; // one subscriber, subscribed right after connecting
  sendCubeCommand(c: GanCubeCommand): Promise<void>;
  disconnect(): Promise<void>;
}

// Name prefixes as each library matches them; anything else the chooser shows is a GiiKER (matched by its service,
// cubing.js does the same).
export const brandOf = (name: string): Brand =>
  /^(GAN|MG|AiCube)/.test(name) ? 'GAN'
    : /^WCU_MY(3|0[012])/.test(name) ? 'MoYu'
      : /^(QY-QYSC|XMD-TornadoV4-i)/.test(name) ? 'QiYi'
        : /^(GoCube|Rubik)/.test(name) ? 'GoCube'
          : 'GiiKER';

const GAN_SERVICES = ['6e400001-b5a3-f393-e0a9-e50e24dc4179', '8653000a-43e6-47b7-9cb0-5fc21d4ae340', '00000010-0000-fff7-fff6-fff5fff4fff0'];
const MOYU_SERVICE = '0783b03e-7735-b5a0-1760-a305d2795cb0';
const QIYI_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb'; // as a string: Bluefy (iPhone) may reject a number
const GIIKER_SERVICE = '0000aadb-0000-1000-8000-00805f9b34fb';
const GOCUBE_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const prefixes = ['GAN', 'MG', 'AiCube', 'WCU_MY3', 'WCU_MY00', 'WCU_MY01', 'WCU_MY02', 'QY-QYSC', 'XMD-TornadoV4-i', 'GoCube', 'Rubik', 'Gi', 'Mi', 'Hi-'];

/** Bluefy, the iPhone's only browser with Web Bluetooth: its own implementation, with its quirks (requestCube). */
export const bluefy = () => /Bluefy/.test(navigator.userAgent);

/** The chooser: call it straight from the tap (Web Bluetooth needs its activation; Bluefy doesn't). */
export async function requestCube(): Promise<BluetoothDevice> {
  const options: RequestDeviceOptions = {
    filters: [...prefixes.map((namePrefix) => ({ namePrefix })), { services: [GIIKER_SERVICE] }],
    optionalServices: [...GAN_SERVICES, MOYU_SERVICE, QIYI_SERVICE, GIIKER_SERVICE, GOCUBE_SERVICE],
    // MAC addresses come in the advertisements' manufacturer data (GAN: company ids xx01, MoYu also xx00).
    // ponytail: 0x0000 left out, older Chrome (< 130) rejects it; a cube that only uses it gets the MAC prompt.
    optionalManufacturerData: Array.from({ length: 256 }, (_, i) => [i << 8, (i << 8) | 1]).flat().slice(1),
  };
  if (bluefy()) {
    // Its Bluetooth may start asleep (every request refused with a bare 2, no chooser): asking whether it is available
    // wakes it, as csTimer does; it can also never answer, hence the wait's limit. And a services filter there empties
    // the chooser: the names alone ('Gi', 'Mi', 'Hi-' are the GiiKERs).
    await Promise.race([navigator.bluetooth.getAvailability?.().catch(() => false), new Promise((r) => setTimeout(r, 3000))]);
    options.filters = prefixes.map((namePrefix) => ({ namePrefix }));
  }
  return navigator.bluetooth.requestDevice(options);
}

/** What went wrong, from whatever was thrown: an Error, or a browser's (Bluefy's) string, event or plain object. */
export function errorText(err: unknown): string {
  if (err && typeof err === 'object' && ('message' in err || 'name' in err)) {
    const { name, message } = err as Error;
    if (message) return name && name !== 'Error' ? `${name}: ${message}` : message;
    if (name) return name;
  }
  if (err && typeof err === 'object') { try { return JSON.stringify(err); } catch { /* a cycle: as a string */ } }
  return String(err);
}

// The libraries ask for a device themselves: hand them the one already picked. The method is put back as it was,
// whether on the prototype (Chrome) or on the object itself (Bluefy's may be).
export async function withDevice<T>(device: BluetoothDevice, connect: () => Promise<T>, bt: Bluetooth = navigator.bluetooth): Promise<T> {
  const own = Object.getOwnPropertyDescriptor(bt, 'requestDevice');
  Object.defineProperty(bt, 'requestDevice', { value: async () => device, configurable: true, writable: true });
  try { return await connect(); } finally {
    if (own) Object.defineProperty(bt, 'requestDevice', own);
    else delete (bt as Partial<Bluetooth>).requestDevice;
  }
}

/** The other brands report a three.js-style orientation (+Y up); GYRO carries GAN's axes (main.ts maps them back). */
export const toGanAxes = ({ x, y, z, w }: Quat): Quat => ({ x, y: -z, z: y, w });

/** Connects the picked device with its brand's library. `savedMac`: the MAC a previous connection confirmed. */
export async function connectCube(device: BluetoothDevice, macProvider: MacAddressProvider, savedMac: (name: string) => string | null): Promise<SmartCube> {
  const brand = brandOf(device.name ?? '');
  if (brand === 'GAN') {
    const { connectGanCube } = await import('gan-web-bluetooth'); // usually prefetched by the Cubo screen
    const c = await withDevice(device, () => connectGanCube(macProvider));
    closeGaps((c as unknown as { driver: unknown }).driver);
    return Object.assign(c, { brand, gyro: true, facelets: true });
  }
  if (brand === 'MoYu' || brand === 'QiYi') {
    const { connectSmartCube } = await import('btcube-web');
    return fromBtcube(brand, await connectSmartCube({
      device,
      getSavedMacAddress: async (d) => savedMac(d.name ?? ''),
      requestMacAddress: async (d) => macProvider(d, true),
    }));
  }
  const { connectSmartPuzzle } = await import('cubing/bluetooth');
  return fromCubing(brand, device, await withDevice(device, () => connectSmartPuzzle()));
}

/** MoYu, QiYi (btcube-web). Its streams replay the initial state and info, so they're wired on subscribe. */
export function fromBtcube(brand: Brand, cube: BtCube): SmartCube {
  const { events, commands } = cube;
  return {
    brand,
    deviceName: cube.device.name ?? brand,
    deviceMAC: cube.macAddress ?? '',
    gyro: cube.capabilities.orientation,
    facelets: true,
    events$: {
      subscribe(emit) {
        // the library already orders, de-duplicates and recovers moves: all of them are live
        events.moves.subscribe((m) => emit({ type: 'MOVE', move: m.move, localTimestamp: performance.now() }));
        events.state.subscribe((s) => s.facelets && emit({ type: 'FACELETS', facelets: s.facelets }));
        events.orientation?.subscribe((o) => emit({ type: 'GYRO', quaternion: toGanAxes(o.quaternion) }));
        events.info.subscribe((i) => {
          if (i.type === 'battery') emit({ type: 'BATTERY', batteryLevel: i.battery });
          if (i.type === 'device') emit({ type: 'HARDWARE', hardwareName: `${brand} ${i.name ?? cube.device.name ?? ''}`.trim(), softwareVersion: i.firmwareVersion });
        });
        events.connection?.subscribe((c) => c.type === 'disconnected' && emit({ type: 'DISCONNECT' }));
      },
    },
    async sendCubeCommand({ type }) {
      if (type === 'REQUEST_FACELETS') await commands.freshState();
      else if (type === 'REQUEST_BATTERY') await commands.requestBattery?.();
      else if (type === 'REQUEST_HARDWARE') await commands.requestInfo?.();
      else await commands.sync(); // REQUEST_RESET: the cube was solved by hand
    },
    disconnect: () => commands.disconnect(),
  };
}

/** GiiKER, GoCube (cubing.js): moves and orientation only; GiiKER's state is read on request, GoCube has none. */
export function fromCubing(brand: Brand, device: BluetoothDevice, puzzle: BluetoothPuzzle): SmartCube {
  let emit: (e: CubeEvent) => void = () => {};
  return {
    brand,
    deviceName: device.name ?? brand,
    deviceMAC: '',
    gyro: brand === 'GoCube',
    facelets: brand !== 'GoCube',
    events$: {
      subscribe(fn) {
        emit = fn;
        puzzle.addAlgLeafListener((e) => emit({ type: 'MOVE', move: e.latestAlgLeaf.toString(), localTimestamp: performance.now() }));
        puzzle.addOrientationListener((e) => emit({ type: 'GYRO', quaternion: toGanAxes(e.quaternion) }));
        device.addEventListener('gattserverdisconnected', () => emit({ type: 'DISCONNECT' }), { once: true });
      },
    },
    async sendCubeCommand({ type }) {
      if (type !== 'REQUEST_FACELETS') return;
      emit({ type: 'FACELETS', facelets: await puzzle.getPattern().then(patternToFacelets, () => SOLVED_FACELETS) });
    },
    disconnect: async () => puzzle.disconnect(),
  };
}

/** The longest a full turn of a face may take to count as a gesture. */
const GESTURE_MS = 2000;
/** Signed quarter turns of a face turn: R 1, R' -1, R2 2 (a cube that reports half turns: GiiKER), R2' -2. */
const quarters = (m: string) => (m.endsWith("2'") ? -2 : m.endsWith('2') ? 2 : m.endsWith("'") ? -1 : 1);
/**
 * A command made with the cube, without touching the screen, from the latest moves (oldest first):
 * - 'U': a full turn of the white face (U, the cube's own frame), within GESTURE_MS: recalibrate the orientation;
 * - 'D': two full turns of the yellow face (D) in a row, within twice that: mark it solved. Two, not one: held yellow up
 *   (the Academia), one full turn of the top layer is how cases are looked for.
 * Turns one way only (U U' cancels), and no solve or algorithm turns a face that many times running; net, none changes
 * the cube's state.
 */
export function gestureOf(recent: { move: string; at: number }[]): 'U' | 'D' | null {
  const last = recent.at(-1);
  const face = last?.move[0];
  if (!last || (face !== 'U' && face !== 'D')) return null;
  const [need, within] = face === 'U' ? [4, GESTURE_MS] : [8, 2 * GESTURE_MS];
  const sign = Math.sign(quarters(last.move));
  let n = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const r = recent[i];
    if (r.move[0] !== face || Math.sign(quarters(r.move)) !== sign || last.at - r.at > within) break;
    if ((n += Math.abs(quarters(r.move))) >= need) return face;
  }
  return null;
}

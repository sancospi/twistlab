// One smart cube, whatever the brand: the app consumes GAN's event vocabulary (gan-web-bluetooth, the cube the app was
// built and tested with) and the other brands are adapted to it. One Bluetooth chooser lists every supported brand;
// the picked device is routed by name to its library, all loaded only once a cube is picked:
// GAN -> gan-web-bluetooth (MIT), MoYu and QiYi -> btcube-web (MIT), GiiKER and GoCube -> cubing/bluetooth (MPL).
import type { GanCubeCommand, MacAddressProvider } from 'gan-web-bluetooth';
import type { BluetoothPuzzle } from 'cubing/bluetooth';
import type { SmartCube as BtCube } from 'btcube-web';
import { patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
import { trustFirstMove } from './gan-fix.ts';

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
const QIYI_SERVICE = 0xfff0;
const GIIKER_SERVICE = '0000aadb-0000-1000-8000-00805f9b34fb';
const GOCUBE_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const prefixes = ['GAN', 'MG', 'AiCube', 'WCU_MY3', 'WCU_MY00', 'WCU_MY01', 'WCU_MY02', 'QY-QYSC', 'XMD-TornadoV4-i', 'GoCube', 'Rubik', 'Gi', 'Mi', 'Hi-'];

/** The chooser: call it straight from the tap (Web Bluetooth needs its activation). */
export const requestCube = () => navigator.bluetooth.requestDevice({
  filters: [...prefixes.map((namePrefix) => ({ namePrefix })), { services: [GIIKER_SERVICE] }],
  optionalServices: [...GAN_SERVICES, MOYU_SERVICE, QIYI_SERVICE, GIIKER_SERVICE, GOCUBE_SERVICE],
  // MAC addresses come in the advertisements' manufacturer data (GAN: company ids xx01, MoYu also xx00).
  // ponytail: 0x0000 left out, older Chrome (< 130) rejects it; a cube that only uses it gets the MAC prompt.
  optionalManufacturerData: Array.from({ length: 256 }, (_, i) => [i << 8, (i << 8) | 1]).flat().slice(1),
});

// The libraries ask for a device themselves: hand them the one already picked.
async function withDevice<T>(device: BluetoothDevice, connect: () => Promise<T>): Promise<T> {
  const bt = navigator.bluetooth;
  bt.requestDevice = async () => device;
  try { return await connect(); } finally { delete (bt as Partial<Bluetooth>).requestDevice; } // back to the prototype's
}

/** The other brands report a three.js-style orientation (+Y up); GYRO carries GAN's axes (main.ts maps them back). */
export const toGanAxes = ({ x, y, z, w }: Quat): Quat => ({ x, y: -z, z: y, w });

/** Connects the picked device with its brand's library. `savedMac`: the MAC a previous connection confirmed. */
export async function connectCube(device: BluetoothDevice, macProvider: MacAddressProvider, savedMac: (name: string) => string | null): Promise<SmartCube> {
  const brand = brandOf(device.name ?? '');
  if (brand === 'GAN') {
    const { connectGanCube } = await import('gan-web-bluetooth'); // usually prefetched by the Cubo screen
    const c = await withDevice(device, () => connectGanCube(macProvider));
    trustFirstMove((c as unknown as { driver: unknown }).driver);
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

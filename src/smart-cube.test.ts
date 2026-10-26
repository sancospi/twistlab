import test from 'node:test';
import assert from 'node:assert/strict';
import { brandOf, errorText, gestureOf, toGanAxes, withDevice, type CubeEvent } from './smart-cube.ts';
import { simulate } from './smart-cube-sim.ts';
import { SOLVED_FACELETS } from './facelets.ts';

type Sim = { move(alg: string): void; gyro(q: object): void; battery(n: number): void; drop(): void };
const sim = () => (globalThis as unknown as { simCube: Sim }).simCube;

test('the chooser device is routed by its name', () => {
  assert.equal(brandOf('GANic4_8CA7'), 'GAN');
  assert.equal(brandOf('AiCube_1234'), 'GAN');
  assert.equal(brandOf('WCU_MY32_1A2B'), 'MoYu');
  assert.equal(brandOf('QY-QYSC-S-1A2B'), 'QiYi');
  assert.equal(brandOf('GoCube_1234'), 'GoCube');
  assert.equal(brandOf('GiC12345'), 'GiiKER');
});

test('three.js orientation -> GAN axes, as main.ts onGyro maps them back', () => {
  const q = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };
  const g = toGanAxes(q);
  assert.deepEqual({ x: g.x, y: g.z, z: -g.y, w: g.w }, q); // onGyro: { x, y: z, z: -y }
});

for (const kind of ['moyu', 'qiyi', 'giiker', 'gocube']) {
  test(`${kind}: one event stream (state, moves, gyro, battery, disconnect)`, async () => {
    const cube = simulate(kind);
    const events: CubeEvent[] = [];
    cube.events$.subscribe((e) => events.push(e));
    await cube.sendCubeCommand({ type: 'REQUEST_FACELETS' });
    sim().move("R U'");
    sim().gyro({ x: 0, y: 0, z: 0, w: 1 });
    sim().battery(42);
    await cube.disconnect();
    const types = events.map((e) => e.type);
    assert.ok(events.some((e) => e.type === 'FACELETS' && e.facelets === SOLVED_FACELETS));
    assert.deepEqual(events.filter((e) => e.type === 'MOVE').map((e) => e.type === 'MOVE' && e.move), ['R', "U'"]);
    assert.ok(events.every((e) => e.type !== 'MOVE' || e.localTimestamp !== null)); // live moves
    assert.equal(types.includes('BATTERY'), kind === 'moyu' || kind === 'qiyi'); // cubing.js reports no battery
    assert.equal(types.at(-1), 'DISCONNECT');
    assert.equal(cube.gyro, kind === 'moyu' || kind === 'gocube');
    assert.equal(cube.facelets, kind !== 'gocube');
  });
}

test('gestures: a full turn of the white face (U) within 2 s; two of the yellow one (D) within 4 s', () => {
  const at = (moves: string, step = 300) => moves.split(' ').map((move, i) => ({ move, at: 1000 + i * step }));
  assert.equal(gestureOf(at('U U U U')), 'U');
  assert.equal(gestureOf(at("U' U' U' U'")), 'U');
  assert.equal(gestureOf(at('R U U U U')), 'U'); // the last ones count
  assert.equal(gestureOf(at("U U U' U")), null); // both ways: a correction, not a full turn
  assert.equal(gestureOf(at('U U U')), null);
  assert.equal(gestureOf(at('R R R R')), null); // only the white and yellow faces
  assert.equal(gestureOf(at('U U U U', 700)), null); // 2.1 s: turning, not a command
  assert.equal(gestureOf(at('U2 U2')), 'U'); // cubes that report half turns
  assert.equal(gestureOf(at('U U2 U')), 'U');
  assert.equal(gestureOf(at("U2 U2'")), null);
  // the yellow face held on top (the Academia): one full turn is looking for a case, two are the command
  assert.equal(gestureOf(at('D D D D')), null);
  assert.equal(gestureOf(at("D' D' D' D' D' D' D' D'")), 'D');
  assert.equal(gestureOf(at('D D D D D D D D', 600)), null); // 4.2 s
});

test('errorText: a connection error says what happened, whatever the browser threw', () => {
  assert.equal(errorText(new Error('GATT failed')), 'GATT failed');
  assert.equal(errorText(new DOMException('No device', 'NetworkError')), 'NetworkError: No device');
  assert.equal(errorText('Bluetooth is off'), 'Bluetooth is off'); // Bluefy can reject with a string
  assert.equal(errorText({ code: 7 }), '{"code":7}');
  assert.equal(errorText({ name: 'SecurityError', message: '' }), 'SecurityError');
  assert.equal(errorText(undefined), 'undefined');
});

test('withDevice: the libraries get the picked device, and requestDevice is put back where it was', async () => {
  const device = { name: 'GAN12' } as BluetoothDevice;
  const real = async () => ({ name: 'real' }) as BluetoothDevice;
  const proto = { requestDevice: real }; // Chrome: on the prototype
  const chrome = Object.create(proto) as Bluetooth;
  const bluefy = { requestDevice: real } as unknown as Bluetooth; // a polyfill: its own property
  for (const bt of [chrome, bluefy]) {
    assert.equal(await withDevice(device, () => bt.requestDevice({ acceptAllDevices: true }), bt), device);
    await assert.rejects(withDevice(device, () => Promise.reject(new Error('x')), bt));
    assert.equal(bt.requestDevice, real);
  }
  assert.ok(!Object.hasOwn(chrome, 'requestDevice'));
});

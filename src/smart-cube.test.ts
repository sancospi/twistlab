import test from 'node:test';
import assert from 'node:assert/strict';
import { brandOf, toGanAxes, type CubeEvent } from './smart-cube.ts';
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

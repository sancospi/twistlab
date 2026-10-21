import test from 'node:test';
import assert from 'node:assert/strict';
import { trustFirstMove, type MoveDriver } from './gan-fix.ts';

/** The library's buffering rule in small: a move is released only when it follows lastSerial; message[0] = serial. */
function fakeDriver(lastSerial: number) {
  const d = {
    lastSerial,
    moveBuffer: [] as { serial: number }[],
    async evictMoveBuffer() {
      const out: { type: string; serial: number }[] = [];
      while (d.moveBuffer.length && ((d.moveBuffer[0].serial - d.lastSerial) & 0xff) === 1) {
        const m = d.moveBuffer.shift()!;
        d.lastSerial = m.serial;
        out.push({ type: 'MOVE', serial: m.serial });
      }
      return out;
    },
    async handleStateEvent(_conn: unknown, message: Uint8Array) {
      d.moveBuffer.push({ serial: message[0] });
      return d.evictMoveBuffer();
    },
  };
  return d satisfies MoveDriver;
}
const serials = (events: { type: string }[]) => events.map((e) => (e as { serial: number }).serial);

test('trustFirstMove: a first move behind a bogus serial-0 gap is released, and the next ones follow it', async () => {
  const d = fakeDriver(0); // firmware reported serial 0 in the state event
  trustFirstMove(d);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(120))), [120]);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(121))), [121]);
  assert.equal(d.moveBuffer.length, 0);
});

test('trustFirstMove: right serials are left alone, and a later real gap still waits for history', async () => {
  const d = fakeDriver(7);
  trustFirstMove(d);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(8))), [8]);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(11))), [], 'a move lost mid-session: the library recovers it');
  assert.equal(d.moveBuffer.length, 1);
});

test('trustFirstMove: wraps around 255 and ignores drivers it does not know', async () => {
  const d = fakeDriver(0);
  trustFirstMove(d);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(0))), [0]); // serial 0 after a wrap: lastSerial 255
  assert.doesNotThrow(() => trustFirstMove({}));
});

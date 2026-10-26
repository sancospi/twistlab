import test from 'node:test';
import assert from 'node:assert/strict';
import { closeGaps, STALL_MS, type MoveDriver } from './gan-fix.ts';

/** The library's buffering rule in small: a move is released only when it follows lastSerial. message[0] = serial,
 *  message[1] = 1 for a move recovered from history (localTimestamp null), message[2] = 1 for an event with no move. */
function fakeDriver(lastSerial: number) {
  const d = {
    lastSerial,
    moveBuffer: [] as { serial: number; localTimestamp: number | null }[],
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
      if (message[1]) d.moveBuffer.unshift({ serial: message[0], localTimestamp: null });
      else if (!message[2]) d.moveBuffer.push({ serial: message[0], localTimestamp: 0 });
      return d.evictMoveBuffer();
    },
  };
  return d satisfies MoveDriver;
}
const serials = (events: { serial?: number }[]) => events.map((e) => e.serial);
const clock = () => {
  const c = { t: 0, now: () => c.t };
  return c;
};

test('closeGaps: a first move behind a bogus serial-0 gap is released at once, and the next ones follow it', async () => {
  const d = fakeDriver(0); // firmware reported serial 0 in the state event
  closeGaps(d);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(120))), [120]);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(121))), [121]);
  assert.equal(d.moveBuffer.length, 0);
});

test('closeGaps: a later gap first waits for history, which fills it', async () => {
  const c = clock();
  const d = fakeDriver(7);
  closeGaps(d, c.now);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(8))), [8]);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(10))), [], 'a move lost mid-session: history may bring it');
  c.t += STALL_MS / 2;
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(9, 1))), [9, 10]);
});

test('closeGaps: a gap history does not fill goes on after STALL_MS, before the library would disconnect', async () => {
  const c = clock();
  const d = fakeDriver(7);
  closeGaps(d, c.now);
  await d.handleStateEvent(null, Uint8Array.of(8));
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(11))), []);
  c.t += STALL_MS / 2;
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(12))), []);
  c.t += STALL_MS / 2;
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(0, 0, 1))), [11, 12], 'any event (the gyroscope) releases them');
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(13))), [13]);
});

test('closeGaps: stale history stuck in the buffer is dropped, not played as moves', async () => {
  const c = clock();
  const d = fakeDriver(7);
  closeGaps(d, c.now);
  await d.handleStateEvent(null, Uint8Array.of(8));
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(3, 1))), []); // a history reply from an old serial
  c.t += STALL_MS;
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(0, 0, 1))), []);
  assert.equal(d.moveBuffer.length, 0);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(9))), [9]);
});

test('closeGaps: wraps around 255 and ignores drivers it does not know', async () => {
  const d = fakeDriver(0);
  closeGaps(d);
  assert.deepEqual(serials(await d.handleStateEvent(null, Uint8Array.of(0))), [0]); // serial 0 after a wrap: lastSerial 255
  assert.doesNotThrow(() => closeGaps({}));
});

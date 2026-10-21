// Workaround for gan-web-bluetooth 3.0.2 (latest) with GANic4 firmware that reports serial 0 in every state event.
// The library takes that 0 as the last move it saw, so the first live move (serial N) looks like moves 1…N were
// lost: it buffers every move while it asks the cube for that history, and once 17 are waiting it disconnects.
// The cube can't send history it no longer keeps, so the longer the cube was used before connecting, the surer the
// disconnect. Nothing is lost there: the app syncs from the full state the cube sends on connect (and re-syncs
// from it about once a second), so the first live move simply follows the last one.

interface BufferedMove { serial: number }
/** The parts of the library's protocol driver this relies on (not exported by the library). */
export interface MoveDriver {
  lastSerial: number;
  moveBuffer: BufferedMove[];
  handleStateEvent(conn: unknown, message: Uint8Array): Promise<{ type: string }[]>;
  evictMoveBuffer(conn?: unknown): Promise<{ type: string }[]>;
}

const isMoveDriver = (d: unknown): d is MoveDriver => {
  const x = d as Partial<MoveDriver> | null;
  return !!x && Array.isArray(x.moveBuffer) && typeof x.lastSerial === 'number' &&
    typeof x.handleStateEvent === 'function' && typeof x.evictMoveBuffer === 'function';
};

/** Makes the first live move follow the synced state instead of waiting for history the cube may not have. */
export function trustFirstMove(driver: unknown): void {
  if (!isMoveDriver(driver)) return; // another library version: leave it alone
  const handle = driver.handleStateEvent.bind(driver);
  let live = false;
  driver.handleStateEvent = async (conn, message) => {
    const events = await handle(conn, message);
    if (live) return events;
    if (events.some((e) => e.type === 'MOVE')) live = true; // no gap: the serials were right
    else if (driver.moveBuffer.length) { // the first move is stuck behind a gap: close it
      live = true;
      driver.lastSerial = (driver.moveBuffer[0].serial - 1) & 0xff;
      return [...events, ...(await driver.evictMoveBuffer())];
    }
    return events;
  };
}

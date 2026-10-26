// Workaround for gan-web-bluetooth 3.0.2 (latest): a gap in the move serials holds every later move until the cube
// sends the missing ones as history, and once 17 are waiting the library disconnects. Felt as moves that show up late
// or not at all, then a dropped cube. Gaps come from:
// - GANic4 firmware that reports serial 0 in every state event: the library takes it as the last move it saw, so the
//   first live move (serial N) looks like moves 1…N were lost, history the cube no longer keeps;
// - a move lost over the air later on, whose history the cube may not send (or sends too late).
// The first gap is closed at once, later ones after STALL_MS without their history. Nothing is lost for good: the app
// syncs from the full state the cube sends on connect and re-syncs from it about once a second.

/** How long a gap waits for the cube's history before the moves behind it go on without it. */
export const STALL_MS = 400;

interface BufferedMove { serial: number; localTimestamp?: number | null } // null: recovered from the cube's history
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

/** Keeps moves flowing past a gap in the serials instead of waiting (and disconnecting) for history. Every cube event
 *  (moves, the gyroscope's stream, the state about once a second) checks how long the gap has waited. */
export function closeGaps(driver: unknown, now = () => performance.now()): void {
  if (!isMoveDriver(driver)) return; // another library version: leave it alone
  const handle = driver.handleStateEvent.bind(driver);
  let live = false; // a move went through: from then on a gap first gets its chance at history
  let since: number | null = null; // when the moves started waiting
  driver.handleStateEvent = async (conn, message) => {
    const events = await handle(conn, message);
    if (events.some((e) => e.type === 'MOVE')) live = true;
    if (!driver.moveBuffer.length) return (since = null), events;
    since ??= now();
    if (live && now() - since < STALL_MS) return events;
    const late = live;
    live = true;
    since = null;
    // what history half-recovered (or recovered from a stale serial) goes: the next re-sync covers it
    while (driver.moveBuffer[0]?.localTimestamp === null) driver.moveBuffer.shift();
    if (!driver.moveBuffer.length) return events;
    if (late) console.warn(`GAN: moves from serial ${driver.moveBuffer[0].serial} went on without the ones before (last ${driver.lastSerial})`);
    driver.lastSerial = (driver.moveBuffer[0].serial - 1) & 0xff;
    return [...events, ...(await driver.evictMoveBuffer())];
  };
}

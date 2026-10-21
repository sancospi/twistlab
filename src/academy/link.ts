// Bridge from the smart cube (owned by main.ts) to the academy dialog in use (practice, quiz).
import type { KPattern } from 'cubing/kpuzzle';

export interface CubeListener {
  move(move: string): void; // after the mirrored pattern was updated with it
  sync(reset?: boolean): void; // the state was re-synced, reset (by the user: `reset`), connected or disconnected
}

export const cube = {
  /** Mirrored cube state (cube frame); null = no cube, or not synced yet. main.ts sets it. */
  pattern: (): KPattern | null => null,
  /** Cube-frame move -> its name for the user, as in the Guía (follows the 3D view). main.ts sets it. */
  label: (move: string): string => move,
  /** The open dialog that wants the cube's events. */
  listener: null as CubeListener | null,
};

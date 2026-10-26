// Guided execution of an algorithm on the real cube: one token at a time, from the quarter turns it reports
// (a half turn reported whole counts as its two quarters).
import { amount, invertMove, SUFFIX, type Step } from '../notation.ts';

// Its users' policy (practice.ts, lessonView.ts), kept here so they agree:
export const MAX_UNDO = 4; // more pending corrections (undo) than this: easier to set the case up again
export const REDO_MS = 1500; // how long "too many mistakes" stays up after re-planning

export class StepFollower {
  readonly steps: Step[];
  #index = 0;
  #need = new Map<string, number>(); // face -> turn still owed, mod 4 (2 = half turn, either way)
  #undo: string[] = [];

  constructor(steps: Step[]) {
    this.steps = steps;
    this.#load();
  }

  get index(): number { return this.#index; }
  get done(): boolean { return this.#index >= this.steps.length; }
  get undo(): string[] { return [...this.#undo]; }

  remaining(): string[] {
    return [...this.#need].filter(([, n]) => n).map(([face, n]) => face + SUFFIX[n]);
  }

  feed(move: string): 'ok' | 'step' | 'done' | 'wrong' {
    if (amount(move) === 2) {
      // GiiKER reports a half turn whole ("R2", "R2'"): two quarter turns that way, wrong if the first one was.
      const quarter = move[0] + (move.endsWith("'") ? "'" : '');
      const first = this.feed(quarter);
      const second = this.feed(quarter);
      return first === 'wrong' ? first : second;
    }
    if (this.#undo.length && move === this.#undo.at(-1)) {
      this.#undo.pop();
      return 'ok';
    }
    const face = move[0];
    const d = move.endsWith("'") ? -1 : 1;
    const n = this.#need.get(face) ?? 0;
    // A half turn takes either direction; once started, only the same direction finishes it.
    if (this.#undo.length || !(n === 2 || (n === 1 && d === 1) || (n === 3 && d === -1))) {
      this.#undo.push(invertMove(move));
      // Four wrong quarter turns of one face in one direction are a full turn: nothing left to undo.
      if (this.#undo.length >= 4 && this.#undo.slice(-4).every((m) => m === this.#undo.at(-1))) this.#undo.length -= 4;
      return 'wrong';
    }
    this.#need.set(face, (n - d + 4) % 4);
    if (this.remaining().length) return 'ok';
    this.#index++;
    this.#load();
    return this.done ? 'done' : 'step';
  }

  // Rotations need no turn on the cube, so they're skipped.
  #load() {
    while (!this.done && !this.steps[this.#index].moves.length) this.#index++;
    const moves = this.done ? [] : this.steps[this.#index].moves;
    this.#need = new Map(moves.map((m) => [m[0], amount(m)]));
  }
}

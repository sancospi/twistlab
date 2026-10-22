// Guided solve: follow a solution move by move, in the viewer's frame of reference.
import { KPattern } from 'cubing/kpuzzle';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { t, type MessageKey } from './i18n.ts';
import { merge } from './notation.ts';

// Rotations as unit quaternions: the few operations the 3D view and toView need, without loading three.js for the
// Resolver (three's Quaternion has the same x/y/z/w, so either can be passed where a Quat is read).
export type Quat = { x: number; y: number; z: number; w: number };
export type Vec = [number, number, number];
/** a·b: b's rotation, then a's (three: a.multiply(b); b.premultiply(a)). */
export const mul = (a: Quat, b: Quat): Quat => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});
export const axisAngle = ([x, y, z]: Vec, angle: number): Quat => {
  const s = Math.sin(angle / 2);
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(angle / 2) };
};
/** v rotated by q (three: v.applyQuaternion(q)). */
export function rotate([x, y, z]: Vec, q: Quat): Vec {
  const tx = 2 * (q.y * z - q.z * y), ty = 2 * (q.z * x - q.x * z), tz = 2 * (q.x * y - q.y * x);
  return [x + q.w * tx + q.y * tz - q.z * ty, y + q.w * ty + q.z * tx - q.x * tz, z + q.w * tz + q.x * ty - q.y * tx];
}

// Face normals in the puzzle's own frame (white U, green F, red R), as cubing.js renders it.
const FACES: Record<string, Vec> = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };

/** Rename a move from the cube's frame to the face it's on for someone looking at it under `view`. */
export function toView(move: string, view: Quat): string {
  const [x, y, z] = rotate(FACES[move[0]], view);
  return Object.keys(FACES).find((f) => FACES[f][0] * x + FACES[f][1] * y + FACES[f][2] * z > 0.9)! + move.slice(1);
}

/** Spoken form of a move ("Cara derecha, antihorario"), for the viewer's face names. */
export const describe = (move: string) =>
  t('guide.move', {
    face: t(`guide.face.${move[0]}` as MessageKey),
    turn: t(move.endsWith('2') ? 'guide.turn.half' : move.endsWith("'") ? 'guide.turn.ccw' : 'guide.turn.cw'),
  });

/** Remaining solution (cube frame); `half` is the quarter turn still owed to finish a half-turn step. */
export type Guide = { steps: string[]; half: string | null };

export const nextStep = (g: Guide) => g.half ?? g.steps[0];

/** Feed a move done on the cube: the advanced guide, or null if it went off plan (re-plan then). */
export function follow(g: Guide, move: string): Guide | null {
  if (g.half) return move === g.half ? { steps: g.steps.slice(1), half: null } : null;
  const next = g.steps[0];
  if (!next) return null;
  if (next.endsWith('2')) return move[0] === next[0] ? { steps: g.steps, half: move } : null; // R2 = R R or R' R'
  return move === next ? { steps: g.steps.slice(1), half: null } : null;
}

/** A pattern whose solution is the path from `from` to `to`, so the solver can aim at any target state. */
export function relativePattern(from: KPattern, to: KPattern): KPattern {
  return KPattern.fromTransformation(to.experimentalToTransformation()!.invert().applyTransformation(from.experimentalToTransformation()!));
}

/** Solver used to plan: the moves from `p` to solved (centers ignored). */
export type Planner = (p: KPattern) => Promise<string[]>;
const solve: Planner = async (p) => (await experimentalSolve3x3x3IgnoringCenters(p)).toString().split(' ').filter(Boolean);
const isSolved = (p: KPattern) => p.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
const invert = (m: string) => (m.endsWith('2') ? m : m.endsWith("'") ? m[0] : `${m}'`);

/**
 * Walks the cube to a target state (null = solved), step by step: plans from the current state,
 * advances on each matching move, and re-plans when the cube goes off plan or is re-synced.
 * `getPattern` is the mirrored cube state (cube frame); `onChange` fires when a new plan arrives.
 */
export class PathGuide {
  guide: Guide | null = null;
  goal: KPattern | null = null; // null = solved
  total = 0; // length of the current plan, for "step n of total"
  #pending = false; // the target is still being produced: nothing to plan for or reach yet
  #hint: string[] | null = null; // a known route to try before the solver (used once, if it's valid)
  #startId = 0;
  #planId = 0;
  readonly #getPattern: () => KPattern | null;
  readonly #onChange: () => void;
  readonly #plan: Planner;

  constructor(getPattern: () => KPattern | null, onChange: () => void, plan: Planner = solve) {
    this.#getPattern = getPattern;
    this.#onChange = onChange;
    this.#plan = plan;
  }

  /** Starts guiding; the target may still be computing (e.g. a random state), the guide shows "planning" meanwhile.
   *  `hint` is a known route (e.g. an algorithm backwards from solved), used when it really leads to the target:
   *  the solver's path is valid but rarely the short, human one. */
  async start(target: KPattern | null | Promise<KPattern | null>, hint?: string[]): Promise<void> {
    const id = ++this.#startId;
    this.guide = { steps: [], half: null };
    this.total = 0;
    this.#pending = true;
    this.#onChange();
    const goal = await target;
    if (id !== this.#startId) return; // stopped or restarted meanwhile
    this.goal = goal;
    this.#pending = false;
    this.#hint = hint ?? null;
    await this.replan();
  }

  stop(): void {
    this.#startId++;
    this.#planId++;
    this.#pending = false;
    this.#hint = null;
    this.guide = null;
  }

  /** Feed a move after the mirrored pattern was updated with it. */
  onMove(move: string): void {
    if (!this.guide) return;
    const advanced = follow(this.guide, move);
    if (advanced) {
      this.guide = advanced;
      // the plan ran out away from the target (it was made for a state that has since been corrected): plan again
      if (!advanced.steps.length && !advanced.half && !this.reached()) void this.replan();
      return;
    }
    // Off plan: undo that turn, then carry on with the rest of the plan — one extra step instead of a fresh
    // solve (often ~20 moves). The solver still runs, and its plan wins only if it's shorter.
    const { steps, half } = this.guide;
    const rest = half ? [half, ...steps.slice(1)] : steps;
    this.guide = { steps: rest.length ? merge([invert(move), ...rest]) : [], half: null }; // no plan yet: wait for one
    this.total = Math.max(this.total, this.guide.steps.length);
    void this.replan(rest.length > 0);
  }

  /** Plans from the current state, e.g. after the state was corrected: the old plan no longer applies.
   *  With `onlyIfShorter`, the current plan is still valid and is only replaced by a shorter one. */
  async replan(onlyIfShorter = false): Promise<void> {
    const p = this.#getPattern();
    const id = ++this.#planId;
    if (!this.guide || !p || this.#pending) return;
    const hint = this.#hint;
    this.#hint = null; // a hint is a route from one particular state
    const useHint = !!hint && this.#leadsToGoal(p, hint);
    if (!onlyIfShorter && !useHint && (this.guide.steps.length || this.guide.half)) {
      // the old plan is for another state: drop it while the solver works, so moves meanwhile re-plan from scratch
      this.guide = { steps: [], half: null };
      this.#onChange();
    }
    const steps = useHint ? hint : await this.#plan(this.goal ? relativePattern(p, this.goal) : p);
    if (!this.guide || this.#getPattern() !== p || id !== this.#planId) return; // cancelled, or superseded by a newer plan / move
    if (onlyIfShorter && steps.length >= this.guide.steps.length) return;
    this.guide = { steps, half: null };
    this.total = steps.length;
    this.#onChange(); // an empty plan means the target is already reached
  }

  #leadsToGoal(p: KPattern, moves: string[]): boolean {
    const end = p.applyAlg(moves.join(' '));
    return this.goal ? end.isIdentical(this.goal) : isSolved(end);
  }

  /** Whether the cube is at the target (the caller decides what happens next, usually stop()). */
  reached(): boolean {
    const p = this.#getPattern();
    return !!this.guide && !this.#pending && !!p && (this.goal ? p.isIdentical(this.goal) : isSolved(p));
  }
}

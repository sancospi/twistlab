// Guided solve: follow a solution move by move, in the viewer's frame of reference.
import { Quaternion, Vector3 } from 'three';
import { KPattern } from 'cubing/kpuzzle';

// Face normals in the puzzle's own frame (white U, green F, red R), as cubing.js renders it.
const FACES: Record<string, Vector3> = {
  U: new Vector3(0, 1, 0), D: new Vector3(0, -1, 0),
  R: new Vector3(1, 0, 0), L: new Vector3(-1, 0, 0),
  F: new Vector3(0, 0, 1), B: new Vector3(0, 0, -1),
};

/** Rename a move from the cube's frame to the face it's on for someone looking at it under `view`. */
export function toView(move: string, view: Quaternion): string {
  const n = FACES[move[0]].clone().applyQuaternion(view);
  return Object.keys(FACES).find((f) => FACES[f].dot(n) > 0.9)! + move.slice(1);
}

const NAMES: Record<string, string> = { U: 'arriba', D: 'abajo', R: 'derecha', L: 'izquierda', F: 'frente', B: 'atrás' };

export const describe = (move: string) =>
  `Cara ${NAMES[move[0]]}, ${move.endsWith('2') ? 'media vuelta' : move.endsWith("'") ? 'antihorario' : 'horario'}`;

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

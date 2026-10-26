// The white cross, solved optimally. Only its 4 edges matter, so instead of searching KPatterns we BFS once
// over where those 4 edges are (slot + flip): 12·11·10·9·16 = 190080 states, a distance table in a Uint8Array.
// Centers are fixed, so the cross must match them: no AUF of the cross counts as solved.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import type { Face } from '../notation.ts';

export type CrossFace = 'U' | 'D';

// cubing.js EDGES slot order; the first four touch U, the next four touch D.
const HOME: Record<CrossFace, number[]> = { U: [0, 1, 2, 3], D: [4, 5, 6, 7] };
const FACES: Face[] = ['U', 'D', 'R', 'L', 'F', 'B'];
const MOVES = FACES.flatMap((f) => [f, f + "'", f + '2']);

// State = 4 slots (base 12) then 4 flip bits. ponytail: 12^4·16 indices (331776 bytes) instead of ranking
// permutations densely; the unreachable ones (two edges in one slot) just stay UNSEEN.
const SIZE = 12 ** 4 * 16;
const UNSEEN = 255;
const encode = (slots: number[], flips: number[]) =>
  (((slots[0] * 12 + slots[1]) * 12 + slots[2]) * 12 + slots[3]) * 16 + (flips[0] | (flips[1] << 1) | (flips[2] << 2) | (flips[3] << 3));

/** Per move: where the edge in each slot goes, and the flip it picks up. */
export type EdgeTable = { to: number[]; flip: number[] };

let tables: EdgeTable[] | null = null;
/** From cubing's own move definitions: slot i receives the piece of slot permutation[i], flipped by orientationDelta[i]. */
export function edgeTables(kpuzzle: KPuzzle): EdgeTable[] {
  return (tables ??= MOVES.map((m) => {
    const { permutation, orientationDelta } = kpuzzle.moveToTransformation(m).transformationData.EDGES;
    const to: number[] = [], flip: number[] = [];
    permutation.forEach((from, i) => ((to[from] = i), (flip[from] = orientationDelta[i])));
    return { to, flip };
  }));
}

// Integer arithmetic only: the BFS calls this 190080·18 times, and arrays per call cost it ~3x (~120 ms vs ~40 in node).
function step(s: number, t: EdgeTable): number {
  let n = s >> 4, out = 0, flips = 0;
  for (let i = 3, place = 16; i >= 0; i--, place *= 12) {
    const x = n % 12;
    n = (n - x) / 12;
    out += t.to[x] * place;
    flips |= (((s >> i) & 1) ^ t.flip[x]) << i;
  }
  return out + flips;
}

const dist: Partial<Record<CrossFace, Uint8Array>> = {};
/** Distance-to-cross of every state, built once per face (BFS from solved). */
export function crossTable(kpuzzle: KPuzzle, face: CrossFace): Uint8Array {
  const cached = dist[face];
  if (cached) return cached;
  const t = edgeTables(kpuzzle);
  const d = new Uint8Array(SIZE).fill(UNSEEN);
  let frontier = [encode(HOME[face], [0, 0, 0, 0])];
  d[frontier[0]] = 0;
  for (let depth = 1; frontier.length; depth++) {
    const next: number[] = [];
    for (const s of frontier) for (const m of t) {
      const n = step(s, m);
      if (d[n] === UNSEEN) (d[n] = depth), next.push(n);
    }
    frontier = next;
  }
  return (dist[face] = d);
}

/** Integer state of the 4 cross edges of `p` (slots and flips, in HOME order). */
export function crossStateOf(p: KPattern, face: CrossFace): number {
  const { pieces, orientation } = p.patternData.EDGES;
  const slots = HOME[face].map((piece) => pieces.indexOf(piece));
  return encode(slots, slots.map((s) => orientation[s]));
}

export const crossDistance = (p: KPattern, face: CrossFace): number => crossTable(p.kpuzzle, face)[crossStateOf(p, face)];
export const crossSolved = (p: KPattern, face: CrossFace): boolean => crossDistance(p, face) === 0;

// Hard to see while solving: turns of the cross face itself (it's underneath) and of the back.
const awkward = (moves: string[], face: CrossFace) => moves.filter((m) => m[0] === face || m[0] === 'B').length;

/**
 * Up to `max` distinct optimal solutions (face turns, in `p`'s frame). Sequences are canonical: no face twice
 * in a row, and opposite faces in one fixed order (U D, never D U), so no two are the same turns reordered.
 * Order: fewest cross-face/back turns, then the MOVES order.
 */
export function solveCross(p: KPattern, face: CrossFace, max = 3): string[][] {
  const t = edgeTables(p.kpuzzle);
  const d = crossTable(p.kpuzzle, face);
  const found: number[][] = [];
  const LIMIT = 2000; // ponytail: caps the enumeration; worst states have far fewer optimal paths in practice
  const walk = (s: number, path: number[]) => {
    if (found.length >= LIMIT) return;
    if (d[s] === 0) return void found.push([...path]);
    const prev = path.length ? Math.floor(path.at(-1)! / 3) : -1;
    for (let m = 0; m < t.length; m++) {
      const f = Math.floor(m / 3);
      if (f === prev || (prev >= 0 && f >> 1 === prev >> 1 && f < prev)) continue;
      const n = step(s, t[m]);
      if (d[n] === d[s] - 1) path.push(m), walk(n, path), path.pop();
    }
  };
  walk(crossStateOf(p, face), []);
  return found
    .map((ms) => ms.map((m) => MOVES[m]))
    .map((moves, i) => ({ moves, i, cost: awkward(moves, face) }))
    .sort((a, b) => a.cost - b.cost || a.i - b.i)
    .slice(0, max)
    .map((x) => x.moves);
}

/**
 * Moves E that bring a real scrambled state S to cross distance exactly k: the first d(S)-k turns of an
 * optimal cross solution, so the rest of the cube stays a realistic scramble. null when d(S) < k.
 */
export function crossCase(s: KPattern, face: CrossFace, k: number): string[] | null {
  const d = crossDistance(s, face);
  if (d < k) return null;
  return d === k ? [] : solveCross(s, face, 1)[0].slice(0, d - k);
}

/** Deterministic random-move scramble (tests); the browser uses cubing's random333Pattern instead. */
export function seededScramble(kpuzzle: KPuzzle, seed: number, length = 25): KPattern {
  let a = seed >>> 0;
  const rng = () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 2 ** 32); // LCG: tests only need variety
  const moves: string[] = [];
  while (moves.length < length) {
    const m = MOVES[Math.floor(rng() * MOVES.length)];
    if (m[0] !== moves.at(-1)?.[0]) moves.push(m);
  }
  return kpuzzle.defaultPattern().applyAlg(moves.join(' '));
}

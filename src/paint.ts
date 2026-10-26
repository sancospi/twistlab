// "Pinta tu cubo": a state painted sticker by sticker, checked before it's solved (the screen is paint-view.ts).
// The state is a 54-char Kociemba string in the USER frame (yellow up, green front), as in diagram.ts: each letter
// is the face whose colour the sticker has, '.' a sticker not painted yet. Centres are fixed.
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets, SOLVED_FACELETS } from './facelets.ts';
import { CENTERS, PIECES } from './academy/diagram.ts';
import { tokenize, type Face } from './notation.ts';

export const BLANK = '.';
export const EMPTY = [...SOLVED_FACELETS].map((c, i) => (CENTERS.includes(i) ? c : BLANK)).join('');

/** A painting that can be stored and painted on: 54 stickers, centres in place. */
/** A scramble as a painting of this net (yellow up): scrambles are done white up, green front (WCA), so its turns are
 *  seen after z2 (R↔L, U↔D). Null unless it is face turns only: slices and rotations would move the centers. */
export function scramblePainting(kpuzzle: KPuzzle, scramble: string): string | null {
  let tokens: string[];
  try { tokens = tokenize(scramble); } catch { return null; }
  if (!tokens.length || !tokens.every((m) => /^[URFDLB](2'?|')?$/.test(m))) return null;
  return patternToFacelets(kpuzzle.defaultPattern().applyAlg(`z2 ${tokens.join(' ')} z2`));
}

export const isPainting = (s: string): boolean => /^[URFDLB.]{54}$/.test(s) && CENTERS.every((i) => s[i] === SOLVED_FACELETS[i]);

export type Problem =
  | { kind: 'blank'; n: number } // stickers still to paint
  | { kind: 'count'; face: Face; n: number } // a colour that isn't there 9 times
  | { kind: 'piece' | 'repeated'; stickers: number[] } // no such piece / the same piece twice
  | { kind: 'twist' | 'flip' | 'parity' }; // a corner twisted, an edge flipped, two pieces swapped

const CORNERS = PIECES.slice(0, 8);
const EDGES = PIECES.slice(8);
const home = (slot: number[]) => slot.map((i) => SOLVED_FACELETS[i]).join('');

/** The piece in a slot and its orientation (Kociemba: where its U/D sticker is; for edges, flipped or not), or null if no piece looks like that. */
function identify(f: string, slot: number[], homes: string[]): { piece: number; o: number } | null {
  const s = slot.map((i) => f[i]).join('');
  for (let o = 0; o < s.length; o++) {
    const piece = homes.indexOf(s.slice(o) + s.slice(0, o)); // a mirror-image corner matches no rotation
    if (piece >= 0) return { piece, o };
  }
  return null;
}

const parity = (perm: number[]) => perm.reduce((p, a, i) => p + perm.slice(i + 1).filter((b) => b < a).length, 0) % 2;

/** What makes the painting impossible to solve; [] when it's a real cube state. Each step only runs once the one before passes. */
export function validate(f: string): Problem[] {
  const problems: Problem[] = [];
  const blank = [...f].filter((c) => c === BLANK).length;
  if (blank) problems.push({ kind: 'blank', n: blank });
  for (const face of [...'URFDLB'] as Face[]) {
    const n = [...f].filter((c) => c === face).length;
    if (n > 9 || (n < 9 && !blank)) problems.push({ kind: 'count', face, n });
  }
  if (problems.length) return problems;
  const read = (slots: number[][]) => {
    const homes = slots.map(home);
    const first = new Map<number, number[]>(); // piece -> the slot it was first seen in
    return slots.map((slot) => {
      const p = identify(f, slot, homes);
      if (!p) problems.push({ kind: 'piece', stickers: slot });
      else if (first.has(p.piece)) problems.push({ kind: 'repeated', stickers: [...first.get(p.piece)!, ...slot] });
      else first.set(p.piece, slot);
      return p!;
    });
  };
  const corners = read(CORNERS);
  const edges = read(EDGES);
  if (problems.length) return problems;
  const sum = (ps: { o: number }[]) => ps.reduce((a, p) => a + p.o, 0);
  if (sum(corners) % 3) problems.push({ kind: 'twist' });
  if (sum(edges) % 2) problems.push({ kind: 'flip' });
  if (parity(corners.map((p) => p.piece)) !== parity(edges.map((p) => p.piece))) problems.push({ kind: 'parity' });
  return problems;
}

/** Where each face lies in the net, in 3x3 blocks (column, row), Kociemba order U R F D L B: as diagram.ts's netSVG. */
export const NET_AT: [number, number][] = [[1, 0], [2, 1], [1, 1], [1, 2], [0, 1], [3, 1]];
const cell = (i: number): [number, number] => {
  const [c, r] = NET_AT[Math.floor(i / 9)];
  return [c * 3 + (i % 3), r * 3 + Math.floor((i % 9) / 3)];
};
const AT = new Map(Array.from({ length: 54 }, (_, i) => [cell(i).join(), i]));

/** The sticker next to `i` in the net (arrow keys). Gaps are skipped; the row of side faces wraps around (L ← B), as on the cube. */
export function neighbour(i: number, dx: number, dy: number): number {
  let [x, y] = cell(i);
  for (let step = 0; step < 12; step++) {
    x += dx;
    y += dy;
    if (y >= 3 && y <= 5) x = (x + 12) % 12;
    if (x < 0 || x > 11 || y < 0 || y > 8) return i;
    const j = AT.get(`${x},${y}`);
    if (j !== undefined) return j;
  }
  return i;
}

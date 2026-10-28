// How long an algorithm takes to execute, estimated for a right-handed solver in the usual home grip (fingertricks.ts):
// what it costs to do R and U only versus using F, L, D, B, slices or rotations. One unit = one comfortable turn (an
// R or U quarter turn); the others weigh more (from common practice: L is the weaker hand for a right-hander, B and
// D need fingers that do less, a y or z rotation stops the hands and the eyes), and a regrip that fingertricks.ts finds adds
// its own cost. Seconds at a mid pace (REF_TPS comfortable turns per second), shown to the tenth: an estimate to
// compare the algorithms of one case, not anyone's real time; two with the same tenth count as equally fast.
// ponytail: fixed weights and pace; the user's own measured times per algorithm would replace them.
import { fingertricks } from './fingertricks.ts';
import { algTags, TOKEN } from './notation.ts';

export const REF_TPS = 7;

// [quarter turn, half turn] per move, in comfortable turns (multiples of 0.1: algUnits rounds the float noise away)
const WEIGHT: Record<string, [number, number]> = {
  R: [1, 1.4], U: [1, 1.2], // the right wrist; index flicks (U2 a double flick)
  L: [1.2, 1.6], F: [1.2, 1.7], D: [1.2, 1.8], M: [1.2, 1.5], // the left wrist, a thumb or index on F, a ring finger
  B: [1.6, 2.2], S: [1.6, 2], E: [1.6, 2],
  r: [1.1, 1.5], l: [1.3, 1.7], u: [1.4, 1.9], d: [1.4, 1.9], f: [1.4, 1.9], b: [1.8, 2.4], // two layers: a bit more
  y: [2, 2.5], z: [2, 2.5], // a rotation: the hands stop and the eyes lose the pieces
  x: [1, 1.4], // tilting the cube (PLL Aa, E, Ja): both wrists at once, like a wrist turn
};
const REGRIP = 1.5; // changing grip and going back home
const ROTATION = /^[xyz]/;

/** The algorithm's cost in comfortable turns. Rotations after its last turn are free: the case is solved by then,
 *  nobody does them (PLL Aa's closing x′). */
export function algUnits(tokens: string[]): number {
  const hints = fingertricks(tokens);
  let end = tokens.length;
  while (end && ROTATION.test(tokens[end - 1])) end--;
  const sum = tokens.slice(0, end).reduce((sum, tok, i) => {
    const [, base, suffix] = tok.match(TOKEN)!;
    const key = base.endsWith('w') ? base[0].toLowerCase() : base; // Rw = r
    return sum + WEIGHT[key][suffix.startsWith('2') ? 1 : 0] + (hints[i].regrip ? REGRIP : 0);
  }, 0);
  return Math.round(sum * 10) / 10;
}

/** Estimated seconds at REF_TPS, in tenths (the precision shown): 8 = "0.8 s". */
export const algTenths = (tokens: string[]): number => Math.round((algUnits(tokens) * 10) / REF_TPS);

/** "0.8": tenths as seconds with a dot, like formatTime. */
export const formatTenths = (n: number): string => (n / 10).toFixed(1);

/** The moves an algorithm uses besides R and U, in order of appearance ("F", "L", "y"…): what it trades R and U for. */
export function otherMoves(tokens: string[]): string[] {
  const bases = tokens.map((tok) => tok.match(TOKEN)![1]).filter((b) => b !== 'R' && b !== 'U');
  return [...new Set(bases)];
}

export interface Timed { alg: string; tokens: string[]; units: number; tenths: number; ru: boolean }

export const timed = (alg: string, tokens: string[]): Timed =>
  ({ alg, tokens, units: algUnits(tokens), tenths: algTenths(tokens), ru: algTags(tokens).includes('ru') });

/** RU-only or not, which one is faster for a case: `ru` (R and U only), `other` (another move pays off) or `tie` (the
 *  same tenth); `saved` = the tenths the faster side saves. Null without both an RU-only and another algorithm. */
export interface RuVerdict { winner: 'ru' | 'other' | 'tie'; ru: Timed; other: Timed; saved: number }

export function ruVerdict(algs: Timed[]): RuVerdict | null {
  const fastest = (xs: Timed[]) => xs.reduce<Timed | null>((a, b) => (!a || b.units < a.units ? b : a), null);
  const ru = fastest(algs.filter((a) => a.ru));
  const other = fastest(algs.filter((a) => !a.ru));
  if (!ru || !other) return null;
  const diff = other.tenths - ru.tenths;
  return { winner: diff === 0 ? 'tie' : diff > 0 ? 'ru' : 'other', ru, other, saved: Math.abs(diff) };
}

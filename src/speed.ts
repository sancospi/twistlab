// How long an algorithm takes to execute, estimated for a right-handed solver in the usual home grip (fingertricks.ts):
// what it costs to do R and U only versus using F, L, D, B, slices or rotations. One unit = one comfortable turn (an
// R or U quarter turn); the others weigh more (from common practice: L is the weaker hand for a right-hander, B and
// D need fingers that do less, a rotation stops the hands and the eyes), and a regrip that fingertricks.ts finds adds
// its own cost. Seconds at a mid pace (REF_TPS comfortable turns per second): an estimate to compare the algorithms
// of one case, not anyone's real time.
// ponytail: fixed weights and pace; the user's own measured times per algorithm would replace them.
import { fingertricks } from './fingertricks.ts';
import { algTags, TOKEN } from './notation.ts';

export const REF_TPS = 7;
/** Below this difference (seconds) two algorithms count as equally fast: the estimate isn't finer than that. */
export const TIE_S = 0.1;

// [quarter turn, half turn] per move, in comfortable turns
const WEIGHT: Record<string, [number, number]> = {
  R: [1, 1.4], U: [1, 1.2], // the right wrist; index flicks (U2 a double flick)
  L: [1.2, 1.6], F: [1.2, 1.7], D: [1.2, 1.8], M: [1.2, 1.5], // the left wrist, a thumb or index on F, a ring finger
  B: [1.6, 2.2], S: [1.6, 2], E: [1.6, 2],
  r: [1.1, 1.5], l: [1.3, 1.7], u: [1.4, 1.9], d: [1.4, 1.9], f: [1.4, 1.9], b: [1.8, 2.4], // two layers: a bit more
  x: [2, 2.5], y: [2, 2.5], z: [2, 2.5], // a rotation: the hands stop and the eyes lose the pieces
};
const REGRIP = 1.5; // changing grip and going back home

/** The algorithm's cost in comfortable turns. */
export function algUnits(tokens: string[]): number {
  const hints = fingertricks(tokens);
  return tokens.reduce((sum, tok, i) => {
    const [, base, suffix] = tok.match(TOKEN)!;
    const key = base.endsWith('w') ? base[0].toLowerCase() : base; // Rw = r
    return sum + WEIGHT[key][suffix.startsWith('2') ? 1 : 0] + (hints[i].regrip ? REGRIP : 0);
  }, 0);
}

/** Estimated seconds at REF_TPS. */
export const algSeconds = (tokens: string[]): number => algUnits(tokens) / REF_TPS;

/** "0.8": seconds with a dot, like formatTime. */
export const formatSeconds = (s: number): string => Math.abs(s).toFixed(1);

const isRu = (tokens: string[]) => algTags(tokens).includes('ru');

/** The moves an algorithm uses besides R and U, in order of appearance ("F", "L", "y"…): what it trades R and U for. */
export function otherMoves(tokens: string[]): string[] {
  const bases = tokens.map((tok) => tok.match(TOKEN)![1]).filter((b) => b !== 'R' && b !== 'U');
  return [...new Set(bases)];
}

export interface Timed { alg: string; tokens: string[]; seconds: number; ru: boolean }

/** RU-only or not, which one is faster for a case: `ru` (R and U only), `other` (another move pays off) or `tie`
 *  (within TIE_S); `saved` = seconds the faster side saves. Null without both an RU-only and another algorithm. */
export interface RuVerdict { winner: 'ru' | 'other' | 'tie'; ru: Timed; other: Timed; saved: number }

export const timed = (alg: string, tokens: string[]): Timed => ({ alg, tokens, seconds: algSeconds(tokens), ru: isRu(tokens) });

export function ruVerdict(algs: Timed[]): RuVerdict | null {
  const fastest = (xs: Timed[]) => xs.reduce<Timed | null>((a, b) => (!a || b.seconds < a.seconds ? b : a), null);
  const ru = fastest(algs.filter((a) => a.ru));
  const other = fastest(algs.filter((a) => !a.ru));
  if (!ru || !other) return null;
  const diff = other.seconds - ru.seconds;
  return { winner: Math.abs(diff) < TIE_S ? 'tie' : diff > 0 ? 'ru' : 'other', ru, other, saved: Math.abs(diff) };
}

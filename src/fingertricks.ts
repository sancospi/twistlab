// Fingertrick suggestions for an algorithm (user frame), in the usual right-handed home grip: thumbs on F, fingers on
// B, each hand on its side. Data-driven: each move takes its hint from a table, picked by where the wrists are:
// - right: net quarter turns the right wrist has made since the home grip (R = +1, R' = -1, mod 4); left the same
//   for the left hand, in mirror (L' = +1), so the rules read the same for both hands.
// - regrip: the hands change grip before the move. F needs one unless it comes after R' (the right index is then on
//   F: sledgehammer, T-perm, J-perm); B unless the right wrist is home; F' and B' unless the left one is; S and E always.
// - home: the hands go back to the home grip before the move: the first move after a regripped F/B/S/E that isn't
//   one.
// Choices from common practice: U2 is a right double flick, or the left one when the right wrist is down;
// D is the left ring finger, D' the right one; M' a left ring flick, M a push; rotations are "gira el cubo" and
// leave the hands home. Wide moves (r, u, f…) take their face's hint: the token already says two layers.
// ponytail: wrist position only, no hand geometry; a per-algorithm override table if a known alg reads wrong.
import { t } from './i18n.ts';

export type FingerHint = { token: string; label: string; regrip: boolean; home: boolean };

type Key = 'rUp' | 'rDown' | 'r2' | 'lUp' | 'lDown' | 'l2' | 'uRight' | 'uLeft' | 'u2Right' | 'u2Left'
  | 'fRight' | 'fLeft' | 'f2' | 'bRight' | 'bLeft' | 'b2' | 'dLeft' | 'dRight' | 'd2' | 'mUp' | 'mDown' | 'm2' | 'slice' | 'rotate';

const mod4 = (n: number) => ((n % 4) + 4) % 4;
const REGRIPPED = /^[FBSEfb]/; // moves done from a regrip, not from home

export function fingertricks(tokens: string[]): FingerHint[] {
  let right = 0;
  let left = 0;
  let off = false; // regripped away from home
  return tokens.map((token) => {
    const base = token.replace(/[2']/g, '');
    const k = token.includes('2') ? 2 : token.endsWith("'") ? 3 : 1; // clockwise quarter turns
    const face = base.endsWith('w') ? base[0] : base.toUpperCase(); // r, Rw -> R: same hand, two layers
    let regrip = false;
    let home = false;
    const goHome = () => {
      home = true;
      off = false;
      right = left = 0;
    };
    if (off && !REGRIPPED.test(base) && !'XYZ'.includes(face)) goHome();
    const needs = (ok: boolean) => {
      if (ok || off) return; // already regripped
      regrip = off = true;
      right = left = 0;
    };
    const pick = (cw: Key, half: Key, ccw: Key): Key => (k === 1 ? cw : k === 2 ? half : ccw);
    let key: Key;
    switch (face) {
      case 'R':
        right = mod4(right + k);
        key = pick('rUp', 'r2', 'rDown');
        break;
      case 'L':
        left = mod4(left - k);
        key = pick('lDown', 'l2', 'lUp');
        break;
      case 'U':
        if (k === 2) key = right < 2 ? 'u2Right' : 'u2Left';
        else key = k === 1 ? 'uRight' : 'uLeft';
        break;
      case 'F':
        needs(k === 3 ? left === 0 : right === 3);
        key = pick('fRight', 'f2', 'fLeft');
        break;
      case 'B':
        needs(k === 3 ? left === 0 : right === 0);
        key = pick('bRight', 'b2', 'bLeft');
        break;
      case 'D':
        key = pick('dLeft', 'd2', 'dRight');
        break;
      case 'M':
        key = pick('mDown', 'm2', 'mUp');
        break;
      case 'S':
      case 'E':
        needs(false);
        key = 'slice';
        break;
      default: // x y z
        right = left = 0;
        off = false;
        key = 'rotate';
    }
    return { token, label: t(`fingers.${key}`), regrip, home };
  });
}

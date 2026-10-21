// Checks an algorithm the user types for a case before it's added as one of the case's variants.
import type { KPuzzle } from 'cubing/kpuzzle';
import { IDENTITY, invertTokens, tokenize } from '../notation.ts';
import { caseState } from './cube.ts';
import { aufFor } from './score.ts';
import type { Case } from './types.ts';

export type CustomCheck =
  | { kind: 'bad-token'; token: string } // not notation we can read
  | { kind: 'solves'; alg: string } // normalized: ready to store
  | { kind: 'inverse'; alg: string } // the alg undone solves it (alg = that, the right way round)
  | { kind: 'other'; case: Case } // solves another case of the phase instead
  | { kind: 'none' };

/** Whether `typed` solves `c` (with an AUF before, like every algorithm here); else why not. `phaseCases`: the cases
 *  it could be meant for instead. */
export function checkCustomAlg(kpuzzle: KPuzzle, c: Case, phaseCases: Case[], typed: string): CustomCheck {
  // ´: the prime key of Spanish keyboards; brackets: trigger grouping as on SpeedCubeDB ("(R U)2" still fails, on the "2")
  const text = typed.replace(/´/g, "'").replace(/[()[\]]/g, ' ');
  const bad = text.trim().split(/\s+/).filter(Boolean).find((word) => {
    try {
      tokenize(word);
      return false;
    } catch {
      return true;
    }
  });
  if (bad) return { kind: 'bad-token', token: bad };
  const tokens = tokenize(text);
  const solves = (x: Case, alg: string[]) => aufFor(x, alg.join(' '), caseState(kpuzzle, x.algs[0].alg, IDENTITY)) !== null;
  if (solves(c, tokens)) return { kind: 'solves', alg: tokens.join(' ') };
  // another case before the inverse: a sibling's algorithm (Antisune on Sune) is often this case's inverse too
  const other = phaseCases.find((x) => x.id !== c.id && solves(x, tokens));
  if (other) return { kind: 'other', case: other };
  const inverse = invertTokens(tokens);
  return solves(c, inverse) ? { kind: 'inverse', alg: inverse.join(' ') } : { kind: 'none' };
}

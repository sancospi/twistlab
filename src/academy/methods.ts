// Registry of every method the academy teaches, and lookups across them.
// ponytail: importing them all puts the 8 methods and every translation in one chunk, so every route downloads the same
// ~1 MB of JS (~300 KB gz): cheap while sw.js precaches it and the pages are prerendered. If it ever has to be split,
// first load cfop.en/pt.ts and beginner2x2.en/pt.ts only for their language (~17 KB gz).
import type { Case, Method } from './types.ts';
import { beginner } from './beginner.ts';
import { cfopReduced } from './cfop.ts';
import { cfopFull } from './cfopFull.ts';
import { beginner2x2 } from './beginner2x2.ts';
import { ortega } from './ortega.ts';
import { f2lAdvanced } from './f2lAdvanced.ts';
import { coll } from './coll.ts';
import { roux } from './roux.ts';

export { scdbUrl } from './scdb.ts';

/** In the order of the Academia home's tiles (grouped by puzzle there). */
export const METHODS: Method[] = [beginner, cfopReduced, cfopFull, f2lAdvanced, coll, roux, beginner2x2, ortega];

export function allCases(method: Method): Case[] {
  return method.phases.flatMap((p) => p.groups.flatMap((g) => g.cases));
}

/** `method`'s cases from the start of the phase of the latest practised one, wrapping around: where Hoy looks for a new
 * case, so a learner on PLL is not sent back to F2L 1. `last` is a case's last practice time (0 if never). */
export function fromPhase(method: Method, last: (c: Case) => number): Case[] {
  const cases = (p: Method['phases'][number]) => p.groups.flatMap((g) => g.cases);
  const latest = allCases(method).reduce<Case | undefined>((a, c) => (last(c) > (a ? last(a) : 0) ? c : a), undefined);
  const i = Math.max(0, method.phases.findIndex((p) => latest && cases(p).includes(latest)));
  return [...method.phases.slice(i), ...method.phases.slice(0, i)].flatMap(cases);
}

export function findCase(id: string): Case | undefined {
  for (const m of METHODS) {
    const c = allCases(m).find((c) => c.id === id);
    if (c) return c;
  }
  return undefined;
}

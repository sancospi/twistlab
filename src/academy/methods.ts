// Registry of every method the academy teaches, and lookups across them.
import type { Case, Method } from './types.ts';
import { beginner } from './beginner.ts';
import { cfopReduced } from './cfop.ts';
import { cfopFull } from './cfopFull.ts';

export { scdbUrl } from './scdb.ts';

/** In the order of the Academia home's tiles. */
export const METHODS: Method[] = [beginner, cfopReduced, cfopFull];

export function allCases(method: Method): Case[] {
  return method.phases.flatMap((p) => p.groups.flatMap((g) => g.cases));
}

export function findCase(id: string): Case | undefined {
  for (const m of METHODS) {
    const c = allCases(m).find((c) => c.id === id);
    if (c) return c;
  }
  return undefined;
}

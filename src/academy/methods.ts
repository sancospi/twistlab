// Registry of every method the academy teaches, and lookups across them.
import type { Case, Method } from './types.ts';
import { cfopReduced } from './cfop.ts';

export { scdbUrl } from './scdb.ts';

export const METHODS: Method[] = [cfopReduced];

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

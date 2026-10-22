import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beginner2x2 } from './beginner2x2.ts';

test('every Localized text in beginner2x2 has English', () => {
  const missing: string[] = [];
  const walk = (v: unknown): void => {
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (typeof o.es === 'string') {
      if (typeof o.en !== 'string') missing.push(o.es);
      return;
    }
    Object.values(o).forEach(walk);
  };
  walk(beginner2x2);
  assert.deepEqual(missing, []);
});

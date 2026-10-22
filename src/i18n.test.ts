import test from 'node:test';
import assert from 'node:assert/strict';
import { es } from './i18n/es.ts';
import { en } from './i18n/en.ts';

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('en: every es key, with the same placeholders', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort());
  for (const [k, s] of Object.entries(es)) assert.deepEqual(holes(en[k as keyof typeof es]), holes(s), k);
});

test('plural keys come in .one/.other pairs (custom.other is just a word)', () => {
  for (const d of [es, en]) for (const k of Object.keys(d).filter((k) => k.endsWith('.one'))) assert.ok(`${k.slice(0, -4)}.other` in d, k);
});

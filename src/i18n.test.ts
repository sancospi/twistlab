import test from 'node:test';
import assert from 'node:assert/strict';
import { es } from './i18n/es.ts';
import { en } from './i18n/en.ts';
import { pt } from './i18n/pt.ts';
import { PT_READY, fromSpanish, langPath, splitLang } from './i18n.ts';

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('en: every es key, with the same placeholders', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort());
  for (const [k, s] of Object.entries(es)) assert.deepEqual(holes(en[k as keyof typeof es]), holes(s), k);
});

// Portuguese may be partial until PT_READY (the missing keys show the Spanish): counted here, required once it's public
test('pt: es keys only, with their placeholders; every key once PT_READY', (t) => {
  const missing = Object.keys(es).filter((k) => !(k in pt));
  for (const [k, s] of Object.entries(pt)) {
    assert.ok(k in es, `pt has a key es doesn't: ${k}`);
    assert.deepEqual(holes(s!), holes(es[k as keyof typeof es]), k);
  }
  if (PT_READY) assert.deepEqual(missing, []);
  else t.diagnostic(`pt.ts: ${missing.length} of ${Object.keys(es).length} keys still to translate`);
});

test('plural keys come in .one/.other pairs (custom.other is just a word)', () => {
  for (const d of [es, en, pt]) for (const k of Object.keys(d).filter((k) => k.endsWith('.one'))) assert.ok(`${k.slice(0, -4)}.other` in d, k);
});

test('language prefixes: Spanish at the root, the others under /en, /pt; paths round-trip', () => {
  for (const path of ['/', '/academia', '/academia/cfop-completo/caso/cfopc-oll-27', '/cubo/pintar']) {
    for (const l of ['es', 'en', 'pt'] as const) assert.deepEqual(splitLang(langPath(path, l)), { lang: l, path });
  }
  assert.equal(langPath('/', 'en'), '/en/');
  assert.equal(langPath('/algoritmos', 'pt'), '/pt/algoritmos');
  assert.deepEqual(splitLang('/en'), { lang: 'en', path: '/' });
  assert.deepEqual(splitLang('/english'), { lang: 'es', path: '/english' }); // a prefix is a whole segment
  assert.deepEqual(splitLang('/academia/en'), { lang: 'es', path: '/academia/en' });
});

test('fromSpanish: each language from its map line by line, left out if a line is missing', () => {
  const en = { 'Uno': 'One', 'Dos': 'Two' };
  assert.deepEqual(fromSpanish('Uno\nDos', { en, pt: { 'Uno': 'Um' } }), { es: 'Uno\nDos', en: 'One\nTwo' });
  assert.deepEqual(fromSpanish('Uno', { en, pt: { 'Uno': 'Um' } }), { es: 'Uno', en: 'One', pt: 'Um' });
});

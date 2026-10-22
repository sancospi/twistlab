import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inBackup } from './progress.ts';

// index.html's inline script (it runs before the first paint), run as is against a fake page and storage
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = html.match(/<body>\s*<script>([\s\S]*?)<\/script>/)![1];
function run(pathname: string, items: Record<string, string> = {}, language = 'es-ES', userAgent = 'Mozilla/5.0') {
  const classes = new Set<string>();
  const body = { dataset: {} as Record<string, string>, setAttribute() {}, classList: { add: (c: string) => classes.add(c) } };
  const html = { lang: 'es', classList: { add: (c: string) => classes.add(c) } };
  const keys = Object.keys(items);
  const storage = { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (k: string) => items[k] ?? null };
  new Function('document', 'location', 'localStorage', 'navigator', code)({ body, documentElement: html }, { pathname }, storage, { language, userAgent });
  return { module: body.dataset.module, fresh: classes.has('fresh'), lang: html.lang, wait: classes.has('i18n-wait') };
}

test('inline script: the language is the remembered one, else the browser\'s (en* is English)', () => {
  assert.deepEqual([run('/').lang, run('/').wait], ['es', false]);
  assert.deepEqual([run('/', {}, 'en-US').lang, run('/', {}, 'en-US').wait], ['en', true]);
  assert.equal(run('/', {}, 'EN').lang, 'en');
  assert.equal(run('/', {}, 'fr-FR').lang, 'es');
  assert.equal(run('/', { lang: 'es' }, 'en-GB').lang, 'es');
  assert.equal(run('/', { lang: 'en' }, 'es-MX').lang, 'en');
  assert.equal(run('/', { lang: 'de' }, 'en-GB').lang, 'en'); // not a language of ours: the browser's
  assert.equal(run('/', { lang: 'en' }).fresh, true); // choosing a language isn't a returning visitor
  assert.equal(run('/', {}, 'en-US', 'Mozilla/5.0 (compatible; Googlebot/2.1)').lang, 'es'); // crawlers read the Spanish pages
});

test('inline script: /acerca is the About page', () => {
  assert.equal(run('/acerca').module, 'about');
  assert.equal(run('/acerca/').module, 'about');
  assert.equal(run('/').module, 'solve');
});

test('inline script: the welcome card only for a first visit, until dismissed', () => {
  assert.equal(run('/').fresh, true);
  assert.equal(run('/', { 'cube-results': '[]' }).fresh, true); // main.ts writes it on every load
  assert.equal(run('/', { 'other-app': '1' }).fresh, true); // another app on the origin (localhost)
  assert.equal(run('/', { 'cube-results': '[{"ms":9000,"penalty":0}]' }).fresh, false);
  assert.equal(run('/', { 'cube-welcome': 'true' }).fresh, false); // dismissed
  assert.equal(run('/', { 'cube-mac:GANi3_8CA7': 'AA:BB:CC:DD:8C:A7' }).fresh, false); // connected a cube once
  // any data the backup carries means a returning visitor (same key prefixes as progress.ts)
  for (const k of ['cube-event', 'academy-stats', 'quiz-order', 'cross-level', 'practice-tab', 'progress-goal', 'paint-facelets', 'cubes', 'xacademy-stats']) {
    assert.equal(run('/', { [k]: '1' }).fresh, !inBackup(k), k);
  }
});

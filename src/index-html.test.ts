import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inBackup } from './progress.ts';

// index.html's inline script (it runs before the first paint), run as is against a fake page and storage
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = html.match(/<body>\s*<script>([\s\S]*?)<\/script>/)![1];
function run(pathname: string, items: Record<string, string> = {}, language = 'es-ES', userAgent = 'Mozilla/5.0', { session = {} as Record<string, string>, htmlLang = 'es' } = {}) {
  const classes = new Set<string>();
  const body = { dataset: {} as Record<string, string>, setAttribute() {}, classList: { add: (c: string) => classes.add(c) } };
  const html = { lang: htmlLang, classList: { add: (c: string) => classes.add(c) } };
  const keys = Object.keys(items);
  const storage = { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (k: string) => items[k] ?? null };
  const location = { pathname, search: '', hash: '' };
  const history = { state: null, replaceState: (_: unknown, __: string, url: string) => void (location.pathname = url) };
  const sessionStorage = { getItem: (k: string) => session[k] ?? null, setItem: (k: string, v: string) => void (session[k] = v) };
  new Function('document', 'location', 'localStorage', 'navigator', 'history', 'sessionStorage', code)(
    { body, documentElement: html, createElement: () => ({}), head: { appendChild() {} } }, location, storage, { language, userAgent }, history, sessionStorage);
  return { module: body.dataset.module, fresh: classes.has('fresh'), lang: html.lang, wait: classes.has('i18n-wait'), path: location.pathname };
}

test('inline script: the URL decides the language', () => {
  assert.deepEqual([run('/').lang, run('/').wait], ['es', false]);
  assert.deepEqual([run('/en/academia').lang, run('/en/academia').wait, run('/en/academia').module], ['en', true, 'academy']);
  assert.equal(run('/en/', { lang: 'es' }).lang, 'en'); // over the remembered one
  assert.equal(run('/pt/cubo/pintar').lang, 'pt');
  assert.equal(run('/english').lang, 'es');
  assert.equal(run('/en/academia', {}, 'en-US', 'Mozilla/5.0', { htmlLang: 'en' }).wait, false); // prerendered in English: nothing to wait for
  assert.equal(run('/academia', { lang: 'en' }, 'en-US', 'Mozilla/5.0', { session: { open: '1' } }).lang, 'es'); // in the session (the ES switch): the URL
});

test('inline script: a visit starting at a Spanish URL goes to the chosen language, else the browser\'s (not crawlers)', () => {
  assert.deepEqual(run('/', {}, 'en-US'), { module: 'solve', fresh: true, lang: 'en', wait: true, path: '/en/' });
  assert.equal(run('/academia/cruz', {}, 'EN').path, '/en/academia/cruz');
  assert.equal(run('/academia/cruz', {}, 'en-US').module, 'academy');
  assert.equal(run('/', {}, 'fr-FR').path, '/');
  assert.equal(run('/', { lang: 'es' }, 'en-GB').path, '/');
  assert.equal(run('/cubo', { lang: 'en' }, 'es-MX').path, '/en/cubo');
  assert.equal(run('/', { lang: 'de' }, 'en-GB').lang, 'en'); // not a language of ours: the browser's
  assert.equal(run('/', {}, 'pt-BR').path, '/'); // the source's `pt = false` (the build sets it from PT_READY)
  assert.equal(run('/', { lang: 'pt' }).path, '/');
  assert.equal(run('/', { lang: 'en' }).fresh, true); // choosing a language isn't a returning visitor
  assert.deepEqual([run('/', {}, 'en-US', 'Mozilla/5.0 (compatible; Googlebot/2.1)').lang, run('/', {}, 'en-US', 'Googlebot').path], ['es', '/']); // crawlers read each URL as it is
  assert.equal(run('/academia/cruz', {}, 'en-US', 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)').path, '/academia/cruz'); // Search Console's live test too
});

test('inline script: reopened at the start page, back to the last page in that language', () => {
  const last = (path: string) => ({ 'last-page': JSON.stringify({ path, scroll: 0 }) });
  assert.equal(run('/', last('/academia/cruz')).path, '/academia/cruz');
  assert.equal(run('/en/', last('/en/academia/cruz')).path, '/en/academia/cruz');
  assert.deepEqual([run('/en/', last('/en/academia/cruz')).module, run('/en/', last('/en/cubo/pintar')).module], ['academy', 'cube']);
  assert.equal(run('/', { lang: 'en', ...last('/en/algoritmos') }).path, '/en/algoritmos'); // the installed app: start_url / → /en/ → there
  assert.equal(run('/en/', last('/academia/cruz')).path, '/en/'); // another language: stays
  assert.equal(run('/', { lang: 'en', ...last('/academia/cruz') }).path, '/en/academia/cruz'); // saved before languages had URLs
  assert.equal(run('/', last('/academia/cruz'), 'es-ES', 'Mozilla/5.0', { session: { open: '1' } }).path, '/'); // a reload or the Resolver's link
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

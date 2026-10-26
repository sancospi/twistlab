// public/sw.js in node: a fake worker scope (self, caches, fetch) with just what it uses.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ORIGIN = 'https://twistlab.app';
type Req = { url: string; method?: string; mode?: string };
const href = (r: Req | string) => new URL(typeof r === 'string' ? r : r.url, ORIGIN).href;

const stores = new Map<string, Map<string, Response>>();
const store = (name: string) => stores.get(name) ?? stores.set(name, new Map()).get(name)!;
let online = true;
const fetched: string[] = [];
const fetchFake = async (r: Req | string) => {
  if (!online) throw new TypeError('offline');
  fetched.push(new URL(href(r)).pathname);
  return new Response(`net ${new URL(href(r)).pathname}`);
};
const handlers: Record<string, (e: unknown) => void> = {};
const posted: unknown[] = [];
let skipped = false;
Object.assign(globalThis, {
  self: {
    location: { origin: ORIGIN },
    registration: { waiting: { postMessage: (m: unknown) => posted.push(m) } },
    skipWaiting: () => { skipped = true; },
    addEventListener: (type: string, f: (e: unknown) => void) => { handlers[type] = f; },
  },
  fetch: fetchFake,
  caches: {
    open: async (name: string) => ({
      addAll: async (urls: string[]) => { for (const u of urls) store(name).set(href(u), await fetchFake(u)); },
      put: async (r: Req, res: Response) => { store(name).set(href(r), res); },
    }),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (r: Req | string, { cacheName }: { cacheName?: string } = {}) => // no cacheName: every cache, as the browser
      (cacheName ? [stores.get(cacheName)] : [...stores.values()]).map((s) => s?.get(href(r))).find(Boolean)?.clone(),
  },
});
// as the build writes it (vite.config.ts, swPrecache): a version and its files, hashed or not
const PRECACHE = ['/', '/assets/app-AbCd1234.js', '/assets/search-worker-entry.js', '/fonts/chivo-mono-700.woff2'];
const KEEP = ['/assets/gan-Xy12_-ab.js', '/assets/dist-Qw34-_cd.js']; // a smart cube's libraries: not precached
const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
  .replace("const PRECACHE = ['/'];", `const PRECACHE = ${JSON.stringify(PRECACHE)};`).replace('const KEEP = [];', `const KEEP = ${JSON.stringify(KEEP)};`);
await import(`data:text/javascript,${encodeURIComponent(source)}`);

/** Fires an event; resolves to what the worker answered (undefined: left to the browser) once its work is done. */
async function fire(type: string, extra: object = {}): Promise<string | undefined> {
  let answer: Promise<Response | undefined> | undefined;
  const waits: Promise<unknown>[] = [];
  handlers[type]({ ...extra, respondWith: (p: Promise<Response>) => (answer = p), waitUntil: (p: Promise<unknown>) => waits.push(p) });
  const res = await answer?.catch(() => undefined); // a rejected answer is a network error, as in a browser
  await Promise.all(waits);
  return answer && (res ? res.text() : 'network error');
}
const get = (path: string, mode = 'no-cors', method = 'GET') => fire('fetch', { request: { url: new URL(path, ORIGIN).href, mode, method } });

test('install precaches the build, copying the hashed files an older version has; activate drops older versions only', async () => {
  // the old version had the precache, and one of the cube's libraries it fetched once (the other never)
  stores.set('twistlab-old', new Map(['/assets/app-AbCd1234.js', '/assets/search-worker-entry.js', '/fonts/chivo-mono-700.woff2', '/assets/gan-Xy12_-ab.js'].map((p) => [`${ORIGIN}${p}`, new Response(`old ${p}`)])));
  stores.set('someone-else', new Map());
  fetched.length = 0;
  await fire('install');
  assert.deepEqual([...store('twistlab-dev').keys()].sort(), [...PRECACHE, '/assets/gan-Xy12_-ab.js'].map((p) => `${ORIGIN}${p}`).sort());
  assert.deepEqual(fetched.sort(), ['/', '/assets/search-worker-entry.js', '/fonts/chivo-mono-700.woff2']); // the unhashed: new
  assert.equal(await store('twistlab-dev').get(`${ORIGIN}/assets/app-AbCd1234.js`)!.text(), 'old /assets/app-AbCd1234.js');
  await fire('activate');
  assert.deepEqual([...stores.keys()].sort(), ['someone-else', 'twistlab-dev']);
});

test('navigations: network first (a waiting version takes over), the cached shell offline', async () => {
  online = true;
  assert.equal(await get('/algoritmos', 'navigate'), 'net /algoritmos');
  assert.deepEqual(posted, ['skip-waiting']);
  online = false;
  assert.equal(await get('/academia/cfop', 'navigate'), 'net /');
  assert.equal(await get('/en/academia/cfop', 'navigate'), 'net /'); // any language: the shell reads it from the URL
  assert.deepEqual(posted, ['skip-waiting']); // offline: the open version stays
  online = true;
});

test('built files: cache first, kept once fetched', async () => {
  fetched.length = 0;
  assert.equal(await get('/assets/main-abc.js'), 'net /assets/main-abc.js');
  online = false;
  assert.equal(await get('/assets/main-abc.js'), 'net /assets/main-abc.js');
  assert.equal(await get('/assets/gone-123.js'), 'network error'); // boot.ts's vite:preloadError reloads once
  online = true;
  assert.deepEqual(fetched, ['/assets/main-abc.js']);
});

test('left to the browser: analytics, the API, other origins, non-GET', async () => {
  assert.equal(await get('/_vercel/insights/script.js'), undefined);
  assert.equal(await get('https://example.com/x.js'), undefined);
  assert.equal(await get('/api/progress', 'cors', 'POST'), undefined);
  assert.equal(await get('/api/me', 'cors'), undefined);
});

test('a waiting version activates when told to', async () => {
  await fire('message', { data: 'other' });
  assert.equal(skipped, false);
  await fire('message', { data: 'skip-waiting' });
  assert.equal(skipped, true);
});

test('the daily reminder: a push shows its notification, tapping it opens /hoy', async () => {
  const shown: [string, { body: string; data: { url: string } }][] = [];
  const opened: string[] = [];
  const sw = (globalThis as unknown as { self: Record<string, unknown> }).self;
  Object.assign(sw.registration as object, { showNotification: async (title: string, o: never) => void shown.push([title, o]) });
  sw.clients = { matchAll: async () => [], openWindow: async (url: string) => void opened.push(url) };
  await fire('push', { data: { json: () => ({ title: 'Hora de practicar', body: '3 casos', url: '/hoy' }) } });
  await fire('push', { data: { json: () => { throw new SyntaxError(); } } });
  assert.deepEqual(shown.map(([t, o]) => [t, o.body, o.data.url]), [['Hora de practicar', '3 casos', '/hoy'], ['TwistLab', '', '/hoy']]);
  let closed = false;
  await fire('notificationclick', { notification: { data: { url: '/hoy' }, close: () => { closed = true; } } });
  assert.ok(closed);
  assert.deepEqual(opened, [`${ORIGIN}/hoy`]);
  // an open window: /hoy there, in its language
  const went: string[] = [];
  const win = (path: string) => ({ url: `${ORIGIN}${path}`, focus: async () => {}, navigate: async (url: string) => void went.push(url) });
  for (const path of ['/en/academia', '/academia']) {
    sw.clients = { matchAll: async () => [win(path)], openWindow: async (url: string) => void opened.push(url) };
    await fire('notificationclick', { notification: { data: { url: '/hoy' }, close() {} } });
  }
  assert.deepEqual(went, [`${ORIGIN}/en/hoy`, `${ORIGIN}/hoy`]);
});

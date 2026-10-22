// public/sw.js in node: a fake worker scope (self, caches, fetch) with just what it uses.
import test from 'node:test';
import assert from 'node:assert/strict';

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
    match: async (r: Req | string, { cacheName }: { cacheName: string }) => stores.get(cacheName)?.get(href(r))?.clone(),
  },
});
// @ts-expect-error: a plain script, no types
await import('../public/sw.js');

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

test('install precaches the shell; activate drops older versions only', async () => {
  stores.set('twistlab-old', new Map());
  stores.set('someone-else', new Map());
  await fire('install');
  assert.deepEqual([...store('twistlab-dev').keys()], [`${ORIGIN}/`]);
  await fire('activate');
  assert.deepEqual([...stores.keys()].sort(), ['someone-else', 'twistlab-dev']);
});

test('navigations: network first (a waiting version takes over), the cached shell offline', async () => {
  online = true;
  assert.equal(await get('/algoritmos', 'navigate'), 'net /algoritmos');
  assert.deepEqual(posted, ['skip-waiting']);
  online = false;
  assert.equal(await get('/academia/cfop', 'navigate'), 'net /');
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

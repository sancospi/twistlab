// Offline: the app shell and every built file are precached, so TwistLab opens without a connection after one visit.
// The build fills VERSION and PRECACHE (vite.config.ts, swPrecache); in dev it isn't registered (src/boot.ts).
// Updates: a new version installs in the background and waits; the next page load that reaches the network switches to
// it. Nothing reloads an open tab: it keeps its own version's files from its own cache.
const VERSION = 'dev';
const PRECACHE = ['/'];
const CACHE = `twistlab-${VERSION}`;

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE))));

self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('twistlab-') && k !== CACHE).map((k) => caches.delete(k)))),
));

self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/_vercel/')) return;
  if (req.mode === 'navigate') {
    // Network first (every path is index.html: vercel.json), the cached shell offline. A new version waiting takes over
    // now: this page comes from the network, so it's already the new build. ponytail: other tabs still on the old build
    // lose its cache; a lazy chunk they then miss reloads them once (boot.ts, vite:preloadError), as without a worker.
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) self.registration.waiting?.postMessage('skip-waiting');
      return res;
    }, () => caches.match('/', { cacheName: CACHE })));
    return;
  }
  // Built files are hashed (immutable): cache first; one missing from the precache is kept once fetched.
  e.respondWith(caches.match(req, { cacheName: CACHE }).then((hit) => hit ?? fetch(req).then((res) => {
    if (res.ok && url.pathname.startsWith('/assets/')) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy))); }
    return res;
  })));
});

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
  if (req.method !== 'GET' || url.origin !== self.location.origin || /^\/(_vercel|api)\//.test(url.pathname)) return; // the account's API: always the network
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

// The daily reminder (api/cron/reminders.js): {title, body, url}. Every push shows a notification (browsers require it).
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data?.json() ?? {}; } catch { /* not JSON: the generic text below */ }
  e.waitUntil(self.registration.showNotification(d.title || 'TwistLab', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'daily-reminder', data: { url: d.url || '/hoy' },
  }));
});

// Tapping it opens /hoy: in the app's window if one is open, else a new one
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/hoy', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    const win = wins.find((w) => new URL(w.url).origin === self.location.origin);
    return win ? win.focus().then(() => win.navigate(url)).catch(() => self.clients.openWindow(url)) : self.clients.openWindow(url);
  }));
});

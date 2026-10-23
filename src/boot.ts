// Page entry: the static markup carries only i18n keys, so fill it first, then load the app (cubing.js, three…).
// Vite merges every module script of index.html into one bundle, so a separate <script> wouldn't run any earlier:
// the app has to be a dynamic import to keep this entry tiny.
import { inject } from '@vercel/analytics';
import { applyI18n, lang, loadLang, setLang, type Lang } from './i18n.ts';
import { localizeLinks } from './router.ts';

// English, Portuguese: the dictionary is a chunk of its own (Spanish pages don't load it); the inline script keeps a page
// built in Spanish hidden until it's in (html.i18n-wait), so no Spanish shows first. Nothing below runs before it.
if (lang !== 'es') await loadLang();
applyI18n(document);
localizeLinks(); // /en/…: the menu's and every later link stay in English
// The ES · EN · PT switches (☰ menu, Cubo, /acerca): remember and open this page in that language
addEventListener('click', (e) => {
  const l = (e.target as Element).closest?.('[data-lang]')?.getAttribute('data-lang');
  if (l && l !== lang) setLang(l as Lang);
});
// Tamaño del texto (Cubo → Ajustes, /acerca): this device only; the inline script applies it before the first paint
const pressText = () => document.querySelectorAll('button[data-text]').forEach((b) =>
  b.setAttribute('aria-pressed', String(b.getAttribute('data-text') === (document.documentElement.dataset.text ?? ''))));
pressText();
addEventListener('click', (e) => {
  const b = (e.target as Element).closest?.('button[data-text]');
  if (!b) return;
  const v = b.getAttribute('data-text')!;
  if (v) document.documentElement.dataset.text = v;
  else delete document.documentElement.dataset.text;
  try { if (v) localStorage.setItem('ui-text', v); else localStorage.removeItem('ui-text'); } catch { /* private mode */ }
  pressText();
});
// A lazy chunk that won't load (a tab left open across a deploy: its hashed files are gone) would leave an empty
// screen or no 3D cube: reload once onto the new build. ponytail: once per tab session, so an offline tab can't loop.
addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('chunk-reload')) return;
    sessionStorage.setItem('chunk-reload', '1');
  } catch {
    return;
  }
  location.reload();
});
// Everything below the bar is placed from its real height (it wraps on medium widths, shrinks on phones); measured
// here, with the texts in, so the page doesn't move again when the app arrives.
new ResizeObserver(([entry]) =>
  document.documentElement.style.setProperty('--header-h', `${(entry.target as HTMLElement).offsetHeight}px`),
).observe(document.querySelector('.app-header')!);
// The app after the first paint (the markup is already the page; the second frame comes once the first is on screen):
// its fetches don't hold the paint back. A deep link into the academy (the inline script in index.html set the module)
// loads its code alongside main.ts, not after it. ponytail: a background tab starts the app when it's shown.
requestAnimationFrame(() => requestAnimationFrame(() => {
  void import('./main.ts');
  if (document.body.dataset.module === 'academy') void import('./academy/view.ts');
}));
// Vercel Web Analytics (page views, including the router's pushState navigations; no data sent in dev) and the offline
// service worker (public/sw.js; built files only, so not in dev): not needed for the page to work, so they wait until
// the page has loaded and gone idle.
const whenIdle = (f: () => void) =>
  addEventListener('load', () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(() => f()) : f()), 0));
whenIdle(() => inject());
if (import.meta.env.PROD && 'serviceWorker' in navigator) whenIdle(() => void navigator.serviceWorker.register('/sw.js').catch(() => {}));

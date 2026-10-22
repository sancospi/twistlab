// Page entry: the static markup carries only i18n keys, so fill it first, then load the app (cubing.js, three…).
// Vite merges every module script of index.html into one bundle, so a separate <script> wouldn't run any earlier:
// the app has to be a dynamic import to keep this entry tiny.
import { inject } from '@vercel/analytics';
import { applyI18n } from './i18n.ts';

applyI18n(document);
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
// Vercel Web Analytics (page views, including the router's pushState navigations; no data sent in dev): not needed
// for the page to work, so it waits until the page has loaded and gone idle.
addEventListener('load', () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(() => inject()) : inject()), 0));

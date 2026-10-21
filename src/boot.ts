// Page entry: the static markup carries only i18n keys, so fill it first, then load the app (cubing.js, three…).
// Vite merges every module script of index.html into one bundle, so a separate <script> wouldn't run any earlier:
// the app has to be a dynamic import to keep this entry tiny.
import { inject } from '@vercel/analytics';
import { applyI18n } from './i18n.ts';

applyI18n(document);
inject(); // Vercel Web Analytics: page views, including the router's pushState navigations (no data sent in dev)
void import('./main.ts');

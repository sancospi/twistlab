import { defineConfig, type Plugin } from 'vite';
import { es, type MessageKey } from './src/i18n/es.ts';

// The markup carries i18n keys (src/i18n.ts fills them in the browser); the build also writes the Spanish in, so the
// first paint has every text (nothing moves when boot.ts runs) and crawlers read the page. Elements with children
// are left to the browser.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const text = (key: string) => esc(es[key as MessageKey] ?? key);
const i18nHtml: Plugin = {
  name: 'i18n-html',
  transformIndexHtml: (html) => html
    .replace(/(<(\w+)\s[^>]*\bdata-i18n="([\w.]+)"[^>]*>)[^<]*(<\/\2>)/g, (_, open, _tag, key, close) => open + text(key) + close)
    .replace(/\sdata-i18n-(title|aria-label)="([\w.]+)"/g, (m, attr, key) => `${m} ${attr}="${text(key)}"`),
};

// cubing.js looks for its solver worker at `./search-worker-entry.js` next to its own code
// (import.meta.resolve). Vite can't see that, so src/main.ts imports the entry with `?worker&url`
// to emit it as a self-contained worker bundle, named exactly what cubing.js looks for.
// Without it, cubing.js falls back to a worker that shares the page's chunks and runs page code.
export default defineConfig({
  plugins: [i18nHtml],
  optimizeDeps: { exclude: ['cubing'] }, // keep cubing's files unbundled in dev so its lookup works there too
  worker: {
    format: 'es',
    rolldownOptions: { output: { entryFileNames: 'assets/search-worker-entry.js', chunkFileNames: 'assets/search-worker-[name]-[hash].js' } },
  },
  build: {
    chunkSizeWarningLimit: 2048,
    // The smart-cube library (loaded on Conectar) as one named chunk. Any group also gives Rolldown's runtime helpers a
    // chunk of their own: without one they land in this lazy chunk, and the app loaded it up front just for them.
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'gan', test: /node_modules[\\/](gan-web-bluetooth|aes-js|rxjs|tslib)[\\/]/ }] } } },
  },
});

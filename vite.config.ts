import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
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

// English visitors' dictionary (i18n/en.ts, its own chunk): index.html's inline script preloads it, so it loads alongside
// boot.ts instead of after it (English pages stay hidden until it's in). Its hashed name is written in here.
const enPreload: Plugin = {
  name: 'en-preload',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, { bundle }) {
      const chunk = Object.values(bundle ?? {}).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('/src/i18n/en.ts'));
      if (!chunk || !html.includes("en = ''")) throw new Error('en-preload: no en.ts chunk, or index.html\'s `en = \'\'` is gone');
      return html.replace("en = ''", `en = '/${chunk.fileName}'`);
    },
  },
};

// public/sw.js precaches the whole build (every file in dist, the solver worker's too, and '/' for index.html; not the
// crawlers' files: robots, sitemap, the pages src/seo.ts writes): written in once the build is on disk. The version is a hash of all of it, so any change makes a new worker (and cache).
const swPrecache: Plugin = {
  name: 'sw-precache',
  apply: 'build',
  writeBundle: {
    order: 'post',
    handler({ dir = 'dist' }) {
      const files = (readdirSync(dir, { recursive: true }) as string[]).map((f) => f.split('\\').join('/'))
        .filter((f) => f !== 'sw.js' && !/\.(xml|txt)$|.\/index\.html$/.test(f) && statSync(join(dir, f)).isFile()).sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(dir, f)));
      const version = `const VERSION = '${hash.digest('hex').slice(0, 12)}';`;
      const precache = `const PRECACHE = ${JSON.stringify(['/', ...files.filter((f) => f !== 'index.html').map((f) => `/${f}`)])};`;
      const sw = join(dir, 'sw.js');
      const out = readFileSync(sw, 'utf8').replace("const VERSION = 'dev';", version).replace("const PRECACHE = ['/'];", precache);
      if (!out.includes(version) || !out.includes(precache)) this.error('sw.js: the VERSION / PRECACHE lines to fill are gone');
      writeFileSync(sw, out);
    },
  },
};

// Every case, method, the library and /acerca get their own index.html (src/seo.ts): crawlers read each page's title,
// description and content without running the app; the sitemap lists them. Static files win over vercel.json's rewrite.
let outDir = 'dist';
let building = false; // vite preview runs as 'serve' (its middleware below), and dev closes bundles too
const prerender: Plugin = {
  name: 'prerender',
  configResolved: (c) => void ((outDir = join(c.root, c.build.outDir)), (building = c.command === 'build')),
  async closeBundle() {
    if (!building) return;
    const [{ cube3x3x3 }, { prerender: render, seoPages, sitemap }] = await Promise.all([import('cubing/puzzles'), import('./src/seo.ts')]);
    const html = await readFile(join(outDir, 'index.html'), 'utf8');
    const pages = seoPages(await cube3x3x3.kpuzzle());
    await Promise.all(pages.map(async (p) => {
      const dir = join(outDir, p.path);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'index.html'), render(html, p));
    }));
    const map = join(outDir, 'sitemap.xml');
    await writeFile(map, sitemap(await readFile(map, 'utf8'), pages.map((p) => p.path)));
  },
  // vite preview as Vercel: /x serves x/index.html (sirv only does it for /x/)
  configurePreviewServer: (server) => void server.middlewares.use((req, _res, next) => {
    const path = req.url?.split('?')[0] ?? '/';
    if (!path.endsWith('/') && existsSync(join(outDir, decodeURIComponent(path), 'index.html'))) req.url = path + '/' + req.url!.slice(path.length);
    next();
  }),
};

// /api in dev: on Vercel each api/**/*.js is a function; here Vite answers with the same handlers (no `vercel dev`),
// with .env.local's variables (DATABASE_URL, AUTH_SECRET…) in process.env. Files and folders starting with _ aren't routes.
const api: Plugin = {
  name: 'api',
  apply: 'serve',
  configureServer(server) {
    for (const [k, v] of Object.entries(loadEnv(server.config.mode, server.config.root, ''))) process.env[k] ??= v;
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      if (!url.pathname.startsWith('/api/')) return next();
      const file = join(server.config.root, `${url.pathname.replace(/\/$/, '')}.js`);
      const handler = /^\/api(\/[a-z]\w*)+\/?$/.test(url.pathname) && existsSync(file) && (await server.ssrLoadModule(file))[req.method ?? ''];
      if (!handler) return void res.writeHead(404, { 'Cache-Control': 'no-store' }).end();
      try {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c);
        const headers = new Headers({ 'x-real-ip': req.socket.remoteAddress ?? '' });
        for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
        const out: Response = await handler(new Request(url, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
        res.statusCode = out.status;
        out.headers.forEach((v, k) => k !== 'set-cookie' && res.setHeader(k, v));
        if (out.headers.getSetCookie().length) res.setHeader('set-cookie', out.headers.getSetCookie());
        res.end(Buffer.from(await out.arrayBuffer()));
      } catch (e) {
        next(e);
      }
    });
  },
};

// cubing.js looks for its solver worker at `./search-worker-entry.js` next to its own code
// (import.meta.resolve). Vite can't see that, so src/main.ts imports the entry with `?worker&url`
// to emit it as a self-contained worker bundle, named exactly what cubing.js looks for.
// Without it, cubing.js falls back to a worker that shares the page's chunks and runs page code.
export default defineConfig({
  plugins: [i18nHtml, enPreload, swPrecache, prerender, api],
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

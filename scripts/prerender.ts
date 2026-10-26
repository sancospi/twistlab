// One language's prerendered pages (vite.config.ts's prerender runs a worker per language, TWISTLAB_LANG in its env, so
// i18n.ts's `lang` and the academy's data are that language's from the start): each page's index.html (src/seo.ts) at
// its path in that language, and the methods' and cases' social previews (seo.ts's ogSvg, 1200x630) as PNGs in og/,
// drawn with Inter (bundled: build machines may have no fonts). Each PNG is kept in node_modules/.cache/og by its SVG's
// hash, so a build only draws what changed. ponytail: the cache isn't pruned; delete the folder if it ever grows too big.
// Answers its pages' (Spanish) paths, for the sitemap.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';
import { cube3x3x3 } from 'cubing/puzzles';
import { renderAsync } from '@resvg/resvg-js';
import { lang, langPath, loadLang } from '../src/i18n.ts';

const { html, outDir, root } = workerData as { html: string; outDir: string; root: string };
await loadLang(); // before the pages' modules: anything they build when they load is in this language
const { ogImagePath, ogSvg, prerender, seoPages } = await import('../src/seo.ts');
const pages = seoPages(await cube3x3x3.kpuzzle());

await Promise.all(pages.map(async (p) => {
  const dir = join(outDir, langPath(p.path, lang));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), prerender(html, p));
}));

const icon = await readFile(join(root, 'public/icon.svg'), 'utf8');
const cache = join(root, 'node_modules/.cache/og');
await mkdir(cache, { recursive: true });
const font = { fontFiles: ['400Regular/Inter_400Regular.ttf', '700Bold/Inter_700Bold.ttf'].map((f) => join(root, `node_modules/@expo-google-fonts/inter/${f}`)), loadSystemFonts: false, defaultFontFamily: 'Inter' };
await Promise.all(pages.map(async (p) => {
  if (!p.og) return;
  const svg = ogSvg(p.og, icon);
  const png = join(cache, `${createHash('sha256').update(svg).digest('hex').slice(0, 24)}.png`);
  if (!existsSync(png)) { // libuv's threads: 4 at a time. Renamed in whole: the other languages' workers share the cache
    await writeFile(`${png}.${lang}`, (await renderAsync(svg, { font })).asPng());
    await rename(`${png}.${lang}`, png);
  }
  const out = join(outDir, ogImagePath(langPath(p.path, lang)));
  await mkdir(dirname(out), { recursive: true });
  await copyFile(png, out);
}));

parentPort!.postMessage(pages.map((p) => p.path));

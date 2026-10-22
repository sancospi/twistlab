import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { METHODS, allCases } from './academy/methods.ts';
import { parseRoute } from './router.ts';
import { ORIGIN, prerender, seoPages, sitemap } from './seo.ts';

const pages = seoPages(await cube3x3x3.kpuzzle());
const html = `<head><title data-i18n="app.title">TwistLab</title>
  <meta name="description" content="app" />
  <meta property="og:title" content="app" />
  <meta property="og:description" content="app" />
</head><body><section id="mod-academy" data-i18n-aria-label="menu.academy" aria-label="Academia" hidden></section></body>`;

test('a page for every case, every method and the library, each path once and routed to its page', () => {
  const cases = METHODS.flatMap((m) => allCases(m).map((c) => `/academia/${m.id}/caso/${c.id}`));
  const paths = pages.map((p) => p.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const p of [...cases, '/algoritmos', '/academia/2x2', '/academia/gatillos', '/academia/reconocer-pll', '/academia/auf', ...METHODS.map((m) => `/academia/${m.id}`)]) assert.ok(paths.includes(p), p);
  for (const p of pages) {
    assert.notEqual(parseRoute(p.path).mod, 'solve', p.path);
    assert.ok(p.title && p.description && p.body.startsWith('<h2>'), p.path);
  }
});

test('a case page: its algorithm, recognition, probability and sibling links', () => {
  const p = pages.find((x) => x.path === '/academia/cfop-completo/caso/cfopc-oll-27')!;
  assert.equal(p.title, 'Sune · OLL 27 · Academia · TwistLab');
  assert.match(p.description, /^Sune · OLL 27 \(CFOP completo, OLL\)\. .+ Algoritmo: R U R' U R U2 R'$/);
  assert.match(p.body, /<code>R U R' U R U2 R'<\/code>/);
  assert.match(p.body, /Sale en 1\/54/);
  assert.match(p.body, /href="\/academia\/cfop-completo\/caso\/cfopc-oll-26"/);
});

test('/academia/gatillos: every trigger with its moves and period', () => {
  const p = pages.find((x) => x.path === '/academia/gatillos')!;
  assert.equal(p.title, 'Gatillos · Academia · TwistLab');
  assert.match(p.body, /<strong>Sexy move<\/strong> <code>R U R' U'<\/code>: .+ Repetido 6 veces seguidas/);
});

test('/acerca: the title the app sets', () => {
  assert.equal(pages.find((x) => x.path === '/acerca')?.title, 'Acerca de TwistLab · TwistLab');
});

test('prerender: head tags replaced, canonical added, content shown in the container', () => {
  const out = prerender(html, { path: '/academia/x', title: 'A "B" & C', description: 'D <E>', body: '<h2>X</h2>' });
  assert.match(out, /<title>A &quot;B&quot; &amp; C<\/title>/); // no data-i18n: boot.ts would reset it
  assert.match(out, /<meta name="description" content="D &lt;E&gt;" \/>/);
  assert.match(out, /<meta property="og:title" content="A &quot;B&quot; &amp; C" \/>/);
  assert.match(out, /<meta property="og:description" content="D &lt;E&gt;" \/>/);
  assert.match(out, new RegExp(`<link rel="canonical" href="${ORIGIN}/academia/x" />`));
  assert.match(out, new RegExp(`<meta property="og:url" content="${ORIGIN}/academia/x" />`));
  assert.match(out, /<section id="mod-academy" data-i18n-aria-label="menu.academy" aria-label="Academia"><div data-prerendered lang="es"><h2>X<\/h2><\/div><\/section>/);
});

test('sitemap: the hand-kept URLs, then the pages, each once', () => {
  const base = `<urlset><url><loc>${ORIGIN}/</loc></url><url><loc>${ORIGIN}/algoritmos</loc></url></urlset>`;
  const locs = [...sitemap(base, ['/algoritmos', '/academia/x']).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [`${ORIGIN}/`, `${ORIGIN}/algoritmos`, `${ORIGIN}/academia/x`]);
});

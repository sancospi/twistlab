import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { METHODS, allCases } from './academy/methods.ts';
import { parseRoute } from './router.ts';
import { ORIGIN, jsonLd, ogImagePath, ogSvg, prerender, seoPages, sitemap, type SeoPage } from './seo.ts';

const pages = seoPages(await cube3x3x3.kpuzzle());
const html = `<head><title data-i18n="app.title">TwistLab</title>
  <meta name="description" content="app" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="app" />
  <meta property="og:description" content="app" />
  <meta property="og:image" content="https://twistlab.app/apple-touch-icon.png" />
  <meta name="twitter:card" content="summary" />
</head><body><section id="mod-academy" data-i18n-aria-label="menu.academy" aria-label="Academia" hidden></section></body>`;

test('a page for every case, every method and the library, each path once and routed to its page', () => {
  const cases = METHODS.flatMap((m) => allCases(m).map((c) => `/academia/${m.id}/caso/${c.id}`));
  const paths = pages.map((p) => p.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const p of [...cases, '/algoritmos', '/academia/2x2', '/academia/gatillos', '/academia/reconocer-pll', '/academia/auf', '/academia/anticipacion', '/como-resolver-el-cubo-de-rubik',
    '/academia', '/academia/cruz', '/academia/notacion', '/cubo', '/cubo/pintar', '/progreso', '/acerca', ...METHODS.map((m) => `/academia/${m.id}`)]) assert.ok(paths.includes(p), p);
  for (const p of pages) {
    assert.notEqual(parseRoute(p.path).mod, 'solve', p.path);
    assert.ok(p.title && p.description && p.body.startsWith('<h2'), p.path);
  }
});

test('a case page: its algorithm, recognition, probability and sibling links', () => {
  const p = pages.find((x) => x.path === '/academia/cfop-completo/caso/cfopc-oll-27')!;
  assert.equal(p.title, 'Sune · OLL 27 · CFOP completo · TwistLab');
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

test('every title and every description is its own', () => {
  for (const k of ['title', 'description'] as const) {
    const seen = new Map<string, string>();
    for (const p of pages) {
      assert.ok(!seen.has(p[k]), `${k} of ${p.path} is also ${seen.get(p[k])}'s: ${p[k]}`);
      seen.set(p[k], p.path);
    }
  }
});

test('/como-resolver-el-cubo-de-rubik: the article, its diagrams and its links into the Academia', () => {
  const p = pages.find((x) => x.path === '/como-resolver-el-cubo-de-rubik')!;
  assert.equal(p.title, 'Cómo resolver el cubo de Rubik paso a paso · TwistLab');
  assert.ok(p.article && p.og);
  assert.equal((p.body.match(/<h2 /g) ?? []).length, 10);
  assert.equal((p.body.match(/<figure class="howto-figure"><svg /g) ?? []).length, 6);
  for (const href of ['/academia/notacion', '/academia/cruz', '/academia/principiante#academy-prin-capa1', '/academia/cfop-reducido']) assert.match(p.body, new RegExp(`href="${href}"`));
  assert.match(p.body, /<code>R U R' U'<\/code>/);
});

// Google's required and recommended fields (BreadcrumbList: 2+ items, each with a name and an absolute URL; Article: a
// headline of 110 characters at most)
test('structured data: a BreadcrumbList on every page, an Article on the guides, all valid JSON-LD', () => {
  const url = (s: unknown) => typeof s === 'string' && s.startsWith(`${ORIGIN}/`) && !/\s/.test(s);
  for (const p of pages) {
    const out = [...prerender(html, p).matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.deepEqual(out, jsonLd(p), p.path);
    const [crumbs, article, ...rest] = out;
    assert.equal(rest.length, 0);
    assert.equal(crumbs['@context'], 'https://schema.org');
    assert.equal(crumbs['@type'], 'BreadcrumbList');
    assert.ok(crumbs.itemListElement.length >= 2, p.path);
    crumbs.itemListElement.forEach((c: Record<string, unknown>, i: number) => {
      assert.equal(c['@type'], 'ListItem');
      assert.equal(c.position, i + 1);
      assert.ok(typeof c.name === 'string' && c.name.trim(), p.path);
      assert.ok(url(c.item), `${p.path}: ${c.item}`);
    });
    assert.equal(crumbs.itemListElement.at(-1).item, ORIGIN + p.path);
    assert.equal(!!article, !!p.article, p.path);
    if (!article) continue;
    assert.equal(article['@type'], 'Article');
    assert.ok(article.headline && article.headline.length <= 110, p.path);
    assert.ok(url(article.mainEntityOfPage) && article.author.name && article.publisher.name);
    if (article.image) assert.ok(url(article.image));
  }
  const p = pages.find((x) => x.path === '/academia/cfop-completo/caso/cfopc-oll-27')!;
  assert.deepEqual(jsonLd(p)[0].itemListElement.map((c: { name: string }) => c.name), ['TwistLab', 'Academia', 'CFOP completo', 'Sune · OLL 27']);
});

test('preview cards: every method and case has one; the card is a 1200x630 SVG with its text escaped', () => {
  const withCard = new Set(pages.filter((p) => p.og).map((p) => p.path));
  for (const m of METHODS) {
    assert.ok(withCard.has(`/academia/${m.id}`), m.id);
    for (const c of allCases(m)) assert.ok(withCard.has(`/academia/${m.id}/caso/${c.id}`), c.id);
  }
  const svg = ogSvg({ figures: ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="96" height="96"></svg>'], kicker: 'A & B', heading: 'Una frase bastante larga que no cabe en una sola línea <de verdad>' }, '<svg viewBox="0 0 1024 1024"></svg>');
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="1200" height="630"/);
  assert.match(svg, />A &amp; B</);
  assert.ok(!svg.includes('<de'));
  assert.ok((svg.match(/font-size="56"/g) ?? []).length > 1); // wrapped
  assert.match(svg, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 10 10" x="\d+" y="\d+" width="\d+" height="\d+">/); // placed
});

test('prerender: a page with a card points og:image and twitter:card at it; one without keeps the home\'s', () => {
  const page: SeoPage = { path: '/academia/x', title: 'X', description: 'D', body: '<h2>X</h2>', trail: [{ name: 'TwistLab', path: '/' }, { name: 'X', path: '/academia/x' }] };
  const plain = prerender(html, page);
  assert.match(plain, /<meta property="og:image" content="https:\/\/twistlab.app\/apple-touch-icon.png" \/>/);
  assert.match(plain, /<meta name="twitter:card" content="summary" \/>/);
  const card = prerender(html, { ...page, article: true, og: { figures: [], kicker: '', heading: 'X' } });
  assert.match(card, new RegExp(`<meta property="og:image" content="${ORIGIN}${ogImagePath('/academia/x')}" />\\n  <meta property="og:image:width" content="1200" />`));
  assert.match(card, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.match(card, /<meta property="og:type" content="article" \/>/);
  assert.equal(ogImagePath('/academia/x'), '/og/academia/x.png');
});

test('prerender: head tags replaced, canonical added, content shown in the container', () => {
  const out = prerender(html, { path: '/academia/x', title: 'A "B" & C', description: 'D <E>', body: '<h2>X</h2>', trail: [{ name: 'TwistLab', path: '/' }, { name: 'A </script>', path: '/academia/x' }] });
  assert.match(out, /"name":"A \\u003c\/script>"/); // never closes its script early
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

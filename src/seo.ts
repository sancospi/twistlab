// Build-time pages for crawlers (vite.config.ts writes them into dist/): every case, method, guide, trainer, the algorithm
// library and the app's other screens get their own index.html, the app's page with its title, description, canonical
// URL, Open Graph tags, structured data (JSON-LD) and its content as static HTML inside the module's container. The app
// replaces that content when it boots. Methods and cases also get a social preview card (ogSvg; vite.config.ts makes
// the PNG). Each language has its own pages (Spanish at /path, English at /en/path…), written by a worker of its own
// (scripts/prerender.ts) in i18n.ts's `lang`; each points at the others (hreflang). Pure: no DOM, no fs.
import type { KPuzzle } from 'cubing/kpuzzle';
import { LANGS, fillI18n, inAcademy, lang, langPath, loc, pageTitle, t, tp, type Lang, type MessageKey } from './i18n.ts';
import { TRAINERS, localHref, parseRoute, routePath, type AcademyPage, type Route, type Trainer } from './router.ts';
import { METHODS, allCases } from './academy/methods.ts';
import { bases2x2 } from './academy/bases2x2.ts';
import { period, triggerGuide } from './academy/triggers.ts';
import { crossGuide, type TextGuide } from './academy/crossGuide.ts';
import { beginner } from './academy/beginner.ts';
import { figureSvg, howToSolve } from './academy/howToSolve.ts';
import { smartCubes } from './academy/smartCubes.ts';
import { caseState } from './academy/cube.ts';
import { caseDiagram } from './academy/diagram.ts';
import { patternToFacelets } from './facelets.ts';
import { IDENTITY } from './notation.ts';
import { parseBlocks, type Inline } from './rich-text.ts';
import { esc } from './stats.ts';
import { caseProbability, formatProbability } from './academy/probability.ts';
import { caseLabel, type Case, type Method, type Phase } from './academy/types.ts';

export const ORIGIN = 'https://twistlab.app';

export interface SeoPage {
  path: string; // the Spanish one, e.g. /academia/cfop-completo/caso/cfopc-oll-27 (its English page: /en + it)
  title: string;
  description: string;
  body: string; // HTML for the module's container
  trail: Crumb[]; // from the home to this page (the last one): its BreadcrumbList
  article?: boolean; // a guide to read: an Article too
  og?: OgCard; // its social preview, a PNG at ogImagePath(path); without one it keeps the home's image
}
export interface Crumb { name: string; path: string }
/** A social preview card: case diagrams (SVG strings) on the left; a line of context and the page's name on the right. */
export interface OgCard { figures: string[]; kicker: string; heading: string }

/** Markdown-ish data text as one plain line: no **bold**, `code` or line breaks. */
const plain = (s: string) => s.replace(/\*\*|`/g, '').replace(/\s*\n\s*/g, ' ').trim();
const academy = (page: AcademyPage) => routePath({ mod: 'academy', page });
const academyTitle = (page: string) => pageTitle(inAcademy(page)); // as the app's Academia sets it
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
const list = (items: string[]) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const caseLink = (m: Method, c: Case) => link(academy({ kind: 'case', method: m.id, id: c.id }), caseLabel(c));
const home = (): Crumb => ({ name: t('app.title'), path: '/' });
const inAcademyTrail = (name: string, path: string): Crumb[] => [home(), { name: t('menu.academy'), path: academy({ kind: 'home' }) }, { name, path }];
// a case's figure as its card draws it (its main algorithm undone), at the preview's size
const figure = (phase: Phase, c: Case, kpuzzle: KPuzzle) =>
  caseDiagram(phase.diagram, c.stage, patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), { size: 400, arrows: true });
// a method's: the first case of each phase, as its Academia tile
const methodFigures = (m: Method, kpuzzle: KPuzzle) => m.phases.flatMap((p) => p.groups.flatMap((g) => g.cases).slice(0, 1).map((c) => figure(p, c, kpuzzle)));

/** Rich text (rich-text.ts) as HTML: paragraphs, lists, subheadings, bold and moves. */
const inline = (xs: Inline[]) => xs.map((x) => (x.kind === 'strong' ? `<strong>${esc(x.text)}</strong>` : x.kind === 'alg' ? `<code>${esc(x.text)}</code>` : esc(x.text))).join('');
const rich = (s: string) => parseBlocks(s).map((b) => ('items' in b ? `<${b.kind}>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${b.kind}>`
  : b.kind === 'h' ? `<h3>${inline(b.inline)}</h3>` : `<p>${inline(b.inline)}</p>`)).join('');

function casePage(m: Method, c: Case, kpuzzle: KPuzzle): SeoPage {
  const phase = m.phases.find((p) => p.groups.some((g) => g.cases.includes(c)))!;
  const group = phase.groups.find((g) => g.cases.includes(c))!;
  const p = caseProbability(c.id, kpuzzle);
  const siblings = group.cases.filter((x) => x !== c);
  const path = academy({ kind: 'case', method: m.id, id: c.id });
  return {
    path,
    title: pageTitle(t('app.pageTitle', { page: caseLabel(c), app: loc(m.name) })), // the method, not "Academia": OLL cases share names across methods
    trail: [...inAcademyTrail(loc(m.name), academy({ kind: 'method', id: m.id })), { name: caseLabel(c), path }],
    og: { figures: [figure(phase, c, kpuzzle)], kicker: `${loc(m.name)} · ${loc(phase.name)}`, heading: caseLabel(c) },
    description: t('seo.caseDescription', { name: caseLabel(c), method: loc(m.name), phase: loc(phase.name), recognition: plain(loc(c.recognition)), alg: c.algs[0].alg }),
    body: [
      `<h2>${esc(caseLabel(c))}</h2>`,
      `<p class="hint">${[loc(m.name), loc(phase.name), loc(group.name)].map(esc).join(' · ')}</p>`,
      p === null ? '' : `<p>${esc(t('prob.card', { p: formatProbability(p) }))}</p>`,
      `<h3>${esc(t('library.title'))}</h3>`,
      list(c.algs.map((v) => `<code>${esc(v.alg)}</code>`)),
      `<h3>${esc(t('case.recognition'))}</h3>`,
      `<p>${esc(plain(loc(c.recognition)))}</p>`,
      c.note ? `<p class="hint">${esc(plain(loc(c.note)))}</p>` : '',
      siblings.length ? `<h3>${esc(t('case.others', { name: loc(group.name) }))}</h3>${list(siblings.map((x) => caseLink(m, x)))}` : '',
    ].join(''),
  };
}

const casesByPhase = (m: Method, heading: 'h3' | 'h4') => m.phases.filter((p) => p.groups.some((g) => g.cases.length))
  .map((p) => `<${heading}>${esc(loc(p.name))}</${heading}>${list(p.groups.flatMap((g) => g.cases).map((c) => caseLink(m, c)))}`).join('');

function methodPage(m: Method, kpuzzle: KPuzzle): SeoPage {
  const description = plain(loc(m.summary ?? m.description).split('\n')[0]);
  const path = academy({ kind: 'method', id: m.id });
  return {
    path,
    title: academyTitle(loc(m.name)),
    description,
    trail: inAcademyTrail(loc(m.name), path),
    og: { figures: methodFigures(m, kpuzzle), kicker: `${t('menu.academy')} · ${tp('academy.tileCases', allCases(m).length)}`, heading: loc(m.name) },
    body: `<h2>${esc(loc(m.name))}</h2><p>${esc(description)}</p>${casesByPhase(m, 'h3')}`,
  };
}

/** A guide page (the white cross, the 2x2's basics): its intro and its lessons' titles. `name`: the one the app's title uses. */
function guidePage(g: TextGuide, page: AcademyPage, name = loc(g.name)): SeoPage {
  return {
    path: academy(page),
    title: academyTitle(name),
    description: plain(loc(g.summary)),
    trail: inAcademyTrail(name, academy(page)),
    article: true,
    body: `<h2>${esc(loc(g.name))}</h2>${loc(g.intro).split('\n').map((x) => `<p>${esc(plain(x))}</p>`).join('')}`
      + (g.lessons.length ? list(g.lessons.map((l) => esc(loc(l.title)))) : ''),
  };
}

/** The triggers: the intro, then each one with its moves, what it does and its period. */
function triggersPage(kpuzzle: KPuzzle): SeoPage {
  const g = triggerGuide;
  return {
    path: academy({ kind: 'triggers' }),
    title: academyTitle(loc(g.name)),
    description: plain(loc(g.summary)),
    trail: inAcademyTrail(loc(g.name), academy({ kind: 'triggers' })),
    article: true,
    body: `<h2>${esc(loc(g.name))}</h2>${loc(g.intro).split('\n').map((x) => `<p>${esc(plain(x.replace(/^## /, '')))}</p>`).join('')}`
      + list(g.triggers.map((x) => `<strong>${esc(loc(x.name))}</strong> <code>${esc(x.alg)}</code>: ${esc(plain(loc(x.does)))} ${esc(tp('triggers.period', period(kpuzzle, x.alg)))}`)),
  };
}

/** A trainer's page: its name and what it trains (the app draws the trainer itself). */
function trainerPage(id: Trainer): SeoPage {
  const [title, description] = [t(`trainer.${id}.title`), t(`trainer.${id}.summary`)];
  const path = academy({ kind: 'trainer', id });
  return { path, title: academyTitle(title), description, trail: inAcademyTrail(title, path), body: `<h2>${esc(title)}</h2><p>${esc(description)}</p>` };
}

/** "Cómo resolver el cubo de Rubik paso a paso" (howToSolve.ts): the whole article, each step with its case's diagram. */
function howToPage(kpuzzle: KPuzzle): SeoPage {
  const g = howToSolve;
  const path = routePath({ mod: 'academy', page: { kind: 'howto' } });
  return {
    path,
    title: pageTitle(loc(g.name)),
    description: loc(g.summary),
    trail: inAcademyTrail(loc(g.name), path), // the app draws it in the Academia, with its crumbs
    article: true,
    og: { figures: methodFigures(beginner, kpuzzle), kicker: `${t('menu.academy')} · ${loc(beginner.name)}`, heading: loc(g.name) },
    body: g.sections.map((s) => {
      const f = s.figure ? figureSvg(kpuzzle, s.figure) : null;
      return `<h2 id="como-${esc(s.id)}">${esc(loc(s.title))}</h2>`
        + (f ? `<figure class="howto-figure">${f.svg}<figcaption class="hint">${esc(f.caption)}</figcaption></figure>` : '')
        + `<div class="prose">${rich(loc(s.body))}</div>`
        + (s.more ?? []).map((m) => `<p>${link(m.href, `${loc(m.label)} →`)}</p>`).join('');
    }).join(''),
  };
}

/** "Cubo inteligente: cuál comprar" (smartCubes.ts): the whole article. */
function smartCubesPage(): SeoPage {
  const g = smartCubes;
  const path = routePath({ mod: 'academy', page: { kind: 'smartcubes' } });
  return {
    path,
    title: pageTitle(loc(g.name)),
    description: loc(g.summary),
    trail: inAcademyTrail(loc(g.name), path),
    article: true,
    body: g.sections.map((s) => `<h2 id="cubos-${esc(s.id)}">${esc(loc(s.title))}</h2><div class="prose">${rich(loc(s.body))}</div>`
      + (s.more ?? []).map((m) => `<p>${link(m.href, `${loc(m.label)} →`)}</p>`).join('')).join(''),
  };
}

/** The Academia's home: what it teaches, with a link to each guide, method and trainer. */
function academyHome(): SeoPage {
  const a = (page: AcademyPage, name: string) => link(academy(page), name);
  return {
    path: academy({ kind: 'home' }),
    title: academyTitle(t('seo.academyTitle')), // what people search for: "Aprende a resolver el cubo de Rubik · Academia"
    description: t('seo.academyDescription'),
    trail: [home(), { name: t('menu.academy'), path: academy({ kind: 'home' }) }],
    // it starts as the app's home does (academy/view.ts: the same box, title and intro, same size), so the app drawing
    // over it doesn't paint a new largest element: Lighthouse's LCP stays the first paint
    body: `<section class="academy-home"><h2>${esc(t('menu.academy'))}</h2><p class="prose hint">${esc(t('academy.homeIntro'))}</p>`
      + `<p>${esc(t('seo.academyDescription'))}</p>` + list([
      a({ kind: 'howto' }, loc(howToSolve.name)), a({ kind: 'smartcubes' }, loc(smartCubes.name)), link('/', t('solve.seoTitle')), link(routePath({ mod: 'cube', page: 'paint' }), t('paint.seoTitle')),
      a({ kind: 'cross' }, loc(crossGuide.name)),
      ...METHODS.map((m) => a({ kind: 'method', id: m.id }, loc(m.name))),
      a({ kind: 'notation' }, t('glossary.title')), a({ kind: 'triggers' }, loc(triggerGuide.name)), a({ kind: 'bases2x2' }, loc(bases2x2.name)),
      ...TRAINERS.map((id) => a({ kind: 'trainer', id }, t(`trainer.${id}.title`))),
    ]) + '</section>',
  };
}

function libraryPage(): SeoPage {
  return {
    path: academy({ kind: 'library' }),
    title: pageTitle(t('library.title')),
    description: t('library.intro'),
    trail: [home(), { name: t('library.title'), path: academy({ kind: 'library' }) }],
    body: `<h2>${esc(t('library.title'))}</h2><p class="hint">${esc(t('library.intro'))}</p>`
      + METHODS.map((m) => `<h3>${esc(loc(m.name))}</h3>${casesByPhase(m, 'h4')}`).join(''),
  };
}

/** A screen outside the Academia: its title and description (/, /acerca, /cubo and /cubo/pintar: index.html already has
 *  their content, so `body` only fills an empty container, as /progreso's). */
const screen = (route: Route, name: string, description: string): SeoPage => ({
  path: routePath(route), title: pageTitle(name), description, trail: [home(), { name, path: routePath(route) }],
  body: `<h2>${esc(name)}</h2><p>${esc(description)}</p>`,
});

/** Every page written at build time. */
export function seoPages(kpuzzle: KPuzzle): SeoPage[] {
  const notation = academy({ kind: 'notation' });
  return [
    // the timer: a search landing page of its own, titled as a timer with an academy, the app's name in its crumb
    { ...screen({ mod: 'solve' }, t('solve.seoTitle'), t('solve.seoDescription')), title: pageTitle(t('seo.homeTitle')), trail: [home()] },
    howToPage(kpuzzle), smartCubesPage(), academyHome(), libraryPage(),
    guidePage(crossGuide, { kind: 'cross' }, t('cross.title')), guidePage(bases2x2, { kind: 'bases2x2' }), triggersPage(kpuzzle),
    { path: notation, title: academyTitle(t('glossary.title')), description: t('glossary.tileSummary'), trail: inAcademyTrail(t('glossary.title'), notation),
      body: `<h2>${esc(t('glossary.title'))}</h2><p>${esc(t('glossary.tileSummary'))}</p>` },
    ...TRAINERS.map(trainerPage), ...METHODS.flatMap((m) => [methodPage(m, kpuzzle), ...allCases(m).map((c) => casePage(m, c, kpuzzle))]),
    screen({ mod: 'cube' }, t('menu.cube'), t('seo.cubeDescription')), screen({ mod: 'cube', page: 'paint' }, t('paint.seoTitle'), t('paint.seoDescription')),
    screen({ mod: 'progress' }, t('nav.progress'), t('progress.intro')), screen({ mod: 'challenges' }, t('challenges.title'), t('challenges.seoDescription')),
    screen({ mod: 'about' }, t('about.title'), t('seo.aboutDescription')),
  ];
}

/** Where a page's preview image is served: /og/<its path>.png. */
export const ogImagePath = (path: string): string => `/og${path}.png`;
export const OG_SIZE = { width: 1200, height: 630 };

/** Greedy word wrap at about `max` characters a line; past `lines` lines the last one ends in "…". */
function wrap(s: string, max: number, lines: number): string[] {
  const out: string[] = [];
  for (const w of s.split(' ')) {
    if (out.length && `${out.at(-1)} ${w}`.length <= max) out[out.length - 1] += ` ${w}`;
    else out.push(w);
  }
  if (out.length > lines) out.splice(lines - 1, Infinity, `${out.slice(lines - 1).join(' ').slice(0, max - 1).trimEnd()}…`);
  return out;
}

/** The preview card as an SVG (1200x630, the app's colors, Inter): the figures on the left, the text and the TwistLab mark
 *  (`icon`: public/icon.svg) on the right. vite.config.ts renders it to a PNG. */
export function ogSvg(card: OgCard, icon: string): string {
  const { width: W, height: H } = OG_SIZE;
  const box = 420, bx = 70, by = (H - box) / 2;
  const cols = Math.min(3, card.figures.length), rows = Math.ceil(card.figures.length / cols);
  const cell = box / Math.max(cols, rows);
  const oy = by + (box - rows * cell) / 2;
  // each diagram fills its cell (its viewBox keeps its shape, centered)
  const figures = card.figures.map((svg, i) => svg.replace(/ width="[^"]*" height="[^"]*"/,
    ` x="${bx + (i % cols) * cell + 8}" y="${oy + Math.floor(i / cols) * cell + 8}" width="${cell - 16}" height="${cell - 16}"`)).join('');
  const tx = 560;
  const kicker = wrap(card.kicker, 38, 2), heading = wrap(card.heading, 18, 3);
  const text = (lines: string[], y: number, step: number, attrs: string) =>
    lines.map((l, i) => `<text x="${tx}" y="${y + i * step}" ${attrs}>${esc(l)}</text>`).join('');
  const hy = 190 + kicker.length * 38 + 54;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, sans-serif">`
    + `<rect width="${W}" height="${H}" fill="#121620"/>${figures}` // flat: a gradient makes each PNG ~4x bigger
    + text(kicker, 190, 38, 'font-size="28" fill="#4ade80"')
    + text(heading, hy, 64, 'font-size="56" font-weight="700" fill="#e6e8ee"')
    + icon.replace('<svg ', `<svg x="${tx}" y="${H - 122}" width="60" height="60" `)
    + `<text x="${tx + 76}" y="${H - 80}" font-size="34" font-weight="700" fill="#e6e8ee">${esc(t('app.title'))}</text>`
    + `<text x="${W - 60}" y="${H - 80}" font-size="26" fill="#8a90a0" text-anchor="end">twistlab.app</text></svg>`;
}

/** Each language's codes: hreflang and JSON-LD's inLanguage, Open Graph's og:locale. */
const LOCALE: Record<Lang, { tag: string; og: string }> = { es: { tag: 'es', og: 'es_ES' }, en: { tag: 'en', og: 'en_US' }, pt: { tag: 'pt-BR', og: 'pt_BR' } };
/** A page's address in a language: /academia/x in English is https://twistlab.app/en/academia/x. */
export const pageUrl = (path: string, l: Lang): string => ORIGIN + langPath(path, l);

/** The head links of a page in language `l`: its canonical (itself) and every language's version (hreflang), Spanish
 *  as x-default. */
export function langLinks(path: string, l: Lang, langs: readonly Lang[] = LANGS): string {
  return [`<link rel="canonical" href="${esc(pageUrl(path, l))}" />`,
    ...langs.map((x) => `<link rel="alternate" hreflang="${LOCALE[x].tag}" href="${esc(pageUrl(path, x))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${esc(pageUrl(path, 'es'))}" />`].join('\n  ');
}

/** The markup's links in language `l` (router.ts localHref): the menu, crumbs, cards and the page's content. */
export const localizeHtml = (html: string, l: Lang): string =>
  html.replace(/(<a\s[^>]*?\bhref=")([^"]*)"/g, (_, open, href) => `${open}${localHref(href, l)}"`);

/** The page's structured data (schema.org): the home's WebSite, where a page sits (BreadcrumbList, below the home) and, for a
 *  guide, the Article. */
export function jsonLd(page: SeoPage): Record<string, unknown>[] {
  const url = pageUrl(page.path, lang);
  const org = { '@type': 'Organization', name: t('app.title'), url: pageUrl('/', lang) };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: page.trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: pageUrl(c.path, lang) })),
  };
  const site = { '@context': 'https://schema.org', '@type': 'WebSite', name: t('app.title'), url }; // the home's: the site's name in search results
  return [...(page.path === '/' ? [site] : []), ...(page.trail.length > 1 ? [crumbs] : []), ...(page.article ? [{
    '@context': 'https://schema.org', '@type': 'Article', headline: page.trail.at(-1)!.name, description: page.description, inLanguage: LOCALE[lang].tag,
    url, mainEntityOfPage: url, author: org, publisher: org, ...(page.og ? { image: ORIGIN + ogImagePath(langPath(page.path, lang)) } : {}),
  }] : [])];
}

/** The built index.html (in Spanish) as this page in i18n.ts's language: its texts and links, its head tags, and its
 *  content in the module's container (shown, not hidden). */
export function prerender(html: string, page: SeoPage): string {
  const route: Route = parseRoute(page.path);
  const meta = (attr: string, value: string) => (s: string) =>
    s.replace(new RegExp(`(<meta ${attr} content=")[^"]*"`), (_, open) => `${open}${esc(value)}"`); // a function: no $ patterns
  const ld = jsonLd(page).map((x) => `  <script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>\n`).join(''); // no </script> inside
  let out = [
    // another language: <html lang> (index.html's inline script then doesn't wait for the texts) and the texts
    (s: string) => (lang === 'es' ? s : fillI18n(s.replace('<html lang="es">', `<html lang="${lang}">`), (k) => esc(t(k as MessageKey)))),
    // no data-i18n: boot.ts would put the app's name back
    (s: string) => s.replace(/<title[^>]*>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`),
    meta('name="description"', page.description),
    meta('property="og:type"', page.article ? 'article' : 'website'),
    meta('property="og:title"', page.title),
    meta('property="og:description"', page.description),
    meta('property="og:locale"', LOCALE[lang].og),
    ...(page.og ? [
      meta('property="og:image"', ORIGIN + ogImagePath(langPath(page.path, lang))),
      (s: string) => s.replace(/(<meta property="og:image"[^>]*>)/, `$1\n  <meta property="og:image:width" content="${OG_SIZE.width}" />\n  <meta property="og:image:height" content="${OG_SIZE.height}" />`),
      meta('name="twitter:card"', 'summary_large_image'),
    ] : []),
    // after the description: its canonical URL, the other languages' and og:url
    (s: string) => s.replace(/(<meta name="description"[^>]*>)/, (m) => `${m}\n  ${langLinks(page.path, lang)}\n  <meta property="og:url" content="${esc(pageUrl(page.path, lang))}" />`),
    (s: string) => s.replace('</head>', () => `${ld}</head>`),
  ].reduce((s, f) => f(s), html);
  // data-prerendered lang: index.html's CSS hides it from other languages (offline, the cached '/') until the app renders
  out = out.replace(new RegExp(`(<(\\w+) id="mod-${route.mod}"[^>]*?)(?: hidden)?>(</\\2>)`), (_, open, _tag, close) => `${open}><div data-prerendered lang="${lang}">${page.body}</div>${close}`);
  return localizeHtml(out, lang);
}

/** The sitemap: the hand-kept one's URLs (public/sitemap.xml) and the pages', each once, in every language, each URL
 *  with its alternates (xhtml:link, as the pages' hreflang). */
export function sitemap(base: string, paths: string[], langs: readonly Lang[] = LANGS): string {
  const all = [...new Set([...[...base.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(ORIGIN.length) || '/'), ...paths])];
  const alternates = (path: string) => [...langs.map((x) => [LOCALE[x].tag, x] as const), ['x-default', 'es'] as const]
    .map(([tag, x]) => `<xhtml:link rel="alternate" hreflang="${tag}" href="${esc(pageUrl(path, x))}"/>`).join('');
  const urls = all.flatMap((path) => langs.map((l) => `  <url><loc>${esc(pageUrl(path, l))}</loc>${alternates(path)}</url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

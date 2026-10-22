// Build-time pages for crawlers (vite.config.ts writes them into dist/): every case, method and the algorithm library
// gets its own index.html, the app's page with its title, description, canonical URL, Open Graph tags and its content
// as static HTML inside the module's container. The app replaces that content when it boots. Pure: no DOM, no fs.
import type { KPuzzle } from 'cubing/kpuzzle';
import { loc, t } from './i18n.ts';
import { parseRoute, routePath, type AcademyPage, type Route } from './router.ts';
import { METHODS, allCases } from './academy/methods.ts';
import { bases2x2 } from './academy/bases2x2.ts';
import type { TextGuide } from './academy/crossGuide.ts';
import { caseProbability, formatProbability } from './academy/probability.ts';
import type { Case, Method } from './academy/types.ts';

export const ORIGIN = 'https://twistlab.app';

export interface SeoPage {
  path: string; // e.g. /academia/cfop-completo/caso/cfopc-oll-27
  title: string;
  description: string;
  body: string; // HTML for the module's container
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Markdown-ish data text as one plain line: no **bold**, `code` or line breaks. */
const plain = (s: string) => s.replace(/\*\*|`/g, '').replace(/\s*\n\s*/g, ' ').trim();
const academy = (page: AcademyPage) => routePath({ mod: 'academy', page });
const label = (c: Case) => (loc(c.name) === c.code ? c.code : `${c.code} · ${loc(c.name)}`); // quiz.ts's caseLabel (that module needs the DOM)
// the titles the app sets (main.ts's pageTitle, view.ts's inAcademy): nothing changes when it boots
const pageTitle = (page: string) => t('app.pageTitle', { page, app: t('app.title') });
const inAcademy = (page: string) => pageTitle(t('app.pageTitle', { page, app: t('menu.academy') }));
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
const list = (items: string[]) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const caseLink = (m: Method, c: Case) => link(academy({ kind: 'case', method: m.id, id: c.id }), label(c));

function casePage(m: Method, c: Case, kpuzzle: KPuzzle): SeoPage {
  const phase = m.phases.find((p) => p.groups.some((g) => g.cases.includes(c)))!;
  const group = phase.groups.find((g) => g.cases.includes(c))!;
  const p = caseProbability(c.id, kpuzzle);
  const siblings = group.cases.filter((x) => x !== c);
  return {
    path: academy({ kind: 'case', method: m.id, id: c.id }),
    title: inAcademy(label(c)),
    description: t('seo.caseDescription', { name: label(c), method: loc(m.name), phase: loc(phase.name), recognition: plain(loc(c.recognition)), alg: c.algs[0].alg }),
    body: [
      `<h2>${esc(label(c))}</h2>`,
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

function methodPage(m: Method): SeoPage {
  const description = plain(loc(m.summary ?? m.description).split('\n')[0]);
  return {
    path: academy({ kind: 'method', id: m.id }),
    title: inAcademy(loc(m.name)),
    description,
    body: `<h2>${esc(loc(m.name))}</h2><p>${esc(description)}</p>${casesByPhase(m, 'h3')}`,
  };
}

/** A guide page (the 2x2's basics): its intro and its lessons' titles. */
function guidePage(g: TextGuide, page: AcademyPage): SeoPage {
  return {
    path: academy(page),
    title: inAcademy(loc(g.name)),
    description: plain(loc(g.summary)),
    body: `<h2>${esc(loc(g.name))}</h2>${loc(g.intro).split('\n').map((x) => `<p>${esc(plain(x))}</p>`).join('')}`
      + (g.lessons.length ? list(g.lessons.map((l) => esc(loc(l.title)))) : ''),
  };
}

function libraryPage(): SeoPage {
  return {
    path: academy({ kind: 'library' }),
    title: pageTitle(t('library.title')),
    description: t('library.intro'),
    body: `<h2>${esc(t('library.title'))}</h2><p class="hint">${esc(t('library.intro'))}</p>`
      + METHODS.map((m) => `<h3>${esc(loc(m.name))}</h3>${casesByPhase(m, 'h4')}`).join(''),
  };
}

/** Every page written at build time. /acerca: its title and description (index.html already has its content). */
export function seoPages(kpuzzle: KPuzzle): SeoPage[] {
  const about: SeoPage = {
    path: '/acerca', title: pageTitle(t('about.title')), description: t('seo.aboutDescription'),
    body: `<h2>${esc(t('about.title'))}</h2><p>${esc(t('seo.aboutDescription'))}</p>`,
  };
  return [libraryPage(), guidePage(bases2x2, { kind: 'bases2x2' }), ...METHODS.flatMap((m) => [methodPage(m), ...allCases(m).map((c) => casePage(m, c, kpuzzle))]), about];
}

/** The built index.html as this page: its head tags, and its content in the module's container (shown, not hidden). */
export function prerender(html: string, page: SeoPage): string {
  const url = ORIGIN + page.path;
  const route: Route = parseRoute(page.path);
  const meta = (attr: string, value: string) => (s: string) =>
    s.replace(new RegExp(`(<meta ${attr} content=")[^"]*"`), (_, open) => `${open}${esc(value)}"`); // a function: no $ patterns
  let out = [
    // no data-i18n: boot.ts would put the app's name back
    (s: string) => s.replace(/<title[^>]*>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`),
    meta('name="description"', page.description),
    meta('property="og:title"', page.title),
    meta('property="og:description"', page.description),
    (s: string) => s.replace(/(<meta name="description"[^>]*>)/, `$1\n  <link rel="canonical" href="${esc(url)}" />\n  <meta property="og:url" content="${esc(url)}" />`),
  ].reduce((s, f) => f(s), html);
  // data-prerendered: English visitors don't see this Spanish until the app renders over it (index.html's CSS)
  out = out.replace(new RegExp(`(<(\\w+) id="mod-${route.mod}"[^>]*?)(?: hidden)?>(</\\2>)`), (_, open, _tag, close) => `${open}><div data-prerendered lang="es">${page.body}</div>${close}`);
  return out;
}

/** The sitemap: the hand-kept one's URLs (public/sitemap.xml) and the pages', each once. */
export function sitemap(base: string, paths: string[]): string {
  const locs = [...new Set([...[...base.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]), ...paths.map((p) => esc(ORIGIN + p))])];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.map((l) => `  <url><loc>${l}</loc></url>`).join('\n')}\n</urlset>\n`;
}

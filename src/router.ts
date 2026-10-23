// Routes: clean URLs with the History API. The server answers every path with the app's page (vercel.json: app.html,
// index.html without '/''s canonical; Vite does it in dev). Links are real <a href>: same-origin clicks are handled here, the rest behave as usual.
// Languages: the Spanish paths, under /en or /pt for the others (i18n.ts splitLang/langPath). The app writes Spanish
// paths; links (localizeLinks) and navigate() add the current language's prefix, so every page stays in it.
import { lang, langPath, splitLang, type Lang } from './i18n.ts';

export type AcademyPage =
  | { kind: 'home' } | { kind: 'notation' } | { kind: 'cross' } | { kind: 'bases2x2' } | { kind: 'triggers' } | { kind: 'method'; id: string }
  | { kind: 'lesson'; course: string; id: string } // course: the guide's segment, e.g. /academia/cruz/leccion/que-es
  | { kind: 'library' } // every case of every method, with search: /algoritmos (its own menu entry, drawn by the academy)
  | { kind: 'trainer'; id: Trainer } // a trainer of the Academia's "Entrenadores": /academia/reconocer-pll, /academia/auf, /academia/anticipacion
  | { kind: 'case'; method: string; id: string } // a case's page: /academia/cfop-completo/caso/cfopc-oll-27
  | { kind: 'today' } // Hoy, the day's practice: /hoy (its own menu entry, drawn by the academy like the library)
  | { kind: 'howto' }; // the beginner's article for search: /como-resolver-el-cubo-de-rubik (drawn by the academy, outside /academia)
export type Route = { mod: 'solve' } | { mod: 'cube'; page?: 'paint' } | { mod: 'academy'; page: AcademyPage } | { mod: 'progress' } | { mod: 'about' }; // paint: /cubo/pintar; about: /acerca

/** The Academia's trainers, by their URL segment. */
export const TRAINERS = ['reconocer-pll', 'auf', 'anticipacion'] as const;
export type Trainer = (typeof TRAINERS)[number];

const NOTATION = 'notacion';
/** Old paths that moved: the URL is rewritten to the new one. */
const ALIASES: Record<string, string> = { '/guia': '/cubo', '/academia/algoritmos': '/algoritmos' };
const CROSS = 'cruz'; // the white-cross guide: a page of its own, not a method
const BASES_2X2 = '2x2'; // the 2x2's basics: a guide like the cross
const TRIGGERS = 'gatillos'; // the triggers (sexy move, Sune…): a page of cards
const LESSON = 'leccion';
const LIBRARY = 'algoritmos';
const CASE = 'caso';
const PAINT = 'pintar';
const PROGRESS = 'progreso';
const ABOUT = 'acerca';
const TODAY = 'hoy';
const HOWTO = 'como-resolver-el-cubo-de-rubik';

export type GuidePage = Extract<AcademyPage, { kind: 'notation' | 'cross' | 'bases2x2' | 'triggers' | 'method' }>;
const GUIDES = { notation: NOTATION, cross: CROSS, bases2x2: BASES_2X2, triggers: TRIGGERS } as const;
/** The guide at /academia/<segment>: the notation, the white cross, the 2x2's basics, the triggers or a method. */
export const guidePage = (segment: string): GuidePage => {
  const kind = (Object.keys(GUIDES) as (keyof typeof GUIDES)[]).find((k) => GUIDES[k] === segment);
  return kind ? { kind } : { kind: 'method', id: segment };
};
/** The inverse: a guide's segment. */
export const guideSegment = (p: GuidePage): string => (p.kind === 'method' ? p.id : GUIDES[p.kind]);

const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } }; // a bad deep link must not throw

/** A path's route, in any language (/en/academia is /academia's). */
export function parseRoute(pathname: string): Route {
  const [first, second, third, fourth] = splitLang(pathname).path.split('/').filter(Boolean).map(decode);
  if (first === 'cubo' && second === PAINT) return { mod: 'cube', page: 'paint' };
  if (first === 'cubo' || first === 'guia') return { mod: 'cube' };
  if (first === PROGRESS) return { mod: 'progress' };
  if (first === ABOUT) return { mod: 'about' };
  if (first === HOWTO) return { mod: 'academy', page: { kind: 'howto' } };
  if (first === LIBRARY) return { mod: 'academy', page: { kind: 'library' } };
  if (first === TODAY) return { mod: 'academy', page: { kind: 'today' } };
  if (first === 'academia') {
    if (!second) return { mod: 'academy', page: { kind: 'home' } };
    if (second === LIBRARY) return { mod: 'academy', page: { kind: 'library' } };
    if (third === LESSON && fourth) return { mod: 'academy', page: { kind: 'lesson', course: second, id: fourth } };
    if (third === CASE && fourth) return { mod: 'academy', page: { kind: 'case', method: second, id: fourth } };
    if ((TRAINERS as readonly string[]).includes(second)) return { mod: 'academy', page: { kind: 'trainer', id: second as Trainer } };
    return { mod: 'academy', page: guidePage(second) };
  }
  return { mod: 'solve' }; // '/', '/resolver' and anything unknown
}

export function routePath(r: Route): string {
  if (r.mod === 'solve') return '/';
  if (r.mod === 'cube') return r.page ? `/cubo/${PAINT}` : '/cubo';
  if (r.mod === 'progress') return `/${PROGRESS}`;
  if (r.mod === 'about') return `/${ABOUT}`;
  const p = r.page;
  if (p.kind === 'home') return '/academia';
  if (p.kind === 'lesson') return `/academia/${encodeURIComponent(p.course)}/${LESSON}/${encodeURIComponent(p.id)}`;
  if (p.kind === 'library') return `/${LIBRARY}`;
  if (p.kind === 'today') return `/${TODAY}`;
  if (p.kind === 'howto') return `/${HOWTO}`;
  if (p.kind === 'case') return `/academia/${encodeURIComponent(p.method)}/${CASE}/${encodeURIComponent(p.id)}`;
  if (p.kind === 'trainer') return `/academia/${p.id}`;
  return `/academia/${encodeURIComponent(guideSegment(p))}`;
}

/** An app link in language `l`: a Spanish path gets its prefix; other languages' paths, #anchors and other sites stay.
 *  ponytail: every root-relative link is a page (the app links no files). */
export function localHref(href: string, l: Lang): string {
  return l !== 'es' && /^\/(?!\/)/.test(href) && splitLang(href.split(/[?#]/)[0]).lang === 'es' ? langPath(href, l) : href;
}

/** Keeps every <a href> of the page in the current language: now and as views add links (not needed in Spanish). */
export function localizeLinks(): void {
  if (lang === 'es') return;
  const fix = (a: Element) => { const h = a.getAttribute('href'); if (h && localHref(h, lang) !== h) a.setAttribute('href', localHref(h, lang)); };
  const all = (root: ParentNode) => root.querySelectorAll('a[href]').forEach(fix);
  all(document);
  new MutationObserver((records) => records.forEach((r) => {
    if (r.type === 'attributes') fix(r.target as Element);
    else r.addedNodes.forEach((n) => { if (n instanceof Element) { if (n.matches('a[href]')) fix(n); all(n); } });
  })).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });
}

let current = '';
let apply: (r: Route, scroll: number | null) => void = () => {};
let readScroll: () => number = () => 0;
/** Where the app was left ({ path, scroll }): the inline script in index.html reopens it there. Not in the backup. */
const LAST = 'last-page';
const saveLast = (scroll = 0) => {
  try { localStorage.setItem(LAST, JSON.stringify({ path: location.pathname + location.search, scroll })); } catch { /* private mode */ }
};

/** `back`: from back/forward, so the page's saved scroll (if any) comes back; a new page starts at the top. */
function go(back = false) {
  const moved = ALIASES[splitLang(location.pathname).path.replace(/\/+$/, '')];
  if (moved) history.replaceState(null, '', localHref(moved, lang) + location.hash);
  if (location.pathname === current) return; // e.g. an in-page #anchor: the browser just scrolls
  current = location.pathname;
  saveLast();
  const saved = back ? (history.state as { scroll?: unknown } | null)?.scroll : null;
  apply(parseRoute(current), typeof saved === 'number' ? saved : null);
}

/** Goes to an app path (pushes history), e.g. from code rather than a link. The page being left keeps its scroll in
 *  its history entry, for Back. A link to the page we just came from (a crumb) is Back itself: same scroll as left. */
export function navigate(path: string): void {
  path = localHref(path, lang);
  if ((history.state as { from?: unknown } | null)?.from === path) return history.back();
  history.replaceState({ ...(history.state ?? {}), scroll: readScroll() }, '');
  history.pushState({ from: location.pathname + location.search }, '', path);
  go();
}

/** The ← button: back to the previous page of the app, or to `fallback` when this one was opened directly. */
export function goBack(fallback: string): void {
  if ((history.state as { from?: unknown } | null)?.from) history.back();
  else navigate(fallback);
}

/** Applies the current URL now, then on every link click and back/forward. `scroll` reads the page's scroll position. */
export function startRouter(onRoute: (r: Route, scroll: number | null) => void, scroll: () => number = () => 0): void {
  apply = onRoute;
  readScroll = scroll;
  history.scrollRestoration = 'manual'; // the app's own scroller (.panel) is restored here, not the window
  addEventListener('popstate', () => go(true));
  // closing or killing the app (the installed one on iOS too) goes through hidden first: remember the scroll then
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveLast(readScroll()); });
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
    if (a.getAttribute('href')!.startsWith('#')) return; // in-page anchors scroll as usual
    e.preventDefault();
    navigate(a.pathname + a.search + a.hash);
  });
  go(true); // a reload, or the app reopened where it was left (index.html), keeps its scroll
}

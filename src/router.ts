// Routes: clean URLs with the History API. The server answers every path with index.html (vercel.json; Vite
// does it in dev). Links are real <a href>: same-origin clicks are handled here, the rest behave as usual.

export type AcademyPage =
  | { kind: 'home' } | { kind: 'notation' } | { kind: 'cross' } | { kind: 'method'; id: string }
  | { kind: 'lesson'; course: string; id: string } // course: the guide's segment, e.g. /academia/cruz/leccion/que-es
  | { kind: 'library' } // every case of every method, with search: /algoritmos (its own menu entry, drawn by the academy)
  | { kind: 'case'; method: string; id: string }; // a case's page: /academia/cfop-completo/caso/cfopc-oll-27
export type Route = { mod: 'solve' } | { mod: 'cube'; page?: 'paint' } | { mod: 'academy'; page: AcademyPage } | { mod: 'progress' } | { mod: 'about' }; // paint: /cubo/pintar; about: /acerca

const NOTATION = 'notacion';
/** Old paths that moved: the URL is rewritten to the new one. */
const ALIASES: Record<string, string> = { '/guia': '/cubo', '/academia/algoritmos': '/algoritmos' };
const CROSS = 'cruz'; // the white-cross guide: a page of its own, not a method
const LESSON = 'leccion';
const LIBRARY = 'algoritmos';
const CASE = 'caso';
const PAINT = 'pintar';
const PROGRESS = 'progreso';
const ABOUT = 'acerca';

export type GuidePage = Extract<AcademyPage, { kind: 'notation' | 'cross' | 'method' }>;
/** The guide at /academia/<segment>: the notation, the white cross or a method. */
export const guidePage = (segment: string): GuidePage =>
  segment === NOTATION ? { kind: 'notation' } : segment === CROSS ? { kind: 'cross' } : { kind: 'method', id: segment };
/** The inverse: a guide's segment. */
export const guideSegment = (p: GuidePage): string => (p.kind === 'notation' ? NOTATION : p.kind === 'cross' ? CROSS : p.id);

const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } }; // a bad deep link must not throw

export function parseRoute(pathname: string): Route {
  const [first, second, third, fourth] = pathname.split('/').filter(Boolean).map(decode);
  if (first === 'cubo' && second === PAINT) return { mod: 'cube', page: 'paint' };
  if (first === 'cubo' || first === 'guia') return { mod: 'cube' };
  if (first === PROGRESS) return { mod: 'progress' };
  if (first === ABOUT) return { mod: 'about' };
  if (first === LIBRARY) return { mod: 'academy', page: { kind: 'library' } };
  if (first === 'academia') {
    if (!second) return { mod: 'academy', page: { kind: 'home' } };
    if (second === LIBRARY) return { mod: 'academy', page: { kind: 'library' } };
    if (third === LESSON && fourth) return { mod: 'academy', page: { kind: 'lesson', course: second, id: fourth } };
    if (third === CASE && fourth) return { mod: 'academy', page: { kind: 'case', method: second, id: fourth } };
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
  if (p.kind === 'case') return `/academia/${encodeURIComponent(p.method)}/${CASE}/${encodeURIComponent(p.id)}`;
  return `/academia/${encodeURIComponent(guideSegment(p))}`;
}

let current = '';
let apply: (r: Route) => void = () => {};

function go() {
  const moved = ALIASES[location.pathname.replace(/\/+$/, '')];
  if (moved) history.replaceState(null, '', moved + location.hash);
  if (location.pathname === current) return; // e.g. an in-page #anchor: the browser just scrolls
  current = location.pathname;
  apply(parseRoute(current));
}

/** Goes to an app path (pushes history), e.g. from code rather than a link. */
export function navigate(path: string): void {
  history.pushState(null, '', path);
  go();
}

/** Applies the current URL now, then on every link click and back/forward. */
export function startRouter(onRoute: (r: Route) => void): void {
  apply = onRoute;
  addEventListener('popstate', go);
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
    if (a.getAttribute('href')!.startsWith('#')) return; // in-page anchors scroll as usual
    e.preventDefault();
    navigate(a.pathname + a.search + a.hash);
  });
  go();
}

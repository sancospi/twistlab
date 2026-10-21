// Routes: clean URLs with the History API. The server answers every path with index.html (vercel.json; Vite
// does it in dev). Links are real <a href>: same-origin clicks are handled here, the rest behave as usual.

export type AcademyPage = { kind: 'home' } | { kind: 'notation' } | { kind: 'cross' } | { kind: 'method'; id: string };
export type Route = { mod: 'solve' } | { mod: 'cube' } | { mod: 'academy'; page: AcademyPage };

const NOTATION = 'notacion';
/** Old paths that moved: the URL is rewritten to the new one. */
const ALIASES: Record<string, string> = { '/guia': '/cubo' };
const CROSS = 'cruz'; // the white-cross guide: a page of its own, not a method

export function parseRoute(pathname: string): Route {
  const [first, second] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (first === 'cubo' || first === 'guia') return { mod: 'cube' };
  if (first === 'academia') {
    if (!second) return { mod: 'academy', page: { kind: 'home' } };
    return { mod: 'academy', page: second === NOTATION ? { kind: 'notation' } : second === CROSS ? { kind: 'cross' } : { kind: 'method', id: second } };
  }
  return { mod: 'solve' }; // '/', '/resolver' and anything unknown
}

export function routePath(r: Route): string {
  if (r.mod === 'solve') return '/';
  if (r.mod === 'cube') return '/cubo';
  const p = r.page;
  if (p.kind === 'home') return '/academia';
  return `/academia/${p.kind === 'notation' ? NOTATION : p.kind === 'cross' ? CROSS : encodeURIComponent(p.id)}`;
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

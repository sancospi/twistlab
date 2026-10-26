// The app's shell, loaded by boot.ts once the page's texts are in: each URL's screen (router.ts) shown, its title and
// canonical URL, and the optional account's sync (sync.ts). The screens are their own modules: the Resolver
// (resolver.ts, with times-view.ts, round-view.ts and the smart cube's cube-link.ts), Retos (challenges-view.ts); the
// Academia, Progreso and Pinta tu cubo load when first shown (dynamic import), so the Resolver shows its scramble with
// the least code.
import { lang, langPath, pageTitle, t, type MessageKey } from './i18n.ts';
import { $, btn } from './el.ts';
import { save } from './academy/store.ts';
import { menuEntry, routePath, startRouter, type Route } from './router.ts';
import { startSync, sync } from './sync.ts';
import { setHome } from './cube-3d.ts';
import * as challenges from './challenges-view.ts';
import { conn, leaveScreen, load3d, render } from './cube-link.ts';
import * as resolver from './resolver.ts';
import { idle, setMod, type Mod } from './screen.ts';

// First visit (body.fresh, see index.html): each of the welcome card's choices hides it for good
$('welcome').onclick = (e) => {
  if (!(e.target as Element).closest('a, button')) return;
  save('cube-welcome', true);
  document.body.classList.remove('fresh');
  if ((e.target as Element).closest('#welcome-timer')) btn('start').focus(); // the card (and the focus) is gone: on to the timer
};

$('support-open').onclick = () => ($('support-dialog') as HTMLDialogElement).showModal(); // Apoya TwistLab (index.html)

// --- Menu ---
let shownMod: Mod | null = null; // the screen setModule last set up
function setModule(m: Mod) {
  if (m === shownMod) return; // e.g. between Academia pages: nothing to reset
  shownMod = m;
  setMod(m);
  resolver.leave(); // e.g. Back during inspection: no calls on another screen
  setHome(m === 'solve');
  document.body.dataset.module = m; // which screen shows (src/styles/_base.scss), the academy's wider panel…
  leaveScreen();
  render();
  if (m === 'solve') resolver.show();
  if (m === 'challenges') challenges.showChallenges(resolver.resolver);
  if (m === 'cube') idle(() => { void load3d(); void import('gan-web-bluetooth'); }); // ready for Conectar: GAN, the usual cube, connects without waiting for its library
}

// Each screen has its URL (router.ts): the menu and the Academia tiles are plain links.
let routeId = 0;
let academy: typeof import('./academy/view.ts') | undefined; // loaded by the first Academia page
// One canonical URL per screen (crawlers run this script; /resolver and the like point to /)
const canonical = document.querySelector<HTMLLinkElement>('link[rel=canonical]') // the build's static pages bring theirs (src/seo.ts)
  ?? document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }));
let shownRoute: Route | undefined;
// Each screen's name next to ☰ on phones (the library and Hoy have their own entries), and its document title (the
// Academia's pages give their own)
const MENU: Record<Route['mod'] | 'library' | 'today', MessageKey> = {
  solve: 'menu.solve', cube: 'menu.cube', academy: 'menu.academy', library: 'menu.library', today: 'menu.today',
  progress: 'nav.progress', challenges: 'challenges.title', about: 'about.menu',
};
const TITLE: Record<Exclude<Route['mod'], 'academy'>, MessageKey> = {
  solve: 'seo.homeTitle', cube: 'menu.cube', progress: 'nav.progress', challenges: 'challenges.title', about: 'about.title',
};

async function onRoute(r: Route, scroll: number | null = null) {
  const id = ++routeId;
  shownRoute = r;
  void sync(); // the account (if signed in): this page's changes go up; the account's come down if nothing is going on
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close()); // back/forward leaves any modal
  const menu = $('header-menu');
  if (menu.matches(':popover-open')) menu.hidePopover(); // phones: following a link closes the menu
  setModule(r.mod);
  const entry = menuEntry(r); // Hoy has no tab: Academia's there
  document.querySelectorAll<HTMLElement>('[data-mod]').forEach((a) => (a.dataset.mod === entry || (entry === 'today' && a.dataset.mod === 'academy' && a.closest('.tabbar'))
    ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $('header-module').textContent = t(MENU[entry]); // shown next to ☰ on phones
  // "Pinta tu cubo" (/cubo/pintar): a page of the Cubo screen, full width like the Academia
  const painting = r.mod === 'cube' && r.page === 'paint';
  document.body.toggleAttribute('data-paint', painting);
  canonical.href = `https://twistlab.app${langPath(routePath(r), lang)}`;
  if (painting) void import('./paint-view.ts').then((m) => id === routeId && m.showPaint());
  if (r.mod === 'progress') void import('./progress-view.ts').then((m) => id === routeId && m.showProgress($('mod-progress'))); // read again on every visit: the other screens may have saved
  if (painting || r.mod === 'progress' || r.mod === 'challenges' || r.mod === 'about') panelEl().scrollTop = scroll ?? 0;
  if (r.mod !== 'academy') {
    academy?.stopCase();
    academy?.stopLesson(); // a lesson left for another module lets go of the cube and its 3D player
    academy?.stopTrainers();
    document.title = pageTitle(t(painting ? 'paint.seoTitle' : TITLE[r.mod]));
    return;
  }
  const root = $('mod-academy');
  root.ariaBusy = 'true'; // its first page, coming from another screen: "…" while the Academia's code loads (_academy.scss)
  academy = await import('./academy/view.ts');
  if (id !== routeId) return;
  const title = await academy.showAcademy(root, r.page);
  root.ariaBusy = 'false';
  if (id !== routeId) return; // a newer route won while the puzzle was loading
  document.title = pageTitle(title);
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (scroll !== null) panelEl().scrollTop = scroll; // Back: where you were (e.g. down a method's case list)
  else if (target) target.scrollIntoView();
  else {
    panelEl().scrollTop = 0; // a new page starts at the top
    // and its title takes the focus, left on the body by the link that went, so a screen reader names the new page.
    // Not on the app's first page (the reader starts there anyway) nor when a control of the page kept it.
    const h = root.querySelector<HTMLElement>('h1, h2');
    if (id > 1 && h && !root.contains(document.activeElement)) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
}
const panelEl = () => document.querySelector<HTMLElement>('.panel')!;
startRouter((r, scroll) => void onRoute(r, scroll), () => panelEl().scrollTop);
// The optional account (sync.ts), once the app is up. Its changes from other devices reload the page, so never during a
// solve, a quiz (dialogs), a trainer, lesson or case practice, or with a smart cube connected (it would have to pair again).
const ACTIVE_PAGES = ['trainer', 'lesson', 'case'];
idle(() => void startSync(() => !!conn || resolver.timing() || !!document.querySelector('dialog[open]')
  || (shownRoute?.mod === 'academy' && ACTIVE_PAGES.includes(shownRoute.page.kind))));

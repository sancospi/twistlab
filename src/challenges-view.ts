// Retos (/retos) and their side in the Resolver: the duel opened by link, the Reto del día and the Reto semanal
// (daily-view.ts, weekly-view.ts: their cards and rankings, loaded with the screen). Jugar plays a challenge's scramble
// in the Resolver: it becomes the next scramble (the server gives the daily's and weekly's only then), the Resolver
// shows whose it is, and that one attempt goes back to its card, with the smart cube's log for the server to verify.
// What it needs of the Resolver (a round on, an attempt under way, making the scramble) comes in through `resolver`.
import { parseDuel } from './duel.ts';
import * as duel from './duel-view.ts'; // small; Retar shares within the tap (a share sheet needs the user's gesture)
import { t } from './i18n.ts';
import { $, el } from './el.ts';
import type { CubeLog, Result } from './timer.ts';

type Challenge = { scramble: string; label: string; done: (solve: Result, log: CubeLog | null) => void };
/** The Resolver, as Jugar needs it: whether a round is on (no challenge then), or an attempt too, and how to play. */
export interface Resolver { inRound(): boolean; busy(): boolean; play(): void }

let daily: typeof import('./daily-view.ts') | undefined;
let weekly: typeof import('./weekly-view.ts') | undefined;
let next: Challenge | null = null; // the scramble the Resolver uses next instead of a random one
let shown: Challenge | null = null; // the Resolver's scramble is this challenge's
let lastSolve: Result | null = null; // the last solve of a challenge: the stage offers Retos, where it's sent

/** The Resolver makes a new scramble: the challenge waiting to be played, if any (it's taken). */
export function takeNext(): Challenge | null {
  const c = next;
  next = shown = null;
  return c;
}
/** The Resolver's scramble is up: a challenge's (`c`) or not; the note above it says whose (one attempt). */
export function showing(c: Challenge | null) {
  shown = c;
  $('challenge-note').textContent = c ? t('challenge.playing', { name: c.label }) : '';
}
/** A new scramble made by the app, not asked for (back to the Resolver, the cube connected or lost): a challenge's
 *  scramble still unplayed stays (its first sight already counts on the server). */
export const keep = () => void (next ??= shown);
/** A solve of the scramble shown: if it's the challenge's, it goes back to its card. */
export function solved(solve: Result, scramble: string, log: CubeLog | null) {
  if (!shown || scramble !== shown.scramble) return;
  shown.done(solve, log);
  shown = null;
  lastSolve = solve;
  $('challenge-note').textContent = '';
}
export const isChallengeSolve = (r: Result | undefined) => !!r && r === lastSolve;
/** The cards again: a penalty or a deletion may change a challenge's time. */
export function renderCards() {
  daily?.render();
  weekly?.render();
  duel.render();
}

/** Jugar: the scramble `get` brings, played in the Resolver as 3x3 (`label` says whose it is there). false: a round is
 *  on (the card says so), and the scramble isn't asked for; else when it's up (rejected if it couldn't be had: the
 *  card says why). */
function playChallenge(resolver: Resolver, get: () => Promise<string>, label: string, done: Challenge['done']): false | Promise<void> {
  if (resolver.inRound()) return false;
  return get().then((scramble) => {
    if (resolver.busy()) return; // a round or an attempt started meanwhile
    next = { scramble, label, done };
    resolver.play();
  });
}

let cards: { duel: HTMLElement; daily: HTMLElement; weekly: HTMLElement } | undefined;
/** The Retos screen: built once (over the build's prerendered text), its cards fetched again on each visit. */
export function showChallenges(resolver: Resolver) {
  const root = $('mod-challenges');
  if (!cards) {
    const card = (id: string) => el('section', { id, className: 'cube-block', hidden: true });
    cards = { duel: card('duel'), daily: card('daily'), weekly: card('weekly') };
    root.replaceChildren(el('h2', { textContent: t('challenges.title') }), el('p', { className: 'hint', textContent: t('challenges.intro') }), cards.duel, cards.daily, cards.weekly);
  }
  const { duel: duelCard, daily: dailyCard, weekly: weeklyCard } = cards;
  void import('./daily-view.ts').then((d) => (daily = d).showDaily(dailyCard, (get) => playChallenge(resolver, get, t('daily.title'), (s, m) => d.solved(s, m))));
  void import('./weekly-view.ts').then((w) => (weekly = w).showWeekly(weeklyCard, (get, i) => playChallenge(resolver, get, t('weekly.playing', { n: i + 1 }), (s, m) => w.solved(i, s, m))));
  // a duel opened by link (duel.ts; router.ts brings /?reto=… here): its card, once; the link leaves the address bar
  const opened = parseDuel(location.search);
  if (opened) {
    history.replaceState(history.state, '', location.pathname + location.hash);
    duel.showDuel(duelCard, opened, (scramble) => playChallenge(resolver, () => Promise.resolve(scramble), t('duel.title'), (s) => duel.solved(s)) !== false);
  }
}

// Retos → Reto del día: the same 3x3 scramble for everyone each UTC day (api/daily.js), played with the Resolver's
// timer: Jugar asks the server for it (it's given only then: with the account, its first sight is the attempt) and makes
// it main.ts's next scramble, and that solve comes back here (solved). Anyone can play; with the
// optional account the time can be sent to the day's ranking (the first one sent counts; "verificado" when a smart
// cube's log proves it, api/daily.js: Jugar tells the server when it was played). This browser keeps each day's time
// (KEY), for the streak and to play a day once. The rankings can show the verified results only (onlyVerifiedBox).
import { lang, t, tp } from './i18n.ts';
import { el } from './el.ts';
import { api, status, waitText } from './sync.ts';
import { formatResult, type CubeLog, type Penalty, type Result } from './timer.ts';
import { isRecord, load, save, setting } from './academy/store.ts';
import { navigate } from './router.ts';

const KEY = 'cube-daily'; // {[day]: Played}: a backup key, synced (and merged day by day) with the account
export type Played = { ms: number; penalty: Penalty; at: number };
type Entry = { rank: number; name: string | null; ms: number; penalty: Penalty; verified: boolean };
type Board = { date: string; count: number; top: Entry[]; me: Entry | null };
type State = { date: string; today: Board; yesterday: Board };
/** main.ts: plays the scramble `get` brings; false if it can't now (a round), else when it's up (rejected: not had). */
export type Play = (get: () => Promise<string>) => false | Promise<void>;
/** Jugar's scramble from the server (api/daily.js POST ?play), with `body` saying which. */
export async function playScramble(path: string, body: Record<string, unknown>): Promise<string> {
  const res = await api('POST', path, body);
  if (!res.ok) throw Object.assign(new Error('play'), { status: res.status, retryAfter: Number((await res.json().catch(() => ({}))).retryAfter) || 60 });
  return (await res.json()).scramble;
}
/** What the card says when Jugar didn't play: a round on, offline (fetch rejects with a TypeError), too many tries, the
 *  day or week over (409: `over` says so and fetches the new one), or the server's error. */
export function playing(r: false | Promise<void> | void, say: (s: string) => void, over: () => void): void {
  if (r === false) return say(t('challenge.busyRound'));
  r?.catch((e: { status?: number; retryAfter?: number }) => {
    if (e.status === 409) return over();
    say(e instanceof TypeError ? t('account.offline') : e.status === 429 ? t('account.wait', { time: waitText(e.retryAfter ?? 60) }) : t('account.error'));
  });
}
/** What the card says when the server turned a send down: signed out, the day or week over (`over`), a solve that
 *  isn't valid, too many tries (`retryAfter`, the answer's), or the server's error. */
export const failText = (status: number, retryAfter: unknown, over: string): string =>
  status === 401 ? t('daily.signIn') : status === 409 ? over : status === 400 ? t('daily.bad')
    : status === 429 ? t('account.wait', { time: waitText(Number(retryAfter) || 60) }) : t('account.error');

const DAY_MS = 86_400_000;
/** Days played in a row up to `today`, or up to yesterday while today's isn't played yet. */
export function streak(days: string[], today: string): number {
  const set = new Set(days);
  const day = (back: number) => new Date(Date.parse(today) - back * DAY_MS).toISOString().slice(0, 10);
  const from = set.has(today) ? 0 : 1;
  let n = 0;
  while (set.has(day(from + n))) n++;
  return n;
}

/** A challenge's solves kept here (`key`: KEY, or weekly-view.ts's), the malformed ones left out. */
export function played(key = KEY): Record<string, Played> {
  const v = load(key);
  if (!isRecord(v)) return {};
  return Object.fromEntries(Object.entries(v as Record<string, Played>).filter(([, p]) => typeof p?.ms === 'number' && (p.penalty === 0 || p.penalty === 2000 || p.penalty === 'DNF')));
}

let box: HTMLElement | undefined;
let play: Play | (() => void) = () => {};
let state: State | null = null;
let pending: { day: string; result: Result; log: CubeLog | null } | null = null; // this page's daily solve
let live: HTMLElement | undefined; // the card's messages, read out as they change
const say = (s: string) => void (live!.textContent = s);
const p = (textContent: string, className = '') => el('p', { textContent, className });
const LONG_DAY = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' });
/** "3 mar": the days before here, the week's first and last in weekly-view.ts. */
export const shortDay = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateText = (day: string) => LONG_DAY.format(Date.parse(day));

let autoplay = false; // Jugar on /hoy: played once Retos' card has the challenge

/** The card (#daily on Retos, with its rankings in it; also on /hoy, rankings in a dialog): fetches today's challenge,
 * each time its page is shown. `onPlay`: main.ts plays the scramble in the Resolver; without it (/hoy) Jugar goes to
 * Retos and plays it from there. Offline the card stays hidden: the challenge only comes from the server. */
let retos: Play | undefined; // showDaily's onPlay: the card is Retos'
export async function showDaily(card: HTMLElement, onPlay?: Play): Promise<void> {
  box = card;
  retos = onPlay;
  play = onPlay ?? (() => { autoplay = true; navigate('/retos'); });
  live ??= el('p', { className: 'account-status', role: 'status' });
  try {
    const res = await api('GET', '/api/daily');
    if (res.ok) state = await res.json();
  } catch { /* offline: whatever was shown stays */ }
  render();
  if (autoplay && onPlay && state) {
    autoplay = false;
    if (!played()[state.date]) start();
  }
}

/** Jugar: the day's scramble, from the server, played in the Resolver. */
function start() {
  const date = state!.date;
  playing(play(() => playScramble('/api/daily?play', { date })), say, () => {
    void showDaily(box!, retos).then(() => say(t('daily.over'))); // today's, then why
  });
}

/** The daily scramble's solve (main.ts): kept for the day, with the smart cube's log if it was solved on one. */
export function solved(result: Result, log: CubeLog | null): void {
  if (!state) return;
  const all = played();
  if (all[state.date]) return; // played before (e.g. Jugar again in another tab): the first one stands
  all[state.date] = { ms: result.ms, penalty: result.penalty, at: result.at ?? Date.now() };
  save(KEY, all);
  pending = { day: state.date, result, log };
  render();
}

/** Redraws the card; main.ts calls it when its results change (a penalty given to the daily solve counts here too). */
export function render(): void {
  if (!box || !state) return;
  const s = state;
  const all = played();
  if (pending?.day === s.date && all[s.date] && all[s.date].penalty !== pending.result.penalty) {
    all[s.date].penalty = pending.result.penalty;
    save(KEY, all);
  }
  const mine = all[s.date], me = s.today.me;
  const n = streak(Object.keys(all), s.date);
  const rows: Node[] = [];
  const actions = el('div', { className: 'row' });
  if (!mine && !me) {
    rows.push(p(t('daily.hint'), 'hint'));
    actions.append(el('button', { className: 'primary', textContent: t('daily.play'), onclick: start }));
  } else {
    rows.push(p(t('daily.yours', { time: formatResult(me ?? mine) }) + (me ? ' · ' + t('daily.rank', { rank: me.rank, count: s.today.count }) : '')));
    if (!me && status.email) actions.append(el('button', { className: 'primary', textContent: t('daily.send'), onclick: (e) => void send(e.currentTarget as HTMLButtonElement) }));
    else if (!me) rows.push(el('a', { href: '/progreso', className: 'hint', textContent: t('daily.signIn') }));
  }
  const extra: Node[] = [];
  if (retos) { // Retos: the days before (the latest 5) and the rankings, in the card
    const past = Object.keys(all).filter((d) => d < s.date).sort().slice(-5).reverse();
    if (past.length) extra.push(p(t('daily.previous', { list: past.map((d) => `${shortDay.format(Date.parse(d))} ${formatResult(all[d])}`).join(' · ') }), 'hint'));
    if (ranked?.s !== s) ranked = { s, body: el('div', { className: 'stats-body' }, ...rankingBody<State>('/api/daily', s, boards)) }; // fetched again only with a new state
    extra.push(ranked.body);
  } else {
    const ranking = el('button', { type: 'button', textContent: t('daily.ranking'), onclick: showRanking });
    ranking.setAttribute('aria-haspopup', 'dialog');
    actions.append(ranking);
  }
  box.replaceChildren(
    el('div', { className: 'daily-head' }, el('h3', { id: 'daily-title', textContent: t('daily.title') }),
      el('span', { className: 'hint', textContent: [dateText(s.date), n ? tp('daily.streak', n) : ''].filter(Boolean).join(' · ') })),
    ...rows, actions, live!, ...extra);
  box.hidden = false;
}
let ranked: { s: State; body: HTMLElement } | null = null; // Retos' rankings, as drawn for that state

async function send(button: HTMLButtonElement) {
  const s = state!, mine = played()[s.date];
  button.disabled = true;
  say(t('daily.sending'));
  let res: Response;
  try {
    res = await api('POST', '/api/daily', { date: s.date, ms: mine.ms, penalty: mine.penalty, ...logFields(pending?.day === s.date ? pending.log : null) });
  } catch {
    button.disabled = false;
    return say(t('account.offline'));
  }
  const data = await res.json().catch(() => ({}));
  button.disabled = false;
  if (res.ok) {
    state = data as State;
    render();
    return say(data.saved ? t('daily.sent') : t('daily.already'));
  }
  say(failText(res.status, data.retryAfter, t('daily.over')));
}

/** A challenge's ranking (this one's and weekly-view.ts's): rank, name, then `cols` (header, and the entry's text; the
 *  first one marked when the result is verified), `empty` said instead while nobody is in it. */
export function table<E extends { rank: number | null; name: string | null; verified: boolean }>(
  b: { top: E[]; me: E | null }, empty: string, cols: [string, (e: E) => string][]): Node {
  if (!b.top.length) return p(empty, 'hint');
  const cell = (tag: 'th' | 'td', textContent: string) => el(tag, { textContent });
  const row = (e: E) => {
    const [first, ...rest] = cols.map(([, text]) => cell('td', text(e)));
    if (e.verified) first.append(' ', el('span', { className: 'daily-ok', title: t('daily.verifiedTitle'), textContent: t('daily.verified') }));
    const tr = el('tr', {}, cell('td', String(e.rank)), cell('td', e.name ?? t('daily.anon')), first, ...rest);
    if (e.rank === b.me?.rank) Object.assign(tr, { className: 'daily-me', ariaCurrent: 'true' });
    return tr;
  };
  const out = b.me?.rank && !b.top.some((e) => e.rank === b.me!.rank) ? [b.me] : []; // yours, below the top
  return el('table', { className: 'quiz-table daily-table' },
    el('thead', {}, el('tr', {}, cell('th', '#'), cell('th', t('daily.name')), ...cols.map(([head]) => cell('th', head)))),
    el('tbody', {}, ...b.top.map(row), ...out.map(row)));
}
const dayTable = (b: Board) => table(b, t('daily.empty'), [[t('daily.time'), formatResult]]);

/** A solve's log as a submission's fields: none without moves (a cube connected but not turned). */
export const logFields = (log: CubeLog | null) => (log?.moves ? { moves: log.moves, times: log.times } : { moves: null, times: null });

const ONLY_KEY = 'cube-ranking-verified';
/** The rankings' "Solo verificados" (this one's and weekly-view.ts's dialog), remembered: `fill` draws the boards for
 *  the choice now and on each change into `out`, from the server (`path`, with ?verified when checked) or `shown`. */
export function rankingBody<S>(path: string, shown: S, draw: (s: S) => Node[]): Node[] {
  const out = el('div', { className: 'stats-body' });
  const check = el('input', { type: 'checkbox', checked: setting<boolean>(ONLY_KEY, false) });
  let drawn = 0; // the latest choice's: an earlier, slower answer doesn't overwrite it
  const fill = async () => {
    const id = ++drawn;
    let s = shown, note: Node[] = [];
    if (check.checked) {
      try {
        const res = await api('GET', `${path}${path.includes('?') ? '&' : '?'}verified`);
        if (res.ok) s = await res.json();
        else note = [p(t('account.error'), 'hint')];
      } catch {
        note = [p(t('account.offline'), 'hint')];
      }
    }
    if (id === drawn) out.replaceChildren(...note, ...draw(s));
  };
  check.onchange = () => {
    save(ONLY_KEY, check.checked);
    document.dispatchEvent(new Event(ONLY_KEY)); // Retos' other card: the same choice
  };
  const sync = () => {
    if (!check.isConnected && drawn) return document.removeEventListener(ONLY_KEY, sync); // a card drawn again since
    check.checked = setting<boolean>(ONLY_KEY, false);
    void fill();
  };
  document.addEventListener(ONLY_KEY, sync);
  void fill();
  return [el('label', { className: 'only-verified', title: t('daily.verifiedTitle') }, check, ' ', t('daily.onlyVerified')), out];
}

/** Today's ranking and yesterday's final one. */
const boards = (v: State): Node[] => [
  el('section', { className: 'stats-body' }, el('h4', { textContent: `${dateText(v.date)} · ${tp('daily.players', v.today.count)}` }), dayTable(v.today)),
  ...(v.yesterday.count ? [el('section', { className: 'stats-body' },
    el('h4', { textContent: t('daily.yesterday', { date: dateText(v.yesterday.date) }) }), dayTable(v.yesterday))] : []),
];

/** /hoy: the rankings in a dialog. */
function showRanking() {
  const s = state;
  const dialog = document.getElementById('daily-dialog') as HTMLDialogElement;
  if (!s) return;
  document.getElementById('daily-dialog-title')!.textContent = t('daily.title');
  document.getElementById('daily-body')!.replaceChildren(...rankingBody<State>('/api/daily', s, boards));
  dialog.showModal();
}

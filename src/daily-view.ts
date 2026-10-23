// Resolver → Reto del día: the same 3x3 scramble for everyone each UTC day (api/daily.js), played with the Resolver's
// timer: Jugar makes it main.ts's next scramble, and that solve comes back here (solved). Anyone can play; with the
// optional account the time can be sent to the day's ranking (the first one sent counts; "con movimientos" when a smart
// cube's moves solve the scramble). This browser keeps each day's time (KEY), for the streak and to play a day once.
import { lang, t, tp } from './i18n.ts';
import { el } from './el.ts';
import { api, status } from './sync.ts';
import { formatResult, type Penalty, type Result } from './timer.ts';
import { load, save } from './academy/store.ts';
import { navigate } from './router.ts';

const KEY = 'cube-daily'; // {[day]: Played}: a backup key, synced (and merged day by day) with the account
type Played = { ms: number; penalty: Penalty; at: number };
type Entry = { rank: number; name: string | null; ms: number; penalty: Penalty; verified: boolean };
type Board = { date: string; count: number; top: Entry[]; me: Entry | null };
type State = { date: string; scramble: string; today: Board; yesterday: Board };

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

function played(): Record<string, Played> {
  const v = load(KEY);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v as Record<string, Played>).filter(([, p]) => typeof p?.ms === 'number' && (p.penalty === 0 || p.penalty === 2000 || p.penalty === 'DNF')));
}

let box: HTMLElement | undefined;
let play: (scramble: string) => void = () => {};
let state: State | null = null;
let pending: { day: string; result: Result; moves: string | null } | null = null; // this page's daily solve
let live: HTMLElement | undefined; // the card's messages, read out as they change
const say = (s: string) => void (live!.textContent = s);
const p = (textContent: string, className = '') => el('p', { textContent, className });
const dateText = (day: string) => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.parse(day));

let autoplay = false; // Jugar on /hoy: played once the Resolver's card has the challenge

/** The card (#daily in the Resolver, also on /hoy): fetches today's challenge, each time its page is shown. `onPlay`:
 * main.ts makes the scramble its next one; without it (/hoy) Jugar goes to the Resolver and plays it there.
 * Offline the card stays hidden: the scramble only comes from the server. */
export async function showDaily(card: HTMLElement, onPlay?: (scramble: string) => void): Promise<void> {
  box = card;
  play = onPlay ?? (() => { autoplay = true; navigate('/'); });
  live ??= el('p', { className: 'account-status', role: 'status' });
  try {
    const res = await api('GET', '/api/daily');
    if (res.ok) state = await res.json();
  } catch { /* offline: whatever was shown stays */ }
  render();
  if (autoplay && onPlay && state) {
    autoplay = false;
    if (!played()[state.date]) onPlay(state.scramble);
  }
}

/** The daily scramble's solve (main.ts): kept for the day, with the smart cube's moves if it was solved on one. */
export function solved(result: Result, moves: string | null): void {
  if (!state) return;
  const all = played();
  if (all[state.date]) return; // played before (e.g. Jugar again in another tab): the first one stands
  all[state.date] = { ms: result.ms, penalty: result.penalty, at: result.at ?? Date.now() };
  save(KEY, all);
  pending = { day: state.date, result, moves };
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
    actions.append(el('button', { className: 'primary', textContent: t('daily.play'), onclick: () => play(s.scramble) }));
  } else {
    rows.push(p(t('daily.yours', { time: formatResult(me ?? mine) }) + (me ? ' · ' + t('daily.rank', { rank: me.rank, count: s.today.count }) : '')));
    if (me && !me.name) rows.push(el('a', { href: '/progreso', className: 'hint', textContent: t('daily.noName') }));
    else if (!me && status.email) actions.append(el('button', { className: 'primary', textContent: t('daily.send'), onclick: (e) => void send(e.currentTarget as HTMLButtonElement) }));
    else if (!me) rows.push(el('a', { href: '/progreso', className: 'hint', textContent: t('daily.signIn') }));
  }
  const ranking = el('button', { type: 'button', textContent: t('daily.ranking'), onclick: showRanking });
  ranking.setAttribute('aria-haspopup', 'dialog');
  actions.append(ranking);
  box.replaceChildren(
    el('div', { className: 'daily-head' }, el('h3', { id: 'daily-title', textContent: t('daily.title') }),
      el('span', { className: 'hint', textContent: [dateText(s.date), n ? tp('daily.streak', n) : ''].filter(Boolean).join(' · ') })),
    ...rows, actions, live!);
  box.hidden = false;
}

async function send(button: HTMLButtonElement) {
  const s = state!, mine = played()[s.date];
  button.disabled = true;
  say(t('daily.sending'));
  let res: Response;
  try {
    res = await api('POST', '/api/daily', { date: s.date, ms: mine.ms, penalty: mine.penalty, moves: pending?.day === s.date ? pending.moves : null });
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
  const wait = Number(data.retryAfter) || 60;
  say(res.status === 401 ? t('daily.signIn') : res.status === 409 ? t('daily.over') : res.status === 400 ? t('daily.bad')
    : res.status === 429 ? t('account.wait', { time: wait < 120 ? `${wait} s` : `${Math.ceil(wait / 60)} min` }) : t('account.error'));
}

function table(b: Board): Node {
  if (!b.top.length) return p(t('daily.empty'), 'hint');
  const cell = (tag: 'th' | 'td', textContent: string) => el(tag, { textContent });
  const row = (e: Entry) => {
    const time = el('td', { textContent: formatResult(e) });
    if (e.verified) time.append(' ', el('span', { className: 'daily-ok', title: t('daily.verifiedTitle'), textContent: t('daily.verified') }));
    const tr = el('tr', {}, cell('td', String(e.rank)), cell('td', e.name ?? t('daily.anon')), time);
    if (e.rank === b.me?.rank) tr.className = 'daily-me';
    return tr;
  };
  const out = b.me && !b.top.some((e) => e.rank === b.me!.rank) ? [b.me] : []; // yours, below the top
  return el('table', { className: 'quiz-table daily-table' },
    el('thead', {}, el('tr', {}, cell('th', '#'), cell('th', t('daily.name')), cell('th', t('daily.time')))),
    el('tbody', {}, ...b.top.map(row), ...out.map(row)));
}

function showRanking() {
  const s = state;
  const dialog = document.getElementById('daily-dialog') as HTMLDialogElement;
  if (!s) return;
  document.getElementById('daily-body')!.replaceChildren(
    el('section', { className: 'stats-body' }, el('h3', { textContent: `${dateText(s.date)} · ${tp('daily.players', s.today.count)}` }), table(s.today)),
    ...(s.yesterday.count ? [el('section', { className: 'stats-body' },
      el('h3', { textContent: t('daily.yesterday', { date: dateText(s.yesterday.date) }) }), table(s.yesterday))] : []),
  );
  dialog.showModal();
}

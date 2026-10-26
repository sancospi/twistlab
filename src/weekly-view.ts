// Retos → Reto semanal: the same 5 3x3 scrambles for everyone each week, Monday to Sunday UTC (api/daily.js ?week),
// ranked by their WCA average of 5. Jugar asks the server for the next one (given only then, as the daily's) and plays it
// with the Resolver's timer (main.ts), and that solve comes
// back here (solved). Anyone can play; with the optional account the solves can be sent to the week's ranking (each
// the first sent; "verificado" when a smart cube's log proves it, daily-view.ts). This browser keeps each solve (KEY), synced
// with the account entry by entry. Until the server has the challenge (503) the card stays hidden.
import { t, tp } from './i18n.ts';
import { el } from './el.ts';
import { api, status } from './sync.ts';
import { average, formatAverage, formatResult, type CubeLog, type Penalty, type Result } from './timer.ts';
import { failText, logFields, played, playing, playScramble, rankingBody, shortDay, table, type Played } from './daily-view.ts';
import { save } from './academy/store.ts';

const KEY = 'cube-weekly'; // {['week:index']: Played}: a backup key, synced (and merged solve by solve) with the account
const SOLVES = 5;
type Entry = { rank: number | null; name: string | null; avg: number | 'DNF' | null; best: number | 'DNF'; done: number; verified: boolean };
type Board = { count: number; top: Entry[]; me: Entry | null };
type State = { week: string; board: Board & { solves: { index: number; ms: number; penalty: Penalty }[] }; last: Board & { week: string } };

const id = (week: string, index: number) => `${week}:${index}`;

let box: HTMLElement | undefined;
let play: (get: () => Promise<string>, index: number) => false | Promise<void> = () => false;
let state: State | null = null;
const pending = new Map<string, { result: Result; log: CubeLog | null }>(); // this page's solves by id(): their cube's log, their penalty
let live: HTMLElement | undefined;
const say = (s: string) => void (live!.textContent = s);
const p = (textContent: string, className = '') => el('p', { textContent, className });
const dates = (week: string) => `${shortDay.format(Date.parse(week))} – ${shortDay.format(Date.parse(week) + 6 * 86_400_000)}`;
const avgText = (v: number | 'DNF' | null) => formatAverage(v === 'DNF' ? Infinity : v);

/** The card (#weekly in the Resolver): fetches this week's challenge each time the Resolver is shown. `onPlay`: main.ts
 * makes that scramble its next one. */
export async function showWeekly(card: HTMLElement, onPlay: typeof play): Promise<void> {
  box = card;
  play = onPlay;
  live ??= el('p', { className: 'account-status', role: 'status' });
  try {
    const res = await api('GET', '/api/daily?week');
    if (res.ok) state = await res.json();
  } catch { /* offline: whatever was shown stays */ }
  render();
}

/** One of the week's scrambles solved (main.ts): kept, with the smart cube's log if it was solved on one. */
export function solved(index: number, result: Result, log: CubeLog | null): void {
  if (!state) return;
  const all = played(KEY);
  if (all[id(state.week, index)]) return; // played before (another tab): the first one stands
  all[id(state.week, index)] = { ms: result.ms, penalty: result.penalty, at: result.at ?? Date.now() };
  save(KEY, all);
  pending.set(id(state.week, index), { result, log });
  render();
}

/** This week's solves by index: the ones sent (the server's) over the ones kept here. */
function mine(s: State): (Played | undefined)[] {
  const all = played(KEY);
  return Array.from({ length: SOLVES }, (_, i) => s.board.solves.find((x) => x.index === i) as Played | undefined ?? all[id(s.week, i)]);
}

/** Redraws the card; main.ts calls it when its results change (a penalty given to a weekly solve counts here too). */
export function render(): void {
  if (!box || !state) return;
  live!.textContent = ''; // a message is about the last action, not the card's state
  const s = state;
  const all = played(KEY);
  for (const [k, { result }] of pending) if (all[k] && all[k].penalty !== result.penalty) all[k].penalty = result.penalty; // a penalty given after
  save(KEY, all);
  const solves = mine(s);
  const next = solves.findIndex((x) => !x);
  const unsent = solves.flatMap((x, i) => (x && !s.board.solves.some((y) => y.index === i) ? [i] : []));
  const me = s.board.me;
  const rows: Node[] = [];
  const actions = el('div', { className: 'row' });
  if (next < 0 || solves.some(Boolean)) {
    const times = solves.map((x, i) => `${i + 1}. ${x ? formatResult(x) : '–'}`).join(' · ');
    rows.push(p(times));
    const avg = next < 0 ? average(solves as Played[], SOLVES) : null;
    if (avg !== null) rows.push(p(t('weekly.avg', { avg: formatAverage(avg) }) + (me?.rank ? ' · ' + t('daily.rank', { rank: me.rank, count: s.board.count }) : '')));
  } else rows.push(p(t('weekly.hint'), 'hint'));
  if (next >= 0) actions.append(el('button', { className: 'primary', textContent: t('weekly.play', { n: next + 1 }), onclick: () => playing(play(() => playScramble('/api/daily?week&play', { week: s.week, index: next }), next), say,
    () => void showWeekly(box!, play).then(() => say(t('weekly.over')))) })); // this week's, then why
  if (unsent.length && status.email) actions.append(el('button', { className: next < 0 ? 'primary' : '', textContent: t('daily.send'), onclick: (e) => void send(e.currentTarget as HTMLButtonElement, unsent) }));
  else if (unsent.length) rows.push(el('a', { href: '/progreso', className: 'hint', textContent: t('daily.signIn') }));
  // the rankings in the card (Retos), drawn again (and fetched, for the verified ones) only with a new state
  if (ranked?.s !== s) ranked = { s, body: el('div', { className: 'stats-body' }, ...rankingBody<State>('/api/daily?week', s, (v) => [
    el('section', { className: 'stats-body' }, el('h4', { textContent: `${dates(v.week)} · ${tp('weekly.players', v.board.count)}` }), weekTable(v.board)),
    ...(v.last.count ? [el('section', { className: 'stats-body' }, el('h4', { textContent: t('weekly.last', { dates: dates(v.last.week) }) }), weekTable(v.last))] : []),
  ])) };
  box.replaceChildren(
    el('div', { className: 'daily-head' }, el('h3', { id: 'weekly-title', textContent: t('weekly.title') }), el('span', { className: 'hint', textContent: dates(s.week) })),
    ...rows, actions, live!, ranked.body);
  box.hidden = false;
}
let ranked: { s: State; body: HTMLElement } | null = null;

/** Sends the solves kept here and not sent yet, in order: each answer that went through is the new state; one that
 *  isn't valid (400) is skipped, anything else stops (signed out, the week over, too many, offline). */
async function send(button: HTMLButtonElement, indexes: number[]) {
  const s = state!, solves = mine(s);
  button.disabled = true;
  say(t('daily.sending'));
  let res: Response | undefined;
  let data: Record<string, unknown> = {};
  let sent = false, bad = false;
  for (const index of indexes) {
    const x = solves[index]!;
    try {
      res = await api('POST', '/api/daily?week', { week: s.week, index, ms: x.ms, penalty: x.penalty, ...logFields(pending.get(id(s.week, index))?.log ?? null) });
    } catch {
      res = undefined;
      break;
    }
    data = await res.json().catch(() => ({}));
    if (res.ok) [state, sent] = [data as unknown as State, true];
    else if (res.status === 400) bad = true;
    else break;
  }
  button.disabled = false;
  if (sent) render();
  if (!res) return say(t('account.offline'));
  if (res.ok) return say(t(bad ? 'daily.bad' : 'weekly.sent'));
  say(failText(res.status, data.retryAfter, t('weekly.over')));
}

const weekTable = (b: Board) => table(b, t('weekly.empty'), [[t('weekly.avgCol'), (e: Entry) => avgText(e.avg)], [t('weekly.best'), (e: Entry) => avgText(e.best)]]);


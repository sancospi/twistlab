// A duel by link (no account, no server): a solve's scramble and time in the Resolver's URL, ?reto=…&t=…&p=…. Whoever
// opens it plays that scramble once (main.ts, duel-view.ts) and sees who won; they can answer with their own link.
// ponytail: the time isn't checked (anyone can edit the link); fine among friends, the rankings are the daily's and weekly's.
import { resultValue, type Penalty, type Result } from './timer.ts';

export interface Duel { scramble: string; ms: number; penalty: Penalty }
export const DUEL_PARAM = 'reto';
const MOVES = /^[URFDLB](2|')?( [URFDLB](2|')?){0,39}$/; // a 3x3 scramble: face turns, at most 40
const PENALTIES: Record<string, Penalty> = { '': 0, 2: 2000, dnf: 'DNF' };
const MAX_MS = 86_400_000; // a sanity cap: any time a solve can have is a duel

/** The link to `page` (the Resolver, in the sender's language) that challenges with `d`. */
export function duelLink(page: string, d: Duel): string {
  const url = new URL(page);
  url.search = '';
  url.searchParams.set(DUEL_PARAM, d.scramble);
  url.searchParams.set('t', String(d.ms));
  if (d.penalty) url.searchParams.set('p', d.penalty === 'DNF' ? 'dnf' : '2');
  return url.toString();
}

/** The duel in a URL's query, if it is one: a 3x3 scramble, a time (ms, up to a day) and its penalty. */
export function parseDuel(search: string): Duel | null {
  const q = new URLSearchParams(search);
  const p = q.get('p') ?? '', scramble = q.get(DUEL_PARAM) ?? '', ms = Number(q.get('t'));
  const penalty = Object.hasOwn(PENALTIES, p) ? PENALTIES[p] : undefined; // own keys only: not ?p=constructor
  if (!MOVES.test(scramble) || !Number.isSafeInteger(ms) || ms < 1 || ms > MAX_MS || penalty === undefined) return null;
  return { scramble, ms, penalty };
}

/** The challenged's result against the challenger's: their final times (a DNF loses, two DNFs tie). */
export function outcome(mine: Pick<Result, 'ms' | 'penalty'>, theirs: Duel): 'win' | 'lose' | 'tie' {
  const a = resultValue(mine), b = resultValue(theirs);
  return a === b ? 'tie' : a < b ? 'win' : 'lose';
}

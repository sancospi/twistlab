// The weekly challenge's pure rules (api/daily.js ?week): the week of a time, its 5 scrambles in the pool, what a
// submitted solve may be, and its ranking by the WCA average of 5 (as the timer counts it, src/timer.ts average).
import { MAX_MS, MIN_MS, parseSubmission, utcDay } from './daily.js';

export const SOLVES = 5;
export const TOP = 50; // this week's ranking
export const TOP_LAST = 10; // last week's, final
const WEEK_MS = 7 * 86_400_000;

/** The week of a time: its Monday ('YYYY-MM-DD', UTC). @param {number} ms */
export const weekOf = (ms) => utcDay(ms - ((new Date(ms).getUTCDay() + 6) % 7) * 86_400_000);

/** The week's `k`-th scramble in a pool of `n` that starts on the Monday `start`: 5 a week, from the first again after
 * the last. @param {string} week @param {string} start @param {number} n @param {number} k */
export function scrambleIndex(week, start, n, k) {
  const w = Math.round((Date.parse(week) - Date.parse(start)) / WEEK_MS);
  return (((w * SOLVES + k) % n) + n) % n;
}

/** @typedef {{ week: string, index: number, ms: number, penalty: 0 | 2000 | 'DNF', moves: string | null, times: number[] | null }} WeeklySubmission */

/** A submitted solve ({week, index, ms, penalty, moves?}) if valid: the daily's rules for the time, the penalty and the
 * moves, and which of the week's solves it is (0 to 4); else null. A time under 3 s or of 10 min and over is a DNF, not
 * an error: each scramble has one attempt, and rejecting it would leave the week incomplete.
 * @param {Record<string, unknown> | null} b @returns {WeeklySubmission | null} */
export function parseWeekly(b) {
  if (!b || !Number.isInteger(b.index) || /** @type {number} */ (b.index) < 0 || /** @type {number} */ (b.index) >= SOLVES) return null;
  const ms = b.ms, out = typeof ms === 'number' && Number.isSafeInteger(ms) && ms >= 0 && (ms < MIN_MS || ms >= MAX_MS);
  const s = parseSubmission({ ...b, date: b.week, ...(out && { ms: Math.min(Math.max(ms, MIN_MS), MAX_MS - 1), penalty: 'DNF', times: null }) }); // a DNF: its log's times are moot
  return s && { week: s.date, index: /** @type {number} */ (b.index), ms: s.ms, penalty: s.penalty, moves: s.moves, times: s.times };
}

/** A POST ?play of the weekly ({week, index}): its key in challenge_plays ('w:<week>:<index>') if it's one of this week's
 * (`current`) solves, else null. @param {Record<string, unknown> | null} b @param {string} current */
export const parseWeekPlay = (b, current) =>
  b && b.week === current && Number.isInteger(b.index) && /** @type {number} */ (b.index) >= 0 && /** @type {number} */ (b.index) < SOLVES ? `w:${current}:${b.index}` : null;

/** @param {{ ms: number, penalty: 0 | 2000 | 'DNF' | string }} r */
const value = (r) => (r.penalty === 'DNF' ? Infinity : r.ms + Number(r.penalty));

/** The WCA average of 5: best and worst out, the mean of the other 3 rounded to hundredths (to the second from 10
 * minutes); Infinity (DNF) with two DNFs; null until all 5. @param {{ ms: number, penalty: 0 | 2000 | 'DNF' | string }[]} solves */
export function ao5(solves) {
  if (solves.length < SOLVES) return null;
  const kept = solves.map(value).sort((a, b) => a - b).slice(1, SOLVES - 1);
  if (kept.includes(Infinity)) return Infinity;
  const mean = kept.reduce((a, b) => a + b, 0) / kept.length;
  return mean < 600_000 ? Math.round(mean / 10) * 10 : Math.round(mean / 1000) * 1000;
}

/** @typedef {{ rank: number | null, name: string | null, avg: number | 'DNF' | null, best: number | 'DNF', done: number, verified: boolean }} WeeklyEntry */

/** A week's results (one row per account and solve) ranked: complete averages, best first; a tie goes to the best
 * single, then to who finished first. `me`: the account's entry wherever it is (rank null until its 5 solves).
 * ponytail: the week's rows ranked whole on each read; a stored average if a week ever gets thousands of players.
 * @param {{ user_id: number, name: string | null, index: number, ms: number, penalty: string, verified: boolean, at: unknown }[]} rows
 * @param {number} top @param {number} [me] @returns {{ count: number, top: WeeklyEntry[], me: WeeklyEntry | null }} */
export function rank(rows, top, me = 0) {
  /** @type {Map<number, typeof rows>} */
  const byUser = new Map();
  for (const r of rows) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
  const people = [...byUser].map(([user, solves]) => {
    const avg = ao5(solves);
    const best = Math.min(...solves.map(value));
    const done = Math.max(...solves.map((s) => new Date(/** @type {any} */ (s.at)).getTime()));
    return { user, name: solves[0].name, avg, best, done, n: solves.length, verified: solves.length === SOLVES && solves.every((s) => s.verified) };
  });
  const ranked = people.filter((x) => x.avg !== null)
    .sort((a, b) => /** @type {number} */ (a.avg) - /** @type {number} */ (b.avg) || a.best - b.best || a.done - b.done);
  /** @param {(typeof people)[number]} x @param {number | null} r @returns {WeeklyEntry} */
  const entry = (x, r) => ({ rank: r, name: x.name, avg: x.avg === Infinity ? 'DNF' : x.avg, best: x.best === Infinity ? 'DNF' : x.best, done: x.n, verified: x.verified });
  const mine = people.find((x) => x.user === me);
  const at = mine ? ranked.indexOf(mine) : -1;
  return { count: ranked.length, top: ranked.slice(0, top).map((x, i) => entry(x, i + 1)), me: mine ? entry(mine, at >= 0 ? at + 1 : null) : null };
}

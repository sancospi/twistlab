// The daily challenge's pure rules (api/daily.js): the day's scramble in the pool, what a submitted time may be, the
// check of a smart cube's moves, and the account's public name (api/account/name.js).

export const MIN_MS = 3000;
export const MAX_MS = 600_000; // under 10 minutes
export const MAX_MOVES = 2000;
export const MAX_TPS = 20; // moves a second over the whole solve: beyond any human, so not a real cube's log
export const TOP = 50; // today's ranking
export const TOP_YESTERDAY = 10;

/** The UTC day ('YYYY-MM-DD') of a time. @param {number} ms */
export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/** A day's scramble in a pool of `n` that starts on `start`: one a day, from the first again after the last.
 * @param {string} day @param {string} start @param {number} n */
export function dayIndex(day, start, n) {
  const d = Math.round((Date.parse(day) - Date.parse(start)) / 86_400_000);
  return ((d % n) + n) % n;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MOVES = /^[URFDLB](2'|['2])?( [URFDLB](2'|['2])?)*$/; // face turns, space-separated (a smart cube's are quarter turns)

/** @typedef {{ date: string, ms: number, penalty: 0 | 2000 | 'DNF', moves: string | null }} Submission */

/** A submitted result ({date, ms, penalty, moves?}) if valid: a day, a whole number of ms in [MIN_MS, MAX_MS), a
 * penalty of the timer's (0, 2000 = +2, 'DNF') and, if any, a move log of at most MAX_MOVES face turns; else null.
 * @param {Record<string, unknown> | null} b @returns {Submission | null} */
export function parseSubmission(b) {
  if (!b) return null;
  const { date, ms, penalty, moves } = b;
  if (typeof date !== 'string' || !DAY.test(date)) return null;
  if (typeof ms !== 'number' || !Number.isSafeInteger(ms) || ms < MIN_MS || ms >= MAX_MS) return null;
  if (penalty !== 0 && penalty !== 2000 && penalty !== 'DNF') return null;
  if (moves != null && moves !== '' && (typeof moves !== 'string' || !MOVES.test(moves) || moves.split(' ').length > MAX_MOVES)) return null;
  return { date, ms, penalty, moves: moves || null };
}

/** Whether a smart cube's moves, done in `ms`, solve the scramble (any orientation): the "con movimientos" badge. It
 * proves the moves solve it at a human pace, not who turned them nor the time (anyone can send the scramble's inverse
 * with a made-up time), so the badge claims no more than that.
 * @param {string} scramble @param {string} moves @param {number} ms */
export async function verify(scramble, moves, ms) {
  if (moves.split(' ').length / (ms / 1000) > MAX_TPS) return false;
  const { cube3x3x3 } = await import('cubing/puzzles');
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern().applyAlg(scramble).applyAlg(moves);
  return solved.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
}

/** The account's public name, NFC, trimmed with its spaces collapsed: 2 to 20 letters, digits, spaces, _ or -, a
 * letter's accents at most 2 (Thai stacks 2; more spill over the ranking's rows), not posing as the site; '' = none
 * (shown as "Anónimo"); null if not valid. @param {unknown} raw */
export function normalizeName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (name === '') return name;
  const ok = /^[\p{L}\p{M}\p{N} _-]{2,20}$/u.test(name) && !/\p{M}{3}|(^|[^\p{L}\p{M}])\p{M}/u.test(name) && !/twistlab|\badmin/i.test(name);
  return ok ? name : null;
}

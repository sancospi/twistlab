// The daily challenge's pure rules (api/daily.js): the day's scramble in the pool, what a submitted time may be, the
// check of a smart cube's moves, and the account's public name (api/account/name.js) with the random one it starts with.
import { animals, colors, NumberDictionary, uniqueNamesGenerator } from 'unique-names-generator';

export const MIN_MS = 3000;
export const MAX_MS = 600_000; // under 10 minutes
export const MAX_MOVES = 2000;
export const MAX_TPS = 20; // moves a second over the whole solve: beyond any human, so not a real cube's log
export const MAX_BURST = 25; // moves within any one second: beyond the fastest human burst
export const TIME_SLACK = 1000; // ms the last move's time may be off the clock's stop (Bluetooth, the cube's own clock)
export const INSPECT_MS = 17_000; // inspection, its +2 included (a later start is a DNF)
export const SEND_MS = 15 * 60_000; // a verified result is sent within this of its solve's end

/** Whether a result of `ms` sent `ago` ms after its scramble was first played (null: never) fits: no sooner than its
 * time, no later than inspection, its time and SEND_MS (the first sight of the scramble is the attempt, not a rehearsal).
 * @param {number | null} ago @param {number} ms */
export const playedInTime = (ago, ms) => ago !== null && ago >= ms && ago <= ms + INSPECT_MS + SEND_MS;
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

/** @typedef {{ date: string, ms: number, penalty: 0 | 2000 | 'DNF', moves: string | null, times: number[] | null }} Submission */

/** A submitted result ({date, ms, penalty, moves?, times?}) if valid: a day, a whole number of ms in [MIN_MS, MAX_MS),
 * a penalty of the timer's (0, 2000 = +2, 'DNF') and, if any, a move log of at most MAX_MOVES face turns; else null.
 * With the log, when each move was made (whole ms from the clock's start, in order, one per move): times that aren't
 * that leave it null (the result just can't be verified, it isn't refused).
 * @param {Record<string, unknown> | null} b @returns {Submission | null} */
export function parseSubmission(b) {
  if (!b) return null;
  const { date, ms, penalty, moves, times } = b;
  if (typeof date !== 'string' || !DAY.test(date)) return null;
  if (typeof ms !== 'number' || !Number.isSafeInteger(ms) || ms < MIN_MS || ms >= MAX_MS) return null;
  if (penalty !== 0 && penalty !== 2000 && penalty !== 'DNF') return null;
  if (moves != null && moves !== '' && (typeof moves !== 'string' || !MOVES.test(moves) || moves.split(' ').length > MAX_MOVES)) return null;
  const log = typeof moves === 'string' && moves ? moves : null;
  const timed = !!log && Array.isArray(times) && times.length === log.split(' ').length
    && times.every((x, i) => Number.isSafeInteger(x) && x >= -TIME_SLACK && x <= MAX_MS + TIME_SLACK && x >= (times[i - 1] ?? x));
  return { date, ms, penalty, moves: log, times: timed ? /** @type {number[]} */ (times) : null };
}

/** Whether a smart cube's log is a real solve of the scramble in `ms` (the "verified" badge): the moves solve it (any
 * orientation), at a human pace overall and in every second, and their times end where the clock stopped. It proves
 * a cube was turned that way, not by whom; api/daily.js also asks that it was played (Jugar) at least `ms` before.
 * @param {string} scramble @param {string} moves @param {number} ms @param {number[] | null} times */
export async function verify(scramble, moves, ms, times) {
  const n = moves.split(' ').length;
  if (!times || n / (ms / 1000) > MAX_TPS || Math.abs(times[n - 1] - ms) > TIME_SLACK) return false;
  for (let i = 0, j = 0; i < n; i++) { // j: the first move less than a second before move i
    while (times[i] - times[j] >= 1000) j++;
    if (i - j + 1 > MAX_BURST) return false;
  }
  const { cube3x3x3 } = await import('cubing/puzzles');
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern().applyAlg(scramble).applyAlg(moves);
  return solved.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
}

/** The account's public name, NFC, trimmed with its spaces collapsed: 2 to 20 letters, digits, spaces, _ or -, a
 * letter's accents at most 2 (Thai stacks 2; more spill over the ranking's rows), not posing as the site; null if not
 * valid (empty included: every account has one, randomName's until it picks its own). @param {unknown} raw */
export function normalizeName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  const ok = /^[\p{L}\p{M}\p{N} _-]{2,20}$/u.test(name) && !/\p{M}{3}|(^|[^\p{L}\p{M}])\p{M}/u.test(name) && !/twistlab|\badmin/i.test(name);
  return ok ? name : null;
}

// randomName's words: the library's colors and animals but those that read badly on a public ranking, alone or
// after a color (skin colors, apes, pests, insults, taxonomy). ponytail: an English list vetted by hand; Spanish and
// Portuguese ones of our own if names in the user's language ever matter.
const COLORS = colors.filter((c) => !['black', 'white', 'brown', 'yellow'].includes(c));
const LEFT_OUT = new Set(('ape baboon bonobo chimpanzee gibbon gorilla mandrill marmoset monkey orangutan primate tarsier '
  + 'bedbug booby cockroach earthworm flea hookworm leech louse mite roundworm slug tick worm pig rat snake gayal '
  + 'amphibian bovid canid canidae cephalopod felidae galliform mammal marsupial mollusk pinniped planarian reptile rodent xerinae').split(' '));
const ANIMALS = animals.filter((a) => !LEFT_OUT.has(a));

/** A public name for an account that has none yet: a color, an animal and 2 digits ("CoralOtter42"), up to 20
 * characters (normalizeName's). Not unique by itself: the database refuses a taken one (server.js, giveName). */
export function randomName() {
  for (;;) {
    const name = uniqueNamesGenerator({ dictionaries: [COLORS, ANIMALS, NumberDictionary.generate({ min: 10, max: 99 })], separator: '', style: 'capital' });
    if (name.length <= 20) return name;
  }
}

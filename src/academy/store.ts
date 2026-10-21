// What the academy remembers in this browser: the algorithm chosen for each case, practice stats and the last choices
// made in the trainers (level, sizes, toggles).
// Storage may be unavailable or hand-edited, so every access is guarded and every read is validated.
import type { AlgVariant, Case } from './types.ts';
import { tokenize } from '../notation.ts';

/** One guided repetition of an algorithm on the cube. */
export interface Rep {
  ms: number; // first move to done
  moves: number; // quarter turns reported by the cube
  htm: number; // the same moves in half-turn metric
  clean: boolean; // no wrong move
}

export interface CaseStats {
  reps: number;
  clean: number;
  best: number | null; // ms
  last: number[]; // ms of the last reps, newest first
  streak: number; // clean reps in a row right now
  bestStreak: number;
  lastPracticed: number; // epoch ms
}

const LAST = 10; // the average shown is over these many reps
const PREFS_KEY = 'academy-prefs';
const STATS_KEY = 'academy-stats';

export const STREAK_GOAL = 10; // the plan's drill criterion: 10 in a row without a mistake

const isTime = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

/** Stats with a new rep folded in. */
export function addRep(s: CaseStats | undefined, rep: Rep, now: number): CaseStats {
  const streak = rep.clean ? (s?.streak ?? 0) + 1 : 0;
  return {
    reps: (s?.reps ?? 0) + 1,
    clean: (s?.clean ?? 0) + (rep.clean ? 1 : 0),
    best: s?.best == null ? rep.ms : Math.min(s.best, rep.ms),
    last: [rep.ms, ...(s?.last ?? [])].slice(0, LAST),
    streak,
    bestStreak: Math.max(s?.bestStreak ?? 0, streak),
    lastPracticed: now,
  };
}

export const average = (s: CaseStats): number | null => (s.last.length ? s.last.reduce((a, b) => a + b, 0) / s.last.length : null);

/** Keeps only well-formed entries: anything else in storage is dropped, never trusted. */
export function parseStats(raw: unknown): Record<string, CaseStats> {
  const out: Record<string, CaseStats> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, s] of Object.entries(raw as Record<string, Partial<CaseStats>>)) {
    if (!s || typeof s !== 'object') continue;
    const { reps, clean, best, last, streak, bestStreak, lastPracticed } = s;
    if (!isCount(reps) || !isCount(clean) || clean > reps || !isCount(streak) || !isCount(bestStreak) || !isTime(lastPracticed)) continue;
    if (best !== null && !isTime(best)) continue;
    if (!Array.isArray(last) || !last.every(isTime)) continue;
    out[id] = { reps, clean, best, last: last.slice(0, LAST), streak, bestStreak, lastPracticed };
  }
  return out;
}

export function parsePrefs(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === 'string'));
}

export function load(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}
export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {} // private mode / quota: the session still works, it just isn't remembered
}

/** A remembered choice (a string, number or boolean): the stored value if it has the fallback's type and passes `ok`, else the fallback. */
export function setting<T>(key: string, fallback: T, ok: (v: T) => boolean = () => true): T {
  const v = load(key);
  return typeof v === typeof fallback && ok(v as T) ? (v as T) : fallback;
}

const prefs = parsePrefs(load(PREFS_KEY));
const stats = parseStats(load(STATS_KEY));

/** The case's chosen algorithm; the main one until the user picks another (or the stored id no longer exists). */
export const preferred = (c: Case): AlgVariant => variants(c).find((v) => v.id === prefs[c.id]) ?? c.algs[0];

export function setPreferred(c: Case, variantId: string): void {
  prefs[c.id] = variantId;
  save(PREFS_KEY, prefs);
}

export const statsFor = (caseId: string): CaseStats | undefined => stats[caseId];

export function recordRep(caseId: string, rep: Rep): CaseStats {
  const s = (stats[caseId] = addRep(stats[caseId], rep, Date.now()));
  save(STATS_KEY, stats);
  return s;
}

// --- Spaced repetition: when each case comes back in the trainer ---
// SM-2-lite with a fixed ease: a fail sends the case back to today (interval 0), a good doubles the interval
// (1 day the first time), an easy one (faster than the case's own average) triples it. Grading a case that isn't
// due yet doesn't grow it: the same case several times in one session counts once.

export type Grade = 'fail' | 'good' | 'easy';
export type LearnStatus = 'new' | 'learning' | 'known';

export interface Learning {
  due: number; // epoch ms
  interval: number; // days; 0 = failed or just started
  lapses: number; // fails, ever
  recognitionMs: number | null; // moving average of the time to recognize it (both quiz modes measure it)
  solveMs: number | null; // ...and of the whole solve on the smart cube
}

const DAY = 86_400_000;
export const KNOWN_DAYS = 3; // from this interval on, the case counts as known
const MAX_DAYS = 180;
const AVG_WEIGHT = 0.3; // weight of the newest time in the moving averages
const LEARN_KEY = 'academy-learning';

/** The next midnight (local time): a case is due "today" if it falls before it. */
function endOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export const isDue = (s: Learning | undefined, now: number): boolean => !!s && s.due < endOfDay(now);

export const learnStatus = (s: Learning | undefined): LearnStatus => (!s ? 'new' : s.interval >= KNOWN_DAYS ? 'known' : 'learning');

/** The case's schedule after a grade. */
export function graded(s: Learning | undefined, grade: Grade, now: number): Learning {
  const base: Learning = s ?? { due: now, interval: 0, lapses: 0, recognitionMs: null, solveMs: null };
  if (grade === 'fail') return { ...base, due: now, interval: 0, lapses: base.lapses + 1 };
  if (s && !isDue(s, now)) return s; // reviewed early: no growth
  const interval = Math.min(MAX_DAYS, grade === 'easy' ? Math.max(2, base.interval * 3) : Math.max(1, base.interval * 2));
  return { ...base, interval, due: now + interval * DAY };
}

/** `s` with a new time folded into one of its moving averages. */
export function timed(s: Learning, key: 'recognitionMs' | 'solveMs', ms: number): Learning {
  const avg = s[key];
  return { ...s, [key]: avg === null ? ms : avg + AVG_WEIGHT * (ms - avg) };
}

export function parseLearning(raw: unknown): Record<string, Learning> {
  const out: Record<string, Learning> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const timeOrNull = (n: unknown) => n === null || isTime(n);
  for (const [id, s] of Object.entries(raw as Record<string, Partial<Learning>>)) {
    if (!s || typeof s !== 'object') continue;
    const { due, interval, lapses, recognitionMs, solveMs } = s;
    if (!isTime(due) || !isTime(interval) || interval > MAX_DAYS || !isCount(lapses) || !timeOrNull(recognitionMs) || !timeOrNull(solveMs)) continue;
    out[id] = { due, interval, lapses, recognitionMs: recognitionMs!, solveMs: solveMs! };
  }
  return out;
}

const learning = parseLearning(load(LEARN_KEY));

export const learningFor = (caseId: string): Learning | undefined => learning[caseId];

/** Grades a case; `time` (only for a real one: a right answer, a solve without help) joins its averages. */
export function recordGrade(caseId: string, grade: Grade, time?: { key: 'recognitionMs' | 'solveMs'; ms: number }): Learning {
  let s = graded(learning[caseId], grade, Date.now());
  if (time) s = timed(s, time.key, time.ms);
  learning[caseId] = s;
  save(LEARN_KEY, learning);
  return s;
}

// --- The user's own algorithms, per case (practice.ts checks they solve the case before adding them) ---

const CUSTOM_KEY = 'academy-custom-algs';

/** Per case, the stored strings that are valid notation (normalized, no repeats); anything else is dropped. */
export function parseCustom(raw: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, algs] of Object.entries(raw)) {
    if (!Array.isArray(algs)) continue;
    const ok = algs.flatMap((a) => {
      try {
        const tokens = typeof a === 'string' ? tokenize(a) : [];
        return tokens.length ? [tokens.join(' ')] : [];
      } catch {
        return [];
      }
    });
    if (ok.length) out[id] = [...new Set(ok)];
  }
  return out;
}

const custom = parseCustom(load(CUSTOM_KEY));
// the id is the algorithm itself: it stays the same when another one is removed (prefs keep pointing at it)
const customVariant = (alg: string): AlgVariant => ({ id: `custom:${alg}`, alg, source: 'custom' });

/** The case's algorithms: the plan's and SpeedCubeDB's, then the user's own. */
export const variants = (c: Case): AlgVariant[] => [...c.algs, ...(custom[c.id] ?? []).map(customVariant)];

/** `alg` must be normalized (tokens joined by single spaces). */
export function addCustom(caseId: string, alg: string): AlgVariant {
  const list = (custom[caseId] ??= []);
  if (!list.includes(alg)) list.push(alg);
  save(CUSTOM_KEY, custom);
  return customVariant(alg);
}

export function removeCustom(caseId: string, alg: string): void {
  const list = (custom[caseId] ?? []).filter((a) => a !== alg);
  if (list.length) custom[caseId] = list;
  else delete custom[caseId];
  save(CUSTOM_KEY, custom);
}

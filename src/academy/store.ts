// What the academy remembers in this browser: the algorithm chosen for each case, practice stats and the last choices
// made in the trainers (level, sizes, toggles).
// Storage may be unavailable or hand-edited, so every access is guarded and every read is validated.
import type { AlgVariant, Case } from './types.ts';

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
export const preferred = (c: Case): AlgVariant => c.algs.find((v) => v.id === prefs[c.id]) ?? c.algs[0];

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

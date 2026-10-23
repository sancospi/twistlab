// Progreso, the pure part: per-day series of the Resolver's times, the goal's estimated date, the activity calendar and
// the backup file (every key of this app in localStorage). The page itself is progress-view.ts.
import { isEvent, resultValue, type EventId, type Result } from './timer.ts';
import { AVERAGES, rolling } from './stats.ts';
import { inBackup } from './backup-keys.js';

const DAY = 86_400_000;
/** Local midnight of the day `ms` falls in. */
export const dayOf = (ms: number): number => new Date(ms).setHours(0, 0, 0, 0);

export interface Day { day: number; best: number; avg: number | null }

/** Per day with dated solves, oldest first: the best single (Infinity = only DNFs) and the mean of the `avg` windows
 * (e.g. 'ao5') that ended that day, DNF windows left out. `results` newest first, as stored; undated solves still
 * count inside the windows. */
export function daily(results: Result[], avg: string): Day[] {
  const [, n, trim] = AVERAGES.find(([label]) => label === avg)!;
  const old = [...results].reverse();
  const avgs = rolling(old.map(resultValue), n, trim);
  const days = new Map<number, { best: number; sum: number; k: number }>();
  old.forEach((r, i) => {
    if (r.at === undefined) return;
    const key = dayOf(r.at);
    const d = days.get(key) ?? { best: Infinity, sum: 0, k: 0 };
    d.best = Math.min(d.best, resultValue(r));
    const a = avgs[i];
    if (a !== null && Number.isFinite(a)) (d.sum += a), d.k++;
    days.set(key, d);
  });
  return [...days].sort(([a], [b]) => a - b).map(([day, d]) => ({ day, best: d.best, avg: d.k ? Math.round(d.sum / d.k) : null }));
}

// --- Goal: an average of an event under a time, and when the trend of the daily averages gets there ---

export const GOAL_AVERAGES = ['mo3', 'ao5', 'ao12', 'ao50', 'ao100'];
export interface Goal { event: EventId; avg: string; ms: number }

export function parseGoal(raw: unknown): Goal | null {
  if (!raw || typeof raw !== 'object') return null;
  const { event, avg, ms } = raw as Partial<Goal>;
  return isEvent(event) && GOAL_AVERAGES.includes(avg!) && typeof ms === 'number' && ms > 0 && ms < 3_600_000 ? { event, avg: avg!, ms } : null;
}

export const GOAL_WINDOW_DAYS = 28; // the fit only looks at recent days: old ones say little about today's pace
export const GOAL_MIN_DAYS = 5;
const GOAL_MAX_DAYS = 365; // further than this, a straight line is a guess, not an estimate

export type Estimate = { kind: 'reached' | 'few' | 'flat' | 'far' } | { kind: 'eta'; at: number };

/** Least-squares line through the daily averages of the last GOAL_WINDOW_DAYS: the day it crosses `target`.
 * reached: the latest day is already under it; few: under GOAL_MIN_DAYS days; flat: not improving; far: over a year. */
export function estimateGoal(days: Day[], target: number, now: number): Estimate {
  const from = dayOf(now) - GOAL_WINDOW_DAYS * DAY;
  const pts = days.filter((d) => d.avg !== null && d.day > from).map((d) => ({ x: (d.day - from) / DAY, y: d.avg! }));
  if (pts.length && pts.at(-1)!.y <= target) return { kind: 'reached' };
  if (pts.length < GOAL_MIN_DAYS) return { kind: 'few' };
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length, my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const slope = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (!(slope < 0)) return { kind: 'flat' };
  const end = from + Math.ceil(mx + (target - my) / slope) * DAY;
  if (!(end <= now + GOAL_MAX_DAYS * DAY)) return { kind: 'far' }; // also NaN and dates past the Date range
  const at = dayOf(end + DAY / 2); // + half a day: DST-proof midnight
  return { kind: 'eta', at: Math.max(at, dayOf(now) + DAY) }; // the line says "already": not before tomorrow
}

// --- Activity: what was practised on each day of the last weeks ---

/** Every day from the Monday `weeks - 1` weeks back to today, with how many of `times` fall on it. */
export function activity(times: number[], now: number, weeks: number): { day: number; n: number }[] {
  const d = new Date(dayOf(now));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * (weeks - 1));
  const out: { day: number; n: number }[] = [];
  for (; d.getTime() <= now; d.setDate(d.getDate() + 1)) out.push({ day: d.getTime(), n: 0 });
  const at = new Map(out.map((x, i) => [x.day, i]));
  for (const t of times) {
    const i = at.get(dayOf(t));
    if (i !== undefined) out[i].n++;
  }
  return out;
}

/** Days in a row with something in `times`, up to today (or up to yesterday while today has nothing yet). */
export function streak(times: number[], now: number): number {
  const days = new Set(times.map(dayOf));
  const d = new Date(dayOf(now));
  if (!days.has(d.getTime())) d.setDate(d.getDate() - 1);
  let n = 0;
  for (; days.has(d.getTime()); d.setDate(d.getDate() - 1)) n++;
  return n;
}

// --- Backup: one JSON file with every key of this app in localStorage ---

export const BACKUP_APP = 'cube';
export const BACKUP_VERSION = 1;
export { inBackup }; // the allowlist lives in backup-keys.js: the account's API checks the same keys

/** The part of Storage used here (localStorage in the page, a fake in the tests). */
export type StorageLike = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

export function appData(s: StorageLike): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k !== null && inBackup(k)) out[k] = s.getItem(k)!;
  }
  return out;
}

export function packBackup(data: Record<string, string>, now: number): string {
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date(now).toISOString(), data });
}

export type Unpacked = { ok: true; data: Record<string, string>; exportedAt: number } | { ok: false; error: 'json' | 'shape' | 'version' };

/** The file's data if it is a backup of this app, of this version, and every value is a JSON string (as the app saves them). */
export function unpackBackup(text: string): Unpacked {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'json' }; }
  const { app, version, exportedAt, data } = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (app !== BACKUP_APP) return { ok: false, error: 'shape' };
  if (version !== BACKUP_VERSION) return { ok: false, error: 'version' };
  const at = Date.parse(String(exportedAt));
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Number.isFinite(at)) return { ok: false, error: 'shape' };
  const entries = Object.entries(data).filter(([k]) => inBackup(k)); // an older file may hold other keys: skipped, not an error
  const json = (v: unknown) => { try { return typeof v === 'string' && (JSON.parse(v), true); } catch { return false; } };
  if (!entries.every(([, v]) => json(v))) return { ok: false, error: 'shape' };
  return { ok: true, data: Object.fromEntries(entries) as Record<string, string>, exportedAt: at };
}

/** Replaces this app's keys with `data` (MACs stay). If the browser refuses one (quota), the old keys are put back: false. */
export function replaceAppData(s: StorageLike, data: Record<string, string>): boolean {
  const before = appData(s);
  const clear = () => Object.keys(appData(s)).forEach((k) => s.removeItem(k));
  try {
    clear();
    for (const [k, v] of Object.entries(data)) s.setItem(k, v);
    return true;
  } catch {
    clear();
    for (const [k, v] of Object.entries(before)) s.setItem(k, v); // they fitted before
    return false;
  }
}

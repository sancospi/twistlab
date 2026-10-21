// White-cross trainer, the pure part: which state each item plays, how an item and a session are graded against
// the level's goal, and the stored history of sessions (validated on read: storage may be corrupted or hand-edited).
import type { KPattern } from 'cubing/kpuzzle';
import { crossCase, crossDistance } from './cross.ts';
import type { CrossLevel, CrossLevelId } from './crossGuide.ts';
import { INSPECTION_MS } from '../timer.ts';

/**
 * Extra moves that take a random state `s` (user frame) to a cross `k` turns from solved, k drawn with `r` in
 * [0, 1) from the range, capped at d(s): the rest of the cube stays a real scramble. null when d(s) < min.
 */
export function crossItem(s: KPattern, range: { min: number; max: number }, r: number): { k: number; moves: string[] } | null {
  const d = crossDistance(s, 'D');
  if (d < range.min) return null;
  const top = Math.min(range.max, d);
  const k = range.min + Math.floor(r * (top - range.min + 1));
  return { k, moves: crossCase(s, 'D', k)! };
}

export interface CrossAttempt {
  optimal: number; // shortest cross from the item's state
  turns: number; // the user's turns (turnCount)
  planMs: number; // shown / inspection start to the first turn
  execMs: number; // first turn to the cross done
}

export const extraTurns = (a: CrossAttempt): number => Math.max(0, a.turns - a.optimal);

export interface CrossSummary {
  n: number;
  avgExtra: number;
  optimalShare: number; // 0..1, items solved in the optimal number of turns
  planMs: number;
  execMs: number;
  passed: boolean; // the level's goal: enough items solved (minSolved), on average at most goal.overOptimal extra turns, the execution within goal.seconds and the planning within inspection (as in WCA, inspection isn't solve time)
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Solved items a session of `count` needs for the goal: skipping (or a disconnect) mustn't leave only the easy ones. */
export const minSolved = (count: number): number => Math.ceil(count * 0.8);

/** null when nothing was solved (every item skipped). `count`: the session's size, skipped and unplayed items included. */
export function summarize(attempts: CrossAttempt[], level: CrossLevel, count: number): CrossSummary | null {
  if (!attempts.length) return null;
  const avgExtra = mean(attempts.map(extraTurns));
  const planMs = mean(attempts.map((a) => a.planMs));
  const execMs = mean(attempts.map((a) => a.execMs));
  return {
    n: attempts.length,
    avgExtra,
    optimalShare: attempts.filter((a) => extraTurns(a) === 0).length / attempts.length,
    planMs,
    execMs,
    passed: attempts.length >= minSolved(count) && avgExtra <= level.goal.overOptimal && execMs <= level.goal.seconds * 1000 && planMs <= INSPECTION_MS,
  };
}

/** The level after `id`, to suggest once its goal is met; null after the last one. */
export const nextLevel = (levels: CrossLevel[], id: CrossLevelId): CrossLevel | null => levels[levels.findIndex((l) => l.id === id) + 1] ?? null;

// --- History ---

export type CrossMode = 'cube' | 'virtual';
export interface CrossSession extends CrossSummary {
  level: CrossLevelId;
  at: number; // epoch ms
  mode: CrossMode;
}

export const CROSS_HISTORY_MAX = 1000; // ~200 bytes a session: well under the storage quota

export const addCrossSession = (history: CrossSession[], s: CrossSession): CrossSession[] => [...history, s].slice(-CROSS_HISTORY_MAX);

const LEVEL_IDS: readonly string[] = ['n1', 'n2', 'n3', 'n4'] satisfies CrossLevelId[];
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Keeps only well-formed sessions (oldest first), at most CROSS_HISTORY_MAX. */
export function parseCrossHistory(raw: unknown): CrossSession[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is CrossSession =>
      !!s && typeof s === 'object' && LEVEL_IDS.includes(s.level) && isNum(s.at) && (s.mode === 'cube' || s.mode === 'virtual') &&
      Number.isInteger(s.n) && s.n > 0 && isNum(s.avgExtra) && isNum(s.optimalShare) && s.optimalShare <= 1 &&
      isNum(s.planMs) && isNum(s.execMs) && typeof s.passed === 'boolean')
    .map(({ level, at, mode, n, avgExtra, optimalShare, planMs, execMs, passed }) => ({ level, at, mode, n, avgExtra, optimalShare, planMs, execMs, passed }))
    .slice(-CROSS_HISTORY_MAX);
}

export interface LevelProgress {
  sessions: number;
  bestExtra: number; // lowest session average
  avgExtra: number;
  bestMs: number; // fastest session average (planning + execution)
  avgMs: number;
  passed: boolean; // the goal was met at least once
}

/** A level's record over the stored sessions; null if it was never played. */
export function levelProgress(history: CrossSession[], level: CrossLevelId): LevelProgress | null {
  const ss = history.filter((s) => s.level === level);
  if (!ss.length) return null;
  const ms = ss.map((s) => s.execMs);
  return {
    sessions: ss.length,
    bestExtra: Math.min(...ss.map((s) => s.avgExtra)),
    avgExtra: mean(ss.map((s) => s.avgExtra)),
    bestMs: Math.min(...ms),
    avgMs: mean(ms),
    passed: ss.some((s) => s.passed),
  };
}

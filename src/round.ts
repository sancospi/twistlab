// WCA round simulator: format per event, the round's result with cutoff and time limit (Regulations 9f, 9g, A1a),
// and the stored rounds. Pure: values in, numbers out (Infinity = DNF, as in timer.ts).
import { isEvent, isMo3, resultValue, roundedMean, type EventId, type Result } from './timer.ts';
import { isRecord } from './academy/store.ts';

export type RoundFormat = 'ao5' | 'mo3' | 'bo3';
/** Blindfolded events are best of 3, 6x6 and 7x7 mean of 3, the rest average of 5. */
export const roundFormat = (e: EventId): RoundFormat => (e.endsWith('bf') ? 'bo3' : isMo3(e) ? 'mo3' : 'ao5');
export const ATTEMPTS: Record<RoundFormat, number> = { ao5: 5, mo3: 3, bo3: 3 };
/** Attempts the cutoff covers: it is met by getting under it in at least one of them (9g). */
export const CUTOFF_ATTEMPTS: Record<RoundFormat, number> = { ao5: 2, mo3: 1, bo3: 1 };

export interface RoundOpts { cutoff?: number; limit?: number } // ms

/** An attempt's value: its final time, DNF when over the time limit. */
export const attemptValue = (r: Result, limit?: number) => {
  const v = resultValue(r);
  return limit !== undefined && v > limit ? Infinity : v;
};

export interface RoundResult {
  done: boolean; // all attempts made, or the cutoff failed
  cutoffFailed: boolean;
  final: number | null; // the format's result (Infinity = DNF); null while unfinished or after a failed cutoff (no average)
  best: number; // best single (Infinity = all DNF)
}

export function roundResult(values: number[], format: RoundFormat, { cutoff }: RoundOpts = {}): RoundResult {
  const n = ATTEMPTS[format], k = CUTOFF_ATTEMPTS[format];
  const cutoffFailed = cutoff !== undefined && values.length >= k && values.slice(0, k).every((v) => v >= cutoff);
  const best = values.reduce((m, v) => Math.min(m, v), Infinity);
  const sorted = [...values].sort((a, b) => a - b);
  const final = cutoffFailed || values.length < n ? null : format === 'bo3' ? best : roundedMean(format === 'ao5' ? sorted.slice(1, n - 1) : values);
  return { done: cutoffFailed || values.length >= n, cutoffFailed, final, best };
}

/** A finished round as stored: attempts in ms with the penalty included, null = DNF. */
export interface StoredRound { event: EventId; at: number; values: (number | null)[]; cutoff?: number; limit?: number }
export const toValues = (v: (number | null)[]) => v.map((x) => x ?? Infinity);
export const storedResult = (r: StoredRound) => roundResult(toValues(r.values), roundFormat(r.event), r);

const isMs = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** Keeps only well-formed rounds: anything else in storage is dropped, never trusted. */
export function parseRounds(raw: unknown): StoredRound[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): StoredRound[] => {
    if (!isRecord(r) || !isEvent(r.event) || !isMs(r.at) || !Array.isArray(r.values)) return [];
    const n = ATTEMPTS[roundFormat(r.event)];
    if (!r.values.length || r.values.length > n || !r.values.every((v: unknown) => v === null || isMs(v))) return [];
    return [{ event: r.event, at: r.at, values: r.values, ...(isMs(r.cutoff) && { cutoff: r.cutoff }), ...(isMs(r.limit) && { limit: r.limit }) }];
  });
}

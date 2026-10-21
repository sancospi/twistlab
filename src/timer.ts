// Competition timing rules (WCA Regulations A3, A4, 9f).

export type Penalty = 0 | 2000 | 'DNF';
export type Result = { ms: number; penalty: Penalty };

export const INSPECTION_MS = 15000;
export const HOLD_MS = 550; // Stackmat-style: hold this long (red) until it turns green; release to start

/** Recorded single: truncated to hundredths under 10 minutes, rounded to the second above (9f1). */
export const recordTime = (ms: number) => (ms < 600000 ? Math.floor(ms / 10) * 10 : Math.round(ms / 1000) * 1000);

export function inspectionPenalty(inspectedMs: number): Penalty {
  if (inspectedMs <= INSPECTION_MS) return 0;
  return inspectedMs <= INSPECTION_MS + 2000 ? 2000 : 'DNF';
}

export function formatTime(ms: number): string {
  const cs = Math.floor(ms / 10); // WCA truncates to hundredths
  const min = Math.floor(cs / 6000);
  const sec = ((cs % 6000) / 100).toFixed(2);
  return min ? `${min}:${sec.padStart(5, '0')}` : sec;
}

export const formatResult = ({ ms, penalty }: Result) =>
  penalty === 'DNF' ? 'DNF' : penalty ? `${formatTime(ms + penalty)}+` : formatTime(ms);

/** Ranking value: final time, DNF last. */
export const resultValue = ({ ms, penalty }: Result) => (penalty === 'DNF' ? Infinity : ms + penalty);

/** Average of the last `n` (ao5 is the WCA format): drop best and worst, mean of the rest,
 * rounded to hundredths (9f2). Infinity = DNF (more than one DNF in an ao5); null = not enough solves. */
export function average(results: Result[], n: number): number | null {
  if (results.length < n) return null;
  const trim = Math.ceil(n * 0.05); // 1 for ao5 and ao12
  const kept = results.slice(0, n).map(resultValue).sort((a, b) => a - b).slice(trim, n - trim);
  if (kept.includes(Infinity)) return Infinity;
  const mean = kept.reduce((a, b) => a + b, 0) / kept.length;
  return mean < 600000 ? Math.round(mean / 10) * 10 : Math.round(mean / 1000) * 1000;
}

export const formatAverage = (avg: number | null) => (avg === null ? '–' : avg === Infinity ? 'DNF' : formatTime(avg));

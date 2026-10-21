// Competition timing rules (WCA Regulations A3, A4, 9f).

export type Penalty = 0 | 2000 | 'DNF';
/** A solve; `at` (epoch ms) and `scramble` exist on solves recorded or imported since they were added.
 * No `event` = 3x3 (every solve before events were added, and every 3x3 one since). */
export type Result = { ms: number; penalty: Penalty; at?: number; scramble?: string; event?: EventId };

/** The WCA events timed here, in the WCA's order, by their WCA (and cubing.js) ids. FMC and multi-blind are left
 * out: they're scored by moves and by cubes, not by one time. */
export const EVENTS = ['333', '222', '444', '555', '666', '777', '333bf', '333oh', 'clock', 'minx', 'pyram', 'skewb', 'sq1', '444bf', '555bf'] as const;
export type EventId = (typeof EVENTS)[number];
export const isEvent = (v: unknown): v is EventId => EVENTS.includes(v as EventId);
export const eventOf = (r: Result): EventId => r.event ?? '333';
/** The fields a solve of `event` carries: none for 3x3 (see Result). */
export const eventField = (event: EventId) => (event === '333' ? {} : { event });
/** 3x3 events: the ones a smart cube and the 3D model can follow. */
export const is333 = (event: EventId) => event.startsWith('333');
/** Blindfolded events have no inspection: the time starts before memorising (Regulations B). */
export const hasInspection = (event: EventId) => !event.endsWith('bf');

/** 6x6, 7x7 and the blindfolded events are ranked by mean of 3 (best of 3 for bld; the mean is shown too). */
export const isMo3 = (event: EventId) => event === '666' || event === '777' || event.endsWith('bf');

export const INSPECTION_MS = 15000;
export const HOLD_MS = 550; // Stackmat-style: hold this long (red) until it turns green; release to start

/** Recorded single: truncated to hundredths under 10 minutes, rounded to the second above (9f1). */
export const recordTime = (ms: number) => (ms < 600000 ? Math.floor(ms / 10) * 10 : Math.round(ms / 1000) * 1000);

export function inspectionPenalty(inspectedMs: number): Penalty {
  if (inspectedMs <= INSPECTION_MS) return 0;
  return inspectedMs <= INSPECTION_MS + 2000 ? 2000 : 'DNF';
}

/** The judge's inspection calls (A3a1): "8 seconds" once 8 s have passed, "12 seconds" at 12 s. */
export const inspectionCall = (inspectedMs: number) => (inspectedMs >= 12000 ? 12 : inspectedMs >= 8000 ? 8 : 0);

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

/** Mean of the kept values rounded to hundredths, to the second from 10 minutes (9f2); any DNF (Infinity) makes it DNF. */
export function roundedMean(values: number[]): number {
  if (values.includes(Infinity)) return Infinity;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return mean < 600000 ? Math.round(mean / 10) * 10 : Math.round(mean / 1000) * 1000;
}

/** Solves dropped at each end of an aoN: 1 for ao5 and ao12 (WCA), 5% from ao50 on (as csTimer). mo3 passes 0. */
export const trimFor = (n: number) => Math.ceil(n * 0.05);

/** Average of the last `n` (ao5 is the WCA format): drop the best and worst `trim`, mean of the rest.
 * Infinity = DNF (more than `trim` DNFs); null = not enough solves. */
export function average(results: Result[], n: number, trim = trimFor(n)): number | null {
  if (results.length < n) return null;
  return roundedMean(results.slice(0, n).map(resultValue).sort((a, b) => a - b).slice(trim, n - trim));
}

export const formatAverage = (avg: number | null) => (avg === null ? '–' : avg === Infinity ? 'DNF' : formatTime(avg));

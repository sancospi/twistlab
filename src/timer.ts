// Competition timing rules (WCA Regulations A3, A4, 9f).

export type Penalty = 0 | 2000 | 'DNF';
/** A solve; `at` (epoch ms) and `scramble` exist on solves recorded or imported since they were added.
 * No `event` = 3x3 (every solve before events were added, and every 3x3 one since). `train`: a training scramble's
 * (3x3, kept apart from the event's times); `session`: the session's id (none = the main one); `splits`: with phases,
 * the ms from the start at which each phase but the last ended; `comment`: the user's note. */
export type Result = {
  ms: number; penalty: Penalty; at?: number; scramble?: string; event?: EventId;
  train?: TrainId; session?: string; splits?: number[]; comment?: string;
};

/** A smart cube's log of a solve: its face turns and when each was made (ms from the clock's start), as a challenge
 *  sends it for the "verified" badge (api/_lib/daily.js). */
export type CubeLog = { moves: string; times: number[] };

/** Training scrambles (training.ts), 3x3: the last layer's cases, the last F2L pair and the last layer, the user's own
 * cases (the Academia's and the slowest of the solve analysis). */
export const TRAINS = ['pll', 'oll', 'f2l', 'mine'] as const;
export type TrainId = (typeof TRAINS)[number];
export const isTrain = (v: unknown): v is TrainId => TRAINS.includes(v as TrainId);

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
/** The events the Resolver's 3D model shows (a 3x3, or its 2x2); index.html's inline script hides it for the rest. */
export const has3d = (e: EventId) => is333(e) || e === '222';
/** Blindfolded events have no inspection: the time starts before memorising (Regulations B). */
export const hasInspection = (event: EventId) => !event.endsWith('bf');

/** 6x6, 7x7 and the blindfolded events are ranked by mean of 3 (best of 3 for bld; the mean is shown too). */
export const isMo3 = (event: EventId) => event === '666' || event === '777' || event.endsWith('bf');

export const INSPECTION_MS = 15000;
export const HOLD_MS = 550; // Stackmat-style: hold this long (red) until it turns green; release to start
/** The hold times the options offer (ms), HOLD_MS the default. */
export const HOLDS = [0, 300, HOLD_MS, 1000];

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

/** The running clock as the options show it: hundredths, tenths, whole seconds, or hidden ('…'). */
export const PRECISIONS = ['cs', 'ds', 's', 'none'] as const;
export type Precision = (typeof PRECISIONS)[number];
export function formatRunning(ms: number, p: Precision): string {
  if (p === 'none') return '…';
  if (p === 'cs') return formatTime(ms);
  const s = Math.floor(ms / 1000), min = Math.floor(s / 60);
  const sec = p === 's' ? String(s % 60) : ((Math.floor(ms / 100) % 600) / 10).toFixed(1);
  return min ? `${min}:${sec.padStart(p === 's' ? 2 : 4, '0')}` : sec;
}

/** A time typed by hand (another timer's): "12.34", "1:05.20", digits only as csTimer reads them ("1234" = 12.34,
 * "10523" = 1:05.23), a trailing "+" for +2 ("12.34+": 12.34 and the penalty), "DNF" or "DNF(12.34)". null if it
 * isn't one. The time is recorded as the clock's (recordTime). */
export function parseTime(text: string): Pick<Result, 'ms' | 'penalty'> | null {
  let s = text.trim().replace(',', '.');
  const dnf = /^dnf\s*(?:\((.*)\))?$/i.exec(s);
  if (dnf) {
    const inner = dnf[1] === undefined ? null : parseTime(dnf[1]);
    return dnf[1] !== undefined && !inner ? null : { ms: inner?.ms ?? 0, penalty: 'DNF' };
  }
  const plus = /\+\s*2?$/.test(s);
  s = s.replace(/\+\s*2?$/, '').trim();
  let ms: number;
  if (/^\d+$/.test(s)) { // csTimer's typing: the last two digits are hundredths, two more the seconds, the rest minutes
    const n = s.padStart(5, '0');
    ms = (Number(n.slice(0, -4)) * 60 + Number(n.slice(-4, -2))) * 1000 + Number(n.slice(-2)) * 10;
  } else {
    const m = /^(?:(\d+):)?(\d+(?:\.\d*)?)$/.exec(s);
    if (!m || (m[1] !== undefined && Number(m[2]) >= 60)) return null;
    ms = Math.round((Number(m[1] ?? 0) * 60 + Number(m[2])) * 1000);
  }
  return ms > 0 && ms < 86_400_000 ? { ms: recordTime(ms), penalty: plus ? 2000 : 0 } : null;
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

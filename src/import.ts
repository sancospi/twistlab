// Resolver times: validation of the stored list, and import from other timers (formats checked against their sources):
// - csTimer export (JSON, usually a .txt): {"session1": [[[penalty, ms, ...phases], scramble, comment, unixSeconds], ...],
//   "properties": {"sessionData": "{\"1\": {\"opt\": {\"scrType\": \"222so\"}}}"}}; penalty 0 / 2000 (+2) / -1 (DNF), ms
//   without the penalty. A session may itself be a JSON string; a session without scrType is 3x3 ("333").
// - Twisty Timer backup (text): a header line, then rows "333";"Normal";"12345";"1600000000000";"R U …";"0";"comment"
//   (puzzle, category, time ms, date ms, scramble, penalty 0 / 1 = +2 / 2 = DNF; 10 marks hidden rows). Twisty Timer's
//   stored time already includes the +2, so it is taken off here.
// Each solve goes to its event (timer.ts EVENTS); only solves with a valid date are imported (the date is what keeps a
// second import from repeating them).
import { eventField, isEvent, isTrain, recordTime, type EventId, type Penalty, type Result } from './timer.ts';
import { isRecord } from './academy/store.ts';

const PENALTIES: unknown[] = [0, 2000, 'DNF'];
const json = (v: unknown) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return undefined; }
};
const validAt = (at: number) => Number.isFinite(at) && at > 0;

export const MAX_COMMENT = 200;
const text = (v: unknown, max: number) => (typeof v === 'string' && v && v.length <= max ? v : undefined);

/** The stored list (localStorage), keeping only well-formed solves and fields. */
export function parseStored(raw: unknown): Result[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    if (!isRecord(r) || !Number.isFinite(r.ms) || !PENALTIES.includes(r.penalty) || (r.event !== undefined && !isEvent(r.event))) return [];
    const ms = r.ms as number, session = text(r.session, 40), comment = text(r.comment, MAX_COMMENT);
    const splits = Array.isArray(r.splits) && r.splits.length && r.splits.every((x, i, a) => Number.isFinite(x) && x > (a[i - 1] ?? 0) && x < ms) ? r.splits as number[] : undefined;
    return [{
      ms, penalty: r.penalty as Penalty, ...(validAt(r.at as number) && { at: r.at as number }), ...(typeof r.scramble === 'string' && { scramble: r.scramble }),
      ...eventField((r.event as EventId) ?? '333'), ...(isTrain(r.train) && { train: r.train }), ...(session && { session }), ...(splits && { splits }), ...(comment && { comment }),
    }];
  });
}

/** The Resolver's sessions (main.ts), by id: a name, and `deleted` for a tombstone (its times are dropped wherever they
 * come back from). Malformed entries are left out. */
export type Sessions = Record<string, { name: string; deleted?: true }>;
export function parseSessions(raw: unknown): Sessions {
  if (!isRecord(raw)) return {};
  return Object.fromEntries(Object.entries(raw).flatMap(([id, v]) => (isRecord(v) && text(v.name, 40) ? [[id, { name: v.name as string, ...(v.deleted === true && { deleted: true as const }) }]] : [])));
}

export interface Parsed { results: Result[]; skipped: number }

const solve = (ms: number, penalty: Penalty, at: number, scramble: unknown, event: EventId, note?: unknown): Result | null => {
  const comment = typeof note === 'string' ? note.trim().slice(0, MAX_COMMENT) : '';
  return Number.isFinite(ms) && ms > 0 && validAt(at)
    ? { ms: recordTime(ms), penalty, at, ...(typeof scramble === 'string' && scramble && { scramble }), ...eventField(event), ...(comment && { comment }) }
    : null;
};

// csTimer's scramble types for the WCA events. ponytail: its non-WCA variants (e.g. "444m", "mgmo") go to the chosen
// event like any other unknown type; FMC and multi-blind are skipped (not timed here).
const CSTIMER: Record<string, EventId | null> = {
  '333': '333', '222so': '222', '444wca': '444', '555wca': '555', '666wca': '666', '777wca': '777', '333ni': '333bf',
  '333oh': '333oh', clkwca: 'clock', mgmp: 'minx', pyrso: 'pyram', skbso: 'skewb', sqrs: 'sq1', '444bld': '444bf',
  '555bld': '555bf', '333fm': null, r3ni: null,
};
// Twisty Timer's puzzle names (its categories are free text, so OH or BLD can't be told apart: they stay as the puzzle)
const TWISTY: Record<string, EventId> = {
  '222': '222', '333': '333', '444': '444', '555': '555', '666': '666', '777': '777',
  clock: 'clock', mega: 'minx', pyra: 'pyram', skewb: 'skewb', sq1: 'sq1',
};

/** csTimer sessions go to the event of their scramble type; one it doesn't know goes to `fallback` (the chosen event). */
export function parseCsTimer(data: unknown, fallback: EventId = '333'): Parsed {
  const out: Parsed = { results: [], skipped: 0 };
  if (!isRecord(data)) return out;
  const sessions = json(isRecord(data.properties) ? data.properties.sessionData : undefined);
  for (const [key, raw] of Object.entries(data)) {
    const id = /^session(\d+)$/.exec(key)?.[1];
    const solves = id && json(raw);
    if (!id || !Array.isArray(solves)) continue;
    const opt = isRecord(sessions) && isRecord(sessions[id]) ? sessions[id].opt : undefined;
    const type = String(isRecord(opt) ? opt.scrType ?? '333' : '333');
    const event = Object.hasOwn(CSTIMER, type) ? CSTIMER[type] : fallback;
    for (const s of solves) {
      const time = Array.isArray(s) && Array.isArray(s[0]) ? s[0] : [];
      const penalty = PENALTIES[[0, 2000, -1].indexOf(time[0])] as Penalty | undefined;
      const r = event && penalty !== undefined ? solve(time[1], penalty, s[3] * 1000, s[1], event, s[2]) : null;
      if (r) out.results.push(r);
      else out.skipped++;
    }
  }
  return out;
}

export function parseTwistyTimer(text: string): Parsed {
  const out: Parsed = { results: [], skipped: 0 };
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('Puzzle')) continue; // blank or the header
    // ponytail: a comment with a line break leaves a junk line, counted as skipped; the solve itself still imports
    const [puzzle, , time, date, scramble, pen, note] = line.trim().replace(/^"/, '').replace(/"$/, '').split('";"');
    const penalty = PENALTIES[['0', '1', '2'].indexOf(pen)] as Penalty | undefined;
    const event = Object.hasOwn(TWISTY, puzzle) ? TWISTY[puzzle] : undefined;
    const r = event && penalty !== undefined && /^\d+$/.test(time) && /^\d+$/.test(date ?? '')
      ? solve(Number(time) - (penalty === 2000 ? 2000 : 0), penalty, Number(date), scramble, event, note)
      : null;
    if (r) out.results.push(r);
    else out.skipped++;
  }
  return out;
}

/** Either format, told apart by whether the file is JSON; `fallback` is the event for csTimer sessions of unknown type. */
export function parseImport(text: string, fallback: EventId = '333'): Parsed & { format: string } {
  const data = json(text);
  return data === undefined ? { format: 'Twisty Timer', ...parseTwistyTimer(text) } : { format: 'csTimer', ...parseCsTimer(data, fallback) };
}

/** The list (newest first) with the imported solves whose date isn't in it yet, ordered by date. Solves stored before
 * dates were recorded keep their place: each takes the date of the next newer one (none: they stay on top). */
export function mergeResults(existing: Result[], imported: Result[]): { results: Result[]; added: number } {
  const seen = new Set(existing.map((r) => r.at));
  const fresh: Result[] = [];
  for (const r of imported) {
    if (seen.has(r.at)) continue;
    seen.add(r.at);
    fresh.push(r);
  }
  let at = Infinity;
  const keyed = [...existing.map((r) => ({ r, at: (at = r.at ?? at) })), ...fresh.map((r) => ({ r, at: r.at! }))];
  return { results: keyed.sort((a, b) => b.at - a.at).map((k) => k.r), added: fresh.length };
}

// The optional account's sync (api/progress.js): this browser's app data (progress.ts's appData, the backup's keys)
// goes up to the account and comes down on the other devices. Per key, the newer change wins; lists of dated entries
// (solves, rounds, quiz and cross sessions) and per-case records are merged, so what was done on each device is kept.
// Without a session nothing here calls the server: no login wall, no request for visitors who never signed in.
// Changes are found by comparing appData with the last synced versions (hashes), every minute while the page is
// visible, on route changes and when it's hidden. The account's changes are fetched on load and when the page comes
// back, and written here only when nothing is going on (no solve, quiz or connected cube: main.ts's `busy`); then the
// page reloads, as after importing a backup, so every screen reads them.
import { appData } from './progress.ts';

/** A key's value in the account: v null = deleted; t = its version (ms). */
export type Item = { v: string | null; t: number };
/** A key's last synced version here: its value's hash and version, and when a local change to it was first seen. */
export type Base = { h: string; t: number; d?: number };
/** What is pushed: the new value and version, and the version it replaces (0: none). */
export type Push = Item & { b: number };
interface Meta { email: string; at: number; keys: Record<string, Base> }

const META_KEY = 'sync-meta'; // not a backup key (backup-keys.js): this browser's link to the account
const MAX_VALUE = 512 * 1024; // api/_lib/rules.js
const MAX_REQUEST = 1.5 * 1024 * 1024; // under the API's 2 MB, with room for the JSON around the values
const KEEPALIVE = 60_000; // bytes: browsers refuse bigger keepalive requests (the page is going away)
const PULL_EVERY = 5 * 60_000; // coming back to the page fetches the account's changes at most this often

/** A short hash of a value (cyrb53 and the length): enough to tell whether it changed. null = absent. */
export function hash(s: string | null): string {
  if (s === null) return '-';
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}:${s.length}`;
}

// Lists of dated entries ('at', ms), merged as a union: -1 newest first (main.ts), 1 oldest first (score.ts, crossScore.ts)
const LISTS: Record<string, 1 | -1> = { 'cube-results': -1, 'cube-rounds': -1, 'academy-quiz-history': 1, 'academy-cross-history': 1 };
// Records by case or course id (store.ts, lessons.ts): merged entry by entry, the newer side's entry winning
const RECORDS = ['academy-stats', 'academy-learning', 'academy-prefs', 'academy-custom-algs', 'academy-lessons'];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const atOf = (x: unknown) => (isObj(x) && typeof x.at === 'number' ? x.at : undefined);
const practiced = (x: unknown) => (isObj(x) && typeof x.lastPracticed === 'number' ? x.lastPracticed : undefined); // store.ts's CaseStats
const parse = (s: string | null): unknown => { try { return JSON.parse(s ?? 'null'); } catch { return null; } };

/** `a` with the entries of `b` it lacks (same 'at', or the same entry if undated), in the list's order; null if none.
 * Undated entries (cube-results from before dates were saved) sort with the dated one before them, as in import.ts. */
export function union(a: unknown[], b: unknown[], dir: 1 | -1): unknown[] | null {
  const id = (x: unknown) => atOf(x) ?? JSON.stringify(x);
  const seen = new Set(a.map(id));
  const keyed = (list: unknown[]) => {
    let at = -dir * Infinity;
    return list.map((x) => ({ x, at: (at = atOf(x) ?? at) }));
  };
  const extra = keyed(b).filter((k) => !seen.has(id(k.x)));
  if (!extra.length) return null;
  return [...keyed(a), ...extra].sort((p, q) => dir * (p.at - q.at) || 0).map((k) => k.x); // stable: `a` first on ties
}

/** A key changed both here and in the account since the last sync: one value for both. */
export function mergeValue(key: string, local: string | null, remote: string | null, localNewer: boolean): string | null {
  const a = parse(local), b = parse(remote);
  if (key in LISTS && Array.isArray(a) && Array.isArray(b)) {
    // an entry on both sides (same 'at') but changed on one, e.g. a penalty: the newer side's copy
    const u = localNewer ? union(a, b, LISTS[key]) : union(b, a, LISTS[key]);
    return u ? JSON.stringify(u) : localNewer ? local : remote;
  }
  if (RECORDS.includes(key) && isObj(a) && isObj(b)) {
    const out = localNewer ? { ...b, ...a } : { ...a, ...b };
    for (const id of Object.keys(out)) { // a case practiced on both devices: the one practiced last
      const p = practiced(a[id]), q = practiced(b[id]);
      if (p !== undefined && q !== undefined && p !== q) out[id] = p > q ? a[id] : b[id];
    }
    return JSON.stringify(out);
  }
  return localNewer ? local : remote;
}

export interface Plan { apply: Record<string, string | null>; push: Record<string, Push>; keys: Record<string, Base> }

/** One sync, per key, from this browser's data, the account's (as fetched; {} when only pushing) and the last synced
 * versions: what to write here (apply), what to send (push), and the synced versions once both are done (keys; a
 * pushed key gets its new version when the account takes it). `full`: `remote` is the whole account. */
export function reconcile(local: Record<string, string>, remote: Record<string, Item>, base: Record<string, Base>, now: number, full = false): Plan {
  const plan: Plan = { apply: {}, push: {}, keys: { ...base } };
  for (const k of new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(base)])) {
    const l = local[k] ?? null, r = remote[k];
    // a key the account no longer has (e.g. lost): as if never synced, so this browser's value goes up again
    const b = (full && !r ? undefined : base[k]) ?? { h: hash(null), t: 0 };
    const h = hash(l);
    const mine = h !== b.h; // changed here since the last sync
    const theirs = r !== undefined && r.t !== b.t; // changed in the account
    if (!mine && !theirs) {
      plan.keys[k] = { h: b.h, t: b.t }; // (a change undone here: nothing left to send)
    } else if (r && r.v === l) {
      plan.keys[k] = { h, t: r.t };
    } else if (!mine) {
      plan.apply[k] = r!.v;
      plan.keys[k] = { h: hash(r!.v), t: r!.t };
    } else {
      const d = b.d ?? now;
      plan.keys[k] = { ...b, d };
      if (!theirs) {
        plan.push[k] = { v: l, t: Math.max(d, b.t + 1), b: b.t };
        continue;
      }
      // never synced here (first sign-in, or again after signing out): this browser's value can't claim to be newer
      const v = mergeValue(k, l, r!.v, b.t > 0 && d > r!.t);
      if (v !== l) plan.apply[k] = v;
      if (v === r!.v) plan.keys[k] = { h: hash(v), t: r!.t };
      else plan.push[k] = { v, t: Math.max(now, r!.t + 1), b: r!.t };
    }
  }
  return plan;
}

// --- In the page ---

export type SyncState = 'off' | 'syncing' | 'ok' | 'error' | 'offline' | 'tooBig';
/** For the account card (account-view.ts): who is signed in, how the last sync went, and when it last completed. */
export const status = { email: '', state: 'off' as SyncState, at: 0 };
let listener: (() => void) | null = null;
/** The account card's redraw (one at a time: the card on screen). */
export const onStatus = (f: (() => void) | null) => void (listener = f);
const setState = (s: SyncState) => {
  status.state = s;
  listener?.();
};

const readMeta = (): Meta | null => {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) ?? 'null');
    return isObj(m) && typeof m.email === 'string' && isObj(m.keys) ? (m as unknown as Meta) : null;
  } catch {
    return null;
  }
};
const saveMeta = () => {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
    else localStorage.removeItem(META_KEY);
  } catch { /* private mode: the session lasts as long as the page */ }
};
let meta = readMeta();
if (meta) [status.email, status.at] = [meta.email, meta.at];

let busy: () => boolean = () => false;
let pullDue = true; // the account may have changes: fetch them at the next sync
let lastPull = 0;
let waitUntil = 0; // after a 429
let running: Promise<void> | null = null;
let again: boolean | null = null; // another sync was asked for meanwhile (true: the page is being hidden)
let wired = false;

/** A call to the API: JSON in and out, the session cookie goes along. */
export function api(method: 'GET' | 'POST', path: string, body?: unknown, keepalive = false): Promise<Response> {
  return fetch(path, { method, keepalive, credentials: 'same-origin', ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
}

const bytes = (s: string | null) => (s === null ? 0 : new Blob([s]).size);

/** Stops syncing (logout, account deleted, or the session ended): this browser keeps its data. */
export function forget(): void {
  meta = null;
  saveMeta();
  status.email = '';
  status.at = 0;
  setState('off');
}

function wire() {
  if (wired) return;
  wired = true;
  setInterval(() => void (document.visibilityState === 'visible' && sync()), 60_000);
  addEventListener('online', () => void sync());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') return void sync(true);
    if (Date.now() - lastPull > PULL_EVERY) pullDue = true;
    void sync();
  });
}

/** At startup (main.ts, after the first paint): if this browser was signed in, check the session (it also keeps it
 * alive: api/me.js) and sync. `isBusy`: something is going on that a reload would break. */
export async function startSync(isBusy: () => boolean): Promise<void> {
  busy = isBusy;
  if (!meta) return;
  let res: Response;
  try {
    res = await api('GET', '/api/me');
  } catch {
    wire(); // offline: try again when back
    return setState('offline');
  }
  if (res.status === 401) return forget();
  if (!res.ok) return setState('error');
  wire();
  await sync();
}

/** Signed in (account-view.ts): the first sync merges this browser's data with the account's. */
export async function signedIn(email: string): Promise<void> {
  meta = { email, at: 0, keys: {} };
  saveMeta();
  status.email = email;
  pullDue = true;
  wire();
  await sync();
}

/** One sync now (the timer, route changes: main.ts; `leaving`: the page is being hidden). Never two at a time. */
export function sync(leaving = false): Promise<void> {
  if (!meta || !wired) return Promise.resolve(); // signed out, or startSync hasn't checked the session yet
  if (running) {
    again ||= leaving;
    return running;
  }
  running = run(leaving).finally(() => {
    running = null;
    const next = again;
    again = null;
    if (next !== null) void sync(next);
  });
  return running;
}

async function run(leaving: boolean): Promise<void> {
  const m = meta!;
  const pull = pullDue && !leaving; // fetched even while busy: only writing them here waits (write)
  if (!pull && !m.at) return; // never synced: nothing goes up before the account's data has been merged in
  if (!pull && Date.now() < waitUntil) return;
  let local: Record<string, string>;
  try {
    local = appData(localStorage);
  } catch {
    return;
  }
  const base = m.keys;
  let apply: Record<string, string | null> = {};
  let reload = false;
  try {
    let remote: Record<string, Item> = {};
    if (pull) {
      setState('syncing');
      const res = await api('GET', '/api/progress');
      if (res.status === 401) return forget();
      if (!res.ok) return setState('error');
      remote = (await res.json()).items;
      [pullDue, lastPull] = [false, Date.now()];
    }
    const plan = reconcile(local, remote, base, Date.now(), pull);
    m.keys = plan.keys;
    apply = plan.apply;
    const pushed = await push(m, plan.push, leaving);
    if (pushed === 'auth') return forget();
    if (meta !== m) return; // signed out meanwhile
    reload = write(m, apply, local, base, !busy());
    apply = {};
    m.at = Date.now();
    status.at = m.at;
    saveMeta();
    setState(pushed);
  } catch {
    write(m, apply, local, base, false);
    saveMeta();
    setState(navigator.onLine ? 'error' : 'offline');
  }
  if (reload) location.reload(); // every screen reads the new data, as after importing a backup
}

/** Writes the account's values here, right before the reload: only if nothing is going on (`quiet`) and this browser
 * didn't change them during the sync, else what is in memory would overwrite them. A value not written goes back to
 * its version before this sync, so it is fetched (and merged) again. True if anything was written. */
function write(m: Meta, apply: Record<string, string | null>, local: Record<string, string>, base: Record<string, Base>, quiet: boolean): boolean {
  let any = false;
  for (const [k, v] of Object.entries(apply)) {
    if (quiet && localStorage.getItem(k) === (local[k] ?? null)) {
      try {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
        any = true;
        continue;
      } catch { /* full: as if not written */ }
    }
    if (base[k]) m.keys[k] = base[k];
    else delete m.keys[k];
    pullDue = true;
  }
  return any;
}

/** Sends the changed keys, in requests under the API's size limit. A key the account changed meanwhile comes back stale:
 * it is fetched and merged on the next sync. */
async function push(m: Meta, items: Record<string, Push>, leaving: boolean): Promise<SyncState | 'auth'> {
  const all = Object.entries(items);
  if (!all.length) return 'ok';
  setState('syncing');
  const fits = all.filter(([, it]) => bytes(it.v) <= MAX_VALUE); // ponytail: a bigger value (thousands of solves) stays on this device
  const batches: [string, Push][][] = [];
  let size = Infinity;
  for (const e of fits) {
    const n = bytes(e[1].v);
    if (size + n > MAX_REQUEST) batches.push([]), (size = 0);
    batches.at(-1)!.push(e);
    size += n;
  }
  for (const batch of batches) {
    const body = { items: Object.fromEntries(batch) };
    const res = await api('POST', '/api/progress', body, leaving && bytes(JSON.stringify(body)) < KEEPALIVE);
    if (res.status === 401) return 'auth';
    if (res.status === 429) {
      waitUntil = Date.now() + (Number(res.headers.get('Retry-After')) || 60) * 1000;
      return 'error';
    }
    if (!res.ok) return 'error';
    const stale = new Set<string>((await res.json()).stale);
    for (const [k, it] of batch) {
      if (stale.has(k)) pullDue = true;
      else m.keys[k] = { h: hash(it.v), t: it.t };
    }
  }
  return fits.length < all.length ? 'tooBig' : 'ok';
}

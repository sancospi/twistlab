// The Resolver's times: the event or training being timed and the session (each with its own times), the list of
// times with its readout (the last time big, the averages under it), a time's sheet, statistics, import and Borrar
// todos. It owns the stored times (`all`, every event in one list) and the list shown (`results`); the Resolver
// (resolver.ts) adds a solve with addSolve and is told of each change through `useResolver`'s hooks.
import { histogramSvg, rolling, summary, trendSvg } from './stats.ts';
import { mergeResults, parseImport, parseSessions, parseStored, type Sessions } from './import.ts';
import {
  average, eventOf, formatAverage, formatResult, formatTime, hasInspection, is333, isEvent, isMo3, isTrain, resultValue, type EventId, type Penalty, type Result,
  type TrainId,
} from './timer.ts';
import { t, tp } from './i18n.ts';
import { $, btn, el } from './el.ts';
import { idle } from './screen.ts';
import { load, save, setting } from './academy/store.ts';

/** What the Resolver does about the times: whether an attempt is under way (nothing changes then), a change to show
 *  (the round, the challenges' cards), and a time's sheet's penalty and Eliminar (which may move the stage on). */
export interface Hooks { busy(): boolean; changed(): void; penalty(r: Result, p: Penalty): void; remove(r: Result): void }
let hooks: Hooks = { busy: () => false, changed() {}, penalty() {}, remove() {} };
export const useResolver = (h: Hooks) => void (hooks = h);

// Sessions (as csTimer's): named lists of times, each solve tagged with its id; none = the main one. Every event and
// training has its times in each. 'cube-sessions' ({id: {name, deleted?}}) syncs entry by entry (sync.ts RECORDS): a
// deleted session stays as a tombstone, so its times, which the account's union of solves could bring back, are dropped
// on every device. A solve of a session this device doesn't know (not synced yet) still gets its entry in the picker.
const SESSIONS_KEY = 'cube-sessions', SESSION_KEY = 'cube-session';
let sessions = parseSessions(load(SESSIONS_KEY));
const deleted = (id: string | undefined) => !!id && !!sessions[id]?.deleted;
export let session = setting<string>(SESSION_KEY, '', (v) => !deleted(v));
const sessionName = (id: string) => (!id ? t('session.main') : sessions[id]?.name ?? t('session.unnamed'));
const sessionSelect = $<HTMLSelectElement>('session');
function renderSessions() {
  const ids = new Set(['', ...Object.keys(sessions).filter((id) => !deleted(id)), ...all.flatMap((r) => (r.session ? [r.session] : [])), session]);
  const own = session ? [new Option(t('session.rename', { name: sessionName(session) }), '+rename'), new Option(t('session.delete', { name: sessionName(session) }), '+delete')] : [];
  sessionSelect.replaceChildren(
    ...[...ids].map((id) => new Option(sessionName(id), id, false, id === session)),
    el('optgroup', { label: t('session.manage') }, new Option(t('session.new'), '+new'), ...own),
  );
  sessionSelect.value = session;
}
function useSession(id: string) {
  session = id;
  save(SESSION_KEY, id);
  cancelReset(); // a pending 'Borrar todos' confirmation was for the other session's list
  renderSessions();
  renderResults();
}
function saveSession(id: string, entry: Sessions[string]) {
  sessions = { ...sessions, [id]: entry };
  save(SESSIONS_KEY, sessions);
}
sessionSelect.onchange = () => {
  const v = sessionSelect.value;
  sessionSelect.value = session; // an action isn't a session to stay on
  sessionSelect.blur(); // keys must reach the timer
  if (hooks.busy()) return;
  if (!v.startsWith('+')) return useSession(v);
  const ask = (current: string) => prompt(t('session.namePrompt'), current)?.trim().slice(0, 40);
  if (v === '+new') {
    const name = ask(t('session.defaultName', { n: Object.keys(sessions).length + 2 }));
    if (!name) return;
    const id = `s${Date.now().toString(36)}`;
    saveSession(id, { name });
    useSession(id);
  } else if (v === '+rename') {
    const name = ask(sessionName(session));
    if (!name) return;
    saveSession(session, { name });
    renderSessions();
  } else if (v === '+delete' && confirm(t('session.confirmDelete', { name: sessionName(session), n: all.filter((r) => r.session === session).length }))) {
    all = all.filter((r) => r.session !== session); // its times, of every event
    saveSession(session, { name: sessionName(session), deleted: true });
    useSession('');
  }
};

// The WCA event being timed (remembered); each keeps its own times, scrambles and puzzle. The same picker has the 3x3
// trainings (training.ts): a 3x3 event whose scrambles leave a case, with its own times (`train` on each solve). The
// picker itself is the Resolver's (resolver.ts).
const EVENT_KEY = 'cube-event';
const TRAIN_KEY = 'cube-train';
export let event = setting<EventId>(EVENT_KEY, '333', isEvent);
export let train: TrainId | null = (event === '333' && (setting<string>(TRAIN_KEY, '', isTrain) as TrainId | '')) || null;
/** The event (or a 3x3 training) whose times are listed and timed next, remembered. */
export function setEvent(e: EventId, tr: TrainId | null) {
  event = e;
  train = tr;
  save(EVENT_KEY, event);
  save(TRAIN_KEY, train ?? '');
  cancelReset(); // a pending 'Borrar todos' confirmation was for the old event
  renderResults();
}
/** What the list and its averages are: "3x3", "PLL"… and the session if it isn't the main one. */
export const listLabel = () => [train ? t(`train.${train}`) : t(`event.${event}`), ...(session ? [sessionName(session)] : [])].join(' · ');

// Times persist in this browser (newest first, every event in one list); anything malformed in storage is dropped
const RESULTS_KEY = 'cube-results';
export let all: Result[] = parseStored(load(RESULTS_KEY)).filter((r) => !deleted(r.session)); // a deleted session's, back from another device: gone
let crossShown = ''; // the scramble whose shortest cross is under the readout (renderCross)
export let results: Result[] = []; // the list shown: the event's, training's and session's (the same objects as in `all`), set by renderResults()
/** false when the browser refused (private mode, quota). */
const saveResults = () => {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
};
/** A new solve, newest first (renderResults shows it). */
export const addSolve = (solve: Result) => void all.unshift(solve);
/** Drops a solve from the stored times and shows the list again. */
export function dropSolve(r: Result) {
  all.splice(all.indexOf(r), 1);
  renderResults();
}

/** A clock's time, and its length for the CSS (--len on `sized`) that fits its size to the screen's width. */
export function showTime(e: HTMLElement, text: string, sized = e) {
  e.textContent = text;
  sized.style.setProperty('--len', String(Math.max(5, text.length)));
}

/** The times list and the line of stats; called whenever `results` changes (not on every move: it can be thousands). */
export function renderResults() {
  results = all.filter((r) => eventOf(r) === event && (r.train ?? null) === train && (r.session ?? '') === session);
  const best = results.reduce<Result | null>((b, r) => (!b || resultValue(r) < resultValue(b) ? r : b), null);
  // the readout: the last time big (green when it's the best), the averages and the best under it
  const last = results[0];
  showTime($('last-time'), last ? formatResult(last) : formatTime(0), $('last-open'));
  btn('last-open').disabled = !last;
  renderCross(last);
  $('readout').classList.toggle('empty', !last);
  $('readout').classList.toggle('pb', results.length > 1 && last === best);
  const figures: [string, string][] = !best ? []
    : isMo3(event) ? [['mo3', formatAverage(average(results, 3, 0))], [t('stats.best'), formatResult(best)]]
    : [['ao5', formatAverage(average(results, 5))], ['ao12', formatAverage(average(results, 12))], [t('stats.best'), formatResult(best)]];
  $('stats').replaceChildren(...figures.map(([name, value]) => el('div', {}, el('dt', { textContent: name }), el('dd', { textContent: value }))));
  saveResults();
  $('reset-results').hidden = !results.length;
  // ponytail: only the latest 100 (an import can bring thousands of focusable buttons); the stats dialog covers the rest
  $<HTMLOListElement>('results').start = results.length; // the list is reversed: numbered from the newest
  $('results').replaceChildren(...results.slice(0, 100).map((r) => {
    const b = el('button', { type: 'button', className: 'time', textContent: formatResult(r) + (r.comment ? ' •' : ''), onclick: () => openSolve(r) }); // •: it has a comment
    b.setAttribute('aria-label', t('results.open', { time: formatResult(r) }));
    b.setAttribute('aria-haspopup', 'dialog');
    return el('li', {}, b);
  }));
  hooks.changed();
}

// A time's sheet (solve-detail.ts): tapping the last time or one in the list
function openSolve(r: Result) {
  void import('./solve-detail.ts').then((m) => m.showSolve(r, {
    label: listLabel(), cube: is333(eventOf(r)), cross: !r.train && is333(eventOf(r)) && hasInspection(eventOf(r)), last: r === results[0],
    penalty: (p) => hooks.penalty(r, p),
    comment: (text) => {
      if (text) r.comment = text;
      else delete r.comment;
      saveResults();
    },
    remove: () => hooks.remove(r),
  }));
}
$('last-open').onclick = () => results[0] && openSolve(results[0]);
$('solve-detail').addEventListener('close', () => renderResults()); // a comment's mark in the list

// Under the readout, after a 3x3 solve: the shortest white cross of its scramble (not a training's: its cross is done)
function renderCross(last: Result | undefined) {
  const scramble = last?.scramble && !last.train && is333(eventOf(last)) && hasInspection(eventOf(last)) ? last.scramble : '';
  if (scramble === crossShown) return;
  crossShown = scramble;
  $('cross-best').replaceChildren();
  if (scramble) idle(() => void import('./solve-detail.ts').then((m) => m.crossLine(scramble, true)).then((line) => line && crossShown === scramble && $('cross-best').replaceChildren(line)));
}

// Clearing every time takes a second press within 3 s
let resetTimer = 0;
const resetLabel = () => ($('reset-results').textContent = t('results.deleteAll'));
function cancelReset() {
  clearTimeout(resetTimer);
  resetTimer = 0;
  resetLabel();
}
$('reset-results').onclick = () => {
  if (!resetTimer) {
    $('reset-results').textContent = t('results.confirmReset');
    resetTimer = setTimeout(() => ((resetTimer = 0), resetLabel()), 3000);
    return;
  }
  cancelReset();
  const gone = new Set(results);
  all = all.filter((r) => !gone.has(r)); // the list's times; the others stay
  renderResults();
};

// Statistics: every average's current and best, a histogram and the trend; also where times are imported
const statsDialog = $<HTMLDialogElement>('stats-dialog');
function renderStats() {
  if (!results.length) return $('stats-body').replaceChildren(el('p', { className: 'hint', textContent: t('stats.empty') }));
  const s = summary(results);
  const cell = (tag: 'th' | 'td', textContent: string) => el(tag, { textContent });
  const table = el('table', { className: 'quiz-table' },
    el('thead', {}, el('tr', {}, cell('th', ''), cell('th', t('stats.current')), cell('th', t('stats.best')))),
    el('tbody', {}, ...s.rows.filter((r) => r.best !== null).map((r) =>
      el('tr', {}, el('th', { scope: 'row', textContent: r.label === 'single' ? t('stats.single') : r.label }), cell('td', formatAverage(r.current)), cell('td', formatAverage(r.best))))));
  const values = results.map(resultValue).reverse(); // oldest first
  const figure = (title: string, svg: string, ...legend: Node[]) => {
    const f = el('figure', { className: 'chart' }, el('figcaption', { textContent: title }));
    f.insertAdjacentHTML('beforeend', svg);
    if (legend.length) f.append(el('p', { className: 'chart-legend hint' }, ...legend));
    return f;
  };
  const key = (cls: string, text: string) => el('span', { className: cls, textContent: text });
  const done = values.filter(Number.isFinite);
  $('stats-body').replaceChildren(
    table,
    el('p', { className: 'hint', textContent: tp('stats.count', s.count, { dnf: s.dnf, mean: formatAverage(s.mean) }) }),
    el('p', { className: 'hint', textContent: t('stats.caption') }),
    ...(done.length ? [figure(t('stats.histogram'), histogramSvg(values, t('stats.histogramAlt', { from: formatTime(done.reduce((a, b) => Math.min(a, b))) })))] : []),
    ...(values.length > 1 ? [figure(t('stats.trend'),
      trendSvg(values, [{ cls: 'ao5', avgs: rolling(values, 5) }, { cls: 'ao12', avgs: rolling(values, 12) }], t('stats.trendAlt', { n: values.length })),
      key('pt', t('stats.legendSolve')), key('ao5', 'ao5'), key('ao12', 'ao12'))] : []),
  );
}
$('stats-open').onclick = () => {
  $('stats-title').textContent = t('event.statsTitle', { event: listLabel() });
  renderStats();
  statsDialog.showModal();
};
$('import-choose').onclick = () => $('import-file').click();
$('import-file').onchange = async () => {
  const input = $<HTMLInputElement>('import-file');
  const file = input.files?.[0];
  input.value = ''; // the same file can be chosen again
  if (!file) return;
  const parsed = parseImport(await file.text(), event);
  if (session) parsed.results = parsed.results.map((r) => ({ ...r, session })); // into the session shown
  if (!parsed.results.length) return void ($('import-status').textContent = t('import.none'));
  const before = all;
  const merged = mergeResults(all, parsed.results);
  all = merged.results;
  // Too big for the browser's storage: keep what was there, or every later solve would fail to save too
  if (!saveResults()) return void ((all = before), ($('import-status').textContent = t('import.saveFailed')));
  renderResults();
  renderStats();
  $('import-status').textContent = t('import.done', { format: parsed.format, added: merged.added, dup: parsed.results.length - merged.added, skipped: parsed.skipped });
};

renderSessions();

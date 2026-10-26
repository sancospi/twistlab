// Progreso (/progreso): learning, statistics and progress only. First the optional account (account-view.ts: the sync
// and the name in the challenges), then Tiempos (per event, with the daily trend), Práctica (an activity calendar and
// totals), Aprendizaje (the spaced repetition's state per method and phase, lessons finished), Objetivo (an average
// under a time, with an estimated date) and the backup of this browser's data.
// Everything is read from storage on each visit, so it shows what the other screens saved.
import { lang, loc, t, tp } from './i18n.ts';
import { EVENTS, eventOf, formatAverage, formatTime, isEvent, isMo3, type EventId, type Result } from './timer.ts';
import { summary, trendSvg } from './stats.ts';
import { parseSessions, parseStored } from './import.ts';
import {
  activity, appData, daily, estimateGoal, GOAL_AVERAGES, GOAL_MIN_DAYS, GOAL_WINDOW_DAYS, packBackup, parseGoal, replaceAppData, unpackBackup,
} from './progress.ts';
import { el } from './el.ts';
import { isDue, KNOWN_DAYS, learnStatus, learningFor, load, parseStats, save, setting, statsFor } from './academy/store.ts';
import { METHODS, allCases } from './academy/methods.ts';
import { courseFor, parseDone } from './academy/lessons.ts';
import { parseHistory } from './academy/score.ts';
import { accountSection } from './account-view.ts';
import { analysisSection } from './analysis-view.ts';
import { parseCrossHistory } from './academy/crossScore.ts';

// The other screens' storage keys (persisted, so they never change)
const RESULTS_KEY = 'cube-results'; // main.ts
const EVENT_KEY = 'cube-event'; // main.ts
const LESSONS_KEY = 'academy-lessons'; // lessonView.ts
const QUIZ_KEY = 'academy-quiz-history'; // quiz.ts
const CROSS_KEY = 'academy-cross-history'; // crossTrainer.ts
const STATS_KEY = 'academy-stats'; // store.ts
const GOAL_KEY = 'progress-goal';
const WEEKS = 12; // the activity calendar

const text = (s: string, className = '') => el('p', { textContent: s, className });
const section = (title: string, ...children: Node[]) => el('section', { className: 'cube-block' }, el('h3', { textContent: title }), ...children);
const eventName = (e: EventId) => t(`event.${e}`);
const dateText = (ms: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat(lang, opts).format(ms);

export function showProgress(root: HTMLElement): void {
  const sessions = parseSessions(load('cube-sessions')); // main.ts
  const all = parseStored(load(RESULTS_KEY)).filter((r) => !r.session || !sessions[r.session]?.deleted); // a deleted session's, back from another device
  const results = all.filter((r) => !r.train); // a training's solves are a case, not the event's times (they still count as practice)
  root.replaceChildren(
    el('h2', { textContent: t('progress.title') }),
    text(t('progress.intro'), 'hint'),
    text(t('pwa.offline'), 'hint'),
    accountSection(), timesSection(results), analysisSection(results), practiceSection(all), learningSection(), goalSection(results), backupSection());
}

// --- Tiempos: one event at a time (the Resolver's, else the first with times) ---

function timesSection(results: Result[]): HTMLElement {
  const events = EVENTS.filter((e) => results.some((r) => eventOf(r) === e));
  if (!events.length) return section(t('progress.times'), text(t('progress.timesEmpty'), 'hint'));
  const current = setting<EventId>(EVENT_KEY, '333', isEvent);
  const select = el('select', {}, ...events.map((e) => new Option(eventName(e), e, false, e === current)));
  const body = el('div', { className: 'stats-body' });
  const fill = () => body.replaceChildren(...eventTimes(results.filter((r) => eventOf(r) === select.value), select.value as EventId));
  select.onchange = fill;
  fill();
  return section(t('progress.times'), el('label', { className: 'event-pick' }, el('span', { textContent: t('event.label') }), select), body);
}

function eventTimes(res: Result[], event: EventId): Node[] {
  const s = summary(res);
  const shown = ['single', ...(isMo3(event) ? ['mo3'] : []), 'ao5', 'ao12', 'ao100'];
  const cell = (tag: 'th' | 'td', textContent: string) => el(tag, { textContent });
  const table = el('table', { className: 'quiz-table' },
    el('thead', {}, el('tr', {}, cell('th', ''), cell('th', t('stats.current')), cell('th', t('stats.best')))),
    el('tbody', {}, ...s.rows.filter((r) => shown.includes(r.label) && r.best !== null).map((r) =>
      el('tr', {}, el('th', { scope: 'row', textContent: r.label === 'single' ? t('stats.single') : r.label }), cell('td', formatAverage(r.current)), cell('td', formatAverage(r.best))))));
  const out: Node[] = [table, text(tp('stats.count', s.count, { dnf: s.dnf, mean: formatAverage(s.mean) }), 'hint')];
  // the trend, a point per day: the stats dialog's chart with the day's best single and the day's ao5 / ao12
  const ao5 = daily(res, 'ao5');
  if (ao5.length > 1) {
    const f = el('figure', { className: 'chart' }, el('figcaption', { textContent: t('progress.trend') }));
    const ao12 = daily(res, 'ao12').map((d) => d.avg);
    const short = (d: number) => dateText(d, { day: 'numeric', month: 'short' });
    f.insertAdjacentHTML('beforeend', trendSvg(ao5.map((d) => d.best),
      [{ cls: 'ao5', avgs: ao5.map((d) => d.avg) }, { cls: 'ao12', avgs: ao12 }],
      t('progress.trendAlt'), { scale: [...ao5.map((d) => d.avg ?? NaN), ...ao12.map((v) => v ?? NaN)], xs: [short(ao5[0].day), short(ao5[ao5.length - 1].day)] }));
    const key = (cls: string, s: string) => el('span', { className: cls, textContent: s });
    f.append(el('p', { className: 'chart-legend hint' }, key('pt', t('progress.legendBest')), key('ao5', 'ao5'), key('ao12', 'ao12')));
    out.push(f, text(t('progress.trendHint'), 'hint'));
  }
  return out;
}

// --- Práctica: which days, and how much ---

/** When something was practised: the Resolver's solves, quiz and cross sessions, each case's last practice (also /hoy's streak). */
export function practiceTimes(results = parseStored(load(RESULTS_KEY))): number[] {
  return [
    ...results.flatMap((r) => (r.at === undefined ? [] : [r.at])), ...parseHistory(load(QUIZ_KEY)).map((s) => s.at),
    ...parseCrossHistory(load(CROSS_KEY)).map((s) => s.at),
    ...Object.values(parseStats(load(STATS_KEY))).map((s) => s.lastPracticed), // ponytail: only each case's last practice is stored, not every day it was drilled
  ];
}

function practiceSection(results: Result[]): HTMLElement {
  const quiz = parseHistory(load(QUIZ_KEY));
  const cross = parseCrossHistory(load(CROSS_KEY));
  const stats = Object.values(parseStats(load(STATS_KEY)));
  const days = activity(practiceTimes(results), Date.now(), WEEKS);
  const active = days.filter((d) => d.n).length;
  const label = t('progress.calendar', { n: active, days: days.length });
  const calendar = el('div', { className: 'activity', role: 'img', ariaLabel: label },
    ...days.map((d) => el('span', { className: `l${d.n ? Math.min(3, Math.ceil(d.n / 5)) : 0}`, title: tp('progress.day', d.n, { date: dateText(d.day, { weekday: 'short', day: 'numeric', month: 'short' }) }) })));
  const row = (dt: string, dd: string | number) => [el('dt', { textContent: dt }), el('dd', { textContent: String(dd) })];
  return section(t('progress.practice'), calendar, text(t('progress.calendarHint'), 'hint'),
    el('dl', {},
      ...row(t('progress.daysPracticed'), t('progress.daysOf', { n: active, days: days.length })),
      ...row(t('progress.totalSolves'), results.length),
      ...row(t('progress.totalReps'), stats.reduce((n, s) => n + s.reps, 0)),
      ...row(t('progress.quizSessions'), quiz.length),
      ...row(t('progress.quizCases'), quiz.reduce((n, s) => n + s.n, 0)),
      ...row(t('progress.crossSessions'), cross.length)));
}

// --- Aprendizaje: per method and phase, where each case stands in the spaced repetition ---

/** Which groups of Aprendizaje are open ({ id: open }): this device's view only, so not in the backup nor synced. */
const OPEN_KEY = 'ui-progress-open';

function learningSection(): HTMLElement {
  const now = Date.now();
  const done = parseDone(load(LESSONS_KEY));
  const opened = (load(OPEN_KEY) ?? {}) as Record<string, boolean>;
  const counts = (cases: { id: string }[]) => {
    const n = { known: 0, learning: 0, fresh: 0, due: 0, practised: 0 };
    for (const c of cases) {
      const l = learningFor(c.id);
      const st = learnStatus(l);
      n[st === 'new' ? 'fresh' : st]++;
      if (isDue(l, now)) n.due++;
      if (statsFor(c.id)) n.practised++;
    }
    return n;
  };
  const lessonRow = (id: string) => {
    const c = courseFor(id);
    if (!c) return [];
    const n = c.lessons.filter((l) => done[c.id]?.includes(l.id)).length;
    return [el('label', { className: 'learn-row' }, el('strong', { textContent: `${t('progress.lessons')}: ${c.title}` }),
      el('progress', { max: c.lessons.length, value: n }), text(t('progress.lessonsDone', { done: n, total: c.lessons.length }), 'hint'))];
  };
  // a collapsible group; untouched ones start open only if something in them was practised
  const group = (id: string, title: string, hint: string, used: boolean, rows: HTMLElement[]) => {
    const d = el('details', { className: 'learn-method', open: opened[id] ?? used },
      el('summary', {}, el('h4', { textContent: title }), text(hint, 'hint')), ...rows);
    d.ontoggle = () => save(OPEN_KEY, { ...((load(OPEN_KEY) ?? {}) as Record<string, boolean>), [id]: d.open });
    return d;
  };
  const methods = METHODS.filter((m) => allCases(m).length).map((m) => {
    const all = counts(allCases(m));
    const phases = m.phases.flatMap((p) => {
      const cases = p.groups.flatMap((g) => g.cases);
      if (!cases.length) return [];
      const n = counts(cases);
      const bar = el('div', { className: 'learn-bar', ariaHidden: 'true' }, // the text below says the same
        ...(['known', 'learning', 'fresh'] as const).map((k) => {
          const seg = el('span', { className: k });
          seg.style.flexGrow = String(n[k]);
          return seg;
        }));
      return [el('div', { className: 'learn-row' }, el('strong', { textContent: loc(p.name) }), bar, text(t('progress.counts', n), 'hint'))];
    });
    return group(m.id, loc(m.name), t('progress.methodSummary', { known: all.known, total: allCases(m).length, due: all.due }),
      all.practised > 0, [...phases, ...lessonRow(m.id)]);
  });
  const guides = ['notacion', 'cruz', '2x2'].flatMap(lessonRow);
  return section(t('progress.learning'), text(t('progress.learningHint', { days: KNOWN_DAYS }), 'hint'), ...methods,
    group('guias', t('progress.guides'), '', guides.some((r) => (r.querySelector('progress')?.value ?? 0) > 0), guides));
}

// --- Objetivo: an average under a time, and when today's pace gets there ---

function goalSection(results: Result[]): HTMLElement {
  const goal = parseGoal(load(GOAL_KEY));
  const box = section(t('progress.goal'));
  const redraw = () => {
    const next = goalSection(results);
    box.replaceWith(next);
    next.querySelector<HTMLElement>('[role=status]')?.focus(); // the focused button is gone: read the new estimate
  };
  const event = el('select', { name: 'event' }, ...EVENTS.map((e) => new Option(eventName(e), e, false, e === (goal?.event ?? setting<EventId>(EVENT_KEY, '333', isEvent)))));
  const avg = el('select', { name: 'avg' }, ...GOAL_AVERAGES.map((a) => new Option(a, a, false, a === (goal?.avg ?? 'ao5'))));
  const secs = el('input', { type: 'number', name: 'secs', min: '1', max: '3599', step: '0.01', required: true, inputMode: 'decimal', value: goal ? String(goal.ms / 1000) : '' });
  const field = (label: string, input: HTMLElement) => el('label', { className: 'library-field' }, el('span', { className: 'hint', textContent: label }), input);
  const form = el('form', { className: 'row goal-form' },
    field(t('event.label'), event), field(t('progress.goalAvg'), avg), field(t('progress.goalTime'), secs),
    el('button', { className: 'primary', textContent: t('progress.goalSave') }));
  form.onsubmit = (e) => {
    e.preventDefault();
    const g = parseGoal({ event: event.value, avg: avg.value, ms: Math.round(secs.valueAsNumber * 100) * 10 });
    if (!g) return;
    save(GOAL_KEY, g);
    redraw();
  };
  box.append(text(t('progress.goalHint'), 'hint'));
  if (goal) {
    const res = results.filter((r) => eventOf(r) === goal.event);
    const current = summary(res).rows.find((r) => r.label === goal.avg)?.current ?? null;
    const est = estimateGoal(daily(res, goal.avg), goal.ms, Date.now());
    const weeks = GOAL_WINDOW_DAYS / 7;
    const msg = est.kind === 'eta' ? t('progress.goalEta', { date: dateText(est.at) })
      : est.kind === 'reached' ? t('progress.goalReached')
      : est.kind === 'few' ? t('progress.goalFew', { min: GOAL_MIN_DAYS, weeks })
      : est.kind === 'flat' ? t('progress.goalFlat', { weeks }) : t('progress.goalFar');
    const remove = el('button', { type: 'button', className: 'small', textContent: t('progress.goalRemove'), onclick: () => (save(GOAL_KEY, null), redraw()) });
    box.append(
      el('p', {}, el('strong', { textContent: t('progress.goalIs', { avg: goal.avg, event: eventName(goal.event), target: formatTime(goal.ms), current: formatAverage(current) }) })),
      Object.assign(text(msg), { role: 'status', tabIndex: -1 }),
      ...(est.kind === 'eta' ? [text(t('progress.goalHow', { weeks }), 'hint')] : []),
      el('div', { className: 'row' }, remove));
  }
  box.append(form);
  return box;
}

// --- Tus datos: export and import every key of this app (the cube MACs stay on this device) ---

function backupSection(): HTMLElement {
  const status = el('p', { role: 'status' });
  const confirm = el('div', { className: 'backup-confirm', role: 'alert' });
  confirm.hidden = true;
  const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
  const exportBtn = el('button', { type: 'button', className: 'primary', textContent: t('backup.export') });
  exportBtn.onclick = () => {
    let data: Record<string, string>;
    try { data = appData(localStorage); } catch { return void (status.textContent = t('backup.unavailable')); }
    const now = Date.now();
    const a = el('a', { href: URL.createObjectURL(new Blob([packBackup(data, now)], { type: 'application/json' })), download: `twistlab-datos-${new Date(now).toISOString().slice(0, 10)}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
    status.textContent = t('backup.exported');
  };
  file.onchange = async () => {
    const f = file.files?.[0];
    file.value = ''; // the same file can be chosen again
    if (!f) return;
    const backup = unpackBackup(await f.text());
    confirm.hidden = !backup.ok;
    if (!backup.ok) return void (status.textContent = t(backup.error === 'json' ? 'backup.badJson' : backup.error === 'version' ? 'backup.badVersion' : 'backup.badShape'));
    status.textContent = '';
    const replace = el('button', { type: 'button', className: 'primary', textContent: t('backup.replace') });
    replace.onclick = () => {
      let ok: boolean;
      try { ok = replaceAppData(localStorage, backup.data); } catch { ok = false; }
      confirm.hidden = true;
      status.textContent = t(ok ? 'backup.done' : 'backup.full');
      if (ok) location.reload(); // every screen loads its state again from the new data
    };
    const cancel = el('button', { type: 'button', textContent: t('backup.cancel'), onclick: () => ((confirm.hidden = true), importBtn.focus()) });
    confirm.replaceChildren(text(t('backup.confirm', { date: dateText(backup.exportedAt), n: Object.keys(backup.data).length })), el('div', { className: 'row' }, replace, cancel));
    cancel.focus();
  };
  const importBtn = el('button', { type: 'button', textContent: t('backup.import'), onclick: () => file.click() });
  return section(t('backup.title'), text(t('backup.hint'), 'hint'), el('div', { className: 'row' }, exportBtn, importBtn), file, confirm, status);
}

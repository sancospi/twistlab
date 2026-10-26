// The Resolver's WCA round simulator: the format's attempts in a row (Regulations 9f/9g), with an optional cutoff and
// time limit; its solves also count as normal results. The round on (`round`), its attempt counter, the event's last
// rounds and the result dialog. What it needs of the Resolver (the attempt's phase, a new scramble, the stage) comes
// through `useResolver`.
import { ATTEMPTS, attemptValue, parseRounds, roundFormat, roundResult, storedResult, type RoundOpts, type StoredRound } from './round.ts';
import { summary } from './stats.ts';
import { formatAverage, formatTime, resultValue, type Result } from './timer.ts';
import { t, tp } from './i18n.ts';
import { $, btn, el } from './el.ts';
import { load, save } from './academy/store.ts';
import { all, event, renderResults, results, train } from './times-view.ts';

type Phase = 'scramble' | 'ready' | 'inspect' | 'solving' | 'done';
/** The Resolver, as a round needs it: the attempt's phase, a new scramble, the stage drawn again. */
export interface Hooks { phase(): Phase; newScramble(): void; renderTimer(): void }
let hooks: Hooks = { phase: () => 'ready', newScramble() {}, renderTimer() {} };
export const useResolver = (h: Hooks) => void (hooks = h);
const timing = () => hooks.phase() === 'inspect' || hooks.phase() === 'solving';

const ROUNDS_KEY = 'cube-rounds';
let rounds = parseRounds(load(ROUNDS_KEY));
export let round: { format: ReturnType<typeof roundFormat>; opts: RoundOpts; solves: Result[]; pb: number | null; pbSingle: number | null } | null = null;
const roundValues = () => round!.solves.map((r) => attemptValue(r, round!.opts.limit));
const seconds = (id: string) => {
  const v = parseFloat($<HTMLInputElement>(id).value);
  return v > 0 ? Math.round(v * 1000) : undefined;
};
const finite = (v: number | null | undefined) => (v != null && Number.isFinite(v) ? v : null);
const min = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.min(a, b));

/** A solve of the round: in, and a DNF if it's over the time limit. */
export function countIn(solve: Result) {
  if (!round) return;
  if (attemptValue(solve, round.opts.limit) === Infinity) solve.penalty = 'DNF';
  round.solves.push(solve);
}
/** A solve deleted (Eliminar): out of the round too, where that attempt is made again. */
export const leaveOut = (r: Result) => void (round && (round.solves = round.solves.filter((x) => x !== r)));
/** Before the next scramble: a round whose last attempt was already timed ends (its result dialog). */
export function finishIfDone() {
  if (round && roundResult(roundValues(), round.format, round.opts).done) finishRound();
}

/** The round's controls and its attempt counter (on the page and on the stage): on every render, so cheap. */
export function renderRound() {
  const format = roundFormat(event);
  const n = ATTEMPTS[format];
  const k = format === 'ao5' ? 2 : 1;
  const phase = hooks.phase();
  $('round-hint').textContent = tp('round.hint', k, { format: t(`round.${format}`) });
  btn('round-start').hidden = !!round || !!train; // a training isn't a WCA round
  btn('round-stop').hidden = !round;
  btn('round-start').disabled = timing();
  const eventSelect = $<HTMLSelectElement>('event');
  eventSelect.disabled = !!round; // the event can't change mid-round
  eventSelect.title = round ? t('round.eventLocked') : '';
  for (const id of ['round-cutoff', 'round-limit']) $<HTMLInputElement>(id).disabled = !!round; // read once, at start
  let text = '';
  if (round) {
    const res = roundResult(roundValues(), round.format, round.opts);
    const last = round.solves[round.solves.length - 1];
    text = res.done && phase === 'done' ? t(res.cutoffFailed ? 'round.overCutoff' : 'round.over')
      : t('round.attempt', { n: Math.min(round.solves.length + (phase === 'done' ? 0 : 1), n), total: n });
    if (phase === 'done' && last && round.opts.limit !== undefined && resultValue(last) > round.opts.limit) text += ' · ' + t('round.overLimit');
  }
  if ($('round-status').textContent !== text) $('round-status').textContent = text;
  $('stage-round').textContent = text;
}

/** The round against the history, when either changes (times-view.ts's renderResults): a solve deleted from the
 *  history leaves the round, and the event's last rounds are listed. Not on every move, as renderRound is. */
export function renderRoundList() {
  if (round) round.solves = round.solves.filter((r) => all.includes(r));
  const format = roundFormat(event);
  $('round-list').setAttribute('aria-label', t('round.recent'));
  const date = (at: number) => new Date(at).toLocaleDateString(document.documentElement.lang, { day: 'numeric', month: 'short' });
  $('round-list').replaceChildren(...rounds.filter((r) => r.event === event).slice(0, 5).map((r) => {
    const res = storedResult(r);
    const params = { format: t(`round.${format}`), best: formatAverage(res.best), date: date(r.at), value: formatAverage(res.final) };
    return el('li', { textContent: t(res.final === null ? 'round.itemFailed' : 'round.item', params) });
  }));
  renderRound(); // the attempt counter, after a deletion
}

function startRound() {
  if (round || train || timing()) return;
  const format = roundFormat(event);
  const rows = summary(results).rows;
  const best = (label: string) => finite(rows.find((r) => r.label === label)?.best);
  const earlier = rounds.filter((r) => r.event === event).map((r) => finite(storedResult(r).final));
  round = {
    format, opts: { cutoff: seconds('round-cutoff'), limit: seconds('round-limit') }, solves: [],
    pb: earlier.reduce(min, best(format === 'bo3' ? 'single' : format)),
    pbSingle: best('single'),
  };
  hooks.newScramble(); // a fresh scramble for attempt 1 (renders)
}

function finishRound() {
  const r = round!;
  const values = roundValues();
  const res = roundResult(values, r.format, r.opts);
  round = null;
  rounds = [{ event, at: Date.now(), values: values.map(finite), ...(r.opts.cutoff && { cutoff: r.opts.cutoff }), ...(r.opts.limit && { limit: r.opts.limit }) } satisfies StoredRound, ...rounds].slice(0, 200);
  save(ROUNDS_KEY, rounds);
  const versus = (value: number, pb: number | null) =>
    !Number.isFinite(value) ? '' : ' · ' + (pb === null ? t('round.firstPb') : value < pb ? t('round.newPb') : t('round.vsPb', { pb: formatTime(pb), diff: formatTime(value - pb) }));
  const p = (textContent: string) => el('p', { textContent });
  const format = t(`round.${r.format}`);
  $('round-title').textContent = t('round.dialogTitle', { event: t(`event.${event}`) });
  $('round-body').replaceChildren(
    p(values.map(formatAverage).join(' · ')),
    p(res.cutoffFailed ? t('round.cutoffFailed', { cutoff: formatTime(r.opts.cutoff!), format }) : t('round.result', { format, value: formatAverage(res.final) }) + versus(res.final!, r.pb)),
    ...(r.format === 'bo3' && !res.cutoffFailed ? [] : [p(t('round.best', { value: formatAverage(res.best) }) + versus(res.best, r.pbSingle))]),
  );
  $<HTMLDialogElement>('round-dialog').showModal();
  renderResults();
}
btn('round-start').onclick = startRound;
btn('round-stop').onclick = () => ((round = null), renderResults(), hooks.renderTimer());

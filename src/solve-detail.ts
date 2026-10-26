// A time's sheet (the Resolver: tapping the last time or one in the list): its penalty, its phases, its scramble with
// the shortest white cross, the smart cube's analysis if it had one, a comment and Eliminar. Also the shortest cross
// line the Resolver shows under the readout after a 3x3 solve. Loaded the first time either is needed.
import { cube3x3x3 } from 'cubing/puzzles';
import { lang, t, tp } from './i18n.ts';
import { el } from './el.ts';
import { algView } from './notation-view.ts';
import { unmapMove, YELLOW_UP } from './notation.ts';
import { solveCross } from './academy/cross.ts';
import { load } from './academy/store.ts';
import { ANALYSIS_KEY } from './solve-analysis.ts';
import { MAX_COMMENT } from './import.ts';
import { formatResult, formatTime, type Penalty, type Result } from './timer.ts';

const kpuzzle = cube3x3x3.kpuzzle();
const crosses = new Map<string, string[]>(); // by scramble: the first one builds the cross table (~0.1 s)

/** The shortest white cross of a 3x3 scramble (applied white up, green front), as the Academia holds it: yellow up. */
async function bestCross(scramble: string): Promise<string[]> {
  const known = crosses.get(scramble);
  if (known) return known;
  const p = (await kpuzzle).defaultPattern().applyAlg(scramble);
  const alg = solveCross(p, 'U', 1)[0].map((m) => unmapMove(m, YELLOW_UP)); // white on cubing's U
  crosses.set(scramble, alg);
  return alg;
}

/** "Shortest white cross (n turns, yellow up):" and its turns (`last`: said to be the last solve's, under the readout
 *  while the next scramble is up); null if the scramble can't be read. */
export async function crossLine(scramble: string, last = false): Promise<HTMLElement | null> {
  try {
    const alg = await bestCross(scramble);
    return el('p', { className: 'hint cross-best' }, tp(last ? 'solve.crossLast' : 'solve.crossBest', alg.length) + ' ', algView(alg, { frame: 'yellow-up' }));
  } catch {
    return null;
  }
}

export interface SolveSheet {
  /** e.g. "3x3 · Principal" */
  label: string;
  /** a 3x3 scramble: tappable moves */
  cube: boolean;
  /** a WCA one (not a training's): its shortest cross */
  cross: boolean;
  /** the latest time: its penalties have keyboard shortcuts */
  last: boolean;
  penalty(p: Penalty): void;
  comment(text: string): void;
  remove(): void;
}

const dialog = () => document.getElementById('solve-detail') as HTMLDialogElement;

export function showSolve(r: Result, s: SolveSheet): void {
  const body = document.getElementById('solve-detail-body')!;
  const title = document.getElementById('solve-detail-title')!;
  const when = r.at ? new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(r.at) : '';
  const pens: [Penalty, string, string][] = [[0, t('penalty.ok'), 'Ctrl+1'], [2000, '+2', 'Ctrl+2'], ['DNF', 'DNF', 'Ctrl+3']];
  // a DNF typed without its time can't become a time
  const buttons = pens.map(([p, text, keys]) => el('button', { type: 'button', textContent: text, title: s.last ? keys : '', disabled: !r.ms && p !== 'DNF', onclick: () => (s.penalty(p), draw()) }));
  const draw = () => {
    title.textContent = formatResult(r);
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(r.penalty === pens[i][0])));
  };
  draw();
  const group = el('div', { className: 'row', role: 'group', ariaLabel: t('penalty.label') }, ...buttons);
  // the phases' own times: from the start to the first split, between splits, from the last one to the end
  const ends = [...(r.splits ?? []), r.ms];
  const phases = r.splits ? [el('p', {}, el('strong', { textContent: t('detail.phases') + ' ' }), ends.map((x, i) => formatTime(x - (ends[i - 1] ?? 0))).join(' · '))] : [];
  const scramble = r.scramble ? [el('h3', { textContent: t('solve.scramble') }), el('p', { className: 'detail-scramble' }, s.cube ? algView(r.scramble, { frame: 'white-up' }) : r.scramble)] : [];
  const cross = el('div');
  if (s.cross && r.scramble) void crossLine(r.scramble).then((line) => line && cross.replaceChildren(line));
  const analysis = el('div', { className: 'analysis' });
  const analysed = Array.isArray(load(ANALYSIS_KEY)) && (load(ANALYSIS_KEY) as { at?: number }[]).some((a) => a?.at === r.at);
  if (analysed) void import('./analysis-view.ts').then((m) => analysis.replaceChildren(...m.analysisOf(r.at!)));
  const note = el('textarea', { id: 'solve-comment', rows: 2, maxLength: MAX_COMMENT, value: r.comment ?? '', placeholder: t('detail.commentHint') });
  note.oninput = () => s.comment(note.value.trim());
  body.replaceChildren(
    el('p', { className: 'hint', textContent: [when, s.label].filter(Boolean).join(' · ') }),
    group, ...phases, ...scramble, cross, analysis,
    el('label', { className: 'detail-comment' }, el('span', { textContent: t('detail.comment') }), note),
    el('div', { className: 'row' }, el('button', { type: 'button', className: 'danger', textContent: t('results.delete'), onclick: () => (s.remove(), dialog().close()) })),
  );
  dialog().showModal();
}

// Entrenador «AUF»: a last-layer case seen from above, find the U turn before its algorithm.
// Its own page (/academia/auf), a tile in the Academia's «Entrenadores». view.ts draws the crumbs and calls
// aufTrainerView; stopAufTrainer runs whenever the page is left. Texts: Localized (tr(es, en)) in this file.
// Two modes: «Antes», the AUF that sets the case up for its algorithm (the one chosen on its page), and «Después»,
// the AUF that finishes it, guessed before doing the algorithm (that needs the centers: a view with the side faces).
// The drill's logic is pllRecognition.ts's.
import type { KPuzzle } from 'cubing/kpuzzle';
import { loc, t, type Localized } from '../i18n.ts';
import { el } from '../el.ts';
import { patternToFacelets } from '../facelets.ts';
import { formatTime } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { prose } from '../rich-text-view.ts';
import { caseDiagram, isoSVG, twoSidesSVG } from './diagram.ts';
import { load, preferred, save, setting } from './store.ts';
import type { Auf } from './cube.ts';
import type { Case } from './types.ts';
import {
  AUFS, NEXT_MS, after, parseProgress, pickCase, pllItem, preAufs, savedSubset, scored, statsText, subsetCases, subsetSelect,
  svgBox, tallied, weakest, type PllItem, type Tally,
} from './pllRecognition.ts';

const tr = (es: string, en: string): Localized => ({ es, en });

type Mode = 'pre' | 'post';
type View = 'top' | 'two';
const KEY = (mode: Mode) => `academy-auf-${mode}`;
const SUBSET_KEY = 'academy-auf-set';
let timer = 0;

const aufLabel = (a: Auf) => a || loc(tr('Sin giro', 'No turn'));
const orList = (as: Auf[]) => as.map(aufLabel).join(loc(tr(' o ', ' or ')));
const withAuf = (a: Auf) => (a ? loc(tr(`con ${aufLabel(a)}`, `with ${aufLabel(a)}`)) : loc(tr('sin giro', 'with no turn')));

/** The U turns that answer `item` in `mode`: before its algorithm (any that works), or the one after it. */
export const aufAnswers = (item: PllItem, mode: Mode): Auf[] => (mode === 'pre' ? preAufs(item.pattern, item.alg) : [item.post]);

/** H, Na, Nb: every AUF before them works, so «Antes» leaves them out (unless they're all there is). */
const trivial = (kpuzzle: KPuzzle, c: Case) => preAufs(pllItem(kpuzzle, c, preferred(c).alg, Math.random).pattern, preferred(c).alg).length === 4;

/** The trainer's page, under the Academia's crumbs. */
export function aufTrainerView(kpuzzle: KPuzzle): HTMLElement {
  let mode = setting<Mode>('academy-auf-mode', 'pre', (v) => v === 'pre' || v === 'post');
  let view = setting<View>('academy-auf-view', 'top', (v) => v === 'top' || v === 'two');
  let subset = savedSubset(SUBSET_KEY);
  let progress = parseProgress(load(KEY(mode)));
  let tally: Tally = { n: 0, ok: 0, ms: 0, streak: 0 };
  let item: PllItem | null = null;
  let shownAt = 0;
  let answered = false;

  const stats = el('p', { className: 'trainer-stats' });
  const weak = el('p', { className: 'hint' });
  const prompt = el('div', { className: 'trainer-prompt' });
  const question = el('div', { className: 'trainer-figure' });
  const answer = el('div', { className: 'trainer-figure trainer-result' });
  const feedback = el('p', { className: 'trainer-feedback', role: 'status' });
  const next = el('button', { type: 'button', onclick: () => ask() });
  const buttons = AUFS.map((a) => el('button', { type: 'button', textContent: aufLabel(a), onclick: () => choose(a) }));

  // the case as shown: «Después» with its AUF before already done
  const shown = () => (mode === 'pre' ? item!.pattern : after(item!.pattern, item!.pre));
  const figure = (f: string, title: string) => (mode === 'post' ? isoSVG(f, 'pll', { size: 200, title })
    : view === 'two' ? twoSidesSVG(f, { size: 200, title }) : caseDiagram('top', 'pll-edges', f, { size: 200, title }));

  function ask() {
    clearTimeout(timer);
    const all = subsetCases(subset), easy = mode === 'pre' ? all.filter((c) => !trivial(kpuzzle, c)) : all;
    const c = pickCase(easy.length ? easy : all, progress, Math.random, item?.c.id);
    item = pllItem(kpuzzle, c, preferred(c).alg, Math.random);
    answered = false;
    prompt.replaceChildren(
      el('strong', { textContent: loc(c.name) }), ' ', algView(item.alg),
      el('p', { textContent: mode === 'pre' ? loc(tr('¿Qué giro de U haces antes del algoritmo?', 'Which U turn do you do before the algorithm?'))
        : loc(tr('Hecho el algoritmo, ¿qué giro de U lo termina?', 'Once the algorithm is done, which U turn finishes it?')) }));
    question.innerHTML = figure(patternToFacelets(shown()), loc(mode === 'pre' ? tr(`${loc(c.name)}, antes del AUF`, `${loc(c.name)}, before the AUF`)
      : tr(`${loc(c.name)}, antes del algoritmo`, `${loc(c.name)}, before the algorithm`)));
    answer.replaceChildren();
    feedback.textContent = '';
    for (const b of buttons) b.classList.remove('right', 'wrong');
    next.textContent = t('quiz.skip');
    next.className = '';
    stats.textContent = statsText(tally, progress.best);
    weak.textContent = weakest(all, progress);
    shownAt = performance.now();
  }

  function choose(a: Auf) {
    if (answered || !item) return;
    answered = true;
    const ms = performance.now() - shownAt, ok = aufAnswers(item, mode), right = ok.includes(a);
    tally = tallied(tally, right, ms);
    progress.best = Math.max(progress.best, tally.streak);
    progress.cases[item.c.id] = scored(progress.cases[item.c.id], right, ms);
    save(KEY(mode), progress);
    ok.forEach((x) => buttons[AUFS.indexOf(x)].classList.add('right'));
    if (!right) buttons[AUFS.indexOf(a)].classList.add('wrong');
    const others = ok.filter((x) => x !== a);
    feedback.textContent = right
      ? loc(tr(`¡Bien! ${aufLabel(a)} · ${formatTime(ms)} s`, `Right! ${aufLabel(a)} · ${formatTime(ms)} s`))
        + (others.length ? loc(tr(` (también vale ${orList(others)})`, ` (${orList(others)} works too)`)) : '')
      : loc(tr(`No: era ${orList(ok)}. Así queda ${withAuf(a)}:`, `No: it was ${orList(ok)}. This is what you get ${withAuf(a)}:`));
    feedback.className = `trainer-feedback ${right ? 'ok' : 'bad'}`;
    // what the chosen turn gives: before the algorithm, or after it
    const result = mode === 'pre' ? after(after(item.pattern, a), item.alg) : after(after(shown(), item.alg), a);
    answer.replaceChildren(svgBox('', mode === 'post' ? isoSVG(patternToFacelets(result), 'pll', { size: 140 })
      : caseDiagram('top', 'pll-edges', patternToFacelets(result), { size: 140 })),
    el('small', { className: 'hint', textContent: !a ? loc(tr('Solo el algoritmo', 'The algorithm alone'))
      : mode === 'pre' ? loc(tr(`${a} y luego el algoritmo`, `${a}, then the algorithm`)) : loc(tr(`El algoritmo y luego ${a}`, `The algorithm, then ${a}`)) }));
    answer.querySelector('svg')?.setAttribute('aria-hidden', 'true'); // the feedback says it
    next.textContent = t('quiz.next');
    next.className = 'primary';
    stats.textContent = statsText(tally, progress.best);
    weak.textContent = weakest(subsetCases(subset), progress);
    if (right) timer = window.setTimeout(ask, NEXT_MS);
    else next.focus();
  }

  // Antes · Después, and the view (Antes only: Después needs the centers, so it shows the side faces whole)
  const toggle = <T extends string>(label: Localized, options: [T, Localized][], value: () => T, set: (v: T) => void) => {
    const bs = options.map(([v, name]) => el('button', { type: 'button', textContent: loc(name), onclick: () => {
      set(v);
      bs.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === value())));
      ask();
    } }));
    bs.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === value())));
    return el('div', { className: 'trainer-switch', role: 'group', ariaLabel: loc(label) }, el('small', { className: 'hint', ariaHidden: 'true', textContent: loc(label) }), ...bs);
  };
  const views = toggle(tr('Vista', 'View'), [['top', tr('Desde arriba', 'From above')], ['two', tr('Dos caras', 'Two sides')]], () => view, (v) => save('academy-auf-view', (view = v)));
  views.hidden = mode === 'post';
  const modes = toggle(tr('Modo', 'Mode'), [['pre', tr('Antes', 'Before')], ['post', tr('Después', 'After')]], () => mode, (v) => {
    save('academy-auf-mode', (mode = v));
    progress = parseProgress(load(KEY(mode)));
    tally = { n: 0, ok: 0, ms: 0, streak: 0 };
    views.hidden = mode === 'post';
  });

  ask();
  return el('section', { className: 'academy-trainer' },
    el('h2', { textContent: t('trainer.auf.title') }),
    prose(loc(tr(
      '**Antes:** te digo la PLL; elige el giro de U que la deja lista para empezar su algoritmo (el que elegiste en su ficha). Fíjate en los **faros**, los **bloques** y el lado completo.\n**Después:** adivina el AUF final antes de hacer el algoritmo, mirando los centros. Así encadenas sin pausas.',
      '**Before:** you get the PLL; pick the U turn that sets it up the way its algorithm starts (the one you chose on its page). Watch the **headlights**, the **blocks** and the solved side.\n**After:** guess the final AUF before doing the algorithm, looking at the centers. That way you flow without pauses.',
    ))),
    el('div', { className: 'trainer-options' }, modes, views, subsetSelect(SUBSET_KEY, subset, (id) => {
      subset = id;
      ask();
    })),
    stats, weak,
    prompt,
    el('div', { className: 'trainer-stage' }, question, answer),
    feedback,
    el('div', { className: 'trainer-buttons trainer-aufs', role: 'group', ariaLabel: loc(tr('Giro de U', 'U turn')) }, ...buttons),
    el('div', { className: 'row' }, next));
}

/** Leaving the page: a pending move to the next case. */
export function stopAufTrainer(): void {
  clearTimeout(timer);
}

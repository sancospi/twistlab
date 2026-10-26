// A guide page (the white cross, the 2x2's basics): intro (the cross: with the button that opens its trainer, a
// modal; then the solved cube beside its first line), then the lessons, each example with its figure, tappable moves
// and a 3D replay. view.ts adds the crumbs, the side navigation and the methods to learn next.
import type { KPuzzle } from 'cubing/kpuzzle';
import { prose, richText } from '../rich-text-view.ts';
import { algView } from '../notation-view.ts';
import { loc, t } from '../i18n.ts';
import { crossGuide, type CrossExample, type CrossLesson, type TextGuide } from './crossGuide.ts';
import type { Puzzle } from './types.ts';
import { openCrossTrainer, show3D } from './crossTrainer.ts';
import { CROSS_MASK, MASKS, stateSVG } from './cube.ts';
import { el } from '../el.ts';

/** The page's sections, each an `.academy-phase` with an id and an h2 (for the side navigation). */
export function guideSections(kpuzzle: KPuzzle, g: TextGuide = crossGuide, puzzle: Puzzle = '3x3x3'): HTMLElement[] {
  const anchor = (id: string) => `${g.id}-${id}`;
  const [first, ...rest] = richText(loc(g.intro), 'h3'); // one text, so each term is tappable once in the whole intro
  const intro = el('section', { className: 'academy-phase', id: anchor('intro') },
    el('h2', { className: 'page-title', textContent: loc(g.name) }),
    ...(g === crossGuide ? [trainerButton()] : []),
    // what the guide leaves done, drawn first (as a method phase's goal): the solved cube beside the intro's first line
    el('div', { className: 'phase-goal' }, el('div', { className: 'phase-goal-figure', ariaHidden: 'true', innerHTML: stateSVG('', puzzle, kpuzzle) }),
      el('div', { className: 'prose' }, first)),
    el('div', { className: 'prose' }, ...rest));
  return [intro, ...g.lessons.map((l) => lessonView(l, anchor(l.id), puzzle, kpuzzle))];
}

/** Opens the trainer (a modal): in the guide's intro and above its lessons. */
export const trainerButton = (): HTMLElement =>
  el('div', { className: 'row' }, el('button', { type: 'button', className: 'primary', textContent: t('cross.open'), onclick: () => void openCrossTrainer() }));

/** An example's state after its scramble (its caption describes it). */
const exampleFigure = (x: CrossExample, puzzle: Puzzle, kpuzzle: KPuzzle): HTMLElement =>
  el('div', { className: 'cross-figure', ariaHidden: 'true', innerHTML: stateSVG(x.setup, puzzle, kpuzzle) });

function lessonView(l: CrossLesson, id: string, puzzle: Puzzle, kpuzzle: KPuzzle): HTMLElement {
  return el('section', { className: 'academy-phase', id },
    el('h2', { textContent: loc(l.title) }),
    prose(loc(l.body), 'prose', 'h3'), // under the section's h2
    ...(l.examples ? [el('div', { className: 'cross-examples' }, ...l.examples.map((x) => el('div', { className: 'academy-group' },
      exampleFigure(x, puzzle, kpuzzle), // on top, as on the case cards
      el('p', {}, ...richText(loc(x.caption)).flatMap((n) => [...n.childNodes])), // inline format only
      el('dl', {},
        el('dt', { textContent: t('cross.setup') }), el('dd', {}, algView(x.setup)),
        el('dt', { textContent: t('cross.solution') }), el('dd', {}, algView(x.solution))),
      el('div', { className: 'row' }, el('button', {
        type: 'button', className: 'small', textContent: t('cross.watch'), ariaLabel: t('cross.watchOf', { alg: x.solution }),
        // the same pieces in color as its figure: the 3D shows the very state drawn above
        onclick: () => show3D(loc(l.title), x.setup, x.solution, puzzle, puzzle === '2x2x2' ? MASKS['2x2-first-layer'] : CROSS_MASK),
      })))))] : []),
    ...(l.tips ? [el('details', { className: 'academy-tips' }, el('summary', { textContent: t('academy.tips') }), prose(loc(l.tips), 'prose', 'h3'))] : []));
}

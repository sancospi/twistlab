// A guide page (the white cross, the 2x2's basics): intro (the cross: with the button that opens its trainer, a
// modal), then the lessons, each example with its figure, tappable moves and a 3D replay. view.ts adds the crumbs and
// the side navigation.
import type { KPuzzle } from 'cubing/kpuzzle';
import { prose, richText } from '../rich-text-view.ts';
import { algView } from '../notation-view.ts';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, centerMoves } from '../notation.ts';
import { loc, t } from '../i18n.ts';
import { crossGuide, type CrossExample, type CrossLesson, type TextGuide } from './crossGuide.ts';
import { caseDiagram, netSVG } from './diagram.ts';
import type { Puzzle } from './types.ts';
import { openCrossTrainer, show3D } from './crossTrainer.ts';
import { CROSS_MASK, MASKS } from './cube.ts';
import { el } from '../el.ts';

/** The page's sections, each an `.academy-phase` with an id and an h2 (for the side navigation). */
export function guideSections(kpuzzle: KPuzzle, g: TextGuide = crossGuide, puzzle: Puzzle = '3x3x3'): HTMLElement[] {
  const anchor = (id: string) => `${g.id}-${id}`;
  const intro = el('section', { className: 'academy-phase', id: anchor('intro') },
    el('h2', { textContent: loc(g.name) }),
    ...(g === crossGuide ? [trainerButton()] : []),
    prose(loc(g.intro), 'prose', 'h3'));
  return [intro, ...g.lessons.map((l) => lessonView(l, anchor(l.id), puzzle, kpuzzle))];
}

/** Opens the trainer (a modal): in the guide's intro and above its lessons. */
export const trainerButton = (): HTMLElement =>
  el('div', { className: 'row' }, el('button', { type: 'button', className: 'primary', textContent: t('cross.open'), onclick: () => void openCrossTrainer() }));

/** An example's state after its scramble: the 3x3 unfolded, with the cross's edges and the centers in color (they can be
 *  on any face); the 2x2 as the beginner's first layer, its corner at the front-right. The caption describes it. */
function exampleFigure(x: CrossExample, puzzle: Puzzle, kpuzzle: KPuzzle): HTMLElement {
  const facelets = patternToFacelets(kpuzzle.defaultPattern().applyAlg(centerMoves(x.setup, IDENTITY).join(' ')));
  const svg = puzzle === '2x2x2' ? caseDiagram('iso', '2x2-first-layer', facelets, { size: 84 }) : netSVG(facelets, { size: 168 }, 'cross');
  return el('div', { className: 'cross-figure', ariaHidden: 'true', innerHTML: svg });
}

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

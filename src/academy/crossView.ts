// A guide page (the white cross, the 2x2's basics): intro (the cross: with the button that opens its trainer, a
// modal), then the lessons, each example with tappable moves and a 3D replay. view.ts adds the crumbs and the side
// navigation.
import { prose, richText } from '../rich-text-view.ts';
import { algView } from '../notation-view.ts';
import { loc, t } from '../i18n.ts';
import { crossGuide, type CrossLesson, type TextGuide } from './crossGuide.ts';
import type { Puzzle } from './types.ts';
import { openCrossTrainer, show3D } from './crossTrainer.ts';
import { el } from './practice.ts';

/** The page's sections, each an `.academy-phase` with an id and an h2 (for the side navigation). */
export function guideSections(g: TextGuide = crossGuide, puzzle: Puzzle = '3x3x3'): HTMLElement[] {
  const anchor = (id: string) => `${g.id}-${id}`;
  const intro = el('section', { className: 'academy-phase', id: anchor('intro') },
    el('h2', { textContent: loc(g.name) }),
    ...(g === crossGuide ? [trainerButton()] : []),
    prose(loc(g.intro), 'prose', 'h3'));
  return [intro, ...g.lessons.map((l) => lessonView(l, anchor(l.id), puzzle))];
}

/** Opens the trainer (a modal): in the guide's intro and above its lessons. */
export const trainerButton = (): HTMLElement =>
  el('div', { className: 'row' }, el('button', { type: 'button', className: 'primary', textContent: t('cross.open'), onclick: () => void openCrossTrainer() }));

function lessonView(l: CrossLesson, id: string, puzzle: Puzzle): HTMLElement {
  return el('section', { className: 'academy-phase', id },
    el('h2', { textContent: loc(l.title) }),
    prose(loc(l.body), 'prose', 'h3'), // under the section's h2
    ...(l.examples ? [el('div', { className: 'cross-examples' }, ...l.examples.map((x) => el('div', { className: 'academy-group' },
      el('p', {}, ...richText(loc(x.caption)).flatMap((n) => [...n.childNodes])), // inline format only
      el('dl', {},
        el('dt', { textContent: t('cross.setup') }), el('dd', {}, algView(x.setup)),
        el('dt', { textContent: t('cross.solution') }), el('dd', {}, algView(x.solution))),
      el('div', { className: 'row' }, el('button', {
        type: 'button', className: 'small', textContent: t('cross.watch'), ariaLabel: t('cross.watchOf', { alg: x.solution }),
        onclick: () => show3D(loc(l.title), x.setup, x.solution, puzzle),
      })))))] : []));
}

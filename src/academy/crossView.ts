// The white-cross guide page: intro with the button that opens the trainer (a modal), then the lessons, each
// example with tappable moves and a 3D replay. view.ts adds the crumbs and the side navigation.
import { prose, richText } from '../rich-text-view.ts';
import { algView } from '../notation-view.ts';
import { loc, t } from '../i18n.ts';
import { crossGuide, type CrossLesson } from './crossGuide.ts';
import { openCrossTrainer, show3D } from './crossTrainer.ts';
import { el } from './practice.ts';

export const crossAnchor = (id: string) => `cruz-${id}`;

/** The page's sections, each an `.academy-phase` with an id and an h2 (for the side navigation). */
export function crossSections(): HTMLElement[] {
  const intro = el('section', { className: 'academy-phase', id: crossAnchor('intro') },
    el('h2', { textContent: loc(crossGuide.name) }),
    trainerButton(),
    prose(loc(crossGuide.intro)));
  return [intro, ...crossGuide.lessons.map(lessonView)];
}

/** Opens the trainer (a modal): in the guide's intro and above its lessons. */
export const trainerButton = (): HTMLElement =>
  el('div', { className: 'row' }, el('button', { type: 'button', className: 'primary', textContent: t('cross.open'), onclick: () => void openCrossTrainer() }));

function lessonView(l: CrossLesson): HTMLElement {
  return el('section', { className: 'academy-phase', id: crossAnchor(l.id) },
    el('h2', { textContent: loc(l.title) }),
    prose(loc(l.body)),
    ...(l.examples ? [el('div', { className: 'cross-examples' }, ...l.examples.map((x) => el('div', { className: 'academy-group' },
      el('p', {}, ...richText(loc(x.caption)).flatMap((n) => [...n.childNodes])), // inline format only
      el('dl', {},
        el('dt', { textContent: t('cross.setup') }), el('dd', {}, algView(x.setup)),
        el('dt', { textContent: t('cross.solution') }), el('dd', {}, algView(x.solution))),
      el('div', { className: 'row' }, el('button', {
        type: 'button', className: 'small', textContent: t('cross.watch'), ariaLabel: t('cross.watchOf', { alg: x.solution }),
        onclick: () => show3D(loc(l.title), x.setup, x.solution),
      })))))] : []));
}

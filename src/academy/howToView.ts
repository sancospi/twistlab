// The article "Cómo resolver el cubo de Rubik paso a paso" (howToSolve.ts) in the app: a section per step, each with its
// case's diagram and the link to where the Academia teaches it. view.ts adds the crumbs and the side navigation.
import type { KPuzzle } from 'cubing/kpuzzle';
import { prose } from '../rich-text-view.ts';
import { loc } from '../i18n.ts';
import { el } from '../el.ts';
import { figureSvg, howToSolve } from './howToSolve.ts';

/** The page's sections, each an `.academy-phase` with an id and an h2 (for the side navigation). */
export const howToSections = (kpuzzle: KPuzzle): HTMLElement[] => howToSolve.sections.map((s) => {
  const figure = s.figure ? figureSvg(kpuzzle, s.figure) : null;
  return el('section', { className: 'academy-phase', id: `como-${s.id}` },
    el('h2', { textContent: loc(s.title) }),
    ...(figure ? [el('figure', { className: 'howto-figure', innerHTML: figure.svg }, el('figcaption', { className: 'hint', textContent: figure.caption }))] : []),
    prose(loc(s.body), 'prose', 'h3'),
    ...(s.more ?? []).map((m) => el('p', {}, el('a', { href: m.href, textContent: `${loc(m.label)} →` }))));
});

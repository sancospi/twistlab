// "En tu cubo" (Cubo screen, with a smart cube): the case on the cube now (inspect.ts), redrawn on every move, with the
// algorithm the user plays for it (as in the Academia: yellow up, green front) and a link to its page.
import type { KPattern } from 'cubing/kpuzzle';
import { loc, t } from '../i18n.ts';
import { el } from '../el.ts';
import { algView } from '../notation-view.ts';
import { routePath } from '../router.ts';
import { cfopFull } from './cfopFull.ts';
import { inspect } from './inspect.ts';
import { preferred } from './store.ts';
import type { Case } from './types.ts';

const caseLink = (c: Case) => el('a', { href: routePath({ mod: 'academy', page: { kind: 'case', method: cfopFull.id, id: c.id } }), textContent: loc(c.name) });
const moves = (tokens: string[]) => algView(tokens, { frame: 'yellow-up' });
const hint = (key: 'inspect.cross' | 'inspect.stuck' | 'cube.solved') => el('p', { className: 'hint', textContent: t(key) });

/** `p`: the cube's state (cube frame). */
export function inspectView(p: KPattern): Node[] {
  const r = inspect(p, (c) => preferred(c).alg);
  if (r.kind === 'solved') return [hint('cube.solved')];
  if (r.kind === 'cross') return [hint('inspect.cross')];
  if (r.kind === 'll') return [el('p', {}, caseLink(r.c), ' · ', moves(r.moves))];
  if (r.kind === 'auf') return [el('p', {}, `${t('inspect.auf')} `, moves(r.moves))];
  if (!r.pairs.length) return [hint('inspect.stuck')]; // the pairs left have a piece in another slot
  return [el('ul', { className: 'inspect-pairs' }, ...r.pairs.map((x) => el('li', {},
    el('strong', { textContent: t('inspect.pair', { a: t(`paint.color.${x.colors[0]}`), b: t(`paint.color.${x.colors[1]}`) }) }), ' · ', caseLink(x.c), ' ',
    moves(x.moves))))];
}

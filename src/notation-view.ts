// Reusable notation: an algorithm as tappable moves. Each move opens a tooltip with a small 3D cube doing that
// move in a loop (camera on the turning layer) and a short caption: what turns and which way.
import type { TwistyPlayer } from 'cubing/twisty';
import { CAMERA, algParts, explainMove, partSize, passAt, tokenize, type AlgPart, type Face } from './notation.ts';
import { showTip } from './tooltip.ts';
import { t } from './i18n.ts';

/** How the algorithm is held: the plan's yellow up (academy, guide) or WCA's white up (scrambles). */
export type NotationFrame = 'yellow-up' | 'white-up';

export interface AlgViewOptions {
  frame?: NotationFrame;
  mark?: (i: number) => string; // a class per move, e.g. 'bad': every turn shown, none grouped
  at?: number; // followed on a cube: the move at this index is next (current), the ones before it done
}

/** The line under a scramble: from solved, which colors go up and in front (faces as the colors of the user frame). */
export function scrambleNote(up: Face = 'U', front: Face = 'F'): HTMLElement {
  const out = document.createElement('p');
  out.className = 'hint scramble-note';
  out.textContent = t('scramble.note', { up: t(`paint.color.${up}`), front: t(`paint.color.${front}`) });
  return out;
}

/** The algorithm as a row of move buttons; text that isn't valid notation is shown as is. Repeated blocks show as
 *  (block)×n, except with `mark` (each turn its own class); followed (`at`), as the algorithm picker writes it. */
export function algView(alg: string | string[], opts: AlgViewOptions = {}): HTMLElement {
  const out = document.createElement('span');
  out.className = 'alg';
  let tokens: string[];
  try {
    tokens = typeof alg === 'string' ? tokenize(alg) : alg.map((m) => tokenize(m)[0]);
  } catch {
    out.textContent = typeof alg === 'string' ? alg : alg.join(' ');
    return out;
  }
  const at = opts.at ?? -1;
  const button = (token: string, i: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = ['move', opts.mark?.(i) ?? (i < at ? 'done' : i === at ? 'current' : '')].join(' ').trim();
    b.textContent = token;
    const { what, how } = explainMove(token);
    b.setAttribute('aria-label', t('notation.tip', { move: token, what, how }));
    b.setAttribute('aria-expanded', 'false');
    b.onclick = (e) => {
      e.stopPropagation(); // a move inside a clickable row shouldn't also trigger the row
      showMove(b, token, opts.frame ?? 'yellow-up');
    };
    return b;
  };
  // real spaces between moves (readable when copied), none at the end: inline in a sentence it would sit before the punctuation
  if (opts.mark) tokens.forEach((token, i) => out.append(...(i ? [' '] : []), button(token, i)));
  else out.append(...grouped(tokens, button, at));
  return out;
}

const SHORT_TRIGGER = 4; // moves: a trigger this long keeps to one line

/** Moves with common triggers in parentheses and repeated blocks as (block)×n, nested: ((R' D' R D)×2 U)×2. Each
 *  parenthesis stays on the line of the move next to it (`pre` / `post`: the ones opening before the first move and
 *  closing after the last), never alone at the start or end of a line; a short trigger (R U R' U') stays whole (a Sune
 *  may not fit a narrow line in big text). Followed (`at`), a block's moves are those of the pass under way, which
 *  shows after its ×n (2/3). `button`: the move with its index in `tokens`. */
function grouped(tokens: string[], button: (token: string, i: number) => HTMLElement, at = -1): (Node | string)[] {
  type Glue = (Node | string)[];
  const moves = (tokens: string[], from: number, pre: Glue, post: Glue) => tokens.flatMap((token, j) => {
    const b = button(token, from + j);
    const open = j === 0 ? pre : [], close = j === tokens.length - 1 ? post : [];
    const node = open.length || close.length ? Object.assign(document.createElement('span'), { className: 'nowrap' }) : b;
    if (node !== b) node.append(...open, b, ...close);
    return j ? [' ', node] : [node];
  });
  const render = (parts: AlgPart[], from: number, pre: Glue = [], post: Glue = []): (Node | string)[] => parts.flatMap((p, i) => {
    const start = from;
    from += partSize(p);
    const sep = i ? [' '] : [];
    const open = i === 0 ? pre : [], close = i === parts.length - 1 ? post : [];
    if (p.kind === 'moves') return [...sep, ...moves(p.tokens, start, open, close)];
    const group = Object.assign(document.createElement('span'), { className: p.kind === 'trigger' ? 'alg-trigger' : 'repeat' }); // not .trigger: case pages use it
    if (p.kind === 'trigger' && p.tokens.length <= SHORT_TRIGGER) group.classList.add('nowrap');
    if (p.kind === 'trigger') group.append(...moves(p.tokens, start, [...open, '('], [')', ...close]));
    else {
      const pass = passAt(p, start, at);
      const under = at >= start && at < from ? [' ', passView(pass + 1, p.times)] : []; // a real space: ×2 1/2 when copied
      group.append(...render(p.parts, start + pass * (partSize(p) / p.times), [...open, '('], [`)×${p.times}`, ...under, ...close]));
    }
    return [...sep, group];
  });
  return render(algParts(tokens), 0);
}

/** The pass of a repeated block under way, after its ×n: 2/3. */
const passView = (n: number, times: number) =>
  Object.assign(document.createElement('span'), { className: 'pass', role: 'img', ariaLabel: t('notation.pass', { n, times }), textContent: `${n}/${times}` });

// One looping player and one caption for every tooltip, built once and never re-attached (see tooltip.ts):
// browsers allow only a few WebGL contexts, and a re-attached player stacks a new view.
let player: TwistyPlayer | null = null;
let caption: HTMLElement | null = null;
let loop = 0;
let first = 0; // the first replay, slightly delayed

let shownPuzzle = '3x3x3';

/** The tooltip's cube is the page's: a container marks a 2x2 with data-puzzle="2x2x2" (academy pages, dialogs). */
function showMove(anchor: HTMLElement, token: string, frame: NotationFrame) {
  // cubing/twisty on the first tap: the Resolver shows its scramble (moves are tappable) before loading it
  if (!player) return void import('cubing/twisty').then(({ TwistyPlayer }) => {
    player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'none', hintFacelets: 'none', experimentalDragInput: 'none', tempoScale: 1.2 });
    showMove(anchor, token, frame);
  });
  const p = player;
  const puzzle = anchor.closest<HTMLElement>('[data-puzzle]')?.dataset.puzzle === '2x2x2' ? '2x2x2' : '3x3x3';
  if (puzzle !== shownPuzzle) p.puzzle = shownPuzzle = puzzle; // setting it reloads the model: only on a change
  const { what, how } = explainMove(token);
  p.experimentalSetupAlg = frame === 'yellow-up' ? 'z2' : '';
  p.alg = token;
  p.cameraLatitude = CAMERA.latitude;
  p.cameraLongitude = CAMERA.longitude;
  caption ??= Object.assign(document.createElement('div'), { className: 'tip-text' });
  caption.replaceChildren(Object.assign(document.createElement('strong'), { textContent: token }),
    Object.assign(document.createElement('span'), { textContent: what }),
    Object.assign(document.createElement('span'), { textContent: how }));
  const stop = () => {
    clearTimeout(first);
    clearInterval(loop);
  };
  stop();
  const shown = showTip(anchor, [p, caption], () => {
    stop();
    p.pause();
  });
  if (!shown) return; // that tap closed it
  const replay = () => {
    p.jumpToStart();
    p.play();
  };
  first = window.setTimeout(replay, 250); // let it show the start first
  loop = window.setInterval(replay, token.includes('2') ? 2300 : 1800);
}

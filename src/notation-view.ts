// Reusable notation: an algorithm as tappable moves. Each move opens a tooltip with a small 3D cube doing that
// move in a loop (camera on the turning layer) and a short caption: what turns and which way.
import type { TwistyPlayer } from 'cubing/twisty';
import { CAMERA, algParts, explainMove, tokenize, type AlgPart } from './notation.ts';
import { showTip } from './tooltip.ts';
import { t, type MessageKey } from './i18n.ts';

/** How the algorithm is held: the plan's yellow up (academy, guide) or WCA's white up (scrambles). */
export type NotationFrame = 'yellow-up' | 'white-up';

export interface AlgViewOptions {
  frame?: NotationFrame;
  mark?: (i: number) => string; // a class per move, e.g. 'done' / 'current'
}

/** The algorithm as a row of move buttons; text that isn't valid notation is shown as is. Repeated blocks show as
 *  (block)×n, except with `mark`: following move by move needs every turn. */
/** The line under a scramble: from solved, which colors go up and in front (faces as the colors of the user frame). */
export function scrambleNote(up = 'U', front = 'F'): HTMLElement {
  const out = document.createElement('p');
  out.className = 'hint scramble-note';
  out.textContent = t('scramble.note', { up: t(`paint.color.${up}` as MessageKey), front: t(`paint.color.${front}` as MessageKey) });
  return out;
}

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
  const button = (token: string, i: number) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = ['move', opts.mark?.(i) ?? ''].join(' ').trim();
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
  else out.append(...grouped(tokens, (token) => button(token, 0)));
  return out;
}

/** Moves with common triggers in parentheses and repeated blocks as (block)×n, nested: ((R' D' R D)×2 U)×2. */
function grouped(tokens: string[], button: (token: string) => HTMLElement): (Node | string)[] {
  const render = (parts: AlgPart[]): (Node | string)[] => parts.flatMap((p, i) => {
    const sep = i ? [' '] : [];
    const moves = (tokens: string[]) => tokens.flatMap((token, j) => (j ? [' ', button(token)] : [button(token)]));
    if (p.kind === 'moves') return [...sep, ...moves(p.tokens)];
    const group = Object.assign(document.createElement('span'), { className: p.kind === 'trigger' ? 'alg-trigger' : 'repeat' }); // not .trigger: case pages use it
    if (p.kind === 'trigger') group.append('(', ...moves(p.tokens), ')');
    else group.append('(', ...render(p.parts), `)×${p.times}`);
    return [...sep, group];
  });
  return render(algParts(tokens));
}

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

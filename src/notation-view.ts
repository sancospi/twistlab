// Reusable notation: an algorithm as tappable moves. Each move opens a tooltip with a small 3D cube doing that
// move in a loop (camera on the turning layer) and a short caption: what turns and which way.
import { TwistyPlayer } from 'cubing/twisty';
import { explainMove, moveCamera, repeats, tokenize } from './notation.ts';
import { showTip } from './tooltip.ts';
import { t } from './i18n.ts';

/** How the algorithm is held: the plan's yellow up (academy, guide) or WCA's white up (scrambles). */
export type NotationFrame = 'yellow-up' | 'white-up';

export interface AlgViewOptions {
  frame?: NotationFrame;
  mark?: (i: number) => string; // a class per move, e.g. 'done' / 'current'
}

/** The algorithm as a row of move buttons; text that isn't valid notation is shown as is. Repeated blocks show as
 *  (block)×n, except with `mark`: following move by move needs every turn. */
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
  if (opts.mark) tokens.forEach((token, i) => out.append(button(token, i), ' ')); // a real space: readable when copied
  else out.append(...grouped(tokens, (token) => button(token, 0)));
  return out;
}

/** Moves with repeated blocks as (block)×n, nested when a block repeats inside: ((R' D' R D)×2 U)×2. */
function grouped(tokens: string[], button: (token: string) => HTMLElement): (Node | string)[] {
  return repeats(tokens).flatMap((run, i) => {
    const sep = i ? [' '] : [];
    if (run.times === 1) return [...sep, ...run.tokens.flatMap((token, j) => (j ? [' ', button(token)] : [button(token)]))];
    const group = Object.assign(document.createElement('span'), { className: 'repeat' });
    group.append('(', ...grouped(run.tokens, button), `)×${run.times}`);
    return [...sep, group];
  });
}

// One looping player and one caption for every tooltip, built once and never re-attached (see tooltip.ts):
// browsers allow only a few WebGL contexts, and a re-attached player stacks a new view.
let player: TwistyPlayer | null = null;
let caption: HTMLElement | null = null;
let loop = 0;
let first = 0; // the first replay, slightly delayed

function showMove(anchor: HTMLElement, token: string, frame: NotationFrame) {
  player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'none', hintFacelets: 'none', experimentalDragInput: 'none', tempoScale: 1.2 });
  const p = player;
  const { what, how } = explainMove(token);
  const cam = moveCamera(token);
  p.experimentalSetupAlg = frame === 'yellow-up' ? 'z2' : '';
  p.alg = token;
  p.cameraLatitude = cam.latitude;
  p.cameraLongitude = cam.longitude;
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

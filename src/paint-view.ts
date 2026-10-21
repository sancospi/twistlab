// "Pinta tu cubo" (/cubo/pintar): paint your cube on its net, check it (paint.ts), solve it and follow the solution
// move by move on a 3D cube, yellow up. The markup is in index.html (#mod-paint); this fills and drives it.
import { TwistyPlayer } from 'cubing/twisty';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { faceletsToPattern, SOLVED_FACELETS } from './facelets.ts';
import { COLORS } from './academy/diagram.ts';
import { el } from './academy/practice.ts';
import { save, setting } from './academy/store.ts';
import { describe } from './guide.ts';
import { lang, t, tp, type MessageKey } from './i18n.ts';
import { algView } from './notation-view.ts';
import { invertTokens } from './notation.ts';
import { BLANK, CENTERS, EMPTY, isPainting, NET_AT, neighbour, validate, type Problem } from './paint.ts';

const $ = (id: string) => document.getElementById(id)!;
const btn = (id: string) => $(id) as HTMLButtonElement;
const KEY = 'paint-facelets'; // the painting survives a reload: painting 48 stickers takes a while
const PALETTE = ['U', 'D', 'F', 'B', 'R', 'L']; // keys 1–6: yellow, white, green, blue, orange, red
const FACES = 'URFDLB';

let facelets = setting(KEY, EMPTY, isPainting);
let colour = PALETTE[0];
let focused = 0; // the sticker Tab lands on (one tab stop for the net; arrows move inside)
let bad = new Set<number>(); // stickers of impossible pieces, outlined until the next change
const stickers: HTMLButtonElement[] = [];
const swatches: HTMLButtonElement[] = [];
let solveId = 0;

const colourName = (c: string) => t(c === BLANK ? 'paint.color.blank' : (`paint.color.${c}` as MessageKey));

export function showPaint(): void {
  if (!stickers.length) build();
  render();
}

function build() {
  $('paint-palette').append(...PALETTE.map((c, n) => {
    const swatch = el('span', { className: 'paint-swatch' });
    swatch.style.background = COLORS[c];
    const b = el('button', { type: 'button', onclick: () => ((colour = c), render()) }, swatch, `${n + 1} ${colourName(c)}`);
    swatches.push(b);
    return b;
  }));
  $('paint-net').append(...NET_AT.map(([col, row], face) => {
    const block = el('div', { className: 'paint-face' });
    block.style.gridArea = `${row + 1} / ${col + 1}`;
    for (let k = 0; k < 9; k++) {
      const i = face * 9 + k;
      stickers[i] = el('button', { type: 'button', className: 'paint-sticker', onclick: () => paint(i, colour), onfocus: () => ((focused = i), render()) });
      block.append(stickers[i]);
    }
    return block;
  }));
  $('paint-net').addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[e.key];
    const pick = PALETTE[Number(e.key) - 1];
    if (dir) stickers[neighbour(focused, ...dir)].focus();
    else if (pick) ((colour = pick), paint(focused, pick), render());
    else return;
    e.preventDefault();
  });
  btn('paint-reset').onclick = () => setFacelets(SOLVED_FACELETS);
  btn('paint-clear').onclick = () => setFacelets(EMPTY);
  btn('paint-solve').onclick = () => void solve();
  btn('paint-prev').onclick = prev;
  btn('paint-next').onclick = next;
  btn('paint-all').onclick = playAll;
}

function paint(i: number, c: string) {
  if (CENTERS.includes(i)) return; // centres are fixed: they say which face is which
  setFacelets(facelets.slice(0, i) + c + facelets.slice(i + 1));
}

/** Any change: remembered, and what was said about the old painting (problems, solution) no longer applies. */
function setFacelets(f: string) {
  facelets = f;
  save(KEY, f);
  bad = new Set();
  solveId++;
  btn('paint-solve').disabled = false;
  $('paint-status').replaceChildren();
  $('paint-solution').hidden = true;
  render();
}

function render() {
  stickers.forEach((b, i) => {
    const c = facelets[i];
    const face = FACES[Math.floor(i / 9)];
    const k = i % 9;
    b.style.background = c === BLANK ? '' : COLORS[c];
    b.classList.toggle('blank', c === BLANK);
    b.classList.toggle('bad', bad.has(i));
    b.tabIndex = i === focused ? 0 : -1;
    if (CENTERS.includes(i)) b.ariaDisabled = 'true';
    b.ariaLabel = t(CENTERS.includes(i) ? 'paint.center' : 'paint.sticker',
      { face: t(`paint.face.${face}` as MessageKey), row: Math.floor(k / 3) + 1, col: (k % 3) + 1, color: colourName(c) }) + (bad.has(i) ? t('paint.check') : '');
  });
  swatches.forEach((b, n) => (b.ariaPressed = String(PALETTE[n] === colour)));
}

// --- Checking and solving ---

const list = (items: string[]) => new Intl.ListFormat(lang, { type: 'conjunction' }).format(items);

function problemText(p: Problem): string {
  if (p.kind === 'blank') return tp('paint.blank', p.n);
  if (p.kind === 'count') return t('paint.count', { color: colourName(p.face), n: p.n });
  if (p.kind === 'piece' || p.kind === 'repeated') {
    const piece = p.kind === 'repeated' ? p.stickers.slice(p.stickers.length / 2) : p.stickers; // repeated: both slots, the same colours
    return t(`paint.${p.kind}`, { colors: list(piece.map((i) => colourName(facelets[i]))) });
  }
  return t(`paint.${p.kind}`);
}

function status(text: string, items: string[] = []) {
  $('paint-status').replaceChildren(el('p', { textContent: text }), ...(items.length ? [el('ul', {}, ...items.map((s) => el('li', { textContent: s })))] : []));
}

async function solve() {
  const problems = validate(facelets);
  bad = new Set(problems.flatMap((p) => ('stickers' in p ? p.stickers : [])));
  render();
  if (problems.length) return status(t('paint.invalid'), problems.map(problemText));
  if (facelets === SOLVED_FACELETS) return status(t('paint.alreadySolved'));
  const id = ++solveId;
  btn('paint-solve').disabled = true;
  status(t('paint.solving'));
  try {
    // user frame in, user frame out: the letters are the faces as you hold the cube (yellow up)
    const alg = await experimentalSolve3x3x3IgnoringCenters(await faceletsToPattern(facelets));
    if (id !== solveId) return; // repainted meanwhile
    $('paint-status').replaceChildren();
    showSolution(alg.toString().replace(/2'/g, '2').split(' ').filter(Boolean)); // a half turn has no direction
  } catch {
    if (id === solveId) status(t('paint.error'));
  } finally {
    if (id === solveId) btn('paint-solve').disabled = false;
  }
}

// --- The solution, move by move on a 3D cube ---

let player: TwistyPlayer | null = null;
let solution: string[] = [];
let done = 0; // moves done so far
let playingAll = false; // "Ver todo": the player has the whole solution and the marks follow its animation

function showSolution(moves: string[]) {
  solution = moves;
  done = 0;
  playingAll = false;
  $('paint-solution').hidden = false; // before the player: a 3D view set up at zero size stays blank
  if (!player) {
    player = new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'none', experimentalSetupAnchor: 'start' });
    $('paint-player').append(player);
    player.experimentalModel.currentMoveInfo.addFreshListener((info) => {
      if (playingAll && done < solution.length && info.patternIndex !== done) ((done = info.patternIndex), renderSolution());
    });
    // the indexer never reports patternIndex n at the end of the timeline: the last move stays "finishing"
    player.experimentalModel.coarseTimelineInfo.addFreshListener((c) => {
      if (playingAll && c.atEnd && done < solution.length) ((done = solution.length), renderSolution());
    });
  }
  player.experimentalSetupAlg = ['z2', ...invertTokens(moves)].join(' '); // the painted state, yellow up
  player.alg = '';
  renderSolution();
  $('paint-solution-title').focus(); // also brings it into view on phones, below the net
}

/** Back from "Ver todo" to one move at a time: the player holds just the moves done. */
function stepMode() {
  if (!playingAll) return;
  playingAll = false;
  player!.pause();
  player!.alg = solution.slice(0, done).join(' ');
  player!.jumpToEnd();
}

function next() {
  stepMode();
  if (done >= solution.length) return;
  player!.experimentalAddMove(solution[done++], { cancel: false });
  renderSolution();
}

function prev() {
  stepMode();
  if (!done) return;
  player!.experimentalAddMove(invertTokens([solution[--done]])[0], { cancel: true });
  renderSolution();
}

function playAll() {
  playingAll = true;
  done = 0;
  player!.alg = solution.join(' ');
  player!.jumpToStart();
  player!.play();
  renderSolution();
}

function renderSolution() {
  const n = solution.length;
  const move = solution[done];
  $('paint-note').textContent = tp('paint.solverNote', n);
  $('paint-progress').textContent = move ? t('guide.progress', { n: done + 1, total: n }) : '';
  $('paint-move').textContent = move ?? '';
  $('paint-desc').textContent = move ? describe(move) : t('cube.solved');
  $('paint-steps').replaceChildren(algView(solution, { mark: (i) => (i < done ? 'done' : i === done ? 'current' : '') }));
  $('paint-live').ariaLive = playingAll ? 'off' : 'polite'; // not one announcement per animated move
  btn('paint-prev').disabled = !done;
  btn('paint-next').disabled = done >= n;
}

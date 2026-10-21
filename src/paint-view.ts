// "Pinta tu cubo" (/cubo/pintar): paint your cube on its net, check it (paint.ts), solve it and follow the solution
// move by move on a 3D cube, yellow up, or step by step with the beginner's method (beginnerSolve.ts).
// The markup is in index.html (#mod-paint); this fills and drives it.
import { TwistyPlayer } from 'cubing/twisty';
import type { KPattern } from 'cubing/kpuzzle';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { faceletsToPattern, SOLVED_FACELETS } from './facelets.ts';
import { beginner } from './academy/beginner.ts';
import { COLORS } from './academy/diagram.ts';
import { findCase } from './academy/methods.ts';
import { el } from './academy/practice.ts';
import { save, setting } from './academy/store.ts';
import { describe } from './guide.ts';
import { BSTAGES, beginnerSolve, stepTokens, stepView, type BStep } from './beginnerSolve.ts';
import { lang, loc, t, tp, type MessageKey } from './i18n.ts';
import { algView } from './notation-view.ts';
import { invertTokens } from './notation.ts';
import { BLANK, CENTERS, EMPTY, isPainting, NET_AT, neighbour, validate, type Problem } from './paint.ts';
import { routePath } from './router.ts';

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
  btn('paint-prev').onclick = () => (mode === 'guided' ? prevStep() : prev());
  btn('paint-next').onclick = () => (mode === 'guided' ? nextStep() : next());
  btn('paint-all').onclick = playAll;
  btn('paint-mode-short').onclick = () => ((mode = 'short'), showMode());
  btn('paint-mode-guided').onclick = () => ((mode = 'guided'), showMode());
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
    const pattern = await faceletsToPattern(facelets);
    const alg = await experimentalSolve3x3x3IgnoringCenters(pattern);
    if (id !== solveId) return; // repainted meanwhile
    $('paint-status').replaceChildren();
    painted = pattern;
    guided = null;
    shortest = alg.toString().replace(/2'/g, '2').split(' ').filter(Boolean); // a half turn has no direction
    showMode();
    $('paint-solution-title').focus(); // also brings it into view on phones, below the net
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
let painted: KPattern | null = null; // the painting solved, user frame
let shortest: string[] = [];
let guided: BStep[] | null = null; // computed when first asked for
let mode: 'short' | 'guided' = 'short';

function ensurePlayer(): TwistyPlayer {
  $('paint-solution').hidden = false; // before the player: a 3D view set up at zero size stays blank
  if (!player) {
    player = new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'none', experimentalSetupAnchor: 'start' });
    $('paint-player').append(player);
    player.experimentalModel.currentMoveInfo.addFreshListener((info) => {
      if (mode === 'guided') return void (playing >= 0 && info.patternIndex !== movePos && ((movePos = info.patternIndex), renderSteps()));
      if (playingAll && done < solution.length && info.patternIndex !== done) ((done = info.patternIndex), renderSolution());
    });
    // the indexer never reports patternIndex n at the end of the timeline: the last move stays "finishing"
    player.experimentalModel.coarseTimelineInfo.addFreshListener((c) => {
      if (mode === 'guided') return void (playing >= 0 && c.atEnd && ((playing = -1), renderGuided()));
      if (playingAll && c.atEnd && done < solution.length) ((done = solution.length), renderSolution());
    });
  }
  return player;
}

/** The chosen solution: the shortest, move by move, or the beginner's method, step by step. */
function showMode() {
  playing = -1;
  player?.pause();
  btn('paint-mode-short').ariaPressed = String(mode === 'short');
  btn('paint-mode-guided').ariaPressed = String(mode === 'guided');
  const learn = $('paint-learn') as HTMLAnchorElement;
  learn.href = mode === 'guided' ? routePath({ mod: 'academy', page: { kind: 'method', id: beginner.id } }) : '/academia';
  learn.textContent = t(mode === 'guided' ? 'bsolve.learn' : 'paint.learn');
  btn('paint-prev').textContent = t(mode === 'guided' ? 'bsolve.prev' : 'paint.prev');
  btn('paint-next').textContent = t(mode === 'guided' ? 'bsolve.next' : 'paint.next');
  btn('paint-all').hidden = mode === 'guided';
  if (mode === 'short') return showSolution(shortest);
  try {
    guided ??= beginnerSolve(painted!); // ponytail: synchronous; the first time it also builds cross.ts's table (a fraction of a second)
  } catch {
    mode = 'short';
    status(t('paint.error'));
    return showMode();
  }
  showGuided();
}

function showSolution(moves: string[]) {
  solution = moves;
  done = 0;
  playingAll = false;
  const p = ensurePlayer();
  p.experimentalSetupAlg = ['z2', ...invertTokens(moves)].join(' '); // the painted state, yellow up
  p.alg = '';
  renderSolution();
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

// --- Guided: the beginner's method, one step (a case's algorithm) at a time ---

let at = 0; // steps done
let playing = -1; // the step being animated, -1 none
let movePos = 0; // its move on screen

/** Setup of the player at step i: solved yellow up, the solution's rotations (the hold it ends in), the whole solution
 *  undone (the painted state, held as painted) and the steps before i. */
function before(i: number): string {
  const all = guided!.flatMap(stepTokens);
  return ['z2', ...all.filter((m) => /^[xyz]/.test(m)), ...invertTokens(all), ...guided!.slice(0, i).flatMap(stepTokens)].join(' ');
}

function showGuided() {
  at = 0;
  const p = ensurePlayer();
  p.experimentalSetupAlg = before(0);
  p.alg = '';
  renderGuided();
}

function nextStep() {
  if (at >= guided!.length) return;
  const p = player!;
  p.experimentalSetupAlg = before(at); // the state on screen already: no jump, even mid-animation of the step before
  p.alg = stepTokens(guided![at]).join(' ');
  p.jumpToStart();
  p.play();
  playing = at++;
  movePos = 0;
  renderGuided();
}

function prevStep() {
  if (!at) return;
  playing = -1;
  player!.pause();
  player!.experimentalSetupAlg = before(--at);
  player!.alg = '';
  renderGuided();
}

const SIDE_ORDER = 'DUFBRL'; // white or yellow first, then green or blue: "blanco-verde-naranja"
function pieceNames(slots: string[]): string {
  const s = list(slots.map((slot) => t(slot.length === 3 ? 'bsolve.corner' : 'bsolve.edge',
    { colors: [...slot].sort((a, b) => SIDE_ORDER.indexOf(a) - SIDE_ORDER.indexOf(b)).map(colourName).join('-') })));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** What a step does: the piece and the case (linked to its page). */
function explain(s: BStep): (Node | string)[] {
  if (s.kind === 'cross') return [t('bsolve.cross', { n: s.alg.length }), ' ', el('a', { href: routePath({ mod: 'academy', page: { kind: 'cross' } }), textContent: t('bsolve.crossLink') })];
  if (s.kind === 'auf') return [t('bsolve.auf')];
  const c = findCase(s.caseId!)!;
  const link = el('a', { href: routePath({ mod: 'academy', page: { kind: 'case', method: beginner.id, id: c.id } }), textContent: loc(c.name) });
  const piece = pieceNames(s.pieces);
  if (!piece) return [link];
  return s.kind === 'out' ? [t('bsolve.out', { piece }), ' ', link] : [`${piece}: `, link];
}

function renderGuided() {
  const steps = guided!;
  const cur = playing >= 0 ? playing : at; // the step being played, or the next one
  const s = steps[cur];
  $('paint-note').textContent = tp('bsolve.note', steps.length);
  $('paint-progress').textContent = s ? t('bsolve.progress', { n: cur + 1, total: steps.length, stage: t(`bsolve.stage.${s.stage}` as MessageKey) }) : '';
  $('paint-move').textContent = '';
  $('paint-desc').replaceChildren(...(s ? explain(s) : [t('cube.solved')]));
  $('paint-live').ariaLive = 'polite';
  btn('paint-prev').disabled = !at;
  btn('paint-next').disabled = at >= steps.length;
  renderSteps();
}

/** The steps grouped by stage, numbered as in "Paso n de total"; the move being played marked. Outside the live region:
 *  it changes with every animated move. */
function renderSteps() {
  const steps = guided!;
  const cur = playing >= 0 ? playing : at;
  const item = (s: BStep, i: number) => {
    const state = (j: number) => (i === playing ? (j < movePos ? 'done' : j === movePos ? 'current' : '') : i < at ? 'done' : '');
    const v = stepView(s);
    const li = el('li', { className: i < at && i !== playing ? 'done' : '' }, el('p', {}, ...explain(s)),
      algView(v.tokens, { mark: (j) => `${j < v.setup ? 'setup ' : ''}${state(j)}`.trim() }));
    if (i === cur) li.setAttribute('aria-current', 'step');
    return li;
  };
  $('paint-steps').replaceChildren(...BSTAGES.flatMap((stage) => {
    const mine = steps.flatMap((s, i) => (s.stage === stage ? [i] : []));
    if (!mine.length) return [];
    const doneHere = mine.filter((i) => i < at && i !== playing).length;
    return [el('section', { className: 'bsolve-stage' },
      el('h4', {}, t(`bsolve.stage.${stage}` as MessageKey), ' ', el('span', { className: 'hint', textContent: t('bsolve.stageProgress', { n: doneHere, total: mine.length }) })),
      el('ol', { start: mine[0] + 1 }, ...mine.map((i) => item(steps[i], i))))];
  }));
}

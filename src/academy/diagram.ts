// Case diagrams as SVG strings: isometric (F2L) and top view (OLL/PLL), like the plan's figures.
// Input is a 54-char Kociemba string in the USER frame (yellow up, green front), so letters are user faces.
import { isRoux, puzzleOf, type Stage } from './types.ts';

export type Mask = 'first-layer' | 'first-face' | 'f2l' | 'oll-cross' | 'oll' | 'll-edges' | 'pll' | 'full'
  | 'coll' | 'roux-fb' | 'roux-sb' | 'cmll' | 'lse' | 'two-sides' | 'cross';
export interface DiagramOpts {
  n?: 2 | 3; // a 2x2 or a 3x3 (default)
  bottom?: boolean; // top view: the D layer too, beside the U layer (2x2 PBL)
  size?: number; // rendered width in px
  title?: string; // accessible name; callers pass an already translated string
  arrows?: boolean; // top view: PLL arrows (not in recognition questions, where they'd give the answer away)
  cornerArrows?: boolean; // only the corners' arrows: the edges aren't the case's (COLL, CMLL, 2-look PLL's corners)
  colors?: Record<string, string>; // sticker color per face letter, default COLORS (heldColors: the cube held another way)
}

export const COLORS: Record<string, string> = {
  U: '#ffd60a', D: '#f5f5f5', F: '#22c55e', B: '#2563eb', R: '#ff8a1f', L: '#d1192e', // orange lighter and yellower, red deeper: they stay apart on thin side stickers
};
/** Sticker colors of a cube held as `hold` (place -> user face, cube.ts HOLDS): what each place really shows. */
export const heldColors = (hold: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(hold).map(([place, face]) => [place, COLORS[face]]));
const GREY = '#9ca3af';
const PLASTIC = '#111';
const ARROW = '#e040fb'; // PLL arrows: no face has this colour, so they read on yellow, grey and the dark plastic alike
const U_CENTER = 4;

// Kociemba piece facelets, the 8 corners first; f2l greys whole pieces, so it needs to know which stickers travel together.
export const PIECES = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11], [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51],
  [5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14],
];

export function maskFor(stage: Stage): Mask {
  if (stage === '2x2-first-layer') return 'first-layer';
  if (stage === '2x2-first-face') return 'first-face';
  if (stage === '2x2-oll') return 'oll';
  if (stage === '2x2-pbl' || stage === '2x2-ll-corners') return 'pll';
  if (stage === 'first-layer' || stage === 'f2l' || stage === 'oll-cross' || stage === 'll-edges') return stage; // oll-cross: edges only, as in the plan
  if (stage === 'second-layer') return 'f2l';
  if (stage === 'coll' || stage === 'roux-fb' || stage === 'roux-sb' || stage === 'cmll') return stage;
  if (isRoux(stage)) return 'lse';
  return stage === 'oll-corners' ? 'oll' : 'pll'; // pll-*, ll-corners-*: every sticker counts
}

// Roux's masks: which pieces and which centers (by their stickers' colors: the view may be turned) stay in color.
const block = (s: string[], sides: string) => !s.includes('U') && s.some((x) => sides.includes(x)); // a piece of the L / R block
const KEEP: Partial<Record<Mask, { piece: (stickers: string[]) => boolean; centers: string }>> = {
  'roux-fb': { piece: (s) => block(s, 'L'), centers: 'L' },
  'roux-sb': { piece: (s) => block(s, 'LR'), centers: 'LR' },
  cmll: { piece: (s) => s.length === 3 && s.includes('U'), centers: '' }, // the top corners
  lse: { piece: (s) => !block(s, 'LR'), centers: 'UFDB' }, // everything but the blocks, and the M slice's centers
  'two-sides': { piece: () => false, centers: '' }, // maskedSet keeps the front and right top rows
};
/** The centres' facelet indices (fixed: they say which face is which; paint.ts too). */
export const CENTERS = [4, 13, 22, 31, 40, 49];

/** Which facelet indices are drawn grey under a mask. */
function maskedSet(facelets: string, mask: Mask): Set<number> {
  const out = new Set<number>();
  const keep = KEEP[mask];
  if (keep) {
    for (let i = 0; i < 54; i++) out.add(i);
    for (const piece of PIECES) if (keep.piece(piece.map((i) => facelets[i]))) piece.forEach((i) => out.delete(i));
    for (const i of mask === 'two-sides' ? [9, 10, 11, 18, 19, 20] : CENTERS.filter((i) => keep.centers.includes(facelets[i]))) out.delete(i);
  } else if (mask === 'oll' || mask === 'oll-cross') {
    for (let i = 0; i < 54; i++) if (facelets[i] !== 'U') out.add(i);
    if (mask === 'oll-cross') PIECES.slice(0, 8).forEach((corner) => corner.forEach((i) => out.add(i)));
  } else if (mask === 'f2l' || mask === 'first-layer') {
    out.add(U_CENTER);
    // f2l: grey the last-layer (yellow) pieces; first-layer: grey every piece that isn't white
    const hidden = (piece: number[]) => (mask === 'f2l' ? piece.some((i) => facelets[i] === 'U') : !piece.some((i) => facelets[i] === 'D'));
    for (const piece of PIECES) if (hidden(piece)) piece.forEach((i) => out.add(i));
  } else if (mask === 'first-face') {
    for (let i = 0; i < 54; i++) if (facelets[i] !== 'D') out.add(i); // only the white stickers
  } else if (mask === 'cross') {
    // the white cross: its 4 edges, wherever they are, and the centers they go to
    for (let i = 0; i < 54; i++) if (!CENTERS.includes(i)) out.add(i);
    for (const edge of PIECES.slice(8)) if (edge.some((i) => facelets[i] === 'D')) edge.forEach((i) => out.delete(i));
  } else if (mask === 'll-edges') {
    // last-layer corners (whole pieces, wherever they are) don't matter yet
    for (const corner of PIECES.slice(0, 8)) if (corner.some((i) => facelets[i] === 'U')) corner.forEach((i) => out.add(i));
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = (n: number) => +n.toFixed(2);

function svg(viewBox: [number, number, number, number], opts: DiagramOpts, body: string): string {
  const size = opts.size ?? 96;
  const height = r2((size * viewBox[3]) / viewBox[2]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(' ')}" width="${size}" height="${height}" role="img">`
    + `<title>${esc(opts.title ?? '')}</title>${body}</svg>`;
}

type V3 = [number, number, number];
// Cube spans [0,3]^3: x towards R, y towards U, z towards F; seen from (+1,+1,+1) so (3,3,3) is nearest.
const C30 = Math.cos(Math.PI / 6);
const project = ([x, y, z]: V3) => `${r2((x - z) * C30 * 10)},${r2(((x + z) / 2 - y) * 10)}`;

// Per face: first facelet, origin (sticker 0's corner), column step, row step — Kociemba reading order.
const ISO_FACES: [number, V3, V3, V3][] = [
  [0, [0, 3, 0], [1, 0, 0], [0, 0, 1]], // U: back row first, L on the left
  [18, [0, 3, 3], [1, 0, 0], [0, -1, 0]], // F: top row first, L on the left
  [9, [3, 3, 3], [0, 0, -1], [0, -1, 0]], // R: top row first, F on the left
];

/** Kociemba column/row 0..2 of cell `c` of an n×n face (a 2x2 face is the 3x3's corner stickers). */
const at3 = (n: number, c: number) => (c * 2) / (n - 1);

export function isoSVG(facelets: string, mask: Mask, opts: DiagramOpts = {}): string {
  const grey = maskedSet(facelets, mask);
  const n = opts.n ?? 3, step = 3 / n;
  const at = (o: V3, c: V3, r: V3, i: number, j: number): V3 =>
    [o[0] + (c[0] * j + r[0] * i) * step, o[1] + (c[1] * j + r[1] * i) * step, o[2] + (c[2] * j + r[2] * i) * step];
  let body = '';
  for (const [first, o, c, r] of ISO_FACES) {
    for (let k = 0; k < n * n; k++) {
      const i = Math.floor(k / n), j = k % n, idx = first + at3(n, i) * 3 + at3(n, j);
      const pts = [at(o, c, r, i, j), at(o, c, r, i, j + 1), at(o, c, r, i + 1, j + 1), at(o, c, r, i + 1, j)];
      const fill = grey.has(idx) ? GREY : (opts.colors ?? COLORS)[facelets[idx]];
      body += `<polygon data-facelet="${idx}" points="${pts.map(project).join(' ')}" fill="${fill}"/>`;
    }
  }
  return svg([-27.5, -31.5, 55, 63], opts,
    `<g stroke="${PLASTIC}" stroke-width="1.2" stroke-linejoin="round">${body}</g>`);
}

// Top view: a layer seen from above (B at the top), its side stickers as bars placed by the sticker they touch.
// The U layer; for a 2x2 PBL also the D layer, seen from above through the cube (so its arrows line up with U's).
const BAR = 0.3, GAP = 0.15;
type Bar = [number, number, 'B' | 'F' | 'L' | 'R']; // facelet index, its cell's column (B, F) or row (L, R), side
interface LayerView { cells: [number, number, number][]; bars: Bar[]; slots: [number, number[]][] } // slots: cell facelet, side facelets

// Per layer: the facelet of cell (row, col) and of the B, F, L, R bars at col / row c (Kociemba 0..2).
const LAYERS = {
  U: { cell: (i: number, j: number) => i * 3 + j, B: (c: number) => 47 - c, F: (c: number) => 18 + c, L: (r: number) => 36 + r, R: (r: number) => 11 - r },
  D: { cell: (i: number, j: number) => 27 + (2 - i) * 3 + j, B: (c: number) => 53 - c, F: (c: number) => 24 + c, L: (r: number) => 42 + r, R: (r: number) => 17 - r },
};

function layerView(n: number, layer: 'U' | 'D'): LayerView {
  const f = LAYERS[layer], ks = [...Array(n).keys()], a = (c: number) => at3(n, c);
  const bars = (['B', 'F', 'L', 'R'] as const).flatMap((side) => ks.map((c): Bar => [f[side](a(c)), c, side])); // B seen from behind; L, R back first
  const cells = ks.flatMap((i) => ks.map((j): [number, number, number] => [f.cell(a(i), a(j)), j, i]));
  const slots = cells.map(([idx, j, i]): [number, number[]] => [idx, [
    ...(i === 0 ? [f.B(a(j))] : []), ...(i === n - 1 ? [f.F(a(j))] : []), ...(j === 0 ? [f.L(a(i))] : []), ...(j === n - 1 ? [f.R(a(i))] : []),
  ]]).filter(([, sides]) => sides.length); // not the center
  return { cells, bars, slots };
}

export function topSVG(facelets: string, mask: Mask, opts: DiagramOpts = {}): string {
  const n = opts.n ?? 3;
  const panel = (view: LayerView, dx: number) => {
    const grey = maskedSet(facelets, mask);
    const fill = (idx: number) => (grey.has(idx) ? GREY : (opts.colors ?? COLORS)[facelets[idx]]);
    const s = 30 / n, pad = 1.2, inset = 0.08 * s, trim = 0.15 * s;
    let body = `<rect x="${-pad}" y="${-pad}" width="${30 + 2 * pad}" height="${30 + 2 * pad}" rx="2" fill="${PLASTIC}"/>`;
    for (const [idx, x, y] of view.cells) {
      body += `<rect data-facelet="${idx}" x="${r2(x * s + inset)}" y="${r2(y * s + inset)}" width="${r2(s - 2 * inset)}" height="${r2(s - 2 * inset)}" rx="1.2" fill="${fill(idx)}"/>`;
    }
    for (const [idx, c, side] of view.bars) {
      const out = side === 'B' || side === 'L' ? -(GAP + BAR) * 10 : 30 + GAP * 10, along = c * s + trim;
      const [x, y, w, h] = side === 'B' || side === 'F' ? [along, out, s - 2 * trim, BAR * 10] : [out, along, BAR * 10, s - 2 * trim];
      // masked bars fade instead of disappearing, so the layout never shifts between cases
      const fade = grey.has(idx) ? ' fill-opacity="0.35"' : '';
      body += `<rect data-facelet="${idx}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="1" fill="${fill(idx)}"${fade} stroke="${PLASTIC}" stroke-width="0.5"/>`;
    }
    if (opts.arrows) body += arrowsSVG(llArrows(facelets, view, opts.cornerArrows), view, s);
    return dx ? `<g transform="translate(${dx} 0)">${body}</g>` : body;
  };
  const m = (GAP + BAR) * 10 + 1;
  const width = 30 + 2 * m;
  if (!opts.bottom) return svg([-m, -m, width, width], opts, panel(layerView(n, 'U'), 0));
  return svg([-m, -m, 2 * width, width], opts, panel(layerView(n, 'U'), 0) + panel(layerView(n, 'D'), width));
}

const FACE_OF = 'URFDLB'; // Kociemba face order: facelet i belongs to FACE_OF[i / 9]
const colorsKey = (letters: string[]) => [...letters].sort().join('');

/** PLL/PBL arrows as [from, to] facelets of a layer: each of its pieces goes home (where the algorithm takes it). Its
 *  colors name its home slot, so a twisted corner (COLL, CMLL) gets one too. `corners`: the corners' arrows only.
 *  Home up to a turn of the layer (the AUF after the algorithm): the one moving fewest pieces, so a case with an AUF
 *  still draws its own permutation (a T-perm a U away is a T seen from another side, not eight pieces cycling). */
export function llArrows(facelets: string, view = layerView(3, 'U'), corners = false): [number, number][] {
  const key = (idx: number, sides: number[], color: (i: number) => string) => colorsKey([idx, ...sides].map(color));
  const home = new Map(view.slots.map(([idx, sides]) => [key(idx, sides, (i) => FACE_OF[Math.floor(i / 9)]), idx]));
  let best: [number, number][] | null = null, bestScore = Infinity;
  for (let k = 0; k < 4; k++) {
    const turned = (c: string) => (SIDES.includes(c) ? SIDES[(SIDES.indexOf(c) + k) % 4] : c); // colors as k turns of the layer would place them
    const out: [number, number][] = [];
    let cornersMoved = 0;
    for (const [idx, sides] of view.slots) {
      if (corners && sides.length < 2) continue;
      const to = home.get(key(idx, sides, (i) => turned(facelets[i])));
      if (to === undefined || to === idx) continue;
      out.push([idx, to]);
      if (sides.length > 1) cornersMoved++;
    }
    // a tie (H: edges swapped, or corners swapped a U2 away) goes to corners staying home, as PLLs are recognized
    const score = out.length * 100 + cornersMoved;
    if (score < bestScore) [best, bestScore] = [out, score];
  }
  return best!;
}
const SIDES = 'FRBL'; // around the U-D axis

// Lines between sticker centers, a head at the target; a swap is one line with two heads.
function arrowsSVG(moves: [number, number][], view: LayerView, s: number): string {
  const cell = new Map(view.cells.map(([idx, x, y]) => [idx, [(x + 0.5) * s, (y + 0.5) * s]]));
  const at = (k: number) => cell.get(k)!;
  const head = (x: number, y: number, ux: number, uy: number) => {
    const h = 3.2, w = 2;
    return `<polygon points="${[[x, y], [x - ux * h - uy * w, y - uy * h + ux * w], [x - ux * h + uy * w, y - uy * h - ux * w]].map((p) => p.map(r2).join(',')).join(' ')}"/>`;
  };
  let out = '';
  for (const [a, b] of moves) {
    const swap = moves.some(([c, d]) => c === b && d === a);
    if (swap && a > b) continue;
    const [x1, y1] = at(a), [x2, y2] = at(b);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, trim = 2.2;
    const [sx, sy, ex, ey] = [x1 + ux * trim, y1 + uy * trim, x2 - ux * trim, y2 - uy * trim];
    out += `<line x1="${r2(sx)}" y1="${r2(sy)}" x2="${r2(ex)}" y2="${r2(ey)}"/>${head(ex, ey, ux, uy)}${swap ? head(sx, sy, -ux, -uy) : ''}`;
  }
  return out && `<g class="arrows" stroke="${ARROW}" stroke-width="0.9" fill="${ARROW}" stroke-linejoin="round">${out}</g>`;
}

// --- The cube turned as a whole: the same stickers, seen from another side ---

// Each face's sticker 0 corner, column step and row step (Kociemba order U R F D L B), in isoSVG's coordinates.
const FACES: [V3, V3, V3][] = [
  [[0, 3, 0], [1, 0, 0], [0, 0, 1]], [[3, 3, 3], [0, 0, -1], [0, -1, 0]], [[0, 3, 3], [1, 0, 0], [0, -1, 0]],
  [[0, 0, 3], [1, 0, 0], [0, 0, -1]], [[0, 3, 0], [0, 0, 1], [0, -1, 0]], [[3, 3, 0], [-1, 0, 0], [0, -1, 0]],
];
const CENTERS3 = [...Array(54).keys()].map((idx): V3 => {
  const [o, c, r] = FACES[Math.floor(idx / 9)], i = Math.floor((idx % 9) / 3) + 0.5, j = (idx % 3) + 0.5;
  return [0, 1, 2].map((k) => o[k] + c[k] * j + r[k] * i - 1.5) as V3; // the sticker's middle, the cube's center at 0
});
const at3d = new Map(CENTERS3.map((p, idx) => [p.join(), idx]));
// Where a point goes when the whole cube turns like R (x) or like U (y)
const TURN = { x: ([a, b, c]: V3): V3 => [a, c, -b], y: ([a, b, c]: V3): V3 => [-c, b, a] };
const TURNED = Object.fromEntries((['x', 'y'] as const).map((axis) =>
  [axis, CENTERS3.map((p) => at3d.get(TURN[axis](p).map((v) => v + 0).join())!)])) as Record<'x' | 'y', number[]>;

/** The facelets of the cube turned `times` times like R (x) or U (y): every sticker keeps its color, at its new place. */
export function turned(facelets: string, axis: 'x' | 'y', times = 1): string {
  let f = facelets;
  for (let t = 0; t < ((times % 4) + 4) % 4; t++) {
    const out = [...f];
    TURNED[axis].forEach((to, from) => (out[to] = f[from]));
    f = out.join('');
  }
  return f;
}

/** Roux: the cube held by its blocks (white down), the M slice's centers wherever they are. The diagrams' states have
 *  their centers home (cube.ts), so a case whose algorithm turns the M slice shows its blocks turned instead. */
function rouxHeld(facelets: string): string {
  for (let t = 0; t < 4; t++) {
    const f = turned(facelets, 'x', t);
    if ([27, 30, 33].every((i) => f[i] === 'D')) return f; // the left block's bottom
  }
  return facelets;
}

const SLOT_ROWS = [3, 4, 5, 6, 7, 8]; // a side face's two lower rows: its slots
/** F2L iso: how many y turns bring the slot being solved to the front-right: the view that shows the most unsolved
 *  slot stickers on its two side faces (front first on a tie), so a back-slot case faces you. */
function f2lTurns(facelets: string): number {
  const wrong = (f: string) => [9, 18].reduce((n, first) => n + SLOT_ROWS.filter((k) => f[first + k] !== f[first + 4]).length, 0);
  const scores = [0, 1, 2, 3].map((t) => wrong(turned(facelets, 'y', t)));
  return scores.indexOf(Math.max(...scores));
}

/** How many y turns a stage's iso figure turns (an F2L slot to the front-right, Roux's first block to the front-left);
 *  the 3D players turn their camera the same (practice.ts's aim). `facelets`: the state, only read for F2L. */
export const isoTurns = (stage: Stage, facelets: () => string): number =>
  stage === 'f2l' ? f2lTurns(facelets()) : stage === 'roux-fb' ? -1 : 0;

/** A case's figure as the academy draws it: `view` is its phase's ('iso' for the first layers, F2L and Roux's blocks,
 *  'top' for the last layer), the puzzle and mask come from its stage; `arrows`: PLL/PBL arrows if the stage has them
 *  (COLL and CMLL: the corners'). The iso turns to what the stage builds: an F2L back slot, Roux's left block. */
export function caseDiagram(view: 'iso' | 'top', stage: Stage, facelets: string, opts: DiagramOpts = {}): string {
  const mask = maskFor(stage);
  const n = puzzleOf(stage) === '2x2x2' ? 2 : 3;
  const o = { ...opts, n, arrows: !!opts.arrows && (mask === 'pll' || mask === 'coll' || mask === 'cmll'),
    cornerArrows: mask === 'coll' || mask === 'cmll' || stage === 'pll-corners', bottom: stage === '2x2-pbl' } as const;
  if (isRoux(stage)) facelets = rouxHeld(facelets);
  if (view === 'top') return topSVG(facelets, mask, o);
  return isoSVG(turned(facelets, 'y', isoTurns(stage, () => facelets)), mask, o);
}

/** PLL recognition from two sides, as a cube in your hands shows it: the iso with only the front and right faces' top
 *  rows in color (the top face and the rest grey). `facelets`: the user frame, like caseDiagram's. */
export const twoSidesSVG = (facelets: string, opts: DiagramOpts = {}): string => isoSVG(facelets, 'two-sides', opts);

// Full net (cross layout, as on scramble sheets): U above F; L, F, R, B in a row; D below F. Each face in
// Kociemba reading order, which is exactly how it lies in the net.
const NET: [number, number, number][] = [[0, 1, 0], [9, 2, 1], [18, 1, 1], [27, 1, 2], [36, 0, 1], [45, 3, 1]]; // first facelet, column, row

/** The whole state, unfolded: every sticker coloured (e.g. to check a scramble by hand), or with `mask` what doesn't
 *  matter grey (the white cross: every face can hold one of its edges, so no 3-face view shows them all). */
export function netSVG(facelets: string, opts: DiagramOpts = {}, mask?: Mask): string {
  const s = 10, gap = 1.5, inset = 0.6;
  const grey = mask ? maskedSet(facelets, mask) : new Set<number>();
  let body = '';
  for (const [first, col, row] of NET) {
    const ox = col * (3 * s + gap), oy = row * (3 * s + gap);
    body += `<rect x="${ox}" y="${oy}" width="${3 * s}" height="${3 * s}" rx="1.5" fill="${PLASTIC}"/>`;
    for (let k = 0; k < 9; k++) {
      const idx = first + k;
      const fill = grey.has(idx) ? GREY : (opts.colors ?? COLORS)[facelets[idx]];
      body += `<rect data-facelet="${idx}" x="${r2(ox + (k % 3) * s + inset)}" y="${r2(oy + Math.floor(k / 3) * s + inset)}" width="${s - 2 * inset}" height="${s - 2 * inset}" rx="1" fill="${fill}"/>`;
    }
  }
  return svg([0, 0, 4 * 3 * s + 3 * gap, 3 * 3 * s + 2 * gap], opts, body);
}

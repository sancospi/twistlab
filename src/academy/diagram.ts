// Case diagrams as SVG strings: isometric (F2L) and top view (OLL/PLL), like the plan's figures.
// Input is a 54-char Kociemba string in the USER frame (yellow up, green front), so letters are user faces.
import { puzzleOf, type Stage } from './types.ts';

export type Mask = 'first-layer' | 'first-face' | 'f2l' | 'oll-cross' | 'oll' | 'll-edges' | 'pll' | 'full';
export interface DiagramOpts {
  n?: 2 | 3; // a 2x2 or a 3x3 (default)
  bottom?: boolean; // top view: the D layer too, beside the U layer (2x2 PBL)
  size?: number; // rendered width in px
  title?: string; // accessible name; callers pass an already translated string
  arrows?: boolean; // top view: PLL arrows (not in recognition questions, where they'd give the answer away)
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
  return stage === 'oll-corners' ? 'oll' : 'pll'; // pll-*, ll-corners-*: every sticker counts
}

/** Which facelet indices are drawn grey under a mask. */
function maskedSet(facelets: string, mask: Mask): Set<number> {
  const out = new Set<number>();
  if (mask === 'oll' || mask === 'oll-cross') {
    for (let i = 0; i < 54; i++) if (facelets[i] !== 'U') out.add(i);
    if (mask === 'oll-cross') PIECES.slice(0, 8).forEach((corner) => corner.forEach((i) => out.add(i)));
  } else if (mask === 'f2l' || mask === 'first-layer') {
    out.add(U_CENTER);
    // f2l: grey the last-layer (yellow) pieces; first-layer: grey every piece that isn't white
    const hidden = (piece: number[]) => (mask === 'f2l' ? piece.some((i) => facelets[i] === 'U') : !piece.some((i) => facelets[i] === 'D'));
    for (const piece of PIECES) if (hidden(piece)) piece.forEach((i) => out.add(i));
  } else if (mask === 'first-face') {
    for (let i = 0; i < 54; i++) if (facelets[i] !== 'D') out.add(i); // only the white stickers
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
    if (opts.arrows) body += arrowsSVG(llArrows(facelets, view), view, s);
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
 *  side colors name its home slot. */
export function llArrows(facelets: string, view = layerView(3, 'U')): [number, number][] {
  const home = new Map(view.slots.map(([idx, sides]) => [colorsKey(sides.map((i) => FACE_OF[Math.floor(i / 9)])), idx]));
  const out: [number, number][] = [];
  for (const [idx, sides] of view.slots) {
    const to = home.get(colorsKey(sides.map((i) => facelets[i])));
    if (to !== undefined && to !== idx) out.push([idx, to]);
  }
  return out;
}

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

/** A case's figure as the academy draws it: `view` is its phase's ('iso' for the first layers and F2L, 'top' for the
 *  last layer), the puzzle and mask come from its stage; `arrows`: PLL/PBL arrows if the stage has them. */
export function caseDiagram(view: 'iso' | 'top', stage: Stage, facelets: string, opts: DiagramOpts = {}): string {
  const mask = maskFor(stage);
  const o = { ...opts, n: puzzleOf(stage) === '2x2x2' ? 2 : 3, arrows: !!opts.arrows && mask === 'pll', bottom: stage === '2x2-pbl' } as const;
  return (view === 'iso' ? isoSVG : topSVG)(facelets, mask, o);
}

// Full net (cross layout, as on scramble sheets): U above F; L, F, R, B in a row; D below F. Each face in
// Kociemba reading order, which is exactly how it lies in the net.
const NET: [number, number, number][] = [[0, 1, 0], [9, 2, 1], [18, 1, 1], [27, 1, 2], [36, 0, 1], [45, 3, 1]]; // first facelet, column, row

/** The whole state, every sticker coloured (e.g. to check a scramble by hand). */
export function netSVG(facelets: string, opts: DiagramOpts = {}): string {
  const s = 10, gap = 1.5, inset = 0.6;
  let body = '';
  for (const [first, col, row] of NET) {
    const ox = col * (3 * s + gap), oy = row * (3 * s + gap);
    body += `<rect x="${ox}" y="${oy}" width="${3 * s}" height="${3 * s}" rx="1.5" fill="${PLASTIC}"/>`;
    for (let k = 0; k < 9; k++) {
      const idx = first + k;
      body += `<rect data-facelet="${idx}" x="${r2(ox + (k % 3) * s + inset)}" y="${r2(oy + Math.floor(k / 3) * s + inset)}" width="${s - 2 * inset}" height="${s - 2 * inset}" rx="1" fill="${(opts.colors ?? COLORS)[facelets[idx]]}"/>`;
    }
  }
  return svg([0, 0, 4 * 3 * s + 3 * gap, 3 * 3 * s + 2 * gap], opts, body);
}

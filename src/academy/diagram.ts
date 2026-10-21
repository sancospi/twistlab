// Case diagrams as SVG strings: isometric (F2L) and top view (OLL/PLL), like the plan's figures.
// Input is a 54-char Kociemba string in the USER frame (yellow up, green front), so letters are user faces.
import type { Stage } from './types.ts';

export type Mask = 'f2l' | 'oll-cross' | 'oll' | 'pll' | 'full';
export interface DiagramOpts {
  size?: number; // rendered width in px
  title?: string; // accessible name; callers pass an already translated string
  arrows?: boolean; // top view: PLL arrows (not in recognition questions, where they'd give the answer away)
}

const COLORS: Record<string, string> = {
  U: '#ffd60a', D: '#f5f5f5', F: '#22c55e', B: '#2563eb', R: '#f97316', L: '#ef4444',
};
const GREY = '#9ca3af';
const PLASTIC = '#111';
const U_CENTER = 4;

// Kociemba piece facelets; f2l greys whole pieces, so it needs to know which stickers travel together.
const PIECES = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11], [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51],
  [5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14],
];

export function maskFor(stage: Stage): Mask {
  if (stage === 'f2l' || stage === 'oll-cross') return stage; // the cross step looks at edges only, as in the plan
  return stage.startsWith('oll') ? 'oll' : 'pll';
}

/** Which facelet indices are drawn grey under a mask. */
function maskedSet(facelets: string, mask: Mask): Set<number> {
  const out = new Set<number>();
  if (mask === 'oll' || mask === 'oll-cross') {
    for (let i = 0; i < 54; i++) if (facelets[i] !== 'U') out.add(i);
    if (mask === 'oll-cross') PIECES.slice(0, 8).forEach((corner) => corner.forEach((i) => out.add(i)));
  } else if (mask === 'f2l') {
    out.add(U_CENTER);
    for (const piece of PIECES) if (piece.some((i) => facelets[i] === 'U')) piece.forEach((i) => out.add(i));
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

export function isoSVG(facelets: string, mask: Mask, opts: DiagramOpts = {}): string {
  const grey = maskedSet(facelets, mask);
  const at = (o: V3, c: V3, r: V3, i: number, j: number): V3 =>
    [o[0] + c[0] * j + r[0] * i, o[1] + c[1] * j + r[1] * i, o[2] + c[2] * j + r[2] * i];
  let body = '';
  for (const [first, o, c, r] of ISO_FACES) {
    for (let k = 0; k < 9; k++) {
      const i = Math.floor(k / 3), j = k % 3, idx = first + k;
      const pts = [at(o, c, r, i, j), at(o, c, r, i, j + 1), at(o, c, r, i + 1, j + 1), at(o, c, r, i + 1, j)];
      const fill = grey.has(idx) ? GREY : COLORS[facelets[idx]];
      body += `<polygon data-facelet="${idx}" points="${pts.map(project).join(' ')}" fill="${fill}"/>`;
    }
  }
  return svg([-27.5, -31.5, 55, 63], opts,
    `<g stroke="${PLASTIC}" stroke-width="1.2" stroke-linejoin="round">${body}</g>`);
}

// Top view: U face plus the top-layer side stickers as bars, placed by the U sticker they touch.
// Each entry: facelet index, x, y (in cells; U occupies [0,3]^2 with B at the top), horizontal?
const BAR = 0.3, GAP = 0.15;
const TOP_BARS: [number, number, number, boolean][] = [
  ...[0, 1, 2].map((c): [number, number, number, boolean] => [47 - c, c, -GAP - BAR, true]), // B, seen from behind
  ...[0, 1, 2].map((c): [number, number, number, boolean] => [18 + c, c, 3 + GAP, true]), // F
  ...[0, 1, 2].map((r): [number, number, number, boolean] => [36 + r, -GAP - BAR, r, false]), // L: back first
  ...[0, 1, 2].map((r): [number, number, number, boolean] => [11 - r, 3 + GAP, r, false]), // R: front first
];

export function topSVG(facelets: string, mask: Mask, opts: DiagramOpts = {}): string {
  const grey = maskedSet(facelets, mask);
  const fill = (idx: number) => (grey.has(idx) ? GREY : COLORS[facelets[idx]]);
  const s = 10, pad = 0.12 * s, inset = 0.08 * s;
  let body = `<rect x="${-pad}" y="${-pad}" width="${3 * s + 2 * pad}" height="${3 * s + 2 * pad}" rx="2" fill="${PLASTIC}"/>`;
  for (let k = 0; k < 9; k++) {
    const x = (k % 3) * s + inset, y = Math.floor(k / 3) * s + inset;
    body += `<rect data-facelet="${k}" x="${r2(x)}" y="${r2(y)}" width="${s - 2 * inset}" height="${s - 2 * inset}" rx="1.2" fill="${fill(k)}"/>`;
  }
  for (const [idx, cx, cy, horizontal] of TOP_BARS) {
    const [w, h] = horizontal ? [s - 2 * 1.5, BAR * s] : [BAR * s, s - 2 * 1.5];
    const x = horizontal ? cx * s + 1.5 : cx * s, y = horizontal ? cy * s : cy * s + 1.5;
    // masked bars fade instead of disappearing, so the layout never shifts between cases
    const fade = grey.has(idx) ? ' fill-opacity="0.35"' : '';
    body += `<rect data-facelet="${idx}" x="${r2(x)}" y="${r2(y)}" width="${w}" height="${h}" rx="1" fill="${fill(idx)}"${fade} stroke="${PLASTIC}" stroke-width="0.5"/>`;
  }
  if (opts.arrows) body += arrowsSVG(llArrows(facelets), s);
  const m = (GAP + BAR) * s + 1;
  return svg([-m, -m, 3 * s + 2 * m, 3 * s + 2 * m], opts, body);
}

// Top-layer slots: U facelet, then its side facelets. A piece's side colors name its home slot.
const LL_SLOTS: [number, number[]][] = [
  [0, [36, 47]], [2, [45, 11]], [6, [18, 38]], [8, [9, 20]], [1, [46]], [3, [37]], [5, [10]], [7, [19]],
];
const FACE_OF = 'URFDLB'; // Kociemba face order: facelet i belongs to FACE_OF[i / 9]
const colorsKey = (letters: string[]) => [...letters].sort().join('');
const HOME = new Map(LL_SLOTS.map(([u, side]) => [colorsKey(side.map((i) => FACE_OF[Math.floor(i / 9)])), u]));

/** PLL arrows as [from, to] U facelets: each top-layer piece goes home (where the algorithm takes it). */
export function llArrows(facelets: string): [number, number][] {
  const out: [number, number][] = [];
  for (const [u, side] of LL_SLOTS) {
    const to = HOME.get(colorsKey(side.map((i) => facelets[i])));
    if (to !== undefined && to !== u) out.push([u, to]);
  }
  return out;
}

// Lines between sticker centers, a head at the target; a swap is one line with two heads.
function arrowsSVG(moves: [number, number][], s: number): string {
  const at = (k: number) => [((k % 3) + 0.5) * s, (Math.floor(k / 3) + 0.5) * s];
  const head = (x: number, y: number, ux: number, uy: number) => {
    const h = 0.32 * s, w = 0.2 * s;
    return `<polygon points="${[[x, y], [x - ux * h - uy * w, y - uy * h + ux * w], [x - ux * h + uy * w, y - uy * h - ux * w]].map((p) => p.map(r2).join(',')).join(' ')}"/>`;
  };
  let out = '';
  for (const [a, b] of moves) {
    const swap = moves.some(([c, d]) => c === b && d === a);
    if (swap && a > b) continue;
    const [x1, y1] = at(a), [x2, y2] = at(b);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, trim = 0.22 * s;
    const [sx, sy, ex, ey] = [x1 + ux * trim, y1 + uy * trim, x2 - ux * trim, y2 - uy * trim];
    out += `<line x1="${r2(sx)}" y1="${r2(sy)}" x2="${r2(ex)}" y2="${r2(ey)}"/>${head(ex, ey, ux, uy)}${swap ? head(sx, sy, -ux, -uy) : ''}`;
  }
  return out && `<g class="arrows" stroke="${PLASTIC}" stroke-width="0.9" fill="${PLASTIC}" stroke-linejoin="round">${out}</g>`;
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
      body += `<rect data-facelet="${idx}" x="${r2(ox + (k % 3) * s + inset)}" y="${r2(oy + Math.floor(k / 3) * s + inset)}" width="${s - 2 * inset}" height="${s - 2 * inset}" rx="1" fill="${COLORS[facelets[idx]]}"/>`;
    }
  }
  return svg([0, 0, 4 * 3 * s + 3 * gap, 3 * 3 * s + 2 * gap], opts, body);
}

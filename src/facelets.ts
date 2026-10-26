// Kociemba facelets (as sent by GAN cubes) <-> cubing.js KPattern.
// Adapted from https://github.com/afedotov/gan-cube-sample (MIT, Andy Fedotov).
import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern, type KPatternData } from 'cubing/kpuzzle';

export const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

const EDGE_ORDER = 'UF UR UB UL DF DR DB DL FR FL BR BL'.split(' ');
const CORNER_ORDER = 'UFR URB UBL ULF DRF DFL DLB DBR'.split(' ');
const CENTER_ORDER = 'U L F R B D'.split(' ');

// facelet index -> [orbit (0 edges, 1 corners, 2 centers), slot, sticker]
const FACELET_MAP: [number, number, number][] = [
  [1, 2, 0], [0, 2, 0], [1, 1, 0], [0, 3, 0], [2, 0, 0], [0, 1, 0], [1, 3, 0], [0, 0, 0], [1, 0, 0],
  [1, 0, 2], [0, 1, 1], [1, 1, 1], [0, 8, 1], [2, 3, 0], [0, 10, 1], [1, 4, 1], [0, 5, 1], [1, 7, 2],
  [1, 3, 2], [0, 0, 1], [1, 0, 1], [0, 9, 0], [2, 2, 0], [0, 8, 0], [1, 5, 1], [0, 4, 1], [1, 4, 2],
  [1, 5, 0], [0, 4, 0], [1, 4, 0], [0, 7, 0], [2, 5, 0], [0, 5, 0], [1, 6, 0], [0, 6, 0], [1, 7, 0],
  [1, 2, 2], [0, 3, 1], [1, 3, 1], [0, 11, 1], [2, 1, 0], [0, 9, 1], [1, 6, 1], [0, 7, 1], [1, 5, 2],
  [1, 1, 2], [0, 2, 1], [1, 2, 1], [0, 10, 0], [2, 4, 0], [0, 11, 0], [1, 7, 1], [0, 6, 1], [1, 6, 2],
];

// sticker indices (centers removed, each face reversed) per corner / edge slot
const CORNER_STICKERS = [
  [0, 21, 15], [5, 13, 47], [7, 45, 39], [2, 37, 23], [29, 10, 16], [31, 18, 32], [26, 34, 40], [24, 42, 8],
];
const EDGE_STICKERS = [
  [1, 22], [3, 14], [6, 46], [4, 38], [30, 17], [27, 9], [25, 41], [28, 33], [19, 12], [20, 35], [44, 11], [43, 36],
];

const rotateLeft = (s: string, i: number) => s.slice(i) + s.slice(0, i);

const PIECES: Record<string, { piece: number; orientation: number }> = {};
EDGE_ORDER.forEach((e, piece) => [0, 1].forEach((o) => (PIECES[rotateLeft(e, o)] = { piece, orientation: o })));
CORNER_ORDER.forEach((c, piece) => [0, 1, 2].forEach((o) => (PIECES[rotateLeft(c, o)] = { piece, orientation: o })));

export function patternToFacelets(pattern: KPattern): string {
  const { EDGES, CORNERS } = pattern.patternData;
  const reid = [
    EDGES.pieces.map((p, i) => rotateLeft(EDGE_ORDER[p], EDGES.orientation[i])),
    CORNERS.pieces.map((p, i) => rotateLeft(CORNER_ORDER[p], CORNERS.orientation[i])),
    CENTER_ORDER,
  ];
  return FACELET_MAP.map(([orbit, slot, sticker]) => reid[orbit][slot][sticker]).join('');
}

export async function faceletsToPattern(facelets: string): Promise<KPattern> {
  const stickers: string[] = [];
  for (const face of facelets.match(/.{9}/g) ?? []) {
    [...face].reverse().forEach((s, i) => i !== 4 && stickers.push(s));
  }
  const read = (slots: number[][]) => slots.map((idx) => {
    const info = PIECES[idx.map((i) => stickers[i]).join('')];
    if (!info) throw new Error(`invalid facelets: ${facelets}`);
    return info;
  });
  const corners = read(CORNER_STICKERS);
  const edges = read(EDGE_STICKERS);
  const data: KPatternData = {
    CORNERS: { pieces: corners.map((c) => c.piece), orientation: corners.map((c) => c.orientation) },
    EDGES: { pieces: edges.map((e) => e.piece), orientation: edges.map((e) => e.orientation) },
    CENTERS: { pieces: [0, 1, 2, 3, 4, 5], orientation: [0, 0, 0, 0, 0, 0], orientationMod: [1, 1, 1, 1, 1, 1] },
  };
  return new KPattern(await cube3x3x3.kpuzzle(), data);
}

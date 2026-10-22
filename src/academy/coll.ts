// "COLL": the last layer's corners in one algorithm when the top edges are already oriented (the yellow cross is done
// with the last F2L pair or OLL's edges), so only an EPLL is left. 40 cases in one phase (one group per OCLL shape),
// stage 'coll': every top sticker yellow and the corners solved relative to each other. Case ids: coll-<slug>;
// SpeedCubeDB: scdbUrl('COLL', 'AS_1').
// Algorithms are SpeedCubeDB's (/a/3x3/COLL, read 2026-10-22): main = #1 with a leading y/y'/y2 dropped (an AUF covers
// it: the edges don't matter here), extras = [rank, alg] with the U turn they need here in place of their leading y.
// Left out: extras that became the main or another extra once their y was dropped (AS 2 #3, L 6 #3, H 1 #3, H 4 #3-#4).
// Recognition texts describe each setup as the diagram shows it (yellow up, green front), side stickers only.
import type { Localized } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { scdbUrl } from './scdb.ts';
import type { Case, Group, Method } from './types.ts';

const tr = (es: string, en: string): Localized => ({ es, en });
const doc = (es: string[], en: string[]): Localized => tr(es.join('\n'), en.join('\n'));

type T = [es: string, en: string];
type Alt = [rank: number, alg: string];

// group slug -> SpeedCubeDB's set name (codes 'AS 1', ids 'AS_1')
const SET = { h: 'H', pi: 'Pi', u: 'U', t: 'T', l: 'L', s: 'S', as: 'AS' } as const;

function kase(g: keyof typeof SET, n: number, recognition: T, alg: string, alts: Alt[], note?: T): Case {
  const code = `${SET[g]} ${n}`;
  return {
    id: `coll-${g}-${n}`,
    code,
    name: tr(code, code),
    recognition: tr(...recognition),
    stage: 'coll',
    algs: [
      { id: 'main', alg, source: 'speedcubedb', rank: 1 },
      ...alts.map(([rank, a]) => ({ id: `scdb-${rank}`, alg: a, source: 'speedcubedb' as const, rank })),
    ],
    setup: invertTokens(centerMoves(alg, IDENTITY)).join(' '), // face turns: undoes M, r and rotations too
    scdb: { set: 'COLL', id: `${SET[g]}_${n}`, url: scdbUrl('COLL', `${SET[g]}_${n}`) },
    ...(note ? { note: tr(...note) } : {}),
  };
}

const group = (g: keyof typeof SET, name: T, description: T, cases: Case[]): Group =>
  ({ id: `coll-${g}`, name: tr(...name), description: tr(...description), cases });

const ocll = (name: string): T => [
  `Es el mismo algoritmo que la OCLL ${name} de CFOP: si ya lo sabes, este caso es gratis.`,
  `It's the same algorithm as CFOP's ${name} OCLL: if you know it, this case is free.`,
];

const h = group('h', ['H', 'H'], [
  'Ninguna esquina amarilla arriba: los amarillos miran de dos en dos a lados opuestos (**faros** amarillos en dos lados). 4 casos.',
  'No yellow corner on top: the yellows face two opposite sides in pairs (yellow **headlights** on two sides). 4 cases.',
], [
  kase('h', 1, [
    'Faros amarillos a la derecha y a la izquierda. Al frente y atrás, colores opuestos (rojo y naranja), sin faros.',
    'Yellow headlights on the right and on the left. At the front and the back, opposite colors (red and orange), no headlights.',
  ], "R U R' U R U' R' U R U2 R'", [[2, "U R U2 R' U' R U R' U' R U' R'"], [4, "U R' U2 R U R' U' R U R' U R"]], ocll('H')),
  kase('h', 2, [
    'Faros amarillos a la derecha y a la izquierda. Al frente, colores opuestos (naranja y rojo); atrás, **faros** verdes.',
    'Yellow headlights on the right and on the left. At the front, opposite colors (orange and red); at the back, green **headlights**.',
  ], "F R U' R' U R U2 R' U' R U R' U' F'", [[2, "f R2 S' U' R2 U' R2 U R2 F'"], [3, "U2 f R U R' U' R F' R U R' U' R' S'"], [4, "f R U R' U' f' R U R' U' R' F R F'"]]),
  kase('h', 3, [
    'Faros amarillos a la derecha y a la izquierda. Al frente (rojo y azul) y atrás (verde y rojo), colores vecinos.',
    'Yellow headlights on the right and on the left. At the front (red and blue) and the back (green and red), adjacent colors.',
  ], "R U R' U R U L' U R' U' L", [[2, "R U R' U R U r' F R' F' r"], [3, "R' F' R U2 R U2 R' F U' R U' R'"], [4, "R U R2 D' R U2 R' D R U' R U2 R'"]]),
  kase('h', 4, [
    'Faros amarillos al frente y atrás. A la derecha (rojos) y a la izquierda (naranjas), también **faros**.',
    'Yellow headlights at the front and the back. On the right (red) and the left (orange), **headlights** too.',
  ], "F R U R' U' R U R' U' R U R' U' F'", [[2, "F U R U' R' U R U' R' U R U' R' F'"]]),
]);

const pi = group('pi', ['Pi', 'Pi'], [
  'Ninguna esquina amarilla arriba: dos amarillos en un lado (**faros** amarillos) y los otros dos en los lados vecinos, en la otra punta. El lado de enfrente de los faros amarillos no tiene amarillo.',
  'No yellow corner on top: two yellows on one side (yellow **headlights**) and the other two on the sides next to it, at the far end. The side across from the yellow headlights has no yellow.',
], [
  kase('pi', 1, [
    'Faros amarillos a la izquierda. El lado derecho, colores opuestos (azul y verde). Al frente y atrás, la pegatina que no es amarilla es del mismo color (naranja).',
    'Yellow headlights on the left. The right side, opposite colors (blue and green). At the front and the back, the sticker that isn\'t yellow is the same color (orange).',
  ], "R U2 R2 U' R2 U' R2 U2 R", [[2, "R' U2 R2 U R2 U R2 U2 R'"], [3, "U2 L' U2 L2 U L2 U L2 U2 L'"], [4, "R U R' U R U2 R' U' R U R' U R U2 R'"]], ocll('Pi')),
  kase('pi', 2, [
    'Faros amarillos atrás. El frente, colores vecinos (azul y naranja). El naranja se repite: en el frente, a la derecha, y en el lado izquierdo, atrás.',
    'Yellow headlights at the back. The front, adjacent colors (blue and orange). Orange shows twice: on the front at the right, and on the left side at the back.',
  ], "F U R U' R' U R U' R2 F' R U R U' R'", [[2, "U' R' F2 R U2 R U2 R' F2 U' R U' R'"], [3, "U L' U' L U L F' L2 U' L U L' U' L U F"], [4, "U' R U R' U R' F R2 U' R' U' R U R' F' U R U' R'"]]),
  kase('pi', 3, [
    'Faros amarillos a la izquierda. El lado derecho, **faros** naranjas. Al frente y atrás, la pegatina que no es amarilla es del mismo color (rojo).',
    'Yellow headlights on the left. The right side, orange **headlights**. At the front and the back, the sticker that isn\'t yellow is the same color (red).',
  ], "R' U' F' R U R' U' R' F R2 U2 R' U2 R", [[2, "U F U R U' R' U R U2 R' U' R U R' F'"], [3, "U F R2 U' R2 U R2 U S R2 f'"], [4, "U' R U R' U R U2 R2 F' r U R U' r' F"]]),
  kase('pi', 4, [
    'Faros amarillos a la izquierda. El lado derecho, colores vecinos (verde y rojo). El verde se repite: en el lado derecho, adelante, y atrás, a la izquierda.',
    'Yellow headlights on the left. The right side, adjacent colors (green and red). Green shows twice: on the right side at the front, and on the back at the left.',
  ], "R U R' U' R' F R2 U R' U' R U R' U' F'", [[2, "R U2 R' U' R U R' U2 r' F R F' M'"], [3, "U F' R U R' U R U' R' U' R' F R U' R U' R' U R U R'"], [4, "U' R' U2 R U R' U R2 U' L' U R' U' L"]]),
  kase('pi', 5, [
    'Faros amarillos a la izquierda. El lado derecho, colores opuestos (verde y azul). Al frente y atrás, las pegatinas que no son amarillas también son opuestas (azul y verde).',
    'Yellow headlights on the left. The right side, opposite colors (green and blue). At the front and the back, the stickers that aren\'t yellow are opposite too (blue and green).',
  ], "R U' L' U R' U L U L' U L", [[2, "U' R U2 R' U R' D' R U2 R' D R2 U' R'"], [3, "U' R U R' U F' R U2 R' U2 R' F R"], [4, "U2 L' U R U' L U' R' U' R U' R'"]]),
  kase('pi', 6, [
    'Faros amarillos a la izquierda. El lado derecho, **faros** rojos. Al frente y atrás, las pegatinas que no son amarillas son opuestas (verde y azul).',
    'Yellow headlights on the left. The right side, red **headlights**. At the front and the back, the stickers that aren\'t yellow are opposite (green and blue).',
  ], "R' F' U' F U' R U S' R' U R S", [[2, "U' r U R' U R' F R F' R U' R' U R U2 r'"], [3, "R U D' R U R' D R2 U' R' U' R2 U2 R"], [4, "R2 D' R U R' D R U R U' R' U R U R' U R"]]),
]);

const u = group('u', ['U', 'U'], [
  'Dos esquinas amarillas arriba, una al lado de la otra; las otras dos miran al mismo lado (**faros** amarillos).',
  'Two yellow corners on top, next to each other; the other two face the same side (yellow **headlights**).',
], [
  kase('u', 1, [
    'Amarillas arriba adelante; faros amarillos atrás. Al frente, **faros** verdes. A la derecha (naranja y azul) y a la izquierda (azul y rojo), colores vecinos.',
    'Yellow on top at the front; yellow headlights at the back. At the front, green **headlights**. On the right (orange and blue) and the left (blue and red), adjacent colors.',
  ], "R' U' R U' R' U2 R2 U R' U R U2 R'", [[2, "U2 R U R' U R U2 R2 U' R U' R' U2 R"], [3, "U R U2 R' U' R U' R' U' R U R' U R U2 R'"], [4, "U' R U R' U' R U' R' U2 R U' R' U2 R U R'"]]),
  kase('u', 2, [
    'Amarillas arriba adelante; faros amarillos atrás. Al frente, **faros** verdes. A la derecha y a la izquierda, colores opuestos (naranja y rojo).',
    'Yellow on top at the front; yellow headlights at the back. At the front, green **headlights**. On the right and the left, opposite colors (orange and red).',
  ], "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R", [[2, "U' r U R' U' r' F R2 U' R' U' R U2 R' U' F'"], [3, "U' R' U' R F R2 D' R U R' D R2 U' F'"], [4, "U F U R U2 R' U R U R2 F' r U R U' r'"]]),
  kase('u', 3, [
    'Amarillas arriba atrás; faros amarillos al frente. Los otros tres lados, colores vecinos. El azul se repite: atrás, a la izquierda, y en el lado izquierdo, adelante.',
    'Yellow on top at the back; yellow headlights at the front. The other three sides, adjacent colors. Blue shows twice: on the back at the left, and on the left side at the front.',
  ], "R2 D R' U2 R D' R' U2 R'", [[2, "U2 L2 D L' U2 L D' L' U2 L'"], [3, "U2 R U' R' U' R U2 R' U' R' D' R U2 R' D R"], [4, "U2 R' U R U R' F' R U R' U' R' F R2 U' R' U' R"]]),
  kase('u', 4, [
    'Amarillas arriba adelante; faros amarillos atrás. Los otros tres lados, colores opuestos.',
    'Yellow on top at the front; yellow headlights at the back. The other three sides, opposite colors.',
  ], "F R U' R' U R U R' U R U' R' F'", [[2, "U2 R' F2 R U2 R U2 R' F2 R U2 R'"], [3, "U' F U2 R' D' R U2 R' D R F'"], [4, "U2 R U2 R' U2 L' U2 R U2 R' U2 L"]]),
  kase('u', 5, [
    'Amarillas arriba adelante; faros amarillos atrás. Los otros tres lados, colores vecinos. El verde se repite: al frente, a la izquierda, y en el lado izquierdo, atrás.',
    'Yellow on top at the front; yellow headlights at the back. The other three sides, adjacent colors. Green shows twice: on the front at the left, and on the left side at the back.',
  ], "R2 D' R U2 R' D R U2 R", [[2, "U2 L2 D' L U2 L' D L U2 L"], [3, "L U' R U' L' U R' U2 L U' L'"], [4, "U2 x R' U R D' R' U2 R D R' U R x'"]]),
  kase('u', 6, [
    'Amarillas arriba adelante; faros amarillos atrás. Al frente, colores opuestos (rojo y naranja). A la derecha (azul y naranja) y a la izquierda (rojo y azul), colores vecinos.',
    'Yellow on top at the front; yellow headlights at the back. At the front, opposite colors (red and orange). On the right (blue and orange) and the left (red and blue), adjacent colors.',
  ], "R2 D' R U R' D R U R U' R' U' R", [[2, "R' U2 R F U' R' U' R U F'"], [3, "R U' R' U' R U R D R' U R D' R2"], [4, "R' U2 R U2 R' F' R U R' U' R' F R2"]]),
]);

const t = group('t', ['T', 'T'], [
  'Dos esquinas amarillas arriba, una al lado de la otra; las otras dos miran a lados opuestos.',
  'Two yellow corners on top, next to each other; the other two face opposite sides.',
], [
  kase('t', 1, [
    'Amarillas arriba adelante; los otros amarillos miran a la derecha y a la izquierda. Al frente, **faros** verdes. Atrás, colores opuestos (naranja y rojo).',
    'Yellow on top at the front; the other yellows face right and left. At the front, green **headlights**. At the back, opposite colors (orange and red).',
  ], "R U2 R' U' R U' R2 U2 R U R' U R", [[2, "U' R U R2 U' R2 U' R2 U2 R U' R U' R'"], [3, "R U2 R' r' F2 r U' R U' R' U' r' F r"], [4, "U' R U R' U R U2 R' L' U' L U' L' U2 L"]]),
  kase('t', 2, [
    'Amarillas arriba adelante; los otros amarillos miran a la derecha y a la izquierda. Al frente, **faros** azules. Atrás, **faros** verdes.',
    'Yellow on top at the front; the other yellows face right and left. At the front, blue **headlights**. At the back, green **headlights**.',
  ], "R' U R U2 R' L' U R U' L", [[2, "R' U R U2 r' R' F R F' r"], [3, "U2 R' F R U R' U' R' F' R2 U' R' U2 R"], [4, "U2 R U' R' U2 L R U' R' U L'"]]),
  kase('t', 3, [
    'Amarillas arriba a la izquierda; los otros amarillos miran al frente y atrás. A la derecha (azul y naranja) y a la izquierda (azul y rojo), colores vecinos. El azul se repite en diagonal: en el lado derecho, adelante, y en el izquierdo, atrás.',
    'Yellow on top on the left; the other yellows face front and back. On the right (blue and orange) and the left (blue and red), adjacent colors. Blue shows twice, crosswise: on the right side at the front, and on the left side at the back.',
  ], "R' F' r U R U' r' F", [[2, "l' U' L U R U' r' F"], [3, "U R' U' R' D' R U R' D R2"], [4, "l' U' L U l F' L' F"]]),
  kase('t', 4, [
    'Amarillas arriba atrás; los otros amarillos miran a la derecha y a la izquierda. Al frente y atrás, colores opuestos (naranja y rojo).',
    'Yellow on top at the back; the other yellows face right and left. At the front and the back, opposite colors (orange and red).',
  ], "F R U R' U' R U' R' U' R U R' F'", [[2, "F R' D' R U2 R' D R U2 F'"], [3, "R F R' U R U2 R' U R U F' R'"], [4, "U' R U2 R' F2 R U2 R' U2 R' F2 R"]]),
  kase('t', 5, [
    'Amarillas arriba a la derecha; los otros amarillos miran al frente y atrás. A la derecha (naranja y azul) y a la izquierda (rojo y azul), colores vecinos. El azul se repite en diagonal: en el lado derecho, atrás, y en el izquierdo, adelante.',
    'Yellow on top on the right; the other yellows face front and back. On the right (orange and blue) and the left (red and blue), adjacent colors. Blue shows twice, crosswise: on the right side at the back, and on the left side at the front.',
  ], "r U R' U' r' F R F'", [[2, "U R U R D R' U' R D' R2"], [3, "U' x' D R U' R' D' R U R' x"], [4, "U R U R' U R' D' R U' R' D R2 U' R'"]], ocll('T')),
  kase('t', 6, [
    'Amarillas arriba adelante; los otros amarillos miran a la derecha y a la izquierda. Al frente, colores opuestos (naranja y rojo). Atrás, **faros** azules.',
    'Yellow on top at the front; the other yellows face right and left. At the front, opposite colors (orange and red). At the back, blue **headlights**.',
  ], "R' U R2 D r' U2 r D' R2 U' R", [[2, "U2 R U' R2 D' r U2 r' D R2 U R'"], [3, "U R' U' R U R2 D' R U2 R' D R2 U' R' U R"], [4, "U R U R' U' R2 D R' U2 R D' R2 U R U' R'"]]),
]);

const l = group('l', ['L', 'L'], [
  'Dos esquinas amarillas arriba, en diagonal. Los dos lados que tocan una de ellas no tienen amarillo: mira esos dos.',
  'Two yellow corners on top, diagonal. The two sides that touch one of them have no yellow: look at those two.',
], [
  kase('l', 1, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: el frente (naranja y azul) y el lado derecho (rojo y verde), los dos con colores vecinos. Ningún color se repite entre esos dos lados.',
    'Yellow on top at the back left and front right. No yellow: the front (orange and blue) and the right side (red and green), both with adjacent colors. No color shows on both of those sides.',
  ], "R U R' U R U' R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U R' U' R U' R'"], [3, "U' R' U2 R U R' U' R U R' U' R U R' U R"], [4, "U R' U' R U' R' U2 R U' R U R' U R U2 R'"]]),
  kase('l', 2, [
    'Amarillas arriba atrás a la derecha y adelante a la izquierda. Sin amarillo: el frente, colores vecinos (verde y rojo), y el lado izquierdo, opuestos (naranja y rojo). El rojo se repite: al frente, a la derecha, y en el lado izquierdo, adelante.',
    'Yellow on top at the back right and front left. No yellow: the front, adjacent colors (green and red), and the left side, opposite (orange and red). Red shows twice: on the front at the right, and on the left side at the front.',
  ], "R' U2 R' D' R U2 R' D R2", [[2, "R U R' U2 L U' R U L' U R'"], [3, "U2 L' U2 L' D' L U2 L' D L2"], [4, "U' R' U2 R U R2 D' R U R' D R2"]]),
  kase('l', 3, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás, colores vecinos (rojo y azul), y el lado izquierdo, opuestos (rojo y naranja). El rojo se repite: atrás, a la derecha, y en el lado izquierdo, atrás.',
    'Yellow on top at the back left and front right. No yellow: the back, adjacent colors (red and blue), and the left side, opposite (red and orange). Red shows twice: on the back at the right, and on the left side at the back.',
  ], "R U2 R D R' U2 R D' R2", [[2, "U R U2 R2 D' R U' R' D R2 U' R'"], [3, "U' R' F' R U R' U' R' F R2 U' R' U2 R"], [4, "R' U' R U2 L' U R' U' L U' R"]]),
  kase('l', 4, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás, colores opuestos (rojo y naranja), y el lado izquierdo, vecinos (azul y rojo). El rojo se repite: atrás, a la derecha, y en el lado izquierdo, adelante.',
    'Yellow on top at the back left and front right. No yellow: the back, opposite colors (red and orange), and the left side, adjacent (blue and red). Red shows twice: on the back at the right, and on the left side at the front.',
  ], "F R' F' r U R U' r'", [[2, "U R2 D R' U R D' R' U' R'"], [3, "U' R U R' U' R' F R U R U' R' F'"], [4, "F l' U' L U R U' r'"]]),
  kase('l', 5, [
    'Amarillas arriba atrás a la derecha y adelante a la izquierda. Sin amarillo: el lado derecho, colores vecinos (naranja y azul), y atrás, opuestos (rojo y naranja). El naranja se repite: en el lado derecho, adelante, y atrás, a la izquierda.',
    'Yellow on top at the back right and front left. No yellow: the right side, adjacent colors (orange and blue), and the back, opposite (red and orange). Orange shows twice: on the right side at the front, and on the back at the left.',
  ], "F' r U R' U' r' F R", [[2, "U' x R' U R D' R' U' R D x'"], [3, "U2 r U R U' r' F R' F'"], [4, "U R2 D' R U' R' D R U R"]]),
  kase('l', 6, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás y el lado izquierdo, los dos con los mismos colores vecinos (verde y rojo).',
    'Yellow on top at the back left and front right. No yellow: the back and the left side, both with the same adjacent colors (green and red).',
  ], "r U2 R2 F R F' R U2 r'", [[2, "U2 R' U' R U R' F' R U R' U' R' F R2"], [4, "F R U R2 F R F' R U' R' F'"]]),
]);

const s = group('s', ['Sune', 'Sune'], [
  'Una esquina amarilla arriba; en los otros tres lados, mirándolos de frente, el amarillo queda a la **derecha**. El lado que no tiene amarillo y el color que se repite dicen el caso.',
  'One yellow corner on top; on the other three sides, looking at each one head-on, the yellow is on the **right**. The side with no yellow and the color that shows twice tell the case.',
], [
  kase('s', 1, [
    'Amarilla arriba adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (verde y naranja). El azul se repite: al frente, a la izquierda, y en el lado derecho, adelante.',
    'Yellow on top at the front left. The left side has no yellow: adjacent colors (green and orange). Blue shows twice: on the front at the left, and on the right side at the front.',
  ], "R U R' U R U2 R'", [[2, "U' R' U2 R U R' U R"], [3, "U L' U2 L U L' U L"], [4, "U2 L U L' U L U2 L'"]], ocll('Sune')),
  kase('s', 2, [
    'Amarilla arriba atrás a la derecha. El lado derecho no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: atrás, a la derecha, y en el lado izquierdo, atrás.',
    'Yellow on top at the back right. The right side has no yellow: opposite colors (blue and green). Orange shows twice: on the back at the right, and on the left side at the back.',
  ], "R U R' U R2 D R' U2 R D' R2", [[2, "U2 r' F2 r U2 R U' r' F M'"], [3, "U2 L' U2 L U2 R U' L' U L R'"], [4, "U2 L' U2 L U2 l F' L' F M'"]]),
  kase('s', 3, [
    'Amarilla arriba adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (rojo y verde). El naranja se repite: al frente, a la izquierda, y atrás, a la derecha.',
    'Yellow on top at the front left. The left side has no yellow: adjacent colors (red and green). Orange shows twice: on the front at the left, and on the back at the right.',
  ], "L' R U R' U' L U2 R U2 R'", [[2, "M F R' F' r U2 R U2 R'"], [3, "U2 R2 D' R U2 R' D R2 U R' U R"], [4, "f R' F' R U2 R U2 R' U2 S'"]]),
  kase('s', 4, [
    'Amarilla arriba adelante a la derecha. El frente no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: en el lado derecho, adelante, y en el lado izquierdo, atrás.',
    'Yellow on top at the front right. The front has no yellow: opposite colors (blue and green). Orange shows twice: on the right side at the front, and on the left side at the back.',
  ], "R U R' U R U' R D R' U' R D' R2", [[2, "U R U R' U' R' F R F' r U R' U R U2 r'"], [3, "F R' U2 R F' R' F U2 F' R"], [4, "U L F' U2 F L' F' L U2 L' F"]]),
  kase('s', 5, [
    'Amarilla arriba adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (naranja y verde). El naranja se repite: al frente, a la izquierda, y en el lado izquierdo, atrás. Su opuesto, el rojo, está atrás, a la derecha.',
    'Yellow on top at the front left. The left side has no yellow: adjacent colors (orange and green). Orange shows twice: on the front at the left, and on the left side at the back. Its opposite, red, is on the back at the right.',
  ], "R U' L' U R' U' L", [[2, "R U' r' F R' F' r"], [3, "l F' L' F l' U' L"], [4, "r U' r' F R' F' r U M"]]),
  kase('s', 6, [
    'Amarilla arriba atrás a la derecha. El lado derecho no tiene amarillo: colores vecinos (rojo y azul). El rojo se repite: en el lado derecho, adelante, y atrás, a la derecha. Su opuesto, el naranja, está en el lado izquierdo, atrás.',
    'Yellow on top at the back right. The right side has no yellow: adjacent colors (red and blue). Red shows twice: on the right side at the front, and on the back at the right. Its opposite, orange, is on the left side at the back.',
  ], "R U R' F' R U R' U R U2 R' F R U' R'", [[2, "R U R' U r' F R F' r U2 R'"], [3, "R U R' U L' U R U' L U2 R'"], [4, "U2 F' R U2 R' U2 R' F2 R U R U' R' F'"]]),
]);

const as = group('as', ['Antisune', 'Antisune'], [
  'Una esquina amarilla arriba; en los otros tres lados, mirándolos de frente, el amarillo queda a la **izquierda**. El lado que no tiene amarillo y el color que se repite dicen el caso.',
  'One yellow corner on top; on the other three sides, looking at each one head-on, the yellow is on the **left**. The side with no yellow and the color that shows twice tell the case.',
], [
  kase('as', 1, [
    'Amarilla arriba atrás a la derecha. Atrás no hay amarillo: colores vecinos (verde y naranja). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás.',
    'Yellow on top at the back right. The back has no yellow: adjacent colors (green and orange). Red shows twice: on the front at the right, and on the right side at the back.',
  ], "R U2 R' U' R U' R'", [[2, "U' R' U' R U' R' U2 R"], [3, "U L' U' L U' L' U2 L"], [4, "U2 L U2 L' U' L U' L'"]], ocll('Antisune')),
  kase('as', 2, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores opuestos (naranja y rojo). El verde se repite: al frente, a la derecha, y atrás, a la izquierda.',
    'Yellow on top at the front right. The right side has no yellow: opposite colors (orange and red). Green shows twice: on the front at the right, and on the back at the left.',
  ], "R2 D R' U R D' R' U R' U' R U' R'", [[2, "U' R' U' R U' R' U R' D' R U R' D R2"], [4, "U2 R U R' f' U' R U2 R' U' R U' R' f R U' R'"]]),
  kase('as', 3, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores vecinos (azul y rojo). El naranja se repite: al frente, a la derecha, y atrás, a la izquierda.',
    'Yellow on top at the front right. The right side has no yellow: adjacent colors (blue and red). Orange shows twice: on the front at the right, and on the back at the left.',
  ], "R2 D R' U2 R D' R2 U' R U' R'", [[2, "U2 R' U' F' R U R' U' R' F R2 U' R' U R"], [3, "M F' r U R' U2 r' F2 r"], [4, "f' L F L' U2 L' U2 L U2 S"]]),
  kase('as', 4, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: al frente, a la derecha, y en el lado izquierdo, adelante.',
    'Yellow on top at the front right. The right side has no yellow: opposite colors (blue and green). Orange shows twice: on the front at the right, and on the left side at the front.',
  ], "R' U' R U' R2 D' R U2 R' D R2", [[2, "R U2 R' U2 r' F R F' M'"], [3, "U2 R' U' R U R' F R U R' U' R' F' R2"], [4, "R U2 R' U2 L' U R U' R' L"]]),
  kase('as', 5, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores vecinos (verde y rojo). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás. Su opuesto, el naranja, está atrás, a la izquierda.',
    'Yellow on top at the front right. The right side has no yellow: adjacent colors (green and red). Red shows twice: on the front at the right, and on the right side at the back. Its opposite, orange, is on the back at the left.',
  ], "r' F R F' r U R'", [[2, "U2 R' U L U' R U L'"], [3, "L' U R U' L U R'"], [4, "R' F R F' r U R' U' M"]]),
  kase('as', 6, [
    'Amarilla arriba atrás a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (rojo y azul). El azul se repite: atrás, a la izquierda, y en el lado izquierdo, adelante. Su opuesto, el verde, está en el lado derecho, atrás.',
    'Yellow on top at the back left. The left side has no yellow: adjacent colors (red and blue). Blue shows twice: on the back at the left, and on the left side at the front. Its opposite, green, is on the right side at the back.',
  ], "R U' R' U2 R U' R' U2 R' D' R U R' D R", [[2, "R U2 r' F R' F' r U' R U' R'"], [3, "R U R' F' R U2 R' U' R U' R' F R U' R'"], [4, "U2 L U2 R' U L' U' R U' L U' L'"]]),
]);

export const coll: Method = {
  id: 'coll',
  name: tr('COLL', 'COLL'),
  summary: tr('Las esquinas de la última capa en un algoritmo cuando la cruz amarilla ya está: 40 casos.', 'The last layer\'s corners in one algorithm once the yellow cross is done: 40 cases.'),
  description: doc([
    'Para cuando terminas el F2L **con la cruz amarilla ya hecha**: las 4 aristas de arriba orientadas.',
    'COLL orienta y coloca las 4 esquinas en un solo algoritmo. Solo quedan las aristas.',
    '## Cuándo usarlo',
    '- En **ZZ**: las aristas se orientan al principio, así que siempre llegas a la última capa con la cruz hecha.',
    '- En **CFOP**: cuando el último par deja la cruz amarilla hecha. Pasa 1 de cada 8 veces, y más si controlas las aristas al meter el último par.',
    '- Si la cruz no está hecha, sigue con la OLL de siempre.',
    '## Qué ahorra',
    '- Con OCLL y PLL, después de la OCLL te puede tocar cualquiera de las 21 PLL.',
    '- Con COLL solo queda una **EPLL**: **Ua**, **Ub**, **H** o **Z**, las únicas PLL que mueven solo aristas. Y 1 de cada 12 veces, nada: la última capa queda resuelta.',
    '- Las EPLL están en **CFOP completo**, fase PLL.',
    '## Cómo reconocer un caso',
    '1. Mira la forma de la OCLL: cuántas esquinas amarillas hay arriba y a dónde miran las demás. Eso te da el grupo.',
    '2. Gira la capa de arriba (AUF) hasta que el amarillo quede como en la figura.',
    '3. Mira las pegatinas de los lados de las esquinas: **faros** (dos iguales en un lado), colores **vecinos** (verde y rojo, por ejemplo) u **opuestos** (verde y azul, rojo y naranja).',
    '4. Las aristas no cuentan: con cualquier mezcla de aristas es el mismo caso.',
    '## Si no hay COLL',
    '- Si las 4 esquinas ya muestran amarillo arriba (1 de cada 27), no hay COLL: pasa directo a la PLL.',
  ], [
    'For when you finish F2L **with the yellow cross already done**: the 4 top edges oriented.',
    'COLL orients and places the 4 corners in a single algorithm. Only the edges are left.',
    '## When to use it',
    '- In **ZZ**: the edges are oriented at the start, so you always reach the last layer with the cross done.',
    '- In **CFOP**: when the last pair leaves the yellow cross done. That happens 1 time in 8, more if you control the edges while inserting the last pair.',
    '- If the cross isn\'t done, go on with the usual OLL.',
    '## What it saves',
    '- With OCLL and PLL, after the OCLL you can get any of the 21 PLLs.',
    '- With COLL only an **EPLL** is left: **Ua**, **Ub**, **H** or **Z**, the only PLLs that move just edges. And 1 time in 12, nothing: the last layer is solved.',
    '- The EPLLs are in **Full CFOP**, PLL phase.',
    '## How to recognize a case',
    '1. Look at the OCLL shape: how many yellow corners are on top and where the others face. That gives you the group.',
    '2. Turn the top layer (AUF) until the yellow looks like the figure.',
    '3. Look at the corners\' side stickers: **headlights** (two matching on one side), **adjacent** colors (green and red, for example) or **opposite** ones (green and blue, red and orange).',
    '4. The edges don\'t count: with any edge mix it\'s the same case.',
    '## When there is no COLL',
    '- If all 4 corners already show yellow on top (1 time in 27), there\'s no COLL: go straight to PLL.',
  ]),
  orientation: tr(
    '**Cruz blanca abajo, amarillo arriba y verde al frente.** Las figuras muestran la cara amarilla desde arriba, con el frente abajo.',
    '**White cross on the bottom, yellow on top and green in front.** The figures show the yellow face from above, with the front at the bottom.',
  ),
  before: { path: '/academia/cfop-completo#academy-cfopc-oll', label: tr('Paso previo: la cruz amarilla (OLL de CFOP completo)', 'Previous step: the yellow cross (Full CFOP\'s OLL)') },
  phases: [
    { id: 'coll-casos', name: tr('Los 40 casos', 'The 40 cases'), diagram: 'top', groups: [h, pi, u, t, l, s, as], quizzes: [] },
  ],
};

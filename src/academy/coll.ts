// "COLL": the last layer's corners in one algorithm when the top edges are already oriented (the yellow cross is done
// with the last F2L pair or OLL's edges), so only an EPLL is left. 40 cases in one phase (one group per OCLL shape),
// stage 'coll': every top sticker yellow and the corners solved relative to each other. Case ids: coll-<slug>;
// SpeedCubeDB: scdbUrl('COLL', 'AS_1').
// Algorithms are SpeedCubeDB's (/a/3x3/COLL, read 2026-10-22): main = #1 with a leading y/y'/y2 dropped (an AUF covers
// it: the edges don't matter here), extras = [rank, alg] with the U turn they need here in place of their leading y.
// Left out: extras that became the main or another extra once their y was dropped (AS 2 #3, L 6 #3, H 1 #3, H 4 #3-#4).
// Recognition texts describe each setup as the diagram shows it (yellow up, green front), side stickers only.
import { doc, tr } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { scdbUrl } from './scdb.ts';
import type { Case, Group, Method } from './types.ts';

type T = [es: string, en: string, pt: string];
type Alt = [rank: number, alg: string];

// group slug -> SpeedCubeDB's set name (codes 'AS 1', ids 'AS_1')
const SET = { h: 'H', pi: 'Pi', u: 'U', t: 'T', l: 'L', s: 'S', as: 'AS' } as const;

function kase(g: keyof typeof SET, n: number, recognition: T, alg: string, alts: Alt[], note?: T): Case {
  const code = `${SET[g]} ${n}`;
  return {
    id: `coll-${g}-${n}`,
    code,
    name: tr(code, code, code),
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
  `É o mesmo algoritmo da OCLL ${name} do CFOP: se você já sabe, este caso sai de graça.`,
];

const h = group('h', ['H', 'H', 'H'], [
  'Ninguna amarilla arriba: **faros** amarillos en dos lados opuestos.',
  'No yellow on top: yellow **headlights** on two opposite sides.',
  'Nenhuma amarela em cima: **faróis** amarelos em dois lados opostos.',
], [
  kase('h', 1, [
    'Faros amarillos a la derecha y a la izquierda. Al frente y atrás, colores opuestos (rojo y naranja), sin faros.',
    'Yellow headlights on the right and on the left. At the front and the back, opposite colors (red and orange), no headlights.',
    'Faróis amarelos na direita e na esquerda. Na frente e atrás, cores opostas (vermelho e laranja), sem faróis.',
  ], "R U R' U R U' R' U R U2 R'", [[2, "U R U2 R' U' R U R' U' R U' R'"], [4, "U R' U2 R U R' U' R U R' U R"]], ocll('H')),
  kase('h', 2, [
    'Faros amarillos a la derecha y a la izquierda. Al frente, colores opuestos (naranja y rojo); atrás, **faros** verdes.',
    'Yellow headlights on the right and on the left. At the front, opposite colors (orange and red); at the back, green **headlights**.',
    'Faróis amarelos na direita e na esquerda. Na frente, cores opostas (laranja e vermelho); atrás, **faróis** verdes.',
  ], "F R U' R' U R U2 R' U' R U R' U' F'", [[2, "f R2 S' U' R2 U' R2 U R2 F'"], [3, "U2 f R U R' U' R F' R U R' U' R' S'"], [4, "f R U R' U' f' R U R' U' R' F R F'"]]),
  kase('h', 3, [
    'Faros amarillos a la derecha y a la izquierda. Al frente (rojo y azul) y atrás (verde y rojo), colores vecinos.',
    'Yellow headlights on the right and on the left. At the front (red and blue) and the back (green and red), adjacent colors.',
    'Faróis amarelos na direita e na esquerda. Na frente (vermelho e azul) e atrás (verde e vermelho), cores vizinhas.',
  ], "R U R' U R U L' U R' U' L", [[2, "R U R' U R U r' F R' F' r"], [3, "R' F' R U2 R U2 R' F U' R U' R'"], [4, "R U R2 D' R U2 R' D R U' R U2 R'"]]),
  kase('h', 4, [
    'Faros amarillos al frente y atrás. A la derecha (rojos) y a la izquierda (naranjas), también **faros**.',
    'Yellow headlights at the front and the back. On the right (red) and the left (orange), **headlights** too.',
    'Faróis amarelos na frente e atrás. Na direita (vermelhos) e na esquerda (laranja), também **faróis**.',
  ], "F R U R' U' R U R' U' R U R' U' F'", [[2, "F U R U' R' U R U' R' U R U' R' F'"]]),
]);

const pi = group('pi', ['Pi', 'Pi', 'Pi'], [
  'Ninguna amarilla arriba: **faros** amarillos en un lado; el lado de enfrente, sin amarillo.',
  'No yellow on top: yellow **headlights** on one side; the side across, no yellow.',
  'Nenhuma amarela em cima: **faróis** amarelos num lado; o lado oposto, sem amarelo.',
], [
  kase('pi', 1, [
    'Faros amarillos a la izquierda. El lado derecho, colores opuestos (azul y verde). Al frente y atrás, la pegatina que no es amarilla es del mismo color (naranja).',
    'Yellow headlights on the left. The right side, opposite colors (blue and green). At the front and the back, the sticker that isn\'t yellow is the same color (orange).',
    'Faróis amarelos na esquerda. O lado direito, cores opostas (azul e verde). Na frente e atrás, o adesivo que não é amarelo é da mesma cor (laranja).',
  ], "R U2 R2 U' R2 U' R2 U2 R", [[2, "R' U2 R2 U R2 U R2 U2 R'"], [3, "U2 L' U2 L2 U L2 U L2 U2 L'"], [4, "R U R' U R U2 R' U' R U R' U R U2 R'"]], ocll('Pi')),
  kase('pi', 2, [
    'Faros amarillos atrás. El frente, colores vecinos (azul y naranja). El naranja se repite: en el frente, a la derecha, y en el lado izquierdo, atrás.',
    'Yellow headlights at the back. The front, adjacent colors (blue and orange). Orange shows twice: on the front at the right, and on the left side at the back.',
    'Faróis amarelos atrás. A frente, cores vizinhas (azul e laranja). O laranja se repete: na frente, à direita, e no lado esquerdo, atrás.',
  ], "F U R U' R' U R U' R2 F' R U R U' R'", [[2, "U' R' F2 R U2 R U2 R' F2 U' R U' R'"], [3, "U L' U' L U L F' L2 U' L U L' U' L U F"], [4, "U' R U R' U R' F R2 U' R' U' R U R' F' U R U' R'"]]),
  kase('pi', 3, [
    'Faros amarillos a la izquierda. El lado derecho, **faros** naranjas. Al frente y atrás, la pegatina que no es amarilla es del mismo color (rojo).',
    'Yellow headlights on the left. The right side, orange **headlights**. At the front and the back, the sticker that isn\'t yellow is the same color (red).',
    'Faróis amarelos na esquerda. O lado direito, **faróis** laranja. Na frente e atrás, o adesivo que não é amarelo é da mesma cor (vermelho).',
  ], "R' U' F' R U R' U' R' F R2 U2 R' U2 R", [[2, "U F U R U' R' U R U2 R' U' R U R' F'"], [3, "U F R2 U' R2 U R2 U S R2 f'"], [4, "U' R U R' U R U2 R2 F' r U R U' r' F"]]),
  kase('pi', 4, [
    'Faros amarillos a la izquierda. El lado derecho, colores vecinos (verde y rojo). El verde se repite: en el lado derecho, adelante, y atrás, a la izquierda.',
    'Yellow headlights on the left. The right side, adjacent colors (green and red). Green shows twice: on the right side at the front, and on the back at the left.',
    'Faróis amarelos na esquerda. O lado direito, cores vizinhas (verde e vermelho). O verde se repete: no lado direito, na frente, e atrás, à esquerda.',
  ], "R U R' U' R' F R2 U R' U' R U R' U' F'", [[2, "R U2 R' U' R U R' U2 r' F R F' M'"], [3, "U F' R U R' U R U' R' U' R' F R U' R U' R' U R U R'"], [4, "U' R' U2 R U R' U R2 U' L' U R' U' L"]]),
  kase('pi', 5, [
    'Faros amarillos a la izquierda. El lado derecho, colores opuestos (verde y azul). Al frente y atrás, las pegatinas que no son amarillas también son opuestas (azul y verde).',
    'Yellow headlights on the left. The right side, opposite colors (green and blue). At the front and the back, the stickers that aren\'t yellow are opposite too (blue and green).',
    'Faróis amarelos na esquerda. O lado direito, cores opostas (verde e azul). Na frente e atrás, os adesivos que não são amarelos também são opostos (azul e verde).',
  ], "R U' L' U R' U L U L' U L", [[2, "U' R U2 R' U R' D' R U2 R' D R2 U' R'"], [3, "U' R U R' U F' R U2 R' U2 R' F R"], [4, "U2 L' U R U' L U' R' U' R U' R'"]]),
  kase('pi', 6, [
    'Faros amarillos a la izquierda. El lado derecho, **faros** rojos. Al frente y atrás, las pegatinas que no son amarillas son opuestas (verde y azul).',
    'Yellow headlights on the left. The right side, red **headlights**. At the front and the back, the stickers that aren\'t yellow are opposite (green and blue).',
    'Faróis amarelos na esquerda. O lado direito, **faróis** vermelhos. Na frente e atrás, os adesivos que não são amarelos são opostos (verde e azul).',
  ], "R' F' U' F U' R U S' R' U R S", [[2, "U' r U R' U R' F R F' R U' R' U R U2 r'"], [3, "R U D' R U R' D R2 U' R' U' R2 U2 R"], [4, "R2 D' R U R' D R U R U' R' U R U R' U R"]]),
]);

const u = group('u', ['U', 'U', 'U'], [
  'Dos amarillas arriba, vecinas; las otras dos miran al mismo lado (**faros** amarillos).',
  'Two yellows on top, side by side; the other two face the same side (yellow **headlights**).',
  'Duas amarelas em cima, vizinhas; as outras duas olham para o mesmo lado (**faróis** amarelos).',
], [
  kase('u', 1, [
    'Amarillas arriba adelante; faros amarillos atrás. Al frente, **faros** verdes. A la derecha (naranja y azul) y a la izquierda (azul y rojo), colores vecinos.',
    'Yellow on top at the front; yellow headlights at the back. At the front, green **headlights**. On the right (orange and blue) and the left (blue and red), adjacent colors.',
    'Amarelas em cima na frente; faróis amarelos atrás. Na frente, **faróis** verdes. Na direita (laranja e azul) e na esquerda (azul e vermelho), cores vizinhas.',
  ], "R' U' R U' R' U2 R2 U R' U R U2 R'", [[2, "U2 R U R' U R U2 R2 U' R U' R' U2 R"], [3, "U R U2 R' U' R U' R' U' R U R' U R U2 R'"], [4, "U' R U R' U' R U' R' U2 R U' R' U2 R U R'"]]),
  kase('u', 2, [
    'Amarillas arriba adelante; faros amarillos atrás. Al frente, **faros** verdes. A la derecha y a la izquierda, colores opuestos (naranja y rojo).',
    'Yellow on top at the front; yellow headlights at the back. At the front, green **headlights**. On the right and the left, opposite colors (orange and red).',
    'Amarelas em cima na frente; faróis amarelos atrás. Na frente, **faróis** verdes. Na direita e na esquerda, cores opostas (laranja e vermelho).',
  ], "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R", [[2, "U' r U R' U' r' F R2 U' R' U' R U2 R' U' F'"], [3, "U' R' U' R F R2 D' R U R' D R2 U' F'"], [4, "U F U R U2 R' U R U R2 F' r U R U' r'"]]),
  kase('u', 3, [
    'Amarillas arriba atrás; faros amarillos al frente. Los otros tres lados, colores vecinos. El azul se repite: atrás, a la izquierda, y en el lado izquierdo, adelante.',
    'Yellow on top at the back; yellow headlights at the front. The other three sides, adjacent colors. Blue shows twice: on the back at the left, and on the left side at the front.',
    'Amarelas em cima atrás; faróis amarelos na frente. Os outros três lados, cores vizinhas. O azul se repete: atrás, à esquerda, e no lado esquerdo, na frente.',
  ], "R2 D R' U2 R D' R' U2 R'", [[2, "U2 L2 D L' U2 L D' L' U2 L'"], [3, "U2 R U' R' U' R U2 R' U' R' D' R U2 R' D R"], [4, "U2 R' U R U R' F' R U R' U' R' F R2 U' R' U' R"]]),
  kase('u', 4, [
    'Amarillas arriba adelante; faros amarillos atrás. Los otros tres lados, colores opuestos.',
    'Yellow on top at the front; yellow headlights at the back. The other three sides, opposite colors.',
    'Amarelas em cima na frente; faróis amarelos atrás. Os outros três lados, cores opostas.',
  ], "F R U' R' U R U R' U R U' R' F'", [[2, "U2 R' F2 R U2 R U2 R' F2 R U2 R'"], [3, "U' F U2 R' D' R U2 R' D R F'"], [4, "U2 R U2 R' U2 L' U2 R U2 R' U2 L"]]),
  kase('u', 5, [
    'Amarillas arriba adelante; faros amarillos atrás. Los otros tres lados, colores vecinos. El verde se repite: al frente, a la izquierda, y en el lado izquierdo, atrás.',
    'Yellow on top at the front; yellow headlights at the back. The other three sides, adjacent colors. Green shows twice: on the front at the left, and on the left side at the back.',
    'Amarelas em cima na frente; faróis amarelos atrás. Os outros três lados, cores vizinhas. O verde se repete: na frente, à esquerda, e no lado esquerdo, atrás.',
  ], "R2 D' R U2 R' D R U2 R", [[2, "U2 L2 D' L U2 L' D L U2 L"], [3, "L U' R U' L' U R' U2 L U' L'"], [4, "U2 x R' U R D' R' U2 R D R' U R x'"]]),
  kase('u', 6, [
    'Amarillas arriba adelante; faros amarillos atrás. Al frente, colores opuestos (rojo y naranja). A la derecha (azul y naranja) y a la izquierda (rojo y azul), colores vecinos.',
    'Yellow on top at the front; yellow headlights at the back. At the front, opposite colors (red and orange). On the right (blue and orange) and the left (red and blue), adjacent colors.',
    'Amarelas em cima na frente; faróis amarelos atrás. Na frente, cores opostas (vermelho e laranja). Na direita (azul e laranja) e na esquerda (vermelho e azul), cores vizinhas.',
  ], "R2 D' R U R' D R U R U' R' U' R", [[2, "R' U2 R F U' R' U' R U F'"], [3, "R U' R' U' R U R D R' U R D' R2"], [4, "R' U2 R U2 R' F' R U R' U' R' F R2"]]),
]);

const t = group('t', ['T', 'T', 'T'], [
  'Dos amarillas arriba, vecinas; las otras dos miran a lados opuestos.',
  'Two yellows on top, side by side; the other two face opposite sides.',
  'Duas amarelas em cima, vizinhas; as outras duas olham para lados opostos.',
], [
  kase('t', 1, [
    'Amarillas arriba adelante; los otros amarillos miran a la derecha y a la izquierda. Al frente, **faros** verdes. Atrás, colores opuestos (naranja y rojo).',
    'Yellow on top at the front; the other yellows face right and left. At the front, green **headlights**. At the back, opposite colors (orange and red).',
    'Amarelas em cima na frente; os outros amarelos olham para a direita e para a esquerda. Na frente, **faróis** verdes. Atrás, cores opostas (laranja e vermelho).',
  ], "R U2 R' U' R U' R2 U2 R U R' U R", [[2, "U' R U R2 U' R2 U' R2 U2 R U' R U' R'"], [3, "R U2 R' r' F2 r U' R U' R' U' r' F r"], [4, "U' R U R' U R U2 R' L' U' L U' L' U2 L"]]),
  kase('t', 2, [
    'Amarillas arriba adelante; los otros amarillos miran a la derecha y a la izquierda. Al frente, **faros** azules. Atrás, **faros** verdes.',
    'Yellow on top at the front; the other yellows face right and left. At the front, blue **headlights**. At the back, green **headlights**.',
    'Amarelas em cima na frente; os outros amarelos olham para a direita e para a esquerda. Na frente, **faróis** azuis. Atrás, **faróis** verdes.',
  ], "R' U R U2 R' L' U R U' L", [[2, "R' U R U2 r' R' F R F' r"], [3, "U2 R' F R U R' U' R' F' R2 U' R' U2 R"], [4, "U2 R U' R' U2 L R U' R' U L'"]]),
  kase('t', 3, [
    'Amarillas arriba a la izquierda; los otros amarillos miran al frente y atrás. A la derecha (azul y naranja) y a la izquierda (azul y rojo), colores vecinos. El azul se repite en diagonal: en el lado derecho, adelante, y en el izquierdo, atrás.',
    'Yellow on top on the left; the other yellows face front and back. On the right (blue and orange) and the left (blue and red), adjacent colors. Blue shows twice, crosswise: on the right side at the front, and on the left side at the back.',
    'Amarelas em cima à esquerda; os outros amarelos olham para a frente e para trás. Na direita (azul e laranja) e na esquerda (azul e vermelho), cores vizinhas. O azul se repete na diagonal: no lado direito, na frente, e no esquerdo, atrás.',
  ], "R' F' r U R U' r' F", [[2, "l' U' L U R U' r' F"], [3, "U R' U' R' D' R U R' D R2"], [4, "l' U' L U l F' L' F"]]),
  kase('t', 4, [
    'Amarillas arriba atrás; los otros amarillos miran a la derecha y a la izquierda. Al frente y atrás, colores opuestos (naranja y rojo).',
    'Yellow on top at the back; the other yellows face right and left. At the front and the back, opposite colors (orange and red).',
    'Amarelas em cima atrás; os outros amarelos olham para a direita e para a esquerda. Na frente e atrás, cores opostas (laranja e vermelho).',
  ], "F R U R' U' R U' R' U' R U R' F'", [[2, "F R' D' R U2 R' D R U2 F'"], [3, "R F R' U R U2 R' U R U F' R'"], [4, "U' R U2 R' F2 R U2 R' U2 R' F2 R"]]),
  kase('t', 5, [
    'Amarillas arriba a la derecha; los otros amarillos miran al frente y atrás. A la derecha (naranja y azul) y a la izquierda (rojo y azul), colores vecinos. El azul se repite en diagonal: en el lado derecho, atrás, y en el izquierdo, adelante.',
    'Yellow on top on the right; the other yellows face front and back. On the right (orange and blue) and the left (red and blue), adjacent colors. Blue shows twice, crosswise: on the right side at the back, and on the left side at the front.',
    'Amarelas em cima à direita; os outros amarelos olham para a frente e para trás. Na direita (laranja e azul) e na esquerda (vermelho e azul), cores vizinhas. O azul se repete na diagonal: no lado direito, atrás, e no esquerdo, na frente.',
  ], "r U R' U' r' F R F'", [[2, "U R U R D R' U' R D' R2"], [3, "U' x' D R U' R' D' R U R' x"], [4, "U R U R' U R' D' R U' R' D R2 U' R'"]], ocll('T')),
  kase('t', 6, [
    'Amarillas arriba adelante; los otros amarillos miran a la derecha y a la izquierda. Al frente, colores opuestos (naranja y rojo). Atrás, **faros** azules.',
    'Yellow on top at the front; the other yellows face right and left. At the front, opposite colors (orange and red). At the back, blue **headlights**.',
    'Amarelas em cima na frente; os outros amarelos olham para a direita e para a esquerda. Na frente, cores opostas (laranja e vermelho). Atrás, **faróis** azuis.',
  ], "R' U R2 D r' U2 r D' R2 U' R", [[2, "U2 R U' R2 D' r U2 r' D R2 U R'"], [3, "U R' U' R U R2 D' R U2 R' D R2 U' R' U R"], [4, "U R U R' U' R2 D R' U2 R D' R2 U R U' R'"]]),
]);

const l = group('l', ['L', 'L', 'L'], [
  'Dos amarillas arriba, en diagonal. Mira los dos lados sin amarillo.',
  'Two yellows on top, diagonal. Look at the two sides with no yellow.',
  'Duas amarelas em cima, na diagonal. Olhe os dois lados sem amarelo.',
], [
  kase('l', 1, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: el frente (naranja y azul) y el lado derecho (rojo y verde), los dos con colores vecinos. Ningún color se repite entre esos dos lados.',
    'Yellow on top at the back left and front right. No yellow: the front (orange and blue) and the right side (red and green), both with adjacent colors. No color shows on both of those sides.',
    'Amarelas em cima atrás à esquerda e na frente à direita. Sem amarelo: a frente (laranja e azul) e o lado direito (vermelho e verde), os dois com cores vizinhas. Nenhuma cor se repete entre esses dois lados.',
  ], "R U R' U R U' R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U R' U' R U' R'"], [3, "U' R' U2 R U R' U' R U R' U' R U R' U R"], [4, "U R' U' R U' R' U2 R U' R U R' U R U2 R'"]]),
  kase('l', 2, [
    'Amarillas arriba atrás a la derecha y adelante a la izquierda. Sin amarillo: el frente, colores vecinos (verde y rojo), y el lado izquierdo, opuestos (naranja y rojo). El rojo se repite: al frente, a la derecha, y en el lado izquierdo, adelante.',
    'Yellow on top at the back right and front left. No yellow: the front, adjacent colors (green and red), and the left side, opposite (orange and red). Red shows twice: on the front at the right, and on the left side at the front.',
    'Amarelas em cima atrás à direita e na frente à esquerda. Sem amarelo: a frente, cores vizinhas (verde e vermelho), e o lado esquerdo, opostas (laranja e vermelho). O vermelho se repete: na frente, à direita, e no lado esquerdo, na frente.',
  ], "R' U2 R' D' R U2 R' D R2", [[2, "R U R' U2 L U' R U L' U R'"], [3, "U2 L' U2 L' D' L U2 L' D L2"], [4, "U' R' U2 R U R2 D' R U R' D R2"]]),
  kase('l', 3, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás, colores vecinos (rojo y azul), y el lado izquierdo, opuestos (rojo y naranja). El rojo se repite: atrás, a la derecha, y en el lado izquierdo, atrás.',
    'Yellow on top at the back left and front right. No yellow: the back, adjacent colors (red and blue), and the left side, opposite (red and orange). Red shows twice: on the back at the right, and on the left side at the back.',
    'Amarelas em cima atrás à esquerda e na frente à direita. Sem amarelo: atrás, cores vizinhas (vermelho e azul), e o lado esquerdo, opostas (vermelho e laranja). O vermelho se repete: atrás, à direita, e no lado esquerdo, atrás.',
  ], "R U2 R D R' U2 R D' R2", [[2, "U R U2 R2 D' R U' R' D R2 U' R'"], [3, "U' R' F' R U R' U' R' F R2 U' R' U2 R"], [4, "R' U' R U2 L' U R' U' L U' R"]]),
  kase('l', 4, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás, colores opuestos (rojo y naranja), y el lado izquierdo, vecinos (azul y rojo). El rojo se repite: atrás, a la derecha, y en el lado izquierdo, adelante.',
    'Yellow on top at the back left and front right. No yellow: the back, opposite colors (red and orange), and the left side, adjacent (blue and red). Red shows twice: on the back at the right, and on the left side at the front.',
    'Amarelas em cima atrás à esquerda e na frente à direita. Sem amarelo: atrás, cores opostas (vermelho e laranja), e o lado esquerdo, vizinhas (azul e vermelho). O vermelho se repete: atrás, à direita, e no lado esquerdo, na frente.',
  ], "F R' F' r U R U' r'", [[2, "U R2 D R' U R D' R' U' R'"], [3, "U' R U R' U' R' F R U R U' R' F'"], [4, "F l' U' L U R U' r'"]]),
  kase('l', 5, [
    'Amarillas arriba atrás a la derecha y adelante a la izquierda. Sin amarillo: el lado derecho, colores vecinos (naranja y azul), y atrás, opuestos (rojo y naranja). El naranja se repite: en el lado derecho, adelante, y atrás, a la izquierda.',
    'Yellow on top at the back right and front left. No yellow: the right side, adjacent colors (orange and blue), and the back, opposite (red and orange). Orange shows twice: on the right side at the front, and on the back at the left.',
    'Amarelas em cima atrás à direita e na frente à esquerda. Sem amarelo: o lado direito, cores vizinhas (laranja e azul), e atrás, opostas (vermelho e laranja). O laranja se repete: no lado direito, na frente, e atrás, à esquerda.',
  ], "F' r U R' U' r' F R", [[2, "U' x R' U R D' R' U' R D x'"], [3, "U2 r U R U' r' F R' F'"], [4, "U R2 D' R U' R' D R U R"]]),
  kase('l', 6, [
    'Amarillas arriba atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás y el lado izquierdo, los dos con los mismos colores vecinos (verde y rojo).',
    'Yellow on top at the back left and front right. No yellow: the back and the left side, both with the same adjacent colors (green and red).',
    'Amarelas em cima atrás à esquerda e na frente à direita. Sem amarelo: atrás e o lado esquerdo, os dois com as mesmas cores vizinhas (verde e vermelho).',
  ], "r U2 R2 F R F' R U2 r'", [[2, "U2 R' U' R U R' F' R U R' U' R' F R2"], [4, "F R U R2 F R F' R U' R' F'"]]),
]);

const s = group('s', ['Sune', 'Sune', 'Sune'], [
  'Una amarilla arriba; en los lados con amarillo, de frente, queda a la **derecha**. Mira el lado sin amarillo y el color repetido.',
  'One yellow on top; on the sides with yellow, head-on, it is on the **right**. Look at the side with no yellow and the color that shows twice.',
  'Uma amarela em cima; nos lados com amarelo, de frente, ele fica à **direita**. Olhe o lado sem amarelo e a cor repetida.',
], [
  kase('s', 1, [
    'Amarilla arriba adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (verde y naranja). El azul se repite: al frente, a la izquierda, y en el lado derecho, adelante.',
    'Yellow on top at the front left. The left side has no yellow: adjacent colors (green and orange). Blue shows twice: on the front at the left, and on the right side at the front.',
    'Amarela em cima na frente à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (verde e laranja). O azul se repete: na frente, à esquerda, e no lado direito, na frente.',
  ], "R U R' U R U2 R'", [[2, "U' R' U2 R U R' U R"], [3, "U L' U2 L U L' U L"], [4, "U2 L U L' U L U2 L'"]], ocll('Sune')),
  kase('s', 2, [
    'Amarilla arriba atrás a la derecha. El lado derecho no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: atrás, a la derecha, y en el lado izquierdo, atrás.',
    'Yellow on top at the back right. The right side has no yellow: opposite colors (blue and green). Orange shows twice: on the back at the right, and on the left side at the back.',
    'Amarela em cima atrás à direita. O lado direito não tem amarelo: cores opostas (azul e verde). O laranja se repete: atrás, à direita, e no lado esquerdo, atrás.',
  ], "R U R' U R2 D R' U2 R D' R2", [[2, "U2 r' F2 r U2 R U' r' F M'"], [3, "U2 L' U2 L U2 R U' L' U L R'"], [4, "U2 L' U2 L U2 l F' L' F M'"]]),
  kase('s', 3, [
    'Amarilla arriba adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (rojo y verde). El naranja se repite: al frente, a la izquierda, y atrás, a la derecha.',
    'Yellow on top at the front left. The left side has no yellow: adjacent colors (red and green). Orange shows twice: on the front at the left, and on the back at the right.',
    'Amarela em cima na frente à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (vermelho e verde). O laranja se repete: na frente, à esquerda, e atrás, à direita.',
  ], "L' R U R' U' L U2 R U2 R'", [[2, "M F R' F' r U2 R U2 R'"], [3, "U2 R2 D' R U2 R' D R2 U R' U R"], [4, "f R' F' R U2 R U2 R' U2 S'"]]),
  kase('s', 4, [
    'Amarilla arriba adelante a la derecha. El frente no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: en el lado derecho, adelante, y en el lado izquierdo, atrás.',
    'Yellow on top at the front right. The front has no yellow: opposite colors (blue and green). Orange shows twice: on the right side at the front, and on the left side at the back.',
    'Amarela em cima na frente à direita. A frente não tem amarelo: cores opostas (azul e verde). O laranja se repete: no lado direito, na frente, e no lado esquerdo, atrás.',
  ], "R U R' U R U' R D R' U' R D' R2", [[2, "U R U R' U' R' F R F' r U R' U R U2 r'"], [3, "F R' U2 R F' R' F U2 F' R"], [4, "U L F' U2 F L' F' L U2 L' F"]]),
  kase('s', 5, [
    'Amarilla arriba adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (naranja y verde). El naranja se repite: al frente, a la izquierda, y en el lado izquierdo, atrás. Su opuesto, el rojo, está atrás, a la derecha.',
    'Yellow on top at the front left. The left side has no yellow: adjacent colors (orange and green). Orange shows twice: on the front at the left, and on the left side at the back. Its opposite, red, is on the back at the right.',
    'Amarela em cima na frente à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (laranja e verde). O laranja se repete: na frente, à esquerda, e no lado esquerdo, atrás. O oposto dele, o vermelho, está atrás, à direita.',
  ], "R U' L' U R' U' L", [[2, "R U' r' F R' F' r"], [3, "l F' L' F l' U' L"], [4, "r U' r' F R' F' r U M"]]),
  kase('s', 6, [
    'Amarilla arriba atrás a la derecha. El lado derecho no tiene amarillo: colores vecinos (rojo y azul). El rojo se repite: en el lado derecho, adelante, y atrás, a la derecha. Su opuesto, el naranja, está en el lado izquierdo, atrás.',
    'Yellow on top at the back right. The right side has no yellow: adjacent colors (red and blue). Red shows twice: on the right side at the front, and on the back at the right. Its opposite, orange, is on the left side at the back.',
    'Amarela em cima atrás à direita. O lado direito não tem amarelo: cores vizinhas (vermelho e azul). O vermelho se repete: no lado direito, na frente, e atrás, à direita. O oposto dele, o laranja, está no lado esquerdo, atrás.',
  ], "R U R' F' R U R' U R U2 R' F R U' R'", [[2, "R U R' U r' F R F' r U2 R'"], [3, "R U R' U L' U R U' L U2 R'"], [4, "U2 F' R U2 R' U2 R' F2 R U R U' R' F'"]]),
]);

const as = group('as', ['Antisune', 'Antisune', 'Antisune'], [
  'Una amarilla arriba; en los lados con amarillo, de frente, queda a la **izquierda**. Mira el lado sin amarillo y el color repetido.',
  'One yellow on top; on the sides with yellow, head-on, it is on the **left**. Look at the side with no yellow and the color that shows twice.',
  'Uma amarela em cima; nos lados com amarelo, de frente, ele fica à **esquerda**. Olhe o lado sem amarelo e a cor repetida.',
], [
  kase('as', 1, [
    'Amarilla arriba atrás a la derecha. Atrás no hay amarillo: colores vecinos (verde y naranja). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás.',
    'Yellow on top at the back right. The back has no yellow: adjacent colors (green and orange). Red shows twice: on the front at the right, and on the right side at the back.',
    'Amarela em cima atrás à direita. Atrás não há amarelo: cores vizinhas (verde e laranja). O vermelho se repete: na frente, à direita, e no lado direito, atrás.',
  ], "R U2 R' U' R U' R'", [[2, "U' R' U' R U' R' U2 R"], [3, "U L' U' L U' L' U2 L"], [4, "U2 L U2 L' U' L U' L'"]], ocll('Antisune')),
  kase('as', 2, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores opuestos (naranja y rojo). El verde se repite: al frente, a la derecha, y atrás, a la izquierda.',
    'Yellow on top at the front right. The right side has no yellow: opposite colors (orange and red). Green shows twice: on the front at the right, and on the back at the left.',
    'Amarela em cima na frente à direita. O lado direito não tem amarelo: cores opostas (laranja e vermelho). O verde se repete: na frente, à direita, e atrás, à esquerda.',
  ], "R2 D R' U R D' R' U R' U' R U' R'", [[2, "U' R' U' R U' R' U R' D' R U R' D R2"], [4, "U2 R U R' f' U' R U2 R' U' R U' R' f R U' R'"]]),
  kase('as', 3, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores vecinos (azul y rojo). El naranja se repite: al frente, a la derecha, y atrás, a la izquierda.',
    'Yellow on top at the front right. The right side has no yellow: adjacent colors (blue and red). Orange shows twice: on the front at the right, and on the back at the left.',
    'Amarela em cima na frente à direita. O lado direito não tem amarelo: cores vizinhas (azul e vermelho). O laranja se repete: na frente, à direita, e atrás, à esquerda.',
  ], "R2 D R' U2 R D' R2 U' R U' R'", [[2, "U2 R' U' F' R U R' U' R' F R2 U' R' U R"], [3, "M F' r U R' U2 r' F2 r"], [4, "f' L F L' U2 L' U2 L U2 S"]]),
  kase('as', 4, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: al frente, a la derecha, y en el lado izquierdo, adelante.',
    'Yellow on top at the front right. The right side has no yellow: opposite colors (blue and green). Orange shows twice: on the front at the right, and on the left side at the front.',
    'Amarela em cima na frente à direita. O lado direito não tem amarelo: cores opostas (azul e verde). O laranja se repete: na frente, à direita, e no lado esquerdo, na frente.',
  ], "R' U' R U' R2 D' R U2 R' D R2", [[2, "R U2 R' U2 r' F R F' M'"], [3, "U2 R' U' R U R' F R U R' U' R' F' R2"], [4, "R U2 R' U2 L' U R U' R' L"]]),
  kase('as', 5, [
    'Amarilla arriba adelante a la derecha. El lado derecho no tiene amarillo: colores vecinos (verde y rojo). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás. Su opuesto, el naranja, está atrás, a la izquierda.',
    'Yellow on top at the front right. The right side has no yellow: adjacent colors (green and red). Red shows twice: on the front at the right, and on the right side at the back. Its opposite, orange, is on the back at the left.',
    'Amarela em cima na frente à direita. O lado direito não tem amarelo: cores vizinhas (verde e vermelho). O vermelho se repete: na frente, à direita, e no lado direito, atrás. O oposto dele, o laranja, está atrás, à esquerda.',
  ], "r' F R F' r U R'", [[2, "U2 R' U L U' R U L'"], [3, "L' U R U' L U R'"], [4, "R' F R F' r U R' U' M"]]),
  kase('as', 6, [
    'Amarilla arriba atrás a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (rojo y azul). El azul se repite: atrás, a la izquierda, y en el lado izquierdo, adelante. Su opuesto, el verde, está en el lado derecho, atrás.',
    'Yellow on top at the back left. The left side has no yellow: adjacent colors (red and blue). Blue shows twice: on the back at the left, and on the left side at the front. Its opposite, green, is on the right side at the back.',
    'Amarela em cima atrás à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (vermelho e azul). O azul se repete: atrás, à esquerda, e no lado esquerdo, na frente. O oposto dele, o verde, está no lado direito, atrás.',
  ], "R U' R' U2 R U' R' U2 R' D' R U R' D R", [[2, "R U2 r' F R' F' r U' R U' R'"], [3, "R U R' F' R U2 R' U' R U' R' F R U' R'"], [4, "U2 L U2 R' U L' U' R U' L U' L'"]]),
]);

// The method's text says when COLL pays off; the phase teaches it as the beginner's (types.ts): the goal, the steps to
// recognize a case, and what to do when something goes wrong, folded.
export const coll: Method = {
  id: 'coll',
  name: tr('COLL', 'COLL', 'COLL'),
  summary: tr('Las esquinas de la última capa en un algoritmo cuando la cruz amarilla ya está: 40 casos.', 'The last layer\'s corners in one algorithm once the yellow cross is done: 40 cases.', 'As quinas da última camada num algoritmo quando a cruz amarela já está feita: 40 casos.'),
  description: doc([
    'Para cuando terminas el F2L **con la cruz amarilla ya hecha**. COLL orienta y coloca las 4 esquinas en un algoritmo: solo queda una **EPLL** (Ua, Ub, H o Z), y 1 de cada 12 veces, nada.',
    '## Cuándo usarlo',
    '- **En ZZ:** siempre, porque las aristas se orientan al principio y llegas con la cruz hecha.',
    '- **En CFOP:** cuando el último par deja la cruz hecha, 1 de cada 8 veces. Si no, haz la OLL de siempre.',
    '- **Sin COLL:** si las 4 esquinas ya tienen el amarillo arriba (1 de cada 27), pasa directo a la PLL.',
    'Las EPLL están en **CFOP completo**, fase PLL.',
  ], [
    'For when you finish F2L **with the yellow cross already done**. COLL orients and places the 4 corners in one algorithm: only an **EPLL** is left (Ua, Ub, H or Z), and 1 time in 12, nothing.',
    '## When to use it',
    '- **In ZZ:** always, because the edges are oriented at the start and you arrive with the cross done.',
    "- **In CFOP:** when the last pair leaves the cross done, 1 time in 8. If not, do the usual OLL.",
    '- **No COLL:** if all 4 corners already have yellow on top (1 time in 27), go straight to PLL.',
    'The EPLLs are in **Full CFOP**, PLL phase.',
  ], [
    'Para quando você termina o F2L **com a cruz amarela já feita**. O COLL orienta e posiciona as 4 quinas num algoritmo: só sobra uma **EPLL** (Ua, Ub, H ou Z), e 1 a cada 12 vezes, nada.',
    '## Quando usar',
    '- **No ZZ:** sempre, porque as arestas são orientadas no começo e você chega com a cruz feita.',
    '- **No CFOP:** quando o último par deixa a cruz feita, 1 a cada 8 vezes. Se não, faça a OLL de sempre.',
    '- **Sem COLL:** se as 4 quinas já têm o amarelo em cima (1 a cada 27), passe direto para a PLL.',
    'As EPLL estão no **CFOP completo**, fase PLL.',
  ]),
  orientation: tr(
    '**Cruz blanca abajo, amarillo arriba y verde al frente.** Las figuras muestran la cara amarilla desde arriba, con el frente abajo.',
    '**White cross on the bottom, yellow on top and green in front.** The figures show the yellow face from above, with the front at the bottom.',
    '**Cruz branca embaixo, amarelo em cima e verde na frente.** As figuras mostram a face amarela vista de cima, com a frente embaixo.',
  ),
  before: { path: '/academia/cfop-completo#academy-cfopc-oll', label: tr('Paso previo: la cruz amarilla (OLL de CFOP completo)', 'Previous step: the yellow cross (Full CFOP\'s OLL)', 'Passo anterior: a cruz amarela (OLL do CFOP completo)') },
  phases: [
    {
      id: 'coll-casos',
      name: tr('Los 40 casos', 'The 40 cases', 'Os 40 casos'),
      goal: doc(
        ['**Meta:** la cara amarilla completa y las 4 esquinas en su sitio entre sí. Solo queda una EPLL.', '**Casos:** 40, en 7 grupos según la forma del amarillo: H, Pi, U, T, L, Sune y Antisune.'],
        ['**Goal:** the yellow face complete and the 4 corners in place relative to each other. Only an EPLL is left.', '**Cases:** 40, in 7 groups by the shape of the yellow: H, Pi, U, T, L, Sune and Antisune.'],
        ['**Meta:** a face amarela completa e as 4 quinas no lugar entre si. Só sobra uma EPLL.', '**Casos:** 40, em 7 grupos pela forma do amarelo: H, Pi, U, T, L, Sune e Antisune.'],
      ),
      description: doc([
        '## Cómo se hace',
        '1. Mira la forma del amarillo: cuántas esquinas lo tienen arriba y a dónde miran las demás. Eso te da el grupo.',
        '2. Gira la capa de arriba (AUF) hasta que el amarillo quede como en la figura.',
        '3. Mira las pegatinas de los lados de las esquinas: **faros** (dos iguales en un lado), colores **vecinos** (verde y rojo) u **opuestos** (verde y azul). Eso te da el caso.',
        '4. Haz el algoritmo y termina con la EPLL.',
        'Las aristas no cuentan: con cualquier mezcla de aristas es el mismo caso.',
      ], [
        '## How to do it',
        '1. Look at the shape of the yellow: how many corners have it on top and where the others face. That gives you the group.',
        '2. Turn the top layer (AUF) until the yellow looks like the figure.',
        "3. Look at the corners' side stickers: **headlights** (two matching on one side), **adjacent** colors (green and red) or **opposite** ones (green and blue). That gives you the case.",
        '4. Do the algorithm and finish with the EPLL.',
        "The edges don't count: with any edge mix it's the same case.",
      ], [
        '## Como fazer',
        '1. Olhe a forma do amarelo: quantas quinas o têm em cima e para onde olham as outras. Isso te dá o grupo.',
        '2. Gire a camada de cima (AUF) até o amarelo ficar como na figura.',
        '3. Olhe os adesivos dos lados das quinas: **faróis** (dois iguais num lado), cores **vizinhas** (verde e vermelho) ou **opostas** (verde e azul). Isso te dá o caso.',
        '4. Faça o algoritmo e termine com a EPLL.',
        'As arestas não contam: com qualquer embaralhamento das arestas é o mesmo caso.',
      ]),
      tips: doc([
        '- **La cruz amarilla no está hecha:** COLL no sirve. Haz la OLL de siempre.',
        '- **No encuentras el caso:** revisa el AUF. El amarillo tiene que quedar exactamente como en la figura antes de mirar los lados.',
        '- **Las esquinas quedaron mal:** confundiste vecinos y opuestos. Opuestos son solo verde-azul y rojo-naranja; el resto, vecinos.',
        '- **Aún no sabes el caso:** haz la OCLL y la PLL de siempre. Algunos casos usan el mismo algoritmo que su OCLL: esos ya los sabes.',
      ], [
        "- **The yellow cross isn't done:** COLL doesn't apply. Do the usual OLL.",
        "- **You can't find the case:** check the AUF. The yellow has to look exactly like the figure before you look at the sides.",
        '- **The corners came out wrong:** you mixed up adjacent and opposite. Opposite is only green-blue and red-orange; the rest, adjacent.',
        "- **You don't know the case yet:** do the usual OCLL and PLL. Some cases use the same algorithm as their OCLL: you already know those.",
      ], [
        '- **A cruz amarela não está feita:** o COLL não serve. Faça a OLL de sempre.',
        '- **Não encontra o caso:** confira o AUF. O amarelo tem que ficar exatamente como na figura antes de olhar os lados.',
        '- **As quinas ficaram erradas:** você confundiu vizinhas e opostas. Opostas são só verde-azul e vermelho-laranja; o resto, vizinhas.',
        '- **Ainda não sabe o caso:** faça a OCLL e a PLL de sempre. Alguns casos usam o mesmo algoritmo da sua OCLL: esses você já sabe.',
      ]),
      diagram: 'top',
      groups: [h, pi, u, t, l, s, as],
      quizzes: [],
    },
  ],
};

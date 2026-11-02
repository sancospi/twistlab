// "COLL": the last layer's corners in one algorithm when the top edges are already oriented (the yellow cross is done
// with the last F2L pair or OLL's edges), so only an EPLL is left. 40 cases in one phase (one group per OCLL shape),
// stage 'coll': every top sticker yellow and the corners solved relative to each other. Case ids: coll-<slug>;
// SpeedCubeDB: scdbUrl('COLL', 'AS_1').
// Algorithms are SpeedCubeDB's (/a/3x3/COLL, read 2026-10-22): main = #1 with a leading y/y'/y2 dropped (an AUF covers
// it: the edges don't matter here), extras = [rank, alg] with the U turn they need here in place of their leading y.
// Left out: extras that became the main or another extra once their y was dropped (AS 2 #3, L 6 #3, H 1 #3, H 4 #3-#4).
// Recognition texts describe each setup as the diagram shows it (yellow up, green front): which corners have yellow on
// top (in the words Roux's CMLL uses for the same shapes), then the side stickers.
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
  `Es el mismo algoritmo que el OCLL ${name} de CFOP: si ya lo sabes, este caso es gratis.`,
  `It's the same algorithm as CFOP's ${name} OCLL: if you know it, this case is free.`,
  `É o mesmo algoritmo do OCLL ${name} do CFOP: se você já sabe, este caso sai de graça.`,
];

const h = group('h', ['H', 'H', 'H'], [
  'Ninguna esquina tiene el amarillo arriba, y hay faros amarillos en **dos lados opuestos**. Los casos se distinguen por los otros dos lados.',
  'No corner has yellow on top, and there are yellow headlights on **two opposite sides**. The cases differ in the other two sides.',
  'Nenhuma quina tem o amarelo em cima, e há faróis amarelos em **dois lados opostos**. Os casos se diferenciam pelos outros dois lados.',
], [
  kase('h', 1, [
    'Faros amarillos a la derecha y a la izquierda. Al frente y atrás, colores opuestos (rojo y naranja), sin faros',
    'Yellow headlights on the right and on the left. At the front and the back, opposite colors (red and orange), no headlights',
    'Faróis amarelos na direita e na esquerda. Na frente e atrás, cores opostas (vermelho e laranja), sem faróis',
  ], "R U R' U R U' R' U R U2 R'", [[2, "U R U2 R' U' R U R' U' R U' R'"], [4, "U R' U2 R U R' U' R U R' U R"]], ocll('H')),
  kase('h', 2, [
    'Faros amarillos a la derecha y a la izquierda. Al frente, colores opuestos (naranja y rojo); atrás, **faros** verdes',
    'Yellow headlights on the right and on the left. At the front, opposite colors (orange and red); at the back, green **headlights**',
    'Faróis amarelos na direita e na esquerda. Na frente, cores opostas (laranja e vermelho); atrás, **faróis** verdes',
  ], "F R U' R' U R U2 R' U' R U R' U' F'", [[2, "f R2 S' U' R2 U' R2 U R2 F'"], [3, "U2 f R U R' U' R F' R U R' U' R' S'"], [4, "f R U R' U' f' R U R' U' R' F R F'"]]),
  kase('h', 3, [
    'Faros amarillos a la derecha y a la izquierda. Al frente (rojo y azul) y atrás (verde y rojo), colores vecinos',
    'Yellow headlights on the right and on the left. At the front (red and blue) and the back (green and red), adjacent colors',
    'Faróis amarelos na direita e na esquerda. Na frente (vermelho e azul) e atrás (verde e vermelho), cores vizinhas',
  ], "R U R' U R U L' U R' U' L", [[2, "R U R' U R U r' F R' F' r"], [3, "R' F' R U2 R U2 R' F U' R U' R'"], [4, "R U R2 D' R U2 R' D R U' R U2 R'"]]),
  kase('h', 4, [
    'Faros en los 4 lados: amarillos al frente y atrás, rojos a la derecha y naranjas a la izquierda',
    'Headlights on all 4 sides: yellow at the front and the back, red on the right and orange on the left',
    'Faróis nos 4 lados: amarelos na frente e atrás, vermelhos na direita e laranja na esquerda',
  ], "F R U R' U' R U R' U' R U R' U' F'", [[2, "F U R U' R' U R U' R' U R U' R' F'"]]),
]);

const pi = group('pi', ['Pi', 'Pi', 'Pi'], [
  'Ninguna esquina tiene el amarillo arriba, y hay faros amarillos en **un solo lado**. Los casos se distinguen por el lado opuesto, que no tiene amarillo, y por los otros dos.',
  'No corner has yellow on top, and there are yellow headlights on **only one side**. The cases differ in the opposite side, which has no yellow, and in the other two.',
  'Nenhuma quina tem o amarelo em cima, e há faróis amarelos em **um lado só**. Os casos se diferenciam pelo lado oposto, que não tem amarelo, e pelos outros dois.',
], [
  kase('pi', 1, [
    'Faros amarillos a la izquierda. El lado derecho, colores opuestos (azul y verde). Al frente y atrás, la pegatina que no es amarilla es del mismo color (naranja)',
    'Yellow headlights on the left. On the right side, opposite colors (blue and green). At the front and the back, the sticker that isn\'t yellow is the same color (orange)',
    'Faróis amarelos na esquerda. No lado direito, cores opostas (azul e verde). Na frente e atrás, o adesivo que não é amarelo é da mesma cor (laranja)',
  ], "R U2 R2 U' R2 U' R2 U2 R", [[2, "R' U2 R2 U R2 U R2 U2 R'"], [3, "U2 L' U2 L2 U L2 U L2 U2 L'"], [4, "R U R' U R U2 R' U' R U R' U R U2 R'"]], ocll('Pi')),
  kase('pi', 2, [
    'Faros amarillos atrás. Al frente, colores vecinos (azul y naranja). El naranja se repite: al frente, a la derecha, y en el lado izquierdo, atrás',
    'Yellow headlights at the back. At the front, adjacent colors (blue and orange). Orange shows twice: on the front at the right, and on the left side at the back',
    'Faróis amarelos atrás. Na frente, cores vizinhas (azul e laranja). O laranja se repete: na frente, à direita, e no lado esquerdo, atrás',
  ], "F U R U' R' U R U' R2 F' R U R U' R'", [[2, "U' R' F2 R U2 R U2 R' F2 U' R U' R'"], [3, "U L' U' L U L F' L2 U' L U L' U' L U F"], [4, "U' R U R' U R' F R2 U' R' U' R U R' F' U R U' R'"]]),
  kase('pi', 3, [
    'Faros amarillos a la izquierda. El lado derecho, **faros** naranjas. Al frente y atrás, la pegatina que no es amarilla es del mismo color (rojo)',
    'Yellow headlights on the left. On the right side, orange **headlights**. At the front and the back, the sticker that isn\'t yellow is the same color (red)',
    'Faróis amarelos na esquerda. No lado direito, **faróis** laranja. Na frente e atrás, o adesivo que não é amarelo é da mesma cor (vermelho)',
  ], "R' U' F' R U R' U' R' F R2 U2 R' U2 R", [[2, "U F U R U' R' U R U2 R' U' R U R' F'"], [3, "U F R2 U' R2 U R2 U S R2 f'"], [4, "U' R U R' U R U2 R2 F' r U R U' r' F"]]),
  kase('pi', 4, [
    'Faros amarillos a la izquierda. El lado derecho, colores vecinos (verde y rojo). El verde se repite: en el lado derecho, adelante, y atrás, a la izquierda',
    'Yellow headlights on the left. On the right side, adjacent colors (green and red). Green shows twice: on the right side at the front, and on the back at the left',
    'Faróis amarelos na esquerda. No lado direito, cores vizinhas (verde e vermelho). O verde se repete: no lado direito, na frente, e atrás, à esquerda',
  ], "R U R' U' R' F R2 U R' U' R U R' U' F'", [[2, "R U2 R' U' R U R' U2 r' F R F' M'"], [3, "U F' R U R' U R U' R' U' R' F R U' R U' R' U R U R'"], [4, "U' R' U2 R U R' U R2 U' L' U R' U' L"]]),
  kase('pi', 5, [
    'Faros amarillos a la izquierda. El lado derecho, colores opuestos (verde y azul). Al frente y atrás, las pegatinas que no son amarillas también son opuestas (azul y verde)',
    'Yellow headlights on the left. On the right side, opposite colors (green and blue). At the front and the back, the stickers that aren\'t yellow are opposite too (blue and green)',
    'Faróis amarelos na esquerda. No lado direito, cores opostas (verde e azul). Na frente e atrás, os adesivos que não são amarelos também são opostos (azul e verde)',
  ], "R U' L' U R' U L U L' U L", [[2, "U' R U2 R' U R' D' R U2 R' D R2 U' R'"], [3, "U' R U R' U F' R U2 R' U2 R' F R"], [4, "U2 L' U R U' L U' R' U' R U' R'"]]),
  kase('pi', 6, [
    'Faros amarillos a la izquierda. El lado derecho, **faros** rojos. Al frente y atrás, las pegatinas que no son amarillas son opuestas (verde y azul)',
    'Yellow headlights on the left. On the right side, red **headlights**. At the front and the back, the stickers that aren\'t yellow are opposite (green and blue)',
    'Faróis amarelos na esquerda. No lado direito, **faróis** vermelhos. Na frente e atrás, os adesivos que não são amarelos são opostos (verde e azul)',
  ], "R' F' U' F U' R U S' R' U R S", [[2, "U' r U R' U R' F R F' R U' R' U R U2 r'"], [3, "R U D' R U R' D R2 U' R' U' R2 U2 R"], [4, "R2 D' R U R' D R U R U' R' U R U R' U R"]]),
]);

const u = group('u', ['U', 'U', 'U'], [
  'Las dos esquinas de un lado tienen el amarillo arriba, y las otras dos lo muestran en **el mismo lado**, como faros amarillos. Los casos se distinguen por los otros tres lados.',
  'The two corners on one side have yellow on top, and the other two show it on **the same side**, as yellow headlights. The cases differ in the other three sides.',
  'As duas quinas de um lado têm o amarelo em cima, e as outras duas o mostram **no mesmo lado**, como faróis amarelos. Os casos se diferenciam pelos outros três lados.',
], [
  kase('u', 1, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran atrás (faros amarillos). Al frente, **faros** verdes. A la derecha (naranja y azul) y a la izquierda (azul y rojo), colores vecinos',
    'The two front corners have yellow on top; the back ones show it facing back (yellow headlights). At the front, green **headlights**. On the right (orange and blue) and the left (blue and red), adjacent colors',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para trás (faróis amarelos). Na frente, **faróis** verdes. Na direita (laranja e azul) e na esquerda (azul e vermelho), cores vizinhas',
  ], "R' U' R U' R' U2 R2 U R' U R U2 R'", [[2, "U2 R U R' U R U2 R2 U' R U' R' U2 R"], [3, "U R U2 R' U' R U' R' U' R U R' U R U2 R'"], [4, "U' R U R' U' R U' R' U2 R U' R' U2 R U R'"]]),
  kase('u', 2, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran atrás (faros amarillos). Al frente, **faros** verdes. A la derecha y a la izquierda, colores opuestos (naranja y rojo)',
    'The two front corners have yellow on top; the back ones show it facing back (yellow headlights). At the front, green **headlights**. On the right and the left, opposite colors (orange and red)',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para trás (faróis amarelos). Na frente, **faróis** verdes. Na direita e na esquerda, cores opostas (laranja e vermelho)',
  ], "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R", [[2, "U' r U R' U' r' F R2 U' R' U' R U2 R' U' F'"], [3, "U' R' U' R F R2 D' R U R' D R2 U' F'"], [4, "U F U R U2 R' U R U R2 F' r U R U' r'"]]),
  kase('u', 3, [
    'Las dos esquinas de atrás tienen el amarillo arriba; las de adelante lo muestran al frente (faros amarillos). Los otros tres lados, colores vecinos. El azul se repite: atrás, a la izquierda, y en el lado izquierdo, adelante',
    'The two back corners have yellow on top; the front ones show it facing front (yellow headlights). On the other three sides, adjacent colors. Blue shows twice: on the back at the left, and on the left side at the front',
    'As duas quinas de trás têm o amarelo em cima; as da frente o mostram para a frente (faróis amarelos). Nos outros três lados, cores vizinhas. O azul se repete: atrás, à esquerda, e no lado esquerdo, na frente',
  ], "R2 D R' U2 R D' R' U2 R'", [[2, "U2 L2 D L' U2 L D' L' U2 L'"], [3, "U2 R U' R' U' R U2 R' U' R' D' R U2 R' D R"], [4, "U2 R' U R U R' F' R U R' U' R' F R2 U' R' U' R"]], ocll('U')),
  kase('u', 4, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran atrás (faros amarillos). Los otros tres lados, colores opuestos',
    'The two front corners have yellow on top; the back ones show it facing back (yellow headlights). On the other three sides, opposite colors',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para trás (faróis amarelos). Nos outros três lados, cores opostas',
  ], "F R U' R' U R U R' U R U' R' F'", [[2, "U2 R' F2 R U2 R U2 R' F2 R U2 R'"], [3, "U' F U2 R' D' R U2 R' D R F'"], [4, "U2 R U2 R' U2 L' U2 R U2 R' U2 L"]]),
  kase('u', 5, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran atrás (faros amarillos). Los otros tres lados, colores vecinos. El verde se repite: al frente, a la izquierda, y en el lado izquierdo, atrás',
    'The two front corners have yellow on top; the back ones show it facing back (yellow headlights). On the other three sides, adjacent colors. Green shows twice: on the front at the left, and on the left side at the back',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para trás (faróis amarelos). Nos outros três lados, cores vizinhas. O verde se repete: na frente, à esquerda, e no lado esquerdo, atrás',
  ], "R2 D' R U2 R' D R U2 R", [[2, "U2 L2 D' L U2 L' D L U2 L"], [3, "L U' R U' L' U R' U2 L U' L'"], [4, "U2 x R' U R D' R' U2 R D R' U R x'"]]),
  kase('u', 6, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran atrás (faros amarillos). Al frente, colores opuestos (rojo y naranja). A la derecha (azul y naranja) y a la izquierda (rojo y azul), colores vecinos',
    'The two front corners have yellow on top; the back ones show it facing back (yellow headlights). At the front, opposite colors (red and orange). On the right (blue and orange) and the left (red and blue), adjacent colors',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para trás (faróis amarelos). Na frente, cores opostas (vermelho e laranja). Na direita (azul e laranja) e na esquerda (vermelho e azul), cores vizinhas',
  ], "R2 D' R U R' D R U R U' R' U' R", [[2, "R' U2 R F U' R' U' R U F'"], [3, "R U' R' U' R U R D R' U R D' R2"], [4, "R' U2 R U2 R' F' R U R' U' R' F R2"]]),
]);

const t = group('t', ['T', 'T', 'T'], [
  'Las dos esquinas de un lado tienen el amarillo arriba, y las otras dos lo muestran en **lados opuestos**. Los casos se distinguen por los dos lados sin amarillo.',
  'The two corners on one side have yellow on top, and the other two show it on **opposite sides**. The cases differ in the two sides with no yellow.',
  'As duas quinas de um lado têm o amarelo em cima, e as outras duas o mostram em **lados opostos**. Os casos se diferenciam pelos dois lados sem amarelo.',
], [
  kase('t', 1, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran a la derecha y a la izquierda. Al frente, **faros** verdes. Atrás, colores opuestos (naranja y rojo)',
    'The two front corners have yellow on top; the back ones show it facing right and left. At the front, green **headlights**. At the back, opposite colors (orange and red)',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para a direita e para a esquerda. Na frente, **faróis** verdes. Atrás, cores opostas (laranja e vermelho)',
  ], "R U2 R' U' R U' R2 U2 R U R' U R", [[2, "U' R U R2 U' R2 U' R2 U2 R U' R U' R'"], [3, "R U2 R' r' F2 r U' R U' R' U' r' F r"], [4, "U' R U R' U R U2 R' L' U' L U' L' U2 L"]]),
  kase('t', 2, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran a la derecha y a la izquierda. Al frente, **faros** azules. Atrás, **faros** verdes',
    'The two front corners have yellow on top; the back ones show it facing right and left. At the front, blue **headlights**. At the back, green **headlights**',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para a direita e para a esquerda. Na frente, **faróis** azuis. Atrás, **faróis** verdes',
  ], "R' U R U2 R' L' U R U' L", [[2, "R' U R U2 r' R' F R F' r"], [3, "U2 R' F R U R' U' R' F' R2 U' R' U2 R"], [4, "U2 R U' R' U2 L R U' R' U L'"]]),
  kase('t', 3, [
    'Las dos esquinas de la izquierda tienen el amarillo arriba; las de la derecha lo muestran al frente y atrás. A la derecha (azul y naranja) y a la izquierda (azul y rojo), colores vecinos. El azul se repite en diagonal: en el lado derecho, adelante, y en el izquierdo, atrás',
    'The two left corners have yellow on top; the right ones show it facing front and back. On the right (blue and orange) and the left (blue and red), adjacent colors. Blue shows twice, diagonally: on the right side at the front, and on the left side at the back',
    'As duas quinas da esquerda têm o amarelo em cima; as da direita o mostram para a frente e para trás. Na direita (azul e laranja) e na esquerda (azul e vermelho), cores vizinhas. O azul se repete na diagonal: no lado direito, na frente, e no esquerdo, atrás',
  ], "R' F' r U R U' r' F", [[2, "l' U' L U R U' r' F"], [3, "U R' U' R' D' R U R' D R2"], [4, "l' U' L U l F' L' F"]]),
  kase('t', 4, [
    'Las dos esquinas de atrás tienen el amarillo arriba; las de adelante lo muestran a la derecha y a la izquierda. Al frente y atrás, colores opuestos (naranja y rojo)',
    'The two back corners have yellow on top; the front ones show it facing right and left. At the front and the back, opposite colors (orange and red)',
    'As duas quinas de trás têm o amarelo em cima; as da frente o mostram para a direita e para a esquerda. Na frente e atrás, cores opostas (laranja e vermelho)',
  ], "F R U R' U' R U' R' U' R U R' F'", [[2, "F R' D' R U2 R' D R U2 F'"], [3, "R F R' U R U2 R' U R U F' R'"], [4, "U' R U2 R' F2 R U2 R' U2 R' F2 R"]]),
  kase('t', 5, [
    'Las dos esquinas de la derecha tienen el amarillo arriba; las de la izquierda lo muestran al frente y atrás. A la derecha (naranja y azul) y a la izquierda (rojo y azul), colores vecinos. El azul se repite en diagonal: en el lado derecho, atrás, y en el izquierdo, adelante',
    'The two right corners have yellow on top; the left ones show it facing front and back. On the right (orange and blue) and the left (red and blue), adjacent colors. Blue shows twice, diagonally: on the right side at the back, and on the left side at the front',
    'As duas quinas da direita têm o amarelo em cima; as da esquerda o mostram para a frente e para trás. Na direita (laranja e azul) e na esquerda (vermelho e azul), cores vizinhas. O azul se repete na diagonal: no lado direito, atrás, e no esquerdo, na frente',
  ], "r U R' U' r' F R F'", [[2, "U R U R D R' U' R D' R2"], [3, "U' x' D R U' R' D' R U R' x"], [4, "U R U R' U R' D' R U' R' D R2 U' R'"]], ocll('T')),
  kase('t', 6, [
    'Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran a la derecha y a la izquierda. Al frente, colores opuestos (naranja y rojo). Atrás, **faros** azules',
    'The two front corners have yellow on top; the back ones show it facing right and left. At the front, opposite colors (orange and red). At the back, blue **headlights**',
    'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para a direita e para a esquerda. Na frente, cores opostas (laranja e vermelho). Atrás, **faróis** azuis',
  ], "R' U R2 D r' U2 r D' R2 U' R", [[2, "U2 R U' R2 D' r U2 r' D R2 U R'"], [3, "U R' U' R U R2 D' R U2 R' D R2 U' R' U R"], [4, "U R U R' U' R2 D R' U2 R D' R2 U R U' R'"]]),
]);

const l = group('l', ['L', 'L', 'L'], [
  'Dos esquinas **en diagonal** tienen el amarillo arriba. Los casos se distinguen por los dos lados sin amarillo.',
  'Two corners **diagonal** from each other have yellow on top. The cases differ in the two sides with no yellow.',
  'Duas quinas **na diagonal** têm o amarelo em cima. Os casos se diferenciam pelos dois lados sem amarelo.',
], [
  kase('l', 1, [
    'Dos esquinas en diagonal tienen el amarillo arriba: atrás a la izquierda y adelante a la derecha. Sin amarillo: el frente (naranja y azul) y el lado derecho (rojo y verde), los dos con colores vecinos. Ningún color se repite entre esos dos lados',
    'Two diagonal corners have yellow on top: back left and front right. No yellow: the front (orange and blue) and the right side (red and green), both with adjacent colors. No color shows on both of those sides',
    'Duas quinas na diagonal têm o amarelo em cima: atrás à esquerda e na frente à direita. Sem amarelo: a frente (laranja e azul) e o lado direito (vermelho e verde), os dois com cores vizinhas. Nenhuma cor se repete entre esses dois lados',
  ], "R U R' U R U' R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U R' U' R U' R'"], [3, "U' R' U2 R U R' U' R U R' U' R U R' U R"], [4, "U R' U' R U' R' U2 R U' R U R' U R U2 R'"]]),
  kase('l', 2, [
    'Dos esquinas en diagonal tienen el amarillo arriba: atrás a la derecha y adelante a la izquierda. Sin amarillo: el frente, colores vecinos (verde y rojo), y el lado izquierdo, opuestos (naranja y rojo). El rojo se repite: al frente, a la derecha, y en el lado izquierdo, adelante',
    'Two diagonal corners have yellow on top: back right and front left. No yellow: the front, with adjacent colors (green and red), and the left side, with opposite colors (orange and red). Red shows twice: on the front at the right, and on the left side at the front',
    'Duas quinas na diagonal têm o amarelo em cima: atrás à direita e na frente à esquerda. Sem amarelo: a frente, com cores vizinhas (verde e vermelho), e o lado esquerdo, com cores opostas (laranja e vermelho). O vermelho se repete: na frente, à direita, e no lado esquerdo, na frente',
  ], "R' U2 R' D' R U2 R' D R2", [[2, "R U R' U2 L U' R U L' U R'"], [3, "U2 L' U2 L' D' L U2 L' D L2"], [4, "U' R' U2 R U R2 D' R U R' D R2"]]),
  kase('l', 3, [
    'Dos esquinas en diagonal tienen el amarillo arriba: atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás, colores vecinos (rojo y azul), y el lado izquierdo, opuestos (rojo y naranja). El rojo se repite: atrás, a la derecha, y en el lado izquierdo, atrás',
    'Two diagonal corners have yellow on top: back left and front right. No yellow: the back, with adjacent colors (red and blue), and the left side, with opposite colors (red and orange). Red shows twice: on the back at the right, and on the left side at the back',
    'Duas quinas na diagonal têm o amarelo em cima: atrás à esquerda e na frente à direita. Sem amarelo: o lado de trás, com cores vizinhas (vermelho e azul), e o lado esquerdo, com cores opostas (vermelho e laranja). O vermelho se repete: atrás, à direita, e no lado esquerdo, atrás',
  ], "R U2 R D R' U2 R D' R2", [[2, "U R U2 R2 D' R U' R' D R2 U' R'"], [3, "U' R' F' R U R' U' R' F R2 U' R' U2 R"], [4, "R' U' R U2 L' U R' U' L U' R"]], ocll('L')),
  kase('l', 4, [
    'Dos esquinas en diagonal tienen el amarillo arriba: atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás, colores opuestos (rojo y naranja), y el lado izquierdo, vecinos (azul y rojo). El rojo se repite: atrás, a la derecha, y en el lado izquierdo, adelante',
    'Two diagonal corners have yellow on top: back left and front right. No yellow: the back, with opposite colors (red and orange), and the left side, with adjacent colors (blue and red). Red shows twice: on the back at the right, and on the left side at the front',
    'Duas quinas na diagonal têm o amarelo em cima: atrás à esquerda e na frente à direita. Sem amarelo: o lado de trás, com cores opostas (vermelho e laranja), e o lado esquerdo, com cores vizinhas (azul e vermelho). O vermelho se repete: atrás, à direita, e no lado esquerdo, na frente',
  ], "F R' F' r U R U' r'", [[2, "U R2 D R' U R D' R' U' R'"], [3, "U' R U R' U' R' F R U R U' R' F'"], [4, "F l' U' L U R U' r'"]]),
  kase('l', 5, [
    'Dos esquinas en diagonal tienen el amarillo arriba: atrás a la derecha y adelante a la izquierda. Sin amarillo: el lado derecho, colores vecinos (naranja y azul), y atrás, opuestos (rojo y naranja). El naranja se repite: en el lado derecho, adelante, y atrás, a la izquierda',
    'Two diagonal corners have yellow on top: back right and front left. No yellow: the right side, with adjacent colors (orange and blue), and the back, with opposite colors (red and orange). Orange shows twice: on the right side at the front, and on the back at the left',
    'Duas quinas na diagonal têm o amarelo em cima: atrás à direita e na frente à esquerda. Sem amarelo: o lado direito, com cores vizinhas (laranja e azul), e o lado de trás, com cores opostas (vermelho e laranja). O laranja se repete: no lado direito, na frente, e atrás, à esquerda',
  ], "F' r U R' U' r' F R", [[2, "U' x R' U R D' R' U' R D x'"], [3, "U2 r U R U' r' F R' F'"], [4, "U R2 D' R U' R' D R U R"]]),
  kase('l', 6, [
    'Dos esquinas en diagonal tienen el amarillo arriba: atrás a la izquierda y adelante a la derecha. Sin amarillo: atrás y el lado izquierdo, los dos con los mismos colores vecinos (verde y rojo)',
    'Two diagonal corners have yellow on top: back left and front right. No yellow: the back and the left side, both with the same adjacent colors (green and red)',
    'Duas quinas na diagonal têm o amarelo em cima: atrás à esquerda e na frente à direita. Sem amarelo: o lado de trás e o lado esquerdo, os dois com as mesmas cores vizinhas (verde e vermelho)',
  ], "r U2 R2 F R F' R U2 r'", [[2, "U2 R' U' R U R' F' R U R' U' R' F R2"], [4, "F R U R2 F R F' R U' R' F'"]]),
]);

const s = group('s', ['Sune', 'Sune', 'Sune'], [
  'Solo una esquina tiene el amarillo arriba. En cada lado con amarillo, si lo miras de frente, la pegatina amarilla está a la **derecha**. Los casos se distinguen por el lado sin amarillo y el color que se repite.',
  'Only one corner has yellow on top. On each side with yellow, when you look straight at it, the yellow sticker is on the **right**. The cases differ in the side with no yellow and the color that shows twice.',
  'Só uma quina tem o amarelo em cima. Em cada lado com amarelo, olhando esse lado de frente, o adesivo amarelo fica à **direita**. Os casos se diferenciam pelo lado sem amarelo e pela cor que se repete.',
], [
  kase('s', 1, [
    'Una esquina tiene el amarillo arriba, adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (verde y naranja). El azul se repite: al frente, a la izquierda, y en el lado derecho, adelante',
    'One corner has yellow on top, at the front left. The left side has no yellow: adjacent colors (green and orange). Blue shows twice: on the front at the left, and on the right side at the front',
    'Uma quina tem o amarelo em cima, na frente à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (verde e laranja). O azul se repete: na frente, à esquerda, e no lado direito, na frente',
  ], "R U R' U R U2 R'", [[2, "U' R' U2 R U R' U R"], [3, "U L' U2 L U L' U L"], [4, "U2 L U L' U L U2 L'"]], ocll('Sune')),
  kase('s', 2, [
    'Una esquina tiene el amarillo arriba, atrás a la derecha. El lado derecho no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: atrás, a la derecha, y en el lado izquierdo, atrás',
    'One corner has yellow on top, at the back right. The right side has no yellow: opposite colors (blue and green). Orange shows twice: on the back at the right, and on the left side at the back',
    'Uma quina tem o amarelo em cima, atrás à direita. O lado direito não tem amarelo: cores opostas (azul e verde). O laranja se repete: atrás, à direita, e no lado esquerdo, atrás',
  ], "R U R' U R2 D R' U2 R D' R2", [[2, "U2 r' F2 r U2 R U' r' F M'"], [3, "U2 L' U2 L U2 R U' L' U L R'"], [4, "U2 L' U2 L U2 l F' L' F M'"]]),
  kase('s', 3, [
    'Una esquina tiene el amarillo arriba, adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (rojo y verde). El naranja se repite: al frente, a la izquierda, y atrás, a la derecha',
    'One corner has yellow on top, at the front left. The left side has no yellow: adjacent colors (red and green). Orange shows twice: on the front at the left, and on the back at the right',
    'Uma quina tem o amarelo em cima, na frente à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (vermelho e verde). O laranja se repete: na frente, à esquerda, e atrás, à direita',
  ], "L' R U R' U' L U2 R U2 R'", [[2, "M F R' F' r U2 R U2 R'"], [3, "U2 R2 D' R U2 R' D R2 U R' U R"], [4, "f R' F' R U2 R U2 R' U2 S'"]]),
  kase('s', 4, [
    'Una esquina tiene el amarillo arriba, adelante a la derecha. El frente no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: en el lado derecho, adelante, y en el lado izquierdo, atrás',
    'One corner has yellow on top, at the front right. The front has no yellow: opposite colors (blue and green). Orange shows twice: on the right side at the front, and on the left side at the back',
    'Uma quina tem o amarelo em cima, na frente à direita. A frente não tem amarelo: cores opostas (azul e verde). O laranja se repete: no lado direito, na frente, e no lado esquerdo, atrás',
  ], "R U R' U R U' R D R' U' R D' R2", [[2, "U R U R' U' R' F R F' r U R' U R U2 r'"], [3, "F R' U2 R F' R' F U2 F' R"], [4, "U L F' U2 F L' F' L U2 L' F"]]),
  kase('s', 5, [
    'Una esquina tiene el amarillo arriba, adelante a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (naranja y verde). El naranja se repite: al frente, a la izquierda, y en el lado izquierdo, atrás. Su opuesto, el rojo, está atrás, a la derecha',
    'One corner has yellow on top, at the front left. The left side has no yellow: adjacent colors (orange and green). Orange shows twice: on the front at the left, and on the left side at the back. Its opposite, red, is on the back at the right',
    'Uma quina tem o amarelo em cima, na frente à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (laranja e verde). O laranja se repete: na frente, à esquerda, e no lado esquerdo, atrás. O oposto dele, o vermelho, está atrás, à direita',
  ], "R U' L' U R' U' L", [[2, "R U' r' F R' F' r"], [3, "l F' L' F l' U' L"], [4, "r U' r' F R' F' r U M"]]),
  kase('s', 6, [
    'Una esquina tiene el amarillo arriba, atrás a la derecha. El lado derecho no tiene amarillo: colores vecinos (rojo y azul). El rojo se repite: en el lado derecho, adelante, y atrás, a la derecha. Su opuesto, el naranja, está en el lado izquierdo, atrás',
    'One corner has yellow on top, at the back right. The right side has no yellow: adjacent colors (red and blue). Red shows twice: on the right side at the front, and on the back at the right. Its opposite, orange, is on the left side at the back',
    'Uma quina tem o amarelo em cima, atrás à direita. O lado direito não tem amarelo: cores vizinhas (vermelho e azul). O vermelho se repete: no lado direito, na frente, e atrás, à direita. O oposto dele, o laranja, está no lado esquerdo, atrás',
  ], "R U R' F' R U R' U R U2 R' F R U' R'", [[2, "R U R' U r' F R F' r U2 R'"], [3, "R U R' U L' U R U' L U2 R'"], [4, "U2 F' R U2 R' U2 R' F2 R U R U' R' F'"]]),
]);

const as = group('as', ['Antisune', 'Antisune', 'Antisune'], [
  'Solo una esquina tiene el amarillo arriba. En cada lado con amarillo, si lo miras de frente, la pegatina amarilla está a la **izquierda**. Los casos se distinguen por el lado sin amarillo y el color que se repite.',
  'Only one corner has yellow on top. On each side with yellow, when you look straight at it, the yellow sticker is on the **left**. The cases differ in the side with no yellow and the color that shows twice.',
  'Só uma quina tem o amarelo em cima. Em cada lado com amarelo, olhando esse lado de frente, o adesivo amarelo fica à **esquerda**. Os casos se diferenciam pelo lado sem amarelo e pela cor que se repete.',
], [
  kase('as', 1, [
    'Una esquina tiene el amarillo arriba, atrás a la derecha. El lado de atrás no tiene amarillo: colores vecinos (verde y naranja). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás',
    'One corner has yellow on top, at the back right. The back has no yellow: adjacent colors (green and orange). Red shows twice: on the front at the right, and on the right side at the back',
    'Uma quina tem o amarelo em cima, atrás à direita. O lado de trás não tem amarelo: cores vizinhas (verde e laranja). O vermelho se repete: na frente, à direita, e no lado direito, atrás',
  ], "R U2 R' U' R U' R'", [[2, "U' R' U' R U' R' U2 R"], [3, "U L' U' L U' L' U2 L"], [4, "U2 L U2 L' U' L U' L'"]], ocll('Antisune')),
  kase('as', 2, [
    'Una esquina tiene el amarillo arriba, adelante a la derecha. El lado derecho no tiene amarillo: colores opuestos (naranja y rojo). El verde se repite: al frente, a la derecha, y atrás, a la izquierda',
    'One corner has yellow on top, at the front right. The right side has no yellow: opposite colors (orange and red). Green shows twice: on the front at the right, and on the back at the left',
    'Uma quina tem o amarelo em cima, na frente à direita. O lado direito não tem amarelo: cores opostas (laranja e vermelho). O verde se repete: na frente, à direita, e atrás, à esquerda',
  ], "R2 D R' U R D' R' U R' U' R U' R'", [[2, "U' R' U' R U' R' U R' D' R U R' D R2"], [4, "U2 R U R' f' U' R U2 R' U' R U' R' f R U' R'"]]),
  kase('as', 3, [
    'Una esquina tiene el amarillo arriba, adelante a la derecha. El lado derecho no tiene amarillo: colores vecinos (azul y rojo). El naranja se repite: al frente, a la derecha, y atrás, a la izquierda',
    'One corner has yellow on top, at the front right. The right side has no yellow: adjacent colors (blue and red). Orange shows twice: on the front at the right, and on the back at the left',
    'Uma quina tem o amarelo em cima, na frente à direita. O lado direito não tem amarelo: cores vizinhas (azul e vermelho). O laranja se repete: na frente, à direita, e atrás, à esquerda',
  ], "R2 D R' U2 R D' R2 U' R U' R'", [[2, "U2 R' U' F' R U R' U' R' F R2 U' R' U R"], [3, "M F' r U R' U2 r' F2 r"], [4, "f' L F L' U2 L' U2 L U2 S"]]),
  kase('as', 4, [
    'Una esquina tiene el amarillo arriba, adelante a la derecha. El lado derecho no tiene amarillo: colores opuestos (azul y verde). El naranja se repite: al frente, a la derecha, y en el lado izquierdo, adelante',
    'One corner has yellow on top, at the front right. The right side has no yellow: opposite colors (blue and green). Orange shows twice: on the front at the right, and on the left side at the front',
    'Uma quina tem o amarelo em cima, na frente à direita. O lado direito não tem amarelo: cores opostas (azul e verde). O laranja se repete: na frente, à direita, e no lado esquerdo, na frente',
  ], "R' U' R U' R2 D' R U2 R' D R2", [[2, "R U2 R' U2 r' F R F' M'"], [3, "U2 R' U' R U R' F R U R' U' R' F' R2"], [4, "R U2 R' U2 L' U R U' R' L"]]),
  kase('as', 5, [
    'Una esquina tiene el amarillo arriba, adelante a la derecha. El lado derecho no tiene amarillo: colores vecinos (verde y rojo). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás. Su opuesto, el naranja, está atrás, a la izquierda',
    'One corner has yellow on top, at the front right. The right side has no yellow: adjacent colors (green and red). Red shows twice: on the front at the right, and on the right side at the back. Its opposite, orange, is on the back at the left',
    'Uma quina tem o amarelo em cima, na frente à direita. O lado direito não tem amarelo: cores vizinhas (verde e vermelho). O vermelho se repete: na frente, à direita, e no lado direito, atrás. O oposto dele, o laranja, está atrás, à esquerda',
  ], "r' F R F' r U R'", [[2, "U2 R' U L U' R U L'"], [3, "L' U R U' L U R'"], [4, "R' F R F' r U R' U' M"]]),
  kase('as', 6, [
    'Una esquina tiene el amarillo arriba, atrás a la izquierda. El lado izquierdo no tiene amarillo: colores vecinos (rojo y azul). El azul se repite: atrás, a la izquierda, y en el lado izquierdo, adelante. Su opuesto, el verde, está en el lado derecho, atrás',
    'One corner has yellow on top, at the back left. The left side has no yellow: adjacent colors (red and blue). Blue shows twice: on the back at the left, and on the left side at the front. Its opposite, green, is on the right side at the back',
    'Uma quina tem o amarelo em cima, atrás à esquerda. O lado esquerdo não tem amarelo: cores vizinhas (vermelho e azul). O azul se repete: atrás, à esquerda, e no lado esquerdo, na frente. O oposto dele, o verde, está no lado direito, atrás',
  ], "R U' R' U2 R U' R' U2 R' D' R U R' D R", [[2, "R U2 r' F R' F' r U' R U' R'"], [3, "R U R' F' R U2 R' U' R U' R' F R U' R'"], [4, "U2 L U2 R' U L' U' R U' L U' L'"]]),
]);

// The method's text says when COLL pays off; the phase teaches it as the beginner's (types.ts): the goal, the steps to
// recognize a case, and what to do when something goes wrong, folded.
export const coll: Method = {
  id: 'coll',
  name: tr('COLL', 'COLL', 'COLL'),
  summary: tr(
    'Orienta y coloca las 4 esquinas de la última capa del cubo de Rubik en un algoritmo cuando ya tienes la cruz amarilla: los 40 casos de COLL, para ZZ y CFOP.',
    "Orient and place the 4 last-layer corners of the Rubik's cube in one algorithm once the yellow cross is done: the 40 COLL cases, for ZZ and CFOP.",
    'Oriente e posicione as 4 quinas da última camada do cubo mágico com um só algoritmo quando a cruz amarela já está feita: os 40 casos de COLL, para ZZ e CFOP.',
  ),
  description: doc([
    'COLL orienta y coloca las 4 esquinas de la última capa en un solo algoritmo. Sirve cuando terminas el F2L **con la cruz amarilla ya hecha**.',
    'Después solo queda un caso de **EPLL**, un PLL que mueve solo aristas (Ua, Ub, H o Z). Una de cada 12 veces, las aristas ya quedan en su sitio y te ahorras el EPLL. Los 4 casos de EPLL están en la fase PLL de CFOP completo.',
    '## Cuándo usarlo',
    '- **En ZZ:** siempre. ZZ es un método que orienta todas las aristas al principio, así que siempre llegas con la cruz amarilla hecha.',
    '- **En CFOP:** solo cuando el F2L te deja la cruz amarilla hecha, 1 de cada 8 veces. Si no, haz el OLL de siempre.',
    '- **Cuando no hace falta:** si las 4 esquinas ya tienen el amarillo arriba (1 de cada 27 veces), pasa directo al PLL.',
    '## Cómo aprenderlo',
    '- Empieza por los 7 casos que se resuelven con su OCLL: H 1, Pi 1, U 3, T 5, L 3, S 1 y AS 1. Si sabes el OCLL, ya los tienes.',
    '- Luego aprende un grupo cada vez. Todos los grupos salen igual de seguido, salvo el H, que sale la mitad que los otros.',
  ], [
    'COLL orients and places the 4 last-layer corners in a single algorithm. Use it when you finish F2L **with the yellow cross already done**.',
    "After it, all that's left is an **EPLL** case, a PLL that moves only the edges (Ua, Ub, H or Z). In 1 solve out of 12, the edges are already in place and you skip EPLL. The 4 EPLL cases are in the PLL phase of Full CFOP.",
    '## When to use it',
    '- **In ZZ:** always. ZZ is a method that orients all the edges at the start, so you always reach the last layer with the yellow cross done.',
    '- **In CFOP:** only when F2L leaves you with the yellow cross done, which happens in 1 solve out of 8. Otherwise, do the usual OLL.',
    "- **When you don't need it:** if all 4 corners already have yellow on top (1 solve out of 27), go straight to PLL.",
    '## How to learn it',
    '- Start with the 7 cases you solve with their OCLL algorithm: H 1, Pi 1, U 3, T 5, L 3, S 1 and AS 1. If you know OCLL, you already have them.',
    '- Then learn one group at a time. All groups come up equally often, except H, which comes up half as often.',
  ], [
    'O COLL orienta e posiciona as 4 quinas da última camada num só algoritmo. Serve quando você termina o F2L **com a cruz amarela já feita**.',
    'Depois só sobra um caso de **EPLL**, um PLL que move só arestas (Ua, Ub, H ou Z). Uma a cada 12 vezes, as arestas já ficam no lugar e você pula o EPLL. Os 4 casos de EPLL estão na fase PLL do CFOP completo.',
    '## Quando usar',
    '- **No ZZ:** sempre. O ZZ é um método que orienta todas as arestas no começo, então você sempre chega com a cruz amarela feita.',
    '- **No CFOP:** só quando o F2L deixa a cruz amarela feita, 1 a cada 8 vezes. Se não, faça o OLL de sempre.',
    '- **Quando não precisa:** se as 4 quinas já têm o amarelo em cima (1 a cada 27 vezes), passe direto para o PLL.',
    '## Como aprender',
    '- Comece pelos 7 casos que se resolvem com o OCLL correspondente: H 1, Pi 1, U 3, T 5, L 3, S 1 e AS 1. Se você sabe o OCLL, esses você já tem.',
    '- Depois aprenda um grupo de cada vez. Todos os grupos aparecem com a mesma frequência, menos o H, que aparece metade das vezes que os outros.',
  ]),
  orientation: tr(
    'Sostén el cubo con el blanco abajo, el amarillo arriba y el verde al frente. Las figuras muestran la cara amarilla vista desde arriba: el lado inferior del dibujo es el frente. En «Cómo reconocerlo», izquierda y derecha son siempre como ves el cubo desde el frente, también en el lado de atrás.',
    'Hold the cube with white on the bottom, yellow on top and green facing front. The diagrams show the yellow face from above: the bottom of the diagram is the front. In "How to recognize it", left and right are always as you see the cube from the front, even on the back side.',
    'Segure o cubo com o branco embaixo, o amarelo em cima e o verde para a frente. As figuras mostram a face amarela vista de cima: a parte inferior do desenho é a frente. Em "Como reconhecer", esquerda e direita são sempre como você vê o cubo de frente, mesmo no lado de trás.',
  ),
  before: { path: '/academia/cfop-completo#academy-cfopc-oll', label: tr('Antes: el OCLL, en el OLL de CFOP completo', 'Before: OCLL, in Full CFOP\'s OLL', 'Antes: o OCLL, no OLL do CFOP completo') },
  phases: [
    {
      id: 'coll-casos',
      name: tr('Los 40 casos', 'The 40 cases', 'Os 40 casos'),
      goal: doc(
        ['**Meta:** la cara amarilla completa y las 4 esquinas bien colocadas entre sí: como mucho, un giro de `U` las deja en su sitio. Después solo falta el EPLL, el PLL que mueve solo las aristas.', '**Casos:** 40, en 7 grupos según la forma del amarillo: H, Pi, U, T, L, Sune y Antisune.'],
        ['**Goal:** the yellow face complete and the 4 corners placed correctly relative to each other: at most one `U` turn puts them in place. Then only EPLL is left, the PLL that moves only the edges.', '**Cases:** 40, in 7 groups by the shape of the yellow: H, Pi, U, T, L, Sune and Antisune.'],
        ['**Meta:** a face amarela completa e as 4 quinas bem posicionadas entre si: no máximo um movimento de `U` as deixa no lugar. Depois só falta o EPLL, o PLL que move só as arestas.', '**Casos:** 40, em 7 grupos, conforme a forma do amarelo: H, Pi, U, T, L, Sune e Antisune.'],
      ),
      description: doc([
        '## Cómo se hace',
        '1. Mira la forma del amarillo: cuántas esquinas lo tienen arriba y hacia dónde miran las demás. Eso te da el grupo.',
        '2. Elige una figura del grupo y gira la capa de arriba (AUF) hasta que tu amarillo quede igual que en ella. En un mismo grupo, cada figura puede tener el amarillo en otra posición.',
        '3. Mira las pegatinas de los lados de las esquinas. Busca faros (dos pegatinas iguales en un lado) y lados con colores **opuestos** (verde y azul, o rojo y naranja) o **vecinos** (cualquier otra combinación).',
        '4. Si los lados coinciden con la figura, ese es tu caso. Si no, prueba con otra figura del grupo.',
        '5. Haz el algoritmo y termina con el EPLL.',
        'Las aristas no cuentan: estén como estén, el caso es el mismo.',
      ], [
        '## How to do it',
        '1. Look at the shape of the yellow: how many corners have it on top and which way the others face. That gives you the group.',
        '2. Pick a diagram from the group and turn the top layer (AUF) until the yellow on your cube matches it. Within a group, each diagram can have the yellow in a different position.',
        "3. Check the corners' side stickers. Look for headlights (two matching stickers on one side) and for sides with **opposite** colors (green and blue, or red and orange) or **adjacent** ones (any other combination).",
        "4. If the sides match the diagram, that's your case. If not, try another diagram from the group.",
        '5. Do the algorithm and finish with EPLL.',
        "The edges don't matter: wherever they are, the case is the same.",
      ], [
        '## Como fazer',
        '1. Olhe a forma do amarelo: quantas quinas têm o amarelo em cima e para onde olham as outras. Isso indica o grupo.',
        '2. Escolha uma figura do grupo e gire a camada de cima (AUF) até o seu amarelo ficar igual ao dela. No mesmo grupo, cada figura pode ter o amarelo em outra posição.',
        '3. Olhe os adesivos dos lados das quinas. Procure faróis (dois adesivos iguais num lado) e lados com cores **opostas** (verde e azul, ou vermelho e laranja) ou **vizinhas** (qualquer outra combinação).',
        '4. Se os lados batem com a figura, esse é o seu caso. Se não, tente outra figura do grupo.',
        '5. Faça o algoritmo e termine com o EPLL.',
        'As arestas não contam: estejam como estiverem, o caso é o mesmo.',
      ]),
      tips: doc([
        '- **La cruz amarilla no está hecha:** COLL no sirve. Haz el OLL de siempre.',
        '- **No encuentras el caso:** gira la capa de arriba y vuelve a comparar. Cada figura de un grupo puede tener el amarillo en otra posición, y sus lados solo coinciden cuando tu amarillo está igual que en ella.',
        '- **Las esquinas quedaron mal:** quizá confundiste vecinos y opuestos. Solo son opuestos verde y azul, y rojo y naranja. Cualquier otra combinación es de vecinos.',
        '- **Aún no sabes el caso:** haz el OCLL y el PLL de siempre. Si sabes el OCLL, ya tienes 7 casos: H 1, Pi 1, U 3, T 5, L 3, S 1 y AS 1.',
      ], [
        "- **The yellow cross isn't done:** COLL doesn't apply. Do the usual OLL.",
        "- **You can't find the case:** turn the top layer and compare again. Each diagram in a group can have the yellow in a different position, and its sides only line up with yours once your yellow looks the same as in that diagram.",
        '- **The corners came out wrong:** maybe you mixed up adjacent and opposite. Only green and blue, and red and orange, are opposite. Any other combination is adjacent.',
        "- **You don't know the case yet:** do the usual OCLL and PLL. If you know OCLL, you already have 7 cases: H 1, Pi 1, U 3, T 5, L 3, S 1 and AS 1.",
      ], [
        '- **A cruz amarela não está feita:** o COLL não serve. Faça o OLL de sempre.',
        '- **Não encontra o caso:** gire a camada de cima e compare de novo. Cada figura de um grupo pode ter o amarelo em outra posição, e os lados dela só batem quando o seu amarelo está igual ao dela.',
        '- **As quinas ficaram erradas:** talvez você tenha confundido vizinhas e opostas. Só são opostas verde e azul, e vermelho e laranja. Qualquer outra combinação é de vizinhas.',
        '- **Ainda não sabe o caso:** faça o OCLL e o PLL de sempre. Se você sabe o OCLL, já tem 7 casos: H 1, Pi 1, U 3, T 5, L 3, S 1 e AS 1.',
      ]),
      diagram: 'top',
      groups: [h, pi, u, t, l, s, as],
      quizzes: [],
    },
  ],
};

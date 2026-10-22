// "Roux": two 1x2x3 blocks (left, then right), the top corners (CMLL, 42 cases) and the last six edges with M and U
// (LSE: orient them, place UL and UR, finish the M slice). Stages roux-fb, roux-sb, cmll, lse-eo, lse-ulur, lse-4c
// (types.ts): the M slice's centers may be off by M turns until the end. Case ids: roux-<slug>; SpeedCubeDB:
// scdbUrl('CMLL', 'Anti_Sune_Left_Bar').
// CMLL: SpeedCubeDB's list (/a/3x3/CMLL, read 2026-10-22): main = #1 as the site writes it (its leading U keeps the
// site's view), extras = its #2-#4 minus the ones with a y or z rotation or an M2 net turn (Practicar undoes each one on
// its own, so the blocks must come out in place). Blocks and LSE: intuitive examples, each the shortest <M, U> (or
// block-move) solution found by search; every algorithm's M turns add up to a whole turn, so its setup (the algorithm
// undone, centers fixed) starts with the M slice lined up and the blocks in place.
// Recognition texts describe each setup as its diagram shows it (blocks: from the block's side; CMLL: from above).
import { loc, type Localized } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { scdbUrl } from './scdb.ts';
import type { Case, Method, Stage } from './types.ts';

const tr = (es: string, en: string): Localized => ({ es, en });
const doc = (es: string[], en: string[]): Localized => tr(es.join('\n'), en.join('\n'));
// A case code is a plain string shown as is: the visitor's language, picked when the data loads.
const word = (es: string, en: string) => loc(tr(es, en));

type T = [es: string, en: string];
type Alt = [rank: number, alg: string];
interface Row {
  slug: string;
  stage: Stage;
  code: T;
  name: T;
  recognition: T;
  alg: string;
  alts?: Alt[]; // SpeedCubeDB extras (CMLL); the main algorithm is then its #1
  scdb?: string; // CMLL page id, e.g. 'Sune_X'
  note?: T;
}

function kase(r: Row): Case {
  const algs: Case['algs'] = [r.scdb ? { id: 'main', alg: r.alg, source: 'speedcubedb', rank: 1 } : { id: 'main', alg: r.alg, source: 'community' }];
  for (const [rank, alg] of r.alts ?? []) algs.push({ id: `scdb-${rank}`, alg, source: 'speedcubedb', rank });
  return {
    id: `roux-${r.slug}`,
    code: word(...r.code),
    name: tr(...r.name),
    recognition: tr(...r.recognition),
    stage: r.stage,
    algs,
    setup: invertTokens(centerMoves(r.alg, IDENTITY)).join(' '), // face turns: M and r undone too
    scdb: r.scdb ? { set: 'CMLL', id: r.scdb, url: scdbUrl('CMLL', r.scdb) } : null,
    ...(r.note ? { note: tr(...r.note) } : {}),
  };
}

// --- 1. First block: the last pair, with the rest of the block done. Seen from the front-left (red left, green right) ---
const fb = (slug: string, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `fb-${slug}`, stage: 'roux-fb', code, name, recognition, alg, note });

const fbFront = [
  fb('delante-arriba', ['Frente', 'Front'], ['Par arriba, al frente', 'Pair on top, in front'],
    ['Cuadrado de atrás hecho. El par de adelante está formado arriba, sobre la cara verde: verde al frente, rojo arriba y el blanco de la esquina mirando a la cara roja',
      "Back square done. The front pair is joined on top, above the green face: green in front, red on top and the corner's white facing the red side"], "F'",
    ['Un solo giro: `F` y `B` sirven mientras su ranura del bloque esté libre.', 'A single turn: `F` and `B` work while their slot of the block is empty.']),
  fb('delante-derecha', ['Frente der.', 'Front right'], ['Par arriba, a la derecha', 'Pair on top, on the right'],
    ['Cuadrado de atrás hecho. El par de adelante está formado arriba al frente, hacia la derecha: verde arriba, rojo al frente y el blanco de la esquina mirando a la derecha',
      "Back square done. The front pair is joined on top at the front, towards the right: green on top, red in front and the corner's white facing right"], "L' U L",
    ["`L'` sube la ranura, `U` pone el par encima y `L` baja todo junto: como un par del F2L.", "`L'` lifts the slot, `U` puts the pair above it and `L` brings it all down: like an F2L pair."]),
  fb('delante-abajo', ['Abajo', 'Bottom'], ['Par abajo, al frente', 'Pair on the bottom, in front'],
    ['Cuadrado de atrás hecho. El par de adelante está formado abajo, en la cara verde a la derecha de la ranura: verde al frente, rojo abajo y el blanco de la esquina mirando a la derecha',
      "Back square done. The front pair is joined on the bottom, on the green face right of the slot: green in front, red on the bottom and the corner's white facing right"], 'F',
    ['Los pares se pueden armar abajo, en la capa `M` y a la derecha: aún están libres.', 'Pairs can be built on the bottom, in the `M` layer and on the right: they are still free.']),
];
const fbBack = [
  fb('atras-arriba', ['Atrás', 'Back'], ['Par arriba, atrás', 'Pair on top, at the back'],
    ['Par de adelante hecho. El de atrás está formado arriba, atrás a la izquierda: rojo arriba, azul atrás y el blanco de la esquina mirando a la cara roja',
      "Front pair done. The back one is joined on top, at the back left: red on top, blue at the back and the corner's white facing the red side"], 'B'),
  fb('atras-derecha', ['Atrás der.', 'Back right'], ['Par arriba, atrás a la derecha', 'Pair on top, at the back right'],
    ['Par de adelante hecho. El de atrás está formado arriba, atrás a la derecha: azul arriba, rojo atrás y el blanco de la esquina mirando a la derecha',
      "Front pair done. The back one is joined on top, at the back right: blue on top, red at the back and the corner's white facing right"], "L U' L'",
    ["El espejo de `L' U L` para la ranura de atrás.", "The mirror of `L' U L` for the back slot."]),
];

// --- 2. Second block: the same on the right with R, r, M and U only. Seen from the front-right (green left, orange right) ---
const sb = (slug: string, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `sb-${slug}`, stage: 'roux-sb', code, name, recognition, alg, note });

const sbFront = [
  sb('delante-izquierda', ['Frente izq.', 'Front left'], ['Par arriba, al frente a la izquierda', 'Pair on top, front left'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba al frente, hacia la izquierda: verde arriba, naranja al frente y el blanco de la esquina mirando a la izquierda',
      "First block and back square done. The front pair is joined on top at the front, towards the left: green on top, orange in front and the corner's white facing left"], "R U' R'"),
  sb('delante-derecha', ['Derecha', 'Right'], ['Par arriba, a la derecha', 'Pair on top, on the right'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba a la derecha: verde arriba, naranja a la derecha y el blanco de la esquina mirando al frente',
      "First block and back square done. The front pair is joined on top on the right: green on top, orange on the right and the corner's white facing front"], "U R U' R'",
    ["`U` lo deja al frente a la izquierda: es el caso de `R U' R'`.", "`U` leaves it at the front left: it is the `R U' R'` case."]),
  sb('delante-r', ['Frente der.', 'Front right'], ['Par arriba, con r', 'Pair on top, with r'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba al frente, hacia la derecha: naranja arriba, verde al frente y el blanco de la esquina mirando a la derecha',
      "First block and back square done. The front pair is joined on top at the front, towards the right: orange on top, green in front and the corner's white facing right"], "r U r'",
    ['`r` sube la ranura junto con la capa `M`: las aristas del medio aún no importan.', '`r` lifts the slot together with the `M` layer: the middle edges do not matter yet.']),
];
const sbBack = [
  sb('atras-izquierda', ['Atrás izq.', 'Back left'], ['Par arriba, atrás a la izquierda', 'Pair on top, back left'],
    ['Primer bloque y par de adelante hechos. El de atrás está formado arriba, atrás hacia la izquierda: azul arriba, naranja atrás y el blanco de la esquina mirando a la izquierda',
      "First block and front pair done. The back one is joined on top at the back, towards the left: blue on top, orange at the back and the corner's white facing left"], "R' U R"),
  sb('atras-r', ['Atrás der.', 'Back right'], ['Par arriba, atrás con r', 'Pair on top, back with r'],
    ['Primer bloque y par de adelante hechos. El de atrás está formado arriba, atrás a la derecha: naranja arriba, azul atrás y el blanco de la esquina mirando a la derecha',
      "First block and front pair done. The back one is joined on top at the back right: orange on top, blue at the back and the corner's white facing right"], "r' U' r",
    ["Como `r U r'`, hacia atrás.", "Like `r U r'`, towards the back."]),
];

// --- 3. CMLL: the 42 cases, by the shape of the yellow stickers (as in OCLL). Side stickers: front left to right,
// right and left sides front to back, back left to right as the figure shows them ---
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const cmll = (shape: T) => (slug: string, code: string, name: T, scdb: string, look: T, alg: string, alts: Alt[]) =>
  kase({ slug: `cmll-${slug}`, stage: 'cmll', code: [code, code], name, recognition: [`${shape[0]}. ${cap(look[0])}`, `${shape[1]}. ${cap(look[1])}`], alg, alts, scdb });

const cO = cmll(['Las 4 amarillas arriba', 'All 4 yellows on top']);
const cH = cmll(['0 amarillas arriba: dos miran al frente y dos atrás', 'No yellows on top: two face front and two face back']);
const cPi = cmll(['0 amarillas arriba: dos miran a la izquierda; a la derecha, una al frente y otra atrás', 'No yellows on top: two face left; on the right, one faces front and one faces back']);
const cU = cmll(['2 amarillas arriba, las de adelante; las de atrás miran atrás', '2 yellows on top, the front ones; the back ones face back']);
const cT = cmll(['2 amarillas arriba, las de adelante; las de atrás miran a los lados', '2 yellows on top, the front ones; the back ones face the sides']);
const cS = cmll(['1 amarilla arriba, adelante a la derecha; la de adelante a la izquierda mira a la izquierda', '1 yellow on top, front right; the front-left one faces left']);
const cAS = cmll(['1 amarilla arriba, adelante a la izquierda; la de adelante a la derecha mira a la derecha', '1 yellow on top, front left; the front-right one faces right']);
const cL = cmll(['2 amarillas arriba en diagonal (adelante a la derecha y atrás a la izquierda); la de adelante a la izquierda mira a la izquierda', '2 yellows on top in a diagonal (front right and back left); the front-left one faces left']);

const cmllO = [
  cO('o-adjacent', 'O Adj', ['O Adyacente', 'O Adjacent'], 'O_Adjacent',
    ['faros azules a la izquierda; en los otros 3 lados, colores distintos',
      'blue headlights on the left; on the other 3 sides, different colors'],
    "R U R' F' R U R' U' R' F R2 U' R'", [[2, "R U R' U' R' F R2 U' R' U' R U R' F'"], [3, "r U R' F' R U R' U' R' F R2 U' r'"], [4, "R U2 R' U' R U2 r' F R' F' r"]]),
  cO('o-diagonal', 'O Diag', ['O Diagonal', 'O Diagonal'], 'O_Diagonal',
    ['ningún faro: en los 4 lados, colores opuestos',
      'no headlights: opposite colors on all 4 sides'],
    "F R U' R' U' R U R' F' R U R' U' R' F R F'", [[2, "R U' R2 F R F' R U' B U2 B' R'"], [3, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [4, "r2 D' r U' r' D r2 F' r' U r F"]]),
];
const cmllH = [
  cH('h-columns', 'H Columns', ['H Columnas', 'H Columns'], 'H_Columns',
    ['a la derecha, rojo adelante y naranja atrás (opuestos); a la izquierda, rojo adelante y naranja atrás (opuestos)',
      'on the right, red in front and orange at the back (opposite colors); on the left, red in front and orange at the back (opposite colors)'],
    "U R U R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U' R'"], [3, "r U' r' U' r U r' U r U r'"], [4, "r U' r' U' r U' r' U r U r'"]]),
  cH('h-rows', 'H Rows', ['H Filas', 'H Rows'], 'H_Rows',
    ['faros rojos a la derecha; faros naranjas a la izquierda',
      'red headlights on the right; orange headlights on the left'],
    "F R U R' U' R U R' U' R U R' U' F'", [[2, "F U R U' R' U R U' R' U R U' R' F'"], [3, "F U' R2 D R' U2 R D' R2 U F'"], [4, "F R U r' U' R U R' U' R U R' M' U' F'"]]),
  cH('h-column', 'H Column', ['H Columna', 'H Column'], 'H_Column',
    ['a la derecha, azul adelante y verde atrás (opuestos); faros naranjas a la izquierda',
      'on the right, blue in front and green at the back (opposite colors); orange headlights on the left'],
    "R' F2 D R2 U R2 D' F2 R", [[2, "U R U2 R2 F R F' U2 R' F R F'"], [3, "U' F R U R' U' R U' R' U R U R' F'"], [4, "U F R U R' U' F' R U R' U' R' F R F'"]]),
  cH('h-row', 'H Row', ['H Fila', 'H Row'], 'H_Row',
    ['a la derecha, rojo adelante y azul atrás; a la izquierda, naranja adelante y azul atrás',
      'on the right, red in front and blue at the back; on the left, orange in front and blue at the back'],
    "U2 r U' r2 D' r U' r' D r2 U r'", [[2, "U' R U R' U R U r' F R' F' r"], [3, "U' R U R' U R U L' U R' U' L"], [4, "U2 R U' R2 D' r U' r' D R2 U R'"]]),
];
const cmllPi = [
  cPi('pi-right-bar', 'Pi Right Bar', ['Pi Barra derecha', 'Pi Right Bar'], 'Pi_Right_Bar',
    ['al frente, rojo a la izquierda; a la derecha, verde adelante y azul atrás (opuestos); atrás, rojo a la izquierda',
      'in front, red on the left; on the right, green in front and blue at the back (opposite colors); at the back, red on the left'],
    "F R U R' U' R U R' U' F'", [[2, "r' U r2 U' r2 U' r2 U r'"], [3, "U2 F U R U' R' U R U' R' F'"], [4, "R U2 R2 U' R2 U' R2 U2 R"]]),
  cPi('pi-down-slash', 'Pi Down Slash', ['Pi Diagonal abajo', 'Pi Down Slash'], 'Pi_Down_Slash',
    ['al frente, naranja a la izquierda; a la derecha, azul adelante y naranja atrás; atrás, verde a la izquierda',
      'in front, orange on the left; on the right, blue in front and orange at the back; at the back, green on the left'],
    "U F R' F' R U2 R U' R' U R U2 R'", [[2, "U F U R U' R2 F' R U2 R U2 R'"], [3, "U M F R' F' r U2 R U' R' U R U2 R'"], [4, "R' U2 R U R' U' R U2 R f' U' f"]]),
  cPi('pi-x', 'Pi X', ['Pi X', 'Pi X'], 'Pi_X',
    ['al frente, naranja a la izquierda; faros rojos a la derecha; atrás, naranja a la izquierda',
      'in front, orange on the left; red headlights on the right; at the back, orange on the left'],
    "R' F2 D R2 U' R2 D' F2 R", [[2, "U' R' F R U F U' R U R' U' F'"], [3, "r' F2 D R2 U' R2 D' F2 r"], [4, "U' F R U' R' U' R U R' U R U' R' F'"]]),
  cPi('pi-up-slash', 'Pi Up Slash', ['Pi Diagonal arriba', 'Pi Up Slash'], 'Pi_Up_Slash',
    ['al frente, naranja a la izquierda; a la derecha, verde adelante y rojo atrás; atrás, verde a la izquierda',
      'in front, orange on the left; on the right, green in front and red at the back; at the back, green on the left'],
    "R U2 R' U' R U R' U2 R' F R F'", [[2, "R U2 R' U2 R' F R2 U R' U' F'"], [3, "R U2 R' U' R U R' U2 r' F R F' M'"], [4, "R U R' U' R' F R2 U R' U' R U R' U' F'"]]),
  cPi('pi-columns', 'Pi Columns', ['Pi Columnas', 'Pi Columns'], 'Pi_Columns',
    ['al frente, naranja a la izquierda; a la derecha, rojo adelante y naranja atrás (opuestos); atrás, rojo a la izquierda',
      'in front, orange on the left; on the right, red in front and orange at the back (opposite colors); at the back, red on the left'],
    "U' r U' r2 D' r U r' D r2 U r'", [[2, "U2 R' F R F' r U' r' U' R U' R'"], [3, "U2 R' F R F' r U' R' U' R U' r'"], [4, "U2 L' U R U' L U' R' U' R U' R'"]]),
  cPi('pi-left-bar', 'Pi Left Bar', ['Pi Barra izquierda', 'Pi Left Bar'], 'Pi_Left_Bar',
    ['al frente, naranja a la izquierda; faros verdes a la derecha; atrás, rojo a la izquierda',
      'in front, orange on the left; green headlights on the right; at the back, red on the left'],
    "U' R' U' R' F R F' R U' R' U2 R", [[2, "R' F' U' F U' R U R' U R"], [3, "U2 R U R' U R U' B U' B' R'"], [4, "U' r U R' U R' F R F' R U' R' U R U2 r'"]]),
];
const cmllU = [
  cU('u-up-slash', 'U Up Slash', ['U Diagonal arriba', 'U Up Slash'], 'U_Up_Slash',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante y azul atrás; a la izquierda, verde adelante y rojo atrás',
      'in front, orange on the left and blue on the right; on the right, red in front and blue at the back; on the left, green in front and red at the back'],
    "U2 R2 D R' U2 R D' R' U2 R'", [[2, "U2 R r D r' U2 r D' r' U2 R'"], [3, "F R' F' U2 R U R U' R' U R' U R"], [4, "L2 D L' U2 L D' L' U2 L'"]]),
  cU('u-down-slash', 'U Down Slash', ['U Diagonal abajo', 'U Down Slash'], 'U_Down_Slash',
    ['al frente, verde a la izquierda y naranja a la derecha; a la derecha, azul adelante y rojo atrás; a la izquierda, rojo adelante y verde atrás',
      'in front, green on the left and orange on the right; on the right, blue in front and red at the back; on the left, red in front and green at the back'],
    "R2 D' R U2 R' D R U2 R", [[2, "R' F R U R' F R U F U2 F'"], [3, "U2 L2 D' L U2 L' D L U2 L"], [4, "l' U l U l' U l U F U2 F'"]]),
  cU('u-bottom-row', 'U Bottom Row', ['U Fila de abajo', 'U Bottom Row'], 'U_Bottom_Row',
    ['faros verdes al frente; a la derecha, naranja adelante y azul atrás; a la izquierda, rojo adelante y azul atrás',
      'green headlights in front; on the right, orange in front and blue at the back; on the left, red in front and blue at the back'],
    "R' U' R U' R' U2 R2 U R' U R U2 R'", [[2, "U' R2 F2 r U r' F R2 U2 r' U' r"], [3, "R2 F U' F U F2 R2 U' R' F R"], [4, "U2 R U R' U R U2 R2 U' R U' R' U2 R"]]),
  cU('u-rows', 'U Rows', ['U Filas', 'U Rows'], 'U_Rows',
    ['faros verdes al frente; a la derecha, naranja adelante y rojo atrás (opuestos); a la izquierda, rojo adelante y naranja atrás (opuestos)',
      'green headlights in front; on the right, orange in front and red at the back (opposite colors); on the left, red in front and orange at the back (opposite colors)'],
    "U' F R2 D R' U R D' R2 U' F'", [[2, "F U R2 D R' U' R D' R2 F'"], [3, "U' R' U' R F R2 D' R U R' D R2 U' F'"], [4, "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R"]]),
  cU('u-x', 'U X', ['U X', 'U X'], 'U_X',
    ['al frente, naranja a la izquierda y rojo a la derecha (opuestos); a la derecha, verde adelante y azul atrás (opuestos); a la izquierda, verde adelante y azul atrás (opuestos)',
      'in front, orange on the left and red on the right (opposite colors); on the right, green in front and blue at the back (opposite colors); on the left, green in front and blue at the back (opposite colors)'],
    "U2 r U' r' U r' D' r U' r' D r", [[2, "F R U' R' U R U R' U R U' R' F'"], [3, "r' U r' D' r U r' D r U' r"], [4, "U' R' D R U' R U' R' U R' D' R"]]),
  cU('u-upper-row', 'U Upper Row', ['U Fila de arriba', 'U Upper Row'], 'U_Upper_Row',
    ['al frente, verde a la izquierda y azul a la derecha (opuestos); a la derecha, rojo adelante y azul atrás; a la izquierda, rojo adelante y verde atrás',
      'in front, green on the left and blue on the right (opposite colors); on the right, red in front and blue at the back; on the left, red in front and green at the back'],
    "U' F R U R' U' F'", [[2, "U F U R U' R' F'"], [3, "U' F U' R' U R U F' R' U2 R"], [4, "R' F' U' F U R"]]),
];
const cmllT = [
  cT('t-left-bar', 'T Left Bar', ['T Barra izquierda', 'T Left Bar'], 'T_Left_Bar',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante; atrás, azul a la izquierda y rojo a la derecha; a la izquierda, verde adelante',
      'in front, orange on the left and blue on the right; on the right, red in front; at the back, blue on the left and red on the right; on the left, green in front'],
    "U' R U R' U' R' F R F'", [[2, "U' r U R' U' r' F R F'"], [4, "U L U L' U' L' f U f'"]]),
  cT('t-right-bar', 'T Right Bar', ['T Barra derecha', 'T Right Bar'], 'T_Right_Bar',
    ['al frente, azul a la izquierda y rojo a la derecha; a la derecha, verde adelante; atrás, naranja a la izquierda y azul a la derecha; a la izquierda, naranja adelante',
      'in front, blue on the left and red on the right; on the right, green in front; at the back, orange on the left and blue on the right; on the left, orange in front'],
    "U L' U' L U L F' L' F", [[2, "U r' F' r U r U' r' F"], [3, "U' F R U' R' U R U R' F'"], [4, "U2 R' U' R' D' R U R' D R2"]]),
  cT('t-rows', 'T Rows', ['T Filas', 'T Rows'], 'T_Rows',
    ['faros verdes al frente; a la derecha, naranja adelante; atrás, rojo a la izquierda y naranja a la derecha (opuestos); a la izquierda, rojo adelante',
      'green headlights in front; on the right, orange in front; at the back, red on the left and orange on the right (opposite colors); on the left, red in front'],
    "R U2 R' U' R U' R2 U2 R U R' U R", [[2, "F R' F R2 U' R' U' R U R' F2"], [3, "r' U r U2 R2 F' r U' r' F2 R2"], [4, "U' R U R' U R U2 R2 F' r U' r' F2 R"]]),
  cT('t-bottom-row', 'T Bottom Row', ['T Fila de abajo', 'T Bottom Row'], 'T_Bottom_Row',
    ['faros azules al frente; a la derecha, rojo adelante; faros verdes atrás; a la izquierda, naranja adelante',
      'blue headlights in front; on the right, red in front; green headlights at the back; on the left, orange in front'],
    "r' U r U2 R2 F R F' R", [[2, "R U R2 F R F' U r U r'"], [3, "U2 r U' r' U' F R' F' R2 U' R'"]]),
  cT('t-top-row', 'T Top Row', ['T Fila de arriba', 'T Top Row'], 'T_Top_Row',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul adelante; atrás, naranja a la izquierda y rojo a la derecha (opuestos); a la izquierda, azul adelante',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue in front; at the back, orange on the left and red on the right (opposite colors); on the left, blue in front'],
    "r' D' r U r' D r U' r U r'", [[2, "U R' D R U' R U R' U R' D' R"], [3, "U2 F R U R' U' R U' R' U' R U R' F'"], [4, "R F R' U' R F' R' U R' F' R"]]),
  cT('t-columns', 'T Columns', ['T Columnas', 'T Columns'], 'T_Columns',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul adelante; faros verdes atrás; a la izquierda, azul adelante',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue in front; green headlights at the back; on the left, blue in front'],
    "U2 r U' r2 D' r U2 r' D r2 U r'", [[2, "U2 r2 D' r U r' D r2 U' r' U' r"], [3, "R' U R2 D r' U2 r D' R2 U' R"], [4, "U2 R' F R2 F R' U2 R F' R2 F' R"]]),
];
const cmllS = [
  cS('s-left-bar', 'Sune Left Bar', ['Sune Barra izquierda', 'Sune Left Bar'], 'Sune_Left_Bar',
    ['al frente, verde a la izquierda y naranja a la derecha; a la derecha, azul adelante; atrás, azul a la derecha; a la izquierda, rojo atrás',
      'in front, green on the left and orange on the right; on the right, blue in front; at the back, blue on the right; on the left, red at the back'],
    "U R U R' U R U2 R'", [[2, "R' U2 R U R' U R"], [3, "U r U R' U R U2 r'"], [4, "U' L U L' U L U2 L'"]]),
  cS('s-x', 'Sune X', ['Sune X', 'Sune X'], 'Sune_X',
    ['al frente, azul a la izquierda y verde a la derecha (opuestos); a la derecha, naranja adelante; atrás, naranja a la derecha; a la izquierda, rojo atrás',
      'in front, blue on the left and green on the right (opposite colors); on the right, orange in front; at the back, orange on the right; on the left, red at the back'],
    "U L' U2 L U2 r U' r' F", [[2, "U r' F2 r U2 r U' r' F"], [3, "U L' U2 L U2 L F' L' F"], [4, "U R' F2 R U2 R U' r' F M'"]]),
  cS('s-up-slash', 'Sune Up Slash', ['Sune Diagonal arriba', 'Sune Up Slash'], 'Sune_Up_Slash',
    ['al frente, rojo a la izquierda y verde a la derecha; a la derecha, naranja adelante; atrás, azul a la derecha; a la izquierda, naranja atrás',
      'in front, red on the left and green on the right; on the right, orange in front; at the back, blue on the right; on the left, orange at the back'],
    "U F R' F' R U2 R U2 R'", [[3, "U M F R' F' r U2 R U2 R'"], [4, "U F U R U' R2 F' R U R U' R'"]]),
  cS('s-columns', 'Sune Columns', ['Sune Columnas', 'Sune Columns'], 'Sune_Columns',
    ['al frente, naranja a la izquierda y rojo a la derecha (opuestos); a la derecha, verde adelante; atrás, azul a la derecha; a la izquierda, verde atrás',
      'in front, orange on the left and red on the right (opposite colors); on the right, green in front; at the back, blue on the right; on the left, green at the back'],
    "U R U R' U' R' F R F' R U R' U R U2 R'", [[2, "R U R' U R U' R D R' U' R D' R2"], [3, "U2 r' F' r2 U R' F' r' F R2 U' R'"], [4, "F R' U2 R F' R' F U2 F' R"]]),
  cS('s-right-bar', 'Sune Right Bar', ['Sune Barra derecha', 'Sune Right Bar'], 'Sune_Right_Bar',
    ['al frente, rojo a la izquierda y azul a la derecha; a la derecha, rojo adelante; atrás, naranja a la derecha; a la izquierda, verde atrás',
      'in front, red on the left and blue on the right; on the right, red in front; at the back, orange on the right; on the left, green at the back'],
    "U' R U R' U R' F R F' R U2 R'", [[2, "U' R U R' U r' F R F' r U2 R'"], [3, "U' R U R' F' R U R' U R U2 R' F R U' R'"]]),
  cS('s-down-slash', 'Sune Down Slash', ['Sune Diagonal abajo', 'Sune Down Slash'], 'Sune_Down_Slash',
    ['al frente, naranja a la izquierda y verde a la derecha; a la derecha, naranja adelante; atrás, azul a la derecha; a la izquierda, rojo atrás',
      'in front, orange on the left and green on the right; on the right, orange in front; at the back, blue on the right; on the left, red at the back'],
    "U r U' r' F R' F' R", [[2, "U R U' r' F R' F' r"], [3, "U R U' L' U R' U' L"], [4, "U' L U' R' U L' U' R"]]),
];
const cmllAS = [
  cAS('as-right-bar', 'AS Right Bar', ['Antisune Barra derecha', 'Antisune Right Bar'], 'Anti_Sune_Right_Bar',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo atrás; atrás, verde a la izquierda; a la izquierda, verde adelante',
      'in front, orange on the left and blue on the right; on the right, red at the back; at the back, green on the left; on the left, green in front'],
    "U R' U' R U' R' U2 R", [[2, "U2 R U2 R' U' R U' R'"], [3, "U' L' U' L U' L' U2 L"], [4, "U r' U' R U' R' U2 r"]]),
  cAS('as-columns', 'AS Columns', ['Antisune Columnas', 'Antisune Columns'], 'Anti_Sune_Columns',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul atrás; atrás, verde a la izquierda; a la izquierda, azul adelante',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue at the back; at the back, green on the left; on the left, blue in front'],
    "U2 R U R2 F' r F R U' r2 F r", [[2, "U' R2 D R' U R D' R' U R' U' R U' R'"], [3, "U2 R' U' R U' R' U R' D' R U R' D R2"], [4, "U' R' F U2 F' R F R' U2 R F'"]]),
  cAS('as-down-slash', 'AS Down Slash', ['Antisune Diagonal abajo', 'Antisune Down Slash'], 'Anti_Sune_Down_Slash',
    ['al frente, verde a la izquierda y naranja a la derecha; a la derecha, rojo atrás; atrás, azul a la izquierda; a la izquierda, rojo adelante',
      'in front, green on the left and orange on the right; on the right, red at the back; at the back, blue on the left; on the left, red in front'],
    "U' F' L F L' U2 L' U2 L", [[2, "U' F' r U r' U2 r' F2 r"], [3, "U' F' r U r' U2 L' U2 L"], [4, "U2 F R U' R' U R U2 R' U' F'"]]),
  cAS('as-x', 'AS X', ['Antisune X', 'Antisune X'], 'Anti_Sune_X',
    ['al frente, verde a la izquierda y azul a la derecha (opuestos); a la derecha, naranja atrás; atrás, rojo a la izquierda; a la izquierda, rojo adelante',
      'in front, green on the left and blue on the right (opposite colors); on the right, orange at the back; at the back, red on the left; on the left, red in front'],
    "U' R U2 R' U2 R' F R F'", [[2, "U' R U2 R' U2 r' F R F' M'"], [3, "U' R U R' U' R' F R2 U R' U' F'"]]),
  cAS('as-up-slash', 'AS Up Slash', ['Antisune Diagonal arriba', 'Antisune Up Slash'], 'Anti_Sune_Up_Slash',
    ['al frente, verde a la izquierda y rojo a la derecha; a la derecha, naranja atrás; atrás, azul a la izquierda; a la izquierda, rojo adelante',
      'in front, green on the left and red on the right; on the right, orange at the back; at the back, blue on the left; on the left, red in front'],
    "U' R' F R F' r U r'", [[2, "U' r' F R F' r U R'"], [3, "U' L' U R U' L U R'"], [4, "U R' U L U' R U L'"]]),
  cAS('as-left-bar', 'AS Left Bar', ['Antisune Barra izquierda', 'Antisune Left Bar'], 'Anti_Sune_Left_Bar',
    ['al frente, azul a la izquierda y naranja a la derecha; a la derecha, verde atrás; atrás, rojo a la izquierda; a la izquierda, naranja adelante',
      'in front, blue on the left and orange on the right; on the right, green at the back; at the back, red on the left; on the left, orange in front'],
    "U R U2 R' F R' F' R U' R U' R'", [[2, "R' U' R U' R' U R' F R F' U R"], [3, "U R U2 r' F R' F' r U' R U' R'"], [4, "U L' U' L U' L F' L' F L' U2 L"]]),
];
const cmllL = [
  cL('l-best', 'L Best', ['L Best', 'L Best'], 'L_Best',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante y naranja atrás (opuestos); atrás, rojo a la izquierda; a la izquierda, verde atrás',
      'in front, orange on the left and blue on the right; on the right, red in front and orange at the back (opposite colors); at the back, red on the left; on the left, green at the back'],
    "U' F' r U r' U' r' F r", [[2, "U2 F R U' R' U' R U R' F'"], [3, "R2 D' R U' R' D R U R"], [4, "U' F' L F L' U' L' U L"]]),
  cL('l-good', 'L Good', ['L Good', 'L Good'], 'L_Good',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul adelante y rojo atrás; atrás, verde a la izquierda; a la izquierda, naranja atrás',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue in front and red at the back; at the back, green on the left; on the left, orange at the back'],
    "U2 F R' F' R U R U' R'", [[2, "U2 F R' F' r U R U' r'"], [3, "U2 R U R' U' R' F R F' R U R' U' R' F R F'"], [4, "U' r U' r' U' F' U F"]]),
  cL('l-pure', 'L Pure', ['L Pura', 'L Pure'], 'L_Pure',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante y verde atrás; atrás, verde a la izquierda; a la izquierda, naranja atrás',
      'in front, orange on the left and blue on the right; on the right, red in front and green at the back; at the back, green on the left; on the left, orange at the back'],
    "R U R' U R U' R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U R' U' R U' R'"], [3, "U' R' U2 R U R' U' R U R' U' R U R' U R"], [4, "R U R' U r U' R' U R U' R' U R U2 r'"]]),
  cL('l-front-commutator', 'L Front Comm', ['L Conmutador delantero', 'L Front Commutator'], 'L_Front_Commutator',
    ['al frente, rojo a la izquierda y azul a la derecha; a la derecha, rojo adelante y naranja atrás (opuestos); atrás, naranja a la izquierda; a la izquierda, azul atrás',
      'in front, red on the left and blue on the right; on the right, red in front and orange at the back (opposite colors); at the back, orange on the left; on the left, blue at the back'],
    "U2 R U2 R D R' U2 R D' R2", [[2, "U2 R U2 r D r' U2 r D' r' R'"], [3, "R U R' U R' F R F' U2 R' F R F'"], [4, "U r' D' r U2 r' D r U2 r U r'"]]),
  cL('l-diagonal', 'L Diagonal', ['L Diagonal', 'L Diagonal'], 'L_Diagonal',
    ['al frente, verde a la izquierda y rojo a la derecha; a la derecha, verde adelante y rojo atrás; atrás, naranja a la izquierda; a la izquierda, azul atrás',
      'in front, green on the left and red on the right; on the right, green in front and red at the back; at the back, orange on the left; on the left, blue at the back'],
    "U2 R U2 R2 F R F' R U2 R'", [[2, "U2 r U2 R2 F R F' R U2 r'"], [3, "R' U' R U R' F' R U R' U' R' F R2"], [4, "U R U2 R' F R' F' R2 U2 R'"]]),
  cL('l-back-commutator', 'L Back Comm', ['L Conmutador trasero', 'L Back Commutator'], 'L_Back_Commutator',
    ['al frente, naranja a la izquierda y rojo a la derecha (opuestos); a la derecha, verde adelante y rojo atrás; atrás, verde a la izquierda; a la izquierda, naranja atrás',
      'in front, orange on the left and red on the right (opposite colors); on the right, green in front and red at the back; at the back, green on the left; on the left, orange at the back'],
    "U R' U2 R' D' R U2 R' D R2", [[2, "U2 R U R' U' R' F R2 U' R' U R U R' F'"], [3, "U2 r D r' U2 r D' r' U2 r' U' r"], [4, "U R' U2 r' D' r U2 r' D r R"]]),
];

// --- 4. LSE: the last six edges with M and U. Seen from the front-right; DB is hidden, so the texts say how it is ---
const lse = (slug: string, stage: Stage, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `lse-${slug}`, stage, code, name, recognition, alg, note });

// EO: a bad edge has its yellow or white sticker off the top and bottom faces (with the centers lined up)
const eo = [
  lse('eo-flecha', 'lse-eo', ['Flecha', 'Arrow'], ['Flecha', 'Arrow'],
    ['3 malas arriba (derecha, atrás e izquierda: la flecha) y la de abajo atrás (DB) mala. La de abajo al frente, buena',
      '3 bad on top (right, back and left: the arrow) and the bottom-back one (DB) bad. The bottom-front one is good'], "M U M'",
    ["`M U` ya las orienta; `M'` vuelve a alinear los centros. Si la mala de abajo está al frente, mira el caso siguiente.",
      "`M U` already orients them; `M'` lines the centers up again. If the bad bottom edge is in front, see the next case."]),
  lse('eo-flecha-df', 'lse-eo', ['Flecha DF', 'Arrow DF'], ['Flecha, mala al frente', 'Arrow, bad one in front'],
    ['3 malas arriba (derecha, atrás e izquierda) y la de abajo al frente (DF) mala. La de abajo atrás (DB), buena',
      '3 bad on top (right, back and left) and the bottom-front one (DF) bad. The bottom-back one (DB) is good'], "M2 U2 M' U M'"),
  lse('eo-cuatro-arriba', 'lse-eo', ['4 arriba', '4 on top'], ['4 malas arriba', '4 bad on top'],
    ['Las 4 de arriba malas; las 2 de abajo (DF y DB), buenas', 'All 4 on top bad; the 2 on the bottom (DF and DB) good'], "M' U2 M' U2 M' U' M'"),
  lse('eo-dos-dos', 'lse-eo', ['2 + 2', '2 + 2'], ['2 arriba y 2 abajo', '2 on top and 2 on the bottom'],
    ['2 malas arriba, juntas (atrás e izquierda), y las 2 de abajo (DF y DB) malas', '2 bad on top, side by side (back and left), and both bottom ones (DF and DB) bad'], "M2 U' M' U M'"),
  lse('eo-dos-abajo', 'lse-eo', ['2 abajo', '2 on the bottom'], ['Solo las 2 de abajo', 'Only the 2 on the bottom'],
    ['Las 4 de arriba buenas; las 2 de abajo (DF y DB), malas', 'All 4 on top good; the 2 on the bottom (DF and DB) bad'], "M U M U' M' U M'"),
  lse('eo-uno-uno', 'lse-eo', ['1 + 1', '1 + 1'], ['1 arriba y 1 abajo atrás', '1 on top and 1 at the bottom back'],
    ['1 mala arriba, a la izquierda, y la de abajo atrás (DB) mala', '1 bad on top, on the left, and the bottom-back one (DB) bad'], "M' U' M' U2 M U M"),
  lse('eo-uno-uno-df', 'lse-eo', ['1 + 1 DF', '1 + 1 DF'], ['1 arriba y 1 abajo al frente', '1 on top and 1 at the bottom front'],
    ['1 mala arriba, a la izquierda, y la de abajo al frente (DF) mala', '1 bad on top, on the left, and the bottom-front one (DF) bad'], "M U M' U2 M' U M"),
];

// UL/UR: the red-yellow edge between the two red corners, the orange-yellow one between the orange corners
const ulur = [
  lse('ulur-abajo', 'lse-ulur', ['Abajo', 'Bottom'], ['Las dos abajo', 'Both on the bottom'],
    ['Las dos abajo, la roja-amarilla en el lado contrario a las esquinas rojas: esquinas rojas al frente, arista roja-amarilla abajo atrás (DB) y naranja-amarilla abajo al frente (DF)',
      'Both on the bottom, the red-yellow one on the side opposite the red corners: red corners in front, red-yellow edge at the bottom back (DB) and orange-yellow at the bottom front (DF)'], 'M2 U M2',
    ["`M2 U' M2` también vale. Si la roja está del mismo lado que las esquinas rojas, haz antes `U2`.", "`M2 U' M2` works too. If the red one is on the same side as the red corners, do `U2` first."]),
  lse('ulur-una-abajo', 'lse-ulur', ['Una abajo', 'One on the bottom'], ['Una arriba, otra abajo', 'One on top, one on the bottom'],
    ['Esquinas rojas atrás. La arista roja-amarilla ya está arriba atrás, entre ellas; la naranja-amarilla, abajo al frente (DF)',
      'Red corners at the back. The red-yellow edge is already on top at the back, between them; the orange-yellow one is at the bottom front (DF)'], 'M U2 M U M2'),
  lse('ulur-opuestas', 'lse-ulur', ['Opuestas', 'Opposite'], ['Las dos arriba, giradas', 'Both on top, turned'],
    ['Esquinas rojas atrás. Las dos aristas arriba, frente a frente pero a los lados: la roja-amarilla a la derecha y la naranja-amarilla a la izquierda',
      'Red corners at the back. Both edges on top, facing each other but on the sides: red-yellow on the right and orange-yellow on the left'], "M U M2 U M2 U M'"),
  lse('ulur-cambiadas', 'lse-ulur', ['Cambiadas', 'Swapped'], ['Las dos arriba, cambiadas', 'Both on top, swapped'],
    ['Esquinas en su sitio. Las dos aristas arriba, cambiadas: la roja-amarilla a la derecha y la naranja-amarilla a la izquierda',
      'Corners in place. Both edges on top, swapped: red-yellow on the right and orange-yellow on the left'], "M U M2 U2 M2 U M'"),
];

// 4c: UF, UB, DF and DB (yellow-green, yellow-blue, white-green, white-blue) and the M slice's centers
const fourC = [
  lse('4c-ciclo-delante', 'lse-4c', ['Ciclo DB', 'Cycle DB'], ['Ciclo de 3, DB bien', '3-cycle, DB solved'],
    ['Arriba al frente, la blanca-verde; arriba atrás, la amarilla-verde; abajo al frente, la amarilla-azul (azul en la cara verde). Abajo atrás (DB), bien',
      'Top front: the white-green one; top back: the yellow-green one; bottom front: the yellow-blue one (blue on the green face). Bottom back (DB) solved'], "M' U2 M U2"),
  lse('4c-ciclo-atras', 'lse-4c', ['Ciclo DF', 'Cycle DF'], ['Ciclo de 3, DF bien', '3-cycle, DF solved'],
    ['Arriba al frente, la amarilla-azul; arriba atrás, la blanca-azul; abajo atrás (DB), la amarilla-verde. Abajo al frente (DF), bien',
      'Top front: the yellow-blue one; top back: the white-blue one; bottom back (DB): the yellow-green one. Bottom front (DF) solved'], "M U2 M' U2"),
  lse('4c-ciclo-uf', 'lse-4c', ['Ciclo UF', 'Cycle UF'], ['Ciclo de 3, UF bien', '3-cycle, UF solved'],
    ['Arriba al frente, bien. Arriba atrás, la blanca-azul; abajo al frente, la amarilla-azul; abajo atrás (DB), la blanca-verde',
      'Top front solved. Top back: the white-blue one; bottom front: the yellow-blue one; bottom back (DB): the white-green one'], "M2 U2 M' U2 M'"),
  lse('4c-cambio', 'lse-4c', ['Cambio', 'Swap'], ['Adelante y atrás cambiadas', 'Front and back swapped'],
    ['Arriba, la amarilla-azul al frente y la amarilla-verde atrás. Abajo, lo mismo: la blanca-azul al frente y la blanca-verde atrás (DB)',
      'On top, the yellow-blue one in front and the yellow-green one at the back. On the bottom, the same: white-blue in front and white-green at the back (DB)'], 'M2 U2 M2 U2'),
  lse('4c-vertical', 'lse-4c', ['Vertical', 'Vertical'], ['Arriba y abajo cambiadas', 'Top and bottom swapped'],
    ['Blanco arriba al frente y atrás: la blanca-verde y la blanca-azul están arriba; la amarilla-verde y la amarilla-azul, abajo debajo de ellas',
      'White on top at the front and back: the white-green and white-blue ones are on top; the yellow-green and yellow-blue ones are on the bottom, under them'], 'M U2 M2 U2 M'),
];

export const roux: Method = {
  id: 'roux',
  name: tr('Roux', 'Roux'),
  summary: tr('Dos bloques, las esquinas de arriba (CMLL) y las seis últimas aristas con M y U.', 'Two blocks, the top corners (CMLL) and the last six edges with M and U.'),
  description: doc([
    'Un método de **pocos giros**, creado por Gilles Roux. En vez de ir capa por capa, construye **bloques** y deja la capa del medio para el final.',
    '## Los pasos',
    '1. **Primer bloque:** un bloque de 1×2×3 a la izquierda. Intuitivo.',
    '2. **Segundo bloque:** el mismo a la derecha, sin romper el primero. Intuitivo.',
    '3. **CMLL:** las 4 esquinas de arriba con un algoritmo: 42 casos.',
    '4. **LSE:** las 6 aristas que faltan, solo con `M` y `U`.',
    '## Por qué Roux',
    '- **Pocos giros:** menos giros por solve que CFOP, en promedio.',
    '- **Pocos algoritmos:** los 42 de CMLL y unos pocos para las últimas aristas.',
    '- **Sin rotar el cubo:** los bloques se hacen con `R`, `r`, `M` y `U`. Se usa mucho a una mano.',
    '## Para quién',
    '- Si te gusta pensar y planear más que memorizar.',
    '- Pide soltura con `M`: practica `M` y `M\'` hasta hacerlos sin mirar.',
    '- Si ya sabes el F2L del CFOP, los pares de los bloques se meten igual.',
  ], [
    'A **low move count** method, created by Gilles Roux. Instead of going layer by layer, it builds **blocks** and leaves the middle layer for last.',
    '## The steps',
    '1. **First block:** a 1×2×3 block on the left. Intuitive.',
    '2. **Second block:** the same on the right, without breaking the first. Intuitive.',
    '3. **CMLL:** the 4 top corners with one algorithm: 42 cases.',
    '4. **LSE:** the 6 remaining edges, with `M` and `U` only.',
    '## Why Roux',
    '- **Few moves:** fewer moves per solve than CFOP, on average.',
    '- **Few algorithms:** the 42 of CMLL and a handful for the last edges.',
    '- **No cube rotations:** the blocks are built with `R`, `r`, `M` and `U`. Popular for one-handed solving.',
    '## Who it suits',
    '- If you like thinking and planning more than memorizing.',
    '- It needs fluent `M` turns: practice `M` and `M\'` until you can do them without looking.',
    '- If you already know CFOP\'s F2L, the block pairs go in the same way.',
  ]),
  orientation: tr(
    '**Blanco abajo, amarillo arriba y verde al frente.** El primer bloque va a la izquierda (rojo) y el segundo a la derecha (naranja).',
    '**White on the bottom, yellow on top and green in front.** The first block goes on the left (red) and the second on the right (orange).',
  ),
  notation: doc([
    '- `M`: capa del medio entre `L` y `R`, gira como `L`. `r`: `R` y `M\'` a la vez.',
    '- Los centros de la capa `M` pueden quedar girados hasta el final: no cuentan hasta el último paso.',
    '## Figuras',
    '- **Bloques:** el cubo visto desde el lado del bloque (adelante-izquierda o adelante-derecha). Solo se colorean las piezas de los bloques.',
    '- **CMLL:** la cara de arriba vista desde arriba, con el frente abajo. Solo las esquinas, con flechas a dónde va cada una.',
    '- **Últimas aristas:** solo las 6 aristas y los centros de la capa `M`. La de abajo atrás (DB) no se ve: el texto dice cómo está.',
  ], [
    '- `M`: the middle layer between `L` and `R`, turns like `L`. `r`: `R` and `M\'` together.',
    '- The `M` layer\'s centers may stay turned until the end: they only count in the last step.',
    '## Diagrams',
    '- **Blocks:** the cube seen from the block\'s side (front-left or front-right). Only the block pieces are in color.',
    '- **CMLL:** the top face seen from above, with the front at the bottom. Only the corners, with arrows to where each one goes.',
    '- **Last edges:** only the 6 edges and the `M` layer\'s centers. The bottom-back one (DB) is hidden: the text says how it is.',
  ]),
  before: { path: '/academia/notacion', label: tr('Antes: los giros M y r en Notación', 'Before: the M and r moves in Notation') },
  phases: [
    {
      id: 'roux-bloque1',
      name: tr('Primer bloque', 'First block'),
      description: doc([
        '**Meta:** un bloque de 1×2×3 a la izquierda: el centro rojo, la arista blanca-roja (DL) y dos pares a sus lados.',
        'Un **par** es una esquina blanca con su arista: blanca-roja-azul con roja-azul atrás, blanca-roja-verde con roja-verde al frente.',
        'Es un paso intuitivo, como la cruz: no hay que memorizar nada.',
        '## Cómo se hace',
        '1. **Arista DL:** llévala abajo a la izquierda, junto al centro rojo, con el blanco abajo.',
        '2. **Par de atrás:** junta la esquina y la arista y mételas atrás. Queda un cuadrado de 1×2×2.',
        '3. **Par de adelante:** igual, al frente. Los ejemplos de abajo son este último par.',
        '## Consejos',
        '- Lo de la derecha (`R`, `r`, `M`) aún está libre: úsalo para juntar los pares sin romper nada.',
        '- `F` y `B` meten un par de una vez si su ranura está libre.',
        '- Planea en la inspección al menos la arista y un par.',
      ], [
        '**Goal:** a 1×2×3 block on the left: the red center, the white-red edge (DL) and a pair on each side of it.',
        'A **pair** is a white corner with its edge: white-red-blue with red-blue at the back, white-red-green with red-green in front.',
        'It is an intuitive step, like the cross: nothing to memorize.',
        '## How to do it',
        '1. **DL edge:** bring it to the bottom left, next to the red center, with white facing down.',
        '2. **Back pair:** join the corner and the edge and put them in at the back. That makes a 1×2×2 square.',
        '3. **Front pair:** the same, in front. The examples below are this last pair.',
        '## Tips',
        '- The right side (`R`, `r`, `M`) is still free: use it to join the pairs without breaking anything.',
        '- `F` and `B` put a pair in at once if its slot is empty.',
        '- Plan at least the edge and one pair during inspection.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-fb-delante', name: tr('Par de adelante', 'Front pair'), description: tr('El cuadrado de atrás ya está.', 'The back square is done.'), cases: fbFront },
        { id: 'roux-fb-atras', name: tr('Par de atrás', 'Back pair'), description: tr('El par de adelante ya está: también se puede hacer en este orden.', 'The front pair is done: this order works too.'), cases: fbBack },
      ],
      quizzes: [],
    },
    {
      id: 'roux-bloque2',
      name: tr('Segundo bloque', 'Second block'),
      description: doc([
        '**Meta:** el mismo bloque a la derecha (centro naranja, arista blanca-naranja y dos pares), sin romper el primero.',
        'Usa solo `R`, `r`, `M` y `U`: ninguno toca el primer bloque.',
        '## Cómo se hace',
        '1. **Arista DR:** llévala arriba con `M` y `U`, y bájala con `R2` o `r2`.',
        '2. **Par de atrás:** júntalo arriba y mételo con `R`, `r` y `U`, como un par del F2L.',
        '3. **Par de adelante:** igual. Los ejemplos de abajo son el último par.',
        '## Consejos',
        '- `M` mueve las aristas del medio sin tocar los bloques: úsalo para sacar una pieza atrapada abajo.',
        '- `r` mueve la ranura y la capa `M` juntas: a veces ahorra un giro.',
        '- Los centros de la capa `M` pueden quedar girados: se arreglan al final.',
      ], [
        '**Goal:** the same block on the right (orange center, white-orange edge and two pairs), without breaking the first one.',
        'Use only `R`, `r`, `M` and `U`: none of them touches the first block.',
        '## How to do it',
        '1. **DR edge:** bring it to the top with `M` and `U`, and down with `R2` or `r2`.',
        '2. **Back pair:** join it on top and put it in with `R`, `r` and `U`, like an F2L pair.',
        '3. **Front pair:** the same. The examples below are the last pair.',
        '## Tips',
        '- `M` moves the middle edges without touching the blocks: use it to free a piece stuck on the bottom.',
        '- `r` moves the slot and the `M` layer together: sometimes it saves a move.',
        '- The `M` layer\'s centers may stay turned: they get fixed at the end.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-sb-delante', name: tr('Par de adelante', 'Front pair'), description: tr('El primer bloque y el cuadrado de atrás ya están.', 'The first block and the back square are done.'), cases: sbFront },
        { id: 'roux-sb-atras', name: tr('Par de atrás', 'Back pair'), description: tr('El primer bloque y el par de adelante ya están.', 'The first block and the front pair are done.'), cases: sbBack },
      ],
      quizzes: [],
    },
    {
      id: 'roux-cmll',
      name: tr('CMLL', 'CMLL'),
      description: doc([
        '**Meta:** las 4 esquinas de arriba en su sitio, sin romper los bloques. Las aristas de arriba y las de la capa `M` dan igual.',
        '**42 casos**, un algoritmo por caso.',
        '## Reconocer',
        '1. Mira las amarillas de las esquinas: la forma (O, H, Pi, U, T, Sune, Antisune o L), como en el OCLL.',
        '2. Gira `U` hasta verla como en la figura.',
        '3. Mira las pegatinas de los lados:',
        '- **Faros:** las dos de un lado, del mismo color.',
        '- **Opuestos:** rojo y naranja, o verde y azul.',
        '- **Vecinos:** cualquier otro par (rojo y verde, naranja y azul...).',
        '## Algoritmos',
        '- Son los de SpeedCubeDB, el #1 primero. Pueden mover las aristas, pero dejan los bloques como estaban.',
        '- Al terminar puede faltar un `U`.',
        '## Respaldo: CMLL en 2 pasos',
        '1. Pon el amarillo arriba con el OCLL del CFOP reducido (Sune, Antisune, H, Pi, U, T y L): no rompen los bloques.',
        '2. Coloca las esquinas con **O Adyacente** u **O Diagonal**.',
      ], [
        '**Goal:** the 4 top corners in place, without breaking the blocks. The top edges and the `M` layer edges do not matter.',
        '**42 cases**, one algorithm per case.',
        '## Recognize',
        '1. Look at the corners\' yellow stickers: the shape (O, H, Pi, U, T, Sune, Antisune or L), as in OCLL.',
        '2. Turn `U` until it looks like the figure.',
        '3. Look at the side stickers:',
        '- **Headlights:** both on one side the same color.',
        '- **Opposite:** red and orange, or green and blue.',
        '- **Adjacent:** any other pair (red and green, orange and blue...).',
        '## Algorithms',
        '- They are SpeedCubeDB\'s, #1 first. They may move the edges, but leave the blocks as they were.',
        '- When done, a `U` may be left.',
        '## Fallback: 2-look CMLL',
        '1. Get yellow on top with the OCLL from reduced CFOP (Sune, Antisune, H, Pi, U, T and L): they do not break the blocks.',
        '2. Place the corners with **O Adjacent** or **O Diagonal**.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'roux-cmll-o', name: tr('O: todo amarillo arriba', 'O: all yellow on top'), description: tr('Solo falta colocar las esquinas. **Adyacente:** faros en un lado. **Diagonal:** ningún faro.', 'Only the corners\' places are left. **Adjacent:** headlights on one side. **Diagonal:** no headlights.'), cases: cmllO },
        { id: 'roux-cmll-h', name: tr('H', 'H'), description: tr('Dos amarillas al frente y dos atrás. Mira los lados izquierdo y derecho: faros o colores opuestos.', 'Two yellows in front and two at the back. Look at the left and right sides: headlights or opposite colors.'), cases: cmllH },
        { id: 'roux-cmll-pi', name: tr('Pi', 'Pi'), description: tr('Dos amarillas a la izquierda. Mira el lado derecho y las dos pegatinas de la izquierda (al frente y atrás).', 'Two yellows on the left. Look at the right side and the two left stickers (front and back).'), cases: cmllPi },
        { id: 'roux-cmll-u', name: tr('U', 'U'), description: tr('Dos arriba, las de adelante; las otras dos miran atrás. Mira el frente: faros o no.', 'Two on top, the front ones; the other two face back. Look at the front: headlights or not.'), cases: cmllU },
        { id: 'roux-cmll-t', name: tr('T', 'T'), description: tr('Dos arriba, las de adelante; las otras dos miran a los lados. Mira el frente y atrás: faros o no.', 'Two on top, the front ones; the other two face the sides. Look at the front and back: headlights or not.'), cases: cmllT },
        { id: 'roux-cmll-s', name: tr('Sune', 'Sune'), description: tr('Una arriba, adelante a la derecha. Mira las dos pegatinas del frente y la de la derecha.', 'One on top, front right. Look at the two front stickers and the one on the right.'), cases: cmllS },
        { id: 'roux-cmll-as', name: tr('Antisune', 'Antisune'), description: tr('Una arriba, adelante a la izquierda. Mira las dos pegatinas del frente y la de la izquierda.', 'One on top, front left. Look at the two front stickers and the one on the left.'), cases: cmllAS },
        { id: 'roux-cmll-l', name: tr('L', 'L'), description: tr('Dos arriba, en diagonal. Mira el frente y el lado derecho.', 'Two on top, in a diagonal. Look at the front and the right side.'), cases: cmllL },
      ],
      progression: doc([
        '1. **CMLL en 2 pasos:** si sabes el OCLL, solo te faltan O Adyacente y O Diagonal.',
        '2. **Sune y Antisune:** 12 casos, casi 1 de cada 3 solves.',
        '3. **O, H y Pi.**',
        '4. **U y T.**',
        '5. **L:** al final.',
        'Con cada grupo nuevo, deja el respaldo en 2 pasos para los casos que aún no sabes.',
      ], [
        '1. **2-look CMLL:** if you know OCLL, you only need O Adjacent and O Diagonal.',
        '2. **Sune and Antisune:** 12 cases, almost 1 in 3 solves.',
        '3. **O, H and Pi.**',
        '4. **U and T.**',
        '5. **L:** last.',
        'With each new group, keep the 2-look fallback for the cases you do not know yet.',
      ]),
      quizzes: [],
    },
    {
      id: 'roux-lse',
      name: tr('Últimas seis aristas', 'Last six edges'),
      description: doc([
        '**Meta:** las 6 aristas que faltan (UF, UR, UB, UL, DF y DB) y los centros de la capa `M`. Solo con `M` y `U`.',
        '## Los 3 pasos',
        '1. **EO (orientar):** todas con su amarillo o blanco arriba o abajo.',
        '2. **UL y UR:** la arista roja-amarilla y la naranja-amarilla a su sitio.',
        '3. **4c:** las 4 aristas de la capa `M` y sus centros. El cubo queda resuelto.',
        '## Aristas buenas y malas',
        'Alinea los centros con los bloques (amarillo arriba). Una arista es **buena** si su pegatina amarilla o blanca mira arriba o abajo; si no, es **mala**.',
        '- Siempre hay un número par de malas.',
        '- **Flecha:** 3 malas arriba y 1 abajo. Las 3 de arriba, con el centro, forman una flecha.',
        '- Un `U` con la capa `M` girada un cuarto cambia buenas por malas: por eso los algoritmos alternan `M` y `U`.',
        '## Consejos',
        '- La arista de abajo atrás (DB) no se ve en la figura: mírala inclinando el cubo.',
        '- Al final de cada paso, alinea los centros con `M` o `M\'` antes de mirar el siguiente.',
      ], [
        '**Goal:** the 6 remaining edges (UF, UR, UB, UL, DF and DB) and the `M` layer\'s centers. With `M` and `U` only.',
        '## The 3 steps',
        '1. **EO (orient):** all of them with their yellow or white facing up or down.',
        '2. **UL and UR:** the red-yellow and orange-yellow edges into place.',
        '3. **4c:** the 4 edges of the `M` layer and its centers. The cube is solved.',
        '## Good and bad edges',
        'Line the centers up with the blocks (yellow on top). An edge is **good** if its yellow or white sticker faces up or down; otherwise it is **bad**.',
        '- There is always an even number of bad ones.',
        '- **Arrow:** 3 bad on top and 1 on the bottom. The 3 on top, with the center, make an arrow.',
        '- A `U` turn with the `M` layer a quarter off swaps good and bad: that is why the algorithms alternate `M` and `U`.',
        '## Tips',
        '- The bottom-back edge (DB) is hidden in the figure: tilt the cube to see it.',
        '- At the end of each step, line the centers up with `M` or `M\'` before looking at the next one.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-lse-eo', name: tr('EO: orientar', 'EO: orient'), description: tr('Cuenta las malas, arriba y abajo. Gira `U` hasta verlas como en la figura.', 'Count the bad ones, on top and on the bottom. Turn `U` until they look like the figure.'), cases: eo },
        { id: 'roux-lse-ulur', name: tr('UL y UR', 'UL and UR'), description: tr('Busca la arista roja-amarilla y la naranja-amarilla. Las esquinas rojas dicen dónde va la roja.', 'Find the red-yellow and orange-yellow edges. The red corners say where the red one goes.'), cases: ulur },
        { id: 'roux-lse-4c', name: tr('4c: la capa M', '4c: the M layer'), description: tr('UL y UR ya están. Solo quedan las 4 aristas de la capa `M`.', 'UL and UR are done. Only the 4 edges of the `M` layer are left.'), cases: fourC },
      ],
      progression: doc([
        '1. **EO:** empieza por la flecha, el caso más corto.',
        '2. **UL y UR con las dos abajo:** `M2 U M2` es la base de los demás.',
        '3. **4c:** los ciclos de 3 primero.',
        'Con práctica, la EO se hace pensando ya en UL y UR.',
      ], [
        '1. **EO:** start with the arrow, the shortest case.',
        '2. **UL and UR with both on the bottom:** `M2 U M2` is the basis of the others.',
        '3. **4c:** the 3-cycles first.',
        'With practice, you do EO already thinking about UL and UR.',
      ]),
      quizzes: [],
    },
  ],
};

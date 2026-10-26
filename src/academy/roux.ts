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
import { doc, tr, word } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { scdbUrl } from './scdb.ts';
import type { Case, Method, Stage } from './types.ts';

type T = [es: string, en: string, pt: string];
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
  fb('delante-arriba', ['Frente', 'Front', 'Frente'], ['Par arriba, al frente', 'Pair on top, in front', 'Par em cima, na frente'],
    ['Cuadrado de atrás hecho. El par de adelante está formado arriba, sobre la cara verde: verde al frente, rojo arriba y el blanco de la esquina mirando a la cara roja',
      "Back square done. The front pair is joined on top, above the green face: green in front, red on top and the corner's white facing the red side", 'Quadrado de trás feito. O par da frente está formado em cima, sobre a face verde: verde na frente, vermelho em cima e o branco da quina virado para a face vermelha'], "F'",
    ['Un solo giro: `F` y `B` sirven mientras su ranura del bloque esté libre.', 'A single turn: `F` and `B` work while their slot of the block is empty.', 'Um só movimento: `F` e `B` servem enquanto o slot deles no bloco estiver livre.']),
  fb('delante-derecha', ['Frente der.', 'Front right', 'Frente dir.'], ['Par arriba, a la derecha', 'Pair on top, on the right', 'Par em cima, à direita'],
    ['Cuadrado de atrás hecho. El par de adelante está formado arriba al frente, hacia la derecha: verde arriba, rojo al frente y el blanco de la esquina mirando a la derecha',
      "Back square done. The front pair is joined on top at the front, towards the right: green on top, red in front and the corner's white facing right", 'Quadrado de trás feito. O par da frente está formado em cima na frente, para a direita: verde em cima, vermelho na frente e o branco da quina virado para a direita'], "L' U L",
    ["`L'` sube la ranura, `U` pone el par encima y `L` baja todo junto: como un par del F2L.", "`L'` lifts the slot, `U` puts the pair above it and `L` brings it all down: like an F2L pair.", "`L'` sobe o slot, `U` põe o par em cima dele e `L` desce tudo junto: como um par do F2L."]),
  fb('delante-abajo', ['Abajo', 'Bottom', 'Embaixo'], ['Par abajo, al frente', 'Pair on the bottom, in front', 'Par embaixo, na frente'],
    ['Cuadrado de atrás hecho. El par de adelante está formado abajo, en la cara verde a la derecha de la ranura: verde al frente, rojo abajo y el blanco de la esquina mirando a la derecha',
      "Back square done. The front pair is joined on the bottom, on the green face right of the slot: green in front, red on the bottom and the corner's white facing right", 'Quadrado de trás feito. O par da frente está formado embaixo, na face verde à direita do slot: verde na frente, vermelho embaixo e o branco da quina virado para a direita'], 'F',
    ['Los pares se pueden armar abajo, en la capa `M` y a la derecha: aún están libres.', 'Pairs can be built on the bottom, in the `M` layer and on the right: they are still free.', 'Os pares podem ser montados embaixo, na camada `M` e à direita: ainda estão livres.']),
];
const fbBack = [
  fb('atras-arriba', ['Atrás', 'Back', 'Atrás'], ['Par arriba, atrás', 'Pair on top, at the back', 'Par em cima, atrás'],
    ['Par de adelante hecho. El de atrás está formado arriba, atrás a la izquierda: rojo arriba, azul atrás y el blanco de la esquina mirando a la cara roja',
      "Front pair done. The back one is joined on top, at the back left: red on top, blue at the back and the corner's white facing the red side", 'Par da frente feito. O de trás está formado em cima, atrás à esquerda: vermelho em cima, azul atrás e o branco da quina virado para a face vermelha'], 'B'),
  fb('atras-derecha', ['Atrás der.', 'Back right', 'Atrás dir.'], ['Par arriba, atrás a la derecha', 'Pair on top, at the back right', 'Par em cima, atrás à direita'],
    ['Par de adelante hecho. El de atrás está formado arriba, atrás a la derecha: azul arriba, rojo atrás y el blanco de la esquina mirando a la derecha',
      "Front pair done. The back one is joined on top, at the back right: blue on top, red at the back and the corner's white facing right", 'Par da frente feito. O de trás está formado em cima, atrás à direita: azul em cima, vermelho atrás e o branco da quina virado para a direita'], "L U' L'",
    ["El espejo de `L' U L` para la ranura de atrás.", "The mirror of `L' U L` for the back slot.", "O espelho de `L' U L` para o slot de trás."]),
];

// --- 2. Second block: the same on the right with R, r, M and U only. Seen from the front-right (green left, orange right) ---
const sb = (slug: string, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `sb-${slug}`, stage: 'roux-sb', code, name, recognition, alg, note });

const sbFront = [
  sb('delante-izquierda', ['Frente izq.', 'Front left', 'Frente esq.'], ['Par arriba, al frente a la izquierda', 'Pair on top, front left', 'Par em cima, na frente à esquerda'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba al frente, hacia la izquierda: verde arriba, naranja al frente y el blanco de la esquina mirando a la izquierda',
      "First block and back square done. The front pair is joined on top at the front, towards the left: green on top, orange in front and the corner's white facing left", 'Primeiro bloco e quadrado de trás feitos. O par da frente está formado em cima na frente, para a esquerda: verde em cima, laranja na frente e o branco da quina virado para a esquerda'], "R U' R'"),
  sb('delante-derecha', ['Derecha', 'Right', 'Direita'], ['Par arriba, a la derecha', 'Pair on top, on the right', 'Par em cima, à direita'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba a la derecha: verde arriba, naranja a la derecha y el blanco de la esquina mirando al frente',
      "First block and back square done. The front pair is joined on top on the right: green on top, orange on the right and the corner's white facing front", 'Primeiro bloco e quadrado de trás feitos. O par da frente está formado em cima à direita: verde em cima, laranja à direita e o branco da quina virado para a frente'], "U R U' R'",
    ["`U` lo deja al frente a la izquierda: es el caso de `R U' R'`.", "`U` leaves it at the front left: it is the `R U' R'` case.", "`U` o deixa na frente à esquerda: é o caso de `R U' R'`."]),
  sb('delante-r', ['Frente der.', 'Front right', 'Frente dir.'], ['Par arriba, con r', 'Pair on top, with r', 'Par em cima, com r'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba al frente, hacia la derecha: naranja arriba, verde al frente y el blanco de la esquina mirando a la derecha',
      "First block and back square done. The front pair is joined on top at the front, towards the right: orange on top, green in front and the corner's white facing right", 'Primeiro bloco e quadrado de trás feitos. O par da frente está formado em cima na frente, para a direita: laranja em cima, verde na frente e o branco da quina virado para a direita'], "r U r'",
    ['`r` sube la ranura junto con la capa `M`: las aristas del medio aún no importan.', '`r` lifts the slot together with the `M` layer: the middle edges do not matter yet.', '`r` sobe o slot junto com a camada `M`: as arestas do meio ainda não importam.']),
];
const sbBack = [
  sb('atras-izquierda', ['Atrás izq.', 'Back left', 'Atrás esq.'], ['Par arriba, atrás a la izquierda', 'Pair on top, back left', 'Par em cima, atrás à esquerda'],
    ['Primer bloque y par de adelante hechos. El de atrás está formado arriba, atrás hacia la izquierda: azul arriba, naranja atrás y el blanco de la esquina mirando a la izquierda',
      "First block and front pair done. The back one is joined on top at the back, towards the left: blue on top, orange at the back and the corner's white facing left", 'Primeiro bloco e par da frente feitos. O de trás está formado em cima atrás, para a esquerda: azul em cima, laranja atrás e o branco da quina virado para a esquerda'], "R' U R"),
  sb('atras-r', ['Atrás der.', 'Back right', 'Atrás dir.'], ['Par arriba, atrás con r', 'Pair on top, back with r', 'Par em cima, atrás com r'],
    ['Primer bloque y par de adelante hechos. El de atrás está formado arriba, atrás a la derecha: naranja arriba, azul atrás y el blanco de la esquina mirando a la derecha',
      "First block and front pair done. The back one is joined on top at the back right: orange on top, blue at the back and the corner's white facing right", 'Primeiro bloco e par da frente feitos. O de trás está formado em cima, atrás à direita: laranja em cima, azul atrás e o branco da quina virado para a direita'], "r' U' r",
    ["Como `r U r'`, hacia atrás.", "Like `r U r'`, towards the back.", "Como `r U r'`, para trás."]),
];

// --- 3. CMLL: the 42 cases, by the shape of the yellow stickers (as in OCLL). Side stickers: front left to right,
// right and left sides front to back, back left to right as the figure shows them ---
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const cmll = (shape: T) => (slug: string, code: string, name: T, scdb: string, look: T, alg: string, alts: Alt[]) =>
  kase({ slug: `cmll-${slug}`, stage: 'cmll', code: [code, code, code], name, recognition: [`${shape[0]}. ${cap(look[0])}`, `${shape[1]}. ${cap(look[1])}`, `${shape[2]}. ${cap(look[2])}`], alg, alts, scdb });

const cO = cmll(['Las 4 amarillas arriba', 'All 4 yellows on top', 'As 4 amarelas em cima']);
const cH = cmll(['0 amarillas arriba: dos miran al frente y dos atrás', 'No yellows on top: two face front and two face back', '0 amarelas em cima: duas viradas para a frente e duas para trás']);
const cPi = cmll(['0 amarillas arriba: dos miran a la izquierda; a la derecha, una al frente y otra atrás', 'No yellows on top: two face left; on the right, one faces front and one faces back', '0 amarelas em cima: duas viradas para a esquerda; à direita, uma para a frente e outra para trás']);
const cU = cmll(['2 amarillas arriba, las de adelante; las de atrás miran atrás', '2 yellows on top, the front ones; the back ones face back', '2 amarelas em cima, as da frente; as de trás viradas para trás']);
const cT = cmll(['2 amarillas arriba, las de adelante; las de atrás miran a los lados', '2 yellows on top, the front ones; the back ones face the sides', '2 amarelas em cima, as da frente; as de trás viradas para os lados']);
const cS = cmll(['1 amarilla arriba, adelante a la derecha; la de adelante a la izquierda mira a la izquierda', '1 yellow on top, front right; the front-left one faces left', '1 amarela em cima, na frente à direita; a da frente à esquerda virada para a esquerda']);
const cAS = cmll(['1 amarilla arriba, adelante a la izquierda; la de adelante a la derecha mira a la derecha', '1 yellow on top, front left; the front-right one faces right', '1 amarela em cima, na frente à esquerda; a da frente à direita virada para a direita']);
const cL = cmll(['2 amarillas arriba en diagonal (adelante a la derecha y atrás a la izquierda); la de adelante a la izquierda mira a la izquierda', '2 yellows on top in a diagonal (front right and back left); the front-left one faces left', '2 amarelas em cima na diagonal (na frente à direita e atrás à esquerda); a da frente à esquerda virada para a esquerda']);

const cmllO = [
  cO('o-adjacent', 'O Adj', ['O Adyacente', 'O Adjacent', 'O Adjacente'], 'O_Adjacent',
    ['faros azules a la izquierda; en los otros 3 lados, colores distintos',
      'blue headlights on the left; on the other 3 sides, different colors', 'faróis azuis à esquerda; nos outros 3 lados, cores diferentes'],
    "R U R' F' R U R' U' R' F R2 U' R'", [[2, "R U R' U' R' F R2 U' R' U' R U R' F'"], [3, "r U R' F' R U R' U' R' F R2 U' r'"], [4, "R U2 R' U' R U2 r' F R' F' r"]]),
  cO('o-diagonal', 'O Diag', ['O Diagonal', 'O Diagonal', 'O Diagonal'], 'O_Diagonal',
    ['ningún faro: en los 4 lados, colores opuestos',
      'no headlights: opposite colors on all 4 sides', 'nenhum farol: nos 4 lados, cores opostas'],
    "F R U' R' U' R U R' F' R U R' U' R' F R F'", [[2, "R U' R2 F R F' R U' B U2 B' R'"], [3, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [4, "r2 D' r U' r' D r2 F' r' U r F"]]),
];
const cmllH = [
  cH('h-columns', 'H Columns', ['H Columnas', 'H Columns', 'H Colunas'], 'H_Columns',
    ['a la derecha, rojo adelante y naranja atrás (opuestos); a la izquierda, rojo adelante y naranja atrás (opuestos)',
      'on the right, red in front and orange at the back (opposite colors); on the left, red in front and orange at the back (opposite colors)', 'à direita, vermelho na frente e laranja atrás (opostas); à esquerda, vermelho na frente e laranja atrás (opostas)'],
    "U R U R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U' R'"], [3, "r U' r' U' r U r' U r U r'"], [4, "r U' r' U' r U' r' U r U r'"]]),
  cH('h-rows', 'H Rows', ['H Filas', 'H Rows', 'H Linhas'], 'H_Rows',
    ['faros rojos a la derecha; faros naranjas a la izquierda',
      'red headlights on the right; orange headlights on the left', 'faróis vermelhos à direita; faróis laranja à esquerda'],
    "F R U R' U' R U R' U' R U R' U' F'", [[2, "F U R U' R' U R U' R' U R U' R' F'"], [3, "F U' R2 D R' U2 R D' R2 U F'"], [4, "F R U r' U' R U R' U' R U R' M' U' F'"]]),
  cH('h-column', 'H Column', ['H Columna', 'H Column', 'H Coluna'], 'H_Column',
    ['a la derecha, azul adelante y verde atrás (opuestos); faros naranjas a la izquierda',
      'on the right, blue in front and green at the back (opposite colors); orange headlights on the left', 'à direita, azul na frente e verde atrás (opostas); faróis laranja à esquerda'],
    "R' F2 D R2 U R2 D' F2 R", [[2, "U R U2 R2 F R F' U2 R' F R F'"], [3, "U' F R U R' U' R U' R' U R U R' F'"], [4, "U F R U R' U' F' R U R' U' R' F R F'"]]),
  cH('h-row', 'H Row', ['H Fila', 'H Row', 'H Linha'], 'H_Row',
    ['a la derecha, rojo adelante y azul atrás; a la izquierda, naranja adelante y azul atrás',
      'on the right, red in front and blue at the back; on the left, orange in front and blue at the back', 'à direita, vermelho na frente e azul atrás; à esquerda, laranja na frente e azul atrás'],
    "U2 r U' r2 D' r U' r' D r2 U r'", [[2, "U' R U R' U R U r' F R' F' r"], [3, "U' R U R' U R U L' U R' U' L"], [4, "U2 R U' R2 D' r U' r' D R2 U R'"]]),
];
const cmllPi = [
  cPi('pi-right-bar', 'Pi Right Bar', ['Pi Barra derecha', 'Pi Right Bar', 'Pi Barra direita'], 'Pi_Right_Bar',
    ['al frente, rojo a la izquierda; a la derecha, verde adelante y azul atrás (opuestos); atrás, rojo a la izquierda',
      'in front, red on the left; on the right, green in front and blue at the back (opposite colors); at the back, red on the left', 'na frente, vermelho à esquerda; à direita, verde na frente e azul atrás (opostas); atrás, vermelho à esquerda'],
    "F R U R' U' R U R' U' F'", [[2, "r' U r2 U' r2 U' r2 U r'"], [3, "U2 F U R U' R' U R U' R' F'"], [4, "R U2 R2 U' R2 U' R2 U2 R"]]),
  cPi('pi-down-slash', 'Pi Down Slash', ['Pi Diagonal abajo', 'Pi Down Slash', 'Pi Diagonal para baixo'], 'Pi_Down_Slash',
    ['al frente, naranja a la izquierda; a la derecha, azul adelante y naranja atrás; atrás, verde a la izquierda',
      'in front, orange on the left; on the right, blue in front and orange at the back; at the back, green on the left', 'na frente, laranja à esquerda; à direita, azul na frente e laranja atrás; atrás, verde à esquerda'],
    "U F R' F' R U2 R U' R' U R U2 R'", [[2, "U F U R U' R2 F' R U2 R U2 R'"], [3, "U M F R' F' r U2 R U' R' U R U2 R'"], [4, "R' U2 R U R' U' R U2 R f' U' f"]]),
  cPi('pi-x', 'Pi X', ['Pi X', 'Pi X', 'Pi X'], 'Pi_X',
    ['al frente, naranja a la izquierda; faros rojos a la derecha; atrás, naranja a la izquierda',
      'in front, orange on the left; red headlights on the right; at the back, orange on the left', 'na frente, laranja à esquerda; faróis vermelhos à direita; atrás, laranja à esquerda'],
    "R' F2 D R2 U' R2 D' F2 R", [[2, "U' R' F R U F U' R U R' U' F'"], [3, "r' F2 D R2 U' R2 D' F2 r"], [4, "U' F R U' R' U' R U R' U R U' R' F'"]]),
  cPi('pi-up-slash', 'Pi Up Slash', ['Pi Diagonal arriba', 'Pi Up Slash', 'Pi Diagonal para cima'], 'Pi_Up_Slash',
    ['al frente, naranja a la izquierda; a la derecha, verde adelante y rojo atrás; atrás, verde a la izquierda',
      'in front, orange on the left; on the right, green in front and red at the back; at the back, green on the left', 'na frente, laranja à esquerda; à direita, verde na frente e vermelho atrás; atrás, verde à esquerda'],
    "R U2 R' U' R U R' U2 R' F R F'", [[2, "R U2 R' U2 R' F R2 U R' U' F'"], [3, "R U2 R' U' R U R' U2 r' F R F' M'"], [4, "R U R' U' R' F R2 U R' U' R U R' U' F'"]]),
  cPi('pi-columns', 'Pi Columns', ['Pi Columnas', 'Pi Columns', 'Pi Colunas'], 'Pi_Columns',
    ['al frente, naranja a la izquierda; a la derecha, rojo adelante y naranja atrás (opuestos); atrás, rojo a la izquierda',
      'in front, orange on the left; on the right, red in front and orange at the back (opposite colors); at the back, red on the left', 'na frente, laranja à esquerda; à direita, vermelho na frente e laranja atrás (opostas); atrás, vermelho à esquerda'],
    "U' r U' r2 D' r U r' D r2 U r'", [[2, "U2 R' F R F' r U' r' U' R U' R'"], [3, "U2 R' F R F' r U' R' U' R U' r'"], [4, "U2 L' U R U' L U' R' U' R U' R'"]]),
  cPi('pi-left-bar', 'Pi Left Bar', ['Pi Barra izquierda', 'Pi Left Bar', 'Pi Barra esquerda'], 'Pi_Left_Bar',
    ['al frente, naranja a la izquierda; faros verdes a la derecha; atrás, rojo a la izquierda',
      'in front, orange on the left; green headlights on the right; at the back, red on the left', 'na frente, laranja à esquerda; faróis verdes à direita; atrás, vermelho à esquerda'],
    "U' R' U' R' F R F' R U' R' U2 R", [[2, "R' F' U' F U' R U R' U R"], [3, "U2 R U R' U R U' B U' B' R'"], [4, "U' r U R' U R' F R F' R U' R' U R U2 r'"]]),
];
const cmllU = [
  cU('u-up-slash', 'U Up Slash', ['U Diagonal arriba', 'U Up Slash', 'U Diagonal para cima'], 'U_Up_Slash',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante y azul atrás; a la izquierda, verde adelante y rojo atrás',
      'in front, orange on the left and blue on the right; on the right, red in front and blue at the back; on the left, green in front and red at the back', 'na frente, laranja à esquerda e azul à direita; à direita, vermelho na frente e azul atrás; à esquerda, verde na frente e vermelho atrás'],
    "U2 R2 D R' U2 R D' R' U2 R'", [[2, "U2 R r D r' U2 r D' r' U2 R'"], [3, "F R' F' U2 R U R U' R' U R' U R"], [4, "L2 D L' U2 L D' L' U2 L'"]]),
  cU('u-down-slash', 'U Down Slash', ['U Diagonal abajo', 'U Down Slash', 'U Diagonal para baixo'], 'U_Down_Slash',
    ['al frente, verde a la izquierda y naranja a la derecha; a la derecha, azul adelante y rojo atrás; a la izquierda, rojo adelante y verde atrás',
      'in front, green on the left and orange on the right; on the right, blue in front and red at the back; on the left, red in front and green at the back', 'na frente, verde à esquerda e laranja à direita; à direita, azul na frente e vermelho atrás; à esquerda, vermelho na frente e verde atrás'],
    "R2 D' R U2 R' D R U2 R", [[2, "R' F R U R' F R U F U2 F'"], [3, "U2 L2 D' L U2 L' D L U2 L"], [4, "l' U l U l' U l U F U2 F'"]]),
  cU('u-bottom-row', 'U Bottom Row', ['U Fila de abajo', 'U Bottom Row', 'U Linha de baixo'], 'U_Bottom_Row',
    ['faros verdes al frente; a la derecha, naranja adelante y azul atrás; a la izquierda, rojo adelante y azul atrás',
      'green headlights in front; on the right, orange in front and blue at the back; on the left, red in front and blue at the back', 'faróis verdes na frente; à direita, laranja na frente e azul atrás; à esquerda, vermelho na frente e azul atrás'],
    "R' U' R U' R' U2 R2 U R' U R U2 R'", [[2, "U' R2 F2 r U r' F R2 U2 r' U' r"], [3, "R2 F U' F U F2 R2 U' R' F R"], [4, "U2 R U R' U R U2 R2 U' R U' R' U2 R"]]),
  cU('u-rows', 'U Rows', ['U Filas', 'U Rows', 'U Linhas'], 'U_Rows',
    ['faros verdes al frente; a la derecha, naranja adelante y rojo atrás (opuestos); a la izquierda, rojo adelante y naranja atrás (opuestos)',
      'green headlights in front; on the right, orange in front and red at the back (opposite colors); on the left, red in front and orange at the back (opposite colors)', 'faróis verdes na frente; à direita, laranja na frente e vermelho atrás (opostas); à esquerda, vermelho na frente e laranja atrás (opostas)'],
    "U' F R2 D R' U R D' R2 U' F'", [[2, "F U R2 D R' U' R D' R2 F'"], [3, "U' R' U' R F R2 D' R U R' D R2 U' F'"], [4, "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R"]]),
  cU('u-x', 'U X', ['U X', 'U X', 'U X'], 'U_X',
    ['al frente, naranja a la izquierda y rojo a la derecha (opuestos); a la derecha, verde adelante y azul atrás (opuestos); a la izquierda, verde adelante y azul atrás (opuestos)',
      'in front, orange on the left and red on the right (opposite colors); on the right, green in front and blue at the back (opposite colors); on the left, green in front and blue at the back (opposite colors)', 'na frente, laranja à esquerda e vermelho à direita (opostas); à direita, verde na frente e azul atrás (opostas); à esquerda, verde na frente e azul atrás (opostas)'],
    "U2 r U' r' U r' D' r U' r' D r", [[2, "F R U' R' U R U R' U R U' R' F'"], [3, "r' U r' D' r U r' D r U' r"], [4, "U' R' D R U' R U' R' U R' D' R"]]),
  cU('u-upper-row', 'U Upper Row', ['U Fila de arriba', 'U Upper Row', 'U Linha de cima'], 'U_Upper_Row',
    ['al frente, verde a la izquierda y azul a la derecha (opuestos); a la derecha, rojo adelante y azul atrás; a la izquierda, rojo adelante y verde atrás',
      'in front, green on the left and blue on the right (opposite colors); on the right, red in front and blue at the back; on the left, red in front and green at the back', 'na frente, verde à esquerda e azul à direita (opostas); à direita, vermelho na frente e azul atrás; à esquerda, vermelho na frente e verde atrás'],
    "U' F R U R' U' F'", [[2, "U F U R U' R' F'"], [3, "U' F U' R' U R U F' R' U2 R"], [4, "R' F' U' F U R"]]),
];
const cmllT = [
  cT('t-left-bar', 'T Left Bar', ['T Barra izquierda', 'T Left Bar', 'T Barra esquerda'], 'T_Left_Bar',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante; atrás, azul a la izquierda y rojo a la derecha; a la izquierda, verde adelante',
      'in front, orange on the left and blue on the right; on the right, red in front; at the back, blue on the left and red on the right; on the left, green in front', 'na frente, laranja à esquerda e azul à direita; à direita, vermelho na frente; atrás, azul à esquerda e vermelho à direita; à esquerda, verde na frente'],
    "U' R U R' U' R' F R F'", [[2, "U' r U R' U' r' F R F'"], [4, "U L U L' U' L' f U f'"]]),
  cT('t-right-bar', 'T Right Bar', ['T Barra derecha', 'T Right Bar', 'T Barra direita'], 'T_Right_Bar',
    ['al frente, azul a la izquierda y rojo a la derecha; a la derecha, verde adelante; atrás, naranja a la izquierda y azul a la derecha; a la izquierda, naranja adelante',
      'in front, blue on the left and red on the right; on the right, green in front; at the back, orange on the left and blue on the right; on the left, orange in front', 'na frente, azul à esquerda e vermelho à direita; à direita, verde na frente; atrás, laranja à esquerda e azul à direita; à esquerda, laranja na frente'],
    "U L' U' L U L F' L' F", [[2, "U r' F' r U r U' r' F"], [3, "U' F R U' R' U R U R' F'"], [4, "U2 R' U' R' D' R U R' D R2"]]),
  cT('t-rows', 'T Rows', ['T Filas', 'T Rows', 'T Linhas'], 'T_Rows',
    ['faros verdes al frente; a la derecha, naranja adelante; atrás, rojo a la izquierda y naranja a la derecha (opuestos); a la izquierda, rojo adelante',
      'green headlights in front; on the right, orange in front; at the back, red on the left and orange on the right (opposite colors); on the left, red in front', 'faróis verdes na frente; à direita, laranja na frente; atrás, vermelho à esquerda e laranja à direita (opostas); à esquerda, vermelho na frente'],
    "R U2 R' U' R U' R2 U2 R U R' U R", [[2, "F R' F R2 U' R' U' R U R' F2"], [3, "r' U r U2 R2 F' r U' r' F2 R2"], [4, "U' R U R' U R U2 R2 F' r U' r' F2 R"]]),
  cT('t-bottom-row', 'T Bottom Row', ['T Fila de abajo', 'T Bottom Row', 'T Linha de baixo'], 'T_Bottom_Row',
    ['faros azules al frente; a la derecha, rojo adelante; faros verdes atrás; a la izquierda, naranja adelante',
      'blue headlights in front; on the right, red in front; green headlights at the back; on the left, orange in front', 'faróis azuis na frente; à direita, vermelho na frente; faróis verdes atrás; à esquerda, laranja na frente'],
    "r' U r U2 R2 F R F' R", [[2, "R U R2 F R F' U r U r'"], [3, "U2 r U' r' U' F R' F' R2 U' R'"]]),
  cT('t-top-row', 'T Top Row', ['T Fila de arriba', 'T Top Row', 'T Linha de cima'], 'T_Top_Row',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul adelante; atrás, naranja a la izquierda y rojo a la derecha (opuestos); a la izquierda, azul adelante',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue in front; at the back, orange on the left and red on the right (opposite colors); on the left, blue in front', 'na frente, vermelho à esquerda e laranja à direita (opostas); à direita, azul na frente; atrás, laranja à esquerda e vermelho à direita (opostas); à esquerda, azul na frente'],
    "r' D' r U r' D r U' r U r'", [[2, "U R' D R U' R U R' U R' D' R"], [3, "U2 F R U R' U' R U' R' U' R U R' F'"], [4, "R F R' U' R F' R' U R' F' R"]]),
  cT('t-columns', 'T Columns', ['T Columnas', 'T Columns', 'T Colunas'], 'T_Columns',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul adelante; faros verdes atrás; a la izquierda, azul adelante',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue in front; green headlights at the back; on the left, blue in front', 'na frente, vermelho à esquerda e laranja à direita (opostas); à direita, azul na frente; faróis verdes atrás; à esquerda, azul na frente'],
    "U2 r U' r2 D' r U2 r' D r2 U r'", [[2, "U2 r2 D' r U r' D r2 U' r' U' r"], [3, "R' U R2 D r' U2 r D' R2 U' R"], [4, "U2 R' F R2 F R' U2 R F' R2 F' R"]]),
];
const cmllS = [
  cS('s-left-bar', 'Sune Left Bar', ['Sune Barra izquierda', 'Sune Left Bar', 'Sune Barra esquerda'], 'Sune_Left_Bar',
    ['al frente, verde a la izquierda y naranja a la derecha; a la derecha, azul adelante; atrás, azul a la derecha; a la izquierda, rojo atrás',
      'in front, green on the left and orange on the right; on the right, blue in front; at the back, blue on the right; on the left, red at the back', 'na frente, verde à esquerda e laranja à direita; à direita, azul na frente; atrás, azul à direita; à esquerda, vermelho atrás'],
    "U R U R' U R U2 R'", [[2, "R' U2 R U R' U R"], [3, "U r U R' U R U2 r'"], [4, "U' L U L' U L U2 L'"]]),
  cS('s-x', 'Sune X', ['Sune X', 'Sune X', 'Sune X'], 'Sune_X',
    ['al frente, azul a la izquierda y verde a la derecha (opuestos); a la derecha, naranja adelante; atrás, naranja a la derecha; a la izquierda, rojo atrás',
      'in front, blue on the left and green on the right (opposite colors); on the right, orange in front; at the back, orange on the right; on the left, red at the back', 'na frente, azul à esquerda e verde à direita (opostas); à direita, laranja na frente; atrás, laranja à direita; à esquerda, vermelho atrás'],
    "U L' U2 L U2 r U' r' F", [[2, "U r' F2 r U2 r U' r' F"], [3, "U L' U2 L U2 L F' L' F"], [4, "U R' F2 R U2 R U' r' F M'"]]),
  cS('s-up-slash', 'Sune Up Slash', ['Sune Diagonal arriba', 'Sune Up Slash', 'Sune Diagonal para cima'], 'Sune_Up_Slash',
    ['al frente, rojo a la izquierda y verde a la derecha; a la derecha, naranja adelante; atrás, azul a la derecha; a la izquierda, naranja atrás',
      'in front, red on the left and green on the right; on the right, orange in front; at the back, blue on the right; on the left, orange at the back', 'na frente, vermelho à esquerda e verde à direita; à direita, laranja na frente; atrás, azul à direita; à esquerda, laranja atrás'],
    "U F R' F' R U2 R U2 R'", [[3, "U M F R' F' r U2 R U2 R'"], [4, "U F U R U' R2 F' R U R U' R'"]]),
  cS('s-columns', 'Sune Columns', ['Sune Columnas', 'Sune Columns', 'Sune Colunas'], 'Sune_Columns',
    ['al frente, naranja a la izquierda y rojo a la derecha (opuestos); a la derecha, verde adelante; atrás, azul a la derecha; a la izquierda, verde atrás',
      'in front, orange on the left and red on the right (opposite colors); on the right, green in front; at the back, blue on the right; on the left, green at the back', 'na frente, laranja à esquerda e vermelho à direita (opostas); à direita, verde na frente; atrás, azul à direita; à esquerda, verde atrás'],
    "U R U R' U' R' F R F' R U R' U R U2 R'", [[2, "R U R' U R U' R D R' U' R D' R2"], [3, "U2 r' F' r2 U R' F' r' F R2 U' R'"], [4, "F R' U2 R F' R' F U2 F' R"]]),
  cS('s-right-bar', 'Sune Right Bar', ['Sune Barra derecha', 'Sune Right Bar', 'Sune Barra direita'], 'Sune_Right_Bar',
    ['al frente, rojo a la izquierda y azul a la derecha; a la derecha, rojo adelante; atrás, naranja a la derecha; a la izquierda, verde atrás',
      'in front, red on the left and blue on the right; on the right, red in front; at the back, orange on the right; on the left, green at the back', 'na frente, vermelho à esquerda e azul à direita; à direita, vermelho na frente; atrás, laranja à direita; à esquerda, verde atrás'],
    "U' R U R' U R' F R F' R U2 R'", [[2, "U' R U R' U r' F R F' r U2 R'"], [3, "U' R U R' F' R U R' U R U2 R' F R U' R'"]]),
  cS('s-down-slash', 'Sune Down Slash', ['Sune Diagonal abajo', 'Sune Down Slash', 'Sune Diagonal para baixo'], 'Sune_Down_Slash',
    ['al frente, naranja a la izquierda y verde a la derecha; a la derecha, naranja adelante; atrás, azul a la derecha; a la izquierda, rojo atrás',
      'in front, orange on the left and green on the right; on the right, orange in front; at the back, blue on the right; on the left, red at the back', 'na frente, laranja à esquerda e verde à direita; à direita, laranja na frente; atrás, azul à direita; à esquerda, vermelho atrás'],
    "U r U' r' F R' F' R", [[2, "U R U' r' F R' F' r"], [3, "U R U' L' U R' U' L"], [4, "U' L U' R' U L' U' R"]]),
];
const cmllAS = [
  cAS('as-right-bar', 'AS Right Bar', ['Antisune Barra derecha', 'Antisune Right Bar', 'Antisune Barra direita'], 'Anti_Sune_Right_Bar',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo atrás; atrás, verde a la izquierda; a la izquierda, verde adelante',
      'in front, orange on the left and blue on the right; on the right, red at the back; at the back, green on the left; on the left, green in front', 'na frente, laranja à esquerda e azul à direita; à direita, vermelho atrás; atrás, verde à esquerda; à esquerda, verde na frente'],
    "U R' U' R U' R' U2 R", [[2, "U2 R U2 R' U' R U' R'"], [3, "U' L' U' L U' L' U2 L"], [4, "U r' U' R U' R' U2 r"]]),
  cAS('as-columns', 'AS Columns', ['Antisune Columnas', 'Antisune Columns', 'Antisune Colunas'], 'Anti_Sune_Columns',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul atrás; atrás, verde a la izquierda; a la izquierda, azul adelante',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue at the back; at the back, green on the left; on the left, blue in front', 'na frente, vermelho à esquerda e laranja à direita (opostas); à direita, azul atrás; atrás, verde à esquerda; à esquerda, azul na frente'],
    "U2 R U R2 F' r F R U' r2 F r", [[2, "U' R2 D R' U R D' R' U R' U' R U' R'"], [3, "U2 R' U' R U' R' U R' D' R U R' D R2"], [4, "U' R' F U2 F' R F R' U2 R F'"]]),
  cAS('as-down-slash', 'AS Down Slash', ['Antisune Diagonal abajo', 'Antisune Down Slash', 'Antisune Diagonal para baixo'], 'Anti_Sune_Down_Slash',
    ['al frente, verde a la izquierda y naranja a la derecha; a la derecha, rojo atrás; atrás, azul a la izquierda; a la izquierda, rojo adelante',
      'in front, green on the left and orange on the right; on the right, red at the back; at the back, blue on the left; on the left, red in front', 'na frente, verde à esquerda e laranja à direita; à direita, vermelho atrás; atrás, azul à esquerda; à esquerda, vermelho na frente'],
    "U' F' L F L' U2 L' U2 L", [[2, "U' F' r U r' U2 r' F2 r"], [3, "U' F' r U r' U2 L' U2 L"], [4, "U2 F R U' R' U R U2 R' U' F'"]]),
  cAS('as-x', 'AS X', ['Antisune X', 'Antisune X', 'Antisune X'], 'Anti_Sune_X',
    ['al frente, verde a la izquierda y azul a la derecha (opuestos); a la derecha, naranja atrás; atrás, rojo a la izquierda; a la izquierda, rojo adelante',
      'in front, green on the left and blue on the right (opposite colors); on the right, orange at the back; at the back, red on the left; on the left, red in front', 'na frente, verde à esquerda e azul à direita (opostas); à direita, laranja atrás; atrás, vermelho à esquerda; à esquerda, vermelho na frente'],
    "U' R U2 R' U2 R' F R F'", [[2, "U' R U2 R' U2 r' F R F' M'"], [3, "U' R U R' U' R' F R2 U R' U' F'"]]),
  cAS('as-up-slash', 'AS Up Slash', ['Antisune Diagonal arriba', 'Antisune Up Slash', 'Antisune Diagonal para cima'], 'Anti_Sune_Up_Slash',
    ['al frente, verde a la izquierda y rojo a la derecha; a la derecha, naranja atrás; atrás, azul a la izquierda; a la izquierda, rojo adelante',
      'in front, green on the left and red on the right; on the right, orange at the back; at the back, blue on the left; on the left, red in front', 'na frente, verde à esquerda e vermelho à direita; à direita, laranja atrás; atrás, azul à esquerda; à esquerda, vermelho na frente'],
    "U' R' F R F' r U r'", [[2, "U' r' F R F' r U R'"], [3, "U' L' U R U' L U R'"], [4, "U R' U L U' R U L'"]]),
  cAS('as-left-bar', 'AS Left Bar', ['Antisune Barra izquierda', 'Antisune Left Bar', 'Antisune Barra esquerda'], 'Anti_Sune_Left_Bar',
    ['al frente, azul a la izquierda y naranja a la derecha; a la derecha, verde atrás; atrás, rojo a la izquierda; a la izquierda, naranja adelante',
      'in front, blue on the left and orange on the right; on the right, green at the back; at the back, red on the left; on the left, orange in front', 'na frente, azul à esquerda e laranja à direita; à direita, verde atrás; atrás, vermelho à esquerda; à esquerda, laranja na frente'],
    "U R U2 R' F R' F' R U' R U' R'", [[2, "R' U' R U' R' U R' F R F' U R"], [3, "U R U2 r' F R' F' r U' R U' R'"], [4, "U L' U' L U' L F' L' F L' U2 L"]]),
];
const cmllL = [
  cL('l-best', 'L Best', ['L Best', 'L Best', 'L Best'], 'L_Best',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante y naranja atrás (opuestos); atrás, rojo a la izquierda; a la izquierda, verde atrás',
      'in front, orange on the left and blue on the right; on the right, red in front and orange at the back (opposite colors); at the back, red on the left; on the left, green at the back', 'na frente, laranja à esquerda e azul à direita; à direita, vermelho na frente e laranja atrás (opostas); atrás, vermelho à esquerda; à esquerda, verde atrás'],
    "U' F' r U r' U' r' F r", [[2, "U2 F R U' R' U' R U R' F'"], [3, "R2 D' R U' R' D R U R"], [4, "U' F' L F L' U' L' U L"]]),
  cL('l-good', 'L Good', ['L Good', 'L Good', 'L Good'], 'L_Good',
    ['al frente, rojo a la izquierda y naranja a la derecha (opuestos); a la derecha, azul adelante y rojo atrás; atrás, verde a la izquierda; a la izquierda, naranja atrás',
      'in front, red on the left and orange on the right (opposite colors); on the right, blue in front and red at the back; at the back, green on the left; on the left, orange at the back', 'na frente, vermelho à esquerda e laranja à direita (opostas); à direita, azul na frente e vermelho atrás; atrás, verde à esquerda; à esquerda, laranja atrás'],
    "U2 F R' F' R U R U' R'", [[2, "U2 F R' F' r U R U' r'"], [3, "U2 R U R' U' R' F R F' R U R' U' R' F R F'"], [4, "U' r U' r' U' F' U F"]]),
  cL('l-pure', 'L Pure', ['L Pura', 'L Pure', 'L Pura'], 'L_Pure',
    ['al frente, naranja a la izquierda y azul a la derecha; a la derecha, rojo adelante y verde atrás; atrás, verde a la izquierda; a la izquierda, naranja atrás',
      'in front, orange on the left and blue on the right; on the right, red in front and green at the back; at the back, green on the left; on the left, orange at the back', 'na frente, laranja à esquerda e azul à direita; à direita, vermelho na frente e verde atrás; atrás, verde à esquerda; à esquerda, laranja atrás'],
    "R U R' U R U' R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U R' U' R U' R'"], [3, "U' R' U2 R U R' U' R U R' U' R U R' U R"], [4, "R U R' U r U' R' U R U' R' U R U2 r'"]]),
  cL('l-front-commutator', 'L Front Comm', ['L Conmutador delantero', 'L Front Commutator', 'L Comutador dianteiro'], 'L_Front_Commutator',
    ['al frente, rojo a la izquierda y azul a la derecha; a la derecha, rojo adelante y naranja atrás (opuestos); atrás, naranja a la izquierda; a la izquierda, azul atrás',
      'in front, red on the left and blue on the right; on the right, red in front and orange at the back (opposite colors); at the back, orange on the left; on the left, blue at the back', 'na frente, vermelho à esquerda e azul à direita; à direita, vermelho na frente e laranja atrás (opostas); atrás, laranja à esquerda; à esquerda, azul atrás'],
    "U2 R U2 R D R' U2 R D' R2", [[2, "U2 R U2 r D r' U2 r D' r' R'"], [3, "R U R' U R' F R F' U2 R' F R F'"], [4, "U r' D' r U2 r' D r U2 r U r'"]]),
  cL('l-diagonal', 'L Diagonal', ['L Diagonal', 'L Diagonal', 'L Diagonal'], 'L_Diagonal',
    ['al frente, verde a la izquierda y rojo a la derecha; a la derecha, verde adelante y rojo atrás; atrás, naranja a la izquierda; a la izquierda, azul atrás',
      'in front, green on the left and red on the right; on the right, green in front and red at the back; at the back, orange on the left; on the left, blue at the back', 'na frente, verde à esquerda e vermelho à direita; à direita, verde na frente e vermelho atrás; atrás, laranja à esquerda; à esquerda, azul atrás'],
    "U2 R U2 R2 F R F' R U2 R'", [[2, "U2 r U2 R2 F R F' R U2 r'"], [3, "R' U' R U R' F' R U R' U' R' F R2"], [4, "U R U2 R' F R' F' R2 U2 R'"]]),
  cL('l-back-commutator', 'L Back Comm', ['L Conmutador trasero', 'L Back Commutator', 'L Comutador traseiro'], 'L_Back_Commutator',
    ['al frente, naranja a la izquierda y rojo a la derecha (opuestos); a la derecha, verde adelante y rojo atrás; atrás, verde a la izquierda; a la izquierda, naranja atrás',
      'in front, orange on the left and red on the right (opposite colors); on the right, green in front and red at the back; at the back, green on the left; on the left, orange at the back', 'na frente, laranja à esquerda e vermelho à direita (opostas); à direita, verde na frente e vermelho atrás; atrás, verde à esquerda; à esquerda, laranja atrás'],
    "U R' U2 R' D' R U2 R' D R2", [[2, "U2 R U R' U' R' F R2 U' R' U R U R' F'"], [3, "U2 r D r' U2 r D' r' U2 r' U' r"], [4, "U R' U2 r' D' r U2 r' D r R"]]),
];

// --- 4. LSE: the last six edges with M and U. Seen from the front-right; DB is hidden, so the texts say how it is ---
const lse = (slug: string, stage: Stage, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `lse-${slug}`, stage, code, name, recognition, alg, note });

// EO: a bad edge has its yellow or white sticker off the top and bottom faces (with the centers lined up)
const eo = [
  lse('eo-flecha', 'lse-eo', ['Flecha', 'Arrow', 'Seta'], ['Flecha', 'Arrow', 'Seta'],
    ['3 malas arriba (derecha, atrás e izquierda: la flecha) y la de abajo atrás (DB) mala. La de abajo al frente, buena',
      '3 bad on top (right, back and left: the arrow) and the bottom-back one (DB) bad. The bottom-front one is good', '3 ruins em cima (direita, atrás e esquerda: a seta) e a de baixo atrás (DB) ruim. A de baixo na frente, boa'], "M U M'",
    ["`M U` ya las orienta; `M'` vuelve a alinear los centros. Si la mala de abajo está al frente, mira el caso siguiente.",
      "`M U` already orients them; `M'` lines the centers up again. If the bad bottom edge is in front, see the next case.", "`M U` já as orienta; `M'` alinha os centros de novo. Se a ruim de baixo estiver na frente, veja o próximo caso."]),
  lse('eo-flecha-df', 'lse-eo', ['Flecha DF', 'Arrow DF', 'Seta DF'], ['Flecha, mala al frente', 'Arrow, bad one in front', 'Seta, ruim na frente'],
    ['3 malas arriba (derecha, atrás e izquierda) y la de abajo al frente (DF) mala. La de abajo atrás (DB), buena',
      '3 bad on top (right, back and left) and the bottom-front one (DF) bad. The bottom-back one (DB) is good', '3 ruins em cima (direita, atrás e esquerda) e a de baixo na frente (DF) ruim. A de baixo atrás (DB), boa'], "M2 U2 M' U M'"),
  lse('eo-cuatro-arriba', 'lse-eo', ['4 arriba', '4 on top', '4 em cima'], ['4 malas arriba', '4 bad on top', '4 ruins em cima'],
    ['Las 4 de arriba malas; las 2 de abajo (DF y DB), buenas', 'All 4 on top bad; the 2 on the bottom (DF and DB) good', 'As 4 de cima ruins; as 2 de baixo (DF e DB), boas'], "M' U2 M' U2 M' U' M'"),
  lse('eo-dos-dos', 'lse-eo', ['2 + 2', '2 + 2', '2 + 2'], ['2 arriba y 2 abajo', '2 on top and 2 on the bottom', '2 em cima e 2 embaixo'],
    ['2 malas arriba, juntas (atrás e izquierda), y las 2 de abajo (DF y DB) malas', '2 bad on top, side by side (back and left), and both bottom ones (DF and DB) bad', '2 ruins em cima, juntas (atrás e esquerda), e as 2 de baixo (DF e DB) ruins'], "M2 U' M' U M'"),
  lse('eo-dos-abajo', 'lse-eo', ['2 abajo', '2 on the bottom', '2 embaixo'], ['Solo las 2 de abajo', 'Only the 2 on the bottom', 'Só as 2 de baixo'],
    ['Las 4 de arriba buenas; las 2 de abajo (DF y DB), malas', 'All 4 on top good; the 2 on the bottom (DF and DB) bad', 'As 4 de cima boas; as 2 de baixo (DF e DB), ruins'], "M U M U' M' U M'"),
  lse('eo-uno-uno', 'lse-eo', ['1 + 1', '1 + 1', '1 + 1'], ['1 arriba y 1 abajo atrás', '1 on top and 1 at the bottom back', '1 em cima e 1 embaixo atrás'],
    ['1 mala arriba, a la izquierda, y la de abajo atrás (DB) mala', '1 bad on top, on the left, and the bottom-back one (DB) bad', '1 ruim em cima, à esquerda, e a de baixo atrás (DB) ruim'], "M' U' M' U2 M U M"),
  lse('eo-uno-uno-df', 'lse-eo', ['1 + 1 DF', '1 + 1 DF', '1 + 1 DF'], ['1 arriba y 1 abajo al frente', '1 on top and 1 at the bottom front', '1 em cima e 1 embaixo na frente'],
    ['1 mala arriba, a la izquierda, y la de abajo al frente (DF) mala', '1 bad on top, on the left, and the bottom-front one (DF) bad', '1 ruim em cima, à esquerda, e a de baixo na frente (DF) ruim'], "M U M' U2 M' U M"),
];

// UL/UR: the red-yellow edge between the two red corners, the orange-yellow one between the orange corners
const ulur = [
  lse('ulur-abajo', 'lse-ulur', ['Abajo', 'Bottom', 'Embaixo'], ['Las dos abajo', 'Both on the bottom', 'As duas embaixo'],
    ['Las dos abajo, la roja-amarilla en el lado contrario a las esquinas rojas: esquinas rojas al frente, arista roja-amarilla abajo atrás (DB) y naranja-amarilla abajo al frente (DF)',
      'Both on the bottom, the red-yellow one on the side opposite the red corners: red corners in front, red-yellow edge at the bottom back (DB) and orange-yellow at the bottom front (DF)', 'As duas embaixo, a vermelha-amarela no lado oposto às quinas vermelhas: quinas vermelhas na frente, aresta vermelha-amarela embaixo atrás (DB) e laranja-amarela embaixo na frente (DF)'], 'M2 U M2',
    ["`M2 U' M2` también vale. Si la roja está del mismo lado que las esquinas rojas, haz antes `U2`.", "`M2 U' M2` works too. If the red one is on the same side as the red corners, do `U2` first.", "`M2 U' M2` também serve. Se a vermelha estiver do mesmo lado que as quinas vermelhas, faça `U2` antes."]),
  lse('ulur-una-abajo', 'lse-ulur', ['Una abajo', 'One on the bottom', 'Uma embaixo'], ['Una arriba, otra abajo', 'One on top, one on the bottom', 'Uma em cima, outra embaixo'],
    ['Esquinas rojas atrás. La arista roja-amarilla ya está arriba atrás, entre ellas; la naranja-amarilla, abajo al frente (DF)',
      'Red corners at the back. The red-yellow edge is already on top at the back, between them; the orange-yellow one is at the bottom front (DF)', 'Quinas vermelhas atrás. A aresta vermelha-amarela já está em cima atrás, entre elas; a laranja-amarela, embaixo na frente (DF)'], 'M U2 M U M2'),
  lse('ulur-opuestas', 'lse-ulur', ['Opuestas', 'Opposite', 'Opostas'], ['Las dos arriba, giradas', 'Both on top, turned', 'As duas em cima, giradas'],
    ['Esquinas rojas atrás. Las dos aristas arriba, frente a frente pero a los lados: la roja-amarilla a la derecha y la naranja-amarilla a la izquierda',
      'Red corners at the back. Both edges on top, facing each other but on the sides: red-yellow on the right and orange-yellow on the left', 'Quinas vermelhas atrás. As duas arestas em cima, uma de frente para a outra, mas nos lados: a vermelha-amarela à direita e a laranja-amarela à esquerda'], "M U M2 U M2 U M'"),
  lse('ulur-cambiadas', 'lse-ulur', ['Cambiadas', 'Swapped', 'Trocadas'], ['Las dos arriba, cambiadas', 'Both on top, swapped', 'As duas em cima, trocadas'],
    ['Esquinas en su sitio. Las dos aristas arriba, cambiadas: la roja-amarilla a la derecha y la naranja-amarilla a la izquierda',
      'Corners in place. Both edges on top, swapped: red-yellow on the right and orange-yellow on the left', 'Quinas no lugar. As duas arestas em cima, trocadas: a vermelha-amarela à direita e a laranja-amarela à esquerda'], "M U M2 U2 M2 U M'"),
];

// 4c: UF, UB, DF and DB (yellow-green, yellow-blue, white-green, white-blue) and the M slice's centers
const fourC = [
  lse('4c-ciclo-delante', 'lse-4c', ['Ciclo DB', 'Cycle DB', 'Ciclo DB'], ['Ciclo de 3, DB bien', '3-cycle, DB solved', 'Ciclo de 3, DB certa'],
    ['Arriba al frente, la blanca-verde; arriba atrás, la amarilla-verde; abajo al frente, la amarilla-azul (azul en la cara verde). Abajo atrás (DB), bien',
      'Top front: the white-green one; top back: the yellow-green one; bottom front: the yellow-blue one (blue on the green face). Bottom back (DB) solved', 'Em cima na frente, a branca-verde; em cima atrás, a amarela-verde; embaixo na frente, a amarela-azul (azul na face verde). Embaixo atrás (DB), certa'], "M' U2 M U2"),
  lse('4c-ciclo-atras', 'lse-4c', ['Ciclo DF', 'Cycle DF', 'Ciclo DF'], ['Ciclo de 3, DF bien', '3-cycle, DF solved', 'Ciclo de 3, DF certa'],
    ['Arriba al frente, la amarilla-azul; arriba atrás, la blanca-azul; abajo atrás (DB), la amarilla-verde. Abajo al frente (DF), bien',
      'Top front: the yellow-blue one; top back: the white-blue one; bottom back (DB): the yellow-green one. Bottom front (DF) solved', 'Em cima na frente, a amarela-azul; em cima atrás, a branca-azul; embaixo atrás (DB), a amarela-verde. Embaixo na frente (DF), certa'], "M U2 M' U2"),
  lse('4c-ciclo-uf', 'lse-4c', ['Ciclo UF', 'Cycle UF', 'Ciclo UF'], ['Ciclo de 3, UF bien', '3-cycle, UF solved', 'Ciclo de 3, UF certa'],
    ['Arriba al frente, bien. Arriba atrás, la blanca-azul; abajo al frente, la amarilla-azul; abajo atrás (DB), la blanca-verde',
      'Top front solved. Top back: the white-blue one; bottom front: the yellow-blue one; bottom back (DB): the white-green one', 'Em cima na frente, certa. Em cima atrás, a branca-azul; embaixo na frente, a amarela-azul; embaixo atrás (DB), a branca-verde'], "M2 U2 M' U2 M'"),
  lse('4c-cambio', 'lse-4c', ['Cambio', 'Swap', 'Troca'], ['Adelante y atrás cambiadas', 'Front and back swapped', 'Frente e trás trocadas'],
    ['Arriba, la amarilla-azul al frente y la amarilla-verde atrás. Abajo, lo mismo: la blanca-azul al frente y la blanca-verde atrás (DB)',
      'On top, the yellow-blue one in front and the yellow-green one at the back. On the bottom, the same: white-blue in front and white-green at the back (DB)', 'Em cima, a amarela-azul na frente e a amarela-verde atrás. Embaixo, o mesmo: a branca-azul na frente e a branca-verde atrás (DB)'], 'M2 U2 M2 U2'),
  lse('4c-vertical', 'lse-4c', ['Vertical', 'Vertical', 'Vertical'], ['Arriba y abajo cambiadas', 'Top and bottom swapped', 'Cima e baixo trocadas'],
    ['Blanco arriba al frente y atrás: la blanca-verde y la blanca-azul están arriba; la amarilla-verde y la amarilla-azul, abajo debajo de ellas',
      'White on top at the front and back: the white-green and white-blue ones are on top; the yellow-green and yellow-blue ones are on the bottom, under them', 'Branco em cima na frente e atrás: a branca-verde e a branca-azul estão em cima; a amarela-verde e a amarela-azul, embaixo, debaixo delas'], 'M U2 M2 U2 M'),
];

export const roux: Method = {
  id: 'roux',
  name: tr('Roux', 'Roux', 'Roux'),
  summary: tr('Dos bloques, las esquinas de arriba (CMLL) y las seis últimas aristas con M y U.', 'Two blocks, the top corners (CMLL) and the last six edges with M and U.', 'Dois blocos, as quinas de cima (CMLL) e as seis últimas arestas com M e U.'),
  description: doc([
    'Un método de **pocos giros**, de Gilles Roux. En vez de ir por capas, armas dos **bloques** y dejas la capa del medio para el final.',
    '## Los 4 pasos',
    '1. **Primer bloque:** 1×2×3 a la izquierda. Intuitivo.',
    '2. **Segundo bloque:** el mismo a la derecha, solo con `R`, `r`, `M` y `U`. Intuitivo.',
    '3. **CMLL:** las 4 esquinas de arriba, con un algoritmo (42 casos).',
    '4. **Últimas seis aristas:** solo con `M` y `U`, en 3 pasos cortos.',
    '## Para quién',
    '- Si prefieres pensar y planear a memorizar: menos giros por resolución que el CFOP y pocos algoritmos.',
    '- Sin rotar el cubo: muy usado a una mano.',
    "- Pide soltura con `M`: practica `M` y `M'` hasta hacerlos sin mirar.",
    '- Si sabes el F2L del CFOP, los pares de los bloques entran igual.',
  ], [
    'A **low move count** method, by Gilles Roux. Instead of going layer by layer, you build two **blocks** and leave the middle layer for last.',
    '## The 4 steps',
    '1. **First block:** 1×2×3 on the left. Intuitive.',
    '2. **Second block:** the same on the right, with `R`, `r`, `M` and `U` only. Intuitive.',
    '3. **CMLL:** the 4 top corners, with one algorithm (42 cases).',
    '4. **Last six edges:** with `M` and `U` only, in 3 short steps.',
    '## Who it suits',
    '- If you would rather think and plan than memorize: fewer moves per solve than CFOP and few algorithms.',
    '- No cube rotations: popular for one-handed solving.',
    "- It needs fluent `M` turns: practice `M` and `M'` until you can do them without looking.",
    "- If you know CFOP's F2L, the block pairs go in the same way.",
  ], [
    'Um método de **poucos movimentos**, de Gilles Roux. Em vez de ir por camadas, você monta dois **blocos** e deixa a camada do meio para o final.',
    '## Os 4 passos',
    '1. **Primeiro bloco:** 1×2×3 à esquerda. Intuitivo.',
    '2. **Segundo bloco:** o mesmo à direita, só com `R`, `r`, `M` e `U`. Intuitivo.',
    '3. **CMLL:** as 4 quinas de cima, com um algoritmo (42 casos).',
    '4. **Últimas seis arestas:** só com `M` e `U`, em 3 passos curtos.',
    '## Para quem',
    '- Se você prefere pensar e planejar a decorar: menos movimentos por resolução que o CFOP e poucos algoritmos.',
    '- Sem girar o cubo: muito usado com uma mão.',
    "- Exige fluência com `M`: pratique `M` e `M'` até fazê-los sem olhar.",
    '- Se você sabe o F2L do CFOP, os pares dos blocos entram do mesmo jeito.',
  ]),
  orientation: tr(
    '**Blanco abajo, amarillo arriba y verde al frente.** El primer bloque va a la izquierda (rojo) y el segundo a la derecha (naranja).',
    '**White on the bottom, yellow on top and green in front.** The first block goes on the left (red) and the second on the right (orange).', '**Branco embaixo, amarelo em cima e verde na frente.** O primeiro bloco vai à esquerda (vermelho) e o segundo à direita (laranja).',
  ),
  notation: doc([
    '## Giros',
    "- `M`: la capa del medio entre `L` y `R`; gira como `L`. `r`: `R` y `M'` a la vez.",
    '- Los centros de la capa `M` pueden quedar girados: solo cuentan en el último paso.',
    '## Figuras',
    '- **Bloques:** el cubo visto desde el lado del bloque. Solo se colorean sus piezas.',
    '- **CMLL:** la cara de arriba desde arriba, con el frente abajo. Solo las esquinas, con flechas a dónde va cada una.',
    '- **Últimas aristas:** las 6 aristas y los centros de la capa `M`. La de abajo atrás (DB) no se ve: el texto dice cómo está.',
  ], [
    '## Turns',
    "- `M`: the middle layer between `L` and `R`; turns like `L`. `r`: `R` and `M'` together.",
    "- The `M` layer's centers may stay turned: they only count in the last step.",
    '## Diagrams',
    "- **Blocks:** the cube seen from the block's side. Only its pieces are in color.",
    '- **CMLL:** the top face from above, with the front at the bottom. Only the corners, with arrows to where each one goes.',
    "- **Last edges:** the 6 edges and the `M` layer's centers. The bottom-back one (DB) is hidden: the text says how it is.",
  ], [
    '## Movimentos',
    "- `M`: a camada do meio entre `L` e `R`; gira como `L`. `r`: `R` e `M'` ao mesmo tempo.",
    '- Os centros da camada `M` podem ficar girados: só contam no último passo.',
    '## Figuras',
    '- **Blocos:** o cubo visto do lado do bloco. Só as peças dele ficam coloridas.',
    '- **CMLL:** a face de cima vista de cima, com a frente embaixo. Só as quinas, com setas para onde vai cada uma.',
    '- **Últimas arestas:** as 6 arestas e os centros da camada `M`. A de baixo atrás (DB) não aparece: o texto diz como ela está.',
  ]),
  before: { path: '/academia/notacion', label: tr('Antes: los giros M y r en Notación', 'Before: the M and r moves in Notation', 'Antes: os movimentos M e r em Notação') },
  phases: [
    {
      id: 'roux-bloque1',
      name: tr('Primer bloque', 'First block', 'Primeiro bloco'),
      goal: doc([
        '**Meta:** un bloque de 1×2×3 a la izquierda: centro rojo, arista blanca-roja abajo (DL) y un par a cada lado.',
        '**Sin algoritmos:** es intuitivo, como la cruz. Un **par** es una esquina blanca con su arista.',
      ], [
        '**Goal:** a 1×2×3 block on the left: red center, white-red edge on the bottom (DL) and a pair on each side.',
        '**No algorithms:** it is intuitive, like the cross. A **pair** is a white corner with its edge.',
      ], [
        '**Meta:** um bloco de 1×2×3 à esquerda: centro vermelho, aresta branca-vermelha embaixo (DL) e um par de cada lado.',
        '**Sem algoritmos:** é intuitivo, como a cruz. Um **par** é uma quina branca com a sua aresta.',
      ]),
      description: doc([
        '## Cómo se hace',
        '1. Planea en la inspección la arista DL y, si puedes, un par.',
        '2. **Arista DL:** llévala abajo a la izquierda, junto al centro rojo, con el blanco abajo.',
        '3. **Par de atrás:** junta la esquina blanca-roja-azul con la arista roja-azul y mete el par atrás. Queda un cuadrado de 1×2×2.',
        '4. **Par de adelante:** igual, con la blanca-roja-verde y la roja-verde, al frente. Los casos de abajo son este último par.',
        '## Los pares',
        'Para juntar los pares usa la derecha (`R`, `r`, `M` y `U`): aún está libre. `F` o `B` meten un par de una vez si su ranura está libre.',
      ], [
        '## How to do it',
        '1. During inspection, plan the DL edge and, if you can, one pair.',
        '2. **DL edge:** bring it to the bottom left, next to the red center, with white facing down.',
        '3. **Back pair:** join the white-red-blue corner with the red-blue edge and put them in at the back. That makes a 1×2×2 square.',
        '4. **Front pair:** the same, with the white-red-green corner and the red-green edge, in front. The cases below are this last pair.',
        '## The pairs',
        'To join the pairs, use the right side (`R`, `r`, `M` and `U`): it is still free. `F` or `B` put a pair in at once if its slot is empty.',
      ], [
        '## Como fazer',
        '1. Na inspeção, planeje a aresta DL e, se puder, um par.',
        '2. **Aresta DL:** leve-a para baixo à esquerda, junto ao centro vermelho, com o branco para baixo.',
        '3. **Par de trás:** junte a quina branca-vermelha-azul com a aresta vermelha-azul e coloque o par atrás. Fica um quadrado de 1×2×2.',
        '4. **Par da frente:** igual, com a branca-vermelha-verde e a vermelha-verde, na frente. Os casos abaixo são este último par.',
        '## Os pares',
        'Para juntar os pares, use o lado direito (`R`, `r`, `M` e `U`): ele ainda está livre. `F` ou `B` colocam um par de uma vez se o slot dele estiver livre.',
      ]),
      tips: doc([
        '- **Se rompe lo que ya armaste:** junta las piezas con `R`, `r`, `M` y `U`, que no lo tocan. `L`, `F` y `B`, solo para meter un par.',
        '- **El par no entra junto:** antes de meterlo, júntalo arriba: esquina y arista lado a lado, con el mismo color del mismo lado.',
        '- **Una pieza quedó atrapada en el bloque:** sácala con el mismo giro que la metió, súbela y vuelve a armar ese par.',
      ], [
        "- **What you built breaks:** join the pieces with `R`, `r`, `M` and `U`, which don't touch it. `L`, `F` and `B` only to put a pair in.",
        "- **The pair doesn't go in together:** before putting it in, join it on top: corner and edge side by side, with the same color on the same side.",
        '- **A piece got stuck in the block:** take it out with the same turn that put it in, bring it up and build that pair again.',
      ], [
        '- **O que você montou se desfaz:** junte as peças com `R`, `r`, `M` e `U`, que não mexem nele. `L`, `F` e `B`, só para colocar um par.',
        '- **O par não entra junto:** antes de colocá-lo, junte-o em cima: quina e aresta lado a lado, com a mesma cor do mesmo lado.',
        '- **Uma peça ficou presa no bloco:** tire-a com o mesmo movimento que a colocou, suba-a e monte esse par de novo.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-fb-delante', name: tr('Par de adelante', 'Front pair', 'Par da frente'), description: tr('El cuadrado de atrás ya está.', 'The back square is done.', 'O quadrado de trás já está feito.'), cases: fbFront },
        { id: 'roux-fb-atras', name: tr('Par de atrás', 'Back pair', 'Par de trás'), description: tr('Con el par de adelante ya hecho: el otro orden.', 'With the front pair done: the other order.', 'Com o par da frente feito: a outra ordem.'), cases: fbBack },
      ],
      quizzes: [],
    },
    {
      id: 'roux-bloque2',
      name: tr('Segundo bloque', 'Second block', 'Segundo bloco'),
      goal: doc([
        '**Meta:** el mismo bloque a la derecha (centro naranja, arista blanca-naranja y dos pares), sin romper el primero.',
        '**Giros:** solo `R`, `r`, `M` y `U`. Ninguno toca el primer bloque.',
      ], [
        '**Goal:** the same block on the right (orange center, white-orange edge and two pairs), without breaking the first one.',
        '**Turns:** only `R`, `r`, `M` and `U`. None of them touches the first block.',
      ], [
        '**Meta:** o mesmo bloco à direita (centro laranja, aresta branca-laranja e dois pares), sem desfazer o primeiro.',
        '**Movimentos:** só `R`, `r`, `M` e `U`. Nenhum deles mexe no primeiro bloco.',
      ]),
      description: doc([
        '## Cómo se hace',
        '1. **Arista DR:** llévala arriba con `M` y `U`, y bájala con `R2` o `r2`.',
        '2. **Par de atrás:** júntalo arriba y mételo con `R`, `r` y `U`, como un par del F2L.',
        '3. **Par de adelante:** igual. Los casos de abajo son este último par.',
        '`r` mueve la ranura y la capa `M` juntas: a veces ahorra un giro.',
      ], [
        '## How to do it',
        '1. **DR edge:** bring it to the top with `M` and `U`, and down with `R2` or `r2`.',
        '2. **Back pair:** join it on top and put it in with `R`, `r` and `U`, like an F2L pair.',
        '3. **Front pair:** the same. The cases below are this last pair.',
        '`r` moves the slot and the `M` layer together: sometimes it saves a turn.',
      ], [
        '## Como fazer',
        '1. **Aresta DR:** leve-a para cima com `M` e `U`, e desça-a com `R2` ou `r2`.',
        '2. **Par de trás:** junte-o em cima e coloque-o com `R`, `r` e `U`, como um par do F2L.',
        '3. **Par da frente:** igual. Os casos abaixo são este último par.',
        '`r` move o slot e a camada `M` juntos: às vezes economiza um movimento.',
      ]),
      tips: doc([
        '- **Se rompió el primer bloque:** usa solo `R`, `r`, `M` y `U`; nada de `L`, `F` ni `B`.',
        '- **Una pieza está atrapada abajo, en la capa del medio:** `M` la sube sin tocar los bloques.',
        '- **Los centros del medio no coinciden:** es normal; se alinean en el último paso.',
      ], [
        '- **The first block broke:** use only `R`, `r`, `M` and `U`; no `L`, `F` or `B`.',
        '- **A piece is stuck on the bottom, in the middle layer:** `M` brings it up without touching the blocks.',
        "- **The middle centers don't line up:** that's normal; they get lined up in the last step.",
      ], [
        '- **O primeiro bloco se desfez:** use só `R`, `r`, `M` e `U`; nada de `L`, `F` nem `B`.',
        '- **Uma peça está presa embaixo, na camada do meio:** `M` a sobe sem mexer nos blocos.',
        '- **Os centros do meio não coincidem:** é normal; eles se alinham no último passo.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-sb-delante', name: tr('Par de adelante', 'Front pair', 'Par da frente'), description: tr('El primer bloque y el cuadrado de atrás ya están.', 'The first block and the back square are done.', 'O primeiro bloco e o quadrado de trás já estão feitos.'), cases: sbFront },
        { id: 'roux-sb-atras', name: tr('Par de atrás', 'Back pair', 'Par de trás'), description: tr('El primer bloque y el par de adelante ya están.', 'The first block and the front pair are done.', 'O primeiro bloco e o par da frente já estão feitos.'), cases: sbBack },
      ],
      quizzes: [],
    },
    {
      id: 'roux-cmll',
      name: tr('CMLL', 'CMLL', 'CMLL'),
      goal: doc([
        '**Meta:** las 4 esquinas de arriba en su sitio, sin romper los bloques. Las aristas dan igual.',
        '**Casos:** 42, con un algoritmo cada uno. Los reconoces por la forma del amarillo y las pegatinas de los lados.',
      ], [
        "**Goal:** the 4 top corners in place, without breaking the blocks. The edges don't matter.",
        '**Cases:** 42, with one algorithm each. You recognize them by the yellow shape and the side stickers.',
      ], [
        '**Meta:** as 4 quinas de cima no lugar, sem desfazer os blocos. As arestas não importam.',
        '**Casos:** 42, com um algoritmo cada um. Você os reconhece pela forma do amarelo e pelos adesivos dos lados.',
      ]),
      description: doc([
        '## Cómo se reconoce',
        '1. Mira el amarillo de las esquinas: la forma (O, H, Pi, U, T, Sune, Antisune o L), como en el OCLL.',
        '2. Gira `U` hasta verla como en la figura.',
        '3. Mira las pegatinas de los lados que dice el grupo:',
        '- **Faros:** las dos de un lado, del mismo color.',
        '- **Opuestos:** rojo y naranja, o verde y azul.',
        '- **Vecinos:** cualquier otro par (rojo y verde, naranja y azul…).',
        'Haz su algoritmo. Al terminar puede faltar un `U`.',
      ], [
        '## How to recognize it',
        '1. Look at the yellow on the corners: the shape (O, H, Pi, U, T, Sune, Antisune or L), as in OCLL.',
        '2. Turn `U` until it looks like the figure.',
        '3. Look at the side stickers the group names:',
        '- **Headlights:** both on one side, the same color.',
        '- **Opposite:** red and orange, or green and blue.',
        '- **Adjacent:** any other pair (red and green, orange and blue…).',
        'Do its algorithm. At the end a `U` may be left.',
      ], [
        '## Como reconhecer',
        '1. Olhe o amarelo das quinas: a forma (O, H, Pi, U, T, Sune, Antisune ou L), como no OCLL.',
        '2. Gire `U` até vê-la como na figura.',
        '3. Olhe os adesivos dos lados que o grupo indica:',
        '- **Faróis:** os dois de um lado, da mesma cor.',
        '- **Opostas:** vermelho e laranja, ou verde e azul.',
        '- **Vizinhas:** qualquer outro par (vermelho e verde, laranja e azul…).',
        'Faça o algoritmo dele. No final pode faltar um `U`.',
      ]),
      tips: doc([
        '- **No sabes el caso:** hazlo en 2 pasos. El OCLL del CFOP reducido (Sune, Antisune, H, Pi, U, T y L) pone el amarillo arriba sin romper los bloques; luego, **O Adyacente** u **O Diagonal** colocan las esquinas.',
        '- **Las aristas de arriba cambiaron:** es normal; los algoritmos pueden moverlas. Solo importan los bloques y las esquinas.',
      ], [
        "- **You don't know the case:** do it in 2 looks. The OCLL from reduced CFOP (Sune, Antisune, H, Pi, U, T and L) gets yellow on top without breaking the blocks; then **O Adjacent** or **O Diagonal** place the corners.",
        "- **The top edges changed:** that's normal; the algorithms may move them. Only the blocks and the corners matter.",
      ], [
        '- **Você não sabe o caso:** faça em 2 passos. O OCLL do CFOP reduzido (Sune, Antisune, H, Pi, U, T e L) coloca o amarelo em cima sem desfazer os blocos; depois, **O Adjacente** ou **O Diagonal** posicionam as quinas.',
        '- **As arestas de cima mudaram:** é normal; os algoritmos podem movê-las. Só importam os blocos e as quinas.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'roux-cmll-o', name: tr('O: todo amarillo arriba', 'O: all yellow on top', 'O: tudo amarelo em cima'), description: tr('Solo falta colocar las esquinas. **Adyacente:** faros en un lado. **Diagonal:** ningún faro.', 'Only the corners\' places are left. **Adjacent:** headlights on one side. **Diagonal:** no headlights.', 'Só falta posicionar as quinas. **Adjacente:** faróis em um lado. **Diagonal:** nenhum farol.'), cases: cmllO },
        { id: 'roux-cmll-h', name: tr('H', 'H', 'H'), description: tr('Dos amarillas al frente y dos atrás. Mira los lados izquierdo y derecho: faros o colores opuestos.', 'Two yellows in front and two at the back. Look at the left and right sides: headlights or opposite colors.', 'Duas amarelas na frente e duas atrás. Olhe os lados esquerdo e direito: faróis ou cores opostas.'), cases: cmllH },
        { id: 'roux-cmll-pi', name: tr('Pi', 'Pi', 'Pi'), description: tr('Dos amarillas a la izquierda. Mira el lado derecho y las dos pegatinas de la izquierda (al frente y atrás).', 'Two yellows on the left. Look at the right side and the two left stickers (front and back).', 'Duas amarelas à esquerda. Olhe o lado direito e os dois adesivos da esquerda (na frente e atrás).'), cases: cmllPi },
        { id: 'roux-cmll-u', name: tr('U', 'U', 'U'), description: tr('Dos arriba, las de adelante; las otras dos miran atrás. Mira el frente: faros o no.', 'Two on top, the front ones; the other two face back. Look at the front: headlights or not.', 'Duas em cima, as da frente; as outras duas viradas para trás. Olhe a frente: faróis ou não.'), cases: cmllU },
        { id: 'roux-cmll-t', name: tr('T', 'T', 'T'), description: tr('Dos arriba, las de adelante; las otras dos miran a los lados. Mira el frente y atrás: faros o no.', 'Two on top, the front ones; the other two face the sides. Look at the front and back: headlights or not.', 'Duas em cima, as da frente; as outras duas viradas para os lados. Olhe a frente e atrás: faróis ou não.'), cases: cmllT },
        { id: 'roux-cmll-s', name: tr('Sune', 'Sune', 'Sune'), description: tr('Una arriba, adelante a la derecha. Mira las dos pegatinas del frente y la de la derecha.', 'One on top, front right. Look at the two front stickers and the one on the right.', 'Uma em cima, na frente à direita. Olhe os dois adesivos da frente e o da direita.'), cases: cmllS },
        { id: 'roux-cmll-as', name: tr('Antisune', 'Antisune', 'Antisune'), description: tr('Una arriba, adelante a la izquierda. Mira las dos pegatinas del frente y la de la izquierda.', 'One on top, front left. Look at the two front stickers and the one on the left.', 'Uma em cima, na frente à esquerda. Olhe os dois adesivos da frente e o da esquerda.'), cases: cmllAS },
        { id: 'roux-cmll-l', name: tr('L', 'L', 'L'), description: tr('Dos arriba, en diagonal. Mira el frente y el lado derecho.', 'Two on top, in a diagonal. Look at the front and the right side.', 'Duas em cima, na diagonal. Olhe a frente e o lado direito.'), cases: cmllL },
      ],
      progression: doc([
        '1. **CMLL en 2 pasos:** si sabes el OCLL, solo te faltan O Adyacente y O Diagonal.',
        '2. **Sune y Antisune:** 12 casos, casi 1 de cada 3 resoluciones.',
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
      ], [
        '1. **CMLL em 2 passos:** se você sabe o OCLL, só faltam O Adjacente e O Diagonal.',
        '2. **Sune e Antisune:** 12 casos, quase 1 em cada 3 resoluções.',
        '3. **O, H e Pi.**',
        '4. **U e T.**',
        '5. **L:** por último.',
        'A cada grupo novo, mantenha o plano B em 2 passos para os casos que você ainda não sabe.',
      ]),
      quizzes: [],
    },
    {
      id: 'roux-lse',
      name: tr('Últimas seis aristas', 'Last six edges', 'Últimas seis arestas'),
      goal: doc([
        '**Meta:** las 6 aristas que faltan y los centros de la capa `M`: cubo resuelto.',
        '**Giros:** solo `M` y `U`, en 3 pasos: orientar (EO), UL y UR, y la capa `M` (4c).',
      ], [
        "**Goal:** the 6 remaining edges and the `M` layer's centers: cube solved.",
        '**Turns:** only `M` and `U`, in 3 steps: orient (EO), UL and UR, and the `M` layer (4c).',
      ], [
        '**Meta:** as 6 arestas que faltam e os centros da camada `M`: cubo resolvido.',
        '**Movimentos:** só `M` e `U`, em 3 passos: orientar (EO), UL e UR, e a camada `M` (4c).',
      ]),
      description: doc([
        '## Cómo se hace',
        '1. **EO:** alinea los centros con los bloques y cuenta las aristas **malas**, las que no tienen su amarillo o blanco arriba o abajo. Haz el caso que coincida.',
        '2. **UL y UR:** lleva la roja-amarilla y la naranja-amarilla a su sitio. Las esquinas rojas dicen dónde va la roja.',
        '3. **4c:** las 4 aristas de la capa `M` y sus centros.',
        "Antes de mirar cada paso, alinea los centros con `M` o `M'`.",
      ], [
        '## How to do it',
        '1. **EO:** line the centers up with the blocks and count the **bad** edges, the ones without their yellow or white facing up or down. Do the matching case.',
        '2. **UL and UR:** bring the red-yellow and orange-yellow edges into place. The red corners say where the red one goes.',
        '3. **4c:** the 4 edges of the `M` layer and its centers.',
        "Before looking at each step, line the centers up with `M` or `M'`.",
      ], [
        '## Como fazer',
        '1. **EO:** alinhe os centros com os blocos e conte as arestas **ruins**, as que não têm o amarelo ou o branco para cima ou para baixo. Faça o caso que coincidir.',
        '2. **UL e UR:** leve a vermelha-amarela e a laranja-amarela ao lugar. As quinas vermelhas dizem onde vai a vermelha.',
        '3. **4c:** as 4 arestas da camada `M` e seus centros.',
        "Antes de olhar cada passo, alinhe os centros com `M` ou `M'`.",
      ]),
      tips: doc([
        '- **Te sale un número impar de malas:** cuenta de nuevo con los centros alineados (amarillo arriba): siempre son pares.',
        '- **No ves la de abajo atrás (DB):** inclina el cubo para mirarla; la figura tampoco la muestra, el texto dice cómo está.',
        '- **El caso no coincide con ninguno:** gira `U` hasta verlo como en la figura; en EO, fíjate también en las 2 de abajo.',
      ], [
        '- **You count an odd number of bad edges:** count again with the centers lined up (yellow on top): there is always an even number.',
        "- **You can't see the bottom-back one (DB):** tilt the cube to look at it; the figure doesn't show it either, the text says how it is.",
        '- **The case matches none:** turn `U` until it looks like the figure; in EO, check the 2 on the bottom too.',
      ], [
        '- **Você conta um número ímpar de ruins:** conte de novo com os centros alinhados (amarelo em cima): sempre são pares.',
        '- **Você não vê a de baixo atrás (DB):** incline o cubo para olhá-la; a figura também não a mostra, o texto diz como ela está.',
        '- **O caso não coincide com nenhum:** gire `U` até vê-lo como na figura; na EO, olhe também as 2 de baixo.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-lse-eo', name: tr('EO: orientar', 'EO: orient', 'EO: orientar'), description: tr('Cuenta las malas, arriba y abajo. Gira `U` hasta verlas como en la figura.', 'Count the bad ones, on top and on the bottom. Turn `U` until they look like the figure.', 'Conte as ruins, em cima e embaixo. Gire `U` até vê-las como na figura.'), cases: eo },
        { id: 'roux-lse-ulur', name: tr('UL y UR', 'UL and UR', 'UL e UR'), description: tr('Busca la arista roja-amarilla y la naranja-amarilla. Las esquinas rojas dicen dónde va la roja.', 'Find the red-yellow and orange-yellow edges. The red corners say where the red one goes.', 'Procure a aresta vermelha-amarela e a laranja-amarela. As quinas vermelhas dizem onde vai a vermelha.'), cases: ulur },
        { id: 'roux-lse-4c', name: tr('4c: la capa M', '4c: the M layer', '4c: a camada M'), description: tr('UL y UR ya están. Solo quedan las 4 aristas de la capa `M`.', 'UL and UR are done. Only the 4 edges of the `M` layer are left.', 'UL e UR já estão feitas. Só faltam as 4 arestas da camada `M`.'), cases: fourC },
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
      ], [
        '1. **EO:** comece pela seta, o caso mais curto.',
        '2. **UL e UR com as duas embaixo:** `M2 U M2` é a base dos outros.',
        '3. **4c:** os ciclos de 3 primeiro.',
        'Com prática, a EO já é feita pensando em UL e UR.',
      ]),
      quizzes: [],
    },
  ],
};

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
  fb('delante-arriba', ['Frente', 'Front', 'Frente'], ['Par arriba, adelante', 'Pair on top, at the front', 'Par em cima, na frente'],
    ['Cuadrado de atrás hecho. El par de adelante está formado arriba adelante, a la izquierda: verde al frente, rojo arriba y el blanco de la esquina mirando a la izquierda',
      "Back square done. The front pair is formed at the top front, on the left: green facing front, red facing up and the corner's white facing left", 'Quadrado de trás feito. O par da frente está formado em cima na frente, à esquerda: verde para a frente, vermelho para cima e o branco da quina virado para a esquerda'], "F'",
    ["Entra con un solo giro: `F'` lo baja a su ranura. En el caso «Par arriba, atrás», `B` hace lo mismo.", "It goes in with a single move: `F'` brings it down into its slot. In the \"Pair on top, at the back\" case, `B` does the same.", "Entra com um só movimento: `F'` o desce para o slot dele. No caso \"Par em cima, atrás\", `B` faz o mesmo."]),
  fb('delante-derecha', ['Frente derecha', 'Front right', 'Frente direita'], ['Par arriba, adelante a la derecha', 'Pair on top, front right', 'Par em cima, na frente à direita'],
    ['Cuadrado de atrás hecho. El par de adelante está formado arriba adelante, a la derecha: verde arriba, rojo al frente y el blanco de la esquina mirando a la derecha',
      "Back square done. The front pair is formed at the top front, on the right: green facing up, red facing front and the corner's white facing right", 'Quadrado de trás feito. O par da frente está formado em cima na frente, à direita: verde para cima, vermelho para a frente e o branco da quina virado para a direita'], "L' U L",
    ["`L'` sube la ranura, `U` pone el par encima y `L` baja todo junto, como un par del F2L.", "`L'` lifts the slot, `U` puts the pair above it and `L` brings it all down, like an F2L pair.", "`L'` sobe o slot, `U` põe o par em cima dele e `L` desce tudo junto, como um par do F2L."]),
  fb('delante-abajo', ['Abajo', 'Bottom', 'Embaixo'], ['Par abajo, adelante', 'Pair on the bottom, at the front', 'Par embaixo, na frente'],
    ['Cuadrado de atrás hecho. El par de adelante está formado abajo adelante, a la derecha de su ranura: verde al frente, rojo abajo y el blanco de la esquina mirando a la derecha',
      "Back square done. The front pair is formed at the bottom front, to the right of its slot: green facing front, red facing down and the corner's white facing right", 'Quadrado de trás feito. O par da frente está formado embaixo na frente, à direita do slot dele: verde para a frente, vermelho para baixo e o branco da quina virado para a direita'], 'F',
    ['También puedes armar un par abajo, en la capa `M`, o a la derecha: esas partes del cubo aún están libres.', 'You can also build a pair on the bottom, in the `M` layer, or on the right: those parts of the cube are still free.', 'Você também pode montar um par embaixo, na camada `M`, ou à direita: essas partes do cubo ainda estão livres.']),
];
const fbBack = [
  fb('atras-arriba', ['Atrás', 'Back', 'Atrás'], ['Par arriba, atrás', 'Pair on top, at the back', 'Par em cima, atrás'],
    ['Par de adelante hecho. El de atrás está formado arriba atrás, a la izquierda: rojo arriba, azul atrás y el blanco de la esquina mirando a la izquierda',
      "Front pair done. The back one is formed at the top back, on the left: red facing up, blue facing back and the corner's white facing left", 'Par da frente feito. O de trás está formado em cima atrás, à esquerda: vermelho para cima, azul para trás e o branco da quina virado para a esquerda'], 'B'),
  fb('atras-derecha', ['Atrás derecha', 'Back right', 'Atrás direita'], ['Par arriba, atrás a la derecha', 'Pair on top, back right', 'Par em cima, atrás à direita'],
    ['Par de adelante hecho. El de atrás está formado arriba atrás, a la derecha: azul arriba, rojo atrás y el blanco de la esquina mirando a la derecha',
      "Front pair done. The back one is formed at the top back, on the right: blue facing up, red facing back and the corner's white facing right", 'Par da frente feito. O de trás está formado em cima atrás, à direita: azul para cima, vermelho para trás e o branco da quina virado para a direita'], "L U' L'",
    ["Es el espejo de `L' U L` para la ranura de atrás.", "It's the mirror of `L' U L` for the back slot.", "É o espelho de `L' U L` para o slot de trás."]),
];

// --- 2. Second block: the same on the right with R, r, M and U only. Seen from the front-right (green left, orange right) ---
const sb = (slug: string, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `sb-${slug}`, stage: 'roux-sb', code, name, recognition, alg, note });

const sbFront = [
  sb('delante-izquierda', ['Frente izquierda', 'Front left', 'Frente esquerda'], ['Par arriba, adelante a la izquierda', 'Pair on top, front left', 'Par em cima, na frente à esquerda'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba adelante, a la izquierda: verde arriba, naranja al frente y el blanco de la esquina mirando a la izquierda',
      "First block and back square done. The front pair is formed at the top front, on the left: green facing up, orange facing front and the corner's white facing left", 'Primeiro bloco e quadrado de trás feitos. O par da frente está formado em cima na frente, à esquerda: verde para cima, laranja para a frente e o branco da quina virado para a esquerda'], "R U' R'"),
  sb('delante-derecha', ['Derecha', 'Right', 'Direita'], ['Par arriba, a la derecha', 'Pair on top, on the right', 'Par em cima, à direita'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba a la derecha: verde arriba, naranja a la derecha y el blanco de la esquina mirando al frente',
      "First block and back square done. The front pair is formed at the top right: green facing up, orange facing right and the corner's white facing front", 'Primeiro bloco e quadrado de trás feitos. O par da frente está formado em cima à direita: verde para cima, laranja para a direita e o branco da quina virado para a frente'], "U R U' R'",
    ["`U` lo lleva arriba adelante, a la izquierda: queda el caso «Par arriba, adelante a la izquierda», que se resuelve con `R U' R'`.", "`U` brings it to the top front, on the left: that leaves the \"Pair on top, front left\" case, solved with `R U' R'`.", "`U` o deixa em cima na frente, à esquerda, e ele vira o caso \"Par em cima, na frente à esquerda\", que se resolve com `R U' R'`."]),
  sb('delante-r', ['Frente derecha', 'Front right', 'Frente direita'], ['Par arriba, adelante, con el naranja arriba', 'Pair on top, at the front, orange facing up', 'Par em cima, na frente, com o laranja para cima'],
    ['Primer bloque y cuadrado de atrás hechos. El par de adelante está formado arriba adelante, a la derecha: naranja arriba, verde al frente y el blanco de la esquina mirando a la derecha',
      "First block and back square done. The front pair is formed at the top front, on the right: orange facing up, green facing front and the corner's white facing right", 'Primeiro bloco e quadrado de trás feitos. O par da frente está formado em cima na frente, à direita: laranja para cima, verde para a frente e o branco da quina virado para a direita'], "r U r'",
    ['`r` sube la ranura y, con ella, la capa `M`. No pasa nada: esa capa se resuelve al final.', "`r` lifts the slot and, with it, the `M` layer. That's fine: that layer is solved at the end.", '`r` sobe o slot e, com ele, a camada `M`. Não tem problema: essa camada se resolve no final.']),
];
const sbBack = [
  sb('atras-izquierda', ['Atrás izquierda', 'Back left', 'Atrás esquerda'], ['Par arriba, atrás a la izquierda', 'Pair on top, back left', 'Par em cima, atrás à esquerda'],
    ['Primer bloque y par de adelante hechos. El de atrás está formado arriba atrás, a la izquierda: azul arriba, naranja atrás y el blanco de la esquina mirando a la izquierda',
      "First block and front pair done. The back one is formed at the top back, on the left: blue facing up, orange facing back and the corner's white facing left", 'Primeiro bloco e par da frente feitos. O de trás está formado em cima atrás, à esquerda: azul para cima, laranja para trás e o branco da quina virado para a esquerda'], "R' U R"),
  sb('atras-r', ['Atrás derecha', 'Back right', 'Atrás direita'], ['Par arriba, atrás, con el naranja arriba', 'Pair on top, at the back, orange facing up', 'Par em cima, atrás, com o laranja para cima'],
    ['Primer bloque y par de adelante hechos. El de atrás está formado arriba atrás, a la derecha: naranja arriba, azul atrás y el blanco de la esquina mirando a la derecha',
      "First block and front pair done. The back one is formed at the top back, on the right: orange facing up, blue facing back and the corner's white facing right", 'Primeiro bloco e par da frente feitos. O de trás está formado em cima atrás, à direita: laranja para cima, azul para trás e o branco da quina virado para a direita'], "r' U' r",
    ["Es el espejo de `r U r'` para la ranura de atrás: `r'` sube la ranura por detrás.", "It's the mirror of `r U r'` for the back slot: `r'` lifts the slot from the back.", "É o espelho de `r U r'` para o slot de trás: `r'` sobe o slot por trás."]),
];

// --- 3. CMLL: the 42 cases, by the shape of the yellow stickers (as in OCLL). Side stickers: front left to right,
// right and left sides front to back, back left to right as the figure shows them. A case's side colors turn with the
// corners (any of 4 color sets), so each look names how stickers relate (headlights, opposite, adjacent, where a color
// repeats), which tells the group's cases apart whatever the colors; the colors in brackets are the figure's ---
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const cmll = (shape: T) => (slug: string, code: string, name: T, scdb: string, look: T, alg: string, alts: Alt[]) =>
  kase({ slug: `cmll-${slug}`, stage: 'cmll', code: [code, code, code], name, recognition: [`${shape[0]}. ${cap(look[0])}`, `${shape[1]}. ${cap(look[1])}`, `${shape[2]}. ${cap(look[2])}`], alg, alts, scdb });

const cO = cmll(['Las 4 esquinas tienen el amarillo arriba', 'All 4 corners have yellow on top', 'As 4 quinas têm o amarelo em cima']);
const cH = cmll(['Ninguna esquina tiene el amarillo arriba: dos lo muestran al frente y dos atrás', 'No corner has yellow on top: two show it facing front and two facing back', 'Nenhuma quina tem o amarelo em cima: duas o mostram para a frente e duas para trás']);
const cPi = cmll(['Ninguna esquina tiene el amarillo arriba: dos lo muestran a la izquierda, una al frente y otra atrás', 'No corner has yellow on top: two show it facing left, one facing front and one facing back', 'Nenhuma quina tem o amarelo em cima: duas o mostram para a esquerda, uma para a frente e outra para trás']);
const cU = cmll(['Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran atrás', 'The two front corners have yellow on top; the back ones show it facing back', 'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para trás']);
const cT = cmll(['Las dos esquinas de adelante tienen el amarillo arriba; las de atrás lo muestran a los lados', 'The two front corners have yellow on top; the back ones show it facing the sides', 'As duas quinas da frente têm o amarelo em cima; as de trás o mostram para os lados']);
const cS = cmll(['Una esquina tiene el amarillo arriba, adelante a la derecha; la de adelante a la izquierda lo muestra a la izquierda', 'One corner has yellow on top, at the front right; the front-left one shows it facing left', 'Uma quina tem o amarelo em cima, na frente à direita; a da frente à esquerda o mostra para a esquerda']);
const cAS = cmll(['Una esquina tiene el amarillo arriba, adelante a la izquierda; la de adelante a la derecha lo muestra a la derecha', 'One corner has yellow on top, at the front left; the front-right one shows it facing right', 'Uma quina tem o amarelo em cima, na frente à esquerda; a da frente à direita o mostra para a direita']);
const cL = cmll(['Dos esquinas en diagonal tienen el amarillo arriba, adelante a la derecha y atrás a la izquierda; la de adelante a la izquierda lo muestra a la izquierda', 'Two diagonal corners have yellow on top, front right and back left; the front-left one shows it facing left', 'Duas quinas na diagonal têm o amarelo em cima, na frente à direita e atrás à esquerda; a da frente à esquerda o mostra para a esquerda']);

const cmllO = [
  cO('o-adjacent', 'O Adj', ['O Adyacente', 'O Adjacent', 'O Adjacente'], 'O_Adjacent',
    ['faros en un solo lado (azules, a la izquierda); en los otros 3 lados, ninguno',
      'headlights on one side only (blue, on the left); none on the other 3 sides', 'faróis em um só lado (azuis, à esquerda); nos outros 3 lados, nenhum'],
    "R U R' F' R U R' U' R' F R2 U' R'", [[2, "R U R' U' R' F R2 U' R' U' R U R' F'"], [3, "r U R' F' R U R' U' R' F R2 U' r'"], [4, "R U2 R' U' R U2 r' F R' F' r"]]),
  cO('o-diagonal', 'O Diag', ['O Diagonal', 'O Diagonal', 'O Diagonal'], 'O_Diagonal',
    ['ningún faro: colores opuestos en los 4 lados',
      'no headlights: opposite colors on all 4 sides', 'nenhum farol: cores opostas nos 4 lados'],
    "F R U' R' U' R U R' F' R U R' U' R' F R F'", [[2, "R U' R2 F R F' R U' B U2 B' R'"], [3, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [4, "r2 D' r U' r' D r2 F' r' U r F"]]),
];
const cmllH = [
  cH('h-columns', 'H Columns', ['H Columnas', 'H Columns', 'H Colunas'], 'H_Columns',
    ['colores opuestos en los dos lados (rojo y naranja)',
      'opposite colors on both sides (red and orange)', 'cores opostas nos dois lados (vermelho e laranja)'],
    "U R U R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U' R'"], [3, "r U' r' U' r U r' U r U r'"], [4, "r U' r' U' r U' r' U r U r'"]]),
  cH('h-rows', 'H Rows', ['H Filas', 'H Rows', 'H Linhas'], 'H_Rows',
    ['faros en los dos lados (rojos a la derecha y naranjas a la izquierda)',
      'headlights on both sides (red on the right and orange on the left)', 'faróis nos dois lados (vermelhos à direita e laranja à esquerda)'],
    "F R U R' U' R U R' U' R U R' U' F'", [[2, "F U R U' R' U R U' R' U R U' R' F'"], [3, "F U' R2 D R' U2 R D' R2 U F'"], [4, "F R U r' U' R U R' U' R U R' M' U' F'"]]),
  cH('h-column', 'H Column', ['H Columna', 'H Column', 'H Coluna'], 'H_Column',
    ['faros en un lado (naranjas, a la izquierda) y colores opuestos en el otro (azul y verde)',
      'headlights on one side (orange, on the left) and opposite colors on the other (blue and green)', 'faróis em um lado (laranja, à esquerda) e cores opostas no outro (azul e verde)'],
    "R' F2 D R2 U R2 D' F2 R", [[2, "U R U2 R2 F R F' U2 R' F R F'"], [3, "U' F R U R' U' R U' R' U R U R' F'"], [4, "U F R U R' U' F' R U R' U' R' F R F'"]]),
  cH('h-row', 'H Row', ['H Fila', 'H Row', 'H Linha'], 'H_Row',
    ['colores vecinos en los dos lados (rojo y azul, naranja y azul). El azul se repite atrás, en los dos lados',
      'adjacent colors on both sides (red and blue, orange and blue). Blue appears twice, at the back of both sides', 'cores vizinhas nos dois lados (vermelho e azul, laranja e azul). O azul se repete atrás, nos dois lados'],
    "U2 r U' r2 D' r U' r' D r2 U r'", [[2, "U' R U R' U R U r' F R' F' r"], [3, "U' R U R' U R U L' U R' U' L"], [4, "U2 R U' R2 D' r U' r' D R2 U R'"]]),
];
const cmllPi = [
  cPi('pi-right-bar', 'Pi Right Bar', ['Pi Barra derecha', 'Pi Right Bar', 'Pi Barra direita'], 'Pi_Right_Bar',
    ['en el lado derecho, colores opuestos (verde y azul). Al frente y atrás, la pegatina de la izquierda es del mismo color (rojo)',
      'on the right side, opposite colors (green and blue). On the front and the back, the left sticker is the same color (red)', 'no lado direito, cores opostas (verde e azul). Na frente e atrás, o adesivo da esquerda é da mesma cor (vermelho)'],
    "F R U R' U' R U R' U' F'", [[2, "r' U r2 U' r2 U' r2 U r'"], [3, "U2 F U R U' R' U R U' R' F'"], [4, "R U2 R2 U' R2 U' R2 U2 R"]]),
  cPi('pi-down-slash', 'Pi Down Slash', ['Pi Diagonal abajo', 'Pi Down Slash', 'Pi Diagonal para baixo'], 'Pi_Down_Slash',
    ['en el lado derecho, colores vecinos (azul y naranja). El naranja se repite: en el lado derecho, atrás, y al frente, a la izquierda',
      'on the right side, adjacent colors (blue and orange). Orange appears twice: on the right side at the back, and on the front at the left', 'no lado direito, cores vizinhas (azul e laranja). O laranja se repete: no lado direito, atrás, e na frente, à esquerda'],
    "U F R' F' R U2 R U' R' U R U2 R'", [[2, "U F U R U' R2 F' R U2 R U2 R'"], [3, "U M F R' F' r U2 R U' R' U R U2 R'"], [4, "R' U2 R U R' U' R U2 R f' U' f"]]),
  cPi('pi-x', 'Pi X', ['Pi X', 'Pi X', 'Pi X'], 'Pi_X',
    ['faros en el lado derecho (rojos). Al frente y atrás, la pegatina de la izquierda es del mismo color (naranja)',
      'headlights on the right side (red). On the front and the back, the left sticker is the same color (orange)', 'faróis no lado direito (vermelhos). Na frente e atrás, o adesivo da esquerda é da mesma cor (laranja)'],
    "R' F2 D R2 U' R2 D' F2 R", [[2, "U' R' F R U F U' R U R' U' F'"], [3, "r' F2 D R2 U' R2 D' F2 r"], [4, "U' F R U' R' U' R U R' U R U' R' F'"]]),
  cPi('pi-up-slash', 'Pi Up Slash', ['Pi Diagonal arriba', 'Pi Up Slash', 'Pi Diagonal para cima'], 'Pi_Up_Slash',
    ['en el lado derecho, colores vecinos (verde y rojo). El verde se repite: en el lado derecho, adelante, y atrás, a la izquierda',
      'on the right side, adjacent colors (green and red). Green appears twice: on the right side at the front, and on the back at the left', 'no lado direito, cores vizinhas (verde e vermelho). O verde se repete: no lado direito, na frente, e atrás, à esquerda'],
    "R U2 R' U' R U R' U2 R' F R F'", [[2, "R U2 R' U2 R' F R2 U R' U' F'"], [3, "R U2 R' U' R U R' U2 r' F R F' M'"], [4, "R U R' U' R' F R2 U R' U' R U R' U' F'"]]),
  cPi('pi-columns', 'Pi Columns', ['Pi Columnas', 'Pi Columns', 'Pi Colunas'], 'Pi_Columns',
    ['en el lado derecho, colores opuestos (rojo y naranja). Al frente y atrás, las pegatinas de la izquierda también son opuestas (naranja y rojo)',
      'on the right side, opposite colors (red and orange). On the front and the back, the left stickers are opposite colors too (orange and red)', 'no lado direito, cores opostas (vermelho e laranja). Na frente e atrás, os adesivos da esquerda também são opostos (laranja e vermelho)'],
    "U' r U' r2 D' r U r' D r2 U r'", [[2, "U2 R' F R F' r U' r' U' R U' R'"], [3, "U2 R' F R F' r U' R' U' R U' r'"], [4, "U2 L' U R U' L U' R' U' R U' R'"]]),
  cPi('pi-left-bar', 'Pi Left Bar', ['Pi Barra izquierda', 'Pi Left Bar', 'Pi Barra esquerda'], 'Pi_Left_Bar',
    ['faros en el lado derecho (verdes). Al frente y atrás, las pegatinas de la izquierda son opuestas (naranja y rojo)',
      'headlights on the right side (green). On the front and the back, the left stickers are opposite colors (orange and red)', 'faróis no lado direito (verdes). Na frente e atrás, os adesivos da esquerda são opostos (laranja e vermelho)'],
    "U' R' U' R' F R F' R U' R' U2 R", [[2, "R' F' U' F U' R U R' U R"], [3, "U2 R U R' U R U' B U' B' R'"], [4, "U' r U R' U R' F R F' R U' R' U R U2 r'"]]),
];
const cmllU = [
  cU('u-up-slash', 'U Up Slash', ['U Diagonal arriba', 'U Up Slash', 'U Diagonal para cima'], 'U_Up_Slash',
    ['colores vecinos al frente (naranja y azul) y en los dos lados. El azul se repite: al frente, a la derecha, y en el lado derecho, atrás',
      'adjacent colors on the front (orange and blue) and on both sides. Blue appears twice: on the front at the right, and on the right side at the back', 'cores vizinhas na frente (laranja e azul) e nos dois lados. O azul se repete: na frente, à direita, e no lado direito, atrás'],
    "U2 R2 D R' U2 R D' R' U2 R'", [[2, "U2 R r D r' U2 r D' r' U2 R'"], [3, "F R' F' U2 R U R U' R' U R' U R"], [4, "L2 D L' U2 L D' L' U2 L'"]]),
  cU('u-down-slash', 'U Down Slash', ['U Diagonal abajo', 'U Down Slash', 'U Diagonal para baixo'], 'U_Down_Slash',
    ['colores vecinos al frente (verde y naranja) y en los dos lados. El verde se repite: al frente, a la izquierda, y en el lado izquierdo, atrás',
      'adjacent colors on the front (green and orange) and on both sides. Green appears twice: on the front at the left, and on the left side at the back', 'cores vizinhas na frente (verde e laranja) e nos dois lados. O verde se repete: na frente, à esquerda, e no lado esquerdo, atrás'],
    "R2 D' R U2 R' D R U2 R", [[2, "R' F R U R' F R U F U2 F'"], [3, "U2 L2 D' L U2 L' D L U2 L"], [4, "l' U l U l' U l U F U2 F'"]]),
  cU('u-bottom-row', 'U Bottom Row', ['U Fila de abajo', 'U Bottom Row', 'U Linha de baixo'], 'U_Bottom_Row',
    ['faros al frente (verdes) y colores vecinos en los dos lados',
      'headlights on the front (green) and adjacent colors on both sides', 'faróis na frente (verdes) e cores vizinhas nos dois lados'],
    "R' U' R U' R' U2 R2 U R' U R U2 R'", [[2, "U' R2 F2 r U r' F R2 U2 r' U' r"], [3, "R2 F U' F U F2 R2 U' R' F R"], [4, "U2 R U R' U R U2 R2 U' R U' R' U2 R"]]),
  cU('u-rows', 'U Rows', ['U Filas', 'U Rows', 'U Linhas'], 'U_Rows',
    ['faros al frente (verdes) y colores opuestos en los dos lados (naranja y rojo)',
      'headlights on the front (green) and opposite colors on both sides (orange and red)', 'faróis na frente (verdes) e cores opostas nos dois lados (laranja e vermelho)'],
    "U' F R2 D R' U R D' R2 U' F'", [[2, "F U R2 D R' U' R D' R2 F'"], [3, "U' R' U' R F R2 D' R U R' D R2 U' F'"], [4, "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R"]]),
  cU('u-x', 'U X', ['U X', 'U X', 'U X'], 'U_X',
    ['colores opuestos al frente (naranja y rojo) y en los dos lados (verde y azul)',
      'opposite colors on the front (orange and red) and on both sides (green and blue)', 'cores opostas na frente (laranja e vermelho) e nos dois lados (verde e azul)'],
    "U2 r U' r' U r' D' r U' r' D r", [[2, "F R U' R' U R U R' U R U' R' F'"], [3, "r' U r' D' r U r' D r U' r"], [4, "U' R' D R U' R U' R' U R' D' R"]]),
  cU('u-upper-row', 'U Upper Row', ['U Fila de arriba', 'U Upper Row', 'U Linha de cima'], 'U_Upper_Row',
    ['colores opuestos al frente (verde y azul) y vecinos en los dos lados',
      'opposite colors on the front (green and blue) and adjacent ones on both sides', 'cores opostas na frente (verde e azul) e vizinhas nos dois lados'],
    "U' F R U R' U' F'", [[2, "U F U R U' R' F'"], [3, "U' F U' R' U R U F' R' U2 R"], [4, "R' F' U' F U R"]]),
];
const cmllT = [
  cT('t-left-bar', 'T Left Bar', ['T Barra izquierda', 'T Left Bar', 'T Barra esquerda'], 'T_Left_Bar',
    ['colores vecinos al frente (naranja y azul) y atrás (azul y rojo). El azul se repite: al frente, a la derecha, y atrás, a la izquierda',
      'adjacent colors on the front (orange and blue) and the back (blue and red). Blue appears twice: on the front at the right, and on the back at the left', 'cores vizinhas na frente (laranja e azul) e atrás (azul e vermelho). O azul se repete: na frente, à direita, e atrás, à esquerda'],
    "U' R U R' U' R' F R F'", [[2, "U' r U R' U' r' F R F'"], [4, "U L U L' U' L' f U f'"]]),
  cT('t-right-bar', 'T Right Bar', ['T Barra derecha', 'T Right Bar', 'T Barra direita'], 'T_Right_Bar',
    ['colores vecinos al frente (azul y rojo) y atrás (naranja y azul). El azul se repite: al frente, a la izquierda, y atrás, a la derecha',
      'adjacent colors on the front (blue and red) and the back (orange and blue). Blue appears twice: on the front at the left, and on the back at the right', 'cores vizinhas na frente (azul e vermelho) e atrás (laranja e azul). O azul se repete: na frente, à esquerda, e atrás, à direita'],
    "U L' U' L U L F' L' F", [[2, "U r' F' r U r U' r' F"], [3, "U' F R U' R' U R U R' F'"], [4, "U2 R' U' R' D' R U R' D R2"]]),
  cT('t-rows', 'T Rows', ['T Filas', 'T Rows', 'T Linhas'], 'T_Rows',
    ['faros al frente (verdes) y colores opuestos atrás (rojo y naranja)',
      'headlights on the front (green) and opposite colors on the back (red and orange)', 'faróis na frente (verdes) e cores opostas atrás (vermelho e laranja)'],
    "R U2 R' U' R U' R2 U2 R U R' U R", [[2, "F R' F R2 U' R' U' R U R' F2"], [3, "r' U r U2 R2 F' r U' r' F2 R2"], [4, "U' R U R' U R U2 R2 F' r U' r' F2 R"]]),
  cT('t-bottom-row', 'T Bottom Row', ['T Fila de abajo', 'T Bottom Row', 'T Linha de baixo'], 'T_Bottom_Row',
    ['faros al frente (azules) y atrás (verdes)',
      'headlights on the front (blue) and the back (green)', 'faróis na frente (azuis) e atrás (verdes)'],
    "r' U r U2 R2 F R F' R", [[2, "R U R2 F R F' U r U r'"], [3, "U2 r U' r' U' F R' F' R2 U' R'"]]),
  cT('t-top-row', 'T Top Row', ['T Fila de arriba', 'T Top Row', 'T Linha de cima'], 'T_Top_Row',
    ['colores opuestos al frente (rojo y naranja) y atrás (naranja y rojo)',
      'opposite colors on the front (red and orange) and the back (orange and red)', 'cores opostas na frente (vermelho e laranja) e atrás (laranja e vermelho)'],
    "r' D' r U r' D r U' r U r'", [[2, "U R' D R U' R U R' U R' D' R"], [3, "U2 F R U R' U' R U' R' U' R U R' F'"], [4, "R F R' U' R F' R' U R' F' R"]]),
  cT('t-columns', 'T Columns', ['T Columnas', 'T Columns', 'T Colunas'], 'T_Columns',
    ['colores opuestos al frente (rojo y naranja) y faros atrás (verdes)',
      'opposite colors on the front (red and orange) and headlights on the back (green)', 'cores opostas na frente (vermelho e laranja) e faróis atrás (verdes)'],
    "U2 r U' r2 D' r U2 r' D r2 U r'", [[2, "U2 r2 D' r U r' D r2 U' r' U' r"], [3, "R' U R2 D r' U2 r D' R2 U' R"], [4, "U2 R' F R2 F R' U2 R F' R2 F' R"]]),
];
const cmllS = [
  cS('s-left-bar', 'Sune Left Bar', ['Sune Barra izquierda', 'Sune Left Bar', 'Sune Barra esquerda'], 'Sune_Left_Bar',
    ['al frente, colores vecinos (verde y naranja). El azul se repite: en el lado derecho, adelante, y atrás, a la derecha',
      'on the front, adjacent colors (green and orange). Blue appears twice: on the right side at the front, and on the back at the right', 'na frente, cores vizinhas (verde e laranja). O azul se repete: no lado direito, na frente, e atrás, à direita'],
    "U R U R' U R U2 R'", [[2, "R' U2 R U R' U R"], [3, "U r U R' U R U2 r'"], [4, "U' L U L' U L U2 L'"]]),
  cS('s-x', 'Sune X', ['Sune X', 'Sune X', 'Sune X'], 'Sune_X',
    ['al frente, colores opuestos (azul y verde). El naranja se repite: en el lado derecho, adelante, y atrás, a la derecha',
      'on the front, opposite colors (blue and green). Orange appears twice: on the right side at the front, and on the back at the right', 'na frente, cores opostas (azul e verde). O laranja se repete: no lado direito, na frente, e atrás, à direita'],
    "U L' U2 L U2 r U' r' F", [[2, "U r' F2 r U2 r U' r' F"], [3, "U L' U2 L U2 L F' L' F"], [4, "U R' F2 R U2 R U' r' F M'"]]),
  cS('s-up-slash', 'Sune Up Slash', ['Sune Diagonal arriba', 'Sune Up Slash', 'Sune Diagonal para cima'], 'Sune_Up_Slash',
    ['al frente, colores vecinos (rojo y verde). El naranja se repite: en el lado derecho, adelante, y en el lado izquierdo, atrás',
      'on the front, adjacent colors (red and green). Orange appears twice: on the right side at the front, and on the left side at the back', 'na frente, cores vizinhas (vermelho e verde). O laranja se repete: no lado direito, na frente, e no lado esquerdo, atrás'],
    "U F R' F' R U2 R U2 R'", [[3, "U M F R' F' r U2 R U2 R'"], [4, "U F U R U' R2 F' R U R U' R'"]]),
  cS('s-columns', 'Sune Columns', ['Sune Columnas', 'Sune Columns', 'Sune Colunas'], 'Sune_Columns',
    ['al frente, colores opuestos (naranja y rojo). El verde se repite: en el lado derecho, adelante, y en el lado izquierdo, atrás',
      'on the front, opposite colors (orange and red). Green appears twice: on the right side at the front, and on the left side at the back', 'na frente, cores opostas (laranja e vermelho). O verde se repete: no lado direito, na frente, e no lado esquerdo, atrás'],
    "U R U R' U' R' F R F' R U R' U R U2 R'", [[2, "R U R' U R U' R D R' U' R D' R2"], [3, "U2 r' F' r2 U R' F' r' F R2 U' R'"], [4, "F R' U2 R F' R' F U2 F' R"]]),
  cS('s-right-bar', 'Sune Right Bar', ['Sune Barra derecha', 'Sune Right Bar', 'Sune Barra direita'], 'Sune_Right_Bar',
    ['al frente, colores vecinos (rojo y azul). El rojo se repite: al frente, a la izquierda, y en el lado derecho, adelante. Su opuesto, el naranja, está atrás, a la derecha',
      'on the front, adjacent colors (red and blue). Red appears twice: on the front at the left, and on the right side at the front. Its opposite, orange, is on the back at the right', 'na frente, cores vizinhas (vermelho e azul). O vermelho se repete: na frente, à esquerda, e no lado direito, na frente. A cor oposta, o laranja, está atrás, à direita'],
    "U' R U R' U R' F R F' R U2 R'", [[2, "U' R U R' U r' F R F' r U2 R'"], [3, "U' R U R' F' R U R' U R U2 R' F R U' R'"]]),
  cS('s-down-slash', 'Sune Down Slash', ['Sune Diagonal abajo', 'Sune Down Slash', 'Sune Diagonal para baixo'], 'Sune_Down_Slash',
    ['al frente, colores vecinos (naranja y verde). El naranja se repite: al frente, a la izquierda, y en el lado derecho, adelante. Su opuesto, el rojo, está en el lado izquierdo, atrás',
      'on the front, adjacent colors (orange and green). Orange appears twice: on the front at the left, and on the right side at the front. Its opposite, red, is on the left side at the back', 'na frente, cores vizinhas (laranja e verde). O laranja se repete: na frente, à esquerda, e no lado direito, na frente. A cor oposta, o vermelho, está no lado esquerdo, atrás'],
    "U r U' r' F R' F' R", [[2, "U R U' r' F R' F' r"], [3, "U R U' L' U R' U' L"], [4, "U' L U' R' U L' U' R"]]),
];
const cmllAS = [
  cAS('as-right-bar', 'AS Right Bar', ['Antisune Barra derecha', 'Antisune Right Bar', 'Antisune Barra direita'], 'Anti_Sune_Right_Bar',
    ['al frente, colores vecinos (naranja y azul). El verde se repite: en el lado izquierdo, adelante, y atrás, a la izquierda',
      'on the front, adjacent colors (orange and blue). Green appears twice: on the left side at the front, and on the back at the left', 'na frente, cores vizinhas (laranja e azul). O verde se repete: no lado esquerdo, na frente, e atrás, à esquerda'],
    "U R' U' R U' R' U2 R", [[2, "U2 R U2 R' U' R U' R'"], [3, "U' L' U' L U' L' U2 L"], [4, "U r' U' R U' R' U2 r"]]),
  cAS('as-columns', 'AS Columns', ['Antisune Columnas', 'Antisune Columns', 'Antisune Colunas'], 'Anti_Sune_Columns',
    ['al frente, colores opuestos (rojo y naranja). El azul se repite: en el lado izquierdo, adelante, y en el lado derecho, atrás',
      'on the front, opposite colors (red and orange). Blue appears twice: on the left side at the front, and on the right side at the back', 'na frente, cores opostas (vermelho e laranja). O azul se repete: no lado esquerdo, na frente, e no lado direito, atrás'],
    "U2 R U R2 F' r F R U' r2 F r", [[2, "U' R2 D R' U R D' R' U R' U' R U' R'"], [3, "U2 R' U' R U' R' U R' D' R U R' D R2"], [4, "U' R' F U2 F' R F R' U2 R F'"]]),
  cAS('as-down-slash', 'AS Down Slash', ['Antisune Diagonal abajo', 'Antisune Down Slash', 'Antisune Diagonal para baixo'], 'Anti_Sune_Down_Slash',
    ['al frente, colores vecinos (verde y naranja). El rojo se repite: en el lado izquierdo, adelante, y en el lado derecho, atrás',
      'on the front, adjacent colors (green and orange). Red appears twice: on the left side at the front, and on the right side at the back', 'na frente, cores vizinhas (verde e laranja). O vermelho se repete: no lado esquerdo, na frente, e no lado direito, atrás'],
    "U' F' L F L' U2 L' U2 L", [[2, "U' F' r U r' U2 r' F2 r"], [3, "U' F' r U r' U2 L' U2 L"], [4, "U2 F R U' R' U R U2 R' U' F'"]]),
  cAS('as-x', 'AS X', ['Antisune X', 'Antisune X', 'Antisune X'], 'Anti_Sune_X',
    ['al frente, colores opuestos (verde y azul). El rojo se repite: en el lado izquierdo, adelante, y atrás, a la izquierda',
      'on the front, opposite colors (green and blue). Red appears twice: on the left side at the front, and on the back at the left', 'na frente, cores opostas (verde e azul). O vermelho se repete: no lado esquerdo, na frente, e atrás, à esquerda'],
    "U' R U2 R' U2 R' F R F'", [[2, "U' R U2 R' U2 r' F R F' M'"], [3, "U' R U R' U' R' F R2 U R' U' F'"]]),
  cAS('as-up-slash', 'AS Up Slash', ['Antisune Diagonal arriba', 'Antisune Up Slash', 'Antisune Diagonal para cima'], 'Anti_Sune_Up_Slash',
    ['al frente, colores vecinos (verde y rojo). El rojo se repite: en el lado izquierdo, adelante, y al frente, a la derecha. Su opuesto, el naranja, está en el lado derecho, atrás',
      'on the front, adjacent colors (green and red). Red appears twice: on the left side at the front, and on the front at the right. Its opposite, orange, is on the right side at the back', 'na frente, cores vizinhas (verde e vermelho). O vermelho se repete: na frente, à direita, e no lado esquerdo, na frente. A cor oposta, o laranja, está no lado direito, atrás'],
    "U' R' F R F' r U r'", [[2, "U' r' F R F' r U R'"], [3, "U' L' U R U' L U R'"], [4, "U R' U L U' R U L'"]]),
  cAS('as-left-bar', 'AS Left Bar', ['Antisune Barra izquierda', 'Antisune Left Bar', 'Antisune Barra esquerda'], 'Anti_Sune_Left_Bar',
    ['al frente, colores vecinos (azul y naranja). El naranja se repite: en el lado izquierdo, adelante, y al frente, a la derecha. Su opuesto, el rojo, está atrás, a la izquierda',
      'on the front, adjacent colors (blue and orange). Orange appears twice: on the left side at the front, and on the front at the right. Its opposite, red, is on the back at the left', 'na frente, cores vizinhas (azul e laranja). O laranja se repete: na frente, à direita, e no lado esquerdo, na frente. A cor oposta, o vermelho, está atrás, à esquerda'],
    "U R U2 R' F R' F' R U' R U' R'", [[2, "R' U' R U' R' U R' F R F' U R"], [3, "U R U2 r' F R' F' r U' R U' R'"], [4, "U L' U' L U' L F' L' F L' U2 L"]]),
];
const cmllL = [
  cL('l-best', 'L Best', ['L Mejor', 'L Best', 'L Melhor'], 'L_Best',
    ['al frente, colores vecinos (naranja y azul); en el lado derecho, opuestos (rojo y naranja). El naranja se repite: al frente, a la izquierda, y en el lado derecho, atrás',
      'on the front, adjacent colors (orange and blue); on the right side, opposite ones (red and orange). Orange appears twice: on the front at the left, and on the right side at the back', 'na frente, cores vizinhas (laranja e azul); no lado direito, opostas (vermelho e laranja). O laranja se repete: na frente, à esquerda, e no lado direito, atrás'],
    "U' F' r U r' U' r' F r", [[2, "U2 F R U' R' U' R U R' F'"], [3, "R2 D' R U' R' D R U R"], [4, "U' F' L F L' U' L' U L"]]),
  cL('l-good', 'L Good', ['L Buena', 'L Good', 'L Boa'], 'L_Good',
    ['al frente, colores opuestos (rojo y naranja); en el lado derecho, vecinos (azul y rojo). El rojo se repite: al frente, a la izquierda, y en el lado derecho, atrás',
      'on the front, opposite colors (red and orange); on the right side, adjacent ones (blue and red). Red appears twice: on the front at the left, and on the right side at the back', 'na frente, cores opostas (vermelho e laranja); no lado direito, vizinhas (azul e vermelho). O vermelho se repete: na frente, à esquerda, e no lado direito, atrás'],
    "U2 F R' F' R U R U' R'", [[2, "U2 F R' F' r U R U' r'"], [3, "U2 R U R' U' R' F R F' R U R' U' R' F R F'"], [4, "U' r U' r' U' F' U F"]]),
  cL('l-pure', 'L Pure', ['L Pura', 'L Pure', 'L Pura'], 'L_Pure',
    ['colores vecinos al frente (naranja y azul) y en el lado derecho (rojo y verde): los 4 colores, sin que se repita ninguno',
      'adjacent colors on the front (orange and blue) and on the right side (red and green): all 4 colors, none of them twice', 'cores vizinhas na frente (laranja e azul) e no lado direito (vermelho e verde): as 4 cores, sem repetir nenhuma'],
    "R U R' U R U' R' U R U' R' U R U2 R'", [[2, "R U2 R' U' R U R' U' R U R' U' R U' R'"], [3, "U' R' U2 R U R' U' R U R' U' R U R' U R"], [4, "R U R' U r U' R' U R U' R' U R U2 r'"]]),
  cL('l-front-commutator', 'L Front Comm', ['L Conmutador delantero', 'L Front Commutator', 'L Comutador dianteiro'], 'L_Front_Commutator',
    ['al frente, colores vecinos (rojo y azul); en el lado derecho, opuestos (rojo y naranja). El rojo se repite: al frente, a la izquierda, y en el lado derecho, adelante',
      'on the front, adjacent colors (red and blue); on the right side, opposite ones (red and orange). Red appears twice: on the front at the left, and on the right side at the front', 'na frente, cores vizinhas (vermelho e azul); no lado direito, opostas (vermelho e laranja). O vermelho se repete: na frente, à esquerda, e no lado direito, na frente'],
    "U2 R U2 R D R' U2 R D' R2", [[2, "U2 R U2 r D r' U2 r D' r' R'"], [3, "R U R' U R' F R F' U2 R' F R F'"], [4, "U r' D' r U2 r' D r U2 r U r'"]]),
  cL('l-diagonal', 'L Diagonal', ['L Diagonal', 'L Diagonal', 'L Diagonal'], 'L_Diagonal',
    ['los mismos dos colores vecinos al frente y en el lado derecho (verde y rojo)',
      'the same two adjacent colors on the front and on the right side (green and red)', 'as mesmas duas cores vizinhas na frente e no lado direito (verde e vermelho)'],
    "U2 R U2 R2 F R F' R U2 R'", [[2, "U2 r U2 R2 F R F' R U2 r'"], [3, "R' U' R U R' F' R U R' U' R' F R2"], [4, "U R U2 R' F R' F' R2 U2 R'"]]),
  cL('l-back-commutator', 'L Back Comm', ['L Conmutador trasero', 'L Back Commutator', 'L Comutador traseiro'], 'L_Back_Commutator',
    ['al frente, colores opuestos (naranja y rojo); en el lado derecho, vecinos (verde y rojo). El rojo se repite: al frente, a la derecha, y en el lado derecho, atrás',
      'on the front, opposite colors (orange and red); on the right side, adjacent ones (green and red). Red appears twice: on the front at the right, and on the right side at the back', 'na frente, cores opostas (laranja e vermelho); no lado direito, vizinhas (verde e vermelho). O vermelho se repete: na frente, à direita, e no lado direito, atrás'],
    "U R' U2 R' D' R U2 R' D R2", [[2, "U2 R U R' U' R' F R2 U' R' U R U R' F'"], [3, "U2 r D r' U2 r D' r' U2 r' U' r"], [4, "U R' U2 r' D' r U2 r' D r R"]]),
];

// --- 4. LSE: the last six edges with M and U. Seen from the front-right; DB is hidden, so the texts say how it is ---
const lse = (slug: string, stage: Stage, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ slug: `lse-${slug}`, stage, code, name, recognition, alg, note });

// EO: a bad edge has its yellow or white sticker off the top and bottom faces (with the centers lined up)
const eo = [
  lse('eo-flecha', 'lse-eo', ['Flecha', 'Arrow', 'Seta'], ['Flecha', 'Arrow', 'Seta'],
    ['Tres malas arriba, a la derecha, atrás y a la izquierda: forman la flecha. Abajo, la de atrás (DB) es mala y la de adelante (DF), buena',
      'Three bad edges on top, on the right, at the back and on the left: they make the arrow. On the bottom, the back one (DB) is bad and the front one (DF) is good', 'Três arestas ruins em cima, à direita, atrás e à esquerda: formam a seta. Embaixo, a de trás (DB) é ruim e a da frente (DF), boa'], "M U M'",
    ["`M U` orienta las aristas y `M'` vuelve a alinear los centros. Si la mala de abajo está adelante, es el caso «Flecha, mala abajo adelante».",
      "`M U` orients the edges and `M'` lines the centers up again. If the bad bottom edge is at the front, it's the \"Arrow, bad edge at the bottom front\" case.", "`M U` orienta as arestas e `M'` alinha os centros de novo. Se a aresta ruim de baixo estiver na frente, é o caso \"Seta, aresta ruim embaixo na frente\"."]),
  lse('eo-flecha-df', 'lse-eo', ['Flecha DF', 'Arrow DF', 'Seta DF'], ['Flecha, mala abajo adelante', 'Arrow, bad edge at the bottom front', 'Seta, aresta ruim embaixo na frente'],
    ['Tres malas arriba, a la derecha, atrás y a la izquierda. Abajo, la de adelante (DF) es mala y la de atrás (DB), buena',
      'Three bad edges on top, on the right, at the back and on the left. On the bottom, the front one (DF) is bad and the back one (DB) is good', 'Três arestas ruins em cima, à direita, atrás e à esquerda. Embaixo, a da frente (DF) é ruim e a de trás (DB), boa'], "M2 U2 M' U M'"),
  lse('eo-cuatro-arriba', 'lse-eo', ['4 arriba', '4 on top', '4 em cima'], ['Cuatro malas arriba', 'Four bad edges on top', 'Quatro arestas ruins em cima'],
    ['Las 4 aristas de arriba son malas, y las 2 de abajo (DF y DB), buenas', 'All 4 top edges are bad, and the 2 bottom ones (DF and DB) are good', 'As 4 arestas de cima são ruins, e as 2 de baixo (DF e DB), boas'], "M' U2 M' U2 M' U' M'"),
  lse('eo-dos-dos', 'lse-eo', ['2 + 2', '2 + 2', '2 + 2'], ['Dos juntas arriba y dos abajo', 'Two side by side on top and two on the bottom', 'Duas juntas em cima e duas embaixo'],
    ['Dos malas arriba, juntas: atrás y a la izquierda. Las 2 de abajo (DF y DB) también son malas', 'Two bad edges on top, side by side: at the back and on the left. The 2 bottom ones (DF and DB) are bad too', 'Duas arestas ruins em cima, juntas: atrás e à esquerda. As 2 de baixo (DF e DB) também são ruins'], "M2 U' M' U M'"),
  lse('eo-dos-abajo', 'lse-eo', ['2 abajo', '2 on the bottom', '2 embaixo'], ['Solo las dos de abajo', 'Only the two on the bottom', 'Só as duas de baixo'],
    ['Las 4 aristas de arriba son buenas, y las 2 de abajo (DF y DB), malas', 'All 4 top edges are good, and the 2 bottom ones (DF and DB) are bad', 'As 4 arestas de cima são boas, e as 2 de baixo (DF e DB), ruins'], "M U M U' M' U M'"),
  lse('eo-uno-uno', 'lse-eo', ['1 + 1', '1 + 1', '1 + 1'], ['Una arriba y otra abajo atrás', 'One on top and one at the bottom back', 'Uma em cima e outra embaixo atrás'],
    ['Una mala arriba, a la izquierda, y otra abajo atrás (DB)', 'One bad edge on top, on the left, and another at the bottom back (DB)', 'Uma aresta ruim em cima, à esquerda, e outra embaixo atrás (DB)'], "M' U' M' U2 M U M"),
  lse('eo-uno-uno-df', 'lse-eo', ['1 + 1 DF', '1 + 1 DF', '1 + 1 DF'], ['Una arriba y otra abajo adelante', 'One on top and one at the bottom front', 'Uma em cima e outra embaixo na frente'],
    ['Una mala arriba, a la izquierda, y otra abajo adelante (DF)', 'One bad edge on top, on the left, and another at the bottom front (DF)', 'Uma aresta ruim em cima, à esquerda, e outra embaixo na frente (DF)'], "M U M' U2 M' U M"),
];

// UL/UR: the red-yellow edge between the two red corners, the orange-yellow one between the orange corners
const ulur = [
  lse('ulur-abajo', 'lse-ulur', ['Abajo', 'Bottom', 'Embaixo'], ['Las dos abajo', 'Both on the bottom', 'As duas embaixo'],
    ['Las dos aristas abajo, cada una en el lado contrario al de sus esquinas. Esquinas rojas adelante; la arista amarillo-roja, abajo atrás (DB), y la amarillo-naranja, abajo adelante (DF)',
      'Both edges on the bottom, each on the side opposite its corners. Red corners at the front; the yellow-red edge at the bottom back (DB) and the yellow-orange one at the bottom front (DF)', 'As duas arestas embaixo, cada uma no lado oposto ao das suas quinas. Quinas vermelhas na frente; a aresta amarelo-vermelha, embaixo atrás (DB), e a amarelo-laranja, embaixo na frente (DF)'], 'M2 U M2',
    ["Si la arista amarillo-roja está abajo adelante (DF), gira `U` hasta dejar las esquinas rojas atrás y haz `M2 U' M2`.", "If the yellow-red edge is at the bottom front (DF), turn `U` until the red corners are at the back and do `M2 U' M2`.", "Se a aresta amarelo-vermelha estiver embaixo na frente (DF), gire `U` até deixar as quinas vermelhas atrás e faça `M2 U' M2`."]),
  lse('ulur-una-abajo', 'lse-ulur', ['Una abajo', 'One on the bottom', 'Uma embaixo'], ['Una arriba, otra abajo', 'One on top, one on the bottom', 'Uma em cima, outra embaixo'],
    ['Esquinas rojas atrás. La arista amarillo-roja ya está arriba atrás, entre ellas, y la amarillo-naranja, abajo adelante (DF)',
      'Red corners at the back. The yellow-red edge is already at the top back, between them, and the yellow-orange one is at the bottom front (DF)', 'Quinas vermelhas atrás. A aresta amarelo-vermelha já está em cima atrás, entre elas, e a amarelo-laranja, embaixo na frente (DF)'], 'M U2 M U M2'),
  lse('ulur-opuestas', 'lse-ulur', ['Opuestas', 'Opposite', 'Opostas'], ['Las dos arriba, a un cuarto de vuelta', 'Both on top, a quarter turn off', 'As duas em cima, a um quarto de volta'],
    ['Esquinas rojas atrás. Las dos aristas arriba, a los lados: la amarillo-roja a la derecha y la amarillo-naranja a la izquierda',
      'Red corners at the back. Both edges on top, on the sides: yellow-red on the right and yellow-orange on the left', 'Quinas vermelhas atrás. As duas arestas em cima, nos lados: a amarelo-vermelha à direita e a amarelo-laranja à esquerda'], "M U M2 U M2 U M'",
    ['Cada arista está a un cuarto de vuelta de las esquinas de su color, así que ningún giro de `U` las deja en su sitio.', 'Each edge is a quarter turn away from the corners of its color, so no `U` turn puts them in place.', 'Cada aresta está a um quarto de volta das quinas da sua cor, então nenhum movimento de `U` as deixa no lugar.']),
  lse('ulur-cambiadas', 'lse-ulur', ['Cambiadas', 'Swapped', 'Trocadas'], ['Las dos arriba, cambiadas', 'Both on top, swapped', 'As duas em cima, trocadas'],
    ['Esquinas en su sitio, las rojas a la izquierda. Las dos aristas arriba, cambiadas: la amarillo-roja a la derecha y la amarillo-naranja a la izquierda',
      'Corners in place, the red ones on the left. Both edges on top, swapped: yellow-red on the right and yellow-orange on the left', 'Quinas no lugar, as vermelhas à esquerda. As duas arestas em cima, trocadas: a amarelo-vermelha à direita e a amarelo-laranja à esquerda'], "M U M2 U2 M2 U M'"),
];

// 4c: UF, UB, DF and DB (yellow-green, yellow-blue, white-green, white-blue) and the M slice's centers
const fourC = [
  lse('4c-ciclo-delante', 'lse-4c', ['Ciclo DB', 'Cycle DB', 'Ciclo DB'], ['Ciclo de 3, abajo atrás resuelta', '3-cycle, bottom back solved', 'Ciclo de 3, embaixo atrás resolvida'],
    ['Arriba adelante, la blanco-verde; arriba atrás, la amarillo-verde; abajo adelante, la amarillo-azul, con el azul al frente. Abajo atrás (DB), resuelta',
      'White-green edge at the top front; yellow-green at the top back; yellow-blue at the bottom front, with blue facing front. Bottom back (DB) solved', 'Em cima na frente, a branco-verde; em cima atrás, a amarelo-verde; embaixo na frente, a amarelo-azul, com o azul para a frente. Embaixo atrás (DB), resolvida'], "M' U2 M U2"),
  lse('4c-ciclo-atras', 'lse-4c', ['Ciclo DF', 'Cycle DF', 'Ciclo DF'], ['Ciclo de 3, abajo adelante resuelta', '3-cycle, bottom front solved', 'Ciclo de 3, embaixo na frente resolvida'],
    ['Arriba adelante, la amarillo-azul; arriba atrás, la blanco-azul; abajo atrás (DB), la amarillo-verde. Abajo adelante (DF), resuelta',
      'Yellow-blue edge at the top front; white-blue at the top back; yellow-green at the bottom back (DB). Bottom front (DF) solved', 'Em cima na frente, a amarelo-azul; em cima atrás, a branco-azul; embaixo atrás (DB), a amarelo-verde. Embaixo na frente (DF), resolvida'], "M U2 M' U2"),
  lse('4c-ciclo-uf', 'lse-4c', ['Ciclo UF', 'Cycle UF', 'Ciclo UF'], ['Ciclo de 3, arriba adelante resuelta', '3-cycle, top front solved', 'Ciclo de 3, em cima na frente resolvida'],
    ['Arriba adelante (UF), resuelta. Arriba atrás, la blanco-azul; abajo adelante, la amarillo-azul; abajo atrás (DB), la blanco-verde',
      'Top front (UF) solved. White-blue edge at the top back; yellow-blue at the bottom front; white-green at the bottom back (DB)', 'Em cima na frente (UF), resolvida. Em cima atrás, a branco-azul; embaixo na frente, a amarelo-azul; embaixo atrás (DB), a branco-verde'], "M2 U2 M' U2 M'"),
  lse('4c-cambio', 'lse-4c', ['Cambio', 'Swap', 'Troca'], ['Adelante y atrás cambiadas', 'Front and back swapped', 'As da frente e as de trás, trocadas'],
    ['Arriba, la amarillo-azul adelante y la amarillo-verde atrás. Abajo, lo mismo: la blanco-azul adelante y la blanco-verde atrás (DB)',
      'On top, the yellow-blue edge at the front and the yellow-green one at the back. On the bottom, the same: white-blue at the front and white-green at the back (DB)', 'Em cima, a amarelo-azul na frente e a amarelo-verde atrás. Embaixo, o mesmo: a branco-azul na frente e a branco-verde atrás (DB)'], 'M2 U2 M2 U2'),
  lse('4c-vertical', 'lse-4c', ['Vertical', 'Vertical', 'Vertical'], ['Arriba y abajo cambiadas', 'Top and bottom swapped', 'As de cima e as de baixo, trocadas'],
    ['Las aristas blancas están arriba: la blanco-verde adelante y la blanco-azul atrás. Abajo están la amarillo-verde y la amarillo-azul, cada una bajo la blanca de su mismo color',
      'The white edges are on top: white-green at the front and white-blue at the back. On the bottom are yellow-green and yellow-blue, each one under the white edge it shares a color with', 'As arestas brancas estão em cima: a branco-verde na frente e a branco-azul atrás. Embaixo estão a amarelo-verde e a amarelo-azul, cada uma debaixo da aresta branca da sua cor'], 'M U2 M2 U2 M'),
];

export const roux: Method = {
  id: 'roux',
  name: tr('Roux', 'Roux', 'Roux'),
  summary: tr('Aprende el método Roux para el cubo de Rubik: dos bloques, las esquinas de arriba (CMLL) y las últimas seis aristas solo con M y U.', "Learn the Roux method for the Rubik's cube: two blocks, the top corners (CMLL) and the last six edges with only M and U.", 'Aprenda o método Roux para o cubo mágico: dois blocos, as quinas de cima (CMLL) e as últimas seis arestas só com M e U.'),
  description: doc([
    'Roux es un método de **pocos giros**, creado por Gilles Roux. En vez de resolver por capas, armas dos **bloques** de 1×2×3 (1 capa de ancho, 2 de alto y 3 de fondo), uno a cada lado. Al final queda la capa del medio entre ellos, la capa `M`.',
    'Es para quien prefiere planear a memorizar: usa menos giros que el CFOP y pocos algoritmos. Como no hace falta girar el cubo entero, se usa mucho a una mano.',
    '## Los 4 pasos',
    '1. **Primer bloque:** arma un bloque de 1×2×3 a la izquierda, sin algoritmos.',
    '2. **Segundo bloque:** arma otro igual a la derecha, solo con `R`, `r`, `M` y `U`.',
    '3. **CMLL:** resuelve las 4 esquinas de arriba con uno de 42 algoritmos. La sigla viene del inglés: las esquinas de la última capa, con la capa `M` libre.',
    '4. **Últimas seis aristas (LSE):** termina solo con `M` y `U`, en 3 partes cortas.',
    '## Cómo aprenderlo',
    "1. Practica `M` y `M'` hasta hacerlos sin mirar.",
    '2. Aprende los bloques. Si sabes el F2L del CFOP, los pares se juntan igual.',
    '3. Empieza el CMLL en 2 pasos, con el OCLL, y suma un grupo de casos cada vez.',
  ], [
    'Roux is a **low move count** method, created by Gilles Roux. Instead of solving layer by layer, you build two 1×2×3 **blocks** (1 layer wide, 2 tall and 3 deep), one on each side. The middle layer between them, the `M` layer, is left for the end.',
    "It's for anyone who'd rather plan than memorize: it uses fewer moves than CFOP and needs few algorithms. Since you don't need to rotate the whole cube, it's popular for one-handed solving.",
    '## The 4 steps',
    '1. **First block:** build a 1×2×3 block on the left, with no algorithms.',
    '2. **Second block:** build a matching one on the right, with only `R`, `r`, `M` and `U`.',
    '3. **CMLL:** solve the 4 top corners with one of 42 algorithms. The name stands for corners of the last layer, with the `M` layer left free.',
    '4. **Last six edges (LSE):** finish with only `M` and `U`, in 3 short parts.',
    '## How to learn it',
    "1. Practice `M` and `M'` until you can do them without looking.",
    "2. Learn the blocks. If you know CFOP's F2L, you build the pairs the same way.",
    '3. Start CMLL in 2 looks, with OCLL, and add one group of cases at a time.',
  ], [
    'Roux é um método de **poucos movimentos**, criado por Gilles Roux. Em vez de resolver por camadas, você monta dois **blocos** de 1×2×3 (1 camada de largura, 2 de altura e 3 de profundidade), um de cada lado. No fim, sobra a camada do meio entre eles, a camada `M`.',
    'É para quem prefere planejar a decorar: usa menos movimentos que o CFOP e poucos algoritmos. Como não é preciso girar o cubo inteiro, é muito usado para resolver com uma mão só.',
    '## Os 4 passos',
    '1. **Primeiro bloco:** monte um bloco de 1×2×3 à esquerda, sem algoritmos.',
    '2. **Segundo bloco:** monte outro igual à direita, só com `R`, `r`, `M` e `U`.',
    '3. **CMLL:** resolva as 4 quinas de cima com um dos 42 algoritmos. A sigla vem do inglês: as quinas da última camada, com a camada `M` livre.',
    '4. **Últimas seis arestas (LSE):** termine só com `M` e `U`, em 3 partes curtas.',
    '## Como aprender',
    "1. Pratique `M` e `M'` até fazê-los sem olhar.",
    '2. Aprenda os blocos. Se você sabe o F2L do CFOP, os pares se formam do mesmo jeito.',
    '3. Comece o CMLL em 2 passos, com o OCLL, e acrescente um grupo de casos por vez.',
  ]),
  orientation: tr(
    'Sostén el cubo con el **blanco abajo**, el amarillo arriba y el verde al frente. El primer bloque va a la izquierda, del lado del centro rojo, y el segundo a la derecha, del lado del naranja.',
    'Hold the cube with **white on the bottom**, yellow on top and green facing front. The first block goes on the left, the side with the red center, and the second on the right, the side with the orange center.', 'Segure o cubo com o **branco embaixo**, o amarelo em cima e o verde para a frente. O primeiro bloco vai à esquerda, do lado do centro vermelho, e o segundo à direita, do lado do laranja.',
  ),
  notation: doc([
    '## Giros',
    '- `M`: gira la capa del medio, la que está entre `L` y `R`, en el mismo sentido que `L`.',
    "- `r`: gira `R` y la capa del medio juntas, como `R` y `M'` a la vez.",
    '- Durante los bloques y el CMLL, la capa `M` puede quedar desalineada: el centro amarillo, por ejemplo, queda al frente en vez de arriba. No importa hasta las últimas seis aristas.',
    '## Sitios con letras',
    'Algunos sitios se nombran con las letras de sus caras, como en la notación: DL es abajo a la izquierda, UF arriba adelante y DB abajo atrás.',
    '## Figuras',
    '- **Bloques:** el cubo visto desde el lado del bloque. Solo se colorean sus piezas.',
    '- **CMLL:** la cara de arriba vista desde arriba, con el lado del frente en el borde inferior de la figura. Solo se ven las esquinas, con flechas que indican a dónde va cada una.',
    '- **Últimas seis aristas:** las 6 aristas y los centros de la capa `M`. La arista de abajo atrás (DB) no se ve: el texto dice cómo está.',
  ], [
    '## Moves',
    '- `M`: turns the middle layer, the one between `L` and `R`, in the same direction as `L`.',
    "- `r`: turns `R` and the middle layer together, like `R` and `M'` at the same time.",
    "- During the blocks and CMLL, the `M` layer may be misaligned: the yellow center, for example, ends up facing front instead of up. It doesn't matter until the last six edges.",
    '## Places named by letters',
    'Some places are named by the letters of their faces, as in the notation: DL is the bottom left, UF the top front and DB the bottom back.',
    '## Diagrams',
    "- **Blocks:** the cube seen from the block's side. Only its pieces are in color.",
    '- **CMLL:** the top face seen from above, with the front side at the bottom of the diagram. Only the corners appear, with arrows showing where each one goes.',
    "- **Last six edges:** the 6 edges and the `M` layer's centers. The bottom-back edge (DB) is hidden: the text describes it.",
  ], [
    '## Movimentos',
    '- `M`: gira a camada do meio, a que fica entre `L` e `R`, no mesmo sentido que `L`.',
    "- `r`: gira `R` e a camada do meio juntas, como `R` e `M'` ao mesmo tempo.",
    '- Durante os blocos e o CMLL, a camada `M` pode ficar desalinhada: o centro amarelo, por exemplo, fica virado para a frente em vez de para cima. Isso não importa até as últimas seis arestas.',
    '## Lugares nomeados por letras',
    'Alguns lugares recebem o nome das letras das suas faces, como na notação: DL é embaixo à esquerda, UF em cima na frente e DB embaixo atrás.',
    '## Figuras',
    '- **Blocos:** o cubo visto do lado do bloco. Só as peças dele ficam coloridas.',
    '- **CMLL:** a face de cima vista de cima, com o lado da frente na borda de baixo da figura. Só aparecem as quinas, com setas que indicam para onde vai cada uma.',
    '- **Últimas seis arestas:** as 6 arestas e os centros da camada `M`. A aresta de baixo atrás (DB) não aparece: o texto diz como ela está.',
  ]),
  before: { path: '/academia/notacion', label: tr('Antes: los giros M y r en Notación', 'Before: the M and r moves in Notation', 'Antes: os movimentos M e r em Notação') },
  phases: [
    {
      id: 'roux-bloque1',
      name: tr('Primer bloque', 'First block', 'Primeiro bloco'),
      goal: doc([
        '**Meta:** un bloque de 1×2×3 a la izquierda: el centro rojo, la arista blanco-roja abajo a la izquierda (DL) y un par adelante y otro atrás.',
        '**Sin algoritmos:** es intuitivo, como la cruz. Un **par** es una esquina blanca junto a su arista.',
      ], [
        '**Goal:** a 1×2×3 block on the left: the red center, the white-red edge at the bottom left (DL) and one pair at the front and one at the back.',
        '**No algorithms:** it\'s intuitive, like the cross. A **pair** is a white corner together with its edge.',
      ], [
        '**Meta:** um bloco de 1×2×3 à esquerda: o centro vermelho, a aresta branco-vermelha embaixo à esquerda (DL) e um par na frente e outro atrás.',
        '**Sem algoritmos:** é intuitivo, como a cruz. Um **par** é uma quina branca junto com a sua aresta.',
      ]),
      description: doc([
        '## Cómo se hace',
        '1. En la inspección, planea cómo llevar la arista blanco-roja a su sitio y, si puedes, un par.',
        '2. **Arista DL:** lleva la arista blanco-roja abajo a la izquierda (DL), junto al centro rojo, con el blanco abajo.',
        '3. **Par de atrás:** junta la esquina blanco-azul-roja con la arista azul-roja y mete el par atrás. Queda un cuadrado de 1×2×2.',
        '4. **Par de adelante:** igual, con la esquina blanco-verde-roja y la arista verde-roja, adelante.',
        'Cada caso de esta fase empieza con un solo par por meter: el de adelante o el de atrás.',
        '## Los pares',
        'Junta los pares con `R`, `r`, `M` y `U`, que no tocan lo que ya armaste. Si la ranura de adelante o la de atrás está libre, `F` o `B` meten el par de una vez.',
      ], [
        '## How to do it',
        '1. During inspection, plan how to bring the white-red edge to its place and, if you can, one pair.',
        '2. **DL edge:** bring the white-red edge to the bottom left (DL), next to the red center, with white facing down.',
        '3. **Back pair:** join the white-blue-red corner with the blue-red edge and insert the pair at the back. That makes a 1×2×2 square.',
        '4. **Front pair:** the same, with the white-green-red corner and the green-red edge, at the front.',
        'Each case in this phase starts with one pair left to insert: the front one or the back one.',
        '## The pairs',
        "Pair up the pieces with `R`, `r`, `M` and `U`, which don't touch what you've built. If the front or back slot is empty, `F` or `B` inserts the pair in one move.",
      ], [
        '## Como fazer',
        '1. Na inspeção, planeje como levar a aresta branco-vermelha ao lugar dela e, se puder, um par.',
        '2. **Aresta DL:** leve a aresta branco-vermelha para baixo à esquerda (DL), junto ao centro vermelho, com o branco para baixo.',
        '3. **Par de trás:** junte a quina branco-azul-vermelha com a aresta azul-vermelha e insira o par atrás. Fica um quadrado de 1×2×2.',
        '4. **Par da frente:** igual, com a quina branco-verde-vermelha e a aresta verde-vermelha, na frente.',
        'Cada caso desta fase começa com um só par para inserir: o da frente ou o de trás.',
        '## Os pares',
        'Forme os pares com `R`, `r`, `M` e `U`, que não mexem no que você já montou. Se o slot da frente ou o de trás estiver livre, `F` ou `B` insere o par com um só movimento.',
      ]),
      tips: doc([
        '- **Se rompe lo que ya armaste:** junta las piezas con `R`, `r`, `M` y `U`, que no lo tocan. Usa `L`, `F` y `B` solo para meter un par.',
        '- **El par no entra junto:** antes de meterlo, júntalo arriba: esquina y arista lado a lado, con el mismo color del mismo lado.',
        '- **Una pieza quedó atrapada en el bloque:** sácala girando la misma cara que la metió, súbela y vuelve a armar ese par.',
      ], [
        "- **You keep breaking what you've built:** pair up the pieces with `R`, `r`, `M` and `U`, which don't touch it. Use `L`, `F` and `B` only to insert a pair.",
        '- **The pair comes apart when it goes in:** before inserting it, build it on top: corner and edge side by side, with the same color on the same side.',
        '- **A piece got stuck in the block:** take it out by turning the same face that put it in, bring it up and build that pair again.',
      ], [
        '- **O que você montou se desfaz:** junte as peças com `R`, `r`, `M` e `U`, que não mexem nele. Use `L`, `F` e `B` só para inserir um par.',
        '- **O par não entra junto:** antes de inseri-lo, monte-o em cima: quina e aresta lado a lado, com a mesma cor do mesmo lado.',
        '- **Uma peça ficou presa no bloco:** tire-a girando a mesma face que a colocou ali, leve-a para cima e monte esse par de novo.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-fb-delante', name: tr('Par de adelante', 'Front pair', 'Par da frente'), description: tr('Aquí armaste primero el cuadrado de atrás: falta meter el par de adelante.', "In this group, you built the back square first: all that's left is to insert the front pair.", 'Aqui você montou primeiro o quadrado de trás: falta inserir o par da frente.'), cases: fbFront },
        { id: 'roux-fb-atras', name: tr('Par de atrás', 'Back pair', 'Par de trás'), description: tr('Aquí armaste primero el par de adelante: falta meter el de atrás.', "In this group, you built the front pair first: all that's left is to insert the back one.", 'Aqui você montou primeiro o par da frente: falta inserir o de trás.'), cases: fbBack },
      ],
      quizzes: [],
    },
    {
      id: 'roux-bloque2',
      name: tr('Segundo bloque', 'Second block', 'Segundo bloco'),
      goal: doc([
        '**Meta:** un bloque igual a la derecha, sin romper el primero: el centro naranja, la arista blanco-naranja abajo a la derecha (DR) y un par adelante y otro atrás.',
        '**Sin algoritmos:** junta y mete los pares solo con `R`, `r`, `M` y `U`, que no tocan el primer bloque.',
      ], [
        '**Goal:** a matching block on the right, without breaking the first one: the orange center, the white-orange edge at the bottom right (DR) and one pair at the front and one at the back.',
        "**No algorithms:** build and insert the pairs with only `R`, `r`, `M` and `U`, which don't touch the first block.",
      ], [
        '**Meta:** um bloco igual à direita, sem desfazer o primeiro: o centro laranja, a aresta branco-laranja embaixo à direita (DR) e um par na frente e outro atrás.',
        '**Sem algoritmos:** forme e insira os pares só com `R`, `r`, `M` e `U`, que não mexem no primeiro bloco.',
      ]),
      description: doc([
        '## Cómo se hace',
        '1. **Arista DR:** con `R`, `M` y `U`, lleva la arista blanco-naranja arriba a la derecha, con el blanco arriba. Si queda con el blanco a la derecha, `U M\' U` la voltea sin moverla de ahí. Luego bájala a su sitio, abajo a la derecha (DR), con `R2` o `r2`.',
        '2. **Par de atrás:** junta arriba la esquina blanco-azul-naranja con la arista azul-naranja y mete el par con `R`, `r` y `U`, como un par del F2L.',
        '3. **Par de adelante:** igual, con la esquina blanco-verde-naranja y la arista verde-naranja.',
        'Cada caso de esta fase empieza con un solo par por meter: el de adelante o el de atrás.',
        '`r` gira la cara derecha y la capa `M` juntas: a veces ahorra un giro.',
      ], [
        '## How to do it',
        '1. **DR edge:** with `R`, `M` and `U`, bring the white-orange edge to the top right, with white facing up. If white ends up facing right, `U M\' U` flips it in place. Then bring it down to its place, the bottom right (DR), with `R2` or `r2`.',
        '2. **Back pair:** on top, join the white-blue-orange corner with the blue-orange edge, then insert the pair with `R`, `r` and `U`, like an F2L pair.',
        '3. **Front pair:** the same, with the white-green-orange corner and the green-orange edge.',
        'Each case in this phase starts with one pair left to insert: the front one or the back one.',
        '`r` turns the right face and the `M` layer together: sometimes it saves a move.',
      ], [
        '## Como fazer',
        '1. **Aresta DR:** com `R`, `M` e `U`, leve a aresta branco-laranja para cima à direita, com o branco para cima. Se o branco ficar virado para a direita, `U M\' U` a inverte sem tirá-la dali. Depois desça-a até o lugar dela, embaixo à direita (DR), com `R2` ou `r2`.',
        '2. **Par de trás:** junte em cima a quina branco-azul-laranja com a aresta azul-laranja e insira o par com `R`, `r` e `U`, como um par do F2L.',
        '3. **Par da frente:** igual, com a quina branco-verde-laranja e a aresta verde-laranja.',
        'Cada caso desta fase começa com um só par para inserir: o da frente ou o de trás.',
        '`r` gira a face direita e a camada `M` juntas: às vezes economiza um movimento.',
      ]),
      tips: doc([
        '- **Se rompió el primer bloque:** usa solo `R`, `r`, `M` y `U`. Nada de `L`, `F` ni `B`.',
        '- **Una pieza está atrapada abajo, en la capa `M`:** gira `M` para subirla. No toca los bloques.',
        '- **Los centros de la capa `M` están desalineados:** es normal. Se alinean en las últimas seis aristas.',
      ], [
        '- **You broke the first block:** use only `R`, `r`, `M` and `U`. No `L`, `F` or `B`.',
        "- **A piece is stuck on the bottom, in the `M` layer:** turn `M` to bring it up. That move doesn't touch the blocks.",
        "- **The `M` layer's centers are misaligned:** that's normal. They get lined up in the last six edges.",
      ], [
        '- **O primeiro bloco se desfez:** use só `R`, `r`, `M` e `U`. Nada de `L`, `F` nem `B`.',
        '- **Uma peça está presa embaixo, na camada `M`:** gire `M` para subi-la. Isso não mexe nos blocos.',
        '- **Os centros da camada `M` estão desalinhados:** é normal. Eles se alinham nas últimas seis arestas.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-sb-delante', name: tr('Par de adelante', 'Front pair', 'Par da frente'), description: tr('Aquí ya están el primer bloque y el cuadrado de atrás: falta meter el par de adelante.', "The first block and the back square are done: all that's left is to insert the front pair.", 'O primeiro bloco e o quadrado de trás já estão feitos: falta inserir o par da frente.'), cases: sbFront },
        { id: 'roux-sb-atras', name: tr('Par de atrás', 'Back pair', 'Par de trás'), description: tr('Aquí ya están el primer bloque y el par de adelante: falta meter el de atrás.', "The first block and the front pair are done: all that's left is to insert the back one.", 'O primeiro bloco e o par da frente já estão feitos: falta inserir o de trás.'), cases: sbBack },
      ],
      quizzes: [],
    },
    {
      id: 'roux-cmll',
      name: tr('CMLL', 'CMLL', 'CMLL'),
      goal: doc([
        '**Meta:** las 4 esquinas de arriba en su sitio, sin romper los bloques. Las aristas aún no importan.',
        '**Casos:** 42, con un algoritmo cada uno. Los reconoces por la forma del amarillo y las pegatinas de los lados.',
      ], [
        "**Goal:** the 4 top corners in place, without breaking the blocks. The edges don't matter yet.",
        '**Cases:** 42, with one algorithm each. You recognize them by the yellow shape and the side stickers.',
      ], [
        '**Meta:** as 4 quinas de cima no lugar, sem desfazer os blocos. As arestas ainda não importam.',
        '**Casos:** 42, com um algoritmo cada um. Você os reconhece pela forma do amarelo e pelos adesivos dos lados.',
      ]),
      description: doc([
        '## Cómo se reconoce',
        '1. Mira cuántas esquinas tienen el amarillo arriba y hacia dónde lo muestran las demás. Esa forma te da el grupo: O, H, Pi, U, T, Sune, Antisune o L, como en el OCLL.',
        '2. Gira `U` hasta que el amarillo quede como en las figuras de los casos de ese grupo. En O y H se ve igual en más de una posición: elige aquella en la que los lados también coinciden con la figura.',
        '3. Mira las pegatinas de los lados que indica el grupo y busca tu caso.',
        '4. Haz su algoritmo. Al terminar, puede faltar un giro de `U`.',
        '## Faros, opuestos y vecinos',
        'Las dos pegatinas de un lado pueden ser:',
        '- **Faros:** del mismo color.',
        '- **Opuestos:** rojo y naranja, o verde y azul.',
        '- **Vecinos:** cualquier otra combinación (rojo y verde, naranja y azul…).',
        'Los colores de cada caso son solo un ejemplo: según cómo queden las esquinas, en tu cubo pueden salir otros. Lo que no cambia es la relación entre ellos y dónde se repite un color.',
      ], [
        '## How to recognize it',
        '1. Look at how many corners have yellow on top and which way the yellow faces on the others. That shape gives you the group: O, H, Pi, U, T, Sune, Antisune or L, as in OCLL.',
        "2. Turn `U` until the yellow looks like the diagrams for that group's cases. In O and H it looks the same in more than one position: pick the one where the sides match the diagram too.",
        '3. Check the side stickers that group tells you to look at, and find your case.',
        '4. Do its algorithm. At the end, you may need one more `U` turn.',
        '## Headlights, opposite and adjacent',
        'The two stickers on a side can be:',
        '- **Headlights:** the same color.',
        '- **Opposite:** red and orange, or green and blue.',
        '- **Adjacent:** any other combination (red and green, orange and blue…).',
        "Each case's colors are just an example: depending on how the corners end up, your cube may show others. What doesn't change is how they relate and where a color repeats.",
      ], [
        '## Como reconhecer',
        '1. Olhe quantas quinas têm o amarelo em cima e para onde as outras viram o amarelo. Essa forma diz qual é o grupo: O, H, Pi, U, T, Sune, Antisune ou L, como no OCLL.',
        '2. Gire `U` até o amarelo ficar como nas figuras dos casos desse grupo. No O e no H, ele fica igual em mais de uma posição: escolha aquela em que os lados também coincidam com a figura.',
        '3. Olhe os adesivos dos lados que o grupo indica e encontre o seu caso.',
        '4. Faça o algoritmo dele. No final, pode faltar um movimento de `U`.',
        '## Faróis, opostos e vizinhos',
        'Os dois adesivos de um lado podem ser:',
        '- **Faróis:** da mesma cor.',
        '- **Opostos:** vermelho e laranja, ou verde e azul.',
        '- **Vizinhos:** qualquer outra combinação (vermelho e verde, laranja e azul…).',
        'As cores de cada caso são só um exemplo: dependendo de como as quinas ficarem, no seu cubo podem aparecer outras. O que não muda é a relação entre elas e onde uma cor se repete.',
      ]),
      tips: doc([
        '- **No sabes el caso:** hazlo en 2 pasos. Primero, un algoritmo del OCLL del CFOP reducido (Sune, Antisune, H, Pi, U, T o L) pone el amarillo arriba sin romper los bloques. Luego, O Adyacente u O Diagonal colocan las esquinas.',
        '- **Las aristas de arriba cambiaron:** es normal, los algoritmos pueden moverlas. Solo importan los bloques y las esquinas.',
      ], [
        "- **You don't know the case:** do it in 2 looks. First, an OCLL algorithm from Reduced CFOP (Sune, Antisune, H, Pi, U, T or L) gets yellow on top without breaking the blocks. Then O Adjacent or O Diagonal places the corners.",
        "- **The top edges changed:** that's normal. The algorithms may move them. Only the blocks and the corners matter.",
      ], [
        '- **Você não sabe o caso:** faça em 2 passos. Primeiro, um algoritmo do OCLL do CFOP reduzido (Sune, Antisune, H, Pi, U, T ou L) coloca o amarelo em cima sem desfazer os blocos. Depois, O Adjacente ou O Diagonal posiciona as quinas.',
        '- **As arestas de cima mudaram:** é normal. Os algoritmos podem movê-las. Só importam os blocos e as quinas.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'roux-cmll-o', name: tr('O: todo amarillo arriba', 'O: all yellow on top', 'O: tudo amarelo em cima'), description: tr('En el grupo O, las 4 esquinas ya tienen el amarillo arriba: solo falta colocarlas. **Adyacente:** faros en un solo lado. **Diagonal:** ningún faro.', 'In the O group, all 4 corners already have yellow on top: they only need to be placed. **O Adjacent:** headlights on one side only. **O Diagonal:** no headlights.', 'No grupo O, as 4 quinas já têm o amarelo em cima: só falta posicioná-las. **Adjacente:** faróis em um só lado. **Diagonal:** nenhum farol.'), cases: cmllO },
        { id: 'roux-cmll-h', name: tr('H', 'H', 'H'), description: tr('Ninguna esquina tiene el amarillo arriba: dos lo muestran al frente y dos atrás. Mira los lados izquierdo y derecho: faros, colores opuestos o colores vecinos.', 'No corner has yellow on top: two show it facing front and two facing back. Look at the left and right sides: headlights, opposite colors or adjacent colors.', 'Nenhuma quina tem o amarelo em cima: duas o mostram para a frente e duas para trás. Olhe os lados esquerdo e direito: faróis, cores opostas ou cores vizinhas.'), cases: cmllH },
        { id: 'roux-cmll-pi', name: tr('Pi', 'Pi', 'Pi'), description: tr('Ninguna esquina tiene el amarillo arriba: dos lo muestran a la izquierda. Mira el lado derecho y las otras pegatinas de las esquinas de la izquierda: la del frente y la de atrás.', 'No corner has yellow on top: two show it facing left. Look at the right side and the other stickers of the left corners: the front one and the back one.', 'Nenhuma quina tem o amarelo em cima: duas o mostram para a esquerda. Olhe o lado direito e os outros adesivos das quinas da esquerda: o da frente e o de trás.'), cases: cmllPi },
        { id: 'roux-cmll-u', name: tr('U', 'U', 'U'), description: tr('Las dos esquinas de adelante tienen el amarillo arriba, y las de atrás lo muestran atrás. Mira el frente y los dos lados: faros, opuestos o vecinos, y dónde se repite un color.', 'The two front corners have yellow on top, and the back ones show it facing back. Look at the front and both sides: headlights, opposite or adjacent, and where a color repeats.', 'As duas quinas da frente têm o amarelo em cima, e as de trás o mostram para trás. Olhe a frente e os dois lados: faróis, opostos ou vizinhos, e onde uma cor se repete.'), cases: cmllU },
        { id: 'roux-cmll-t', name: tr('T', 'T', 'T'), description: tr('Las dos esquinas de adelante tienen el amarillo arriba, y las de atrás lo muestran a los lados. Mira el frente y atrás: faros, opuestos o vecinos, y dónde se repite un color.', 'The two front corners have yellow on top, and the back ones show it facing the sides. Look at the front and the back: headlights, opposite or adjacent, and where a color repeats.', 'As duas quinas da frente têm o amarelo em cima, e as de trás o mostram para os lados. Olhe a frente e a parte de trás: faróis, opostos ou vizinhos, e onde uma cor se repete.'), cases: cmllT },
        { id: 'roux-cmll-s', name: tr('Sune', 'Sune', 'Sune'), description: tr('Una esquina tiene el amarillo arriba, adelante a la derecha. Mira dónde se repite el color de su pegatina de la derecha y si las dos del frente tienen colores opuestos o vecinos. Si ese color se repite al frente, mira también dónde está su opuesto.', 'One corner has yellow on top, at the front right. Look at where the color of its right sticker repeats and whether the two front stickers are opposite or adjacent colors. If that color repeats on the front, also look at where its opposite is.', 'Uma quina tem o amarelo em cima, na frente à direita. Olhe onde se repete a cor do adesivo direito dessa quina e se os dois adesivos da frente têm cores opostas ou vizinhas. Se essa cor se repetir na frente, olhe também onde está a cor oposta a ela.'), cases: cmllS },
        { id: 'roux-cmll-as', name: tr('Antisune', 'Antisune', 'Antisune'), description: tr('Una esquina tiene el amarillo arriba, adelante a la izquierda. Mira dónde se repite el color de su pegatina de la izquierda y si las dos del frente tienen colores opuestos o vecinos. Si ese color se repite al frente, mira también dónde está su opuesto.', 'One corner has yellow on top, at the front left. Look at where the color of its left sticker repeats and whether the two front stickers are opposite or adjacent colors. If that color repeats on the front, also look at where its opposite is.', 'Uma quina tem o amarelo em cima, na frente à esquerda. Olhe onde se repete a cor do adesivo esquerdo dessa quina e se os dois adesivos da frente têm cores opostas ou vizinhas. Se essa cor se repetir na frente, olhe também onde está a cor oposta a ela.'), cases: cmllAS },
        { id: 'roux-cmll-l', name: tr('L', 'L', 'L'), description: tr('Dos esquinas en diagonal tienen el amarillo arriba: adelante a la derecha y atrás a la izquierda. Mira el frente y el lado derecho: opuestos o vecinos, y dónde se repite un color.', 'Two diagonal corners have yellow on top: front right and back left. Look at the front and the right side: opposite or adjacent, and where a color repeats.', 'Duas quinas na diagonal têm o amarelo em cima: na frente à direita e atrás à esquerda. Olhe a frente e o lado direito: opostos ou vizinhos, e onde uma cor se repete.'), cases: cmllL },
      ],
      progression: doc([
        '1. **CMLL en 2 pasos:** si sabes el OCLL, solo te faltan O Adyacente y O Diagonal. Con ellos ya resuelves cualquier caso.',
        '2. **Sune y Antisune:** 12 casos que salen casi 1 de cada 3 veces.',
        '3. **H y Pi:** ninguna esquina tiene el amarillo arriba, y H solo tiene 4 casos.',
        '4. **U y T:** en los dos, las esquinas de adelante tienen el amarillo arriba, así que los reconoces empezando por el frente.',
        '5. **L:** al final. Para distinguir sus casos hay que fijarse en qué color se repite y dónde.',
        'Con cada grupo nuevo, sigue usando el CMLL en 2 pasos para los casos que aún no sabes.',
      ], [
        '1. **2-look CMLL:** if you know OCLL, you only need O Adjacent and O Diagonal. With them you can already solve any case.',
        '2. **Sune and Antisune:** 12 cases that come up almost 1 in 3 times.',
        '3. **H and Pi:** no corner has yellow on top, and H has only 4 cases.',
        '4. **U and T:** in both, the front corners have yellow on top, so you recognize them starting from the front.',
        '5. **L:** last. To tell its cases apart, you have to notice which color repeats and where.',
        "With each new group, keep using 2-look CMLL for the cases you don't know yet.",
      ], [
        '1. **CMLL em 2 passos:** se você sabe o OCLL, só faltam O Adjacente e O Diagonal. Com eles você já resolve qualquer caso.',
        '2. **Sune e Antisune:** 12 casos que aparecem quase 1 em cada 3 vezes.',
        '3. **H e Pi:** nenhuma quina tem o amarelo em cima, e o H só tem 4 casos.',
        '4. **U e T:** nos dois, as quinas da frente têm o amarelo em cima, então você os reconhece começando pela frente.',
        '5. **L:** por último. Para distinguir os casos dele, é preciso notar qual cor se repete e onde.',
        'A cada grupo novo, continue usando o CMLL em 2 passos para os casos que você ainda não sabe.',
      ]),
      quizzes: [],
    },
    {
      id: 'roux-lse',
      name: tr('Últimas seis aristas', 'Last six edges', 'Últimas seis arestas'),
      goal: doc([
        '**Meta:** el cubo resuelto: las 6 aristas que faltan en su sitio y los centros de la capa `M` alineados.',
        '**Casos:** 16 ejemplos, todos solo con `M` y `U`. Van en 3 partes: orientar las aristas (EO), colocar las de arriba a la izquierda y a la derecha (UL y UR) y terminar la capa `M` (4c).',
      ], [
        "**Goal:** the cube solved: the 6 remaining edges in place and the `M` layer's centers lined up.",
        '**Cases:** 16 examples, all with only `M` and `U`. They come in 3 parts: orient the edges (EO), place the top-left and top-right edges (UL and UR) and finish the `M` layer (4c).',
      ], [
        '**Meta:** o cubo resolvido: as 6 arestas que faltam no lugar e os centros da camada `M` alinhados.',
        '**Casos:** 16 exemplos, todos só com `M` e `U`. Vêm em 3 partes: orientar as arestas (EO), posicionar as de cima à esquerda e à direita (UL e UR) e terminar a camada `M` (4c).',
      ]),
      description: doc([
        '## Cómo se hace',
        'Antes de empezar, gira `M` hasta tener el amarillo arriba. Los algoritmos de esta fase lo dejan siempre ahí.',
        '1. **Orientar las aristas (EO):** cuenta las aristas **malas**, las que no tienen su amarillo o su blanco arriba o abajo. Gira `U` hasta verlas como en uno de los casos y haz su algoritmo.',
        '2. **UL y UR:** lleva la arista amarillo-roja arriba a la izquierda (UL) y la amarillo-naranja arriba a la derecha (UR). Cada una va entre las dos esquinas que muestran su color.',
        '3. **4c:** coloca las 4 aristas de la capa `M`. Se llama así porque es la parte c del paso 4 del método.',
        'Los 16 casos son ejemplos, no todas las posiciones. Si el tuyo no está, mira «Si algo sale mal», al final de esta fase.',
      ], [
        '## How to do it',
        'Before you start, turn `M` until yellow is on top. The algorithms in this phase always keep it there.',
        '1. **Orient the edges (EO):** count the **bad** edges, the ones without their yellow or white facing up or down. Turn `U` until they look like one of the cases and do its algorithm.',
        '2. **UL and UR:** bring the yellow-red edge to the top left (UL) and the yellow-orange one to the top right (UR). Each one goes between the two corners that show its color.',
        "3. **4c:** place the 4 edges of the `M` layer. It's called that because it's part c of the method's step 4.",
        'The 16 cases are examples, not every position. If yours isn\'t there, see "If something goes wrong", at the end of this phase.',
      ], [
        '## Como fazer',
        'Antes de começar, gire `M` até o amarelo ficar em cima. Os algoritmos desta fase sempre o mantêm ali.',
        '1. **Orientar as arestas (EO):** conte as arestas **ruins**, as que não têm o amarelo ou o branco para cima ou para baixo. Gire `U` até vê-las como em um dos casos e faça o algoritmo dele.',
        '2. **UL e UR:** leve a aresta amarelo-vermelha para cima à esquerda (UL) e a amarelo-laranja para cima à direita (UR). Cada uma vai entre as duas quinas que mostram a sua cor.',
        '3. **4c:** posicione as 4 arestas da camada `M`. Tem esse nome porque é a parte c do passo 4 do método.',
        'Os 16 casos são exemplos e não cobrem todas as posições. Se o seu não estiver aqui, veja "Se algo der errado", no final desta fase.',
      ]),
      tips: doc([
        '- **Te sale un número impar de malas:** contaste mal, porque siempre salen pares. Casi siempre el error está en la de abajo atrás (DB), que no se ve: inclina el cubo para mirarla.',
        "- **No encuentras tu caso del EO:** si las 2 de abajo son buenas, gira `U` hasta dejar una mala arriba adelante. Si son malas, deja ahí una buena (con las 6 malas, da igual). Luego haz `M U M'`: tendrás un caso de la guía.",
        "- **No encuentras tu caso de UL y UR:** baja a la capa de abajo las aristas amarillo-roja y amarillo-naranja, una a una, y tendrás el caso «Las dos abajo». Para bajar una, gira `U` hasta dejarla arriba atrás y haz `M U2 M'`. Si la otra ya está abajo atrás, deja esta arriba adelante y haz `M' U2 M`.",
        "- **No encuentras tu caso de 4c:** haz `M' U2 M U2`, el algoritmo de «Ciclo de 3, abajo atrás resuelta», y busca de nuevo. Si aún no está, hazlo una vez más.",
      ], [
        "- **You get an odd number of bad edges:** you miscounted, because it's always an even number. The mistake is almost always the bottom-back edge (DB), which you can't see: tilt the cube to look at it.",
        "- **You can't find your EO case:** if the 2 bottom edges are good, turn `U` until a bad one is at the top front. If they're bad, put a good one there (with all 6 bad, it doesn't matter). Then do `M U M'`: you'll have one of the guide's cases.",
        "- **You can't find your UL and UR case:** bring the yellow-red and yellow-orange edges down to the bottom layer, one at a time, and you'll have the \"Both on the bottom\" case. To bring one down, turn `U` until it's at the top back and do `M U2 M'`. If the other one is already at the bottom back, put this one at the top front and do `M' U2 M`.",
        "- **You can't find your 4c case:** do `M' U2 M U2`, the algorithm for \"3-cycle, bottom back solved\", and look again. If it's still not there, do it once more.",
      ], [
        '- **A contagem de arestas ruins deu ímpar:** você contou errado, porque o número é sempre par. Quase sempre o erro está na de baixo atrás (DB), que fica escondida: incline o cubo para vê-la.',
        "- **Você não encontra o seu caso do EO:** se as 2 arestas de baixo forem boas, gire `U` até deixar uma ruim em cima na frente. Se forem ruins, deixe ali uma boa (com as 6 ruins, tanto faz). Depois faça `M U M'`: você terá um caso do guia.",
        "- **Você não encontra o seu caso de UL e UR:** leve as arestas amarelo-vermelha e amarelo-laranja para a camada de baixo, uma de cada vez, e você terá o caso \"As duas embaixo\". Para descer uma, gire `U` até deixá-la em cima atrás e faça `M U2 M'`. Se a outra já estiver embaixo atrás, deixe esta em cima na frente e faça `M' U2 M`.",
        "- **Você não encontra o seu caso de 4c:** faça `M' U2 M U2`, o algoritmo do \"Ciclo de 3, embaixo atrás resolvida\", e procure de novo. Se ainda não o encontrar, faça-o mais uma vez.",
      ]),
      diagram: 'iso',
      groups: [
        { id: 'roux-lse-eo', name: tr('EO: orientar las aristas', 'EO: orient the edges', 'EO: orientar as arestas'), description: tr('En el grupo EO, los casos se distinguen por cuántas malas hay arriba y abajo, y dónde están. Abajo solo cuentan 2: la de adelante (DF) y la de atrás (DB).', 'In the EO group, the cases differ in how many bad edges there are on top and on the bottom, and where. On the bottom, only 2 count: the front one (DF) and the back one (DB).', 'No grupo EO, os casos se distinguem por quantas arestas ruins há em cima e embaixo, e onde estão. Embaixo, só contam 2: a da frente (DF) e a de trás (DB).'), cases: eo },
        { id: 'roux-lse-ulur', name: tr('UL y UR', 'UL and UR', 'UL e UR'), description: tr('Coloca las aristas de arriba a la izquierda y a la derecha (UL y UR): la amarillo-roja va entre las dos esquinas que muestran rojo, y la amarillo-naranja, entre las de naranja.', 'Place the top-left and top-right edges (UL and UR): the yellow-red one goes between the two corners that show red, and the yellow-orange one between the orange ones.', 'Posicione as arestas de cima à esquerda e à direita (UL e UR): a amarelo-vermelha vai entre as duas quinas que mostram vermelho, e a amarelo-laranja, entre as de laranja.'), cases: ulur },
        { id: 'roux-lse-4c', name: tr('4c: la capa M', '4c: the M layer', '4c: a camada M'), description: tr('Las aristas de arriba a la izquierda y a la derecha (UL y UR) ya están. Solo quedan las 4 aristas de la capa `M`.', 'The top-left and top-right edges (UL and UR) are done. Only the 4 edges of the `M` layer are left.', 'As arestas de cima à esquerda e à direita (UL e UR) já estão feitas. Só faltam as 4 arestas da camada `M`.'), cases: fourC },
      ],
      progression: doc([
        '1. **EO:** empieza por «Flecha», el caso más corto.',
        '2. **UL y UR:** empieza por «Las dos abajo». Su algoritmo, `M2 U M2`, es la base de los demás.',
        '3. **4c:** empieza por los ciclos de 3, en los que 3 aristas cambian de sitio en círculo y la cuarta ya está bien.',
        'Con práctica, harás el EO pensando ya en UL y UR.',
      ], [
        '1. **EO:** start with "Arrow", the shortest case.',
        '2. **UL and UR:** start with "Both on the bottom". Its algorithm, `M2 U M2`, is the basis for the others.',
        '3. **4c:** start with the 3-cycles, where 3 edges trade places in a loop and the fourth is already in place.',
        "With practice, you'll plan UL and UR while you're still doing EO.",
      ], [
        '1. **EO:** comece pelo caso "Seta", o mais curto.',
        '2. **UL e UR:** comece pelo caso "As duas embaixo". O algoritmo dele, `M2 U M2`, é a base dos outros.',
        '3. **4c:** comece pelos ciclos de 3, em que 3 arestas trocam de lugar em círculo e a quarta já está no lugar.',
        'Com prática, você vai fazer o EO já pensando em UL e UR.',
      ]),
      quizzes: [],
    },
  ],
};

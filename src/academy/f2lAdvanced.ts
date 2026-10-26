// "F2L avanzado": F2L beyond the front-right slot: pairs into the back slots, pieces stuck in another slot, and free
// pairs solved efficiently. Stage 'f2l' (all four slots solved), so a case may target any slot; the iso figure turns
// to the slot being solved (diagram.ts). Case ids: f2la-<slug>.
// Algorithms from SpeedCubeDB (fetched 2026-10-22): F2L's Back Right / Back Left / Front Left tabs, and the Advanced F2L
// set (AF2L, Front Right tab). Main = the site's #1 for that slot, except: an alg with a rotation (BL 3) or one whose
// state the figure would draw from another slot (BL 2, FL 1: a tie in diagram.ts's view pick) gives way to the next.
// Extras: the next ones on the list, at most 3, without rotations, with votes, at most twice the main's length, and
// that solve every slot here (many AF2L alternatives leave the other pair unsolved, so they are out).
// Recognition = the state as the figure shows it (turned to the slot); the algorithms are done with green in front.
import { doc, tr, type Localized } from '../i18n.ts';
import type { Case, Method } from './types.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { scdbUrl } from './scdb.ts';

const SLOT = {
  BR: ['atrás-derecha', 'back-right', 'atrás-direita'],
  BL: ['atrás-izquierda', 'back-left', 'atrás-esquerda'],
  FL: ['adelante-izquierda', 'front-left', 'frente-esquerda'],
} as const;

const TOP_NOTE = (alg: string) => tr(`La más votada en SpeedCubeDB es \`${alg}\` (está entre las alternativas).`, `SpeedCubeDB's most voted is \`${alg}\` (it's among the alternatives).`, `A mais votada no SpeedCubeDB é \`${alg}\` (está entre as alternativas).`);

/** n = SpeedCubeDB's number (F2L n or AF2L n); rank = the main's place on its list for this slot. */
function kase(id: string, code: string, name: Localized, scdb: Case['scdb'], rank: number, alg: string, alts: [number, string][], recognition: Localized, note?: Localized): Case {
  return {
    id,
    code,
    name,
    recognition,
    stage: 'f2l',
    algs: [
      { id: 'main', alg, source: 'speedcubedb', rank },
      ...alts.map(([r, a]) => ({ id: `scdb-${r}`, alg: a, source: 'speedcubedb' as const, rank: r })),
    ],
    setup: invertTokens(centerMoves(alg, IDENTITY)).join(' '),
    scdb,
    ...(note ? { note } : {}),
  };
}
const pair = (slot: keyof typeof SLOT) => (n: number, rank: number, alg: string, alts: [number, string][], recognition: Localized, note?: Localized) =>
  kase(`f2la-${slot.toLowerCase()}-${String(n).padStart(2, '0')}`, `${slot}${n}`, tr(`F2L ${n} · ${SLOT[slot][0]}`, `F2L ${n} · ${SLOT[slot][1]}`, `F2L ${n} · ${SLOT[slot][2]}`),
    { set: 'F2L', id: String(n), url: scdbUrl('F2L', String(n)) }, rank, alg, alts, recognition, note);
const BR = pair('BR'), BL = pair('BL'), FL = pair('FL');
const AF = (n: number, rank: number, alg: string, alts: [number, string][], recognition: Localized) =>
  kase(`f2la-af2l-${String(n).padStart(2, '0')}`, `AF${n}`, tr(`AF2L ${n}`, `AF2L ${n}`, `AF2L ${n}`), { set: 'AdvancedF2L', id: `AF2L_${n}`, url: scdbUrl('AdvancedF2L', `AF2L_${n}`) }, rank, alg, alts, recognition);

const atrasDer = [
  BR(1, 1, "U f R' f'", [[2, "r' U' R U M'"], [3, "d L U' L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, naranja arriba', 'Corner up front-right, white facing front; edge up-right, orange up', 'Quina em cima frente-dir, branco na frente; aresta em cima à direita, laranja em cima')),
  BR(2, 1, "U' R' U R", [[2, "R f' U' f"], [3, "U2 R' U2 R"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, azul arriba', 'Corner up front-right, white facing right; edge up-front, blue up', 'Quina em cima frente-dir, branco à direita; aresta em cima na frente, azul em cima')),
  BR(3, 1, "R' U' R", [], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, azul arriba', 'Corner up front-right, white facing front; edge up-left, blue up', 'Quina em cima frente-dir, branco na frente; aresta em cima à esquerda, azul em cima')),
  BR(4, 1, "f R f'", [], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, naranja arriba', 'Corner up front-right, white facing right; edge up-back, orange up', 'Quina em cima frente-dir, branco à direita; aresta em cima atrás, laranja em cima')),
  BR(13, 1, "U R' U R U' R' U' R", [[2, "U R' U R U' R' U R U R' U R"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, azul arriba', 'Corner up front-right, white facing front; edge up-front, blue up', 'Quina em cima frente-dir, branco na frente; aresta em cima na frente, azul em cima')),
  BR(18, 1, "R' U2 R U R' U' R", [], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, azul arriba', 'Corner up front-right, white facing up; edge up-front, blue up', 'Quina em cima frente-dir, branco em cima; aresta em cima na frente, azul em cima')),
  BR(22, 1, "R' U R U2 R' U' R", [[2, "U2 R' U' R U' R' U R"], [3, "R' F' U2 F R"], [4, "U' R' U R U2 R' U R U' R' U R"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, azul arriba', 'Corner up front-right, white facing up; edge up-back, blue up', 'Quina em cima frente-dir, branco em cima; aresta em cima atrás, azul em cima')),
  BR(29, 1, "R' U' R U R' U' R", [[2, "U R' U2 R U2 R' U' R"]], tr('Esquina en la ranura, blanco al frente; arista arriba-adelante, azul arriba', 'Corner in the slot, white facing front; edge up-front, blue up', 'Quina no slot, branco na frente; aresta em cima na frente, azul em cima')),
];
const atrasIzq = [
  BL(1, 1, "U L U' L'", [[2, "L' f U f'"], [3, "U2 L U2 L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, azul arriba', 'Corner up front-right, white facing front; edge up-right, blue up', 'Quina em cima frente-dir, branco na frente; aresta em cima à direita, azul em cima')),
  BL(2, 2, "U' f' L f", [[1, "l U L' U' M'"], [3, "d' R' U R"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, rojo arriba', 'Corner up front-right, white facing right; edge up-front, red up', 'Quina em cima frente-dir, branco à direita; aresta em cima na frente, vermelho em cima'), TOP_NOTE("l U L' U' M'")),
  BL(3, 2, "f' L' f", [], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, rojo arriba', 'Corner up front-right, white facing front; edge up-left, red up', 'Quina em cima frente-dir, branco na frente; aresta em cima à esquerda, vermelho em cima'),
    tr("La más votada en SpeedCubeDB es `y R' U' R`: gira el cubo. Esta es la versión sin girar.", "SpeedCubeDB's most voted is `y R' U' R`: it rotates the cube. This is the version without the rotation.", "A mais votada no SpeedCubeDB é `y R' U' R`: ela gira o cubo. Esta é a versão sem girar.")),
  BL(4, 1, "L U L'", [[2, "r B r'"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, azul arriba', 'Corner up front-right, white facing right; edge up-back, blue up', 'Quina em cima frente-dir, branco à direita; aresta em cima atrás, azul em cima')),
  BL(13, 1, "d L' U L U' L' U' L", [[3, "U f' L f U' f' L' f"], [4, "U L U' L F' L2 U' L U F U L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, rojo arriba', 'Corner up front-right, white facing front; edge up-front, red up', 'Quina em cima frente-dir, branco na frente; aresta em cima na frente, vermelho em cima')),
  BL(17, 1, "L U2 L' U' L U L'", [[2, "L U L' U' L U2 L' U2 L U L'"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-derecha, azul arriba', 'Corner up front-right, white facing up; edge up-right, blue up', 'Quina em cima frente-dir, branco em cima; aresta em cima à direita, azul em cima')),
  BL(22, 1, "l U' l' U2 l U l'", [[2, "f' U' L2 U f"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, rojo arriba', 'Corner up front-right, white facing up; edge up-back, red up', 'Quina em cima frente-dir, branco em cima; aresta em cima atrás, vermelho em cima')),
  BL(30, 1, "L U L' U' L U L'", [[2, "U' L U2 L' U2 L U L'"]], tr('Esquina en la ranura, blanco a la derecha; arista arriba-derecha, azul arriba', 'Corner in the slot, white facing right; edge up-right, blue up', 'Quina no slot, branco à direita; aresta em cima à direita, azul em cima')),
];

const esquinaAtascada = [
  AF(1, 1, "S R' S'", [], tr('Par verde-naranja: esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, naranja arriba. Par azul-naranja: esquina en la ranura adelante-der, blanco al frente; arista arriba-derecha, naranja arriba.', 'Green-orange pair: corner up front-right, white facing front; edge up-left, orange up. Blue-orange pair: corner in the front-right slot, white facing front; edge up-right, orange up.', 'Par verde-laranja: quina em cima frente-dir, branco na frente; aresta em cima à esquerda, laranja em cima. Par azul-laranja: quina no slot frente-dir, branco na frente; aresta em cima à direita, laranja em cima.')),
  AF(2, 1, "L F' U2 F L'", [[4, "F' L U2 L' F"]], tr('Par verde-naranja: esquina en la ranura atrás-izq, blanco a la izquierda; arista arriba-atrás, naranja arriba. Par azul-rojo: esquina en la ranura adelante-der, blanco al frente; arista arriba-derecha, azul arriba.', 'Green-orange pair: corner in the back-left slot, white facing left; edge up-back, orange up. Blue-red pair: corner in the front-right slot, white facing front; edge up-right, blue up.', 'Par verde-laranja: quina no slot atrás-esq, branco à esquerda; aresta em cima atrás, laranja em cima. Par azul-vermelho: quina no slot frente-dir, branco na frente; aresta em cima à direita, azul em cima.')),
  AF(5, 1, "R U R' U L U L'", [], tr('Par verde-naranja: esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, verde arriba. Par azul-rojo: esquina en la ranura adelante-der, blanco a la derecha; arista arriba-derecha, azul arriba.', 'Green-orange pair: corner up front-right, white facing right; edge up-back, green up. Blue-red pair: corner in the front-right slot, white facing right; edge up-right, blue up.', 'Par verde-laranja: quina em cima frente-dir, branco à direita; aresta em cima atrás, verde em cima. Par azul-vermelho: quina no slot frente-dir, branco à direita; aresta em cima à direita, azul em cima.')),
  AF(6, 1, "R U R' F U F'", [], tr('Par verde-naranja: esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, verde arriba. Par verde-rojo: esquina en la ranura adelante-der, blanco a la derecha; arista arriba-derecha, rojo arriba.', 'Green-orange pair: corner up front-right, white facing right; edge up-back, green up. Green-red pair: corner in the front-right slot, white facing right; edge up-right, red up.', 'Par verde-laranja: quina em cima frente-dir, branco à direita; aresta em cima atrás, verde em cima. Par verde-vermelho: quina no slot frente-dir, branco à direita; aresta em cima à direita, vermelho em cima.')),
];
const aristaAtascada = [
  AF(10, 1, "U' R U R2 U' R", [], tr('Par verde-naranja: esquina arriba adelante-izq, blanco al frente; arista arriba-derecha, verde arriba. Par azul-naranja: esquina arriba adelante-der, blanco al frente; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up front-left, white facing front; edge up-right, green up. Blue-orange pair: corner up front-right, white facing front; edge in the front-right slot, blue facing front.', 'Par verde-laranja: quina em cima frente-esq, branco na frente; aresta em cima à direita, verde em cima. Par azul-laranja: quina em cima frente-dir, branco na frente; aresta no slot frente-dir, azul na frente.')),
  AF(11, 1, "U' R U' R' L U' L'", [[2, "U' R U' M' B' r'"]], tr('Par verde-naranja: esquina arriba atrás-izq, blanco atrás; arista arriba-izquierda, verde arriba. Par azul-rojo: esquina arriba adelante-der, blanco al frente; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up back-left, white facing back; edge up-left, green up. Blue-red pair: corner up front-right, white facing front; edge in the front-right slot, blue facing front.', 'Par verde-laranja: quina em cima atrás-esq, branco atrás; aresta em cima à esquerda, verde em cima. Par azul-vermelho: quina em cima frente-dir, branco na frente; aresta no slot frente-dir, azul na frente.')),
  AF(12, 1, "U2 R U R' L' U L", [], tr('Par verde-naranja: esquina arriba atrás-izq, blanco a la izquierda; arista arriba-adelante, verde arriba. Par verde-rojo: esquina arriba adelante-der, blanco al frente; arista en la ranura adelante-der, verde al frente.', 'Green-orange pair: corner up back-left, white facing left; edge up-front, green up. Green-red pair: corner up front-right, white facing front; edge in the front-right slot, green facing front.', 'Par verde-laranja: quina em cima atrás-esq, branco à esquerda; aresta em cima na frente, verde em cima. Par verde-vermelho: quina em cima frente-dir, branco na frente; aresta no slot frente-dir, verde na frente.')),
  AF(22, 1, "R U' R2 U R", [], tr('Par verde-naranja: esquina arriba adelante-izq, blanco a la izquierda; arista arriba-adelante, verde arriba. Par azul-naranja: esquina arriba adelante-der, blanco arriba; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up front-left, white facing left; edge up-front, green up. Blue-orange pair: corner up front-right, white facing up; edge in the front-right slot, blue facing front.', 'Par verde-laranja: quina em cima frente-esq, branco à esquerda; aresta em cima na frente, verde em cima. Par azul-laranja: quina em cima frente-dir, branco em cima; aresta no slot frente-dir, azul na frente.')),
];
const ambasAtascadas = [
  AF(25, 1, "R' F R F' U R' U2 R", [[3, "R U' R' U' f R f'"]], tr('Par verde-naranja: esquina arriba adelante-der, blanco al frente; arista arriba-derecha, verde arriba. Par azul-naranja: esquina en la ranura adelante-der, blanco abajo; arista en la ranura adelante-der, naranja al frente.', 'Green-orange pair: corner up front-right, white facing front; edge up-right, green up. Blue-orange pair: corner in the front-right slot, white facing down; edge in the front-right slot, orange facing front.', 'Par verde-laranja: quina em cima frente-dir, branco na frente; aresta em cima à direita, verde em cima. Par azul-laranja: quina no slot frente-dir, branco embaixo; aresta no slot frente-dir, laranja na frente.')),
  AF(26, 1, "L R U2 R' L'", [], tr('Par verde-naranja: esquina en la ranura atrás-izq, blanco abajo; arista en la ranura atrás-izq, verde atrás. Par azul-rojo: esquina en la ranura adelante-der, blanco abajo; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner in the back-left slot, white facing down; edge in the back-left slot, green facing back. Blue-red pair: corner in the front-right slot, white facing down; edge in the front-right slot, blue facing front.', 'Par verde-laranja: quina no slot atrás-esq, branco embaixo; aresta no slot atrás-esq, verde atrás. Par azul-vermelho: quina no slot frente-dir, branco embaixo; aresta no slot frente-dir, azul na frente.')),
  AF(27, 1, "R' F R2 U R' F'", [[2, "R U2 R' F U' F'"]], tr('Par verde-naranja: esquina arriba adelante-der, blanco al frente; arista arriba-derecha, verde arriba. Par verde-rojo: esquina en la ranura adelante-der, blanco abajo; arista en la ranura adelante-der, rojo al frente.', 'Green-orange pair: corner up front-right, white facing front; edge up-right, green up. Green-red pair: corner in the front-right slot, white facing down; edge in the front-right slot, red facing front.', 'Par verde-laranja: quina em cima frente-dir, branco na frente; aresta em cima à direita, verde em cima. Par verde-vermelho: quina no slot frente-dir, branco embaixo; aresta no slot frente-dir, vermelho na frente.')),
  AF(31, 1, "R U R' U' R U' R' U R' U' R", [[2, "R U' R' U R' U' R U' R' U R"]], tr('Par verde-naranja: esquina arriba adelante-izq, blanco a la izquierda; arista arriba-adelante, verde arriba. Par azul-naranja: esquina en la ranura adelante-der, blanco a la derecha; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up front-left, white facing left; edge up-front, green up. Blue-orange pair: corner in the front-right slot, white facing right; edge in the front-right slot, blue facing front.', 'Par verde-laranja: quina em cima frente-esq, branco à esquerda; aresta em cima na frente, verde em cima. Par azul-laranja: quina no slot frente-dir, branco à direita; aresta no slot frente-dir, azul na frente.')),
];

const libresInsercion = [
  FL(1, 2, "d R U' R'", [[1, "F' r U r'"], [3, "F' L F L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, rojo arriba', 'Corner up front-right, white facing front; edge up-right, red up', 'Quina em cima frente-dir, branco na frente; aresta em cima à direita, vermelho em cima'), TOP_NOTE("F' r U r'")),
  FL(2, 1, "U' L' U L", [[2, "L F' L' F"], [3, "r U' r' F"], [4, "U r' U' F U F' r"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, verde arriba', 'Corner up front-right, white facing right; edge up-front, green up', 'Quina em cima frente-dir, branco à direita; aresta em cima na frente, verde em cima')),
  FL(3, 1, "L' U' L", [], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, verde arriba', 'Corner up front-right, white facing front; edge up-left, green up', 'Quina em cima frente-dir, branco na frente; aresta em cima à esquerda, verde em cima')),
  FL(4, 1, "F U F'", [[3, "S' L F' L' f"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, rojo arriba', 'Corner up front-right, white facing right; edge up-back, red up', 'Quina em cima frente-dir, branco à direita; aresta em cima atrás, vermelho em cima')),
];
const libresSeparadas = [
  FL(5, 1, "U R' F r U' r' F' R", [[2, "U2 F R U R' U2 F'"], [3, "U l' U L U' L' U' l"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-atrás, rojo arriba', 'Corner up front-right, white facing front; edge up-back, red up', 'Quina em cima frente-dir, branco na frente; aresta em cima atrás, vermelho em cima')),
  FL(7, 1, "F U R U2 R' U F'", [[2, "d' L U2 L' U2 L U' L'"], [3, "U' F U2 R U' R' U F'"], [4, "l U2 L2 U' L2 U' l'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, rojo arriba', 'Corner up front-right, white facing front; edge up-left, red up', 'Quina em cima frente-dir, branco na frente; aresta em cima à esquerda, vermelho em cima')),
  FL(21, 1, "F R U2 R' F'", [[2, "l' U l U2 l' U' l"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-izquierda, rojo arriba', 'Corner up front-right, white facing up; edge up-left, red up', 'Quina em cima frente-dir, branco em cima; aresta em cima à esquerda, vermelho em cima')),
  FL(22, 1, "L' U L U2 L' U' L", [[2, "U2 L' U' L U' L' U L"], [3, "r' U' F2 U r"], [4, "U' L' U L U2 L' U L U' L' U L"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, verde arriba', 'Corner up front-right, white facing up; edge up-back, green up', 'Quina em cima frente-dir, branco em cima; aresta em cima atrás, verde em cima')),
];
const libresJuntas = [
  FL(13, 1, "U L' U L U' L' U' L", [[3, "U L' U L U' L' U L U L' U L"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, verde arriba', 'Corner up front-right, white facing front; edge up-front, green up', 'Quina em cima frente-dir, branco na frente; aresta em cima na frente, verde em cima')),
  FL(15, 1, "F U2 R U R' U F'", [[2, "L' U L U2 F U F'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, rojo arriba', 'Corner up front-right, white facing front; edge up-front, red up', 'Quina em cima frente-dir, branco na frente; aresta em cima na frente, vermelho em cima')),
  FL(16, 1, "F U' R U' R' U2 F'", [[2, "L' U' L U2 L' U L U' L' U L"], [3, "L' U2 L U' L' U' L U' L' U L"], [4, "M U' l' U l U M'"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-derecha, verde arriba', 'Corner up front-right, white facing right; edge up-right, green up', 'Quina em cima frente-dir, branco à direita; aresta em cima à direita, verde em cima')),
  FL(18, 1, "L' U2 L U L' U' L", [], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, verde arriba', 'Corner up front-right, white facing up; edge up-front, green up', 'Quina em cima frente-dir, branco em cima; aresta em cima na frente, verde em cima')),
];

// Each phase is taught as the beginner's (types.ts): the goal and its key moves, a few steps, and what to do when
// something goes wrong, folded.
export const f2lAdvanced: Method = {
  id: 'f2l-avanzado',
  name: tr('F2L avanzado', 'Advanced F2L', 'F2L avançado'),
  summary: tr('Pares a las ranuras de atrás, piezas atascadas y pares libres con menos giros.', 'Pairs into the back slots, stuck pieces and free pairs in fewer moves.', 'Pares nos slots de trás, peças presas e pares livres com menos movimentos.'),
  description: doc(
    [
      'Para cuando ya sabes los **41 casos de F2L** de CFOP completo, todos hacia la ranura adelante-derecha.',
      'Aquí resuelves cada par **donde está, sin girar el cubo**: no pierdes de vista las piezas siguientes y ahorras giros.',
      '## Las 3 fases',
      "1. **Ranuras de atrás:** insertas atrás con `R'`, `L` o `f`, en vez de `y` y el algoritmo de siempre.",
      '2. **Piezas atascadas:** una pieza de otro par ocupa tu ranura; un algoritmo resuelve los dos pares.',
      "3. **Pares libres:** a la ranura adelante-izquierda con `L'` y `F`.",
      '## Cómo aprenderlo',
      '- Empieza por los casos 1 a 4 de cada ranura de atrás: son de 3 o 4 giros.',
      '- Si dudas en un solve, gira: un `y` sin pausa es mejor que un caso a medio recordar.',
    ],
    [
      'For when you already know the **41 F2L cases** of Full CFOP, all of them into the front-right slot.',
      "Here you solve each pair **where it is, without rotating the cube**: you don't lose sight of the next pieces and you save moves.",
      '## The 3 phases',
      "1. **Back slots:** you insert at the back with `R'`, `L` or `f`, instead of `y` and the usual algorithm.",
      '2. **Stuck pieces:** a piece from another pair sits in your slot; one algorithm solves both pairs.',
      "3. **Free pairs:** into the front-left slot with `L'` and `F`.",
      '## How to learn it',
      '- Start with cases 1 to 4 of each back slot: they take 3 or 4 moves.',
      '- When in doubt during a solve, rotate: a smooth `y` beats a half-remembered case.',
    ],
    [
      'Para quando você já sabe os **41 casos de F2L** do CFOP completo, todos para o slot frente-direita.',
      'Aqui você resolve cada par **onde ele está, sem girar o cubo**: não perde de vista as próximas peças e economiza movimentos.',
      '## As 3 fases',
      "1. **Slots de trás:** você insere atrás com `R'`, `L` ou `f`, em vez de `y` e o algoritmo de sempre.",
      '2. **Peças presas:** uma peça de outro par ocupa o seu slot; um algoritmo resolve os dois pares.',
      "3. **Pares livres:** no slot frente-esquerda com `L'` e `F`.",
      '## Como aprender',
      '- Comece pelos casos 1 a 4 de cada slot de trás: têm 3 ou 4 movimentos.',
      '- Na dúvida durante uma resolução, gire: um `y` sem pausa é melhor que um caso meio lembrado.',
    ],
  ),
  orientation: doc(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** Los algoritmos se hacen siempre así.',
      'Las figuras y la animación 3D miran desde la ranura que se resuelve: **la vista gira, tú no.**',
    ],
    [
      '**White cross on the bottom, yellow on top and green in front.** The algorithms are always done like that.',
      "The figures and the 3D animation look from the slot being solved: **the view turns, you don't.**",
    ],
    [
      '**Cruz branca embaixo, amarelo em cima e verde na frente.** Os algoritmos são feitos sempre assim.',
      'As figuras e a animação 3D olham a partir do slot que está sendo resolvido: **a vista gira, você não.**',
    ],
  ),
  before: { path: '/academia/cfop-completo#academy-cfopc-f2l', label: tr('Paso previo: el F2L de CFOP completo', 'Previous step: Full CFOP\'s F2L', 'Passo anterior: o F2L do CFOP completo') },
  phases: [
    {
      id: 'f2la-atras',
      name: tr('Ranuras de atrás', 'Back slots', 'Slots de trás'),
      goal: doc(
        ['**Meta:** el par en su ranura de atrás, sin girar el cubo. 16 casos, 8 por ranura.', "**Gatillos:** `R' U' R` y `R' U R` a atrás-derecha; `L U L'` y `L U' L'` a atrás-izquierda."],
        ['**Goal:** the pair in its back slot, without rotating the cube. 16 cases, 8 per slot.', "**Triggers:** `R' U' R` and `R' U R` into back-right; `L U L'` and `L U' L'` into back-left."],
        ['**Meta:** o par no seu slot de trás, sem girar o cubo. 16 casos, 8 por slot.', "**Gatilhos:** `R' U' R` e `R' U R` para atrás-direita; `L U L'` e `L U' L'` para atrás-esquerda."],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca un par cuya ranura esté atrás y libre.',
          '2. Reconócelo como en la figura, que mira desde esa ranura: atrás-derecha, con naranja a la izquierda y azul a la derecha; atrás-izquierda, con azul a la izquierda y rojo a la derecha.',
          '3. Sin girar el cubo (verde al frente), haz el algoritmo tal cual.',
          'Los números son los de SpeedCubeDB: el mismo caso que ya conoces, en otra ranura.',
        ],
        [
          '## How to do it',
          '1. Find a pair whose slot is at the back and free.',
          '2. Recognize it as in the figure, which looks from that slot: back-right, with orange on the left and blue on the right; back-left, with blue on the left and red on the right.',
          '3. Without rotating the cube (green in front), do the algorithm as written.',
          "The numbers are SpeedCubeDB's: the same case you already know, in another slot.",
        ],
        [
          '## Como fazer',
          '1. Procure um par cujo slot esteja atrás e livre.',
          '2. Reconheça-o como na figura, que olha a partir desse slot: atrás-direita, com laranja à esquerda e azul à direita; atrás-esquerda, com azul à esquerda e vermelho à direita.',
          '3. Sem girar o cubo (verde na frente), faça o algoritmo como está.',
          'Os números são os do SpeedCubeDB: o mesmo caso que você já conhece, em outro slot.',
        ],
      ),
      tips: doc(
        [
          '- **No reconoces el caso:** la figura está girada hacia la ranura. Ponte en esa esquina: el texto del caso describe esa vista.',
          '- **El par fue a otra ranura:** giraste el cubo. Los algoritmos se hacen con verde al frente; solo la figura gira.',
          '- **Te frenas pensando:** por ahora, un `y` y el algoritmo de siempre. Usa los casos de atrás en práctica lenta hasta que salgan solos.',
        ],
        [
          "- **You don't recognize the case:** the figure is turned toward the slot. Put yourself at that corner: the case text describes that view.",
          '- **The pair went into another slot:** you rotated the cube. The algorithms are done with green in front; only the figure turns.',
          '- **You stall thinking:** for now, a `y` and the usual algorithm. Use the back cases in slow practice until they come on their own.',
        ],
        [
          '- **Não reconhece o caso:** a figura está girada para o slot. Coloque-se nessa quina: o texto do caso descreve essa vista.',
          '- **O par foi para outro slot:** você girou o cubo. Os algoritmos são feitos com verde na frente; só a figura gira.',
          '- **Você trava pensando:** por enquanto, um `y` e o algoritmo de sempre. Use os casos de trás na prática lenta até saírem sozinhos.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-atras-br',
          name: tr('Atrás-derecha', 'Back-right', 'Atrás-direita'),
          description: tr('Par naranja-azul. En SpeedCubeDB, pestaña «Back Right».', 'Orange-blue pair. On SpeedCubeDB, the "Back Right" tab.', 'Par laranja-azul. No SpeedCubeDB, aba "Back Right".'),
          cases: atrasDer,
        },
        {
          id: 'f2la-atras-bl',
          name: tr('Atrás-izquierda', 'Back-left', 'Atrás-esquerda'),
          description: tr('Par azul-rojo. En SpeedCubeDB, pestaña «Back Left».', 'Blue-red pair. On SpeedCubeDB, the "Back Left" tab.', 'Par azul-vermelho. No SpeedCubeDB, aba "Back Left".'),
          cases: atrasIzq,
        },
      ],
      progression: tr(
        [
          'Orden: **casos 1 a 4 de cada lado → el resto**.',
          'Los casos 1 a 4 son de 3 o 4 giros: apréndelos primero y úsalos ya en tus solves.',
          '## Práctica',
          'En cada solve, cuando un par esté atrás, insértalo atrás aunque vayas lento. Con la práctica sale solo.',
        ].join('\n'),
        [
          'Order: **cases 1 to 4 on each side → the rest**.',
          'Cases 1 to 4 take 3 or 4 moves: learn them first and start using them in your solves right away.',
          '## Practice',
          "In every solve, when a pair is at the back, insert it there even if it's slow. With practice it comes on its own.",
        ].join('\n'),
        [
          'Ordem: **casos 1 a 4 de cada lado → o resto**.',
          'Os casos 1 a 4 têm 3 ou 4 movimentos: aprenda primeiro e já use nas suas resoluções.',
          '## Prática',
          'Em cada resolução, quando um par estiver atrás, insira atrás mesmo que fique lento. Com a prática sai sozinho.',
        ].join('\n'),
      ),
      quizzes: [],
    },
    {
      id: 'f2la-hueco',
      name: tr('Piezas atascadas', 'Stuck pieces', 'Peças presas'),
      goal: doc(
        ['**Meta:** tu par (verde-naranja) y el otro par atascado, los dos resueltos con un solo algoritmo.', '**Casos:** 12, del set AF2L de SpeedCubeDB, todos para la ranura adelante-derecha.'],
        ['**Goal:** your pair (green-orange) and the other stuck pair, both solved with a single algorithm.', "**Cases:** 12, from SpeedCubeDB's AF2L set, all for the front-right slot."],
        ['**Meta:** o seu par (verde-laranja) e o outro par preso, os dois resolvidos com um só algoritmo.', '**Casos:** 12, do set AF2L do SpeedCubeDB, todos para o slot frente-direita.'],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Detecta el atasco: una pieza de otro par ocupa tu ranura, o la tuya está en otra. Quedan **dos pares a medio hacer**.',
          '2. Reconoce el caso: primero tu par (verde-naranja), luego el otro par sin resolver.',
          '3. Haz el algoritmo. En vez de sacar la pieza y luego resolver tu par, resuelve los dos a la vez.',
        ],
        [
          '## How to do it',
          "1. Spot the jam: a piece from another pair sits in your slot, or yours sits in another one. **Two pairs are half done**.",
          '2. Recognize the case: first your pair (green-orange), then the other unsolved pair.',
          '3. Do the algorithm. Instead of taking the piece out and then solving your pair, it solves both at once.',
        ],
        [
          '## Como fazer',
          '1. Perceba o bloqueio: uma peça de outro par ocupa o seu slot, ou a sua está em outro. Ficam **dois pares pela metade**.',
          '2. Reconheça o caso: primeiro o seu par (verde-laranja), depois o outro par sem resolver.',
          '3. Faça o algoritmo. Em vez de tirar a peça e depois resolver o seu par, ele resolve os dois de uma vez.',
        ],
      ),
      tips: doc(
        [
          "- **No recuerdas el caso:** saca la pieza con `R U R'` o `R U' R'` y sigue con el F2L de siempre.",
          '- **Quedó un par sin resolver:** el reconocimiento empieza por tu par, el verde-naranja. Comprueba que el otro par es el de la figura.',
        ],
        [
          "- **You don't remember the case:** take the piece out with `R U R'` or `R U' R'` and carry on with the usual F2L.",
          "- **One pair is left unsolved:** the recognition starts with your pair, the green-orange one. Check that the other pair is the figure's.",
        ],
        [
          "- **Não lembra o caso:** tire a peça com `R U R'` ou `R U' R'` e siga com o F2L de sempre.",
          '- **Um par ficou sem resolver:** o reconhecimento começa pelo seu par, o verde-laranja. Confira que o outro par é o da figura.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-hueco-esquina',
          name: tr('Esquina atascada', 'Stuck corner', 'Quina presa'),
          description: tr('En tu ranura hay una esquina de otro par.', 'A corner from another pair sits in your slot.', 'No seu slot há uma quina de outro par.'),
          cases: esquinaAtascada,
        },
        {
          id: 'f2la-hueco-arista',
          name: tr('Arista atascada', 'Stuck edge', 'Aresta presa'),
          description: tr('En tu ranura hay una arista de otro par.', 'An edge from another pair sits in your slot.', 'No seu slot há uma aresta de outro par.'),
          cases: aristaAtascada,
        },
        {
          id: 'f2la-hueco-ambas',
          name: tr('Par atascado', 'Stuck pair', 'Par preso'),
          description: tr('Esquina y arista de otro par en tu ranura. En `L R U2 R\' L\'` los dos pares se intercambian.', "Corner and edge of another pair in your slot. In `L R U2 R' L'` the two pairs swap.", "Quina e aresta de outro par no seu slot. Em `L R U2 R' L'` os dois pares trocam de lugar."),
          cases: ambasAtascadas,
        },
      ],
      progression: tr(
        [
          'Orden: **esquina atascada → arista atascada → par atascado**.',
          "Empieza por `S R' S'` y `L R U2 R' L'`: cortos y fáciles de reconocer.",
        ].join('\n'),
        [
          'Order: **stuck corner → stuck edge → stuck pair**.',
          "Start with `S R' S'` and `L R U2 R' L'`: short and easy to spot.",
        ].join('\n'),
        [
          'Ordem: **quina presa → aresta presa → par preso**.',
          "Comece por `S R' S'` e `L R U2 R' L'`: curtos e fáceis de reconhecer.",
        ].join('\n'),
      ),
      quizzes: [],
    },
    {
      id: 'f2la-libres',
      name: tr('Pares libres', 'Free pairs', 'Pares livres'),
      goal: doc(
        ['**Meta:** el par verde-rojo en la ranura adelante-izquierda, sin girar el cubo. 12 casos.', "**Gatillos:** `L' U' L` y `L' U L`, el espejo de `R U R'`; o por el frente, `F U F'`."],
        ['**Goal:** the green-red pair in the front-left slot, without rotating the cube. 12 cases.', "**Triggers:** `L' U' L` and `L' U L`, the mirror of `R U R'`; or through the front, `F U F'`."],
        ['**Meta:** o par verde-vermelho no slot frente-esquerda, sem girar o cubo. 12 casos.', "**Gatilhos:** `L' U' L` e `L' U L`, o espelho de `R U R'`; ou pela frente, `F U F'`."],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Esquina y arista del par verde-rojo están arriba, libres.',
          '2. Reconoce el caso como en la figura, que mira desde la esquina adelante-izquierda: **rojo a la izquierda, verde a la derecha**.',
          '3. Con verde al frente, haz el algoritmo.',
          'Con esto y las ranuras de atrás, cualquier par libre entra en su ranura sin girar el cubo.',
        ],
        [
          '## How to do it',
          '1. The corner and edge of the green-red pair are on top, free.',
          '2. Recognize the case as in the figure, which looks from the front-left corner: **red on the left, green on the right**.',
          '3. With green in front, do the algorithm.',
          'With these and the back slots, any free pair goes into its slot without rotating the cube.',
        ],
        [
          '## Como fazer',
          '1. A quina e a aresta do par verde-vermelho estão em cima, livres.',
          '2. Reconheça o caso como na figura, que olha a partir da quina frente-esquerda: **vermelho à esquerda, verde à direita**.',
          '3. Com verde na frente, faça o algoritmo.',
          'Com isso e os slots de trás, qualquer par livre entra no seu slot sem girar o cubo.',
        ],
      ),
      tips: doc(
        [
          '- **No reconoces el caso:** la figura mira desde adelante-izquierda, con el rojo a la izquierda. Ponte en esa esquina.',
          '- **El par fue a otra ranura:** giraste el cubo. Con verde al frente, haz el algoritmo tal cual.',
          '- **Te frenas pensando:** por ahora, un `y` y el algoritmo de siempre. Vuelve a estos casos en práctica lenta.',
        ],
        [
          "- **You don't recognize the case:** the figure looks from the front-left, with red on the left. Put yourself at that corner.",
          '- **The pair went into another slot:** you rotated the cube. With green in front, do the algorithm as written.',
          '- **You stall thinking:** for now, a `y` and the usual algorithm. Come back to these cases in slow practice.',
        ],
        [
          '- **Não reconhece o caso:** a figura olha a partir da frente-esquerda, com o vermelho à esquerda. Coloque-se nessa quina.',
          '- **O par foi para outro slot:** você girou o cubo. Com verde na frente, faça o algoritmo como está.',
          '- **Você trava pensando:** por enquanto, um `y` e o algoritmo de sempre. Volte a estes casos na prática lenta.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-libres-insercion',
          name: tr('Inserción directa', 'Direct insert', 'Inserção direta'),
          description: tr('El par ya está armado o a un giro. 3 o 4 movimientos.', 'The pair is already built or one turn away. 3 or 4 moves.', 'O par já está montado ou a um movimento. 3 ou 4 movimentos.'),
          cases: libresInsercion,
        },
        {
          id: 'f2la-libres-separadas',
          name: tr('Piezas separadas', 'Separated pieces', 'Peças separadas'),
          description: tr('Esquina y arista arriba, sin tocarse.', 'Corner and edge on top, not touching.', 'Quina e aresta em cima, sem se tocar.'),
          cases: libresSeparadas,
        },
        {
          id: 'f2la-libres-juntas',
          name: tr('Piezas juntas', 'Touching pieces', 'Peças juntas'),
          description: tr('Esquina y arista se tocan arriba pero no forman par.', "Corner and edge touch on top but don't form a pair.", 'Quina e aresta se tocam em cima, mas não formam par.'),
          cases: libresJuntas,
        },
      ],
      progression: tr(
        [
          'Orden: **inserción directa → piezas separadas → piezas juntas**.',
          "Los que empiezan con `F` (`F R U2 R' F'`, `F U R U2 R' U F'`) se sienten distintos: practícalos aparte.",
        ].join('\n'),
        [
          'Order: **direct insert → separated pieces → touching pieces**.',
          "The ones that start with `F` (`F R U2 R' F'`, `F U R U2 R' U F'`) feel different: practice them on their own.",
        ].join('\n'),
        [
          'Ordem: **inserção direta → peças separadas → peças juntas**.',
          "Os que começam com `F` (`F R U2 R' F'`, `F U R U2 R' U F'`) parecem diferentes: pratique esses à parte.",
        ].join('\n'),
      ),
      quizzes: [],
    },
  ],
};

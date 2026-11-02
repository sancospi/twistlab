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
  BR: ['atrás a la derecha', 'back-right', 'atrás à direita'],
  BL: ['atrás a la izquierda', 'back-left', 'atrás à esquerda'],
  FL: ['adelante a la izquierda', 'front-left', 'na frente à esquerda'],
} as const;

const TOP_NOTE = (alg: string) => tr(`El algoritmo más votado en SpeedCubeDB, \`${alg}\`, está entre las alternativas.`, `SpeedCubeDB's most-voted algorithm, \`${alg}\`, is among the alternatives.`, `O algoritmo mais votado no SpeedCubeDB, \`${alg}\`, está entre as alternativas.`);

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
  BR(1, 1, "U f R' f'", [[2, "r' U' R U M'"], [3, "d L U' L'"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el naranja arriba', 'Corner at top front-right, white facing front; edge at top right, orange facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à direita, com o laranja para cima')),
  BR(2, 1, "U' R' U R", [[2, "R f' U' f"], [3, "U2 R' U2 R"]], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el azul arriba', 'Corner at top front-right, white facing right; edge at top front, blue facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima na frente, com o azul para cima')),
  BR(3, 1, "R' U' R", [], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el azul arriba', 'Corner at top front-right, white facing front; edge at top left, blue facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à esquerda, com o azul para cima')),
  BR(4, 1, "f R f'", [], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el naranja arriba', 'Corner at top front-right, white facing right; edge at top back, orange facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima atrás, com o laranja para cima')),
  BR(13, 1, "U R' U R U' R' U' R", [[2, "U R' U R U' R' U R U R' U R"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el azul arriba', 'Corner at top front-right, white facing front; edge at top front, blue facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima na frente, com o azul para cima')),
  BR(18, 1, "R' U2 R U R' U' R", [], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba adelante, con el azul arriba', 'Corner at top front-right, white facing up; edge at top front, blue facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima na frente, com o azul para cima')),
  BR(22, 1, "R' U R U2 R' U' R", [[2, "U2 R' U' R U' R' U R"], [3, "R' F' U2 F R"], [4, "U' R' U R U2 R' U R U' R' U R"]], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el azul arriba', 'Corner at top front-right, white facing up; edge at top back, blue facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima atrás, com o azul para cima')),
  BR(29, 1, "R' U' R U R' U' R", [[2, "U R' U2 R U2 R' U' R"]], tr('Esquina en su ranura, con el blanco al frente; arista arriba adelante, con el azul arriba', 'Corner in its slot, white facing front; edge at top front, blue facing up', 'Quina no seu slot, com o branco para a frente; aresta em cima na frente, com o azul para cima')),
];
const atrasIzq = [
  BL(1, 1, "U L U' L'", [[2, "L' f U f'"], [3, "U2 L U2 L'"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el azul arriba', 'Corner at top front-right, white facing front; edge at top right, blue facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à direita, com o azul para cima')),
  BL(2, 2, "U' f' L f", [[1, "l U L' U' M'"], [3, "d' R' U R"]], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el rojo arriba', 'Corner at top front-right, white facing right; edge at top front, red facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima na frente, com o vermelho para cima'), TOP_NOTE("l U L' U' M'")),
  BL(3, 2, "f' L' f", [], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el rojo arriba', 'Corner at top front-right, white facing front; edge at top left, red facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à esquerda, com o vermelho para cima'),
    tr("El algoritmo más votado en SpeedCubeDB es `y R' U' R`, que empieza girando el cubo. Por eso aquí aprendes el segundo más votado, `f' L' f`, que no lo gira.", "SpeedCubeDB's most-voted algorithm is `y R' U' R`, which starts by rotating the cube. That's why here you learn the second most-voted one, `f' L' f`, which doesn't rotate it.", "O algoritmo mais votado no SpeedCubeDB é `y R' U' R`, que começa girando o cubo. Por isso aqui você aprende o segundo mais votado, `f' L' f`, que não o gira.")),
  BL(4, 1, "L U L'", [[2, "r B r'"]], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el azul arriba', 'Corner at top front-right, white facing right; edge at top back, blue facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima atrás, com o azul para cima')),
  BL(13, 1, "d L' U L U' L' U' L", [[3, "U f' L f U' f' L' f"], [4, "U L U' L F' L2 U' L U F U L'"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el rojo arriba', 'Corner at top front-right, white facing front; edge at top front, red facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima na frente, com o vermelho para cima')),
  BL(17, 1, "L U2 L' U' L U L'", [[2, "L U L' U' L U2 L' U2 L U L'"]], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la derecha, con el azul arriba', 'Corner at top front-right, white facing up; edge at top right, blue facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima à direita, com o azul para cima')),
  BL(22, 1, "l U' l' U2 l U l'", [[2, "f' U' L2 U f"]], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el rojo arriba', 'Corner at top front-right, white facing up; edge at top back, red facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima atrás, com o vermelho para cima')),
  BL(30, 1, "L U L' U' L U L'", [[2, "U' L U2 L' U2 L U L'"]], tr('Esquina en su ranura, con el blanco a la derecha; arista arriba a la derecha, con el azul arriba', 'Corner in its slot, white facing right; edge at top right, blue facing up', 'Quina no seu slot, com o branco para a direita; aresta em cima à direita, com o azul para cima')),
];

const esquinaAtascada = [
  AF(1, 1, "S R' S'", [], tr('Par verde-naranja: esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el naranja arriba. Par azul-naranja: esquina en la ranura de adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el naranja arriba', 'Green-orange pair: corner at top front-right, white facing front; edge at top left, orange facing up. Blue-orange pair: corner in the front-right slot, white facing front; edge at top right, orange facing up', 'Par verde-laranja: quina em cima, na frente à direita, com o branco para a frente; aresta em cima à esquerda, com o laranja para cima. Par azul-laranja: quina no slot da frente à direita, com o branco para a frente; aresta em cima à direita, com o laranja para cima')),
  AF(2, 1, "L F' U2 F L'", [[4, "F' L U2 L' F"]], tr('Par verde-naranja: esquina en la ranura de atrás a la izquierda, con el blanco a la izquierda; arista arriba atrás, con el naranja arriba. Par azul-rojo: esquina en la ranura de adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el azul arriba', 'Green-orange pair: corner in the back-left slot, white facing left; edge at top back, orange facing up. Blue-red pair: corner in the front-right slot, white facing front; edge at top right, blue facing up', 'Par verde-laranja: quina no slot de trás à esquerda, com o branco para a esquerda; aresta em cima atrás, com o laranja para cima. Par azul-vermelho: quina no slot da frente à direita, com o branco para a frente; aresta em cima à direita, com o azul para cima')),
  AF(5, 1, "R U R' U L U L'", [], tr('Par verde-naranja: esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el verde arriba. Par azul-rojo: esquina en la ranura de adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el azul arriba', 'Green-orange pair: corner at top front-right, white facing right; edge at top back, green facing up. Blue-red pair: corner in the front-right slot, white facing right; edge at top right, blue facing up', 'Par verde-laranja: quina em cima, na frente à direita, com o branco para a direita; aresta em cima atrás, com o verde para cima. Par azul-vermelho: quina no slot da frente à direita, com o branco para a direita; aresta em cima à direita, com o azul para cima')),
  AF(6, 1, "R U R' F U F'", [], tr('Par verde-naranja: esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el verde arriba. Par verde-rojo: esquina en la ranura de adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el rojo arriba', 'Green-orange pair: corner at top front-right, white facing right; edge at top back, green facing up. Green-red pair: corner in the front-right slot, white facing right; edge at top right, red facing up', 'Par verde-laranja: quina em cima, na frente à direita, com o branco para a direita; aresta em cima atrás, com o verde para cima. Par verde-vermelho: quina no slot da frente à direita, com o branco para a direita; aresta em cima à direita, com o vermelho para cima')),
];
const aristaAtascada = [
  AF(10, 1, "U' R U R2 U' R", [], tr('Par verde-naranja: esquina arriba, adelante a la izquierda, con el blanco al frente; arista arriba a la derecha, con el verde arriba. Par azul-naranja: esquina arriba, adelante a la derecha, con el blanco al frente; arista en la ranura de adelante a la derecha, con el azul al frente', 'Green-orange pair: corner at top front-left, white facing front; edge at top right, green facing up. Blue-orange pair: corner at top front-right, white facing front; edge in the front-right slot, blue facing front', 'Par verde-laranja: quina em cima, na frente à esquerda, com o branco para a frente; aresta em cima à direita, com o verde para cima. Par azul-laranja: quina em cima, na frente à direita, com o branco para a frente; aresta no slot da frente à direita, com o azul para a frente')),
  AF(11, 1, "U' R U' R' L U' L'", [[2, "U' R U' M' B' r'"]], tr('Par verde-naranja: esquina arriba, atrás a la izquierda, con el blanco atrás; arista arriba a la izquierda, con el verde arriba. Par azul-rojo: esquina arriba, adelante a la derecha, con el blanco al frente; arista en la ranura de adelante a la derecha, con el azul al frente', 'Green-orange pair: corner at top back-left, white facing back; edge at top left, green facing up. Blue-red pair: corner at top front-right, white facing front; edge in the front-right slot, blue facing front', 'Par verde-laranja: quina em cima, atrás à esquerda, com o branco para trás; aresta em cima à esquerda, com o verde para cima. Par azul-vermelho: quina em cima, na frente à direita, com o branco para a frente; aresta no slot da frente à direita, com o azul para a frente')),
  AF(12, 1, "U2 R U R' L' U L", [], tr('Par verde-naranja: esquina arriba, atrás a la izquierda, con el blanco a la izquierda; arista arriba adelante, con el verde arriba. Par verde-rojo: esquina arriba, adelante a la derecha, con el blanco al frente; arista en la ranura de adelante a la derecha, con el verde al frente', 'Green-orange pair: corner at top back-left, white facing left; edge at top front, green facing up. Green-red pair: corner at top front-right, white facing front; edge in the front-right slot, green facing front', 'Par verde-laranja: quina em cima, atrás à esquerda, com o branco para a esquerda; aresta em cima na frente, com o verde para cima. Par verde-vermelho: quina em cima, na frente à direita, com o branco para a frente; aresta no slot da frente à direita, com o verde para a frente')),
  AF(22, 1, "R U' R2 U R", [], tr('Par verde-naranja: esquina arriba, adelante a la izquierda, con el blanco a la izquierda; arista arriba adelante, con el verde arriba. Par azul-naranja: esquina arriba, adelante a la derecha, con el blanco arriba; arista en la ranura de adelante a la derecha, con el azul al frente', 'Green-orange pair: corner at top front-left, white facing left; edge at top front, green facing up. Blue-orange pair: corner at top front-right, white facing up; edge in the front-right slot, blue facing front', 'Par verde-laranja: quina em cima, na frente à esquerda, com o branco para a esquerda; aresta em cima na frente, com o verde para cima. Par azul-laranja: quina em cima, na frente à direita, com o branco para cima; aresta no slot da frente à direita, com o azul para a frente')),
];
const ambasAtascadas = [
  AF(25, 1, "R' F R F' U R' U2 R", [[3, "R U' R' U' f R f'"]], tr('Par verde-naranja: esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el verde arriba. Par azul-naranja: esquina en la ranura de adelante a la derecha, con el blanco abajo; arista en la ranura de adelante a la derecha, con el naranja al frente', 'Green-orange pair: corner at top front-right, white facing front; edge at top right, green facing up. Blue-orange pair: corner in the front-right slot, white facing down; edge in the front-right slot, orange facing front', 'Par verde-laranja: quina em cima, na frente à direita, com o branco para a frente; aresta em cima à direita, com o verde para cima. Par azul-laranja: quina no slot da frente à direita, com o branco para baixo; aresta no slot da frente à direita, com o laranja para a frente')),
  AF(26, 1, "L R U2 R' L'", [], tr('Par verde-naranja: esquina en la ranura de atrás a la izquierda, con el blanco abajo; arista en la ranura de atrás a la izquierda, con el verde atrás. Par azul-rojo: esquina en la ranura de adelante a la derecha, con el blanco abajo; arista en la ranura de adelante a la derecha, con el azul al frente', 'Green-orange pair: corner in the back-left slot, white facing down; edge in the back-left slot, green facing back. Blue-red pair: corner in the front-right slot, white facing down; edge in the front-right slot, blue facing front', 'Par verde-laranja: quina no slot de trás à esquerda, com o branco para baixo; aresta no slot de trás à esquerda, com o verde para trás. Par azul-vermelho: quina no slot da frente à direita, com o branco para baixo; aresta no slot da frente à direita, com o azul para a frente')),
  AF(27, 1, "R' F R2 U R' F'", [[2, "R U2 R' F U' F'"]], tr('Par verde-naranja: esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el verde arriba. Par verde-rojo: esquina en la ranura de adelante a la derecha, con el blanco abajo; arista en la ranura de adelante a la derecha, con el rojo al frente', 'Green-orange pair: corner at top front-right, white facing front; edge at top right, green facing up. Green-red pair: corner in the front-right slot, white facing down; edge in the front-right slot, red facing front', 'Par verde-laranja: quina em cima, na frente à direita, com o branco para a frente; aresta em cima à direita, com o verde para cima. Par verde-vermelho: quina no slot da frente à direita, com o branco para baixo; aresta no slot da frente à direita, com o vermelho para a frente')),
  AF(31, 1, "R U R' U' R U' R' U R' U' R", [[2, "R U' R' U R' U' R U' R' U R"]], tr('Par verde-naranja: esquina arriba, adelante a la izquierda, con el blanco a la izquierda; arista arriba adelante, con el verde arriba. Par azul-naranja: esquina en la ranura de adelante a la derecha, con el blanco a la derecha; arista en la ranura de adelante a la derecha, con el azul al frente', 'Green-orange pair: corner at top front-left, white facing left; edge at top front, green facing up. Blue-orange pair: corner in the front-right slot, white facing right; edge in the front-right slot, blue facing front', 'Par verde-laranja: quina em cima, na frente à esquerda, com o branco para a esquerda; aresta em cima na frente, com o verde para cima. Par azul-laranja: quina no slot da frente à direita, com o branco para a direita; aresta no slot da frente à direita, com o azul para a frente')),
];

const libresInsercion = [
  FL(1, 2, "d R U' R'", [[1, "F' r U r'"], [3, "F' L F L'"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el rojo arriba', 'Corner at top front-right, white facing front; edge at top right, red facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à direita, com o vermelho para cima'), TOP_NOTE("F' r U r'")),
  FL(2, 1, "U' L' U L", [[2, "L F' L' F"], [3, "r U' r' F"], [4, "U r' U' F U F' r"]], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el verde arriba', 'Corner at top front-right, white facing right; edge at top front, green facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima na frente, com o verde para cima')),
  FL(3, 1, "L' U' L", [], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el verde arriba', 'Corner at top front-right, white facing front; edge at top left, green facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à esquerda, com o verde para cima')),
  FL(4, 1, "F U F'", [[3, "S' L F' L' f"]], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el rojo arriba', 'Corner at top front-right, white facing right; edge at top back, red facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima atrás, com o vermelho para cima')),
];
const libresSeparadas = [
  FL(5, 1, "U R' F r U' r' F' R", [[2, "U2 F R U R' U2 F'"], [3, "U l' U L U' L' U' l"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba atrás, con el rojo arriba', 'Corner at top front-right, white facing front; edge at top back, red facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima atrás, com o vermelho para cima')),
  FL(7, 1, "F U R U2 R' U F'", [[2, "d' L U2 L' U2 L U' L'"], [3, "U' F U2 R U' R' U F'"], [4, "l U2 L2 U' L2 U' l'"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el rojo arriba', 'Corner at top front-right, white facing front; edge at top left, red facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima à esquerda, com o vermelho para cima')),
  FL(21, 1, "F R U2 R' F'", [[2, "l' U l U2 l' U' l"]], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la izquierda, con el rojo arriba', 'Corner at top front-right, white facing up; edge at top left, red facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima à esquerda, com o vermelho para cima')),
  FL(22, 1, "L' U L U2 L' U' L", [[2, "U2 L' U' L U' L' U L"], [3, "r' U' F2 U r"], [4, "U' L' U L U2 L' U L U' L' U L"]], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el verde arriba', 'Corner at top front-right, white facing up; edge at top back, green facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima atrás, com o verde para cima')),
];
const libresJuntas = [
  FL(13, 1, "U L' U L U' L' U' L", [[3, "U L' U L U' L' U L U L' U L"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el verde arriba', 'Corner at top front-right, white facing front; edge at top front, green facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima na frente, com o verde para cima')),
  FL(15, 1, "F U2 R U R' U F'", [[2, "L' U L U2 F U F'"]], tr('Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el rojo arriba', 'Corner at top front-right, white facing front; edge at top front, red facing up', 'Quina em cima, na frente à direita, com o branco para a frente; aresta em cima na frente, com o vermelho para cima')),
  FL(16, 1, "F U' R U' R' U2 F'", [[2, "L' U' L U2 L' U L U' L' U L"], [3, "L' U2 L U' L' U' L U' L' U L"], [4, "M U' l' U l U M'"]], tr('Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el verde arriba', 'Corner at top front-right, white facing right; edge at top right, green facing up', 'Quina em cima, na frente à direita, com o branco para a direita; aresta em cima à direita, com o verde para cima')),
  FL(18, 1, "L' U2 L U L' U' L", [], tr('Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba adelante, con el verde arriba', 'Corner at top front-right, white facing up; edge at top front, green facing up', 'Quina em cima, na frente à direita, com o branco para cima; aresta em cima na frente, com o verde para cima')),
];

// Each phase is taught as the beginner's (types.ts): the goal and its key moves, a few steps, and what to do when
// something goes wrong, folded.
export const f2lAdvanced: Method = {
  id: 'f2l-avanzado',
  name: tr('F2L avanzado', 'Advanced F2L', 'F2L avançado'),
  summary: tr('F2L avanzado para CFOP: mete pares en las ranuras de atrás y en la de adelante a la izquierda sin girar el cubo, y resuelve piezas atascadas.', 'Advanced F2L for CFOP: insert pairs into the back slots and the front-left one without rotating the cube, and solve stuck pieces.', 'F2L avançado para CFOP: insira pares nos slots de trás e no da frente à esquerda sem girar o cubo, e resolva peças presas.'),
  description: doc(
    [
      'Esta guía es para quien ya sabe los **41 casos de F2L** de CFOP completo, que meten cada par en la ranura de adelante a la derecha.',
      'Aquí resuelves cada par **donde está, sin girar el cubo**: no pierdes de vista las piezas siguientes y ahorras giros.',
      '## Las 3 fases',
      "1. **Ranuras de atrás:** metes el par atrás con `R'`, `L` o `f`, en vez de girar el cubo con `y` o `y2`. Son 8 casos por ranura, elegidos entre los 41.",
      '2. **Piezas atascadas:** una pieza de otro par ocupa tu ranura, y un solo algoritmo resuelve los dos pares. Son 12 casos.',
      "3. **Ranura de adelante a la izquierda:** con la esquina y la arista sueltas arriba, metes el par verde-rojo con `L'` o `F`. Son 12 casos, elegidos entre los 41.",
      '## Cómo aprenderlo',
      '- Empieza por los casos 1 a 4 de cada ranura de atrás: son de 3 o 4 giros.',
      '- Si dudas en plena resolución, gira el cubo y haz el caso de siempre: girar sin pararte es mejor que un caso a medio recordar.',
    ],
    [
      'This guide is for cubers who already know the **41 F2L cases** from Full CFOP, which insert each pair into the front-right slot.',
      "Here you solve each pair **where it is, without rotating the cube**: you don't lose sight of the next pieces and you save moves.",
      '## The 3 phases',
      "1. **Back slots:** you insert the pair at the back with `R'`, `L` or `f`, instead of rotating the cube with `y` or `y2`. There are 8 cases per slot, chosen from the 41.",
      '2. **Stuck pieces:** a piece from another pair sits in your slot, and a single algorithm solves both pairs. There are 12 cases.',
      "3. **Front-left slot:** with the corner and the edge free in the top layer, you insert the green-red pair with `L'` or `F`. There are 12 cases, chosen from the 41.",
      '## How to learn it',
      '- Start with cases 1 to 4 of each back slot: they take 3 or 4 moves.',
      '- If you hesitate mid-solve, rotate the cube and do the usual algorithm: rotating without stopping beats a half-remembered case.',
    ],
    [
      'Este guia é para quem já sabe os **41 casos de F2L** do CFOP completo, que inserem cada par no slot da frente à direita.',
      'Aqui você resolve cada par **onde ele está, sem girar o cubo**: não perde de vista as próximas peças e economiza movimentos.',
      '## As 3 fases',
      "1. **Slots de trás:** você insere o par atrás com `R'`, `L` ou `f`, em vez de girar o cubo com `y` ou `y2`. São 8 casos por slot, escolhidos entre os 41.",
      '2. **Peças presas:** uma peça de outro par ocupa o seu slot, e um só algoritmo resolve os dois pares. São 12 casos.',
      "3. **Slot da frente à esquerda:** com a quina e a aresta soltas em cima, você insere o par verde-vermelho com `L'` ou `F`. São 12 casos, escolhidos entre os 41.",
      '## Como aprender',
      '- Comece pelos casos 1 a 4 de cada slot de trás: têm 3 ou 4 movimentos.',
      '- Na dúvida no meio de uma resolução, gire o cubo e faça o caso de sempre: girar sem travar é melhor que um caso meio lembrado.',
    ],
  ),
  orientation: doc(
    [
      'Sostén el cubo con la cruz blanca abajo, el amarillo arriba y el **verde al frente**: los algoritmos se hacen siempre así.',
      'Las figuras y la animación 3D muestran siempre la ranura que resuelves adelante a la derecha: si está en otro sitio, muestran el cubo girado. El texto de cada caso describe esa vista: la vista gira, tú no.',
    ],
    [
      'Hold the cube with the white cross on the bottom, yellow on top and **green facing front**: you always do the algorithms this way.',
      "The figures and the 3D animation always show the slot you're solving at the front-right: if it's somewhere else, they show the cube rotated. Each case's text describes that view: the view rotates, your cube doesn't.",
    ],
    [
      'Segure o cubo com a cruz branca embaixo, o amarelo em cima e o **verde para a frente**: os algoritmos são feitos sempre assim.',
      'As figuras e a animação 3D mostram sempre o slot que você resolve na frente à direita: se ele estiver em outro lugar, mostram o cubo girado. O texto de cada caso descreve essa vista: a vista gira, você não.',
    ],
  ),
  before: { path: '/academia/cfop-completo#academy-cfopc-f2l', label: tr('Paso previo: el F2L de CFOP completo', 'Previous step: Full CFOP\'s F2L', 'Passo anterior: o F2L do CFOP completo') },
  phases: [
    {
      id: 'f2la-atras',
      name: tr('Ranuras de atrás', 'Back slots', 'Slots de trás'),
      goal: doc(
        ['**Meta:** el par azul-naranja en la ranura de atrás a la derecha, o el azul-rojo en la de atrás a la izquierda, sin girar el cubo. Son 16 casos, 8 por ranura, elegidos entre los 41.', "**Gatillos:** `R' U' R` y `R' U R` meten el par atrás a la derecha, y `L U L'` y `L U' L'`, atrás a la izquierda."],
        ['**Goal:** the blue-orange pair in the back-right slot, or the blue-red one in the back-left slot, without rotating the cube. There are 16 cases, 8 per slot, chosen from the 41.', "**Triggers:** `R' U' R` and `R' U R` insert the pair into the back-right slot, and `L U L'` and `L U' L'` into the back-left one."],
        ['**Meta:** o par azul-laranja no slot de trás à direita, ou o azul-vermelho no de trás à esquerda, sem girar o cubo. São 16 casos, 8 por slot, escolhidos entre os 41.', "**Gatilhos:** `R' U' R` e `R' U R` inserem o par atrás à direita, e `L U L'` e `L U' L'`, atrás à esquerda."],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca un par cuya ranura esté atrás y sin resolver.',
          '2. Reconoce el caso en la figura, que muestra el cubo girado, con esa ranura adelante a la derecha.',
          '3. Sin girar el cubo, con el verde al frente, haz el algoritmo tal cual.',
          '## Cómo leer los casos',
          'Cada caso lleva su número en SpeedCubeDB, la web de donde salen los algoritmos. El F2L 13 de atrás a la derecha es el mismo F2L 13 que ya conoces, en otra ranura.',
        ],
        [
          '## How to do it',
          '1. Find a pair whose slot is at the back and unsolved.',
          '2. Recognize the case in the figure, which shows the cube rotated, with that slot at the front-right.',
          '3. Without rotating the cube, with green facing front, do the algorithm as written.',
          '## How to read the cases',
          'Each case keeps its number from SpeedCubeDB, the website the algorithms come from. Back-right F2L 13 is the same F2L 13 you already know, just in another slot.',
        ],
        [
          '## Como fazer',
          '1. Procure um par cujo slot esteja atrás e sem resolver.',
          '2. Reconheça o caso na figura, que mostra o cubo girado, com esse slot na frente à direita.',
          '3. Sem girar o cubo, com o verde para a frente, faça o algoritmo exatamente como está.',
          '## Como ler os casos',
          'Cada caso tem o seu número no SpeedCubeDB, o site de onde vêm os algoritmos. O F2L 13 de trás à direita é o mesmo F2L 13 que você já conhece, em outro slot.',
        ],
      ),
      tips: doc(
        [
          '- **No reconoces el caso:** el texto del caso describe la figura, que tiene al frente la cara naranja (atrás a la derecha) o la azul (atrás a la izquierda). Mira tu cubo desde ese lado, sin girarlo.',
          '- **El par fue a otra ranura:** giraste el cubo para verlo como en la figura. Los algoritmos se hacen con el verde al frente: la figura está girada, tu cubo no.',
          '- **Te frenas pensando:** por ahora, gira el cubo (`y` para atrás a la derecha, `y2` para atrás a la izquierda) y haz el algoritmo de siempre. Practica los casos de atrás despacio hasta que salgan solos.',
        ],
        [
          "- **You don't recognize the case:** the case text describes the figure, which has the orange face in front (back-right) or the blue one (back-left). Look at your cube from that side, without rotating it.",
          "- **The pair went into another slot:** you rotated the cube to match the figure. Do the algorithms with green facing front: the figure is rotated, your cube isn't.",
          '- **You slow down to think:** for now, rotate the cube (`y` for back-right, `y2` for back-left) and do the usual algorithm. Practice the back cases slowly until they become automatic.',
        ],
        [
          '- **Você não reconhece o caso:** o texto do caso descreve a figura, que tem na frente a face laranja (atrás à direita) ou a azul (atrás à esquerda). Olhe o seu cubo desse lado, sem girá-lo.',
          '- **O par foi para outro slot:** você girou o cubo para vê-lo como na figura. Faça os algoritmos com o verde para a frente: a figura está girada, o seu cubo não.',
          '- **Você trava pensando:** por enquanto, gire o cubo (`y` para atrás à direita, `y2` para atrás à esquerda) e faça o algoritmo de sempre. Pratique os casos de trás devagar até saírem no automático.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-atras-br',
          name: tr('Atrás a la derecha', 'Back-right', 'Atrás à direita'),
          description: tr('Aquí metes el par azul-naranja en la ranura de atrás a la derecha. La figura de cada caso muestra el cubo con la cara naranja al frente y la azul a la derecha, y su texto describe esa vista. En SpeedCubeDB están en la pestaña «Back Right».', 'Here you insert the blue-orange pair into the back-right slot. Each case\'s figure shows the cube with the orange face in front and the blue one on the right, and its text describes that view. On SpeedCubeDB, they\'re on the "Back Right" tab.', 'Aqui você insere o par azul-laranja no slot de trás à direita. A figura de cada caso mostra o cubo com a face laranja na frente e a azul à direita, e o texto descreve essa vista. No SpeedCubeDB, estão na aba "Back Right".'),
          cases: atrasDer,
        },
        {
          id: 'f2la-atras-bl',
          name: tr('Atrás a la izquierda', 'Back-left', 'Atrás à esquerda'),
          description: tr('Aquí metes el par azul-rojo en la ranura de atrás a la izquierda. La figura de cada caso muestra el cubo con la cara azul al frente y la roja a la derecha, y su texto describe esa vista. En SpeedCubeDB están en la pestaña «Back Left».', 'Here you insert the blue-red pair into the back-left slot. Each case\'s figure shows the cube with the blue face in front and the red one on the right, and its text describes that view. On SpeedCubeDB, they\'re on the "Back Left" tab.', 'Aqui você insere o par azul-vermelho no slot de trás à esquerda. A figura de cada caso mostra o cubo com a face azul na frente e a vermelha à direita, e o texto descreve essa vista. No SpeedCubeDB, estão na aba "Back Left".'),
          cases: atrasIzq,
        },
      ],
      progression: tr(
        [
          'Orden: **casos 1 a 4 de cada ranura → el resto**.',
          'Los casos 1 a 4 son de 3 o 4 giros: apréndelos primero y úsalos ya en tus resoluciones.',
          '## Práctica',
          'En tus resoluciones de práctica, mete cada par de atrás en su ranura sin girar el cubo, aunque vayas lento. Cuando busques tu mejor tiempo y dudes, gira el cubo. Poco a poco, los casos de atrás saldrán solos.',
        ].join('\n'),
        [
          'Order: **cases 1 to 4 of each slot → the rest**.',
          'Cases 1 to 4 take 3 or 4 moves: learn them first and start using them in your solves right away.',
          '## Practice',
          "In your practice solves, insert every back pair into its slot without rotating the cube, even if it slows you down. When you're going for your best time and hesitate, rotate the cube. Little by little, the back cases will become automatic.",
        ].join('\n'),
        [
          'Ordem: **casos 1 a 4 de cada slot → o resto**.',
          'Os casos 1 a 4 têm 3 ou 4 movimentos: aprenda esses primeiro e comece já a usá-los nas suas resoluções.',
          '## Prática',
          'Nas suas resoluções de prática, insira cada par de trás no seu slot sem girar o cubo, mesmo que você fique mais lento. Quando estiver buscando o seu melhor tempo e ficar na dúvida, gire o cubo. Aos poucos, os casos de trás vão sair no automático.',
        ].join('\n'),
      ),
      quizzes: [],
    },
    {
      id: 'f2la-hueco',
      name: tr('Piezas atascadas', 'Stuck pieces', 'Peças presas'),
      goal: doc(
        ['**Meta:** tu par verde-naranja y el otro par atascado, cada uno en su ranura, con un solo algoritmo.', '**Casos:** 12 de la lista AF2L (F2L avanzado) de la web SpeedCubeDB, todos para la ranura de adelante a la derecha.'],
        ['**Goal:** your green-orange pair and the other stuck pair, each in its slot, with a single algorithm.', '**Cases:** 12 from the AF2L (Advanced F2L) list on the SpeedCubeDB website, all for the front-right slot.'],
        ['**Meta:** o seu par verde-laranja e o outro par preso, cada um no seu slot, com um só algoritmo.', '**Casos:** 12 da lista AF2L (F2L avançado) do site SpeedCubeDB, todos para o slot da frente à direita.'],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Detecta el atasco: una pieza de otro par ocupa tu ranura, la de adelante a la derecha. Quedan **dos pares sin resolver**, el tuyo y el de esa pieza.',
          '2. Reconoce el caso: primero tu par, el verde-naranja, y luego el otro par sin resolver.',
          '3. Haz el algoritmo: en vez de sacar la pieza y luego resolver tu par, resuelves los dos a la vez.',
        ],
        [
          '## How to do it',
          "1. Spot the stuck piece: a piece from another pair sits in your slot, the front-right one. That leaves **two unsolved pairs**, yours and that piece's.",
          '2. Recognize the case: first your pair, the green-orange one, and then the other unsolved pair.',
          '3. Do the algorithm: instead of taking the piece out and then solving your pair, you solve both at once.',
        ],
        [
          '## Como fazer',
          '1. Identifique a peça presa: uma peça de outro par ocupa o seu slot, o da frente à direita. Ficam **dois pares sem resolver**, o seu e o dessa peça.',
          '2. Reconheça o caso: primeiro o seu par, o verde-laranja, e depois o outro par sem resolver.',
          '3. Faça o algoritmo: em vez de tirar a peça e depois resolver o seu par, você resolve os dois de uma vez.',
        ],
      ),
      tips: doc(
        [
          "- **No recuerdas el caso:** saca las piezas atascadas con un gatillo y sigue con el F2L de siempre. Para tu ranura sirve `R U R'` o `R U' R'`.",
          '- **Quedó un par sin resolver:** el reconocimiento empieza por tu par, el verde-naranja. Comprueba que el otro par es el de la figura.',
        ],
        [
          "- **You don't remember the case:** take the stuck pieces out with a trigger and carry on with the usual F2L. For your slot, `R U R'` or `R U' R'` works.",
          "- **One pair is left unsolved:** recognition starts with your pair, the green-orange one. Check that the other pair matches the one in the figure.",
        ],
        [
          "- **Você não lembra o caso:** tire as peças presas com um gatilho e siga com o F2L de sempre. Para o seu slot, serve `R U R'` ou `R U' R'`.",
          '- **Um par ficou sem resolver:** o reconhecimento começa pelo seu par, o verde-laranja. Confira se o outro par é o da figura.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-hueco-esquina',
          name: tr('Esquina atascada', 'Stuck corner', 'Quina presa'),
          description: tr('En tu ranura, la de adelante a la derecha, hay una esquina de otro par.', 'A corner from another pair sits in your slot, the front-right one.', 'No seu slot, o da frente à direita, há uma quina de outro par.'),
          cases: esquinaAtascada,
        },
        {
          id: 'f2la-hueco-arista',
          name: tr('Arista atascada', 'Stuck edge', 'Aresta presa'),
          description: tr('En tu ranura, la de adelante a la derecha, hay una arista de otro par.', 'An edge from another pair sits in your slot, the front-right one.', 'No seu slot, o da frente à direita, há uma aresta de outro par.'),
          cases: aristaAtascada,
        },
        {
          id: 'f2la-hueco-ambas',
          name: tr('Par atascado', 'Stuck pair', 'Par preso'),
          description: tr('La esquina y la arista de otro par están en tu ranura, la de adelante a la derecha. En AF2L 26, además, tu par está en la ranura del otro, y el algoritmo los intercambia.', "The corner and the edge of another pair sit in your slot, the front-right one. In AF2L 26, your pair also sits in that pair's slot, and the algorithm swaps them.", 'A quina e a aresta de outro par estão no seu slot, o da frente à direita. No AF2L 26, além disso, o seu par está no slot do outro, e o algoritmo troca os dois.'),
          cases: ambasAtascadas,
        },
      ],
      progression: tr(
        [
          'Orden: **esquina atascada → arista atascada → par atascado**. Así empiezas con una sola pieza atascada y acabas con dos.',
          "Antes que el resto, aprende los casos AF2L 1 (`S R' S'`) y AF2L 26 (`L R U2 R' L'`): son cortos y fáciles de reconocer.",
        ].join('\n'),
        [
          'Order: **stuck corner → stuck edge → stuck pair**. That way you start with a single stuck piece and end with two.',
          "Before the rest, learn cases AF2L 1 (`S R' S'`) and AF2L 26 (`L R U2 R' L'`): they're short and easy to spot.",
        ].join('\n'),
        [
          'Ordem: **quina presa → aresta presa → par preso**. Assim você começa com uma só peça presa e termina com duas.',
          "Antes do resto, aprenda os casos AF2L 1 (`S R' S'`) e AF2L 26 (`L R U2 R' L'`): são curtos e fáceis de reconhecer.",
        ].join('\n'),
      ),
      quizzes: [],
    },
    {
      id: 'f2la-libres',
      name: tr('Ranura de adelante a la izquierda', 'Front-left slot', 'Slot da frente à esquerda'),
      goal: doc(
        ['**Meta:** el par verde-rojo en la ranura de adelante a la izquierda, sin girar el cubo. Son 12 casos, elegidos entre los 41.', "**Gatillos:** `L' U' L` y `L' U L`, los espejos de `R U R'` y `R U' R'`, meten el par por la izquierda. `F U F'` lo mete por el frente."],
        ['**Goal:** the green-red pair in the front-left slot, without rotating the cube. There are 12 cases, chosen from the 41.', "**Triggers:** `L' U' L` and `L' U L`, the mirrors of `R U R'` and `R U' R'`, insert the pair from the left. `F U F'` inserts it from the front."],
        ['**Meta:** o par verde-vermelho no slot da frente à esquerda, sem girar o cubo. São 12 casos, escolhidos entre os 41.', "**Gatilhos:** `L' U' L` e `L' U L`, os espelhos de `R U R'` e `R U' R'`, inserem o par pela esquerda. `F U F'` o insere pela frente."],
      ),
      description: doc(
        [
          'Con los 12 casos de esta ranura y los de las ranuras de atrás, muchos pares entran en su ranura sin girar el cubo. Para el resto, gira el cubo y haz el algoritmo de siempre.',
          '## Cómo se hace',
          '1. Busca el par verde-rojo, con la esquina y la arista sueltas arriba.',
          '2. Reconoce el caso en la figura, que muestra el cubo girado: la cara roja al frente y la verde a la derecha.',
          '3. Sin girar el cubo, con el verde al frente, haz el algoritmo tal cual.',
        ],
        [
          'With the 12 cases for this slot and the ones for the back slots, you can insert many pairs without rotating the cube. For the rest, rotate the cube and do the usual algorithm.',
          '## How to do it',
          '1. Find the green-red pair, with the corner and the edge free in the top layer.',
          '2. Recognize the case in the figure, which shows the cube rotated: the red face in front and the green one on the right.',
          '3. Without rotating the cube, with green facing front, do the algorithm as written.',
        ],
        [
          'Com os 12 casos deste slot e os dos slots de trás, muitos pares entram no seu slot sem girar o cubo. Para o resto, gire o cubo e faça o algoritmo de sempre.',
          '## Como fazer',
          '1. Procure o par verde-vermelho, com a quina e a aresta soltas em cima.',
          '2. Reconheça o caso na figura, que mostra o cubo girado: a face vermelha na frente e a verde à direita.',
          '3. Sem girar o cubo, com o verde para a frente, faça o algoritmo exatamente como está.',
        ],
      ),
      tips: doc(
        [
          '- **No reconoces el caso:** el texto del caso describe la figura, que tiene al frente la cara roja. Mira tu cubo desde ese lado, sin girarlo.',
          '- **El par fue a otra ranura:** giraste el cubo para verlo como en la figura. Haz el algoritmo tal cual, con el verde al frente.',
          "- **Te frenas pensando:** por ahora, gira el cubo con `y'` y haz el algoritmo de siempre. Practica estos casos despacio hasta que salgan solos.",
        ],
        [
          "- **You don't recognize the case:** the case text describes the figure, which has the red face in front. Look at your cube from that side, without rotating it.",
          '- **The pair went into another slot:** you rotated the cube to match the figure. Do the algorithm as written, with green facing front.',
          "- **You slow down to think:** for now, rotate the cube with `y'` and do the usual algorithm. Practice these cases slowly until they become automatic.",
        ],
        [
          '- **Você não reconhece o caso:** o texto do caso descreve a figura, que tem na frente a face vermelha. Olhe o seu cubo desse lado, sem girá-lo.',
          '- **O par foi para outro slot:** você girou o cubo para vê-lo como na figura. Faça o algoritmo exatamente como está, com o verde para a frente.',
          "- **Você trava pensando:** por enquanto, gire o cubo com `y'` e faça o algoritmo de sempre. Pratique estes casos devagar até saírem no automático.",
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-libres-insercion',
          name: tr('Inserción directa', 'Direct insert', 'Inserção direta'),
          description: tr('En los 4 casos de inserción directa, un solo gatillo de 3 giros junta y mete el par verde-rojo, a veces con un giro antes: 3 o 4 giros en total.', 'In the 4 direct-insert cases, a single 3-move trigger joins and inserts the green-red pair, sometimes with one move first: 3 or 4 moves in total.', 'Nos 4 casos de inserção direta, um só gatilho de 3 movimentos junta e insere o par verde-vermelho, às vezes com um movimento antes: 3 ou 4 movimentos no total.'),
          cases: libresInsercion,
        },
        {
          id: 'f2la-libres-separadas',
          name: tr('Piezas separadas', 'Separated pieces', 'Peças separadas'),
          description: tr('La esquina y la arista del par verde-rojo están arriba, sin tocarse.', 'The corner and the edge of the green-red pair are on top, not touching.', 'A quina e a aresta do par verde-vermelho estão em cima, sem se tocar.'),
          cases: libresSeparadas,
        },
        {
          id: 'f2la-libres-juntas',
          name: tr('Piezas juntas', 'Touching pieces', 'Peças juntas'),
          description: tr('La esquina y la arista del par verde-rojo se tocan arriba, pero todavía no forman par.', "The corner and the edge of the green-red pair touch on top, but they don't form a pair yet.", 'A quina e a aresta do par verde-vermelho se tocam em cima, mas ainda não formam par.'),
          cases: libresJuntas,
        },
      ],
      progression: tr(
        [
          'Orden: **inserción directa → piezas separadas → piezas juntas**. Los casos de inserción directa son de 3 o 4 giros: con ellos te acostumbras a meter pares en esta ranura.',
          'Cinco casos empiezan con `F` (F2L 4, 7, 15, 16 y 21): abren la ranura por el frente, no por la izquierda, así que practícalos aparte.',
        ].join('\n'),
        [
          'Order: **direct insert → separated pieces → touching pieces**. The direct-insert cases take 3 or 4 moves: they get you used to inserting pairs into this slot.',
          'Five cases start with `F` (F2L 4, 7, 15, 16 and 21): they open the slot from the front, not from the left, so practice them separately.',
        ].join('\n'),
        [
          'Ordem: **inserção direta → peças separadas → peças juntas**. Os casos de inserção direta têm 3 ou 4 movimentos: com eles você se acostuma a inserir pares neste slot.',
          'Cinco casos começam com `F` (F2L 4, 7, 15, 16 e 21): abrem o slot pela frente, não pela esquerda, então pratique esses à parte.',
        ].join('\n'),
      ),
      quizzes: [],
    },
  ],
};

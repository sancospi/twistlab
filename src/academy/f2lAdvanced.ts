// "F2L avanzado": F2L beyond the front-right slot: pairs into the back slots, pieces stuck in another slot, and free
// pairs solved efficiently. Stage 'f2l' (all four slots solved), so a case may target any slot; the iso figure turns
// to the slot being solved (diagram.ts). Case ids: f2la-<slug>.
// Algorithms from SpeedCubeDB (fetched 2026-10-22): F2L's Back Right / Back Left / Front Left tabs, and the Advanced F2L
// set (AF2L, Front Right tab). Main = the site's #1 for that slot, except: an alg with a rotation (BL 3) or one whose
// state the figure would draw from another slot (BL 2, FL 1: a tie in diagram.ts's view pick) gives way to the next.
// Extras: the next ones on the list, at most 3, without rotations, with votes, at most twice the main's length, and
// that solve every slot here (many AF2L alternatives leave the other pair unsolved, so they are out).
// Recognition = the state as the figure shows it (turned to the slot); the algorithms are done with green in front.
import type { Localized } from '../i18n.ts';
import type { Case, Method } from './types.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { scdbUrl } from './scdb.ts';

const tr = (es: string, en: string): Localized => ({ es, en });

const SLOT = {
  BR: ['atrás-derecha', 'back-right'],
  BL: ['atrás-izquierda', 'back-left'],
  FL: ['adelante-izquierda', 'front-left'],
} as const;

const TOP_NOTE = (alg: string) => tr(`La más votada en SpeedCubeDB es \`${alg}\` (está entre las alternativas).`, `SpeedCubeDB's most voted is \`${alg}\` (it's among the alternatives).`);

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
  kase(`f2la-${slot.toLowerCase()}-${String(n).padStart(2, '0')}`, `${slot}${n}`, tr(`F2L ${n} · ${SLOT[slot][0]}`, `F2L ${n} · ${SLOT[slot][1]}`),
    { set: 'F2L', id: String(n), url: scdbUrl('F2L', String(n)) }, rank, alg, alts, recognition, note);
const BR = pair('BR'), BL = pair('BL'), FL = pair('FL');
const AF = (n: number, rank: number, alg: string, alts: [number, string][], recognition: Localized) =>
  kase(`f2la-af2l-${String(n).padStart(2, '0')}`, `AF${n}`, tr(`AF2L ${n}`, `AF2L ${n}`), { set: 'AdvancedF2L', id: `AF2L_${n}`, url: scdbUrl('AdvancedF2L', `AF2L_${n}`) }, rank, alg, alts, recognition);

const atrasDer = [
  BR(1, 1, "U f R' f'", [[2, "r' U' R U M'"], [3, "d L U' L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, naranja arriba', 'Corner up front-right, white facing front; edge up-right, orange up')),
  BR(2, 1, "U' R' U R", [[2, "R f' U' f"], [3, "U2 R' U2 R"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, azul arriba', 'Corner up front-right, white facing right; edge up-front, blue up')),
  BR(3, 1, "R' U' R", [], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, azul arriba', 'Corner up front-right, white facing front; edge up-left, blue up')),
  BR(4, 1, "f R f'", [], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, naranja arriba', 'Corner up front-right, white facing right; edge up-back, orange up')),
  BR(13, 1, "U R' U R U' R' U' R", [[2, "U R' U R U' R' U R U R' U R"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, azul arriba', 'Corner up front-right, white facing front; edge up-front, blue up')),
  BR(18, 1, "R' U2 R U R' U' R", [], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, azul arriba', 'Corner up front-right, white facing up; edge up-front, blue up')),
  BR(22, 1, "R' U R U2 R' U' R", [[2, "U2 R' U' R U' R' U R"], [3, "R' F' U2 F R"], [4, "U' R' U R U2 R' U R U' R' U R"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, azul arriba', 'Corner up front-right, white facing up; edge up-back, blue up')),
  BR(29, 1, "R' U' R U R' U' R", [[2, "U R' U2 R U2 R' U' R"]], tr('Esquina en la ranura, blanco al frente; arista arriba-adelante, azul arriba', 'Corner in the slot, white facing front; edge up-front, blue up')),
];
const atrasIzq = [
  BL(1, 1, "U L U' L'", [[2, "L' f U f'"], [3, "U2 L U2 L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, azul arriba', 'Corner up front-right, white facing front; edge up-right, blue up')),
  BL(2, 2, "U' f' L f", [[1, "l U L' U' M'"], [3, "d' R' U R"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, rojo arriba', 'Corner up front-right, white facing right; edge up-front, red up'), TOP_NOTE("l U L' U' M'")),
  BL(3, 2, "f' L' f", [], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, rojo arriba', 'Corner up front-right, white facing front; edge up-left, red up'),
    tr("La más votada en SpeedCubeDB es `y R' U' R`: gira el cubo. Esta es la versión sin girar.", "SpeedCubeDB's most voted is `y R' U' R`: it rotates the cube. This is the version without the rotation.")),
  BL(4, 1, "L U L'", [[2, "r B r'"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, azul arriba', 'Corner up front-right, white facing right; edge up-back, blue up')),
  BL(13, 1, "d L' U L U' L' U' L", [[3, "U f' L f U' f' L' f"], [4, "U L U' L F' L2 U' L U F U L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, rojo arriba', 'Corner up front-right, white facing front; edge up-front, red up')),
  BL(17, 1, "L U2 L' U' L U L'", [[2, "L U L' U' L U2 L' U2 L U L'"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-derecha, azul arriba', 'Corner up front-right, white facing up; edge up-right, blue up')),
  BL(22, 1, "l U' l' U2 l U l'", [[2, "f' U' L2 U f"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, rojo arriba', 'Corner up front-right, white facing up; edge up-back, red up')),
  BL(30, 1, "L U L' U' L U L'", [[2, "U' L U2 L' U2 L U L'"]], tr('Esquina en la ranura, blanco a la derecha; arista arriba-derecha, azul arriba', 'Corner in the slot, white facing right; edge up-right, blue up')),
];

const esquinaAtascada = [
  AF(1, 1, "S R' S'", [], tr('Par verde-naranja: esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, naranja arriba. Par azul-naranja: esquina en la ranura adelante-der, blanco al frente; arista arriba-derecha, naranja arriba.', 'Green-orange pair: corner up front-right, white facing front; edge up-left, orange up. Blue-orange pair: corner in the front-right slot, white facing front; edge up-right, orange up.')),
  AF(2, 1, "L F' U2 F L'", [[4, "F' L U2 L' F"]], tr('Par verde-naranja: esquina en la ranura atrás-izq, blanco a la izquierda; arista arriba-atrás, naranja arriba. Par azul-rojo: esquina en la ranura adelante-der, blanco al frente; arista arriba-derecha, azul arriba.', 'Green-orange pair: corner in the back-left slot, white facing left; edge up-back, orange up. Blue-red pair: corner in the front-right slot, white facing front; edge up-right, blue up.')),
  AF(5, 1, "R U R' U L U L'", [], tr('Par verde-naranja: esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, verde arriba. Par azul-rojo: esquina en la ranura adelante-der, blanco a la derecha; arista arriba-derecha, azul arriba.', 'Green-orange pair: corner up front-right, white facing right; edge up-back, green up. Blue-red pair: corner in the front-right slot, white facing right; edge up-right, blue up.')),
  AF(6, 1, "R U R' F U F'", [], tr('Par verde-naranja: esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, verde arriba. Par verde-rojo: esquina en la ranura adelante-der, blanco a la derecha; arista arriba-derecha, rojo arriba.', 'Green-orange pair: corner up front-right, white facing right; edge up-back, green up. Green-red pair: corner in the front-right slot, white facing right; edge up-right, red up.')),
];
const aristaAtascada = [
  AF(10, 1, "U' R U R2 U' R", [], tr('Par verde-naranja: esquina arriba adelante-izq, blanco al frente; arista arriba-derecha, verde arriba. Par azul-naranja: esquina arriba adelante-der, blanco al frente; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up front-left, white facing front; edge up-right, green up. Blue-orange pair: corner up front-right, white facing front; edge in the front-right slot, blue facing front.')),
  AF(11, 1, "U' R U' R' L U' L'", [[2, "U' R U' M' B' r'"]], tr('Par verde-naranja: esquina arriba atrás-izq, blanco atrás; arista arriba-izquierda, verde arriba. Par azul-rojo: esquina arriba adelante-der, blanco al frente; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up back-left, white facing back; edge up-left, green up. Blue-red pair: corner up front-right, white facing front; edge in the front-right slot, blue facing front.')),
  AF(12, 1, "U2 R U R' L' U L", [], tr('Par verde-naranja: esquina arriba atrás-izq, blanco a la izquierda; arista arriba-adelante, verde arriba. Par verde-rojo: esquina arriba adelante-der, blanco al frente; arista en la ranura adelante-der, verde al frente.', 'Green-orange pair: corner up back-left, white facing left; edge up-front, green up. Green-red pair: corner up front-right, white facing front; edge in the front-right slot, green facing front.')),
  AF(22, 1, "R U' R2 U R", [], tr('Par verde-naranja: esquina arriba adelante-izq, blanco a la izquierda; arista arriba-adelante, verde arriba. Par azul-naranja: esquina arriba adelante-der, blanco arriba; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up front-left, white facing left; edge up-front, green up. Blue-orange pair: corner up front-right, white facing up; edge in the front-right slot, blue facing front.')),
];
const ambasAtascadas = [
  AF(25, 1, "R' F R F' U R' U2 R", [[3, "R U' R' U' f R f'"]], tr('Par verde-naranja: esquina arriba adelante-der, blanco al frente; arista arriba-derecha, verde arriba. Par azul-naranja: esquina en la ranura adelante-der, blanco abajo; arista en la ranura adelante-der, naranja al frente.', 'Green-orange pair: corner up front-right, white facing front; edge up-right, green up. Blue-orange pair: corner in the front-right slot, white facing down; edge in the front-right slot, orange facing front.')),
  AF(26, 1, "L R U2 R' L'", [], tr('Par verde-naranja: esquina en la ranura atrás-izq, blanco abajo; arista en la ranura atrás-izq, verde atrás. Par azul-rojo: esquina en la ranura adelante-der, blanco abajo; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner in the back-left slot, white facing down; edge in the back-left slot, green facing back. Blue-red pair: corner in the front-right slot, white facing down; edge in the front-right slot, blue facing front.')),
  AF(27, 1, "R' F R2 U R' F'", [[2, "R U2 R' F U' F'"]], tr('Par verde-naranja: esquina arriba adelante-der, blanco al frente; arista arriba-derecha, verde arriba. Par verde-rojo: esquina en la ranura adelante-der, blanco abajo; arista en la ranura adelante-der, rojo al frente.', 'Green-orange pair: corner up front-right, white facing front; edge up-right, green up. Green-red pair: corner in the front-right slot, white facing down; edge in the front-right slot, red facing front.')),
  AF(31, 1, "R U R' U' R U' R' U R' U' R", [[2, "R U' R' U R' U' R U' R' U R"]], tr('Par verde-naranja: esquina arriba adelante-izq, blanco a la izquierda; arista arriba-adelante, verde arriba. Par azul-naranja: esquina en la ranura adelante-der, blanco a la derecha; arista en la ranura adelante-der, azul al frente.', 'Green-orange pair: corner up front-left, white facing left; edge up-front, green up. Blue-orange pair: corner in the front-right slot, white facing right; edge in the front-right slot, blue facing front.')),
];

const libresInsercion = [
  FL(1, 2, "d R U' R'", [[1, "F' r U r'"], [3, "F' L F L'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, rojo arriba', 'Corner up front-right, white facing front; edge up-right, red up'), TOP_NOTE("F' r U r'")),
  FL(2, 1, "U' L' U L", [[2, "L F' L' F"], [3, "r U' r' F"], [4, "U r' U' F U F' r"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, verde arriba', 'Corner up front-right, white facing right; edge up-front, green up')),
  FL(3, 1, "L' U' L", [], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, verde arriba', 'Corner up front-right, white facing front; edge up-left, green up')),
  FL(4, 1, "F U F'", [[3, "S' L F' L' f"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, rojo arriba', 'Corner up front-right, white facing right; edge up-back, red up')),
];
const libresSeparadas = [
  FL(5, 1, "U R' F r U' r' F' R", [[2, "U2 F R U R' U2 F'"], [3, "U l' U L U' L' U' l"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-atrás, rojo arriba', 'Corner up front-right, white facing front; edge up-back, red up')),
  FL(7, 1, "F U R U2 R' U F'", [[2, "d' L U2 L' U2 L U' L'"], [3, "U' F U2 R U' R' U F'"], [4, "l U2 L2 U' L2 U' l'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, rojo arriba', 'Corner up front-right, white facing front; edge up-left, red up')),
  FL(21, 1, "F R U2 R' F'", [[2, "l' U l U2 l' U' l"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-izquierda, rojo arriba', 'Corner up front-right, white facing up; edge up-left, red up')),
  FL(22, 1, "L' U L U2 L' U' L", [[2, "U2 L' U' L U' L' U L"], [3, "r' U' F2 U r"], [4, "U' L' U L U2 L' U L U' L' U L"]], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, verde arriba', 'Corner up front-right, white facing up; edge up-back, green up')),
];
const libresJuntas = [
  FL(13, 1, "U L' U L U' L' U' L", [[3, "U L' U L U' L' U L U L' U L"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, verde arriba', 'Corner up front-right, white facing front; edge up-front, green up')),
  FL(15, 1, "F U2 R U R' U F'", [[2, "L' U L U2 F U F'"]], tr('Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, rojo arriba', 'Corner up front-right, white facing front; edge up-front, red up')),
  FL(16, 1, "F U' R U' R' U2 F'", [[2, "L' U' L U2 L' U L U' L' U L"], [3, "L' U2 L U' L' U' L U' L' U L"], [4, "M U' l' U l U M'"]], tr('Esquina arriba adelante-der, blanco a la derecha; arista arriba-derecha, verde arriba', 'Corner up front-right, white facing right; edge up-right, green up')),
  FL(18, 1, "L' U2 L U L' U' L", [], tr('Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, verde arriba', 'Corner up front-right, white facing up; edge up-front, green up')),
];

export const f2lAdvanced: Method = {
  id: 'f2l-avanzado',
  name: tr('F2L avanzado', 'Advanced F2L'),
  summary: tr('Pares a las ranuras de atrás, piezas atascadas y pares libres con menos giros.', 'Pairs into the back slots, stuck pieces and free pairs in fewer moves.'),
  description: tr(
    [
      'Para cuando ya sabes los **41 casos de F2L** de CFOP completo. Allí todos van a la ranura adelante-derecha.',
      'En un solve real, el par que encuentras no siempre está ahí. Este método enseña a resolverlo donde está.',
      '## Tres ideas',
      '1. **Ranuras de atrás sin girar.** En vez de `y` y el algoritmo de siempre, insertas atrás con `R\'`, `L` o `f`.',
      '2. **Piezas atascadas.** Una pieza de otro par ocupa tu ranura. Un solo algoritmo resuelve los dos pares.',
      '3. **Pares libres adelante-izquierda.** Con `L\'` y `F`, sin `y`.',
      '## Por qué',
      '- **Anticipación:** cada `y` te hace perder de vista las piezas que estabas siguiendo.',
      '- **Menos giros:** una rotación no resuelve nada; un algoritmo directo ahorra tiempo.',
      '## Cuándo usarlo',
      '- Si el par está atrás y su ranura está libre, insértalo atrás.',
      '- Si una pieza está atascada, busca el caso antes de sacarla a mano.',
      '- Si dudas, gira: un `y` sin pausa es mejor que un caso a medio recordar.',
      'No hace falta aprenderlo todo: empieza por los casos 1 a 4 de cada ranura de atrás.',
    ].join('\n'),
    [
      'For when you already know the **41 F2L cases** of Full CFOP. There, they all go into the front-right slot.',
      "In a real solve, the pair you find isn't always there. This method teaches you to solve it where it is.",
      '## Three ideas',
      "1. **Back slots without rotating.** Instead of `y` and the usual algorithm, you insert at the back with `R'`, `L` or `f`.",
      '2. **Stuck pieces.** A piece from another pair sits in your slot. A single algorithm solves both pairs.',
      "3. **Free pairs into the front-left.** With `L'` and `F`, no `y`.",
      '## Why',
      '- **Look-ahead:** every `y` makes you lose track of the pieces you were following.',
      "- **Fewer moves:** a rotation doesn't solve anything; a direct algorithm saves time.",
      '## When to use it',
      '- If the pair is at the back and its slot is free, insert it at the back.',
      '- If a piece is stuck, look for the case before taking it out by hand.',
      "- When in doubt, rotate: a smooth `y` beats a half-remembered case.",
      "You don't need to learn it all: start with cases 1 to 4 of each back slot.",
    ].join('\n'),
  ),
  orientation: tr(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** Los algoritmos se hacen siempre así.',
      'Las figuras y la animación 3D miran desde la ranura que se resuelve: **la vista gira, tú no.**',
    ].join('\n'),
    [
      '**White cross on the bottom, yellow on top and green in front.** The algorithms are always done like that.',
      "The figures and the 3D animation look from the slot being solved: **the view turns, you don't.**",
    ].join('\n'),
  ),
  before: { path: '/academia/cfop-completo#academy-cfopc-f2l', label: tr('Paso previo: el F2L de CFOP completo', 'Previous step: Full CFOP\'s F2L') },
  phases: [
    {
      id: 'f2la-atras',
      name: tr('Ranuras de atrás', 'Back slots'),
      description: tr(
        [
          '**16 casos** de los 41 de F2L, insertados atrás sin girar el cubo. Las ranuras de adelante ya están resueltas.',
          '## Cómo leer la figura',
          'La figura (y la animación 3D) mira desde la esquina de la ranura que se resuelve:',
          '- **Atrás-derecha:** naranja a la izquierda, azul a la derecha.',
          '- **Atrás-izquierda:** azul a la izquierda, rojo a la derecha.',
          'El reconocimiento describe esa vista. Tú sigues con **verde al frente** y haces el algoritmo tal cual.',
          '## Los gatillos de atrás',
          "- Atrás-derecha: `R' U' R` y `R' U R`, el espejo de `R U R'`. También `f R f'`.",
          "- Atrás-izquierda: `L U L'` y `L U' L'`. También `f' L' f`.",
          'Los números son los de SpeedCubeDB: el mismo caso que ya conoces, en otra ranura.',
        ].join('\n'),
        [
          '**16 cases** out of the 41 F2L, inserted at the back without rotating the cube. The front slots are already solved.',
          '## How to read the figure',
          'The figure (and the 3D animation) looks from the corner of the slot being solved:',
          '- **Back-right:** orange on the left, blue on the right.',
          '- **Back-left:** blue on the left, red on the right.',
          'The recognition describes that view. You keep **green in front** and do the algorithm as written.',
          '## The back triggers',
          "- Back-right: `R' U' R` and `R' U R`, the mirror of `R U R'`. Also `f R f'`.",
          "- Back-left: `L U L'` and `L U' L'`. Also `f' L' f`.",
          'The numbers are SpeedCubeDB\'s: the same case you already know, in another slot.',
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-atras-br',
          name: tr('Atrás-derecha', 'Back-right'),
          description: tr('Par naranja-azul. En SpeedCubeDB, pestaña «Back Right».', 'Orange-blue pair. On SpeedCubeDB, the "Back Right" tab.'),
          cases: atrasDer,
        },
        {
          id: 'f2la-atras-bl',
          name: tr('Atrás-izquierda', 'Back-left'),
          description: tr('Par azul-rojo. En SpeedCubeDB, pestaña «Back Left».', 'Blue-red pair. On SpeedCubeDB, the "Back Left" tab.'),
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
      ),
      quizzes: [],
    },
    {
      id: 'f2la-hueco',
      name: tr('Piezas atascadas', 'Stuck pieces'),
      description: tr(
        [
          '**12 casos** del set Advanced F2L de SpeedCubeDB (AF2L). Todos para la ranura **adelante-derecha** (par verde-naranja).',
          'Una pieza de otro par está en tu ranura, o la tuya está en otra. Quedan **dos pares a medio hacer**.',
          '## La idea',
          'Lo intuitivo son dos pasos: sacar la pieza con un gatillo y luego resolver tu par.',
          'El algoritmo lo hace a la vez: **los dos pares quedan resueltos**.',
          '## Cómo leer el reconocimiento',
          'Primero tu par (verde-naranja), luego el otro par que no está resuelto.',
          'Si no recuerdas el caso, saca la pieza con `R U R\'` o `R U\' R\'` y sigue con el F2L de siempre.',
        ].join('\n'),
        [
          '**12 cases** from SpeedCubeDB\'s Advanced F2L set (AF2L). All for the **front-right** slot (green-orange pair).',
          'A piece from another pair sits in your slot, or yours sits in another one. **Two pairs are half done**.',
          '## The idea',
          'The intuitive way takes two steps: get the piece out with a trigger, then solve your pair.',
          'The algorithm does both at once: **both pairs end up solved**.',
          '## How to read the recognition',
          'First your pair (green-orange), then the other pair that is not solved.',
          "If you don't remember the case, take the piece out with `R U R'` or `R U' R'` and carry on with the usual F2L.",
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-hueco-esquina',
          name: tr('Esquina atascada', 'Stuck corner'),
          description: tr('En tu ranura hay una esquina de otro par.', 'A corner from another pair sits in your slot.'),
          cases: esquinaAtascada,
        },
        {
          id: 'f2la-hueco-arista',
          name: tr('Arista atascada', 'Stuck edge'),
          description: tr('En tu ranura hay una arista de otro par.', 'An edge from another pair sits in your slot.'),
          cases: aristaAtascada,
        },
        {
          id: 'f2la-hueco-ambas',
          name: tr('Par atascado', 'Stuck pair'),
          description: tr('Esquina y arista de otro par en tu ranura. En `L R U2 R\' L\'`, tu par está en la otra ranura: se intercambian.', "Corner and edge of another pair in your slot. In `L R U2 R' L'`, your pair is in the other slot: they swap."),
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
      ),
      quizzes: [],
    },
    {
      id: 'f2la-libres',
      name: tr('Pares libres', 'Free pairs'),
      description: tr(
        [
          '**12 casos** con esquina y arista libres arriba, para la ranura **adelante-izquierda** (par verde-rojo). Sin `y`.',
          '## Cómo leer la figura',
          'La figura mira desde la esquina adelante-izquierda: **rojo a la izquierda, verde a la derecha**.',
          'Tú sigues con verde al frente.',
          '## Los gatillos de la izquierda',
          "- `L' U' L` y `L' U L`: el espejo de `R U R'`.",
          "- `F U F'` y `F R U2 R' F'`: entran por el frente, sin pasar por la izquierda.",
          'Con esto y las ranuras de atrás, cualquier par libre entra en su ranura sin girar el cubo.',
        ].join('\n'),
        [
          '**12 cases** with corner and edge free on top, for the **front-left** slot (green-red pair). No `y`.',
          '## How to read the figure',
          'The figure looks from the front-left corner: **red on the left, green on the right**.',
          'You keep green in front.',
          '## The left triggers',
          "- `L' U' L` and `L' U L`: the mirror of `R U R'`.",
          "- `F U F'` and `F R U2 R' F'`: they go in from the front, without using the left face.",
          'With these and the back slots, any free pair goes into its slot without rotating the cube.',
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2la-libres-insercion',
          name: tr('Inserción directa', 'Direct insert'),
          description: tr('El par ya está armado o a un giro. 3 o 4 movimientos.', 'The pair is already built or one turn away. 3 or 4 moves.'),
          cases: libresInsercion,
        },
        {
          id: 'f2la-libres-separadas',
          name: tr('Piezas separadas', 'Separated pieces'),
          description: tr('Esquina y arista arriba, sin tocarse.', 'Corner and edge on top, not touching.'),
          cases: libresSeparadas,
        },
        {
          id: 'f2la-libres-juntas',
          name: tr('Piezas juntas', 'Touching pieces'),
          description: tr('Esquina y arista se tocan arriba pero no forman par.', "Corner and edge touch on top but don't form a pair."),
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
      ),
      quizzes: [],
    },
  ],
};

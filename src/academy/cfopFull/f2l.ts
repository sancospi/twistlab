// CFOP completo, F2L: los 41 casos de SpeedCubeDB (ids cfopc-f2l-01…41), todos para la ranura adelante-derecha.
// Main = SpeedCubeDB's #1 for Front Right; extras = the next ones on its list (fetched 2026-10-21), at most 3, each
// with the U turn it needs here. Left out: algs that don't solve the case in the simulator, 0 votes, over twice the
// main alg's length, or the same face turns as a variant already kept (the rotation-free version wins). The 3 mains
// that start with y' (13, 18, 20) also keep SpeedCubeDB's version without the y' (d or F turns), the reducido's Plan B.
// Setup = the main alg undone (face turns when it has a rotation). Recognition = the state right after the setup.
import type { Localized } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { scdbUrl } from '../scdb.ts';

const es = (text: string): Localized => ({ es: text });

const Y_NOTE = 'Empieza con y′: giras todo el cubo y el par se inserta con la mano derecha. Si no quieres rotar, tienes una alternativa sin y′.';

/** n = SpeedCubeDB's F2L number; reduced = the same case's code in CFOP reducido. */
function F2L(n: number, recognition: string, alg: string, setup: string, alts: [number, string][], y = false, reduced?: string): Case {
  const note = [y ? Y_NOTE : '', reduced ? `Es el caso ${reduced} del CFOP reducido.` : ''].filter(Boolean).join(' ');
  const code = String(n).padStart(2, '0');
  return {
    id: `cfopc-f2l-${code}`,
    code,
    name: es(`F2L ${n}`),
    recognition: es(recognition),
    stage: 'f2l',
    algs: [
      { id: 'main', alg, source: 'speedcubedb', rank: 1 },
      ...alts.map(([rank, a]) => ({ id: `scdb-${rank}`, alg: a, source: 'speedcubedb' as const, rank })),
    ],
    setup,
    scdb: { set: 'F2L', id: String(n), url: scdbUrl('F2L', String(n)) },
    ...(note ? { note: es(note) } : {}),
  };
}

const libres = [
  F2L(1, 'Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, verde arriba', "U R U' R'", "R U R' U'", [[2, "R' F R F'"], [3, "y' r' U' R U M'"], [4, "y U F' L F L2 U L"]], false, 'A1'),
  F2L(2, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, naranja arriba', "F R' F' R", "R' F R F'", [[3, "U' F' U F"]], false, 'A2'),
  F2L(3, 'Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, naranja arriba', "F' U' F", "F' U F", [[4, "S U R U' R' S'"]], false, 'A4'),
  F2L(4, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, verde arriba', "R U R'", "R U' R'", [], false, 'A3'),
];
const separadas = [
  F2L(5, 'Esquina arriba adelante-der, blanco al frente; arista arriba-atrás, verde arriba', "U' R U R' U2 R U' R'", "R U R' U2 R U' R' U", [[2, "F2 L' U' L U F2"], [3, "U' R U R' U' R U2 R'"], [4, "U' R U R' U R' F R F'"]], false, 'B1'),
  F2L(6, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-izquierda, naranja arriba', "U' r U' R' U R U r'", "r U' R' U' R U r' U", [[3, "d R' U' R U2 R' U R"]], false, 'B2'),
  F2L(7, 'Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, verde arriba', "U' R U2 R' U' R U2 R'", "R U2 R' U R U2 R' U", [[2, "M' U' M U2 r U' r'"], [3, "U' R U2 R' U2 R U' R'"], [4, "U' R U2 R' U R' F R F'"]], false, 'C1'),
  F2L(8, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, naranja arriba', "r' U2 R2 U R2 U r", "r' U' R2 U' R2 U2 r", [[2, "d R' U2 R U R' U2 R"], [3, "y' U R' U2 R U2 R' U R"]], false, 'C2'),
  F2L(9, 'Esquina arriba adelante-der, blanco al frente; arista arriba-atrás, naranja arriba', "U' R U' R' U F' U' F", "F' U F U' R U R' U", [[2, "F R U R' U' F' R U' R'"], [4, "d R' U' R U' R' U' R"]]),
  F2L(10, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-izquierda, verde arriba', "U' R U R' U R U R'", "R U' R' U' R U' R' U", [[2, "U2 R U' R' U' R U R'"], [3, "d R' U R d' R U R'"]]),
  F2L(19, 'Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, verde arriba', "U R U2 R' U R U' R'", "R U R' U' R U2 R' U'", [[2, "U R U2 R2 F R F'"], [4, "R U' R' U R U' R' U R U R'"]], false, 'D3'),
  F2L(20, 'Esquina arriba adelante-der, blanco arriba; arista arriba-izquierda, naranja arriba', "y' U' R' U2 R U' R' U R", "F' U' F U F' U2 F U", [[2, "U' R U' R2 F R F' R U' R'"], [4, "U' F' U2 F U' F' U F"]], true, 'D4'),
  F2L(21, 'Esquina arriba adelante-der, blanco arriba; arista arriba-izquierda, verde arriba', "U2 R U R' U R U' R'", "R U R' U' R U' R' U2", [[2, "R U' R' U2 R U R'"], [3, "R B U2 B' R'"]]),
  F2L(22, 'Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, naranja arriba', "r U' r' U2 r U r'", "r U' r' U2 r U r'", [[2, "F' L' U2 L F"], [3, "y' U2 R' U' R U' R' U R"]]),
];
const juntas = [
  F2L(11, 'Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, naranja arriba', "U' R U2 R' U F' U' F", "F' U F U' R U2 R' U", [[2, "y' R U2 R2 U' R2 U' R'"], [4, "F' U L' U2 L U2 F"]]),
  F2L(12, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, verde arriba', "R U' R' U R U' R' U2 R U' R'", "R U R' U2 R U R' U' R U R'", [[2, "R' U2 R2 U R2 U R"], [3, "U F' U2 F U' R U R'"], [4, "U R U' R' U' R U R' U' R U R'"]]),
  F2L(13, 'Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, naranja arriba', "y' U R' U R U' R' U' R", "F' U F U F' U' F U'", [[2, "M' U' R U R' U2 R U' r'"], [3, "R U' R' U R' F R F' R U' R'"], [4, "d R' U R U' R' U' R"]], true, 'B4'),
  F2L(14, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-derecha, verde arriba', "U' R U' R' U R U R'", "R U' R' U' R U R' U", [[2, "R U2 R' U2 R U R' U2 R U' R'"], [3, "U' R2 D R' U R D' R2"], [4, "U2 R2 U R' U R U2 R2"]], false, 'B3'),
  F2L(15, 'Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, verde arriba', "M U r U' r' U' M'", "M U r U r' U' M'", [[2, "R U R' U2 R U' R' U R U' R'"], [3, "R' D' R U' R' D R U R U' R'"], [4, "F' U F U2 R U R'"]]),
  F2L(16, 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-derecha, naranja arriba', "R U' R' U2 F' U' F", "F' U F U2 R U R'", [[3, "U M' U R U' r' U' R U R'"], [4, "U F U R U' R' F' R U R'"]]),
  F2L(17, 'Esquina arriba adelante-der, blanco arriba; arista arriba-derecha, verde arriba', "R U2 R' U' R U R'", "R U' R' U R U2 R'", [[3, "R U R' U' R U2 R' U2 R U R'"]], false, 'D1'),
  F2L(18, 'Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, naranja arriba', "y' R' U2 R U R' U' R", "F' U F U' F' U2 F", [[3, "F' U2 F U F' U' F"], [4, "R' F R F' R U' R' U R U' R'"]], true, 'D2'),
  F2L(23, 'Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, verde arriba', "U R U' R' U' R U' R' U R U' R'", "R U R' U' R U R' U R U R' U'", [[2, "R U R' U2 R U R' U' R U R'"], [3, "U2 R2 U2 R' U' R U' R2"], [4, "R U' R2 D' R U2 R' D R"]]),
  F2L(24, 'Esquina arriba adelante-der, blanco arriba; arista arriba-derecha, naranja arriba', "F U R U' R' F' R U' R'", "R U R' F R U R' U' F'", [[2, "U' R U R2 F R F' R U' R'"], [3, "y' R' U' R U2 R' U' R U R' U' R"], [4, "U F' L' U L F R U R'"]]),
];
const esquina = [
  F2L(25, 'Esquina en la ranura, blanco abajo; arista arriba-derecha, verde arriba', "U' R' F R F' R U R'", "R U' R' F R' F' R U", [[2, "R' F' R U R U' R' F"], [3, "U' F' U F U R U' R'"]]),
  F2L(26, 'Esquina en la ranura, blanco abajo; arista arriba-adelante, naranja arriba', "U R U' R' F R' F' R", "R' F R F' R U R' U'", [[2, "R S' R' U R S R'"], [3, "U R U R' U' y L' U' L"], [4, "U R U' R' U' F' U F"]], false, 'E2'),
  F2L(27, 'Esquina en la ranura, blanco al frente; arista arriba-derecha, verde arriba', "R U' R' U R U' R'", "R U R' U' R U R'", [[2, "F' U' F U2 R U' R'"], [4, "y' f R' f' r' U' R U M'"]], false, 'E1'),
  F2L(28, 'Esquina en la ranura, blanco a la derecha; arista arriba-adelante, naranja arriba', "R U R' U' F R' F' R", "R' F R F' U R U' R'", [[3, "F' U F U' F' U F"]]),
  F2L(29, 'Esquina en la ranura, blanco al frente; arista arriba-adelante, naranja arriba', "R' F R F' U R U' R'", "R U R' U' F R' F' R", [[2, "y L' U' L U L' U' L"], [4, "R' F R F' R' F R F'"]]),
  F2L(30, 'Esquina en la ranura, blanco a la derecha; arista arriba-derecha, verde arriba', "R U R' U' R U R'", "R U' R' U R U' R'", [[2, "U' R U2 R' U2 R U R'"], [3, "U' F R' F' R2 U R'"]]),
];
const arista = [
  F2L(31, 'Esquina arriba adelante-der, blanco arriba; arista volteada en la ranura', "U' R' F R F' R U' R'", "R U R' F R' F' R U", [[2, "R U' R' U y' R' U R"], [3, "F' U F R U2 R'"]]),
  F2L(32, 'Esquina arriba adelante-der, blanco arriba; arista bien puesta en la ranura', "U R U' R' U R U' R' U R U' R'", "R U R' U' R U R' U' R U R' U'", [[2, "R U R' U' R U R' U' R U R'"], [3, 'R2 U R2 U R2 U2 R2'], [4, "U' F R' F' R U' R U R'"]], false, 'E3'),
  F2L(33, 'Esquina arriba adelante-der, blanco al frente; arista bien puesta en la ranura', "U' R U' R' U2 R U' R'", "R U R' U2 R U R' U", [[2, "y R' D R U' R' D' R"], [3, "R U R' U' R U' R' U R U' R'"], [4, "U' R U' R' U' R U2 R'"]]),
  F2L(34, 'Esquina arriba adelante-der, blanco a la derecha; arista bien puesta en la ranura', "U R U R' U2 R U R'", "R U' R' U2 R U' R' U'", [[2, "U' R U2 R' U R U R'"], [3, "U R' D' R U' R' D R"], [4, "y U L' U L U2 L' U L"]]),
  F2L(35, 'Esquina arriba adelante-der, blanco al frente; arista volteada en la ranura', "U' R U R' U F' U' F", "F' U F U' R U' R' U", [[3, "U2 R U R' F R' F' R"]]),
  F2L(36, 'Esquina arriba adelante-der, blanco a la derecha; arista volteada en la ranura', "U F' U' F U' R U R'", "R U' R' U F' U F U'", [[2, "U2 R' F R F' U2 R U R'"], [3, "R U R' U R U R' U' F' U' F"], [4, "R2 u R U R' U' u' R' U R'"]]),
];
const ranura = [
  F2L(37, 'Esquina en la ranura, blanco abajo; arista volteada en la ranura', "R2 U2 F R2 F' U2 R' U R'", "R U' R U2 F R2 F' U2 R2", [[2, "R' F R F' R U' R' U R U' R' U2 R U' R'"], [3, "R U2 R' U R U2 R' U F' U' F"], [4, "R U R' U2 R U2 R' U y' R' U' R"]]),
  F2L(38, 'Esquina en la ranura, blanco al frente; arista bien puesta en la ranura', "R U' R' U' R U R' U2 R U' R'", "R U R' U2 R U' R' U R U R'", [[2, "R U R' U' R U2 R' U' R U R'"], [3, "R2 U2 R' U' R U' R' U2 R'"], [4, "R U' R' U' R U R' U' R U2 R'"]], false, 'E4'),
  F2L(39, 'Esquina en la ranura, blanco a la derecha; arista bien puesta en la ranura', "R U' R' U R U2 R' U R U' R'", "R U R' U' R U2 R' U' R U R'", [[2, "R U2 R U R' U R U2 R2"], [3, "R U R' U2 R U' R' U R U R'"], [4, "R U2 R' U R U' R' U R U R'"]], false, 'E5'),
  F2L(40, 'Esquina en la ranura, blanco al frente; arista volteada en la ranura', "r U' r' U2 r U r' R U R'", "R U' R' r U' r' U2 r U r'", [[2, "F' L' U2 L F R U R'"], [3, "R U' R' F R U R' U' F' R U' R'"], [4, "R U' R' U' R U' R' U y' R' U' R"]]),
  F2L(41, 'Esquina en la ranura, blanco a la derecha; arista volteada en la ranura', "R U' R' r U' r' U2 r U r'", "r U' r' U2 r U r' R U R'", [[2, "R U' R' F' L' U2 L F"], [3, "R U R' U' y M U' R' F R U M'"], [4, "R U R' U' R U' R' U2 y' R' U' R"]]),
];

export const f2lPhase: Phase = {
  id: 'cfopc-f2l',
  name: es('F2L'),
  description: es(
    [
      'Los **41 casos** de F2L, numerados como en SpeedCubeDB. Todos son para la **ranura adelante-derecha** (par verde-naranja).',
      'La descripción de cada caso es el estado justo después de la mezcla. Si el algoritmo empieza con `U`, `U\'` o `U2`, ese giro es parte del caso: no lo saltes. En un solve real, ajusta antes con `U` hasta ver el caso como en la figura.',
      '## Primero, la idea',
      "Antes de memorizar, entiende la idea: junta la esquina y la arista arriba en un par, colócalo con `U` donde un gatillo de 3 giros lo mete y mételo: `R U R'` o `R U' R'` por la derecha, `F' U' F` o `F' U F` por el frente.",
      'Casi todos los casos son esa idea encadenada. Aprende el algoritmo de un caso cuando tu solución intuitiva sea larga o te obligue a girar el cubo.',
      'Los 19 casos del CFOP reducido también están aquí: la nota de cada uno dice qué código tenía allí (A1, B2…).',
      '## Anticipación',
      'Mientras insertas un par, busca con la vista el siguiente. Es lo que más baja los tiempos: la meta es no detenerte entre pares.',
      'Mejor un solve lento sin pausas que uno rápido con pausas.',
      '## Notación nueva',
      "- `y'` gira todo el cubo como `U'`; `y` como `U`.",
      '- `d` gira las 2 capas de abajo, como `D`; `u`, las 2 de arriba, como `U`.',
      '- `r` y `f` mueven la cara más la capa del medio.',
      '- `M` es la capa del medio entre `L` y `R` y gira como `L`; `S`, la del medio entre `F` y `B`, y gira como `F`.',
    ].join('\n'),
  ),
  diagram: 'iso',
  groups: [
    {
      id: 'cfopc-f2l-libres',
      name: es('Pares libres'),
      description: es('El par ya está armado o a un giro de estarlo: se inserta en 3 o 4 movimientos. **La base de todo lo demás.**'),
      cases: libres,
    },
    {
      id: 'cfopc-f2l-separadas',
      name: es('Piezas separadas'),
      description: es(
        [
          'La esquina y la arista están arriba pero no se tocan.',
          "Primero las juntas en un par con un gatillo como `R U R'` o `R U' R'` (`U` solo las coloca), y después insertas el par. En los casos 19 a 22 el blanco mira arriba.",
        ].join('\n'),
      ),
      cases: separadas,
    },
    {
      id: 'cfopc-f2l-juntas',
      name: es('Piezas juntas'),
      description: es('La esquina y la arista se tocan arriba, pero no forman par: hay que deshacerlas y volver a juntarlas bien.'),
      cases: juntas,
    },
    {
      id: 'cfopc-f2l-esquina',
      name: es('Esquina en la ranura'),
      description: es('La esquina está abajo, en su ranura, y la arista arriba. Saca la esquina sin perder la arista de vista.'),
      cases: esquina,
    },
    {
      id: 'cfopc-f2l-arista',
      name: es('Arista en la ranura'),
      description: es('La arista está en su ranura, bien puesta o volteada, y la esquina arriba.'),
      cases: arista,
    },
    {
      id: 'cfopc-f2l-ranura',
      name: es('Ambas en la ranura'),
      description: es('Las dos piezas están en su ranura, pero mal colocadas. Son los casos menos frecuentes y de los más largos: apréndelos al final.'),
      cases: ranura,
    },
  ],
  progression: es(
    [
      'Orden: **pares libres → piezas separadas → piezas juntas → esquina en la ranura → arista en la ranura → ambas en la ranura**.',
      'Sigue ese orden, pero salta los 19 casos que ya aprendiste en el CFOP reducido (su nota lo indica): esos solo repásalos. Los 22 nuevos son los que entrenas.',
      '## Espejo',
      'Cuando domines un caso en la ranura adelante-derecha, practica el espejo en adelante-izquierda.',
      "- Cambia cada `R` por `L` y cada `L` por `R` (también `r` y `l`), e invierte todos los giros: `R` pasa a `L'`, `F` a `F'`, `U'` a `U`, `y'` a `y`… Solo `M` no cambia.",
      "- Ejemplo: `R U R'` pasa a `L' U' L`.",
      '## Anticipación',
      'Haz 5 solves lentos por sesión buscando el siguiente par mientras insertas el actual.',
    ].join('\n'),
  ),
  quizzes: [],
};

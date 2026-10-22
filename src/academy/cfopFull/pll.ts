// CFOP completo, PLL: los 21 casos (ids cfopc-pll-<nombre>, p. ej. cfopc-pll-aa).
// Algorithms are SpeedCubeDB's (fetched 2026-10-21): main = #1 with a leading y/y2 dropped (the AUF covers it),
// extras = [rank, alg] with the U turn they need here in place of their leading y. Setup = main undone.
// Left out: T #2 (21-move joke), Ub #3 (R2' and R3 aren't valid notation), Ga #3 (23 moves).
import type { Localized } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { invertTokens, tokenize } from '../../notation.ts';
import { scdbUrl } from '../scdb.ts';

const bi = (es: string, en: string): Localized => ({ es, en });
const cat = (...p: Localized[]): Localized => bi(p.map((x) => x.es).join(' '), p.map((x) => x.en).join(' '));

const pll = (code: string, recognition: Localized, alg: string, alts: [number, string][], note?: Localized): Case => ({
  id: `cfopc-pll-${code.toLowerCase()}`,
  code,
  name: bi(`${code}-perm`, `${code}-perm`),
  recognition,
  stage: 'pll-edges',
  algs: [
    { id: 'main', alg, source: 'speedcubedb', rank: 1 },
    ...alts.map(([rank, a]) => ({ id: `scdb-${rank}`, alg: a, source: 'speedcubedb' as const, rank })),
  ],
  setup: invertTokens(tokenize(alg)).join(' '),
  scdb: { set: 'PLL', id: code, url: scdbUrl('PLL', code) },
  ...(note ? { note } : {}),
});

const M_NOTE = bi('M se gira en la misma dirección que L.', 'M turns the same direction as L.');
const inverse = (a: string, b: string) =>
  bi(`${a} y ${b} son inversos: la mezcla de uno es el algoritmo del otro.`, `${a} and ${b} are inverses: the scramble for one is the algorithm for the other.`);

const edges = [
  pll('Ua', bi('Un lado completo: ponlo atrás. La arista del frente es del color del centro derecho', 'One side solved: put it at the back. The front edge matches the right center'),
    "M2 U M U2 M' U M2",
    [[2, "U2 R U R' U R' U' R2 U' R' U R' U R"], [3, "U' R2 U' S' U2 S U' R2"], [4, "R U' R U R U R U' R' U' R2"]],
    cat(inverse('Ua', 'Ub'), M_NOTE)),
  pll('Ub', bi('Un lado completo: ponlo atrás. La arista del frente es del color del centro izquierdo', 'One side solved: put it at the back. The front edge matches the left center'),
    "M2 U' M U2 M' U' M2",
    [[2, "U2 R' U R' U' R' U' R' U R U R2"], [4, "R2 U R U R' U' R' U' R' U R'"]],
    cat(inverse('Ub', 'Ua'), M_NOTE)),
  pll('H', bi('Faros en los 4 lados; cada arista es del color de la cara opuesta', 'Headlights on all 4 sides; each edge matches the opposite face'),
    "M2 U M2 U2 M2 U M2",
    [[2, "M2 U' M2 U2 M2 U' M2"], [3, "R2 S2 R2 U' R2 S2 R2"]], M_NOTE),
  pll('Z', bi('Faros en los 4 lados; la arista del frente es del color de los faros de la derecha y viceversa; lo mismo atrás y a la izquierda', 'Headlights on all 4 sides; the front edge matches the right headlights and vice versa; same for back and left'),
    "M' U' M2 U' M2 U' M' U2 M2",
    [[2, "M2 U M2 U M' U2 M2 U2 M'"], [3, "U M2 U' M2 U' M' U2 M2 U2 M'"]], M_NOTE),
];

const corners = [
  pll('Aa', bi('Faros atrás; bloque 2×2 adelante a la izquierda', 'Headlights at the back; 2×2 block at the front left'),
    "x R' U R' D2 R U' R' D2 R2 x'",
    [[2, "U' x L2 D2 L' U' L D2 L' U L'"], [3, "l' U R' D2 R U' R' D2 R2 x'"]], inverse('Aa', 'Ab')),
  pll('Ab', bi('Faros a la derecha; bloque 2×2 adelante a la izquierda', 'Headlights on the right; 2×2 block at the front left'),
    "x R2 D2 R U R' D2 R U' R x'",
    [[2, "U' x L U' L D2 L' U L D2 L2"], [4, "R' B' R U' R D R' U R D' R2 B R"]], inverse('Ab', 'Aa')),
  pll('E', bi('Sin faros ni bloques; aristas resueltas. Al frente, cada esquina muestra el color del lado que toca', 'No headlights or blocks; edges solved. At the front, each corner shows the color of the side it touches'),
    "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    [[2, "R' U' R' D' R U' R' D R U R' D' R U R' D R2"], [3, "U R2 U F' R' U R U' R' U R U' R' U R U' F U' R2"]]),
];

const adjacent = [
  pll('T', bi('Faros a la izquierda; al frente y atrás, bloques de 2 pegados a ellos', 'Headlights on the left; at the front and back, 2-blocks next to them'),
    "R U R' U' R' F R2 U' R' U' R U R' F'",
    [[3, "R U R' U' R' F R2 U' R' U F' L' U L"], [4, "R2 u R2 u' R2 F2 u' F2 u F2"]]),
  pll('F', bi('Lado completo a la izquierda; a la derecha, la arista entre dos esquinas de colores opuestos', 'Solved side on the left; on the right, the edge between two corners of opposite colors'),
    "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    [[2, "R' F R f' R' F R2 U R' U' R' F' R2 U R' S"], [3, "U' R' U R U' R2 F' U' F U R F R' F' R2"]]),
  pll('Ja', bi('Lado completo a la izquierda; al frente, bloque de 2 pegado a él', 'Solved side on the left; at the front, a 2-block next to it'),
    "x R2 F R F' R U2 r' U r U2 x'",
    [[2, "U' R' U L' U2 R U' R' U2 R L"], [3, "U2 L' U' L F L' U' L U L F' L2 U L"]]),
  pll('Jb', bi('Lado completo a la izquierda; al frente, bloque de 2 del lado derecho', 'Solved side on the left; at the front, a 2-block on the right side'),
    "R U R' F' R U R' U' R' F R2 U' R'",
    [[2, "R U2 R' U' R U2 L' U R' U' L"], [3, "r' F R F' r U2 R' U R U2 R'"]]),
  pll('Ra', bi('Faros a la izquierda; un solo bloque de 2, al frente, pegado a ellos', 'Headlights on the left; a single 2-block, at the front, next to them'),
    "R U' R' U' R U R D R' U' R D' R' U2 R'",
    [[2, "R U R' F' R U2 R' U2 R' F R U R U2 R'"], [3, "U' L U2 L' U2 L F' L' U' L U L F L2"]]),
  pll('Rb', bi('Faros al frente; un solo bloque de 2, a la izquierda, pegado a ellos', 'Headlights at the front; a single 2-block, on the left, next to them'),
    "R' U2 R U2 R' F R U R' U' R' F' R2",
    [[2, "U R2 F R U R U' R' F' R U2 R' U2 R"], [3, "R' U2 R' D' R U' R' D R U R U' R' U' R"]]),
  pll('Ga', bi('Faros a la izquierda; un solo bloque de 2, al frente, del lado derecho', 'Headlights on the left; a single 2-block, at the front, on the right side'),
    "R2 U R' U R' U' R U' R2 D U' R' U R D'",
    [[2, "R2 u R' U R' U' R u' R2 F' U F"], [4, "D' R2 U R' U R' U' R U' R2 U' D R' U R"]], inverse('Ga', 'Gb')),
  pll('Gb', bi('Faros a la izquierda; un solo bloque de 2, a la derecha, del lado de atrás', 'Headlights on the left; a single 2-block, on the right, at the back side'),
    "D R' U' R U D' R2 U R' U R U' R U' R2",
    [[2, "R' U' R U D' R2 U R' U R U' R U' R2 D"], [3, "U F' U' F R2 u R' U R U' R u' R2"]], inverse('Gb', 'Ga')),
  pll('Gc', bi('Faros a la izquierda; un solo bloque de 2, atrás, en el extremo que toca la cara derecha', 'Headlights on the left; a single 2-block, at the back, at the end touching the right face'),
    "R2 U' R U' R U R' U R2 D' U R U' R' D",
    [[2, "U2 R2 F2 R U2 R U2 R' F R U R' U' R' F R2"], [3, "D R2 U' R U' R U R' U R2 D' U R U' R'"]], bi('Gc y Gd son inversos: uno deshace al otro.', 'Gc and Gd are inverses: each undoes the other.')),
  pll('Gd', bi('Faros a la izquierda; un solo bloque de 2, a la derecha, del lado del frente', 'Headlights on the left; a single 2-block, on the right, at the front side'),
    "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    [[2, "D' R U R' U' D R2 U' R U' R' U R' U R2"], [3, "R U R' y' R2 u' R U' R' U R' u R2"]], bi('Gd y Gc son inversos: uno deshace al otro.', 'Gd and Gc are inverses: each undoes the other.')),
];

const diagonal = [
  pll('V', bi('Sin faros; un bloque 2×2 adelante a la izquierda', 'No headlights; a 2×2 block at the front left'),
    "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
    [[2, "R' U R U' R' f' U' R U2 R' U' R U' R' f R"], [3, "R' U R' U' y R' F' R2 U' R' U R' F R F"]]),
  pll('Y', bi('Sin faros; dos bloques de 2: al frente del lado izquierdo y a la derecha del lado de atrás', 'No headlights; two 2-blocks: at the front on the left side and on the right of the back side'),
    "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    [[2, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [3, "R2 U' R2 U' R2 U F U F' R2 F U' F'"]]),
  pll('Na', bi('Sin faros; cada lado tiene un bloque de 2 en su extremo derecho (mirándolo de frente)', 'No headlights; each side has a 2-block at its right end (facing it)'),
    "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    [[2, "F' R U R' U' R' F R2 F U' R' U' R U F' R'"], [3, "R F U' R' U R U F' R2 F' R U R U' R' F"]]),
  pll('Nb', bi('Sin faros; cada lado tiene un bloque de 2 en su extremo izquierdo (mirándolo de frente)', 'No headlights; each side has a 2-block at its left end (facing it)'),
    "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    [[2, "r' D' F r U' r' F' D r2 U r' U' r' F r F'"], [3, "R' U L' U2 R U' L R' U L' U2 R U' L"]]),
];

export const pllPhase: Phase = {
  id: 'cfopc-pll',
  name: bi('PLL', 'PLL'),
  description: bi(
    [
      'Último paso: la cara amarilla está completa y falta colocar cada pieza. **21 casos**, un algoritmo por caso.',
      "Antes del algoritmo, gira `U` (`U`, `U'` o `U2`) hasta ver el caso como en la figura. Al terminar, puede faltar otro `U`.",
      '## Reconocer',
      'Mira las pegatinas laterales de la capa superior, en los 4 lados.',
      '- **Faros:** las dos esquinas de un lado son del mismo color y la arista del medio no.',
      '- **Bloque:** una esquina y la arista de al lado son del mismo color.',
      '- **Lado completo:** las tres piezas de un lado son del mismo color.',
      'Cuenta los lados con las dos esquinas del mismo color (faros o lado completo):',
      '- **4 lados:** las esquinas ya están; solo se mueven las aristas (Ua, Ub, H y Z).',
      '- **1 lado:** A mueve 3 esquinas; T, F, J, R y G cambian dos esquinas vecinas.',
      '- **Ninguno:** dos esquinas en diagonal (V, Y y N), o la E.',
      'Los bloques y lados completos te dicen el caso exacto. Con práctica, te bastará ver el frente y la derecha.',
      '## Respaldo: PLL en 2 pasos',
      'Si vienes del CFOP reducido, ya lo tienes: T y Y para las esquinas; Ua, Ub, H y Z para las aristas.',
      'Si no reconoces un caso, resuélvelo así.',
    ].join('\n'),
    [
      'Last step: the yellow face is complete and each piece still needs placing. **21 cases**, one algorithm per case.',
      "Before the algorithm, turn `U` (`U`, `U'` or `U2`) until you see the case as in the figure. When done, another `U` may be left.",
      '## Recognize',
      'Look at the side stickers of the top layer, on all 4 sides.',
      '- **Headlights:** the two corners of a side are the same color and the middle edge is not.',
      '- **Block:** a corner and the edge next to it are the same color.',
      '- **Solved side:** all three pieces of a side are the same color.',
      'Count the sides whose two corners match (headlights or solved side):',
      '- **4 sides:** the corners are already placed; only the edges move (Ua, Ub, H and Z).',
      '- **1 side:** A cycles 3 corners; T, F, J, R and G swap two adjacent corners.',
      '- **None:** two diagonal corners (V, Y and N), or the E.',
      'Blocks and solved sides tell you the exact case. With practice, the front and right will be enough.',
      '## Fallback: 2-step PLL',
      'If you come from the reduced CFOP, you already have it: T and Y for the corners; Ua, Ub, H and Z for the edges.',
      "If you don't recognize a case, solve it this way.",
    ].join('\n'),
  ),
  diagram: 'top',
  groups: [
    {
      id: 'cfopc-pll-aristas',
      name: bi('Solo aristas', 'Edges only'),
      description: bi(
        '**Faros o lado completo en los 4 lados:** las esquinas ya están; solo se mueven las aristas.',
        '**Headlights or a solved side on all 4 sides:** the corners are already in place; only the edges move.',
      ),
      cases: edges,
    },
    {
      id: 'cfopc-pll-esquinas',
      name: bi('Solo esquinas', 'Corners only'),
      description: bi(
        'Las aristas ya están; solo se mueven las esquinas.\n- **Aa y Ab:** faros en un lado y un bloque 2×2.\n- **E:** sin faros ni bloques.',
        'The edges are already in place; only the corners move.\n- **Aa and Ab:** headlights on one side and a 2×2 block.\n- **E:** no headlights or blocks.',
      ),
      cases: corners,
    },
    {
      id: 'cfopc-pll-adyacentes',
      name: bi('Cambio de esquinas vecinas', 'Adjacent corner swap'),
      description: bi(
        'Se cambian las dos esquinas del lado opuesto a los faros (o al lado completo).\n**Un solo lado tiene las dos esquinas del mismo color:** faros, o lado completo en F y J.\nMira dónde quedan los bloques respecto a los faros.',
        'The two corners on the side opposite the headlights (or the solved side) are swapped.\n**Only one side has both corners the same color:** headlights, or a solved side in F and J.\nLook at where the blocks sit relative to the headlights.',
      ),
      cases: adjacent,
    },
    {
      id: 'cfopc-pll-diagonales',
      name: bi('Cambio de esquinas en diagonal', 'Diagonal corner swap'),
      description: bi(
        'Se cambian las dos esquinas opuestas: **ningún lado tiene faros**.\nMira los bloques:\n- **V:** un bloque 2×2.\n- **Y:** dos bloques de 2 separados.\n- **N:** un bloque en cada lado.',
        'Two opposite corners are swapped: **no side has headlights**.\nLook at the blocks:\n- **V:** one 2×2 block.\n- **Y:** two separate 2-blocks.\n- **N:** one block on each side.',
      ),
      cases: diagonal,
    },
  ],
  progression: bi(
    [
      '1. **Ua, Ub, H, Z, T y Y:** los del PLL en 2 pasos. Si ya los sabes, repásalos.',
      '2. **Ja, Jb, Aa y Ab:** cortos y fáciles de ver.',
      '3. **F, Ra, Rb, V y E.**',
      '4. **Ga, Gb, Gc y Gd:** los más difíciles de distinguir; de a uno. Juntos salen en 2 de cada 9 solves.',
      '5. **Na y Nb:** al final. Largos y raros (1 de cada 72 solves cada uno, como H).',
      'Aprende juntos los pares inversos: Ua y Ub, Aa y Ab, Ga y Gb, Gc y Gd.',
    ].join('\n'),
    [
      '1. **Ua, Ub, H, Z, T and Y:** the ones from 2-step PLL. If you already know them, review them.',
      '2. **Ja, Jb, Aa and Ab:** short and easy to see.',
      '3. **F, Ra, Rb, V and E.**',
      '4. **Ga, Gb, Gc and Gd:** the hardest to tell apart; one at a time. Together they come up in 2 of every 9 solves.',
      '5. **Na and Nb:** last. Long and awkward (1 in 72 solves each, like H).',
      'Learn the inverse pairs together: Ua and Ub, Aa and Ab, Ga and Gb, Gc and Gd.',
    ].join('\n'),
  ),
  quizzes: [],
};

// CFOP completo, PLL: los 21 casos (ids cfopc-pll-<nombre>, p. ej. cfopc-pll-aa).
// Algorithms are SpeedCubeDB's (fetched 2026-10-21): main = #1 with a leading y/y2 dropped (the AUF covers it),
// extras = [rank, alg] with the U turn they need here in place of their leading y. Setup = main undone.
// Left out: T #2 (21-move joke), Ub #3 (R2' and R3 aren't valid notation), Ga #3 (23 moves).
import type { Localized } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { invertTokens, tokenize } from '../../notation.ts';
import { scdbUrl } from '../scdb.ts';

const es = (text: string): Localized => ({ es: text });

const pll = (code: string, recognition: string, alg: string, alts: [number, string][], note?: string): Case => ({
  id: `cfopc-pll-${code.toLowerCase()}`,
  code,
  name: es(`${code}-perm`),
  recognition: es(recognition),
  stage: 'pll-edges',
  algs: [
    { id: 'main', alg, source: 'speedcubedb', rank: 1 },
    ...alts.map(([rank, a]) => ({ id: `scdb-${rank}`, alg: a, source: 'speedcubedb' as const, rank })),
  ],
  setup: invertTokens(tokenize(alg)).join(' '),
  scdb: { set: 'PLL', id: code, url: scdbUrl('PLL', code) },
  ...(note ? { note: es(note) } : {}),
});

const M_NOTE = 'M se gira en la misma dirección que L.';
const inverse = (a: string, b: string) => `${a} y ${b} son inversos: la mezcla de uno es el algoritmo del otro.`;

const edges = [
  pll('Ua', 'Un lado completo: ponlo atrás. La arista del frente es del color del centro derecho',
    "M2 U M U2 M' U M2",
    [[2, "U2 R U R' U R' U' R2 U' R' U R' U R"], [3, "U' R2 U' S' U2 S U' R2"], [4, "R U' R U R U R U' R' U' R2"]],
    `${inverse('Ua', 'Ub')} ${M_NOTE}`),
  pll('Ub', 'Un lado completo: ponlo atrás. La arista del frente es del color del centro izquierdo',
    "M2 U' M U2 M' U' M2",
    [[2, "U2 R' U R' U' R' U' R' U R U R2"], [4, "R2 U R U R' U' R' U' R' U R'"]],
    `${inverse('Ub', 'Ua')} ${M_NOTE}`),
  pll('H', 'Faros en los 4 lados; cada arista es del color de la cara opuesta',
    "M2 U M2 U2 M2 U M2",
    [[2, "M2 U' M2 U2 M2 U' M2"], [3, "R2 S2 R2 U' R2 S2 R2"]], M_NOTE),
  pll('Z', 'Faros en los 4 lados; la arista del frente es del color de los faros de la derecha y viceversa; lo mismo atrás y a la izquierda',
    "M' U' M2 U' M2 U' M' U2 M2",
    [[2, "M2 U M2 U M' U2 M2 U2 M'"], [3, "U M2 U' M2 U' M' U2 M2 U2 M'"]], M_NOTE),
];

const corners = [
  pll('Aa', 'Faros atrás; bloque 2×2 adelante a la izquierda',
    "x R' U R' D2 R U' R' D2 R2 x'",
    [[2, "U' x L2 D2 L' U' L D2 L' U L'"], [3, "l' U R' D2 R U' R' D2 R2 x'"]], inverse('Aa', 'Ab')),
  pll('Ab', 'Faros a la derecha; bloque 2×2 adelante a la izquierda',
    "x R2 D2 R U R' D2 R U' R x'",
    [[2, "U' x L U' L D2 L' U L D2 L2"], [4, "R' B' R U' R D R' U R D' R2 B R"]], inverse('Ab', 'Aa')),
  pll('E', 'Sin faros ni bloques; aristas resueltas. Al frente, cada esquina muestra el color del lado que toca',
    "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    [[2, "R' U' R' D' R U' R' D R U R' D' R U R' D R2"], [3, "U R2 U F' R' U R U' R' U R U' R' U R U' F U' R2"]]),
];

const adjacent = [
  pll('T', 'Faros a la izquierda; al frente y atrás, bloques de 2 pegados a ellos',
    "R U R' U' R' F R2 U' R' U' R U R' F'",
    [[3, "R U R' U' R' F R2 U' R' U F' L' U L"], [4, "R2 u R2 u' R2 F2 u' F2 u F2"]]),
  pll('F', 'Lado completo a la izquierda; a la derecha, la arista entre dos esquinas de colores opuestos',
    "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    [[2, "R' F R f' R' F R2 U R' U' R' F' R2 U R' S"], [3, "U' R' U R U' R2 F' U' F U R F R' F' R2"]]),
  pll('Ja', 'Lado completo a la izquierda; al frente, bloque de 2 pegado a él',
    "x R2 F R F' R U2 r' U r U2 x'",
    [[2, "U' R' U L' U2 R U' R' U2 R L"], [3, "U2 L' U' L F L' U' L U L F' L2 U L"]]),
  pll('Jb', 'Lado completo a la izquierda; al frente, bloque de 2 del lado derecho',
    "R U R' F' R U R' U' R' F R2 U' R'",
    [[2, "R U2 R' U' R U2 L' U R' U' L"], [3, "r' F R F' r U2 R' U R U2 R'"]]),
  pll('Ra', 'Faros a la izquierda; un solo bloque de 2, al frente, pegado a ellos',
    "R U' R' U' R U R D R' U' R D' R' U2 R'",
    [[2, "R U R' F' R U2 R' U2 R' F R U R U2 R'"], [3, "U' L U2 L' U2 L F' L' U' L U L F L2"]]),
  pll('Rb', 'Faros al frente; un solo bloque de 2, a la izquierda, pegado a ellos',
    "R' U2 R U2 R' F R U R' U' R' F' R2",
    [[2, "U R2 F R U R U' R' F' R U2 R' U2 R"], [3, "R' U2 R' D' R U' R' D R U R U' R' U' R"]]),
  pll('Ga', 'Faros a la izquierda; un solo bloque de 2, al frente, del lado derecho',
    "R2 U R' U R' U' R U' R2 D U' R' U R D'",
    [[2, "R2 u R' U R' U' R u' R2 F' U F"], [4, "D' R2 U R' U R' U' R U' R2 U' D R' U R"]], inverse('Ga', 'Gb')),
  pll('Gb', 'Faros a la izquierda; un solo bloque de 2, a la derecha, del lado de atrás',
    "D R' U' R U D' R2 U R' U R U' R U' R2",
    [[2, "R' U' R U D' R2 U R' U R U' R U' R2 D"], [3, "U F' U' F R2 u R' U R U' R u' R2"]], inverse('Gb', 'Ga')),
  pll('Gc', 'Faros a la izquierda; un solo bloque de 2, atrás, en el extremo que toca la cara derecha',
    "R2 U' R U' R U R' U R2 D' U R U' R' D",
    [[2, "U2 R2 F2 R U2 R U2 R' F R U R' U' R' F R2"], [3, "D R2 U' R U' R U R' U R2 D' U R U' R'"]], 'Gc y Gd son inversos: uno deshace al otro.'),
  pll('Gd', 'Faros a la izquierda; un solo bloque de 2, a la derecha, del lado del frente',
    "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    [[2, "D' R U R' U' D R2 U' R U' R' U R' U R2"], [3, "R U R' y' R2 u' R U' R' U R' u R2"]], 'Gd y Gc son inversos: uno deshace al otro.'),
];

const diagonal = [
  pll('V', 'Sin faros; un bloque 2×2 adelante a la izquierda',
    "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
    [[2, "R' U R U' R' f' U' R U2 R' U' R U' R' f R"], [3, "R' U R' U' y R' F' R2 U' R' U R' F R F"]]),
  pll('Y', 'Sin faros; dos bloques de 2: al frente del lado izquierdo y a la derecha del lado de atrás',
    "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    [[2, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [3, "R2 U' R2 U' R2 U F U F' R2 F U' F'"]]),
  pll('Na', 'Sin faros; cada lado tiene un bloque de 2 en su extremo derecho (mirándolo de frente)',
    "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    [[2, "F' R U R' U' R' F R2 F U' R' U' R U F' R'"], [3, "R F U' R' U R U F' R2 F' R U R U' R' F"]]),
  pll('Nb', 'Sin faros; cada lado tiene un bloque de 2 en su extremo izquierdo (mirándolo de frente)',
    "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    [[2, "r' D' F r U' r' F' D r2 U r' U' r' F r F'"], [3, "R' U L' U2 R U' L R' U L' U2 R U' L"]]),
];

export const pllPhase: Phase = {
  id: 'cfopc-pll',
  name: es('PLL'),
  description: es(
    [
      'PLL es el último paso: la cara amarilla ya está completa y solo falta llevar cada pieza a su lugar. Son **21 casos** y cada uno se resuelve con un solo algoritmo.',
      'Antes del algoritmo, gira la capa superior (`U`, `U\'` o `U2`) hasta dejar el caso como en la figura; al terminar, puede faltar otro giro `U`.',
      '## Cómo reconocerlos',
      'Mira las pegatinas laterales de la capa superior (gira el cubo en la mano o la capa `U` para ver los 4 lados) y busca:',
      '- **Faros:** las dos esquinas de un lado son del mismo color y la arista del medio no.',
      '- **Bloque:** una esquina y la arista de al lado son del mismo color.',
      '- **Lado completo:** las tres piezas de un lado son del mismo color.',
      'Cuenta los lados con las dos esquinas del mismo color (faros o lado completo); eso dice qué pasa con las esquinas:',
      '- **En los 4 lados:** las esquinas ya están; solo se mueven las aristas (Ua, Ub, H y Z).',
      '- **En un solo lado:** A mueve 3 esquinas; T, F, J, R y G cambian dos esquinas vecinas.',
      '- **En ningún lado:** se cambian dos esquinas en diagonal (V, Y y N), o es la E.',
      'Después, los bloques y los lados completos te dicen el caso exacto.',
      'Con práctica, te bastará con ver el frente y la derecha.',
      '## Primero, PLL en 2 pasos',
      'Si vienes del CFOP reducido, ya tienes PLL en 2 pasos: T y Y para las esquinas; Ua, Ub, H y Z para las aristas.',
      'Úsalo como respaldo mientras aprendes el resto: si no reconoces un caso, resuélvelo en 2 pasos.',
    ].join('\n'),
  ),
  diagram: 'top',
  groups: [
    {
      id: 'cfopc-pll-aristas',
      name: es('Solo aristas'),
      description: es('**Faros o lado completo en los 4 lados:** las esquinas ya están. Solo se mueven las aristas.'),
      cases: edges,
    },
    {
      id: 'cfopc-pll-esquinas',
      name: es('Solo esquinas'),
      description: es('Las aristas ya están; solo se mueven las esquinas.\nAa y Ab tienen faros en un lado y un bloque 2×2. E no tiene ni faros ni bloques.'),
      cases: corners,
    },
    {
      id: 'cfopc-pll-adyacentes',
      name: es('Cambio de esquinas vecinas'),
      description: es(
        'Se cambian las dos esquinas del lado opuesto a los faros (o al lado completo). Solo **un lado tiene las dos esquinas del mismo color**: faros, o un lado completo en F y J.\nMira dónde quedan los bloques respecto a los faros.',
      ),
      cases: adjacent,
    },
    {
      id: 'cfopc-pll-diagonales',
      name: es('Cambio de esquinas en diagonal'),
      description: es(
        'Se cambian dos esquinas opuestas: **ningún lado tiene faros**.\nMira los bloques: V tiene un bloque 2×2, Y dos bloques de 2 separados y N un bloque en cada lado.',
      ),
      cases: diagonal,
    },
  ],
  progression: es(
    [
      'Orden sugerido:',
      '1. **Ua, Ub, H, Z, T y Y:** los del PLL en 2 pasos. Si ya los sabes, repásalos.',
      '2. **Ja, Jb, Aa y Ab:** cortos y fáciles de ver.',
      '3. **F, Ra, Rb, V y E.**',
      '4. **Ga, Gb, Gc y Gd:** los más difíciles de distinguir; apréndelos de a uno. Juntos aparecen en 2 de cada 9 solves.',
      '5. **Na y Nb:** al final: son largos y raros (1 de cada 72 solves cada uno, como H).',
      'Aprende juntos los pares inversos: Ua y Ub, Aa y Ab, Ga y Gb, Gc y Gd.',
    ].join('\n'),
  ),
  quizzes: [],
};

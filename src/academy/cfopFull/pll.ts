// CFOP completo, PLL: the 21 cases (ids cfopc-pll-<name>, e.g. cfopc-pll-aa).
// Algorithms are SpeedCubeDB's (fetched 2026-10-21): main = #1 with a leading y/y2 dropped (the AUF covers it),
// extras = [rank, alg] with the U turn they need here in place of their leading y. Setup = main undone.
// Left out: T #2 (21-move joke), Ub #3 (R2' and R3 aren't valid notation), Ga #3 (23 moves).
import type { Localized } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { invertTokens, tokenize } from '../../notation.ts';
import { scdbUrl } from '../scdb.ts';

const bi = (es: string, en: string, pt: string): Localized => ({ es, en, pt });
const cat = (...p: Localized[]): Localized => bi(p.map((x) => x.es).join(' '), p.map((x) => x.en).join(' '), p.map((x) => x.pt!).join(' '));

const pll = (code: string, recognition: Localized, alg: string, alts: [number, string][], note?: Localized): Case => ({
  id: `cfopc-pll-${code.toLowerCase()}`,
  code,
  name: bi(`${code}-perm`, `${code}-perm`, `${code}-perm`),
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

const M_NOTE = bi('M se gira en la misma dirección que L.', 'M turns the same direction as L.', 'M gira na mesma direção que L.');
const inverse = (a: string, b: string) =>
  bi(`${a} y ${b} son inversos: la preparación de uno es el algoritmo del otro.`, `${a} and ${b} are inverses: the setup of one is the algorithm of the other.`, `${a} e ${b} são inversos: a preparação de um é o algoritmo do outro.`);

const edges = [
  pll('Ua', bi('Un lado completo: ponlo atrás. La arista del frente es del color del centro derecho', 'One side solved: put it at the back. The front edge matches the right center', 'Um lado completo: coloque-o atrás. A aresta da frente é da cor do centro direito'),
    "M2 U M U2 M' U M2",
    [[2, "U2 R U R' U R' U' R2 U' R' U R' U R"], [3, "U' R2 U' S' U2 S U' R2"], [4, "R U' R U R U R U' R' U' R2"]],
    cat(inverse('Ua', 'Ub'), M_NOTE)),
  pll('Ub', bi('Un lado completo: ponlo atrás. La arista del frente es del color del centro izquierdo', 'One side solved: put it at the back. The front edge matches the left center', 'Um lado completo: coloque-o atrás. A aresta da frente é da cor do centro esquerdo'),
    "M2 U' M U2 M' U' M2",
    [[2, "U2 R' U R' U' R' U' R' U R U R2"], [4, "R2 U R U R' U' R' U' R' U R'"]],
    cat(inverse('Ub', 'Ua'), M_NOTE)),
  pll('H', bi('Faros en los 4 lados; cada arista es del color de la cara opuesta', 'Headlights on all 4 sides; each edge matches the opposite face', 'Faróis nos 4 lados; cada aresta é da cor da face oposta'),
    "M2 U M2 U2 M2 U M2",
    [[2, "M2 U' M2 U2 M2 U' M2"], [3, "R2 S2 R2 U' R2 S2 R2"]], M_NOTE),
  pll('Z', bi('Faros en los 4 lados; la arista del frente es del color de los faros de la derecha y viceversa; lo mismo atrás y a la izquierda', 'Headlights on all 4 sides; the front edge matches the right headlights and vice versa; same for back and left', 'Faróis nos 4 lados; a aresta da frente é da cor dos faróis da direita e vice-versa; o mesmo atrás e à esquerda'),
    "M' U' M2 U' M2 U' M' U2 M2",
    [[2, "M2 U M2 U M' U2 M2 U2 M'"], [3, "U M2 U' M2 U' M' U2 M2 U2 M'"]], M_NOTE),
];

const corners = [
  pll('Aa', bi('Faros atrás; bloque 2×2 adelante a la izquierda', 'Headlights at the back; 2×2 block at the front left', 'Faróis atrás; bloco 2×2 na frente à esquerda'),
    "x R' U R' D2 R U' R' D2 R2 x'",
    [[2, "U' x L2 D2 L' U' L D2 L' U L'"], [3, "l' U R' D2 R U' R' D2 R2 x'"]], inverse('Aa', 'Ab')),
  pll('Ab', bi('Faros a la derecha; bloque 2×2 adelante a la izquierda', 'Headlights on the right; 2×2 block at the front left', 'Faróis à direita; bloco 2×2 na frente à esquerda'),
    "x R2 D2 R U R' D2 R U' R x'",
    [[2, "U' x L U' L D2 L' U L D2 L2"], [4, "R' B' R U' R D R' U R D' R2 B R"]], inverse('Ab', 'Aa')),
  pll('E', bi('Sin faros ni bloques; aristas resueltas. Al frente, cada esquina muestra el color del lado que toca', 'No headlights or blocks; edges solved. At the front, each corner shows the color of the side it touches', 'Sem faróis nem blocos; arestas resolvidas. Na frente, cada quina mostra a cor do lado que toca'),
    "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    [[2, "R' U' R' D' R U' R' D R U R' D' R U R' D R2"], [3, "U R2 U F' R' U R U' R' U R U' R' U R U' F U' R2"]]),
];

const adjacent = [
  pll('T', bi('Faros a la izquierda; al frente y atrás, bloques de 2 pegados a ellos', 'Headlights on the left; at the front and back, 2-blocks next to them', 'Faróis à esquerda; na frente e atrás, blocos de 2 colados neles'),
    "R U R' U' R' F R2 U' R' U' R U R' F'",
    [[3, "R U R' U' R' F R2 U' R' U F' L' U L"], [4, "R2 u R2 u' R2 F2 u' F2 u F2"]]),
  pll('F', bi('Lado completo a la izquierda; a la derecha, la arista entre dos esquinas de colores opuestos', 'Solved side on the left; on the right, the edge between two corners of opposite colors', 'Lado completo à esquerda; à direita, a aresta entre duas quinas de cores opostas'),
    "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    [[2, "R' F R f' R' F R2 U R' U' R' F' R2 U R' S"], [3, "U' R' U R U' R2 F' U' F U R F R' F' R2"]]),
  pll('Ja', bi('Lado completo a la izquierda; al frente, bloque de 2 pegado a él', 'Solved side on the left; at the front, a 2-block next to it', 'Lado completo à esquerda; na frente, bloco de 2 colado nele'),
    "x R2 F R F' R U2 r' U r U2 x'",
    [[2, "U' R' U L' U2 R U' R' U2 R L"], [3, "U2 L' U' L F L' U' L U L F' L2 U L"]]),
  pll('Jb', bi('Lado completo a la izquierda; al frente, bloque de 2 del lado derecho', 'Solved side on the left; at the front, a 2-block on the right side', 'Lado completo à esquerda; na frente, bloco de 2 do lado direito'),
    "R U R' F' R U R' U' R' F R2 U' R'",
    [[2, "R U2 R' U' R U2 L' U R' U' L"], [3, "r' F R F' r U2 R' U R U2 R'"]]),
  pll('Ra', bi('Faros a la izquierda; un solo bloque de 2, al frente, pegado a ellos', 'Headlights on the left; a single 2-block, at the front, next to them', 'Faróis à esquerda; um único bloco de 2, na frente, colado neles'),
    "R U' R' U' R U R D R' U' R D' R' U2 R'",
    [[2, "R U R' F' R U2 R' U2 R' F R U R U2 R'"], [3, "U' L U2 L' U2 L F' L' U' L U L F L2"]]),
  pll('Rb', bi('Faros al frente; un solo bloque de 2, a la izquierda, pegado a ellos', 'Headlights at the front; a single 2-block, on the left, next to them', 'Faróis na frente; um único bloco de 2, à esquerda, colado neles'),
    "R' U2 R U2 R' F R U R' U' R' F' R2",
    [[2, "U R2 F R U R U' R' F' R U2 R' U2 R"], [3, "R' U2 R' D' R U' R' D R U R U' R' U' R"]]),
  pll('Ga', bi('Faros a la izquierda; un solo bloque de 2, al frente, del lado derecho', 'Headlights on the left; a single 2-block, at the front, on the right side', 'Faróis à esquerda; um único bloco de 2, na frente, do lado direito'),
    "R2 U R' U R' U' R U' R2 D U' R' U R D'",
    [[2, "R2 u R' U R' U' R u' R2 F' U F"], [4, "D' R2 U R' U R' U' R U' R2 U' D R' U R"]], inverse('Ga', 'Gb')),
  pll('Gb', bi('Faros a la izquierda; un solo bloque de 2, a la derecha, del lado de atrás', 'Headlights on the left; a single 2-block, on the right, at the back side', 'Faróis à esquerda; um único bloco de 2, à direita, do lado de trás'),
    "D R' U' R U D' R2 U R' U R U' R U' R2",
    [[2, "R' U' R U D' R2 U R' U R U' R U' R2 D"], [3, "U F' U' F R2 u R' U R U' R u' R2"]], inverse('Gb', 'Ga')),
  pll('Gc', bi('Faros a la izquierda; un solo bloque de 2, atrás, en el extremo que toca la cara derecha', 'Headlights on the left; a single 2-block, at the back, at the end touching the right face', 'Faróis à esquerda; um único bloco de 2, atrás, na ponta que toca a face direita'),
    "R2 U' R U' R U R' U R2 D' U R U' R' D",
    [[2, "U2 R2 F2 R U2 R U2 R' F R U R' U' R' F R2"], [3, "D R2 U' R U' R U R' U R2 D' U R U' R'"]], bi('Gc y Gd son inversos: uno deshace al otro.', 'Gc and Gd are inverses: each undoes the other.', 'Gc e Gd são inversos: um desfaz o outro.')),
  pll('Gd', bi('Faros a la izquierda; un solo bloque de 2, a la derecha, del lado del frente', 'Headlights on the left; a single 2-block, on the right, at the front side', 'Faróis à esquerda; um único bloco de 2, à direita, do lado da frente'),
    "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    [[2, "D' R U R' U' D R2 U' R U' R' U R' U R2"], [3, "R U R' y' R2 u' R U' R' U R' u R2"]], bi('Gd y Gc son inversos: uno deshace al otro.', 'Gd and Gc are inverses: each undoes the other.', 'Gd e Gc são inversos: um desfaz o outro.')),
];

const diagonal = [
  pll('V', bi('Sin faros; un bloque 2×2 adelante a la izquierda', 'No headlights; a 2×2 block at the front left', 'Sem faróis; um bloco 2×2 na frente à esquerda'),
    "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
    [[2, "R' U R U' R' f' U' R U2 R' U' R U' R' f R"], [3, "R' U R' U' y R' F' R2 U' R' U R' F R F"]]),
  pll('Y', bi('Sin faros; dos bloques de 2: al frente del lado izquierdo y a la derecha del lado de atrás', 'No headlights; two 2-blocks: at the front on the left side and on the right of the back side', 'Sem faróis; dois blocos de 2: na frente do lado esquerdo e à direita do lado de trás'),
    "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    [[2, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [3, "R2 U' R2 U' R2 U F U F' R2 F U' F'"]]),
  pll('Na', bi('Sin faros; cada lado tiene un bloque de 2 en su extremo derecho (mirándolo de frente)', 'No headlights; each side has a 2-block at its right end (facing it)', 'Sem faróis; cada lado tem um bloco de 2 na ponta direita (olhando de frente)'),
    "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    [[2, "F' R U R' U' R' F R2 F U' R' U' R U F' R'"], [3, "R F U' R' U R U F' R2 F' R U R U' R' F"]]),
  pll('Nb', bi('Sin faros; cada lado tiene un bloque de 2 en su extremo izquierdo (mirándolo de frente)', 'No headlights; each side has a 2-block at its left end (facing it)', 'Sem faróis; cada lado tem um bloco de 2 na ponta esquerda (olhando de frente)'),
    "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    [[2, "r' D' F r U' r' F' D r2 U r' U' r' F r F'"], [3, "R' U L' U2 R U' L R' U L' U2 R U' L"]]),
];

export const pllPhase: Phase = {
  id: 'cfopc-pll',
  name: bi('PLL', 'PLL', 'PLL'),
  goal: bi(
    [
      '**Meta:** cada pieza de arriba en su sitio: cubo resuelto.',
      '**Casos:** 21. Ya sabes 6 del PLL en 2 pasos: T, Y, Ua, Ub, H y Z.',
    ].join('\n'),
    [
      '**Goal:** every top piece in its place: cube solved.',
      '**Cases:** 21. You already know 6 from 2-step PLL: T, Y, Ua, Ub, H and Z.',
    ].join('\n'),
    [
      '**Meta:** cada peça de cima no seu lugar: cubo resolvido.',
      '**Casos:** 21. Você já sabe 6 do PLL em 2 passos: T, Y, Ua, Ub, H e Z.',
    ].join('\n'),
  ),
  description: bi(
    [
      '## Cómo reconocer el caso',
      'Mira los lados de la capa de arriba y cuenta cuántos tienen **las 2 esquinas del mismo color**: con faros (la arista del medio, distinta) o el lado completo.',
      '- **Los 4:** las esquinas ya están; solo se mueven aristas. Ua, Ub, H o Z.',
      '- **Uno:** A mueve 3 esquinas; T, F, J, R y G cambian 2 esquinas vecinas.',
      '- **Ninguno:** V, Y o N (cambian 2 esquinas en diagonal), o la E.',
      'Los **bloques** (una esquina y la arista de al lado, del mismo color) dicen el caso exacto. Gira `U` hasta verlo como en la figura, haz el algoritmo y, si hace falta, un `U` al final.',
    ].join('\n'),
    [
      '## How to recognize the case',
      'Look at the sides of the top layer and count how many have **both corners the same color**: headlights (the middle edge different) or a solved side.',
      '- **All 4:** the corners are already placed; only edges move. Ua, Ub, H or Z.',
      '- **One:** A cycles 3 corners; T, F, J, R and G swap 2 adjacent corners.',
      '- **None:** V, Y or N (they swap 2 diagonal corners), or the E.',
      '**Blocks** (a corner and the edge next to it, the same color) tell you the exact case. Turn `U` until you see it as in the figure, do the algorithm and, if needed, a `U` at the end.',
    ].join('\n'),
    [
      '## Como reconhecer o caso',
      'Olhe os lados da camada de cima e conte quantos têm **as 2 quinas da mesma cor**: com faróis (a aresta do meio, diferente) ou o lado completo.',
      '- **Os 4:** as quinas já estão no lugar; só as arestas se movem. Ua, Ub, H ou Z.',
      '- **Um:** A move 3 quinas; T, F, J, R e G trocam 2 quinas vizinhas.',
      '- **Nenhum:** V, Y ou N (trocam 2 quinas na diagonal), ou a E.',
      'Os **blocos** (uma quina e a aresta ao lado, da mesma cor) dizem o caso exato. Gire `U` até vê-lo como na figura, faça o algoritmo e, se precisar, um `U` no final.',
    ].join('\n'),
  ),
  tips: bi(
    [
      '- **No reconoces el caso:** hazlo en 2 pasos, como en el CFOP reducido: T o Y para las esquinas; Ua, Ub, H o Z para las aristas.',
      '- **Confundes las G:** son las más difíciles de distinguir. Apréndelas de a una y fíjate en dónde queda el bloque respecto a los faros.',
      '- **No quedó resuelto:** prueba un `U` más. Si aún no está, lo empezaste desde otro ángulo y quedó otro PLL: reconócelo y sigue.',
    ].join('\n'),
    [
      "- **You don't recognize the case:** do it in 2 steps, as in reduced CFOP: T or Y for the corners; Ua, Ub, H or Z for the edges.",
      '- **You mix up the Gs:** they are the hardest to tell apart. Learn them one at a time and look at where the block sits relative to the headlights.',
      "- **It didn't come out solved:** try one more `U`. If it still isn't, you started from another angle and got another PLL: recognize it and go on.",
    ].join('\n'),
    [
      '- **Não reconhece o caso:** faça em 2 passos, como no CFOP reduzido: T ou Y para as quinas; Ua, Ub, H ou Z para as arestas.',
      '- **Confunde os G:** são os mais difíceis de distinguir. Aprenda um de cada vez e repare onde fica o bloco em relação aos faróis.',
      '- **Não ficou resolvido:** tente mais um `U`. Se ainda não estiver, você começou de outro ângulo e saiu outro PLL: reconheça-o e continue.',
    ].join('\n'),
  ),
  diagram: 'top',
  groups: [
    {
      id: 'cfopc-pll-aristas',
      name: bi('Solo aristas', 'Edges only', 'Só arestas'),
      description: bi(
        '**Faros o lado completo en los 4 lados:** las esquinas ya están; solo se mueven las aristas.',
        '**Headlights or a solved side on all 4 sides:** the corners are already in place; only the edges move.',
        '**Faróis ou lado completo nos 4 lados:** as quinas já estão no lugar; só as arestas se movem.',
      ),
      cases: edges,
    },
    {
      id: 'cfopc-pll-esquinas',
      name: bi('Solo esquinas', 'Corners only', 'Só quinas'),
      description: bi(
        'Las aristas ya están; solo se mueven las esquinas.\n- **Aa y Ab:** faros en un lado y un bloque 2×2.\n- **E:** sin faros ni bloques.',
        'The edges are already in place; only the corners move.\n- **Aa and Ab:** headlights on one side and a 2×2 block.\n- **E:** no headlights or blocks.',
        'As arestas já estão no lugar; só as quinas se movem.\n- **Aa e Ab:** faróis num lado e um bloco 2×2.\n- **E:** sem faróis nem blocos.',
      ),
      cases: corners,
    },
    {
      id: 'cfopc-pll-adyacentes',
      name: bi('Cambio de esquinas vecinas', 'Adjacent corner swap', 'Troca de quinas vizinhas'),
      description: bi(
        'Un solo lado con las 2 esquinas iguales (faros; en F y J, lado completo). Se cambian las 2 esquinas del lado opuesto.\nMira dónde quedan los bloques respecto a los faros.',
        'Only one side with both corners the same color (headlights; in F and J, a solved side). The 2 corners of the opposite side swap.\nLook at where the blocks sit relative to the headlights.',
        'Só um lado com as 2 quinas iguais (faróis; em F e J, lado completo). Trocam-se as 2 quinas do lado oposto.\nVeja onde ficam os blocos em relação aos faróis.',
      ),
      cases: adjacent,
    },
    {
      id: 'cfopc-pll-diagonales',
      name: bi('Cambio de esquinas en diagonal', 'Diagonal corner swap', 'Troca de quinas na diagonal'),
      description: bi(
        'Se cambian las dos esquinas opuestas: **ningún lado tiene faros**.\nMira los bloques:\n- **V:** un bloque 2×2.\n- **Y:** dos bloques de 2 separados.\n- **N:** un bloque en cada lado.',
        'Two opposite corners are swapped: **no side has headlights**.\nLook at the blocks:\n- **V:** one 2×2 block.\n- **Y:** two separate 2-blocks.\n- **N:** one block on each side.',
        'Trocam-se as duas quinas opostas: **nenhum lado tem faróis**.\nVeja os blocos:\n- **V:** um bloco 2×2.\n- **Y:** dois blocos de 2 separados.\n- **N:** um bloco em cada lado.',
      ),
      cases: diagonal,
    },
  ],
  progression: bi(
    [
      '1. **Ua, Ub, H, Z, T y Y:** los del PLL en 2 pasos. Si ya los sabes, repásalos.',
      '2. **Ja, Jb, Aa y Ab:** cortos y fáciles de ver.',
      '3. **F, Ra, Rb, V y E.**',
      '4. **Ga, Gb, Gc y Gd:** los más difíciles de distinguir; de a uno. Juntos salen en 2 de cada 9 resoluciones.',
      '5. **Na y Nb:** al final. Largos y raros (1 de cada 72 resoluciones cada uno, como H).',
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
    [
      '1. **Ua, Ub, H, Z, T e Y:** os do PLL em 2 passos. Se já sabe, revise.',
      '2. **Ja, Jb, Aa e Ab:** curtos e fáceis de ver.',
      '3. **F, Ra, Rb, V e E.**',
      '4. **Ga, Gb, Gc e Gd:** os mais difíceis de distinguir; um de cada vez. Juntos aparecem em 2 de cada 9 resoluções.',
      '5. **Na e Nb:** no final. Longos e raros (1 a cada 72 resoluções cada um, como H).',
      'Aprenda juntos os pares inversos: Ua e Ub, Aa e Ab, Ga e Gb, Gc e Gd.',
    ].join('\n'),
  ),
  quizzes: [],
};

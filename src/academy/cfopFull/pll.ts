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

const M_NOTE = bi('`M` se gira en la misma dirección que `L`.', '`M` turns in the same direction as `L`.', '`M` gira na mesma direção que `L`.');
const inverse = (a: string, b: string) =>
  bi(`${a} y ${b} son inversos: la preparación de uno es el algoritmo del otro.`, `${a} and ${b} are inverses: the setup of one is the algorithm of the other.`, `${a} e ${b} são inversos: a preparação de um é o algoritmo do outro.`);

const edges = [
  pll('Ua', bi('Lado completo atrás; la arista del frente es del color del centro derecho', 'Solved side at the back; the front edge matches the right center', 'Lado completo atrás; a aresta da frente é da cor do centro da direita'),
    "M2 U M U2 M' U M2",
    [[2, "U2 R U R' U R' U' R2 U' R' U R' U R"], [3, "U' R2 U' S' U2 S U' R2"], [4, "R U' R U R U R U' R' U' R2"]],
    cat(inverse('Ua', 'Ub'), M_NOTE)),
  pll('Ub', bi('Lado completo atrás; la arista del frente es del color del centro izquierdo', 'Solved side at the back; the front edge matches the left center', 'Lado completo atrás; a aresta da frente é da cor do centro da esquerda'),
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
  pll('E', bi('Sin faros ni bloques; aristas resueltas. Al frente, la esquina izquierda es del color del centro izquierdo y la derecha, del color del centro derecho', 'No headlights or blocks; edges solved. At the front, the left corner matches the left center and the right corner the right center', 'Sem faróis nem blocos; arestas resolvidas. Na frente, a quina da esquerda é da cor do centro da esquerda, e a da direita, da cor do centro da direita'),
    "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    [[2, "R' U' R' D' R U' R' D R U R' D' R U R' D R2"], [3, "U R2 U F' R' U R U' R' U R U' R' U R U' F U' R2"]]),
];

const adjacent = [
  pll('T', bi('Faros a la izquierda; al frente y atrás, bloques de 2 pegados a ellos', 'Headlights on the left; at the front and back, 2-piece blocks next to them', 'Faróis à esquerda; na frente e atrás, blocos de 2 colados neles'),
    "R U R' U' R' F R2 U' R' U' R U R' F'",
    [[3, "R U R' U' R' F R2 U' R' U F' L' U L"], [4, "R2 u R2 u' R2 F2 u' F2 u F2"]]),
  pll('F', bi('Lado completo a la izquierda; a la derecha, la arista entre dos esquinas de colores opuestos', 'Solved side on the left; on the right, the edge between two corners of opposite colors', 'Lado completo à esquerda; à direita, a aresta entre duas quinas de cores opostas'),
    "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    [[2, "R' F R f' R' F R2 U R' U' R' F' R2 U R' S"], [3, "U' R' U R U' R2 F' U' F U R F R' F' R2"]]),
  pll('Ja', bi('Lado completo a la izquierda; al frente, bloque de 2 pegado a él', 'Solved side on the left; at the front, a 2-piece block next to it', 'Lado completo à esquerda; na frente, bloco de 2 colado nele'),
    "x R2 F R F' R U2 r' U r U2 x'",
    [[2, "U' R' U L' U2 R U' R' U2 R L"], [3, "U2 L' U' L F L' U' L U L F' L2 U L"]]),
  pll('Jb', bi('Lado completo a la izquierda; al frente, bloque de 2 en el extremo derecho', 'Solved side on the left; at the front, a 2-piece block at the right end', 'Lado completo à esquerda; na frente, bloco de 2 na ponta direita'),
    "R U R' F' R U R' U' R' F R2 U' R'",
    [[2, "R U2 R' U' R U2 L' U R' U' L"], [3, "r' F R F' r U2 R' U R U2 R'"]]),
  pll('Ra', bi('Faros a la izquierda; un solo bloque de 2, al frente, pegado a ellos', 'Headlights on the left; a single 2-piece block, at the front, next to them', 'Faróis à esquerda; um único bloco de 2, na frente, colado neles'),
    "R U' R' U' R U R D R' U' R D' R' U2 R'",
    [[2, "R U R' F' R U2 R' U2 R' F R U R U2 R'"], [3, "U' L U2 L' U2 L F' L' U' L U L F L2"]]),
  pll('Rb', bi('Faros al frente; un solo bloque de 2, a la izquierda, pegado a ellos', 'Headlights at the front; a single 2-piece block, on the left, next to them', 'Faróis na frente; um único bloco de 2, à esquerda, colado neles'),
    "R' U2 R U2 R' F R U R' U' R' F' R2",
    [[2, "U R2 F R U R U' R' F' R U2 R' U2 R"], [3, "R' U2 R' D' R U' R' D R U R U' R' U' R"]]),
  pll('Ga', bi('Faros a la izquierda; un solo bloque de 2, al frente, en el extremo derecho', 'Headlights on the left; a single 2-piece block, at the front, at the right end', 'Faróis à esquerda; um único bloco de 2, na frente, na ponta direita'),
    "R2 U R' U R' U' R U' R2 D U' R' U R D'",
    [[2, "R2 u R' U R' U' R u' R2 F' U F"], [4, "D' R2 U R' U R' U' R U' R2 U' D R' U R"]], inverse('Ga', 'Gb')),
  pll('Gb', bi('Faros a la izquierda; un solo bloque de 2, a la derecha, en el extremo de atrás', 'Headlights on the left; a single 2-piece block, on the right, at the back end', 'Faróis à esquerda; um único bloco de 2, à direita, na ponta de trás'),
    "D R' U' R U D' R2 U R' U R U' R U' R2",
    [[2, "R' U' R U D' R2 U R' U R U' R U' R2 D"], [3, "U F' U' F R2 u R' U R U' R u' R2"]], inverse('Gb', 'Ga')),
  pll('Gc', bi('Faros a la izquierda; un solo bloque de 2, atrás, en el extremo que toca la cara derecha', 'Headlights on the left; a single 2-piece block, at the back, at the end touching the right face', 'Faróis à esquerda; um único bloco de 2, atrás, na ponta que toca a face direita'),
    "R2 U' R U' R U R' U R2 D' U R U' R' D",
    [[2, "U2 R2 F2 R U2 R U2 R' F R U R' U' R' F R2"], [3, "D R2 U' R U' R U R' U R2 D' U R U' R'"]], bi('Gc y Gd son inversos: uno deshace al otro.', 'Gc and Gd are inverses: each undoes the other.', 'Gc e Gd são inversos: um desfaz o outro.')),
  pll('Gd', bi('Faros a la izquierda; un solo bloque de 2, a la derecha, en el extremo de adelante', 'Headlights on the left; a single 2-piece block, on the right, at the front end', 'Faróis à esquerda; um único bloco de 2, à direita, na ponta da frente'),
    "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    [[2, "D' R U R' U' D R2 U' R U' R' U R' U R2"], [3, "R U R' y' R2 u' R U' R' U R' u R2"]], bi('Gd y Gc son inversos: uno deshace al otro.', 'Gd and Gc are inverses: each undoes the other.', 'Gd e Gc são inversos: um desfaz o outro.')),
];

const diagonal = [
  pll('V', bi('Sin faros; un bloque 2×2 adelante a la izquierda', 'No headlights; a 2×2 block at the front left', 'Sem faróis; um bloco 2×2 na frente à esquerda'),
    "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
    [[2, "R' U R U' R' f' U' R U2 R' U' R U' R' f R"], [3, "R' U R' U' y R' F' R2 U' R' U R' F R F"]]),
  pll('Y', bi('Sin faros; dos bloques de 2: al frente, en el extremo izquierdo, y a la derecha, en el extremo de atrás', 'No headlights; two 2-piece blocks: at the front, at the left end, and on the right, at the back end', 'Sem faróis; dois blocos de 2: na frente, na ponta esquerda, e à direita, na ponta de trás'),
    "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    [[2, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [3, "R2 U' R2 U' R2 U F U F' R2 F U' F'"]]),
  pll('Na', bi('Sin faros; cada lado tiene un bloque de 2 en su extremo derecho (mirándolo de frente)', 'No headlights; each side has a 2-piece block at its right end (as you face it)', 'Sem faróis; cada lado tem um bloco de 2 na ponta direita (olhando para ele de frente)'),
    "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    [[2, "F' R U R' U' R' F R2 F U' R' U' R U F' R'"], [3, "R F U' R' U R U F' R2 F' R U R U' R' F"]]),
  pll('Nb', bi('Sin faros; cada lado tiene un bloque de 2 en su extremo izquierdo (mirándolo de frente)', 'No headlights; each side has a 2-piece block at its left end (as you face it)', 'Sem faróis; cada lado tem um bloco de 2 na ponta esquerda (olhando para ele de frente)'),
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
      '**Cases:** 21. You already know 6 from 2-look PLL: T, Y, Ua, Ub, H and Z.',
    ].join('\n'),
    [
      '**Meta:** cada peça de cima no seu lugar: cubo resolvido.',
      '**Casos:** 21. Você já sabe 6 do PLL em 2 passos: T, Y, Ua, Ub, H e Z.',
    ].join('\n'),
  ),
  description: bi(
    [
      '## Cómo reconocer el caso',
      'Mira los 4 lados de la capa de arriba y cuenta en cuántos **las 2 esquinas son del mismo color**. Puede ser con faros (la arista del medio es de otro color) o con el lado completo.',
      '- **En los 4:** las esquinas ya están en su sitio y solo se mueven aristas: Ua, Ub, H o Z.',
      '- **En uno:** Aa y Ab mueven 3 esquinas. T, F, J, R y G cambian 2 esquinas vecinas.',
      '- **En ninguno:** V, Y y N cambian 2 esquinas en diagonal. El E mueve las 4 esquinas.',
      'Los **bloques** (una esquina y la arista de al lado, del mismo color) dicen el caso exacto. Gira `U` hasta verlo como en la figura, haz el algoritmo y, si hace falta, el giro de `U` final (AUF).',
    ].join('\n'),
    [
      '## How to recognize the case',
      'Look at the 4 sides of the top layer and count how many have **both corners the same color**. That can be headlights (the middle edge is a different color) or a solved side.',
      '- **All 4:** the corners are already in place and only edges move: Ua, Ub, H or Z.',
      '- **One:** Aa and Ab cycle 3 corners. T, F, J, R and G swap 2 adjacent corners.',
      '- **None:** V, Y and N swap 2 diagonal corners. E moves all 4 corners.',
      '**Blocks** (a corner and the edge next to it, matching in color) tell you the exact case. Turn `U` until you see it as in the diagram, do the algorithm and, if needed, the final `U` move (AUF).',
    ].join('\n'),
    [
      '## Como reconhecer o caso',
      'Olhe os 4 lados da camada de cima e conte em quantos **as 2 quinas são da mesma cor**. Isso acontece com faróis (a aresta do meio é de outra cor) ou com o lado completo.',
      '- **Nos 4:** as quinas já estão no lugar e só as arestas se movem: Ua, Ub, H ou Z.',
      '- **Em um:** Aa e Ab movem 3 quinas. T, F, J, R e G trocam 2 quinas vizinhas.',
      '- **Em nenhum:** V, Y e N trocam 2 quinas na diagonal. O E move as 4 quinas.',
      'Os **blocos** (uma quina e a aresta ao lado, da mesma cor) indicam o caso exato. Gire `U` até vê-lo como na figura, faça o algoritmo e, se precisar, o movimento final de `U` (AUF).',
    ].join('\n'),
  ),
  tips: bi(
    [
      '- **No reconoces el caso:** hazlo en 2 pasos, como en el CFOP reducido: primero las esquinas con T o Y y luego las aristas con Ua, Ub, H o Z.',
      '- **Confundes los G:** son los más difíciles de distinguir. Apréndelos uno a uno y fíjate en dónde queda el bloque respecto a los faros.',
      '- **No quedó resuelto:** gira `U` hasta alinear la capa de arriba. Si aún no está, empezaste desde otro ángulo y quedó otro PLL: reconócelo y sigue.',
    ].join('\n'),
    [
      "- **You don't recognize the case:** do it in 2 looks, as in reduced CFOP: first the corners with T or Y, then the edges with Ua, Ub, H or Z.",
      "- **You mix up the Gs:** they're the hardest to tell apart. Learn them one at a time and look at where the block sits relative to the headlights.",
      "- **The cube isn't solved at the end:** turn `U` until the top layer lines up. If it still isn't solved, you started from another angle and got another PLL: recognize it and keep going.",
    ].join('\n'),
    [
      '- **Não reconhece o caso:** faça em 2 passos, como no CFOP reduzido: primeiro as quinas com T ou Y e depois as arestas com Ua, Ub, H ou Z.',
      '- **Confunde os G:** são os mais difíceis de distinguir. Aprenda um de cada vez e repare onde fica o bloco em relação aos faróis.',
      '- **Não ficou resolvido:** gire `U` até alinhar a camada de cima. Se ainda não estiver, você começou de outro ângulo e saiu outro PLL: reconheça-o e continue.',
    ].join('\n'),
  ),
  diagram: 'top',
  groups: [
    {
      id: 'cfopc-pll-aristas',
      name: bi('Solo aristas', 'Edges only', 'Só arestas'),
      description: bi(
        'En los **4 lados** hay faros o el lado completo: las esquinas ya están en su sitio y solo se mueven las aristas.',
        '**All 4 sides** show headlights or are fully solved: the corners are already in place and only the edges move.',
        '**Os 4 lados** têm faróis ou estão completos: as quinas já estão no lugar e só as arestas se movem.',
      ),
      cases: edges,
    },
    {
      id: 'cfopc-pll-esquinas',
      name: bi('Solo esquinas', 'Corners only', 'Só quinas'),
      description: bi(
        'Las aristas ya están en su sitio y solo se mueven las esquinas.\n- **Aa y Ab:** faros en un lado y un bloque 2×2.\n- **E:** sin faros ni bloques.',
        'The edges are already in place and only the corners move.\n- **Aa and Ab:** headlights on one side and a 2×2 block.\n- **E:** no headlights or blocks.',
        'As arestas já estão no lugar e só as quinas se movem.\n- **Aa e Ab:** faróis num lado e um bloco 2×2.\n- **E:** sem faróis nem blocos.',
      ),
      cases: corners,
    },
    {
      id: 'cfopc-pll-adyacentes',
      name: bi('Cambio de esquinas vecinas', 'Adjacent corner swap', 'Troca de quinas vizinhas'),
      description: bi(
        '**Solo un lado** tiene las 2 esquinas del mismo color: faros, o el lado completo en F y J. Se cambian las 2 esquinas del lado opuesto.\nPara saber el caso, mira dónde quedan los bloques respecto a ese lado.',
        '**Only one side** has both corners the same color: headlights, or a solved side in F and J. The 2 corners of the opposite side swap.\nTo tell which case it is, look at where the blocks sit relative to that side.',
        '**Só um lado** tem as 2 quinas da mesma cor: faróis, ou o lado completo em F e J. As 2 quinas do lado oposto trocam de lugar.\nPara saber qual é o caso, veja onde ficam os blocos em relação a esse lado.',
      ),
      cases: adjacent,
    },
    {
      id: 'cfopc-pll-diagonales',
      name: bi('Cambio de esquinas en diagonal', 'Diagonal corner swap', 'Troca de quinas na diagonal'),
      description: bi(
        '**Ningún lado** tiene faros: se cambian 2 esquinas opuestas en diagonal.\nMira los bloques:\n- **V:** un bloque 2×2.\n- **Y:** dos bloques de 2 separados.\n- **N:** un bloque en cada lado.',
        '**No side** has headlights: 2 opposite corners swap along the diagonal.\nLook at the blocks:\n- **V:** one 2×2 block.\n- **Y:** two separate 2-piece blocks.\n- **N:** one block on each side.',
        '**Nenhum lado** tem faróis: 2 quinas opostas trocam de lugar na diagonal.\nVeja os blocos:\n- **V:** um bloco 2×2.\n- **Y:** dois blocos de 2 separados.\n- **N:** um bloco em cada lado.',
      ),
      cases: diagonal,
    },
  ],
  progression: bi(
    [
      '1. **Ua, Ub, H, Z, T y Y:** los del PLL en 2 pasos. Si ya los sabes, repásalos.',
      '2. **Ja, Jb, Aa y Ab:** cortos y fáciles de ver.',
      '3. **F, Ra, Rb, V y E.**',
      '4. **Ga, Gb, Gc y Gd:** son los más difíciles de distinguir, así que apréndelos uno a uno. Juntos salen en 2 de cada 9 resoluciones.',
      '5. **Na y Nb:** al final. Largos y raros (1 de cada 72 resoluciones cada uno, como H).',
      'Aprende juntos los pares inversos: Ua y Ub, Aa y Ab, Ga y Gb, Gc y Gd.',
    ].join('\n'),
    [
      '1. **Ua, Ub, H, Z, T and Y:** the ones from 2-look PLL. If you already know them, review them.',
      '2. **Ja, Jb, Aa and Ab:** short and easy to see.',
      '3. **F, Ra, Rb, V and E.**',
      "4. **Ga, Gb, Gc and Gd:** they're the hardest to tell apart, so learn them one at a time. Together they come up in 2 out of 9 solves.",
      '5. **Na and Nb:** last. Long and rare (1 in 72 solves each, like H).',
      'Learn the inverse pairs together: Ua and Ub, Aa and Ab, Ga and Gb, Gc and Gd.',
    ].join('\n'),
    [
      '1. **Ua, Ub, H, Z, T e Y:** os do PLL em 2 passos. Se já sabe, revise.',
      '2. **Ja, Jb, Aa e Ab:** curtos e fáceis de ver.',
      '3. **F, Ra, Rb, V e E.**',
      '4. **Ga, Gb, Gc e Gd:** são os mais difíceis de distinguir, então aprenda um de cada vez. Juntos aparecem em 2 a cada 9 resoluções.',
      '5. **Na e Nb:** no final. Longos e raros (1 a cada 72 resoluções cada um, como o H).',
      'Aprenda juntos os pares inversos: Ua e Ub, Aa e Ab, Ga e Gb, Gc e Gd.',
    ].join('\n'),
  ),
  quizzes: [],
};

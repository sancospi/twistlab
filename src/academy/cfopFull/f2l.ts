// CFOP completo, F2L: SpeedCubeDB's 41 cases (ids cfopc-f2l-01…41), all for the front-right slot.
// Main = SpeedCubeDB's #1 for Front Right; extras = the next ones on its list (fetched 2026-10-21), at most 3, each
// with the U turn it needs here. Left out: algs that don't solve the case in the simulator, 0 votes, over twice the
// main alg's length, or the same face turns as a variant already kept (the rotation-free version wins). The 3 mains
// that start with y' (13, 18, 20) also keep SpeedCubeDB's version without the y' (d or F turns), the reducido's Plan B.
// Setup = the main alg undone (face turns when it has a rotation). Recognition = the state right after the setup.
import { tr } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { scdbUrl } from '../scdb.ts';

// Recognition strings are formulaic: the English is derived phrase by phrase from the Spanish.
const REC_EN: Record<string, string> = {
  'Esquina arriba adelante a la derecha': 'Corner up front-right',
  'Esquina en la ranura': 'Corner in the slot',
  'blanco al frente': 'white facing front',
  'blanco a la derecha': 'white facing right',
  'blanco arriba': 'white facing up',
  'blanco abajo': 'white facing down',
  'arista arriba-derecha': 'edge up-right',
  'arista arriba-izquierda': 'edge up-left',
  'arista arriba-atrás': 'edge up-back',
  'arista arriba-adelante': 'edge up-front',
  'arista volteada en la ranura': 'edge flipped in the slot',
  'arista bien puesta en la ranura': 'edge correctly placed in the slot',
  'verde arriba': 'green up',
  'naranja arriba': 'orange up',
};
const REC_PT: Record<string, string> = {
  'Esquina arriba adelante a la derecha': 'Quina em cima na frente à direita',
  'Esquina en la ranura': 'Quina no slot',
  'blanco al frente': 'branco na frente',
  'blanco a la derecha': 'branco à direita',
  'blanco arriba': 'branco em cima',
  'blanco abajo': 'branco embaixo',
  'arista arriba-derecha': 'aresta em cima à direita',
  'arista arriba-izquierda': 'aresta em cima à esquerda',
  'arista arriba-atrás': 'aresta em cima atrás',
  'arista arriba-adelante': 'aresta em cima na frente',
  'arista volteada en la ranura': 'aresta invertida no slot',
  'arista bien puesta en la ranura': 'aresta bem colocada no slot',
  'verde arriba': 'verde em cima',
  'naranja arriba': 'laranja em cima',
};
const recIn = (dict: Record<string, string>) => (r: string) => r.replace(/[^,;]+/g, (m) => m.replace(m.trim(), (k) => dict[k] ?? k));
const recEn = recIn(REC_EN);
const recPt = recIn(REC_PT);

const Y_NOTE = tr('Empieza con y′: giras todo el cubo. Si no quieres rotar, usa la alternativa sin y′.', 'Starts with y′: you rotate the whole cube. If you would rather not rotate, use the alternative without y′.', 'Começa com y′: você gira o cubo inteiro. Se não quiser rotacionar, use a alternativa sem y′.');

/** n = SpeedCubeDB's F2L number; reduced = the same case's code in CFOP reducido. */
function F2L(n: number, recognition: string, alg: string, setup: string, alts: [number, string][], y = false, reduced?: string): Case {
  const parts = [y ? Y_NOTE : null, reduced ? tr(`Caso ${reduced} del CFOP reducido.`, `Case ${reduced} of the reduced CFOP.`, `Caso ${reduced} do CFOP reduzido.`) : null].filter((p) => p !== null);
  const note = parts.length ? tr(parts.map((p) => p.es).join(' '), parts.map((p) => p.en).join(' '), parts.map((p) => p.pt!).join(' ')) : null;
  const code = String(n).padStart(2, '0');
  return {
    id: `cfopc-f2l-${code}`,
    code,
    name: tr(`F2L ${n}`, `F2L ${n}`, `F2L ${n}`),
    recognition: tr(recognition, recEn(recognition), recPt(recognition)),
    stage: 'f2l',
    algs: [
      { id: 'main', alg, source: 'speedcubedb', rank: 1 },
      ...alts.map(([rank, a]) => ({ id: `scdb-${rank}`, alg: a, source: 'speedcubedb' as const, rank })),
    ],
    setup,
    scdb: { set: 'F2L', id: String(n), url: scdbUrl('F2L', String(n)) },
    ...(note ? { note } : {}),
  };
}

const libres = [
  F2L(1, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-derecha, verde arriba', "U R U' R'", "R U R' U'", [[2, "R' F R F'"], [3, "y' r' U' R U M'"], [4, "y U F' L F L2 U L"]], false, 'A1'),
  F2L(2, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-adelante, naranja arriba', "F R' F' R", "R' F R F'", [[3, "U' F' U F"]], false, 'A2'),
  F2L(3, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-izquierda, naranja arriba', "F' U' F", "F' U F", [[4, "S U R U' R' S'"]], false, 'A4'),
  F2L(4, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-atrás, verde arriba', "R U R'", "R U' R'", [], false, 'A3'),
];
const separadas = [
  F2L(5, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-atrás, verde arriba', "U' R U R' U2 R U' R'", "R U R' U2 R U' R' U", [[2, "F2 L' U' L U F2"], [3, "U' R U R' U' R U2 R'"], [4, "U' R U R' U R' F R F'"]], false, 'B1'),
  F2L(6, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-izquierda, naranja arriba', "U' r U' R' U R U r'", "r U' R' U' R U r' U", [[3, "d R' U' R U2 R' U R"]], false, 'B2'),
  F2L(7, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-izquierda, verde arriba', "U' R U2 R' U' R U2 R'", "R U2 R' U R U2 R' U", [[2, "M' U' M U2 r U' r'"], [3, "U' R U2 R' U2 R U' R'"], [4, "U' R U2 R' U R' F R F'"]], false, 'C1'),
  F2L(8, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-atrás, naranja arriba', "r' U2 R2 U R2 U r", "r' U' R2 U' R2 U2 r", [[2, "d R' U2 R U R' U2 R"], [3, "y' U R' U2 R U2 R' U R"]], false, 'C2'),
  F2L(9, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-atrás, naranja arriba', "U' R U' R' U F' U' F", "F' U F U' R U R' U", [[2, "F R U R' U' F' R U' R'"], [4, "d R' U' R U' R' U' R"]]),
  F2L(10, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-izquierda, verde arriba', "U' R U R' U R U R'", "R U' R' U' R U' R' U", [[2, "U2 R U' R' U' R U R'"], [3, "d R' U R d' R U R'"]]),
  F2L(19, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-atrás, verde arriba', "U R U2 R' U R U' R'", "R U R' U' R U2 R' U'", [[2, "U R U2 R2 F R F'"], [4, "R U' R' U R U' R' U R U R'"]], false, 'D3'),
  F2L(20, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-izquierda, naranja arriba', "y' U' R' U2 R U' R' U R", "F' U' F U F' U2 F U", [[2, "U' R U' R2 F R F' R U' R'"], [4, "U' F' U2 F U' F' U F"]], true, 'D4'),
  F2L(21, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-izquierda, verde arriba', "U2 R U R' U R U' R'", "R U R' U' R U' R' U2", [[2, "R U' R' U2 R U R'"], [3, "R B U2 B' R'"]]),
  F2L(22, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-atrás, naranja arriba', "r U' r' U2 r U r'", "r U' r' U2 r U r'", [[2, "F' L' U2 L F"], [3, "y' U2 R' U' R U' R' U R"]]),
];
const juntas = [
  F2L(11, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-derecha, naranja arriba', "U' R U2 R' U F' U' F", "F' U F U' R U2 R' U", [[2, "y' R U2 R2 U' R2 U' R'"], [4, "F' U L' U2 L U2 F"]]),
  F2L(12, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-adelante, verde arriba', "R U' R' U R U' R' U2 R U' R'", "R U R' U2 R U R' U' R U R'", [[2, "R' U2 R2 U R2 U R"], [3, "U F' U2 F U' R U R'"], [4, "U R U' R' U' R U R' U' R U R'"]]),
  F2L(13, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-adelante, naranja arriba', "y' U R' U R U' R' U' R", "F' U F U F' U' F U'", [[2, "M' U' R U R' U2 R U' r'"], [3, "R U' R' U R' F R F' R U' R'"], [4, "d R' U R U' R' U' R"]], true, 'B4'),
  F2L(14, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-derecha, verde arriba', "U' R U' R' U R U R'", "R U' R' U' R U R' U", [[2, "R U2 R' U2 R U R' U2 R U' R'"], [3, "U' R2 D R' U R D' R2"], [4, "U2 R2 U R' U R U2 R2"]], false, 'B3'),
  F2L(15, 'Esquina arriba adelante a la derecha, blanco al frente; arista arriba-adelante, verde arriba', "M U r U' r' U' M'", "M U r U r' U' M'", [[2, "R U R' U2 R U' R' U R U' R'"], [3, "R' D' R U' R' D R U R U' R'"], [4, "F' U F U2 R U R'"]]),
  F2L(16, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista arriba-derecha, naranja arriba', "R U' R' U2 F' U' F", "F' U F U2 R U R'", [[3, "U M' U R U' r' U' R U R'"], [4, "U F U R U' R' F' R U R'"]]),
  F2L(17, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-derecha, verde arriba', "R U2 R' U' R U R'", "R U' R' U R U2 R'", [[3, "R U R' U' R U2 R' U2 R U R'"]], false, 'D1'),
  F2L(18, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-adelante, naranja arriba', "y' R' U2 R U R' U' R", "F' U F U' F' U2 F", [[3, "F' U2 F U F' U' F"], [4, "R' F R F' R U' R' U R U' R'"]], true, 'D2'),
  F2L(23, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-adelante, verde arriba', "U R U' R' U' R U' R' U R U' R'", "R U R' U' R U R' U R U R' U'", [[2, "R U R' U2 R U R' U' R U R'"], [3, "U2 R2 U2 R' U' R U' R2"], [4, "R U' R2 D' R U2 R' D R"]]),
  F2L(24, 'Esquina arriba adelante a la derecha, blanco arriba; arista arriba-derecha, naranja arriba', "F U R U' R' F' R U' R'", "R U R' F R U R' U' F'", [[2, "U' R U R2 F R F' R U' R'"], [3, "y' R' U' R U2 R' U' R U R' U' R"], [4, "U F' L' U L F R U R'"]]),
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
  F2L(31, 'Esquina arriba adelante a la derecha, blanco arriba; arista volteada en la ranura', "U' R' F R F' R U' R'", "R U R' F R' F' R U", [[2, "R U' R' U y' R' U R"], [3, "F' U F R U2 R'"]]),
  F2L(32, 'Esquina arriba adelante a la derecha, blanco arriba; arista bien puesta en la ranura', "U R U' R' U R U' R' U R U' R'", "R U R' U' R U R' U' R U R' U'", [[2, "R U R' U' R U R' U' R U R'"], [3, 'R2 U R2 U R2 U2 R2'], [4, "U' F R' F' R U' R U R'"]], false, 'E3'),
  F2L(33, 'Esquina arriba adelante a la derecha, blanco al frente; arista bien puesta en la ranura', "U' R U' R' U2 R U' R'", "R U R' U2 R U R' U", [[2, "y R' D R U' R' D' R"], [3, "R U R' U' R U' R' U R U' R'"], [4, "U' R U' R' U' R U2 R'"]]),
  F2L(34, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista bien puesta en la ranura', "U R U R' U2 R U R'", "R U' R' U2 R U' R' U'", [[2, "U' R U2 R' U R U R'"], [3, "U R' D' R U' R' D R"], [4, "y U L' U L U2 L' U L"]]),
  F2L(35, 'Esquina arriba adelante a la derecha, blanco al frente; arista volteada en la ranura', "U' R U R' U F' U' F", "F' U F U' R U' R' U", [[3, "U2 R U R' F R' F' R"]]),
  F2L(36, 'Esquina arriba adelante a la derecha, blanco a la derecha; arista volteada en la ranura', "U F' U' F U' R U R'", "R U' R' U F' U F U'", [[2, "U2 R' F R F' U2 R U R'"], [3, "R U R' U R U R' U' F' U' F"], [4, "R2 u R U R' U' u' R' U R'"]]),
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
  name: tr('F2L', 'F2L', 'F2L'),
  goal: tr(
    [
      '**Meta:** las dos primeras capas completas, par a par: cada esquina blanca con su arista.',
      '**Casos:** 41, todos para la ranura de adelante a la derecha. 19 ya los viste en el CFOP reducido: su nota da el código (A1, B2…).',
    ].join('\n'),
    [
      '**Goal:** the first two layers complete, pair by pair: each white corner with its edge.',
      "**Cases:** 41, all for the front-right slot. You've seen 19 in reduced CFOP: their note gives the code (A1, B2…).",
    ].join('\n'),
    [
      '**Meta:** as duas primeiras camadas completas, par a par: cada quina branca com sua aresta.',
      '**Casos:** 41, todos para o slot da frente à direita. 19 você já viu no CFOP reduzido: a nota deles traz o código (A1, B2…).',
    ].join('\n'),
  ),
  description: tr(
    [
      '## Cómo se hace',
      '1. Busca una esquina blanca y la arista de sus otros 2 colores.',
      '2. Gira el cubo entero para que su ranura quede adelante a la derecha.',
      "3. Gira `U` hasta ver el caso como en la figura. Si el algoritmo empieza con `U`, `U'` o `U2`, ese giro es parte del caso.",
      '4. Haz el algoritmo: junta las 2 piezas y mete el par.',
      'Repite con los 4 pares.',
      '## La idea',
      "Casi todos los casos juntan el par arriba y lo meten con 3 giros: `R U R'` o `R U' R'` por la derecha, `F' U' F` o `F' U F` por el frente.",
      'Si tu solución intuitiva es corta, úsala. Aprende el algoritmo cuando la tuya sea larga o te haga girar el cubo.',
    ].join('\n'),
    [
      '## How to do it',
      '1. Find a white corner and the edge with its other 2 colors.',
      '2. Rotate the whole cube so that their slot is at the front right.',
      "3. Turn `U` until you see the case as in the figure. If the algorithm starts with `U`, `U'` or `U2`, that turn is part of the case.",
      '4. Do the algorithm: it joins the 2 pieces and inserts the pair.',
      'Repeat with the 4 pairs.',
      '## The idea',
      "Almost every case joins the pair on top and inserts it with 3 moves: `R U R'` or `R U' R'` from the right, `F' U' F` or `F' U F` from the front.",
      'If your intuitive solution is short, use it. Learn the algorithm when yours is long or makes you rotate the cube.',
    ].join('\n'),
    [
      '## Como fazer',
      '1. Procure uma quina branca e a aresta das suas outras 2 cores.',
      '2. Gire o cubo inteiro para que o slot delas fique na frente à direita.',
      "3. Gire `U` até ver o caso como na figura. Se o algoritmo começa com `U`, `U'` ou `U2`, esse movimento faz parte do caso.",
      '4. Faça o algoritmo: ele junta as 2 peças e insere o par.',
      'Repita com os 4 pares.',
      '## A ideia',
      "Quase todos os casos juntam o par em cima e o inserem com 3 movimentos: `R U R'` ou `R U' R'` pela direita, `F' U' F` ou `F' U F` pela frente.",
      'Se a sua solução intuitiva for curta, use-a. Aprenda o algoritmo quando a sua for longa ou fizer você girar o cubo.',
    ].join('\n'),
  ),
  tips: tr(
    [
      '- **El par no entra:** compara el caso con la figura, giro de `U` del inicio incluido.',
      "- **Una pieza está en otra ranura:** gira el cubo entero para tener esa ranura adelante a la derecha y haz `R U R'`: la pieza sube. Sigue con el caso que veas.",
      '- **Te paras a buscar el siguiente par:** baja el ritmo y búscalo mientras metes el actual. Mejor lento y sin pausas que rápido con pausas.',
    ].join('\n'),
    [
      "- **The pair won't go in:** compare the case with the figure, including the `U` turn at the start.",
      "- **A piece is in another slot:** rotate the whole cube to have that slot at the front right and do `R U R'`: the piece comes up. Continue with the case you see.",
      '- **You stop to look for the next pair:** slow down and look for it while you insert the current one. Slow and smooth beats fast with pauses.',
    ].join('\n'),
    [
      '- **O par não entra:** compare o caso com a figura, incluindo o movimento de `U` do início.',
      "- **Uma peça está em outro slot:** gire o cubo inteiro para ter esse slot na frente à direita e faça `R U R'`: a peça sobe. Continue com o caso que aparecer.",
      '- **Você para para procurar o próximo par:** diminua o ritmo e procure-o enquanto insere o atual. Melhor devagar e sem pausas do que rápido com pausas.',
    ].join('\n'),
  ),
  diagram: 'iso',
  groups: [
    {
      id: 'cfopc-f2l-libres',
      name: tr('Pares libres', 'Free pairs', 'Pares livres'),
      description: tr('El par ya está armado o a un giro de estarlo: entra en 3 o 4 giros. **Empieza por aquí.**', 'The pair is already built or one turn away: it goes in with 3 or 4 moves. **Start here.**', 'O par já está montado ou a um movimento disso: entra com 3 ou 4 movimentos. **Comece por aqui.**'),
      cases: libres,
    },
    {
      id: 'cfopc-f2l-separadas',
      name: tr('Piezas separadas', 'Separated pieces', 'Peças separadas'),
      description: tr(
        'Esquina y arista arriba, sin tocarse: júntalas en un par y mételo. Del 19 al 22, el blanco mira arriba.',
        'Corner and edge on top, not touching: join them into a pair and insert it. In 19 to 22, white faces up.',
        'Quina e aresta em cima, sem se tocar: junte-as num par e insira. Do 19 ao 22, o branco fica para cima.',
      ),
      cases: separadas,
    },
    {
      id: 'cfopc-f2l-juntas',
      name: tr('Piezas juntas', 'Touching pieces', 'Peças juntas'),
      description: tr('Esquina y arista se tocan arriba pero no forman par. Sepáralas y júntalas bien.', "Corner and edge touch on top but don't form a pair. Separate them and join them properly.", 'Quina e aresta se tocam em cima, mas não formam par. Separe e junte do jeito certo.'),
      cases: juntas,
    },
    {
      id: 'cfopc-f2l-esquina',
      name: tr('Esquina en la ranura', 'Corner in the slot', 'Quina no slot'),
      description: tr('Esquina abajo, en su ranura; arista arriba. Saca la esquina sin perder la arista de vista.', 'Corner at the bottom, in its slot; edge on top. Take the corner out without losing sight of the edge.', 'Quina embaixo, no seu slot; aresta em cima. Tire a quina sem perder a aresta de vista.'),
      cases: esquina,
    },
    {
      id: 'cfopc-f2l-arista',
      name: tr('Arista en la ranura', 'Edge in the slot', 'Aresta no slot'),
      description: tr('Arista en su ranura, bien puesta o volteada; esquina arriba.', 'Edge in its slot, correctly placed or flipped; corner on top.', 'Aresta no seu slot, bem colocada ou invertida; quina em cima.'),
      cases: arista,
    },
    {
      id: 'cfopc-f2l-ranura',
      name: tr('Ambas en la ranura', 'Both in the slot', 'As duas no slot'),
      description: tr('Las dos en su ranura, mal puestas. Poco frecuentes y largos: déjalos para el final.', 'Both in their slot, wrongly placed. Rare and long: leave them for last.', 'As duas no seu slot, mal colocadas. Pouco frequentes e longos: deixe para o final.'),
      cases: ranura,
    },
  ],
  progression: tr(
    [
      'Orden: **pares libres → piezas separadas → piezas juntas → esquina en la ranura → arista en la ranura → ambas en la ranura**.',
      'Los 19 casos del CFOP reducido solo repásalos (su nota lo indica). Entrena los 22 nuevos.',
      '## Espejo',
      'Cuando domines un caso adelante-derecha, practica su espejo adelante-izquierda.',
      "1. Cambia `R` por `L` y `L` por `R` (también `r` y `l`).",
      "2. Invierte todos los giros: `R` pasa a `L'`, `F` a `F'`, `U'` a `U`, `y'` a `y`. Solo `M` no cambia.",
      "- Ejemplo: `R U R'` pasa a `L' U' L`.",
      '## Práctica',
      'Haz 5 resoluciones lentas por sesión buscando el siguiente par mientras insertas el actual.',
    ].join('\n'),
    [
      'Order: **free pairs → separated pieces → touching pieces → corner in the slot → edge in the slot → both in the slot**.',
      'For the 19 cases of the reduced CFOP, just review them (their note says which). Train the 22 new ones.',
      '## Mirror',
      'Once you master a front-right case, practice its front-left mirror.',
      "1. Swap `R` and `L` (also `r` and `l`).",
      "2. Invert all the turns: `R` becomes `L'`, `F` becomes `F'`, `U'` becomes `U`, `y'` becomes `y`. Only `M` stays the same.",
      "- Example: `R U R'` becomes `L' U' L`.",
      '## Practice',
      'Do 5 slow solves per session, looking for the next pair while you insert the current one.',
    ].join('\n'),
    [
      'Ordem: **pares livres → peças separadas → peças juntas → quina no slot → aresta no slot → as duas no slot**.',
      'Os 19 casos do CFOP reduzido, só revise (a nota deles indica). Treine os 22 novos.',
      '## Espelho',
      'Quando dominar um caso frente-direita, pratique o espelho dele na frente-esquerda.',
      "1. Troque `R` por `L` e `L` por `R` (também `r` e `l`).",
      "2. Inverta todos os movimentos: `R` vira `L'`, `F` vira `F'`, `U'` vira `U`, `y'` vira `y`. Só `M` não muda.",
      "- Exemplo: `R U R'` vira `L' U' L`.",
      '## Prática',
      'Faça 5 resoluções lentas por sessão procurando o próximo par enquanto insere o atual.',
    ].join('\n'),
  ),
  quizzes: [],
};

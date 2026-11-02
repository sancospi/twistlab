// CFOP completo, F2L: SpeedCubeDB's 41 cases (ids cfopc-f2l-01…41), all for the front-right slot.
// Main = SpeedCubeDB's #1 for Front Right; extras = the next ones on its list (fetched 2026-10-21), at most 3, each
// with the U turn it needs here. Left out: algs that don't solve the case in the simulator, 0 votes, over twice the
// main alg's length, or the same face turns as a variant already kept (the rotation-free version wins). The 3 mains
// that start with y' (13, 18, 20) also keep SpeedCubeDB's version without the y' (d or F turns), the reducido's Plan B.
// Setup = the main alg undone (face turns when it has a rotation). Recognition = the state right after the setup.
import { tr } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { scdbUrl } from '../scdb.ts';

// Recognition strings are formulaic: the English and Portuguese are derived chunk by chunk (between commas and
// semicolons) from the Spanish; the English then drops the comma in "Corner at top front-right", as the style book's
// template has it.
const REC_EN: Record<string, string> = {
  'Esquina arriba': 'Corner at top',
  'adelante a la derecha': 'front-right',
  'Esquina en la ranura': 'Corner in the slot',
  'con el blanco al frente': 'white facing front',
  'con el blanco a la derecha': 'white facing right',
  'con el blanco arriba': 'white facing up',
  'con el blanco abajo': 'white facing down',
  'arista arriba a la derecha': 'edge at top right',
  'arista arriba a la izquierda': 'edge at top left',
  'arista arriba atrás': 'edge at top back',
  'arista arriba adelante': 'edge at top front',
  'arista volteada en la ranura': 'edge flipped in the slot',
  'arista bien puesta en la ranura': 'edge oriented correctly in the slot',
  'con el verde arriba': 'green facing up',
  'con el naranja arriba': 'orange facing up',
};
const REC_PT: Record<string, string> = {
  'Esquina arriba': 'Quina em cima',
  'adelante a la derecha': 'na frente à direita',
  'Esquina en la ranura': 'Quina no slot',
  'con el blanco al frente': 'com o branco para a frente',
  'con el blanco a la derecha': 'com o branco para a direita',
  'con el blanco arriba': 'com o branco para cima',
  'con el blanco abajo': 'com o branco para baixo',
  'arista arriba a la derecha': 'aresta em cima à direita',
  'arista arriba a la izquierda': 'aresta em cima à esquerda',
  'arista arriba atrás': 'aresta em cima atrás',
  'arista arriba adelante': 'aresta em cima na frente',
  'arista volteada en la ranura': 'aresta invertida no slot',
  'arista bien puesta en la ranura': 'aresta bem colocada no slot',
  'con el verde arriba': 'com o verde para cima',
  'con el naranja arriba': 'com o laranja para cima',
};
const recIn = (dict: Record<string, string>) => (r: string) => r.replace(/[^,;]+/g, (m) => m.replace(m.trim(), (k) => dict[k] ?? k));
const recEn = (r: string) => recIn(REC_EN)(r).replace('Corner at top, front-right', 'Corner at top front-right');
const recPt = recIn(REC_PT);

const Y_NOTE = tr(
  "Empieza con `y'`, que gira el cubo entero. Si prefieres no girarlo, usa la alternativa que hace lo mismo con giros de `F` o `d`.",
  "It starts with `y'`, which rotates the whole cube. If you'd rather not rotate it, use the alternative that does the same with `F` or `d` moves.",
  "Começa com `y'`, que gira o cubo inteiro. Se preferir não girá-lo, use a alternativa que faz o mesmo com movimentos de `F` ou `d`.",
);

/** n = SpeedCubeDB's F2L number; reduced = the same case's code in CFOP reducido. */
function F2L(n: number, recognition: string, alg: string, setup: string, alts: [number, string][], y = false, reduced?: string): Case {
  const parts = [y ? Y_NOTE : null, reduced ? tr(`Caso ${reduced} del CFOP reducido.`, `Case ${reduced} in reduced CFOP.`, `Caso ${reduced} do CFOP reduzido.`) : null].filter((p) => p !== null);
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
  F2L(1, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el verde arriba', "U R U' R'", "R U R' U'", [[2, "R' F R F'"], [3, "y' r' U' R U M'"], [4, "y U F' L F L2 U L"]], false, 'A1'),
  F2L(2, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el naranja arriba', "F R' F' R", "R' F R F'", [[3, "U' F' U F"]], false, 'A2'),
  F2L(3, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el naranja arriba', "F' U' F", "F' U F", [[4, "S U R U' R' S'"]], false, 'A4'),
  F2L(4, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el verde arriba', "R U R'", "R U' R'", [], false, 'A3'),
];
const separadas = [
  F2L(5, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba atrás, con el verde arriba', "U' R U R' U2 R U' R'", "R U R' U2 R U' R' U", [[2, "F2 L' U' L U F2"], [3, "U' R U R' U' R U2 R'"], [4, "U' R U R' U R' F R F'"]], false, 'B1'),
  F2L(6, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la izquierda, con el naranja arriba', "U' r U' R' U R U r'", "r U' R' U' R U r' U", [[3, "d R' U' R U2 R' U R"]], false, 'B2'),
  F2L(7, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el verde arriba', "U' R U2 R' U' R U2 R'", "R U2 R' U R U2 R' U", [[2, "M' U' M U2 r U' r'"], [3, "U' R U2 R' U2 R U' R'"], [4, "U' R U2 R' U R' F R F'"]], false, 'C1'),
  F2L(8, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el naranja arriba', "r' U2 R2 U R2 U r", "r' U' R2 U' R2 U2 r", [[2, "d R' U2 R U R' U2 R"], [3, "y' U R' U2 R U2 R' U R"]], false, 'C2'),
  F2L(9, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba atrás, con el naranja arriba', "U' R U' R' U F' U' F", "F' U F U' R U R' U", [[2, "F R U R' U' F' R U' R'"], [4, "d R' U' R U' R' U' R"]]),
  F2L(10, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la izquierda, con el verde arriba', "U' R U R' U R U R'", "R U' R' U' R U' R' U", [[2, "U2 R U' R' U' R U R'"], [3, "d R' U R d' R U R'"]]),
  F2L(19, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el verde arriba', "U R U2 R' U R U' R'", "R U R' U' R U2 R' U'", [[2, "U R U2 R2 F R F'"], [4, "R U' R' U R U' R' U R U R'"]], false, 'D3'),
  F2L(20, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la izquierda, con el naranja arriba', "y' U' R' U2 R U' R' U R", "F' U' F U F' U2 F U", [[2, "U' R U' R2 F R F' R U' R'"], [4, "U' F' U2 F U' F' U F"]], true, 'D4'),
  F2L(21, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la izquierda, con el verde arriba', "U2 R U R' U R U' R'", "R U R' U' R U' R' U2", [[2, "R U' R' U2 R U R'"], [3, "R B U2 B' R'"]]),
  F2L(22, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el naranja arriba', "r U' r' U2 r U r'", "r U' r' U2 r U r'", [[2, "F' L' U2 L F"], [3, "y' U2 R' U' R U' R' U R"]]),
];
const juntas = [
  F2L(11, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el naranja arriba', "U' R U2 R' U F' U' F", "F' U F U' R U2 R' U", [[2, "y' R U2 R2 U' R2 U' R'"], [4, "F' U L' U2 L U2 F"]]),
  F2L(12, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el verde arriba', "R U' R' U R U' R' U2 R U' R'", "R U R' U2 R U R' U' R U R'", [[2, "R' U2 R2 U R2 U R"], [3, "U F' U2 F U' R U R'"], [4, "U R U' R' U' R U R' U' R U R'"]]),
  F2L(13, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el naranja arriba', "y' U R' U R U' R' U' R", "F' U F U F' U' F U'", [[2, "M' U' R U R' U2 R U' r'"], [3, "R U' R' U R' F R F' R U' R'"], [4, "d R' U R U' R' U' R"]], true, 'B4'),
  F2L(14, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el verde arriba', "U' R U' R' U R U R'", "R U' R' U' R U R' U", [[2, "R U2 R' U2 R U R' U2 R U' R'"], [3, "U' R2 D R' U R D' R2"], [4, "U2 R2 U R' U R U2 R2"]], false, 'B3'),
  F2L(15, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el verde arriba', "M U r U' r' U' M'", "M U r U r' U' M'", [[2, "R U R' U2 R U' R' U R U' R'"], [3, "R' D' R U' R' D R U R U' R'"], [4, "F' U F U2 R U R'"]]),
  F2L(16, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el naranja arriba', "R U' R' U2 F' U' F", "F' U F U2 R U R'", [[3, "U M' U R U' r' U' R U R'"], [4, "U F U R U' R' F' R U R'"]]),
  F2L(17, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la derecha, con el verde arriba', "R U2 R' U' R U R'", "R U' R' U R U2 R'", [[3, "R U R' U' R U2 R' U2 R U R'"]], false, 'D1'),
  F2L(18, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba adelante, con el naranja arriba', "y' R' U2 R U R' U' R", "F' U F U' F' U2 F", [[3, "F' U2 F U F' U' F"], [4, "R' F R F' R U' R' U R U' R'"]], true, 'D2'),
  F2L(23, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba adelante, con el verde arriba', "U R U' R' U' R U' R' U R U' R'", "R U R' U' R U R' U R U R' U'", [[2, "R U R' U2 R U R' U' R U R'"], [3, "U2 R2 U2 R' U' R U' R2"], [4, "R U' R2 D' R U2 R' D R"]]),
  F2L(24, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la derecha, con el naranja arriba', "F U R U' R' F' R U' R'", "R U R' F R U R' U' F'", [[2, "U' R U R2 F R F' R U' R'"], [3, "y' R' U' R U2 R' U' R U R' U' R"], [4, "U F' L' U L F R U R'"]]),
];
const esquina = [
  F2L(25, 'Esquina en la ranura, con el blanco abajo; arista arriba a la derecha, con el verde arriba', "U' R' F R F' R U R'", "R U' R' F R' F' R U", [[2, "R' F' R U R U' R' F"], [3, "U' F' U F U R U' R'"]]),
  F2L(26, 'Esquina en la ranura, con el blanco abajo; arista arriba adelante, con el naranja arriba', "U R U' R' F R' F' R", "R' F R F' R U R' U'", [[2, "R S' R' U R S R'"], [3, "U R U R' U' y L' U' L"], [4, "U R U' R' U' F' U F"]], false, 'E2'),
  F2L(27, 'Esquina en la ranura, con el blanco al frente; arista arriba a la derecha, con el verde arriba', "R U' R' U R U' R'", "R U R' U' R U R'", [[2, "F' U' F U2 R U' R'"], [4, "y' f R' f' r' U' R U M'"]], false, 'E1'),
  F2L(28, 'Esquina en la ranura, con el blanco a la derecha; arista arriba adelante, con el naranja arriba', "R U R' U' F R' F' R", "R' F R F' U R U' R'", [[3, "F' U F U' F' U F"]]),
  F2L(29, 'Esquina en la ranura, con el blanco al frente; arista arriba adelante, con el naranja arriba', "R' F R F' U R U' R'", "R U R' U' F R' F' R", [[2, "y L' U' L U L' U' L"], [4, "R' F R F' R' F R F'"]]),
  F2L(30, 'Esquina en la ranura, con el blanco a la derecha; arista arriba a la derecha, con el verde arriba', "R U R' U' R U R'", "R U' R' U R U' R'", [[2, "U' R U2 R' U2 R U R'"], [3, "U' F R' F' R2 U R'"]]),
];
const arista = [
  F2L(31, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista volteada en la ranura', "U' R' F R F' R U' R'", "R U R' F R' F' R U", [[2, "R U' R' U y' R' U R"], [3, "F' U F R U2 R'"]]),
  F2L(32, 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista bien puesta en la ranura', "U R U' R' U R U' R' U R U' R'", "R U R' U' R U R' U' R U R' U'", [[2, "R U R' U' R U R' U' R U R'"], [3, 'R2 U R2 U R2 U2 R2'], [4, "U' F R' F' R U' R U R'"]], false, 'E3'),
  F2L(33, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista bien puesta en la ranura', "U' R U' R' U2 R U' R'", "R U R' U2 R U R' U", [[2, "y R' D R U' R' D' R"], [3, "R U R' U' R U' R' U R U' R'"], [4, "U' R U' R' U' R U2 R'"]]),
  F2L(34, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista bien puesta en la ranura', "U R U R' U2 R U R'", "R U' R' U2 R U' R' U'", [[2, "U' R U2 R' U R U R'"], [3, "U R' D' R U' R' D R"], [4, "y U L' U L U2 L' U L"]]),
  F2L(35, 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista volteada en la ranura', "U' R U R' U F' U' F", "F' U F U' R U' R' U", [[3, "U2 R U R' F R' F' R"]]),
  F2L(36, 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista volteada en la ranura', "U F' U' F U' R U R'", "R U' R' U F' U F U'", [[2, "U2 R' F R F' U2 R U R'"], [3, "R U R' U R U R' U' F' U' F"], [4, "R2 u R U R' U' u' R' U R'"]]),
];
const ranura = [
  F2L(37, 'Esquina en la ranura, con el blanco abajo; arista volteada en la ranura', "R2 U2 F R2 F' U2 R' U R'", "R U' R U2 F R2 F' U2 R2", [[2, "R' F R F' R U' R' U R U' R' U2 R U' R'"], [3, "R U2 R' U R U2 R' U F' U' F"], [4, "R U R' U2 R U2 R' U y' R' U' R"]]),
  F2L(38, 'Esquina en la ranura, con el blanco al frente; arista bien puesta en la ranura', "R U' R' U' R U R' U2 R U' R'", "R U R' U2 R U' R' U R U R'", [[2, "R U R' U' R U2 R' U' R U R'"], [3, "R2 U2 R' U' R U' R' U2 R'"], [4, "R U' R' U' R U R' U' R U2 R'"]], false, 'E4'),
  F2L(39, 'Esquina en la ranura, con el blanco a la derecha; arista bien puesta en la ranura', "R U' R' U R U2 R' U R U' R'", "R U R' U' R U2 R' U' R U R'", [[2, "R U2 R U R' U R U2 R2"], [3, "R U R' U2 R U' R' U R U R'"], [4, "R U2 R' U R U' R' U R U R'"]], false, 'E5'),
  F2L(40, 'Esquina en la ranura, con el blanco al frente; arista volteada en la ranura', "r U' r' U2 r U r' R U R'", "R U' R' r U' r' U2 r U r'", [[2, "F' L' U2 L F R U R'"], [3, "R U' R' F R U R' U' F' R U' R'"], [4, "R U' R' U' R U' R' U y' R' U' R"]]),
  F2L(41, 'Esquina en la ranura, con el blanco a la derecha; arista volteada en la ranura', "R U' R' r U' r' U2 r U r'", "r U' r' U2 r U r' R U R'", [[2, "R U' R' F' L' U2 L F"], [3, "R U R' U' y M U' R' F R U M'"], [4, "R U R' U' R U' R' U2 y' R' U' R"]]),
];

export const f2lPhase: Phase = {
  id: 'cfopc-f2l',
  name: tr('F2L', 'F2L', 'F2L'),
  goal: tr(
    [
      '**Meta:** las dos primeras capas completas, par a par: cada esquina blanca con su arista.',
      '**Casos:** 41, todos para la ranura de adelante a la derecha. Ya viste 19 en el CFOP reducido: su nota da el código que tenían allí (A1, B2…).',
    ].join('\n'),
    [
      '**Goal:** the first two layers complete, pair by pair: each white corner with its edge.',
      "**Cases:** 41, all for the front-right slot. You've already seen 19 in reduced CFOP: each one's note gives its code from that guide (A1, B2…).",
    ].join('\n'),
    [
      '**Meta:** as duas primeiras camadas completas, par a par: cada quina branca com sua aresta.',
      '**Casos:** 41, todos para o slot da frente à direita. Você já viu 19 no CFOP reduzido: a nota de cada um traz o código dele naquele guia (A1, B2…).',
    ].join('\n'),
  ),
  description: tr(
    [
      '## Cómo se hace',
      '1. Busca una esquina blanca y la arista de sus otros 2 colores.',
      '2. Gira el cubo entero para que su ranura quede adelante a la derecha.',
      "3. Gira `U` hasta ver el caso como en la figura. Si el algoritmo empieza con `U`, `U'` o `U2`, no te lo saltes: la figura muestra el caso antes de ese giro.",
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
      "3. Turn `U` until you see the case as in the diagram. If the algorithm starts with `U`, `U'` or `U2`, don't skip it: the diagram shows the case before that move.",
      '4. Do the algorithm: it joins the 2 pieces and inserts the pair.',
      'Repeat for all 4 pairs.',
      '## The idea',
      "Almost every case joins the pair on top and inserts it with 3 moves: `R U R'` or `R U' R'` from the right, `F' U' F` or `F' U F` from the front.",
      'If your intuitive solution is short, use it. Learn the algorithm when yours is long or makes you rotate the cube.',
    ].join('\n'),
    [
      '## Como fazer',
      '1. Procure uma quina branca e a aresta das suas outras 2 cores.',
      '2. Gire o cubo inteiro para que o slot delas fique na frente à direita.',
      "3. Gire `U` até ver o caso como na figura. Se o algoritmo começa com `U`, `U'` ou `U2`, não pule esse movimento: a figura mostra o caso antes dele.",
      '4. Faça o algoritmo: ele junta as 2 peças e insere o par.',
      'Repita com os 4 pares.',
      '## A ideia',
      "Quase todos os casos juntam o par em cima e o inserem com 3 movimentos: `R U R'` ou `R U' R'` pela direita, `F' U' F` ou `F' U F` pela frente.",
      'Se a sua solução intuitiva for curta, use-a. Aprenda o algoritmo quando a sua for longa ou fizer você girar o cubo.',
    ].join('\n'),
  ),
  tips: tr(
    [
      '- **El par no entra:** compara tu caso con la figura. Si el algoritmo empieza con un giro de `U`, no te lo saltes.',
      "- **Una pieza está en otra ranura:** gira el cubo entero para tener esa ranura adelante a la derecha y haz `R U R'`: la pieza sube. Luego vuelve a dejar la ranura de tu par adelante a la derecha y busca su caso.",
      '- **Te paras a buscar el siguiente par:** baja el ritmo y búscalo mientras metes el actual. Mejor lento y sin pausas que rápido con pausas.',
    ].join('\n'),
    [
      "- **The pair won't go in:** compare your case with the diagram. If the algorithm starts with a `U` move, don't skip it.",
      "- **A piece is in another slot:** rotate the whole cube so that slot is at the front right and do `R U R'`: the piece comes up. Then put your pair's slot back at the front right and find its case.",
      '- **You stop to look for the next pair:** slow down and look for it while you insert the current one. Slow and smooth beats fast with pauses.',
    ].join('\n'),
    [
      '- **O par não entra:** compare o seu caso com a figura. Se o algoritmo começa com um movimento de `U`, não o pule.',
      "- **Uma peça está em outro slot:** gire o cubo inteiro para deixar esse slot na frente à direita e faça `R U R'`: a peça sobe. Depois deixe de novo o slot do seu par na frente à direita e procure o caso dele.",
      '- **Você faz pausas para procurar o próximo par:** diminua o ritmo e procure-o enquanto insere o atual. Melhor devagar e sem pausas do que rápido com pausas.',
    ].join('\n'),
  ),
  diagram: 'iso',
  groups: [
    {
      id: 'cfopc-f2l-libres',
      name: tr('Pares libres', 'Free pairs', 'Pares livres'),
      description: tr('El par ya está formado o a un giro de estarlo: entra con 3 o 4 giros. Empieza por aquí.', 'The pair is already built or one move away: it goes in with 3 or 4 moves. Start here.', 'O par já está montado ou a um movimento de ficar pronto: entra com 3 ou 4 movimentos. Comece por aqui.'),
      cases: libres,
    },
    {
      id: 'cfopc-f2l-separadas',
      name: tr('Piezas separadas', 'Separated pieces', 'Peças separadas'),
      description: tr(
        'La esquina y la arista están arriba, sin tocarse: júntalas en un par y mételo. En los casos 19 a 22, el blanco de la esquina mira arriba.',
        "The corner and edge are on top, not touching: join them into a pair and insert it. In cases 19 to 22, the corner's white faces up.",
        'A quina e a aresta estão em cima, sem se tocar: junte-as num par e insira-o. Nos casos 19 a 22, o branco da quina fica para cima.',
      ),
      cases: separadas,
    },
    {
      id: 'cfopc-f2l-juntas',
      name: tr('Piezas juntas', 'Touching pieces', 'Peças juntas'),
      description: tr(
        'La esquina y la arista se tocan arriba, pero no forman un par: sepáralas y vuelve a juntarlas bien. En los casos 17, 18, 23 y 24, el blanco de la esquina mira arriba.',
        "The corner and edge touch on top but don't form a pair: separate them and join them again properly. In cases 17, 18, 23 and 24, the corner's white faces up.",
        'A quina e a aresta se tocam em cima, mas não formam um par: separe-as e junte-as de novo do jeito certo. Nos casos 17, 18, 23 e 24, o branco da quina fica para cima.',
      ),
      cases: juntas,
    },
    {
      id: 'cfopc-f2l-esquina',
      name: tr('Esquina en la ranura', 'Corner in the slot', 'Quina no slot'),
      description: tr(
        'La esquina está abajo, en su ranura, y la arista arriba: saca la esquina sin perder de vista la arista. Los casos cambian según hacia dónde mira el blanco y dónde está la arista.',
        'The corner is at the bottom, in its slot, and the edge is on top: take the corner out without losing sight of the edge. The cases depend on which way the white faces and where the edge is.',
        'A quina está embaixo, no seu slot, e a aresta em cima: tire a quina sem perder a aresta de vista. Os casos mudam conforme para onde o branco aponta e onde está a aresta.',
      ),
      cases: esquina,
    },
    {
      id: 'cfopc-f2l-arista',
      name: tr('Arista en la ranura', 'Edge in the slot', 'Aresta no slot'),
      description: tr(
        'La arista está en su ranura, bien puesta o volteada, y la esquina arriba. Los casos cambian según hacia dónde mira el blanco de la esquina y si la arista está volteada.',
        "The edge is in its slot, either oriented correctly or flipped, and the corner is on top. The cases depend on which way the corner's white faces and whether the edge is flipped.",
        'A aresta está no seu slot, bem colocada ou invertida, e a quina em cima. Os casos mudam conforme para onde aponta o branco da quina e se a aresta está invertida.',
      ),
      cases: arista,
    },
    {
      id: 'cfopc-f2l-ranura',
      name: tr('Ambas en la ranura', 'Both in the slot', 'As duas no slot'),
      description: tr(
        'La esquina y la arista ya están en su ranura, pero el par está mal: la esquina girada, la arista volteada o las dos. Son poco frecuentes y largos: déjalos para el final.',
        "The corner and edge are both in their slot, but the pair is wrong: the corner is twisted, the edge is flipped, or both. They're rare and long: leave them for last.",
        'A quina e a aresta já estão no slot, mas o par está errado: a quina girada, a aresta invertida ou as duas. São pouco frequentes e longos: deixe-os para o final.',
      ),
      cases: ranura,
    },
  ],
  progression: tr(
    [
      'Orden, de los más fáciles a los más largos: pares libres → piezas separadas → piezas juntas → esquina en la ranura → arista en la ranura → ambas en la ranura.',
      'Repasa los 19 casos que ya viste en el CFOP reducido (lo dice su nota) y entrena los 22 nuevos.',
      '## Espejo',
      'Cuando domines un caso, aprende su espejo: el mismo caso para la ranura de adelante a la izquierda, sin girar el cubo.',
      '1. Cambia `R` por `L` y `L` por `R` (lo mismo con `r` y `l`).',
      "2. Invierte el sentido de todos los giros, salvo `M`: `L` pasa a `L'`, `F` a `F'`, `U'` a `U`, `y'` a `y`.",
      "Ejemplo: `R U R'` pasa a `L' U' L`.",
      '## Práctica',
      'Haz 5 resoluciones lentas por sesión y busca el siguiente par mientras metes el actual.',
    ].join('\n'),
    [
      'Order, from easiest to longest: free pairs → separated pieces → touching pieces → corner in the slot → edge in the slot → both in the slot.',
      'Review the 19 cases you already saw in reduced CFOP (their note tells you which) and train the 22 new ones.',
      '## Mirror',
      'Once you master a case, learn its mirror: the same case for the front-left slot, without rotating the cube.',
      '1. Swap `R` and `L` (same with `r` and `l`).',
      "2. Reverse the direction of every move except `M`: `L` becomes `L'`, `F` becomes `F'`, `U'` becomes `U`, `y'` becomes `y`.",
      "Example: `R U R'` becomes `L' U' L`.",
      '## Practice',
      'Do 5 slow solves per session and look for the next pair while you insert the current one.',
    ].join('\n'),
    [
      'Ordem, dos mais fáceis aos mais longos: pares livres → peças separadas → peças juntas → quina no slot → aresta no slot → as duas no slot.',
      'Revise os 19 casos que você já viu no CFOP reduzido (a nota deles diz quais são) e treine os 22 novos.',
      '## Espelho',
      'Quando dominar um caso, aprenda o espelho dele: o mesmo caso para o slot da frente à esquerda, sem girar o cubo.',
      '1. Troque `R` por `L` e `L` por `R` (o mesmo com `r` e `l`).',
      "2. Inverta o sentido de todos os movimentos, exceto `M`: `L` vira `L'`, `F` vira `F'`, `U'` vira `U`, `y'` vira `y`.",
      "Exemplo: `R U R'` vira `L' U' L`.",
      '## Prática',
      'Faça 5 resoluções lentas por sessão e procure o próximo par enquanto insere o atual.',
    ].join('\n'),
  ),
  quizzes: [],
};

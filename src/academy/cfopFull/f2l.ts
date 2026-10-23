// CFOP completo, F2L: los 41 casos de SpeedCubeDB (ids cfopc-f2l-01…41), todos para la ranura adelante-derecha.
// Main = SpeedCubeDB's #1 for Front Right; extras = the next ones on its list (fetched 2026-10-21), at most 3, each
// with the U turn it needs here. Left out: algs that don't solve the case in the simulator, 0 votes, over twice the
// main alg's length, or the same face turns as a variant already kept (the rotation-free version wins). The 3 mains
// that start with y' (13, 18, 20) also keep SpeedCubeDB's version without the y' (d or F turns), the reducido's Plan B.
// Setup = the main alg undone (face turns when it has a rotation). Recognition = the state right after the setup.
import type { Localized } from '../../i18n.ts';
import type { Case, Phase } from '../types.ts';
import { scdbUrl } from '../scdb.ts';

const tr = (es: string, en: string, pt: string): Localized => ({ es, en, pt });

// Recognition strings are formulaic: the English is derived phrase by phrase from the Spanish.
const REC_EN: Record<string, string> = {
  'Esquina arriba adelante-der': 'Corner up front-right',
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
  'Esquina arriba adelante-der': 'Quina em cima frente-dir',
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
  name: tr('F2L', 'F2L', 'F2L'),
  description: tr(
    [
      '**41 casos**, numerados como en SpeedCubeDB. Todos para la **ranura adelante-derecha** (par verde-naranja).',
      'Cada caso describe el estado justo después de la mezcla.',
      "Si el algoritmo empieza con `U`, `U'` o `U2`, ese giro es parte del caso: no lo saltes. En un solve real, gira `U` hasta ver el caso como en la figura.",
      '## La idea',
      '1. Junta la esquina y la arista arriba en un par.',
      '2. Colócalo con `U` donde un gatillo de 3 giros lo inserte:',
      "- Por la derecha: `R U R'` o `R U' R'`.",
      "- Por el frente: `F' U' F` o `F' U F`.",
      'Casi todos los casos son esa idea encadenada. Aprende el algoritmo cuando tu solución intuitiva sea larga o te obligue a girar el cubo.',
      'Los 19 casos del CFOP reducido están aquí: la nota de cada uno da su código (A1, B2…).',
      '## Anticipación',
      'Mientras insertas un par, busca el siguiente. Es lo que más baja los tiempos.',
      'Mejor lento y sin pausas que rápido con pausas.',
      '## Notación nueva',
      "- `y'` gira todo el cubo como `U'`; `y`, como `U`.",
      '- `d` gira las 2 capas de abajo, como `D`; `u`, las 2 de arriba, como `U`.',
      '- `r` y `f`: la cara más la capa del medio.',
      '- `M` gira como `L`; `S`, como `F`.',
    ].join('\n'),
    [
      '**41 cases**, numbered as in SpeedCubeDB. All for the **front-right slot** (green-orange pair).',
      'Each case describes the state right after the scramble.',
      "If the algorithm starts with `U`, `U'` or `U2`, that turn is part of the case: don't skip it. In a real solve, turn `U` until you see the case as in the picture.",
      '## The idea',
      '1. Bring the corner and the edge together on top into a pair.',
      '2. Place it with `U` where a 3-move trigger can insert it:',
      "- From the right: `R U R'` or `R U' R'`.",
      "- From the front: `F' U' F` or `F' U F`.",
      'Almost every case is that idea chained together. Learn the algorithm when your intuitive solution is long or forces you to rotate the cube.',
      'The 19 cases of the reduced CFOP are all here: each one\'s note gives its code (A1, B2…).',
      '## Look-ahead',
      'While you insert one pair, look for the next. Nothing lowers your times more.',
      'Slow and smooth beats fast with pauses.',
      '## New notation',
      "- `y'` rotates the whole cube like `U'`; `y`, like `U`.",
      '- `d` turns the 2 bottom layers, like `D`; `u`, the 2 top ones, like `U`.',
      '- `r` and `f`: the face plus the middle layer.',
      '- `M` turns like `L`; `S`, like `F`.',
    ].join('\n'),
    [
      '**41 casos**, numerados como no SpeedCubeDB. Todos para o **slot frente-direita** (par verde-laranja).',
      'Cada caso descreve o estado logo depois do embaralhamento.',
      "Se o algoritmo começa com `U`, `U'` ou `U2`, esse movimento faz parte do caso: não pule. Numa resolução real, gire `U` até ver o caso como na figura.",
      '## A ideia',
      '1. Junte a quina e a aresta em cima num par.',
      '2. Posicione-o com `U` onde um gatilho de 3 movimentos o insira:',
      "- Pela direita: `R U R'` ou `R U' R'`.",
      "- Pela frente: `F' U' F` ou `F' U F`.",
      'Quase todos os casos são essa ideia encadeada. Aprenda o algoritmo quando sua solução intuitiva for longa ou obrigar você a girar o cubo.',
      'Os 19 casos do CFOP reduzido estão aqui: a nota de cada um traz o código (A1, B2…).',
      '## Antecipação',
      'Enquanto insere um par, procure o próximo. É o que mais baixa os tempos.',
      'Melhor devagar e sem pausas do que rápido com pausas.',
      '## Notação nova',
      "- `y'` gira o cubo inteiro como `U'`; `y`, como `U`.",
      '- `d` gira as 2 camadas de baixo, como `D`; `u`, as 2 de cima, como `U`.',
      '- `r` e `f`: a face mais a camada do meio.',
      '- `M` gira como `L`; `S`, como `F`.',
    ].join('\n'),
  ),
  diagram: 'iso',
  groups: [
    {
      id: 'cfopc-f2l-libres',
      name: tr('Pares libres', 'Free pairs', 'Pares livres'),
      description: tr('El par ya está armado o a un giro de estarlo. Se inserta en 3 o 4 movimientos. **La base de todo lo demás.**', 'The pair is already built or one turn away. It goes in with 3 or 4 moves. **The foundation of everything else.**', 'O par já está montado ou a um movimento disso. Entra com 3 ou 4 movimentos. **A base de todo o resto.**'),
      cases: libres,
    },
    {
      id: 'cfopc-f2l-separadas',
      name: tr('Piezas separadas', 'Separated pieces', 'Peças separadas'),
      description: tr(
        [
          'Esquina y arista arriba, sin tocarse.',
          "Júntalas en un par con un gatillo (`R U R'` o `R U' R'`; `U` solo las coloca) y luego insértalo. En los casos 19 a 22 el blanco mira arriba.",
        ].join('\n'),
        [
          'Corner and edge on top, not touching.',
          "Join them into a pair with a trigger (`R U R'` or `R U' R'`; `U` alone only positions them) and then insert it. In cases 19 to 22 the white faces up.",
        ].join('\n'),
        [
          'Quina e aresta em cima, sem se tocar.',
          "Junte-as num par com um gatilho (`R U R'` ou `R U' R'`; `U` só as posiciona) e depois insira. Nos casos 19 a 22 o branco fica para cima.",
        ].join('\n'),
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
      description: tr('Las dos piezas en su ranura, mal colocadas. Los menos frecuentes y de los más largos: déjalos para el final.', 'Both pieces in their slot, wrongly placed. The rarest and among the longest: leave them for last.', 'As duas peças no seu slot, mal colocadas. Os menos frequentes e dos mais longos: deixe para o final.'),
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
      'Haz 5 solves lentos por sesión buscando el siguiente par mientras insertas el actual.',
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

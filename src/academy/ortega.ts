// "Ortega": the 2x2 method in three steps: the white face (any order, intuitive), OLL (7 cases: the top face yellow)
// and PBL (5 cases: both layers permuted at once). cfop.validate.test.ts checks exactly 7 OLL and 5 PBL cases,
// different up to U/D turns, that together solve every state.
// OLL and PBL algorithms: SpeedCubeDB's 2x2 lists (/a/2x2/OrtegaOLL, /a/2x2/OrtegaPBL, read 2026-10-22), with their
// rank; its sixth PBL case (Opp Adj) is Adj-Diag after x2, so it is only a note here. The white face is intuitive.
// Recognition texts describe each setup as the diagram shows it (yellow up, green front).
import { doc, tr, word } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

type T = [es: string, en: string, pt: string];
type Alt = [rank: number, alg: string, note?: T];
interface Row {
  phase: 'cara' | 'oll' | 'pbl';
  slug: string;
  stage: Stage;
  code: T;
  name: T;
  recognition: T;
  alg: string;
  rank?: number; // SpeedCubeDB rank of the main algorithm; none: community (the white face)
  alts?: Alt[];
  note?: T;
}

function kase(r: Row): Case {
  const algs: Case['algs'] = [r.rank ? { id: 'main', alg: r.alg, source: 'speedcubedb', rank: r.rank } : { id: 'main', alg: r.alg, source: 'community' }];
  for (const [rank, alg, note] of r.alts ?? []) algs.push({ id: `scdb-${rank}`, alg, source: 'speedcubedb', rank, ...(note ? { note: tr(...note) } : {}) });
  return {
    id: `ortega-${r.phase}-${r.slug}`,
    code: word(...r.code),
    name: tr(...r.name),
    recognition: tr(...r.recognition),
    stage: r.stage,
    algs,
    setup: invertTokens(centerMoves(r.alg, IDENTITY)).join(' '), // face turns: undoes rotations too
    scdb: null, // SpeedCubeDbRef links 3x3 sets only
    ...(r.note ? { note: tr(...r.note) } : {}),
  };
}

// --- 1. White face: the last corner, with the other 3 white stickers already down ---
const cara = (slug: string, code: T, name: T, recognition: T, alg: string, note?: T) =>
  kase({ phase: 'cara', slug, stage: '2x2-first-face', code, name, recognition, alg, note });

const lastCornerUp = [
  cara('derecha', ['Derecha', 'Right', 'Direita'], ['Blanco a la derecha', 'White on the right', 'Branco à direita'],
    ['Tres blancas abajo; la cuarta arriba adelante-derecha, encima del hueco, con el blanco a la derecha',
      'Three whites on the bottom; the fourth on top, front-right, above the slot, with the white facing right',
      'Três brancas embaixo; a quarta em cima, frente-direita, acima do slot, com o branco para a direita'], "R U R'"),
  cara('frente', ['Frente', 'Front', 'Frente'], ['Blanco al frente', 'White in front', 'Branco na frente'],
    ['Tres blancas abajo; la cuarta arriba adelante-derecha, encima del hueco, con el blanco al frente',
      'Three whites on the bottom; the fourth on top, front-right, above the slot, with the white facing front',
      'Três brancas embaixo; a quarta em cima, frente-direita, acima do slot, com o branco para a frente'], "F' U' F",
    ['El espejo del anterior, con `F` en vez de `R`.', 'The mirror of the previous one, with `F` instead of `R`.', 'O espelho do anterior, com `F` em vez de `R`.']),
  cara('arriba', ['Arriba', 'Up', 'Em cima'], ['Blanco arriba', 'White on top', 'Branco em cima'],
    ['Tres blancas abajo; la cuarta arriba adelante-derecha, encima del hueco, con el blanco arriba',
      'Three whites on the bottom; the fourth on top, front-right, above the slot, with the white facing up',
      'Três brancas embaixo; a quarta em cima, frente-direita, acima do slot, com o branco para cima'], "R U2 R' U' R U R'",
    ["`R U2 R'` la deja adelante a la izquierda, con el blanco al frente. `U'` la vuelve encima del hueco, con el blanco a la derecha, y `R U R'` la baja.",
      "`R U2 R'` leaves it front-left, with the white facing front. `U'` brings it back above the slot, white facing right, and `R U R'` drops it in.",
      "`R U2 R'` a deixa na frente à esquerda, com o branco para a frente. `U'` a leva de volta para cima do slot, com o branco para a direita, e `R U R'` a desce."]),
];
const lastCornerDown = [
  cara('girada', ['Girada', 'Twisted', 'Girada'], ['Abajo, girada', 'Down, twisted', 'Embaixo, girada'],
    ['Tres blancas abajo; la cuarta abajo adelante-derecha, pero con el blanco a la derecha',
      'Three whites on the bottom; the fourth in the bottom front-right slot, but with the white facing right',
      'Três brancas embaixo; a quarta embaixo na frente-direita, mas com o branco para a direita'], "R U R' U' R U R'",
    ["`R U R' U'` la saca arriba con el blanco a la derecha. `R U R'` la baja bien. Si el blanco mira al frente, haz el espejo: `F' U' F U F' U' F`.",
      "`R U R' U'` takes it out to the top with the white facing right. `R U R'` drops it in correctly. If the white faces front, do the mirror: `F' U' F U F' U' F`.",
      "`R U R' U'` a tira para cima com o branco para a direita. `R U R'` a desce certa. Se o branco olhar para a frente, faça o espelho: `F' U' F U F' U' F`."]),
];

// --- 2. OLL: the 7 corner-orientation cases ---
const oll = (slug: string, code: string, name: string | T, recognition: T, rank: number, alg: string, alts: Alt[], note?: T) =>
  kase({ phase: 'oll', slug, stage: '2x2-oll', code: [code, code, code], name: typeof name === 'string' ? [name, name, name] : name, recognition, alg, rank, alts, note });

const SUNE_NOTE: T = ['Sune y Antisune son inversas: la mezcla de una es el algoritmo de la otra.', 'Sune and Antisune are inverses: the scramble of one is the algorithm of the other.', 'Sune e Antisune são inversos: o embaralhamento de um é o algoritmo do outro.'];
const ollOne = [
  oll('sune', 'Sune', 'Sune', ['1 amarilla arriba, adelante-izquierda; la de adelante-derecha mira al frente',
    '1 yellow on top, front-left; the front-right one faces front', '1 amarela em cima, frente-esquerda; a da frente-direita olha para a frente'], 1,
    "R U R' U R U2 R'", [[2, "R U R2 U' R2 U R"]], SUNE_NOTE),
  oll('antisune', 'Antisune', 'Antisune', ['1 amarilla arriba, atrás-derecha; la de adelante-izquierda mira al frente',
    '1 yellow on top, back-right; the front-left one faces front', '1 amarela em cima, atrás-direita; a da frente-esquerda olha para a frente'], 1,
    "R U2 R' U' R U' R'", [[4, "R' F R F' R U R'", ['Sostenla con la amarilla de arriba adelante-derecha.', 'Hold it with the top yellow at front-right.', 'Segure com a amarela de cima na frente-direita.']]], SUNE_NOTE),
];
const ollNone = [
  oll('h', 'H', 'H', ['0 arriba; dos amarillas miran al frente y dos atrás', '0 on top; two yellows face front and two face back', '0 em cima; duas amarelas olham para a frente e duas para trás'], 1,
    "R2 U2 R' U2 R2", [[2, "R2 U2 R U2 R2", ["Igual, con `R` en vez de `R'`.", "Same, with `R` instead of `R'`.", "Igual, com `R` em vez de `R'`."]],
      [3, "F R U R' U' R U R' U' R U R' U' F'", ["El gatillo `R U R' U'` 3 veces entre `F` y `F'`.", "The `R U R' U'` trigger 3 times between `F` and `F'`.", "O gatilho `R U R' U'` 3 vezes entre `F` e `F'`."]]],
    ['Si las amarillas miran a los lados, gira `U` antes.', 'If the yellows face the sides, turn `U` first.', 'Se as amarelas olharem para os lados, gire `U` antes.']),
  oll('pi', 'Pi', 'Pi', ['0 arriba; dos amarillas miran a la izquierda; a la derecha, una al frente y otra atrás',
    '0 on top; two yellows face left; on the right, one faces front and one faces back',
    '0 em cima; duas amarelas olham para a esquerda; à direita, uma para a frente e outra para trás'], 1,
    "F R U R' U' R U R' U' F'", [[3, "R U2 R2 U' R2 U' R2 U2 R", ['La misma del Pi en el CFOP.', 'The same one as the Pi in CFOP.', 'O mesmo do Pi no CFOP.']]],
    ["El gatillo `R U R' U'` 2 veces entre `F` y `F'`.", "The `R U R' U'` trigger 2 times between `F` and `F'`.", "O gatilho `R U R' U'` 2 vezes entre `F` e `F'`."]),
];
const ollTwo = [
  oll('u', 'U', ['U (faros)', 'U (faros)', 'U (faróis)'], ['2 arriba, las de la derecha; las otras dos miran a la izquierda', '2 on top, the right ones; the other two face left', '2 em cima, as da direita; as outras duas olham para a esquerda'], 1,
    "F R U R' U' F'", [[2, "y2 F U R U' R' F'", ['Empieza con `y2`: los faros pasan a la derecha.', 'Starts with `y2`: the headlights move to the right.', 'Começa com `y2`: os faróis passam para a direita.']]]),
  oll('t', 'T', 'T', ['2 arriba, las de la derecha; a la izquierda, una mira al frente y otra atrás',
    '2 on top, the right ones; on the left, one faces front and one faces back',
    '2 em cima, as da direita; à esquerda, uma olha para a frente e outra para trás'], 1,
    "R U R' U' R' F R F'", [[2, "U R U R' U' F' U' F"]]),
  oll('l', 'L', 'L', ['2 arriba en diagonal (adelante-derecha y atrás-izquierda); la de adelante-izquierda mira al frente',
    '2 on top in a diagonal (front-right and back-left); the front-left one faces front',
    '2 em cima na diagonal (frente-direita e atrás-esquerda); a da frente-esquerda olha para a frente'], 3,
    "F R' F' R U R U' R'", [[2, "F R U' R' U' R U R' F'"]]),
];

// --- 3. PBL: both layers at once. A bar = one side of a layer with its 2 colors equal ---
const pbl = (slug: string, code: string, name: T, recognition: T, rank: number, alg: string, alts: Alt[], note?: T) =>
  kase({ phase: 'pbl', slug, stage: '2x2-pbl', code: [code, code, code], name, recognition, alg, rank, alts, note });

const X2: T = ['Si esta capa está abajo y la de arriba ya está bien, gira el cubo con `x2` (o `z2`): es el mismo caso.',
  'If this layer is on the bottom and the top one is already right, turn the cube with `x2` (or `z2`): it is the same case.',
  'Se esta camada estiver embaixo e a de cima já estiver certa, gire o cubo com `x2` (ou `z2`): é o mesmo caso.'];
const pblOne = [
  pbl('adj', 'Adj', ['Adyacentes arriba', 'Adjacent on top', 'Adjacentes em cima'], ['Abajo, 4 barras. Arriba, 1 barra: al frente', 'Bottom: 4 bars. Top: 1 bar, in front', 'Embaixo, 4 barras. Em cima, 1 barra: na frente'], 1,
    "y R U R' F' R U R' U' R' F R2 U' R' U'", [[3, "y R U R' U' R' F R2 U' R' U' R U R' F'", ['La T-perm del 3x3, tras la `y`.', 'The 3x3 T-perm, after the `y`.', 'A T-perm do 3x3, depois do `y`.']]],
    [`La \`y\` deja la barra a la izquierda. ${X2[0]}`, `The \`y\` leaves the bar on the left. ${X2[1]}`, `O \`y\` deixa a barra à esquerda. ${X2[2]}`]),
  pbl('diag', 'Diag', ['Diagonal arriba', 'Diagonal on top', 'Diagonal em cima'], ['Abajo, 4 barras. Arriba, ninguna', 'Bottom: 4 bars. Top: none', 'Embaixo, 4 barras. Em cima, nenhuma'], 1,
    "R U' R' U' F2 U' R U R' U F2", [[2, "F R U' R' U' R U R' F' R U R' U' R' F R F'", ['La Y-perm del 3x3.', 'The 3x3 Y-perm.', 'A Y-perm do 3x3.']]],
    X2),
];
const pblTwo = [
  pbl('adj-adj', 'Adj-Adj', ['Adyacentes arriba y abajo', 'Adjacent on top and bottom', 'Adjacentes em cima e embaixo'], ['1 barra arriba y 1 abajo: las dos al frente', '1 bar on top and 1 on the bottom: both in front', '1 barra em cima e 1 embaixo: as duas na frente'], 1,
    "R2 U' B2 U2 R2 U' R2", [[3, "R2 U R2 U2 F2 U F2"]]),
  pbl('diag-diag', 'Diag-Diag', ['Diagonal arriba y abajo', 'Diagonal on top and bottom', 'Diagonal em cima e embaixo'], ['Ninguna barra, ni arriba ni abajo', 'No bars, neither on top nor on the bottom', 'Nenhuma barra, nem em cima nem embaixo'], 1,
    'R2 F2 R2', [[2, 'R2 B2 R2']], ['Da igual cómo lo sostengas.', 'It does not matter how you hold it.', 'Tanto faz como você segura.']),
  pbl('adj-diag', 'Adj-Diag', ['Adyacentes arriba, diagonal abajo', 'Adjacent on top, diagonal on the bottom', 'Adjacentes em cima, diagonal embaixo'], ['1 barra arriba, al frente. Abajo, ninguna', '1 bar on top, in front. Bottom: none', '1 barra em cima, na frente. Embaixo, nenhuma'], 1,
    "R U' R F2 R' U R'", [[2, "R' F R' F2 R U' R"]],
    ["Si la diagonal está arriba y la barra abajo, gira el cubo con `x2` (o `z2`) y es este caso. SpeedCubeDB también da uno directo: `R' D R' F2 R D' R`.",
      "If the diagonal is on top and the bar on the bottom, turn the cube with `x2` (or `z2`) and it is this case. SpeedCubeDB also gives a direct one: `R' D R' F2 R D' R`.",
      "Se a diagonal estiver em cima e a barra embaixo, gire o cubo com `x2` (ou `z2`) e é este caso. O SpeedCubeDB também dá um direto: `R' D R' F2 R D' R`."]),
];

// Each phase is taught as the beginner's (types.ts): the goal and its key, a few steps, and what to do when something
// goes wrong, folded.
export const ortega: Method = {
  id: 'ortega',
  puzzle: '2x2x2',
  name: tr('Ortega', 'Ortega', 'Ortega'),
  summary: tr('La cara blanca, 7 casos de OLL y 5 de PBL: el método intermedio del 2x2.', 'The white face, 7 OLL cases and 5 PBL cases: the intermediate 2x2 method.', 'A face branca, 7 casos de OLL e 5 de PBL: o método intermediário do 2x2.'),
  description: doc([
    'El método intermedio del 2x2: **3 pasos y 12 algoritmos**. La cara blanca va en cualquier orden: el último paso lo arregla.',
    '## Los 3 pasos',
    '1. **Cara blanca:** las 4 pegatinas blancas abajo, en cualquier orden. Sin algoritmos.',
    '2. **OLL:** toda la cara amarilla arriba. 7 casos.',
    '3. **PBL:** las dos capas a su sitio a la vez. 5 casos.',
    '## Cómo aprenderlo',
    '- Antes, resuelve ya el 2x2 con el **Principiante 2x2**.',
    '- Primero el OLL, empezando por **Sune y Antisune**. Si sabes el OCLL del CFOP reducido, ya conoces sus 7 casos.',
    '- Luego el PBL.',
  ], [
    'The intermediate 2x2 method: **3 steps and 12 algorithms**. The white face goes in any order: the last step fixes it.',
    '## The 3 steps',
    '1. **White face:** the 4 white stickers on the bottom, in any order. No algorithms.',
    '2. **OLL:** the whole yellow face on top. 7 cases.',
    '3. **PBL:** both layers into place at once. 5 cases.',
    '## How to learn it',
    '- First, be able to solve the 2x2 with **2x2 beginner**.',
    '- OLL first, starting with **Sune and Antisune**. If you know the OCLL from reduced CFOP, you already know its 7 cases.',
    '- Then PBL.',
  ], [
    'O método intermediário do 2x2: **3 passos e 12 algoritmos**. A face branca vai em qualquer ordem: o último passo arruma.',
    '## Os 3 passos',
    '1. **Face branca:** os 4 adesivos brancos embaixo, em qualquer ordem. Sem algoritmos.',
    '2. **OLL:** toda a face amarela em cima. 7 casos.',
    '3. **PBL:** as duas camadas no lugar ao mesmo tempo. 5 casos.',
    '## Como aprender',
    '- Antes, saiba resolver o 2x2 com o **2x2 para iniciantes**.',
    '- Primeiro o OLL, começando por **Sune e Antisune**. Se você sabe o OCLL do CFOP reduzido, já conhece os 7 casos.',
    '- Depois o PBL.',
  ]),
  orientation: tr(
    '**Cara blanca abajo, amarillo arriba y verde al frente**, como en el 3x3.',
    '**White face on the bottom, yellow on top and green in front**, as on the 3x3.',
    '**Face branca embaixo, amarelo em cima e verde na frente**, como no 3x3.',
  ),
  notation: doc([
    '## Movimientos',
    '- Las mismas letras que en el 3x3: `R`, `U`, `F`, `L`, `D` y `B`. Sin capas del medio (`M`, `E`, `S`) ni giros anchos (`r`).',
    '- `x`, `y` y `z` giran el cubo entero: `x` como `R`, `y` como `U`, `z` como `F`. Con `x2` o `z2`, lo de abajo pasa arriba.',
    '## Figuras',
    '- **Cara blanca:** el cubo visto desde arriba, adelante y a la derecha. Solo se ven las pegatinas blancas.',
    '- **OLL:** la cara amarilla desde arriba, con el frente abajo. Las barritas son las pegatinas de los lados.',
    '- **PBL:** las dos capas lado a lado; la de abajo, vista desde arriba como a través del cubo. Las flechas dicen a dónde va cada pieza.',
  ], [
    '## Moves',
    '- The same letters as on the 3x3: `R`, `U`, `F`, `L`, `D` and `B`. No middle layers (`M`, `E`, `S`) and no wide moves (`r`).',
    '- `x`, `y` and `z` rotate the whole cube: `x` like `R`, `y` like `U`, `z` like `F`. With `x2` or `z2`, the bottom goes to the top.',
    '## Diagrams',
    '- **White face:** the cube seen from the top, front and right. Only the white stickers show.',
    '- **OLL:** the yellow face from above, with the front at the bottom. The little bars are the side stickers.',
    '- **PBL:** both layers side by side; the bottom one seen from above, as if through the cube. The arrows show where each piece goes.',
  ], [
    '## Movimentos',
    '- As mesmas letras do 3x3: `R`, `U`, `F`, `L`, `D` e `B`. Sem camadas do meio (`M`, `E`, `S`) nem movimentos largos (`r`).',
    '- `x`, `y` e `z` giram o cubo inteiro: `x` como `R`, `y` como `U`, `z` como `F`. Com `x2` ou `z2`, o que está embaixo passa para cima.',
    '## Figuras',
    '- **Face branca:** o cubo visto de cima, da frente e da direita. Só aparecem os adesivos brancos.',
    '- **OLL:** a face amarela vista de cima, com a frente embaixo. As barrinhas são os adesivos dos lados.',
    '- **PBL:** as duas camadas lado a lado; a de baixo, vista de cima como através do cubo. As setas mostram para onde vai cada peça.',
  ]),
  phases: [
    {
      id: 'ortega-cara',
      name: tr('Cara blanca', 'White face', 'Face branca'),
      goal: doc(
        ['**Meta:** las 4 pegatinas blancas abajo, en cualquier orden: el orden lo arregla el PBL.', "**Secuencia:** la última esquina baja con `R U R'` o con su espejo, `F' U' F`."],
        ['**Goal:** the 4 white stickers on the bottom, in any order: PBL fixes the order.', "**Sequence:** the last corner drops in with `R U R'` or its mirror, `F' U' F`."],
        ['**Meta:** os 4 adesivos brancos embaixo, em qualquer ordem: o PBL arruma a ordem.', "**Sequência:** a última quina desce com `R U R'` ou com o seu espelho, `F' U' F`."],
      ),
      goalFigure: false, // the white face ends up facing down: the view from above can't show it
      description: doc([
        '## Cómo se hace',
        '1. Pon abajo 2 esquinas blancas, una junto a la otra, con el blanco abajo.',
        '2. Añade la tercera de la misma forma.',
        '3. Gira `D` hasta dejar el hueco adelante a la derecha, y `U` hasta tener la cuarta encima.',
        '4. Bájala según hacia dónde mire el blanco (los casos de abajo).',
        'Con práctica, planea la cara entera en la inspección.',
      ], [
        '## How to do it',
        '1. Put 2 white corners on the bottom, side by side, with white facing down.',
        '2. Add the third one the same way.',
        '3. Turn `D` until the slot is at the front right, and `U` until the fourth corner is above it.',
        '4. Drop it in depending on where the white faces (the cases below).',
        'With practice, plan the whole face during inspection.',
      ], [
        '## Como fazer',
        '1. Coloque 2 quinas brancas embaixo, uma ao lado da outra, com o branco para baixo.',
        '2. Adicione a terceira do mesmo jeito.',
        '3. Gire `D` até deixar o slot na frente à direita, e `U` até ter a quarta em cima dele.',
        '4. Desça-a conforme o lado para onde o branco olha (os casos abaixo).',
        'Com prática, planeje a face inteira na inspeção.',
      ]),
      tips: doc([
        '- **No sabes por dónde empezar:** elige la cara que ya tenga 2 o 3 blancas.',
        '- **La cuarta no queda encima del hueco:** gira `D` para mover el hueco; el orden de abajo no importa.',
        '- **La cuarta está abajo pero girada:** sácala y vuelve a bajarla (el caso «Girada»).',
      ], [
        "- **You don't know where to start:** pick the face that already has 2 or 3 whites.",
        "- **The fourth corner isn't above the slot:** turn `D` to move the slot; the order on the bottom doesn't matter.",
        '- **The fourth corner is on the bottom but twisted:** take it out and drop it in again (the "Twisted" case).',
      ], [
        '- **Não sabe por onde começar:** escolha a face que já tiver 2 ou 3 brancas.',
        '- **A quarta não fica em cima do slot:** gire `D` para mover o slot; a ordem de baixo não importa.',
        '- **A quarta está embaixo, mas girada:** tire-a e desça de novo (o caso "Girada").',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'ortega-cara-encima', name: tr('La última esquina, arriba', 'The last corner, on top', 'A última quina, em cima'), description: tr('Encima del hueco. El blanco decide el algoritmo.', 'Above the slot. The white decides the algorithm.', 'Acima do slot. O branco decide o algoritmo.'), cases: lastCornerUp },
        { id: 'ortega-cara-abajo', name: tr('La última esquina, abajo', 'The last corner, on the bottom', 'A última quina, embaixo'), description: tr('En su sitio, pero girada: sácala y vuelve a bajarla.', 'In its slot, but twisted: take it out and drop it in again.', 'No lugar, mas girada: tire-a e desça de novo.'), cases: lastCornerDown },
      ],
      quizzes: [],
    },
    {
      id: 'ortega-oll',
      name: tr('OLL', 'OLL', 'OLL'),
      goal: doc(
        ['**Meta:** toda la cara amarilla arriba, con la blanca abajo.', '**Casos:** 7. Las amarillas que miran arriba dicen el grupo: 1, Sune o Antisune; 0, H o Pi; 2, U, T o L.'],
        ['**Goal:** the whole yellow face on top, with the white one on the bottom.', '**Cases:** 7. The yellows facing up tell the group: 1, Sune or Antisune; 0, H or Pi; 2, U, T or L.'],
        ['**Meta:** toda a face amarela em cima, com a branca embaixo.', '**Casos:** 7. As amarelas viradas para cima dizem o grupo: 1, Sune ou Antisune; 0, H ou Pi; 2, U, T ou L.'],
      ),
      description: doc([
        '## Cómo se hace',
        '1. Cuenta las pegatinas amarillas que miran arriba: te dan el grupo.',
        '2. Mira hacia dónde miran las otras: te dan el caso.',
        '3. Gira `U` hasta verlo como en su figura y haz el algoritmo.',
      ], [
        '## How to do it',
        '1. Count the yellow stickers facing up: they give you the group.',
        '2. Look at where the others face: that gives you the case.',
        '3. Turn `U` until it looks like its diagram and do the algorithm.',
      ], [
        '## Como fazer',
        '1. Conte os adesivos amarelos virados para cima: eles dão o grupo.',
        '2. Veja para onde olham os outros: isso dá o caso.',
        '3. Gire `U` até vê-lo como na figura e faça o algoritmo.',
      ]),
      tips: doc([
        '- **La cara blanca cambia de orden:** es normal, solo tiene que seguir abajo. El orden lo arregla el PBL.',
        '- **Confundes Sune y Antisune:** con la amarilla de arriba adelante a la izquierda, mira la de adelante-derecha. Si mira al frente, es Sune; si mira a la derecha, Antisune.',
        '- **Salió otro caso:** lo sostuviste en otro ángulo. Ningún algoritmo de este paso rompe la cara blanca: reconoce el caso nuevo y sigue.',
      ], [
        "- **The white face changes order:** that's normal, it only has to stay on the bottom. PBL fixes the order.",
        '- **You mix up Sune and Antisune:** with the top yellow at the front left, look at the front-right one. If it faces front, it is Sune; if it faces right, Antisune.',
        "- **Another case came out:** you held it at another angle. No algorithm of this step breaks the white face: recognize the new case and continue.",
      ], [
        '- **A face branca muda de ordem:** é normal, ela só precisa continuar embaixo. O PBL arruma a ordem.',
        '- **Você confunde Sune e Antisune:** com a amarela de cima na frente à esquerda, olhe a da frente-direita. Se olha para a frente, é Sune; se olha para a direita, Antisune.',
        '- **Saiu outro caso:** você segurou em outro ângulo. Nenhum algoritmo deste passo desfaz a face branca: reconheça o caso novo e continue.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'ortega-oll-una', name: tr('1 amarilla arriba', '1 yellow on top', '1 amarela em cima'), cases: ollOne },
        { id: 'ortega-oll-ninguna', name: tr('0 amarillas arriba', '0 yellows on top', '0 amarelas em cima'), cases: ollNone },
        { id: 'ortega-oll-dos', name: tr('2 amarillas arriba', '2 yellows on top', '2 amarelas em cima'), cases: ollTwo },
      ],
      quizzes: [],
    },
    {
      id: 'ortega-pbl',
      name: tr('PBL', 'PBL', 'PBL'),
      goal: doc(
        ['**Meta:** las dos capas a su sitio a la vez. ¡Cubo resuelto!', '**Casos:** 5. Se reconocen por las **barras** de cada capa: lados con sus 2 colores iguales.'],
        ['**Goal:** both layers into place at once. Cube solved!', '**Cases:** 5. You recognize them by the **bars** of each layer: sides with their 2 colors equal.'],
        ['**Meta:** as duas camadas no lugar ao mesmo tempo. Cubo resolvido!', '**Casos:** 5. Você os reconhece pelas **barras** de cada camada: lados com as suas 2 cores iguais.'],
      ),
      description: doc([
        '## Cómo se hace',
        '1. Cuenta las barras de la capa de arriba: **4**, está bien; **1**, dos esquinas cambiadas de lado; **ninguna**, cambiadas en diagonal.',
        '2. Inclina el cubo y cuenta las de abajo igual. Con las dos capas tienes el caso.',
        '3. Gira `U` y `D` hasta dejar las barras donde pide el caso, y haz el algoritmo.',
        '4. Ajusta con `U` y `D`.',
        'Si solo falta la capa de abajo, gira el cubo con `x2` (o `z2`): pasa arriba y es el mismo caso.',
      ], [
        '## How to do it',
        '1. Count the bars of the top layer: **4**, it is right; **1**, two corners swapped along a side; **none**, swapped diagonally.',
        '2. Tilt the cube and count the bottom ones the same way. With both layers you have the case.',
        '3. Turn `U` and `D` until the bars are where the case asks, and do the algorithm.',
        '4. Adjust with `U` and `D`.',
        'If only the bottom layer is left, turn the cube with `x2` (or `z2`): it goes to the top and it is the same case.',
      ], [
        '## Como fazer',
        '1. Conte as barras da camada de cima: **4**, está certa; **1**, duas quinas trocadas de lado; **nenhuma**, trocadas na diagonal.',
        '2. Incline o cubo e conte as de baixo do mesmo jeito. Com as duas camadas você tem o caso.',
        '3. Gire `U` e `D` até deixar as barras onde o caso pede, e faça o algoritmo.',
        '4. Ajuste com `U` e `D`.',
        'Se só faltar a camada de baixo, gire o cubo com `x2` (ou `z2`): ela passa para cima e é o mesmo caso.',
      ]),
      tips: doc([
        '- **No ves las barras de abajo:** inclina el cubo hacia ti para ver los lados de la capa de abajo.',
        '- **No quedó resuelto:** las barras no estaban donde pedía el caso. Ningún algoritmo de este paso rompe las caras: cuenta otra vez las barras y sigue con el caso que salga.',
      ], [
        "- **You can't see the bottom bars:** tilt the cube toward you to see the sides of the bottom layer.",
        "- **It didn't end up solved:** the bars weren't where the case asks. No algorithm of this step breaks the faces: count the bars again and continue with the case that comes out.",
      ], [
        '- **Não vê as barras de baixo:** incline o cubo na sua direção para ver os lados da camada de baixo.',
        '- **Não ficou resolvido:** as barras não estavam onde o caso pede. Nenhum algoritmo deste passo desfaz as faces: conte as barras de novo e continue com o caso que sair.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'ortega-pbl-una', name: tr('Solo una capa', 'Only one layer', 'Só uma camada'), description: tr('La otra capa tiene sus 4 barras.', 'The other layer has its 4 bars.', 'A outra camada tem suas 4 barras.'), cases: pblOne },
        { id: 'ortega-pbl-dos', name: tr('Las dos capas', 'Both layers', 'As duas camadas'), cases: pblTwo },
      ],
      quizzes: [],
    },
  ],
};

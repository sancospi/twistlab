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
  cara('derecha', ['Derecha', 'Right', 'Direita'], ['Blanco a la derecha', 'White facing right', 'Branco para a direita'],
    ['Tres esquinas blancas abajo; la cuarta arriba, adelante a la derecha, encima del hueco, con el blanco a la derecha',
      'Three white corners on the bottom; the fourth at top front-right, above the empty spot, white facing right',
      'Três quinas brancas embaixo; a quarta em cima, na frente à direita, acima do espaço vazio, com o branco para a direita'], "R U R'"),
  cara('frente', ['Frente', 'Front', 'Frente'], ['Blanco al frente', 'White facing front', 'Branco para a frente'],
    ['Tres esquinas blancas abajo; la cuarta arriba, adelante a la derecha, encima del hueco, con el blanco al frente',
      'Three white corners on the bottom; the fourth at top front-right, above the empty spot, white facing front',
      'Três quinas brancas embaixo; a quarta em cima, na frente à direita, acima do espaço vazio, com o branco para a frente'], "F' U' F",
    ["`F' U' F` es el espejo de `R U R'`: el mismo gesto con la cara del frente, con cada giro en el sentido contrario.",
      "`F' U' F` is the mirror of `R U R'`: the same motion with the front face, each move turned the other way.",
      "`F' U' F` é o espelho de `R U R'`: o mesmo gesto com a face da frente, com cada movimento no sentido contrário."]),
  cara('arriba', ['Arriba', 'Up', 'Em cima'], ['Blanco arriba', 'White facing up', 'Branco para cima'],
    ['Tres esquinas blancas abajo; la cuarta arriba, adelante a la derecha, encima del hueco, con el blanco arriba',
      'Three white corners on the bottom; the fourth at top front-right, above the empty spot, white facing up',
      'Três quinas brancas embaixo; a quarta em cima, na frente à direita, acima do espaço vazio, com o branco para cima'], "R U2 R' U' R U R'",
    ["`R U2 R'` la deja arriba, adelante a la izquierda, con el blanco al frente. `U'` la devuelve encima del hueco, con el blanco a la derecha, y `R U R'` la baja.",
      "`R U2 R'` leaves it at top front-left, with white facing front. `U'` brings it back above the empty spot, with white facing right, and `R U R'` drops it in.",
      "`R U2 R'` a deixa em cima, na frente à esquerda, com o branco para a frente. `U'` a leva de volta para cima do espaço vazio, com o branco para a direita, e `R U R'` a desce."]),
];
const lastCornerDown = [
  cara('girada', ['Girada', 'Twisted', 'Girada'], ['Abajo, girada', 'On the bottom, twisted', 'Embaixo, girada'],
    ['Tres esquinas blancas abajo; la cuarta también abajo, adelante a la derecha, pero con el blanco a la derecha',
      'Three white corners on the bottom; the fourth also on the bottom, at front-right, but with white facing right',
      'Três quinas brancas embaixo; a quarta também embaixo, na frente à direita, mas com o branco para a direita'], "R U R' U' R U R'",
    ["`R U R' U'` la sube encima del hueco, con el blanco a la derecha, y `R U R'` la baja con el blanco abajo. Si el blanco mira al frente, haz el espejo: `F' U' F U F' U' F`.",
      "`R U R' U'` brings it up above the empty spot, white facing right, and `R U R'` drops it in with white facing down. If the white faces front, do the mirror: `F' U' F U F' U' F`.",
      "`R U R' U'` a tira e a deixa acima do espaço vazio, com o branco para a direita, e `R U R'` a desce com o branco para baixo. Se o branco olhar para a frente, faça o espelho: `F' U' F U F' U' F`."]),
];

// --- 2. OLL: the 7 corner-orientation cases ---
const oll = (slug: string, code: string, name: string | T, recognition: T, rank: number, alg: string, alts: Alt[], note?: T) =>
  kase({ phase: 'oll', slug, stage: '2x2-oll', code: [code, code, code], name: typeof name === 'string' ? [name, name, name] : name, recognition, alg, rank, alts, note });

const SUNE_NOTE: T = ['Sune y Antisune son inversos: la preparación de uno es el algoritmo del otro.', 'Sune and Antisune are inverses: the setup of one is the algorithm of the other.', 'Sune e Antisune são inversos: a preparação de um é o algoritmo do outro.'];
const ollOne = [
  oll('sune', 'Sune', 'Sune', ['Una esquina con el amarillo arriba, la de adelante a la izquierda; la de adelante a la derecha, con el amarillo al frente',
    'One corner with yellow facing up, the front-left one; the front-right one, with yellow facing front', 'Uma quina com o amarelo para cima, a da frente à esquerda; a da frente à direita, com o amarelo para a frente'], 1,
    "R U R' U R U2 R'", [[2, "R U R2 U' R2 U R"]], SUNE_NOTE),
  oll('antisune', 'Antisune', 'Antisune', ['Una esquina con el amarillo arriba, la de atrás a la derecha; la de adelante a la izquierda, con el amarillo al frente',
    'One corner with yellow facing up, the back-right one; the front-left one, with yellow facing front', 'Uma quina com o amarelo para cima, a de trás à direita; a da frente à esquerda, com o amarelo para a frente'], 1,
    "R U2 R' U' R U' R'", [[4, "R' F R F' R U R'", ['Para este algoritmo, gira `U` hasta que la esquina con el amarillo arriba quede adelante a la derecha.', 'For this algorithm, turn `U` until the corner with yellow facing up is at front-right.', 'Para este algoritmo, gire `U` até que a quina com o amarelo para cima fique na frente à direita.']]], SUNE_NOTE),
];
const ollNone = [
  oll('h', 'H', 'H', ['Ninguna esquina con el amarillo arriba; 2 con el amarillo al frente y 2 atrás', 'No corner with yellow facing up; 2 with yellow facing front and 2 facing back', 'Nenhuma quina com o amarelo para cima; 2 com o amarelo para a frente e 2 para trás'], 1,
    "R2 U2 R' U2 R2", [[2, "R2 U2 R U2 R2", ["Es el algoritmo principal con `R` en vez de `R'`.", "It's the main algorithm with `R` instead of `R'`.", "É o algoritmo principal com `R` em vez de `R'`."]],
      [3, "F R U R' U' R U R' U' R U R' U' F'", ["Es el gatillo `R U R' U'` 3 veces, entre `F` y `F'`.", "It's the `R U R' U'` trigger 3 times, between `F` and `F'`.", "É o gatilho `R U R' U'` 3 vezes, entre `F` e `F'`."]]],
    ['Si ves el amarillo a la izquierda y a la derecha, gira `U` antes para que mire al frente y atrás.', 'If you see the yellow facing left and right, turn `U` first so it faces front and back.', 'Se você vir o amarelo para a esquerda e para a direita, gire `U` antes para que ele olhe para a frente e para trás.']),
  oll('pi', 'Pi', 'Pi', ['Ninguna esquina con el amarillo arriba; 2 con el amarillo a la izquierda; a la derecha, una con el amarillo al frente y otra atrás',
    'No corner with yellow facing up; 2 with yellow facing left; on the right, one with yellow facing front and one facing back',
    'Nenhuma quina com o amarelo para cima; 2 com o amarelo para a esquerda; à direita, uma com o amarelo para a frente e outra para trás'], 1,
    "F R U R' U' R U R' U' F'", [[3, "R U2 R2 U' R2 U' R2 U2 R", ['Es el mismo algoritmo que el Pi del CFOP reducido.', "It's the same algorithm as Pi in Reduced CFOP.", 'É o mesmo algoritmo do Pi no CFOP reduzido.']]],
    ["Es el gatillo `R U R' U'` 2 veces, entre `F` y `F'`.", "It's the `R U R' U'` trigger 2 times, between `F` and `F'`.", "É o gatilho `R U R' U'` 2 vezes, entre `F` e `F'`."]),
];
const ollTwo = [
  oll('u', 'U', ['U (faros)', 'U (headlights)', 'U (faróis)'], ['Dos esquinas con el amarillo arriba, las de la derecha; las otras 2, con el amarillo a la izquierda', 'Two corners with yellow facing up, the right ones; the other 2, with yellow facing left', 'Duas quinas com o amarelo para cima, as da direita; as outras 2, com o amarelo para a esquerda'], 1,
    "F R U R' U' F'", [[2, "y2 F U R U' R' F'", ['Empieza girando el cubo entero con `y2`: los faros pasan a la derecha.', 'It starts by rotating the whole cube with `y2`: the headlights move to the right.', 'Começa girando o cubo inteiro com `y2`: os faróis passam para a direita.']]]),
  oll('t', 'T', 'T', ['Dos esquinas con el amarillo arriba, las de la derecha; a la izquierda, una con el amarillo al frente y otra atrás',
    'Two corners with yellow facing up, the right ones; on the left, one with yellow facing front and one facing back',
    'Duas quinas com o amarelo para cima, as da direita; à esquerda, uma com o amarelo para a frente e outra para trás'], 1,
    "R U R' U' R' F R F'", [[2, "U R U R' U' F' U' F"]]),
  oll('l', 'L', 'L', ['Dos esquinas con el amarillo arriba, en diagonal (atrás a la izquierda y adelante a la derecha); la de adelante a la izquierda, con el amarillo al frente',
    'Two corners with yellow facing up, on a diagonal (back-left and front-right); the front-left one, with yellow facing front',
    'Duas quinas com o amarelo para cima, na diagonal (atrás à esquerda e na frente à direita); a da frente à esquerda, com o amarelo para a frente'], 3,
    "F R' F' R U R U' R'", [[2, "F R U' R' U' R U R' F'"]]),
];

// --- 3. PBL: both layers at once. A bar = one side of a layer with its 2 colors equal ---
const pbl = (slug: string, code: string, name: T, recognition: T, rank: number, alg: string, alts: Alt[], note?: T) =>
  kase({ phase: 'pbl', slug, stage: '2x2-pbl', code: [code, code, code], name, recognition, alg, rank, alts, note });

const X2: T = ['Si la capa por arreglar está abajo, gira el cubo con `x2` (o `z2`) para pasarla arriba: es el mismo caso.',
  "If the layer to fix is on the bottom, rotate the cube with `x2` (or `z2`) to bring it to the top: it's the same case.",
  'Se a camada que falta arrumar estiver embaixo, gire o cubo com `x2` (ou `z2`) para passá-la para cima: é o mesmo caso.'];
const pblOne = [
  pbl('adj', 'Adj', ['Adyacentes arriba', 'Adjacent on top', 'Adjacentes em cima'], ['Arriba, 1 barra, adelante; abajo, 4 barras', 'Top: 1 bar, at the front; bottom: 4 bars', 'Em cima, 1 barra, na frente; embaixo, 4 barras'], 1,
    "y R U R' F' R U R' U' R' F R2 U' R' U'", [[3, "y R U R' U' R' F R2 U' R' U' R U R' F'", ['Es la T-perm del 3x3, después de la `y`.', "It's the 3x3 T-perm, after the `y`.", 'É a T-perm do 3x3, depois do `y`.']]],
    [`La \`y\` del principio gira el cubo entero y deja la barra a la izquierda. ${X2[0]}`, `The \`y\` at the start rotates the whole cube and leaves the bar on the left. ${X2[1]}`, `O \`y\` do começo gira o cubo inteiro e deixa a barra à esquerda. ${X2[2]}`]),
  pbl('diag', 'Diag', ['Diagonal arriba', 'Diagonal on top', 'Diagonal em cima'], ['Arriba, ninguna barra; abajo, 4 barras', 'Top: no bars; bottom: 4 bars', 'Em cima, nenhuma barra; embaixo, 4 barras'], 1,
    "R U' R' U' F2 U' R U R' U F2", [[2, "F R U' R' U' R U R' F' R U R' U' R' F R F'", ['Es la Y-perm del 3x3.', "It's the 3x3 Y-perm.", 'É a Y-perm do 3x3.']]],
    X2),
];
const pblTwo = [
  pbl('adj-adj', 'Adj-Adj', ['Adyacentes arriba y abajo', 'Adjacent on top and bottom', 'Adjacentes em cima e embaixo'], ['Arriba, 1 barra, adelante; abajo, 1 barra, adelante', 'Top: 1 bar, at the front; bottom: 1 bar, at the front', 'Em cima, 1 barra, na frente; embaixo, 1 barra, na frente'], 1,
    "R2 U' B2 U2 R2 U' R2", [[3, "R2 U R2 U2 F2 U F2"]]),
  pbl('diag-diag', 'Diag-Diag', ['Diagonal arriba y abajo', 'Diagonal on top and bottom', 'Diagonal em cima e embaixo'], ['Ninguna barra, ni arriba ni abajo', 'No bars on top or on the bottom', 'Nenhuma barra, nem em cima nem embaixo'], 1,
    'R2 F2 R2', [[2, 'R2 B2 R2']],
    ['Da igual cómo lo sostengas: al final, gira `U` y `D` hasta que cada cara tenga un solo color.', "It doesn't matter how you hold it: at the end, turn `U` and `D` until each face is a single color.", 'Não importa como você segure o cubo: no final, gire `U` e `D` até que cada face tenha uma cor só.']),
  pbl('adj-diag', 'Adj-Diag', ['Adyacentes arriba, diagonal abajo', 'Adjacent on top, diagonal on the bottom', 'Adjacentes em cima, diagonal embaixo'], ['Arriba, 1 barra, adelante; abajo, ninguna barra', 'Top: 1 bar, at the front; bottom: no bars', 'Em cima, 1 barra, na frente; embaixo, nenhuma barra'], 1,
    "R U' R F2 R' U R'", [[2, "R' F R' F2 R U' R"]],
    ["Si la capa sin barras está arriba y la de 1 barra abajo, gira el cubo con `x2` (o `z2`) y tendrás este caso. También puedes resolverlo sin girar el cubo: con la barra de abajo adelante, haz `R' D R' F2 R D' R`.",
      "If the layer with no bars is on top and the one with 1 bar is on the bottom, rotate the cube with `x2` (or `z2`) and you'll have this case. You can also solve it without rotating the cube: with the bottom bar at the front, do `R' D R' F2 R D' R`.",
      "Se a camada sem barras estiver em cima e a de 1 barra embaixo, gire o cubo com `x2` (ou `z2`) e você terá este caso. Também dá para resolver sem girar o cubo: com a barra de baixo na frente, faça `R' D R' F2 R D' R`."]),
];

// Each phase is taught as the beginner's (types.ts): the goal and its key, a few steps, and what to do when something
// goes wrong, folded.
export const ortega: Method = {
  id: 'ortega',
  puzzle: '2x2x2',
  name: tr('Ortega', 'Ortega', 'Ortega'),
  summary: tr('Resuelve el 2x2 más rápido con Ortega: la cara blanca, 7 casos de OLL y 5 de PBL. Para quien ya sabe resolverlo.', 'Solve the 2x2 faster with Ortega: the white face, 7 OLL cases and 5 PBL cases. For anyone who can already solve the 2x2.', 'Resolva o 2x2 mais rápido com o Ortega: a face branca, 7 casos de OLL e 5 de PBL. Para quem já sabe resolver o 2x2.'),
  description: doc([
    'Ortega es el método intermedio del 2x2: **3 pasos y 12 algoritmos**, para quien ya lo resuelve y quiere bajar sus tiempos.',
    'Su gran diferencia con el Principiante 2x2: al empezar basta con la cara blanca, aunque los colores de los lados no coincidan. El último paso pone cada esquina en su sitio.',
    '## Los 3 pasos',
    '1. **Cara blanca:** las 4 pegatinas blancas abajo. Sin algoritmos.',
    '2. **OLL:** toda la cara amarilla arriba. 7 casos.',
    '3. **PBL** (permutación de las dos capas): cada esquina a su sitio, arriba y abajo a la vez. 5 casos.',
    '## Cómo aprenderlo',
    '1. Antes, aprende a resolver el 2x2 con la guía Principiante 2x2.',
    '2. Aprende el OLL, empezando por Sune y Antisune. Si ya sabes el OCLL del CFOP reducido (las esquinas del OLL en 2 pasos), reconoces sus 7 casos. Aquí H, U y L tienen algoritmos más cortos. Además, H y U se ven girados un cuarto de vuelta respecto al CFOP reducido: sigue sus figuras.',
    '3. Después, aprende el PBL.',
  ], [
    'Ortega is the intermediate 2x2 method: **3 steps and 12 algorithms**, for anyone who can already solve the 2x2 and wants faster times.',
    "The big difference from the 2x2 beginner guide: the first step only needs the white face, even if the side colors don't match. The last step puts every corner in its place.",
    '## The 3 steps',
    '1. **White face:** the 4 white stickers on the bottom. No algorithms.',
    '2. **OLL:** the whole yellow face on top. 7 cases.',
    '3. **PBL** (permutation of both layers): every corner to its place, top and bottom at once. 5 cases.',
    '## How to learn it',
    '1. First, learn to solve the 2x2 with the 2x2 beginner guide.',
    "2. Learn OLL, starting with Sune and Antisune. If you already know OCLL from Reduced CFOP (the corners of 2-look OLL), you'll recognize its 7 cases. Here H, U and L have shorter algorithms. Also, H and U appear rotated a quarter turn compared with Reduced CFOP: follow their diagrams.",
    '3. Then learn PBL.',
  ], [
    'O Ortega é o método intermediário do 2x2: **3 passos e 12 algoritmos**, para quem já sabe resolver o 2x2 e quer baixar seus tempos.',
    'A grande diferença em relação ao 2x2 para iniciantes: no começo basta a face branca, mesmo que as cores dos lados não coincidam. O último passo coloca cada quina no lugar dela.',
    '## Os 3 passos',
    '1. **Face branca:** os 4 adesivos brancos embaixo. Sem algoritmos.',
    '2. **OLL:** toda a face amarela em cima. 7 casos.',
    '3. **PBL** (permutação das duas camadas): cada quina no lugar, em cima e embaixo ao mesmo tempo. 5 casos.',
    '## Como aprender',
    '1. Antes, aprenda a resolver o 2x2 com o guia 2x2 para iniciantes.',
    '2. Aprenda o OLL, começando por Sune e Antisune. Se você já sabe o OCLL do CFOP reduzido (as quinas do OLL em 2 passos), vai reconhecer os 7 casos. Aqui H, U e L têm algoritmos mais curtos. Além disso, H e U aparecem girados um quarto de volta em relação ao CFOP reduzido: siga as figuras deles.',
    '3. Depois, aprenda o PBL.',
  ]),
  orientation: tr(
    'Sostén el cubo con la **cara blanca abajo**, el amarillo arriba y el verde al frente, como en el 3x3. En el primer paso, la última esquina siempre baja adelante a la derecha.',
    'Hold the cube with the **white face on the bottom**, yellow on top and green facing front, as on the 3x3. In the first step, the last corner always drops in at front-right.',
    'Segure o cubo com a **face branca embaixo**, o amarelo em cima e o verde para a frente, como no 3x3. No primeiro passo, a última quina sempre desce na frente à direita.',
  ),
  notation: doc([
    '## Giros',
    '- Las mismas letras que en el 3x3: `R`, `U`, `F`, `L`, `D` y `B`. Sin capas del medio (`M`, `E`, `S`) ni giros de dos capas (`r`).',
    '- `x`, `y` y `z` giran el cubo entero: `x` como `R`, `y` como `U`, `z` como `F`. Con `x2` o `z2`, la capa de abajo pasa arriba.',
    '## Figuras',
    '- **Cara blanca:** el cubo visto desde arriba, adelante y a la derecha. Solo se pintan las pegatinas blancas. Las que ya miran abajo no se ven.',
    '- **OLL:** la cara amarilla vista desde arriba, con el frente en el borde inferior del dibujo. Las tiras finas del borde son las pegatinas de los lados.',
    '- **PBL:** las dos capas, una junto a la otra. La de abajo se ve desde arriba, como a través del cubo. Las flechas dicen a dónde va cada pieza.',
  ], [
    '## Moves',
    '- The same letters as on the 3x3: `R`, `U`, `F`, `L`, `D` and `B`. No middle layers (`M`, `E`, `S`) and no wide moves (`r`).',
    '- `x`, `y` and `z` rotate the whole cube: `x` like `R`, `y` like `U`, `z` like `F`. With `x2` or `z2`, the bottom layer goes to the top.',
    '## Diagrams',
    "- **White face:** the cube seen from the top, front and right. Only the white stickers are colored. The ones already facing down don't show.",
    '- **OLL:** the yellow face seen from above, with the front along the lower border of the drawing. The thin strips around the border are the side stickers.',
    '- **PBL:** both layers, side by side. The bottom one is seen from above, as if through the cube. The arrows show where each piece goes.',
  ], [
    '## Movimentos',
    '- As mesmas letras do 3x3: `R`, `U`, `F`, `L`, `D` e `B`. Sem camadas do meio (`M`, `E`, `S`) nem movimentos de duas camadas (`r`).',
    '- `x`, `y` e `z` giram o cubo inteiro: `x` como `R`, `y` como `U`, `z` como `F`. Com `x2` ou `z2`, a camada de baixo passa para cima.',
    '## Figuras',
    '- **Face branca:** o cubo visto de cima, da frente e da direita. Só os adesivos brancos são pintados. Os que já olham para baixo não aparecem.',
    '- **OLL:** a face amarela vista de cima, com a frente na borda inferior do desenho. As tiras finas da borda são os adesivos dos lados.',
    '- **PBL:** as duas camadas, uma ao lado da outra. A de baixo é vista de cima, como se você olhasse através do cubo. As setas mostram para onde vai cada peça.',
  ]),
  phases: [
    {
      id: 'ortega-cara',
      name: tr('Cara blanca', 'White face', 'Face branca'),
      goal: doc(
        ['**Meta:** las 4 pegatinas blancas abajo, aunque los colores de los lados no coincidan. El PBL pondrá luego cada esquina en su sitio.', "**Sin algoritmos:** la última esquina baja con `R U R'` o con su espejo, `F' U' F`."],
        ["**Goal:** the 4 white stickers on the bottom, even if the side colors don't match. PBL will later put every corner in its place.", "**No algorithms:** the last corner drops in with `R U R'` or its mirror, `F' U' F`."],
        ['**Meta:** os 4 adesivos brancos embaixo, mesmo que as cores dos lados não coincidam. Depois, o PBL coloca cada quina no lugar dela.', "**Sem algoritmos:** a última quina desce com `R U R'` ou com o seu espelho, `F' U' F`."],
      ),
      goalFigure: false, // the white face ends up facing down: the view from above can't show it
      description: doc([
        '## Cómo se hace',
        '1. Pon abajo 2 esquinas blancas, una junto a la otra, con el blanco abajo.',
        '2. Gira `D` hasta tener adelante a la derecha un sitio libre de la capa de abajo: es el **hueco**.',
        '3. Gira `U` hasta tener una esquina blanca encima del hueco. Bájala según hacia dónde mire su blanco: a la derecha, al frente o arriba. Cada caso tiene sus giros.',
        '4. Repite los pasos 2 y 3 con la última esquina. Estos giros no mueven las esquinas que ya bajaste.',
        'Con práctica, planea la cara blanca entera durante la inspección.',
      ], [
        '## How to do it',
        '1. Put 2 white corners on the bottom, side by side, with white facing down.',
        "2. Turn `D` until a free place in the bottom layer is at front-right: that's the **empty spot**.",
        '3. Turn `U` until a white corner is above the empty spot. Drop it in depending on which way its white sticker faces: right, front or up. Each case has its own moves.',
        "4. Repeat steps 2 and 3 with the last corner. These moves don't disturb the corners you already placed.",
        'With practice, plan the whole white face during inspection.',
      ], [
        '## Como fazer',
        '1. Coloque 2 quinas brancas embaixo, uma ao lado da outra, com o branco para baixo.',
        '2. Gire `D` até que um lugar livre da camada de baixo fique na frente à direita: esse é o **espaço vazio**.',
        '3. Gire `U` até que uma quina branca fique em cima do espaço vazio. Para descê-la, veja para onde o branco dela olha: para a direita, para a frente ou para cima. Cada caso tem seus movimentos.',
        '4. Repita os passos 2 e 3 com a última quina. Esses movimentos não mexem nas quinas que você já desceu.',
        'Com prática, planeje a face branca inteira durante a inspeção.',
      ]),
      tips: doc([
        '- **No sabes por dónde empezar:** busca la cara con más pegatinas blancas y gira el cubo para dejarla abajo.',
        '- **La cuarta esquina no queda encima del hueco:** gira `U` hasta dejarla encima. También puedes girar `D` para mover el hueco, porque no importa en qué sitio quede cada esquina de abajo.',
        '- **La cuarta esquina está abajo, pero girada:** sácala y vuelve a bajarla, como en el caso «Abajo, girada».',
      ], [
        "- **You don't know where to start:** find the face with the most white stickers and rotate the cube to put it on the bottom.",
        "- **The fourth corner isn't above the empty spot:** turn `U` until it is. You can also turn `D` to move the empty spot, because it doesn't matter where each bottom corner ends up.",
        '- **The fourth corner is on the bottom, but twisted:** take it out and drop it in again, as in the "On the bottom, twisted" case.',
      ], [
        '- **Não sabe por onde começar:** procure a face com mais adesivos brancos e gire o cubo para deixá-la embaixo.',
        '- **A quarta quina não está em cima do espaço vazio:** gire `U` até deixá-la em cima dele. Você também pode girar `D` para mover o espaço vazio, porque não importa em que lugar fica cada quina de baixo.',
        '- **A quarta quina está embaixo, mas girada:** tire-a e desça-a de novo, como no caso "Embaixo, girada".',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'ortega-cara-encima', name: tr('La última esquina, arriba', 'The last corner, on top', 'A última quina, em cima'), description: tr('Está arriba, encima del hueco. Hacia dónde mira su pegatina blanca te dice qué giros hacer.', "It's on top, above the empty spot. Which way its white sticker faces tells you which moves to do.", 'Está em cima, logo acima do espaço vazio. O lado para onde o adesivo branco dela olha indica quais movimentos fazer.'), cases: lastCornerUp },
        { id: 'ortega-cara-abajo', name: tr('La última esquina, abajo', 'The last corner, on the bottom', 'A última quina, embaixo'), description: tr('Ya está en el hueco, pero girada: sácala y vuelve a bajarla.', "It's already in the empty spot, but twisted: take it out and drop it in again.", 'Já está no espaço vazio, mas girada: tire-a e desça-a de novo.'), cases: lastCornerDown },
      ],
      quizzes: [],
    },
    {
      id: 'ortega-oll',
      name: tr('OLL', 'OLL', 'OLL'),
      goal: doc(
        ['**Meta:** toda la cara amarilla arriba, con la blanca abajo.', '**Casos:** 7, en 3 grupos según cuántas esquinas tienen el amarillo arriba: 1 (Sune y Antisune), ninguna (H y Pi) o 2 (U, T y L).'],
        ['**Goal:** the whole yellow face on top, with the white one on the bottom.', '**Cases:** 7, in 3 groups by how many corners have yellow facing up: 1 (Sune and Antisune), none (H and Pi) or 2 (U, T and L).'],
        ['**Meta:** toda a face amarela em cima, com a branca embaixo.', '**Casos:** 7, em 3 grupos conforme o número de quinas com o amarelo para cima: 1 (Sune e Antisune), nenhuma (H e Pi) ou 2 (U, T e L).'],
      ),
      description: doc([
        '## Cómo se hace',
        '1. Cuenta las esquinas con el amarillo arriba: te dan el grupo.',
        '2. Fíjate hacia dónde mira el amarillo de las otras: eso te da el caso.',
        '3. Gira `U` hasta verlo como en su figura y haz el algoritmo.',
      ], [
        '## How to do it',
        '1. Count the corners with yellow facing up: that tells you the group.',
        '2. Check which way the yellow on the other corners faces: that tells you the case.',
        '3. Turn `U` until the case looks like its diagram, then do the algorithm.',
      ], [
        '## Como fazer',
        '1. Conte as quinas com o amarelo para cima: o número indica o grupo.',
        '2. Veja para onde olha o amarelo das outras: isso indica o caso.',
        '3. Gire `U` até o caso ficar como na figura e faça o algoritmo.',
      ]),
      tips: doc([
        '- **Las esquinas blancas cambian de sitio:** es normal, solo tienen que seguir con el blanco abajo. El PBL las pone luego en su sitio.',
        '- **Confundes Sune y Antisune:** gira `U` hasta que la esquina con el amarillo arriba quede adelante a la izquierda. Si la de adelante a la derecha tiene el amarillo al frente, es Sune. Si lo tiene a la derecha, es Antisune.',
        '- **La cara amarilla no quedó completa:** seguramente no sostenías el cubo como en la figura. Ningún algoritmo de este paso deshace la cara blanca: reconoce el caso nuevo y sigue.',
      ], [
        "- **The white corners swap places:** that's normal. They only need to keep white on the bottom, and PBL puts them in place later.",
        "- **You mix up Sune and Antisune:** turn `U` until the corner with yellow facing up is at front-left. If the front-right one has yellow facing front, it's Sune. If it has yellow facing right, it's Antisune.",
        "- **The yellow face didn't end up complete:** you probably weren't holding the cube as in the diagram. No algorithm in this step undoes the white face: recognize the new case and keep going.",
      ], [
        '- **As quinas brancas trocam de lugar:** é normal. Elas só precisam continuar com o branco embaixo, e depois o PBL as coloca no lugar.',
        '- **Você confunde Sune e Antisune:** gire `U` até que a quina com o amarelo para cima fique na frente à esquerda. Se a da frente à direita tiver o amarelo para a frente, é Sune. Se tiver o amarelo para a direita, é Antisune.',
        '- **A face amarela não ficou completa:** você provavelmente não estava segurando o cubo como na figura. Nenhum algoritmo deste passo desfaz a face branca: reconheça o caso novo e continue.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'ortega-oll-una', name: tr('Una esquina con el amarillo arriba', 'One corner with yellow facing up', 'Uma quina com o amarelo para cima'), cases: ollOne },
        { id: 'ortega-oll-ninguna', name: tr('Ninguna esquina con el amarillo arriba', 'No corner with yellow facing up', 'Nenhuma quina com o amarelo para cima'), cases: ollNone },
        { id: 'ortega-oll-dos', name: tr('Dos esquinas con el amarillo arriba', 'Two corners with yellow facing up', 'Duas quinas com o amarelo para cima'), cases: ollTwo },
      ],
      quizzes: [],
    },
    {
      id: 'ortega-pbl',
      name: tr('PBL', 'PBL', 'PBL'),
      goal: doc(
        ['**Meta:** cada esquina en su sitio, en las dos capas a la vez. ¡Cubo resuelto!', '**Casos:** 5. Se reconocen por las **barras**. Una barra es un lado de una capa con sus 2 pegatinas del mismo color. Son los faros del Principiante 2x2, ahora en las dos capas.'],
        ["**Goal:** every corner in its place, on both layers at once. Cube solved!", "**Cases:** 5. You recognize them by the **bars**. A bar is one side of a layer with its 2 stickers the same color. They're the headlights from the 2x2 beginner guide, now on both layers."],
        ['**Meta:** cada quina no lugar dela, nas duas camadas ao mesmo tempo. Cubo resolvido!', '**Casos:** 5. Você os reconhece pelas **barras**. Uma barra é um lado de uma camada com os seus 2 adesivos da mesma cor. São os faróis do 2x2 para iniciantes, agora nas duas camadas.'],
      ),
      description: doc([
        '## Cómo se hace',
        '1. Cuenta las barras de la capa de arriba. Hay 4 si sus esquinas ya están bien entre sí, 1 si dos esquinas vecinas están cambiadas (adyacentes) y ninguna si las cambiadas están en diagonal.',
        '2. Inclina el cubo hacia atrás y cuenta igual las barras de la capa de abajo. Las dos capas juntas te dicen el caso.',
        '3. Gira `U` y `D` hasta dejar las barras donde pide el caso, y haz el algoritmo.',
        '4. Termina girando `U` y `D` hasta que cada cara tenga un solo color.',
        'Si la capa de arriba ya tiene sus 4 barras y la de abajo no, gira el cubo con `x2` (o `z2`): la capa de abajo pasa arriba y tienes el caso «Adyacentes arriba» o «Diagonal arriba».',
      ], [
        '## How to do it',
        '1. Count the bars on the top layer. There are 4 if its corners are already solved relative to each other, 1 if two neighboring corners are swapped (adjacent) and none if the swapped ones are diagonal from each other.',
        '2. Tilt the cube back and count the bars on the bottom layer the same way. Both layers together tell you the case.',
        '3. Turn `U` and `D` until the bars are where the case needs them, then do the algorithm.',
        '4. Finish by turning `U` and `D` until each face is a single color.',
        "If the top layer already has its 4 bars and the bottom one doesn't, rotate the cube with `x2` (or `z2`): the bottom layer goes to the top and you have the \"Adjacent on top\" or \"Diagonal on top\" case.",
      ], [
        '## Como fazer',
        '1. Conte as barras da camada de cima. São 4 se as quinas dela já estão certas entre si, 1 se duas quinas vizinhas estão trocadas (adjacentes) e nenhuma se as trocadas estão na diagonal.',
        '2. Incline o cubo para trás e conte do mesmo jeito as barras da camada de baixo. As duas camadas juntas indicam o caso.',
        '3. Gire `U` e `D` até deixar as barras onde o caso pede, e faça o algoritmo.',
        '4. Termine girando `U` e `D` até que cada face tenha uma cor só.',
        'Se a camada de cima já tem as 4 barras e a de baixo não, gire o cubo com `x2` (ou `z2`): a camada de baixo passa para cima e você tem o caso "Adjacentes em cima" ou "Diagonal em cima".',
      ]),
      tips: doc([
        '- **No ves las barras de abajo:** inclina el cubo hacia atrás, con la cara blanca hacia ti, para ver los lados de la capa de abajo.',
        '- **No quedó resuelto:** las barras no estaban donde pedía el caso. Ningún algoritmo de este paso deshace la cara blanca ni la amarilla: cuenta otra vez las barras y sigue con el caso que salga.',
      ], [
        "- **You can't see the bottom bars:** tilt the cube back, white face toward you, to see the sides of the bottom layer.",
        "- **It didn't end up solved:** the bars weren't where the case needs them. No algorithm in this step undoes the white or the yellow face: count the bars again and continue with the case you get.",
      ], [
        '- **Não vê as barras de baixo:** incline o cubo para trás, com a face branca virada para você, para ver os lados da camada de baixo.',
        '- **Não ficou resolvido:** as barras não estavam onde o caso pedia. Nenhum algoritmo deste passo desfaz a face branca nem a amarela: conte as barras de novo e continue com o caso que sair.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'ortega-pbl-una', name: tr('Solo una capa', 'Only one layer', 'Só uma camada'), description: tr('Una capa ya tiene sus 4 barras: solo hay que arreglar la otra.', 'One layer already has its 4 bars: only the other one needs fixing.', 'Uma camada já tem as 4 barras: só falta arrumar a outra.'), cases: pblOne },
        { id: 'ortega-pbl-dos', name: tr('Las dos capas', 'Both layers', 'As duas camadas'), description: tr('Ninguna capa tiene sus 4 barras: el algoritmo arregla las dos a la vez.', 'Neither layer has its 4 bars: the algorithm fixes both at once.', 'Nenhuma camada tem as 4 barras: o algoritmo arruma as duas ao mesmo tempo.'), cases: pblTwo },
      ],
      quizzes: [],
    },
  ],
};

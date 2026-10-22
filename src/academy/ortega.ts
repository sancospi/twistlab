// "Ortega": the 2x2 method in three steps: the white face (any order, intuitive), OLL (7 cases: the top face yellow)
// and PBL (5 cases: both layers permuted at once). cfop.validate.test.ts checks exactly 7 OLL and 5 PBL cases,
// different up to U/D turns, that together solve every state.
// OLL and PBL algorithms: SpeedCubeDB's 2x2 lists (/a/2x2/OrtegaOLL, /a/2x2/OrtegaPBL, read 2026-10-22), with their
// rank; its sixth PBL case (Opp Adj) is Adj-Diag after x2, so it is only a note here. The white face is intuitive.
// Recognition texts describe each setup as the diagram shows it (yellow up, green front).
import { loc, type Localized } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

const tr = (es: string, en: string): Localized => ({ es, en });
const doc = (es: string[], en: string[]): Localized => tr(es.join('\n'), en.join('\n'));
// A case code is a plain string shown as is: the visitor's language, picked when the data loads.
const word = (s: string, en: string) => loc(tr(s, en));

type T = [es: string, en: string];
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
  cara('derecha', ['Derecha', 'Right'], ['Blanco a la derecha', 'White on the right'],
    ['Tres blancas abajo; la cuarta arriba adelante-derecha, encima del hueco, con el blanco a la derecha',
      'Three whites on the bottom; the fourth on top, front-right, above the slot, with the white facing right'], "R U R'"),
  cara('frente', ['Frente', 'Front'], ['Blanco al frente', 'White in front'],
    ['Tres blancas abajo; la cuarta arriba adelante-derecha, encima del hueco, con el blanco al frente',
      'Three whites on the bottom; the fourth on top, front-right, above the slot, with the white facing front'], "F' U' F",
    ['El espejo del anterior, con `F` en vez de `R`.', 'The mirror of the previous one, with `F` instead of `R`.']),
  cara('arriba', ['Arriba', 'Up'], ['Blanco arriba', 'White on top'],
    ['Tres blancas abajo; la cuarta arriba adelante-derecha, encima del hueco, con el blanco arriba',
      'Three whites on the bottom; the fourth on top, front-right, above the slot, with the white facing up'], "R U2 R' U' R U R'",
    ["`R U2 R'` la deja adelante a la izquierda, con el blanco al frente. `U'` la vuelve encima del hueco, con el blanco a la derecha, y `R U R'` la baja.",
      "`R U2 R'` leaves it front-left, with the white facing front. `U'` brings it back above the slot, white facing right, and `R U R'` drops it in."]),
];
const lastCornerDown = [
  cara('girada', ['Girada', 'Twisted'], ['Abajo, girada', 'Down, twisted'],
    ['Tres blancas abajo; la cuarta abajo adelante-derecha, pero con el blanco a la derecha',
      'Three whites on the bottom; the fourth in the bottom front-right slot, but with the white facing right'], "R U R' U' R U R'",
    ["`R U R' U'` la saca arriba con el blanco a la derecha. `R U R'` la baja bien. Si el blanco mira al frente, haz el espejo: `F' U' F U F' U' F`.",
      "`R U R' U'` takes it out to the top with the white facing right. `R U R'` drops it in correctly. If the white faces front, do the mirror: `F' U' F U F' U' F`."]),
];

// --- 2. OLL: the 7 corner-orientation cases ---
const oll = (slug: string, code: string, name: string, recognition: T, rank: number, alg: string, alts: Alt[], note?: T) =>
  kase({ phase: 'oll', slug, stage: '2x2-oll', code: [code, code], name: [name, name], recognition, alg, rank, alts, note });

const SUNE_NOTE: T = ['Sune y Antisune son inversas: la mezcla de una es el algoritmo de la otra.', 'Sune and Antisune are inverses: the scramble of one is the algorithm of the other.'];
const ollOne = [
  oll('sune', 'Sune', 'Sune', ['1 amarilla arriba, adelante-izquierda; la de adelante-derecha mira al frente',
    '1 yellow on top, front-left; the front-right one faces front'], 1,
    "R U R' U R U2 R'", [[2, "R U R2 U' R2 U R"]], SUNE_NOTE),
  oll('antisune', 'Antisune', 'Antisune', ['1 amarilla arriba, atrás-derecha; la de adelante-izquierda mira al frente',
    '1 yellow on top, back-right; the front-left one faces front'], 1,
    "R U2 R' U' R U' R'", [[4, "R' F R F' R U R'", ['Sostenla con la amarilla de arriba adelante-derecha.', 'Hold it with the top yellow at front-right.']]], SUNE_NOTE),
];
const ollNone = [
  oll('h', 'H', 'H', ['0 arriba; dos amarillas miran al frente y dos atrás', '0 on top; two yellows face front and two face back'], 1,
    "R2 U2 R' U2 R2", [[2, "R2 U2 R U2 R2", ["Igual, con `R` en vez de `R'`.", "Same, with `R` instead of `R'`."]],
      [3, "F R U R' U' R U R' U' R U R' U' F'", ["El gatillo `R U R' U'` 3 veces entre `F` y `F'`.", "The `R U R' U'` trigger 3 times between `F` and `F'`."]]],
    ['Si las amarillas miran a los lados, gira `U` antes.', 'If the yellows face the sides, turn `U` first.']),
  oll('pi', 'Pi', 'Pi', ['0 arriba; dos amarillas miran a la izquierda; a la derecha, una al frente y otra atrás',
    '0 on top; two yellows face left; on the right, one faces front and one faces back'], 1,
    "F R U R' U' R U R' U' F'", [[3, "R U2 R2 U' R2 U' R2 U2 R", ['La misma del Pi en el CFOP.', 'The same one as the Pi in CFOP.']]],
    ["El gatillo `R U R' U'` 2 veces entre `F` y `F'`.", "The `R U R' U'` trigger 2 times between `F` and `F'`."]),
];
const ollTwo = [
  oll('u', 'U', 'U (faros)', ['2 arriba, las de la derecha; las otras dos miran a la izquierda', '2 on top, the right ones; the other two face left'], 1,
    "F R U R' U' F'", [[2, "y2 F U R U' R' F'", ['Empieza con `y2`: los faros pasan a la derecha.', 'Starts with `y2`: the headlights move to the right.']]]),
  oll('t', 'T', 'T', ['2 arriba, las de la derecha; a la izquierda, una mira al frente y otra atrás',
    '2 on top, the right ones; on the left, one faces front and one faces back'], 1,
    "R U R' U' R' F R F'", [[2, "U R U R' U' F' U' F"]]),
  oll('l', 'L', 'L', ['2 arriba en diagonal (adelante-derecha y atrás-izquierda); la de adelante-izquierda mira al frente',
    '2 on top in a diagonal (front-right and back-left); the front-left one faces front'], 3,
    "F R' F' R U R U' R'", [[2, "F R U' R' U' R U R' F'"]]),
];

// --- 3. PBL: both layers at once. A bar = one side of a layer with its 2 colors equal ---
const pbl = (slug: string, code: string, name: T, recognition: T, rank: number, alg: string, alts: Alt[], note?: T) =>
  kase({ phase: 'pbl', slug, stage: '2x2-pbl', code: [code, code], name, recognition, alg, rank, alts, note });

const X2 = ['Si esta capa está abajo y la de arriba ya está bien, gira el cubo con `x2` (o `z2`): es el mismo caso.',
  'If this layer is on the bottom and the top one is already right, turn the cube with `x2` (or `z2`): it is the same case.'];
const pblOne = [
  pbl('adj', 'Adj', ['Adyacentes arriba', 'Adjacent on top'], ['Abajo, 4 barras. Arriba, 1 barra: al frente', 'Bottom: 4 bars. Top: 1 bar, in front'], 1,
    "y R U R' F' R U R' U' R' F R2 U' R' U'", [[3, "y R U R' U' R' F R2 U' R' U' R U R' F'", ['La T-perm del 3x3, tras la `y`.', 'The 3x3 T-perm, after the `y`.']]],
    [`La \`y\` deja la barra a la izquierda. ${X2[0]}`, `The \`y\` leaves the bar on the left. ${X2[1]}`]),
  pbl('diag', 'Diag', ['Diagonal arriba', 'Diagonal on top'], ['Abajo, 4 barras. Arriba, ninguna', 'Bottom: 4 bars. Top: none'], 1,
    "R U' R' U' F2 U' R U R' U F2", [[2, "F R U' R' U' R U R' F' R U R' U' R' F R F'", ['La Y-perm del 3x3.', 'The 3x3 Y-perm.']]],
    [X2[0], X2[1]]),
];
const pblTwo = [
  pbl('adj-adj', 'Adj-Adj', ['Adyacentes arriba y abajo', 'Adjacent on top and bottom'], ['1 barra arriba y 1 abajo: las dos al frente', '1 bar on top and 1 on the bottom: both in front'], 1,
    "R2 U' B2 U2 R2 U' R2", [[3, "R2 U R2 U2 F2 U F2"]]),
  pbl('diag-diag', 'Diag-Diag', ['Diagonal arriba y abajo', 'Diagonal on top and bottom'], ['Ninguna barra, ni arriba ni abajo', 'No bars, neither on top nor on the bottom'], 1,
    'R2 F2 R2', [[2, 'R2 B2 R2']], ['Da igual cómo lo sostengas.', 'It does not matter how you hold it.']),
  pbl('adj-diag', 'Adj-Diag', ['Adyacentes arriba, diagonal abajo', 'Adjacent on top, diagonal on the bottom'], ['1 barra arriba, al frente. Abajo, ninguna', '1 bar on top, in front. Bottom: none'], 1,
    "R U' R F2 R' U R'", [[2, "R' F R' F2 R U' R"]],
    ["Si la diagonal está arriba y la barra abajo, gira el cubo con `x2` (o `z2`) y es este caso. SpeedCubeDB también da uno directo: `R' D R' F2 R D' R`.",
      "If the diagonal is on top and the bar on the bottom, turn the cube with `x2` (or `z2`) and it is this case. SpeedCubeDB also gives a direct one: `R' D R' F2 R D' R`."]),
];

export const ortega: Method = {
  id: 'ortega',
  puzzle: '2x2x2',
  name: tr('Ortega', 'Ortega'),
  summary: tr('La cara blanca, 7 casos de OLL y 5 de PBL: el método intermedio del 2x2.', 'The white face, 7 OLL cases and 5 PBL cases: the intermediate 2x2 method.'),
  description: doc([
    'El método intermedio del 2x2. **Tres pasos y 12 algoritmos.**',
    'Primero la cara blanca, sin importar el orden. Luego el amarillo arriba. Al final, las dos capas a su sitio a la vez.',
    '## Los pasos',
    '1. **Cara blanca.** Las 4 pegatinas blancas abajo, en cualquier orden. Sin algoritmos.',
    '2. **OLL.** Toda la cara amarilla arriba: 7 casos.',
    '3. **PBL.** Las dos capas a su sitio a la vez: 5 casos.',
    '## Antes de empezar',
    '- Conviene resolver ya el 2x2 con el **Principiante 2x2**.',
    '- Si ya sabes el OCLL del CFOP reducido, conoces los 7 casos del paso 2.',
    '- Aprende primero el OLL, empezando por **Sune y Antisune**. Luego el PBL.',
  ], [
    'The intermediate 2x2 method. **Three steps and 12 algorithms.**',
    'First the white face, in any order. Then yellow on top. Finally, both layers into place at once.',
    '## The steps',
    '1. **White face.** The 4 white stickers on the bottom, in any order. No algorithms.',
    '2. **OLL.** The whole yellow face on top: 7 cases.',
    '3. **PBL.** Both layers into place at once: 5 cases.',
    '## Before you start',
    '- You should already be able to solve the 2x2 with **Beginner 2x2**.',
    '- If you know the OCLL from reduced CFOP, you already know the 7 cases of step 2.',
    '- Learn OLL first, starting with **Sune and Antisune**. Then PBL.',
  ]),
  orientation: tr(
    '**Cara blanca abajo, amarillo arriba y verde al frente**, como en el 3x3.',
    '**White face on the bottom, yellow on top and green in front**, as on the 3x3.',
  ),
  notation: doc([
    '## Movimientos',
    '- Las mismas letras que en el 3x3: `R`, `U`, `F`, `L`, `D` y `B`.',
    '- El 2x2 no tiene capas del medio: no hay `M`, `E` ni `S`, ni giros anchos como `r`.',
    '- `x`, `y` y `z` giran todo el cubo: `x` como `R`, `y` como `U`, `z` como `F`.',
    '- `x2` o `z2` le dan la vuelta: lo de abajo pasa arriba.',
    '## Barras',
    'En el PBL se mira cada capa por los lados.',
    'Una **barra** es un lado de una capa con sus 2 colores iguales.',
    '- **4 barras:** la capa está bien (como mucho, falta un giro).',
    '- **1 barra:** dos esquinas cambiadas de lado (adyacentes).',
    '- **Ninguna:** dos esquinas cambiadas en diagonal.',
    '## Figuras',
    '- **Cara blanca:** vista desde arriba-adelante-derecha. Solo se ven las pegatinas blancas.',
    '- **OLL:** la cara amarilla vista desde arriba, con el frente abajo. Las barritas son las pegatinas laterales de la capa de arriba.',
    '- **PBL:** la capa de arriba y la de abajo, lado a lado. La de abajo se ve desde arriba, como a través del cubo. Las flechas muestran a dónde va cada pieza.',
  ], [
    '## Moves',
    '- The same letters as on the 3x3: `R`, `U`, `F`, `L`, `D` and `B`.',
    '- The 2x2 has no middle layers: no `M`, `E` or `S`, and no wide moves like `r`.',
    '- `x`, `y` and `z` rotate the whole cube: `x` like `R`, `y` like `U`, `z` like `F`.',
    '- `x2` or `z2` flip it over: the bottom goes to the top.',
    '## Bars',
    'In PBL you look at each layer from the sides.',
    'A **bar** is one side of a layer with its 2 colors equal.',
    '- **4 bars:** the layer is right (at most, it needs a turn).',
    '- **1 bar:** two corners swapped along a side (adjacent).',
    '- **None:** two corners swapped diagonally.',
    '## Diagrams',
    '- **White face:** seen from top-front-right. Only the white stickers show.',
    '- **OLL:** the yellow face seen from above, with the front at the bottom. The small bars are the side stickers of the top layer.',
    '- **PBL:** the top and bottom layers, side by side. The bottom one is seen from above, as if through the cube. The arrows show where each piece goes.',
  ]),
  phases: [
    {
      id: 'ortega-cara',
      name: tr('Cara blanca', 'White face'),
      description: doc([
        '**Meta:** las 4 pegatinas blancas abajo. El orden de las esquinas no importa: lo arregla el PBL.',
        'Es un paso intuitivo: no hace falta memorizar nada.',
        '## Cómo se hace',
        '1. Pon abajo 2 esquinas blancas, una junto a la otra, con el blanco abajo.',
        '2. Añade la tercera de la misma forma.',
        '3. Gira `D` hasta dejar el hueco adelante a la derecha. Luego `U` hasta tener la cuarta encima.',
        '4. Bájala según hacia dónde mire el blanco (los casos de abajo).',
        '## Consejos',
        '- Empieza por la cara que ya tenga 2 o 3 blancas.',
        '- Puedes girar `D` libremente: el orden no importa.',
        '- Con práctica, planea la cara entera en la inspección.',
      ], [
        '**Goal:** the 4 white stickers on the bottom. The order of the corners does not matter: PBL fixes it.',
        'This step is intuitive: there is nothing to memorize.',
        '## How to do it',
        '1. Put 2 white corners on the bottom, side by side, with the white facing down.',
        '2. Add the third the same way.',
        '3. Turn `D` until the slot is front-right. Then `U` until the fourth corner is above it.',
        '4. Drop it in depending on where the white faces (the cases below).',
        '## Tips',
        '- Start with the face that already has 2 or 3 whites.',
        '- You can turn `D` freely: the order does not matter.',
        '- With practice, plan the whole face during inspection.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'ortega-cara-encima', name: tr('La última esquina, arriba', 'The last corner, on top'), description: tr('Encima del hueco. El blanco decide el algoritmo.', 'Above the slot. The white decides the algorithm.'), cases: lastCornerUp },
        { id: 'ortega-cara-abajo', name: tr('La última esquina, abajo', 'The last corner, on the bottom'), description: tr('En su sitio, pero girada: sácala y vuelve a bajarla.', 'In its slot, but twisted: take it out and drop it in again.'), cases: lastCornerDown },
      ],
      quizzes: [],
    },
    {
      id: 'ortega-oll',
      name: tr('OLL', 'OLL'),
      description: doc([
        '**Meta:** toda la cara amarilla arriba. La blanca sigue abajo.',
        'Mira solo las pegatinas amarillas: cuántas miran arriba y hacia dónde miran las otras.',
        '## Cómo reconocerlo',
        '- **1 arriba:** Sune o Antisune.',
        '- **0 arriba:** H o Pi.',
        '- **2 arriba:** U, T o L.',
        'Gira `U` hasta que el caso quede como en la figura y haz el algoritmo.',
        '## Errores comunes',
        '- **Preocuparte por la cara blanca:** los algoritmos la mantienen abajo, aunque cambien el orden de sus esquinas.',
        '- **Confundir Sune y Antisune:** mira hacia dónde mira la amarilla de adelante-derecha.',
      ], [
        '**Goal:** the whole yellow face on top. White stays on the bottom.',
        'Look only at the yellow stickers: how many face up and where the others face.',
        '## How to recognize it',
        '- **1 on top:** Sune or Antisune.',
        '- **0 on top:** H or Pi.',
        '- **2 on top:** U, T or L.',
        'Turn `U` until the case looks like the diagram and do the algorithm.',
        '## Common mistakes',
        '- **Worrying about the white face:** the algorithms keep it on the bottom, even if they change the order of its corners.',
        '- **Mixing up Sune and Antisune:** look at where the front-right yellow faces.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'ortega-oll-una', name: tr('1 amarilla arriba', '1 yellow on top'), cases: ollOne },
        { id: 'ortega-oll-ninguna', name: tr('0 amarillas arriba', '0 yellows on top'), cases: ollNone },
        { id: 'ortega-oll-dos', name: tr('2 amarillas arriba', '2 yellows on top'), cases: ollTwo },
      ],
      quizzes: [],
    },
    {
      id: 'ortega-pbl',
      name: tr('PBL', 'PBL'),
      description: doc([
        '**Meta:** las dos capas a su sitio a la vez. El cubo queda resuelto.',
        '## Cómo reconocerlo',
        'Cuenta las **barras** de cada capa: lados con sus 2 colores iguales.',
        '1. Mira la capa de arriba: 4 barras (bien), 1 barra (adyacentes) o ninguna (diagonal).',
        '2. Inclina el cubo y mira la de abajo igual.',
        '3. Con las dos, busca el caso.',
        '## Cómo se hace',
        '1. Gira `U` y `D` hasta dejar las barras donde pide el caso.',
        '2. Haz el algoritmo.',
        '3. Ajusta con `U` y `D`.',
        'Si solo falta la capa de abajo, gira el cubo con `x2` (o `z2`): pasa arriba y es el mismo caso.',
      ], [
        '**Goal:** both layers into place at once. The cube ends up solved.',
        '## How to recognize it',
        'Count the **bars** of each layer: sides with their 2 colors equal.',
        '1. Look at the top layer: 4 bars (right), 1 bar (adjacent) or none (diagonal).',
        '2. Tilt the cube and look at the bottom one the same way.',
        '3. With both, find the case.',
        '## How to do it',
        '1. Turn `U` and `D` until the bars are where the case asks.',
        '2. Do the algorithm.',
        '3. Adjust with `U` and `D`.',
        'If only the bottom layer is left, turn the cube with `x2` (or `z2`): it goes to the top and it is the same case.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'ortega-pbl-una', name: tr('Solo una capa', 'Only one layer'), description: tr('La otra capa tiene sus 4 barras.', 'The other layer has its 4 bars.'), cases: pblOne },
        { id: 'ortega-pbl-dos', name: tr('Las dos capas', 'Both layers'), cases: pblTwo },
      ],
      quizzes: [],
    },
  ],
};

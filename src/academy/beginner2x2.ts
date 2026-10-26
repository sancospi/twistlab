// "Principiante 2x2": layer by layer on the 2x2, for someone who has never solved one. Phases: the first layer (white
// corners, each in place), the yellow face (OLL) and the last layer's corners (permuted). Every algorithm is the
// beginner's full sequence, with its repetitions written out; cfop.validate.test.ts checks each one in the simulator.
// Case ids: 'p2-<phase>-<slug>'. 2x2 notation only: R U F L D B and x y z (no slices, no wide moves).
import { fromSpanish, tr, word, type Localized } from '../i18n.ts';
import { EN } from './beginner2x2.en.ts';
import { PT } from './beginner2x2.pt.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

// Spanish written first; English and Portuguese come from EN and PT line by line (see beginner2x2.en.ts), the Spanish
// if a line is missing.
const es = (s: string): Localized => fromSpanish(s, { en: EN, pt: PT });
const doc = (lines: string[]): Localized => es(lines.join('\n'));
const times = (block: string, n: number) => Array(n).fill(block).join(' ');

const TRIGGER = "R U R' U'"; // white corners, as on the 3x3
const SUNE = "R U R' U R U2 R'"; // twists 3 top corners, keeps the first layer
const ANTISUNE = "R U2 R' U' R U' R'"; // the Sune backwards
const SUNE_TWICE = "R U R' U R U' R' U R U2 R'"; // 2 Sunes: the R' R in between cancels, U2 U becomes U'
const SUNE_3 = "R U R' U R U' R' U R U' R' U R U2 R'"; // 3 Sunes, cancelled the same way
const SWAP = "R' F R' B2 R F' R' B2 R2"; // top corners: headlights at the back

interface Row {
  phase: string;
  slug: string;
  stage: Stage;
  code: string;
  name: Localized;
  recognition: Localized;
  alg: string;
  alt?: [alg: string, note: Localized]; // a shorter or easier way, when it is worth knowing
  note?: Localized;
}

function kase(r: Row): Case {
  const algs: Case['algs'] = [{ id: 'main', alg: r.alg, source: 'community' }];
  if (r.alt) algs.push({ id: 'alt', alg: r.alt[0], source: 'community', note: r.alt[1] });
  return {
    id: `p2-${r.phase}-${r.slug}`,
    code: r.code,
    name: r.name,
    recognition: r.recognition,
    stage: r.stage,
    algs,
    setup: invertTokens(centerMoves(r.alg, IDENTITY)).join(' '), // face turns: undoes rotations too
    scdb: null,
    ...(r.note ? { note: r.note } : {}),
  };
}

const capa1 = (slug: string, code: string, name: string, recognition: string, alg: string, alt?: [string, string], note?: string) =>
  kase({ phase: 'capa1', slug, stage: '2x2-first-layer', code, name: es(name), recognition: es(recognition), alg,
    alt: alt && [alt[0], es(alt[1])], note: note ? es(note) : undefined });

const cornerUp = [
  capa1('blanco-derecha', word('Derecha', 'Right', 'Direita'), 'Blanco a la derecha',
    'Blanco-verde-naranja arriba adelante-derecha, blanco a la derecha', TRIGGER, undefined,
    "1 gatillo. La U' final no toca la primera capa: R U R' también basta."),
  capa1('blanco-arriba', word('Arriba', 'Up', 'Em cima'), 'Blanco arriba',
    'Blanco-verde-naranja arriba adelante-derecha, blanco arriba', times(TRIGGER, 3),
    ["R U2 R' U' R U R'", "Más corta: R U2 R' saca el blanco de arriba; U' R U R' la baja."]),
  capa1('blanco-frente', word('Frente', 'Front', 'Frente'), 'Blanco al frente',
    'Blanco-verde-naranja arriba adelante-derecha, blanco al frente', times(TRIGGER, 5),
    ["U R U' R'", 'El gatillo al revés, 1 vez, equivale a 5 gatillos.']),
];
const cornerDown = [
  capa1('girada-derecha', word('Abajo, derecha', 'Bottom, right', 'Embaixo, direita'), 'En su sitio, blanco a la derecha',
    'Blanco-verde-naranja en su sitio abajo, pero con el blanco a la derecha', times(TRIGGER, 2)),
  capa1('girada-frente', word('Abajo, frente', 'Bottom, front', 'Embaixo, frente'), 'En su sitio, blanco al frente',
    'Blanco-verde-naranja en su sitio abajo, pero con el blanco al frente', times(TRIGGER, 4),
    ["U R U' R' U R U' R'", 'El gatillo al revés, 2 veces, equivale a 4 gatillos.']),
  capa1('otro-sitio', word('Otro sitio', 'Other spot', 'Outro lugar'), 'En el sitio de otra',
    'Blanco-verde-naranja abajo adelante-izquierda, blanco al frente; la blanco-verde-roja arriba adelante-izquierda, blanco al frente',
    `y' ${TRIGGER} y U' ${TRIGGER}`, undefined,
    "Con y' el sitio de la blanco-verde-roja queda adelante-derecha: un gatillo saca la blanco-verde-naranja y mete la blanco-verde-roja. Con y vuelves, U' deja la blanco-verde-naranja encima de su sitio y otro gatillo la baja."),
];

const amarilla = (slug: string, code: string, name: string, recognition: string, alg: string, alt: [string, string], note?: string) =>
  kase({ phase: 'amarilla', slug, stage: '2x2-oll', code, name: es(name), recognition: es(recognition), alg,
    alt: [alt[0], es(alt[1])], note: note ? es(note) : undefined });

const yellowOne = [
  amarilla('sune', 'Sune', 'Una buena: Sune',
    'Buena adelante-izquierda; amarillo al frente en adelante-derecha, a la derecha en atrás-derecha y atrás en atrás-izquierda',
    SUNE, [`U2 ${ANTISUNE} U2 ${ANTISUNE}`, 'Con la buena atrás a la derecha (U2): 2 Antisunes, con U2 entre ellos.']),
  amarilla('antisune', 'Antisune', 'Una buena: Antisune',
    'Buena atrás-derecha; amarillo al frente en adelante-izquierda, a la derecha en adelante-derecha y a la izquierda en atrás-izquierda',
    ANTISUNE, [`U2 ${SUNE} U2 ${SUNE}`, 'Con la regla del Sune: la buena adelante a la izquierda (U2), Sune, U2 y Sune otra vez.']),
];
const yellowTwo = [
  amarilla('u', 'U', 'Dos buenas vecinas, mirando al mismo lado',
    'Buenas las 2 de la derecha; las 2 de la izquierda con el amarillo a la izquierda',
    `${SUNE} U ${SUNE} U' ${SUNE}`, ["F R U R' U' F'", 'Más corta, de una vez: el algoritmo de la U en Ortega.'],
    'Sune, U, Sune, U\' y Sune: antes de cada uno, la regla.'),
  amarilla('t', 'T', 'Dos buenas vecinas, mirando hacia afuera',
    'Buenas las 2 de atrás; adelante-izquierda con el amarillo a la izquierda y adelante-derecha a la derecha',
    `${SUNE} U' ${SUNE} U ${SUNE}`, ["U R U R' U' R' F R F'", 'Más corta, con las buenas a la derecha (U): la T de Ortega.'],
    "Sune, U', Sune, U y Sune: antes de cada uno, la regla."),
  amarilla('l', 'L', 'Dos buenas en diagonal',
    'Buenas adelante-derecha y atrás-izquierda; adelante-izquierda con el amarillo a la izquierda y atrás-derecha atrás',
    SUNE_3, ["U2 F R' F' R U R U' R'", 'Más corta, con el amarillo de adelante-izquierda al frente (U2): la L de Ortega.'],
    "3 Sunes seguidos, sin girar nada entre ellos. Entre uno y otro, R' R se cancela y U2 U queda U'."),
];
const yellowNone = [
  amarilla('h', 'H', 'Ninguna buena: dos parejas',
    'Las 4 giradas: las 2 de la derecha con el amarillo a la derecha y las 2 de la izquierda a la izquierda',
    SUNE_TWICE, ['U R2 U2 R U2 R2', 'Más corta, con el amarillo al frente y atrás (U): la H de Ortega.'],
    "2 Sunes seguidos: el primero deja el caso Sune. Entre los dos, R' R se cancela y U2 U queda U'."),
  amarilla('pi', 'Pi', 'Ninguna buena: una pareja',
    'Las 4 giradas: las 2 de la izquierda con el amarillo a la izquierda; adelante-derecha al frente y atrás-derecha atrás',
    `${SUNE} U' ${SUNE}`, ["F R U R' U' R U R' U' F'", 'Más corta, de una vez: la Pi de Ortega.'],
    "El primer Sune deja una buena; U' la pone adelante a la izquierda y otro Sune termina."),
];

const esquinas = (slug: string, code: string, name: string, recognition: string, alg: string, alt: [string, string], note?: string) =>
  kase({ phase: 'esquinas', slug, stage: '2x2-ll-corners', code, name: es(name), recognition: es(recognition), alg,
    alt: [alt[0], es(alt[1])], note: note ? es(note) : undefined });

const topCorners = [
  esquinas('faros', word('Faros', 'Headlights', 'Faróis'), 'Faros: dos esquinas bien',
    'Faros atrás: las 2 pegatinas de atrás del mismo color. En los otros lados, colores distintos',
    SWAP, ["U' R U R' U' R' F R2 U' R' U' R U R' F'", "Con los faros a la izquierda (U'): la T-perm del 3x3."],
    'Después, gira U hasta alinear la capa de arriba con la de abajo.'),
  esquinas('diagonal', 'Diagonal', 'Sin faros: cambiadas en diagonal',
    'Ningún lado con sus 2 pegatinas de arriba del mismo color',
    `${SWAP} U ${SWAP}`, ["F R U' R' U' R U R' F' R U R' U' R' F R F'", 'De una vez: la Y-perm del 3x3.'],
    '1 vez desde aquí deja faros a la izquierda; U los pasa atrás y 1 vez más termina.'),
];

// Each phase is taught as the 3x3 beginner's (types.ts): the goal and its sequence, a few steps, and what to do when
// something goes wrong, folded.
export const beginner2x2: Method = {
  id: 'principiante-2x2',
  puzzle: '2x2x2',
  name: tr('Principiante 2x2', '2x2 beginner', '2x2 para iniciantes'),
  summary: tr('Capa por capa: la primera capa, la cara amarilla y las esquinas de arriba.', 'Layer by layer: the first layer, the yellow face and the top corners.', 'Camada por camada: a primeira camada, a face amarela e as quinas de cima.'),
  description: doc([
    'Tu primer 2x2 resuelto. Lo armas **capa por capa**: primero la blanca (abajo) y luego la amarilla (arriba).',
    'Son 3 pasos, y cada uno usa **una secuencia** que repites según lo que veas. Si ya resolviste el 3x3, el gatillo ya lo conoces.',
    '## Los 3 pasos',
    "1. **Primera capa:** `R U R' U'`, el gatillo",
    "2. **Cara amarilla:** `R U R' U R U2 R'`, el Sune",
    "3. **Esquinas de arriba:** `R' F R' B2 R F' R' B2 R2`",
    '## Cómo aprenderlo',
    '- **Un paso por sesión**, en orden. Pasa al siguiente cuando lo hagas sin mirar.',
    '- Con 20 min al día, tu primer 2x2 suele llegar en **menos de una semana**.',
    '- **Si te pierdes:** busca el último paso que sigue completo y retoma desde el siguiente.',
    '- Cuando lo resuelvas sin guía, sigue con **Ortega**: menos giros y más rápido.',
  ]),
  orientation: tr(
    '**Amarillo arriba y verde al frente**, como en el 3x3: la primera capa, la blanca, queda abajo.\nEn el paso 1, la esquina con la que trabajas va **adelante a la derecha**: gira el cubo entero (`y`) para llevarla ahí, siempre con el blanco abajo.',
    '**Yellow on top and green in front**, as on the 3x3: the first layer, the white one, ends up on the bottom.\nIn step 1, the corner you are working on goes at the **front right**: rotate the whole cube (`y`) to bring it there, always with white on the bottom.',
    '**Amarelo em cima e verde na frente**, como no 3x3: a primeira camada, a branca, fica embaixo.\nNo passo 1, a quina com que você trabalha vai na **frente à direita**: gire o cubo inteiro (`y`) para levá-la até ali, sempre com o branco embaixo.',
  ),
  notation: doc([
    '## Movimientos',
    '- Cada letra gira una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente, `B` atrás.',
    '- La letra sola es un cuarto de vuelta en sentido horario, mirando esa cara de frente.',
    "- Con apóstrofo, al revés: `R'`. Con un 2, media vuelta: `U2`.",
    '- `y` gira el cubo entero, como `U`: no mueve piezas, solo cambia qué cara queda al frente.',
    '## Sin centros',
    'El 2x2 no tiene centros que digan el color de cada cara: mandan las esquinas ya resueltas. Cada esquina va junto a las que comparten sus colores.',
    '## Figuras',
    '- **Paso 1:** el cubo visto desde arriba, adelante y a la derecha.',
    '- **Pasos 2 y 3:** la capa de arriba vista desde arriba, con el frente abajo. Las barritas son las pegatinas de los lados.',
    '- En gris, lo que todavía no importa.',
  ]),
  phases: [
    {
      id: 'p2-capa1',
      name: tr('Paso 1: primera capa', 'Step 1: first layer', 'Passo 1: primeira camada'),
      goal: doc([
        '**Meta:** las 4 esquinas blancas abajo, y en cada lado la fila de abajo de un solo color.',
        "**Secuencia:** el gatillo, `R U R' U'`.",
      ]),
      description: doc([
        '## Cómo se hace',
        '1. Baja una primera esquina blanca en cualquier sitio, como en el punto 4: es tu referencia.',
        '2. Busca arriba otra esquina con blanco y gira `U` hasta dejarla encima de su sitio: junto a la de abajo que comparte uno de sus colores, con ese color del mismo lado.',
        '3. Gira el cubo entero (blanco abajo) para tenerla adelante a la derecha.',
        '4. Haz el gatillo hasta que baje con el blanco abajo: **1 vez** si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.',
        'Repite hasta tener las 4. Por ejemplo, la blanco-verde-naranja va entre la blanco-verde-roja y la blanco-naranja-azul.',
      ]),
      tips: doc([
        '- **Una esquina blanca está abajo pero mal** (girada, o en el sitio de otra): ponla adelante a la derecha y haz 1 gatillo. Así sube: sigue con ella desde el punto 2.',
        '- **Bajó en el sitio equivocado:** antes del gatillo, compara sus 2 colores con los de sus vecinas de abajo.',
        '- **No entra, o se desarma algo:** haz siempre los 4 giros del gatillo y no gires el cubo hasta que la esquina entre.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'p2-capa1-arriba', name: es('Esquina arriba, encima de su sitio'), description: es('Hacia dónde mira el blanco: a la derecha, 1 gatillo; arriba, 3; al frente, 5.'), cases: cornerUp },
        { id: 'p2-capa1-abajo', name: es('Esquina abajo, mal puesta'), description: es('Un gatillo la sube; luego, como las de arriba.'), cases: cornerDown },
      ],
      quizzes: [],
    },
    {
      id: 'p2-amarilla',
      name: tr('Paso 2: cara amarilla', 'Step 2: yellow face', 'Passo 2: face amarela'),
      goal: doc([
        '**Meta:** toda la cara de arriba amarilla, sin romper la primera capa.',
        "**Secuencia:** el Sune, `R U R' U R U2 R'`, hasta 3 veces.",
      ]),
      description: doc([
        '## Cómo se hace',
        'Una esquina es **buena** si ya tiene el amarillo arriba. Antes de cada Sune, gira `U` así:',
        '- **Una buena:** déjala adelante a la izquierda.',
        '- **Ninguna o dos buenas:** deja adelante a la izquierda una esquina con el amarillo **a la izquierda**.',
        'Haz el Sune y repite hasta que la cara quede amarilla: como mucho **3 Sunes**.',
        "**Atajo:** el Antisune, `R U2 R' U' R U' R'`, es el Sune al revés. Si reconoces su caso, lo resuelve de una vez, en lugar de 2 Sunes.",
      ]),
      tips: doc([
        '- **No sabes qué ángulo elegir:** el amarillo de las esquinas giradas está en los lados. Míralo ahí, no solo arriba.',
        '- **La primera capa se rompe a mitad del Sune:** es normal; vuelve sola al terminarlo. Haz siempre el Sune completo.',
        '- **Se rompió y no volvió:** el blanco va siempre abajo; para cambiar de ángulo, solo `U`. Retoma desde el último paso completo.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'p2-amarilla-una', name: es('Una buena'), description: es('Sune o Antisune.'), cases: yellowOne },
        { id: 'p2-amarilla-dos', name: es('Dos buenas'), description: es('La de adelante-izquierda con el amarillo a la izquierda, y Sune.'), cases: yellowTwo },
        { id: 'p2-amarilla-ninguna', name: es('Ninguna buena'), description: es('La de adelante-izquierda con el amarillo a la izquierda, y Sune.'), cases: yellowNone },
      ],
      quizzes: [],
    },
    {
      id: 'p2-esquinas',
      name: tr('Paso 3: esquinas de arriba', 'Step 3: top corners', 'Passo 3: quinas de cima'),
      goal: doc([
        '**Meta:** las 4 esquinas de arriba en su sitio. ¡Cubo resuelto!',
        "**Secuencia:** `R' F R' B2 R F' R' B2 R2`. Cambia de sitio las esquinas de arriba sin girarlas.",
      ]),
      description: doc([
        '## Cómo se hace',
        'Mira los lados de la capa de arriba. Si en un lado sus 2 pegatinas son del mismo color, son **faros**: esas 2 esquinas ya están bien entre sí.',
        '- **Faros en un lado:** gira `U` para dejarlos atrás y haz la secuencia 1 vez.',
        '- **Sin faros:** hazla 1 vez desde cualquier lado. Aparecen faros: sigue como arriba.',
        '- **Faros en los 4 lados:** gira `U` hasta alinear la capa de arriba con la de abajo.',
      ]),
      tips: doc([
        '- **Movió otras esquinas:** los faros van atrás; desde otro lado, la secuencia cambia otras.',
        '- **Giraste el cubo para hacer la B2:** no hace falta; `B2` es media vuelta de la cara de atrás, con el cubo quieto.',
        '- **La primera capa se ve rota a mitad:** es normal; vuelve sola al terminar la secuencia.',
      ]),
      diagram: 'top',
      groups: [{ id: 'p2-esquinas-casos', name: es('Faros o no'), description: es('Busca un lado con sus 2 pegatinas de arriba del mismo color.'), cases: topCorners }],
      quizzes: [],
    },
  ],
};

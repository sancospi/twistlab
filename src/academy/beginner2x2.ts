// "Principiante 2x2": layer by layer on the 2x2, for someone who has never solved one. Phases: the first layer (white
// corners, each in place), the yellow face (OLL) and the last layer's corners (permuted). Every algorithm is the
// beginner's full sequence, with its repetitions written out; cfop.validate.test.ts checks each one in the simulator.
// Case ids: 'p2-<phase>-<slug>'. 2x2 notation only: R U F L D B and x y z (no slices, no wide moves).
import { fromSpanish, loc, type Localized } from '../i18n.ts';
import { EN } from './beginner2x2.en.ts';
import { PT } from './beginner2x2.pt.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

const tr = (es: string, en: string): Localized => ({ es, en });
// Spanish written first; English and Portuguese come from EN and PT line by line (see beginner2x2.en.ts), the Spanish
// if a line is missing.
const es = (s: string): Localized => fromSpanish(s, { en: EN, pt: PT });
const doc = (lines: string[]): Localized => es(lines.join('\n'));
// A case code is a plain string shown as is: the visitor's language, picked when the data loads.
const word = (s: string, en: string) => loc(tr(s, en));
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
  capa1('blanco-derecha', word('Derecha', 'Right'), 'Blanco a la derecha',
    'Blanco-verde-naranja arriba adelante-derecha, blanco a la derecha', TRIGGER, undefined,
    "1 gatillo. La U' final no toca la primera capa: R U R' también basta."),
  capa1('blanco-arriba', word('Arriba', 'Up'), 'Blanco arriba',
    'Blanco-verde-naranja arriba adelante-derecha, blanco arriba', times(TRIGGER, 3),
    ["R U2 R' U' R U R'", "Más corta: R U2 R' saca el blanco de arriba; U' R U R' la baja."]),
  capa1('blanco-frente', word('Frente', 'Front'), 'Blanco al frente',
    'Blanco-verde-naranja arriba adelante-derecha, blanco al frente', times(TRIGGER, 5),
    ["U R U' R'", 'El gatillo al revés, 1 vez, equivale a 5 gatillos.']),
];
const cornerDown = [
  capa1('girada-derecha', word('Abajo, derecha', 'Bottom, right'), 'En su sitio, blanco a la derecha',
    'Blanco-verde-naranja en su sitio abajo, pero con el blanco a la derecha', times(TRIGGER, 2)),
  capa1('girada-frente', word('Abajo, frente', 'Bottom, front'), 'En su sitio, blanco al frente',
    'Blanco-verde-naranja en su sitio abajo, pero con el blanco al frente', times(TRIGGER, 4),
    ["U R U' R' U R U' R'", 'El gatillo al revés, 2 veces, equivale a 4 gatillos.']),
  capa1('otro-sitio', word('Otro sitio', 'Other spot'), 'En el sitio de otra',
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
  esquinas('faros', word('Faros', 'Headlights'), 'Faros: dos esquinas bien',
    'Faros atrás: las 2 pegatinas de atrás del mismo color. En los otros lados, colores distintos',
    SWAP, ["U' R U R' U' R' F R2 U' R' U' R U R' F'", "Con los faros a la izquierda (U'): la T-perm del 3x3."],
    'Después, gira U hasta alinear la capa de arriba con la de abajo.'),
  esquinas('diagonal', 'Diagonal', 'Sin faros: cambiadas en diagonal',
    'Ningún lado con sus 2 pegatinas de arriba del mismo color',
    `${SWAP} U ${SWAP}`, ["F R U' R' U' R U R' F' R U R' U' R' F R F'", 'De una vez: la Y-perm del 3x3.'],
    '1 vez desde aquí deja faros a la izquierda; U los pasa atrás y 1 vez más termina.'),
];

export const beginner2x2: Method = {
  id: 'principiante-2x2',
  puzzle: '2x2x2',
  name: tr('Principiante 2x2', '2x2 beginner'),
  summary: tr('Capa por capa: la primera capa, la cara amarilla y las esquinas de arriba.', 'Layer by layer: the first layer, the yellow face and the top corners.'),
  description: doc([
    'Tu primer 2x2 resuelto. Lo armas **capa por capa**: abajo (blanca) y arriba (amarilla).',
    'Solo necesitas el **gatillo** y **2 algoritmos**. Si ya resolviste el 3x3, el gatillo ya lo conoces.',
    '## Los pasos',
    "1. **Primera capa.** Las 4 esquinas blancas abajo, con el gatillo `R U R' U'`.",
    '2. **Cara amarilla.** Todo el amarillo arriba, con el **Sune**.',
    '3. **Esquinas de arriba.** Cada esquina en su sitio: cubo resuelto.',
    '## Cuánto tardas',
    'Con 20 min al día, tu primer 2x2 suele llegar en **menos de una semana**.',
    '- Aprende un paso por sesión, en orden. No pases al siguiente hasta hacerlo sin mirar la guía.',
    '- **Si te pierdes:** busca el último paso que sigue completo y retoma desde el siguiente.',
    '- Cuando lo resuelvas sin guía, sigue con **Ortega**: menos giros y más rápido.',
  ]),
  orientation: tr(
    '**Amarillo arriba y verde al frente**, como en el 3x3. La primera capa, la blanca, queda abajo.',
    '**Yellow on top and green in front**, as on the 3x3. The first layer, the white one, ends up on the bottom.',
  ),
  notation: doc([
    '## Movimientos',
    '- Cada letra es una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente, `B` atrás.',
    '- La letra sola gira la cara en sentido horario, mirándola de frente.',
    "- Con apóstrofo es antihorario (`R'`); con 2, media vuelta (`U2`).",
    "- `y` gira todo el cubo como `U`, y `y'` como `U'`. No mueve piezas: solo cambia la cara del frente.",
    '## Sin centros',
    'El 2x2 no tiene centros que marquen el color de cada cara.',
    'Mandan las esquinas ya resueltas: cada esquina va junto a las que comparten sus colores.',
    '## Figuras',
    '- **Primera capa:** vista desde arriba-adelante-derecha. Lo que no importa, en gris.',
    '- **Capa de arriba:** vista desde arriba, con el frente abajo. Las barritas son las pegatinas laterales.',
  ]),
  phases: [
    {
      id: 'p2-capa1',
      name: tr('Paso 1: primera capa', 'Step 1: first layer'),
      description: doc([
        '**Meta:** las 4 esquinas blancas abajo. En cada lado, la fila de abajo de un solo color.',
        '## Sin centros',
        'La primera esquina blanca va abajo, donde quieras: es tu referencia.',
        'Las demás van junto a las que comparten sus colores: la blanco-verde-naranja, entre la blanco-verde-roja y la blanco-naranja-azul.',
        '## Una sola secuencia',
        "El gatillo `R U R' U'`, como en el 3x3: sube y baja la esquina de adelante-derecha y la gira. No toca las otras de abajo.",
        '## Cómo se hace',
        '1. Sostén el cubo con las esquinas blancas ya puestas abajo.',
        '2. Busca arriba una esquina con blanco y gira `U` hasta dejarla encima de su sitio.',
        '3. Gira todo el cubo (blanco abajo) para que ese sitio quede adelante a la derecha.',
        "4. Repite `R U R' U'` hasta que entre con el blanco abajo: **1** vez si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.",
        'Si una esquina blanca está abajo pero girada, o en el sitio de otra, ponla adelante a la derecha y sácala con un gatillo. Sigue con ella desde arriba.',
        '## Errores comunes',
        '- **Cortar el gatillo:** haz siempre los 4 giros.',
        '- **Bajarla en el sitio equivocado:** compara sus 2 colores con los de sus vecinas de abajo.',
        '- **Girar el cubo entre repeticiones:** la esquina se queda adelante a la derecha hasta que entre.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'p2-capa1-arriba', name: es('Esquina arriba, encima de su sitio'), description: es('Gatillos según dónde mira el blanco: a la derecha 1, arriba 3, al frente 5.'), cases: cornerUp },
        { id: 'p2-capa1-abajo', name: es('Esquina abajo, mal puesta'), description: es('Abajo, pero girada o en el sitio de otra.'), cases: cornerDown },
      ],
      quizzes: [],
    },
    {
      id: 'p2-amarilla',
      name: tr('Paso 2: cara amarilla', 'Step 2: yellow face'),
      description: doc([
        '**Meta:** toda la cara de arriba amarilla, sin romper la primera capa.',
        'Una esquina es **buena** si ya tiene el amarillo arriba.',
        '## Un algoritmo y una regla',
        "Con el **Sune**, `R U R' U R U2 R'`, resuelves todos los casos. Antes de cada Sune, gira `U` así:",
        '- **Una buena:** déjala adelante a la izquierda.',
        '- **Ninguna o dos buenas:** deja adelante a la izquierda una esquina con el amarillo **a la izquierda**.',
        'Repite hasta que la cara quede amarilla: como mucho **3 Sunes**.',
        '## El atajo: Antisune',
        "`R U2 R' U' R U' R'` es el Sune al revés. Si reconoces su caso, lo resuelve de una vez, en lugar de 2 Sunes.",
        '## Errores comunes',
        '- **Mirar solo arriba:** el amarillo de las esquinas giradas está en los lados. Míralo para elegir el ángulo.',
        '- **Asustarte a mitad del Sune:** la primera capa se mueve, pero vuelve sola al terminarlo.',
        '- **Poner el blanco de lado:** el blanco siempre abajo. Para cambiar de ángulo, solo `U`.',
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
      name: tr('Paso 3: esquinas de arriba', 'Step 3: top corners'),
      description: doc([
        '**Meta:** las 4 esquinas de arriba en su sitio. El cubo queda resuelto.',
        '## Faros',
        'Mira los lados de la capa de arriba. Si en un lado las 2 pegatinas son del mismo color, son **faros**: esas 2 esquinas ya están bien entre sí.',
        '## Un algoritmo',
        "`R' F R' B2 R F' R' B2 R2` cambia de sitio las esquinas de arriba sin girarlas. La primera capa vuelve sola al terminar.",
        '## Cómo se hace',
        '1. **Faros en un lado:** gira `U` para dejarlos atrás y haz el algoritmo.',
        '2. **Sin faros:** haz el algoritmo una vez desde cualquier lado. Aparecen faros: sigue desde el paso 1.',
        '3. **Faros en los 4 lados:** gira `U` hasta alinear la capa de arriba con la de abajo. Cubo resuelto.',
        '## Errores comunes',
        '- **Dejar los faros adelante:** van atrás. Desde otro lado, el algoritmo mueve otras esquinas.',
        '- **Girar el cubo para hacer `B2`:** es media vuelta de la cara de atrás, con el cubo quieto.',
      ]),
      diagram: 'top',
      groups: [{ id: 'p2-esquinas-casos', name: es('Faros o no'), description: es('Busca un lado con sus 2 pegatinas de arriba del mismo color.'), cases: topCorners }],
      quizzes: [],
    },
  ],
};

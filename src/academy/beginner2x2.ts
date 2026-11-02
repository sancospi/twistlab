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
    'Blanco-verde-naranja arriba, adelante a la derecha, con el blanco a la derecha', TRIGGER, undefined,
    "Con un gatillo basta. La `U'` del final no toca la primera capa, así que con `R U R'` la esquina también baja."),
  capa1('blanco-arriba', word('Arriba', 'Up', 'Em cima'), 'Blanco arriba',
    'Blanco-verde-naranja arriba, adelante a la derecha, con el blanco arriba', times(TRIGGER, 3),
    ["R U2 R' U' R U R'", "Más corta: `R U2 R'` gira la esquina para que el blanco deje de mirar arriba, y `U' R U R'` la baja."],
    'Haz 3 gatillos.'),
  capa1('blanco-frente', word('Frente', 'Front', 'Frente'), 'Blanco al frente',
    'Blanco-verde-naranja arriba, adelante a la derecha, con el blanco al frente', times(TRIGGER, 5),
    ["U R U' R'", "El gatillo al revés, `U R U' R'`, hace lo mismo que 5 gatillos."],
    'Haz 5 gatillos.'),
];
const cornerDown = [
  capa1('girada-derecha', word('Abajo, derecha', 'Bottom, right', 'Embaixo, direita'), 'En su sitio, blanco a la derecha',
    'Blanco-verde-naranja en su sitio abajo, pero con el blanco a la derecha', times(TRIGGER, 2), undefined,
    'Haz 2 gatillos: el primero sube la esquina con el blanco a la derecha, y el segundo la baja.'),
  capa1('girada-frente', word('Abajo, frente', 'Bottom, front', 'Embaixo, frente'), 'En su sitio, blanco al frente',
    'Blanco-verde-naranja en su sitio abajo, pero con el blanco al frente', times(TRIGGER, 4),
    ["U R U' R' U R U' R'", "Haz 2 veces el gatillo al revés, `U R U' R'`: equivale a 4 gatillos."],
    'Haz 4 gatillos: el primero sube la esquina con el blanco arriba, y los otros 3 la bajan.'),
  capa1('otro-sitio', word('Otro sitio', 'Other spot', 'Outro lugar'), 'En el sitio de otra',
    'Blanco-verde-naranja abajo, adelante a la izquierda, con el blanco al frente; la blanco-verde-roja justo encima, con el blanco al frente',
    `y' ${TRIGGER} y U' ${TRIGGER}`, undefined,
    "Gira el cubo entero con `y'` para llevar el sitio de la blanco-verde-roja adelante a la derecha. Haz un gatillo, que baja la blanco-verde-roja y sube la blanco-verde-naranja. Vuelve con `y`, gira `U'` para dejar la blanco-verde-naranja encima de su sitio y bájala con otro gatillo."),
];

const amarilla = (slug: string, code: string, name: string, recognition: string, alg: string, alt: [string, string], note?: string) =>
  kase({ phase: 'amarilla', slug, stage: '2x2-oll', code, name: es(name), recognition: es(recognition), alg,
    alt: [alt[0], es(alt[1])], note: note ? es(note) : undefined });

const yellowOne = [
  amarilla('sune', 'Sune', 'Una buena: Sune',
    'Buena la de adelante a la izquierda; la de adelante a la derecha, con el amarillo al frente; la de atrás a la derecha, con el amarillo a la derecha; la de atrás a la izquierda, con el amarillo atrás',
    SUNE, [`U2 ${ANTISUNE} U2 ${ANTISUNE}`, 'Con 2 Antisunes: gira `U2` para dejar la buena atrás a la derecha y haz Antisune, `U2` y Antisune.']),
  amarilla('antisune', 'Antisune', 'Una buena: Antisune',
    'Buena la de atrás a la derecha; la de adelante a la izquierda, con el amarillo al frente; la de adelante a la derecha, con el amarillo a la derecha; la de atrás a la izquierda, con el amarillo a la izquierda',
    ANTISUNE, [`U2 ${SUNE} U2 ${SUNE}`, 'Solo con Sunes: gira `U2` para dejar la buena adelante a la izquierda y haz Sune, `U2` y Sune.']),
];
const yellowTwo = [
  amarilla('u', 'U', 'Dos buenas vecinas, las otras con el amarillo al mismo lado',
    'Buenas las 2 de la derecha; las 2 de la izquierda, con el amarillo a la izquierda',
    `${SUNE} U ${SUNE} U' ${SUNE}`, ["F R U R' U' F'", 'Más corta, de una vez: la secuencia del caso U en Ortega.'],
    "Haz Sune, `U`, Sune, `U'` y Sune. Cada giro de `U` coloca la capa de arriba según la regla del paso 2."),
  amarilla('t', 'T', 'Dos buenas vecinas, las otras con el amarillo hacia afuera',
    'Buenas las 2 de atrás; la de adelante a la izquierda, con el amarillo a la izquierda; la de adelante a la derecha, con el amarillo a la derecha',
    `${SUNE} U' ${SUNE} U ${SUNE}`, ["U R U R' U' R' F R F'", 'Más corta, de una vez: gira `U` para dejar las buenas a la derecha y haz la secuencia del caso T en Ortega.'],
    "Haz Sune, `U'`, Sune, `U` y Sune. Cada giro de `U` coloca la capa de arriba según la regla del paso 2."),
  amarilla('l', 'L', 'Dos buenas en diagonal',
    'Buenas la de adelante a la derecha y la de atrás a la izquierda; la de adelante a la izquierda, con el amarillo a la izquierda; la de atrás a la derecha, con el amarillo atrás',
    SUNE_3, ["U2 F R' F' R U R U' R'", 'Más corta, de una vez: gira `U2` para dejar adelante a la izquierda una esquina con el amarillo al frente y haz la secuencia del caso L en Ortega.'],
    "Haz 3 Sunes seguidos, sin girar `U` entre ellos. Escritos juntos no parecen Sunes porque, entre uno y otro, `R' R` se anula y `U2 U` queda en `U'`."),
];
const yellowNone = [
  amarilla('h', 'H', 'Ninguna buena: dos lados con 2 amarillos',
    'Las 4 giradas: las 2 de la derecha, con el amarillo a la derecha; las 2 de la izquierda, con el amarillo a la izquierda',
    SUNE_TWICE, ['U R2 U2 R U2 R2', 'Más corta, de una vez: gira `U` para dejar el amarillo mirando al frente y atrás, y haz la secuencia del caso H en Ortega.'],
    "Haz 2 Sunes seguidos: el primero deja el caso Sune. Escritos juntos no parecen Sunes porque, entre los dos, `R' R` se anula y `U2 U` queda en `U'`."),
  amarilla('pi', 'Pi', 'Ninguna buena: un lado con 2 amarillos',
    'Las 4 giradas: las 2 de la izquierda, con el amarillo a la izquierda; la de adelante a la derecha, con el amarillo al frente; la de atrás a la derecha, con el amarillo atrás',
    `${SUNE} U' ${SUNE}`, ["F R U R' U' R U R' U' F'", 'Más corta, de una vez: la secuencia del caso Pi en Ortega.'],
    "El primer Sune deja una buena. Gira `U'` para ponerla adelante a la izquierda y haz otro Sune."),
];

const esquinas = (slug: string, code: string, name: string, recognition: string, alg: string, alt: [string, string], note?: string) =>
  kase({ phase: 'esquinas', slug, stage: '2x2-ll-corners', code, name: es(name), recognition: es(recognition), alg,
    alt: [alt[0], es(alt[1])], note: note ? es(note) : undefined });

const topCorners = [
  esquinas('faros', word('Faros', 'Headlights', 'Faróis'), 'Faros: dos esquinas bien',
    'Faros atrás: las 2 pegatinas de atrás, del mismo color; en los otros lados, colores distintos',
    SWAP, ["U' R U R' U' R' F R2 U' R' U' R U R' F'", "Si sabes la T-perm del 3x3: gira `U'` para dejar los faros a la izquierda y hazla."],
    'Al terminar la secuencia, gira `U` hasta alinear la capa de arriba con la de abajo.'),
  esquinas('diagonal', 'Diagonal', 'Sin faros: cambiadas en diagonal',
    'Ningún lado con sus 2 pegatinas de arriba del mismo color',
    `${SWAP} U ${SWAP}`, ["F R U' R' U' R U R' F' R U R' U' R' F R F'", 'Si sabes la Y-perm del 3x3, hazla y resuelves las esquinas de una vez.'],
    'Con el cubo como en la figura, haz la secuencia una vez y aparecen faros a la izquierda. Gira `U` para llevarlos atrás y haz la secuencia otra vez.'),
];

// Each phase is taught as the 3x3 beginner's (types.ts): the goal and its sequence, a few steps, and what to do when
// something goes wrong, folded.
export const beginner2x2: Method = {
  id: 'principiante-2x2',
  next: 'ortega',
  puzzle: '2x2x2',
  name: tr('Principiante 2x2', '2x2 beginner', '2x2 para iniciantes'),
  summary: tr(
    'Resuelve tu primer cubo de Rubik 2x2 en 3 pasos, con una secuencia corta en cada uno: la primera capa, la cara amarilla y las esquinas de arriba.',
    "Solve your first 2x2 Rubik's cube in 3 steps, with one short sequence for each: the first layer, the yellow face and the top corners.",
    'Resolva seu primeiro cubo mágico 2x2 em 3 passos, com uma sequência curta em cada um: a primeira camada, a face amarela e as quinas de cima.',
  ),
  description: doc([
    'Con esta guía resuelves tu primer 2x2. Lo armas **capa por capa**: primero la capa blanca, abajo, y luego la amarilla, arriba.',
    "Son 3 pasos, y en cada uno repites **una secuencia**: unos pocos giros que aprendes de memoria. La del paso 1 es el **gatillo**, `R U R' U'`. Si ya resolviste el 3x3, la conoces.",
    '## Los 3 pasos',
    "1. **Primera capa:** `R U R' U'`, el gatillo",
    "2. **Cara amarilla:** `R U R' U R U2 R'`, el Sune",
    "3. **Esquinas de arriba:** `R' F R' B2 R F' R' B2 R2`",
    '## Cómo aprenderlo',
    '- **Un paso por sesión**, en orden. Pasa al siguiente cuando lo hagas sin mirar.',
    '- Con 20 min al día, lo normal es resolver tu primer 2x2 en **menos de una semana**.',
    '- **Si te pierdes:** mira qué pasos siguen hechos en el cubo y retoma desde el primero que falte.',
    '- Cuando lo resuelvas sin mirar la guía, sigue con Ortega, un método más rápido y con menos giros.',
  ]),
  orientation: tr(
    '**Amarillo arriba y verde al frente**, como en las figuras de toda la Academia: la primera capa, la blanca, queda abajo.\nEn el paso 1, la esquina con la que trabajas va **adelante a la derecha**: gira el cubo entero (`y`) para llevarla ahí, siempre con el blanco abajo.',
    "**Yellow on top and green in front**, as in the diagrams across the Academy: the first layer, the white one, ends up on the bottom.\nIn step 1, the corner you're working on should be at the **front right**: rotate the whole cube (`y`) to bring it there, always with white on the bottom.",
    '**Amarelo em cima e verde na frente**, como nas figuras de toda a Academia: a primeira camada, a branca, fica embaixo.\nNo passo 1, a quina que você está resolvendo deve ficar na **frente à direita**: gire o cubo inteiro (`y`) para levá-la até lá, sempre com o branco embaixo.',
  ),
  notation: doc([
    '## Giros',
    'Los giros se escriben con las mismas letras que en el 3x3: `R`, `U`, `F`, `L`, `D` y `B`. La letra `y` gira el cubo entero en el mismo sentido que `U`. Si son nuevas para ti, repásalas en «Notación».',
    '## Sin centros',
    'El 2x2 no tiene centros que digan el color de cada cara. Ese color lo deciden las esquinas que ya pusiste: cada esquina va junto a las que comparten sus colores.',
    '## Figuras',
    '- **Paso 1:** el cubo en perspectiva, con la cara de arriba, la del frente y la de la derecha a la vista.',
    '- **Pasos 2 y 3:** la cara de arriba vista desde encima, con el lado del frente en el borde inferior de la figura. Las barritas de alrededor son las pegatinas de los lados.',
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
        '1. Si ya hay una esquina blanca abajo con el blanco abajo, esa es tu referencia. Si no, gira `U` hasta tener una arriba, adelante a la derecha, y haz el gatillo hasta que baje con el blanco abajo.',
        '2. Busca arriba otra esquina blanca que tenga un color en común con una de abajo, además del blanco. Gira `U` hasta dejarla encima del sitio vecino a esa esquina, en la cara donde la de abajo muestra ese color.',
        '3. Gira el cubo entero, con el blanco siempre abajo, hasta tener esa esquina adelante a la derecha.',
        '4. Haz el gatillo hasta que baje con el blanco abajo: **1 vez** si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.',
        '## Dónde va cada esquina',
        'Repite con cada esquina blanca hasta tener las 4 abajo. Cada una va entre las 2 que comparten sus colores: la blanco-verde-naranja, por ejemplo, va entre la blanco-verde-roja y la blanco-azul-naranja.',
      ]),
      tips: doc([
        '- **Una esquina blanca está abajo, pero girada o en el sitio de otra:** gira el cubo entero hasta tenerla adelante a la derecha y haz un gatillo para subirla. Después, llévala con `U` encima de su sitio y bájala como las demás.',
        '- **Una esquina bajó en el sitio equivocado:** antes del gatillo, compara sus otros 2 colores con los de sus vecinas de abajo.',
        '- **La esquina no baja, o se deshace lo que ya tenías:** haz siempre los 4 giros del gatillo completos y repítelo, sin girar el cubo, hasta que la esquina baje.',
      ]),
      diagram: 'iso',
      groups: [
        { id: 'p2-capa1-arriba', name: es('Esquina arriba, encima de su sitio'), description: es('La esquina está arriba, adelante a la derecha, justo encima de su sitio. Haz el gatillo 1 vez si el blanco mira a la derecha, 3 si mira arriba y 5 si mira al frente.'), cases: cornerUp },
        { id: 'p2-capa1-abajo', name: es('Esquina abajo, mal puesta'), description: es('La esquina blanca ya está abajo, pero girada o en el sitio de otra. Un gatillo la sube a la capa de arriba, y desde ahí se baja como cualquier otra.'), cases: cornerDown },
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
        'Una esquina es **buena** si ya tiene el amarillo arriba. Antes de cada Sune, gira `U` según esta **regla**:',
        '- **Una buena:** déjala adelante a la izquierda.',
        '- **Ninguna o dos buenas:** deja adelante a la izquierda una esquina con el amarillo **a la izquierda**.',
        'Haz el Sune y repite hasta que la cara quede amarilla: como mucho **3 Sunes**.',
        "**Atajo:** el Antisune, `R U2 R' U' R U' R'`, es el Sune al revés. Te sirve cuando, con la buena adelante a la izquierda, la de adelante a la derecha tiene el amarillo a la derecha. Entonces gira `U2` para dejar la buena atrás a la derecha y haz el Antisune: resuelve la cara de una vez, en lugar de con 2 Sunes.",
      ]),
      tips: doc([
        '- **No sabes cómo colocar la capa de arriba antes del Sune:** las esquinas que no son buenas tienen el amarillo en un lado. Búscalo en los lados de la capa de arriba, no solo en la cara de arriba.',
        '- **La primera capa se rompe a mitad del Sune:** es normal. Vuelve sola al terminarlo, así que haz siempre el Sune completo.',
        '- **La primera capa se rompió y no volvió:** mantén siempre el blanco abajo y, para colocar la capa de arriba, gira solo `U`. Vuelve a armar la primera capa y retoma el paso 2.',
      ]),
      diagram: 'top',
      groups: [
        { id: 'p2-amarilla-una', name: es('Una buena'), description: es('Solo una esquina tiene el amarillo arriba. Con ella adelante a la izquierda, mira la de adelante a la derecha: si su amarillo mira al frente, es el Sune, y si mira a la derecha, el Antisune.'), cases: yellowOne },
        { id: 'p2-amarilla-dos', name: es('Dos buenas'), description: es('Dos esquinas tienen el amarillo arriba, vecinas o en diagonal. Deja adelante a la izquierda una con el amarillo a la izquierda y haz el Sune.'), cases: yellowTwo },
        { id: 'p2-amarilla-ninguna', name: es('Ninguna buena'), description: es('Ninguna esquina tiene el amarillo arriba: las 4 lo tienen en un lado. Deja adelante a la izquierda una con el amarillo a la izquierda y haz el Sune.'), cases: yellowNone },
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
        '1. Mira los lados de la capa de arriba. Si un lado tiene sus 2 pegatinas del mismo color, son **faros**: esas 2 esquinas ya están bien colocadas entre sí.',
        '2. **Sin faros:** haz la secuencia una vez desde cualquier lado y aparecerán faros.',
        '3. **Faros en un lado:** gira `U` para dejarlos atrás y haz la secuencia una vez.',
        '4. **Faros en los 4 lados:** gira `U` hasta alinear la capa de arriba con la de abajo. ¡Cubo resuelto!',
      ]),
      tips: doc([
        '- **Hiciste la secuencia con faros y las esquinas siguen mal:** antes de hacerla, gira `U` para dejar los faros atrás. Desde otro lado, la secuencia cambia esquinas que ya estaban bien.',
        '- **Te pierdes al girar la cara de atrás:** `B2` es media vuelta de esa cara. Hazla con el cubo quieto, sin girarlo entero.',
        '- **La primera capa se rompe a mitad de la secuencia:** es normal. Vuelve sola al terminarla.',
      ]),
      diagram: 'top',
      groups: [{ id: 'p2-esquinas-casos', name: es('Con faros o sin faros'), description: es('Mira los lados de la capa de arriba: un lado con sus 2 pegatinas del mismo color tiene faros. Si ningún lado los tiene, las esquinas están cambiadas en diagonal.'), cases: topCorners }],
      quizzes: [],
    },
  ],
};

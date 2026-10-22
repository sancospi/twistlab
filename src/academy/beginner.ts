// "Método principiante": capa por capa, for someone who has never solved a cube. The white cross is its own guide
// (crossGuide.ts); this method starts at the white corners. Every algorithm is the beginner's full sequence, with its
// repetitions written out; cfop.validate.test.ts checks each one in the simulator. Case ids: 'prin-<phase>-<slug>'.
import { loc, type Localized } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

const tr = (es: string, en: string): Localized => ({ es, en });
// A case code is a plain string shown as is: the visitor's language, picked when the data loads (i18n.ts's lang is set by then).
const word = (es: string, en: string) => loc(tr(es, en));
const times = (block: string, n: number) => Array(n).fill(block).join(' ');

const TRIGGER = "R U R' U'"; // white corners
const RIGHT = "U R U' R' U' F' U F"; // middle-layer edge to the right
const LEFT = "U' L' U L U F U' F'"; // ...and to the left
const CROSS = "F R U R' U' F'"; // yellow cross
const CROSS_TWICE = `F ${times(TRIGGER, 2)} F'`; // CROSS twice, the F' F in between cancelled
const SUNE = "R U R' U R U2 R' U"; // swaps the front and left yellow edges
const CYCLE = "U R U' L' U R' U' L"; // keeps the front-right corner, cycles the other three
const TWIST = "R' D' R D"; // twists the front-right corner
const [TWIST2, TWIST4] = [times(TWIST, 2), times(TWIST, 4)]; // yellow right / yellow front

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
    id: `prin-${r.phase}-${r.slug}`,
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

const capa1 = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, alt?: Row['alt'], note?: Localized) =>
  kase({ phase: 'capa1', slug, stage: 'first-layer', code, name, recognition, alg, alt, note });


const cornerUp = [
  capa1('blanco-derecha', word('Derecha', 'Right'),
    tr('Blanco a la derecha', 'White on the right'),
    tr('Blanco-verde-naranja arriba adelante-derecha, blanco a la derecha', 'White-green-orange at top front-right, white facing right'),
    TRIGGER, undefined,
    tr("1 gatillo. La U' final no toca la primera capa: R U R' también basta.", "1 trigger. The final U' doesn't touch the first layer: R U R' is enough too.")),
  capa1('blanco-arriba', word('Arriba', 'Up'),
    tr('Blanco arriba', 'White on top'),
    tr('Blanco-verde-naranja arriba adelante-derecha, blanco arriba', 'White-green-orange at top front-right, white facing up'),
    times(TRIGGER, 3), ["R U2 R' U' R U R'", tr("Más corta: R U2 R' saca el blanco de arriba; U' R U R' lo baja.", "Shorter: R U2 R' takes the white off the top; U' R U R' brings it down.")]),
  capa1('blanco-frente', word('Frente', 'Front'),
    tr('Blanco al frente', 'White in front'),
    tr('Blanco-verde-naranja arriba adelante-derecha, blanco al frente', 'White-green-orange at top front-right, white facing front'),
    times(TRIGGER, 5), ["U R U' R'", tr('El gatillo al revés, 1 vez, equivale a 5 gatillos.', 'The trigger backwards, once, equals 5 triggers.')]),
];
const cornerDown = [
  capa1('girada-derecha', word('Abajo, derecha', 'Bottom, right'),
    tr('En su sitio, blanco a la derecha', 'In place, white on the right'),
    tr('Blanco-verde-naranja en su sitio abajo, pero con el blanco a la derecha', 'White-green-orange in its place at the bottom, but with white facing right'),
    times(TRIGGER, 2)),
  capa1('girada-frente', word('Abajo, frente', 'Bottom, front'),
    tr('En su sitio, blanco al frente', 'In place, white in front'),
    tr('Blanco-verde-naranja en su sitio abajo, pero con el blanco al frente', 'White-green-orange in its place at the bottom, but with white facing front'),
    times(TRIGGER, 4), ["U R U' R' U R U' R'", tr('El gatillo al revés, 2 veces, equivale a 4 gatillos.', 'The trigger backwards, twice, equals 4 triggers.')]),
  capa1('otra-ranura', word('Otro sitio', 'Other spot'),
    tr('En el sitio de otra', "In another corner's place"),
    tr('Blanco-verde-naranja abajo adelante-izquierda, blanco al frente; la blanco-verde-roja arriba adelante-izquierda, blanco al frente',
      'White-green-orange at bottom front-left, white facing front; white-green-red at top front-left, white facing front'),
    `y' ${TRIGGER} y U' ${TRIGGER}`, undefined,
    tr("Con y' el sitio de la blanco-verde-roja queda adelante-derecha: un gatillo saca la blanco-verde-naranja y mete la blanco-verde-roja. Con y vuelves, U' deja la blanco-verde-naranja encima de su sitio y otro gatillo la baja.",
      "With y' the white-green-red slot ends up front-right: one trigger takes out the white-green-orange and puts in the white-green-red. With y you turn back, U' leaves the white-green-orange above its slot and another trigger brings it down.")),
];

const capa2 = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, note?: Localized) =>
  kase({ phase: 'capa2', slug, stage: 'second-layer', code, name, recognition, alg, note });

const edgeUp = [
  capa2('derecha', word('Derecha', 'Right'), tr('Inserción a la derecha', 'Insert to the right'),
    tr('Verde-naranja arriba al frente: verde al frente, naranja arriba', 'Green-orange at top front: green in front, orange on top'), RIGHT),
  capa2('izquierda', word('Izquierda', 'Left'), tr('Inserción a la izquierda', 'Insert to the left'),
    tr('Verde-roja arriba al frente: verde al frente, rojo arriba', 'Green-red at top front: green in front, red on top'), LEFT),
];
const edgeStuck = [
  capa2('volteada', word('Volteada', 'Flipped'), tr('Atascada y volteada', 'Stuck and flipped'),
    tr('Verde-naranja en su sitio pero volteada: naranja al frente, verde a la derecha', 'Green-orange in its place but flipped: orange in front, green on the right'),
    "U R U' R' U' F' U F U' R U' R' U' F' U F",
    tr("Dos inserciones a la derecha: la primera saca la arista. La U2 de en medio se junta con la U inicial de la segunda y queda U'.",
      "Two inserts to the right: the first one takes the edge out. The U2 in the middle merges with the second one's initial U and becomes U'.")),
  capa2('otra-ranura', word('Otra ranura', 'Other slot'), tr('Atascada en la ranura de la izquierda', 'Stuck in the left slot'),
    tr('Verde-naranja en la ranura adelante-izquierda, naranja al frente; la verde-roja arriba al frente, rojo arriba',
      'Green-orange in the front-left slot, orange in front; green-red at top front, red on top'),
    "U' L' U L U F U' F' U' R U' R' U' F' U F",
    tr("La inserción a la izquierda mete la verde-roja y saca la verde-naranja. Luego la inserción a la derecha (con U2 antes, que junto a su U inicial queda U').",
      "The left insert puts in the green-red and takes out the green-orange. Then the right insert (with a U2 before it, which merges with its initial U into U').")),
];

const yellowCross = [
  kase({ phase: 'cruz', slug: 'linea', stage: 'oll-cross', code: word('Línea', 'Line'), name: tr('Línea', 'Line'),
    recognition: tr('Línea amarilla horizontal (izquierda–derecha)', 'Horizontal yellow line (left–right)'), alg: CROSS }),
  kase({ phase: 'cruz', slug: 'l', stage: 'oll-cross', code: 'L', name: tr('L', 'L'),
    recognition: tr('Aristas amarillas atrás y a la izquierda', 'Yellow edges at the back and on the left'), alg: CROSS_TWICE,
    note: tr("El algoritmo 2 veces seguidas; la F' y la F del medio se cancelan. La primera vez deja la línea horizontal.",
      "The algorithm twice in a row; the F' and F in the middle cancel. The first time leaves the horizontal line.") }),
  kase({ phase: 'cruz', slug: 'punto', stage: 'oll-cross', code: word('Punto', 'Dot'), name: tr('Punto', 'Dot'),
    recognition: tr('Solo el centro amarillo; ninguna arista amarilla arriba', 'Only the yellow center; no yellow edge on top'),
    alg: `${CROSS} U2 ${CROSS_TWICE}`,
    note: tr('Una vez deja una L adelante-derecha; U2 la pasa atrás-izquierda y sigues como la L.', 'One pass leaves an L at front-right; U2 moves it to back-left and you continue like the L.') }),
];

const yellowEdges = [
  kase({ phase: 'aristas', slug: 'vecinas', stage: 'll-edges', code: word('Vecinas', 'Adjacent'), name: tr('Dos vecinas bien', 'Two adjacent edges correct'),
    recognition: tr('Coinciden la de la derecha (naranja) y la de atrás (azul); adelante hay roja y a la izquierda verde',
      'The right (orange) and back (blue) edges match; red is in front and green on the left'), alg: SUNE }),
  kase({ phase: 'aristas', slug: 'opuestas', stage: 'll-edges', code: word('Opuestas', 'Opposite'), name: tr('Dos opuestas bien', 'Two opposite edges correct'),
    recognition: tr('Coinciden la de la derecha (naranja) y la de la izquierda (roja); adelante hay azul y atrás verde',
      'The right (orange) and left (red) edges match; blue is in front and green at the back'),
    alg: "R U R' U R U2 R' U2 y R U R' U R U2 R' U",
    note: tr('1 vez deja dos vecinas bien. Una U más las alinea (junto a la U final, U2) atrás y a la izquierda; la rotación y las pasa atrás y a la derecha, y repites el algoritmo.',
      'One pass leaves two adjacent edges correct. One more U lines them up (with the final U, U2) at the back and on the left; the y rotation moves them to back and right, and you repeat the algorithm.') }),
];

const placeCorners = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, alt?: Row['alt'], note?: Localized) =>
  kase({ phase: 'esquinas', slug, stage: 'll-corners-placed', code, name, recognition, alg, alt, note });

const oneHome = [
  placeCorners('antihorario', word('Antihorario', 'Counterclockwise'), tr('Una en su sitio, 1 vez', 'One in place, once'),
    tr('Adelante-derecha en su sitio; las otras 3 giran en sentido antihorario: la de atrás-derecha (roja-azul) va atrás-izquierda',
      'Front-right in place; the other 3 cycle counterclockwise: the back-right one (red-blue) goes to back-left'), CYCLE),
  placeCorners('horario', word('Horario', 'Clockwise'), tr('Una en su sitio, 2 veces', 'One in place, twice'),
    tr('Adelante-derecha en su sitio; las otras 3 giran en sentido horario: la de atrás-izquierda (naranja-azul) va atrás-derecha',
      'Front-right in place; the other 3 cycle clockwise: the back-left one (orange-blue) goes to back-right'), times(CYCLE, 2),
    ["L' U R U' L U R' U'", tr('El algoritmo al revés, 1 vez, equivale a 2 veces.', 'The algorithm backwards, once, equals twice.')]),
];
const noneHome = [
  placeCorners('parejas', word('Parejas', 'Pairs'), tr('Ninguna: cambiadas por parejas', 'None: swapped in pairs'),
    tr('Ninguna en su sitio: las 2 de la derecha cambiadas entre sí, y las 2 de la izquierda también',
      'None in place: the 2 on the right swapped with each other, and the 2 on the left too'),
    `${CYCLE} y' ${CYCLE}`, undefined,
    tr("1 vez desde aquí deja una en su sitio; con y' queda adelante-derecha y 1 vez más termina.",
      "One pass from here leaves one corner in place; with y' it ends up front-right and one more pass finishes it.")),
  placeCorners('diagonal', 'Diagonal', tr('Ninguna: cambiadas en diagonal', 'None: swapped diagonally'),
    tr('Ninguna en su sitio: cada esquina va al sitio opuesto en diagonal', 'None in place: each corner goes to the diagonally opposite spot'),
    `${CYCLE} y ${CYCLE}`, undefined,
    tr('1 vez desde aquí deja una en su sitio; con y queda adelante-derecha y 1 vez más termina.',
      'One pass from here leaves one corner in place; with y it ends up front-right and one more pass finishes it.')),
];

const twist = (slug: string, code: string, name: Localized, recognition: Localized, alg: string) =>
  kase({ phase: 'orientar', slug, stage: 'll-corners-twist', code, name, recognition, alg });

const twistTwo = [
  twist('u', 'U', tr('Faros: dos vecinas mirando al mismo lado', 'Headlights: two adjacent facing the same way'),
    tr('Adelante-derecha y atrás-derecha giradas, las dos con amarillo a la derecha', 'Front-right and back-right twisted, both with yellow facing right'),
    `${TWIST2} U ${TWIST4} U'`),
  twist('t', 'T', tr('Dos vecinas mirando hacia afuera', 'Two adjacent facing outward'),
    tr('Adelante-derecha con amarillo al frente y atrás-derecha con amarillo atrás', 'Front-right with yellow facing front and back-right with yellow facing back'),
    `${TWIST4} U ${TWIST2} U'`),
  twist('l', 'L', tr('Dos en diagonal', 'Two corners on a diagonal'),
    tr('Adelante-derecha con amarillo al frente y atrás-izquierda con amarillo a la izquierda', 'Front-right with yellow facing front and back-left with yellow facing left'),
    `${TWIST4} U2 ${TWIST2} U2`),
];
const twistThree = [
  twist('antisune', 'Antisune', tr('Tres, 2 veces cada una', 'Three, 2 times each'),
    tr('Adelante-izquierda bien; amarillo a la derecha en adelante-derecha, atrás en atrás-derecha y a la izquierda en atrás-izquierda',
      'Front-left correct; yellow facing right at front-right, back at back-right and left at back-left'),
    `${TWIST2} U ${TWIST2} U ${TWIST2} U2`),
  twist('sune', 'Sune', tr('Tres, 4 veces cada una', 'Three, 4 times each'),
    tr('Adelante-izquierda bien; amarillo al frente en adelante-derecha, a la derecha en atrás-derecha y atrás en atrás-izquierda',
      'Front-left correct; yellow facing front at front-right, right at back-right and back at back-left'),
    `${TWIST4} U ${TWIST4} U ${TWIST4} U2`),
];
const twistFour = [
  twist('pi', 'Pi', tr('Cuatro: faros adelante', 'Four: headlights in front'),
    tr('Las 4 giradas: las 2 de adelante con amarillo al frente, atrás-derecha a la derecha y atrás-izquierda a la izquierda',
      'All 4 twisted: the 2 in front with yellow facing front, back-right facing right and back-left facing left'),
    `${TWIST4} U ${TWIST4} U ${TWIST2} U ${TWIST2} U`),
  twist('h', 'H', tr('Cuatro: faros adelante y atrás', 'Four: headlights front and back'),
    tr('Las 4 giradas: las 2 de adelante con amarillo al frente y las 2 de atrás con amarillo atrás',
      'All 4 twisted: the 2 in front with yellow facing front and the 2 in back with yellow facing back'),
    `${TWIST4} U ${TWIST2} U ${TWIST4} U ${TWIST2} U`),
];

// Rich text in both languages: same structure (lines), joined once.
const doc = (es: string[], en: string[]): Localized => tr(es.join('\n'), en.join('\n'));

export const beginner: Method = {
  id: 'principiante',
  name: tr('Método principiante', 'Beginner method'),
  summary: tr('Tu primer cubo resuelto: capa por capa, con 7 secuencias cortas que se repiten.', 'Your first solved cube: layer by layer, with 7 short sequences that repeat.'),
  description: doc(
    [
      'El método para resolver el cubo por primera vez. Lo armas **capa por capa**: abajo (blanca), medio y arriba (amarilla).',
      'Solo necesitas **7 secuencias cortas**, y casi todas se repiten: el truco es saber desde dónde hacerlas y cuántas veces.',
      '## Los pasos',
      '1. **Cruz blanca.** Tiene su propia guía, «La cruz blanca» (enlace «Paso previo»). Te basta la lección «Casos de una arista»: pon las aristas de una en una, sin importar cuántos giros uses.',
      '2. **Esquinas blancas.** Completan la primera capa.',
      '3. **Segunda capa.** Las 4 aristas del medio.',
      '4. **Cruz amarilla.** Las aristas amarillas hacia arriba.',
      '5. **Aristas amarillas.** Cada una junto a su centro.',
      '6. **Esquinas amarillas a su lugar.** Cada una en su sitio, aunque esté girada.',
      '7. **Orientar las esquinas.** Amarillo arriba: cubo resuelto.',
      '## Cuánto tardas',
      'Con 20–30 min al día, tu primer cubo suele llegar en **1 o 2 semanas**.',
      '- Aprende un paso por sesión, en orden. No pases al siguiente hasta hacerlo sin mirar la guía.',
      '- **Si te pierdes:** busca el último paso que sigue completo y retoma desde el siguiente.',
      '- La primera resolución puede tardar 5 minutos o más. Con práctica bajarás a 1 o 2.',
      '- Cuando lo resuelvas sin guía, sigue con el **CFOP reducido**: pasos más rápidos.',
    ],
    [
      'The method for solving the cube for the first time. You build it **layer by layer**: bottom (white), middle and top (yellow).',
      'You only need **7 short sequences**, and almost all of them repeat: the trick is knowing where to do them from and how many times.',
      '## The steps',
      '1. **White cross.** It has its own guide, "The white cross" (the "Previous step" link). The lesson "One-edge cases" is enough: place the edges one at a time, no matter how many turns you use.',
      '2. **White corners.** They complete the first layer.',
      '3. **Second layer.** The 4 middle edges.',
      '4. **Yellow cross.** The yellow edges facing up.',
      '5. **Yellow edges.** Each one next to its center.',
      '6. **Yellow corners into place.** Each in its spot, even if twisted.',
      '7. **Orient the corners.** Yellow on top: cube solved.',
      '## How long it takes',
      'With 20–30 min a day, your first cube usually arrives in **1 or 2 weeks**.',
      '- Learn one step per session, in order. Don\'t move on to the next until you can do it without looking at the guide.',
      '- **If you get lost:** find the last step that is still complete and resume from the next one.',
      '- Your first solve may take 5 minutes or more. With practice you\'ll get down to 1 or 2.',
      '- Once you can solve it without the guide, move on to **reduced CFOP**: faster steps.',
    ],
  ),
  orientation: doc(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** El naranja queda a la derecha.',
      'Las mezclas parten del cubo resuelto en esa posición, y los casos usan las piezas de adelante a la derecha.',
      "En una resolución real, gira todo el cubo (`y`, siempre con el amarillo arriba) hasta que la pieza quede como en el caso, y aplica la misma secuencia. Solo en el último paso no se gira el cubo.",
    ],
    [
      '**White cross at the bottom, yellow on top and green in front.** Orange is on the right.',
      'Scrambles start from the solved cube in that position, and the cases use the pieces at the front right.',
      "In a real solve, rotate the whole cube (`y`, always with yellow on top) until the piece looks like the case, and apply the same sequence. Only in the last step do you not rotate the cube.",
    ],
  ),
  notation: doc(
    [
      '## Movimientos',
      '- Cada letra es una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente, `B` atrás.',
      '- La letra sola gira la cara en sentido horario, mirándola de frente. `D` se mira desde abajo.',
      "- Con apóstrofo es antihorario (`R'`); con 2, media vuelta (`U2`).",
      "- `y` gira todo el cubo como `U`, y `y'` como `U'`. No mueve piezas: solo cambia la cara del frente.",
      '## Bloques',
      "Las secuencias se arman con bloques que se repiten: `R U R' U'` (el **gatillo**), `R' D' R D` o `F R U R' U' F'`.",
      'Haz **cada bloque como un solo gesto** y cuenta repeticiones, no giros.',
      'Las mezclas solo preparan el caso: no hace falta memorizarlas.',
      '## Figuras',
      '- **Primera y segunda capa:** vista desde arriba-adelante-derecha. Lo que no importa, en gris.',
      '- **Última capa:** la cara amarilla vista desde arriba, con el frente abajo. Las barritas son las pegatinas laterales de la capa superior.',
      '- **Esquinas a su lugar:** las flechas muestran a dónde va cada pieza.',
    ],
    [
      '## Moves',
      '- Each letter is a face: `R` right, `L` left, `U` up, `D` down, `F` front, `B` back.',
      '- A letter alone turns the face clockwise, looking at it head-on. `D` is viewed from below.',
      "- With an apostrophe it is counterclockwise (`R'`); with 2, a half turn (`U2`).",
      "- `y` rotates the whole cube like `U`, and `y'` like `U'`. It moves no pieces: it only changes the front face.",
      '## Blocks',
      "Sequences are built from blocks that repeat: `R U R' U'` (the **trigger**), `R' D' R D` or `F R U R' U' F'`.",
      'Do **each block as a single gesture** and count repetitions, not turns.',
      'Scrambles only set up the case: you don\'t need to memorize them.',
      '## Diagrams',
      '- **First and second layer:** seen from the top-front-right. What doesn\'t matter is in gray.',
      '- **Last layer:** the yellow face seen from above, with the front at the bottom. The little bars are the side stickers of the top layer.',
      '- **Corners into place:** the arrows show where each piece goes.',
    ],
  ),
  phases: [
    {
      id: 'prin-capa1',
      name: tr('Paso 2: esquinas blancas', 'Step 2: white corners'),
      description: doc(
        [
          '**Meta:** las 4 esquinas blancas en su sitio. Con la cruz forman la primera capa: blanco abajo y, en cada lado, la fila de abajo de un solo color.',
          'Cada esquina va entre los centros de sus otros dos colores: la blanco-verde-naranja, abajo entre el verde y el naranja.',
          '## Una sola secuencia',
          "El gatillo `R U R' U'` sube y baja la esquina de adelante-derecha y la gira. No mueve la cruz, y con 6 repeticiones el cubo vuelve a como estaba.",
          '## Cómo se hace',
          '1. Busca arriba una esquina con blanco y lee sus otros dos colores.',
          '2. Gira `U` hasta dejarla encima de su sitio. Gira todo el cubo (amarillo arriba) para que ese sitio quede adelante a la derecha.',
          "3. Repite `R U R' U'` hasta que entre con el blanco abajo: **1** vez si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.",
          'Si una esquina blanca está abajo pero girada, o en el sitio de otra, ponla adelante a la derecha y sácala con un gatillo. Sigue con ella desde arriba.',
          '## Errores comunes',
          '- **Cortar el gatillo:** haz siempre los 4 giros.',
          '- **Bajarla en el sitio equivocado:** compara sus 2 colores con los centros antes de empezar.',
          '- **Girar el cubo entre repeticiones:** la esquina se queda adelante a la derecha hasta que entre.',
        ],
        [
          '**Goal:** the 4 white corners in place. With the cross they form the first layer: white on the bottom and, on each side, the bottom row all one color.',
          'Each corner goes between the centers of its other two colors: the white-green-orange one goes at the bottom, between green and orange.',
          '## One sequence',
          "The trigger `R U R' U'` lifts and lowers the front-right corner and twists it. It doesn't move the cross, and after 6 repetitions the cube is back to how it was.",
          '## How to do it',
          '1. Find a corner with white on top and read its other two colors.',
          '2. Turn `U` until it is above its spot. Rotate the whole cube (yellow on top) so that spot is at the front right.',
          "3. Repeat `R U R' U'` until it drops in with white at the bottom: **1** time if white faces right, **3** if it faces up, **5** if it faces front.",
          'If a white corner is at the bottom but twisted, or in another corner\'s spot, put it at the front right and take it out with one trigger. Then continue with it from the top.',
          '## Common mistakes',
          '- **Cutting the trigger short:** always do all 4 turns.',
          '- **Dropping it in the wrong spot:** compare its 2 colors with the centers before you start.',
          '- **Rotating the cube between repetitions:** the corner stays at the front right until it drops in.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'prin-capa1-arriba',
          name: tr('Esquina arriba, encima de su sitio', 'Corner on top, above its spot'),
          description: tr('Gatillos según dónde mira el blanco: a la derecha 1, arriba 3, al frente 5.', 'Triggers depend on where white faces: right 1, up 3, front 5.'),
          cases: cornerUp,
        },
        {
          id: 'prin-capa1-abajo',
          name: tr('Esquina abajo, mal puesta', 'Corner at the bottom, misplaced'),
          description: tr('Abajo, pero girada o en el sitio de otra.', 'At the bottom, but twisted or in another corner\'s spot.'),
          cases: cornerDown,
        },
      ],
      quizzes: [],
    },
    {
      id: 'prin-capa2',
      name: tr('Paso 3: segunda capa', 'Step 3: second layer'),
      description: doc(
        [
          '**Meta:** las 4 aristas del medio. Las dos primeras capas quedan resueltas.',
          'Son las aristas **sin amarillo**: verde-naranja, naranja-azul, azul-roja y roja-verde.',
          '## Cómo se hace',
          '1. Busca arriba una arista sin amarillo.',
          '2. Gira `U` hasta que su color de lado coincida con el centro de ese lado. Gira todo el cubo (amarillo arriba) para tenerla al frente.',
          '3. Mira su color de **arriba**: si es el del centro derecho, va a la derecha; si es el del izquierdo, a la izquierda.',
          "4. Haz la inserción: a la derecha `U R U' R' U' F' U F`, a la izquierda `U' L' U L U F U' F'` (espejo una de otra).",
          '## Si no hay ninguna arriba',
          'Si todas las de arriba tienen amarillo y aún falta alguna, está **atascada** en el medio: volteada o en el sitio de otra.',
          'Gira todo el cubo para dejarla adelante a la derecha y haz la inserción a la derecha con cualquier arista de arriba: eso la saca. Luego insértala bien.',
          '## Errores comunes',
          '- **Usar una arista con amarillo:** son de la última capa; déjalas arriba.',
          '- **Elegir el lado por el color del frente:** lo decide el color de arriba.',
          '- **Insertar sin alinear:** primero su color de lado debe coincidir con el centro.',
        ],
        [
          '**Goal:** the 4 middle edges. The first two layers end up solved.',
          'They are the edges **without yellow**: green-orange, orange-blue, blue-red and red-green.',
          '## How to do it',
          '1. Find an edge on top without yellow.',
          '2. Turn `U` until its side color matches the center on that side. Rotate the whole cube (yellow on top) to have it in front.',
          '3. Look at its **top** color: if it is the right center\'s color, it goes right; if it is the left one\'s, it goes left.',
          "4. Do the insert: to the right `U R U' R' U' F' U F`, to the left `U' L' U L U F U' F'` (mirrors of each other).",
          '## If there is none on top',
          'If all the top ones have yellow and one is still missing, it is **stuck** in the middle: flipped or in another edge\'s spot.',
          'Rotate the whole cube to put it at the front right and do the right insert with any edge from the top: that takes it out. Then insert it properly.',
          '## Common mistakes',
          '- **Using an edge with yellow:** those belong to the last layer; leave them on top.',
          '- **Choosing the side by the front color:** the top color decides it.',
          '- **Inserting without aligning:** first its side color must match the center.',
        ],
      ),
      diagram: 'iso',
      groups: [
        { id: 'prin-capa2-arriba', name: tr('Arista arriba', 'Edge on top'), description: tr('Alinéala con su centro al frente y mira el color de arriba.', 'Align it with its center in front and look at the top color.'), cases: edgeUp },
        { id: 'prin-capa2-atascada', name: tr('Arista atascada', 'Stuck edge'), description: tr('Sácala con una inserción y luego insértala bien.', 'Take it out with an insert, then insert it properly.'), cases: edgeStuck },
      ],
      quizzes: [],
    },
    {
      id: 'prin-cruz',
      name: tr('Paso 4: cruz amarilla', 'Step 4: yellow cross'),
      description: doc(
        [
          '**Meta:** una cruz amarilla arriba. Cuentan solo las 4 aristas amarillas: ignora esquinas y colores de los lados.',
          "Un algoritmo, `F R U R' U' F'`, que haces 1, 2 o 3 veces según lo que veas:",
          '- **Línea:** sostenla horizontal (izquierda–derecha), 1 vez.',
          "- **L:** sostenla con las aristas atrás y a la izquierda, 2 veces seguidas. La `F'` y la `F` del medio se cancelan: `F R U R' U' R U R' U' F'`.",
          '- **Punto** (solo el centro): 1 vez, `U2` para dejar la L atrás-izquierda y 2 veces más.',
          '## Errores comunes',
          '- **Sostener mal la L o la línea:** la L mal puesta da otra L o una línea vertical; la línea vertical da el punto. No se rompe nada: mira la forma nueva, gira `U` y sigue.',
          '- **Contar esquinas:** cuentan solo las aristas, las del medio de cada borde.',
          '- **Ver 1 o 3 aristas amarillas:** girando caras es imposible. Revisa que cuentas solo aristas; si es así, una pieza quedó volteada: sácala, ponla al revés y empieza de nuevo.',
        ],
        [
          '**Goal:** a yellow cross on top. Only the 4 yellow edges count: ignore corners and side colors.',
          "One algorithm, `F R U R' U' F'`, that you do 1, 2 or 3 times depending on what you see:",
          '- **Line:** hold it horizontal (left–right), 1 time.',
          "- **L:** hold it with the edges at the back and on the left, 2 times in a row. The `F'` and `F` in the middle cancel: `F R U R' U' R U R' U' F'`.",
          '- **Dot** (only the center): 1 time, `U2` to leave the L at back-left, and 2 more times.',
          '## Common mistakes',
          '- **Holding the L or the line wrong:** a misplaced L gives another L or a vertical line; the vertical line gives the dot. Nothing breaks: look at the new shape, turn `U` and continue.',
          '- **Counting corners:** only edges count, the ones in the middle of each side.',
          '- **Seeing 1 or 3 yellow edges:** it is impossible by turning faces. Check that you count only edges; if so, a piece got flipped: take it out, put it in the other way and start over.',
        ],
      ),
      diagram: 'top',
      groups: [{ id: 'prin-cruz-formas', name: tr('Formas amarillas', 'Yellow shapes'), description: tr('Mira solo las aristas amarillas de arriba.', 'Look only at the yellow edges on top.'), cases: yellowCross }],
      quizzes: [],
    },
    {
      id: 'prin-aristas',
      name: tr('Paso 5: aristas amarillas', 'Step 5: yellow edges'),
      description: doc(
        [
          '**Meta:** cada arista amarilla junto al centro de su color, sin perder la cruz.',
          'Gira `U` hasta que coincidan al menos 2 aristas: siempre se puede. Si coinciden las 4, pasa al siguiente paso.',
          "El algoritmo es `R U R' U R U2 R' U`: cambia las aristas de adelante y de la izquierda.",
          '- **Dos vecinas bien:** déjalas atrás y a la derecha, y hazlo 1 vez.',
          '- **Dos opuestas bien:** hazlo 1 vez y quedan dos vecinas. Gira `U` hasta que coincidan, gira todo el cubo para dejarlas atrás y a la derecha, y hazlo otra vez.',
          '## Errores comunes',
          '- **Sostener las vecinas en otro lado:** siempre atrás y a la derecha; desde otro lado cambia otras aristas.',
          '- **Mirar las esquinas:** aquí no importan; se arreglan en los dos pasos siguientes.',
          '- **Olvidar la `U` final:** es parte del algoritmo.',
        ],
        [
          '**Goal:** each yellow edge next to the center of its color, without losing the cross.',
          'Turn `U` until at least 2 edges match: it is always possible. If all 4 match, go to the next step.',
          "The algorithm is `R U R' U R U2 R' U`: it swaps the front and left edges.",
          '- **Two adjacent edges correct:** leave them at the back and on the right, and do it 1 time.',
          '- **Two opposite edges correct:** do it 1 time and two adjacent are left. Turn `U` until they match, rotate the whole cube to put them at the back and on the right, and do it once more.',
          '## Common mistakes',
          '- **Holding the adjacent ones elsewhere:** always back and right; from another side it swaps other edges.',
          '- **Looking at the corners:** they don\'t matter here; they get fixed in the next two steps.',
          '- **Forgetting the final `U`:** it is part of the algorithm.',
        ],
      ),
      diagram: 'top',
      groups: [{ id: 'prin-aristas-casos', name: tr('Aristas que coinciden', 'Matching edges'), description: tr('Gira `U` hasta que coincidan 2 y mira dónde están.', 'Turn `U` until 2 match and see where they are.'), cases: yellowEdges }],
      quizzes: [],
    },
    {
      id: 'prin-esquinas',
      name: tr('Paso 6: esquinas amarillas a su lugar', 'Step 6: yellow corners into place'),
      description: doc(
        [
          '**Meta:** cada esquina amarilla en su sitio, aunque esté girada. Está en su sitio si sus 3 colores son los de los 3 centros que la rodean, en cualquier orden.',
          "El algoritmo es `U R U' L' U R' U' L`: deja quieta la esquina de adelante-derecha y mueve las otras 3 en sentido antihorario (desde arriba). No toca las aristas.",
          '1. Busca una esquina en su sitio y gira todo el cubo (amarillo arriba) para dejarla adelante a la derecha.',
          '2. Hazlo 1 vez. Si las otras 3 no quedaron en su sitio, otra vez.',
          '- **Ninguna en su sitio:** hazlo 1 vez desde cualquier lado. Queda una en su sitio; sigue desde el punto 1.',
          '- **Las 4 en su sitio:** pasa al último paso.',
          '## Errores comunes',
          '- **Fijarte en el amarillo:** aquí solo importa el lugar; el amarillo se arregla en el último paso.',
          '- **Girar `U` para acomodar:** las aristas ya están bien. Para cambiar de ángulo, gira todo el cubo.',
        ],
        [
          '**Goal:** each yellow corner in its spot, even if twisted. It is in its spot if its 3 colors are those of the 3 centers around it, in any order.',
          "The algorithm is `U R U' L' U R' U' L`: it keeps the front-right corner still and moves the other 3 counterclockwise (seen from above). It doesn't touch the edges.",
          '1. Find a corner in its spot and rotate the whole cube (yellow on top) to put it at the front right.',
          '2. Do it 1 time. If the other 3 didn\'t end up in place, once more.',
          '- **None in place:** do it 1 time from any side. One ends up in place; continue from point 1.',
          '- **All 4 in place:** go to the last step.',
          '## Common mistakes',
          '- **Looking at the yellow:** only the position matters here; the yellow gets fixed in the last step.',
          '- **Turning `U` to adjust:** the edges are already right. To change angle, rotate the whole cube.',
        ],
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-esquinas-una', name: tr('Una ya en su sitio', 'One already in place'), description: tr('Ponla adelante a la derecha.', 'Put it at the front right.'), cases: oneHome },
        { id: 'prin-esquinas-ninguna', name: tr('Ninguna en su sitio', 'None in place'), description: tr('Una vez desde cualquier lado, y sigues como arriba.', 'Once from any side, then continue as above.'), cases: noneHome },
      ],
      quizzes: [],
    },
    {
      id: 'prin-orientar',
      name: tr('Paso 7: orientar las esquinas', 'Step 7: orient the corners'),
      description: doc(
        [
          '**Meta:** amarillo arriba en las 4 esquinas. El cubo queda resuelto.',
          "Un bloque, `R' D' R D`, sobre la esquina de adelante-derecha:",
          '- **Amarillo a la derecha:** 2 veces.',
          '- **Amarillo al frente:** 4 veces.',
          '## Cómo se hace',
          '1. Sostén el cubo con amarillo arriba y una esquina girada adelante a la derecha. Desde aquí, **no gires más el cubo**.',
          "2. Repite `R' D' R D` hasta que el amarillo de esa esquina quede arriba.",
          '3. Gira solo `U` para traer la siguiente esquina girada a adelante-derecha, y repite.',
          '4. Con el amarillo arriba en las 4, gira `U` para alinear la capa: cubo resuelto.',
          '## Se desarma, y es normal',
          'A mitad del paso, las dos primeras capas se ven rotas. **No te detengas ni intentes arreglarlas:** se arreglan solas con la última esquina.',
          'Los casos (U, T, L, Sune, Antisune, Pi y H) tienen el nombre de los mismos casos del OLL del CFOP, donde cada uno tiene un algoritmo más corto.',
          '## Errores comunes',
          '- **Girar el cubo entre esquinas:** las capas ya no se arreglan. Entre esquinas, solo `U`.',
          "- **Parar a mitad de un bloque:** cuenta bloques completos de `R' D' R D`.",
          '- **Mirar los lados de arriba:** se ven desordenados. Mira solo el amarillo de la esquina de adelante-derecha.',
        ],
        [
          '**Goal:** yellow on top on all 4 corners. The cube ends up solved.',
          "One block, `R' D' R D`, on the front-right corner:",
          '- **Yellow facing right:** 2 times.',
          '- **Yellow facing front:** 4 times.',
          '## How to do it',
          '1. Hold the cube with yellow on top and a twisted corner at the front right. From here on, **don\'t rotate the cube anymore**.',
          "2. Repeat `R' D' R D` until the yellow of that corner is on top.",
          '3. Turn only `U` to bring the next twisted corner to the front right, and repeat.',
          '4. With yellow on top on all 4, turn `U` to align the layer: cube solved.',
          '## It falls apart, and that\'s normal',
          'Midway through the step, the first two layers look broken. **Don\'t stop or try to fix them:** they fix themselves with the last corner.',
          'The cases (U, T, L, Sune, Antisune, Pi and H) are named after the same OLL cases in CFOP, where each one has a shorter algorithm.',
          '## Common mistakes',
          '- **Rotating the cube between corners:** the layers won\'t fix themselves. Between corners, only `U`.',
          "- **Stopping in the middle of a block:** count full blocks of `R' D' R D`.",
          '- **Looking at the top sides:** they look scrambled. Look only at the yellow of the front-right corner.',
        ],
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-orientar-dos', name: tr('Dos esquinas giradas', 'Two corners twisted'), cases: twistTwo },
        { id: 'prin-orientar-tres', name: tr('Tres esquinas giradas', 'Three corners twisted'), cases: twistThree },
        { id: 'prin-orientar-cuatro', name: tr('Cuatro esquinas giradas', 'Four corners twisted'), cases: twistFour },
      ],
      quizzes: [],
    },
  ],
};

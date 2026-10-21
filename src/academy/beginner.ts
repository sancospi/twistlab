// "Método principiante": capa por capa, for someone who has never solved a cube. The white cross is its own guide
// (crossGuide.ts); this method starts at the white corners. Every algorithm is the beginner's full sequence, with its
// repetitions written out; cfop.validate.test.ts checks each one in the simulator. Case ids: 'prin-<phase>-<slug>'.
import type { Localized } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

const es = (text: string): Localized => ({ es: text });
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
  name: string;
  recognition: string;
  alg: string;
  alt?: [alg: string, note: string]; // a shorter or easier way, when it is worth knowing
  note?: string;
}

function kase(r: Row): Case {
  const algs: Case['algs'] = [{ id: 'main', alg: r.alg, source: 'community' }];
  if (r.alt) algs.push({ id: 'alt', alg: r.alt[0], source: 'community', note: es(r.alt[1]) });
  return {
    id: `prin-${r.phase}-${r.slug}`,
    code: r.code,
    name: es(r.name),
    recognition: es(r.recognition),
    stage: r.stage,
    algs,
    setup: invertTokens(centerMoves(r.alg, IDENTITY)).join(' '), // face turns: undoes rotations too
    scdb: null,
    ...(r.note ? { note: es(r.note) } : {}),
  };
}

const capa1 = (slug: string, code: string, name: string, recognition: string, alg: string, alt?: Row['alt'], note?: string) =>
  kase({ phase: 'capa1', slug, stage: 'first-layer', code, name, recognition, alg, alt, note });

const cornerUp = [
  capa1('blanco-derecha', 'Derecha', 'Blanco a la derecha', 'Blanco-verde-naranja arriba adelante-derecha, blanco a la derecha',
    TRIGGER, undefined, "El gatillo 1 vez. La U' final no toca la primera capa: R U R' también basta."),
  capa1('blanco-arriba', 'Arriba', 'Blanco arriba', 'Blanco-verde-naranja arriba adelante-derecha, blanco arriba',
    times(TRIGGER, 3), ["R U2 R' U' R U R'", 'Más corta: R U2 R\' saca el blanco de arriba y U\' R U R\' la baja.']),
  capa1('blanco-frente', 'Frente', 'Blanco al frente', 'Blanco-verde-naranja arriba adelante-derecha, blanco al frente',
    times(TRIGGER, 5), ["U R U' R'", 'El gatillo al revés, 1 vez: hace lo mismo que 5 gatillos.']),
];
const cornerDown = [
  capa1('girada-derecha', 'Abajo, derecha', 'En su sitio, blanco a la derecha', 'Blanco-verde-naranja en su sitio abajo, pero con el blanco a la derecha',
    times(TRIGGER, 2)),
  capa1('girada-frente', 'Abajo, frente', 'En su sitio, blanco al frente', 'Blanco-verde-naranja en su sitio abajo, pero con el blanco al frente',
    times(TRIGGER, 4), ["U R U' R' U R U' R'", 'El gatillo al revés, 2 veces: hace lo mismo que 4 gatillos.']),
  capa1('otra-ranura', 'Otro sitio', 'En el sitio de otra',
    'Blanco-verde-naranja abajo adelante-izquierda, blanco al frente; la blanco-verde-roja arriba adelante-izquierda, blanco al frente',
    `y' ${TRIGGER} y U' ${TRIGGER}`, undefined,
    "Con y' ese sitio (el de la blanco-verde-roja) queda adelante-derecha: un gatillo saca la blanco-verde-naranja y mete la blanco-verde-roja. Vuelve con y, U' la deja encima de su sitio y otro gatillo la baja."),
];

const capa2 = (slug: string, code: string, name: string, recognition: string, alg: string, note?: string) =>
  kase({ phase: 'capa2', slug, stage: 'second-layer', code, name, recognition, alg, note });

const edgeUp = [
  capa2('derecha', 'Derecha', 'Inserción a la derecha', 'Verde-naranja arriba al frente: verde al frente, naranja arriba', RIGHT),
  capa2('izquierda', 'Izquierda', 'Inserción a la izquierda', 'Verde-roja arriba al frente: verde al frente, rojo arriba', LEFT),
];
const edgeStuck = [
  capa2('volteada', 'Volteada', 'Atascada y volteada', 'Verde-naranja en su sitio pero volteada: naranja al frente, verde a la derecha',
    "U R U' R' U' F' U F U' R U' R' U' F' U F",
    "Dos inserciones a la derecha: la primera saca la arista. Entre las dos va U2, que se junta con la U inicial de la segunda y queda U'."),
  capa2('otra-ranura', 'Otra ranura', 'Atascada en la ranura de la izquierda',
    'Verde-naranja en la ranura adelante-izquierda, naranja al frente; la verde-roja arriba al frente, rojo arriba',
    "U' L' U L U F U' F' U' R U' R' U' F' U F",
    "La inserción a la izquierda mete la verde-roja y saca la verde-naranja. Luego U2 y la inserción a la derecha (U2 se junta con su U inicial y queda U')."),
];

const yellowCross = [
  kase({ phase: 'cruz', slug: 'linea', stage: 'oll-cross', code: 'Línea', name: 'Línea', recognition: 'Línea amarilla horizontal (izquierda–derecha)',
    alg: CROSS }),
  kase({ phase: 'cruz', slug: 'l', stage: 'oll-cross', code: 'L', name: 'L', recognition: 'Aristas amarillas atrás y a la izquierda', alg: CROSS_TWICE,
    note: "El algoritmo 2 veces seguidas; la F' del final de la primera y la F del comienzo de la segunda se cancelan. La primera vez deja la línea horizontal." }),
  kase({ phase: 'cruz', slug: 'punto', stage: 'oll-cross', code: 'Punto', name: 'Punto', recognition: 'Solo el centro amarillo; ninguna arista amarilla arriba',
    alg: `${CROSS} U2 ${CROSS_TWICE}`, note: 'Una vez deja una L adelante-derecha; U2 la pasa atrás-izquierda y sigues como la L: 2 veces más.' }),
];

const yellowEdges = [
  kase({ phase: 'aristas', slug: 'vecinas', stage: 'll-edges', code: 'Vecinas', name: 'Dos vecinas bien',
    recognition: 'Coinciden la de la derecha (naranja) y la de atrás (azul); adelante hay roja y a la izquierda verde', alg: SUNE }),
  kase({ phase: 'aristas', slug: 'opuestas', stage: 'll-edges', code: 'Opuestas', name: 'Dos opuestas bien',
    recognition: 'Coinciden la de la derecha (naranja) y la de la izquierda (roja); adelante hay azul y atrás verde',
    alg: "R U R' U R U2 R' U2 y R U R' U R U2 R' U",
    note: 'El algoritmo 1 vez deja dos vecinas bien. Una U más las alinea (se junta con la U final: U2) y quedan atrás y a la izquierda; la rotación y las deja atrás y a la derecha, y repites el algoritmo.' }),
];

const placeCorners = (slug: string, code: string, name: string, recognition: string, alg: string, alt?: Row['alt'], note?: string) =>
  kase({ phase: 'esquinas', slug, stage: 'll-corners-placed', code, name, recognition, alg, alt, note });

const oneHome = [
  placeCorners('antihorario', 'Antihorario', 'Una en su sitio, 1 vez',
    'Adelante-derecha en su sitio; las otras 3 giran en sentido antihorario: la de atrás-derecha (roja-azul) va atrás-izquierda', CYCLE),
  placeCorners('horario', 'Horario', 'Una en su sitio, 2 veces',
    'Adelante-derecha en su sitio; las otras 3 giran en sentido horario: la de atrás-izquierda (naranja-azul) va atrás-derecha', times(CYCLE, 2),
    ["L' U R U' L U R' U'", 'El algoritmo al revés, 1 vez: hace lo mismo que 2 veces.']),
];
const noneHome = [
  placeCorners('parejas', 'Parejas', 'Ninguna: cambiadas por parejas', 'Ninguna en su sitio: las 2 de la derecha cambiadas entre sí, y las 2 de la izquierda también',
    `${CYCLE} y' ${CYCLE}`, undefined, "1 vez desde aquí deja una en su sitio; con y' queda adelante-derecha y 1 vez más termina."),
  placeCorners('diagonal', 'Diagonal', 'Ninguna: cambiadas en diagonal', 'Ninguna en su sitio: cada esquina va al sitio opuesto en diagonal',
    `${CYCLE} y ${CYCLE}`, undefined, '1 vez desde aquí deja una en su sitio; con y queda adelante-derecha y 1 vez más termina.'),
];

const twist = (slug: string, code: string, name: string, recognition: string, alg: string) =>
  kase({ phase: 'orientar', slug, stage: 'll-corners-twist', code, name, recognition, alg });

const twistTwo = [
  twist('u', 'U', 'Faros: dos vecinas mirando al mismo lado', 'Adelante-derecha y atrás-derecha giradas, las dos con amarillo a la derecha',
    `${TWIST2} U ${TWIST4} U'`),
  twist('t', 'T', 'Dos vecinas mirando hacia afuera', 'Adelante-derecha con amarillo al frente y atrás-derecha con amarillo atrás',
    `${TWIST4} U ${TWIST2} U'`),
  twist('l', 'L', 'Dos en diagonal', 'Adelante-derecha con amarillo al frente y atrás-izquierda con amarillo a la izquierda',
    `${TWIST4} U2 ${TWIST2} U2`),
];
const twistThree = [
  twist('antisune', 'Antisune', 'Tres, 2 veces cada una',
    'Adelante-izquierda bien; amarillo a la derecha en adelante-derecha, atrás en atrás-derecha y a la izquierda en atrás-izquierda',
    `${TWIST2} U ${TWIST2} U ${TWIST2} U2`),
  twist('sune', 'Sune', 'Tres, 4 veces cada una',
    'Adelante-izquierda bien; amarillo al frente en adelante-derecha, a la derecha en atrás-derecha y atrás en atrás-izquierda',
    `${TWIST4} U ${TWIST4} U ${TWIST4} U2`),
];
const twistFour = [
  twist('pi', 'Pi', 'Cuatro: faros adelante', 'Las 4 giradas: las 2 de adelante con amarillo al frente, atrás-derecha a la derecha y atrás-izquierda a la izquierda',
    `${TWIST4} U ${TWIST4} U ${TWIST2} U ${TWIST2} U`),
  twist('h', 'H', 'Cuatro: faros adelante y atrás', 'Las 4 giradas: las 2 de adelante con amarillo al frente y las 2 de atrás con amarillo atrás',
    `${TWIST4} U ${TWIST2} U ${TWIST4} U ${TWIST2} U`),
];

export const beginner: Method = {
  id: 'principiante',
  name: es('Método principiante'),
  summary: es('Tu primer cubo resuelto: capa por capa, con 7 secuencias cortas que se repiten.'),
  description: es(
    [
      'El método para resolver el cubo por primera vez. Lo armas **capa por capa**: primero la de abajo (blanca), luego la del medio y al final la de arriba (amarilla).',
      'Solo necesitas **7 secuencias cortas**, y casi todas se repiten: el truco está en saber desde dónde hacerlas y cuántas veces.',
      '## Los pasos',
      '1. **Cruz blanca.** Tiene su propia guía, «La cruz blanca» (el enlace «Paso previo» de arriba). Para empezar te basta la lección «Casos de una arista»: pon las aristas de una en una, mirando, sin importar cuántos giros uses. Planear en la inspección y bajar a 8 giros queda para el CFOP.',
      '2. **Esquinas blancas.** Completan la primera capa.',
      '3. **Segunda capa.** Las 4 aristas de la capa del medio.',
      '4. **Cruz amarilla.** Las aristas amarillas hacia arriba.',
      '5. **Aristas amarillas.** Cada una junto a su centro.',
      '6. **Esquinas amarillas a su lugar.** Cada una en su sitio, aunque esté girada.',
      '7. **Orientar las esquinas.** El amarillo hacia arriba: cubo resuelto.',
      '## Cuánto tardas en aprenderlo',
      'Con 20–30 min al día, tu primer cubo resuelto suele llegar en **1 o 2 semanas**.',
      '- Aprende un paso por sesión, en orden. No pases al siguiente hasta hacerlo sin mirar la guía.',
      '- **Si te pierdes:** busca el último paso que sigue completo (la cruz, la primera capa…) y retoma desde el siguiente. No hace falta volver a empezar.',
      '- Tu primera resolución completa puede tardar 5 minutos o más. Con práctica bajarás a 1 o 2 minutos.',
      '- Cuando lo resuelvas sin mirar ninguna guía, sigue con el **CFOP reducido**: cambia estos pasos por otros más rápidos.',
    ].join('\n'),
  ),
  orientation: es(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente.** Así, el naranja queda a la derecha.',
      'Todas las mezclas parten del cubo resuelto en esa posición, y los casos usan las piezas de adelante a la derecha.',
      'En una resolución real, gira todo el cubo, siempre con el amarillo arriba (`y`), hasta que lo que vas a resolver quede como en el caso, y aplica la misma secuencia. Solo en el último paso no se gira el cubo.',
    ].join('\n'),
  ),
  notation: es(
    [
      '## Movimientos',
      '- Cada letra es una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente y `B` atrás.',
      '- `R`, `L`, `U`, `D`, `F` y `B` giran una cara en sentido horario, mirándola de frente.',
      "- Con apóstrofo el giro es antihorario (`R'`); con 2 es media vuelta (`U2`).",
      '- `D` es la cara de abajo: su sentido horario es el que ves mirándola desde abajo.',
      "- `y` gira todo el cubo como `U`, y `y'` como `U'`. No mueve ninguna pieza: solo cambia qué cara tienes al frente.",
      '## Bloques',
      "Las secuencias se arman con bloques cortos que se repiten, como `R U R' U'` (el **gatillo**), `R' D' R D` o `F R U R' U' F'`.",
      'Ejecuta **cada bloque como un solo gesto** y cuenta repeticiones, no giros.',
      'Las mezclas solo preparan el caso: no hace falta memorizarlas.',
      '## Figuras',
      '- **Primera y segunda capa:** ves el cubo desde arriba-adelante-derecha. Lo que no importa está en gris.',
      '- **Última capa:** ves la cara amarilla desde arriba, con el frente abajo. Las barritas alrededor son las pegatinas laterales de la capa superior.',
      '- **Esquinas a su lugar:** las flechas indican a dónde va cada pieza.',
    ].join('\n'),
  ),
  phases: [
    {
      id: 'prin-capa1',
      name: es('Paso 2: esquinas blancas'),
      description: es(
        [
          '**Meta:** las 4 esquinas blancas en su sitio. Con la cruz completan la primera capa: la cara blanca abajo y, en cada lado, la fila de abajo de un solo color.',
          'Cada esquina blanca va entre los centros de sus otros dos colores: la blanco-verde-naranja, abajo entre el verde y el naranja.',
          '## Una sola secuencia: el gatillo',
          "Todo el paso se hace con `R U R' U'`. Cada repetición pasa la esquina de adelante-derecha entre arriba y abajo y la gira: repítelo hasta que entre bien.",
          'No rompe nada: la cruz no se mueve y, con 6 repeticiones, el cubo vuelve a como estaba.',
          '## Cómo se hace',
          '1. Busca arriba una esquina con blanco y lee sus otros dos colores.',
          '2. Gira `U` hasta dejarla encima de su sitio. Gira todo el cubo, con el amarillo arriba, para que ese sitio quede adelante a la derecha.',
          "3. Repite `R U R' U'` hasta que entre con el blanco abajo: 1 vez si el blanco mira a la derecha, 3 si mira arriba y 5 si mira al frente.",
          'Si una esquina blanca está abajo pero girada, o en el sitio de otra, ponla adelante a la derecha y sácala con un gatillo. Después sigue con ella desde arriba.',
          '## Errores comunes',
          '- **Cortar el gatillo a la mitad:** haz siempre los 4 giros y cuenta repeticiones completas.',
          '- **Bajarla en el sitio equivocado:** antes de empezar, compara sus 2 colores con los centros de los lados.',
          '- **Girar el cubo entre repeticiones:** la esquina se queda adelante a la derecha hasta que entre.',
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'prin-capa1-arriba',
          name: es('Esquina arriba, encima de su sitio'),
          description: es('Cuenta gatillos según dónde mira el blanco: a la derecha 1, arriba 3, al frente 5.'),
          cases: cornerUp,
        },
        {
          id: 'prin-capa1-abajo',
          name: es('Esquina abajo, mal puesta'),
          description: es('Ya está abajo, pero girada o en el sitio de otra.'),
          cases: cornerDown,
        },
      ],
      quizzes: [],
    },
    {
      id: 'prin-capa2',
      name: es('Paso 3: segunda capa'),
      description: es(
        [
          '**Meta:** las 4 aristas de la capa del medio. Con eso, las dos primeras capas quedan resueltas.',
          'Son las aristas **sin amarillo**: verde-naranja, naranja-azul, azul-roja y roja-verde.',
          '## Cómo se hace',
          '1. Busca arriba una arista sin amarillo.',
          '2. Gira `U` hasta que su color de lado coincida con el centro de ese lado. Gira todo el cubo, con el amarillo arriba, para tenerla al frente.',
          '3. Mira su color de **arriba**: si es el del centro derecho, va a la derecha; si es el del izquierdo, a la izquierda.',
          "4. Haz la inserción hacia ese lado: a la derecha `U R U' R' U' F' U F`, a la izquierda `U' L' U L U F U' F'`. Son espejo una de la otra.",
          '## Si no hay ninguna arriba',
          'Si todas las aristas de arriba tienen amarillo y aún falta alguna, está **atascada** en la capa del medio: volteada o en el sitio de otra.',
          'Gira todo el cubo para dejar la atascada adelante a la derecha y haz la inserción a la derecha con cualquier arista de arriba: eso la saca. Después la insertas bien, como cualquier otra.',
          '## Errores comunes',
          '- **Usar una arista con amarillo:** esas son de la última capa; déjalas arriba.',
          '- **Elegir el lado por el color del frente:** el lado lo decide el color de arriba.',
          '- **Insertar sin alinear:** primero su color de lado debe coincidir con el centro.',
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        { id: 'prin-capa2-arriba', name: es('Arista arriba'), description: es('Alinéala con su centro al frente y mira el color de arriba.'), cases: edgeUp },
        { id: 'prin-capa2-atascada', name: es('Arista atascada'), description: es('Sácala con una inserción y luego insértala bien.'), cases: edgeStuck },
      ],
      quizzes: [],
    },
    {
      id: 'prin-cruz',
      name: es('Paso 4: cruz amarilla'),
      description: es(
        [
          '**Meta:** una cruz amarilla arriba. Solo cuentan las 4 aristas amarillas de arriba: ignora las esquinas y los colores de los lados.',
          "Un solo algoritmo, `F R U R' U' F'`, que haces 1, 2 o 3 veces según lo que veas arriba:",
          '- **Línea:** sostenla horizontal (izquierda–derecha) y hazlo 1 vez.',
          "- **L:** sostenla con sus aristas atrás y a la izquierda, y hazlo 2 veces seguidas. La `F'` y la `F` del medio se cancelan: queda `F R U R' U' R U R' U' F'`.",
          '- **Punto** (solo el centro): hazlo 1 vez, gira `U2` para dejar la L atrás-izquierda y hazlo 2 veces más.',
          '## Errores comunes',
          '- **Sostener mal la L o la línea:** con la L mal puesta te devuelve otra L o una línea vertical; con la línea vertical, el punto. No se rompe nada: mira la forma nueva, gira `U` para sostenerla bien y sigue.',
          '- **Contar esquinas:** solo cuentan las aristas, las del medio de cada borde.',
          '- **Ver 1 o 3 aristas amarillas:** girando caras es imposible. Revisa que cuentas solo aristas; si es así, alguien sacó una pieza del cubo y la puso volteada: sácala, ponla al revés y empieza de nuevo.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [{ id: 'prin-cruz-formas', name: es('Formas amarillas'), description: es('Mira solo las aristas amarillas de arriba.'), cases: yellowCross }],
      quizzes: [],
    },
    {
      id: 'prin-aristas',
      name: es('Paso 5: aristas amarillas'),
      description: es(
        [
          '**Meta:** cada arista amarilla junto al centro de su color, sin perder la cruz.',
          'Gira `U` hasta que al menos 2 aristas coincidan con sus centros: siempre se puede. Si coinciden las 4, pasa al siguiente paso.',
          "El algoritmo es `R U R' U R U2 R' U`: cambia de lugar las aristas de adelante y de la izquierda.",
          '- **Dos vecinas bien:** sostenlas atrás y a la derecha, y hazlo 1 vez.',
          '- **Dos opuestas bien:** hazlo 1 vez desde ahí y quedan dos vecinas bien. Gira `U` hasta que coincidan, gira el cubo para dejarlas atrás y a la derecha, y hazlo otra vez.',
          '## Errores comunes',
          '- **Sostener las vecinas en otro lado:** siempre atrás y a la derecha. Desde otro lado, el algoritmo cambia otras aristas.',
          '- **Mirar las esquinas:** en este paso no importan; se arreglan en los dos siguientes.',
          '- **Olvidar la `U` final:** es parte del algoritmo.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [{ id: 'prin-aristas-casos', name: es('Aristas que coinciden'), description: es('Gira `U` hasta que coincidan 2 y mira dónde están.'), cases: yellowEdges }],
      quizzes: [],
    },
    {
      id: 'prin-esquinas',
      name: es('Paso 6: esquinas amarillas a su lugar'),
      description: es(
        [
          '**Meta:** cada esquina amarilla en su sitio, aunque esté girada. Está en su sitio si sus 3 colores son los de los 3 centros que la rodean, en cualquier orden.',
          "El algoritmo es `U R U' L' U R' U' L`: deja quieta la esquina de adelante-derecha y mueve las otras 3 en sentido antihorario, vistas desde arriba. No toca las aristas.",
          '1. Busca una esquina que ya esté en su sitio y gira todo el cubo, con amarillo arriba, para dejarla adelante a la derecha.',
          '2. Hazlo 1 vez. Si las otras 3 no quedaron en su sitio, hazlo otra vez.',
          '- **Ninguna en su sitio:** hazlo 1 vez desde cualquier lado. Queda una en su sitio y sigues desde el punto 1.',
          '- **Las 4 en su sitio:** pasa al último paso.',
          '## Errores comunes',
          '- **Fijarte en el amarillo:** aquí solo importa el lugar; el amarillo se arregla en el último paso.',
          '- **Girar `U` para acomodar:** las aristas ya están bien. Para cambiar de ángulo, gira todo el cubo.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-esquinas-una', name: es('Una ya en su sitio'), description: es('Ponla adelante a la derecha.'), cases: oneHome },
        { id: 'prin-esquinas-ninguna', name: es('Ninguna en su sitio'), description: es('Una vez desde cualquier lado, y sigues como arriba.'), cases: noneHome },
      ],
      quizzes: [],
    },
    {
      id: 'prin-orientar',
      name: es('Paso 7: orientar las esquinas'),
      description: es(
        [
          '**Meta:** el amarillo arriba en las 4 esquinas. Con eso, el cubo queda resuelto.',
          "Un solo bloque, `R' D' R D`, sobre la esquina de adelante-derecha:",
          '- **Amarillo a la derecha:** 2 veces.',
          '- **Amarillo al frente:** 4 veces.',
          '## Cómo se hace',
          '1. Sostén el cubo con amarillo arriba y una esquina girada adelante a la derecha. Desde aquí, **no vuelvas a girar el cubo**.',
          "2. Repite `R' D' R D` hasta que el amarillo de esa esquina quede arriba: 2 o 4 veces.",
          '3. Gira solo `U` para traer la siguiente esquina girada a adelante-derecha, y repite.',
          '4. Cuando las 4 tengan el amarillo arriba, gira `U` hasta alinear la capa: cubo resuelto.',
          '## Las capas de abajo se desarman, y es normal',
          'A mitad del paso, las dos primeras capas se ven rotas. **No te detengas ni intentes arreglarlas:** se arreglan solas cuando la última esquina queda con el amarillo arriba.',
          'Los nombres de los casos (U, T, L, Sune, Antisune, Pi y H) son los de los mismos casos en el OLL del CFOP, donde cada uno tiene un algoritmo más corto.',
          '## Errores comunes',
          '- **Girar el cubo entre esquinas:** las capas desarmadas ya no se arreglan. Entre esquinas, solo `U`.',
          "- **Parar a mitad de un bloque:** cuenta bloques completos de `R' D' R D`.",
          '- **Mirar los lados de arriba:** mientras giras esquinas, la capa de arriba se ve desordenada. Solo mira el amarillo de la esquina de adelante-derecha.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-orientar-dos', name: es('Dos esquinas giradas'), cases: twistTwo },
        { id: 'prin-orientar-tres', name: es('Tres esquinas giradas'), cases: twistThree },
        { id: 'prin-orientar-cuatro', name: es('Cuatro esquinas giradas'), cases: twistFour },
      ],
      quizzes: [],
    },
  ],
};

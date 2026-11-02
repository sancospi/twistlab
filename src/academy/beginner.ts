// "Método principiante": capa por capa, for someone who has never solved a cube. The white cross is the article's step 1
// (howToSolve.ts, then crossGuide.ts to practise it); this method starts at the white corners. Every algorithm is the beginner's full sequence, with its
// repetitions written out; cfop.validate.test.ts checks each one in the simulator. Case ids: 'prin-<phase>-<slug>'.
import { doc, tr, word, type Localized } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import type { Case, Method, Stage } from './types.ts';

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
  capa1('blanco-derecha', word('Derecha', 'Right', 'Direita'),
    tr('Blanco a la derecha', 'White facing right', 'Branco para a direita'),
    tr('Esquina blanco-verde-naranja arriba, adelante a la derecha, con el blanco a la derecha', 'White-green-orange corner at top front-right, white facing right', 'Quina branco-verde-laranja em cima, na frente à direita, com o branco para a direita'),
    TRIGGER, undefined,
    tr("Con un gatillo basta. La `U'` del final no toca la capa de abajo, así que `R U R'` también sirve.", "One trigger is enough. The final `U'` doesn't touch the bottom layer, so `R U R'` works too.", "Um gatilho basta. O `U'` do final não mexe na camada de baixo, então `R U R'` também serve.")),
  capa1('blanco-arriba', word('Arriba', 'Up', 'Em cima'),
    tr('Blanco arriba', 'White facing up', 'Branco para cima'),
    tr('Esquina blanco-verde-naranja arriba, adelante a la derecha, con el blanco arriba', 'White-green-orange corner at top front-right, white facing up', 'Quina branco-verde-laranja em cima, na frente à direita, com o branco para cima'),
    times(TRIGGER, 3), ["R U2 R' U' R U R'", tr("Más corta: `R U2 R'` deja la esquina con el blanco de lado, y `U' R U R'` la baja.", "Shorter: `R U2 R'` leaves the corner with white facing sideways, and `U' R U R'` brings it down.", "Mais curta: `R U2 R'` deixa a quina com o branco de lado, e `U' R U R'` a desce.")]),
  capa1('blanco-frente', word('Frente', 'Front', 'Frente'),
    tr('Blanco al frente', 'White facing front', 'Branco para a frente'),
    tr('Esquina blanco-verde-naranja arriba, adelante a la derecha, con el blanco al frente', 'White-green-orange corner at top front-right, white facing front', 'Quina branco-verde-laranja em cima, na frente à direita, com o branco para a frente'),
    times(TRIGGER, 5), ["U R U' R'", tr('Es el gatillo al revés: hace lo mismo que 5 gatillos, con solo 4 giros.', "It's the trigger backwards: it does the same as 5 triggers, in just 4 moves.", 'É o gatilho ao contrário: faz o mesmo que 5 gatilhos, em apenas 4 movimentos.')]),
];
const cornerDown = [
  capa1('girada-derecha', word('Abajo, derecha', 'Bottom, right', 'Embaixo, direita'),
    tr('En su sitio, blanco a la derecha', 'In place, white facing right', 'No lugar, branco para a direita'),
    tr('Esquina blanco-verde-naranja abajo, en su sitio, pero con el blanco a la derecha', 'White-green-orange corner at the bottom, in its place, but with white facing right', 'Quina branco-verde-laranja embaixo, no seu lugar, mas com o branco para a direita'),
    times(TRIGGER, 2)),
  capa1('girada-frente', word('Abajo, frente', 'Bottom, front', 'Embaixo, frente'),
    tr('En su sitio, blanco al frente', 'In place, white facing front', 'No lugar, branco para a frente'),
    tr('Esquina blanco-verde-naranja abajo, en su sitio, pero con el blanco al frente', 'White-green-orange corner at the bottom, in its place, but with white facing front', 'Quina branco-verde-laranja embaixo, no seu lugar, mas com o branco para a frente'),
    times(TRIGGER, 4), ["U R U' R' U R U' R'", tr('Es el gatillo al revés, 2 veces: hace lo mismo que 4 gatillos.', "It's the trigger backwards, twice: it does the same as 4 triggers.", 'É o gatilho ao contrário, 2 vezes: faz o mesmo que 4 gatilhos.')]),
  capa1('otra-ranura', word('Otro sitio', 'Other spot', 'Outro lugar'),
    tr('En el sitio de otra', "In another corner's place", 'No lugar de outra'),
    tr('Esquina blanco-verde-naranja abajo, adelante a la izquierda, con el blanco al frente; esquina blanco-verde-roja justo encima, con el blanco al frente',
      'White-green-orange corner at bottom front-left, white facing front; white-green-red corner right above it, white facing front',
      'Quina branco-verde-laranja embaixo, na frente à esquerda, com o branco para a frente; quina branco-verde-vermelha logo acima, com o branco para a frente'),
    `y' ${TRIGGER} y U' ${TRIGGER}`, undefined,
    tr("Gira el cubo entero con `y'`: el sitio de la blanco-verde-roja queda adelante a la derecha. Un gatillo mete la blanco-verde-roja y saca la blanco-verde-naranja. Vuelve con `y`, gira `U'` para dejar la blanco-verde-naranja encima de su sitio y bájala con otro gatillo.",
      "Rotate the whole cube with `y'`: the white-green-red corner's place ends up at the front right. One trigger puts the white-green-red one in and takes the white-green-orange one out. Rotate back with `y`, turn `U'` to put the white-green-orange one above its place and bring it down with another trigger.",
      "Gire o cubo inteiro com `y'`: o lugar da branco-verde-vermelha fica na frente à direita. Um gatilho coloca a branco-verde-vermelha e tira a branco-verde-laranja. Volte com `y`, gire `U'` para deixar a branco-verde-laranja em cima do seu lugar e desça-a com outro gatilho.")),
];

const capa2 = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, note?: Localized) =>
  kase({ phase: 'capa2', slug, stage: 'second-layer', code, name, recognition, alg, note });

const edgeUp = [
  capa2('derecha', word('Derecha', 'Right', 'Direita'), tr('Va a la derecha', 'Goes to the right', 'Vai para a direita'),
    tr('Arista verde-naranja arriba adelante, con el verde al frente y el naranja arriba', 'Green-orange edge at top front, green facing front and orange facing up', 'Aresta verde-laranja em cima na frente, com o verde para a frente e o laranja para cima'), RIGHT),
  capa2('izquierda', word('Izquierda', 'Left', 'Esquerda'), tr('Va a la izquierda', 'Goes to the left', 'Vai para a esquerda'),
    tr('Arista verde-roja arriba adelante, con el verde al frente y el rojo arriba', 'Green-red edge at top front, green facing front and red facing up', 'Aresta verde-vermelha em cima na frente, com o verde para a frente e o vermelho para cima'), LEFT),
];
const edgeStuck = [
  capa2('volteada', word('Volteada', 'Flipped', 'Invertida'), tr('Atascada y volteada', 'Stuck and flipped', 'Presa e invertida'),
    tr('Arista verde-naranja en su sitio, pero volteada, con el naranja al frente y el verde a la derecha', 'Green-orange edge in its place but flipped, orange facing front and green facing right', 'Aresta verde-laranja no seu lugar, mas invertida, com o laranja para a frente e o verde para a direita'),
    "U R U' R' U' F' U F U' R U' R' U' F' U F",
    tr("Haz la secuencia a la derecha: la arista sale arriba. Gira `U2` y hazla otra vez. En la secuencia completa verás `U'` en el medio: es esa `U2` sumada a la `U` con que empieza la segunda vez.",
      "Do the sequence to the right: the edge comes out on top. Turn `U2` and do it again. In the full sequence you'll see `U'` in the middle: that's the `U2` plus the `U` that starts the second round.",
      "Faça a sequência para a direita: a aresta sai para cima. Gire `U2` e faça de novo. Na sequência completa, você vai ver `U'` no meio: é esse `U2` somado ao `U` com que a sequência começa na segunda vez.")),
  capa2('otra-ranura', word('Otra ranura', 'Other slot', 'Outro slot'), tr('Atascada en el sitio de la izquierda', 'Stuck in the left-hand place', 'Presa no lugar da esquerda'),
    tr('Arista verde-naranja en la capa del medio, adelante a la izquierda, con el naranja al frente; arista verde-roja arriba adelante, con el rojo arriba',
      'Green-orange edge in the middle layer at front left, orange facing front; green-red edge at top front, red facing up',
      'Aresta verde-laranja na camada do meio, na frente à esquerda, com o laranja para a frente; aresta verde-vermelha em cima na frente, com o vermelho para cima'),
    "U' L' U L U F U' F' U' R U' R' U' F' U F",
    tr("Aquí hay un atajo. Como la verde-roja ya está arriba adelante, la secuencia a la izquierda la mete y a la vez saca la verde-naranja. Luego gira `U2` y haz la secuencia a la derecha. En la secuencia completa, esa `U2` y la `U` con que empieza la secuencia a la derecha se ven juntas como `U'`.",
      "There's a shortcut here. Since the green-red edge is already at the top front, the sequence to the left puts it in and takes the green-orange one out at the same time. Then turn `U2` and do the sequence to the right. In the full sequence, that `U2` and the `U` that starts the sequence to the right combine into one `U'`.",
      "Aqui há um atalho. Como a verde-vermelha já está em cima na frente, a sequência para a esquerda a coloca e ao mesmo tempo tira a verde-laranja. Depois gire `U2` e faça a sequência para a direita. Na sequência completa, esse `U2` e o `U` com que começa a sequência para a direita se juntam num só `U'`.")),
];

const yellowCross = [
  kase({ phase: 'cruz', slug: 'linea', stage: 'oll-cross', code: word('Línea', 'Line', 'Linha'), name: tr('Línea', 'Line', 'Linha'),
    recognition: tr('Línea amarilla de izquierda a derecha', 'Yellow line from left to right', 'Linha amarela da esquerda para a direita'), alg: CROSS }),
  kase({ phase: 'cruz', slug: 'l', stage: 'oll-cross', code: 'L', name: tr('L', 'L', 'L'),
    recognition: tr('Dos aristas amarillas, atrás y a la izquierda, en forma de L', 'Two yellow edges, at the back and on the left, in an L shape', 'Duas arestas amarelas, atrás e à esquerda, em forma de L'), alg: CROSS_TWICE,
    note: tr("Es la secuencia 2 veces seguidas: la primera deja una línea de izquierda a derecha y la segunda hace la cruz. La `F'` y la `F` del medio se anulan, por eso no aparecen.",
      "It's the sequence twice in a row: the first one leaves a line from left to right and the second one makes the cross. The `F'` and `F` in the middle cancel out, so they don't appear.",
      "É a sequência 2 vezes seguidas: a primeira deixa uma linha da esquerda para a direita e a segunda faz a cruz. O `F'` e o `F` do meio se anulam, por isso não aparecem.") }),
  kase({ phase: 'cruz', slug: 'punto', stage: 'oll-cross', code: word('Punto', 'Dot', 'Ponto'), name: tr('Punto', 'Dot', 'Ponto'),
    recognition: tr('Solo el centro amarillo; ninguna arista con el amarillo arriba', 'Only the yellow center; no edge with yellow facing up', 'Só o centro amarelo; nenhuma aresta com o amarelo para cima'),
    alg: `${CROSS} U2 ${CROSS_TWICE}`,
    note: tr('La primera vez deja una L adelante y a la derecha. Gira `U2` para pasarla atrás y a la izquierda, y sigue como con la L.',
      'The first time, the sequence leaves an L at the front and on the right. Turn `U2` to move it to the back and on the left, and continue as for the L.',
      'Na primeira vez, fica um L na frente e à direita. Gire `U2` para levá-lo para trás e para a esquerda, e continue como no L.') }),
];

const yellowEdges = [
  kase({ phase: 'aristas', slug: 'vecinas', stage: 'll-edges', code: word('Vecinas', 'Adjacent', 'Vizinhas'), name: tr('Dos vecinas bien', 'Two adjacent edges match', 'Duas vizinhas certas'),
    recognition: tr('Coinciden la arista de la derecha (naranja) y la de atrás (azul); adelante está la roja y a la izquierda, la verde',
      'The right (orange) and back (blue) edges match; the red one is in front and the green one on the left',
      'Coincidem a aresta da direita (laranja) e a de trás (azul); na frente está a vermelha e à esquerda, a verde'), alg: SUNE }),
  kase({ phase: 'aristas', slug: 'opuestas', stage: 'll-edges', code: word('Opuestas', 'Opposite', 'Opostas'), name: tr('Dos opuestas bien', 'Two opposite edges match', 'Duas opostas certas'),
    recognition: tr('Coinciden la arista de la derecha (naranja) y la de la izquierda (roja); adelante está la azul y atrás, la verde',
      'The right (orange) and left (red) edges match; the blue one is in front and the green one at the back',
      'Coincidem a aresta da direita (laranja) e a da esquerda (vermelha); na frente está a azul e atrás, a verde'),
    alg: "R U R' U R U2 R' U2 y R U R' U R U2 R' U",
    note: tr('Haz la secuencia 1 vez. Luego gira `U` hasta que coincidan 2 aristas vecinas, gira el cubo entero para dejarlas atrás y a la derecha y hazla otra vez.',
      'Do the sequence once. Then turn `U` until 2 adjacent edges match, rotate the whole cube to put them at the back and on the right, and do it again.',
      'Faça a sequência 1 vez. Depois gire `U` até 2 arestas vizinhas coincidirem, gire o cubo inteiro para deixá-las atrás e à direita e faça-a de novo.') }),
];

const placeCorners = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, alt?: Row['alt'], note?: Localized) =>
  kase({ phase: 'esquinas', slug, stage: 'll-corners-placed', code, name, recognition, alg, alt, note });

const oneHome = [
  placeCorners('antihorario', word('Antihorario', 'Counterclockwise', 'Anti-horário'), tr('Una en su sitio, 1 vez', 'One in place, once', 'Uma no lugar, 1 vez'),
    tr('La esquina de adelante a la derecha ya está en su sitio; las otras 3 deben moverse en sentido antihorario: la amarillo-azul-roja, atrás a la derecha, va atrás a la izquierda',
      'The front-right corner is already in place; the other 3 must move counterclockwise: the yellow-blue-red one, at the back right, goes to the back left',
      'A quina da frente à direita já está no lugar; as outras 3 precisam se mover no sentido anti-horário: a amarelo-azul-vermelha, atrás à direita, vai para o lugar de trás à esquerda'), CYCLE),
  placeCorners('horario', word('Horario', 'Clockwise', 'Horário'), tr('Una en su sitio, 2 veces', 'One in place, twice', 'Uma no lugar, 2 vezes'),
    tr('La esquina de adelante a la derecha ya está en su sitio; las otras 3 deben moverse en sentido horario: la amarillo-azul-naranja, atrás a la izquierda, va atrás a la derecha',
      'The front-right corner is already in place; the other 3 must move clockwise: the yellow-blue-orange one, at the back left, goes to the back right',
      'A quina da frente à direita já está no lugar; as outras 3 precisam se mover no sentido horário: a amarelo-azul-laranja, atrás à esquerda, vai para o lugar de trás à direita'), times(CYCLE, 2),
    ["L' U R U' L U R' U'", tr('Es la secuencia al revés: hecha 1 vez, equivale a hacer la normal 2 veces.', "It's the sequence backwards: doing it once equals doing the normal one twice.", 'É a sequência ao contrário: feita 1 vez, equivale a fazer a normal 2 vezes.')]),
];
const noneHome = [
  placeCorners('parejas', word('Parejas', 'Pairs', 'Pares'), tr('Ninguna: cambiadas de dos en dos', 'None: swapped in pairs', 'Nenhuma: trocadas duas a duas'),
    tr('Ninguna en su sitio; las 2 de la derecha están cambiadas entre sí, y las 2 de la izquierda también',
      'None in place; the 2 on the right are swapped with each other, and so are the 2 on the left',
      'Nenhuma no lugar; as 2 da direita estão trocadas entre si, e as 2 da esquerda também'),
    `${CYCLE} y' ${CYCLE}`, undefined,
    tr("La primera vez deja una esquina en su sitio. Gira el cubo entero con `y'` para dejarla adelante a la derecha y haz la secuencia otra vez.",
      "The first time, the sequence leaves one corner in place. Rotate the whole cube with `y'` to put it at the front right and do the sequence again.",
      "Na primeira vez, a sequência deixa uma quina no lugar. Gire o cubo inteiro com `y'` para deixá-la na frente à direita e faça a sequência de novo.")),
  placeCorners('diagonal', 'Diagonal', tr('Ninguna: cambiadas en diagonal', 'None: swapped diagonally', 'Nenhuma: trocadas na diagonal'),
    tr('Ninguna en su sitio; cada esquina va al sitio opuesto en diagonal', 'None in place; each corner goes to the diagonally opposite place', 'Nenhuma no lugar; cada quina vai para o lugar oposto na diagonal'),
    `${CYCLE} y ${CYCLE}`, undefined,
    tr('La primera vez deja una esquina en su sitio. Gira el cubo entero con `y` para dejarla adelante a la derecha y haz la secuencia otra vez.',
      'The first time, the sequence leaves one corner in place. Rotate the whole cube with `y` to put it at the front right and do the sequence again.',
      'Na primeira vez, a sequência deixa uma quina no lugar. Gire o cubo inteiro com `y` para deixá-la na frente à direita e faça a sequência de novo.')),
];

const twist = (slug: string, code: string, name: Localized, recognition: Localized, alg: string) =>
  kase({ phase: 'orientar', slug, stage: 'll-corners-twist', code, name, recognition, alg });

const twistTwo = [
  twist('u', 'U', tr('Faros: dos esquinas vecinas con el amarillo hacia el mismo lado', 'Headlights: two adjacent corners with yellow facing the same way', 'Faróis: duas quinas vizinhas com o amarelo virado para o mesmo lado'),
    tr('Esquinas de adelante y de atrás a la derecha giradas, las dos con el amarillo a la derecha', 'Front-right and back-right corners twisted, both with yellow facing right', 'Quinas da frente e de trás à direita giradas, as duas com o amarelo para a direita'),
    `${TWIST2} U ${TWIST4} U'`),
  twist('t', 'T', tr('Dos vecinas con el amarillo hacia afuera', 'Two adjacent corners with yellow facing outward', 'Duas vizinhas com o amarelo virado para fora'),
    tr('Esquina de adelante a la derecha con el amarillo al frente; la de atrás a la derecha, con el amarillo atrás', 'Front-right corner with yellow facing front; the back-right one, with yellow facing back', 'Quina da frente à direita com o amarelo para a frente; a de trás à direita, com o amarelo para trás'),
    `${TWIST4} U ${TWIST2} U'`),
  twist('l', 'L', tr('Dos esquinas en diagonal', 'Two corners on a diagonal', 'Duas quinas na diagonal'),
    tr('Esquina de adelante a la derecha con el amarillo al frente; la de atrás a la izquierda, con el amarillo a la izquierda', 'Front-right corner with yellow facing front; the back-left one, with yellow facing left', 'Quina da frente à direita com o amarelo para a frente; a de trás à esquerda, com o amarelo para a esquerda'),
    `${TWIST4} U2 ${TWIST2} U2`),
];
const twistThree = [
  twist('antisune', 'Antisune', tr('Tres esquinas, 2 veces cada una', 'Three corners, twice each', 'Três quinas, 2 vezes cada uma'),
    tr('Solo la esquina de adelante a la izquierda tiene el amarillo arriba; la de adelante a la derecha, con el amarillo a la derecha; la de atrás a la derecha, con el amarillo atrás; la de atrás a la izquierda, con el amarillo a la izquierda',
      'Only the front-left corner has yellow on top; the front-right one, with yellow facing right; the back-right one, with yellow facing back; the back-left one, with yellow facing left',
      'Só a quina da frente à esquerda tem o amarelo em cima; a da frente à direita, com o amarelo para a direita; a de trás à direita, com o amarelo para trás; a de trás à esquerda, com o amarelo para a esquerda'),
    `${TWIST2} U ${TWIST2} U ${TWIST2} U2`),
  twist('sune', 'Sune', tr('Tres esquinas, 4 veces cada una', 'Three corners, 4 times each', 'Três quinas, 4 vezes cada uma'),
    tr('Solo la esquina de adelante a la izquierda tiene el amarillo arriba; la de adelante a la derecha, con el amarillo al frente; la de atrás a la derecha, con el amarillo a la derecha; la de atrás a la izquierda, con el amarillo atrás',
      'Only the front-left corner has yellow on top; the front-right one, with yellow facing front; the back-right one, with yellow facing right; the back-left one, with yellow facing back',
      'Só a quina da frente à esquerda tem o amarelo em cima; a da frente à direita, com o amarelo para a frente; a de trás à direita, com o amarelo para a direita; a de trás à esquerda, com o amarelo para trás'),
    `${TWIST4} U ${TWIST4} U ${TWIST4} U2`),
];
const twistFour = [
  twist('pi', 'Pi', tr('Cuatro: faros adelante', 'Four: headlights in front', 'Quatro: faróis na frente'),
    tr('Las 4 giradas: las 2 de adelante, con el amarillo al frente; la de atrás a la derecha, con el amarillo a la derecha; la de atrás a la izquierda, con el amarillo a la izquierda',
      'All 4 twisted: the 2 in front, with yellow facing front; the back-right one, with yellow facing right; the back-left one, with yellow facing left',
      'As 4 giradas: as 2 da frente, com o amarelo para a frente; a de trás à direita, com o amarelo para a direita; a de trás à esquerda, com o amarelo para a esquerda'),
    `${TWIST4} U ${TWIST4} U ${TWIST2} U ${TWIST2} U`),
  twist('h', 'H', tr('Cuatro: faros adelante y atrás', 'Four: headlights front and back', 'Quatro: faróis na frente e atrás'),
    tr('Las 4 giradas: las 2 de adelante, con el amarillo al frente; las 2 de atrás, con el amarillo atrás',
      'All 4 twisted: the 2 in front, with yellow facing front; the 2 at the back, with yellow facing back',
      'As 4 giradas: as 2 da frente, com o amarelo para a frente; as 2 de trás, com o amarelo para trás'),
    `${TWIST4} U ${TWIST2} U ${TWIST4} U ${TWIST2} U`),
];

// Each phase is taught the same way (types.ts): the goal and its sequence, a few numbered steps, and what to do when
// something goes wrong, folded. Short lines: someone reads them with a cube in their hands.
export const beginner: Method = {
  id: 'principiante',
  next: 'cfop-reducido',
  name: tr('Método principiante', 'Beginner method', 'Método para iniciantes'),
  summary: tr('Resuelve tu primer cubo de Rubik capa por capa, en 7 pasos con secuencias cortas que se repiten. Para quien empieza de cero.',
    "Solve your first Rubik's cube layer by layer, in 7 steps with short sequences you repeat. For complete beginners.",
    'Resolva seu primeiro cubo mágico camada por camada, em 7 passos com sequências curtas que se repetem. Para quem começa do zero.'),
  description: doc(
    [
      'Es el método para resolver el cubo de Rubik por primera vez. Lo armas **capa por capa**: primero la blanca (abajo), luego la del medio y al final la amarilla (arriba).',
      'Son 7 pasos. El primero se hace sin secuencias. Cada uno de los otros 6 usa una **secuencia** corta, lo que otros métodos llaman algoritmo. La repites 1 o más veces según lo que veas.',
      '## Los 7 pasos',
      '1. **Cruz blanca:** sin secuencias, arista por arista. La explica el enlace «Paso 1: la cruz blanca», al principio de esta guía.',
      `2. **Esquinas blancas:** \`${TRIGGER}\``,
      `3. **Segunda capa:** \`${RIGHT}\` o su espejo`,
      `4. **Cruz amarilla:** \`${CROSS}\``,
      `5. **Aristas amarillas:** \`${SUNE}\``,
      `6. **Esquinas amarillas a su sitio:** \`${CYCLE}\``,
      `7. **Girar las esquinas:** \`${TWIST}\``,
      '## Cómo aprenderlo',
      '- **Un paso por sesión**, en orden. Pasa al siguiente cuando lo hagas sin mirar la guía.',
      '- Con 20 a 30 minutos al día, tu primer cubo suele salir en **1 o 2 semanas**. La primera resolución puede tardar 5 minutos o más.',
      '- **Si te pierdes:** busca el último paso que sigue completo y retoma desde el siguiente.',
      '- Cuando resuelvas el cubo sin mirar la guía, sigue con CFOP reducido: la versión corta del método que usan los speedcubers.',
    ],
    [
      "This is the method for solving a Rubik's cube for the first time. You solve it **layer by layer**: first the white one (bottom), then the middle one and finally the yellow one (top).",
      'There are 7 steps. The first one needs no sequences. Each of the other 6 uses a short **sequence**, what other methods call an algorithm. You repeat it 1 or more times depending on what you see.',
      '## The 7 steps',
      '1. **White cross:** no sequences, one edge at a time. The "Step 1: the white cross" link, at the start of this guide, explains it.',
      `2. **White corners:** \`${TRIGGER}\``,
      `3. **Second layer:** \`${RIGHT}\` or its mirror`,
      `4. **Yellow cross:** \`${CROSS}\``,
      `5. **Yellow edges:** \`${SUNE}\``,
      `6. **Yellow corners into place:** \`${CYCLE}\``,
      `7. **Twist the corners:** \`${TWIST}\``,
      '## How to learn it',
      '- **One step per session**, in order. Move on when you can do it without looking at the guide.',
      "- With 20 to 30 minutes a day, you'll usually solve your first cube in **1 or 2 weeks**. That first solve may take 5 minutes or more.",
      "- **If you get lost:** find the last step that's still complete and pick up from the next one.",
      '- Once you can solve the cube without looking at the guide, move on to Reduced CFOP: the short version of the method speedcubers use.',
    ],
    [
      'É o método para resolver o cubo mágico pela primeira vez. Você o monta **camada por camada**: primeiro a branca (embaixo), depois a do meio e por último a amarela (em cima).',
      'São 7 passos. O primeiro se faz sem sequências. Cada um dos outros 6 usa uma **sequência** curta, o que outros métodos chamam de algoritmo. Você a repete 1 ou mais vezes conforme o que vê.',
      '## Os 7 passos',
      '1. **Cruz branca:** sem sequências, uma aresta de cada vez. O link "Passo 1: a cruz branca", no começo deste guia, explica como fazê-la.',
      `2. **Quinas brancas:** \`${TRIGGER}\``,
      `3. **Segunda camada:** \`${RIGHT}\` ou a versão espelhada`,
      `4. **Cruz amarela:** \`${CROSS}\``,
      `5. **Arestas amarelas:** \`${SUNE}\``,
      `6. **Quinas amarelas no lugar:** \`${CYCLE}\``,
      `7. **Girar as quinas:** \`${TWIST}\``,
      '## Como aprender',
      '- **Um passo por sessão**, em ordem. Passe para o próximo quando conseguir fazê-lo sem olhar o guia.',
      '- Com 20 a 30 minutos por dia, você costuma resolver seu primeiro cubo em **1 ou 2 semanas**. A primeira resolução pode levar 5 minutos ou mais.',
      '- **Se você se perder:** procure o último passo que continua completo e retome a partir do seguinte.',
      '- Quando resolver o cubo sem olhar o guia, siga para o CFOP reduzido: a versão curta do método que os speedcubers usam.',
    ],
  ),
  orientation: doc(
    [
      'Sostén el cubo con **el amarillo arriba y el verde al frente**. Así, el naranja queda a la derecha y la cruz blanca, abajo.',
      'Cada paso te dice dónde poner la pieza con la que trabajas, casi siempre **adelante a la derecha**. Si está en otro lado, gira el cubo entero (`y`) hasta llevarla ahí, siempre con el amarillo arriba. En el paso 7, una vez que empiezas, solo giras `U`.',
    ],
    [
      'Hold the cube with **yellow on top and green facing front**. That way, orange is on the right and the white cross at the bottom.',
      "Each step tells you where to put the piece you're working on, almost always at the **front right**. If it's somewhere else, rotate the whole cube (`y`) to bring it there, always with yellow on top. In step 7, once you start, you only turn `U`.",
    ],
    [
      'Segure o cubo com **o amarelo em cima e o verde para a frente**. Assim, o laranja fica à direita e a cruz branca, embaixo.',
      'Cada passo diz onde colocar a peça com que você está trabalhando, quase sempre **na frente à direita**. Se ela estiver em outro lugar, gire o cubo inteiro (`y`) até levá-la para lá, sempre com o amarelo em cima. No passo 7, depois de começar, você só gira `U`.',
    ],
  ),
  notation: doc(
    [
      '## Giros',
      '- Cada letra gira una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente, `B` atrás.',
      '- La letra sola es un cuarto de vuelta en sentido horario, mirando esa cara de frente (`D`, desde abajo).',
      "- Con apóstrofo, al revés: `R'`. Con un 2, media vuelta: `U2`.",
      "- `y` gira el cubo entero en el mismo sentido que `U`, y `y'` al revés. No mueven piezas: solo cambian qué cara queda al frente.",
      '## Gatillos',
      `Dos pasos repiten un **gatillo**, un trozo corto de 4 giros: \`${TRIGGER}\` en el paso 2 y \`${TWIST}\` en el paso 7. Haz cada gatillo de corrido, como un solo gesto, y cuenta repeticiones, no giros.`,
      '## Figuras',
      '- **Pasos 2 y 3:** el cubo en perspectiva, con las caras de arriba, del frente y de la derecha.',
      '- **Pasos 4 a 7:** la cara amarilla vista desde arriba, con el frente en el lado inferior de la figura. Las barritas son las pegatinas de los lados.',
      '- En gris, lo que todavía no importa. En el paso 6, las flechas muestran a dónde va cada esquina.',
    ],
    [
      '## Moves',
      '- Each letter turns a face: `R` right, `L` left, `U` up, `D` down, `F` front, `B` back.',
      '- A letter alone is a quarter turn clockwise, looking at that face head-on (`D`, from below).',
      "- With an apostrophe, the other way: `R'`. With a 2, a half turn: `U2`.",
      "- `y` rotates the whole cube the same way as `U`, and `y'` the other way. They don't move any pieces: they only change which face is in front.",
      '## Triggers',
      `Two steps repeat a **trigger**, a short chunk of 4 moves: \`${TRIGGER}\` in step 2 and \`${TWIST}\` in step 7. Do each trigger in one go, as a single motion, and count repetitions, not moves.`,
      '## Diagrams',
      '- **Steps 2 and 3:** the cube in perspective, showing the top, front and right faces.',
      '- **Steps 4 to 7:** the yellow face seen from above, with the front at the bottom of the diagram. The little bars are the side stickers.',
      "- Gray marks what doesn't matter yet. In step 6, the arrows show where each corner goes.",
    ],
    [
      '## Movimentos',
      '- Cada letra gira uma face: `R` direita, `L` esquerda, `U` em cima, `D` embaixo, `F` frente, `B` atrás.',
      '- A letra sozinha é um quarto de volta no sentido horário, olhando para essa face de frente (`D`, por baixo).',
      "- Com apóstrofo, ao contrário: `R'`. Com um 2, meia-volta: `U2`.",
      "- `y` gira o cubo inteiro no mesmo sentido que `U`, e `y'` ao contrário. Não movem peças: só mudam qual face fica na frente.",
      '## Gatilhos',
      `Dois passos repetem um **gatilho**, um trecho curto de 4 movimentos: \`${TRIGGER}\` no passo 2 e \`${TWIST}\` no passo 7. Faça cada gatilho sem pausas, como um só gesto, e conte repetições, não movimentos.`,
      '## Figuras',
      '- **Passos 2 e 3:** o cubo em perspectiva, com as faces de cima, da frente e da direita.',
      '- **Passos 4 a 7:** a face amarela vista de cima, com a frente no lado inferior da figura. As barrinhas são os adesivos dos lados.',
      '- Em cinza, o que ainda não importa. No passo 6, as setas mostram para onde vai cada quina.',
    ],
  ),
  before: { path: '/como-resolver-el-cubo-de-rubik#como-cruz', label: tr('Paso 1: la cruz blanca', 'Step 1: the white cross', 'Passo 1: a cruz branca') },
  phases: [
    {
      id: 'prin-capa1',
      name: tr('Paso 2: esquinas blancas', 'Step 2: white corners', 'Passo 2: quinas brancas'),
      goal: doc(
        ['**Meta:** la cara blanca completa, y en cada lado la fila de abajo de un solo color.', `**Secuencia:** el gatillo, \`${TRIGGER}\`.`],
        ['**Goal:** the white face complete, and on each side the bottom row all one color.', `**Sequence:** the trigger, \`${TRIGGER}\`.`],
        ['**Meta:** a face branca completa, e em cada lado a fileira de baixo de uma cor só.', `**Sequência:** o gatilho, \`${TRIGGER}\`.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca en la capa de arriba una esquina con blanco y mira sus otros 2 colores.',
          '2. Gira `U` hasta dejarla justo encima de su sitio: entre los centros de esos 2 colores.',
          '3. Gira el cubo entero para tenerla adelante a la derecha.',
          '4. Haz el gatillo hasta que baje con el blanco abajo: **1 vez** si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.',
          'Repite con cada esquina hasta tener las 4.',
        ],
        [
          '## How to do it',
          '1. Find a corner in the top layer that has white, and look at its other 2 colors.',
          "2. Turn `U` until it's right above its place: between the centers of those 2 colors.",
          "3. Rotate the whole cube so it's at the front right.",
          '4. Do the trigger until it drops in with white facing down: **once** if white faces right, **3 times** if it faces up, **5** if it faces front.',
          'Repeat with each corner until you have all 4.',
        ],
        [
          '## Como fazer',
          '1. Procure na camada de cima uma quina com branco e veja as suas outras 2 cores.',
          '2. Gire `U` até deixá-la bem em cima do seu lugar: entre os centros dessas 2 cores.',
          '3. Gire o cubo inteiro para deixá-la na frente à direita.',
          '4. Faça o gatilho até ela descer com o branco embaixo: **1 vez** se o branco olha para a direita, **3** se olha para cima, **5** se olha para a frente.',
          'Repita com cada quina até ter as 4.',
        ],
      ),
      tips: doc(
        [
          '- **Una esquina blanca está abajo, pero girada o en el sitio de otra:** gira el cubo entero para tenerla adelante a la derecha y haz un gatillo. Así sube a la capa de arriba: gira `U` hasta dejarla encima de su sitio y bájala como cualquier otra.',
          '- **Bajó en el sitio equivocado:** antes del gatillo, comprueba que está justo encima de su sitio, entre los centros de sus otros 2 colores.',
          '- **No entra, o se desarma algo:** haz siempre los 4 giros del gatillo y no gires el cubo hasta que la esquina entre.',
        ],
        [
          "- **A white corner is at the bottom, but twisted or in another corner's place:** rotate the whole cube so it's at the front right and do one trigger. That brings it up to the top layer: turn `U` until it's above its place and bring it down like any other.",
          "- **It dropped into the wrong place:** before the trigger, check that it's right above its place, between the centers of its other 2 colors.",
          "- **It won't go in, or something gets messed up:** always do all 4 moves of the trigger, and don't rotate the cube until the corner is in.",
        ],
        [
          '- **Uma quina branca está embaixo, mas girada ou no lugar de outra:** gire o cubo inteiro para deixá-la na frente à direita e faça um gatilho. Assim ela sobe para a camada de cima: gire `U` até deixá-la em cima do seu lugar e desça-a como qualquer outra.',
          '- **Desceu no lugar errado:** antes do gatilho, confira se ela está bem em cima do seu lugar, entre os centros das suas outras 2 cores.',
          '- **Não entra, ou algo se desfaz:** faça sempre os 4 movimentos do gatilho e não gire o cubo até a quina entrar.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'prin-capa1-arriba',
          name: tr('Esquina arriba, encima de su sitio', 'Corner on top, above its place', 'Quina em cima, sobre o seu lugar'),
          description: tr('La esquina ya está encima de su sitio. Cuenta los gatillos según hacia dónde mira el blanco: 1 si mira a la derecha, 3 si mira arriba y 5 si mira al frente.',
            'The corner is already above its place. How many triggers you do depends on where white faces: 1 if it faces right, 3 if it faces up and 5 if it faces front.',
            'A quina já está em cima do seu lugar. Conte os gatilhos de acordo com a direção para onde o branco olha: 1 se olha para a direita, 3 se olha para cima e 5 se olha para a frente.'),
          cases: cornerUp,
        },
        {
          id: 'prin-capa1-abajo',
          name: tr('Esquina abajo, mal puesta', 'Corner at the bottom, misplaced', 'Quina embaixo, mal colocada'),
          description: tr('La esquina ya está abajo, pero girada o en el sitio de otra. Un gatillo la sube a la capa de arriba, y luego la bajas como cualquier otra.',
            "The corner is already at the bottom, but twisted or in another corner's place. One trigger brings it up to the top layer, and then you bring it down like any other.",
            'A quina já está embaixo, mas girada ou no lugar de outra. Um gatilho a leva para a camada de cima, e depois você a desce como qualquer outra.'),
          cases: cornerDown,
        },
      ],
      quizzes: [],
    },
    {
      id: 'prin-capa2',
      name: tr('Paso 3: segunda capa', 'Step 3: second layer', 'Passo 3: segunda camada'),
      goal: doc(
        ['**Meta:** las dos primeras capas completas: en cada lado, las 2 filas de abajo de un solo color.', `**Secuencias:** a la derecha, \`${RIGHT}\`. A la izquierda, la misma en espejo: \`${LEFT}\`.`],
        ['**Goal:** the first two layers complete: on each side, the bottom 2 rows all one color.', `**Sequences:** to the right, \`${RIGHT}\`. To the left, the same one mirrored: \`${LEFT}\`.`],
        ['**Meta:** as duas primeiras camadas completas: em cada lado, as 2 fileiras de baixo de uma cor só.', `**Sequências:** para a direita, \`${RIGHT}\`. Para a esquerda, a mesma espelhada: \`${LEFT}\`.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca en la capa de arriba una arista **sin amarillo**.',
          '2. Gira `U` hasta que el otro color de la arista, el que no mira arriba, coincida con el centro de ese lado.',
          '3. Gira el cubo entero para dejarla arriba adelante, con ese centro al frente.',
          '4. Mira su color de **arriba**: la arista va hacia el centro de ese color. Haz la secuencia hacia ese lado, a la derecha o a la izquierda.',
          'Repite hasta colocar las 4.',
        ],
        [
          '## How to do it',
          '1. Find an edge in the top layer **without yellow**.',
          "2. Turn `U` until the edge's other color, the one not facing up, matches the center on that side.",
          "3. Rotate the whole cube so it's at the top front, with that center facing front.",
          '4. Look at its **top** color: the edge goes toward the center of that color. Do the sequence toward that side, right or left.',
          'Repeat until all 4 are in.',
        ],
        [
          '## Como fazer',
          '1. Procure na camada de cima uma aresta **sem amarelo**.',
          '2. Gire `U` até a outra cor da aresta, a que não olha para cima, coincidir com o centro desse lado.',
          '3. Gire o cubo inteiro para deixá-la em cima na frente, com esse centro para a frente.',
          '4. Olhe a cor de **cima** dela: a aresta vai para o centro dessa cor. Faça a sequência para esse lado, direita ou esquerda.',
          'Repita até colocar as 4.',
        ],
      ),
      tips: doc(
        [
          '- **Todas las aristas de arriba tienen amarillo, pero falta alguna en la capa del medio:** está atascada allí, volteada o en el sitio de otra. Gira el cubo entero para tenerla adelante a la derecha y haz la secuencia a la derecha: sale arriba. Luego colócala como siempre.',
          '- **Hay amarillo en la capa del medio:** metiste una arista que va en la capa de arriba. Sácala con la secuencia a la derecha, como una arista atascada, y usa solo aristas sin amarillo.',
          '- **Fue al lado contrario:** el lado lo decide el color de arriba de la arista, no el del frente.',
        ],
        [
          "- **All the top edges have yellow, but one is missing from the middle layer:** it's stuck there, flipped or in another edge's place. Rotate the whole cube so it's at the front right and do the sequence to the right: it comes out on top. Then place it as usual.",
          "- **There's yellow in the middle layer:** you put in an edge that belongs in the top layer. Take it out with the sequence to the right, like a stuck edge, and use only edges without yellow.",
          "- **It went to the wrong side:** the edge's top color decides the side, not the front one.",
        ],
        [
          '- **Todas as arestas de cima têm amarelo, mas falta alguma na camada do meio:** ela está presa ali, invertida ou no lugar de outra. Gire o cubo inteiro para deixá-la na frente à direita e faça a sequência para a direita: ela sai para cima. Depois coloque-a como sempre.',
          '- **Tem amarelo na camada do meio:** você colocou uma aresta que vai na camada de cima. Tire-a com a sequência para a direita, como uma aresta presa, e use só arestas sem amarelo.',
          '- **Foi para o lado errado:** quem decide o lado é a cor de cima da aresta, não a da frente.',
        ],
      ),
      diagram: 'iso',
      groups: [
        { id: 'prin-capa2-arriba', name: tr('Arista arriba', 'Edge on top', 'Aresta em cima'),
          description: tr('La arista está en la capa de arriba y no tiene amarillo. Su color de arriba dice hacia qué lado va: a la derecha o a la izquierda.',
            'The edge is in the top layer and has no yellow. Its top color tells you which side it goes to: right or left.',
            'A aresta está na camada de cima e não tem amarelo. A cor de cima dela diz para que lado vai: direita ou esquerda.'), cases: edgeUp },
        { id: 'prin-capa2-atascada', name: tr('Arista atascada', 'Stuck edge', 'Aresta presa'),
          description: tr('La arista está en la capa del medio, pero volteada o en el sitio de otra. Gira el cubo entero para tenerla adelante a la derecha y haz la secuencia a la derecha: sale arriba. Luego colócala como cualquier otra.',
            "The edge is in the middle layer, but flipped or in another edge's place. Rotate the whole cube so it's at the front right and do the sequence to the right: it comes out on top. Then place it like any other.",
            'A aresta está na camada do meio, mas invertida ou no lugar de outra. Gire o cubo inteiro para deixá-la na frente à direita e faça a sequência para a direita: ela sai para cima. Depois coloque-a como qualquer outra.'), cases: edgeStuck },
      ],
      quizzes: [],
    },
    {
      id: 'prin-cruz',
      name: tr('Paso 4: cruz amarilla', 'Step 4: yellow cross', 'Passo 4: cruz amarela'),
      goal: doc(
        ['**Meta:** una cruz amarilla arriba. Solo cuentan las aristas, no las esquinas.', `**Secuencia:** \`${CROSS}\`, de 1 a 3 veces.`],
        ['**Goal:** a yellow cross on top. Only the edges count, not the corners.', `**Sequence:** \`${CROSS}\`, 1 to 3 times.`],
        ['**Meta:** uma cruz amarela em cima. Só contam as arestas, não as quinas.', `**Sequência:** \`${CROSS}\`, de 1 a 3 vezes.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          'Mira qué forma hace el amarillo arriba, sin contar las esquinas. Gira `U` hasta dejarla como se indica y haz la secuencia:',
          '- **Línea:** de izquierda a derecha. **1 vez.**',
          '- **L:** con sus 2 aristas atrás y a la izquierda. **2 veces.**',
          '- **Punto** (solo el centro): **1 vez**, desde cualquier lado. Sale una L: sigue con ella.',
        ],
        [
          '## How to do it',
          "Look at the shape the yellow makes on top, without counting the corners. Turn `U` until it's positioned as follows, and do the sequence:",
          '- **Line:** from left to right. **Once.**',
          '- **L:** with its 2 edges at the back and on the left. **Twice.**',
          '- **Dot** (only the center): **once**, from any side. An L appears: continue with it.',
        ],
        [
          '## Como fazer',
          'Veja que forma o amarelo faz em cima, sem contar as quinas. Gire `U` até deixá-la como indicado e faça a sequência:',
          '- **Linha:** da esquerda para a direita. **1 vez.**',
          '- **L:** com as suas 2 arestas atrás e à esquerda. **2 vezes.**',
          '- **Ponto** (só o centro): **1 vez**, de qualquer lado. Aparece um L: continue com ele.',
        ],
      ),
      tips: doc(
        [
          '- **Salió otra forma:** no pasa nada, solo tenías la forma en otra posición. Mira la forma nueva y sigue desde ahí.',
          '- **Cuentas 1 o 3 piezas con el amarillo arriba, sin el centro:** cuenta solo las aristas, las piezas del medio de cada lado de la cara. Las esquinas no cuentan.',
          '- **Son de verdad 1 o 3 aristas:** el cubo se desarmó alguna vez y, al armarlo, una arista quedó volteada. Eso no se arregla girando caras: saca con cuidado una arista de arriba, ponla volteada y sigue con este paso.',
        ],
        [
          '- **You got a different shape:** no problem, you just had the shape in a different position. Look at the new shape and continue from there.',
          "- **You count 1 or 3 pieces with yellow on top, not counting the center:** count only the edges, the middle piece on each side of the face. The corners don't count.",
          "- **There really are 1 or 3 edges:** the cube came apart at some point and, when it was put back together, an edge ended up flipped. Turning faces can't fix that: carefully take out a top edge, put it back flipped and continue with this step.",
        ],
        [
          '- **Saiu outra forma:** tudo bem, a forma só estava em outra posição. Veja a forma nova e continue a partir dela.',
          '- **Você conta 1 ou 3 peças com o amarelo em cima, sem contar o centro:** conte só as arestas, as peças do meio de cada lado da face. As quinas não contam.',
          '- **São mesmo 1 ou 3 arestas:** em algum momento o cubo se desmontou e, quando foi montado de novo, uma aresta ficou invertida. Isso não se arruma girando faces: tire com cuidado uma aresta de cima, coloque-a de volta invertida e continue com este passo.',
        ],
      ),
      diagram: 'top',
      groups: [{ id: 'prin-cruz-formas', name: tr('Formas amarillas', 'Yellow shapes', 'Formas amarelas'),
        description: tr('Mira solo las aristas con el amarillo arriba. La forma que hacen dice cuántas veces repetir la secuencia.',
          'Look only at the edges with yellow on top. The shape they make tells you how many times to do the sequence.',
          'Olhe só as arestas com o amarelo em cima. A forma que elas fazem diz quantas vezes repetir a sequência.'), cases: yellowCross }],
      quizzes: [],
    },
    {
      id: 'prin-aristas',
      name: tr('Paso 5: aristas amarillas', 'Step 5: yellow edges', 'Passo 5: arestas amarelas'),
      goal: doc(
        ['**Meta:** la cruz amarilla con cada arista junto al centro de su otro color.', `**Secuencia:** \`${SUNE}\`. Cambia de sitio las aristas de adelante y de la izquierda.`],
        ['**Goal:** the yellow cross with each edge next to the center of its other color.', `**Sequence:** \`${SUNE}\`. It swaps the front and left edges.`],
        ['**Meta:** a cruz amarela com cada aresta junto do centro da sua outra cor.', `**Sequência:** \`${SUNE}\`. Troca de lugar as arestas da frente e da esquerda.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          'Gira `U` hasta que al menos 2 aristas coincidan con su centro (siempre se puede). Luego:',
          '- **Dos vecinas** (una al lado de la otra): gira el cubo entero para dejarlas atrás y a la derecha, y haz la secuencia **1 vez**.',
          '- **Dos opuestas** (una enfrente de la otra): haz la secuencia **1 vez**, desde cualquier lado. Luego gira `U` hasta que coincidan 2 vecinas y sigue como con dos vecinas.',
          '- **Las 4:** listo, pasa al paso 6.',
        ],
        [
          '## How to do it',
          "Turn `U` until at least 2 edges match their centers (it's always possible). Then:",
          '- **Two adjacent edges** (side by side): rotate the whole cube to put them at the back and on the right, and do the sequence **once**.',
          '- **Two opposite edges** (facing each other): do the sequence **once**, from any side. Then turn `U` until 2 adjacent edges match and continue as for two adjacent edges.',
          '- **All 4:** done, go to step 6.',
        ],
        [
          '## Como fazer',
          'Gire `U` até pelo menos 2 arestas coincidirem com os seus centros (sempre dá). Depois:',
          '- **Duas vizinhas** (uma ao lado da outra): gire o cubo inteiro para deixá-las atrás e à direita, e faça a sequência **1 vez**.',
          '- **Duas opostas** (uma de frente para a outra): faça a sequência **1 vez**, de qualquer lado. Depois gire `U` até 2 vizinhas coincidirem e continue como no caso de duas vizinhas.',
          '- **As 4:** pronto, passe para o passo 6.',
        ],
      ),
      tips: doc(
        [
          '- **Se cambiaron otras aristas:** antes de la secuencia, deja las 2 vecinas que coinciden atrás y a la derecha. Desde otro lado, la secuencia cambia aristas que ya estaban bien.',
          '- **No coinciden al terminar:** revisa que hiciste la `U` del final, que también es parte de la secuencia.',
          '- **Las esquinas están mal:** es normal, aquí no importan. Se arreglan en los pasos 6 y 7.',
        ],
        [
          '- **Other edges got swapped:** before the sequence, put the 2 matching adjacent edges at the back and on the right. Done from another side, the sequence swaps edges that were already right.',
          "- **They don't match at the end:** check that you did the final `U`, which is part of the sequence too.",
          "- **The corners are wrong:** that's normal, they don't matter here. They get fixed in steps 6 and 7.",
        ],
        [
          '- **Outras arestas trocaram de lugar:** antes da sequência, deixe as 2 vizinhas que coincidem atrás e à direita. Feita de outro lado, a sequência troca arestas que já estavam certas.',
          '- **Não coincidem ao terminar:** confira se você fez o `U` do final, que também faz parte da sequência.',
          '- **As quinas estão erradas:** é normal, aqui não importam. Elas se arrumam nos passos 6 e 7.',
        ],
      ),
      diagram: 'top',
      groups: [{ id: 'prin-aristas-casos', name: tr('Aristas que coinciden', 'Matching edges', 'Arestas que coincidem'),
        description: tr('Gira `U` hasta que 2 aristas coincidan con su centro. Lo que decide el caso es si quedan una al lado de la otra o una enfrente de la otra.',
          'Turn `U` until 2 edges match their centers. What decides the case is whether they end up side by side or facing each other.',
          'Gire `U` até 2 arestas coincidirem com os seus centros. O que decide o caso é se elas ficam uma ao lado da outra ou uma de frente para a outra.'), cases: yellowEdges }],
      quizzes: [],
    },
    {
      id: 'prin-esquinas',
      name: tr('Paso 6: esquinas amarillas a su sitio', 'Step 6: yellow corners into place', 'Passo 6: quinas amarelas no lugar'),
      goal: doc(
        ['**Meta:** cada esquina amarilla en su sitio, entre los 3 centros de sus colores, aunque esté girada.', `**Secuencia:** \`${CYCLE}\`. Deja quieta la esquina de arriba, adelante a la derecha, y mueve las otras 3.`],
        ['**Goal:** each yellow corner in its place, between the 3 centers of its colors, even if twisted.', `**Sequence:** \`${CYCLE}\`. It keeps the top front-right corner still and moves the other 3.`],
        ['**Meta:** cada quina amarela no seu lugar, entre os 3 centros das suas cores, mesmo que esteja girada.', `**Sequência:** \`${CYCLE}\`. Deixa parada a quina de cima, na frente à direita, e move as outras 3.`],
      ),
      goalFigure: 'prin-orientar-u', // in place but twisted: what step 7 starts from
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca una esquina que ya esté en su sitio, aunque el amarillo no mire arriba.',
          '2. Gira el cubo entero para dejarla adelante a la derecha.',
          '3. Haz la secuencia. Si las otras 3 aún no están en su sitio, hazla otra vez.',
          'Si **ninguna** está en su sitio, haz la secuencia 1 vez desde cualquier lado. Así quedará una en su sitio: llévala adelante a la derecha y sigue.',
        ],
        [
          '## How to do it',
          "1. Find a corner that's already in its place, even if its yellow isn't facing up.",
          '2. Rotate the whole cube to put it at the front right.',
          "3. Do the sequence. If the other 3 aren't in their places yet, do it once more.",
          'If **none** is in its place, do the sequence once from any side. Then one will be in place: bring it to the front right and continue.',
        ],
        [
          '## Como fazer',
          '1. Procure uma quina que já esteja no lugar, mesmo que o amarelo não olhe para cima.',
          '2. Gire o cubo inteiro para deixá-la na frente à direita.',
          '3. Faça a sequência. Se as outras 3 ainda não estiverem no lugar, faça de novo.',
          'Se **nenhuma** estiver no lugar, faça a sequência 1 vez de qualquer lado. Assim uma vai ficar no lugar: leve-a para a frente à direita e continue.',
        ],
      ),
      tips: doc(
        [
          '- **No encuentras ninguna esquina en su sitio:** fíjate en sus 3 colores, no en hacia dónde mira el amarillo. Una esquina girada también puede estar en su sitio.',
          '- **Las aristas amarillas ya no coinciden con sus centros:** giraste la capa de arriba. Gira `U` hasta que vuelvan a coincidir y, para cambiar de lado, gira el cubo entero.',
        ],
        [
          "- **You can't find any corner in its place:** look at each corner's 3 colors, not at where its yellow faces. A twisted corner can still be in its place.",
          '- **The yellow edges no longer match their centers:** you turned the top layer. Turn `U` until they match again, and to change sides, rotate the whole cube.',
        ],
        [
          '- **Você não acha nenhuma quina no lugar:** olhe as 3 cores de cada quina, não para onde o amarelo olha. Uma quina girada também pode estar no lugar.',
          '- **As arestas amarelas não coincidem mais com os seus centros:** você girou a camada de cima. Gire `U` até elas voltarem a coincidir e, para mudar de lado, gire o cubo inteiro.',
        ],
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-esquinas-una', name: tr('Una ya en su sitio', 'One already in place', 'Uma já no lugar'),
          description: tr('Gira el cubo entero para dejarla adelante a la derecha. Según hacia dónde deban moverse las otras 3, haz la secuencia 1 o 2 veces.',
            'Rotate the whole cube to put it at the front right. Depending on which way the other 3 must move, do the sequence once or twice.',
            'Gire o cubo inteiro para deixá-la na frente à direita. Conforme o sentido em que as outras 3 precisam se mover, faça a sequência 1 ou 2 vezes.'), cases: oneHome },
        { id: 'prin-esquinas-ninguna', name: tr('Ninguna en su sitio', 'None in place', 'Nenhuma no lugar'),
          description: tr('Haz la secuencia 1 vez desde cualquier lado: quedará una esquina en su sitio. Luego sigue como en «Una ya en su sitio».',
            'Do the sequence once from any side: one corner will end up in its place. Then continue as in "One already in place".',
            'Faça a sequência 1 vez de qualquer lado: uma quina vai ficar no lugar. Depois continue como em "Uma já no lugar".'), cases: noneHome },
      ],
      quizzes: [],
    },
    {
      id: 'prin-orientar',
      name: tr('Paso 7: girar las esquinas', 'Step 7: twist the corners', 'Passo 7: girar as quinas'),
      goal: doc(
        ['**Meta:** el amarillo arriba en las 4 esquinas. ¡Cubo resuelto!', `**Secuencia:** \`${TWIST}\`, sobre la esquina de arriba, adelante a la derecha.`],
        ['**Goal:** all 4 corners with yellow on top. Cube solved!', `**Sequence:** \`${TWIST}\`, on the top front-right corner.`],
        ['**Meta:** o amarelo em cima nas 4 quinas. Cubo resolvido!', `**Sequência:** \`${TWIST}\`, aplicada à quina de cima, na frente à direita.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Sostén el cubo de modo que una esquina con el amarillo de lado quede adelante a la derecha. Desde aquí, **no gires el cubo entero**.',
          `2. Repite \`${TWIST}\` hasta que su amarillo quede arriba: **2 veces** si mira a la derecha, **4** si mira al frente.`,
          '3. Gira solo `U` para traer otra esquina con el amarillo de lado adelante a la derecha, y repite.',
          '4. Cuando las 4 tengan el amarillo arriba, gira `U` hasta que la capa de arriba coincida con el resto.',
          '## Lo que verás',
          'A mitad del paso, las capas de abajo se ven **desordenadas**. Es normal: vuelven solas al terminar la última esquina.',
          `Este paso tiene 7 casos. En CFOP, el método de los speedcubers, cada uno tiene su nombre, como Sune o H. No hace falta memorizarlos: todos se resuelven igual, esquina por esquina con \`${TWIST}\`.`,
        ],
        [
          '## How to do it',
          "1. Hold the cube so that a corner with its yellow facing sideways is at the front right. From here on, **don't rotate the whole cube**.",
          `2. Repeat \`${TWIST}\` until its yellow is on top: **twice** if it faces right, **4 times** if it faces front.`,
          '3. Turn only `U` to bring another corner with its yellow facing sideways to the front right, and repeat.',
          '4. When all 4 have yellow on top, turn `U` until the top layer matches the rest.',
          "## What you'll see",
          "Midway through the step, the bottom layers look **scrambled**. That's normal: they come back on their own when you finish the last corner.",
          `This step has 7 cases. In CFOP, the speedcubers' method, each one has its own name, like Sune or H. You don't need to memorize them: they're all solved the same way, corner by corner with \`${TWIST}\`.`,
        ],
        [
          '## Como fazer',
          '1. Segure o cubo de modo que uma quina com o amarelo de lado fique na frente à direita. A partir daqui, **não gire o cubo inteiro**.',
          `2. Repita \`${TWIST}\` até o amarelo dela ficar em cima: **2 vezes** se ele olha para a direita, **4** se olha para a frente.`,
          '3. Gire só `U` para trazer outra quina com o amarelo de lado para a frente à direita, e repita.',
          '4. Quando as 4 tiverem o amarelo em cima, gire `U` até a camada de cima coincidir com o resto.',
          '## O que você vai ver',
          'No meio do passo, as camadas de baixo parecem **bagunçadas**. É normal: elas voltam sozinhas quando você termina a última quina.',
          `Este passo tem 7 casos. No CFOP, o método dos speedcubers, cada um tem o seu nome, como Sune ou H. Não precisa decorá-los: todos se resolvem do mesmo jeito, quina por quina com \`${TWIST}\`.`,
        ],
      ),
      tips: doc(
        [
          `- **Las capas de abajo no volvieron:** giraste el cubo entre una esquina y otra, o dejaste a medias un \`${TWIST}\`. Entre esquinas gira solo \`U\`, y haz siempre los 4 giros. Retoma desde el último paso que siga completo.`,
          '- **Los lados de arriba se ven revueltos:** no los mires. Solo importa el amarillo de la esquina de adelante a la derecha.',
          '- **Solo queda una esquina con el amarillo de lado y las capas de abajo están bien:** alguien giró esa esquina a mano, y eso no se arregla girando caras. Gírala tú también a mano hasta que el amarillo quede arriba.',
        ],
        [
          `- **The bottom layers didn't come back:** you rotated the cube between one corner and the next, or left an \`${TWIST}\` half done. Between corners, turn only \`U\`, and always do all 4 moves. Pick up from the last step that's still complete.`,
          "- **The sides of the top layer look scrambled:** don't look at them. Only the yellow on the front-right corner matters.",
          "- **Only one corner still has yellow facing sideways and the bottom layers are fine:** someone twisted that corner by hand, and turning faces can't fix that. Twist it by hand yourself until the yellow is on top.",
        ],
        [
          `- **As camadas de baixo não voltaram:** você girou o cubo entre uma quina e outra, ou deixou um \`${TWIST}\` pela metade. Entre uma quina e outra, gire só \`U\` e faça sempre os 4 movimentos. Retome a partir do último passo que continua completo.`,
          '- **Os lados da camada de cima parecem bagunçados:** não olhe para eles. Só importa o amarelo da quina da frente à direita.',
          '- **Só resta uma quina com o amarelo de lado e as camadas de baixo estão certas:** alguém girou essa quina com a mão, e isso não se arruma girando faces. Gire-a você também com a mão até o amarelo ficar em cima.',
        ],
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-orientar-dos', name: tr('Dos esquinas giradas', 'Two twisted corners', 'Duas quinas giradas'), cases: twistTwo },
        { id: 'prin-orientar-tres', name: tr('Tres esquinas giradas', 'Three twisted corners', 'Três quinas giradas'), cases: twistThree },
        { id: 'prin-orientar-cuatro', name: tr('Cuatro esquinas giradas', 'Four twisted corners', 'Quatro quinas giradas'), cases: twistFour },
      ],
      quizzes: [],
    },
  ],
};

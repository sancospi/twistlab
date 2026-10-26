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
    tr('Blanco a la derecha', 'White on the right', 'Branco à direita'),
    tr('Blanco-verde-naranja arriba adelante-derecha, blanco a la derecha', 'White-green-orange at top front-right, white facing right', 'Branco-verde-laranja em cima na frente-direita, branco à direita'),
    TRIGGER, undefined,
    tr("1 gatillo. La U' final no toca la primera capa: R U R' también basta.", "1 trigger. The final U' doesn't touch the first layer: R U R' is enough too.", "1 gatilho. O U' final não mexe na primeira camada: R U R' também basta.")),
  capa1('blanco-arriba', word('Arriba', 'Up', 'Em cima'),
    tr('Blanco arriba', 'White on top', 'Branco em cima'),
    tr('Blanco-verde-naranja arriba adelante-derecha, blanco arriba', 'White-green-orange at top front-right, white facing up', 'Branco-verde-laranja em cima na frente-direita, branco em cima'),
    times(TRIGGER, 3), ["R U2 R' U' R U R'", tr("Más corta: R U2 R' saca el blanco de arriba; U' R U R' lo baja.", "Shorter: R U2 R' takes the white off the top; U' R U R' brings it down.", "Mais curta: R U2 R' tira o branco de cima; U' R U R' desce a quina.")]),
  capa1('blanco-frente', word('Frente', 'Front', 'Frente'),
    tr('Blanco al frente', 'White in front', 'Branco na frente'),
    tr('Blanco-verde-naranja arriba adelante-derecha, blanco al frente', 'White-green-orange at top front-right, white facing front', 'Branco-verde-laranja em cima na frente-direita, branco na frente'),
    times(TRIGGER, 5), ["U R U' R'", tr('El gatillo al revés, 1 vez, equivale a 5 gatillos.', 'The trigger backwards, once, equals 5 triggers.', 'O gatilho ao contrário, 1 vez, equivale a 5 gatilhos.')]),
];
const cornerDown = [
  capa1('girada-derecha', word('Abajo, derecha', 'Bottom, right', 'Embaixo, direita'),
    tr('En su sitio, blanco a la derecha', 'In place, white on the right', 'No lugar, branco à direita'),
    tr('Blanco-verde-naranja en su sitio abajo, pero con el blanco a la derecha', 'White-green-orange in its place at the bottom, but with white facing right', 'Branco-verde-laranja no seu lugar embaixo, mas com o branco à direita'),
    times(TRIGGER, 2)),
  capa1('girada-frente', word('Abajo, frente', 'Bottom, front', 'Embaixo, frente'),
    tr('En su sitio, blanco al frente', 'In place, white in front', 'No lugar, branco na frente'),
    tr('Blanco-verde-naranja en su sitio abajo, pero con el blanco al frente', 'White-green-orange in its place at the bottom, but with white facing front', 'Branco-verde-laranja no seu lugar embaixo, mas com o branco na frente'),
    times(TRIGGER, 4), ["U R U' R' U R U' R'", tr('El gatillo al revés, 2 veces, equivale a 4 gatillos.', 'The trigger backwards, twice, equals 4 triggers.', 'O gatilho ao contrário, 2 vezes, equivale a 4 gatilhos.')]),
  capa1('otra-ranura', word('Otro sitio', 'Other spot', 'Outro lugar'),
    tr('En el sitio de otra', "In another corner's place", 'No lugar de outra'),
    tr('Blanco-verde-naranja abajo adelante-izquierda, blanco al frente; la blanco-verde-roja arriba adelante-izquierda, blanco al frente',
      'White-green-orange at bottom front-left, white facing front; white-green-red at top front-left, white facing front',
      'Branco-verde-laranja embaixo na frente-esquerda, branco na frente; a branco-verde-vermelha em cima na frente-esquerda, branco na frente'),
    `y' ${TRIGGER} y U' ${TRIGGER}`, undefined,
    tr("Con y' el sitio de la blanco-verde-roja queda adelante-derecha: un gatillo saca la blanco-verde-naranja y mete la blanco-verde-roja. Con y vuelves, U' deja la blanco-verde-naranja encima de su sitio y otro gatillo la baja.",
      "With y' the white-green-red slot ends up front-right: one trigger takes out the white-green-orange and puts in the white-green-red. With y you turn back, U' leaves the white-green-orange above its slot and another trigger brings it down.",
      "Com y' o lugar da branco-verde-vermelha fica na frente-direita: um gatilho tira a branco-verde-laranja e coloca a branco-verde-vermelha. Com y você volta, U' deixa a branco-verde-laranja em cima do seu lugar e outro gatilho a desce.")),
];

const capa2 = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, note?: Localized) =>
  kase({ phase: 'capa2', slug, stage: 'second-layer', code, name, recognition, alg, note });

const edgeUp = [
  capa2('derecha', word('Derecha', 'Right', 'Direita'), tr('Inserción a la derecha', 'Insert to the right', 'Inserção à direita'),
    tr('Verde-naranja arriba al frente: verde al frente, naranja arriba', 'Green-orange at top front: green in front, orange on top', 'Verde-laranja em cima na frente: verde na frente, laranja em cima'), RIGHT),
  capa2('izquierda', word('Izquierda', 'Left', 'Esquerda'), tr('Inserción a la izquierda', 'Insert to the left', 'Inserção à esquerda'),
    tr('Verde-roja arriba al frente: verde al frente, rojo arriba', 'Green-red at top front: green in front, red on top', 'Verde-vermelha em cima na frente: verde na frente, vermelho em cima'), LEFT),
];
const edgeStuck = [
  capa2('volteada', word('Volteada', 'Flipped', 'Invertida'), tr('Atascada y volteada', 'Stuck and flipped', 'Presa e invertida'),
    tr('Verde-naranja en su sitio pero volteada: naranja al frente, verde a la derecha', 'Green-orange in its place but flipped: orange in front, green on the right', 'Verde-laranja no seu lugar, mas invertida: laranja na frente, verde à direita'),
    "U R U' R' U' F' U F U' R U' R' U' F' U F",
    tr("Dos inserciones a la derecha: la primera saca la arista. La U2 de en medio se junta con la U inicial de la segunda y queda U'.",
      "Two inserts to the right: the first one takes the edge out. The U2 in the middle merges with the second one's initial U and becomes U'.",
      "Duas inserções à direita: a primeira tira a aresta. O U2 do meio se junta com o U inicial da segunda e vira U'.")),
  capa2('otra-ranura', word('Otra ranura', 'Other slot', 'Outro slot'), tr('Atascada en la ranura de la izquierda', 'Stuck in the left slot', 'Presa no slot da esquerda'),
    tr('Verde-naranja en la ranura adelante-izquierda, naranja al frente; la verde-roja arriba al frente, rojo arriba',
      'Green-orange in the front-left slot, orange in front; green-red at top front, red on top',
      'Verde-laranja no slot frente-esquerda, laranja na frente; a verde-vermelha em cima na frente, vermelho em cima'),
    "U' L' U L U F U' F' U' R U' R' U' F' U F",
    tr("La inserción a la izquierda mete la verde-roja y saca la verde-naranja. Luego la inserción a la derecha (con U2 antes, que junto a su U inicial queda U').",
      "The left insert puts in the green-red and takes out the green-orange. Then the right insert (with a U2 before it, which merges with its initial U into U').",
      "A inserção à esquerda coloca a verde-vermelha e tira a verde-laranja. Depois a inserção à direita (com um U2 antes, que junto com o seu U inicial vira U').")),
];

const yellowCross = [
  kase({ phase: 'cruz', slug: 'linea', stage: 'oll-cross', code: word('Línea', 'Line', 'Linha'), name: tr('Línea', 'Line', 'Linha'),
    recognition: tr('Línea amarilla horizontal (izquierda–derecha)', 'Horizontal yellow line (left–right)', 'Linha amarela horizontal (esquerda–direita)'), alg: CROSS }),
  kase({ phase: 'cruz', slug: 'l', stage: 'oll-cross', code: 'L', name: tr('L', 'L', 'L'),
    recognition: tr('Aristas amarillas atrás y a la izquierda', 'Yellow edges at the back and on the left', 'Arestas amarelas atrás e à esquerda'), alg: CROSS_TWICE,
    note: tr("El algoritmo 2 veces seguidas; la F' y la F del medio se cancelan. La primera vez deja la línea horizontal.",
      "The algorithm twice in a row; the F' and F in the middle cancel. The first time leaves the horizontal line.",
      "O algoritmo 2 vezes seguidas; o F' e o F do meio se cancelam. A primeira vez deixa a linha horizontal.") }),
  kase({ phase: 'cruz', slug: 'punto', stage: 'oll-cross', code: word('Punto', 'Dot', 'Ponto'), name: tr('Punto', 'Dot', 'Ponto'),
    recognition: tr('Solo el centro amarillo; ninguna arista amarilla arriba', 'Only the yellow center; no yellow edge on top', 'Só o centro amarelo; nenhuma aresta amarela em cima'),
    alg: `${CROSS} U2 ${CROSS_TWICE}`,
    note: tr('Una vez deja una L adelante-derecha; U2 la pasa atrás-izquierda y sigues como la L.', 'One pass leaves an L at front-right; U2 moves it to back-left and you continue like the L.', 'Uma vez deixa um L na frente-direita; U2 o leva para atrás-esquerda e você segue como no L.') }),
];

const yellowEdges = [
  kase({ phase: 'aristas', slug: 'vecinas', stage: 'll-edges', code: word('Vecinas', 'Adjacent', 'Vizinhas'), name: tr('Dos vecinas bien', 'Two adjacent edges correct', 'Duas vizinhas certas'),
    recognition: tr('Coinciden la de la derecha (naranja) y la de atrás (azul); adelante hay roja y a la izquierda verde',
      'The right (orange) and back (blue) edges match; red is in front and green on the left',
      'Coincidem a da direita (laranja) e a de trás (azul); na frente está a vermelha e à esquerda a verde'), alg: SUNE }),
  kase({ phase: 'aristas', slug: 'opuestas', stage: 'll-edges', code: word('Opuestas', 'Opposite', 'Opostas'), name: tr('Dos opuestas bien', 'Two opposite edges correct', 'Duas opostas certas'),
    recognition: tr('Coinciden la de la derecha (naranja) y la de la izquierda (roja); adelante hay azul y atrás verde',
      'The right (orange) and left (red) edges match; blue is in front and green at the back',
      'Coincidem a da direita (laranja) e a da esquerda (vermelha); na frente está a azul e atrás a verde'),
    alg: "R U R' U R U2 R' U2 y R U R' U R U2 R' U",
    note: tr('1 vez deja dos vecinas bien. Una U más las alinea (junto a la U final, U2) atrás y a la izquierda; la rotación y las pasa atrás y a la derecha, y repites el algoritmo.',
      'One pass leaves two adjacent edges correct. One more U lines them up (with the final U, U2) at the back and on the left; the y rotation moves them to back and right, and you repeat the algorithm.',
      '1 vez deixa duas vizinhas certas. Mais um U as alinha (junto com o U final, U2) atrás e à esquerda; a rotação y as leva para atrás e à direita, e você repete o algoritmo.') }),
];

const placeCorners = (slug: string, code: string, name: Localized, recognition: Localized, alg: string, alt?: Row['alt'], note?: Localized) =>
  kase({ phase: 'esquinas', slug, stage: 'll-corners-placed', code, name, recognition, alg, alt, note });

const oneHome = [
  placeCorners('antihorario', word('Antihorario', 'Counterclockwise', 'Anti-horário'), tr('Una en su sitio, 1 vez', 'One in place, once', 'Uma no lugar, 1 vez'),
    tr('Adelante-derecha en su sitio; las otras 3 giran en sentido antihorario: la de atrás-derecha (roja-azul) va atrás-izquierda',
      'Front-right in place; the other 3 cycle counterclockwise: the back-right one (red-blue) goes to back-left',
      'Frente-direita no lugar; as outras 3 giram no sentido anti-horário: a de atrás-direita (vermelha-azul) vai para atrás-esquerda'), CYCLE),
  placeCorners('horario', word('Horario', 'Clockwise', 'Horário'), tr('Una en su sitio, 2 veces', 'One in place, twice', 'Uma no lugar, 2 vezes'),
    tr('Adelante-derecha en su sitio; las otras 3 giran en sentido horario: la de atrás-izquierda (naranja-azul) va atrás-derecha',
      'Front-right in place; the other 3 cycle clockwise: the back-left one (orange-blue) goes to back-right',
      'Frente-direita no lugar; as outras 3 giram no sentido horário: a de atrás-esquerda (laranja-azul) vai para atrás-direita'), times(CYCLE, 2),
    ["L' U R U' L U R' U'", tr('El algoritmo al revés, 1 vez, equivale a 2 veces.', 'The algorithm backwards, once, equals twice.', 'O algoritmo ao contrário, 1 vez, equivale a 2 vezes.')]),
];
const noneHome = [
  placeCorners('parejas', word('Parejas', 'Pairs', 'Pares'), tr('Ninguna: cambiadas por parejas', 'None: swapped in pairs', 'Nenhuma: trocadas em pares'),
    tr('Ninguna en su sitio: las 2 de la derecha cambiadas entre sí, y las 2 de la izquierda también',
      'None in place: the 2 on the right swapped with each other, and the 2 on the left too',
      'Nenhuma no lugar: as 2 da direita trocadas entre si, e as 2 da esquerda também'),
    `${CYCLE} y' ${CYCLE}`, undefined,
    tr("1 vez desde aquí deja una en su sitio; con y' queda adelante-derecha y 1 vez más termina.",
      "One pass from here leaves one corner in place; with y' it ends up front-right and one more pass finishes it.",
      "1 vez daqui deixa uma no lugar; com y' ela fica na frente-direita e mais 1 vez termina.")),
  placeCorners('diagonal', 'Diagonal', tr('Ninguna: cambiadas en diagonal', 'None: swapped diagonally', 'Nenhuma: trocadas na diagonal'),
    tr('Ninguna en su sitio: cada esquina va al sitio opuesto en diagonal', 'None in place: each corner goes to the diagonally opposite spot', 'Nenhuma no lugar: cada quina vai para o lugar oposto na diagonal'),
    `${CYCLE} y ${CYCLE}`, undefined,
    tr('1 vez desde aquí deja una en su sitio; con y queda adelante-derecha y 1 vez más termina.',
      'One pass from here leaves one corner in place; with y it ends up front-right and one more pass finishes it.',
      '1 vez daqui deixa uma no lugar; com y ela fica na frente-direita e mais 1 vez termina.')),
];

const twist = (slug: string, code: string, name: Localized, recognition: Localized, alg: string) =>
  kase({ phase: 'orientar', slug, stage: 'll-corners-twist', code, name, recognition, alg });

const twistTwo = [
  twist('u', 'U', tr('Faros: dos vecinas mirando al mismo lado', 'Headlights: two adjacent facing the same way', 'Faróis: duas vizinhas viradas para o mesmo lado'),
    tr('Adelante-derecha y atrás-derecha giradas, las dos con amarillo a la derecha', 'Front-right and back-right twisted, both with yellow facing right', 'Frente-direita e atrás-direita giradas, as duas com amarelo à direita'),
    `${TWIST2} U ${TWIST4} U'`),
  twist('t', 'T', tr('Dos vecinas mirando hacia afuera', 'Two adjacent facing outward', 'Duas vizinhas viradas para fora'),
    tr('Adelante-derecha con amarillo al frente y atrás-derecha con amarillo atrás', 'Front-right with yellow facing front and back-right with yellow facing back', 'Frente-direita com amarelo na frente e atrás-direita com amarelo atrás'),
    `${TWIST4} U ${TWIST2} U'`),
  twist('l', 'L', tr('Dos en diagonal', 'Two corners on a diagonal', 'Duas na diagonal'),
    tr('Adelante-derecha con amarillo al frente y atrás-izquierda con amarillo a la izquierda', 'Front-right with yellow facing front and back-left with yellow facing left', 'Frente-direita com amarelo na frente e atrás-esquerda com amarelo à esquerda'),
    `${TWIST4} U2 ${TWIST2} U2`),
];
const twistThree = [
  twist('antisune', 'Antisune', tr('Tres, 2 veces cada una', 'Three, 2 times each', 'Três, 2 vezes cada uma'),
    tr('Adelante-izquierda bien; amarillo a la derecha en adelante-derecha, atrás en atrás-derecha y a la izquierda en atrás-izquierda',
      'Front-left correct; yellow facing right at front-right, back at back-right and left at back-left',
      'Frente-esquerda certa; amarelo à direita na frente-direita, atrás na atrás-direita e à esquerda na atrás-esquerda'),
    `${TWIST2} U ${TWIST2} U ${TWIST2} U2`),
  twist('sune', 'Sune', tr('Tres, 4 veces cada una', 'Three, 4 times each', 'Três, 4 vezes cada uma'),
    tr('Adelante-izquierda bien; amarillo al frente en adelante-derecha, a la derecha en atrás-derecha y atrás en atrás-izquierda',
      'Front-left correct; yellow facing front at front-right, right at back-right and back at back-left',
      'Frente-esquerda certa; amarelo na frente na frente-direita, à direita na atrás-direita e atrás na atrás-esquerda'),
    `${TWIST4} U ${TWIST4} U ${TWIST4} U2`),
];
const twistFour = [
  twist('pi', 'Pi', tr('Cuatro: faros adelante', 'Four: headlights in front', 'Quatro: faróis na frente'),
    tr('Las 4 giradas: las 2 de adelante con amarillo al frente, atrás-derecha a la derecha y atrás-izquierda a la izquierda',
      'All 4 twisted: the 2 in front with yellow facing front, back-right facing right and back-left facing left',
      'As 4 giradas: as 2 da frente com amarelo na frente, atrás-direita à direita e atrás-esquerda à esquerda'),
    `${TWIST4} U ${TWIST4} U ${TWIST2} U ${TWIST2} U`),
  twist('h', 'H', tr('Cuatro: faros adelante y atrás', 'Four: headlights front and back', 'Quatro: faróis na frente e atrás'),
    tr('Las 4 giradas: las 2 de adelante con amarillo al frente y las 2 de atrás con amarillo atrás',
      'All 4 twisted: the 2 in front with yellow facing front and the 2 in back with yellow facing back',
      'As 4 giradas: as 2 da frente com amarelo na frente e as 2 de trás com amarelo atrás'),
    `${TWIST4} U ${TWIST2} U ${TWIST4} U ${TWIST2} U`),
];

// Each phase is taught the same way (types.ts): the goal and its sequence, a few numbered steps, and what to do when
// something goes wrong, folded. Short lines: someone reads them with a cube in their hands.
export const beginner: Method = {
  id: 'principiante',
  next: 'cfop-reducido',
  name: tr('Método principiante', 'Beginner method', 'Método para iniciantes'),
  summary: tr('Tu primer cubo resuelto: capa por capa, con 7 secuencias cortas que se repiten.', 'Your first solved cube: layer by layer, with 7 short sequences that repeat.', 'Seu primeiro cubo resolvido: camada por camada, com 7 sequências curtas que se repetem.'),
  description: doc(
    [
      'Para resolver el cubo por primera vez. Lo armas **capa por capa**: primero la blanca (abajo), luego la del medio y al final la amarilla (arriba).',
      'Son 7 pasos, y cada uno usa **una secuencia corta** que repites 1 o más veces según lo que veas.',
      '## Los 7 pasos',
      '1. **Cruz blanca:** sin algoritmos, arista por arista. Se explica en el enlace «Paso 1» de arriba.',
      `2. **Esquinas blancas:** \`${TRIGGER}\``,
      `3. **Segunda capa:** \`${RIGHT}\` o su espejo`,
      `4. **Cruz amarilla:** \`${CROSS}\``,
      `5. **Aristas amarillas:** \`${SUNE}\``,
      `6. **Esquinas amarillas a su sitio:** \`${CYCLE}\``,
      `7. **Girar las esquinas:** \`${TWIST}\``,
      '## Cómo aprenderlo',
      '- **Un paso por sesión**, en orden. Pasa al siguiente cuando lo hagas sin mirar.',
      '- Con 20–30 min al día, tu primer cubo suele salir en **1 o 2 semanas**. La primera resolución puede tardar 5 minutos o más.',
      '- **Si te pierdes:** busca el último paso que sigue completo y retoma desde el siguiente.',
      '- Cuando lo resuelvas sin guía, sigue con el **CFOP reducido**.',
    ],
    [
      'For solving the cube for the first time. You build it **layer by layer**: first the white one (bottom), then the middle one and finally the yellow one (top).',
      'There are 7 steps, and each one uses **one short sequence** that you repeat 1 or more times depending on what you see.',
      '## The 7 steps',
      '1. **White cross:** no algorithms, one edge at a time. The "Step 1" link above explains it.',
      `2. **White corners:** \`${TRIGGER}\``,
      `3. **Second layer:** \`${RIGHT}\` or its mirror`,
      `4. **Yellow cross:** \`${CROSS}\``,
      `5. **Yellow edges:** \`${SUNE}\``,
      `6. **Yellow corners into place:** \`${CYCLE}\``,
      `7. **Twist the corners:** \`${TWIST}\``,
      '## How to learn it',
      '- **One step per session**, in order. Move on when you can do it without looking.',
      '- With 20–30 min a day, your first solve usually comes in **1 or 2 weeks**. The first one may take 5 minutes or more.',
      '- **If you get lost:** find the last step that is still complete and pick up from the next one.',
      '- Once you can solve it without the guide, move on to **reduced CFOP**.',
    ],
    [
      'Para resolver o cubo pela primeira vez. Você o monta **camada por camada**: primeiro a branca (embaixo), depois a do meio e por último a amarela (em cima).',
      'São 7 passos, e cada um usa **uma sequência curta** que você repete 1 ou mais vezes conforme o que vê.',
      '## Os 7 passos',
      '1. **Cruz branca:** sem algoritmos, uma aresta de cada vez. O link "Passo 1" acima explica.',
      `2. **Quinas brancas:** \`${TRIGGER}\``,
      `3. **Segunda camada:** \`${RIGHT}\` ou o seu espelho`,
      `4. **Cruz amarela:** \`${CROSS}\``,
      `5. **Arestas amarelas:** \`${SUNE}\``,
      `6. **Quinas amarelas no lugar:** \`${CYCLE}\``,
      `7. **Girar as quinas:** \`${TWIST}\``,
      '## Como aprender',
      '- **Um passo por sessão**, em ordem. Passe para o próximo quando conseguir sem olhar.',
      '- Com 20–30 min por dia, seu primeiro cubo costuma sair em **1 ou 2 semanas**. A primeira resolução pode levar 5 minutos ou mais.',
      '- **Se você se perder:** procure o último passo que continua completo e retome a partir do seguinte.',
      '- Quando resolver sem guia, siga para o **CFOP reduzido**.',
    ],
  ),
  orientation: doc(
    [
      '**Amarillo arriba y verde al frente**; el naranja queda a la derecha y la cruz blanca, abajo.',
      'Los casos usan la pieza de **adelante a la derecha**. Si la tuya está en otro lado, gira el cubo entero (`y`) hasta tenerla ahí, siempre con el amarillo arriba. Menos en el paso 7: ahí solo giras `U`.',
    ],
    [
      '**Yellow on top and green in front**; orange ends up on the right and the white cross at the bottom.',
      'The cases use the piece at the **front right**. If yours is elsewhere, rotate the whole cube (`y`) until it is there, always with yellow on top. Except in step 7: there you only turn `U`.',
    ],
    [
      '**Amarelo em cima e verde na frente**; o laranja fica à direita e a cruz branca, embaixo.',
      'Os casos usam a peça da **frente à direita**. Se a sua está em outro lugar, gire o cubo inteiro (`y`) até ela ficar ali, sempre com o amarelo em cima. Menos no passo 7: ali você só gira `U`.',
    ],
  ),
  notation: doc(
    [
      '## Movimientos',
      '- Cada letra gira una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente, `B` atrás.',
      '- La letra sola es un cuarto de vuelta en sentido horario, mirando esa cara de frente (`D`, desde abajo).',
      "- Con apóstrofo, al revés: `R'`. Con un 2, media vuelta: `U2`.",
      '- `y` gira el cubo entero, como `U`: no mueve piezas, solo cambia qué cara queda al frente.',
      '## Bloques',
      `Varias secuencias repiten un bloque corto, como el **gatillo** \`${TRIGGER}\` o \`${TWIST}\`. Haz cada bloque de corrido y cuenta bloques, no giros.`,
      '## Figuras',
      '- **Pasos 2 y 3:** el cubo visto desde arriba, adelante y a la derecha.',
      '- **Pasos 4 a 7:** la cara amarilla desde arriba, con el frente abajo. Las barritas son las pegatinas de los lados.',
      '- En gris, lo que todavía no importa. En el paso 6, las flechas dicen a dónde va cada esquina.',
    ],
    [
      '## Moves',
      '- Each letter turns a face: `R` right, `L` left, `U` up, `D` down, `F` front, `B` back.',
      '- A letter alone is a quarter turn clockwise, looking at that face head-on (`D`, from below).',
      "- With an apostrophe, the other way: `R'`. With a 2, a half turn: `U2`.",
      '- `y` rotates the whole cube, like `U`: it moves no pieces, it only changes which face is in front.',
      '## Blocks',
      `Several sequences repeat a short block, like the **trigger** \`${TRIGGER}\` or \`${TWIST}\`. Do each block in one go and count blocks, not turns.`,
      '## Diagrams',
      '- **Steps 2 and 3:** the cube seen from the top, front and right.',
      '- **Steps 4 to 7:** the yellow face from above, with the front at the bottom. The little bars are the side stickers.',
      "- In gray, what doesn't matter yet. In step 6, the arrows show where each corner goes.",
    ],
    [
      '## Movimentos',
      '- Cada letra gira uma face: `R` direita, `L` esquerda, `U` em cima, `D` embaixo, `F` frente, `B` atrás.',
      '- A letra sozinha é um quarto de volta no sentido horário, olhando para essa face de frente (`D`, por baixo).',
      "- Com apóstrofo, ao contrário: `R'`. Com um 2, meia volta: `U2`.",
      '- `y` gira o cubo inteiro, como `U`: não move peças, só muda qual face fica na frente.',
      '## Blocos',
      `Várias sequências repetem um bloco curto, como o **gatilho** \`${TRIGGER}\` ou \`${TWIST}\`. Faça cada bloco de uma vez e conte blocos, não movimentos.`,
      '## Figuras',
      '- **Passos 2 e 3:** o cubo visto de cima, da frente e da direita.',
      '- **Passos 4 a 7:** a face amarela vista de cima, com a frente embaixo. As barrinhas são os adesivos dos lados.',
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
          '1. Busca arriba una esquina con blanco y mira sus otros 2 colores.',
          '2. Gira `U` hasta dejarla justo encima de su sitio: entre los centros de esos 2 colores.',
          '3. Gira el cubo entero para tenerla adelante a la derecha.',
          '4. Haz el gatillo hasta que baje con el blanco abajo: **1 vez** si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.',
          'Repite con cada esquina hasta tener las 4.',
        ],
        [
          '## How to do it',
          '1. Find a corner with white in the top layer and look at its other 2 colors.',
          '2. Turn `U` until it is right above its spot: between the centers of those 2 colors.',
          '3. Rotate the whole cube to have it at the front right.',
          '4. Do the trigger until it drops in with white at the bottom: **1 time** if white faces right, **3** if it faces up, **5** if it faces front.',
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
          '- **Una esquina blanca está abajo pero mal** (girada, o en el sitio de otra): ponla adelante a la derecha y haz 1 gatillo. Así sube: sigue con ella desde el punto 2.',
          '- **Bajó en el sitio equivocado:** antes del gatillo, comprueba que está justo encima de su sitio, entre sus 2 colores.',
          '- **No entra, o se desarma algo:** haz siempre los 4 giros del gatillo y no gires el cubo hasta que la esquina entre.',
        ],
        [
          "- **A white corner is at the bottom but wrong** (twisted, or in another corner's spot): put it at the front right and do 1 trigger. That brings it up: continue with it from point 2.",
          '- **It dropped into the wrong spot:** before the trigger, check that it is right above its spot, between its 2 colors.',
          "- **It won't go in, or something comes apart:** always do all 4 turns of the trigger, and don't rotate the cube until the corner is in.",
        ],
        [
          '- **Uma quina branca está embaixo, mas errada** (girada, ou no lugar de outra): coloque-a na frente à direita e faça 1 gatilho. Assim ela sobe: continue com ela a partir do item 2.',
          '- **Desceu no lugar errado:** antes do gatilho, confira que ela está bem em cima do seu lugar, entre as suas 2 cores.',
          '- **Não entra, ou algo se desmonta:** faça sempre os 4 movimentos do gatilho e não gire o cubo até a quina entrar.',
        ],
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'prin-capa1-arriba',
          name: tr('Esquina arriba, encima de su sitio', 'Corner on top, above its spot', 'Quina em cima, sobre o seu lugar'),
          description: tr('Hacia dónde mira el blanco: a la derecha, 1 gatillo; arriba, 3; al frente, 5.', 'Where white faces: right, 1 trigger; up, 3; front, 5.', 'Para onde o branco olha: direita, 1 gatilho; cima, 3; frente, 5.'),
          cases: cornerUp,
        },
        {
          id: 'prin-capa1-abajo',
          name: tr('Esquina abajo, mal puesta', 'Corner at the bottom, misplaced', 'Quina embaixo, mal colocada'),
          description: tr('Un gatillo la sube; luego, como las de arriba.', 'One trigger brings it up; then, like the ones above.', 'Um gatilho a sobe; depois, como as de cima.'),
          cases: cornerDown,
        },
      ],
      quizzes: [],
    },
    {
      id: 'prin-capa2',
      name: tr('Paso 3: segunda capa', 'Step 3: second layer', 'Passo 3: segunda camada'),
      goal: doc(
        ['**Meta:** las dos primeras capas completas: en cada lado, las 2 filas de abajo de un solo color.', `**Secuencias:** a la derecha \`${RIGHT}\`; a la izquierda, su espejo \`${LEFT}\`.`],
        ['**Goal:** the first two layers complete: on each side, the bottom 2 rows all one color.', `**Sequences:** to the right \`${RIGHT}\`; to the left, its mirror \`${LEFT}\`.`],
        ['**Meta:** as duas primeiras camadas completas: em cada lado, as 2 fileiras de baixo de uma cor só.', `**Sequências:** para a direita \`${RIGHT}\`; para a esquerda, o seu espelho \`${LEFT}\`.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca arriba una arista **sin amarillo**.',
          '2. Gira `U` hasta que el color de su lado coincida con el centro de ese lado.',
          '3. Gira el cubo entero para tenerla al frente.',
          '4. Mira su color de **arriba**: la arista va hacia el lado de ese color. Si es el del centro derecho, haz la secuencia a la derecha; si es el del izquierdo, a la izquierda.',
          'Repite hasta colocar las 4.',
        ],
        [
          '## How to do it',
          '1. Find an edge on top **without yellow**.',
          '2. Turn `U` until its side color matches the center on that side.',
          '3. Rotate the whole cube to have it in front.',
          "4. Look at its **top** color: the edge goes toward that color's side. If it is the right center's color, do the sequence to the right; if it is the left one's, to the left.",
          'Repeat until all 4 are in.',
        ],
        [
          '## Como fazer',
          '1. Procure em cima uma aresta **sem amarelo**.',
          '2. Gire `U` até a cor lateral dela coincidir com o centro desse lado.',
          '3. Gire o cubo inteiro para deixá-la na frente.',
          '4. Olhe a cor de **cima** dela: a aresta vai para o lado dessa cor. Se é a do centro da direita, faça a sequência para a direita; se é a do centro da esquerda, para a esquerda.',
          'Repita até colocar as 4.',
        ],
      ),
      tips: doc(
        [
          '- **Todas las de arriba tienen amarillo, pero falta alguna:** está atascada en el medio, volteada o en el sitio de otra. Ponla adelante a la derecha y haz la secuencia a la derecha: sale arriba. Luego colócala como siempre.',
          '- **Usaste una arista con amarillo:** esas son de la última capa; déjalas arriba.',
          '- **Fue al lado contrario:** el lado lo decide el color de arriba, no el del frente.',
        ],
        [
          "- **All the top edges have yellow, but one is missing:** it is stuck in the middle, flipped or in another edge's spot. Put it at the front right and do the sequence to the right: it comes out on top. Then place it as usual.",
          '- **You used an edge with yellow:** those belong to the last layer; leave them on top.',
          '- **It went to the wrong side:** the top color decides the side, not the front one.',
        ],
        [
          '- **Todas as de cima têm amarelo, mas falta alguma:** ela está presa no meio, invertida ou no lugar de outra. Coloque-a na frente à direita e faça a sequência para a direita: ela sai para cima. Depois coloque-a como sempre.',
          '- **Você usou uma aresta com amarelo:** essas são da última camada; deixe-as em cima.',
          '- **Foi para o lado errado:** quem decide o lado é a cor de cima, não a da frente.',
        ],
      ),
      diagram: 'iso',
      groups: [
        { id: 'prin-capa2-arriba', name: tr('Arista arriba', 'Edge on top', 'Aresta em cima'), description: tr('Alinéala con su centro al frente; su color de arriba dice el lado.', 'Line it up with its center in front; its top color tells the side.', 'Alinhe-a com o seu centro na frente; a cor de cima diz o lado.'), cases: edgeUp },
        { id: 'prin-capa2-atascada', name: tr('Arista atascada', 'Stuck edge', 'Aresta presa'), description: tr('La secuencia a la derecha la saca; luego colócala bien.', 'The sequence to the right takes it out; then place it properly.', 'A sequência para a direita a tira; depois coloque-a direito.'), cases: edgeStuck },
      ],
      quizzes: [],
    },
    {
      id: 'prin-cruz',
      name: tr('Paso 4: cruz amarilla', 'Step 4: yellow cross', 'Passo 4: cruz amarela'),
      goal: doc(
        ['**Meta:** una cruz amarilla arriba. Solo cuentan las aristas; las esquinas, todavía no.', `**Secuencia:** \`${CROSS}\`, de 1 a 3 veces.`],
        ['**Goal:** a yellow cross on top. Only the edges count; the corners, not yet.', `**Sequence:** \`${CROSS}\`, 1 to 3 times.`],
        ['**Meta:** uma cruz amarela em cima. Só contam as arestas; as quinas, ainda não.', `**Sequência:** \`${CROSS}\`, de 1 a 3 vezes.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          'Mira qué forma hacen las aristas amarillas de arriba. Gira `U` hasta dejarla como se indica y haz la secuencia:',
          '- **Línea:** horizontal, de izquierda a derecha. **1 vez.**',
          '- **L:** con sus 2 aristas atrás y a la izquierda. **2 veces.**',
          '- **Punto** (solo el centro): **1 vez**, desde cualquier lado. Sale una L: sigue con ella.',
        ],
        [
          '## How to do it',
          'Look at the shape the yellow edges make on top. Turn `U` until it sits as shown, and do the sequence:',
          '- **Line:** horizontal, from left to right. **1 time.**',
          '- **L:** with its 2 edges at the back and on the left. **2 times.**',
          '- **Dot** (only the center): **1 time**, from any side. An L appears: continue with it.',
        ],
        [
          '## Como fazer',
          'Veja que forma as arestas amarelas fazem em cima. Gire `U` até deixá-la como indicado e faça a sequência:',
          '- **Linha:** na horizontal, da esquerda para a direita. **1 vez.**',
          '- **L:** com as suas 2 arestas atrás e à esquerda. **2 vezes.**',
          '- **Ponto** (só o centro): **1 vez**, de qualquer lado. Aparece um L: continue com ele.',
        ],
      ),
      tips: doc(
        [
          '- **Salió otra forma:** no pasa nada, la sostuviste de otro modo. Mira la forma nueva y sigue desde ahí.',
          '- **Ves 1 o 3 aristas amarillas:** cuenta solo las aristas (la pieza del medio de cada borde), no las esquinas.',
          '- **Son de verdad 1 o 3:** una arista quedó volteada por dentro (el cubo se desarmó o alguien la giró), y eso no se arregla girando caras. Sácala, ponla al revés y empieza de nuevo.',
        ],
        [
          '- **Another shape came out:** no problem, you held it another way. Look at the new shape and continue from there.',
          '- **You see 1 or 3 yellow edges:** count only the edges (the middle piece of each side), not the corners.',
          "- **There really are 1 or 3:** an edge got flipped inside the cube (it came apart or someone twisted it), and turning faces can't fix that. Take it out, put it back the other way and start over.",
        ],
        [
          '- **Saiu outra forma:** tudo bem, você segurou de outro jeito. Veja a forma nova e continue a partir dela.',
          '- **Você vê 1 ou 3 arestas amarelas:** conte só as arestas (a peça do meio de cada borda), não as quinas.',
          '- **São mesmo 1 ou 3:** uma aresta ficou invertida por dentro (o cubo se desmontou ou alguém a girou), e isso não se arruma girando faces. Tire-a, coloque-a ao contrário e comece de novo.',
        ],
      ),
      diagram: 'top',
      groups: [{ id: 'prin-cruz-formas', name: tr('Formas amarillas', 'Yellow shapes', 'Formas amarelas'), description: tr('Mira solo las aristas amarillas de arriba.', 'Look only at the yellow edges on top.', 'Olhe só as arestas amarelas de cima.'), cases: yellowCross }],
      quizzes: [],
    },
    {
      id: 'prin-aristas',
      name: tr('Paso 5: aristas amarillas', 'Step 5: yellow edges', 'Passo 5: arestas amarelas'),
      goal: doc(
        ['**Meta:** cada arista amarilla junto al centro de su color, sin perder la cruz.', `**Secuencia:** \`${SUNE}\`. Cambia de sitio las aristas de adelante y de la izquierda.`],
        ['**Goal:** each yellow edge next to the center of its color, without losing the cross.', `**Sequence:** \`${SUNE}\`. It swaps the front and left edges.`],
        ['**Meta:** cada aresta amarela junto do centro da sua cor, sem perder a cruz.', `**Sequência:** \`${SUNE}\`. Troca de lugar as arestas da frente e da esquerda.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          'Gira `U` hasta que al menos 2 aristas coincidan con su centro (siempre se puede). Luego:',
          '- **Dos vecinas** (una al lado de la otra): gira el cubo entero para dejarlas atrás y a la derecha. **1 vez.**',
          '- **Dos opuestas** (una enfrente de la otra): **1 vez**, desde cualquier lado. Quedan dos vecinas: gira `U` hasta verlas y sigue como arriba.',
          '- **Las 4:** listo, pasa al paso 6.',
        ],
        [
          '## How to do it',
          'Turn `U` until at least 2 edges match their center (it is always possible). Then:',
          '- **Two adjacent** (side by side): rotate the whole cube to put them at the back and on the right. **1 time.**',
          '- **Two opposite** (facing each other): **1 time**, from any side. Two adjacent are left: turn `U` until you see them and continue as above.',
          '- **All 4:** done, go to step 6.',
        ],
        [
          '## Como fazer',
          'Gire `U` até pelo menos 2 arestas coincidirem com o seu centro (sempre dá). Depois:',
          '- **Duas vizinhas** (uma ao lado da outra): gire o cubo inteiro para deixá-las atrás e à direita. **1 vez.**',
          '- **Duas opostas** (uma de frente para a outra): **1 vez**, de qualquer lado. Ficam duas vizinhas: gire `U` até vê-las e continue como acima.',
          '- **As 4:** pronto, passe para o passo 6.',
        ],
      ),
      tips: doc(
        [
          '- **Cambió otras aristas:** las vecinas van siempre atrás y a la derecha; desde otro lado, cambia otras.',
          '- **No coinciden al terminar:** la `U` del final es parte de la secuencia.',
          '- **Las esquinas están mal:** es normal, aquí no importan. Se arreglan en los pasos 6 y 7.',
        ],
        [
          '- **Other edges got swapped:** the adjacent ones always go back and right; from another side it swaps others.',
          "- **They don't match at the end:** the final `U` is part of the sequence.",
          "- **The corners are wrong:** that's normal, they don't matter here. They get fixed in steps 6 and 7.",
        ],
        [
          '- **Trocou outras arestas:** as vizinhas vão sempre atrás e à direita; de outro lado, troca outras.',
          '- **Não coincidem no final:** o `U` do final faz parte da sequência.',
          '- **As quinas estão erradas:** é normal, aqui não importam. Elas se arrumam nos passos 6 e 7.',
        ],
      ),
      diagram: 'top',
      groups: [{ id: 'prin-aristas-casos', name: tr('Aristas que coinciden', 'Matching edges', 'Arestas que coincidem'), description: tr('Gira `U` hasta que coincidan 2 y mira dónde quedan.', 'Turn `U` until 2 match and see where they are.', 'Gire `U` até coincidirem 2 e veja onde ficam.'), cases: yellowEdges }],
      quizzes: [],
    },
    {
      id: 'prin-esquinas',
      name: tr('Paso 6: esquinas amarillas a su lugar', 'Step 6: yellow corners into place', 'Passo 6: quinas amarelas no lugar'),
      goal: doc(
        ['**Meta:** cada esquina amarilla en su sitio, aunque esté girada: con los colores de los 3 centros que la rodean, en cualquier orden.', `**Secuencia:** \`${CYCLE}\`. Deja quieta la esquina de adelante-derecha y mueve las otras 3.`],
        ['**Goal:** each yellow corner in its spot, even if twisted: with the colors of the 3 centers around it, in any order.', `**Sequence:** \`${CYCLE}\`. It keeps the front-right corner still and moves the other 3.`],
        ['**Meta:** cada quina amarela no seu lugar, mesmo que esteja girada: com as cores dos 3 centros ao redor dela, em qualquer ordem.', `**Sequência:** \`${CYCLE}\`. Deixa parada a quina da frente-direita e move as outras 3.`],
      ),
      goalFigure: 'prin-orientar-u', // in place but twisted: what step 7 starts from
      description: doc(
        [
          '## Cómo se hace',
          '1. Busca una esquina que ya esté en su sitio.',
          '2. Gira el cubo entero para dejarla adelante a la derecha.',
          '3. Haz la secuencia. Si las otras 3 aún no están en su sitio, hazla otra vez.',
          'Si **ninguna** está en su sitio, haz la secuencia 1 vez desde cualquier lado: quedará una. Sigue desde el punto 2.',
        ],
        [
          '## How to do it',
          '1. Find a corner that is already in its spot.',
          '2. Rotate the whole cube to put it at the front right.',
          "3. Do the sequence. If the other 3 aren't in their spots yet, do it once more.",
          'If **none** is in its spot, do the sequence 1 time from any side: one will be. Continue from point 2.',
        ],
        [
          '## Como fazer',
          '1. Procure uma quina que já esteja no lugar.',
          '2. Gire o cubo inteiro para deixá-la na frente à direita.',
          '3. Faça a sequência. Se as outras 3 ainda não estiverem no lugar, faça de novo.',
          'Se **nenhuma** estiver no lugar, faça a sequência 1 vez de qualquer lado: uma vai ficar. Continue a partir do item 2.',
        ],
      ),
      tips: doc(
        [
          '- **Te fijaste en el amarillo:** aquí solo importa el sitio. El amarillo se arregla en el paso 7.',
          '- **Giraste la capa de arriba para acomodar:** las aristas ya están bien. Para cambiar de ángulo, gira el cubo entero.',
        ],
        [
          '- **You looked at the yellow:** only the spot matters here. The yellow gets fixed in step 7.',
          '- **You turned the top layer to adjust:** the edges are already right. To change the angle, rotate the whole cube.',
        ],
        [
          '- **Você olhou o amarelo:** aqui só importa o lugar. O amarelo se arruma no passo 7.',
          '- **Você girou a camada de cima para ajeitar:** as arestas já estão certas. Para mudar de ângulo, gire o cubo inteiro.',
        ],
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-esquinas-una', name: tr('Una ya en su sitio', 'One already in place', 'Uma já no lugar'), description: tr('Ponla adelante a la derecha.', 'Put it at the front right.', 'Coloque-a na frente à direita.'), cases: oneHome },
        { id: 'prin-esquinas-ninguna', name: tr('Ninguna en su sitio', 'None in place', 'Nenhuma no lugar'), description: tr('Una vez desde cualquier lado, y sigues como arriba.', 'Once from any side, then continue as above.', 'Uma vez de qualquer lado, e continue como acima.'), cases: noneHome },
      ],
      quizzes: [],
    },
    {
      id: 'prin-orientar',
      name: tr('Paso 7: girar las esquinas', 'Step 7: twist the corners', 'Passo 7: girar as quinas'),
      goal: doc(
        ['**Meta:** el amarillo arriba en las 4 esquinas. ¡Cubo resuelto!', `**Secuencia:** \`${TWIST}\`, sobre la esquina de adelante-derecha.`],
        ['**Goal:** yellow on top on all 4 corners. Cube solved!', `**Sequence:** \`${TWIST}\`, on the front-right corner.`],
        ['**Meta:** o amarelo em cima nas 4 quinas. Cubo resolvido!', `**Sequência:** \`${TWIST}\`, sobre a quina da frente-direita.`],
      ),
      description: doc(
        [
          '## Cómo se hace',
          '1. Sostén el cubo de modo que una esquina con el amarillo de lado quede adelante a la derecha. Desde aquí, **no gires el cubo entero**.',
          `2. Repite \`${TWIST}\` hasta que su amarillo quede arriba: **2 veces** si mira a la derecha, **4** si mira al frente.`,
          '3. Gira solo `U` para traer otra esquina con el amarillo de lado adelante a la derecha, y repite.',
          '4. Cuando las 4 tengan el amarillo arriba, gira `U` hasta alinear la capa.',
          '**A mitad del paso, las capas de abajo se ven rotas. Es normal:** vuelven solas con la última esquina.',
          'Abajo están los 7 casos posibles, con sus nombres del CFOP (Sune, H…). No hace falta memorizarlos: todos salen con estos 4 pasos.',
        ],
        [
          '## How to do it',
          "1. Hold the cube so that a corner with its yellow on a side is at the front right. From here on, **don't rotate the whole cube**.",
          `2. Repeat \`${TWIST}\` until its yellow is on top: **2 times** if it faces right, **4** if it faces front.`,
          '3. Turn only `U` to bring another corner with its yellow on a side to the front right, and repeat.',
          '4. When all 4 have yellow on top, turn `U` to line up the layer.',
          "**Midway through, the bottom layers look broken. That's normal:** they come back on their own with the last corner.",
          "Below are the 7 possible cases, with their CFOP names (Sune, H…). You don't need to memorize them: they all come out with these 4 steps.",
        ],
        [
          '## Como fazer',
          '1. Segure o cubo de modo que uma quina com o amarelo de lado fique na frente à direita. A partir daqui, **não gire o cubo inteiro**.',
          `2. Repita \`${TWIST}\` até o amarelo dela ficar em cima: **2 vezes** se ele olha para a direita, **4** se olha para a frente.`,
          '3. Gire só `U` para trazer outra quina com o amarelo de lado para a frente à direita, e repita.',
          '4. Quando as 4 tiverem o amarelo em cima, gire `U` até alinhar a camada.',
          '**No meio do passo, as camadas de baixo parecem quebradas. É normal:** elas voltam sozinhas com a última quina.',
          'Abaixo estão os 7 casos possíveis, com os seus nomes do CFOP (Sune, H…). Não precisa decorá-los: todos saem com estes 4 passos.',
        ],
      ),
      tips: doc(
        [
          '- **Las capas de abajo no volvieron:** giraste el cubo entre esquinas o cortaste un bloque. Entre esquinas, solo `U`, y cuenta bloques completos de 4 giros. Retoma desde el último paso que siga completo.',
          '- **Los lados de arriba se ven revueltos:** no los mires. Solo importa el amarillo de la esquina de adelante-derecha.',
        ],
        [
          "- **The bottom layers didn't come back:** you rotated the cube between corners or cut a block short. Between corners, only `U`, and count full blocks of 4 turns. Pick up from the last step that is still complete.",
          "- **The top sides look scrambled:** don't look at them. Only the yellow of the front-right corner matters.",
        ],
        [
          '- **As camadas de baixo não voltaram:** você girou o cubo entre quinas ou cortou um bloco. Entre quinas, só `U`, e conte blocos completos de 4 movimentos. Retome a partir do último passo que continua completo.',
          '- **Os lados de cima parecem bagunçados:** não olhe para eles. Só importa o amarelo da quina da frente-direita.',
        ],
      ),
      diagram: 'top',
      groups: [
        { id: 'prin-orientar-dos', name: tr('Dos esquinas giradas', 'Two corners twisted', 'Duas quinas giradas'), cases: twistTwo },
        { id: 'prin-orientar-tres', name: tr('Tres esquinas giradas', 'Three corners twisted', 'Três quinas giradas'), cases: twistThree },
        { id: 'prin-orientar-cuatro', name: tr('Cuatro esquinas giradas', 'Four corners twisted', 'Quatro quinas giradas'), cases: twistFour },
      ],
      quizzes: [],
    },
  ],
};

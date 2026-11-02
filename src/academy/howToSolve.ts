// "Cómo resolver el cubo de Rubik paso a paso" (/como-resolver-el-cubo-de-rubik): the beginner method (beginner.ts) as
// one article for people who search for exactly that. Each step has a case's diagram and a link to where the Academia
// teaches it in full. Pure: seo.ts prerenders it, howToView.ts draws it in the app. Bodies are rich text (rich-text.ts).
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY } from '../notation.ts';
import { doc, loc, tr, type Localized } from '../i18n.ts';
import { routePath, type AcademyPage } from '../router.ts';
import { beginner } from './beginner.ts';
import { caseState } from './cube.ts';
import { caseDiagram } from './diagram.ts';

const academy = (page: AcademyPage, hash = '') => routePath({ mod: 'academy', page }) + hash;
const step = (phase: string) => academy({ kind: 'method', id: beginner.id }, `#academy-${phase}`); // view.ts's phase anchors
const inMethod = (phase: string) => ({ href: step(phase), label: tr('Este paso en el método principiante', 'This step in the beginner method', 'Este passo no método para iniciantes') });
// the tools for the big searches ("cronómetro…", "resolver el cubo de Rubik online"), from where the article meets them
const solver = { href: routePath({ mod: 'cube', page: 'paint' }), label: tr('Resolver el cubo de Rubik online: pinta tu cubo y te doy la solución', "Online Rubik's cube solver: paint your cube and get the solution", 'Resolver o cubo mágico online: pinte seu cubo e receba a solução') };
const timer = { href: routePath({ mod: 'solve' }), label: tr('Cronómetro para cubo de Rubik online, con mezclas oficiales', "Online Rubik's cube timer, with official scrambles", 'Cronômetro para cubo mágico online, com embaralhamentos oficiais') };

export interface HowToSection {
  id: string;
  title: Localized;
  body: Localized;
  figure?: string; // a beginner case's id: its diagram, as on its card
  more?: { href: string; label: Localized }[]; // links to where the Academia (or a tool) takes it further
}

export const howToSolve = {
  name: tr('Cómo resolver el cubo de Rubik paso a paso', "How to solve a Rubik's cube step by step", 'Como resolver o cubo mágico passo a passo'),
  summary: tr(
    'Guía para principiantes: resuelve el cubo de Rubik capa por capa en 7 pasos, con 6 secuencias cortas y diagramas.',
    "A beginner's guide: solve the Rubik's cube layer by layer in 7 steps, with 6 short sequences and diagrams.",
    'Guia para iniciantes: resolva o cubo mágico camada por camada em 7 passos, com 6 sequências curtas e diagramas.',
  ),
  nav: tr('Pasos de la guía', 'Guide steps', 'Passos do guia'), // the side navigation's name
  sections: [
    {
      id: 'intro',
      title: tr('Cómo resolver el cubo de Rubik paso a paso', "How to solve a Rubik's cube step by step", 'Como resolver o cubo mágico passo a passo'),
      body: doc(
        [
          'Cualquiera puede resolver el cubo de Rubik, y no hace falta buena memoria. Con el **método principiante** lo armas capa por capa con solo **6 secuencias cortas**, una de ellas también en espejo.',
          'Una secuencia es una serie fija de giros, lo que otros métodos llaman algoritmo. Las de este método tienen de 4 a 8 giros, y en muchos pasos solo repites la misma.',
          'Esta guía es el mapa completo: qué haces en cada uno de los 7 pasos y con qué secuencia. Cada paso enlaza a la Academia de TwistLab, donde lo practicas con diagramas, animaciones en 3D y un quiz.',
          '## Lo que necesitas',
          '- Un cubo de 3x3. Uno de velocidad gira más suave, pero sirve cualquiera.',
          '- De 20 a 30 minutos al día. El primer cubo resuelto suele llegar en **1 o 2 semanas**.',
          '- Saber leer los giros (`R`, `U`, `R\'`…). Se aprende en 5 minutos, en la sección «Antes de empezar: piezas y notación».',
        ],
        [
          "Anyone can solve a Rubik's cube, and you don't need a good memory. With the **beginner method**, you build it layer by layer with just **6 short sequences**, one of which you also do mirrored.",
          'A sequence is a fixed series of moves, which other methods call an algorithm. The ones in this method have 4 to 8 moves, and in many steps you just repeat the same one.',
          "This guide is the whole map: what you do in each of the 7 steps and with which sequence. Every step links to TwistLab's Academy, where you practice it with diagrams, 3D animations and a quiz.",
          '## What you need',
          '- A 3x3 cube. A speed cube turns more smoothly, but any cube works.',
          "- 20 to 30 minutes a day. You'll usually solve your first cube in **1 or 2 weeks**.",
          '- Knowing how to read the moves (`R`, `U`, `R\'`…). It takes 5 minutes to learn in the "Before you start: pieces and notation" section.',
        ],
        [
          'Qualquer pessoa pode resolver o cubo mágico, e não é preciso ter boa memória. Com o **método para iniciantes**, você monta o cubo camada por camada usando apenas **6 sequências curtas**, uma delas também na versão espelhada.',
          'Uma sequência é uma série fixa de movimentos, o que outros métodos chamam de algoritmo. As deste método têm de 4 a 8 movimentos, e em muitos passos você só repete a mesma.',
          'Este guia é o mapa completo: o que você faz em cada um dos 7 passos e com qual sequência. Cada passo leva à Academia do TwistLab, onde você pratica com diagramas, animações em 3D e um quiz.',
          '## O que você precisa',
          '- Um cubo 3x3. Um cubo de velocidade gira mais macio, mas qualquer um serve.',
          '- De 20 a 30 minutos por dia. Em geral, você resolve o cubo pela primeira vez em **1 ou 2 semanas**.',
          '- Saber ler os movimentos (`R`, `U`, `R\'`…). Isso se aprende em 5 minutos, na seção "Antes de começar: peças e notação".',
        ],
      ),
      more: [solver], // stuck with a scrambled cube: the solver gets you back to solved
    },
    {
      id: 'antes',
      title: tr('Antes de empezar: piezas y notación', 'Before you start: pieces and notation', 'Antes de começar: peças e notação'),
      body: doc(
        [
          'El cubo tiene tres tipos de piezas:',
          '- **Centros:** uno por cara. No se mueven entre sí: el centro dice de qué color es su cara.',
          '- **Aristas:** 12 piezas de dos colores, entre dos centros.',
          '- **Esquinas:** 8 piezas de tres colores.',
          'Por eso no se resuelve «una cara», sino **pieza por pieza**: cada una va entre los centros de sus colores.',
          '## Cómo se leen los giros',
          '- Cada letra es una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente y `B` atrás.',
          "- La letra sola es un cuarto de vuelta en sentido horario, mirando esa cara de frente (`D`, desde abajo). Con apóstrofo, al revés (`R'`). Con un 2, media vuelta (`U2`).",
          "- Así, `R U R' U'` es: derecha hacia arriba, arriba hacia la izquierda, derecha hacia abajo, arriba hacia la derecha.",
          '## Cómo sostener el cubo',
          'Sostenlo con el blanco abajo y el amarillo arriba, en toda la guía. Cuando un paso diga «gira el cubo entero», gíralo con el amarillo siempre arriba: solo cambia la cara que tienes al frente.',
        ],
        [
          'The cube has three kinds of pieces:',
          "- **Centers:** one per face. They don't move relative to each other: the center tells you the color of its face.",
          '- **Edges:** 12 two-colored pieces, between two centers.',
          '- **Corners:** 8 three-colored pieces.',
          "That's why you don't solve \"one face\": you solve the cube **piece by piece**, and each piece goes between the centers of its colors.",
          '## How to read the moves',
          '- Each letter is a face: `R` right, `L` left, `U` up, `D` down, `F` front and `B` back.',
          "- The letter alone is a quarter turn clockwise, looking at that face head-on (`D`, from below). With an apostrophe, the other way (`R'`). With a 2, a half turn (`U2`).",
          "- So `R U R' U'` is: the right face turns up, the top face turns left, the right face turns down and the top face turns right.",
          '## How to hold the cube',
          'Throughout this guide, hold it with white on the bottom and yellow on top. When a step says "rotate the whole cube", keep yellow on top: only the face in front of you changes.',
        ],
        [
          'O cubo tem três tipos de peças:',
          '- **Centros:** um por face. Eles nunca mudam de posição uns em relação aos outros: o centro indica a cor da sua face.',
          '- **Arestas:** 12 peças de duas cores, entre dois centros.',
          '- **Quinas:** 8 peças de três cores.',
          'Por isso não se resolve "uma face", e sim **peça por peça**: cada uma vai entre os centros das suas cores.',
          '## Como ler os movimentos',
          '- Cada letra é uma face: `R` direita, `L` esquerda, `U` em cima, `D` embaixo, `F` frente e `B` atrás.',
          "- A letra sozinha é um quarto de volta no sentido horário, olhando essa face de frente (`D`, por baixo). Com apóstrofo, ao contrário (`R'`). Com um 2, meia-volta (`U2`).",
          "- Assim, `R U R' U'` é: a face direita sobe, a de cima vai para a esquerda, a direita desce e a de cima vai para a direita.",
          '## Como segurar o cubo',
          'Em todo o guia, segure o cubo com o branco embaixo e o amarelo em cima. Quando um passo disser "gire o cubo inteiro", gire-o com o amarelo sempre em cima: só muda a face que fica na sua frente.',
        ],
      ),
      more: [{ href: academy({ kind: 'notation' }), label: tr('Toda la notación, con cada giro animado', 'All the notation, with every move animated', 'Toda a notação, com cada movimento animado') }],
    },
    {
      id: 'cruz',
      title: tr('Paso 1: la cruz blanca', 'Step 1: the white cross', 'Passo 1: a cruz branca'),
      body: doc(
        [
          '**Meta:** las 4 aristas blancas alrededor del centro blanco, **cada una junto al centro de su otro color**: la blanco-verde bajo el centro verde…',
          '**Sin secuencias:** se resuelve pensando, una arista cada vez. Gira `U` con libertad: no toca la cruz.',
          'Resuelve cada arista blanca según dónde esté:',
          '- **Arriba, con el blanco arriba:** gira `U` hasta dejarla sobre el centro de su otro color y bájala con media vuelta de esa cara (`F2`, `R2`, `B2` o `L2`).',
          '- **Arriba, con el blanco de lado:** gira la cara donde está su blanco para bajar la arista a la capa del medio, junto al centro de su otro color. Si no se puede, gira antes `U`. Métela abajo girando la cara de ese centro y deshaz el primer giro, para no romper la cruz.',
          '- **En la capa del medio, o abajo pero mal puesta:** súbela girando una cara lateral que la toque: un cuarto de vuelta desde la capa del medio, media vuelta desde abajo. Apártala con `U`, deshaz el giro de esa cara y resuélvela según hacia dónde mire su blanco.',
          '**Ojo:** no basta con ver una cruz blanca: el otro color de cada arista debe coincidir con el centro de su lado.',
        ],
        [
          '**Goal:** the 4 white edges around the white center, **each one next to the center of its other color**: the white-green edge under the green center…',
          "**No sequences:** you work it out yourself, one edge at a time. Turn `U` freely: it doesn't touch the cross.",
          'Solve each white edge according to where it is:',
          '- **On top, white facing up:** turn `U` until it is above the center of its other color, and bring it down with a half turn of that face (`F2`, `R2`, `B2` or `L2`).',
          "- **On top, white facing sideways:** turn the face its white sticker is on to bring the edge down to the middle layer, next to the center of its other color. If you can't, turn `U` first. Move it into the bottom layer by turning that center's face, and undo the first turn so you don't break the cross.",
          "- **In the middle layer, or on the bottom but placed wrong:** bring it up by turning a side face that touches it: a quarter turn if it's in the middle layer, a half turn if it's on the bottom. Move it aside with `U`, undo that face's turn and solve it based on which way its white sticker faces.",
          "**Watch out:** seeing a white cross isn't enough: the other color of each edge must match the center on its side.",
        ],
        [
          '**Meta:** as 4 arestas brancas em volta do centro branco, **cada uma junto ao centro da sua outra cor**: a branco-verde embaixo do centro verde…',
          '**Sem sequências:** você resolve no raciocínio, uma aresta de cada vez. Gire `U` à vontade: ele não mexe na cruz.',
          'Resolva cada aresta branca conforme o lugar onde ela está:',
          '- **Em cima, com o branco para cima:** gire `U` até deixá-la sobre o centro da sua outra cor e desça-a com meia-volta dessa face (`F2`, `R2`, `B2` ou `L2`).',
          '- **Em cima, com o branco de lado:** gire a face onde está o branco dela para descer a aresta para a camada do meio, junto ao centro da sua outra cor. Se não der, gire `U` antes. Leve-a para a camada de baixo girando a face desse centro e desfaça o primeiro movimento, para não quebrar a cruz.',
          '- **Na camada do meio, ou embaixo, mas mal colocada:** suba-a girando uma face lateral que toque nela: um quarto de volta se estiver na camada do meio, meia-volta se estiver embaixo. Afaste-a com `U`, desfaça o movimento dessa face e resolva-a conforme o lado para onde o branco dela aponta.',
          '**Atenção:** não basta ver uma cruz branca: a outra cor de cada aresta tem que coincidir com o centro do seu lado.',
        ],
      ),
      more: [{ href: academy({ kind: 'cross' }), label: tr('La guía de la cruz blanca, con entrenador', 'The white cross guide, with a trainer', 'O guia da cruz branca, com treino') }],
    },
    {
      id: 'esquinas-blancas',
      title: tr('Paso 2: las esquinas blancas', 'Step 2: the white corners', 'Passo 2: as quinas brancas'),
      body: doc(
        [
          '**Meta:** las 4 esquinas blancas en su sitio: la primera capa completa.',
          "**Secuencia:** `R U R' U'`. Se llama gatillo: es un trozo corto que aparece dentro de muchas otras secuencias.",
          '1. Busca en la capa de arriba una esquina con blanco y mira sus otros 2 colores.',
          '2. Gira `U` hasta dejarla justo encima de su sitio: entre los centros de esos 2 colores.',
          '3. Gira el cubo entero para dejarla arriba, adelante a la derecha.',
          '4. Haz el gatillo hasta que baje con el blanco abajo: **1 vez** si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.',
          'Si una esquina blanca está abajo pero mal puesta, gira el cubo entero para dejarla abajo, adelante a la derecha, y haz el gatillo una vez. Subirá a la capa de arriba: sigue desde el punto 2.',
        ],
        [
          '**Goal:** the 4 white corners in place: the first layer complete.',
          "**Sequence:** `R U R' U'`. It's called a trigger: a short chunk of moves that shows up inside many other sequences.",
          '1. In the top layer, find a corner that has white and look at its other 2 colors.',
          '2. Turn `U` until it is right above its place: between the centers of those 2 colors.',
          '3. Rotate the whole cube to put it at top front-right.',
          '4. Do the trigger until it drops in with white on the bottom: **once** if white faces right, **3 times** if it faces up, **5** if it faces front.',
          'If a white corner is on the bottom but placed wrong, rotate the whole cube to put it at bottom front-right and do the trigger once. It will come up to the top layer: continue from point 2.',
        ],
        [
          '**Meta:** as 4 quinas brancas no lugar: a primeira camada completa.',
          "**Sequência:** `R U R' U'`. Ela se chama gatilho: é um trecho curto que aparece dentro de muitas outras sequências.",
          '1. Procure na camada de cima uma quina com branco e veja as suas outras 2 cores.',
          '2. Gire `U` até deixá-la bem em cima do seu lugar: entre os centros dessas 2 cores.',
          '3. Gire o cubo inteiro para deixá-la em cima, na frente à direita.',
          '4. Faça o gatilho até ela descer com o branco embaixo: **1 vez** se o branco olha para a direita, **3** se olha para cima, **5** se olha para a frente.',
          'Se uma quina branca estiver embaixo, mas mal colocada, gire o cubo inteiro para deixá-la embaixo, na frente à direita, e faça o gatilho uma vez. Ela vai subir para a camada de cima: continue a partir do item 2.',
        ],
      ),
      figure: 'prin-capa1-blanco-derecha',
      more: [inMethod('prin-capa1')],
    },
    {
      id: 'segunda-capa',
      title: tr('Paso 3: la segunda capa', 'Step 3: the second layer', 'Passo 3: a segunda camada'),
      body: doc(
        [
          '**Meta:** las dos primeras capas completas, con las 4 aristas de la capa del medio en su sitio. Son las únicas aristas **sin blanco ni amarillo**.',
          '1. Busca en la capa de arriba una arista sin amarillo.',
          '2. Gira `U` hasta que el color de su lado coincida con el centro de ese lado. Luego gira el cubo entero para dejar ese centro al frente.',
          '3. Mira su color de **arriba** y busca el centro de ese color, a la derecha o a la izquierda. Hacia ese lado va la arista.',
          '4. Haz la secuencia de ese lado:',
          "- **A la derecha:** `U R U' R' U' F' U F`",
          "- **A la izquierda:** `U' L' U L U F U' F'`, la misma secuencia en espejo",
          'Si una arista está atascada en la capa del medio (volteada o en el sitio de otra), gira el cubo entero para dejarla adelante a la derecha y haz la secuencia de la derecha. Saldrá a la capa de arriba: colócala como cualquier otra.',
        ],
        [
          '**Goal:** the first two layers complete, with the 4 middle-layer edges in place. They are the only edges **with neither white nor yellow**.',
          '1. Find an edge in the top layer that has no yellow.',
          '2. Turn `U` until its side color matches the center on that side. Then rotate the whole cube to bring that center to the front.',
          '3. Look at its **top** color and find the center of that color, on the right or on the left. That is the side the edge goes to.',
          '4. Do the sequence for that side:',
          "- **To the right:** `U R U' R' U' F' U F`",
          "- **To the left:** `U' L' U L U F U' F'`, the same sequence mirrored",
          "If an edge is stuck in the middle layer (flipped or in another edge's place), rotate the whole cube to put it at front right and do the right-side sequence. It will come out to the top layer: place it like any other.",
        ],
        [
          '**Meta:** as duas primeiras camadas completas, com as 4 arestas da camada do meio no lugar. São as únicas arestas **sem branco nem amarelo**.',
          '1. Procure na camada de cima uma aresta sem amarelo.',
          '2. Gire `U` até a cor lateral dela coincidir com o centro desse lado. Depois gire o cubo inteiro para deixar esse centro na frente.',
          '3. Olhe a cor de **cima** dela e procure o centro dessa cor, à direita ou à esquerda. É para esse lado que a aresta vai.',
          '4. Faça a sequência desse lado:',
          "- **Para a direita:** `U R U' R' U' F' U F`",
          "- **Para a esquerda:** `U' L' U L U F U' F'`, a mesma sequência espelhada",
          'Se uma aresta estiver presa na camada do meio (invertida ou no lugar de outra), gire o cubo inteiro para deixá-la na frente à direita e faça a sequência da direita. Ela vai sair para a camada de cima: coloque-a como qualquer outra.',
        ],
      ),
      figure: 'prin-capa2-derecha',
      more: [inMethod('prin-capa2')],
    },
    {
      id: 'cruz-amarilla',
      title: tr('Paso 4: la cruz amarilla', 'Step 4: the yellow cross', 'Passo 4: a cruz amarela'),
      body: doc(
        [
          '**Meta:** una cruz amarilla arriba. Solo cuentan las aristas, no las esquinas.',
          "**Secuencia:** `F R U R' U' F'`.",
          'Mira qué forma hacen el centro y las aristas con el amarillo arriba, y gira `U` hasta dejarla como dice su caso:',
          '- **Línea:** déjala horizontal, de izquierda a derecha, y haz la secuencia **1 vez**.',
          '- **L:** deja sus 2 aristas atrás y a la izquierda, y haz la secuencia **2 veces**.',
          '- **Punto** (solo el centro amarillo): haz la secuencia **1 vez**, desde cualquier lado. Sale una L: gira `U` para dejarla atrás a la izquierda y sigue como en el caso L.',
        ],
        [
          '**Goal:** a yellow cross on top. Only the edges count, not the corners.',
          "**Sequence:** `F R U R' U' F'`.",
          'Look at the shape that the center and the edges with yellow facing up make, then turn `U` to position it the way its case says:',
          '- **Line:** make it horizontal, from left to right, and do the sequence **once**.',
          '- **L:** put its 2 edges at the back and on the left, and do the sequence **twice**.',
          '- **Dot** (only the yellow center): do the sequence **once**, from any side. An L appears: turn `U` to put it at the back left and continue as in the L case.',
        ],
        [
          '**Meta:** uma cruz amarela em cima. Só contam as arestas, não as quinas.',
          "**Sequência:** `F R U R' U' F'`.",
          'Veja que forma fazem o centro e as arestas com o amarelo para cima, e gire `U` até deixá-la como diz o seu caso:',
          '- **Linha:** deixe-a na horizontal, da esquerda para a direita, e faça a sequência **1 vez**.',
          '- **L:** deixe as 2 arestas do L atrás e à esquerda, e faça a sequência **2 vezes**.',
          '- **Ponto** (só o centro amarelo): faça a sequência **1 vez**, de qualquer lado. Aparece um L: gire `U` para deixá-lo atrás à esquerda e continue como no caso L.',
        ],
      ),
      figure: 'prin-cruz-l',
      more: [inMethod('prin-cruz')],
    },
    {
      id: 'aristas-amarillas',
      title: tr('Paso 5: las aristas amarillas', 'Step 5: the yellow edges', 'Passo 5: as arestas amarelas'),
      body: doc(
        [
          '**Meta:** la cruz amarilla, con cada arista junto al centro de su otro color.',
          "**Secuencia:** `R U R' U R U2 R' U`.",
          'Gira `U` hasta que al menos 2 aristas coincidan con el centro de su lado. Siempre se puede. Si coinciden las 4, este paso ya está hecho.',
          '- **Dos vecinas:** gira el cubo entero para dejarlas atrás y a la derecha, y haz la secuencia una vez.',
          '- **Dos opuestas:** haz la secuencia una vez, desde cualquier lado. Luego gira `U` hasta que coincidan dos vecinas y sigue como en el caso de dos vecinas.',
        ],
        [
          '**Goal:** the yellow cross, with each edge next to the center of its other color.',
          "**Sequence:** `R U R' U R U2 R' U`.",
          "Turn `U` until at least 2 edges match the center on their side. It's always possible. If all 4 match, this step is already done.",
          '- **Two adjacent:** rotate the whole cube to put them at the back and on the right, and do the sequence once.',
          '- **Two opposite:** do the sequence once, from any side. Then turn `U` until two adjacent edges match, and continue as in the two-adjacent case.',
        ],
        [
          '**Meta:** a cruz amarela, com cada aresta junto ao centro da sua outra cor.',
          "**Sequência:** `R U R' U R U2 R' U`.",
          'Gire `U` até pelo menos 2 arestas coincidirem com o centro do seu lado. Sempre dá. Se as 4 coincidirem, este passo já está feito.',
          '- **Duas vizinhas:** gire o cubo inteiro para deixá-las atrás e à direita, e faça a sequência uma vez.',
          '- **Duas opostas:** faça a sequência uma vez, de qualquer lado. Depois gire `U` até coincidirem duas vizinhas e continue como no caso de duas vizinhas.',
        ],
      ),
      figure: 'prin-aristas-vecinas',
      more: [inMethod('prin-aristas')],
    },
    {
      id: 'esquinas-amarillas',
      title: tr('Paso 6: las esquinas amarillas a su sitio', 'Step 6: the yellow corners into place', 'Passo 6: as quinas amarelas no lugar'),
      body: doc(
        [
          '**Meta:** cada esquina amarilla en su sitio, aunque esté girada. Una esquina está en su sitio si tiene los colores de los 3 centros que la rodean, en cualquier orden.',
          "**Secuencia:** `U R U' L' U R' U' L`. Deja quieta la esquina de arriba, adelante a la derecha, y mueve las otras 3 sin tocar las aristas.",
          '1. Gira el cubo entero para dejar arriba, adelante a la derecha, una esquina que ya esté en su sitio.',
          '2. Haz la secuencia. Si las otras 3 no quedaron en su sitio, hazla otra vez.',
          'Si **ninguna** está en su sitio, haz la secuencia una vez desde cualquier lado. Quedará una en su sitio: sigue desde el punto 1.',
        ],
        [
          '**Goal:** each yellow corner in its place, even if twisted. A corner is in its place when it has the colors of the 3 centers around it, in any order.',
          "**Sequence:** `U R U' L' U R' U' L`. It keeps the top front-right corner still and moves the other 3 without touching the edges.",
          "1. Rotate the whole cube so that a corner that's already in its place is at top front-right.",
          "2. Do the sequence. If the other 3 didn't end up in their places, do it once more.",
          'If **none** is in its place, do the sequence once from any side. One will end up in its place: continue from point 1.',
        ],
        [
          '**Meta:** cada quina amarela no seu lugar, mesmo que esteja girada. Uma quina está no lugar quando tem as cores dos 3 centros ao redor dela, em qualquer ordem.',
          "**Sequência:** `U R U' L' U R' U' L`. Ela deixa parada a quina de cima, na frente à direita, e move as outras 3 sem mexer nas arestas.",
          '1. Gire o cubo inteiro para deixar em cima, na frente à direita, uma quina que já esteja no lugar.',
          '2. Faça a sequência. Se as outras 3 não ficaram no lugar, faça de novo.',
          'Se **nenhuma** estiver no lugar, faça a sequência uma vez de qualquer lado. Uma vai ficar no lugar: continue a partir do item 1.',
        ],
      ),
      figure: 'prin-esquinas-antihorario',
      more: [inMethod('prin-esquinas')],
    },
    {
      id: 'orientar',
      title: tr('Paso 7: girar las esquinas', 'Step 7: twist the corners', 'Passo 7: girar as quinas'),
      body: doc(
        [
          '**Meta:** el amarillo arriba en las 4 esquinas: cubo resuelto.',
          "**Secuencia:** `R' D' R D`.",
          '**No te asustes:** a mitad del paso, las capas de abajo se ven rotas. Se arreglan solas al terminar la última esquina.',
          '1. Sostén el cubo de modo que una esquina con el amarillo de lado quede arriba, adelante a la derecha. Desde aquí, **no gires el cubo entero**.',
          '2. Repite la secuencia hasta que su amarillo quede arriba: **2 veces** si mira a la derecha, **4** si mira al frente.',
          '3. Gira solo `U` hasta que otra esquina con el amarillo de lado quede arriba, adelante a la derecha, y repite el punto 2.',
          '4. Cuando las 4 tengan el amarillo arriba, gira `U` hasta que la capa de arriba coincida con el resto. ¡Cubo resuelto!',
        ],
        [
          '**Goal:** all 4 corners with yellow on top: cube solved.',
          "**Sequence:** `R' D' R D`.",
          "**Don't panic:** midway through this step, the bottom layers look broken. They fix themselves when you finish the last corner.",
          "1. Hold the cube so that a corner with its yellow facing sideways is at top front-right. From here on, **don't rotate the whole cube**.",
          '2. Repeat the sequence until its yellow is on top: **twice** if it faces right, **4 times** if it faces front.',
          '3. Turn only `U` until another corner with its yellow facing sideways is at top front-right, and repeat point 2.',
          '4. When all 4 have yellow on top, turn `U` until the top layer matches the rest. Cube solved!',
        ],
        [
          '**Meta:** o amarelo em cima nas 4 quinas: cubo resolvido.',
          "**Sequência:** `R' D' R D`.",
          '**Não se assuste:** no meio do passo, as camadas de baixo parecem bagunçadas. Elas se arrumam sozinhas quando você termina a última quina.',
          '1. Segure o cubo de modo que uma quina com o amarelo de lado fique em cima, na frente à direita. A partir daqui, **não gire o cubo inteiro**.',
          '2. Repita a sequência até o amarelo dela ficar em cima: **2 vezes** se ele olha para a direita, **4** se olha para a frente.',
          '3. Gire só `U` até outra quina com o amarelo de lado ficar em cima, na frente à direita, e repita o item 2.',
          '4. Quando as 4 tiverem o amarelo em cima, gire `U` até a camada de cima coincidir com o resto. Cubo resolvido!',
        ],
      ),
      figure: 'prin-orientar-sune',
      more: [inMethod('prin-orientar')],
    },
    {
      id: 'despues',
      title: tr('Y después: más rápido', 'What next: faster', 'E depois: mais rápido'),
      body: doc(
        [
          'Cuando lo resuelvas sin mirar la guía, cronométrate con mezclas oficiales, las de las competiciones, para ver cómo baja tu tiempo. Para bajar de 1 minuto, sigue con el **CFOP reducido**.',
          'Con él armas las dos primeras capas a la vez, y cada situación tiene su propio algoritmo en lugar de repetir una secuencia. A cambio, aprendes más algoritmos: 35 en total.',
        ],
        [
          'Once you can solve it without looking at the guide, time yourself with official scrambles, the ones used in competitions, to watch your time drop. To get under 1 minute, move on to **reduced CFOP**.',
          'With it you build the first two layers at the same time, and each situation has its own algorithm instead of a repeated sequence. The trade-off is that there are more algorithms to learn: 35 in all.',
        ],
        [
          'Quando você conseguir resolver sem olhar o guia, cronometre-se com embaralhamentos oficiais, os das competições, para ver seu tempo cair. Para ficar abaixo de 1 minuto, siga para o **CFOP reduzido**.',
          'Com ele você monta as duas primeiras camadas ao mesmo tempo, e cada situação tem o seu próprio algoritmo em vez de repetir uma sequência. Em contrapartida, há mais algoritmos para aprender: 35 no total.',
        ],
      ),
      more: [timer, { href: academy({ kind: 'method', id: 'cfop-reducido' }), label: tr('El CFOP reducido', 'Reduced CFOP', 'O CFOP reduzido') }],
    },
  ] satisfies HowToSection[] as HowToSection[],
};

/** A section's figure: the case's diagram as on its card (its main algorithm undone), named by the case. */
export function figureSvg(kpuzzle: KPuzzle, caseId: string, size = 120): { svg: string; caption: string } {
  const phase = beginner.phases.find((p) => p.groups.some((g) => g.cases.some((c) => c.id === caseId)))!;
  const c = phase.groups.flatMap((g) => g.cases).find((x) => x.id === caseId)!;
  const caption = loc(c.name);
  return { svg: caseDiagram(phase.diagram, c.stage, patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), { size, title: caption }), caption };
}

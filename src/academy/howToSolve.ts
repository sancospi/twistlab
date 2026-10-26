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
const solver = { href: routePath({ mod: 'cube', page: 'paint' }), label: tr('Resolver el cubo de Rubik online: pinta tu cubo y te doy la solución', "Rubik's cube solver online: paint your cube and get the solution", 'Resolver o cubo mágico online: pinte seu cubo e receba a solução') };
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
    'Guía para principiantes: resuelve el cubo de Rubik capa por capa en 7 pasos, con 7 secuencias cortas y un diagrama de cada paso.',
    "A beginner's guide: solve the Rubik's cube layer by layer in 7 steps, with 7 short sequences and a diagram of each step.",
    'Guia para iniciantes: resolva o cubo mágico camada por camada em 7 passos, com 7 sequências curtas e um diagrama de cada passo.',
  ),
  nav: tr('Pasos de la guía', 'Guide steps', 'Passos do guia'), // the side navigation's name
  sections: [
    {
      id: 'intro',
      title: tr('Cómo resolver el cubo de Rubik paso a paso', "How to solve a Rubik's cube step by step", 'Como resolver o cubo mágico passo a passo'),
      body: doc(
        [
          'Cualquiera puede resolver el cubo de Rubik. No hace falta memorizar decenas de algoritmos ni tener buena memoria: con el **método principiante** lo armas **capa por capa** y solo usas **7 secuencias cortas**, casi todas repetidas.',
          'Esta guía es el mapa completo: qué se hace en cada uno de los 7 pasos y cómo se ve cada caso. Cada paso enlaza a la Academia, donde lo practicas con diagramas, animaciones en 3D y un quiz.',
          '## Lo que necesitas',
          '- Un cubo de 3x3. Uno de velocidad gira más suave, pero sirve cualquiera.',
          '- De 20 a 30 minutos al día. El primer cubo resuelto suele llegar en **1 o 2 semanas**.',
          '- Saber leer los giros: `R`, `U`, `R\'`… Se explica abajo y lleva cinco minutos.',
        ],
        [
          "Anyone can solve a Rubik's cube. You don't need to memorize dozens of algorithms or have a good memory: with the **beginner method** you build it **layer by layer** and only use **7 short sequences**, almost all of them repeated.",
          'This guide is the whole map: what you do in each of the 7 steps and what each case looks like. Every step links to the Academia, where you practice it with diagrams, 3D animations and a quiz.',
          '## What you need',
          '- A 3x3 cube. A speed cube turns more smoothly, but any cube works.',
          '- 20 to 30 minutes a day. Your first solved cube usually arrives in **1 or 2 weeks**.',
          "- Knowing how to read the turns: `R`, `U`, `R'`… It's explained below and takes five minutes.",
        ],
        [
          'Qualquer pessoa pode resolver o cubo mágico. Não precisa decorar dezenas de algoritmos nem ter boa memória: com o **método para iniciantes** você o monta **camada por camada** e usa só **7 sequências curtas**, quase todas repetidas.',
          'Este guia é o mapa completo: o que se faz em cada um dos 7 passos e como é cada caso. Cada passo leva à Academia, onde você pratica com diagramas, animações em 3D e um quiz.',
          '## O que você precisa',
          '- Um cubo 3x3. Um cubo de velocidade gira mais suave, mas qualquer um serve.',
          '- De 20 a 30 minutos por dia. O primeiro cubo resolvido costuma chegar em **1 ou 2 semanas**.',
          "- Saber ler os movimentos: `R`, `U`, `R'`… Está explicado abaixo e leva cinco minutos.",
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
          '**Cómo sostener el cubo:** en toda la guía, cruz blanca abajo, amarillo arriba y verde al frente.',
        ],
        [
          'The cube has three kinds of pieces:',
          "- **Centers:** one per face. They don't move relative to each other: the center tells you the color of its face.",
          '- **Edges:** 12 two-colored pieces, between two centers.',
          '- **Corners:** 8 three-colored pieces.',
          "That's why you don't solve \"one face\" but **piece by piece**: each one goes between the centers of its colors.",
          '## How to read the turns',
          '- Each letter is a face: `R` right, `L` left, `U` up, `D` down, `F` front and `B` back.',
          "- The letter alone is a quarter turn clockwise, looking at that face head-on (`D`, from below). With an apostrophe, the other way (`R'`). With a 2, a half turn (`U2`).",
          "- So `R U R' U'` is: right side up, top to the left, right side down, top to the right.",
          '**How to hold the cube:** throughout this guide, white cross on the bottom, yellow on top and green in front.',
        ],
        [
          'O cubo tem três tipos de peças:',
          '- **Centros:** um por face. Não se movem entre si: o centro diz de que cor é a sua face.',
          '- **Arestas:** 12 peças de duas cores, entre dois centros.',
          '- **Quinas:** 8 peças de três cores.',
          'Por isso não se resolve "uma face", e sim **peça por peça**: cada uma vai entre os centros das suas cores.',
          '## Como ler os movimentos',
          '- Cada letra é uma face: `R` direita, `L` esquerda, `U` em cima, `D` embaixo, `F` frente e `B` atrás.',
          "- A letra sozinha é um quarto de volta no sentido horário, olhando essa face de frente (`D`, por baixo). Com apóstrofo, ao contrário (`R'`). Com um 2, meia volta (`U2`).",
          "- Assim, `R U R' U'` é: direita para cima, topo para a esquerda, direita para baixo, topo para a direita.",
          '**Como segurar o cubo:** em todo o guia, cruz branca embaixo, amarelo em cima e verde na frente.',
        ],
      ),
      more: [{ href: academy({ kind: 'notation' }), label: tr('Toda la notación, con cada giro animado', 'All the notation, with every turn animated', 'Toda a notação, com cada movimento animado') }],
    },
    {
      id: 'cruz',
      title: tr('Paso 1: la cruz blanca', 'Step 1: the white cross', 'Passo 1: a cruz branca'),
      body: doc(
        [
          'Las 4 aristas blancas alrededor del centro blanco, **cada una junto al centro de su otro color**: la blanco-verde bajo el verde, la blanco-roja bajo el rojo…',
          'Es el único paso sin algoritmos: se resuelve pensando, de una arista a la vez.',
          '- **Arista arriba, con el blanco hacia arriba:** gira `U` hasta dejarla sobre su centro y bájala con media vuelta (`F2`, `R2`, `B2` o `L2`).',
          '- `U` no toca la cruz: es el giro libre para colocar cada arista.',
          '**Ojo:** si la cara blanca se ve completa pero los colores de los lados no coinciden con sus centros, la cruz está mal.',
        ],
        [
          'The 4 white edges around the white center, **each one next to the center of its other color**: white-green under green, white-red under red…',
          "It's the only step without algorithms: you solve it by thinking, one edge at a time.",
          '- **Edge on top, white facing up:** turn `U` until it is above its center and bring it down with a half turn (`F2`, `R2`, `B2` or `L2`).',
          "- `U` doesn't touch the cross: it's the free turn to position each edge.",
          "**Watch out:** if the white face looks complete but the side colors don't match their centers, the cross is wrong.",
        ],
        [
          'As 4 arestas brancas em volta do centro branco, **cada uma junto ao centro da sua outra cor**: a branco-verde embaixo do verde, a branco-vermelha embaixo do vermelho…',
          'É o único passo sem algoritmos: você resolve pensando, uma aresta de cada vez.',
          '- **Aresta em cima, com o branco para cima:** gire `U` até deixá-la sobre o seu centro e desça-a com meia volta (`F2`, `R2`, `B2` ou `L2`).',
          '- `U` não mexe na cruz: é o movimento livre para posicionar cada aresta.',
          '**Atenção:** se a face branca parece completa mas as cores dos lados não coincidem com os seus centros, a cruz está errada.',
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
          "**Secuencia:** el gatillo, `R U R' U'`.",
          '1. Busca arriba una esquina con blanco y mira sus otros 2 colores.',
          '2. Gira `U` hasta dejarla justo encima de su sitio: entre los centros de esos 2 colores.',
          '3. Gira el cubo entero para tenerla adelante a la derecha.',
          '4. Haz el gatillo hasta que baje con el blanco abajo: **1 vez** si el blanco mira a la derecha, **3** si mira arriba, **5** si mira al frente.',
          'Si una esquina blanca está abajo pero mal puesta, ponla adelante a la derecha y haz 1 gatillo: sube, y sigues desde el punto 2.',
        ],
        [
          '**Goal:** the 4 white corners in place: the first layer complete.',
          "**Sequence:** the trigger, `R U R' U'`.",
          '1. Find a corner with white in the top layer and look at its other 2 colors.',
          '2. Turn `U` until it is right above its spot: between the centers of those 2 colors.',
          '3. Rotate the whole cube to have it at the front right.',
          '4. Do the trigger until it drops in with white at the bottom: **1 time** if white faces right, **3** if it faces up, **5** if it faces front.',
          'If a white corner is at the bottom but in the wrong place, put it at the front right and do 1 trigger: it comes up, and you continue from point 2.',
        ],
        [
          '**Meta:** as 4 quinas brancas no lugar: a primeira camada completa.',
          "**Sequência:** o gatilho, `R U R' U'`.",
          '1. Procure na camada de cima uma quina com branco e veja as suas outras 2 cores.',
          '2. Gire `U` até deixá-la bem em cima do seu lugar: entre os centros dessas 2 cores.',
          '3. Gire o cubo inteiro para deixá-la na frente à direita.',
          '4. Faça o gatilho até ela descer com o branco embaixo: **1 vez** se o branco olha para a direita, **3** se olha para cima, **5** se olha para a frente.',
          'Se uma quina branca está embaixo mas mal colocada, coloque-a na frente à direita e faça 1 gatilho: ela sobe, e você continua a partir do item 2.',
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
          '**Meta:** las 4 aristas del medio, las que **no tienen amarillo**.',
          '1. Busca arriba una arista sin amarillo.',
          '2. Gira `U` hasta que el color de su lado coincida con el centro de ese lado, y gira el cubo entero para tenerla al frente.',
          '3. Mira su color de **arriba**: dice hacia qué lado va.',
          "- **A la derecha:** `U R U' R' U' F' U F`",
          "- **A la izquierda:** `U' L' U L U F U' F'`, el espejo de la anterior",
          'Si una está atascada en el medio (volteada o en el sitio de otra), ponla adelante a la derecha y haz la secuencia a la derecha: sale arriba. Luego colócala como siempre.',
        ],
        [
          '**Goal:** the 4 middle edges, the ones **without yellow**.',
          '1. Find an edge on top without yellow.',
          '2. Turn `U` until its side color matches the center on that side, and rotate the whole cube to have it in front.',
          '3. Look at its **top** color: it tells you which side it goes to.',
          "- **To the right:** `U R U' R' U' F' U F`",
          "- **To the left:** `U' L' U L U F U' F'`, the mirror of the first",
          "If one is stuck in the middle (flipped or in another edge's spot), put it at the front right and do the sequence to the right: it comes out on top. Then place it as usual.",
        ],
        [
          '**Meta:** as 4 arestas do meio, as que **não têm amarelo**.',
          '1. Procure em cima uma aresta sem amarelo.',
          '2. Gire `U` até a cor lateral dela coincidir com o centro desse lado, e gire o cubo inteiro para deixá-la na frente.',
          '3. Olhe a cor de **cima** dela: ela diz para qual lado vai.',
          "- **Para a direita:** `U R U' R' U' F' U F`",
          "- **Para a esquerda:** `U' L' U L U F U' F'`, o espelho da anterior",
          'Se uma estiver presa no meio (invertida ou no lugar de outra), coloque-a na frente à direita e faça a sequência para a direita: ela sai para cima. Depois coloque-a como sempre.',
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
          '**Meta:** una cruz amarilla arriba. Solo cuentan las aristas; las esquinas, todavía no.',
          "Un algoritmo, `F R U R' U' F'`, según la forma que hacen las aristas amarillas de arriba:",
          '- **Línea:** horizontal, de izquierda a derecha. **1 vez.**',
          '- **L:** con sus 2 aristas atrás y a la izquierda. **2 veces.**',
          '- **Punto** (solo el centro): **1 vez**, desde cualquier lado. Sale una L: sigue con ella.',
        ],
        [
          '**Goal:** a yellow cross on top. Only the edges count; the corners, not yet.',
          "One algorithm, `F R U R' U' F'`, depending on the shape the yellow edges make on top:",
          '- **Line:** horizontal, from left to right. **1 time.**',
          '- **L:** with its 2 edges at the back and on the left. **2 times.**',
          '- **Dot** (only the center): **1 time**, from any side. An L appears: continue with it.',
        ],
        [
          '**Meta:** uma cruz amarela em cima. Só contam as arestas; as quinas, ainda não.',
          "Um algoritmo, `F R U R' U' F'`, conforme a forma que as arestas amarelas fazem em cima:",
          '- **Linha:** na horizontal, da esquerda para a direita. **1 vez.**',
          '- **L:** com as suas 2 arestas atrás e à esquerda. **2 vezes.**',
          '- **Ponto** (só o centro): **1 vez**, de qualquer lado. Aparece um L: continue com ele.',
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
          '**Meta:** cada arista amarilla junto al centro de su color, sin perder la cruz.',
          "Gira `U` hasta que al menos 2 aristas coincidan con su centro (siempre se puede). Luego, con `R U R' U R U2 R' U`:",
          '- **Dos vecinas:** gira el cubo entero para dejarlas atrás y a la derecha. **1 vez.**',
          '- **Dos opuestas:** **1 vez**, desde cualquier lado. Quedan dos vecinas: sigue como arriba.',
        ],
        [
          '**Goal:** each yellow edge next to the center of its color, without losing the cross.',
          "Turn `U` until at least 2 edges match their center (it is always possible). Then, with `R U R' U R U2 R' U`:",
          '- **Two adjacent:** rotate the whole cube to put them at the back and on the right. **1 time.**',
          '- **Two opposite:** **1 time**, from any side. Two adjacent are left: continue as above.',
        ],
        [
          '**Meta:** cada aresta amarela junto do centro da sua cor, sem perder a cruz.',
          "Gire `U` até pelo menos 2 arestas coincidirem com o seu centro (sempre dá). Depois, com `R U R' U R U2 R' U`:",
          '- **Duas vizinhas:** gire o cubo inteiro para deixá-las atrás e à direita. **1 vez.**',
          '- **Duas opostas:** **1 vez**, de qualquer lado. Ficam duas vizinhas: continue como acima.',
        ],
      ),
      figure: 'prin-aristas-vecinas',
      more: [inMethod('prin-aristas')],
    },
    {
      id: 'esquinas-amarillas',
      title: tr('Paso 6: las esquinas amarillas a su lugar', 'Step 6: the yellow corners into place', 'Passo 6: as quinas amarelas no lugar'),
      body: doc(
        [
          '**Meta:** cada esquina en su sitio, aunque esté girada: con los colores de los 3 centros que la rodean, en cualquier orden.',
          "Con `U R U' L' U R' U' L`, que deja quieta la esquina de adelante-derecha y mueve las otras 3 sin tocar las aristas:",
          '1. Gira el cubo entero para dejar adelante a la derecha una esquina que ya esté en su sitio.',
          '2. Haz la secuencia. Si las otras 3 no quedaron en su sitio, hazla otra vez.',
          'Si **ninguna** está en su sitio, haz la secuencia 1 vez desde cualquier lado: quedará una. Sigue desde el punto 1.',
        ],
        [
          '**Goal:** each corner in its spot, even if twisted: with the colors of the 3 centers around it, in any order.',
          "With `U R U' L' U R' U' L`, which keeps the front-right corner still and moves the other 3 without touching the edges:",
          '1. Rotate the whole cube to put a corner that is already in its spot at the front right.',
          "2. Do the sequence. If the other 3 didn't end up in their spots, do it once more.",
          'If **none** is in its spot, do the sequence 1 time from any side: one will be. Continue from point 1.',
        ],
        [
          '**Meta:** cada quina no seu lugar, mesmo que girada: com as cores dos 3 centros ao redor dela, em qualquer ordem.',
          "Com `U R U' L' U R' U' L`, que deixa parada a quina da frente-direita e move as outras 3 sem mexer nas arestas:",
          '1. Gire o cubo inteiro para deixar na frente à direita uma quina que já esteja no lugar.',
          '2. Faça a sequência. Se as outras 3 não ficaram no lugar, faça de novo.',
          'Se **nenhuma** estiver no lugar, faça a sequência 1 vez de qualquer lado: uma vai ficar. Continue a partir do item 1.',
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
          '1. Sostén el cubo de modo que una esquina con el amarillo de lado quede adelante a la derecha. Desde aquí, **no gires el cubo entero**.',
          "2. Repite `R' D' R D` hasta que su amarillo quede arriba: **2 veces** si mira a la derecha, **4** si mira al frente.",
          '3. Gira solo `U` para traer otra esquina con el amarillo de lado adelante a la derecha, y repite.',
          '4. Cuando las 4 tengan el amarillo arriba, gira `U` hasta alinear la capa.',
          '**No te asustes:** a mitad del paso, las capas de abajo se ven rotas. Vuelven solas con la última esquina.',
        ],
        [
          '**Goal:** yellow on top on all 4 corners: cube solved.',
          "1. Hold the cube so that a corner with its yellow on a side is at the front right. From here on, **don't rotate the whole cube**.",
          "2. Repeat `R' D' R D` until its yellow is on top: **2 times** if it faces right, **4** if it faces front.",
          '3. Turn only `U` to bring another corner with its yellow on a side to the front right, and repeat.',
          '4. When all 4 have yellow on top, turn `U` to line up the layer.',
          "**Don't panic:** midway through, the bottom layers look broken. They come back on their own with the last corner.",
        ],
        [
          '**Meta:** o amarelo em cima nas 4 quinas: cubo resolvido.',
          '1. Segure o cubo de modo que uma quina com o amarelo de lado fique na frente à direita. A partir daqui, **não gire o cubo inteiro**.',
          "2. Repita `R' D' R D` até o amarelo dela ficar em cima: **2 vezes** se ele olha para a direita, **4** se olha para a frente.",
          '3. Gire só `U` para trazer outra quina com o amarelo de lado para a frente à direita, e repita.',
          '4. Quando as 4 tiverem o amarelo em cima, gire `U` até alinhar a camada.',
          '**Não se assuste:** no meio do passo, as camadas de baixo parecem quebradas. Elas voltam sozinhas com a última quina.',
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
          'Cuando lo resuelvas sin mirar la guía, cronométrate con mezclas oficiales para ver cómo bajas. El siguiente método es el **CFOP reducido**: los mismos pasos, unidos en menos algoritmos, para bajar de 1 minuto.',
        ],
        [
          "Once you can solve it without looking at the guide, time yourself with official scrambles to see yourself improve. The next method is **reduced CFOP**: the same steps, merged into fewer algorithms, to get under 1 minute.",
        ],
        [
          'Quando você conseguir resolver sem olhar o guia, cronometre-se com embaralhamentos oficiais para ver seu tempo cair. O próximo método é o **CFOP reduzido**: os mesmos passos, unidos em menos algoritmos, para ficar abaixo de 1 minuto.',
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

// "La cruz blanca": the first step of CFOP (and of most methods), as a standalone guide with a trainer.
// Same frame as the rest of the Academia: yellow up, green front, so the white cross is on the bottom (face D).
// Examples are in that frame, with ASCII primes; crossGuide.test.ts plays each one and checks it is optimal.
import { tr, type Localized } from '../i18n.ts';

export interface CrossExample {
  setup: string; // from solved: breaks the cross
  solution: string; // restores the cross (the shortest way)
  caption: Localized;
}

export interface CrossLesson {
  id: string;
  title: Localized;
  body: Localized; // paragraphs separated by '\n'
  examples?: CrossExample[];
  tips?: Localized; // what to do when something goes wrong: folded under the examples, as a method phase's
}

export type CrossLevelId = 'n1' | 'n2' | 'n3' | 'n4';

export interface CrossLevel {
  id: CrossLevelId;
  name: Localized;
  description: Localized;
  moves: { min: number; max: number }; // optimal cross length of the cases it plays
  goal: { overOptimal: number; seconds: number }; // to pass, on average: at most this many extra turns, executed within this time (planning: within inspection)
}

/** A guide page: an intro, then lessons with examples (La cruz blanca; Bases del 2x2, bases2x2.ts). */
export interface TextGuide {
  id: string; // its URL segment
  name: Localized;
  summary: Localized; // its tile on the Academia home
  intro: Localized;
  lessons: CrossLesson[];
  next: string[]; // the methods to learn after it (ids): view.ts links them at its end
}

export interface CrossGuide extends TextGuide {
  id: 'cruz';
  levels: CrossLevel[];
}

const ex = (setup: string, solution: string, es: string, en: string, pt: string): CrossExample => ({ setup, solution, caption: tr(es, en, pt) });

export const crossGuide: CrossGuide = {
  id: 'cruz',
  next: ['principiante', 'cfop-reducido'],
  name: tr('La cruz blanca', 'The white cross', 'A cruz branca'),
  summary: tr('El primer paso del CFOP y de casi todos los métodos: la cruz blanca abajo, planeada en la inspección y en 8 giros o menos.', 'The first step of CFOP and of almost every method: the white cross on the bottom, planned during inspection and solved in 8 moves or fewer.', 'O primeiro passo do CFOP e de quase todos os métodos: a cruz branca embaixo, planejada na inspeção e em 8 movimentos ou menos.'),
  intro: tr(
    [
      'La cruz es lo primero de cada resolución y la única parte que puedes planear entera antes de empezar.',
      'Una buena cruz es:',
      '- **Corta:** 8 giros o menos.',
      '- **De memoria:** sale sin pausas.',
      '- **Con la vista adelante:** te deja mirando el primer par del F2L.',
      'Aquí aprendes los casos de cada arista, cómo combinarlas y cómo ahorrar giros. Luego el entrenador compara tu solución con la más corta.',
    ].join('\n'),
    [
      'The cross is the first thing in every solve and the only part you can plan entirely before you start.',
      'A good cross is:',
      '- **Short:** 8 moves or fewer.',
      '- **From memory:** it flows without pauses.',
      '- **Eyes ahead:** it leaves you looking at the first F2L pair.',
      'Here you learn the cases for each edge, how to combine them and how to save moves. Then the trainer compares your solution with the shortest one.',
    ].join('\n'),
    [
      'A cruz é a primeira coisa de cada resolução e a única parte que você pode planejar inteira antes de começar.',
      'Uma boa cruz é:',
      '- **Curta:** 8 movimentos ou menos.',
      '- **De memória:** sai sem pausas.',
      '- **Com os olhos adiante:** deixa você olhando para o primeiro par do F2L.',
      'Aqui você aprende os casos de cada aresta, como combiná-las e como economizar movimentos. Depois o treino compara sua solução com a mais curta.',
    ].join('\n'),
  ),
  // What it is, then each edge, then combining them; planning comes once there is something to plan
  lessons: [
    {
      id: 'que-es',
      title: tr('Qué es la cruz y por qué abajo', 'What the cross is and why on the bottom', 'O que é a cruz e por que embaixo'),
      body: tr(
        [
          'La cruz son las 4 aristas blancas alrededor del centro blanco, **cada una junto a su centro lateral**.',
          'Si la blanco-verde está bajo el centro rojo, la cruz está mal aunque la cara blanca se vea bien.',
          '## Dónde va cada arista',
          'Con amarillo arriba y verde al frente, la cruz queda abajo:',
          '- **Blanco-verde:** abajo al frente.',
          '- **Blanco-naranja:** abajo a la derecha.',
          '- **Blanco-azul:** abajo atrás.',
          '- **Blanco-roja:** abajo a la izquierda.',
          '## Por qué abajo',
          'Sigues directo con el F2L: las piezas quedan a la vista arriba y no volteas el cubo.',
          'Al principio cuesta no ver la cara blanca: reconoce cada arista por su otro color.',
        ].join('\n'),
        [
          'The cross is the 4 white edges around the white center, **each one next to its side center**.',
          'If the white-green edge is under the red center, the cross is wrong even if the white face looks right.',
          '## Where each edge goes',
          'With yellow on top and green in front, the cross sits on the bottom:',
          '- **White-green:** bottom front.',
          '- **White-orange:** bottom right.',
          '- **White-blue:** bottom back.',
          '- **White-red:** bottom left.',
          '## Why on the bottom',
          "You go straight into F2L: the pieces stay in view on top and you don't flip the cube.",
          "At first it's hard not to see the white face: recognize each edge by its other color.",
        ].join('\n'),
        [
          'A cruz são as 4 arestas brancas ao redor do centro branco, **cada uma junto ao seu centro lateral**.',
          'Se a branco-verde está embaixo do centro vermelho, a cruz está errada mesmo que a face branca pareça certa.',
          '## Onde vai cada aresta',
          'Com o amarelo em cima e o verde na frente, a cruz fica embaixo:',
          '- **Branco-verde:** embaixo na frente.',
          '- **Branco-laranja:** embaixo à direita.',
          '- **Branco-azul:** embaixo atrás.',
          '- **Branco-vermelha:** embaixo à esquerda.',
          '## Por que embaixo',
          'Você segue direto para o F2L: as peças ficam à vista em cima e você não vira o cubo.',
          'No começo é difícil não ver a face branca: reconheça cada aresta pela outra cor.',
        ].join('\n'),
      ),
    },
    {
      id: 'una-arista',
      title: tr('Casos de una arista', 'One-edge cases', 'Casos de uma aresta'),
      body: tr(
        [
          'Busca una arista blanca y mira dónde está y hacia dónde mira el blanco.',
          '- **Arriba, blanco arriba** (1 o 2 giros): gira `U` hasta dejarla sobre su centro y bájala con media vuelta: `F2`, `R2`, `B2` o `L2`.',
          '- **Arriba, blanco de lado** (3 o 4 giros): está volteada. Bájala a la capa del medio con un cuarto de vuelta y métela con un cuarto de vuelta de la cara de al lado.',
          '- **En la capa del medio:** un cuarto de vuelta la baja.',
          '- **Abajo, mal puesta o volteada:** sácala a la capa del medio o arriba, y sigue como en los casos anteriores.',
          '**Regla de oro:** `U` nunca toca la cruz. Úsalo para llevar una arista sobre su centro antes de bajarla.',
        ].join('\n'),
        [
          'Find a white edge and look at where it is and where the white faces.',
          '- **Top, white facing up** (1 or 2 moves): turn `U` until it is above its center and bring it down with a half turn: `F2`, `R2`, `B2` or `L2`.',
          '- **Top, white on the side** (3 or 4 moves): it is flipped. Take it to the middle layer with a quarter turn and insert it with a quarter turn of the adjacent face.',
          '- **In the middle layer:** one quarter turn brings it down.',
          '- **On the bottom, misplaced or flipped:** take it out to the middle layer or the top, and continue as in the cases above.',
          '**Golden rule:** `U` never touches the cross. Use it to bring an edge above its center before bringing it down.',
        ].join('\n'),
        [
          'Procure uma aresta branca e veja onde ela está e para onde o branco olha.',
          '- **Em cima, branco para cima** (1 ou 2 movimentos): gire `U` até deixá-la sobre o seu centro e desça-a com meia volta: `F2`, `R2`, `B2` ou `L2`.',
          '- **Em cima, branco para o lado** (3 ou 4 movimentos): ela está virada. Desça-a para a camada do meio com um quarto de volta e encaixe-a com um quarto de volta da face ao lado.',
          '- **Na camada do meio:** um quarto de volta a desce.',
          '- **Embaixo, fora do lugar ou virada:** tire-a para a camada do meio ou para cima, e continue como nos casos anteriores.',
          '**Regra de ouro:** `U` nunca mexe na cruz. Use-o para levar uma aresta sobre o seu centro antes de descê-la.',
        ].join('\n'),
      ),
      examples: [
        ex('F2', 'F2', 'Blanco-verde arriba, sobre su centro, blanco arriba: `F2` la baja directo.', 'White-green on top, above its center, white facing up: `F2` brings it straight down.', 'Branco-verde em cima, sobre o seu centro, branco para cima: `F2` a desce direto.'),
        ex("R2 U'", 'U R2', 'Blanco-naranja arriba atrás, blanco arriba: `U` la pone sobre su centro y `R2` la baja.', 'White-orange on top at the back, white facing up: `U` puts it above its center and `R2` brings it down.', 'Branco-laranja em cima atrás, branco para cima: `U` a coloca sobre o seu centro e `R2` a desce.'),
        ex('B2 U2', 'U2 B2', 'Blanco-azul arriba al frente, blanco arriba: `U2` la lleva atrás y `B2` la baja.', 'White-blue on top at the front, white facing up: `U2` takes it to the back and `B2` brings it down.', 'Branco-azul em cima na frente, branco para cima: `U2` a leva para trás e `B2` a desce.'),
        ex("R' F' R", "R' F R", "Blanco-verde arriba a la derecha, blanco a la derecha: `R'` la baja a la capa del medio (y aparta la blanco-naranja), `F` la mete orientada y `R` devuelve la blanco-naranja.", "White-green on top at the right, white facing right: `R'` brings it to the middle layer (and moves the white-orange aside), `F` inserts it oriented and `R` puts the white-orange back.", 'Branco-verde em cima à direita, branco para a direita: `R\'` a desce para a camada do meio (e afasta a branco-laranja), `F` a encaixa orientada e `R` devolve a branco-laranja.'),
        ex("F R F'", "F R' F'", "Blanco-naranja arriba al frente, blanco al frente: `F` la pasa a la capa del medio, `R'` la mete abajo y `F'` devuelve la blanco-verde que `F` sacó.", "White-orange on top at the front, white facing front: `F` moves it to the middle layer, `R'` inserts it on the bottom and `F'` puts back the white-green that `F` pulled out.", 'Branco-laranja em cima na frente, branco para a frente: `F` a passa para a camada do meio, `R\'` a encaixa embaixo e `F\'` devolve a branco-verde que `F` tirou.'),
        ex("R' F' R U", "U' R' F R", "Blanco-verde arriba al frente, sobre su centro, blanco al frente: `U'` la pasa a la derecha y queda el caso de `R' F R`.", "White-green on top at the front, above its center, white facing front: `U'` moves it to the right and it becomes the `R' F R` case.", 'Branco-verde em cima na frente, sobre o seu centro, branco para a frente: `U\'` a passa para a direita e vira o caso de `R\' F R`.'),
        ex('R', "R'", "Blanco-naranja en la capa del medio, adelante a la derecha, blanco al frente: `R'` la baja a su sitio.", "White-orange in the middle layer, front right, white facing front: `R'` brings it down to its spot.", 'Branco-laranja na camada do meio, na frente à direita, branco para a frente: `R\'` a desce para o seu lugar.'),
        ex("F'", 'F', 'Blanco-verde en la capa del medio, adelante a la derecha, blanco a la derecha: `F` la baja a su sitio.', 'White-green in the middle layer, front right, white facing right: `F` brings it down to its spot.', 'Branco-verde na camada do meio, na frente à direita, branco para a direita: `F` a desce para o seu lugar.'),
        ex("D' F' D", "D' F D", "Blanco-naranja en la capa del medio, adelante a la derecha, blanco a la derecha: solo con `F` quedaría en el sitio de la blanco-verde. `D'` trae su hueco al frente, `F` la mete y `D` regresa la cruz.", "White-orange in the middle layer, front right, white facing right: with just `F` it would land in the white-green's spot. `D'` brings its slot to the front, `F` inserts it and `D` restores the cross.", 'Branco-laranja na camada do meio, na frente à direita, branco para a direita: só com `F` ela cairia no lugar da branco-verde. `D\'` traz o slot dela para a frente, `F` a encaixa e `D` restaura a cruz.'),
        ex("F2 U' R' F R", "F' D R' D'", "Blanco-verde en su sitio pero volteada, blanco al frente: `F'` la saca a la capa del medio, `D` pone su hueco a la derecha, `R'` la mete orientada y `D'` regresa la cruz.", "White-green in its spot but flipped, white facing front: `F'` takes it out to the middle layer, `D` puts its slot on the right, `R'` inserts it oriented and `D'` restores the cross.", 'Branco-verde no seu lugar, mas virada, branco para a frente: `F\'` a tira para a camada do meio, `D` põe o slot dela à direita, `R\'` a encaixa orientada e `D\'` restaura a cruz.'),
        ex("F2 U' R2", 'R2 U F2', 'Blanco-verde abajo en el sitio de la blanco-naranja, y la blanco-naranja arriba a la derecha: `R2` las cambia, `U` lleva la verde sobre su centro y `F2` la baja.', "White-green on the bottom in the white-orange's spot, and the white-orange on top at the right: `R2` swaps them, `U` brings the green above its center and `F2` brings it down.", 'Branco-verde embaixo no lugar da branco-laranja, e a branco-laranja em cima à direita: `R2` troca as duas, `U` leva a verde sobre o seu centro e `F2` a desce.'),
      ],
      tips: tr(
        [
          "- **El primer giro sacó una arista ya puesta:** devuélvela después con el giro contrario, como en `R' F R`.",
          "- **La arista de la capa del medio caería en el sitio de otra:** antes, gira `D` para traer su hueco; métela y deshaz ese `D`, como en `D' F D`.",
        ].join('\n'),
        [
          "- **The first turn pulled out an edge already in place:** put it back afterwards with the opposite turn, as in `R' F R`.",
          "- **The middle-layer edge would land in another edge's spot:** first turn `D` to bring its slot over; insert it and undo that `D`, as in `D' F D`.",
        ].join('\n'),
        [
          "- **O primeiro movimento tirou uma aresta já colocada:** devolva-a depois com o movimento contrário, como em `R' F R`.",
          "- **A aresta da camada do meio cairia no lugar de outra:** antes, gire `D` para trazer o slot dela; encaixe-a e desfaça esse `D`, como em `D' F D`.",
        ].join('\n'),
      ),
    },
    {
      id: 'relativas',
      title: tr('Aristas relativas entre sí', 'Edges relative to each other', 'Arestas relativas entre si'),
      body: tr(
        [
          'Mientras armas la cruz, las aristas no tienen que estar bajo sus centros: **basta con que estén bien entre sí**.',
          'Dos aristas están bien entre sí si un giro de `D` puede dejar las dos bajo sus centros a la vez.',
          '1. Busca 2 aristas abajo que estén bien entre sí: ya cuentan como resueltas.',
          '2. Mete las demás en el hueco que les toca junto a ellas.',
          '3. Alinea todo con un solo giro de `D` al final.',
          'No alinees con `D` al principio: casi siempre sale más corto dejarlo para el final.',
        ].join('\n'),
        [
          "While you build the cross, the edges don't have to be under their centers: **it's enough that they are right relative to each other**.",
          'Two edges are right relative to each other if one `D` turn can put both under their centers at once.',
          '1. Find 2 edges on the bottom that are right relative to each other: they already count as solved.',
          '2. Insert the others into the slot they belong in next to them.',
          '3. Align everything with a single `D` turn at the end.',
          "Don't align with `D` at the start: it's almost always shorter to leave it for the end.",
        ].join('\n'),
        [
          'Enquanto você monta a cruz, as arestas não precisam estar embaixo dos seus centros: **basta que estejam certas entre si**.',
          'Duas arestas estão certas entre si se um movimento de `D` pode deixar as duas embaixo dos seus centros ao mesmo tempo.',
          '1. Procure 2 arestas embaixo que estejam certas entre si: elas já contam como resolvidas.',
          '2. Encaixe as outras no slot que cabe a cada uma junto delas.',
          '3. Alinhe tudo com um único movimento de `D` no final.',
          'Não alinhe com `D` no começo: quase sempre fica mais curto deixar para o final.',
        ].join('\n'),
      ),
      examples: [
        ex('D', "D'", "Las 4 aristas bien entre sí, solo giradas respecto a los centros: `D'` y listo.", "All 4 edges right relative to each other, just turned relative to the centers: `D'` and done.", 'As 4 arestas certas entre si, só giradas em relação aos centros: `D\'` e pronto.'),
        ex('D R2', "R2 D'", "3 aristas abajo bien entre sí y la blanco-verde arriba a la derecha: `R2` la baja junto a ellas y `D'` alinea todo. Alinear primero costaría 1 giro más.", "3 edges on the bottom right relative to each other and the white-green on top at the right: `R2` brings it down next to them and `D'` aligns everything. Aligning first would cost 1 more move.", '3 arestas embaixo certas entre si e a branco-verde em cima à direita: `R2` a desce junto delas e `D\'` alinha tudo. Alinhar primeiro custaria 1 movimento a mais.'),
        ex('D R2 F2', "F2 R2 D'", "Blanco-naranja y blanco-azul abajo bien entre sí, las otras 2 arriba: `F2` baja la blanco-roja y `R2` la blanco-verde, cada una en su hueco, y `D'` alinea las 4.", "White-orange and white-blue on the bottom right relative to each other, the other 2 on top: `F2` brings down the white-red and `R2` the white-green, each into its slot, and `D'` aligns all 4.", 'Branco-laranja e branco-azul embaixo certas entre si, as outras 2 em cima: `F2` desce a branco-vermelha e `R2` a branco-verde, cada uma no seu slot, e `D\'` alinha as 4.'),
      ],
    },
    {
      id: 'inspeccion',
      title: tr('Planifica en la inspección', 'Plan during inspection', 'Planeje na inspeção'),
      body: tr(
        [
          'En competencia (WCA) tienes **15 s de inspección**: puedes girar el cubo entero, pero no mover caras. Úsalos para planear la cruz entera.',
          '1. **Encuentra las 4 aristas blancas:** arriba, en la capa del medio y abajo.',
          '2. **Elige el orden:** empieza por la más corta o por 2 que ya estén bien entre sí. Probar otro orden suele ahorrar giros.',
          '3. **Traza todos los giros** y repásalos una vez. Si pasan de 8, busca otro plan: toda cruz se resuelve en 8 o menos, y lo normal son unos 6.',
          '4. **Ejecuta con los ojos adelante:** busca ya el primer par del F2L.',
          '¿Aún no planeas las 4? Planea 2 y resuelve el resto mirando. Suma una más cada semana.',
        ].join('\n'),
        [
          'In competition (WCA) you get **15 s of inspection**: you can turn the whole cube, but not move faces. Use them to plan the whole cross.',
          '1. **Find the 4 white edges:** on top, in the middle layer and on the bottom.',
          '2. **Pick the order:** start with the shortest one or with 2 that are already right relative to each other. Trying another order often saves moves.',
          '3. **Trace all the moves** and review them once. If they go over 8, look for another plan: every cross can be solved in 8 or fewer, and about 6 is typical.',
          '4. **Execute with your eyes ahead:** start looking for the first F2L pair.',
          "Can't plan all 4 yet? Plan 2 and solve the rest by looking. Add one more each week.",
        ].join('\n'),
        [
          'Em competição (WCA) você tem **15 s de inspeção**: pode girar o cubo inteiro, mas não mover faces. Use-os para planejar a cruz inteira.',
          '1. **Encontre as 4 arestas brancas:** em cima, na camada do meio e embaixo.',
          '2. **Escolha a ordem:** comece pela mais curta ou por 2 que já estejam certas entre si. Testar outra ordem costuma economizar movimentos.',
          '3. **Trace todos os movimentos** e revise uma vez. Se passarem de 8, procure outro plano: toda cruz se resolve em 8 ou menos, e o normal são uns 6.',
          '4. **Execute com os olhos adiante:** já procure o primeiro par do F2L.',
          'Ainda não planeja as 4? Planeje 2 e resolva o resto olhando. Some mais uma a cada semana.',
        ].join('\n'),
      ),
    },
    {
      id: 'eficiencia',
      title: tr('Eficiencia y tiempo', 'Efficiency and time', 'Eficiência e tempo'),
      body: tr(
        [
          '- **No rotes el cubo** (`x`, `y`, `z`): cuesta tiempo y pierdes de vista las piezas.',
          '- **Cuida lo resuelto:** antes de `R`, `L`, `F` o `B`, mira si saca una arista ya puesta. Si la saca, elige otro giro, apártala antes con `D` o devuélvela después.',
          '- **Arriba colocas, abajo alineas:** `U` lleva una arista sobre su centro o su hueco; `D` alinea la cruz al final.',
          '- **Media vuelta o cuarto de vuelta:** media vuelta (`R2`, `F2`…) baja una arista de arriba abajo sin voltearla; un cuarto de vuelta la mueve entre la capa del medio y arriba o abajo.',
          '- **Giros cómodos:** `R`, `U`, `F` y `D` salen sin cambiar el agarre; `B` y `L` son más lentos. A igual número de giros, elige el más cómodo.',
          '- **Fluidez antes que velocidad:** una cruz sin pausas gana a una rápida con frenadas. Practica lento y sin parar.',
        ].join('\n'),
        [
          "- **Don't rotate the cube** (`x`, `y`, `z`): it costs time and you lose sight of the pieces.",
          "- **Protect what's solved:** before `R`, `L`, `F` or `B`, check whether it pulls out an edge already in place. If it does, pick another turn, move it aside first with `D` or put it back afterwards.",
          '- **Position on top, align on the bottom:** `U` brings an edge above its center or its slot; `D` aligns the cross at the end.',
          '- **Half turn or quarter turn:** a half turn (`R2`, `F2`…) takes an edge from top to bottom without flipping it; a quarter turn moves it between the middle layer and the top or bottom.',
          '- **Comfortable turns:** `R`, `U`, `F` and `D` are done without changing grip; `B` and `L` are slower. With the same number of moves, choose the most comfortable one.',
          '- **Flow before speed:** a cross without pauses beats a fast one with stops. Practice slowly and without stopping.',
        ].join('\n'),
        [
          '- **Não rotacione o cubo** (`x`, `y`, `z`): custa tempo e você perde as peças de vista.',
          '- **Cuide do que está resolvido:** antes de `R`, `L`, `F` ou `B`, veja se ele tira uma aresta já colocada. Se tirar, escolha outro movimento, afaste-a antes com `D` ou devolva-a depois.',
          '- **Em cima posiciona, embaixo alinha:** `U` leva uma aresta sobre o seu centro ou o seu slot; `D` alinha a cruz no final.',
          '- **Meia volta ou quarto de volta:** meia volta (`R2`, `F2`…) desce uma aresta de cima para baixo sem virá-la; um quarto de volta a move entre a camada do meio e em cima ou embaixo.',
          '- **Movimentos confortáveis:** `R`, `U`, `F` e `D` saem sem mudar a pegada; `B` e `L` são mais lentos. Com o mesmo número de movimentos, escolha o mais confortável.',
          '- **Fluidez antes da velocidade:** uma cruz sem pausas ganha de uma rápida com freadas. Pratique devagar e sem parar.',
        ].join('\n'),
      ),
    },
    {
      id: 'errores',
      title: tr('Errores comunes', 'Common mistakes', 'Erros comuns'),
      body: tr(
        [
          '- **Armas la margarita o la cruz arriba** y luego la volteas: cuesta el doble de giros. Ármala directamente abajo.',
          '- **Miras solo el blanco:** con el blanco abajo pero bajo el centro equivocado, no está resuelta. Mira también su otro color.',
          '- **Paras a mitad de la cruz:** esa pausa es lo que más tiempo cuesta. Planea todos los giros antes de empezar.',
          '- **Rompes lo ya puesto** al meter otra arista, y lo notas al final: antes de cada giro, mira qué arista saca.',
          '- **Empiezas siempre por la blanco-verde:** empieza por la más fácil.',
          '- **Admiras la cruz terminada:** busca ya el primer par del F2L.',
        ].join('\n'),
        [
          '- **You build the daisy or the cross on top** and then flip it: it costs twice the moves. Build it straight on the bottom.',
          "- **You look only at the white:** with white on the bottom but under the wrong center, it isn't solved. Check its other color too.",
          '- **You stop in the middle of the cross:** that pause is what costs the most time. Plan every move before you start.',
          "- **You break what's already in place** when inserting another edge, and only notice at the end: before each turn, check which edge it pulls out.",
          '- **You always start with the white-green:** start with the easiest one.',
          '- **You admire the finished cross:** look for the first F2L pair right away.',
        ].join('\n'),
        [
          '- **Você monta a margarida ou a cruz em cima** e depois a vira: custa o dobro de movimentos. Monte-a direto embaixo.',
          '- **Você olha só o branco:** com o branco embaixo, mas sob o centro errado, não está resolvida. Confira também a outra cor.',
          '- **Você para no meio da cruz:** essa pausa é o que mais custa tempo. Planeje todos os movimentos antes de começar.',
          '- **Você quebra o que já está colocado** ao encaixar outra aresta, e só percebe no final: antes de cada movimento, veja que aresta ele tira.',
          '- **Você começa sempre pela branco-verde:** comece pela mais fácil.',
          '- **Você admira a cruz terminada:** já procure o primeiro par do F2L.',
        ].join('\n'),
      ),
    },
  ],
  levels: [
    {
      id: 'n1',
      name: tr('Nivel 1 — Encuentra el giro', 'Level 1 — Find the turn', 'Nível 1 — Encontre o movimento'),
      description: tr('Cruces a 1 o 2 giros de resolverse. Encuentra los giros exactos sin probar.', 'Crosses 1 or 2 moves from solved. Find the exact moves without trial and error.', 'Cruzes a 1 ou 2 movimentos de serem resolvidas. Encontre os movimentos exatos sem tentativa e erro.'),
      moves: { min: 1, max: 2 },
      goal: { overOptimal: 0, seconds: 2 },
    },
    {
      id: 'n2',
      name: tr('Nivel 2 — Dos aristas', 'Level 2 — Two edges', 'Nível 2 — Duas arestas'),
      description: tr('Cruces de 3 o 4 giros: 1 arista volteada o 2 por resolver. Planea todo antes de girar.', 'Crosses of 3 or 4 moves: 1 flipped edge or 2 to solve. Plan everything before turning.', 'Cruzes de 3 ou 4 movimentos: 1 aresta virada ou 2 por resolver. Planeje tudo antes de girar.'),
      moves: { min: 3, max: 4 },
      goal: { overOptimal: 1, seconds: 3 },
    },
    {
      id: 'n3',
      name: tr('Nivel 3 — Planea la cruz entera', 'Level 3 — Plan the whole cross', 'Nível 3 — Planeje a cruz inteira'),
      description: tr('Cruces de 5 o 6 giros, el promedio de una mezcla real. Planea las 4 aristas y ejecuta sin pausas.', 'Crosses of 5 or 6 moves, the average of a real scramble. Plan all 4 edges and execute without pauses.', 'Cruzes de 5 ou 6 movimentos, a média de um embaralhamento real. Planeje as 4 arestas e execute sem pausas.'),
      moves: { min: 5, max: 6 },
      goal: { overOptimal: 2, seconds: 4 },
    },
    {
      id: 'n4',
      name: tr('Nivel 4 — Como en competencia', 'Level 4 — Competition style', 'Nível 4 — Como em competição'),
      description: tr('Cruces de 7 u 8 giros, las más difíciles de una mezcla real. Usa toda la inspección.', 'Crosses of 7 or 8 moves, the hardest of a real scramble. Use the whole inspection.', 'Cruzes de 7 ou 8 movimentos, as mais difíceis de um embaralhamento real. Use toda a inspeção.'),
      moves: { min: 7, max: 8 },
      goal: { overOptimal: 2, seconds: 5 },
    },
  ],
};

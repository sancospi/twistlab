// "La cruz blanca": the first step of CFOP and of the beginner method, as a standalone guide with a trainer.
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
  summary: tr('Aprende la cruz blanca del cubo de Rubik, el primer paso del CFOP: cómo planearla en la inspección y resolverla en 8 giros o menos.', "Learn the white cross on the Rubik's cube, the first step of CFOP: how to plan it during inspection and solve it in 8 moves or fewer.", 'Aprenda a cruz branca do cubo mágico, o primeiro passo do CFOP: como planejá-la na inspeção e resolvê-la em 8 movimentos ou menos.'),
  intro: tr(
    [
      'La cruz es el primer paso del CFOP, el método más usado para resolver el cubo rápido. Es la única parte que puedes planear entera antes de empezar.',
      'Una buena cruz es:',
      '- **Corta:** 8 giros o menos.',
      '- **Planeada:** la haces de memoria, sin pausas.',
      '- **Con la vista en lo que sigue:** al terminarla ya buscas el primer par del F2L.',
      'El F2L, el paso que sigue, arma las dos primeras capas con 4 pares: cada par es una esquina y su arista, que metes juntas.',
      'Aquí aprendes los casos de cada arista, cómo combinarlas y cómo ahorrar giros. Luego el entrenador compara tu solución con la más corta.',
    ].join('\n'),
    [
      "The cross is the first step of CFOP, the most popular method for solving the cube fast. It's the only part you can plan entirely before you start.",
      'A good cross is:',
      '- **Short:** 8 moves or fewer.',
      '- **Planned:** you do it from memory, without pauses.',
      "- **Looking ahead:** by the time you finish it, you're already looking for the first F2L pair.",
      'F2L, the next step, builds the first two layers with 4 pairs: each pair is a corner and its edge, which you insert together.',
      'Here you learn the cases for each edge, how to combine them and how to save moves. Then the trainer compares your solution with the shortest one.',
    ].join('\n'),
    [
      'A cruz é o primeiro passo do CFOP, o método mais usado para resolver o cubo rápido. É a única parte que você pode planejar inteira antes de começar.',
      'Uma boa cruz é:',
      '- **Curta:** 8 movimentos ou menos.',
      '- **Planejada:** você a faz de memória, sem pausas.',
      '- **De olho no que vem depois:** ao terminá-la, você já procura o primeiro par do F2L.',
      'O F2L, o passo seguinte, monta as duas primeiras camadas com 4 pares: cada par é uma quina e sua aresta, que você insere juntas.',
      'Aqui você aprende os casos de cada aresta, como combiná-las e como economizar movimentos. Depois o treino compara sua solução com a mais curta.',
    ].join('\n'),
  ),
  // What it is, then each edge, then combining them; planning comes once there is something to plan
  lessons: [
    {
      id: 'que-es',
      title: tr('Qué es la cruz y por qué abajo', 'What the cross is and why it goes on the bottom', 'O que é a cruz e por que embaixo'),
      body: tr(
        [
          'La cruz son las 4 aristas blancas alrededor del centro blanco, **cada una junto al centro de su otro color**.',
          'Si la arista blanco-verde está junto al centro rojo, la cruz está mal aunque la cara blanca se vea bien.',
          '## Dónde va cada arista',
          'Con el amarillo arriba y el verde al frente, la cruz queda abajo:',
          '- **Blanco-verde:** abajo adelante.',
          '- **Blanco-naranja:** abajo a la derecha.',
          '- **Blanco-azul:** abajo atrás.',
          '- **Blanco-roja:** abajo a la izquierda.',
          '## Por qué abajo',
          'Con la cruz abajo pasas directamente al F2L, el paso que arma las dos primeras capas, sin darle la vuelta al cubo. Las piezas que vas a buscar quedan arriba, a la vista.',
          'Al principio cuesta orientarse sin ver la cara blanca: reconoce cada arista por su otro color.',
        ].join('\n'),
        [
          'The cross is made up of the 4 white edges around the white center, **each one next to the center of its other color**.',
          'If the white-green edge is next to the red center, the cross is wrong even if the white face looks right.',
          '## Where each edge goes',
          'With yellow on top and green facing front, the cross sits on the bottom:',
          '- **White-green:** bottom front.',
          '- **White-orange:** bottom right.',
          '- **White-blue:** bottom back.',
          '- **White-red:** bottom left.',
          '## Why on the bottom',
          "With the cross on the bottom, you go straight into F2L, the step that builds the first two layers, without turning the cube over. The pieces you'll look for stay on top, in view.",
          "At first it's hard to get your bearings without seeing the white face: recognize each edge by its other color.",
        ].join('\n'),
        [
          'A cruz são as 4 arestas brancas ao redor do centro branco, **cada uma junto ao centro da sua outra cor**.',
          'Se a aresta branco-verde estiver junto ao centro vermelho, a cruz está errada, mesmo que a face branca pareça certa.',
          '## Onde vai cada aresta',
          'Com o amarelo em cima e o verde para a frente, a cruz fica embaixo:',
          '- **Branco-verde:** embaixo na frente.',
          '- **Branco-laranja:** embaixo à direita.',
          '- **Branco-azul:** embaixo atrás.',
          '- **Branco-vermelha:** embaixo à esquerda.',
          '## Por que embaixo',
          'Com a cruz embaixo, você segue direto para o F2L, o passo que monta as duas primeiras camadas, sem virar o cubo de cabeça para baixo. As peças que você vai procurar ficam em cima, à vista.',
          'No começo é difícil se orientar sem ver a face branca: reconheça cada aresta pela outra cor.',
        ].join('\n'),
      ),
    },
    {
      id: 'una-arista',
      title: tr('Casos de una arista', 'One-edge cases', 'Casos de uma aresta'),
      body: tr(
        [
          'Busca una arista blanca y fíjate en dónde está y hacia dónde mira el blanco.',
          '- **Arriba, con el blanco arriba** (1 o 2 giros): gira `U` hasta dejarla sobre el centro de su otro color. Luego bájala con media vuelta de esa cara: `F2`, `R2`, `B2` o `L2`.',
          '- **Arriba, con el blanco de lado** (2 a 4 giros): está volteada. Bájala a la capa del medio con un cuarto de vuelta de la cara hacia donde mira el blanco. Elige el sentido que deja su otro color junto a su centro. Si ninguno lo hace, gira antes `U` una vez. Luego métela con un cuarto de vuelta de la cara de ese centro, en el sentido que la baja. Si al bajarla sacaste una arista de la cruz, devuélvela al final.',
          '- **En la capa del medio** (1 o 3 giros): gira un cuarto de vuelta la cara hacia donde mira su otro color, en el sentido que la baja. Así baja con el blanco abajo. Si el centro de esa cara no es de su otro color, caería en el sitio de otra arista. En ese caso, gira antes `D` para llevar su sitio debajo de esa cara y deshaz ese `D` al final.',
          '- **Abajo, en otro sitio o volteada:** sácala girando la cara del lado donde está. Con media vuelta queda arriba y con un cuarto de vuelta, en la capa del medio. Desde ahí, resuélvela como una arista de esa capa.',
          '**Regla de oro:** `U` nunca toca la cruz. Úsalo para llevar una arista sobre su centro antes de bajarla.',
        ].join('\n'),
        [
          'Find a white edge and notice where it is and which way its white faces.',
          "- **On top, white facing up** (1 or 2 moves): turn `U` until it's above the center of its other color. Then bring it down with a half turn of that face: `F2`, `R2`, `B2` or `L2`.",
          "- **On top, white facing sideways** (2 to 4 moves): it's flipped. Bring it down to the middle layer with a quarter turn of the face the white is facing. Pick the direction that puts its other color next to its center. If neither does, turn `U` once first. Then insert it with a quarter turn of that center's face, in the direction that brings it down. If bringing it down pulled out a cross edge, put that edge back at the end.",
          "- **In the middle layer** (1 or 3 moves): make a quarter turn of the face its other color is facing, in the direction that brings it down. It lands on the bottom, white facing down. If that face's center isn't its other color, it'll land in another edge's place. In that case, first turn `D` to bring its place under that face and undo that `D` at the end.",
          "- **On the bottom, in the wrong place or flipped:** take it out by turning the side face it's on. A half turn leaves it on top, and a quarter turn leaves it in the middle layer. From there, solve it like an edge in that layer.",
          '**Golden rule:** `U` never touches the cross. Use it to bring an edge above its center before bringing it down.',
        ].join('\n'),
        [
          'Procure uma aresta branca e repare onde ela está e para onde o branco olha.',
          '- **Em cima, com o branco para cima** (1 ou 2 movimentos): gire `U` até deixá-la sobre o centro da sua outra cor. Depois desça-a com meia-volta dessa face: `F2`, `R2`, `B2` ou `L2`.',
          '- **Em cima, com o branco para o lado** (2 a 4 movimentos): ela está invertida. Desça-a para a camada do meio com um quarto de volta da face para onde o branco olha. Escolha o sentido que deixa a sua outra cor junto ao seu centro. Se nenhum deixar, gire `U` uma vez antes. Depois insira-a com um quarto de volta da face desse centro, no sentido que a desce. Se, ao descê-la, você tirar uma aresta da cruz, devolva-a no final.',
          '- **Na camada do meio** (1 ou 3 movimentos): gire um quarto de volta a face para onde a sua outra cor olha, no sentido que a desce. Assim ela desce com o branco para baixo. Se o centro dessa face não for da sua outra cor, ela vai cair no lugar de outra aresta. Nesse caso, gire `D` antes para levar o lugar dela para baixo dessa face e desfaça esse `D` no final.',
          '- **Embaixo, em outro lugar ou invertida:** tire-a girando a face do lado onde ela está. Com meia-volta ela fica em cima e, com um quarto de volta, na camada do meio. A partir daí, resolva-a como uma aresta dessa camada.',
          '**Regra de ouro:** `U` nunca mexe na cruz. Use-o para levar uma aresta sobre o seu centro antes de descê-la.',
        ].join('\n'),
      ),
      examples: [
        ex('F2', 'F2', 'Blanco-verde arriba adelante, sobre su centro, con el blanco arriba: `F2` la baja directamente.', 'White-green at top front, above its center, white facing up: `F2` brings it straight down.', 'Branco-verde em cima na frente, sobre o seu centro, com o branco para cima: `F2` a desce direto.'),
        ex("R2 U'", 'U R2', 'Blanco-naranja arriba atrás, con el blanco arriba: `U` la pone sobre su centro y `R2` la baja.', 'White-orange at top back, white facing up: `U` puts it above its center and `R2` brings it down.', 'Branco-laranja em cima atrás, com o branco para cima: `U` a coloca sobre o seu centro e `R2` a desce.'),
        ex('B2 U2', 'U2 B2', 'Blanco-azul arriba adelante, con el blanco arriba: `U2` la lleva atrás, sobre su centro, y `B2` la baja.', 'White-blue at top front, white facing up: `U2` takes it to the back, above its center, and `B2` brings it down.', 'Branco-azul em cima na frente, com o branco para cima: `U2` a leva para trás, sobre o seu centro, e `B2` a desce.'),
        ex("R' F' R", "R' F R", "Blanco-verde arriba a la derecha, con el blanco a la derecha. `R'` la baja a la capa del medio y aparta la blanco-naranja, `F` la mete con el blanco abajo y `R` devuelve la blanco-naranja.", "White-green at top right, white facing right. `R'` brings it down to the middle layer and moves the white-orange aside, `F` inserts it with the white facing down and `R` puts the white-orange back.", "Branco-verde em cima à direita, com o branco para a direita. `R'` a desce para a camada do meio e afasta a branco-laranja, `F` a insere com o branco para baixo e `R` devolve a branco-laranja."),
        ex("F R F'", "F R' F'", "Blanco-naranja arriba adelante, con el blanco al frente: `F` la pasa a la capa del medio, `R'` la mete abajo y `F'` devuelve la blanco-verde que `F` sacó.", "White-orange at top front, white facing front: `F` moves it to the middle layer, `R'` inserts it on the bottom and `F'` puts back the white-green that `F` pulled out.", "Branco-laranja em cima na frente, com o branco para a frente: `F` a passa para a camada do meio, `R'` a insere embaixo e `F'` devolve a branco-verde que `F` tirou."),
        ex("R' F' R U", "U' R' F R", "Blanco-verde arriba adelante, sobre su centro, con el blanco al frente: `U'` la pasa arriba a la derecha, con el blanco a la derecha, y `R' F R` la baja.", "White-green at top front, above its center, white facing front: `U'` moves it to top right, white facing right, and `R' F R` brings it down.", "Branco-verde em cima na frente, sobre o seu centro, com o branco para a frente: `U'` a leva para a direita da camada de cima, com o branco para a direita, e `R' F R` a desce."),
        ex('R', "R'", "Blanco-naranja en la capa del medio, adelante a la derecha, con el blanco al frente: `R'` la baja a su sitio.", "White-orange in the middle layer, front right, white facing front: `R'` brings it down into place.", "Branco-laranja na camada do meio, na frente à direita, com o branco para a frente: `R'` a desce para o seu lugar."),
        ex("F'", 'F', 'Blanco-verde en la capa del medio, adelante a la derecha, con el blanco a la derecha: `F` la baja a su sitio.', 'White-green in the middle layer, front right, white facing right: `F` brings it down into place.', 'Branco-verde na camada do meio, na frente à direita, com o branco para a direita: `F` a desce para o seu lugar.'),
        ex("D' F' D", "D' F D", "Blanco-naranja en la capa del medio, adelante a la derecha, con el blanco a la derecha. Con solo `F` caería en el sitio de la blanco-verde: `D'` lleva su sitio adelante, `F` la mete y `D` devuelve la cruz.", "White-orange in the middle layer, front right, white facing right. With just `F` it would land in the white-green's place: `D'` brings its place to the front, `F` inserts it and `D` puts the cross back.", "Branco-laranja na camada do meio, na frente à direita, com o branco para a direita. Só com `F` ela cairia no lugar da branco-verde: `D'` leva o lugar dela para a frente, `F` a insere e `D` põe a cruz de volta no lugar."),
        ex("F2 U' R' F R", "F' D R' D'", "Blanco-verde en su sitio pero volteada, con el blanco al frente: `F'` la saca a la capa del medio, `D` lleva su sitio a la derecha, `R'` la mete con el blanco abajo y `D'` devuelve la cruz.", "White-green in its place but flipped, white facing front: `F'` takes it out to the middle layer, `D` moves its place to the right, `R'` inserts it with the white facing down and `D'` puts the cross back.", "Branco-verde no seu lugar, mas invertida, com o branco para a frente: `F'` a tira para a camada do meio, `D` leva o lugar dela para a direita, `R'` a insere com o branco para baixo e `D'` põe a cruz de volta no lugar."),
        ex("F2 U' R2", 'R2 U F2', 'Blanco-verde abajo, en el sitio de la blanco-naranja, y la blanco-naranja arriba a la derecha, con el blanco arriba: `R2` las cambia, `U` lleva la blanco-verde sobre su centro y `F2` la baja.', "White-green on the bottom in the white-orange's place, and the white-orange at top right, white facing up: `R2` swaps them, `U` brings the white-green above its center and `F2` brings it down.", 'Branco-verde embaixo, no lugar da branco-laranja, e a branco-laranja em cima à direita, com o branco para cima: `R2` troca as duas, `U` leva a branco-verde sobre o seu centro e `F2` a desce.'),
      ],
      tips: tr(
        [
          "- **El primer giro sacó una arista ya puesta:** devuélvela con el giro contrario después de meter la nueva, como en `R' F R`.",
          "- **La arista de la capa del medio caería en el sitio de otra:** antes, gira `D` hasta llevar su sitio a donde va a caer. Métela y deshaz ese giro de `D`, como en `D' F D`.",
        ].join('\n'),
        [
          "- **The first turn pulled out an edge already in place:** after inserting the new one, put it back with the opposite turn, as in `R' F R`.",
          "- **The middle-layer edge would land in another edge's place:** first turn `D` to bring its place to where it will land. Insert it and undo that `D` turn, as in `D' F D`.",
        ].join('\n'),
        [
          "- **O primeiro movimento tirou uma aresta já colocada:** depois de inserir a nova, devolva-a com o movimento contrário, como em `R' F R`.",
          "- **A aresta da camada do meio cairia no lugar de outra:** antes, gire `D` até levar o lugar dela para onde ela vai cair. Insira-a e desfaça esse movimento de `D`, como em `D' F D`.",
        ].join('\n'),
      ),
    },
    {
      id: 'relativas',
      title: tr('Aristas bien entre sí', 'Edges right relative to each other', 'Arestas certas entre si'),
      body: tr(
        [
          'Mientras armas la cruz, las aristas no tienen que estar bajo sus centros: **basta con que estén bien entre sí**.',
          'Dos aristas están bien entre sí si un giro de `D` puede dejar las dos bajo sus centros a la vez.',
          '1. Busca 2 aristas abajo que estén bien entre sí: ya cuentan como resueltas.',
          '2. Mete las demás de modo que las 4 queden bien entre sí, aunque no estén bajo sus centros.',
          '3. Alinea todo con un solo giro de `D` al final.',
          'No alinees con `D` al principio: casi siempre sale más corto dejarlo para el final.',
        ].join('\n'),
        [
          "While you build the cross, the edges don't have to be under their centers: **they just need to be right relative to each other**.",
          'Two edges are right relative to each other if one `D` turn can put both under their centers at once.',
          '1. Find 2 edges on the bottom that are right relative to each other: they already count as solved.',
          "2. Insert the others so all 4 are right relative to each other, even if they aren't under their centers.",
          '3. Align everything with a single `D` turn at the end.',
          "Don't align with `D` at the start: it's almost always shorter to leave it for the end.",
        ].join('\n'),
        [
          'Enquanto você monta a cruz, as arestas não precisam estar embaixo dos seus centros: **basta que estejam certas entre si**.',
          'Duas arestas estão certas entre si se um movimento de `D` puder deixar as duas embaixo dos seus centros ao mesmo tempo.',
          '1. Procure 2 arestas embaixo que estejam certas entre si: elas já contam como resolvidas.',
          '2. Insira as outras de modo que as 4 fiquem certas entre si, mesmo que não estejam embaixo dos seus centros.',
          '3. Alinhe tudo com um único movimento de `D` no final.',
          'Não alinhe com `D` no começo: quase sempre fica mais curto deixar para o final.',
        ].join('\n'),
      ),
      examples: [
        ex('D', "D'", "Las 4 aristas están bien entre sí, a un giro de `D` de sus centros: `D'` y listo.", "All 4 edges are right relative to each other, one `D` turn away from their centers: `D'` and done.", "As 4 arestas estão certas entre si, a um movimento de `D` dos seus centros: `D'` e pronto."),
        ex('D R2', "R2 D'", "Tres aristas abajo, bien entre sí, y la blanco-verde arriba a la derecha, con el blanco arriba: `R2` la baja junto a ellas y `D'` alinea todo. Alinear primero costaría un giro más.", "Three edges on the bottom, right relative to each other, and the white-green at top right, white facing up: `R2` brings it down next to them and `D'` aligns everything. Aligning first would cost one more move.", "Três arestas embaixo, certas entre si, e a branco-verde em cima à direita, com o branco para cima: `R2` a desce junto delas e `D'` alinha tudo. Alinhar primeiro custaria um movimento a mais."),
        ex('D R2 F2', "F2 R2 D'", "Blanco-naranja y blanco-azul abajo, bien entre sí, y las otras 2 arriba: `F2` y `R2` bajan la blanco-roja y la blanco-verde junto a ellas, y `D'` alinea las 4.", "White-orange and white-blue on the bottom, right relative to each other, and the other 2 on top: `F2` and `R2` bring the white-red and the white-green down next to them, and `D'` aligns all 4.", "Branco-laranja e branco-azul embaixo, certas entre si, e as outras 2 em cima: `F2` e `R2` descem a branco-vermelha e a branco-verde junto delas, e `D'` alinha as 4."),
      ],
    },
    {
      id: 'inspeccion',
      title: tr('Planea en la inspección', 'Plan during inspection', 'Planeje na inspeção'),
      body: tr(
        [
          'En las competiciones oficiales de la WCA (la asociación mundial del cubo) tienes **15 s de inspección** antes de empezar. Puedes girar el cubo entero para mirarlo, pero no mover sus caras. Usa ese tiempo para planear la cruz entera.',
          '1. **Encuentra las 4 aristas blancas:** arriba, en la capa del medio y abajo.',
          '2. **Elige el orden:** empieza por la arista que necesita menos giros o por 2 que ya estén bien entre sí. Probar otro orden suele ahorrar giros.',
          '3. **Repasa el plan:** cuenta sus giros. Si pasan de 8, busca otro plan, porque toda cruz se resuelve en 8 o menos. Lo normal son unos 6.',
          '4. **Hazla sin mirarla:** mientras la ejecutas, busca ya el primer par del F2L.',
          '¿Aún no puedes planear las 4 aristas? Planea 2 y resuelve las otras mirando el cubo. Suma una más cada semana.',
        ].join('\n'),
        [
          "In official WCA (World Cube Association) competitions, you get **15 s of inspection** before you start. You can rotate the whole cube to look at it, but you can't turn its faces. Use that time to plan the whole cross.",
          '1. **Find the 4 white edges:** on top, in the middle layer and on the bottom.',
          '2. **Pick the order:** start with the edge that needs the fewest moves or with 2 that are already right relative to each other. Trying a different order often saves moves.',
          '3. **Check the plan:** count its moves. If there are more than 8, look for another plan, because every cross can be solved in 8 or fewer. About 6 is typical.',
          '4. **Do it without looking at it:** while you execute it, start looking for the first F2L pair.',
          "Can't plan all 4 edges yet? Plan 2 and solve the others by looking at the cube. Add one more each week.",
        ].join('\n'),
        [
          'Nas competições oficiais da WCA (a associação mundial do cubo), você tem **15 s de inspeção** antes de começar. Pode girar o cubo inteiro para olhá-lo, mas não mover as faces. Use esse tempo para planejar a cruz inteira.',
          '1. **Encontre as 4 arestas brancas:** em cima, na camada do meio e embaixo.',
          '2. **Escolha a ordem:** comece pela aresta que precisa de menos movimentos ou por 2 que já estejam certas entre si. Testar outra ordem costuma economizar movimentos.',
          '3. **Revise o plano:** conte os movimentos. Se passarem de 8, procure outro plano, porque toda cruz se resolve em 8 ou menos. O normal são uns 6.',
          '4. **Faça-a sem olhar para ela:** enquanto a executa, procure logo o primeiro par do F2L.',
          'Ainda não consegue planejar as 4 arestas? Planeje 2 e resolva as outras olhando o cubo. Acrescente mais uma a cada semana.',
        ].join('\n'),
      ),
    },
    {
      id: 'eficiencia',
      title: tr('Eficiencia y tiempo', 'Efficiency and time', 'Eficiência e tempo'),
      body: tr(
        [
          '- **No gires el cubo entero durante la cruz** (`x`, `y`, `z`): cuesta tiempo y pierdes de vista las piezas.',
          '- **Cuida lo resuelto:** antes de `R`, `L`, `F` o `B`, mira si saca una arista ya puesta. Si la saca, elige otro giro, apártala antes con `D` o devuélvela después.',
          '- **Arriba colocas, abajo alineas:** `U` lleva una arista encima del sitio donde la vas a bajar. `D` alinea la cruz al final.',
          '- **Media vuelta o cuarto de vuelta:** media vuelta (`R2`, `F2`…) baja una arista de arriba abajo sin voltearla. Un cuarto de vuelta la pasa de arriba o de abajo a la capa del medio, o al revés.',
          '- **Giros cómodos:** `R`, `U`, `F` y `D` son los más rápidos. `L` es algo más lento y `B` casi siempre obliga a cambiar el agarre. Si dos planes tienen el mismo número de giros, elige el más cómodo.',
          '- **Fluidez antes que velocidad:** una cruz sin pausas gana a una rápida con frenadas. Practica despacio y sin parar.',
        ].join('\n'),
        [
          "- **Don't rotate the whole cube during the cross** (`x`, `y`, `z`): it costs time and you lose sight of the pieces.",
          "- **Protect what's solved:** before turning `R`, `L`, `F` or `B`, check whether that turn pulls out an edge already in place. If it does, pick another turn, move that edge aside first with `D` or put it back afterwards.",
          "- **Position on top, align on the bottom:** `U` brings an edge above the place where you'll bring it down. `D` aligns the cross at the end.",
          '- **Half turn or quarter turn:** a half turn (`R2`, `F2`…) takes an edge from top to bottom without flipping it. A quarter turn moves it from the top or bottom to the middle layer, or back.',
          '- **Comfortable moves:** `R`, `U`, `F` and `D` are the fastest. `L` is a bit slower, and `B` almost always makes you change your grip. If two plans have the same number of moves, choose the more comfortable one.',
          '- **Flow before speed:** a cross with no pauses beats a fast one that keeps stopping. Practice slowly, without stopping.',
        ].join('\n'),
        [
          '- **Não gire o cubo inteiro durante a cruz** (`x`, `y`, `z`): custa tempo e você perde as peças de vista.',
          '- **Cuide do que está resolvido:** antes de `R`, `L`, `F` ou `B`, veja se o movimento tira uma aresta já colocada. Se tirar, escolha outro movimento, afaste-a antes com `D` ou devolva-a depois.',
          '- **Em cima você posiciona, embaixo alinha:** `U` leva uma aresta para cima do lugar onde você vai descê-la. `D` alinha a cruz no final.',
          '- **Meia-volta ou quarto de volta:** meia-volta (`R2`, `F2`…) desce uma aresta de cima para baixo sem invertê-la. Um quarto de volta a passa de cima ou de baixo para a camada do meio, ou ao contrário.',
          '- **Movimentos confortáveis:** `R`, `U`, `F` e `D` são os mais rápidos. `L` é um pouco mais lento e `B` quase sempre obriga a mudar a pegada. Se dois planos tiverem o mesmo número de movimentos, escolha o mais confortável.',
          '- **Fluidez antes da velocidade:** uma cruz sem pausas ganha de uma rápida com freadas. Pratique devagar e sem parar.',
        ].join('\n'),
      ),
    },
    {
      id: 'errores',
      title: tr('Errores comunes', 'Common mistakes', 'Erros comuns'),
      body: tr(
        [
          '- **Armas la margarita o la cruz arriba:** la margarita son las 4 aristas blancas alrededor del centro amarillo. Luego hay que pasarlas abajo, y eso cuesta el doble de giros. Arma la cruz directamente abajo.',
          '- **Miras solo el blanco:** una arista con el blanco abajo pero junto al centro equivocado no está resuelta. Mira también su otro color.',
          '- **Paras a mitad de la cruz:** esa pausa es lo que más tiempo cuesta. Planea todos los giros antes de empezar.',
          '- **Rompes lo ya puesto:** al meter otra arista sacas una ya puesta y lo notas al final. Antes de cada giro, mira qué arista saca.',
          '- **Empiezas siempre por la blanco-verde:** empieza por la que necesita menos giros.',
          '- **Admiras la cruz terminada:** busca ya el primer par del F2L.',
        ].join('\n'),
        [
          '- **You build the daisy or the cross on top:** the daisy is made up of the 4 white edges around the yellow center. Then you have to bring them down, and that takes twice as many moves. Build the cross directly on the bottom.',
          "- **You look only at the white:** an edge with the white facing down but next to the wrong center isn't solved. Check its other color too.",
          '- **You stop in the middle of the cross:** that pause is what costs the most time. Plan every move before you start.',
          "- **You break what's already solved:** when inserting another edge, you pull out one that was already in place and only notice at the end. Before each turn, check which edge it pulls out.",
          '- **You always start with the white-green:** start with the one that needs the fewest moves.',
          '- **You admire the finished cross:** look for the first F2L pair right away.',
        ].join('\n'),
        [
          '- **Você monta a margarida ou a cruz em cima:** a margarida são as 4 arestas brancas ao redor do centro amarelo. Depois é preciso levá-las para baixo, e isso custa o dobro de movimentos. Monte a cruz direto embaixo.',
          '- **Você olha só o branco:** uma aresta com o branco para baixo, mas junto ao centro errado, não está resolvida. Confira também a outra cor.',
          '- **Você para no meio da cruz:** essa pausa é o que mais custa tempo. Planeje todos os movimentos antes de começar.',
          '- **Você quebra o que já está colocado:** ao inserir outra aresta, você tira uma já colocada e só percebe no final. Antes de cada movimento, veja qual aresta ele tira.',
          '- **Você começa sempre pela branco-verde:** comece pela que precisa de menos movimentos.',
          '- **Você admira a cruz terminada:** procure logo o primeiro par do F2L.',
        ].join('\n'),
      ),
    },
  ],
  levels: [
    {
      id: 'n1',
      name: tr('Nivel 1 — Encuentra el giro', 'Level 1 — Find the move', 'Nível 1 — Encontre o movimento'),
      description: tr('Cruces que se resuelven en 1 o 2 giros. Encuentra los giros exactos sin probar.', 'Crosses solved in 1 or 2 moves. Find the exact moves without trial and error.', 'Cruzes que se resolvem em 1 ou 2 movimentos. Encontre os movimentos exatos sem tentativa e erro.'),
      moves: { min: 1, max: 2 },
      goal: { overOptimal: 0, seconds: 2 },
    },
    {
      id: 'n2',
      name: tr('Nivel 2 — Dos aristas', 'Level 2 — Two edges', 'Nível 2 — Duas arestas'),
      description: tr('Cruces que se resuelven en 3 o 4 giros: 1 arista volteada o 2 por colocar. Planea todo antes de girar.', 'Crosses solved in 3 or 4 moves: 1 flipped edge or 2 to place. Plan everything before turning.', 'Cruzes que se resolvem em 3 ou 4 movimentos: 1 aresta invertida ou 2 para colocar. Planeje tudo antes de girar.'),
      moves: { min: 3, max: 4 },
      goal: { overOptimal: 1, seconds: 3 },
    },
    {
      id: 'n3',
      name: tr('Nivel 3 — Planea la cruz entera', 'Level 3 — Plan the whole cross', 'Nível 3 — Planeje a cruz inteira'),
      description: tr('Cruces que se resuelven en 5 o 6 giros, lo normal en una mezcla real. Planea las 4 aristas y resuélvelas sin pausas.', 'Crosses solved in 5 or 6 moves, typical for a real scramble. Plan all 4 edges and solve them without pauses.', 'Cruzes que se resolvem em 5 ou 6 movimentos, o normal num embaralhamento real. Planeje as 4 arestas e resolva-as sem pausas.'),
      moves: { min: 5, max: 6 },
      goal: { overOptimal: 2, seconds: 4 },
    },
    {
      id: 'n4',
      name: tr('Nivel 4 — Como en competición', 'Level 4 — Competition style', 'Nível 4 — Como em competição'),
      description: tr('Cruces que se resuelven en 7 u 8 giros, las más difíciles de una mezcla real. Usa toda la inspección.', 'Crosses solved in 7 or 8 moves, the hardest in a real scramble. Use your full inspection time.', 'Cruzes que se resolvem em 7 ou 8 movimentos, as mais difíceis de um embaralhamento real. Use todo o tempo de inspeção.'),
      moves: { min: 7, max: 8 },
      goal: { overOptimal: 2, seconds: 5 },
    },
  ],
};

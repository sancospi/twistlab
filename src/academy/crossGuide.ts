// "La cruz blanca": the first step of CFOP (and of most methods), as a standalone guide with a trainer.
// Same frame as the rest of the Academia: yellow up, green front, so the white cross is on the bottom (face D).
// Examples are in that frame, with ASCII primes; crossGuide.test.ts plays each one and checks it is optimal.
import type { Localized } from '../i18n.ts';

const l = (es: string, en: string): Localized => ({ es, en });

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
}

export type CrossLevelId = 'n1' | 'n2' | 'n3' | 'n4';

export interface CrossLevel {
  id: CrossLevelId;
  name: Localized;
  description: Localized;
  moves: { min: number; max: number }; // optimal cross length of the cases it plays
  goal: { overOptimal: number; seconds: number }; // to pass, on average: at most this many extra turns, executed within this time (planning: within inspection)
}

export interface CrossGuide {
  id: 'cruz';
  name: Localized;
  summary: Localized;
  intro: Localized;
  lessons: CrossLesson[];
  levels: CrossLevel[];
}

const ex = (setup: string, solution: string, es: string, en: string): CrossExample => ({ setup, solution, caption: l(es, en) });

export const crossGuide: CrossGuide = {
  id: 'cruz',
  name: l('La cruz blanca', 'The white cross'),
  summary: l('El primer paso del CFOP y de casi todos los métodos: la cruz blanca abajo, planeada en la inspección y en 8 giros o menos.', 'The first step of CFOP and of almost every method: the white cross on the bottom, planned during inspection and solved in 8 moves or fewer.'),
  intro: l(
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
  ),
  lessons: [
    {
      id: 'que-es',
      title: l('Qué es la cruz y por qué abajo', 'What the cross is and why on the bottom'),
      body: l(
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
          'Al principio cuesta porque no ves la cara blanca. Reconoce cada arista por su otro color.',
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
      "At first it's hard because you can't see the white face. Recognize each edge by its other color.",
    ].join('\n'),
  ),
    },
    {
      id: 'inspeccion',
      title: l('Planifica en la inspección', 'Plan during inspection'),
      body: l(
    [
          'En competencia (WCA) tienes **15 s de inspección**: puedes girar el cubo entero, pero no mover caras. Planea la cruz completa.',
          '1. **Encuentra las 4 aristas blancas** entre las 12 aristas: arriba, en la capa del medio y abajo.',
          '2. **Elige el orden.** Empieza por la más corta o por 2 que ya estén juntas. Probar otro orden suele ahorrar giros.',
          '3. **Traza todos los giros** y repásalos una vez. Si pasan de 8, busca otro plan: toda cruz se resuelve en 8 o menos, y la más corta promedia unos 6.',
          '4. **Ejecuta con los ojos adelante:** busca ya el primer par del F2L.',
          '¿Aún no planeas las 4? Planea 2 y resuelve el resto mirando. Suma una más cada semana.',
        ].join('\n'),
    [
      'In competition (WCA) you get **15 s of inspection**: you can turn the whole cube, but not move faces. Plan the full cross.',
      '1. **Find the 4 white edges** among the 12 edges: on top, in the middle layer and on the bottom.',
      '2. **Pick the order.** Start with the shortest one or with 2 that are already together. Trying another order often saves moves.',
      '3. **Trace all the moves** and review them once. If they go over 8, look for another plan: every cross can be solved in 8 or fewer, and the shortest averages about 6.',
      '4. **Execute with your eyes ahead:** start looking for the first F2L pair.',
      "Can't plan all 4 yet? Plan 2 and solve the rest by looking. Add one more each week.",
    ].join('\n'),
  ),
    },
    {
      id: 'una-arista',
      title: l('Casos de una arista', 'One-edge cases'),
      body: l(
    [
          'Cada arista blanca está en uno de 4 lugares:',
          '- **Arriba, blanco arriba** (1 o 2 giros): gira `U` hasta dejarla sobre su centro y bájala con media vuelta: `F2`, `R2`, `B2` o `L2`.',
          '- **Arriba, blanco al costado** (3 o 4 giros): está volteada. Bájala a la capa del medio con un cuarto de vuelta y métela con un cuarto de vuelta de la cara de al lado. Si el primer giro sacó una arista resuelta, devuélvela.',
          '- **En la capa del medio:** un cuarto de vuelta la baja. Si queda en el sitio de otra arista, gira antes `D` para traer su hueco, insértala y deshaz ese `D`.',
          '- **Abajo, mal puesta o volteada:** sácala (a la capa del medio o arriba) y resuélvela como los casos anteriores.',
          '**Regla de oro:** `U` nunca toca la cruz. Es el giro gratis para colocar una arista antes de bajarla.',
        ].join('\n'),
    [
      'Each white edge is in one of 4 places:',
      '- **Top, white facing up** (1 or 2 moves): turn `U` until it is above its center and bring it down with a half turn: `F2`, `R2`, `B2` or `L2`.',
      '- **Top, white on the side** (3 or 4 moves): it is flipped. Take it to the middle layer with a quarter turn and insert it with a quarter turn of the adjacent face. If the first turn pulled out a solved edge, put it back.',
      "- **In the middle layer:** one quarter turn brings it down. If it lands in another edge's spot, first turn `D` to bring its slot over, insert it and undo that `D`.",
      '- **On the bottom, misplaced or flipped:** take it out (to the middle layer or the top) and solve it like the cases above.',
      '**Golden rule:** `U` never touches the cross. It is the free turn to position an edge before bringing it down.',
    ].join('\n'),
  ),
      examples: [
        ex('F2', 'F2', 'Blanco-verde arriba, sobre su centro, blanco arriba: `F2` la baja directo.', 'White-green on top, above its center, white facing up: `F2` brings it straight down.'),
        ex("R2 U'", 'U R2', 'Blanco-naranja arriba atrás, blanco arriba: `U` la pone sobre su centro y `R2` la baja.', 'White-orange on top at the back, white facing up: `U` puts it above its center and `R2` brings it down.'),
        ex('B2 U2', 'U2 B2', 'Blanco-azul arriba al frente, blanco arriba: `U2` la lleva atrás y `B2` la baja.', 'White-blue on top at the front, white facing up: `U2` takes it to the back and `B2` brings it down.'),
        ex("R' F' R", "R' F R", "Blanco-verde arriba a la derecha, blanco a la derecha: `R'` la baja a la capa del medio (y aparta la blanco-naranja), `F` la mete orientada y `R` devuelve la blanco-naranja.", "White-green on top at the right, white facing right: `R'` brings it to the middle layer (and moves the white-orange aside), `F` inserts it oriented and `R` puts the white-orange back."),
        ex("F R F'", "F R' F'", "Blanco-naranja arriba al frente, blanco al frente: `F` la pasa a la capa del medio, `R'` la mete abajo y `F'` devuelve la blanco-verde que `F` sacó.", "White-orange on top at the front, white facing front: `F` moves it to the middle layer, `R'` inserts it on the bottom and `F'` puts back the white-green that `F` pulled out."),
        ex("R' F' R U", "U' R' F R", "Blanco-verde arriba al frente, sobre su centro, blanco al frente: `U'` la pasa a la derecha y queda el caso de `R' F R`.", "White-green on top at the front, above its center, white facing front: `U'` moves it to the right and it becomes the `R' F R` case."),
        ex('R', "R'", "Blanco-naranja en la capa del medio, adelante a la derecha, blanco al frente: `R'` la baja a su sitio.", "White-orange in the middle layer, front right, white facing front: `R'` brings it down to its spot."),
        ex("F'", 'F', 'Blanco-verde en la capa del medio, adelante a la derecha, blanco a la derecha: `F` la baja a su sitio.', 'White-green in the middle layer, front right, white facing right: `F` brings it down to its spot.'),
        ex("D' F' D", "D' F D", "Blanco-naranja en la capa del medio, adelante a la derecha, blanco a la derecha: solo con `F` quedaría en el sitio de la blanco-verde. `D'` trae su hueco al frente, `F` la mete y `D` regresa la cruz.", "White-orange in the middle layer, front right, white facing right: with just `F` it would land in the white-green's spot. `D'` brings its slot to the front, `F` inserts it and `D` restores the cross."),
        ex("F2 U' R' F R", "F' D R' D'", "Blanco-verde en su sitio pero volteada, blanco al frente: `F'` la saca a la capa del medio, `D` pone su hueco a la derecha, `R'` la mete orientada y `D'` regresa la cruz.", "White-green in its spot but flipped, white facing front: `F'` takes it out to the middle layer, `D` puts its slot on the right, `R'` inserts it oriented and `D'` restores the cross."),
        ex("F2 U' R2", 'R2 U F2', 'Blanco-verde abajo en el sitio de la blanco-naranja, y la blanco-naranja arriba a la derecha: `R2` las cambia, `U` lleva la verde sobre su centro y `F2` la baja.', "White-green on the bottom in the white-orange's spot, and the white-orange on top at the right: `R2` swaps them, `U` brings the green above its center and `F2` brings it down."),
      ],
    },
    {
      id: 'relativas',
      title: l('Aristas relativas entre sí', 'Edges relative to each other'),
      body: l(
    [
          'Mientras armas la cruz, las aristas no tienen que estar bajo sus centros: **basta con que estén bien entre sí**.',
          'Mirando la cara blanca, el orden es verde al frente, naranja a la derecha, azul atrás y rojo a la izquierda.',
          '1. Busca 2 aristas abajo, una junto a la otra en ese orden: ya cuentan como resueltas.',
          '2. Mete las demás en el hueco que les toca junto a ellas.',
          '3. Alinea todo con un solo giro de `D` al final.',
          'No alinees con `D` al principio: casi siempre sale más corto dejarlo para el final.',
        ].join('\n'),
    [
      "While you build the cross, the edges don't have to be under their centers: **it's enough that they are right relative to each other**.",
      'Looking at the white face, the order is green in front, orange on the right, blue at the back and red on the left.',
      '1. Find 2 edges on the bottom, next to each other in that order: they already count as solved.',
      '2. Insert the others into the slot they belong in next to them.',
      '3. Align everything with a single `D` turn at the end.',
      "Don't align with `D` at the start: it's almost always shorter to leave it for the end.",
    ].join('\n'),
  ),
      examples: [
        ex('D', "D'", "Las 4 aristas bien entre sí, solo giradas respecto a los centros: `D'` y listo.", "All 4 edges right relative to each other, just turned relative to the centers: `D'` and done."),
        ex('D R2', "R2 D'", "3 aristas abajo bien entre sí y la blanco-verde arriba a la derecha: `R2` la baja junto a ellas y `D'` alinea todo. Alinear primero costaría 1 giro más.", "3 edges on the bottom right relative to each other and the white-green on top at the right: `R2` brings it down next to them and `D'` aligns everything. Aligning first would cost 1 more move."),
        ex('D R2 F2', "F2 R2 D'", "Blanco-naranja y blanco-azul abajo bien entre sí, las otras 2 arriba: `F2` baja la blanco-roja y `R2` la blanco-verde, cada una en su hueco, y `D'` alinea las 4.", "White-orange and white-blue on the bottom right relative to each other, the other 2 on top: `F2` brings down the white-red and `R2` the white-green, each into its slot, and `D'` aligns all 4."),
      ],
    },
    {
      id: 'eficiencia',
      title: l('Eficiencia y tiempo', 'Efficiency and time'),
      body: l(
    [
          '- **No rotes el cubo** (`x`, `y`, `z`): cada rotación cuesta tiempo y pierdes de vista las piezas.',
          "- **Cuida lo resuelto.** Antes de `R`, `L`, `F` o `B`, mira si saca una arista ya puesta. Si la saca, elige otro giro, apártala antes con `D` o devuélvela después (como en `R' F R`).",
          '- **Arriba coloca, abajo alinea.** `U` lleva una arista sobre su centro o su hueco; `D` alinea la cruz al final.',
          '- **Media vuelta o cuarto de vuelta.** Media vuelta (`R2`, `F2`…) baja de arriba a abajo sin voltear la arista. Un cuarto de vuelta la mueve entre la capa del medio y arriba o abajo.',
          '- **Prefiere giros cómodos.** `R`, `U`, `F` y `D` se hacen sin cambiar el agarre; `B` y `L` son más lentos. A igual número de giros, elige el más cómodo.',
          '- **Fluidez antes que velocidad.** Una cruz continua gana a una veloz con frenadas. Practica lento y sin parar.',
        ].join('\n'),
    [
      "- **Don't rotate the cube** (`x`, `y`, `z`): each rotation costs time and you lose sight of the pieces.",
      "- **Protect what's solved.** Before `R`, `L`, `F` or `B`, check whether it pulls out an edge that is already in place. If it does, pick another turn, move it aside first with `D` or put it back afterwards (as in `R' F R`).",
      '- **Position on top, align on the bottom.** `U` brings an edge above its center or its slot; `D` aligns the cross at the end.',
      '- **Half turn or quarter turn.** A half turn (`R2`, `F2`…) takes an edge from top to bottom without flipping it. A quarter turn moves it between the middle layer and the top or bottom.',
      '- **Prefer comfortable turns.** `R`, `U`, `F` and `D` are done without changing grip; `B` and `L` are slower. With the same number of moves, choose the most comfortable one.',
      '- **Flow before speed.** A continuous cross beats a fast one with stops. Practice slowly and without stopping.',
    ].join('\n'),
  ),
    },
    {
      id: 'errores',
      title: l('Errores comunes', 'Common mistakes'),
      body: l(
    [
          '- **Armar la margarita o la cruz arriba** y luego voltearla: cuesta el doble de giros.',
          '- **Mirar solo el blanco.** Con el blanco abajo pero bajo el centro equivocado, no está resuelta.',
          '- **Girar sin el plan completo.** La pausa a mitad de la cruz es lo que más tiempo cuesta.',
          '- **Romper lo ya puesto** al insertar otra arista, sin notarlo hasta el final.',
          '- **Empezar siempre por la blanco-verde.** Empieza por la más fácil.',
          '- **Admirar la cruz terminada.** Busca ya el primer par del F2L.',
        ].join('\n'),
    [
      '- **Building the daisy or the cross on top** and then flipping it: it costs twice the moves.',
      "- **Looking only at the white.** With white on the bottom but under the wrong center, it isn't solved.",
      '- **Turning without the full plan.** The pause in the middle of the cross is what costs the most time.',
      "- **Breaking what's already in place** when inserting another edge, and not noticing until the end.",
      '- **Always starting with the white-green.** Start with the easiest one.',
      '- **Admiring the finished cross.** Look for the first F2L pair right away.',
    ].join('\n'),
  ),
    },
  ],
  levels: [
    {
      id: 'n1',
      name: l('Nivel 1 — Encuentra el giro', 'Level 1 — Find the turn'),
      description: l('Cruces a 1 o 2 giros de resolverse. Encuentra los giros exactos sin probar.', 'Crosses 1 or 2 moves from solved. Find the exact moves without trial and error.'),
      moves: { min: 1, max: 2 },
      goal: { overOptimal: 0, seconds: 2 },
    },
    {
      id: 'n2',
      name: l('Nivel 2 — Dos aristas', 'Level 2 — Two edges'),
      description: l('Cruces de 3 o 4 giros: 1 arista volteada o 2 por resolver. Planea todo antes de girar.', 'Crosses of 3 or 4 moves: 1 flipped edge or 2 to solve. Plan everything before turning.'),
      moves: { min: 3, max: 4 },
      goal: { overOptimal: 1, seconds: 3 },
    },
    {
      id: 'n3',
      name: l('Nivel 3 — Planea la cruz entera', 'Level 3 — Plan the whole cross'),
      description: l('Cruces de 5 o 6 giros, el promedio de una mezcla real. Planea las 4 aristas y ejecuta sin pausas.', 'Crosses of 5 or 6 moves, the average of a real scramble. Plan all 4 edges and execute without pauses.'),
      moves: { min: 5, max: 6 },
      goal: { overOptimal: 2, seconds: 4 },
    },
    {
      id: 'n4',
      name: l('Nivel 4 — Como en competencia', 'Level 4 — Competition style'),
      description: l('Cruces de 7 u 8 giros, las más difíciles de una mezcla real. Usa toda la inspección.', 'Crosses of 7 or 8 moves, the hardest of a real scramble. Use the whole inspection.'),
      moves: { min: 7, max: 8 },
      goal: { overOptimal: 2, seconds: 5 },
    },
  ],
};

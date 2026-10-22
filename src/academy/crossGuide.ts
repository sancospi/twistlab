// "La cruz blanca": the first step of CFOP (and of most methods), as a standalone guide with a trainer.
// Same frame as the rest of the Academia: yellow up, green front, so the white cross is on the bottom (face D).
// Examples are in that frame, with ASCII primes; crossGuide.test.ts plays each one and checks it is optimal.
import type { Localized } from '../i18n.ts';

const es = (text: string): Localized => ({ es: text });

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

const ex = (setup: string, solution: string, caption: string): CrossExample => ({ setup, solution, caption: es(caption) });

export const crossGuide: CrossGuide = {
  id: 'cruz',
  name: es('La cruz blanca'),
  summary: es('El primer paso del CFOP y de casi todos los métodos: la cruz blanca abajo, planeada en la inspección y en 8 giros o menos.'),
  intro: es(
    [
      'La cruz es lo primero de cada resolución y la única parte que puedes planear entera antes de empezar.',
      'Una buena cruz es:',
      '- **Corta:** 8 giros o menos.',
      '- **De memoria:** sale sin pausas.',
      '- **Con la vista adelante:** te deja mirando el primer par del F2L.',
      'Aquí aprendes los casos de cada arista, cómo combinarlas y cómo ahorrar giros. Luego el entrenador compara tu solución con la más corta.',
    ].join('\n'),
  ),
  lessons: [
    {
      id: 'que-es',
      title: es('Qué es la cruz y por qué abajo'),
      body: es(
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
      ),
    },
    {
      id: 'inspeccion',
      title: es('Planifica en la inspección'),
      body: es(
        [
          'En competencia (WCA) tienes **15 s de inspección**: puedes girar el cubo entero, pero no mover caras. Planea la cruz completa.',
          '1. **Encuentra las 4 aristas blancas** entre las 12 aristas: arriba, en la capa del medio y abajo.',
          '2. **Elige el orden.** Empieza por la más corta o por 2 que ya estén juntas. Probar otro orden suele ahorrar giros.',
          '3. **Traza todos los giros** y repásalos una vez. Si pasan de 8, busca otro plan: toda cruz se resuelve en 8 o menos, y la más corta promedia unos 6.',
          '4. **Ejecuta con los ojos adelante:** busca ya el primer par del F2L.',
          '¿Aún no planeas las 4? Planea 2 y resuelve el resto mirando. Suma una más cada semana.',
        ].join('\n'),
      ),
    },
    {
      id: 'una-arista',
      title: es('Casos de una arista'),
      body: es(
        [
          'Cada arista blanca está en uno de 4 lugares:',
          '- **Arriba, blanco arriba** (1 o 2 giros): gira `U` hasta dejarla sobre su centro y bájala con media vuelta: `F2`, `R2`, `B2` o `L2`.',
          '- **Arriba, blanco al costado** (3 o 4 giros): está volteada. Bájala a la capa del medio con un cuarto de vuelta y métela con un cuarto de vuelta de la cara de al lado. Si el primer giro sacó una arista resuelta, devuélvela.',
          '- **En la capa del medio:** un cuarto de vuelta la baja. Si queda en el sitio de otra arista, gira antes `D` para traer su hueco, insértala y deshaz ese `D`.',
          '- **Abajo, mal puesta o volteada:** sácala (a la capa del medio o arriba) y resuélvela como los casos anteriores.',
          '**Regla de oro:** `U` nunca toca la cruz. Es el giro gratis para colocar una arista antes de bajarla.',
        ].join('\n'),
      ),
      examples: [
        ex('F2', 'F2', 'Blanco-verde arriba, sobre su centro, blanco arriba: `F2` la baja directo.'),
        ex("R2 U'", 'U R2', 'Blanco-naranja arriba atrás, blanco arriba: `U` la pone sobre su centro y `R2` la baja.'),
        ex('B2 U2', 'U2 B2', 'Blanco-azul arriba al frente, blanco arriba: `U2` la lleva atrás y `B2` la baja.'),
        ex("R' F' R", "R' F R", "Blanco-verde arriba a la derecha, blanco a la derecha: `R'` la baja a la capa del medio (y aparta la blanco-naranja), `F` la mete orientada y `R` devuelve la blanco-naranja."),
        ex("F R F'", "F R' F'", "Blanco-naranja arriba al frente, blanco al frente: `F` la pasa a la capa del medio, `R'` la mete abajo y `F'` devuelve la blanco-verde que `F` sacó."),
        ex("R' F' R U", "U' R' F R", "Blanco-verde arriba al frente, sobre su centro, blanco al frente: `U'` la pasa a la derecha y queda el caso de `R' F R`."),
        ex('R', "R'", "Blanco-naranja en la capa del medio, adelante a la derecha, blanco al frente: `R'` la baja a su sitio."),
        ex("F'", 'F', 'Blanco-verde en la capa del medio, adelante a la derecha, blanco a la derecha: `F` la baja a su sitio.'),
        ex("D' F' D", "D' F D", "Blanco-naranja en la capa del medio, adelante a la derecha, blanco a la derecha: solo con `F` quedaría en el sitio de la blanco-verde. `D'` trae su hueco al frente, `F` la mete y `D` regresa la cruz."),
        ex("F2 U' R' F R", "F' D R' D'", "Blanco-verde en su sitio pero volteada, blanco al frente: `F'` la saca a la capa del medio, `D` pone su hueco a la derecha, `R'` la mete orientada y `D'` regresa la cruz."),
        ex("F2 U' R2", 'R2 U F2', 'Blanco-verde abajo en el sitio de la blanco-naranja, y la blanco-naranja arriba a la derecha: `R2` las cambia, `U` lleva la verde sobre su centro y `F2` la baja.'),
      ],
    },
    {
      id: 'relativas',
      title: es('Aristas relativas entre sí'),
      body: es(
        [
          'Mientras armas la cruz, las aristas no tienen que estar bajo sus centros: **basta con que estén bien entre sí**.',
          'Mirando la cara blanca, el orden es verde al frente, naranja a la derecha, azul atrás y rojo a la izquierda.',
          '1. Busca 2 aristas abajo, una junto a la otra en ese orden: ya cuentan como resueltas.',
          '2. Mete las demás en el hueco que les toca junto a ellas.',
          '3. Alinea todo con un solo giro de `D` al final.',
          'No alinees con `D` al principio: casi siempre sale más corto dejarlo para el final.',
        ].join('\n'),
      ),
      examples: [
        ex('D', "D'", "Las 4 aristas bien entre sí, solo giradas respecto a los centros: `D'` y listo."),
        ex('D R2', "R2 D'", "3 aristas abajo bien entre sí y la blanco-verde arriba a la derecha: `R2` la baja junto a ellas y `D'` alinea todo. Alinear primero costaría 1 giro más."),
        ex('D R2 F2', "F2 R2 D'", "Blanco-naranja y blanco-azul abajo bien entre sí, las otras 2 arriba: `F2` baja la blanco-roja y `R2` la blanco-verde, cada una en su hueco, y `D'` alinea las 4."),
      ],
    },
    {
      id: 'eficiencia',
      title: es('Eficiencia y tiempo'),
      body: es(
        [
          '- **No rotes el cubo** (`x`, `y`, `z`): cada rotación cuesta tiempo y pierdes de vista las piezas.',
          "- **Cuida lo resuelto.** Antes de `R`, `L`, `F` o `B`, mira si saca una arista ya puesta. Si la saca, elige otro giro, apártala antes con `D` o devuélvela después (como en `R' F R`).",
          '- **Arriba coloca, abajo alinea.** `U` lleva una arista sobre su centro o su hueco; `D` alinea la cruz al final.',
          '- **Media vuelta o cuarto de vuelta.** Media vuelta (`R2`, `F2`…) baja de arriba a abajo sin voltear la arista. Un cuarto de vuelta la mueve entre la capa del medio y arriba o abajo.',
          '- **Prefiere giros cómodos.** `R`, `U`, `F` y `D` se hacen sin cambiar el agarre; `B` y `L` son más lentos. A igual número de giros, elige el más cómodo.',
          '- **Fluidez antes que velocidad.** Una cruz continua gana a una veloz con frenadas. Practica lento y sin parar.',
        ].join('\n'),
      ),
    },
    {
      id: 'errores',
      title: es('Errores comunes'),
      body: es(
        [
          '- **Armar la margarita o la cruz arriba** y luego voltearla: cuesta el doble de giros.',
          '- **Mirar solo el blanco.** Con el blanco abajo pero bajo el centro equivocado, no está resuelta.',
          '- **Girar sin el plan completo.** La pausa a mitad de la cruz es lo que más tiempo cuesta.',
          '- **Romper lo ya puesto** al insertar otra arista, sin notarlo hasta el final.',
          '- **Empezar siempre por la blanco-verde.** Empieza por la más fácil.',
          '- **Admirar la cruz terminada.** Busca ya el primer par del F2L.',
        ].join('\n'),
      ),
    },
  ],
  levels: [
    {
      id: 'n1',
      name: es('Nivel 1 — Encuentra el giro'),
      description: es('Cruces a 1 o 2 giros de resolverse. Encuentra los giros exactos sin probar.'),
      moves: { min: 1, max: 2 },
      goal: { overOptimal: 0, seconds: 2 },
    },
    {
      id: 'n2',
      name: es('Nivel 2 — Dos aristas'),
      description: es('Cruces de 3 o 4 giros: 1 arista volteada o 2 por resolver. Planea todo antes de girar.'),
      moves: { min: 3, max: 4 },
      goal: { overOptimal: 1, seconds: 3 },
    },
    {
      id: 'n3',
      name: es('Nivel 3 — Planea la cruz entera'),
      description: es('Cruces de 5 o 6 giros, el promedio de una mezcla real. Planea las 4 aristas y ejecuta sin pausas.'),
      moves: { min: 5, max: 6 },
      goal: { overOptimal: 2, seconds: 4 },
    },
    {
      id: 'n4',
      name: es('Nivel 4 — Como en competencia'),
      description: es('Cruces de 7 u 8 giros, las más difíciles de una mezcla real. Usa toda la inspección.'),
      moves: { min: 7, max: 8 },
      goal: { overOptimal: 2, seconds: 5 },
    },
  ],
};

// "Cómo resolver el cubo de Rubik paso a paso" (/como-resolver-el-cubo-de-rubik): the beginner method (beginner.ts) as
// one article for people who search for exactly that. Each step has a case's diagram and a link to where the Academia
// teaches it in full. Pure: seo.ts prerenders it, howToView.ts draws it in the app. Bodies are rich text (rich-text.ts).
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY } from '../notation.ts';
import { loc, type Localized } from '../i18n.ts';
import { routePath, type AcademyPage } from '../router.ts';
import { beginner } from './beginner.ts';
import { caseState } from './cube.ts';
import { caseDiagram } from './diagram.ts';

const tr = (es: string, en: string): Localized => ({ es, en });
const doc = (es: string[], en: string[]): Localized => tr(es.join('\n'), en.join('\n'));
const academy = (page: AcademyPage, hash = '') => routePath({ mod: 'academy', page }) + hash;
const step = (phase: string) => academy({ kind: 'method', id: beginner.id }, `#academy-${phase}`); // view.ts's phase anchors
const inMethod = (phase: string) => ({ href: step(phase), label: tr('Este paso en el método principiante', 'This step in the beginner method') });

export interface HowToSection {
  id: string;
  title: Localized;
  body: Localized;
  figure?: string; // a beginner case's id: its diagram, as on its card
  more?: { href: string; label: Localized };
}

export const howToSolve = {
  name: tr('Cómo resolver el cubo de Rubik paso a paso', "How to solve a Rubik's cube step by step"),
  summary: tr(
    'Guía para principiantes: resuelve el cubo de Rubik capa por capa en 7 pasos, con 7 secuencias cortas y un diagrama de cada caso.',
    "A beginner's guide: solve the Rubik's cube layer by layer in 7 steps, with 7 short sequences and a diagram of each case.",
  ),
  nav: tr('Pasos de la guía', 'Guide steps'), // the side navigation's name
  sections: [
    {
      id: 'intro',
      title: tr('Cómo resolver el cubo de Rubik paso a paso', "How to solve a Rubik's cube step by step"),
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
      ),
    },
    {
      id: 'antes',
      title: tr('Antes de empezar: piezas y notación', 'Before you start: pieces and notation'),
      body: doc(
        [
          'El cubo tiene tres tipos de piezas:',
          '- **Centros:** uno por cara, con un solo color. No se mueven entre sí: el centro dice de qué color es su cara. Con blanco abajo, amarillo queda arriba.',
          '- **Aristas:** 12 piezas de dos colores, entre dos centros.',
          '- **Esquinas:** 8 piezas de tres colores.',
          'Por eso no se resuelve «una cara», sino **pieza por pieza**: cada una va entre los centros de sus colores.',
          '## Cómo se leen los giros',
          '- Cada letra es una cara: `R` derecha, `L` izquierda, `U` arriba, `D` abajo, `F` frente y `B` atrás.',
          "- La letra sola es un cuarto de vuelta en sentido horario, mirando esa cara de frente. Con apóstrofo, antihorario (`R'`). Con un 2, media vuelta (`U2`).",
          "- Así, `R U R' U'` es: derecha hacia arriba, arriba hacia la izquierda, derecha hacia abajo, arriba hacia la derecha.",
          '**Cómo sostener el cubo:** en toda la guía, cruz blanca abajo, amarillo arriba y verde al frente.',
        ],
        [
          'The cube has three kinds of pieces:',
          "- **Centers:** one per face, with a single color. They don't move relative to each other: the center tells you the color of its face. With white on the bottom, yellow is on top.",
          '- **Edges:** 12 two-colored pieces, between two centers.',
          '- **Corners:** 8 three-colored pieces.',
          "That's why you don't solve \"one face\" but **piece by piece**: each one goes between the centers of its colors.",
          '## How to read the turns',
          '- Each letter is a face: `R` right, `L` left, `U` up, `D` down, `F` front and `B` back.',
          "- The letter alone is a quarter turn clockwise, looking at that face head-on. With an apostrophe, counterclockwise (`R'`). With a 2, a half turn (`U2`).",
          "- So `R U R' U'` is: right side up, top to the left, right side down, top to the right.",
          '**How to hold the cube:** throughout this guide, white cross on the bottom, yellow on top and green in front.',
        ],
      ),
      more: { href: academy({ kind: 'notation' }), label: tr('Toda la notación, con cada giro animado', 'All the notation, with every turn animated') },
    },
    {
      id: 'cruz',
      title: tr('Paso 1: la cruz blanca', 'Step 1: the white cross'),
      body: doc(
        [
          'Las 4 aristas blancas alrededor del centro blanco, **cada una junto al centro de su otro color**: la blanco-verde bajo el verde, la blanco-roja bajo el rojo…',
          'Es el único paso sin algoritmos: se resuelve pensando, de una arista a la vez. Si está arriba con el blanco hacia arriba, gira `U` hasta dejarla sobre su centro y bájala con media vuelta (`F2`, `R2`, `B2` o `L2`). `U` nunca toca la cruz: es el giro libre para colocarla.',
          'Si la cara blanca se ve completa pero los colores de los lados no coinciden con sus centros, la cruz está mal.',
        ],
        [
          'The 4 white edges around the white center, **each one next to the center of its other color**: white-green under green, white-red under red…',
          "It's the only step without algorithms: you solve it by thinking, one edge at a time. If it's on top with white facing up, turn `U` until it is above its center and bring it down with a half turn (`F2`, `R2`, `B2` or `L2`). `U` never touches the cross: it's the free turn to position it.",
          "If the white face looks complete but the side colors don't match their centers, the cross is wrong.",
        ],
      ),
      more: { href: academy({ kind: 'cross' }), label: tr('La guía de la cruz blanca, con entrenador', 'The white cross guide, with a trainer') },
    },
    {
      id: 'esquinas-blancas',
      title: tr('Paso 2: las esquinas blancas', 'Step 2: the white corners'),
      body: doc(
        [
          'Con las 4 esquinas blancas en su sitio, la primera capa queda completa.',
          "Busca arriba una esquina con blanco, gira `U` hasta dejarla encima de su sitio y gira el cubo para tenerla adelante a la derecha. Repite `R U R' U'` hasta que baje con el blanco abajo: **1** vez si el blanco mira a la derecha, **3** si mira arriba y **5** si mira al frente.",
        ],
        [
          'With the 4 white corners in place, the first layer is complete.',
          "Find a corner with white on top, turn `U` until it is above its spot and rotate the cube to have it at the front right. Repeat `R U R' U'` until it drops in with white on the bottom: **1** time if white faces right, **3** if it faces up and **5** if it faces front.",
        ],
      ),
      figure: 'prin-capa1-blanco-derecha',
      more: inMethod('prin-capa1'),
    },
    {
      id: 'segunda-capa',
      title: tr('Paso 3: la segunda capa', 'Step 3: the second layer'),
      body: doc(
        [
          'Las 4 aristas del medio, las que **no tienen amarillo**. Busca una arriba, gira `U` hasta que su color de lado coincida con su centro y mira su color de arriba: dice hacia qué lado va.',
          "- A la derecha: `U R U' R' U' F' U F`.",
          "- A la izquierda: `U' L' U L U F U' F'` (el espejo de la anterior).",
          'Si una está en el medio pero volteada, sácala con cualquiera de las dos y vuelve a insertarla.',
        ],
        [
          'The 4 middle edges, the ones **without yellow**. Find one on top, turn `U` until its side color matches its center and look at its top color: it tells you which side it goes to.',
          "- To the right: `U R U' R' U' F' U F`.",
          "- To the left: `U' L' U L U F U' F'` (the mirror of the first).",
          'If one is in the middle but flipped, take it out with either of the two and insert it again.',
        ],
      ),
      figure: 'prin-capa2-derecha',
      more: inMethod('prin-capa2'),
    },
    {
      id: 'cruz-amarilla',
      title: tr('Paso 4: la cruz amarilla', 'Step 4: the yellow cross'),
      body: doc(
        [
          "Ahora cuentan solo las aristas amarillas de arriba. Un algoritmo, `F R U R' U' F'`, según la forma que veas:",
          '- **Línea:** horizontal, 1 vez.',
          '- **L:** atrás y a la izquierda, 2 veces.',
          '- **Punto:** 1 vez, y sigues como con la L.',
        ],
        [
          "Now only the yellow edges on top count. One algorithm, `F R U R' U' F'`, depending on the shape you see:",
          '- **Line:** horizontal, 1 time.',
          '- **L:** at the back and on the left, 2 times.',
          '- **Dot:** 1 time, then continue as with the L.',
        ],
      ),
      figure: 'prin-cruz-l',
      more: inMethod('prin-cruz'),
    },
    {
      id: 'aristas-amarillas',
      title: tr('Paso 5: las aristas amarillas', 'Step 5: the yellow edges'),
      body: doc(
        [
          "Cada arista amarilla junto al centro de su color. Gira `U` hasta que coincidan al menos 2. Si son vecinas, déjalas atrás y a la derecha y haz `R U R' U R U2 R' U` una vez. Si son opuestas, hazlo una vez y quedarán vecinas.",
        ],
        [
          "Each yellow edge next to the center of its color. Turn `U` until at least 2 match. If they are adjacent, put them at the back and on the right and do `R U R' U R U2 R' U` once. If they are opposite, do it once and they become adjacent.",
        ],
      ),
      figure: 'prin-aristas-vecinas',
      more: inMethod('prin-aristas'),
    },
    {
      id: 'esquinas-amarillas',
      title: tr('Paso 6: las esquinas amarillas a su lugar', 'Step 6: the yellow corners into place'),
      body: doc(
        [
          "Cada esquina en su sitio, aunque esté girada: sus 3 colores son los de los 3 centros que la rodean. Pon una que ya esté bien adelante a la derecha y haz `U R U' L' U R' U' L` (1 o 2 veces): mueve las otras tres sin tocar las aristas.",
        ],
        [
          "Each corner in its spot, even if twisted: its 3 colors are those of the 3 centers around it. Put one that is already right at the front right and do `U R U' L' U R' U' L` (1 or 2 times): it moves the other three without touching the edges.",
        ],
      ),
      figure: 'prin-esquinas-antihorario',
      more: inMethod('prin-esquinas'),
    },
    {
      id: 'orientar',
      title: tr('Paso 7: orientar las esquinas', 'Step 7: orient the corners'),
      body: doc(
        [
          "Amarillo arriba en las 4 esquinas. Con una esquina girada adelante a la derecha, repite `R' D' R D` hasta que su amarillo quede arriba (2 o 4 veces). Luego gira solo `U` para traer la siguiente y repite.",
          '**No te asustes:** a mitad del paso las dos primeras capas se ven rotas. Se arreglan solas con la última esquina. Un último giro de `U` y el cubo está resuelto.',
        ],
        [
          "Yellow on top on all 4 corners. With a twisted corner at the front right, repeat `R' D' R D` until its yellow is on top (2 or 4 times). Then turn only `U` to bring the next one and repeat.",
          "**Don't panic:** halfway through, the first two layers look broken. They fix themselves with the last corner. One last `U` turn and the cube is solved.",
        ],
      ),
      figure: 'prin-orientar-sune',
      more: inMethod('prin-orientar'),
    },
    {
      id: 'despues',
      title: tr('Y después: más rápido', 'What next: faster'),
      body: doc(
        [
          'Cuando lo resuelvas sin mirar la guía, cronométrate con mezclas oficiales para ver cómo bajas. El siguiente método es el **CFOP reducido**: los mismos pasos, unidos en menos algoritmos, para bajar de 1 minuto.',
        ],
        [
          "Once you can solve it without looking at the guide, time yourself with official scrambles to see yourself improve. The next method is **reduced CFOP**: the same steps, merged into fewer algorithms, to get under 1 minute.",
        ],
      ),
      more: { href: academy({ kind: 'method', id: 'cfop-reducido' }), label: tr('El CFOP reducido', 'Reduced CFOP') },
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

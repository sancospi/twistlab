// "CFOP reducido" (Parte 1 of the training plan): 19 F2L + OLL in 2 steps + PLL in 2 steps, plus the
// plan's quizzes. Text is the plan's wording; algorithms and scrambles are the plan's, with ASCII primes.
import { fromSpanish, loc, type Localized } from '../i18n.ts';
import type { Case, Method, OfficialQuiz, QuizItem, SpeedCubeDbRef, Stage } from './types.ts';
import { scdbUrl } from './scdb.ts';
import { EN } from './cfop.en.ts';
import { PT } from './cfop.pt.ts';

// Spanish text -> Localized; English and Portuguese come from EN and PT line by line (see cfop.en.ts).
const es = (text: string): Localized => fromSpanish(text, { en: EN, pt: PT });

const PLAN_B_NOTE = es('Plan B: más fácil al principio; solo R, U y F o gatillos conocidos.');

// Extra SpeedCubeDB algorithms (fetched 2026-10-20), [rank, alg], at most 4 per case in the site's order.
// Each one is the site's text plus the U turn it needs here (a leading y dropped when that is all it took);
// cfop.validate.test.ts checks every one in the simulator. Left out: algs that don't solve the case, repeat an
// existing variant's face turns, have 0 votes, or are over twice the main alg's length (joke/rotation chains).
export const SCDB_ALTS: Record<string, [number, string][]> = {
  'cfop-f2l-a1': [[2, "R' F R F'"], [3, "y' r' U' R U M'"], [4, "y U F' L F L2 U L"], [5, "M' U R U' r'"]],
  'cfop-f2l-a2': [[5, "r U R' U' M"]],
  'cfop-f2l-b1': [[2, "F2 L' U' L U F2"], [3, "U' R U R' U' R U2 R'"], [4, "U' R U R' U R' F R F'"], [6, "R U2 R' U' R U2 R' U' R U R'"]],
  'cfop-f2l-b2': [[5, "y' U R' U' R U R' U2 R"], [6, "U F' U' F U' F R' F' R"]],
  'cfop-f2l-b3': [[2, "R U2 R' U2 R U R' U2 R U' R'"], [3, "U' R2 D R' U R D' R2"], [4, "U2 R2 U R' U R U2 R2"], [5, "R' D' R U' R' D R2 U R'"]],
  'cfop-f2l-b4': [[2, "M' U' R U R' U2 R U' r'"], [3, "R U' R' U R' F R F' R U' R'"], [5, "U R U' R' U R U' R' F R' F' R"]],
  'cfop-f2l-c1': [[2, "M' U' M U2 r U' r'"], [3, "U' R U2 R' U2 R U' R'"], [4, "U' R U2 R' U R' F R F'"], [5, "R U R' U R U' R' U R U' R'"]],
  'cfop-f2l-c2': [[2, "d R' U2 R U R' U2 R"], [5, "F' U' L' U2 L U' F"]],
  'cfop-f2l-d1': [[3, "R U R' U' R U2 R' U2 R U R'"]],
  'cfop-f2l-d2': [[4, "R' F R F' R U' R' U R U' R'"], [5, "R U2 R' y' R' U' R U2 R' U R"], [6, "R U R' U' R U R' U' F R' F' R"]],
  'cfop-f2l-d3': [[2, "U R U2 R2 F R F'"], [4, "R U' R' U R U' R' U R U R'"], [5, "R U' R U R' U R U2 R2"], [6, "U y' f R2 f' U2 f R2 f'"]],
  'cfop-f2l-d4': [[2, "U' R U' R2 F R F' R U' R'"], [5, "U' R U' R' F' U2 F R U R'"], [6, "R U R' U2 R U R' U2 y' R' U R"]],
  'cfop-f2l-e1': [[2, "F' U' F U2 R U' R'"], [4, "y' f R' f' r' U' R U M'"], [6, "R U' R2 F R F'"]],
  'cfop-f2l-e2': [[2, "R S' R' U R S R'"], [3, "U R U R' U' y L' U' L"], [5, "F' M' U' L' U l F"]],
  'cfop-f2l-e3': [[2, "R U R' U' R U R' U' R U R'"], [3, "R2 U R2 U R2 U2 R2"], [4, "U' F R' F' R U' R U R'"], [5, "y U2 F U' R U R' U F'"]],
  'cfop-f2l-e4': [[2, "R U R' U' R U2 R' U' R U R'"], [3, "R2 U2 R' U' R U' R' U2 R'"], [4, "R U' R' U' R U R' U' R U2 R'"], [5, "F' L' U2 L U' L' U2 L U' F"]],
  'cfop-f2l-e5': [[2, "R U2 R U R' U R U2 R2"], [3, "R U R' U2 R U' R' U R U R'"], [4, "R U2 R' U R U' R' U R U R'"], [5, "F' L' U2 L U L' U' L U2 F"]],
  'cfop-oll-linea': [[2, "y R' F' U' F U R"]],
  'cfop-oll-l': [[6, "y' F R U' R' U2 R U R' F'"]],
  'cfop-oll-sune': [[2, "y' R' U2 R U R' U R"], [5, "R U' L' U R' U' L"]],
  'cfop-oll-antisune': [[2, "U' R' U' R U' R' U2 R"], [3, "U L' U' L U' L' U2 L"], [4, "U L' U R U' L U R'"], [5, "U' R' U L U' R U L'"]],
  'cfop-oll-h': [[2, "y R U2 R' U' R U R' U' R U' R'"], [3, "y F R U R' U' R U R' U' R U R' U' F'"], [4, "R' U' R U' R' U R U' R' U2 R"], [5, "y F U R U' R' U R U' R' U R U' R' F'"]],
  'cfop-oll-pi': [[2, "R' U2 R2 U R2 U R2 U2 R'"], [3, "f R U R' U' S' R U R' U' F'"]],
  'cfop-oll-u': [[2, "y2 R2 D' R U2 R' D R U2 R"], [3, "R U R' U R U2 R2 U' R U' R' U2 R"], [4, "y R U R' U' R U' R' U2 R U' R' U2 R U R'"], [5, "y' R U2 R' U' R U' R' L' U2 L U L' U L"]],
  'cfop-oll-t': [[2, "y2 R' F' r U R U' r' F"], [3, "y R U R D R' U' R D' R2"], [4, "y' x' R U R' D R U' R' D' x"], [5, "y' R' U' R' D' R U R' D R2"]],
  'cfop-oll-l-esquinas': [[2, "y F' r U R' U' r' F R"], [3, "F R' F' r U R U' r'"], [6, "y2 R2 D' R U' R' D R U R"]],
  'cfop-pll-t': [[3, "R U R' U' R' F R2 U' R' U F' L' U L"], [4, "R2 u R2 u' R2 F2 u' F2 u F2"], [5, "R2 u' R2 u R2 y R2 u R2 u' R2"], [6, "R2 U R2 U' R2 U' D R2 U' R2 U R2 D'"]],
  'cfop-pll-y': [[2, "F R' F R2 U' R' U' R U R' F' R U R' U' F'"], [3, "R2 U' R2 U' R2 U F U F' R2 F U' F'"], [4, "F R' F' R U R U' R2 U' R U R f' U' f"], [5, "R2 U' R2 U' R2 U R2 D' R2 U R2 U' R2 D R2"]],
  'cfop-pll-ua': [[2, "U2 R U R' U R' U' R2 U' R' U R' U R"], [3, "U' R2 U' S' U2 S U' R2"], [5, "U2 M2 U M' U2 M U M2"]],
  'cfop-pll-ub': [[2, "U2 R' U R' U' R' U' R' U R U R2"], [5, "U' R2 U' S R2 S' R2 U R2"], [6, "U2 M2 U' M' U2 M U' M2"]],
  'cfop-pll-h': [[2, "M2 U' M2 U2 M2 U' M2"], [3, "R2 S2 R2 U' R2 S2 R2"], [4, "M2 U2 M2 U M2 U2 M2"], [5, "M2 U2 M2 U' M2 U2 M2"]],
  'cfop-pll-z': [[2, "U M2 U M2 U M' U2 M2 U2 M'"], [3, "M2 U' M2 U' M' U2 M2 U2 M'"], [4, "M' U M2 U M2 U M' U2 M2"], [5, "M2 U2 M U M2 U M2 U M"]],
};

interface Row {
  slug: string; // id suffix: 'cfop-<f2l|oll|pll>-<slug>'
  code: string;
  name?: string; // defaults to code
  recognition: string;
  stage: Stage;
  alg: string;
  planB?: string; // the cell's second line
  setup: string;
  scdb: [SpeedCubeDbRef['set'], string] | null;
  note?: string;
}

function kase(r: Row): Case {
  const algs: Case['algs'] = [{ id: 'main', alg: r.alg, source: 'speedcubedb', rank: 1 }];
  if (r.planB) algs.push({ id: 'plan-b', alg: r.planB, source: 'plan-b', note: PLAN_B_NOTE });
  const id = `cfop-${r.stage.split('-')[0]}-${r.slug}`;
  for (const [rank, alg] of SCDB_ALTS[id] ?? []) algs.push({ id: `scdb-${rank}`, alg, source: 'speedcubedb', rank });
  const name = { es: r.name ?? r.code, en: EN[r.name ?? r.code] ?? r.name ?? r.code, pt: PT[r.name ?? r.code] ?? r.name ?? r.code };
  return {
    id,
    code: r.name ? r.code : loc(name), // a code that is a word (Línea, Punto) in the visitor's language
    name,
    recognition: es(r.recognition),
    stage: r.stage,
    algs,
    setup: r.setup,
    scdb: r.scdb && { set: r.scdb[0], id: r.scdb[1], url: scdbUrl(r.scdb[0], r.scdb[1]) },
    ...(r.note ? { note: es(r.note) } : {}),
  };
}

/** Quiz items in the plan's order; answers are case slugs (prefix added here). */
function quiz(id: string, name: string, instructions: Localized, prefix: string, rows: [string, string][]): OfficialQuiz {
  const items: QuizItem[] = rows.map(([scramble, slug]) => ({ scramble, answer: `cfop-${prefix}-${slug}` }));
  return { id, name: es(name), instructions, items };
}

const Y_NOTE =
  'Empieza con y′: giras todo el cubo y el par entra con la mano derecha. El Plan B hace lo mismo sin rotar, con F.';
const R_NOTE = 'Usa r: 2 capas a la vez (la cara R y la capa del medio).';
const F2L = (slug: string, recognition: string, alg: string, setup: string, n: string, planB?: string, note?: string): Case =>
  kase({ slug, code: slug.toUpperCase(), recognition, stage: 'f2l', alg, planB, setup, scdb: ['F2L', n], note });

const f2lA = [
  F2L('a1', 'Esquina arriba adelante-der, blanco al frente; arista arriba-derecha, verde arriba', "U R U' R'", "R U R' U'", '1'),
  F2L('a2', 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-adelante, naranja arriba', "F R' F' R", "R' F R F'", '2', "U' F' U F"),
  F2L('a3', 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, verde arriba', "R U R'", "R U' R'", '4'),
  F2L('a4', 'Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, naranja arriba', "F' U' F", "F' U F", '3'),
];
const f2lB = [
  F2L('b1', 'Esquina arriba adelante-der, blanco al frente; arista arriba-atrás, verde arriba', "U' R U R' U2 R U' R'", "R U R' U2 R U' R' U", '5'),
  F2L('b2', 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-izquierda, naranja arriba', "U' r U' R' U R U r'", "r U' R' U' R U r' U", '6', "U F' U' F U2 F' U F", R_NOTE),
  F2L('b3', 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-derecha, verde arriba', "U' R U' R' U R U R'", "R U' R' U' R U R' U", '14'),
  F2L('b4', 'Esquina arriba adelante-der, blanco al frente; arista arriba-adelante, naranja arriba', "y' U R' U R U' R' U' R", "F' U F U F' U' F U'", '13', "U F' U F U' F' U' F", Y_NOTE),
];
const f2lC = [
  F2L('c1', 'Esquina arriba adelante-der, blanco al frente; arista arriba-izquierda, verde arriba', "U' R U2 R' U' R U2 R'", "R U2 R' U R U2 R' U", '7'),
  F2L('c2', 'Esquina arriba adelante-der, blanco a la derecha; arista arriba-atrás, naranja arriba', "r' U2 R2 U R2 U r", "r' U' R2 U' R2 U2 r", '8', "U F' U2 F U2 F' U F", R_NOTE),
];
const f2lD = [
  F2L('d1', 'Esquina arriba adelante-der, blanco arriba; arista arriba-derecha, verde arriba', "R U2 R' U' R U R'", "R U' R' U R U2 R'", '17'),
  F2L('d2', 'Esquina arriba adelante-der, blanco arriba; arista arriba-adelante, naranja arriba', "y' R' U2 R U R' U' R", "F' U F U' F' U2 F", '18', "F' U2 F U F' U' F", Y_NOTE),
  F2L('d3', 'Esquina arriba adelante-der, blanco arriba; arista arriba-atrás, verde arriba', "U R U2 R' U R U' R'", "R U R' U' R U2 R' U'", '19'),
  F2L('d4', 'Esquina arriba adelante-der, blanco arriba; arista arriba-izquierda, naranja arriba', "y' U' R' U2 R U' R' U R", "F' U' F U F' U2 F U", '20', "U' F' U2 F U' F' U F", Y_NOTE),
];
const f2lE = [
  F2L('e1', 'Esquina en la ranura, blanco al frente; arista arriba-derecha, verde arriba', "R U' R' U R U' R'", "R U R' U' R U R'", '27'),
  F2L('e2', 'Esquina en la ranura, blanco abajo; arista arriba-adelante, naranja arriba', "U R U' R' F R' F' R", "R' F R F' R U R' U'", '26', "U R U' R' U' F' U F"),
  F2L('e3', 'Esquina arriba adelante-der, blanco arriba; arista bien puesta en la ranura', "U R U' R' U R U' R' U R U' R'", "R U R' U' R U R' U' R U R' U'", '32'),
  F2L('e4', 'Esquina en la ranura, blanco al frente; arista bien puesta en la ranura', "R U' R' U' R U R' U2 R U' R'", "R U R' U2 R U' R' U R U R'", '38'),
  F2L('e5', 'Esquina en la ranura, blanco a la derecha; arista bien puesta en la ranura', "R U' R' U R U2 R' U R U' R'", "R U R' U' R U2 R' U' R U R'", '39'),
];

const ollCross = [
  kase({ slug: 'linea', code: 'Línea', recognition: 'Línea amarilla horizontal (izquierda–derecha)', stage: 'oll-cross',
    alg: "F R U R' U' F'", setup: "F U R U' R' F'", scdb: ['OLL', '45'], note: 'Es el OLL 45.' }),
  kase({ slug: 'l', code: 'L', recognition: 'Aristas amarillas adelante y a la derecha', stage: 'oll-cross',
    alg: "f R U R' U' f'", setup: "f U R U' R' f'", scdb: ['OLL', '44'], note: 'Usa f (2 capas). Es el OLL 44.' }),
  kase({ slug: 'punto', code: 'Punto', recognition: 'Solo el centro amarillo', stage: 'oll-cross',
    alg: "F R U R' U' F' f R U R' U' f'", setup: "f U R U' R' f' F U R U' R' F'", scdb: null,
    note: 'No es nuevo: es la Línea seguida de la L, sin giro en medio.' }),
];

const SUNE_NOTE = 'Sune y Antisune son inversas: la preparación de una es el algoritmo de la otra. Apréndelas primero: salen mucho y comparten gatillos con la H.';
const UL_NOTE = 'U y L son inversas: la preparación de una es el algoritmo de la otra. D gira la capa de abajo en sentido horario, mirándola desde abajo.';
const ollCorners = [
  kase({ slug: 'sune', code: 'Sune', recognition: '1 esquina arriba, adelante-izq; la de adelante-der muestra amarillo al frente', stage: 'oll-corners',
    alg: "R U R' U R U2 R'", setup: "R U2 R' U' R U' R'", scdb: ['OLL', '27'], note: SUNE_NOTE }),
  kase({ slug: 'antisune', code: 'Antisune', recognition: '1 esquina arriba, atrás-der; la de adelante-izq muestra amarillo al frente', stage: 'oll-corners',
    alg: "R U2 R' U' R U' R'", setup: "R U R' U R U2 R'", scdb: ['OLL', '26'], note: SUNE_NOTE }),
  kase({ slug: 'h', code: 'H', recognition: '0 arriba; dos amarillos a la izquierda y dos a la derecha', stage: 'oll-corners',
    alg: "R U R' U R U' R' U R U2 R'", setup: "R U2 R' U' R U R' U' R U' R'", scdb: ['OLL', '21'] }),
  kase({ slug: 'pi', code: 'Pi', recognition: '0 arriba; dos amarillos a la izquierda, a la derecha uno al frente y otro atrás', stage: 'oll-corners',
    alg: "R U2 R2 U' R2 U' R2 U2 R", setup: "R' U2 R2 U R2 U R2 U2 R'", scdb: ['OLL', '22'] }),
  kase({ slug: 'u', code: 'U', name: 'U (faros)', recognition: '2 arriba (las de atrás); dos amarillos al frente', stage: 'oll-corners',
    alg: "R2 D R' U2 R D' R' U2 R'", setup: "R U2 R D R' U2 R D' R2", scdb: ['OLL', '23'], note: UL_NOTE }),
  kase({ slug: 't', code: 'T', recognition: '2 arriba (las de la derecha); a la izquierda un amarillo al frente y otro atrás', stage: 'oll-corners',
    alg: "r U R' U' r' F R F'", setup: "F R' F' r U R U' r'", scdb: ['OLL', '24'] }),
  kase({ slug: 'l-esquinas', code: 'L', name: 'L (esquinas)', recognition: '2 arriba en diagonal (atrás-izq y adelante-der); la de adelante-izq muestra amarillo al frente', stage: 'oll-corners',
    alg: "R U2 R D R' U2 R D' R2", setup: "R2 D R' U2 R D' R' U2 R'", scdb: ['OLL', '25'], note: UL_NOTE }),
];

const U_NOTE = 'Ua y Ub son inversos: la preparación de uno es el algoritmo del otro.';
const M_NOTE = 'M se gira en la misma dirección que L.';
const pllCorners = [
  kase({ slug: 't', code: 'T-perm', recognition: 'Faros en un solo lado; ponlos a la izquierda', stage: 'pll-corners',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'", setup: "F R U' R' U R U R2 F' R U R U' R'", scdb: ['PLL', 'T'],
    note: 'Aparece en 2 de cada 3 resoluciones.' }),
  kase({ slug: 'y', code: 'Y-perm', recognition: 'Ningún lado tiene faros; se hace desde cualquier ángulo', stage: 'pll-corners',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", setup: "F R' F' R U R U' R' F R U' R' U R U R' F'", scdb: ['PLL', 'Y'],
    note: 'Aparece en 1 de cada 6 resoluciones.' }),
];
const pllEdges = [
  kase({ slug: 'ua', code: 'Ua', recognition: 'Un lado completo: ponlo atrás. La arista del frente es del color del centro derecho', stage: 'pll-edges',
    alg: "M2 U M U2 M' U M2", planB: "R U' R U R U R U' R' U' R2", setup: "M2 U' M U2 M' U' M2", scdb: ['PLL', 'Ua'], note: U_NOTE }),
  kase({ slug: 'ub', code: 'Ub', recognition: 'Un lado completo: ponlo atrás. La arista del frente es del color del centro izquierdo', stage: 'pll-edges',
    alg: "M2 U' M U2 M' U' M2", planB: "R2 U R U R' U' R' U' R' U R'", setup: "M2 U M U2 M' U M2", scdb: ['PLL', 'Ub'], note: U_NOTE }),
  kase({ slug: 'h', code: 'H-perm', recognition: 'Ningún lado completo; cada arista es del color opuesto a su cara', stage: 'pll-edges',
    alg: "M2 U M2 U2 M2 U M2", setup: "M2 U' M2 U2 M2 U' M2", scdb: ['PLL', 'H'], note: M_NOTE }),
  kase({ slug: 'z', code: 'Z-perm', recognition: 'Ningún lado completo; la arista del frente es del color de la izquierda y la de la izquierda del color del frente', stage: 'pll-edges',
    alg: "U M' U' M2 U' M2 U' M' U2 M2", setup: "M2 U2 M U M2 U M2 U M U'", scdb: ['PLL', 'Z'],
    note: `${M_NOTE} La U inicial es el AUF: deja las esquinas alineadas como pide SpeedCubeDB.` }),
];

const F2L_QUIZ = es(
  'Mezcla con amarillo arriba y verde al frente. Cruz y tres ranuras resueltas: identifica el caso del par verde-naranja (puede pedir un giro U antes).',
);
const OLL_QUIZ = es(
  'Mezcla con amarillo arriba y verde al frente. Dos primeras capas resueltas: identifica el caso y gira la capa superior hasta la posición correcta.',
);
const PLL_QUIZ = es(
  'Mezcla con amarillo arriba y verde al frente. Cara amarilla completa: identifica el caso del paso correspondiente.',
);

export const cfopReduced: Method = {
  id: 'cfop-reducido',
  name: es('CFOP reducido'),
  summary: es('Tu primer CFOP: F2L básico (19 casos) y OLL y PLL en 2 pasos (16 casos). 35 algoritmos en 6 semanas.'),
  description: es(
    [
      'Tu primer CFOP: **cruz, F2L, OLL y PLL**, con OLL y PLL en 2 pasos. Son **35 algoritmos**: 19 de F2L, 10 de OLL y 6 de PLL.',
      '## Las 3 fases',
      '1. **F2L:** cada esquina blanca con su arista, juntas en su ranura. 19 casos.',
      '2. **OLL en 2 pasos:** la cruz amarilla (3 casos) y luego las esquinas (7).',
      '3. **PLL en 2 pasos:** las esquinas (2 casos) y luego las aristas (4).',
      '## Cada algoritmo, en 4 etapas',
      'Pasa a la siguiente cuando cumplas su criterio:',
      '1. **Aprender:** pártelo en gatillos y hazlo lento 5 veces mirando. Sigue cuando salga sin mirar.',
      '2. **Taladrar:** mezcla y algoritmo, 20 veces. Sigue con 10 seguidas sin error.',
      "3. **Reconocer:** mezcla y un giro `U` al azar. Sigue cuando lo reconozcas y lo hagas en menos de 3 s.",
      '4. **Integrar:** úsalo en resoluciones cronometradas. Listo tras 5 veces bien.',
      '## Sesión tipo: 30–40 min, 5 días por semana',
      '1. **Calentamiento (5 min):** 3 repeticiones de cada algoritmo ya aprendido.',
      '2. **Nuevos (15 min):** 2 o 3 algoritmos, etapas 1 a 3.',
      '3. **Resoluciones (15 min):** 12 completas. Anota tu ao5 y tu ao12.',
      'Repasa cada algoritmo nuevo al día siguiente, a los 3 días y a los 7. **Si uno te falla, no agregues otro esa sesión:** refuérzalo.',
    ].join('\n'),
  ),
  orientation: es(
    [
      '**Cruz blanca abajo, amarillo arriba y verde al frente**; el naranja queda a la derecha.',
      'Los casos de F2L usan la ranura de **adelante a la derecha**: gira el cubo entero (`y`) para tener ahí la que vas a resolver.',
    ].join('\n'),
  ),
  notation: es(
    [
      '## Movimientos',
      "- `R`, `L`, `U`, `D`, `F` y `B`: un cuarto de vuelta de esa cara, en sentido horario mirándola de frente. Con apóstrofo, al revés (`R'`); con 2, media vuelta (`R2`).",
      '- `r` y `f`: la cara y la capa del medio juntas.',
      '- `M`: la capa del medio entre `L` y `R`; gira como `L`.',
      "- `y'`: gira el cubo entero como `U'`; el rojo queda al frente.",
      "- **AUF:** el giro de `U` (`U`, `U'` o `U2`) antes o después de un algoritmo.",
      '## Gatillos',
      "Los algoritmos repiten bloques cortos, como `R U R' U'` o `F R U R' U' F'`. Haz **cada bloque como un solo gesto**.",
      '## Plan B',
      'Algunos casos traen una segunda opción, más fácil al principio: solo `R`, `U` y `F`, o gatillos que ya conoces. Úsala mientras dominas la principal.',
      '## Figuras',
      '- **F2L:** el cubo visto desde arriba, adelante y a la derecha. En gris, lo que no importa.',
      '- **OLL y PLL:** la cara amarilla desde arriba, con el frente abajo. Las barritas son las pegatinas de los lados; en PLL, las flechas dicen a dónde va cada pieza.',
    ].join('\n'),
  ),
  schedule: es(
    [
      '5 sesiones de 30–40 min por semana: 6 semanas.',
      'Si vas rápido, adelanta. Si no cumples el criterio, repite la semana.',
      '- **Semana 1 (8 nuevos):** diagnóstico F2L + bloques A y B. Foco: cruz en 8 movimientos o menos, planeada en la inspección. Pasa con: ao12 de base anotado; A y B sin mirar la hoja.',
      '- **Semana 2 (5 nuevos):** OLL cruz (Línea, L y Punto) + F2L bloque C (2). Foco: reconocer la forma amarilla antes de terminar el F2L. Pasa con: cruz amarilla en menos de 3 s.',
      '- **Semana 3 (8 nuevos):** OLL esquinas (Sune, Antisune, H y Pi) + F2L bloque D (4). Foco: contar esquinas amarillas sin girar el cubo. Pasa con: los 4 casos reconocidos en menos de 2 s.',
      '- **Semana 4 (8 nuevos):** OLL esquinas (U, L y T) + F2L bloque E (5). Foco: resoluciones con OLL en 2 pasos completo. Pasa con: ninguna resolución con OLL de principiante.',
      '- **Semana 5 (4 nuevos):** PLL esquinas (T-perm y Y-perm) + aristas (Ua y Ub). Foco: buscar faros girando solo la capa superior. Pasa con: esquinas reconocidas en menos de 3 s.',
      '- **Semana 6 (2 nuevos):** PLL aristas (H y Z). Foco: repaso general y 50 resoluciones en la semana. Pasa con: ao12 al menos 20 % mejor que el de la semana 1.',
      '## Metas al terminar la semana 6',
      'Metas: cruz en menos de 4 s, F2L en menos de 25 s, OLL en menos de 7 s y PLL en menos de 7 s.',
      'Mídelas una vez por semana: 5 resoluciones lentas, cronometradas por partes.',
    ].join('\n'),
  ),
  phases: [
    {
      id: 'f2l',
      name: es('Fase 1: F2L'),
      goal: es(
        [
          '**Meta:** las dos primeras capas: cada esquina blanca con su arista, juntas en su ranura.',
          '**Casos:** 19, todos en la ranura de adelante a la derecha. Empieza por el bloque A.',
        ].join('\n'),
      ),
      description: es(
        [
          '## Cómo se hace',
          '1. Busca una esquina blanca y su arista: la que tiene sus otros 2 colores.',
          '2. Gira el cubo entero para tener su ranura adelante a la derecha.',
          '3. Con `U`, pon la esquina arriba, encima de la ranura (si ya está en la ranura, déjala).',
          '4. Busca entre los casos de esta fase el que se ve igual y haz su algoritmo.',
          'Repite con los 4 pares. El primer día, haz cada mezcla y marca los casos que ya dominas: entrena solo los que falten.',
        ].join('\n'),
      ),
      tips: es(
        [
          '- **Tu caso no está entre estos 19:** resuelve ese par como en el método principiante: primero la esquina, con el gatillo, y luego la arista. Es más lento, pero siempre funciona.',
          '- **No se ve igual que ningún caso:** gira `U` antes; la arista puede estar a un giro.',
          '- **El par sale separado:** la ranura no estaba adelante a la derecha, o la esquina no estaba encima de ella.',
          '- **Te cuesta girar el cubo en B4, D2 o D4:** usa su Plan B, que hace lo mismo con `F`, sin rotar.',
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        { id: 'f2l-a', name: es('Bloque A — Inserciones básicas'), description: es('La base de todo lo demás.'), cases: f2lA },
        { id: 'f2l-b', name: es('Bloque B — Piezas separadas, blanco al lado'), cases: f2lB },
        { id: 'f2l-c', name: es('Bloque C — Blanco al lado, arista lejos y "mal" orientada'), cases: f2lC },
        { id: 'f2l-d', name: es('Bloque D — Blanco mirando arriba'), cases: f2lD },
        { id: 'f2l-e', name: es('Bloque E — Piezas atascadas en la ranura'), cases: f2lE },
      ],
      progression: es(
        [
          'Orden: **A → B → C → D → E**.',
          '## Espejo',
          'Cuando domines un caso en adelante-derecha, practica su espejo en adelante-izquierda.',
          "- Cambia `R` por `L'`, `F` por `F'`, `U` por `U'`, `r` por `l'` e `y'` por `y`. `M` no cambia.",
          "- Ejemplo: `R U R'` pasa a `L' U' L`.",
          '## Anticipación',
          '5 resoluciones lentas por sesión, buscando el siguiente par mientras insertas el actual.',
        ].join('\n'),
      ),
      quizzes: [
        quiz('quiz-f2l-a', 'Quiz F2L-A (inserciones básicas)', F2L_QUIZ, 'f2l', [
          ["D R2 D' F2 U2 F2 U' F2 U' R F2 R' F2 U R'", 'a1'],
          ["R2 B2 D L2 U' L2 B2 D' R2 U B' R2 B U R2 U2 R2 U2", 'a2'],
          ["U R2 D' L2 D' L2 D2 R2 F2 U F U F U F' U F U", 'a4'],
          ["R2 U' R2 D2 B2 U' B2 D' R2 U R' U R2 D' R U2", 'a1'],
          ["R2 D2 U B2 D' U2 B2 F2 R2 U2 R U2 R F2 U' R2 D'", 'a3'],
        ]),
        quiz('quiz-f2l-b', 'Quiz F2L-B (separados)', F2L_QUIZ, 'f2l', [
          ["D2 B2 R2 D F2 D' F2 D F2 U2 L' D2 L' F2 U R' U", 'b1'],
          ["B2 U' B2 U' F2 L2 F2 D' B2 R2 B U R2 B' U B' D B' U", 'b4'],
          ["B2 D' F2 L2 B2 U R2 F2 R2 U2 F U' B2 F2 D' B2 F'", 'b2'],
          ["U R2 U' F2 D2 U' F2 D U' R' U' L2 U2 R' D' L2 D2 U", 'b3'],
          ["U F2 U L2 U L2 U' L2 U' F L2 F' L2 U F U2 F", 'b4'],
        ]),
        quiz('quiz-f2l-c', 'Quiz F2L-C (arista lejos)', F2L_QUIZ, 'f2l', [
          ["R2 B' R2 B' R2 U2 R2 B2 U2 F D' B2 R2 F2 U' L2 F", 'c2'],
          ["U' R2 U R2 U R2 U2 R2 U F' U2 F", 'c2'],
          ["U' B2 D B2 R2 D' F2 U F2 R' B2 L U L' B2 R'", 'c1'],
          ["U L2 U F2 U F2 L2 U L2 U' F' L2 F U2 L2 U2 F' U'", 'c2'],
        ]),
        quiz('quiz-f2l-d', 'Quiz F2L-D (blanco arriba)', F2L_QUIZ, 'f2l', [
          ["F2 L2 D2 F2 U2 R2 U2 F2 L2 D' L' B2 L D B2 L' D2 F2", 'd1'],
          ["F2 U2 R2 D R2 U' R2 B2 D B L2 D' B D' R2 F U2", 'd4'],
          ["L2 R2 D L2 B2 L2 D' R2 F2 L' F2 L' U2 R U2 R' U2", 'd3'],
          ["L2 D2 B2 R2 B2 R2 D' R2 D' R2 B D' B2 D2 B L2 R2 F", 'd2'],
          ["U' R2 D' L2 D' L2 D2 B2 D B D B2 U B D2 B2 U' R2", 'd4'],
        ]),
        quiz('quiz-f2l-e', 'Quiz F2L-E (atascados)', F2L_QUIZ, 'f2l', [
          ["B L2 B' L2 F2 L2 F' L2 U2 F' U' L2 F' L2 B' U B U'", 'e5'],
          ["R2 U2 R2 F2 U' F2 D R2 D' R2 F' U2 F U' F' U' F", 'e4'],
          ["U' F2 L2 B2 U F2 D' R2 D F' D' B2 D F' U' F2", 'e3'],
          ["U F2 D F2 D' L2 U B2 L2 U2 L F2 R D2 L' U' R' U'", 'e1'],
          ["R2 B2 D' F2 D' L2 U L2 U' F2 L' D' L D' B2 R' U' R'", 'e1'],
          ["D' L2 D L2 U' L2 U L2 U' R' F' R F' U' F2", 'e2'],
        ]),
      ],
    },
    {
      id: 'oll',
      name: es('Fase 2: OLL en 2 pasos'),
      goal: es(
        [
          '**Meta:** toda la cara de arriba amarilla. Los colores de los lados, todavía no.',
          '**Casos:** 10, en 2 pasos: la cruz amarilla (3) y luego las esquinas (7). Empieza por Sune y Antisune.',
        ].join('\n'),
      ),
      description: es(
        [
          '## Cómo se hace',
          '1. **Cruz amarilla:** mira solo las aristas amarillas de arriba y haz su caso.',
          '2. **Esquinas:** cuenta las esquinas con el amarillo arriba y haz su caso.',
          'Antes de cada algoritmo, gira `U` hasta verlo como en su figura.',
        ].join('\n'),
      ),
      tips: es(
        [
          '- **No encuentras tu caso:** gira `U`; cada caso se reconoce desde un ángulo. Mira también el amarillo de los lados, no solo el de arriba.',
          '- **Ves 1 o 3 aristas amarillas, o 3 esquinas:** con el F2L hecho es imposible. Cuenta solo las piezas de arriba; si es así, una pieza quedó girada por dentro (el cubo se desarmó).',
          '- **Se rompió el F2L:** el algoritmo salió mal, con un giro de menos o al revés. Rehaz el par roto y repítelo despacio, gatillo por gatillo.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [
        { id: 'oll-cross', name: es('Paso 1 — Cruz amarilla'), description: es('Mira solo las aristas amarillas de arriba.'), cases: ollCross },
        {
          id: 'oll-corners',
          name: es('Paso 2 — Esquinas amarillas'),
          description: es('Cuenta las esquinas con el amarillo arriba:\n- 0 → H o Pi\n- 1 → Sune o Antisune\n- 2 → U, T o L'),
          cases: ollCorners,
        },
      ],
      progression: es(
        [
          '- **Cruz:** Línea y L el mismo día; Punto al siguiente.',
          '- **Esquinas:** Sune y Antisune → H y Pi → U, L y T. Aprende U y L juntas: son inversas.',
          'Empieza por **Sune y Antisune**: salen mucho y comparten gatillos con la H.',
        ].join('\n'),
      ),
      quizzes: [
        quiz('quiz-oll-1', 'Quiz OLL-1 (cruz amarilla)', OLL_QUIZ, 'oll', [
          ["L2 B2 F2 R2 D F2 L2 F2 D2 F L' F' D2 B2 R F' R F'", 'punto'],
          ["F2 R2 U' F2 U R2 F2 R F R2 B F' L' B L B2 R'", 'punto'],
          ["U' F2 D' L2 F2 U F2 L2 D2 F' U2 F R' D' R F' U2 F'", 'linea'],
          ["B2 U L2 F2 D R2 D' L2 R2 U2 L' B2 D2 R2 B' R' B2 L B'", 'l'],
          ["R2 B2 R2 F2 D2 B2 D' B2 D' L2 F L2 F U2 R' B R' U' R2", 'l'],
        ]),
        quiz('quiz-oll-2', 'Quiz OLL-2 (esquinas)', OLL_QUIZ, 'oll', [
          ["U' R2 B2 D' L2 B2 R2 U' R2 U' F L2 F' U R2 F L2 F", 'sune'],
          ["U' R2 D' R2 B2 U B2 U' B2 U' R' D R B2 U' R U2 R'", 'pi'],
          ["D' F2 U F2 U' R2 D2 B2 U' B' D' B' R2 U B' U2 B", 'pi'],
          ["D2 L2 B' U2 R2 B L2 F' D2 B2 U' F D B2 D F' U2", 'l-esquinas'],
          ["F2 U2 B' U2 B L2 F' L2 U2 F2 U' R' F U' F' U R", 'u'],
          ["L2 B U2 B' R2 F R2 F' L2 U' F' U2 L2 U L2 U' F", 'h'],
          ["R2 B2 L2 D' L2 B2 R2 U R2 F2 R' U2 R F2 R' U2 R'", 't'],
          ["B2 U B2 U B2 U B2 U B2 U B' U B2 U' B2 U B U'", 'antisune'],
        ]),
      ],
    },
    {
      id: 'pll',
      name: es('Fase 3: PLL en 2 pasos'),
      goal: es(
        [
          '**Meta:** cada pieza de arriba en su sitio. ¡Cubo resuelto!',
          '**Casos:** 6, en 2 pasos: las esquinas (2) y luego las aristas (4). Empieza por la T-perm.',
        ].join('\n'),
      ),
      description: es(
        [
          '## Cómo se hace',
          '1. **Esquinas:** busca **faros**, las 2 esquinas de un lado con el mismo color, y haz su caso.',
          '2. **Aristas:** gira `U` hasta alinear las esquinas con sus centros, mira las aristas y haz su caso.',
          '3. Gira `U` hasta alinear la capa.',
        ].join('\n'),
      ),
      tips: es(
        [
          '- **No ves faros:** mira los 4 lados, girando `U`. Si ninguno los tiene, es la Y-perm.',
          '- **Tras la T-perm no hay faros en los 4 lados:** los faros iban a la izquierda; desde otro lado, cambia otras esquinas.',
          '- **Hiciste Ua en vez de Ub, o al revés:** no se rompe nada; el lado completo sigue atrás. Mira otra vez la arista del frente y haz el que toque.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [
        {
          id: 'pll-corners',
          name: es('Paso 1 — Esquinas'),
          description: es('Faros en un solo lado: T-perm. En ninguno: Y-perm. En los 4: ya están.'),
          cases: pllCorners,
        },
        { id: 'pll-edges', name: es('Paso 2 — Aristas'), description: es('Un lado completo: Ua o Ub. Ninguno: H o Z.'), cases: pllEdges },
      ],
      progression: es(
        [
          'Orden: **T-perm → Y-perm → Ua y Ub juntos → H → Z**.',
          'T-perm primero: sale en 2 de cada 3 resoluciones. Y-perm sale en 1 de cada 6; en el otro 1 de cada 6 las esquinas ya están.',
        ].join('\n'),
      ),
      quizzes: [
        quiz('quiz-pll-1', 'Quiz PLL-1 (esquinas)', PLL_QUIZ, 'pll', [
          ["F R2 B D2 B' R2 U2 F L2 F2 U' F U F' U' F U' F'", 'y'],
          ["B2 L2 D2 B F2 R2 D2 F2 D2 B' D F2 L2 B2 U' F R2", 'y'],
          ["R2 D' F2 U F2 R2 D B2 U' B2", 't'],
          ["R2 F2 R2 F U2 B' R2 B U2 R2 D' F U' F2 D F'", 'y'],
        ]),
        quiz('quiz-pll-2', 'Quiz PLL-2 (aristas)', PLL_QUIZ, 'pll', [
          ["L2 R2 D2 L2 R2 F2 L2 R2 F2 D' L2 R2 U B2 F2 U'", 'z'],
          ["L2 R2 D2 L2 R2 F2 L2 R2 F2 D' L2 R2 U B2 F2", 'z'],
          ["U' L2 R2 D' L2 B2 L2 D L' R' U2 L' R'", 'ua'],
          ["F' U2 F2 U2 F2 U2 F' U2 L2 R2 D' B2 D L2 R2 U' F2", 'ub'],
          ["L2 B2 F2 R2 D' L2 B2 F2 R2 U'", 'h'],
          ["B2 L2 U2 R2 F2 R2 U2 R2 D' B2 D' L2 R2 U F2", 'ub'],
        ]),
      ],
    },
  ],
};

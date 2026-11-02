// "CFOP reducido" (Parte 1 of the training plan): 19 F2L + OLL in 2 steps + PLL in 2 steps, plus the
// plan's quizzes. Text follows the plan, rewritten to the Academia's style; algorithms and scrambles are the plan's,
// with ASCII primes.
import { fromSpanish, loc, type Localized } from '../i18n.ts';
import type { Case, Method, OfficialQuiz, QuizItem, SpeedCubeDbRef, Stage } from './types.ts';
import { scdbUrl } from './scdb.ts';
import { EN } from './cfop.en.ts';
import { PT } from './cfop.pt.ts';

// Spanish text -> Localized; English and Portuguese come from EN and PT line by line (see cfop.en.ts).
const es = (text: string): Localized => fromSpanish(text, { en: EN, pt: PT });

const PLAN_B_NOTE = es("Plan B: más fácil al principio, con solo `R`, `U` y `F` o gatillos que ya conoces.");

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
  "Empieza con `y'`, un giro del cubo entero: así metes el par con la mano derecha. El Plan B hace lo mismo con `F`, sin girar el cubo.";
const R_NOTE = 'Usa `r`, un giro de dos capas: `R` y la capa del medio a la vez.';
const F2L = (slug: string, recognition: string, alg: string, setup: string, n: string, planB?: string, note?: string): Case =>
  kase({ slug, code: slug.toUpperCase(), recognition, stage: 'f2l', alg, planB, setup, scdb: ['F2L', n], note });

const f2lA = [
  F2L('a1', 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la derecha, con el verde arriba', "U R U' R'", "R U R' U'", '1'),
  F2L('a2', 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba adelante, con el naranja arriba', "F R' F' R", "R' F R F'", '2', "U' F' U F"),
  F2L('a3', 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el verde arriba', "R U R'", "R U' R'", '4'),
  F2L('a4', 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el naranja arriba', "F' U' F", "F' U F", '3'),
];
const f2lB = [
  F2L('b1', 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba atrás, con el verde arriba', "U' R U R' U2 R U' R'", "R U R' U2 R U' R' U", '5'),
  F2L('b2', 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la izquierda, con el naranja arriba', "U' r U' R' U R U r'", "r U' R' U' R U r' U", '6', "U F' U' F U2 F' U F", R_NOTE),
  F2L('b3', 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba a la derecha, con el verde arriba', "U' R U' R' U R U R'", "R U' R' U' R U R' U", '14'),
  F2L('b4', 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba adelante, con el naranja arriba', "y' U R' U R U' R' U' R", "F' U F U F' U' F U'", '13', "U F' U F U' F' U' F", Y_NOTE),
];
const f2lC = [
  F2L('c1', 'Esquina arriba, adelante a la derecha, con el blanco al frente; arista arriba a la izquierda, con el verde arriba', "U' R U2 R' U' R U2 R'", "R U2 R' U R U2 R' U", '7'),
  F2L('c2', 'Esquina arriba, adelante a la derecha, con el blanco a la derecha; arista arriba atrás, con el naranja arriba', "r' U2 R2 U R2 U r", "r' U' R2 U' R2 U2 r", '8', "U F' U2 F U2 F' U F", R_NOTE),
];
const f2lD = [
  F2L('d1', 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la derecha, con el verde arriba', "R U2 R' U' R U R'", "R U' R' U R U2 R'", '17'),
  F2L('d2', 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba adelante, con el naranja arriba', "y' R' U2 R U R' U' R", "F' U F U' F' U2 F", '18', "F' U2 F U F' U' F", Y_NOTE),
  F2L('d3', 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba atrás, con el verde arriba', "U R U2 R' U R U' R'", "R U R' U' R U2 R' U'", '19'),
  F2L('d4', 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista arriba a la izquierda, con el naranja arriba', "y' U' R' U2 R U' R' U R", "F' U' F U F' U2 F U", '20', "U' F' U2 F U' F' U F", Y_NOTE),
];
const f2lE = [
  F2L('e1', 'Esquina en la ranura, con el blanco al frente; arista arriba a la derecha, con el verde arriba', "R U' R' U R U' R'", "R U R' U' R U R'", '27'),
  F2L('e2', 'Esquina en la ranura, con el blanco abajo; arista arriba adelante, con el naranja arriba', "U R U' R' F R' F' R", "R' F R F' R U R' U'", '26', "U R U' R' U' F' U F"),
  F2L('e3', 'Esquina arriba, adelante a la derecha, con el blanco arriba; arista en su sitio, en la ranura', "U R U' R' U R U' R' U R U' R'", "R U R' U' R U R' U' R U R' U'", '32'),
  F2L('e4', 'Esquina en la ranura, con el blanco al frente; arista en su sitio, en la ranura', "R U' R' U' R U R' U2 R U' R'", "R U R' U2 R U' R' U R U R'", '38'),
  F2L('e5', 'Esquina en la ranura, con el blanco a la derecha; arista en su sitio, en la ranura', "R U' R' U R U2 R' U R U' R'", "R U R' U' R U2 R' U' R U R'", '39'),
];

const ollCross = [
  kase({ slug: 'linea', code: 'Línea', recognition: 'Línea amarilla de izquierda a derecha', stage: 'oll-cross',
    alg: "F R U R' U' F'", setup: "F U R U' R' F'", scdb: ['OLL', '45'], note: 'En el CFOP completo es el caso OLL 45.' }),
  kase({ slug: 'l', code: 'L', recognition: 'Dos aristas amarillas, adelante y a la derecha', stage: 'oll-cross',
    alg: "f R U R' U' f'", setup: "f U R U' R' f'", scdb: ['OLL', '44'], note: 'Usa `f`, un giro de dos capas. En el CFOP completo es el caso OLL 44.' }),
  kase({ slug: 'punto', code: 'Punto', recognition: 'Ninguna arista amarilla arriba, solo el centro', stage: 'oll-cross',
    alg: "F R U R' U' F' f R U R' U' f'", setup: "f U R U' R' f' F U R U' R' F'", scdb: null,
    note: 'No es nuevo: es la Línea seguida de la L, sin giro en medio.' }),
];

const SUNE_NOTE = 'Sune y Antisune son inversos: la preparación de uno es el algoritmo del otro.';
const UL_NOTE = 'Los casos U y L de las esquinas son inversos: la preparación de uno es el algoritmo del otro. `D` gira la capa de abajo en sentido horario, mirándola desde abajo.';
const ollCorners = [
  kase({ slug: 'sune', code: 'Sune', recognition: 'Una esquina con el amarillo arriba, la de adelante a la izquierda; la de adelante a la derecha, con el amarillo al frente', stage: 'oll-corners',
    alg: "R U R' U R U2 R'", setup: "R U2 R' U' R U' R'", scdb: ['OLL', '27'], note: SUNE_NOTE }),
  kase({ slug: 'antisune', code: 'Antisune', recognition: 'Una esquina con el amarillo arriba, la de atrás a la derecha; la de adelante a la izquierda, con el amarillo al frente', stage: 'oll-corners',
    alg: "R U2 R' U' R U' R'", setup: "R U R' U R U2 R'", scdb: ['OLL', '26'], note: SUNE_NOTE }),
  kase({ slug: 'h', code: 'H', recognition: 'Ninguna esquina con el amarillo arriba; 2 amarillos a la izquierda y 2 a la derecha', stage: 'oll-corners',
    alg: "R U R' U R U' R' U R U2 R'", setup: "R U2 R' U' R U R' U' R U' R'", scdb: ['OLL', '21'] }),
  kase({ slug: 'pi', code: 'Pi', recognition: 'Ninguna esquina con el amarillo arriba; 2 amarillos a la izquierda; a la derecha, uno al frente y otro atrás', stage: 'oll-corners',
    alg: "R U2 R2 U' R2 U' R2 U2 R", setup: "R' U2 R2 U R2 U R2 U2 R'", scdb: ['OLL', '22'] }),
  kase({ slug: 'u', code: 'U', name: 'U (faros)', recognition: 'Dos esquinas con el amarillo arriba, las de atrás; las de adelante, con el amarillo al frente', stage: 'oll-corners',
    alg: "R2 D R' U2 R D' R' U2 R'", setup: "R U2 R D R' U2 R D' R2", scdb: ['OLL', '23'], note: UL_NOTE }),
  kase({ slug: 't', code: 'T', recognition: 'Dos esquinas con el amarillo arriba, las de la derecha; a la izquierda, un amarillo al frente y otro atrás', stage: 'oll-corners',
    alg: "r U R' U' r' F R F'", setup: "F R' F' r U R U' r'", scdb: ['OLL', '24'] }),
  kase({ slug: 'l-esquinas', code: 'L', name: 'L (esquinas)', recognition: 'Dos esquinas con el amarillo arriba, en diagonal (atrás a la izquierda y adelante a la derecha); la de adelante a la izquierda, con el amarillo al frente', stage: 'oll-corners',
    alg: "R U2 R D R' U2 R D' R2", setup: "R2 D R' U2 R D' R' U2 R'", scdb: ['OLL', '25'], note: UL_NOTE }),
];

const M_NOTE = '`M` gira en el mismo sentido que `L`.';
const U_NOTE = `Ua y Ub son inversos: la preparación de uno es el algoritmo del otro. ${M_NOTE}`;
const pllCorners = [
  kase({ slug: 't', code: 'T-perm', recognition: 'Un solo lado con faros o completo, a la izquierda', stage: 'pll-corners',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'", setup: "F R U' R' U R U R2 F' R U R U' R'", scdb: ['PLL', 'T'],
    note: 'Gira `U` hasta dejar los faros, o el lado completo, a la izquierda. Aparece en 2 de cada 3 resoluciones.' }),
  kase({ slug: 'y', code: 'Y-perm', recognition: 'Ningún lado tiene faros ni está completo', stage: 'pll-corners',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", setup: "F R' F' R U R U' R' F R U' R' U R U R' F'", scdb: ['PLL', 'Y'],
    note: 'Aparece en 1 de cada 6 resoluciones. Puedes hacerla desde cualquier lado, sin girar `U` antes.' }),
];
const pllEdges = [
  kase({ slug: 'ua', code: 'Ua', recognition: 'Un lado completo, atrás; la arista del frente tiene el color del centro de la derecha', stage: 'pll-edges',
    alg: "M2 U M U2 M' U M2", planB: "R U' R U R U R U' R' U' R2", setup: "M2 U' M U2 M' U' M2", scdb: ['PLL', 'Ua'], note: U_NOTE }),
  kase({ slug: 'ub', code: 'Ub', recognition: 'Un lado completo, atrás; la arista del frente tiene el color del centro de la izquierda', stage: 'pll-edges',
    alg: "M2 U' M U2 M' U' M2", planB: "R2 U R U R' U' R' U' R' U R'", setup: "M2 U M U2 M' U M2", scdb: ['PLL', 'Ub'], note: U_NOTE }),
  kase({ slug: 'h', code: 'H-perm', recognition: 'Ningún lado completo; cada arista tiene el color del lado opuesto', stage: 'pll-edges',
    alg: "M2 U M2 U2 M2 U M2", setup: "M2 U' M2 U2 M2 U' M2", scdb: ['PLL', 'H'],
    note: '`M2` gira 2 veces la capa del medio, entre `L` y `R`, así que da igual el sentido.' }),
  kase({ slug: 'z', code: 'Z-perm', recognition: 'Ningún lado completo; la arista del frente tiene el color del centro de la izquierda, y la de la izquierda, el del centro del frente', stage: 'pll-edges',
    alg: "U M' U' M2 U' M2 U' M' U2 M2", setup: "M2 U2 M U M2 U M2 U M U'", scdb: ['PLL', 'Z'],
    // the leading U is part of the algorithm, not an AUF: the case starts with the corners lined up, and the U turns of
    // the rest add up to U', so skipping it leaves the cube unsolved
    note: `${M_NOTE} Haz también la \`U\` del principio, aunque las esquinas ya estén alineadas: el resto del algoritmo las vuelve a alinear.` }),
];

const F2L_QUIZ = es(
  'Haz la mezcla con el amarillo arriba y el verde al frente. Quedan resueltas la cruz y 3 ranuras: reconoce el caso del par verde-naranja y resuélvelo. Puede hacer falta un giro U para verlo como en su figura.',
);
const OLL_QUIZ = es(
  'Haz la mezcla con el amarillo arriba y el verde al frente. Quedan resueltas las dos primeras capas: reconoce el caso, gira la capa de arriba hasta verlo como en su figura y resuélvelo.',
);
const PLL_QUIZ = es(
  'Haz la mezcla con el amarillo arriba y el verde al frente. La cara amarilla queda completa: reconoce el caso de este paso y resuélvelo.',
);

export const cfopReduced: Method = {
  id: 'cfop-reducido',
  next: 'cfop-completo',
  name: es('CFOP reducido'),
  summary: es('Del método principiante al CFOP en el cubo de Rubik: 35 algoritmos (19 de F2L, 10 de OLL y 6 de PLL) y un plan de 6 semanas.'),
  description: es(
    [
      'El CFOP es el método de casi todos los speedcubers. Su nombre viene de sus 4 pasos: cruz, F2L, OLL y PLL.',
      'Esta guía es tu primer CFOP, para cuando ya resuelves el cubo con el método principiante. La cruz es la misma, y los otros 3 pasos suman **35 algoritmos**, en vez de los 119 del CFOP completo.',
      '## Las 3 fases',
      '1. **F2L:** junta cada esquina blanca con su arista y mete el par en su ranura (19 casos).',
      '2. **OLL en 2 pasos:** deja amarilla toda la cara de arriba, primero con la cruz (3 casos) y luego con las esquinas (7), el paso llamado OCLL.',
      '3. **PLL en 2 pasos:** pon cada pieza de arriba en su sitio, primero las esquinas (2 casos) y luego las aristas (4).',
      '## Cada algoritmo, en 4 etapas',
      '1. **Aprender:** pártelo en gatillos y hazlo despacio 5 veces, mirándolo. Sigue cuando te salga sin mirar.',
      '2. **Repetir:** haz su preparación y el algoritmo 20 veces. Sigue cuando te salgan 10 seguidas sin error.',
      '3. **Reconocer:** haz la preparación y un giro `U` al azar. Sigue cuando lo reconozcas y lo resuelvas en menos de 3 s.',
      '4. **Integrar:** úsalo en resoluciones cronometradas. Está listo cuando te salga bien 5 veces.',
      '## Sesión tipo: 30 a 40 min',
      '1. **Calentamiento (5 min):** repite 3 veces cada algoritmo que ya sabes.',
      '2. **Nuevos (15 min):** aprende 2 o 3 algoritmos y llévalos de la etapa 1 a la 3.',
      '3. **Resoluciones (15 min):** haz 12 completas y anota tus medias de 5 y de 12 (ao5 y ao12).',
      'Repasa cada algoritmo nuevo al día siguiente, a los 3 días y a los 7. Si uno te falla, refuérzalo y **no añadas otro** esa sesión.',
    ].join('\n'),
  ),
  orientation: es(
    [
      'Sostén el cubo con la **cruz blanca abajo**, el amarillo arriba y el verde al frente. El naranja queda a la derecha.',
      "Los casos de F2L usan la ranura de **adelante a la derecha**: gira el cubo entero (con `y`, `y'` o `y2`) para tener ahí la que vas a resolver.",
    ].join('\n'),
  ),
  notation: es(
    [
      '## Giros',
      '- `r` y `f`: giros de dos capas, la cara y la capa del medio a la vez.',
      '- `M`: la capa del medio, entre `L` y `R`. Gira en el mismo sentido que `L`.',
      "- `y'`: gira el cubo entero en el sentido de `U'`. El rojo queda al frente.",
      "- **AUF:** el giro de `U` (`U`, `U'` o `U2`) antes o después de un algoritmo.",
      '## Gatillos',
      "Los algoritmos repiten trozos cortos, los **gatillos**, como `R U R'` o `R U R' U'`. Haz cada gatillo como un solo gesto.",
      '## Plan B',
      'Algunos casos traen una segunda opción, más fácil al principio: solo `R`, `U` y `F`, o gatillos que ya conoces. Úsala mientras dominas la principal.',
      '## Figuras',
      '- **F2L:** el cubo visto desde arriba, adelante y a la derecha. Lo que no importa sale en gris.',
      '- **OLL y PLL:** la cara amarilla vista desde arriba. El frente es el borde inferior de la figura. Las barritas son las pegatinas de los lados, y en PLL las flechas dicen a dónde va cada pieza.',
    ].join('\n'),
  ),
  schedule: es(
    [
      'El plan dura 6 semanas, con 5 sesiones de 30 a 40 min por semana. Si vas rápido, adelántate. Si no llegas a la meta de una semana, repítela.',
      '- **Semana 1 (8 casos nuevos):** los grupos A y B del F2L. Antes, prueba los 19 casos y apunta los que ya sabes. Planea la cruz en la inspección y hazla en 8 giros o menos. Pasa cuando hayas anotado tu media de 12 (ao12) inicial y te salgan A y B sin mirar los algoritmos.',
      '- **Semana 2 (5 casos nuevos):** la cruz amarilla del OLL (Línea, L y Punto) y el grupo C del F2L. Mientras metes el último par, mira qué forma hacen las aristas con el amarillo arriba (Línea, L o Punto). Pasa cuando hagas la cruz amarilla en menos de 3 s.',
      '- **Semana 3 (8 casos nuevos):** Sune, Antisune, H y Pi, de las esquinas del OLL, y el grupo D del F2L. Cuenta las esquinas con el amarillo arriba sin girar el cubo. Pasa cuando reconozcas esos 4 casos en menos de 2 s.',
      '- **Semana 4 (8 casos nuevos):** los casos U, L y T de las esquinas del OLL, y el grupo E del F2L. Haz todas las resoluciones con el OLL en 2 pasos. Pasa cuando ya no uses el método principiante para la cara amarilla.',
      '- **Semana 5 (4 casos nuevos):** la T-perm y la Y-perm, para las esquinas del PLL, y Ua y Ub, para las aristas. Busca los faros girando solo la capa de arriba. Pasa cuando reconozcas el caso de las esquinas en menos de 3 s.',
      '- **Semana 6 (2 casos nuevos):** la H-perm y la Z-perm, para las aristas del PLL. Repasa todo y haz 50 resoluciones en la semana. Terminas cuando tu ao12 sea al menos un 20 % mejor que la de la semana 1.',
      '## Metas al terminar la semana 6',
      'Busca estos tiempos por paso: cruz en menos de 4 s, F2L en menos de 25 s, OLL en menos de 7 s y PLL en menos de 7 s.',
      'Mídelos una vez por semana con 5 resoluciones a tu ritmo normal. En «Opciones», pon 4 en «Fases por resolución» y toca el cronómetro al terminar cada paso.',
    ].join('\n'),
  ),
  phases: [
    {
      id: 'f2l',
      name: es('Fase 1: F2L'),
      goal: es(
        [
          '**Meta:** las dos primeras capas resueltas: cada esquina blanca con su arista, juntas en su ranura.',
          '**Casos:** 19, todos en la ranura de adelante a la derecha. Empieza por el grupo A.',
        ].join('\n'),
      ),
      // In the lessons, group A's description follows this text, inside its last "## " section: that section has to
      // lead into it (lessons.ts)
      description: es(
        [
          '## Cómo se hace',
          '1. Busca una esquina blanca y su arista, que es la que tiene los otros 2 colores de la esquina.',
          '2. Gira el cubo entero para tener su ranura adelante a la derecha. Es la que está entre los centros de los 2 colores de la arista.',
          '3. Gira `U` para poner la esquina encima de la ranura. Si ya está en la ranura, déjala ahí.',
          '4. Busca entre los casos de esta fase el que se ve igual y haz su algoritmo.',
          '5. Repite con los otros 3 pares hasta completar las dos primeras capas.',
          '## Por dónde empezar',
          'El primer día, haz la preparación de cada uno de los 19 casos e intenta meter el par a tu manera. Apunta los que ya te salen y entrena solo los demás.',
        ].join('\n'),
      ),
      tips: es(
        [
          "- **Tu caso no está entre estos 19:** resuelve ese par como en el método principiante: primero la esquina, repitiendo `R U R' U'`, y luego la arista. Es más lento, pero siempre funciona.",
          '- **La esquina está en la ranura y no ves tu caso:** gira `U` para mover solo la arista. Puede estar a un giro de E1 o de E2.',
          '- **El par sale separado:** la ranura no estaba adelante a la derecha o la esquina no estaba encima de ella. Vuelve a dejar la ranura adelante a la derecha y la esquina encima. Luego busca el caso que ves ahora y haz su algoritmo.',
          '- **Te cuesta girar el cubo en B4, D2 o D4:** usa su Plan B, que hace lo mismo con `F`, sin girar el cubo.',
        ].join('\n'),
      ),
      diagram: 'iso',
      groups: [
        {
          id: 'f2l-a',
          name: es('Grupo A — Inserciones básicas'),
          description: es('El grupo A reúne las 4 inserciones más cortas, de 3 o 4 giros. Son la base de todos los demás casos.'),
          cases: f2lA,
        },
        {
          id: 'f2l-b',
          name: es('Grupo B — Sin formar par, blanco de lado'),
          description: es('La esquina tiene el blanco al frente o a la derecha, y la arista está arriba sin formar par con ella. Sus algoritmos primero juntan las dos piezas y luego meten el par.'),
          cases: f2lB,
        },
        {
          id: 'f2l-c',
          name: es('Grupo C — Blanco de lado, arista lejos y al revés'),
          description: es('La arista está arriba, lejos de la esquina, y al revés: su color de lado mira en sentido contrario al mismo color en la esquina. En C1, el naranja de la arista mira a la izquierda, y el de la esquina, a la derecha.'),
          cases: f2lC,
        },
        {
          id: 'f2l-d',
          name: es('Grupo D — Blanco mirando arriba'),
          description: es('La esquina tiene el blanco mirando arriba, y la arista también está en la capa de arriba.'),
          cases: f2lD,
        },
        {
          id: 'f2l-e',
          name: es('Grupo E — Piezas atascadas en la ranura'),
          description: es('La esquina, la arista o las dos ya están en la ranura, pero el par no está resuelto. Sus algoritmos primero sacan de la ranura lo que está atascado y luego meten el par.'),
          cases: f2lE,
        },
      ],
      progression: es(
        [
          'Orden: **A → B → C → D → E**. El grupo A tiene los casos más cortos, y el E, los más largos.',
          '## Espejo',
          'Cuando domines un caso en la ranura de adelante a la derecha, practica su espejo en la de adelante a la izquierda:',
          "- Cambia `R` por `L'`, `F` por `F'`, `U` por `U'`, `r` por `l'` e `y'` por `y`. `M` no cambia.",
          "- Ejemplo: `R U R'` pasa a `L' U' L`.",
          '## Anticipación',
          'Haz 5 resoluciones lentas por sesión. Mientras metes un par, busca con la vista el siguiente.',
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
        quiz('quiz-f2l-b', 'Quiz F2L-B (sin formar par)', F2L_QUIZ, 'f2l', [
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
          '**Meta:** toda la cara de arriba amarilla. Los colores de los lados aún no importan.',
          '**Casos:** 10, en 2 pasos: la cruz amarilla (3) y luego las esquinas (7). Empieza por la cruz y, en las esquinas, por Sune y Antisune.',
        ].join('\n'),
      ),
      description: es(
        [
          '## Cómo se hace',
          '1. **Cruz amarilla:** cuenta las aristas con el amarillo arriba y haz su caso.',
          '2. **Esquinas:** cuenta las esquinas con el amarillo arriba y haz su caso.',
          'Antes de cada algoritmo, gira `U` hasta verlo como en su figura.',
        ].join('\n'),
      ),
      tips: es(
        [
          '- **No encuentras tu caso:** gira `U` y vuelve a mirar, porque cada figura muestra el caso desde un solo lado. Mira también el amarillo de los lados, no solo el de arriba.',
          '- **Ves 1 o 3 aristas con el amarillo arriba, o 3 esquinas:** con el F2L hecho, eso no puede pasar. Vuelve a contar, sin mirar el amarillo de los lados. Si sigue igual, hay una arista volteada o una esquina girada, por ejemplo porque el cubo se desarmó. Ponla bien a mano.',
          '- **Se rompió el F2L:** el algoritmo salió mal, con un giro de menos o al revés. Rehaz el par roto y repite el algoritmo despacio, gatillo por gatillo.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [
        {
          id: 'oll-cross',
          name: es('Paso 1 — Cruz amarilla'),
          // in the lessons it closes the phase's "Cómo se hace"
          description: es('En la cruz amarilla, si hay 2 aristas con el amarillo arriba en línea, es la Línea. Si hay 2 que forman una L con el centro, es la L. Si no hay ninguna, es el Punto.'),
          cases: ollCross,
        },
        {
          id: 'oll-corners',
          name: es('Paso 2 — Esquinas amarillas (OCLL)'),
          description: es('Cuenta las esquinas con el amarillo arriba:\n- **Ninguna:** H o Pi.\n- **Una:** Sune o Antisune.\n- **Dos:** el caso U, el T o el L.'),
          cases: ollCorners,
        },
      ],
      progression: es(
        [
          '- **Cruz:** aprende la Línea y la L el mismo día, y el Punto al siguiente.',
          '- **Esquinas:** Sune y Antisune → H y Pi → U, L y T. Aprende juntos los casos U y L: son inversos.',
          'En las esquinas, empieza por **Sune y Antisune**: salen mucho y comparten gatillos con el caso H.',
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
          '1. **Esquinas:** busca **faros**, 2 esquinas de un lado con el mismo color y la arista del medio de otro color. Un lado completo cuenta como faros. Luego haz su caso.',
          '2. **Aristas:** gira `U` hasta alinear las esquinas con sus centros y mira las aristas.',
          '3. Si hay un lado completo, gira el cubo entero hasta dejarlo atrás.',
          '4. Haz el caso de las aristas. Las esquinas siguen alineadas, así que el cubo queda resuelto.',
        ].join('\n'),
      ),
      tips: es(
        [
          '- **No ves faros:** mira los 4 lados, girando `U`. Si ninguno tiene faros ni está completo, es la Y-perm.',
          '- **Tras la T-perm, no puedes alinear las 4 esquinas:** seguramente no tenías los faros, o el lado completo, a la izquierda. Vuelve a mirar los 4 lados. Si uno tiene faros o está completo, ponlo a la izquierda y repite la T-perm. Si ninguno tiene faros ni está completo, haz la Y-perm.',
          '- **Hiciste Ua en vez de Ub, o al revés:** no se rompe nada, y el lado completo sigue atrás. Mira otra vez la arista del frente y haz el que toque.',
          '- **La arista del frente y la de la derecha están intercambiadas:** es la Z-perm, vista desde otro lado. Gira el cubo entero con `y` para verla como en su figura.',
        ].join('\n'),
      ),
      diagram: 'top',
      groups: [
        {
          id: 'pll-corners',
          name: es('Paso 1 — Esquinas'),
          description: es('Busca faros, o un lado completo, en los 4 lados. Si los hay en uno solo, es la T-perm. Si no los hay en ninguno, es la Y-perm. Si los hay en los 4, las esquinas ya están bien.'),
          cases: pllCorners,
        },
        {
          id: 'pll-edges',
          name: es('Paso 2 — Aristas'),
          description: es('Con las esquinas alineadas, busca un lado completo. Si lo hay, es Ua o Ub. Si no hay ninguno, es H o Z.'),
          cases: pllEdges,
        },
      ],
      progression: es(
        [
          'Orden: **T-perm → Y-perm → Ua y Ub juntos → H → Z**.',
          'Empieza por la T-perm, que es la que más sale. Aprende juntos Ua y Ub: son inversos.',
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

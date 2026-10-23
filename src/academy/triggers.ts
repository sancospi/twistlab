// "Gatillos" (/academia/gatillos): the short blocks that algorithms are built from, one card each with its 3D replay,
// its mirror and inverse, where it appears in the app's methods and a timed repetition drill (triggerView.ts).
// Pure (no DOM): seo.ts prerenders the page from it. Same frame as the rest of the Academia: yellow up, green front.
// Every claim in `does` and `tip` was checked with cubing.js (which pieces move; fingertricks.ts for the fingers);
// triggers.test.ts checks the periods and the mirrors.
import type { KPuzzle } from 'cubing/kpuzzle';
import type { Localized } from '../i18n.ts';
import { tokenize } from '../notation.ts';
import { allCases } from './methods.ts';
import type { Case, Method } from './types.ts';

const l = (es: string, en: string, pt: string): Localized => ({ es, en, pt });

export interface TriggerInfo {
  id: string;
  name: Localized; // the common name; English names (sexy move, Sune…) are used as is in Spanish too
  alg: string;
  does: Localized; // what it does to the cube, in plain words (inline rich text)
  tip: Localized; // which finger does each turn, from the home grip
  back?: string; // its front-back mirror, where it's used (the F2L inserts into the back slots)
}

export const triggerGuide = {
  name: l('Gatillos', 'Triggers', 'Gatilhos'),
  summary: l('Los bloques cortos de los que están hechos los algoritmos: sexy move, sledgehammer, Sune… Apréndelos como un solo gesto.', 'The short blocks algorithms are made of: sexy move, sledgehammer, Sune… Learn each one as a single gesture.', 'Os blocos curtos de que os algoritmos são feitos: sexy move, sledgehammer, Sune… Aprenda cada um como um só gesto.'),
  intro: l(
    [
      'Un **gatillo** es un bloque corto de giros que se repite en muchos algoritmos, como `R U R\' U\'`.',
      'Si lo haces como **un solo gesto**, un algoritmo de 14 giros pasa a ser 3 o 4 bloques: se aprende antes y sale más rápido.',
      '## Cómo practicarlos',
      'Repite cada uno hasta que salga sin pensar. Muchos **vuelven a resolver el cubo** tras unas repeticiones: así sabes si lo hiciste bien.',
      'Con **Practicar** cronometras repeticiones en tu cubo y guardas tus giros por segundo.',
    ].join('\n'),
    [
      'A **trigger** is a short block of moves that repeats in many algorithms, like `R U R\' U\'`.',
      'Done as **a single gesture**, a 14-move algorithm becomes 3 or 4 blocks: you learn it sooner and it comes out faster.',
      '## How to practice them',
      'Repeat each one until it flows without thinking. Many **bring the cube back to solved** after a few repetitions: that tells you whether you did it right.',
      'With **Practice** you time repetitions on your cube and save your turns per second.',
    ].join('\n'),
    [
      'Um **gatilho** é um bloco curto de movimentos que se repete em muitos algoritmos, como `R U R\' U\'`.',
      'Se você faz como **um só gesto**, um algoritmo de 14 movimentos vira 3 ou 4 blocos: você aprende antes e sai mais rápido.',
      '## Como praticar',
      'Repita cada um até sair sem pensar. Muitos **voltam a resolver o cubo** depois de algumas repetições: assim você sabe se fez certo.',
      'Com **Praticar** você cronometra repetições no seu cubo e salva seus movimentos por segundo.',
    ].join('\n'),
  ),
  triggers: [
    {
      id: 'sexy', name: l('Sexy move', 'Sexy move', 'Sexy move'), alg: "R U R' U'",
      does: l('El más común. Solo toca las caras `R` y `U`: mueve 3 aristas en ciclo y cambia 2 pares de esquinas. Está en el F2L, el OLL y el PLL.', 'The most common one. It only touches the `R` and `U` faces: it cycles 3 edges and swaps 2 pairs of corners. It shows up in F2L, OLL and PLL.', 'O mais comum. Só mexe nas faces `R` e `U`: move 3 arestas em ciclo e troca 2 pares de quinas. Está no F2L, na OLL e na PLL.'),
      tip: l('`R` y `R\'` con la muñeca derecha, `U` con el índice derecho y `U\'` con el índice izquierdo. Sin cambiar el agarre.', '`R` and `R\'` with the right wrist, `U` with the right index finger and `U\'` with the left index finger. No regrip.', '`R` e `R\'` com o pulso direito, `U` com o indicador direito e `U\'` com o indicador esquerdo. Sem trocar a pegada.'),
    },
    {
      id: 'sexy-inverso', name: l('Sexy inverso', 'Reverse sexy', 'Sexy inverso') /* as on the case pages (case.trigger.sexyInv) */, alg: "U R U' R'",
      does: l('La inversa del sexy move: deshace lo que hace. Mueve las mismas piezas en sentido contrario.', 'The inverse of the sexy move: it undoes it. It moves the same pieces the other way.', 'O inverso do sexy move: desfaz o que ele faz. Move as mesmas peças no sentido contrário.'),
      tip: l('`U` con el índice derecho, `R` con la muñeca, `U\'` con el índice izquierdo y `R\'` con la muñeca.', '`U` with the right index finger, `R` with the wrist, `U\'` with the left index finger and `R\'` with the wrist.', '`U` com o indicador direito, `R` com o pulso, `U\'` com o indicador esquerdo e `R\'` com o pulso.'),
    },
    {
      id: 'sexy-izquierdo', name: l('Sexy move izquierdo', 'Left sexy move', 'Sexy move esquerdo'), alg: "L' U' L U",
      does: l('El espejo del sexy move para la mano izquierda: lo mismo, del lado izquierdo (caras `L` y `U`).', 'The mirror of the sexy move for the left hand: the same, on the left side (`L` and `U` faces).', 'O espelho do sexy move para a mão esquerda: o mesmo, do lado esquerdo (faces `L` e `U`).'),
      tip: l('`L\'` y `L` con la muñeca izquierda, `U\'` con el índice izquierdo y `U` con el índice derecho.', '`L\'` and `L` with the left wrist, `U\'` with the left index finger and `U` with the right index finger.', '`L\'` e `L` com o pulso esquerdo, `U\'` com o indicador esquerdo e `U` com o indicador direito.'),
    },
    {
      id: 'sledgehammer', name: l('Sledgehammer', 'Sledgehammer', 'Sledgehammer'), alg: "R' F R F'",
      does: l('Solo gira las caras `R` y `F`: mueve 3 aristas en ciclo (2 quedan volteadas) y cambia 2 pares de esquinas. Aparece en el F2L, el OLL, el PLL y el CMLL.', 'It only turns the `R` and `F` faces: it cycles 3 edges (2 end up flipped) and swaps 2 pairs of corners. It shows up in F2L, OLL, PLL and CMLL.', 'Só gira as faces `R` e `F`: move 3 arestas em ciclo (2 ficam viradas) e troca 2 pares de quinas. Aparece no F2L, na OLL, na PLL e no CMLL.'),
      tip: l('`R\'` con la muñeca derecha, `F` con el índice derecho (tras `R\'` queda sobre `F`), `R` con la muñeca y `F\'` con el pulgar izquierdo.', '`R\'` with the right wrist, `F` with the right index finger (after `R\'` it rests on `F`), `R` with the wrist and `F\'` with the left thumb.', '`R\'` com o pulso direito, `F` com o indicador direito (depois de `R\'` ele fica sobre `F`), `R` com o pulso e `F\'` com o polegar esquerdo.'),
    },
    {
      id: 'hedgeslammer', name: l('Hedgeslammer', 'Hedgeslammer', 'Hedgeslammer'), alg: "F R' F' R",
      does: l('La inversa del sledgehammer: mueve las mismas piezas en sentido contrario.', 'The inverse of the sledgehammer: it moves the same pieces the other way.', 'O inverso do sledgehammer: move as mesmas peças no sentido contrário.'),
      tip: l('`F` con el índice derecho (cambia el agarre), `R\'` con la muñeca, `F\'` con el pulgar izquierdo y `R` con la muñeca.', '`F` with the right index finger (a regrip), `R\'` with the wrist, `F\'` with the left thumb and `R` with the wrist.', '`F` com o indicador direito (troca a pegada), `R\'` com o pulso, `F\'` com o polegar esquerdo e `R` com o pulso.'),
    },
    {
      id: 'insercion', name: l('Inserción R U R\'', 'R U R\' insert', 'Inserção R U R\''), alg: "R U R'", back: "R' U' R",
      does: l('El gatillo base del F2L: mete en el hueco de adelante a la derecha la esquina que está encima de él y la arista de atrás.', 'The basic F2L trigger: it puts the corner above the front-right slot and the back edge into that slot.', 'O gatilho básico do F2L: coloca no slot da frente à direita a quina que está em cima dele e a aresta de trás.'),
      tip: l('`R` con la muñeca derecha, `U` con el índice derecho y `R\'` con la muñeca.', '`R` with the right wrist, `U` with the right index finger and `R\'` with the wrist.', '`R` com o pulso direito, `U` com o indicador direito e `R\'` com o pulso.'),
    },
    {
      id: 'insercion-par', name: l('Inserción R U\' R\'', 'R U\' R\' insert', 'Inserção R U\' R\''), alg: "R U' R'", back: "R' U R",
      does: l('Mete en el hueco de adelante a la derecha el par ya unido que está arriba, adelante a la izquierda.', 'It puts the already-joined pair on top, front left, into the front-right slot.', 'Coloca no slot da frente à direita o par já unido que está em cima, na frente à esquerda.'),
      tip: l('`R` con la muñeca derecha, `U\'` con el índice izquierdo y `R\'` con la muñeca.', '`R` with the right wrist, `U\'` with the left index finger and `R\'` with the wrist.', '`R` com o pulso direito, `U\'` com o indicador esquerdo e `R\'` com o pulso.'),
    },
    {
      id: 'insercion-u2', name: l('Inserción R U2 R\'', 'R U2 R\' insert', 'Inserção R U2 R\''), alg: "R U2 R'", back: "R' U2 R",
      does: l('Cambia el par del hueco de adelante a la derecha por lo que está arriba atrás a la izquierda. Sirve para separar un par o prepararlo.', 'It swaps the pair in the front-right slot with what is on top at the back left. Useful to split a pair or set one up.', 'Troca o par do slot da frente à direita pelo que está em cima atrás à esquerda. Serve para separar um par ou prepará-lo.'),
      tip: l('`R` con la muñeca derecha, `U2` con el índice y el medio derechos y `R\'` con la muñeca.', '`R` with the right wrist, `U2` with the right index and middle fingers and `R\'` with the wrist.', '`R` com o pulso direito, `U2` com o indicador e o médio direitos e `R\'` com o pulso.'),
    },
    {
      id: 'sune', name: l('Sune', 'Sune', 'Sune'), alg: "R U R' U R U2 R'",
      does: l('Solo toca la última capa: gira 3 esquinas, cambia de sitio las 4 esquinas y mueve 3 aristas. Resuelve el caso Sune del OLL y es la base de muchos algoritmos de esquinas.', 'It only touches the last layer: it twists 3 corners, swaps all 4 corners around and moves 3 edges. It solves the Sune OLL case and is the base of many corner algorithms.', 'Só mexe na última camada: gira 3 quinas, troca de lugar as 4 quinas e move 3 arestas. Resolve o caso Sune da OLL e é a base de muitos algoritmos de quinas.'),
      tip: l('`R` y `R\'` con la muñeca derecha, cada `U` con el índice derecho y `U2` con el índice y el medio derechos.', '`R` and `R\'` with the right wrist, each `U` with the right index finger and `U2` with the right index and middle fingers.', '`R` e `R\'` com o pulso direito, cada `U` com o indicador direito e `U2` com o indicador e o médio direitos.'),
    },
    {
      id: 'antisune', name: l('Antisune', 'Antisune', 'Antisune'), alg: "R U2 R' U' R U' R'",
      does: l('La inversa del Sune: gira las 3 esquinas en el otro sentido. Resuelve el caso Antisune del OLL.', 'The inverse of the Sune: it twists the 3 corners the other way. It solves the Antisune OLL case.', 'O inverso do Sune: gira as 3 quinas no outro sentido. Resolve o caso Antisune da OLL.'),
      tip: l('`R` y `R\'` con la muñeca derecha, `U2` con el índice y el medio derechos y cada `U\'` con el índice izquierdo.', '`R` and `R\'` with the right wrist, `U2` with the right index and middle fingers and each `U\'` with the left index finger.', '`R` e `R\'` com o pulso direito, `U2` com o indicador e o médio direitos e cada `U\'` com o indicador esquerdo.'),
    },
    {
      id: 'f-sexy', name: l('F sexy F\'', 'F sexy F\'', 'F sexy F\''), alg: "F R U R' U' F'",
      does: l('Solo toca la última capa y voltea 2 aristas: con la línea amarilla horizontal (izquierda-derecha) hace la cruz. Es el paso de la cruz amarilla del método principiante.', 'It only touches the last layer and flips 2 edges: with the yellow line horizontal (left-right) it makes the cross. It is the yellow-cross step of the beginner method.', 'Só mexe na última camada e vira 2 arestas: com a linha amarela na horizontal (esquerda-direita) faz a cruz. É o passo da cruz amarela do método para iniciantes.'),
      tip: l('`F` con el índice derecho (cambia el agarre), el sexy move desde el agarre inicial y `F\'` con el pulgar izquierdo.', '`F` with the right index finger (a regrip), the sexy move from the home grip and `F\'` with the left thumb.', '`F` com o indicador direito (troca a pegada), o sexy move a partir da pegada inicial e `F\'` com o polegar esquerdo.'),
    },
    {
      id: 'f-ancho-sexy', name: l('f sexy f\'', 'f sexy f\'', 'f sexy f\''), alg: "f R U R' U' f'",
      does: l('Como el anterior, pero `f` mueve dos capas: con la L amarilla adelante y a la derecha, hace la cruz.', 'Like the previous one, but `f` moves two layers: with the yellow L at the front and right, it makes the cross.', 'Como o anterior, mas `f` move duas camadas: com o L amarelo na frente e à direita, faz a cruz.'),
      tip: l('`f` con el índice derecho (cambia el agarre), el sexy move desde el agarre inicial y `f\'` con el pulgar izquierdo.', '`f` with the right index finger (a regrip), the sexy move from the home grip and `f\'` with the left thumb.', '`f` com o indicador direito (troca a pegada), o sexy move a partir da pegada inicial e `f\'` com o polegar esquerdo.'),
    },
    {
      id: 'sexy-ancho', name: l('Sexy move ancho', 'Wide sexy move', 'Sexy move largo'), alg: "r U R' U'",
      does: l('El sexy move con `r` en vez de `R`: arrastra también la capa del medio, así que mueve centros y aristas de abajo. Aparece en el OLL y el COLL.', 'The sexy move with `r` instead of `R`: it also drags the middle layer, so it moves centers and bottom edges. It shows up in OLL and COLL.', 'O sexy move com `r` em vez de `R`: arrasta também a camada do meio, então move centros e arestas de baixo. Aparece na OLL e no COLL.'),
      tip: l('`r` y `R\'` con la muñeca derecha, `U` con el índice derecho y `U\'` con el índice izquierdo.', '`r` and `R\'` with the right wrist, `U` with the right index finger and `U\'` with the left index finger.', '`r` e `R\'` com o pulso direito, `U` com o indicador direito e `U\'` com o indicador esquerdo.'),
    },
  ] as TriggerInfo[],
};

/** Repetitions in a row that bring a solved cube back to solved (centers included: no whole-cube turn needed). */
export function period(kpuzzle: KPuzzle, alg: string): number {
  const solved = kpuzzle.defaultPattern();
  let p = solved;
  for (let n = 1; ; n++) if ((p = p.applyAlg(alg)).isIdentical(solved)) return n; // the cube's largest order is 1260
}

/** The drill's default repetitions: at least 6, and a whole number of periods, so the cube ends solved. */
export const drillReps = (period: number): number => Math.ceil(6 / period) * period;

/** Turns per second. */
export const tps = (moves: number, reps: number, ms: number): number => (moves * reps * 1000) / ms;

// One spelling per move: R2' is R2, Rw is r
const norm = (tok: string) => tok.replace("2'", '2').replace(/^([UDRLFB])w/, (_, f: string) => f.toLowerCase());
/** Whether the algorithm has the trigger's moves in a row, anywhere: a leading AUF or rotation is simply skipped over.
 *  ponytail: a leading U counts as part of a trigger (F2L's U R U' R' is the reverse sexy move); no last-layer case
 *  starts with an AUF that would make a false match. Strip the AUF per stage if one ever does. */
export function contains(alg: string, trigger: string): boolean {
  const have = tokenize(alg).map(norm);
  const want = tokenize(trigger).map(norm);
  return have.some((_, i) => want.every((tok, j) => have[i + j] === tok));
}

/** The cases whose main algorithm contains the trigger, grouped by method (methods without one are left out). */
export function appearsIn(trigger: string, methods: Method[]): { method: Method; cases: Case[] }[] {
  return methods.map((method) => ({ method, cases: allCases(method).filter((c) => contains(c.algs[0].alg, trigger)) }))
    .filter((x) => x.cases.length);
}

/** The best drill of a trigger: turns per second over `reps` repetitions in `ms`. */
export interface TriggerBest { tps: number; reps: number; ms: number; at: number }
export const BESTS_KEY = 'academy-triggers'; // academy-: in the backup and the account (backup-keys.js, sync.ts)

/** Per trigger id, its best drill; anything malformed in storage is dropped. */
export function parseBests(raw: unknown): Record<string, TriggerBest> {
  const out: Record<string, TriggerBest> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  for (const [id, b] of Object.entries(raw as Record<string, Partial<TriggerBest>>)) {
    if (b && num(b.tps) && num(b.reps) && num(b.ms) && num(b.at)) out[id] = { tps: b.tps!, reps: b.reps!, ms: b.ms!, at: b.at! };
  }
  return out;
}

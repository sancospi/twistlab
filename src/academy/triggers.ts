// "Gatillos" (/academia/gatillos): the short blocks that algorithms are built from, one card each: its moves, what it
// does in a line, a 3D replay and a timed repetition drill; folded, its mirror and inverse, the fingers and where it
// appears in the app's methods (triggerView.ts).
// Pure (no DOM): seo.ts prerenders the page from it. Same frame as the rest of the Academia: yellow up, green front.
// Every claim in `does` and `tip` was checked with cubing.js (which pieces move; fingertricks.ts for the fingers);
// triggers.test.ts checks the periods and the mirrors.
import type { KPuzzle } from 'cubing/kpuzzle';
import { tr, type Localized } from '../i18n.ts';
import { tokenize } from '../notation.ts';
import { allCases } from './methods.ts';
import { isRecord } from './store.ts';
import type { Case, Method } from './types.ts';

export interface TriggerInfo {
  id: string;
  name: Localized; // the common name; English names (sexy move, Sune…) are used as is in Spanish too
  alg: string;
  does: Localized; // what it's for, in one line of plain words (inline rich text)
  tip: Localized; // which finger does each turn, from the home grip
  back?: string; // its front-back mirror, where it's used (the F2L inserts into the back slots)
}

export const triggerGuide = {
  name: tr('Gatillos', 'Triggers', 'Gatilhos'),
  summary: tr('Los bloques cortos de los que están hechos los algoritmos: sexy move, sledgehammer, Sune… Apréndelos como un solo gesto.', 'The short blocks algorithms are made of: sexy move, sledgehammer, Sune… Learn each one as a single gesture.', 'Os blocos curtos de que os algoritmos são feitos: sexy move, sledgehammer, Sune… Aprenda cada um como um só gesto.'),
  intro: tr(
    [
      'Un **gatillo** es un bloque corto que se repite en muchos algoritmos, como `R U R\' U\'`.',
      'Hazlo como **un solo gesto**: un algoritmo de 14 giros pasa a ser 3 o 4 bloques. Se aprende antes y sale más rápido.',
      '## Cómo practicarlos',
      '- Repite cada uno hasta que salga sin pensar.',
      '- Muchos **vuelven a resolver el cubo** tras unas repeticiones: así compruebas que lo hiciste bien.',
      '- **Practicar** cronometra tus repeticiones y guarda tus giros por segundo.',
    ].join('\n'),
    [
      'A **trigger** is a short block that repeats in many algorithms, like `R U R\' U\'`.',
      'Do it as **a single gesture**: a 14-move algorithm becomes 3 or 4 blocks. You learn it sooner and it comes out faster.',
      '## How to practice them',
      '- Repeat each one until it flows without thinking.',
      '- Many **bring the cube back to solved** after a few repetitions: that\'s how you check you did it right.',
      '- **Practice** times your repetitions and saves your turns per second.',
    ].join('\n'),
    [
      'Um **gatilho** é um bloco curto que se repete em muitos algoritmos, como `R U R\' U\'`.',
      'Faça como **um só gesto**: um algoritmo de 14 movimentos vira 3 ou 4 blocos. Você aprende antes e sai mais rápido.',
      '## Como praticar',
      '- Repita cada um até sair sem pensar.',
      '- Muitos **voltam a resolver o cubo** depois de algumas repetições: assim você confere se fez certo.',
      '- **Praticar** cronometra suas repetições e salva seus movimentos por segundo.',
    ].join('\n'),
  ),
  triggers: [
    {
      id: 'sexy', name: tr('Sexy move', 'Sexy move', 'Sexy move'), alg: "R U R' U'",
      does: tr('El más común: está en el F2L, el OLL y el PLL.', 'The most common one: it\'s in F2L, OLL and PLL.', 'O mais comum: está no F2L, na OLL e na PLL.'),
      tip: tr('`R` y `R\'` con la muñeca derecha, `U` con el índice derecho y `U\'` con el índice izquierdo. Sin cambiar el agarre.', '`R` and `R\'` with the right wrist, `U` with the right index finger and `U\'` with the left index finger. No regrip.', '`R` e `R\'` com o pulso direito, `U` com o indicador direito e `U\'` com o indicador esquerdo. Sem trocar a pegada.'),
    },
    {
      id: 'sexy-inverso', name: tr('Sexy inverso', 'Reverse sexy', 'Sexy inverso') /* as on the case pages (case.trigger.sexyInv) */, alg: "U R U' R'",
      does: tr('Deshace el sexy move: mueve las mismas piezas, al revés.', 'It undoes the sexy move: the same pieces, the other way.', 'Desfaz o sexy move: move as mesmas peças, ao contrário.'),
      tip: tr('`U` con el índice derecho, `R` con la muñeca, `U\'` con el índice izquierdo y `R\'` con la muñeca.', '`U` with the right index finger, `R` with the wrist, `U\'` with the left index finger and `R\'` with the wrist.', '`U` com o indicador direito, `R` com o pulso, `U\'` com o indicador esquerdo e `R\'` com o pulso.'),
    },
    {
      id: 'sexy-izquierdo', name: tr('Sexy move izquierdo', 'Left sexy move', 'Sexy move esquerdo'), alg: "L' U' L U",
      does: tr('El sexy move con la mano izquierda, del lado izquierdo (caras `L` y `U`).', 'The sexy move with the left hand, on the left side (`L` and `U` faces).', 'O sexy move com a mão esquerda, do lado esquerdo (faces `L` e `U`).'),
      tip: tr('`L\'` y `L` con la muñeca izquierda, `U\'` con el índice izquierdo y `U` con el índice derecho.', '`L\'` and `L` with the left wrist, `U\'` with the left index finger and `U` with the right index finger.', '`L\'` e `L` com o pulso esquerdo, `U\'` com o indicador esquerdo e `U` com o indicador direito.'),
    },
    {
      id: 'sledgehammer', name: tr('Sledgehammer', 'Sledgehammer', 'Sledgehammer'), alg: "R' F R F'",
      does: tr('Gira solo `R` y `F`. Está en el F2L, el OLL, el PLL y el CMLL.', 'It only turns `R` and `F`. It\'s in F2L, OLL, PLL and CMLL.', 'Só gira `R` e `F`. Está no F2L, na OLL, na PLL e no CMLL.'),
      tip: tr('`R\'` con la muñeca derecha, `F` con el índice derecho (tras `R\'` queda sobre `F`), `R` con la muñeca y `F\'` con el pulgar izquierdo.', '`R\'` with the right wrist, `F` with the right index finger (after `R\'` it rests on `F`), `R` with the wrist and `F\'` with the left thumb.', '`R\'` com o pulso direito, `F` com o indicador direito (depois de `R\'` ele fica sobre `F`), `R` com o pulso e `F\'` com o polegar esquerdo.'),
    },
    {
      id: 'hedgeslammer', name: tr('Hedgeslammer', 'Hedgeslammer', 'Hedgeslammer'), alg: "F R' F' R",
      does: tr('Deshace el sledgehammer: mueve las mismas piezas, al revés.', 'It undoes the sledgehammer: the same pieces, the other way.', 'Desfaz o sledgehammer: move as mesmas peças, ao contrário.'),
      tip: tr('`F` con el índice derecho (cambia el agarre), `R\'` con la muñeca, `F\'` con el pulgar izquierdo y `R` con la muñeca.', '`F` with the right index finger (a regrip), `R\'` with the wrist, `F\'` with the left thumb and `R` with the wrist.', '`F` com o indicador direito (troca a pegada), `R\'` com o pulso, `F\'` com o polegar esquerdo e `R` com o pulso.'),
    },
    {
      id: 'insercion', name: tr('Inserción R U R\'', 'R U R\' insert', 'Inserção R U R\''), alg: "R U R'", back: "R' U' R",
      does: tr('La base del F2L: mete en el hueco de adelante a la derecha la esquina que tiene encima y la arista de atrás.', 'The basis of F2L: it puts the corner above the front-right slot and the back edge into that slot.', 'A base do F2L: coloca no slot da frente à direita a quina que está em cima dele e a aresta de trás.'),
      tip: tr('`R` con la muñeca derecha, `U` con el índice derecho y `R\'` con la muñeca.', '`R` with the right wrist, `U` with the right index finger and `R\'` with the wrist.', '`R` com o pulso direito, `U` com o indicador direito e `R\'` com o pulso.'),
    },
    {
      id: 'insercion-par', name: tr('Inserción R U\' R\'', 'R U\' R\' insert', 'Inserção R U\' R\''), alg: "R U' R'", back: "R' U R",
      does: tr('Mete en el hueco de adelante a la derecha el par ya unido que está arriba, adelante a la izquierda.', 'It puts the already-joined pair on top, front left, into the front-right slot.', 'Coloca no slot da frente à direita o par já unido que está em cima, na frente à esquerda.'),
      tip: tr('`R` con la muñeca derecha, `U\'` con el índice izquierdo y `R\'` con la muñeca.', '`R` with the right wrist, `U\'` with the left index finger and `R\'` with the wrist.', '`R` com o pulso direito, `U\'` com o indicador esquerdo e `R\'` com o pulso.'),
    },
    {
      id: 'insercion-u2', name: tr('Inserción R U2 R\'', 'R U2 R\' insert', 'Inserção R U2 R\''), alg: "R U2 R'", back: "R' U2 R",
      does: tr('Cambia el par del hueco de adelante a la derecha por lo que está arriba, atrás a la izquierda: separa o prepara un par.', 'It swaps the pair in the front-right slot with what is on top at the back left: it splits or sets up a pair.', 'Troca o par do slot da frente à direita pelo que está em cima, atrás à esquerda: separa ou prepara um par.'),
      tip: tr('`R` con la muñeca derecha, `U2` con el índice y el medio derechos y `R\'` con la muñeca.', '`R` with the right wrist, `U2` with the right index and middle fingers and `R\'` with the wrist.', '`R` com o pulso direito, `U2` com o indicador e o médio direitos e `R\'` com o pulso.'),
    },
    {
      id: 'sune', name: tr('Sune', 'Sune', 'Sune'), alg: "R U R' U R U2 R'",
      does: tr('Resuelve el caso Sune del OLL y es la base de muchos algoritmos de esquinas. Solo toca la última capa.', 'It solves the Sune OLL case and is the base of many corner algorithms. It only touches the last layer.', 'Resolve o caso Sune da OLL e é a base de muitos algoritmos de quinas. Só mexe na última camada.'),
      tip: tr('`R` y `R\'` con la muñeca derecha, cada `U` con el índice derecho y `U2` con el índice y el medio derechos.', '`R` and `R\'` with the right wrist, each `U` with the right index finger and `U2` with the right index and middle fingers.', '`R` e `R\'` com o pulso direito, cada `U` com o indicador direito e `U2` com o indicador e o médio direitos.'),
    },
    {
      id: 'antisune', name: tr('Antisune', 'Antisune', 'Antisune'), alg: "R U2 R' U' R U' R'",
      does: tr('Deshace el Sune: resuelve el caso Antisune del OLL.', 'It undoes the Sune: it solves the Antisune OLL case.', 'Desfaz o Sune: resolve o caso Antisune da OLL.'),
      tip: tr('`R` y `R\'` con la muñeca derecha, `U2` con el índice y el medio derechos y cada `U\'` con el índice izquierdo.', '`R` and `R\'` with the right wrist, `U2` with the right index and middle fingers and each `U\'` with the left index finger.', '`R` e `R\'` com o pulso direito, `U2` com o indicador e o médio direitos e cada `U\'` com o indicador esquerdo.'),
    },
    {
      id: 'f-sexy', name: tr('F sexy F\'', 'F sexy F\'', 'F sexy F\''), alg: "F R U R' U' F'",
      does: tr('Hace la cruz amarilla desde la línea horizontal (izquierda–derecha): el paso 4 del método principiante.', 'It makes the yellow cross from the horizontal line (left–right): step 4 of the beginner method.', 'Faz a cruz amarela a partir da linha horizontal (esquerda–direita): o passo 4 do método para iniciantes.'),
      tip: tr('`F` con el índice derecho (cambia el agarre), el sexy move desde el agarre inicial y `F\'` con el pulgar izquierdo.', '`F` with the right index finger (a regrip), the sexy move from the home grip and `F\'` with the left thumb.', '`F` com o indicador direito (troca a pegada), o sexy move a partir da pegada inicial e `F\'` com o polegar esquerdo.'),
    },
    {
      id: 'f-ancho-sexy', name: tr('f sexy f\'', 'f sexy f\'', 'f sexy f\''), alg: "f R U R' U' f'",
      does: tr('Como el anterior, con `f` (dos capas): hace la cruz amarilla desde la L, con la L adelante y a la derecha.', 'Like the previous one, with `f` (two layers): it makes the yellow cross from the L, with the L at the front and right.', 'Como o anterior, com `f` (duas camadas): faz a cruz amarela a partir do L, com o L na frente e à direita.'),
      tip: tr('`f` con el índice derecho (cambia el agarre), el sexy move desde el agarre inicial y `f\'` con el pulgar izquierdo.', '`f` with the right index finger (a regrip), the sexy move from the home grip and `f\'` with the left thumb.', '`f` com o indicador direito (troca a pegada), o sexy move a partir da pegada inicial e `f\'` com o polegar esquerdo.'),
    },
    {
      id: 'sexy-ancho', name: tr('Sexy move ancho', 'Wide sexy move', 'Sexy move largo'), alg: "r U R' U'",
      does: tr('El sexy move con `r`: también arrastra la capa del medio. Está en el OLL y el COLL.', 'The sexy move with `r`: it also drags the middle layer. It\'s in OLL and COLL.', 'O sexy move com `r`: também arrasta a camada do meio. Está na OLL e no COLL.'),
      tip: tr('`r` y `R\'` con la muñeca derecha, `U` con el índice derecho y `U\'` con el índice izquierdo.', '`r` and `R\'` with the right wrist, `U` with the right index finger and `U\'` with the left index finger.', '`r` e `R\'` com o pulso direito, `U` com o indicador direito e `U\'` com o indicador esquerdo.'),
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

/** The cases whose algorithm (`algOf`: the user's chosen one, the main one by default) contains the trigger, grouped by
 *  method (methods without one are left out). */
export function appearsIn(trigger: string, methods: Method[], algOf: (c: Case) => string = (c) => c.algs[0].alg): { method: Method; cases: Case[] }[] {
  return methods.map((method) => ({ method, cases: allCases(method).filter((c) => contains(algOf(c), trigger)) }))
    .filter((x) => x.cases.length);
}

/** The best drill of a trigger: turns per second over `reps` repetitions in `ms`. */
export interface TriggerBest { tps: number; reps: number; ms: number; at: number }
export const BESTS_KEY = 'academy-triggers'; // academy-: in the backup and the account (backup-keys.js, sync.ts)

/** Per trigger id, its best drill; anything malformed in storage is dropped. */
export function parseBests(raw: unknown): Record<string, TriggerBest> {
  const out: Record<string, TriggerBest> = {};
  if (!isRecord(raw)) return out;
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  for (const [id, b] of Object.entries(raw as Record<string, Partial<TriggerBest>>)) {
    if (b && num(b.tps) && num(b.reps) && num(b.ms) && num(b.at)) out[id] = { tps: b.tps!, reps: b.reps!, ms: b.ms!, at: b.at! };
  }
  return out;
}

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
  summary: tr('Los gatillos son los trozos cortos que se repiten en los algoritmos del cubo de Rubik: sexy move, sledgehammer, Sune… Aprende cada uno como un solo gesto.', 'Triggers are the short chunks that repeat in Rubik\'s cube algorithms: sexy move, sledgehammer, Sune… Learn each one as a single motion.', 'Os gatilhos são os trechos curtos que se repetem nos algoritmos do cubo mágico: sexy move, sledgehammer, Sune… Aprenda cada um como um só gesto.'),
  intro: tr(
    [
      'Un **gatillo** es una serie corta de giros, como `R U R\' U\'`, que aparece en muchos algoritmos.',
      'Haz cada gatillo como **un solo gesto**: así, un algoritmo de 14 giros se convierte en 3 o 4 trozos que memorizas con menos esfuerzo y haces más rápido.',
      'Cada tarjeta dice para qué sirve el gatillo, qué dedo hace cada giro («Ver dedos») y en qué casos aparece.',
      '## Cómo practicarlos',
      '- Empieza con el cubo resuelto y repite cada gatillo hasta que te salga sin pensar.',
      '- Si repites un gatillo las veces que indica su tarjeta, el cubo **vuelve a quedar resuelto**: así compruebas que lo hiciste bien.',
      '- El botón «Practicar» de cada tarjeta cronometra tus repeticiones y guarda tu mejor marca en giros por segundo.',
    ].join('\n'),
    [
      'A **trigger** is a short series of moves, like `R U R\' U\'`, that shows up in many algorithms.',
      'Do each trigger as **a single motion**: that way, a 14-move algorithm becomes 3 or 4 chunks that are easier to memorize and faster to do.',
      'Each card says what the trigger is for, which finger does each move ("Show fingers") and which cases it appears in.',
      '## How to practice them',
      '- Start with a solved cube and repeat each trigger until you can do it without thinking.',
      '- If you repeat a trigger as many times as its card says, the cube **is solved again**: that\'s how you check you did it right.',
      '- The "Practice" button on each card times your repetitions and saves your best score in turns per second.',
    ].join('\n'),
    [
      'Um **gatilho** é uma série curta de movimentos, como `R U R\' U\'`, que aparece em muitos algoritmos.',
      'Faça cada gatilho como **um só gesto**: assim, um algoritmo de 14 movimentos vira 3 ou 4 trechos que você memoriza com menos esforço e faz mais rápido.',
      'Cada cartão diz para que serve o gatilho, qual dedo faz cada movimento ("Ver dedos") e em que casos ele aparece.',
      '## Como praticar',
      '- Comece com o cubo resolvido e repita cada gatilho até conseguir fazê-lo sem pensar.',
      '- Se você repetir um gatilho quantas vezes o cartão indicar, o cubo **volta a ficar resolvido**: assim você confere se fez certo.',
      '- O botão "Praticar" de cada cartão cronometra suas repetições e salva sua melhor marca em movimentos por segundo.',
    ].join('\n'),
  ),
  triggers: [
    {
      id: 'sexy', name: tr('Sexy move', 'Sexy move', 'Sexy move'), alg: "R U R' U'",
      does: tr('Es el gatillo más conocido: aparece en el F2L, el OLL y el PLL.', 'It\'s the best-known trigger: it shows up in F2L, OLL and PLL.', 'É o gatilho mais conhecido: aparece no F2L, no OLL e no PLL.'),
      tip: tr('`R` y `R\'` con la muñeca derecha, `U` con el índice derecho y `U\'` con el índice izquierdo. No hace falta cambiar el agarre.', '`R` and `R\'` with the right wrist, `U` with the right index finger and `U\'` with the left index finger. You don\'t need to regrip.', '`R` e `R\'` com o pulso direito, `U` com o indicador direito e `U\'` com o indicador esquerdo. Não precisa trocar a pegada.'),
    },
    {
      id: 'sexy-inverso', name: tr('Sexy inverso', 'Reverse sexy', 'Sexy inverso') /* as on the case pages (case.trigger.sexyInv) */, alg: "U R U' R'",
      does: tr('Es el sexy move al revés, así que lo deshace. Aparece mucho en el F2L.', 'It\'s the sexy move in reverse, so it undoes it. It shows up a lot in F2L.', 'É o sexy move ao contrário, então o desfaz. Aparece muito no F2L.'),
      tip: tr('`U` con el índice derecho, `R` con la muñeca derecha, `U\'` con el índice izquierdo y `R\'` con la muñeca.', '`U` with the right index finger, `R` with the right wrist, `U\'` with the left index finger and `R\'` with the wrist.', '`U` com o indicador direito, `R` com o pulso direito, `U\'` com o indicador esquerdo e `R\'` com o pulso.'),
    },
    {
      id: 'sexy-izquierdo', name: tr('Sexy move izquierdo', 'Left sexy move', 'Sexy move esquerdo'), alg: "L' U' L U",
      does: tr('Es el sexy move hecho con la mano izquierda: sirve para trabajar a la izquierda sin girar el cubo entero.', 'It\'s the sexy move done with the left hand: it lets you work on the left without rotating the whole cube.', 'É o sexy move feito com a mão esquerda: serve para trabalhar à esquerda sem girar o cubo inteiro.'),
      tip: tr('`L\'` y `L` con la muñeca izquierda, `U\'` con el índice izquierdo y `U` con el índice derecho.', '`L\'` and `L` with the left wrist, `U\'` with the left index finger and `U` with the right index finger.', '`L\'` e `L` com o pulso esquerdo, `U\'` com o indicador esquerdo e `U` com o indicador direito.'),
    },
    {
      id: 'sledgehammer', name: tr('Sledgehammer', 'Sledgehammer', 'Sledgehammer'), alg: "R' F R F'",
      does: tr('Aparece en el F2L, el OLL y el PLL. Es muy común en el CMLL, el paso de Roux que resuelve las 4 esquinas de arriba.', 'It shows up in F2L, OLL and PLL. It\'s very common in CMLL, the Roux step that solves the 4 top corners.', 'Aparece no F2L, no OLL e no PLL. É muito comum no CMLL, o passo do Roux que resolve as 4 quinas de cima.'),
      tip: tr('`R\'` con la muñeca derecha, que deja el índice derecho sobre la cara de adelante. Luego, `F` con ese índice, `R` con la muñeca y `F\'` con el pulgar izquierdo.', '`R\'` with the right wrist, which leaves your right index finger on the front face. Then `F` with that finger, `R` with the wrist and `F\'` with the left thumb.', '`R\'` com o pulso direito, que deixa o indicador direito sobre a face da frente. Depois, `F` com esse indicador, `R` com o pulso e `F\'` com o polegar esquerdo.'),
    },
    {
      id: 'hedgeslammer', name: tr('Hedgeslammer', 'Hedgeslammer', 'Hedgeslammer'), alg: "F R' F' R",
      does: tr('Es el sledgehammer al revés, así que lo deshace. Aparece en el F2L, el OLL y el PLL.', 'It\'s the sledgehammer in reverse, so it undoes it. It shows up in F2L, OLL and PLL.', 'É o sledgehammer ao contrário, então o desfaz. Aparece no F2L, no OLL e no PLL.'),
      tip: tr('Recoloca la mano para hacer `F` con el índice derecho. Vuelve al agarre inicial para hacer `R\'` con la muñeca derecha, `F\'` con el pulgar izquierdo y `R` con la muñeca.', 'Regrip to do `F` with the right index finger. Go back to the home grip to do `R\'` with the right wrist, `F\'` with the left thumb and `R` with the wrist.', 'Reposicione a mão para fazer `F` com o indicador direito. Volte à pegada inicial para fazer `R\'` com o pulso direito, `F\'` com o polegar esquerdo e `R` com o pulso.'),
    },
    {
      id: 'insercion', name: tr('Inserción R U R′', 'R U R′ insert', 'Inserção R U R′'), alg: "R U R'", back: "R' U' R",
      does: tr('Es la base del F2L: mete en la ranura de adelante a la derecha la esquina que está justo encima y la arista que está arriba atrás.', 'It\'s the foundation of F2L: when the corner is right above the front-right slot and the edge is at the top back, it inserts both into that slot.', 'É a base do F2L: insere no slot da frente à direita a quina que está logo acima dele e a aresta que está em cima atrás.'),
      tip: tr('`R` con la muñeca derecha, `U` con el índice derecho y `R\'` con la muñeca.', '`R` with the right wrist, `U` with the right index finger and `R\'` with the wrist.', '`R` com o pulso direito, `U` com o indicador direito e `R\'` com o pulso.'),
    },
    {
      id: 'insercion-par', name: tr('Inserción R U′ R′', 'R U′ R′ insert', 'Inserção R U′ R′'), alg: "R U' R'", back: "R' U R",
      does: tr('Mete en la ranura de adelante a la derecha un par ya formado que está arriba adelante, con la esquina a la izquierda.', 'It inserts an already-formed pair into the front-right slot when the pair is at the top front, with its corner on the left.', 'Insere no slot da frente à direita um par já formado que está em cima na frente, com a quina à esquerda.'),
      tip: tr('`R` con la muñeca derecha, `U\'` con el índice izquierdo y `R\'` con la muñeca.', '`R` with the right wrist, `U\'` with the left index finger and `R\'` with the wrist.', '`R` com o pulso direito, `U\'` com o indicador esquerdo e `R\'` com o pulso.'),
    },
    {
      id: 'insercion-u2', name: tr('Inserción R U2 R′', 'R U2 R′ insert', 'Inserção R U2 R′'), alg: "R U2 R'", back: "R' U2 R",
      does: tr('Cambia las piezas de la ranura de adelante a la derecha por la esquina que está arriba, atrás a la izquierda, y la arista que está arriba a la izquierda. Sirve para separar un par mal formado o para preparar uno antes de meterlo.', 'It swaps the pieces in the front-right slot with the corner at the top back-left and the edge at the top left. Use it to split up a badly formed pair or to set one up before inserting it.', 'Troca as peças do slot da frente à direita pela quina que está em cima, atrás à esquerda, e pela aresta que está em cima à esquerda. Serve para separar um par mal formado ou para preparar um antes de inseri-lo.'),
      tip: tr('`R` con la muñeca derecha, `U2` con el índice y el medio derechos y `R\'` con la muñeca.', '`R` with the right wrist, `U2` with the right index and middle fingers and `R\'` with the wrist.', '`R` com o pulso direito, `U2` com o indicador e o médio direitos e `R\'` com o pulso.'),
    },
    {
      id: 'sune', name: tr('Sune', 'Sune', 'Sune'), alg: "R U R' U R U2 R'",
      does: tr('Resuelve el caso Sune del OLL y forma parte de muchos algoritmos para las esquinas de arriba. Solo mueve piezas de la capa de arriba. Con una `U` al final, es el paso 5 del Método principiante, que pone las aristas amarillas en su sitio.', 'It solves the Sune OLL case and is part of many algorithms for the top corners. It only moves pieces in the top layer. With a `U` at the end, it\'s step 5 of the Beginner method, which puts the yellow edges in place.', 'Resolve o caso Sune do OLL e faz parte de muitos algoritmos para as quinas de cima. Só move peças da camada de cima. Com um `U` no final, é o passo 5 do Método para iniciantes, que coloca as arestas amarelas no lugar.'),
      tip: tr('`R` y `R\'` con la muñeca derecha, cada `U` con el índice derecho y `U2` con el índice y el medio derechos.', '`R` and `R\'` with the right wrist, each `U` with the right index finger and `U2` with the right index and middle fingers.', '`R` e `R\'` com o pulso direito, cada `U` com o indicador direito e `U2` com o indicador e o médio direitos.'),
    },
    {
      id: 'antisune', name: tr('Antisune', 'Antisune', 'Antisune'), alg: "R U2 R' U' R U' R'",
      does: tr('Es el Sune al revés, así que lo deshace. Resuelve el caso Antisune del OLL.', 'It\'s Sune in reverse, so it undoes it. It solves the Antisune OLL case.', 'É o Sune ao contrário, então o desfaz. Resolve o caso Antisune do OLL.'),
      tip: tr('`R` y `R\'` con la muñeca derecha, `U2` con el índice y el medio derechos y cada `U\'` con el índice izquierdo.', '`R` and `R\'` with the right wrist, `U2` with the right index and middle fingers and each `U\'` with the left index finger.', '`R` e `R\'` com o pulso direito, `U2` com o indicador e o médio direitos e cada `U\'` com o indicador esquerdo.'),
    },
    {
      id: 'f-sexy', name: tr('F sexy F′', 'F sexy F′', 'F sexy F′'), alg: "F R U R' U' F'",
      does: tr('Hace la cruz amarilla cuando arriba hay una línea amarilla de izquierda a derecha. Es el paso 4 del Método principiante.', 'It makes the yellow cross when there\'s a yellow line on top, running from left to right. It\'s step 4 of the Beginner method.', 'Faz a cruz amarela quando há uma linha amarela em cima, da esquerda para a direita. É o passo 4 do Método para iniciantes.'),
      tip: tr('Recoloca la mano para hacer `F` con el índice derecho. Vuelve al agarre inicial para el sexy move y haz `F\'` con el pulgar izquierdo.', 'Regrip to do `F` with the right index finger. Go back to the home grip for the sexy move and do `F\'` with the left thumb.', 'Reposicione a mão para fazer `F` com o indicador direito. Volte à pegada inicial para o sexy move e faça `F\'` com o polegar esquerdo.'),
    },
    {
      id: 'f-ancho-sexy', name: tr('f sexy f′', 'f sexy f′', 'f sexy f′'), alg: "f R U R' U' f'",
      does: tr('Hace la cruz amarilla cuando arriba hay una L amarilla: gira `U` hasta que las aristas de la L queden arriba adelante y arriba a la derecha. Es como `F R U R\' U\' F\'`, pero con `f`, un giro de dos capas.', 'It makes the yellow cross when there\'s a yellow L on top: turn `U` until the L\'s edges are at the top front and top right. It\'s like `F R U R\' U\' F\'`, but with `f`, a wide move that turns two layers.', 'Faz a cruz amarela quando há um L amarelo em cima: gire `U` até as arestas do L ficarem em cima na frente e em cima à direita. É como `F R U R\' U\' F\'`, mas com `f`, um movimento de duas camadas.'),
      tip: tr('Recoloca la mano para hacer `f` con el índice derecho. Vuelve al agarre inicial para el sexy move y haz `f\'` con el pulgar izquierdo.', 'Regrip to do `f` with the right index finger. Go back to the home grip for the sexy move and do `f\'` with the left thumb.', 'Reposicione a mão para fazer `f` com o indicador direito. Volte à pegada inicial para o sexy move e faça `f\'` com o polegar esquerdo.'),
    },
    {
      id: 'sexy-ancho', name: tr('Sexy move ancho', 'Wide sexy move', 'Sexy move largo'), alg: "r U R' U'",
      does: tr('Es el sexy move, pero empieza con `r` en lugar de `R`. La `r` es un giro de dos capas: mueve a la vez la de la derecha y la del medio. Aparece en el OLL y en el COLL, que resuelve las 4 esquinas de arriba cuando la cruz amarilla ya está hecha.', 'It\'s the sexy move, but it starts with `r` instead of `R`. `r` is a wide move: it turns the right and middle layers together. It shows up in OLL and in COLL, which solves the 4 top corners when the yellow cross is already done.', 'É o sexy move, mas começa com `r` no lugar de `R`. O `r` é um movimento de duas camadas: gira ao mesmo tempo a da direita e a do meio. Aparece no OLL e no COLL, que resolve as 4 quinas de cima quando a cruz amarela já está feita.'),
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

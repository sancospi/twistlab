import { t, type MessageKey } from './i18n.ts';

// Cube notation -> face turns the smart cube can report. The cube only sees its six centers turn, so wide
// moves, slices and rotations become face turns plus a change of which center sits where (the frame).

export type Face = 'U' | 'D' | 'R' | 'L' | 'F' | 'B';
/** User-named face -> center (cube) face currently in that place. */
export type Frame = Readonly<Record<Face, Face>>;

export const IDENTITY: Frame = { U: 'U', D: 'D', R: 'R', L: 'L', F: 'F', B: 'B' };
/** The plan's frame (yellow up, green front) on a GAN cube (white U, green F): a z2 away. */
export const YELLOW_UP: Frame = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'F', B: 'B' };

export type Step = { token: string; moves: string[] };

type Axis = 'x' | 'y' | 'z';
// new[c[i]] = old[c[i+1]]: the face that ends up at c[i] is the one that was at c[i+1].
const CYCLES: Record<Axis, Face[]> = { x: ['U', 'F', 'D', 'B'], y: ['F', 'R', 'B', 'L'], z: ['U', 'L', 'D', 'R'] };

// One unit of each token in the user frame: face turns (with sign), then the rotation it implies.
const PARTS: Record<string, { turns: [Face, number][]; rot?: [Axis, number] }> = {
  U: { turns: [['U', 1]] }, D: { turns: [['D', 1]] }, R: { turns: [['R', 1]] },
  L: { turns: [['L', 1]] }, F: { turns: [['F', 1]] }, B: { turns: [['B', 1]] },
  r: { turns: [['L', 1]], rot: ['x', 1] }, l: { turns: [['R', 1]], rot: ['x', -1] },
  u: { turns: [['D', 1]], rot: ['y', 1] }, d: { turns: [['U', 1]], rot: ['y', -1] },
  f: { turns: [['B', 1]], rot: ['z', 1] }, b: { turns: [['F', 1]], rot: ['z', -1] },
  M: { turns: [['R', 1], ['L', -1]], rot: ['x', -1] },
  E: { turns: [['U', 1], ['D', -1]], rot: ['y', -1] },
  S: { turns: [['F', -1], ['B', 1]], rot: ['z', 1] },
  x: { turns: [], rot: ['x', 1] }, y: { turns: [], rot: ['y', 1] }, z: { turns: [], rot: ['z', 1] },
};

const TOKEN = /^([UDRLFB]w?|[udrlfbMESxyz])(2'?|'|)$/;
const mod4 = (n: number) => ((n % 4) + 4) % 4;
const SUFFIX = ['', '', '2', "'"];
const amountOf = (suffix: string) => (suffix === "'" ? 3 : suffix.startsWith('2') ? 2 : 1);
/** Clockwise quarter turns of a face turn: "R" 1, "R2" and "R2'" 2, "R'" 3. */
export const amount = (move: string): number => amountOf(move.slice(1));

/** Splits an algorithm into validated tokens; accepts the PDF's typographic primes. */
export function tokenize(alg: string): string[] {
  const tokens = alg.replace(/[′’‘`]/g, "'").trim().split(/\s+/).filter(Boolean);
  for (const tok of tokens) if (!TOKEN.test(tok)) throw new Error(`bad move "${tok}" in "${alg}"`);
  return tokens;
}

export function invertTokens(tokens: string[]): string[] {
  return [...tokens].reverse().map((tok) => {
    const [, base, suffix] = tok.match(TOKEN)!;
    return base + (suffix === '' ? "'" : suffix === "'" ? '' : '2');
  });
}

/** Face turn in user names -> the center turn it is on the cube. */
export const mapMove = (move: string, frame: Frame): string => frame[move[0] as Face] + move.slice(1);

/** Center turn -> what the user calls it while holding the cube in `frame` (inverse of mapMove). */
export const unmapMove = (move: string, frame: Frame): string =>
  (Object.keys(frame) as Face[]).find((f) => frame[f] === move[0])! + move.slice(1);

function rotate(frame: Frame, axis: Axis, times: number): Frame {
  let f = frame;
  for (let i = 0; i < mod4(times); i++) {
    const c = CYCLES[axis];
    const next: Record<Face, Face> = { ...f };
    c.forEach((face, j) => (next[face] = f[c[(j + 1) % 4]]));
    f = next;
  }
  return f;
}

export function expand(alg: string | string[], frame0: Frame): { steps: Step[]; frame: Frame } {
  const tokens = typeof alg === 'string' ? tokenize(alg) : alg;
  let frame = frame0;
  const steps = tokens.map((token) => {
    const [, base, suffix] = token.match(TOKEN) ?? [];
    if (!base) throw new Error(`bad move "${token}"`);
    const k = amountOf(suffix);
    const part = PARTS[base.endsWith('w') ? base[0].toLowerCase() : base];
    const moves = part.turns.map(([face, sign]) => frame[face] + SUFFIX[mod4(sign * k)]);
    if (part.rot) frame = rotate(frame, part.rot[0], part.rot[1] * k);
    return { token, moves };
  });
  return { steps, frame };
}

export const centerMoves = (alg: string | string[], frame0: Frame): string[] =>
  expand(alg, frame0).steps.flatMap((s) => s.moves);

const AXIS: Record<string, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };

/** Merges consecutive turns on one axis ("U U'" vanishes, "R R" is "R2", "R L R L" is "R2 L2"): opposite
 *  faces commute, and the cube reports a physical slice turn as its two faces' quarter turns, interleaved. */
export function merge(moves: string[]): string[] {
  const stack: Map<string, number>[] = []; // runs of same-axis turns: face -> quarter turns, mod 4
  for (const m of moves) {
    let run = stack.at(-1);
    if (!run || AXIS[run.keys().next().value!] !== AXIS[m[0]]) stack.push((run = new Map()));
    const n = mod4((run.get(m[0]) ?? 0) + amount(m));
    if (n) run.set(m[0], n);
    else run.delete(m[0]);
    if (!run.size) stack.pop(); // the run cancelled out: the next turn may merge with the one before it
  }
  return stack.flatMap((run) => [...run].map(([face, n]) => face + SUFFIX[n]));
}

/** What a person did, compacted run by run (turns on one axis in a row), face by face: when a face got just the
 *  quarter turns its net turn needs, it shows as that turn ("R R" is "R2"; a slice reported as "R L R L" is
 *  "R2 L2"); when it got more (a slip and its undo, "R R R" for "R'"), its turns stay as they were made.
 *  Unlike merge(), nothing cancels across other turns: a detour like "F U F' F U' F'" counts in full. */
export function compact(moves: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < moves.length; ) {
    let j = i;
    while (j < moves.length && AXIS[moves[j][0]] === AXIS[moves[i][0]]) j++;
    const run = moves.slice(i, j);
    for (const face of new Set(run.map((m) => m[0]))) {
      const turns = run.filter((m) => m[0] === face);
      const net = mod4(turns.reduce((n, m) => n + amount(m), 0));
      const quarters = turns.reduce((n, m) => n + Math.abs(amount(m) === 3 ? 1 : amount(m)), 0);
      const needed = net === 2 ? 2 : net === 0 ? 0 : 1;
      out.push(...(quarters === needed ? [face + SUFFIX[net]] : turns)); // net 0 with no turns can't happen here
    }
    i = j;
  }
  return out;
}

/** Turns made, by compact(): the user-side counterpart of htm() (equal to it for an algorithm). */
export const turnCount = (moves: string[]): number => compact(moves).length;

/** Half-turn metric, after merging. */
export const htm = (moves: string[]): number => merge(moves).length;

// --- Explaining a move to a person (tooltips) ---

/** Which kind of move a token is, and the face its direction is read from ("as L" for M, "as R" for x…). */
function moveKind(token: string): { kind: 'face' | 'wide' | 'slice' | 'rotation'; ref: Face; base: string } {
  const m = TOKEN.exec(token);
  if (!m) throw new Error(`bad move "${token}"`);
  const base = m[1];
  if (/^[UDRLFB]$/.test(base)) return { kind: 'face', ref: base as Face, base };
  if (/^[UDRLFB]w$|^[udrlfb]$/.test(base)) return { kind: 'wide', ref: base[0].toUpperCase() as Face, base };
  if ('MES'.includes(base)) return { kind: 'slice', ref: ({ M: 'L', E: 'D', S: 'F' } as const)[base as 'M' | 'E' | 'S'], base };
  return { kind: 'rotation', ref: ({ x: 'R', y: 'U', z: 'F' } as const)[base as 'x' | 'y' | 'z'], base };
}

/** What turns and which way, in words: "Cara derecha · 1 capa" / "Horario, mirando la cara derecha de frente". */
export function explainMove(token: string): { what: string; how: string } {
  const { kind, ref, base } = moveKind(token);
  const face = t(`notation.faceName.${ref}` as MessageKey);
  const what = kind === 'face' ? t('notation.face', { face })
    : kind === 'wide' ? t('notation.wide', { face })
    : kind === 'slice' ? t(`notation.slice.${base}` as MessageKey)
    : t('notation.rotation', { move: ref });
  const turns = amount(`X${token.slice(base.length)}`);
  const how = turns === 2 ? t('notation.half') : t(turns === 1 ? 'notation.cw' : 'notation.ccw', { face });
  return { what, how };
}

/** Camera (degrees) that faces the turning layer: the default front-right-up view hides L, D and B. */
export function moveCamera(token: string): { latitude: number; longitude: number } {
  const { kind, ref } = moveKind(token);
  if (kind === 'slice' || kind === 'rotation') return { latitude: 30, longitude: 30 };
  return { latitude: ref === 'D' ? -30 : 30, longitude: ref === 'L' ? -30 : ref === 'B' ? 150 : 30 };
}

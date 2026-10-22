// The case pages' facts computed in the simulator (the inverse and mirror cases) and the algorithm library's search
// and filters. Pure: caseView.ts draws them.
import type { KPuzzle } from 'cubing/kpuzzle';
import { loc } from '../i18n.ts';
import { IDENTITY, centerMoves, invertTokens, mirrorTokens, tokenize } from '../notation.ts';
import { caseState } from './cube.ts';
import { aufFor } from './score.ts';
import { isDue, learnStatus, type Learning } from './store.ts';
import { puzzleOf, type Case, type Group, type Method, type Phase, type Puzzle, type Stage } from './types.ts';

/** The first of `among` that `tokens` solves (with an AUF before, like every algorithm here). */
const solvedBy = (kpuzzle: KPuzzle, tokens: string[], among: Case[]): Case | undefined =>
  among.find((x) => aufFor(x, tokens.join(' '), caseState(kpuzzle, x.algs[0].alg, IDENTITY)) !== null);

/** `c` first: when the algorithm solves the case itself, that's the answer. */
const selfFirst = (c: Case, among: Case[]) => [c, ...among.filter((x) => x !== c)];

/** The case the algorithm undone solves: the state the algorithm leaves on a solved cube. */
export const inverseCase = (kpuzzle: KPuzzle, c: Case, alg: string, among: Case[]): Case | undefined =>
  solvedBy(kpuzzle, invertTokens(centerMoves(alg, IDENTITY)), selfFirst(c, among));

/** The case the L<->R mirrored algorithm solves. A y before it is allowed: the mirror of a front-right slot case is a
 *  front-left one, which a y brings to the front-right. */
export function mirrorCase(kpuzzle: KPuzzle, c: Case, alg: string, among: Case[]): Case | undefined {
  const mirrored = mirrorTokens(tokenize(alg));
  for (const y of [[], ['y'], ["y'"], ['y2']]) {
    const x = solvedBy(kpuzzle, [...y, ...mirrored], selfFirst(c, among));
    if (x) return x;
  }
  return undefined;
}

// --- Library: search and filters ---

export type CaseSet = 'f2l' | 'oll' | 'pll' | 'coll' | 'roux' | 'cmll' | 'lse' | 'pbl' | 'beginner'; // roux: its blocks
export type CaseStatus = 'new' | 'learning' | 'known' | 'due';
export const SETS: CaseSet[] = ['f2l', 'oll', 'pll', 'coll', 'roux', 'cmll', 'lse', 'pbl', 'beginner'];
export const PUZZLES: Puzzle[] = ['3x3x3', '2x2x2'];
export const STATUSES: CaseStatus[] = ['new', 'learning', 'known', 'due'];

/** The set a case's algorithm belongs to, by what it solves (the beginner's yellow cross is the OLL's first look). */
export function caseSet(stage: Stage): CaseSet {
  switch (stage) {
    case 'f2l': return 'f2l';
    case 'oll-cross': case 'oll-corners': case '2x2-oll': return 'oll';
    case '2x2-pbl': return 'pbl';
    case 'pll-corners': case 'pll-edges': return 'pll';
    case 'coll': return 'coll';
    case 'roux-fb': case 'roux-sb': return 'roux';
    case 'cmll': return 'cmll';
    case 'lse-eo': case 'lse-ulur': case 'lse-4c': return 'lse';
    case 'first-layer': case 'second-layer': case 'll-edges': case 'll-corners-placed': case 'll-corners-twist':
    case '2x2-first-layer': case '2x2-first-face': case '2x2-ll-corners': return 'beginner';
    default: { const unlisted: never = stage; return unlisted; } // a new Stage: pick its set here (tsc fails until then)
  }
}

export interface LibraryFilter {
  query: string;
  puzzle: Puzzle | '';
  set: CaseSet | '';
  status: CaseStatus | '';
}

/** Lower case, no accents, typographic primes as ': "Relámpago" is found as "relampago", R′ as R'. */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[′’‘´`]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();

/** An algorithm as space-separated tokens, case kept (r is not R), typographic primes as '. */
const algText = (s: string) => s.replace(/[′’‘´`]/g, "'").replace(/\s+/g, ' ').trim();

/** Whether a case passes the filter. The query matches an algorithm by whole moves ("R U R'", the last one may be
 *  unfinished), or else every word the code exactly or the start of a word of the name or recognition text (a word
 *  of 1-2 letters, a whole word). `algs`: the case's algorithms, the user's own included. */
export function matches(c: Case, algs: string[], f: LibraryFilter, learning: Learning | undefined, now: number): boolean {
  if (f.puzzle && puzzleOf(c.stage) !== f.puzzle) return false;
  if (f.set && caseSet(c.stage) !== f.set) return false;
  if (f.status && (f.status === 'due' ? !isDue(learning, now) : learnStatus(learning) !== f.status)) return false;
  const q = fold(f.query);
  if (!q) return true;
  const qa = algText(f.query);
  if (algs.some((a) => (' ' + algText(a)).includes(' ' + qa))) return true;
  const code = fold(c.code);
  const text = ' ' + fold([loc(c.name), loc(c.recognition)].join(' ')).replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  return q.split(' ').every((w) => w === code || text.includes(w.length < 3 ? ` ${w} ` : ` ${w}`));
}

// --- Library: what's listed and how it's grouped ---

/** method: method -> phase -> group, as the methods teach them; set: F2L / OLL / PLL / beginner, across methods. */
export type GroupBy = 'method' | 'set';
export const GROUP_BYS: GroupBy[] = ['method', 'set'];

/** A case as listed: under its method (the same set's cases of two methods are both listed, each with its method). */
export interface Entry { method: Method; phase: Phase; group: Group; c: Case }

/** Every case of `methods`, only the method with id `method` when given, in their order. */
export const libraryEntries = (methods: Method[], method: string): Entry[] =>
  methods.filter((m) => !method || m.id === method).flatMap((m) =>
    m.phases.flatMap((phase) => phase.groups.flatMap((group) => group.cases.map((c) => ({ method: m, phase, group, c })))));

/** The entries by set, in SETS' order, without empty sets; inside, the methods' order. */
export const bySet = (entries: Entry[]): { set: CaseSet; entries: Entry[] }[] =>
  SETS.map((set) => ({ set, entries: entries.filter((e) => caseSet(e.c.stage) === set) })).filter((s) => s.entries.length);

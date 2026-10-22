// Academy data model: methods -> phases -> groups -> cases, each case with several ways to solve it.
// Algorithms and setups are written in the plan's frame (yellow up, green front) with ASCII primes.
import type { Localized } from '../i18n.ts';

/**
 * What a case's algorithm achieves; decides the goal check, the quiz states and the diagram.
 * - first-layer: the face opposite the last layer (white) solved, nothing else matters
 * - f2l / second-layer: the first two layers solved (second-layer: the beginner's middle-layer edges)
 * - oll-cross: + last-layer edges oriented; oll-corners: + everything oriented
 * - pll-corners: + corners home after some U turn; pll-edges: everything solved after some U turn
 * - ll-edges: first two layers + last-layer edges home and oriented after some U turn (corners anything)
 * - ll-corners-placed: ll-edges + last-layer corners in their slots (any orientation), after the same U turn
 * - ll-corners-twist: everything solved after some U turn (the beginner's R' D' R D twists)
 */
export type Stage =
  | 'first-layer' | 'second-layer' | 'f2l' | 'oll-cross' | 'oll-corners' | 'pll-corners' | 'pll-edges'
  | 'll-edges' | 'll-corners-placed' | 'll-corners-twist' | Stage2x2;

/**
 * The 2x2's stages. A 2x2 is the corners of a 3x3, so its states are 3x3 states with the edges ignored; with no
 * centers, its goals hold up to a turn of the whole cube (cube.ts checks them with the white-blue-red corner at DLB,
 * white down: yellow up and green front, like the 3x3).
 * - 2x2-first-layer: the 4 white corners on the bottom, each one in place relative to the others
 * - 2x2-first-face: the 4 white stickers on the bottom face, the corners in any order (Ortega)
 * - 2x2-oll: + the top face all yellow
 * - 2x2-pbl: both layers solved after some U and some D turn (Ortega's PBL)
 * - 2x2-ll-corners: everything solved after some U turn (the beginner's last step)
 */
export type Stage2x2 = '2x2-first-layer' | '2x2-first-face' | '2x2-oll' | '2x2-pbl' | '2x2-ll-corners';

export type Puzzle = '3x3x3' | '2x2x2'; // cubing.js's names (TwistyPlayer, kpuzzles)
export const is2x2 = (stage: Stage): stage is Stage2x2 => stage.startsWith('2x2-');
export const puzzleOf = (stage: Stage): Puzzle => (is2x2(stage) ? '2x2x2' : '3x3x3');

export type AlgSource = 'speedcubedb' | 'plan-b' | 'community' | 'custom'; // custom: the user's own, kept in store.ts

export interface AlgVariant {
  id: string;
  alg: string;
  source: AlgSource;
  rank?: number; // position on SpeedCubeDB's list for this case, when it comes from there
  note?: Localized;
}

export interface SpeedCubeDbRef {
  set: 'F2L' | 'OLL' | 'PLL';
  id: string;
  url: string;
}

export interface Case {
  id: string; // stable, e.g. 'cfop-f2l-a1'
  code: string; // short label for cards: 'A1', 'Sune', 'T'
  name: Localized;
  recognition: Localized;
  stage: Stage;
  algs: AlgVariant[]; // [0] = main (#1 on SpeedCubeDB in the plan), then plan B, then alternatives
  setup: string; // the plan's scramble, from solved
  scdb: SpeedCubeDbRef | null; // null for combinations (e.g. Punto = Línea + L)
  note?: Localized;
}

export interface Group {
  id: string;
  name: Localized;
  description?: Localized;
  cases: Case[];
}

export interface QuizItem {
  scramble: string;
  answer: string; // case id
}

export interface OfficialQuiz {
  id: string;
  name: Localized;
  instructions: Localized;
  items: QuizItem[];
}

export interface Phase {
  id: string;
  name: Localized;
  description?: Localized;
  diagram: 'iso' | 'top';
  groups: Group[];
  progression?: Localized;
  quizzes: OfficialQuiz[];
}

export interface Method {
  id: string;
  puzzle?: Puzzle; // default 3x3x3; every case's stage is of this puzzle
  name: Localized;
  summary?: Localized; // one or two lines for its tile on the Academia home
  description: Localized;
  orientation: Localized;
  notation?: Localized; // how to read the algorithms
  schedule?: Localized; // the plan's calendar and the goals to reach
  phases: Phase[];
}

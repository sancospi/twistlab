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
  | 'll-edges' | 'll-corners-placed' | 'll-corners-twist';

export type AlgSource = 'speedcubedb' | 'plan-b' | 'community';

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
  name: Localized;
  summary?: Localized; // one or two lines for its tile on the Academia home
  description: Localized;
  orientation: Localized;
  notation?: Localized; // how to read the algorithms
  schedule?: Localized; // the plan's calendar and the goals to reach
  phases: Phase[];
}

// Lessons: an optional way through a guide, one idea per step. Built from the guides' own data (no second copy of
// the texts): Notación from the glossary's moves, La cruz blanca from crossGuide.ts, Método principiante from
// beginner.ts. Pure (no DOM): lessonView.ts plays them, view.ts lists them.
import { loc, t, type MessageKey } from '../i18n.ts';
import { explainMove, invertTokens, tokenize } from '../notation.ts';
import { beginner } from './beginner.ts';
import { crossGuide } from './crossGuide.ts';
import type { Case, Stage } from './types.ts';

export type LessonStep =
  | { kind: 'text'; title?: string; text: string } // text: rich text (rich-text.ts)
  // the cube at `setup` (from solved, yellow up), then `alg`; doSetup: "on my cube" does the setup first
  | { kind: 'cube'; title?: string; text: string; setup: string; alg: string; doSetup: boolean; stage?: Stage }
  | { kind: 'move'; move: string; choices: string[] } // "¿Qué giro hizo el cubo?"
  | { kind: 'case'; caseId: string; alg: string; stage: Stage; diagram: 'iso' | 'top'; choices: { id: string; label: string }[] }; // "¿Qué caso es?"

export interface Lesson {
  id: string;
  title: string;
  steps: LessonStep[];
}

export interface Course {
  id: string; // the guide's URL segment: lessons live at /academia/<id>/leccion/<lesson id>
  title: string;
  lessons: Lesson[];
}

/** The glossary's moves, by kind (view.ts lists them; the Notación lessons teach them). */
export const MOVE_GROUPS: { key: string; slug: string; bases: string[] }[] = [
  { key: 'faces', slug: 'caras', bases: ['U', 'D', 'R', 'L', 'F', 'B'] },
  { key: 'wide', slug: 'dos-capas', bases: ['r', 'l', 'u', 'd', 'f', 'b'] },
  { key: 'slices', slug: 'capas-del-medio', bases: ['M', 'E', 'S'] },
  { key: 'rotations', slug: 'todo-el-cubo', bases: ['x', 'y', 'z'] },
];

/**
 * A guide text cut into steps, one idea each: a "## " subheading and everything under it is one step (its title);
 * outside subheadings, consecutive paragraphs share one, a numbered list or one led in by "…:" stays whole with what
 * leads into it (its points refer to each other: "sigues desde el punto 1"), and each other list item is a step.
 */
export function splitSteps(body: string): { title?: string; text: string }[] {
  const out: { title?: string; text: string }[] = [];
  let paragraphs: string[] = [];
  let whole = false; // paragraphs ends in a list kept whole
  let section: { title: string; text: string } | null = null;
  const flush = () => {
    if (paragraphs.length) out.push({ text: paragraphs.join('\n') });
    paragraphs = [];
    whole = false;
  };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const heading = /^##\s+(.*)$/.exec(line);
    const item = /^(?:[-•]|\d+[.)])\s+(.*)$/.exec(line);
    const ledIn = !!paragraphs.at(-1)?.endsWith(':');
    if (heading) {
      flush();
      out.push((section = { title: heading[1], text: '' }));
    } else if (section) section.text += (section.text ? '\n' : '') + line;
    else if (item && (whole || ledIn || /^\d/.test(line))) {
      if (!whole && !ledIn) flush();
      paragraphs.push(line);
      whole = true;
    } else if (item) {
      flush();
      out.push({ text: item[1] });
    } else {
      if (whole) flush();
      paragraphs.push(line);
    }
  }
  flush();
  return out;
}

// Rough reading/doing time per step, for the "~n min" of the list.
const SECONDS: Record<LessonStep['kind'], number> = { text: 20, cube: 30, move: 15, case: 15 };
export const minutes = (l: Lesson): number => Math.max(1, Math.round(l.steps.reduce((s, x) => s + SECONDS[x.kind], 0) / 60));

const text = (s: { title?: string; text: string }): LessonStep => ({ kind: 'text', ...s });

// --- Notación: per kind of move, the note, each move on the cube, then "which move was it?" ---

/** Question i of a group: a move and 4 choices that differ in direction or face (sorted: the order gives nothing away). */
export function moveQuestion(bases: string[], i: number): LessonStep {
  const SUFFIXES = ["'", '2', ''];
  const at = (2 * i + 1) % bases.length;
  const suffix = SUFFIXES[i % 3];
  const base = bases[at];
  const choices = [base, `${base}'`, `${base}2`, bases[(at + 1) % bases.length] + suffix];
  return { kind: 'move', move: base + suffix, choices: choices.sort() };
}

function notationLessons(): Lesson[] {
  const g = (key: string) => t(`glossary.${key}` as MessageKey);
  return MOVE_GROUPS.map(({ key, slug, bases }) => {
    // the first move of the group also shows its ′ and 2 versions; the note says it for the rest
    const moves = [bases[0], `${bases[0]}'`, `${bases[0]}2`, ...bases.slice(1)];
    return {
      id: slug,
      title: g(key),
      steps: [
        text({ title: g(key), text: g(`${key}Note`) }),
        ...moves.map((move): LessonStep => {
          const { what, how } = explainMove(move);
          return { kind: 'cube', title: move, text: `**${what}.** ${how}.`, setup: '', alg: move, doSetup: false };
        }),
        ...[0, 1, 2].map((i) => moveQuestion(bases, i)),
      ],
    };
  });
}

// --- La cruz blanca: each lesson's text, then its examples on the cube (the scramble, then the solution) ---

function crossLessons(): Lesson[] {
  return crossGuide.lessons.map((l) => ({
    id: l.id,
    title: loc(l.title),
    steps: [
      ...splitSteps(loc(l.body)).map(text),
      ...(l.examples ?? []).map((x): LessonStep => ({ kind: 'cube', text: loc(x.caption), setup: x.setup, alg: x.solution, doSetup: true })),
    ],
  }));
}

// --- Método principiante: how to hold it, then per phase its goal and method, each case with its algorithm,
// and "which case is it?" ---

const caseTitle = (c: Case) => (loc(c.name) === c.code ? c.code : `${c.code} · ${loc(c.name)}`);

/** Up to 4 choices for a case among its phase's: all of them, or the case and the 3 after it (in phase order). */
export function caseChoices(cases: Case[], answer: number): Case[] {
  if (cases.length <= 4) return cases;
  const picked = new Set([0, 1, 2, 3].map((k) => (answer + k) % cases.length));
  return cases.filter((_, i) => picked.has(i));
}

/** `algOf`: the algorithm shown for a case (the user's chosen one, in the app). */
function beginnerLessons(algOf: (c: Case) => string): Lesson[] {
  const hold: Lesson = {
    id: 'sostener',
    title: t('lesson.hold'),
    steps: [...splitSteps(loc(beginner.orientation)), ...splitSteps(beginner.notation ? loc(beginner.notation) : '')].map(text),
  };
  return [hold, ...beginner.phases.map((phase): Lesson => {
    const cases = phase.groups.flatMap((g) => g.cases);
    const n = cases.length;
    const asked = [...new Set([n - 1, Math.floor((n - 1) / 2)])].filter((i) => i >= 0); // two spread out, if there are two
    return {
      id: phase.id.replace(/^prin-/, ''),
      title: loc(phase.name),
      steps: [
        ...splitSteps(phase.description ? loc(phase.description) : '').map(text),
        ...cases.map((c): LessonStep => {
          const alg = algOf(c);
          const text = [`**${t('practice.recognition')}:** ${loc(c.recognition)}`, ...(c.note ? [loc(c.note)] : [])].join('\n');
          return { kind: 'cube', title: caseTitle(c), text, setup: invertTokens(tokenize(alg)).join(' '), alg, doSetup: false, stage: c.stage };
        }),
        ...asked.map((i): LessonStep => ({
          kind: 'case', caseId: cases[i].id, alg: algOf(cases[i]), stage: cases[i].stage, diagram: phase.diagram,
          choices: caseChoices(cases, i).map((c) => ({ id: c.id, label: c.code })),
        })),
      ],
    };
  })];
}

/** The lessons of a guide (by its URL segment), or null when it has none (yet). */
export function courseFor(id: string, algOf: (c: Case) => string = (c) => c.algs[0].alg): Course | null {
  if (id === 'notacion') return { id, title: t('glossary.title'), lessons: notationLessons() };
  if (id === crossGuide.id) return { id, title: t('cross.title'), lessons: crossLessons() };
  if (id === beginner.id) return { id, title: loc(beginner.name), lessons: beginnerLessons(algOf) };
  return null;
}

// --- Progress: the lessons finished, per course ---

/** Per course, the ids of the finished lessons; anything malformed in storage is dropped. */
export function parseDone(raw: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [course, ids] of Object.entries(raw)) {
    if (!Array.isArray(ids)) continue;
    const ok = ids.filter((x): x is string => typeof x === 'string');
    if (ok.length) out[course] = [...new Set(ok)];
  }
  return out;
}

/** The recommended lesson: the first one not finished yet (null when all are). */
export const nextLesson = (lessons: Lesson[], done: string[]): Lesson | null => lessons.find((l) => !done.includes(l.id)) ?? null;

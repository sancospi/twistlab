// Entrenador «Reconocer PLL»: two sides of a PLL state (twoSidesSVG in diagram.ts), name the case against the clock.
// Its own page (/academia/reconocer-pll), a tile in the Academia's «Entrenadores». view.ts draws the crumbs and calls
// pllRecognitionView; stopPllRecognition runs whenever the page is left. Texts: Localized (tr(es, en, pt)) in this file.
// The drill's pure parts (states, picking, scores) are exported: aufTrainer.ts uses them too.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { lang, loc, t, type Localized } from '../i18n.ts';
import { el } from '../el.ts';
import { IDENTITY, centerMoves, invertTokens } from '../notation.ts';
import { patternToFacelets } from '../facelets.ts';
import { formatTime } from '../timer.ts';
import { prose } from '../rich-text-view.ts';
import { caseDiagram, twoSidesSVG } from './diagram.ts';
import { pllPhase } from './cfopFull/pll.ts';
import { learningFor, load, save, setting } from './store.ts';
import { caseState, type Auf } from './cube.ts';
import type { Case } from './types.ts';

const tr = (es: string, en: string, pt: string): Localized => ({ es, en, pt });

// --- The drill's logic: pure, shared with the AUF trainer ---

export const AUFS: Auf[] = ['', 'U', "U'", 'U2'];
export const PLL_GROUPS = pllPhase.groups;
export const PLLS = PLL_GROUPS.flatMap((g) => g.cases);

export type Rng = () => number;
const pick = <T>(rng: Rng, xs: T[]): T => xs[Math.floor(rng() * xs.length)];

/** A PLL state as a solve brings it: `pre` (the AUF before `alg`), then `alg`, then `post` solves it. */
export interface PllItem { c: Case; alg: string; pre: Auf; post: Auf; pattern: KPattern }

export function pllItem(kpuzzle: KPuzzle, c: Case, alg: string, rng: Rng): PllItem {
  const pre = pick(rng, AUFS), shift = pick(rng, AUFS);
  // solved, the top layer turned by `shift`, the algorithm undone (as center turns, like caseState), then `pre` undone
  const moves = [shift, ...invertTokens(centerMoves(alg, IDENTITY)), ...invertTokens(pre ? [pre] : [])].filter(Boolean);
  return { c, alg, pre, post: (shift ? invertTokens([shift])[0] : '') as Auf, pattern: kpuzzle.defaultPattern().applyAlg(moves.join(' ')) };
}

/** `p` after `moves` (an algorithm in the plan's notation, or a U turn). */
export const after = (p: KPattern, moves: string): KPattern => (moves ? p.applyAlg(centerMoves(moves, IDENTITY).join(' ')) : p);

/** The U turns that leave `p` solved. */
export const finishing = (p: KPattern): Auf[] => AUFS.filter((a) => after(p, a).isIdentical(p.kpuzzle.defaultPattern()));

/** The U turns before `alg` after which it solves `p` up to a last U turn. */
export const preAufs = (p: KPattern, alg: string): Auf[] => AUFS.filter((a) => finishing(after(after(p, a), alg)).length > 0);

/** What the learner keeps of each case in this browser: answers, right ones, their total time, and how weak it is now. */
export interface Score { n: number; ok: number; ms: number; weak: number }
export interface Progress { best: number; cases: Record<string, Score> } // best: the longest streak

const WEAK_MAX = 6;
const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

export function parseProgress(raw: unknown): Progress {
  const r = (raw ?? {}) as Partial<Progress>;
  const cases: Record<string, Score> = {};
  for (const [id, s] of Object.entries(typeof r.cases === 'object' && r.cases ? r.cases : {})) {
    if ([s?.n, s?.ok, s?.ms, s?.weak].every(isCount)) cases[id] = s;
  }
  return { best: isCount(r.best) ? r.best : 0, cases };
}

/** A wrong answer makes the case weaker by 2 (up to WEAK_MAX), a right one stronger by 1. */
export function scored(s: Score | undefined, right: boolean, ms: number): Score {
  const x = s ?? { n: 0, ok: 0, ms: 0, weak: 0 };
  return { n: x.n + 1, ok: x.ok + +right, ms: x.ms + (right ? Math.round(ms) : 0), weak: right ? Math.max(0, x.weak - 1) : Math.min(WEAK_MAX, x.weak + 2) };
}

/** The next case: weighted by weakness (1 + weak), never the last one again when there is another. */
export function pickCase(cases: Case[], p: Progress, rng: Rng, last?: string): Case {
  const pool = cases.length > 1 ? cases.filter((c) => c.id !== last) : cases;
  const w = pool.map((c) => 1 + (p.cases[c.id]?.weak ?? 0));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  return pool.find((_, i) => (r -= w[i]) < 0) ?? pool[pool.length - 1];
}

/** This visit's answers: how many, right ones, their total time, the current streak. */
export interface Tally { n: number; ok: number; ms: number; streak: number }
export const tallied = (s: Tally, right: boolean, ms: number): Tally =>
  ({ n: s.n + 1, ok: s.ok + +right, ms: s.ms + (right ? ms : 0), streak: right ? s.streak + 1 : 0 });

// --- Shared view parts ---

/** Which cases: all, a group of the PLL phase, or the ones being learned (in the Quiz's spaced repetition). */
export function subsetCases(id: string): Case[] {
  if (id === 'learning') return PLLS.filter((c) => learningFor(c.id));
  return PLL_GROUPS.find((g) => g.id === id)?.cases ?? PLLS;
}
const SUBSET_IDS = ['all', ...PLL_GROUPS.map((g) => g.id), 'learning'];
export const savedSubset = (key: string): string => setting(key, 'all', (v) => SUBSET_IDS.includes(v) && subsetCases(v).length > 0);

export function subsetSelect(key: string, value: string, onChange: (id: string) => void): HTMLElement {
  const name = (id: string) => (id === 'all' ? loc(tr('Todas', 'All', 'Todas')) : id === 'learning' ? loc(tr('Las que estoy aprendiendo', 'The ones I am learning', 'As que estou aprendendo'))
    : loc(PLL_GROUPS.find((g) => g.id === id)!.name));
  const select = el('select', { onchange: () => (save(key, select.value), onChange(select.value)) },
    ...SUBSET_IDS.map((id) => {
      const n = subsetCases(id).length;
      return el('option', { value: id, selected: id === value, disabled: id === 'learning' && !n, textContent: `${name(id)} (${id === 'learning' && !n ? 0 : n})` });
    }));
  return el('label', { className: 'trainer-option' }, loc(tr('Casos', 'Cases', 'Casos')), select);
}

const percent = (x: number) => new Intl.NumberFormat(lang, { style: 'percent' }).format(x);

export function statsText(s: Tally, best: number): string {
  const avg = s.ok ? `${formatTime(s.ms / s.ok)} s` : '–';
  return loc(tr(
    `Racha ${s.streak} · mejor ${best} · aciertos ${s.n ? percent(s.ok / s.n) : '–'} (${s.ok}/${s.n}) · media ${avg}`,
    `Streak ${s.streak} · best ${best} · accuracy ${s.n ? percent(s.ok / s.n) : '–'} (${s.ok}/${s.n}) · average ${avg}`,
    `Sequência ${s.streak} · melhor ${best} · acertos ${s.n ? percent(s.ok / s.n) : '–'} (${s.ok}/${s.n}) · média ${avg}`,
  ));
}

/** The weakest cases, to name under the stats. */
export function weakest(cases: Case[], p: Progress): string {
  const weak = cases.filter((c) => p.cases[c.id]?.weak).sort((a, b) => p.cases[b.id].weak - p.cases[a.id].weak).slice(0, 4);
  return weak.length ? loc(tr('A repasar: ', 'To review: ', 'Para revisar: ')) + weak.map((c) => c.code).join(', ') : '';
}

export const svgBox = (className: string, svg: string): HTMLElement => {
  const box = el('div', { className });
  box.innerHTML = svg;
  return box;
};

export const NEXT_MS = 1200; // a right answer moves on by itself after this long (time to see the top view)

// --- The page ---

const KEY = 'academy-pll-recog';
const SUBSET_KEY = 'academy-pll-recog-set';
let timer = 0;

/** The trainer's page, under the Academia's crumbs. */
export function pllRecognitionView(kpuzzle: KPuzzle): HTMLElement {
  const progress = parseProgress(load(KEY));
  let subset = savedSubset(SUBSET_KEY);
  let tally: Tally = { n: 0, ok: 0, ms: 0, streak: 0 };
  let item: PllItem | null = null;
  let shownAt = 0;
  let answered = false;

  const stats = el('p', { className: 'trainer-stats' });
  const weak = el('p', { className: 'hint' });
  const question = el('div', { className: 'trainer-figure' });
  const answer = el('div', { className: 'trainer-figure trainer-result' });
  const feedback = el('p', { className: 'trainer-feedback', role: 'status' });
  const next = el('button', { type: 'button', onclick: () => ask() });
  const answers = el('div', { className: 'trainer-answers' });
  const buttons = new Map<string, HTMLButtonElement>();

  const showStats = () => {
    stats.textContent = statsText(tally, progress.best);
    weak.textContent = weakest(subsetCases(subset), progress);
  };

  function buildAnswers() {
    buttons.clear();
    const cases = new Set(subsetCases(subset));
    answers.replaceChildren(...PLL_GROUPS.filter((g) => g.cases.some((c) => cases.has(c))).map((g) =>
      el('div', { className: 'trainer-group', role: 'group', ariaLabel: loc(g.name) },
        el('small', { className: 'hint', textContent: loc(g.name) }),
        el('div', { className: 'trainer-buttons' }, ...g.cases.filter((c) => cases.has(c)).map((c) => {
          const b = el('button', { type: 'button', textContent: c.code, ariaLabel: loc(c.name), onclick: () => choose(c) });
          buttons.set(c.id, b);
          return b;
        })))));
  }

  function ask() {
    clearTimeout(timer);
    const c = pickCase(subsetCases(subset), progress, Math.random, item?.c.id);
    item = pllItem(kpuzzle, c, c.algs[0].alg, Math.random);
    answered = false;
    question.innerHTML = twoSidesSVG(patternToFacelets(item.pattern), { size: 200, title: loc(tr('Un caso de PLL, visto desde el frente y la derecha', 'A PLL case, seen from the front and the right', 'Um caso de PLL, visto da frente e da direita')) });
    answer.replaceChildren();
    feedback.textContent = '';
    for (const b of buttons.values()) b.classList.remove('right', 'wrong');
    next.textContent = t('quiz.skip');
    next.className = '';
    showStats();
    shownAt = performance.now();
  }

  function choose(c: Case) {
    if (answered || !item) return;
    answered = true;
    const ms = performance.now() - shownAt, right = c.id === item.c.id;
    tally = tallied(tally, right, ms);
    progress.best = Math.max(progress.best, tally.streak);
    progress.cases[item.c.id] = scored(progress.cases[item.c.id], right, ms);
    save(KEY, progress);
    buttons.get(item.c.id)?.classList.add('right');
    if (!right) buttons.get(c.id)?.classList.add('wrong');
    const name = loc(item.c.name);
    feedback.textContent = right ? loc(tr(`¡Bien! ${name} · ${formatTime(ms)} s`, `Right! ${name} · ${formatTime(ms)} s`, `Isso! ${name} · ${formatTime(ms)} s`))
      : loc(tr(`No: era ${name} (elegiste ${c.code}).`, `No: it was ${name} (you picked ${c.code}).`, `Não: era ${name} (você escolheu ${c.code}).`));
    feedback.className = `trainer-feedback ${right ? 'ok' : 'bad'}`;
    // the case as its recognition text reads it (the main algorithm undone), not turned like the question
    answer.innerHTML = caseDiagram('top', 'pll-edges', patternToFacelets(caseState(kpuzzle, item.c.algs[0].alg, IDENTITY)), { size: 140, arrows: true, title: loc(tr(`${name}, desde arriba`, `${name}, from above`, `${name}, visto de cima`)) });
    answer.append(el('small', { className: 'hint', textContent: loc(item.c.recognition) }));
    next.textContent = t('quiz.next');
    next.className = 'primary';
    showStats();
    if (right) timer = window.setTimeout(ask, NEXT_MS);
    else next.focus();
  }

  buildAnswers();
  ask();
  return el('section', { className: 'academy-trainer trainer-wide' },
    el('h2', { textContent: t('trainer.reconocer-pll.title') }),
    prose(loc(tr(
      'Mira solo **el frente y la derecha**, como en una resolución, y elige la PLL. Busca **faros** (dos esquinas iguales en un lado), **bloques** de 2 piezas del mismo color y **barras** de 3. Los casos que fallas vuelven más seguido.',
      'Look only at **the front and right sides**, as in a solve, and pick the PLL. Look for **headlights** (two matching corners on one side), **blocks** of 2 pieces of the same color and **bars** of 3. The cases you miss come back more often.',
      'Olhe só **a frente e a direita**, como numa resolução, e escolha a PLL. Procure **faróis** (duas quinas iguais num lado), **blocos** de 2 peças da mesma cor e **barras** de 3. Os casos que você erra voltam com mais frequência.',
    ))),
    el('div', { className: 'trainer-options' }, subsetSelect(SUBSET_KEY, subset, (id) => {
      subset = id;
      buildAnswers();
      ask();
    })),
    stats, weak,
    el('div', { className: 'trainer-play' },
      el('div', { className: 'trainer-col' }, el('div', { className: 'trainer-stage' }, question, answer), feedback),
      el('div', { className: 'trainer-col' }, answers, el('div', { className: 'row' }, next))));
}

/** Leaving the page: a pending move to the next case. */
export function stopPllRecognition(): void {
  clearTimeout(timer);
}

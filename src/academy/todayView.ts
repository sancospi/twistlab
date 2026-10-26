// Hoy (/hoy): the day's practice in one page. The cases due for review (spaced repetition, store.ts) with the quiz that
// reviews them, the next lesson, the practice streak, the Reto del día (daily-view.ts) and a 10-minute session: the
// review, one new case and 5 timed solves. Plus the optional daily reminder (reminder.ts). Not indexed (vercel.json).
import { lang, loc, t, tp } from '../i18n.ts';
import { routePath } from '../router.ts';
import { streak } from '../progress.ts';
import { showDaily } from '../daily-view.ts';
import { slowQuiz } from '../analysis-view.ts';
import { slowestCases } from '../solve-analysis.ts';
import { reminderView, syncReminder } from '../reminder.ts';
import { parseDone, suggestedLesson } from './lessons.ts';
import { METHODS, allCases } from './methods.ts';
import { el } from '../el.ts';
import { openQuiz } from './quiz.ts';
import { isDue, learningFor, load, preferred, statsFor } from './store.ts';
import { caseLabel, puzzleOf, type Case, type Method } from './types.ts';

const LESSONS_KEY = 'academy-lessons'; // lessonView.ts
const SOLVES = 5;

const methodCases = METHODS.map((m) => [m, allCases(m)] as const);

/** The cases due by the end of the day of `at` (every method; a case id belongs to one method). */
export const dueCases = (at = Date.now()): Case[] => methodCases.flatMap(([, cases]) => cases.filter((c) => isDue(learningFor(c.id), at)));

/** Methods by their latest practised case, newest first. */
function recentMethods(): Method[] {
  const last = (cases: readonly Case[]) => Math.max(0, ...cases.map((c) => statsFor(c.id)?.lastPracticed ?? 0));
  return methodCases.filter(([, cases]) => last(cases)).sort((a, b) => last(b[1]) - last(a[1])).map(([m]) => m);
}

const p = (textContent: string, className = '') => el('p', { textContent, className });
const block = (title: string, ...children: Node[]) => el('section', { className: 'cube-block', ariaLabel: title }, el('h3', { textContent: title }), ...children);

export async function todayView(): Promise<HTMLElement> {
  const recent = recentMethods();
  const lesson = suggestedLesson(recent.map((m) => m.id), parseDone(load(LESSONS_KEY)), (c) => preferred(c).alg);
  const fresh = recent.flatMap((m) => allCases(m)).find((c) => !learningFor(c.id) && !statsFor(c.id)); // one new case, from the method in hand
  const freshMethod = fresh && recent.find((m) => allCases(m).includes(fresh))!;
  const days = streak((await import('../progress-view.ts')).practiceTimes(), Date.now());
  const date = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  // the review and the session refresh when a quiz closes (the due count changed)
  const reviewBox = el('div');
  const sessionBox = el('div');
  const redraw = () => {
    const due = dueCases();
    reviewBox.replaceChildren(...(due.length ? [reviewCard(due)] : [])); // nothing due: the session's first step says so
    sessionBox.replaceChildren(sessionCard(due.length));
    void syncReminder((at) => dueCases(at).length);
  };
  // the quiz closed: the dialog gave the focus back to its button, which redraw just replaced. To the review's new
  // button if cases are still due, else to the session's heading, not lost on <body>
  const reviewed = () => {
    redraw();
    if (document.activeElement !== document.body) return; // e.g. Practicar ("Repasar ahora") is open over the page
    const h = sessionBox.querySelector('h3')!;
    h.tabIndex = -1;
    (reviewBox.querySelector('button') ?? h).focus();
  };
  // one quiz per puzzle (a quiz is of one puzzle): usually just the 3x3
  const reviewButtons = (due: Case[]) => {
    const puzzles = [...new Set(due.map((c) => puzzleOf(c.stage)))];
    return puzzles.map((puzzle) => el('button', {
      type: 'button', className: 'primary',
      textContent: puzzles.length > 1 ? `${t('today.review')} · ${t(`library.puzzle.${puzzle}`)}` : t('today.review'),
      onclick: () => void openQuiz({ kind: 'cases', id: 'today', cases: due.filter((c) => puzzleOf(c.stage) === puzzle), title: t('today.review') }, reviewed),
    }));
  };
  const reviewCard = (due: Case[]) => block(t('today.review'), p(tp('srs.due', due.length)), el('div', { className: 'row' }, ...reviewButtons(due)));
  const lessonLink = (l: NonNullable<typeof lesson>) => routePath({ mod: 'academy', page: { kind: 'lesson', course: l.course.id, id: l.lesson.id } });
  const sessionCard = (due: number) => block(t('today.session'),
    p(t('today.sessionHint'), 'hint'),
    el('ol', { className: 'today-steps' },
      el('li', {}, due ? tp('today.stepReview', due) : t('today.stepNoReview')),
      fresh ? el('li', {}, t('today.stepNew'), ' ', el('a', { href: routePath({ mod: 'academy', page: { kind: 'case', method: freshMethod!.id, id: fresh.id } }), textContent: `${caseLabel(fresh)} (${loc(freshMethod!.name)})` }))
        : lesson ? el('li', {}, t('today.stepLesson'), ' ', el('a', { href: lessonLink(lesson), textContent: lesson.lesson.title }))
        : el('li', {}, t('today.stepFree')),
      el('li', {}, tp('today.stepSolves', SOLVES), ' ', el('a', { href: '/', textContent: t('today.toTimer') }))));

  const lessonCard = block(t('today.lesson'), ...(lesson
    ? [p(lesson.course.title, 'hint'), // the lesson's title is on its button
      el('div', { className: 'row' }, el('a', { className: 'button primary', href: lessonLink(lesson), textContent: t(lesson.lesson.id === lesson.course.lessons[0].id ? 'lesson.start' : 'lesson.resume', { title: lesson.lesson.title }) }))]
    : [p(t('lesson.allDone'), 'hint')]));
  // the slowest cases of the smart-cube solves (Progreso's), when some are already practised
  const slow = slowQuiz(slowestCases(), redraw);
  const slowCard = slow && block(t('analysis.cases'), p(t('today.slowHint', { cases: slow.cases.map(caseLabel).join(', ') }), 'hint'),
    el('div', { className: 'row' }, slow.button));
  const daily = el('section', { className: 'cube-block', ariaLabel: t('daily.title'), hidden: true });
  void showDaily(daily); // offline it stays hidden; Jugar plays it in the Resolver
  const page = el('section', { className: 'today' },
    el('h2', { textContent: t('today.title') }),
    p([date, days ? tp('today.streak', days) : t('today.noStreak')].join(' · '), 'hint'),
    sessionBox, reviewBox, ...(slowCard ? [slowCard] : []), lessonCard, daily);
  redraw();
  void reminderView((at) => dueCases(at).length).then((r) => r && page.append(r));
  return page;
}

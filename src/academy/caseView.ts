// A case's own page (/academia/<method>/caso/<case>) and the algorithm library (/academia/algoritmos).
// The page: the case's diagram, and a 3D player of the chosen algorithm on demand ("Ver animación"); facts (probability, moves, group, and the inverse
// and mirror cases found in the simulator); the algorithms with their triggers marked and their tags; how to recognise
// it; your data and spaced-repetition status; the three ways to work on it (Practicar, Quiz, Memoria muscular); the
// other cases of its group. Its 3D player lives in index.html's #case, outside #mod-academy (rebuilt per page), so
// it's never re-attached.
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { ALG_TAGS, IDENTITY, caseSetup, tokenize, triggerSegments } from '../notation.ts';
import { formatTenths, otherMoves, ruVerdict, type Timed } from '../speed.ts';
import { algView, scrambleNote } from '../notation-view.ts';
import { inlineText } from '../rich-text-view.ts';
import { lang, loc, t, tp, type MessageKey } from '../i18n.ts';
import { routePath } from '../router.ts';
import { formatTime } from '../timer.ts';
import { caseState, practiceSpec } from './cube.ts';
import { caseDiagram } from './diagram.ts';
import { bySet, GROUP_BYS, inverseCase, libraryEntries, matches, mirrorCase, PUZZLES, SETS, STATUSES, type CaseStatus, type LibraryFilter } from './library.ts';
import { METHODS } from './methods.ts';
import { algFacts, Animation, el, fingersView, loadCase, moreAlgs, movesView, openPractice, tagChips, timedAlgs } from './practice.ts';
import { caseProbability, formatProbability } from './probability.ts';
import { caseLabel, openQuiz } from './quiz.ts';
import { average, byChoice, isDue, learnStatus, learningFor, preferred, setPreferred, statsFor, variants } from './store.ts';
import { SPEED_ANCHOR } from './triggers.ts';
import type { AlgVariant, Case, Group, Method, Phase } from './types.ts';

const $ = (id: string) => document.getElementById(id)!;
const section = $('case');
const figure = $('case-diagram');
const stage = $('case-player');
const body = $('case-body');

let kpuzzle: KPuzzle;
let shown: Case | null = null; // the case on screen: callbacks of a dialog closed by leaving the page must not redraw it
const anim = new Animation(stage, (p) => {
  const tokens = tokenize(preferred(shown!).alg);
  loadCase(p, kpuzzle, shown!.stage, caseSetup(tokens), tokens);
});
$('case-anim').append(anim.button());

const casePath = (m: Method, c: Case) => routePath({ mod: 'academy', page: { kind: 'case', method: m.id, id: c.id } });
const groupPath = (m: Method, g: Group) => `${routePath({ mod: 'academy', page: { kind: 'method', id: m.id } })}#academy-${g.id}`; // view.ts's anchors
const text = (s: string, className = '') => el('p', { textContent: s, className });
const rich = (s: string, className = '') => el('p', { className }, ...inlineText(s)); // data text: its terms tappable

// the case's own state (its main algorithm undone): the recognition text describes it, whichever algorithm is chosen
const diagram = (phase: Phase, c: Case, size: number, title = ''): string =>
  caseDiagram(phase.diagram, c.stage, patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), { size, title, arrows: size >= 84 });

const statusOf = (caseId: string): CaseStatus => {
  const l = learningFor(caseId);
  return isDue(l, Date.now()) ? 'due' : learnStatus(l);
};

/** A small linked card: diagram, code, name and how you're doing with it; `tagged`: its method's name too. */
function miniCard(m: Method, phase: Phase, c: Case, tagged = false): HTMLAnchorElement {
  const a = el('a', { className: 'mini-case', href: casePath(m, c) });
  a.innerHTML = diagram(phase, c, 56);
  a.firstElementChild!.setAttribute('aria-hidden', 'true'); // the link's text names it
  const status = statusOf(c.id);
  a.append(...(tagged ? [el('span', { className: 'case-method', textContent: loc(m.name) })] : []), el('strong', { textContent: c.code }),
    ...(loc(c.name) === c.code ? [] : [el('span', { className: 'hint', textContent: loc(c.name) })]),
    ...(status === 'new' ? [] : [el('span', { className: `case-status ${status}`, textContent: t(`library.status.${status}`) })]));
  return a;
}

// --- The case page ---

const moveList = new Intl.ListFormat(lang, { type: 'conjunction' });

/** R and U only or not, which pays off here (speed.ts), with how the times are estimated and a link to the guide; only
 *  for a case with both kinds of algorithm. */
function speedVerdict(times: Timed[]): HTMLElement[] {
  const v = ruVerdict(times);
  if (!v) return [];
  const moves = moveList.format(otherMoves(v.other.tokens).map((m) => `\`${m}\``)); // tappable, and `y` isn't read as "and"
  const guide = routePath({ mod: 'academy', page: { kind: 'triggers' } });
  return [rich(t(`speed.${v.winner}`, { s: formatTenths(v.saved), moves }), 'speed-verdict'),
    el('p', { className: 'hint' }, t('speed.how'), ' ', el('a', { href: `${guide}#${SPEED_ANCHOR}`, textContent: t('speed.guide') }))];
}

/** Leaving the case's route: hide its section and stop its 3D player. */
export function stopCase(): void {
  section.hidden = true;
  anim.set(false);
  shown = null;
}

/** Draws the case's page: returns the head for #mod-academy (under the crumbs); the rest goes to #case. */
export function showCase(m: Method, c: Case, kp: KPuzzle): HTMLElement {
  kpuzzle = kp;
  shown = c;
  const phase = m.phases.find((p) => p.groups.some((g) => g.cases.includes(c)))!;
  const group = phase.groups.find((g) => g.cases.includes(c))!;
  const phaseCases = phase.groups.flatMap((g) => g.cases);
  const facts = el('ul', { className: 'chips', ariaLabel: t('case.facts') });
  const algs = el('section', { className: 'case-section' });
  const why = el('section', { className: 'case-section' });
  const data = el('section', { className: 'case-section' });

  const fill = () => {
    if (shown !== c) return;
    const v = preferred(c);
    figure.innerHTML = diagram(phase, c, 160, t('academy.diagram', { code: c.code }));
    anim.refresh();
    const inverse = inverseCase(kpuzzle, c, v.alg, phaseCases);
    const mirror = mirrorCase(kpuzzle, c, v.alg, phaseCases);
    const p = caseProbability(c.id, kpuzzle);
    const related = (x: Case | undefined, key: 'case.inverse' | 'case.mirror') => !x ? []
      : [el('li', {}, x === c ? el('span', { className: 'chip', textContent: t(`${key}Self`) })
        : el('a', { className: 'chip', href: casePath(m, x), textContent: t(key, { name: caseLabel(x) }) }))];
    facts.replaceChildren(
      ...(p === null ? [] : [el('li', { className: 'chip', textContent: t('prob.card', { p: formatProbability(p) }) })]),
      el('li', {}, el('a', { className: 'chip', href: groupPath(m, group), textContent: t('case.group', { name: loc(group.name) }) })),
      ...related(inverse, 'case.inverse'), ...related(mirror, 'case.mirror'));
    // the chosen algorithm first, then one secondary, the rest folded: any can become the chosen one
    const all = variants(c);
    const times = timedAlgs(all);
    const [, second, ...more] = byChoice(all, v);
    const withTriggers = all.some((x) => triggerSegments(tokenize(x.alg)).some((s) => s.trigger));
    const algCard = (x: AlgVariant, chosen: boolean) => card(x, chosen, times);
    algs.replaceChildren(
      el('h3', { textContent: t('case.chosen') }),
      // the scramble right above the algorithm it is practised with: the chosen one backwards
      el('dl', { className: 'case-setup' }, el('dt', { textContent: t('practice.setup') }), el('dd', {}, algView(practiceSpec(c, v.alg).moves), scrambleNote())),
      algCard(v, true),
      ...(second ? [el('h3', { textContent: t('case.alternatives') }), algCard(second, false)] : []),
      ...(more.length ? [moreAlgs(more.length, more.map((x) => algCard(x, false)))] : []),
      ...speedVerdict(times),
      ...(withTriggers ? [text(t('case.triggersHint'), 'hint')] : []));
    why.hidden = !inverse || inverse === c;
    if (inverse) why.replaceChildren(el('h3', { textContent: t('case.inverseWhy') }), text(t('case.inverseWhyText', { other: caseLabel(inverse) })));
    data.replaceChildren(el('h3', { textContent: t('case.yourData') }), yourData(c));
  };

  function card(v: AlgVariant, chosen: boolean, times: Timed[]): HTMLElement {
    const tokens = tokenize(v.alg);
    const box = el('div', { className: chosen ? 'case-alg chosen' : 'case-alg', tabIndex: -1, ...(chosen ? { ariaLabel: t('case.chosen') } : {}) },
      movesView(tokens),
      fingersView(tokens),
      text(algFacts(v, times), 'hint'),
      ...tagChips(tokens),
      ...(v.note ? [rich(loc(v.note), 'hint')] : []));
    if (!chosen) {
      const use = el('button', { type: 'button', className: 'small', textContent: t('case.use'), ariaLabel: t('case.useLabel', { alg: v.alg }) });
      use.onclick = () => {
        setPreferred(c, v.id);
        fill();
        algs.querySelector<HTMLElement>('.case-alg.chosen')!.focus(); // the button is gone: keep the place
      };
      box.append(el('div', { className: 'row' }, use));
    }
    return box;
  }

  // The three ways, in order: Practicar (this case), Quiz (random cases of its group, this one first ticked as "Uno
  // solo"), Memoria muscular (this case's algorithm).
  const quiz = () => void openQuiz({ kind: 'cases', id: c.id, cases: [c], answers: group.cases, title: t('academy.quizOf', { name: loc(group.name) }) }, fill); // the group's cases come up too
  const action = (label: MessageKey, hint: MessageKey, onclick: () => void, primary = false) =>
    el('button', { type: 'button', className: primary ? 'primary' : '', onclick },
      el('span', { textContent: t(label) }), el('small', { textContent: t(hint) }));
  const actions = el('div', { className: 'case-actions', role: 'group', ariaLabel: t('practice.tabs') },
    action('practice.tab.practice', 'case.practiceHint', () => void openPractice(c, fill, quiz, 'practice'), true),
    action('practice.tab.quiz', 'case.quizHint', quiz),
    action('practice.tab.drill', 'case.drillHint', () => void openPractice(c, fill, quiz, 'drill')));

  const recognition = el('section', { className: 'case-section' },
    el('h3', { textContent: t('case.recognition') }),
    rich(loc(c.recognition)),
    ...(c.note ? [rich(loc(c.note), 'hint')] : []),
    ...(c.scdb ? [el('p', {}, el('a', { href: c.scdb.url, target: '_blank', rel: 'noopener', textContent: t('practice.scdb') }))] : []));
  const siblings = group.cases.filter((x) => x !== c);
  const others = !siblings.length ? [] : [el('section', { className: 'case-section' },
    el('h3', { textContent: t('case.others', { name: loc(group.name) }) }),
    el('div', { className: 'mini-cards' }, ...siblings.map((x) => miniCard(m, phase, x))))];

  section.hidden = false;
  anim.set(false); // a new case: its figure, the animation only when asked for
  body.replaceChildren(facts, actions, algs, recognition, why, data, ...others);
  fill();
  return el('header', { className: 'case-head' },
    el('h2', { textContent: caseLabel(c) }),
    text([loc(m.name), loc(phase.name), loc(group.name)].join(' · '), 'hint'));
}

const day = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' });

function yourData(c: Case): HTMLElement {
  const s = statsFor(c.id);
  const l = learningFor(c.id);
  const avg = s && average(s);
  const row = (label: string, value: string) => [el('dt', { textContent: label }), el('dd', { textContent: value })];
  return el('dl', { className: 'case-data' },
    ...row(t('case.reps'), s ? t('case.repsValue', { reps: tp('academy.reps', s.reps), clean: s.clean }) : t('academy.notPracticed')),
    ...(s?.best == null ? [] : row(t('case.best'), formatTime(s.best))),
    ...(avg == null || s!.last.length < 2 ? [] : row(t('case.avg', { n: s!.last.length }), formatTime(avg))), // one rep: that's the best
    ...(l?.recognitionMs == null ? [] : row(t('case.recognitionTime'), formatTime(l.recognitionMs))),
    ...row(t('case.status'), t(`library.status.${learnStatus(l)}`)),
    ...row(t('case.due'), !l ? t('case.dueNone') : isDue(l, Date.now()) ? t('case.dueToday') : day.format(l.due)));
}

// --- The library: every case of every method, with search and filters ---

const pick = <T extends string>(v: string | null, ok: readonly T[]): T | '' => (ok.includes(v as T) ? (v as T) : '');

export function libraryView(kp: KPuzzle): HTMLElement {
  kpuzzle = kp;
  // the filters live in the URL: Back from a case's page comes back to the same list
  const params = new URLSearchParams(location.search);
  const filter: LibraryFilter = { query: params.get('q') ?? '', puzzle: pick(params.get('cubo'), PUZZLES), set: pick(params.get('set'), SETS), status: pick(params.get('estado'), STATUSES), tag: pick(params.get('giros'), ALG_TAGS) };
  const search = el('input', { type: 'search', value: filter.query, placeholder: t('library.searchPlaceholder'), autocomplete: 'off', spellcheck: false });
  const select = (values: readonly string[], value: string, name: (v: string) => string) =>
    Object.assign(el('select', {}, ...['', ...values].map((v) => el('option', { value: v, textContent: name(v) }))), { value });
  const method = select(METHODS.map((m) => m.id), pick(params.get('metodo'), METHODS.map((m) => m.id)),
    (v) => (v ? loc(METHODS.find((m) => m.id === v)!.name) : t('library.allMethods')));
  const puzzle = select(PUZZLES, filter.puzzle ?? '', (v) => t(v ? `library.puzzle.${v}` as MessageKey : 'library.allPuzzles'));
  const set = select(SETS, filter.set, (v) => (v ? t(`library.set.${v}` as MessageKey) : t('library.allSets')));
  const status = select(STATUSES, filter.status, (v) => (v ? t(`library.status.${v}` as MessageKey) : t('library.allStatuses')));
  const tag = select(ALG_TAGS, filter.tag, (v) => (v ? t(`case.tag.${v}` as MessageKey) : t('library.allTags')));
  // '' is the default, by method: no "Todos" option here
  const groupBy = select(GROUP_BYS.slice(1), pick(params.get('agrupar'), GROUP_BYS.slice(1)), (v) => t(`library.groupBy.${v || GROUP_BYS[0]}` as MessageKey));
  const field = (label: string, input: HTMLElement) => el('label', { className: 'library-field' }, el('span', { className: 'hint', textContent: label }), input);
  const form = el('form', { className: 'library-filters', role: 'search', onsubmit: (e: SubmitEvent) => e.preventDefault() },
    field(t('library.search'), search), field(t('library.puzzle'), puzzle), field(t('library.method'), method), field(t('library.set'), set), field(t('library.status'), status),
    field(t('library.tag'), tag), field(t('library.groupBy'), groupBy));
  const count = el('p', { className: 'hint', ariaLive: 'polite' });
  const list = el('div', { className: 'library-list' });

  let cards: { a: HTMLElement; c: Case; algs: string[] }[] = [];
  const card = (m: Method, phase: Phase, c: Case, tagged = false) => {
    const a = miniCard(m, phase, c, tagged);
    cards.push({ a, c, algs: variants(c).map((v) => v.alg) });
    return a;
  };
  /** The sections for the method and grouping chosen; the other filters only hide cards. */
  const build = () => {
    cards = [];
    const entries = libraryEntries(METHODS, method.value);
    list.replaceChildren(...(groupBy.value === 'set'
      ? bySet(entries).map(({ set: s, entries }) => el('section', { className: 'library-method' }, // a top-level section: same look and hiding
        el('h3', { textContent: t(`library.set.${s}`) }),
        el('div', { className: 'mini-cards' }, ...entries.map((e) => card(e.method, e.phase, e.c, !method.value)))))
      : METHODS.filter((m) => entries.some((e) => e.method === m)).map((m) => el('section', { className: 'library-method' },
        el('h3', { textContent: loc(m.name) }),
        ...m.phases.filter((p) => p.groups.some((g) => g.cases.length)).map((phase) => el('section', { className: 'library-phase' },
          el('h4', { textContent: loc(phase.name) }),
          ...phase.groups.map((g) => el('section', { className: 'library-group' },
            el('h5', { textContent: loc(g.name) }),
            el('div', { className: 'mini-cards' }, ...g.cases.map((c) => card(m, phase, c)))))))))));
  };

  const apply = () => {
    Object.assign(filter, { query: search.value, puzzle: puzzle.value, set: set.value, status: status.value, tag: tag.value });
    const now = Date.now();
    let n = 0;
    for (const x of cards) {
      x.a.hidden = !matches(x.c, x.algs, filter, learningFor(x.c.id), now);
      if (!x.a.hidden) n++;
    }
    list.querySelectorAll<HTMLElement>('.library-group, .library-phase, .library-method').forEach((s) => (s.hidden = !s.querySelector('.mini-case:not([hidden])')));
    count.textContent = n ? tp('library.count', n) : t('library.none');
    const q = new URLSearchParams(Object.entries({ q: filter.query.trim(), cubo: filter.puzzle, metodo: method.value, set: filter.set, estado: filter.status, giros: filter.tag, agrupar: groupBy.value })
      .filter(([, v]) => v));
    history.replaceState(history.state, '', location.pathname + (q.size ? `?${q}` : ''));
  };
  search.oninput = puzzle.onchange = set.onchange = status.onchange = tag.onchange = apply;
  method.onchange = groupBy.onchange = () => (build(), apply());
  build();
  apply();
  return el('section', { className: 'library' },
    el('h2', { textContent: t('library.title') }),
    text(t('library.intro'), 'prose hint'),
    form, count, list);
}

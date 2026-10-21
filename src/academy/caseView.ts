// A case's own page (/academia/<method>/caso/<case>) and the algorithm library (/academia/algoritmos).
// The page: the case's diagram and a 3D player of the chosen algorithm; facts (probability, moves, group, and the inverse
// and mirror cases found in the simulator); the algorithms with their triggers marked and their tags; how to recognise
// it; your data and spaced-repetition status; the three ways to practise it; the other cases of its group.
// Its 3D player lives in index.html's #case, outside #mod-academy (rebuilt per page), so it's never re-attached.
import { TwistyPlayer } from 'cubing/twisty';
import type { KPuzzle } from 'cubing/kpuzzle';
import { patternToFacelets } from '../facelets.ts';
import { IDENTITY, algTags, centerMoves, htm, invertTokens, tokenize, triggerSegments } from '../notation.ts';
import { algView } from '../notation-view.ts';
import { lang, loc, t, tp, type MessageKey } from '../i18n.ts';
import { routePath } from '../router.ts';
import { formatTime } from '../timer.ts';
import { caseState } from './cube.ts';
import { isoSVG, maskFor, topSVG } from './diagram.ts';
import { inverseCase, matches, mirrorCase, SETS, STATUSES, type CaseStatus, type LibraryFilter } from './library.ts';
import { METHODS } from './methods.ts';
import { el, MASKS, openPractice, sourceLabel, type Tab } from './practice.ts';
import { caseProbability, formatProbability } from './probability.ts';
import { caseLabel, openQuiz } from './quiz.ts';
import { average, isDue, learnStatus, learningFor, preferred, setPreferred, statsFor, variants } from './store.ts';
import type { AlgVariant, Case, Group, Method, Phase } from './types.ts';

const $ = (id: string) => document.getElementById(id)!;
const section = $('case');
const figure = $('case-diagram');
const stage = $('case-player');
const body = $('case-body');

let kpuzzle: KPuzzle;
let player: TwistyPlayer | null = null;
let shown: Case | null = null; // the case on screen: callbacks of a dialog closed by leaving the page must not redraw it

const casePath = (m: Method, c: Case) => routePath({ mod: 'academy', page: { kind: 'case', method: m.id, id: c.id } });
const groupPath = (m: Method, g: Group) => `${routePath({ mod: 'academy', page: { kind: 'method', id: m.id } })}#academy-${g.id}`; // view.ts's anchors
const text = (s: string, className = '') => el('p', { textContent: s, className });

function diagram(phase: Phase, c: Case, size: number, title = ''): string {
  const mask = maskFor(c.stage);
  const facelets = patternToFacelets(caseState(kpuzzle, preferred(c).alg, IDENTITY));
  return (phase.diagram === 'iso' ? isoSVG : topSVG)(facelets, mask, { size, title, arrows: mask === 'pll' && size >= 84 });
}

const statusOf = (caseId: string): CaseStatus => {
  const l = learningFor(caseId);
  return isDue(l, Date.now()) ? 'due' : learnStatus(l);
};

/** A small linked card: diagram, code, name and how you're doing with it. */
function miniCard(m: Method, phase: Phase, c: Case): HTMLAnchorElement {
  const a = el('a', { className: 'mini-case', href: casePath(m, c) });
  a.innerHTML = diagram(phase, c, 56);
  a.firstElementChild!.setAttribute('aria-hidden', 'true'); // the link's text names it
  const status = statusOf(c.id);
  a.append(el('strong', { textContent: c.code }),
    ...(loc(c.name) === c.code ? [] : [el('span', { className: 'hint', textContent: loc(c.name) })]),
    ...(status === 'new' ? [] : [el('span', { className: `case-status ${status}`, textContent: t(`library.status.${status}`) })]));
  return a;
}

// --- The case page ---

/** Leaving the case's route: hide its section and stop its 3D player. */
export function stopCase(): void {
  section.hidden = true;
  shown = null;
  player?.pause();
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
    const tokens = tokenize(v.alg);
    figure.innerHTML = diagram(phase, c, 160, t('academy.diagram', { code: c.code }));
    player!.experimentalSetupAlg = ['z2', ...invertTokens(tokens)].join(' ');
    player!.alg = tokens.join(' ');
    player!.experimentalStickeringMaskOrbits = MASKS[c.stage];
    player!.jumpToStart();
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
    // the chosen algorithm first, then the others: any can become the chosen one
    const all = variants(c);
    const others = all.filter((x) => x.id !== v.id);
    const withTriggers = all.some((x) => triggerSegments(tokenize(x.alg)).some((s) => s.trigger));
    algs.replaceChildren(
      el('h3', { textContent: t('case.chosen') }), algCard(v, true),
      ...(others.length ? [el('h3', { textContent: t('case.alternatives') }), ...others.map((x) => algCard(x, false))] : []),
      ...(withTriggers ? [text(t('case.triggersHint'), 'hint')] : []));
    why.hidden = !inverse || inverse === c;
    if (inverse) why.replaceChildren(el('h3', { textContent: t('case.inverseWhy') }), text(t('case.inverseWhyText', { other: caseLabel(inverse) })));
    data.replaceChildren(el('h3', { textContent: t('case.yourData') }), yourData(c));
  };

  function algCard(v: AlgVariant, chosen: boolean): HTMLElement {
    const tokens = tokenize(v.alg);
    const tags = algTags(tokens);
    const box = el('div', { className: chosen ? 'case-alg chosen' : 'case-alg', tabIndex: -1, ...(chosen ? { ariaLabel: t('case.chosen') } : {}) },
      movesView(tokens),
      text([sourceLabel(v), t('practice.htm', { n: htm(centerMoves(tokens, IDENTITY)) })].join(' · '), 'hint'),
      ...(tags.length ? [el('ul', { className: 'chips', ariaLabel: t('case.tags') }, ...tags.map((tag) => el('li', { className: 'chip', textContent: t(`case.tag.${tag}`) })))] : []),
      ...(v.note ? [text(loc(v.note), 'hint')] : []));
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

  // Quiz of this one case: random states of it, answered among its group's cases.
  const quiz = () => void openQuiz({ kind: 'cases', id: c.id, cases: [c], answers: group.cases, title: caseLabel(c) }, fill);
  const action = (tab: Tab, hint: MessageKey, primary = false) => {
    const b = el('button', { type: 'button', className: primary ? 'primary' : '' },
      el('span', { textContent: t(`practice.tab.${tab}`) }), el('small', { textContent: t(hint) }));
    b.onclick = () => void openPractice(c, fill, quiz, tab);
    return b;
  };
  const actions = el('div', { className: 'case-actions', role: 'group', ariaLabel: t('practice.tabs') },
    action('test', 'case.testHint', true), action('case', 'case.caseHint'), action('drill', 'case.drillHint'));

  const recognition = el('section', { className: 'case-section' },
    el('h3', { textContent: t('case.recognition') }),
    text(loc(c.recognition)),
    ...(c.note ? [text(loc(c.note), 'hint')] : []),
    el('dl', {}, el('dt', { textContent: t('practice.setup') }), el('dd', {}, algView(c.setup))),
    ...(c.scdb ? [el('p', {}, el('a', { href: c.scdb.url, target: '_blank', rel: 'noopener', textContent: t('practice.scdb') }))] : []));
  const siblings = group.cases.filter((x) => x !== c);
  const others = !siblings.length ? [] : [el('section', { className: 'case-section' },
    el('h3', { textContent: t('case.others', { name: loc(group.name) }) }),
    el('div', { className: 'mini-cards' }, ...siblings.map((x) => miniCard(m, phase, x))))];

  section.hidden = false; // before the player: a 3D view set up at zero size stays blank
  player ??= new TwistyPlayer({ puzzle: '3x3x3', background: 'none', controlPanel: 'bottom-row', experimentalSetupAnchor: 'start', hintFacelets: 'none' });
  if (!player.isConnected) stage.append(player);
  body.replaceChildren(facts, actions, algs, recognition, why, data, ...others);
  fill();
  return el('header', { className: 'case-head' },
    el('h2', { textContent: caseLabel(c) }),
    text([loc(m.name), loc(phase.name), loc(group.name)].join(' · '), 'hint'));
}

/** The algorithm with its triggers as labelled groups; every move stays tappable. */
function movesView(tokens: string[]): HTMLElement {
  const out = el('div', { className: 'case-moves' });
  triggerSegments(tokens).forEach((s, i) => {
    if (i) out.append(' '); // real spaces: readable when copied
    if (!s.trigger) return void out.append(algView(s.tokens));
    const name = t(`case.trigger.${s.trigger}`);
    const label = s.left ? t('case.triggerLeft', { name }) : name;
    out.append(el('span', { className: 'trigger', role: 'group', ariaLabel: label },
      algView(s.tokens), el('span', { className: 'trigger-name', ariaHidden: 'true', textContent: label })));
  });
  return out;
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
  const filter: LibraryFilter = { query: params.get('q') ?? '', set: pick(params.get('set'), SETS), status: pick(params.get('estado'), STATUSES) };
  const search = el('input', { type: 'search', value: filter.query, placeholder: t('library.searchPlaceholder'), autocomplete: 'off', spellcheck: false });
  const select = (values: readonly string[], value: string, name: (v: string) => string) =>
    Object.assign(el('select', {}, ...['', ...values].map((v) => el('option', { value: v, textContent: name(v) }))), { value });
  const set = select(SETS, filter.set, (v) => (v ? t(`library.set.${v}` as MessageKey) : t('library.allSets')));
  const status = select(STATUSES, filter.status, (v) => (v ? t(`library.status.${v}` as MessageKey) : t('library.allStatuses')));
  const field = (label: string, input: HTMLElement) => el('label', { className: 'library-field' }, el('span', { className: 'hint', textContent: label }), input);
  const form = el('form', { className: 'library-filters', role: 'search', onsubmit: (e: SubmitEvent) => e.preventDefault() },
    field(t('library.search'), search), field(t('library.set'), set), field(t('library.status'), status));
  const count = el('p', { className: 'hint', ariaLive: 'polite' });

  const cards: { a: HTMLElement; c: Case; algs: string[] }[] = [];
  const list = el('div', { className: 'library-list' }, ...METHODS.map((m) => el('section', { className: 'library-method' },
    el('h3', { textContent: loc(m.name) }),
    ...m.phases.filter((p) => p.groups.some((g) => g.cases.length)).map((phase) => el('section', { className: 'library-phase' },
      el('h4', { textContent: loc(phase.name) }),
      ...phase.groups.map((g) => el('section', { className: 'library-group' },
        el('h5', { textContent: loc(g.name) }),
        el('div', { className: 'mini-cards' }, ...g.cases.map((c) => {
          const a = miniCard(m, phase, c);
          cards.push({ a, c, algs: variants(c).map((v) => v.alg) });
          return a;
        })))))))));

  const apply = () => {
    Object.assign(filter, { query: search.value, set: set.value, status: status.value });
    const now = Date.now();
    let n = 0;
    for (const x of cards) {
      x.a.hidden = !matches(x.c, x.algs, filter, learningFor(x.c.id), now);
      if (!x.a.hidden) n++;
    }
    list.querySelectorAll<HTMLElement>('.library-group, .library-phase, .library-method').forEach((s) => (s.hidden = !s.querySelector('.mini-case:not([hidden])')));
    count.textContent = n ? tp('library.count', n) : t('library.none');
    const q = new URLSearchParams(Object.entries({ q: filter.query.trim(), set: filter.set, estado: filter.status }).filter(([, v]) => v));
    history.replaceState(history.state, '', location.pathname + (q.size ? `?${q}` : ''));
  };
  search.oninput = set.onchange = status.onchange = apply;
  apply();
  return el('section', { className: 'library' },
    el('h2', { textContent: t('library.title') }),
    text(t('library.intro'), 'prose hint'),
    form, count, list);
}

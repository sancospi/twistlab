// The triggers page (/academia/gatillos; data in triggers.ts): an intro, then one card per trigger with its moves
// (tappable), a 3D replay (the cross guide's viewer), what it does, its inverse and mirrors, the fingers, the cases
// that use it and a hand-timed drill: N repetitions in a row, timed by tap or Space, scored in turns per second.
// ponytail: hand timer only; a smart cube could count the reps itself (link.ts), not wired here.
import type { KPuzzle } from 'cubing/kpuzzle';
import { prose, inlineText } from '../rich-text-view.ts';
import { algView } from '../notation-view.ts';
import { invertTokens, mirrorTokens, tokenize } from '../notation.ts';
import { formatTime } from '../timer.ts';
import { lang, loc, t, tp } from '../i18n.ts';
import { routePath } from '../router.ts';
import { show3D } from './crossTrainer.ts';
import { METHODS } from './methods.ts';
import { el, fingersView, tagChips } from './practice.ts';
import { caseLabel } from './quiz.ts';
import { load, save } from './store.ts';
import { BESTS_KEY, SPEED_ANCHOR, appearsIn, drillReps, parseBests, period, tps, triggerGuide, type TriggerInfo } from './triggers.ts';

const SHOWN = 3; // case links per method; the rest as "y N más"
const number = (x: number) => x.toFixed(1); // a dot, like formatTime's seconds on the same line

export function triggersView(kpuzzle: KPuzzle): HTMLElement {
  return el('section', { className: 'academy-phase' },
    el('h2', { textContent: loc(triggerGuide.name) }),
    prose(loc(triggerGuide.intro), 'prose', 'h3'),
    el('div', { className: 'trigger-cards' }, ...triggerGuide.triggers.map((x) => card(x, kpuzzle))),
    Object.assign(prose(loc(triggerGuide.speed), 'prose', 'h3'), { id: SPEED_ANCHOR })); // the case pages link here
}

function card(x: TriggerInfo, kpuzzle: KPuzzle): HTMLElement {
  const tokens = tokenize(x.alg);
  const n = period(kpuzzle, x.alg);
  const en = x.name.en !== x.name.es && lang === 'es' ? [el('span', { className: 'hint', textContent: ` · ${x.name.en}` })] : [];
  const form = (label: string, alg: string) => [el('dt', { textContent: label }), el('dd', {}, algView(alg))];
  const best = el('p', { className: 'hint' });
  const showBest = () => {
    const b = parseBests(load(BESTS_KEY))[x.id];
    best.textContent = b ? t('triggers.best', { tps: number(b.tps), reps: tp('triggers.repsCount', b.reps), time: formatTime(b.ms) }) : t('triggers.noBest');
  };
  showBest();
  const drill = drillView(x, tokens.length, drillReps(n), showBest);
  const practice = el('button', { type: 'button', className: 'small', textContent: t('triggers.practice'), ariaLabel: t('triggers.practiceOf', { name: loc(x.name) }), ariaExpanded: 'false' });
  practice.setAttribute('aria-controls', drill.id);
  practice.onclick = () => {
    drill.hidden = !drill.hidden;
    practice.ariaExpanded = String(!drill.hidden);
    if (!drill.hidden) drill.querySelector<HTMLElement>('.practice-clock')!.focus();
  };
  return el('article', { className: 'academy-group trigger-card', id: `gatillo-${x.id}` },
    el('h3', {}, loc(x.name), ...en),
    el('p', { className: 'trigger-alg' }, algView(x.alg)),
    ...tagChips(tokens),
    el('div', { className: 'row' },
      el('button', { type: 'button', className: 'small', textContent: t('cross.watch'), ariaLabel: t('cross.watchOf', { alg: x.alg }), onclick: () => show3D(loc(x.name), '', x.alg) }),
      practice),
    drill,
    best,
    el('p', {}, ...inlineText(loc(x.does))),
    el('p', { className: 'hint', textContent: tp('triggers.period', n) }),
    el('dl', { className: 'trigger-forms' },
      ...form(t('triggers.inverse'), invertTokens(tokens).join(' ')),
      ...form(t('triggers.mirror'), mirrorTokens(tokens).join(' ')),
      ...(x.back ? form(t('triggers.back'), x.back) : [])),
    el('p', {}, el('strong', { textContent: `${t('triggers.fingers')}: ` }), ...inlineText(loc(x.tip))),
    fingersView(tokens),
    appearsView(x.alg));
}

/** "Aparece en": per method, a few of its cases that use the trigger, and how many more. */
function appearsView(alg: string): HTMLElement {
  const out = el('div', { className: 'trigger-appears' }, el('strong', { textContent: t('triggers.appears') }));
  for (const { method, cases } of appearsIn(alg, METHODS)) {
    const links = cases.slice(0, SHOWN).flatMap((c, i) => [...(i ? [', '] : []),
      el('a', { href: routePath({ mod: 'academy', page: { kind: 'case', method: method.id, id: c.id } }), textContent: caseLabel(c) })]);
    const more = cases.length > SHOWN ? [` ${t('triggers.more', { n: cases.length - SHOWN })}`] : [];
    out.append(el('p', {}, `${loc(method.name)}: `, ...links, ...more));
  }
  return out;
}

/** The drill: how many repetitions, a clock started and stopped by tap or Space (it's a button), the result read out. */
function drillView(x: TriggerInfo, moves: number, reps: number, saved: () => void): HTMLElement {
  const count = el('input', { type: 'number', min: '1', max: '99', value: String(reps), inputMode: 'numeric' });
  const clock = el('button', { type: 'button', className: 'practice-clock', textContent: formatTime(0), ariaLabel: t('triggers.clock'), ariaPressed: 'false' }); // pressed = running
  const result = el('p', { ariaLive: 'polite' });
  let start = 0;
  const tick = () => {
    if (!start || !clock.isConnected) return; // stopped, or the page was left
    clock.textContent = formatTime(performance.now() - start);
    requestAnimationFrame(tick);
  };
  clock.onclick = () => {
    if (!start) {
      start = performance.now();
      clock.classList.add('running');
      clock.ariaPressed = 'true';
      result.textContent = '';
      return tick();
    }
    const ms = performance.now() - start;
    start = 0;
    clock.classList.remove('running');
    clock.ariaPressed = 'false';
    clock.textContent = formatTime(ms);
    const n = Math.max(1, Math.round(Number(count.value)) || reps);
    const score = tps(moves, n, ms);
    const all = parseBests(load(BESTS_KEY));
    const record = !all[x.id] || score > all[x.id].tps;
    if (record) save(BESTS_KEY, { ...all, [x.id]: { tps: score, reps: n, ms, at: Date.now() } });
    result.textContent = t('triggers.result', { reps: tp('triggers.repsCount', n), time: formatTime(ms), tps: number(score) }) + (record ? ` ${t('triggers.record')}` : '');
    saved();
  };
  return el('div', { className: 'trigger-drill', id: `gatillo-${x.id}-practica`, hidden: true },
    el('label', { className: 'trainer-option' }, t('triggers.reps'), count),
    el('p', { className: 'hint', textContent: t('triggers.drillHint') }),
    clock,
    result);
}

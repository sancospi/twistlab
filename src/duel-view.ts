// Resolver → a duel (duel.ts): the card of a duel opened by link, and sharing one. The card offers the scramble once;
// its solve comes back (solved) with who won and a link to answer with.
import { t } from './i18n.ts';
import { el } from './el.ts';
import { formatResult, type Result } from './timer.ts';
import { duelLink, outcome, type Duel } from './duel.ts';

let box: HTMLElement | undefined;
let duel: Duel | null = null;
let mine: Result | null = null;
let play: (scramble: string) => boolean | void = () => {};
let live: HTMLElement | undefined;
const say = (s: string) => void (live!.textContent = s);

/** Shares a link that challenges with `d` (the phone's share sheet, else the clipboard); its outcome, said in `status`. */
export async function shareDuel(d: Duel, status: (s: string) => void): Promise<void> {
  const url = duelLink(location.origin + location.pathname, d);
  const text = t('duel.shareText', { time: formatResult(d) });
  try {
    if (navigator.share) return void (await navigator.share({ text, url }));
    await navigator.clipboard.writeText(`${text} ${url}`);
    status(t('duel.copied'));
  } catch (e) {
    if ((e as Error).name !== 'AbortError') status(t('duel.copyFailed', { url })); // AbortError: the sheet was closed
  }
}

/** The card (#duel in the Resolver) for a duel opened by link; `onPlay`: main.ts makes its scramble the next one. */
export function showDuel(card: HTMLElement, d: Duel, onPlay: (scramble: string) => boolean | void): void {
  box = card;
  duel = d;
  mine = null;
  play = onPlay;
  live ??= el('p', { className: 'account-status', role: 'status' });
  render();
}

/** The duel's solve (main.ts): who won. */
export function solved(result: Result): void {
  if (!duel || mine) return; // one attempt: the first counts
  mine = result;
  render();
}

/** Redraws the card; main.ts calls it when results change (a penalty given to the duel's solve counts). */
export function render(): void {
  if (!box || !duel) return;
  const d = duel;
  const actions = el('div', { className: 'row' });
  const rows: Node[] = [];
  if (!mine) {
    rows.push(el('p', { textContent: t('duel.hint', { time: formatResult(d) }) }));
    actions.append(el('button', { className: 'primary', textContent: t('duel.play'), onclick: () => play(d.scramble) === false && say(t('challenge.busyRound')) }));
  } else {
    const o = outcome(mine, d);
    rows.push(el('p', {}, el('strong', { textContent: t(`duel.${o}`, { mine: formatResult(mine), theirs: formatResult(d) }) })));
    const m = mine;
    if (m.penalty !== 'DNF') actions.append(el('button', { className: 'primary', textContent: t('duel.reply'), onclick: () => void shareDuel({ scramble: d.scramble, ms: m.ms, penalty: m.penalty }, say) }));
  }
  actions.append(el('button', { type: 'button', textContent: t('duel.close'), onclick: () => { duel = null; box!.hidden = true; } }));
  box.replaceChildren(el('div', { className: 'daily-head' }, el('h3', { id: 'duel-title', textContent: t('duel.title') })), ...rows, actions, live!);
  box.hidden = false;
}

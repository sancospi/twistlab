// Entrenador «Anticipación» (look-ahead): F2L slowly, one turn per beat of a metronome, never stopping.
// Its own page (/academia/anticipacion), a tile in the Academia's «Entrenadores». view.ts draws the crumbs and calls
// lookaheadView; stopLookahead runs whenever the page is left. Texts: Localized (tr(es, en)) in this file.
// Each round: an F2L scramble (white cross solved, the rest random), then the F2L to the beat. With a smart cube: guided
// to the scramble, then its turns, pauses (gaps over 2 beats) and real TPS, and the F2L done ends the round. Without
// one: Empezar and Terminé by hand, and the learner counts their own pauses.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { loc, t, type Localized } from '../i18n.ts';
import { el } from '../el.ts';
import { YELLOW_UP, centerMoves, merge, turnCount } from '../notation.ts';
import { patternToFacelets } from '../facelets.ts';
import { formatTime } from '../timer.ts';
import { algView } from '../notation-view.ts';
import { prose } from '../rich-text-view.ts';
import { describe, nextStep, PathGuide } from '../guide.ts';
import { solveCross } from './cross.ts';
import { goalReached } from './cube.ts';
import { isoSVG } from './diagram.ts';
import { cube, type CubeListener } from './link.ts';
import { svgBox } from './pllRecognition.ts';
import { load, save, setting } from './store.ts';

const tr = (es: string, en: string, pt: string): Localized => ({ es, en, pt });

// --- The drill's logic: pure ---

type Rng = () => number;
const pick = <T>(rng: Rng, xs: T[]): T => xs[Math.floor(rng() * xs.length)];
const MOVES = [...'UDRLFB'].flatMap((f) => [f, `${f}'`, `${f}2`]);

/** An F2L practice scramble, user frame (yellow up, green front): random turns, then their shortest white cross, so the
 *  cross ends up solved on D and the 4 pairs and the last layer anywhere. Drawn again in the rare case the F2L is solved. */
export function f2lScramble(kpuzzle: KPuzzle, rng: Rng): string[] {
  for (;;) {
    const moves: string[] = [];
    while (moves.length < 20) {
      const m = pick(rng, MOVES);
      if (m[0] !== moves.at(-1)?.[0]) moves.push(m);
    }
    const p = kpuzzle.defaultPattern().applyAlg(moves.join(' '));
    const scramble = merge([...moves, ...solveCross(p, 'D', 1)[0]]);
    if (!goalReached('f2l', kpuzzle.defaultPattern().applyAlg(scramble.join(' ')), 'U')) return scramble;
  }
}

/** Pauses: gaps between turns (their times, ms) longer than 2 beats. */
export const pauses = (times: number[], beatMs: number): number => times.filter((x, i) => i > 0 && x - times[i - 1] > 2 * beatMs).length;

/** A round as kept: the target TPS, its time, pauses and, with a smart cube, its turns. */
export interface Round { at: number; tps: number; ms: number; pauses: number; turns?: number }
const KEY = 'academy-lookahead';
const KEEP = 50;
const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

export function parseRounds(raw: unknown): Round[] {
  return (Array.isArray(raw) ? raw : []).filter((r): r is Round => !!r && [r.at, r.tps, r.ms, r.pauses].every(isCount)
    && (r.turns === undefined || isCount(r.turns))).slice(-KEEP);
}

/** Real turns per second; null without the turns (no smart cube). */
export const realTps = (r: Round): number | null => (r.turns === undefined || !r.ms ? null : r.turns / (r.ms / 1000));

// --- The page ---

const TPS = [1, 2, 3, 4];
type Screen = 'scramble' | 'ready' | 'run' | 'done';
let leave = () => {};

const count = (n: number, one: Localized, many: Localized) => `${n} ${loc(n === 1 ? one : many)}`;
const [PAUSE, PAUSES, TURN, TURNS] = [tr('parada', 'pause', 'parada'), tr('paradas', 'pauses', 'paradas'), tr('giro', 'turn', 'movimento'), tr('giros', 'turns', 'movimentos')];
const decimal = (x: number) => String(Math.round(x * 10) / 10); // a dot, like formatTime's times on the same line
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function roundText(r: Round): string {
  const real = realTps(r);
  return loc(tr(
    `${formatTime(r.ms)} s · ${count(r.pauses, PAUSE, PAUSES)} · ritmo ${r.tps} TPS${real === null ? '' : ` · real ${decimal(real)} TPS · ${count(r.turns!, TURN, TURNS)}`}`,
    `${formatTime(r.ms)} s · ${count(r.pauses, PAUSE, PAUSES)} · pace ${r.tps} TPS${real === null ? '' : ` · actual ${decimal(real)} TPS · ${count(r.turns!, TURN, TURNS)}`}`,
    `${formatTime(r.ms)} s · ${count(r.pauses, PAUSE, PAUSES)} · ritmo ${r.tps} TPS${real === null ? '' : ` · real ${decimal(real)} TPS · ${count(r.turns!, TURN, TURNS)}`}`,
  ));
}

function sessionText(rs: Round[]): string {
  if (!rs.length) return loc(tr('Esta sesión: aún sin rondas.', 'This session: no rounds yet.', 'Esta sessão: ainda sem rodadas.'));
  const real = rs.map(realTps).filter((x) => x !== null);
  return loc(tr(
    `Esta sesión: ${count(rs.length, tr('ronda', 'round', 'rodada'), tr('rondas', 'rounds', 'rodadas'))} · paradas por ronda ${decimal(mean(rs.map((r) => r.pauses)))} · tiempo medio ${formatTime(mean(rs.map((r) => r.ms)))} s`,
    `This session: ${count(rs.length, tr('ronda', 'round', 'rodada'), tr('rondas', 'rounds', 'rodadas'))} · pauses per round ${decimal(mean(rs.map((r) => r.pauses)))} · mean time ${formatTime(mean(rs.map((r) => r.ms)))} s`,
    `Esta sessão: ${count(rs.length, tr('ronda', 'round', 'rodada'), tr('rondas', 'rounds', 'rodadas'))} · paradas por rodada ${decimal(mean(rs.map((r) => r.pauses)))} · tempo médio ${formatTime(mean(rs.map((r) => r.ms)))} s`,
  )) + (real.length ? loc(tr(` · TPS real ${decimal(mean(real))}`, ` · actual TPS ${decimal(mean(real))}`, ` · TPS real ${decimal(mean(real))}`)) : '');
}

/** The trainer's page, under the Academia's crumbs. */
export function lookaheadView(kpuzzle: KPuzzle): HTMLElement {
  let tps = setting('academy-lookahead-tps', 1, (v) => TPS.includes(v));
  const history = parseRounds(load(KEY));
  const session: Round[] = [];
  let screen: Screen = 'ready';
  let withCube = false;
  let scramble: string[] = [];
  let startAt = 0; // the clock: Empezar (by hand) or the first turn (smart cube)
  let times: number[] = []; // smart cube: each turn's time
  let done: string[] = [];
  let selfPauses = 0;
  let last: Round | null = null;
  const beatMs = () => 1000 / tps;

  const stats = el('p', { className: 'trainer-stats' });
  const recent = el('ul', { className: 'hint' });
  const stage = el('div', { className: 'lookahead-stage' });
  const status = el('p', { className: 'trainer-feedback', role: 'status' });
  const beat = el('span', { className: 'beat', ariaHidden: 'true' });
  const clock = el('span', { className: 'lookahead-clock' });

  const guide = new PathGuide(() => cube.pattern(), () => {
    if (screen === 'scramble' && guide.reached()) toReady(); // an empty plan: already there
    else if (screen === 'scramble') render();
  });

  // Web Audio clicks, scheduled a little ahead so they keep time while the page is busy; the dot flashes with each one.
  let audio: AudioContext | null = null;
  let ticking = 0;
  function startMetronome() {
    stopMetronome();
    const ctx = (audio ??= new AudioContext()); // created on a tap: browsers keep audio silent until then
    void ctx.resume();
    let at = ctx.currentTime + 0.05;
    const schedule = () => {
      for (; at < ctx.currentTime + 0.2; at += beatMs() / 1000) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.4, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.06);
        setTimeout(() => {
          if (!ticking) return;
          beat.classList.add('on');
          setTimeout(() => beat.classList.remove('on'), 90);
        }, Math.max(0, (at - ctx.currentTime) * 1000));
      }
    };
    schedule();
    ticking = window.setInterval(schedule, 40);
  }
  function stopMetronome() {
    clearInterval(ticking);
    ticking = 0;
    beat.classList.remove('on');
  }

  let raf = 0;
  const tick = () => {
    if (screen !== 'run') return;
    clock.textContent = `${formatTime(startAt ? performance.now() - startAt : 0)} s`;
    raf = requestAnimationFrame(tick);
  };

  function newRound() {
    stopMetronome();
    withCube = !!cube.pattern();
    scramble = f2lScramble(kpuzzle, Math.random);
    times = [];
    done = [];
    selfPauses = 0;
    last = null;
    if (!withCube) return toReady();
    screen = 'scramble';
    void guide.start(kpuzzle.defaultPattern().applyAlg(centerMoves(scramble, YELLOW_UP).join(' ')));
    render();
  }

  function toReady() {
    guide.stop();
    screen = 'ready';
    render();
  }

  function run() {
    screen = 'run';
    startAt = withCube ? 0 : performance.now();
    startMetronome();
    render();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function finish() {
    stopMetronome();
    const ms = startAt ? performance.now() - startAt : 0;
    last = withCube ? { at: Date.now(), tps, ms: Math.round(ms), pauses: pauses(times, beatMs()), turns: turnCount(done) }
      : { at: Date.now(), tps, ms: Math.round(ms), pauses: selfPauses };
    session.push(last);
    history.push(last);
    save(KEY, history.slice(-KEEP));
    screen = 'done';
    render();
  }

  const listener: CubeListener = {
    move(move) {
      if (!withCube) return; // a cube connected mid-round: this round carries on by hand
      if (screen === 'scramble') {
        guide.onMove(move);
        if (guide.reached()) toReady();
        else render();
        return;
      }
      if (screen === 'ready') run(); // the first turn starts the round
      if (screen !== 'run') return;
      const now = performance.now();
      startAt ||= now;
      times.push(now);
      done.push(move);
      if (goalReached('f2l', cube.pattern()!, YELLOW_UP)) return finish();
      live();
    },
    sync(reset) {
      if (screen === 'done' || (!withCube && screen === 'run')) return; // a round by hand carries on
      const has = !!cube.pattern();
      if (has !== withCube || reset) return newRound(); // connected, disconnected or reset: the state is gone, set it up again
      if (screen === 'scramble') void guide.replan();
    },
  };
  cube.listener = listener;
  leave = () => {
    stopMetronome();
    cancelAnimationFrame(raf);
    guide.stop();
    if (cube.listener === listener) cube.listener = null;
    void audio?.close();
    audio = null;
  };

  /** The run's numbers as they go: turns, pauses and real TPS (smart cube) or the pauses counted by hand. */
  function live() {
    status.textContent = withCube
      ? `${count(turnCount(done), TURN, TURNS)} · ${count(pauses(times, beatMs()), PAUSE, PAUSES)}`
        + (times.length > 1 ? ` · ${decimal(turnCount(done) / ((times.at(-1)! - times[0]) / 1000 || 1))} TPS` : '')
      : count(selfPauses, PAUSE, PAUSES);
  }

  const button = (text: Localized, onclick: () => void, primary = false) =>
    el('button', { type: 'button', className: primary ? 'primary' : '', textContent: loc(text), onclick });

  // the pace: 1 to 4 turns per second (not while a round runs)
  const paces = TPS.map((n) => el('button', { type: 'button', textContent: String(n), onclick: () => {
    save('academy-lookahead-tps', (tps = n));
    paces.forEach((b, i) => b.setAttribute('aria-pressed', String(TPS[i] === tps)));
  } }));
  paces.forEach((b, i) => b.setAttribute('aria-pressed', String(TPS[i] === tps)));
  const paceSwitch = el('div', { className: 'trainer-switch', role: 'group', ariaLabel: loc(tr('Ritmo, giros por segundo', 'Pace, turns per second', 'Ritmo, movimentos por segundo')) },
    el('small', { className: 'hint', ariaHidden: 'true', textContent: loc(tr('Ritmo (TPS)', 'Pace (TPS)', 'Ritmo (TPS)')) }), ...paces);

  const scrambleBox = () => el('div', { className: 'trainer-stage' },
    svgBox('trainer-figure', isoSVG(patternToFacelets(kpuzzle.defaultPattern().applyAlg(scramble.join(' '))), 'full',
      { size: 140, title: loc(tr('Así queda el cubo tras la mezcla', 'The cube after the scramble', 'Assim fica o cubo depois do embaralhamento')) })));

  function render() {
    paces.forEach((b) => (b.disabled = screen === 'run'));
    stats.textContent = sessionText(session);
    recent.replaceChildren(...history.slice(-5).reverse().map((r) => el('li', { textContent: roundText(r) })));
    status.textContent = '';
    status.className = 'trainer-feedback';
    if (screen === 'scramble') {
      const g = guide.guide, next = g && nextStep(g), shown = next && cube.label(next);
      stage.replaceChildren(
        el('p', { textContent: loc(tr('Con amarillo arriba y verde al frente, haz estos giros en tu cubo. Si te equivocas, se recalcula.',
          'With yellow up and green in front, do these turns on your cube. If you slip, it plans again.',
          'Com o amarelo em cima e o verde na frente, faça estes movimentos no seu cubo. Se errar, eu recalculo.')) }),
        el('p', { className: 'lookahead-next', textContent: shown ? `${shown} · ${describe(shown)}` : loc(tr('Calculando…', 'Planning…', 'Calculando…')) }),
        algView((g?.steps ?? []).map(cube.label), { mark: (i) => (i === 0 ? 'current' : '') }),
        el('div', { className: 'row' }, button(tr('Otra mezcla', 'Another scramble', 'Outro embaralhamento'), newRound)));
    } else if (screen === 'ready') {
      stage.replaceChildren(
        ...(withCube ? [el('p', { textContent: loc(tr(
          'Cubo listo. Busca tu primer par sin prisa. Tu primer giro arranca el reloj y el metrónomo (o pulsa Empezar para oír el ritmo antes).',
          'Cube ready. Find your first pair, no rush. Your first turn starts the clock and the metronome (or press Start to hear the beat first).',
          'Cubo pronto. Procure seu primeiro par sem pressa. Seu primeiro movimento inicia o relógio e o metrônomo (ou aperte Começar para ouvir o ritmo antes).')) })]
          : [el('p', { textContent: loc(tr('Mezcla con amarillo arriba y verde al frente (la cruz blanca queda abajo, hecha):',
            'Scramble with yellow up and green in front (the white cross ends up solved, underneath):',
            'Embaralhe com o amarelo em cima e o verde na frente (a cruz branca fica embaixo, resolvida):')) }),
          el('p', {}, algView(scramble)), scrambleBox()]),
        el('div', { className: 'row' }, button(tr('Empezar', 'Start', 'Começar'), run, true), button(tr('Otra mezcla', 'Another scramble', 'Outro embaralhamento'), newRound)));
    } else if (screen === 'run') {
      stage.replaceChildren(
        el('p', { className: 'lookahead-run' }, beat, clock),
        el('p', { className: 'hint', textContent: loc(withCube ? tr('Un giro por golpe. Nunca te pares: si dudas, gira más lento, pero sigue.',
          'One turn per beat. Never stop: if unsure, turn slower, but keep going.',
          'Um movimento por batida. Nunca pare: se ficar em dúvida, gire mais devagar, mas continue.')
          : tr('Un giro por golpe, sin parar. Si te paras, toca «Me paré». Al terminar el F2L, toca «Terminé».',
            'One turn per beat, without stopping. If you stop, tap «I stopped». When the F2L is done, tap «Done».',
            'Um movimento por batida, sem parar. Se parar, toque em "Parei". Ao terminar o F2L, toque em "Terminei".')) }),
        el('div', { className: 'row' }, ...(withCube ? [button(tr('Dejarlo', 'Give up', 'Desistir'), newRound)] : [
          button(tr('Me paré', 'I stopped', 'Parei'), () => (selfPauses++, live())),
          button(tr('Terminé', 'Done', 'Terminei'), finish, true)])));
      clock.textContent = `${formatTime(0)} s`;
      live();
    } else {
      const r = last!;
      stage.replaceChildren(
        el('p', { className: 'lookahead-result', textContent: roundText(r) }),
        el('p', { className: 'hint', textContent: loc(r.pauses ? tr('Cada parada es un par que no buscaste mientras girabas. Si se repiten, baja el ritmo: lo que cuenta es no parar.',
          'Each pause is a pair you didn\'t look for while turning. If they keep coming, lower the pace: what counts is not stopping.',
          'Cada parada é um par que você não procurou enquanto girava. Se elas se repetirem, baixe o ritmo: o que conta é não parar.')
          : tps < 4 ? tr(`¡Sin paradas! Cuando te salga así varias veces seguidas, sube a ${tps + 1} TPS.`, `No pauses! Once that happens a few times in a row, go up to ${tps + 1} TPS.`,
              `Sem paradas! Quando sair assim várias vezes seguidas, suba para ${tps + 1} TPS.`)
            : tr('¡Sin paradas a 4 TPS! Ya miras por delante.', 'No pauses at 4 TPS! You already look ahead.', 'Sem paradas a 4 TPS! Você já olha adiante.')) }),
        el('div', { className: 'row' }, button(tr('Otra mezcla', 'Another scramble', 'Outro embaralhamento'), newRound, true)));
    }
  }

  newRound();
  return el('section', { className: 'academy-trainer' },
    el('h2', { textContent: t('trainer.anticipacion.title') }),
    prose(loc(tr(
      'Haz el F2L **despacio pero sin parar**: un giro por cada golpe del metrónomo. Mientras resuelves un par, busca con la vista el siguiente. Empieza a 1 giro por segundo y sube cuando no te pares.\nCon el **cubo inteligente** cuento los giros, las **paradas** (más de 2 golpes sin girar) y tu ritmo real, y la ronda acaba sola al terminar el F2L. Sin él, usa los botones.',
      'Do the F2L **slowly but without stopping**: one turn per beat of the metronome. While you solve a pair, look for the next one. Start at 1 turn per second and go up when you don\'t stop.\nWith the **smart cube** I count the turns, the **pauses** (over 2 beats without turning) and your real pace, and the round ends by itself when the F2L is done. Without it, use the buttons.',
      'Faça o F2L **devagar, mas sem parar**: um movimento por batida do metrônomo. Enquanto resolve um par, procure o próximo com os olhos. Comece com 1 movimento por segundo e suba quando não parar mais.\nCom o **cubo inteligente** eu conto os movimentos, as **paradas** (mais de 2 batidas sem girar) e o seu ritmo real, e a rodada termina sozinha ao terminar o F2L. Sem ele, use os botões.',
    ))),
    el('div', { className: 'trainer-options' }, paceSwitch),
    stage, status, stats, recent);
}

/** Leaving the page: the metronome, the clock and the cube. */
export function stopLookahead(): void {
  leave();
  leave = () => {};
}

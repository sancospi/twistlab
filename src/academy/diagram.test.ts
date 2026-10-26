import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { SOLVED_FACELETS, patternToFacelets } from '../facelets.ts';
import { IDENTITY, centerMoves, expand } from '../notation.ts';
import { caseState } from './cube.ts';
import { caseDiagram, isoSVG, llArrows, maskFor, topSVG, netSVG, turned, twoSidesSVG } from './diagram.ts';
import { METHODS, allCases, findCase } from './methods.ts';
import { phaseOf } from './probability.ts';

const YELLOW = '#ffd60a', GREEN = '#22c55e', WHITE = '#f5f5f5', ORANGE = '#ff8a1f', GREY = '#9ca3af';

/** facelet index -> { fill, points } for every sticker in the markup. */
function stickers(svg: string): Map<number, { fill: string; points: string }> {
  const out = new Map<number, { fill: string; points: string }>();
  for (const m of svg.matchAll(/<\w+ data-facelet="(\d+)"([^>]*)>/g)) {
    out.set(+m[1], { fill: /fill="([^"]+)"/.exec(m[2])![1], points: /points="([^"]+)"/.exec(m[2])?.[1] ?? '' });
  }
  return out;
}
const fill = (svg: string, i: number) => stickers(svg).get(i)!.fill;

test('maskFor maps stages to masks', () => {
  assert.equal(maskFor('f2l'), 'f2l');
  assert.equal(maskFor('oll-cross'), 'oll-cross'); // the cross step looks at edges only
  assert.equal(maskFor('oll-corners'), 'oll');
  assert.equal(maskFor('pll-corners'), 'pll');
  assert.equal(maskFor('pll-edges'), 'pll');
  assert.equal(maskFor('first-layer'), 'first-layer');
  assert.equal(maskFor('second-layer'), 'f2l');
  assert.equal(maskFor('ll-edges'), 'll-edges');
  assert.equal(maskFor('ll-corners-placed'), 'pll');
  assert.equal(maskFor('ll-corners-twist'), 'pll');
});

test('first-layer mask shows the white pieces and the side centers only', async () => {
  const iso = stickers(isoSVG(SOLVED_FACELETS, 'first-layer'));
  for (const [i, s] of iso) assert.equal(s.fill !== GREY, [13, 15, 16, 17, 22, 24, 25, 26].includes(i), `facelet ${i}`);
  // white pieces up in the U layer are shown whole, wherever they are
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  const f = patternToFacelets(solved.applyAlg(centerMoves('R2', IDENTITY).join(' ')));
  const out = stickers(isoSVG(f, 'first-layer'));
  const white = [...out].filter(([i]) => f[i] === 'D').map(([i]) => i);
  assert.ok(white.some((i) => i < 9)); // white on top
  for (const i of white) assert.notEqual(out.get(i)!.fill, GREY);
});

test('ll-edges mask greys the yellow corners, keeps the yellow edges in full color', () => {
  const top = stickers(topSVG(SOLVED_FACELETS, 'll-edges'));
  for (const i of [0, 2, 6, 8, 45, 47, 18, 20, 36, 38, 9, 11]) assert.equal(top.get(i)!.fill, GREY, `facelet ${i}`);
  for (const i of [1, 3, 4, 5, 7]) assert.equal(top.get(i)!.fill, YELLOW, `facelet ${i}`);
  for (const [i, color] of [[19, GREEN], [10, ORANGE]] as const) assert.equal(top.get(i)!.fill, color);
});

test('solved cube: iso shows U, F, R fully colored; top shows U and its side bars', () => {
  const iso = stickers(isoSVG(SOLVED_FACELETS, 'full'));
  assert.equal(iso.size, 27);
  for (let i = 0; i < 9; i++) assert.equal(iso.get(i)!.fill, YELLOW);
  for (let i = 9; i < 18; i++) assert.equal(iso.get(i)!.fill, ORANGE);
  for (let i = 18; i < 27; i++) assert.equal(iso.get(i)!.fill, GREEN);
  const top = stickers(topSVG(SOLVED_FACELETS, 'pll'));
  assert.deepEqual([...top.keys()].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 36, 37, 38, 45, 46, 47]);
  assert.equal(top.get(47)!.fill, '#2563eb');
  assert.equal(top.get(36)!.fill, '#d1192e');
});

test('svg is accessible and escapes its title', () => {
  const s = isoSVG(SOLVED_FACELETS, 'full', { title: 'A1 <F2L>', size: 120 });
  assert.match(s, /^<svg [^>]*role="img"[^>]*><title>A1 &lt;F2L&gt;<\/title>/);
  assert.match(s, /width="120"/);
  assert.match(topSVG(SOLVED_FACELETS, 'oll', { title: 'Sune' }), /<title>Sune<\/title>/);
});

test('f2l mask greys the U-layer pieces and the U center only', () => {
  const iso = stickers(isoSVG(SOLVED_FACELETS, 'f2l'));
  for (const [i, s] of iso) {
    const lastLayer = i < 9 || [9, 10, 11, 18, 19, 20].includes(i);
    assert.equal(s.fill === GREY, lastLayer, `facelet ${i}`);
  }
  // a first-layer piece showing yellow (white on top in its slot) is greyed as a whole
  const f = [...SOLVED_FACELETS];
  [f[26], f[15], f[29]] = ['U', 'U', 'U']; // pretend DFR holds a yellow piece
  const masked = stickers(isoSVG(f.join(''), 'f2l'));
  assert.equal(masked.get(26)!.fill, GREY);
  assert.equal(masked.get(15)!.fill, GREY);
  assert.equal(masked.get(25)!.fill, GREEN); // DF edge untouched
});

test('oll mask colors only yellow stickers', () => {
  const f = [...SOLVED_FACELETS];
  [f[0], f[47]] = ['B', 'U']; // a twisted-looking ULB corner
  const top = stickers(topSVG(f.join(''), 'oll'));
  assert.equal(top.get(0)!.fill, GREY);
  assert.equal(top.get(47)!.fill, YELLOW);
  assert.equal(top.get(4)!.fill, YELLOW);
  assert.equal(top.get(18)!.fill, GREY);
  assert.match(topSVG(f.join(''), 'oll'), /data-facelet="18"[^>]*fill-opacity/);
});

test('cubing.js state after R: U right column shows green, F right column white', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  const svg = isoSVG(patternToFacelets(solved.applyAlg('R')), 'full');
  for (const i of [2, 5, 8]) assert.equal(fill(svg, i), GREEN);
  for (const i of [0, 3, 6]) assert.equal(fill(svg, i), YELLOW);
  for (const i of [20, 23, 26]) assert.equal(fill(svg, i), WHITE);
  for (const i of [18, 21, 24]) assert.equal(fill(svg, i), GREEN);
  for (let i = 9; i < 18; i++) assert.equal(fill(svg, i), ORANGE);
});

test('iso geometry: U9 shares an edge with F3 and R1; up-front-right corner is nearest', () => {
  const iso = stickers(isoSVG(SOLVED_FACELETS, 'full'));
  const pts = (i: number) => new Set(iso.get(i)!.points.split(' '));
  const shared = (a: number, b: number) => [...pts(a)].filter((p) => pts(b).has(p)).length;
  assert.equal(shared(8, 20), 2);
  assert.equal(shared(8, 9), 2);
  assert.equal(shared(20, 9), 2); // F's right column touches R's left column
  assert.equal(shared(6, 18), 2); // U's front row touches F's top row
  assert.equal(shared(0, 20), 0);
  const corner = [...pts(8)].filter((p) => pts(20).has(p) && pts(9).has(p));
  assert.deepEqual(corner, ['0,0']); // the corner where U, F and R meet sits in the middle of the drawing
});

// Scrambled states: stickers drawn next to each other across faces (iso) or bars next to a U sticker (top) must
// be one real piece — stickers from different axes — and the f2l mask must grey whole pieces, exactly the yellow ones.
test('masks and sticker placement hold on scrambled states', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  const axis = (c: string) => 'UD RL FB'.split(' ').findIndex((a) => a.includes(c));
  let s = 3;
  const rnd = (k: number) => ((s = (s * 1103515245 + 12345) % 2 ** 31), s % k);
  const nums = (str: string, attr: string) => +new RegExp(`${attr}="([^"]+)"`).exec(str)![1];
  // iso: stickers of different faces that share an edge; top: each bar with the nearest U sticker
  const iso = stickers(isoSVG(SOLVED_FACELETS, 'full'));
  const pts = (i: number) => iso.get(i)!.points.split(' ');
  const isoPairs = [...iso.keys()].flatMap((a) => [...iso.keys()].filter((b) =>
    Math.floor(a / 9) < Math.floor(b / 9) && pts(a).filter((p) => pts(b).includes(p)).length === 2).map((b) => [a, b]));
  assert.equal(isoPairs.length, 9);
  const rects = [...topSVG(SOLVED_FACELETS, 'full').matchAll(/<rect data-facelet="(\d+)"([^>]*)>/g)]
    .map((m) => ({ i: +m[1], x: nums(m[2], 'x') + nums(m[2], 'width') / 2, y: nums(m[2], 'y') + nums(m[2], 'height') / 2 }));
  const cells = rects.filter((r) => r.i < 9), bars = rects.filter((r) => r.i >= 9);
  const topPairs = bars.map((b) => [cells.reduce((m, c) => (Math.hypot(c.x - b.x, c.y - b.y) < Math.hypot(m.x - b.x, m.y - b.y) ? c : m)).i, b.i]);
  assert.equal(topPairs.length, 12);
  for (let n = 0; n < 60; n++) {
    const alg = Array.from({ length: 25 }, () => 'UDRLFB'[rnd(6)] + ['', "'", '2'][rnd(3)]).join(' ');
    const f = patternToFacelets(solved.applyAlg(alg));
    const isoF2l = stickers(isoSVG(f, 'f2l')), topF2l = stickers(topSVG(f, 'f2l')), topOll = stickers(topSVG(f, 'oll'));
    for (const [pairs, drawn] of [[isoPairs, isoF2l], [topPairs, topF2l]] as const) {
      for (const [a, b] of pairs) {
        assert.notEqual(axis(f[a]), axis(f[b]), `${alg}: ${a} and ${b} are not one piece`);
        assert.equal(drawn.get(a)!.fill === GREY, drawn.get(b)!.fill === GREY, `${alg}: ${a}/${b} half masked`);
        if (f[a] === 'U' || f[b] === 'U') assert.equal(drawn.get(a)!.fill, GREY, `${alg}: yellow piece at ${a} shown`);
      }
    }
    for (const [i, st] of topOll) assert.equal(st.fill === GREY, f[i] !== 'U', `${alg}: oll ${i}`);
    assert.equal(isoF2l.get(4)!.fill, GREY);
  }
});

test('oll-cross mask shows yellow on edges and center only, like the plan\'s cross step', () => {
  // solved: every U sticker is yellow, but corners (and their side stickers) must be grey
  const svg = topSVG('U'.repeat(9) + 'R'.repeat(9) + 'F'.repeat(9) + 'D'.repeat(9) + 'L'.repeat(9) + 'B'.repeat(9), 'oll-cross');
  const fillOf = (i: number) => svg.match(new RegExp(`data-facelet="${i}"[^>]*fill="([^"]+)"`))![1];
  for (const i of [1, 3, 4, 5, 7]) assert.equal(fillOf(i), '#ffd60a');
  for (const i of [0, 2, 6, 8]) assert.notEqual(fillOf(i), '#ffd60a');
  assert.equal(maskFor('oll-cross'), 'oll-cross');
});

test('PLL arrows send each top-layer piece home; a swap is one line with two heads', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const state = (id: string) => patternToFacelets(caseState(kpuzzle, findCase(id)!.algs[0].alg, IDENTITY));
  assert.deepEqual(llArrows(SOLVED_FACELETS), []);
  assert.equal(topSVG(SOLVED_FACELETS, 'pll', { arrows: true }).includes('<line'), false);
  const sorted = (a: [number, number][]) => a.map((x) => x.join('>')).sort();
  // H: opposite edges swap (UB-UF, UL-UR), corners stay.
  assert.deepEqual(sorted(llArrows(state('cfop-pll-h'))), ['1>7', '3>5', '5>3', '7>1']);
  const h = topSVG(state('cfop-pll-h'), 'pll', { arrows: true });
  assert.equal(h.match(/<line/g)?.length, 2);
  assert.equal(h.match(/<polygon/g)?.length, 4);
  // Ua: a 3-cycle of edges, one head each; the arrows aren't drawn unless asked.
  const ua = state('cfop-pll-ua');
  assert.equal(llArrows(ua).length, 3);
  assert.equal(topSVG(ua, 'pll', { arrows: true }).match(/<line/g)?.length, 3);
  assert.equal(topSVG(ua, 'pll').includes('<line'), false);
  // an AUF away (before or after the algorithm) it's still its own permutation, seen from another side
  const auf = (id: string, before: string, after: string) => patternToFacelets(kpuzzle.defaultPattern()
    .applyAlg([before, ...centerMoves(findCase(id)!.algs[0].alg, IDENTITY)].join(' ')).applyAlg(after));
  assert.equal(llArrows(auf('cfop-pll-ua', 'U', '')).length, 3);
  assert.deepEqual(sorted(llArrows(auf('cfop-pll-h', "U'", 'U2'))), sorted(llArrows(auf('cfop-pll-h', 'U', '')))); // H: always the edges
  assert.deepEqual(sorted(llArrows(auf('cfop-pll-h', 'U2', ''))), ['1>7', '3>5', '5>3', '7>1']);
});

test('netSVG: every face in its place of the cross, every sticker coloured', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const after = netSVG(patternToFacelets(kpuzzle.defaultPattern().applyMove('R'))); // user frame: R lifts F's right column to U
  const at = (svg: string, i: number) => {
    const m = svg.match(new RegExp(`data-facelet="${i}" x="([\\d.]+)" y="([\\d.]+)"[^>]*fill="([^"]+)"`))!;
    return { x: +m[1], y: +m[2], fill: m[3] };
  };
  for (const i of [2, 5, 8]) assert.equal(at(after, i).fill, '#22c55e', 'U right column shows green');
  assert.equal(at(after, 0).fill, '#ffd60a');
  const solved = netSVG(SOLVED_FACELETS);
  assert.equal((solved.match(/data-facelet=/g) ?? []).length, 54);
  // U sits right above F, L left of F, R right of F, B right of R, D below F
  const u7 = at(solved, 6), f1 = at(solved, 18), l3 = at(solved, 38), r1 = at(solved, 9), b1 = at(solved, 45), d1 = at(solved, 27);
  assert.equal(u7.x, f1.x); assert.ok(u7.y < f1.y);
  assert.ok(l3.x < f1.x && l3.y === f1.y);
  assert.ok(r1.x > f1.x && r1.y === f1.y && b1.x > r1.x && b1.y === r1.y);
  assert.equal(d1.x, f1.x); assert.ok(d1.y > f1.y);
});

test('netSVG with the cross mask: the white edges, wherever they are, and the centers in color; the rest grey', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const svg = netSVG(patternToFacelets(kpuzzle.defaultPattern().applyAlg("R' F' R")), {}, 'cross'); // white-green up at the right, white facing right
  const fill = (i: number) => svg.match(new RegExp(`data-facelet="${i}"[^>]*fill="([^"]+)"`))![1];
  assert.equal(fill(5), '#22c55e'); // its green sticker on U
  assert.equal(fill(10), '#f5f5f5'); // its white sticker on R
  for (const i of [4, 13, 22, 31, 40, 49]) assert.notEqual(fill(i), '#9ca3af', `center ${i}`);
  for (const i of [0, 2, 9, 7, 28]) assert.equal(fill(i), '#9ca3af', `${i}: a corner or a yellow edge`);
  assert.equal(fill(32), '#f5f5f5'); // the white-orange still at the bottom right
});

test('turned: the whole cube seen after x or y, every sticker its own color (checked against cubing.js)', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const p = kpuzzle.defaultPattern().applyAlg("R U F' L2 D B' R2 U'");
  for (const rot of ['x', 'y'] as const) {
    // cubing.js: the state conjugated by the turn (centers home again), its letters named by the turned frame
    const r = kpuzzle.algToTransformation(rot);
    const seen = KPattern.fromTransformation(r.invert().applyTransformation(p.experimentalToTransformation()!).applyTransformation(r));
    const frame = expand(rot, IDENTITY).frame;
    const expected = [...patternToFacelets(seen)].map((x) => frame[x as keyof typeof frame]).join('');
    assert.equal(turned(patternToFacelets(p), rot), expected, rot);
    assert.equal(turned(turned(patternToFacelets(p), rot, 3), rot), patternToFacelets(p));
  }
  assert.equal(turned(SOLVED_FACELETS, 'y', 2).slice(18, 27), 'B'.repeat(9));
});

test('f2l iso: a back-slot pair turns the view to its slot; every front-right case stays seen from the front', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const f = (alg: string) => patternToFacelets(caseState(kpuzzle, alg, IDENTITY));
  const front = (alg: string) => caseDiagram('iso', 'f2l', f(alg)) === isoSVG(f(alg), 'f2l');
  for (const c of METHODS.flatMap(allCases).filter((x) => x.stage === 'f2l' && !x.id.startsWith('f2la-'))) assert.ok(front(c.algs[0].alg), c.id);
  const back = (alg: string, times: number) => assert.equal(caseDiagram('iso', 'f2l', f(alg)), isoSVG(turned(f(alg), 'y', times), 'f2l'), alg);
  back("R' U' R", 1); // back-right: seen from there (R and B in view)
  back("L U L'", 2); // back-left
  back("L' U' L", 3); // front-left
});

test('Roux masks and views: blocks, CMLL corners, LSE edges; held by the blocks whatever the M slice', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  assert.deepEqual((['coll', 'roux-fb', 'roux-sb', 'cmll', 'lse-eo', 'lse-ulur', 'lse-4c'] as const).map(maskFor), ['coll', 'roux-fb', 'roux-sb', 'cmll', 'lse', 'lse', 'lse']);
  const grey = (svg: string) => [...stickers(svg)].filter(([, s]) => s.fill === GREY).map(([i]) => i).sort((a, b) => a - b);
  // CMLL top view: only the 4 corners (and their bars) in color
  const cmllTop = stickers(topSVG(SOLVED_FACELETS, 'cmll'));
  for (const [i, s] of cmllTop) assert.equal(s.fill !== GREY, [0, 2, 6, 8, 9, 11, 18, 20, 36, 38, 45, 47].includes(i), `cmll ${i}`);
  // SB iso: the right block and the R center; FB (seen from the front-left): the left block and the L center
  assert.deepEqual(grey(isoSVG(SOLVED_FACELETS, 'roux-sb')), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 22, 25]);
  assert.deepEqual(grey(caseDiagram('iso', 'roux-fb', SOLVED_FACELETS)).filter((i) => i >= 18 && i < 27), [18, 19, 20]); // the L face in front
  // LSE: the blocks grey, the M slice's edges and centers in color
  const lse = stickers(isoSVG(SOLVED_FACELETS, 'lse'));
  for (const i of [21, 24, 23, 26, 12, 13, 14, 15, 16, 17]) assert.equal(lse.get(i)!.fill, GREY, `lse ${i}`);
  for (const i of [1, 4, 19, 22, 25]) assert.notEqual(lse.get(i)!.fill, GREY, `lse ${i}`);
  // M2 on a solved cube (centers home: the blocks turned R2 L2) is drawn held by its blocks: white down, yellow center down
  const m2 = patternToFacelets(kpuzzle.defaultPattern().applyAlg(centerMoves('M2', IDENTITY).join(' ')));
  const drawn = stickers(caseDiagram('iso', 'lse-4c', m2));
  assert.equal(drawn.get(0)!.fill, YELLOW); // a top corner
  assert.equal(drawn.get(4)!.fill, WHITE); // the U center: the M slice is off by M2
  assert.equal(drawn.get(25)!.fill, '#2563eb'); // DF: the DB edge's blue
});

test('COLL and CMLL arrows: corners only, twisted ones too', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  const f = (alg: string) => patternToFacelets(caseState(kpuzzle, alg, IDENTITY));
  // a corner 3-cycle with an edge 3-cycle (A-perm then U-perm): only the corners' arrows, and those up to the AUF:
  // among themselves the corners are an adjacent swap (the A-perm's headlights), one line with two heads
  const both = f("x R' U R' D2 R U' R' D2 R2 x' M2 U M U2 M' U M2");
  assert.equal(llArrows(both).length, 6);
  assert.equal(llArrows(both, undefined, true).length, 2);
  assert.equal(caseDiagram('top', 'coll', both, { arrows: true }).match(/<line/g)?.length, 1);
  // Niklas (as set up here), up to the AUF: two corners swap, the one at ULB twisted (blue on top): it gets its arrow too
  const niklas = f("R U' L' U R' U' L");
  assert.equal(niklas[0], 'B');
  assert.deepEqual(llArrows(niklas, undefined, true).map(([from]) => from).sort((a, b) => a - b), [0, 6]);
});

test('twoSidesSVG: only the front and right top rows in color', () => {
  const s = stickers(twoSidesSVG(SOLVED_FACELETS));
  for (const [i, x] of s) assert.equal(x.fill !== GREY, [9, 10, 11, 18, 19, 20].includes(i), `facelet ${i}`);
});

test('every case figure draws (each phase\'s view and stage)', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle();
  for (const c of METHODS.flatMap(allCases)) {
    const svg = caseDiagram(phaseOf(c.id)!.diagram, c.stage, patternToFacelets(caseState(kpuzzle, c.algs[0].alg, IDENTITY)), { arrows: true });
    assert.match(svg, /^<svg /, c.id);
  }
});
